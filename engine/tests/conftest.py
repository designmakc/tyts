import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# The engine's key for the tests: app.py would otherwise read or write speech-token in the real settings folder.
os.environ.setdefault("TYTS_SPEECH_TOKEN", "test-key")

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _voices_in_tmp(tmp_path, monkeypatch):
    """No test files voice prints in the real data folder (voices.py)."""
    import voices

    monkeypatch.setattr(voices.known, "path", tmp_path / "voices.json")
