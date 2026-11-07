import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# The engine's key for the tests: app.py would otherwise read or write speech-token in the real settings folder.
os.environ.setdefault("TYTS_SPEECH_TOKEN", "test-key")
