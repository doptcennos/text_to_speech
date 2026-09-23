from typing import Optional, Dict, Any
from pydantic import BaseModel

class HealthCheckResponse(BaseModel):
    status: str
    tts_engine: str
    model: str
    storage: str

class SystemInfoResponse(BaseModel):
    cpu: str
    cpu_cores: int
    ram_total_gb: float
    ram_available_gb: float
    gpu: Optional[str] = None
    vram_total_mb: Optional[int] = None
    vram_used_mb: Optional[int] = None
    cuda_available: bool
    cuda_version: Optional[str] = None
    pytorch_version: str
    tts_engine: str
    model_status: str
    disk_free_gb: float
