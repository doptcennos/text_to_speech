import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "text-to-speech"
    APP_ENV: str = "production"
    DEBUG: bool = False
    
    # Paths
    STORAGE_PATH: str = str(BASE_DIR / "storage")
    DATA_PATH: str = str(BASE_DIR / "data")
    MODEL_PATH: str = str(BASE_DIR / "storage" / "models")
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/tts.db"
    
    # Audio & TTS defaults
    DEFAULT_LANGUAGE: str = "vi"
    DEFAULT_OUTPUT_FORMAT: str = "mp3"
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_CONCURRENT_TTS: int = 1
    
    # TTS Model Configuration
    TTS_ENGINE: str = "neural_clone"
    TTS_DEVICE: str = "auto"  # "auto", "cuda", "cpu"
    
    # Sample Rate & Bitrates
    AUDIO_SAMPLE_RATE: int = 24000
    MP3_DEFAULT_BITRATE: str = "192k"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_PATH, "voices"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_PATH, "generated"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_PATH, "temp"), exist_ok=True)
os.makedirs(settings.MODEL_PATH, exist_ok=True)
os.makedirs(settings.DATA_PATH, exist_ok=True)
