from fastapi import APIRouter
from app.schemas.system import HealthCheckResponse, SystemInfoResponse
from app.services.model_service import ModelService

router = APIRouter(tags=["System"])

@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    """Section 44 Health check endpoint."""
    return ModelService.get_health_status()

@router.get("/system/info", response_model=SystemInfoResponse)
def system_info():
    """Section 32 System Information & Hardware Specs."""
    return ModelService.get_hardware_info()

@router.post("/system/download-model")
def download_model():
    """Section 43 Trigger local model initialization / download."""
    return ModelService.download_model()
