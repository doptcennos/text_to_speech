import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Voice(Base):
    __tablename__ = "voices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(10), default="vi", nullable=False)
    engine = Column(String(50), default="neural_clone", nullable=False)
    model = Column(String(50), default="vivos-vits-clone", nullable=False)
    sample_path = Column(String(255), nullable=True)
    embedding_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    jobs = relationship("TTSJob", back_populates="voice", cascade="all, delete-orphan")
