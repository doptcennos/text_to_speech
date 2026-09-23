import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TTSJob(Base):
    __tablename__ = "tts_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String(20), default="QUEUED", nullable=False)  # QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
    progress = Column(Integer, default=0, nullable=False)  # 0 to 100
    text = Column(Text, nullable=False)
    voice_id = Column(String(36), ForeignKey("voices.id", ondelete="SET NULL"), nullable=True)
    emotion = Column(String(50), default="Neutral", nullable=False)
    emotion_intensity = Column(Float, default=1.0, nullable=False)
    speed = Column(Float, default=1.0, nullable=False)
    pitch = Column(Float, default=0.0, nullable=False)
    output_format = Column(String(10), default="mp3", nullable=False)
    
    # Optional multi-speaker JSON metadata
    speaker_mapping = Column(Text, nullable=True)
    
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    voice = relationship("Voice", back_populates="jobs")
    audio_files = relationship("AudioFile", back_populates="job", cascade="all, delete-orphan")
