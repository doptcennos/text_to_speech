import os
import re
import uuid
import logging
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
import numpy as np
import scipy.io.wavfile as wavfile

from app.models.tts_job import TTSJob
from app.models.voice import Voice
from app.models.audio_file import AudioFile
from app.services.audio_service import AudioService
from app.engines import get_engine
from app.config import settings

logger = logging.getLogger(__name__)

class TTSService:

    @staticmethod
    def parse_expressions(text: str) -> List[Dict[str, Any]]:
        pattern = r'(\[[^\]]+\])'
        tokens = re.split(pattern, text)
        
        segments = []
        current_emotion_override = None
        current_speed_override = None
        current_pitch_override = None

        for token in tokens:
            if not token:
                continue
            token_clean = token.strip()
            lower_token = token_clean.lower()

            if token_clean.startswith('[') and token_clean.endswith(']'):
                tag_inner = lower_token[1:-1].strip()

                # 1. Pause tags: [nghỉ 500ms], [nghỉ 1s], [pause 500ms], [pause 1s]
                m_pause = re.match(r'(?:nghỉ|pause)\s+(\d+(?:\.\d+)?)\s*(ms|s)?', tag_inner)
                if m_pause:
                    val, unit = m_pause.groups()
                    val = float(val)
                    ms = int(val * 1000) if unit == 's' or (not unit and val <= 10) else int(val)
                    segments.append({'type': 'pause', 'duration_ms': max(50, min(10000, ms))})
                    continue

                # 2. Hesitation / Stammer
                if tag_inner in ('ngập ngừng', 'do dự', 'hesitate', 'ngập ngừng 500ms'):
                    segments.append({'type': 'pause', 'duration_ms': 450})
                    current_speed_override = 0.85
                    continue

                # 3. Sigh / Deep breath / Throat clear
                if tag_inner in ('thở dài', 'sigh'):
                    segments.append({'type': 'breath', 'duration_ms': 400})
                    current_emotion_override = 'Sad'
                    current_speed_override = 0.88
                    continue

                if tag_inner in ('hít sâu', 'deep breath', 'hít thở'):
                    segments.append({'type': 'breath', 'duration_ms': 350})
                    current_speed_override = 0.95
                    continue

                if tag_inner in ('hắng giọng', 'e hèm', 'cough', 'throat clear'):
                    segments.append({'type': 'pause', 'duration_ms': 350})
                    current_emotion_override = 'Serious'
                    continue

                # 4. Laugh & Smile
                if tag_inner in ('cười', 'laugh', 'ha ha', 'haha'):
                    segments.append({
                        'type': 'text',
                        'content': 'Haha,',
                        'emotion_override': 'Funny',
                        'speed_override': 1.10
                    })
                    current_emotion_override = 'Funny'
                    current_speed_override = 1.05
                    continue

                if tag_inner in ('cười mỉm', 'mỉm cười', 'chuckle', 'smile'):
                    current_emotion_override = 'Happy'
                    current_speed_override = 1.05
                    continue

                # 5. Whisper
                if tag_inner in ('thì thầm', 'whisper', 'nói nhỏ'):
                    current_emotion_override = 'Whisper'
                    current_speed_override = 0.85
                    current_pitch_override = -1.0
                    continue

                # 6. Excited
                if tag_inner in ('hào hứng', 'excited', 'nhiệt huyết', 'phấn khởi'):
                    current_emotion_override = 'Excited'
                    current_speed_override = 1.15
                    current_pitch_override = 1.2
                    continue

                # 7. Warm / Affectionate
                if tag_inner in ('ấm áp', 'warm', 'dịu dàng', 'truyền cảm'):
                    current_emotion_override = 'Warm'
                    current_speed_override = 0.96
                    continue

                # 8. Emotional / Touched
                if tag_inner in ('xúc động', 'nghẹn ngào', 'emotional', 'lắng đọng'):
                    current_emotion_override = 'Sad'
                    current_speed_override = 0.85
                    current_pitch_override = -0.5
                    continue

                # 9. Surprised
                if tag_inner in ('ngạc nhiên', 'bất ngờ', 'surprised', 'thảng thốt'):
                    current_emotion_override = 'Excited'
                    current_speed_override = 1.10
                    current_pitch_override = 1.8
                    continue

                # 10. Serious
                if tag_inner in ('nghiêm túc', 'serious', 'trang trọng', 'đĩnh đạc'):
                    current_emotion_override = 'Serious'
                    current_speed_override = 0.95
                    continue

                # 11. Pacing & Emphasis
                if tag_inner in ('đọc chậm', 'slow', 'chậm rãi'):
                    current_speed_override = 0.75
                    continue

                if tag_inner in ('đọc nhanh', 'fast', 'nhanh'):
                    current_speed_override = 1.30
                    continue

                if tag_inner in ('nhấn mạnh', 'emphasis', 'dứt khoát'):
                    current_emotion_override = 'Confident'
                    current_speed_override = 0.92
                    continue

            # Regular speech text
            if token_clean:
                segments.append({
                    'type': 'text',
                    'content': token_clean,
                    'emotion_override': current_emotion_override,
                    'speed_override': current_speed_override,
                    'pitch_override': current_pitch_override
                })
                current_emotion_override = None
                current_speed_override = None
                current_pitch_override = None

        return segments

    @staticmethod
    def parse_multi_speaker_script(script_text: str) -> List[Tuple[str, str]]:
        lines = script_text.strip().splitlines()
        turns = []
        current_speaker = 'Default'
        current_lines = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            if ':' in line_str and not line_str.startswith('http'):
                parts = line_str.split(':', 1)
                spk = parts[0].strip()
                msg = parts[1].strip()
                if 0 < len(spk) <= 60 and not any(c in spk for c in ('<', '>', '{', '}', ';')):
                    if current_lines:
                        turns.append((current_speaker, ' '.join(current_lines)))
                        current_lines = []
                    current_speaker = spk
                    if msg:
                        current_lines.append(msg)
                    continue
            current_lines.append(line_str)

        if current_lines:
            turns.append((current_speaker, ' '.join(current_lines)))

        return turns

    @staticmethod
    def process_job(db: Session, job: TTSJob, progress_callback=None) -> AudioFile:
        temp_dir = os.path.join(settings.STORAGE_PATH, 'temp', job.id)
        os.makedirs(temp_dir, exist_ok=True)
        engine = get_engine()

        if progress_callback:
            progress_callback(10)

        speaker_map = {}
        read_speaker_names = False
        if job.speaker_mapping:
            import json
            try:
                raw_data = json.loads(job.speaker_mapping)
                if isinstance(raw_data, dict):
                    raw_map = raw_data.get("speakers", [])
                    read_speaker_names = bool(raw_data.get("read_speaker_names", False))
                elif isinstance(raw_data, list):
                    raw_map = raw_data
                else:
                    raw_map = []
                for item in raw_map:
                    if isinstance(item, dict) and "speaker_name" in item:
                        speaker_map[item["speaker_name"].lower().strip()] = item
            except Exception as e:
                logger.warning(f'Error parsing speaker_mapping: {e}')

        # Query all voices for smart fuzzy matching
        all_voices = db.query(Voice).all()

        def resolve_speaker_config(speaker_name: str):
            if not speaker_name or speaker_name == "Default":
                return None
            s_low = speaker_name.lower().strip()
            # 1. Exact match in speaker_map
            if s_low in speaker_map:
                return speaker_map[s_low]
            # 2. Substring match in speaker_map
            for k, info in speaker_map.items():
                if k in s_low or s_low in k:
                    return info
            # 3. Smart keyword matching with database voices (linh, hà, mai, lan)
            for v in all_voices:
                v_low = v.name.lower()
                for kw in ["linh", "hà", "ha", "mai", "lan"]:
                    if kw in s_low and kw in v_low:
                        return {"voice_id": v.id, "emotion": job.emotion, "speed": job.speed, "pitch": job.pitch}
            # 4. Any name overlap with voice name
            for v in all_voices:
                v_low = v.name.lower()
                words = [w for w in s_low.replace("(", " ").replace(")", " ").split() if len(w) > 2]
                if any(w in v_low for w in words):
                    return {"voice_id": v.id, "emotion": job.emotion, "speed": job.speed, "pitch": job.pitch}
            return None

        script_turns = TTSService.parse_multi_speaker_script(job.text)
        if not script_turns:
            script_turns = [('Default', job.text)]

        segment_wav_files = []
        total_turns = len(script_turns)
        sr = settings.AUDIO_SAMPLE_RATE

        for turn_idx, (speaker_name, dialogue_text) in enumerate(script_turns):
            voice_id_for_turn = job.voice_id
            emotion_for_turn = job.emotion
            speed_for_turn = job.speed
            pitch_for_turn = job.pitch

            speaker_info = resolve_speaker_config(speaker_name)
            if speaker_info:
                voice_id_for_turn = speaker_info.get('voice_id', job.voice_id)
                emotion_for_turn = speaker_info.get('emotion', job.emotion)
                speed_for_turn = speaker_info.get('speed', job.speed)
                pitch_for_turn = speaker_info.get('pitch', job.pitch)

            embedding_path = None
            if voice_id_for_turn:
                voice = db.query(Voice).filter(Voice.id == voice_id_for_turn).first()
                if voice and voice.embedding_path and os.path.exists(voice.embedding_path):
                    embedding_path = voice.embedding_path

            # Format text for synthesis
            text_to_process = dialogue_text
            if read_speaker_names and speaker_name and speaker_name != 'Default':
                text_to_process = f"{speaker_name}: [nghỉ 300ms] {dialogue_text}"

            expr_segments = TTSService.parse_expressions(text_to_process)
            
            for seg_idx, seg in enumerate(expr_segments):
                if seg['type'] == 'pause':
                    pause_file = os.path.join(temp_dir, f'pause_{turn_idx}_{seg_idx}.wav')
                    silence = np.zeros(int(sr * (seg['duration_ms'] / 1000.0)), dtype=np.int16)
                    wavfile.write(pause_file, sr, silence)
                    segment_wav_files.append(pause_file)
                elif seg['type'] == 'breath':
                    breath_file = os.path.join(temp_dir, f'breath_{turn_idx}_{seg_idx}.wav')
                    dur = seg.get('duration_ms', 350) / 1000.0
                    n_samples = int(sr * dur)
                    t = np.linspace(0, 1, n_samples)
                    env = np.sin(np.pi * t) ** 2
                    noise = np.random.normal(0, 0.015, n_samples) * env
                    wavfile.write(breath_file, sr, (noise * 32767).astype(np.int16))
                    segment_wav_files.append(breath_file)
                elif seg['type'] == 'text':
                    seg_text = seg['content']
                    seg_emotion = seg.get('emotion_override') or emotion_for_turn
                    seg_speed = seg.get('speed_override') or speed_for_turn
                    seg_pitch = pitch_for_turn + (seg.get('pitch_override') or 0.0)
                    
                    part_wav = os.path.join(temp_dir, f'part_{turn_idx}_{seg_idx}.wav')
                    engine.synthesize(
                        text=seg_text,
                        embedding_path=embedding_path,
                        output_wav_path=part_wav,
                        emotion=seg_emotion,
                        emotion_intensity=job.emotion_intensity,
                        speed=seg_speed,
                        pitch=seg_pitch,
                        sample_rate=settings.AUDIO_SAMPLE_RATE
                    )
                    segment_wav_files.append(part_wav)

            if progress_callback:
                progress = 20 + int(60 * (turn_idx + 1) / total_turns)
                progress_callback(progress)

        final_wav_filename = f'{job.id}.wav'
        final_wav_path = os.path.join(settings.STORAGE_PATH, 'generated', final_wav_filename)
        os.makedirs(os.path.dirname(final_wav_path), exist_ok=True)

        duration = AudioService.concatenate_audio_files(segment_wav_files, final_wav_path, pause_ms=100)
        
        if progress_callback:
            progress_callback(85)

        final_mp3_filename = f'{job.id}.mp3'
        final_mp3_path = os.path.join(settings.STORAGE_PATH, 'generated', final_mp3_filename)
        AudioService.convert_wav_to_mp3(final_wav_path, final_mp3_path, bitrate=settings.MP3_DEFAULT_BITRATE)

        chosen_format = job.output_format.lower()
        chosen_path = final_mp3_path if chosen_format == 'mp3' else final_wav_path
        file_size = os.path.getsize(chosen_path)

        audio_rec = AudioFile(
            job_id=job.id,
            file_path=chosen_path,
            format=chosen_format,
            duration=round(duration, 2),
            size=file_size
        )
        db.add(audio_rec)
        db.commit()
        db.refresh(audio_rec)

        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f'Failed to cleanup temp dir: {e}')

        if progress_callback:
            progress_callback(100)

        return audio_rec
