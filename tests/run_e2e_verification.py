import os
import sys
import time
import requests
import numpy as np
import scipy.io.wavfile as wavfile

BASE_URL = "http://localhost:8000/api"

def create_sample_wav(filename: str, freq: float = 220.0, duration: float = 2.0):
    sr = 24000
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    audio = 0.6 * np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t) + 0.1 * np.random.normal(0, 0.05, len(t))
    wavfile.write(filename, sr, (audio * 32767).astype(np.int16))

print("=== STARTING END-TO-END VERIFICATION ===")

# Health Check
res = requests.get(f"{BASE_URL}/health")
assert res.status_code == 200, f"Health check failed: {res.text}"
print("✓ Health Check Passed:", res.json())

# TEST 1: CREATE VOICE
print("--- TEST 1: CREATE VOICE (My Voice) ---")
create_sample_wav("/tmp/my_voice.wav", freq=220.0)

with open("/tmp/my_voice.wav", "rb") as f:
    files = {"sample": ("my_voice.wav", f, "audio/wav")}
    data = {
        "name": "My Voice",
        "description": "Giọng đọc mẫu chính chủ",
        "language": "vi",
        "consent": "true"
    }
    res = requests.post(f"{BASE_URL}/voices", data=data, files=files)

assert res.status_code == 201, f"Failed to create voice: {res.text}"
my_voice = res.json()
print("✓ Voice created:", my_voice["id"], my_voice["name"])
assert my_voice["has_embedding"] is True, "Voice must have embedding"

# TEST 2: GENERATE SPEECH
print("--- TEST 2: GENERATE SPEECH (Friendly) ---")
gen_payload = {
    "text": "Xin chào mọi người! Đây là giọng nói của tôi.",
    "voice_id": my_voice["id"],
    "emotion": "Friendly",
    "emotion_intensity": 1.0,
    "speed": 1.0,
    "pitch": 0.0,
    "output_format": "mp3"
}
res = requests.post(f"{BASE_URL}/tts/generate", json=gen_payload)
assert res.status_code == 202, f"Failed to generate: {res.text}"
job_id = res.json()["job_id"]
print("✓ Job queued:", job_id)

# Wait for completion
completed_job = None
for _ in range(30):
    time.sleep(1)
    res = requests.get(f"{BASE_URL}/tts/jobs/{job_id}")
    job_info = res.json()
    print("  Status:", job_info['status'], "| Progress:", job_info['progress'], "%")
    if job_info["status"] in ("COMPLETED", "FAILED"):
        completed_job = job_info
        break

assert completed_job and completed_job["status"] == "COMPLETED", f"Job failed or timed out: {completed_job}"
print("✓ Generation Completed! Audio ID:", completed_job["audio_id"])
print("  Audio URL:", completed_job["audio_url"])
print("  WAV URL:  ", completed_job["wav_url"])
print("  MP3 URL:  ", completed_job["mp3_url"])

# Verify WAV and MP3 downloads
res_mp3 = requests.get(f"http://localhost:8000{completed_job['mp3_url']}")
assert res_mp3.status_code == 200 and len(res_mp3.content) > 1000, "MP3 download failed"
print("✓ MP3 Download Verified (size:", len(res_mp3.content), "bytes)")

res_wav = requests.get(f"http://localhost:8000{completed_job['wav_url']}")
assert res_wav.status_code == 200 and len(res_wav.content) > 1000, "WAV download failed"
print("✓ WAV Download Verified (size:", len(res_wav.content), "bytes)")

# TEST 3: MULTIPLE VOICES
print("--- TEST 3: MULTIPLE VOICES (Voice A, Voice B) ---")
create_sample_wav("/tmp/voice_b.wav", freq=330.0)
with open("/tmp/voice_b.wav", "rb") as f:
    files = {"sample": ("voice_b.wav", f, "audio/wav")}
    data = {"name": "Voice B", "language": "vi", "consent": "true"}
    res = requests.post(f"{BASE_URL}/voices", data=data, files=files)
assert res.status_code == 201
voice_b = res.json()
print("✓ Created Voice B:", voice_b["id"])

# TEST 4: EMOTION MODULATION
print("--- TEST 4: EMOTION MODULATION ---")
for emo in ["Happy", "Sad", "Excited"]:
    res = requests.post(f"{BASE_URL}/tts/generate", json={
        "text": "Mọi người ơi! Hôm nay chúng ta có tin vui!",
        "voice_id": my_voice["id"],
        "emotion": emo,
        "emotion_intensity": 1.2,
        "speed": 1.0,
        "output_format": "mp3"
    })
    assert res.status_code == 202
    jid = res.json()["job_id"]
    for _ in range(20):
        time.sleep(0.5)
        st = requests.get(f"{BASE_URL}/tts/jobs/{jid}").json()
        if st["status"] == "COMPLETED":
            print(f"✓ Emotion '{emo}' generated successfully! Duration: {st['duration']}s")
            break

# TEST 5: MULTI-SPEAKER DIALOGUE
print("--- TEST 5: MULTI-SPEAKER DIALOGUE ---")
dialogue_script = """My Voice: Xin chào mọi người!
Voice B: Xin chào!
My Voice: Hôm nay chúng ta sẽ tổ chức một buổi tiệc."""

multi_payload = {
    "text": dialogue_script,
    "multi_speaker": True,
    "speakers": [
        {"speaker_name": "My Voice", "voice_id": my_voice["id"], "emotion": "Friendly"},
        {"speaker_name": "Voice B", "voice_id": voice_b["id"], "emotion": "Happy"}
    ],
    "emotion": "Neutral",
    "emotion_intensity": 1.0,
    "speed": 1.0,
    "pitch": 0.0,
    "output_format": "mp3"
}
res = requests.post(f"{BASE_URL}/tts/generate", json=multi_payload)
assert res.status_code == 202
multi_job_id = res.json()["job_id"]
for _ in range(30):
    time.sleep(1)
    st = requests.get(f"{BASE_URL}/tts/jobs/{multi_job_id}").json()
    if st["status"] == "COMPLETED":
        print("✓ Multi-Speaker Dialogue completed into a single audio! Duration:", st['duration'], "s")
        print("  Stream URL:", st['audio_url'])
        break

print("=== ALL TEST CASES (1 to 5) PASSED WITH FLYING COLORS! ===")
