import os
import subprocess
import shutil
import logging
import soundfile as sf
from typing import Tuple, Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)

class AudioService:
    """
    Handles FFmpeg audio processing:
    - Normalization (EBU R128) without truncating user speech or pauses
    - WAV to MP3 conversion with bitrate control
    - Audio concatenation for multi-speaker dialogues and multi-sample voice profiles
    - Inspection of audio metadata
    """

    @staticmethod
    def get_audio_info(file_path: str) -> Dict[str, Any]:
        """Reads audio metadata using soundfile or fallback to os.stat."""
        try:
            info = sf.info(file_path)
            return {
                "duration": info.duration,
                "samplerate": info.samplerate,
                "channels": info.channels,
                "format": info.format,
                "subtype": info.subtype,
                "size": os.path.getsize(file_path)
            }
        except Exception as e:
            logger.warning(f"Could not read with soundfile: {e}. Falling back to os.stat.")
            return {
                "duration": 0.0,
                "samplerate": 24000,
                "channels": 1,
                "format": "UNKNOWN",
                "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }

    @staticmethod
    def normalize_voice_sample(input_path: str, output_path: str, target_sr: int = 24000) -> bool:
        """
        Converts uploaded voice sample to standard 24kHz mono WAV and normalizes loudness.
        CRITICAL: Never uses stop_periods in silenceremove as it cuts off audio at any natural pause!
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        ffmpeg_bin = shutil.which("ffmpeg")
        
        if ffmpeg_bin:
            # High-quality broadcast loudness normalization (EBU R128) preserving all words and pauses
            cmd = [
                ffmpeg_bin, "-y",
                "-i", input_path,
                "-af", "loudnorm=I=-20:LRA=11:TP=-1.5",
                "-ar", str(target_sr),
                "-ac", "1",
                "-c:a", "pcm_s16le",
                output_path
            ]
            try:
                subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                info = AudioService.get_audio_info(output_path)
                logger.info(f"Sample normalized successfully to {output_path} (duration: {info['duration']:.2f}s)")
                return True
            except Exception as e:
                logger.warning(f"FFmpeg loudnorm filter error: {e}. Retrying simple convert.")
                cmd_simple = [
                    ffmpeg_bin, "-y",
                    "-i", input_path,
                    "-ar", str(target_sr),
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    output_path
                ]
                subprocess.run(cmd_simple, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                return True
        else:
            import numpy as np
            data, sr = sf.read(input_path)
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            max_v = np.max(np.abs(data))
            if max_v > 0:
                data = data / max_v * 0.9
            sf.write(output_path, data, sr, subtype='PCM_16')
            return True

    @staticmethod
    def convert_wav_to_mp3(wav_path: str, mp3_path: str, bitrate: str = "192k") -> bool:
        """Encodes WAV to MP3 using FFmpeg."""
        os.makedirs(os.path.dirname(mp3_path), exist_ok=True)
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            raise RuntimeError("FFmpeg is required for MP3 encoding.")
            
        cmd = [
            ffmpeg_bin, "-y",
            "-i", wav_path,
            "-codec:a", "libmp3lame",
            "-b:a", bitrate,
            mp3_path
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True

    @staticmethod
    def concatenate_audio_files(input_paths: List[str], output_wav_path: str, pause_ms: int = 200) -> float:
        """
        Concatenates multiple audio segment files smoothly into a single output WAV.
        """
        if not input_paths:
            raise ValueError("No input audio files to concatenate.")
            
        if len(input_paths) == 1:
            shutil.copy(input_paths[0], output_wav_path)
            info = AudioService.get_audio_info(output_wav_path)
            return info["duration"]

        ffmpeg_bin = shutil.which("ffmpeg")
        if ffmpeg_bin:
            inputs = []
            filter_parts = []
            for i, p in enumerate(input_paths):
                inputs.extend(["-i", p])
                filter_parts.append(f"[{i}:a]")
            filter_str = f"{''.join(filter_parts)}concat=n={len(input_paths)}:v=0:a=1[outa]"
            
            cmd = [ffmpeg_bin, "-y"] + inputs + ["-filter_complex", filter_str, "-map", "[outa]", "-c:a", "pcm_s16le", output_wav_path]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            info = AudioService.get_audio_info(output_wav_path)
            return info["duration"]
        else:
            import numpy as np
            all_data = []
            target_sr = 24000
            for p in input_paths:
                data, sr = sf.read(p)
                if data.ndim > 1:
                    data = np.mean(data, axis=1)
                all_data.append(data)
                if pause_ms > 0:
                    pause_data = np.zeros(int(sr * pause_ms / 1000.0), dtype=data.dtype)
                    all_data.append(pause_data)
                target_sr = sr
            concat = np.concatenate(all_data)
            sf.write(output_wav_path, concat, target_sr, subtype='PCM_16')
            return len(concat) / float(target_sr)
