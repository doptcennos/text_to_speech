import os
import psutil
import shutil
import logging
from typing import Dict, Any
from app.config import settings
from app.engines import get_engine

logger = logging.getLogger(__name__)

class ModelService:

    @staticmethod
    def get_hardware_info() -> Dict[str, Any]:
        """Detects real CPU, RAM, Disk, GPU, and CUDA specifications."""
        # CPU
        cpu_count = psutil.cpu_count(logical=True)
        # RAM
        mem = psutil.virtual_memory()
        ram_total = round(mem.total / (1024**3), 2)
        ram_avail = round(mem.available / (1024**3), 2)
        
        # Disk
        disk = psutil.disk_usage(settings.STORAGE_PATH)
        disk_free = round(disk.free / (1024**3), 2)
        
        # PyTorch & CUDA
        cuda_avail = False
        cuda_ver = None
        gpu_name = None
        vram_total = None
        vram_used = None
        pytorch_ver = "Not installed"

        try:
            import torch
            pytorch_ver = torch.__version__
            cuda_avail = torch.cuda.is_available()
            if cuda_avail:
                cuda_ver = torch.version.cuda
                gpu_name = torch.cuda.get_device_name(0)
                vram_total = int(torch.cuda.get_device_properties(0).total_memory / (1024**2))
                vram_used = int(torch.cuda.memory_allocated(0) / (1024**2))
        except Exception as e:
            logger.warning(f"Could not inspect PyTorch GPU: {e}")

        # Check model file presence
        model_ready = ModelService.is_model_installed()
        model_status = "ready" if model_ready else "not_installed"

        return {
            "cpu": f"x86_64 ({cpu_count} Cores)",
            "cpu_cores": cpu_count,
            "ram_total_gb": ram_total,
            "ram_available_gb": ram_avail,
            "gpu": gpu_name or "CPU Mode",
            "vram_total_mb": vram_total,
            "vram_used_mb": vram_used,
            "cuda_available": cuda_avail,
            "cuda_version": cuda_ver,
            "pytorch_version": pytorch_ver,
            "tts_engine": "Neural Voice Cloning Engine",
            "model_status": model_status,
            "disk_free_gb": disk_free
        }

    @staticmethod
    def is_model_installed() -> bool:
        """Checks if local model weights/checkpoints are available."""
        # Check model directory or engine loaded state
        engine = get_engine()
        return engine.is_ready()

    @staticmethod
    def download_model() -> Dict[str, Any]:
        """
        Initializes or downloads model assets into storage/models/.
        """
        model_dir = settings.MODEL_PATH
        os.makedirs(model_dir, exist_ok=True)
        engine = get_engine()
        success = engine.load_model()
        return {
            "success": success,
            "message": "Model loaded and ready in memory." if success else "Failed to load model."
        }

    @staticmethod
    def get_health_status() -> Dict[str, str]:
        engine = get_engine()
        storage_ok = os.path.exists(settings.STORAGE_PATH) and os.access(settings.STORAGE_PATH, os.W_OK)
        return {
            "status": "ok" if (engine.is_ready() and storage_ok) else "degraded",
            "tts_engine": "ready" if engine.is_ready() else "initializing",
            "model": "ready" if engine.is_ready() else "not_installed",
            "storage": "ok" if storage_ok else "error"
        }
