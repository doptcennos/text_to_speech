from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SpeakerMappingItem(BaseModel):
    speaker_name: str
    voice_id: str
    emotion: Optional[str] = "Neutral"
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 0.0

class TTSGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice_id: Optional[str] = None
    emotion: str = Field("Neutral")
    emotion_intensity: float = Field(1.0, ge=0.1, le=2.0)
    speed: float = Field(1.0, ge=0.5, le=2.0)
    pitch: float = Field(0.0, ge=-12.0, le=12.0)
    output_format: str = Field("mp3", pattern="^(mp3|wav)$")
    multi_speaker: bool = False
    is_multi_speaker: Optional[bool] = None
    speakers: Optional[List[SpeakerMappingItem]] = None
    speaker_mapping: Optional[Any] = None
    read_speaker_names: bool = False

class TTSJobResponse(BaseModel):
    id: str
    status: str
    progress: int
    text: str
    voice_id: Optional[str] = None
    voice_name: Optional[str] = None
    emotion: str
    speed: float
    output_format: str
    audio_id: Optional[str] = None
    audio_url: Optional[str] = None
    wav_url: Optional[str] = None
    mp3_url: Optional[str] = None
    duration: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TTSQueueResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
