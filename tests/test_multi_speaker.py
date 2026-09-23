import os
import sys
import pytest

sys.path.insert(0, '/app')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.tts_service import TTSService

def test_parse_multi_speaker_script():
    """Section 15 & 38: Test multi-speaker dialog turns parsing."""
    script = """My Voice:
Xin chào mọi người!

Voice B:
Xin chào!

My Voice:
Hôm nay chúng ta sẽ tổ chức một buổi tiệc."""

    turns = TTSService.parse_multi_speaker_script(script)
    assert len(turns) == 3
    assert turns[0][0] == "My Voice"
    assert "Xin chào mọi người!" in turns[0][1]
    assert turns[1][0] == "Voice B"
    assert "Xin chào!" in turns[1][1]
    assert turns[2][0] == "My Voice"
