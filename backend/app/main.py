import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.engines import get_engine
from app.workers import get_worker
from app.api import voices_router, tts_router, audio_router, system_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Initialize database schema
    logger.info("Initializing SQLite database schema...")
    init_db()
    
    # 2. Section 40: Load TTS Model ONCE into worker memory
    logger.info("Preloading TTS & Voice Cloning neural model...")
    engine = get_engine()
    engine.load_model()
    
    # 3. Start background job queue worker
    worker = get_worker()
    await worker.start()
    
    logger.info("Application startup complete. Ready for inference.")
    yield
    
    # 4. Shutdown: Stop background worker
    logger.info("Stopping background worker...")
    await worker.stop()
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Local Offline Text-to-Speech with Real Voice Cloning & Emotion Prosody",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(voices_router, prefix="/api")
app.include_router(tts_router, prefix="/api")
app.include_router(audio_router, prefix="/api")
app.include_router(system_router, prefix="/api")

# Top-level health check alias
@app.get("/health")
@app.get("/api/health")
def health():
    from app.services.model_service import ModelService
    return ModelService.get_health_status()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }
