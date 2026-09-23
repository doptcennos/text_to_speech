from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import numpy as np

class BaseTTSEngine(ABC):
    """
    Abstract Base Class for all TTS and Voice Cloning engines.
    """
    
    @abstractmethod
    def load_model(self) -> bool:
        """Load model into memory once and keep in worker memory."""
        pass

    @abstractmethod
    def is_ready(self) -> bool:
        """Check if engine and model are loaded and ready."""
        pass

    @abstractmethod
    def extract_speaker_embedding(self, sample_path: str, output_embedding_path: str) -> bool:
        """
        Extract speaker embedding vector from normalized audio sample
        and persist to disk (embedding.bin).
        """
        pass

    @abstractmethod
    def synthesize(
        self,
        text: str,
        embedding_path: Optional[str],
        output_wav_path: str,
        emotion: str = "Neutral",
        emotion_intensity: float = 1.0,
        speed: float = 1.0,
        pitch: float = 0.0,
        sample_rate: int = 24000
    ) -> float:
        """
        Synthesize speech from text conditioned on speaker embedding.
        Returns duration in seconds.
        """
        pass

    @abstractmethod
    def get_engine_info(self) -> Dict[str, Any]:
        """Return engine metadata, device, model name, and status."""
        pass
