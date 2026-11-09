"""Who may call the engine.

The engine listens on 127.0.0.1, which every program and every Windows account
on the computer can reach, and any browser page too. So:

- Kryakl (and a program of the person's that reads the key) sends the engine's
  key in X-Tyts-Token. The key is random, kept in speech-token beside the
  engine's settings (in the person's own %APPDATA%, which other accounts cannot
  read) and handed to the engine Kryakl starts in TYTS_SPEECH_TOKEN.
- A request with an Origin (a web page, a browser extension) is refused everywhere.
- Anything else gets /health's bare "ok" and nothing more.

`/health` with X-Tyts-Nonce and no key answers HMAC(key, nonce) and nothing
else: Kryakl checks it before it sends the key, so another program (another
account's) that took the port first never receives the key.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from pathlib import Path

from settings import APP_DIR

TOKEN_FILE = APP_DIR / "speech-token"
# Kryakl's nonce is 32 hex digits; a longer one is not Kryakl's.
NONCE_MAX = 128


def load_token(path: Path = TOKEN_FILE) -> str:
    """The engine's key: Kryakl's (TYTS_SPEECH_TOKEN), else the file's, else a new one written there."""
    given = os.environ.get("TYTS_SPEECH_TOKEN", "").strip()
    if given:
        return given
    try:
        kept = path.read_text("utf-8").strip()
        if kept:
            return kept
    except OSError:
        pass
    made = secrets.token_hex(32)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(made, "utf-8")
    return made


def token_ok(given: str, token: str) -> bool:
    return bool(given) and hmac.compare_digest(given.encode(), token.encode())


def nonce_ok(nonce: str) -> bool:
    return 0 < len(nonce) <= NONCE_MAX


def proof(token: str, nonce: str) -> str:
    """What only the engine holding the key can answer to a nonce (it tells nothing of the key)."""
    return hmac.new(token.encode(), nonce.encode(), hashlib.sha256).hexdigest()

