from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class VoiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    language: str = Field("vi", max_length=10)

class VoiceCreate(VoiceBase):
    pass

class VoiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    language: Optional[str] = None

class VoiceResponse(VoiceBase):
    id: str
    engine: str
    model: str
    sample_path: Optional[str] = None
    embedding_path: Optional[str] = None
    has_sample: bool = False
    has_embedding: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
