import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("tts_jobs.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(255), nullable=False)
    format = Column(String(10), nullable=False)  # "wav" or "mp3"
    duration = Column(Float, default=0.0, nullable=False)  # seconds
    size = Column(Integer, default=0, nullable=False)  # bytes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("TTSJob", back_populates="audio_files")
