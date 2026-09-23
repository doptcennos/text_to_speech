import os
import sys
import numpy as np
import pytest

sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.engines import get_engine

def test_tts_synthesis(tmp_path):
    """TEST 2: Test TTS generation with custom speaker embedding."""
    engine = get_engine()
    assert engine.is_ready()

    dummy_emb = np.random.randn(512).astype(np.float32)
    emb_path = str(tmp_path / "speaker.bin")
    with open(emb_path, "wb") as f:
        f.write(dummy_emb.tobytes())

    output_wav = str(tmp_path / "output.wav")
    text = "Xin chào mọi người! Đây là giọng nói của tôi."

    duration = engine.synthesize(
        text=text,
        embedding_path=emb_path,
        output_wav_path=output_wav,
        emotion="Friendly",
        emotion_intensity=1.2,
        speed=1.0,
        pitch=0.0
    )

    assert os.path.exists(output_wav)
    assert duration > 0.5
    assert os.path.getsize(output_wav) > 1000

def test_emotions_affect_synthesis(tmp_path):
    """TEST 4: Test multiple emotions produce modulated audio."""
    engine = get_engine()
    text = "Mọi người ơi! Hôm nay chúng ta có một tin vui!"
    
    emotions = ["Neutral", "Happy", "Excited", "Sad", "Whisper"]
    durations = {}

    for emo in emotions:
        out_file = str(tmp_path / f"emo_{emo}.wav")
        dur = engine.synthesize(
            text=text,
            embedding_path=None,
            output_wav_path=out_file,
            emotion=emo,
            speed=1.0
        )
        durations[emo] = dur
        assert os.path.exists(out_file)

    assert durations["Excited"] != durations["Sad"]
