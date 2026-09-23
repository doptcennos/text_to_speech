import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.database import init_db
from app.main import app

@pytest.fixture(scope="module", autouse=True)
def setup_tables():
    init_db()
    yield

client = TestClient(app)

def test_health_api():
    """Section 44 Health Check API test."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "tts_engine" in data
    assert "storage" in data

def test_system_info_api():
    """Section 32 System Info API test."""
    response = client.get("/api/system/info")
    assert response.status_code == 200
    data = response.json()
    assert "cpu" in data
    assert "ram_total_gb" in data
    assert "disk_free_gb" in data

def test_list_voices_api():
    response = client.get("/api/voices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
