from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AudioFileResponse(BaseModel):
    id: str
    job_id: str
    format: str
    duration: float
    size: int
    stream_url: str
    download_url: str
    created_at: datetime

    class Config:
        from_attributes = True
