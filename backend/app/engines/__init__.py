from app.engines.base import BaseTTSEngine
from app.engines.voice_clone_engine import NeuralVoiceCloneEngine

# Global singleton engine instance loaded once
engine_instance = NeuralVoiceCloneEngine()

def get_engine() -> BaseTTSEngine:
    global engine_instance
    if not engine_instance.is_ready():
        engine_instance.load_model()
    return engine_instance

__all__ = ["BaseTTSEngine", "NeuralVoiceCloneEngine", "get_engine", "engine_instance"]
