import os
import sys
import numpy as np
import scipy.io.wavfile as wavfile
import pytest

sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.database import Base, engine, SessionLocal
from app.models.voice import Voice
from app.services.voice_service import VoiceService
from app.engines import get_engine
from app.config import settings

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_speaker_embedding_extraction(tmp_path):
    """TEST 1: Test audio normalization and speaker embedding extraction."""
    sr = 24000
    t = np.linspace(0, 1.5, int(sr * 1.5), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * 220 * t) + 0.25 * np.sin(2 * np.pi * 440 * t) + 0.1 * np.random.normal(0, 0.05, len(t))
    test_wav = str(tmp_path / "test_sample.wav")
    wavfile.write(test_wav, sr, (signal * 32767).astype(np.int16))

    output_emb = str(tmp_path / "embedding.bin")

    engine_inst = get_engine()
    res = engine_inst.extract_speaker_embedding(test_wav, output_emb)

    assert res is True
    assert os.path.exists(output_emb)
    assert os.path.getsize(output_emb) == 512 * 4

    with open(output_emb, "rb") as f:
        vec = np.frombuffer(f.read(), dtype=np.float32)
    assert len(vec) == 512
    assert not np.isnan(vec).any()
