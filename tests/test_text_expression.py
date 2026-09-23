import os
import sys
import pytest

sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.tts_service import TTSService

def test_parse_expressions():
    """Section 14: Test expression parsing [pause 500ms], [laugh], [whisper], etc."""
    text = "Mọi người ơi! [pause 500ms] [laugh] Hôm nay [excited] chúng ta có tiệc! [pause 1s]"
    segments = TTSService.parse_expressions(text)

    types = [s["type"] for s in segments]
    assert "pause" in types
    assert "text" in types

    pauses = [s["duration_ms"] for s in segments if s["type"] == "pause"]
    assert 500 in pauses
    assert 1000 in pauses
