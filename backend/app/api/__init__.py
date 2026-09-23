from app.api.voices import router as voices_router
from app.api.tts import router as tts_router
from app.api.audio import router as audio_router
from app.api.system import router as system_router

__all__ = ["voices_router", "tts_router", "audio_router", "system_router"]
