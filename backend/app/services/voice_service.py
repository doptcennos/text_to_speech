import os
import shutil
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.models.voice import Voice
from app.schemas.voice import VoiceCreate, VoiceUpdate
from app.services.audio_service import AudioService
from app.engines import get_engine
from app.config import settings

logger = logging.getLogger(__name__)

class VoiceService:

    @staticmethod
    def get_all_voices(db: Session) -> List[Voice]:
        return db.query(Voice).order_by(Voice.created_at.desc()).all()

    @staticmethod
    def get_voice_by_id(db: Session, voice_id: str) -> Optional[Voice]:
        return db.query(Voice).filter(Voice.id == voice_id).first()

    @staticmethod
    async def create_voice_with_samples(
        db: Session,
        name: str,
        description: Optional[str],
        language: str,
        consent: bool,
        sample_files: List[UploadFile]
    ) -> Voice:
        # 1. Section 30: Voice Consent Check
        if not consent:
            raise HTTPException(
                status_code=400,
                detail="Bạn phải xác nhận rằng bạn sở hữu hoặc có quyền sử dụng mẫu giọng nói này."
            )

        if not sample_files:
            raise HTTPException(
                status_code=400,
                detail="Vui lòng chọn ít nhất một file âm thanh mẫu."
            )

        # 2. Section 29: Security checks (file extension, size)
        allowed_extensions = {".wav", ".mp3", ".flac", ".m4a", ".ogg", ".oga", ".opus", ".webm", ".aac", ".wma"}
        for sf in sample_files:
            filename = sf.filename or "sample.wav"
            ext = os.path.splitext(filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Định dạng file '{filename}' không hợp lệ. Các định dạng được hỗ trợ: {', '.join(sorted(allowed_extensions))}"
                )

        # 3. Create Voice record
        voice = Voice(
            name=name.strip(),
            description=description.strip() if description else None,
            language=language or "vi",
            engine="neural_clone",
            model="vivos-vits-multispeaker"
        )
        db.add(voice)
        db.commit()
        db.refresh(voice)

        # 4. Prepare storage directories
        voice_dir = os.path.join(settings.STORAGE_PATH, "voices", voice.id)
        os.makedirs(voice_dir, exist_ok=True)
        final_normalized_path = os.path.join(voice_dir, "normalized.wav")
        embedding_path = os.path.join(voice_dir, "embedding.bin")

        normalized_chunks = []

        try:
            # 5. Save and normalize each uploaded sample
            for idx, sf_item in enumerate(sample_files):
                filename = sf_item.filename or f"sample_{idx}.wav"
                ext = os.path.splitext(filename)[1].lower()
                raw_chunk_path = os.path.join(voice_dir, f"raw_{idx}{ext}")
                norm_chunk_path = os.path.join(voice_dir, f"norm_{idx}.wav")

                with open(raw_chunk_path, "wb") as buffer:
                    while chunk := await sf_item.read(1024 * 1024):
                        buffer.write(chunk)

                # Normalize each chunk
                AudioService.normalize_voice_sample(raw_chunk_path, norm_chunk_path)
                normalized_chunks.append(norm_chunk_path)

            # 6. If multiple files, concatenate them; if single, copy to final_normalized_path
            if len(normalized_chunks) == 1:
                shutil.copy(normalized_chunks[0], final_normalized_path)
            else:
                AudioService.concatenate_audio_files(normalized_chunks, final_normalized_path, pause_ms=150)

            # Keep first raw sample as main sample.wav
            first_ext = os.path.splitext(sample_files[0].filename or "sample.wav")[1].lower()
            shutil.copy(os.path.join(voice_dir, f"raw_0{first_ext}"), os.path.join(voice_dir, "sample.wav"))

            # 7. Extract real speaker embedding (512-dim)
            engine = get_engine()
            engine.extract_speaker_embedding(final_normalized_path, embedding_path)

            # 8. Update voice record
            voice.sample_path = final_normalized_path
            voice.embedding_path = embedding_path
            db.commit()
            db.refresh(voice)
            
            logger.info(f"Voice Profile '{voice.name}' ({voice.id}) created from {len(sample_files)} sample files.")
            return voice

        except Exception as e:
            logger.error(f"Failed to process voice sample for voice {voice.id}: {e}")
            if os.path.exists(voice_dir):
                shutil.rmtree(voice_dir, ignore_errors=True)
            db.delete(voice)
            db.commit()
            raise HTTPException(status_code=422, detail=f"Không thể xử lý mẫu giọng: {str(e)}")

    @staticmethod
    def update_voice(db: Session, voice_id: str, voice_in: VoiceUpdate) -> Voice:
        voice = VoiceService.get_voice_by_id(db, voice_id)
        if not voice:
            raise HTTPException(status_code=404, detail="Không tìm thấy giọng đọc")
        if voice_in.name is not None:
            voice.name = voice_in.name.strip()
        if voice_in.description is not None:
            voice.description = voice_in.description.strip()
        if voice_in.language is not None:
            voice.language = voice_in.language
        db.commit()
        db.refresh(voice)
        return voice

    @staticmethod
    def delete_voice(db: Session, voice_id: str) -> bool:
        voice = VoiceService.get_voice_by_id(db, voice_id)
        if not voice:
            raise HTTPException(status_code=404, detail="Không tìm thấy giọng đọc")

        voice_dir = os.path.join(settings.STORAGE_PATH, "voices", voice.id)
        if os.path.exists(voice_dir):
            shutil.rmtree(voice_dir, ignore_errors=True)

        db.delete(voice)
        db.commit()
        return True

    @staticmethod
    def rebuild_embedding(db: Session, voice_id: str) -> Voice:
        voice = VoiceService.get_voice_by_id(db, voice_id)
        if not voice:
            raise HTTPException(status_code=404, detail="Không tìm thấy giọng đọc")
        if not voice.sample_path or not os.path.exists(voice.sample_path):
            raise HTTPException(status_code=400, detail="Không tìm thấy file mẫu âm thanh trên đĩa")

        voice_dir = os.path.join(settings.STORAGE_PATH, "voices", voice.id)
        embedding_path = os.path.join(voice_dir, "embedding.bin")

        engine = get_engine()
        engine.extract_speaker_embedding(voice.sample_path, embedding_path)

        voice.embedding_path = embedding_path
        db.commit()
        db.refresh(voice)
        return voice
