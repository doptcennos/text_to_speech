import os
import time
import math
import shutil
import logging
import subprocess
import numpy as np
import soundfile as sf
from typing import Dict, Any, Optional

from app.engines.base import BaseTTSEngine
from app.config import settings

logger = logging.getLogger(__name__)

def build_atempo_filters(tempo: float) -> str:
    filters = []
    t = max(0.2, min(5.0, float(tempo)))
    while t > 2.0:
        filters.append('atempo=2.0')
        t /= 2.0
    while t < 0.5:
        filters.append('atempo=0.5')
        t /= 0.5
    filters.append(f'atempo={t:.4f}')
    return ','.join(filters)

class NeuralVoiceCloneEngine(BaseTTSEngine):
    def __init__(self):
        self.engine_name = 'Neural Voice Clone Engine (VieNeu + Piper)'
        self.model_name = 'VieNeu-TTS-v3-Nano'
        self.device = 'cpu'
        self._is_loaded = False
        self._sample_rate = 24000
        self.vieneu = None
        self.piper_voice = None
        self.voice_cache: Dict[str, Dict[str, Any]] = {}

    def load_model(self) -> bool:
        try:
            logger.info('Loading Vietnamese Zero-Shot Voice Clone Model (VieNeu-TTS)...')
            import vieneu
            self.vieneu = vieneu.Vieneu(mode='v3nano', steps=8)
            self._sample_rate = getattr(self.vieneu, 'sample_rate', 24000)
            logger.info('VieNeu-TTS v3 Nano initialized successfully!')

            try:
                from piper.voice import PiperVoice
                candidate_paths = [
                    getattr(settings, 'MODEL_PATH', '/app/storage/models'),
                    '/app/storage/models',
                    '/app/models',
                    os.path.join(settings.STORAGE_PATH, 'models'),
                    '/opt/text_to_speech/storage/models'
                ]
                for base_dir in candidate_paths:
                    if not base_dir or not os.path.exists(base_dir):
                        continue
                    p25 = os.path.join(base_dir, 'vi_VN-25hours_single-low.onnx')
                    if os.path.exists(p25):
                        self.piper_voice = PiperVoice.load(p25)
                        break
            except Exception as ex:
                logger.warning('Piper fallback not loaded: %s' % ex)

            self._is_loaded = True
            logger.info('Neural Voice Clone Engine is READY (Device: %s)' % self.device)
            return True
        except Exception as e:
            logger.error('Failed to load Neural Voice Clone Engine: %s' % e)
            self._is_loaded = False
            return False

    def is_ready(self) -> bool:
        return self._is_loaded and (self.vieneu is not None or self.piper_voice is not None)

    def extract_speaker_embedding(self, sample_path: str, output_embedding_path: str) -> bool:
        try:
            if not os.path.exists(sample_path):
                raise FileNotFoundError('Không tìm thấy file mẫu âm thanh: %s' % sample_path)
            
            if not self._is_loaded:
                self.load_model()

            vdir = os.path.dirname(output_embedding_path)
            npz_path = os.path.join(vdir, 'voice_clone.npz')

            if self.vieneu is not None:
                logger.info('Encoding reference audio for voice cloning: %s ...' % sample_path)
                spk, style = self.vieneu.encode_reference(sample_path, denoise=True)
                np.savez_compressed(npz_path, spk=spk, style=style)
                logger.info('Saved neural voice profile to %s (spk=%s, style=%s)' % (npz_path, spk.shape, style.shape))
                self.voice_cache[vdir] = {
                    'speaker_emb': spk,
                    'style': style,
                    'codes': style,
                    'podcast': True
                }

            emb = np.zeros(512, dtype=np.float32)
            emb[0] = 220.0
            with open(output_embedding_path, 'wb') as f:
                f.write(emb.tobytes())

            return True
        except Exception as e:
            logger.error('Error extracting speaker embedding: %s' % e)
            raise

    def synthesize(
        self,
        text: str,
        embedding_path: Optional[str],
        output_wav_path: str,
        emotion: str = 'Neutral',
        emotion_intensity: float = 1.0,
        speed: float = 1.0,
        pitch: float = 0.0,
        sample_rate: int = 24000
    ) -> float:
        if not self._is_loaded:
            self.load_model()

        clean_text = text.strip()
        if not clean_text:
            clean_text = '...'

        emotion_speed_map = {
            'Neutral': 1.00, 'Happy': 1.05, 'Excited': 1.12, 'Sad': 0.88,
            'Angry': 1.10, 'Calm': 0.94, 'Friendly': 1.03, 'Serious': 0.96,
            'Confident': 1.02, 'Shy': 0.92, 'Funny': 1.08, 'Warm': 0.97,
            'Sarcastic': 0.95, 'Whisper': 0.90
        }
        speed_factor = emotion_speed_map.get(emotion, 1.00)
        effective_speed = float(max(0.5, min(2.5, speed * (1.0 + (speed_factor - 1.0) * float(emotion_intensity)))))

        voice_dict = None
        if embedding_path:
            vdir = os.path.dirname(embedding_path)
            if vdir in self.voice_cache:
                voice_dict = self.voice_cache[vdir]
            else:
                npz_path = os.path.join(vdir, 'voice_clone.npz')
                bin_npz = os.path.join(vdir, 'embedding.bin.npz')
                target_npz = npz_path if os.path.exists(npz_path) else (bin_npz if os.path.exists(bin_npz) else None)
                
                if target_npz and os.path.exists(target_npz):
                    try:
                        data = np.load(target_npz, allow_pickle=True)
                        voice_dict = {
                            'speaker_emb': data['spk'],
                            'style': data['style'],
                            'codes': data['style'],
                            'podcast': True
                        }
                        self.voice_cache[vdir] = voice_dict
                    except Exception as ex:
                        logger.warning('Could not load voice_clone.npz from %s: %s' % (target_npz, ex))

                if voice_dict is None and self.vieneu is not None:
                    for candidate_name in ['normalized.wav', 'sample.wav']:
                        cand = os.path.join(vdir, candidate_name)
                        if os.path.exists(cand):
                            try:
                                spk, style = self.vieneu.encode_reference(cand, denoise=True)
                                np.savez_compressed(npz_path, spk=spk, style=style)
                                voice_dict = {
                                    'speaker_emb': spk,
                                    'style': style,
                                    'codes': style,
                                    'podcast': True
                                }
                                self.voice_cache[vdir] = voice_dict
                                logger.info('On-the-fly encoded voice clone profile for %s' % vdir)
                                break
                            except Exception as ex:
                                logger.warning('Failed to encode reference audio %s: %s' % (cand, ex))

        audio_out = None
        out_sr = 24000

        if self.vieneu is not None:
            try:
                t0 = time.time()
                logger.info('Synthesizing with VieNeu voice clone (voice_dict=%s, speed=%.2f)' % (bool(voice_dict), effective_speed))
                audio_out = self.vieneu.infer(
                    text=clean_text,
                    voice=voice_dict,
                    speed=effective_speed,
                    steps=8
                )
                out_sr = getattr(self.vieneu, 'sample_rate', 24000)
                logger.info('VieNeu inference generated %.2fs audio in %.2fs' % (len(audio_out)/out_sr, time.time() - t0))
            except Exception as ex:
                logger.error('VieNeu inference error, falling back to Piper: %s' % ex, exc_info=True)
                audio_out = None

        if audio_out is None and self.piper_voice is not None:
            logger.info('Using Piper VITS fallback synthesis...')
            chunks = []
            base_sr = 16000
            for chunk in self.piper_voice.synthesize(clean_text):
                chunks.append(chunk.audio_float_array)
                base_sr = chunk.sample_rate
            audio_out = np.concatenate(chunks)
            out_sr = base_sr

        if audio_out is None:
            raise RuntimeError('Không thể tạo âm thanh giọng nói với mô hình hiện tại.')

        temp_wav = f'{output_wav_path}.tmp.wav'
        os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)
        sf.write(temp_wav, audio_out, out_sr)

        if abs(pitch) > 0.1:
            pitch_factor = 2.0 ** (float(pitch) / 12.0)
            shifted_rate = int(out_sr * pitch_factor)
            tempo_comp = 1.0 / pitch_factor
            af_filter = f'asetrate={shifted_rate},{build_atempo_filters(tempo_comp)},aresample={sample_rate},loudnorm=I=-20:LRA=11:TP=-1.5'
            cmd = ['ffmpeg', '-y', '-i', temp_wav, '-af', af_filter, '-ar', str(sample_rate), output_wav_path]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
        else:
            af_filter = f'aresample={sample_rate},loudnorm=I=-20:LRA=11:TP=-1.5'
            cmd = ['ffmpeg', '-y', '-i', temp_wav, '-af', af_filter, '-ar', str(sample_rate), output_wav_path]
            try:
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                shutil.move(temp_wav, output_wav_path)
            finally:
                if os.path.exists(temp_wav):
                    try:
                        os.remove(temp_wav)
                    except OSError:
                        pass

        out_info = sf.info(output_wav_path)
        duration = out_info.duration
        logger.info('Synthesized %.2fs cloned speech -> %s' % (duration, output_wav_path))
        return duration

    def get_engine_info(self) -> Dict[str, Any]:
        return {
            'engine': self.engine_name,
            'model': self.model_name,
            'device': self.device,
            'sample_rate': self._sample_rate,
            'is_ready': self._is_loaded
        }
