"""Who may call the engine, and what it never does for anyone.

Requests go through the real app, as ASGI calls (no HTTP client needed): a web
page, a browser extension, a program without the engine's key, a path out
of its folder.
"""

import asyncio
import json
import os
from urllib.parse import urlencode

import pytest

import app as engine
import auth
import notes
import settings as settings_module
from store import Store

KEY = {"x-tyts-token": os.environ["TYTS_SPEECH_TOKEN"]}
OURS = {"origin": "chrome-extension://" + "a" * 32}  # a browser extension's Origin: refused, as any (the Chrome extension went on 2026-11-07)
OTHER = {"origin": "chrome-extension://" + "b" * 32}
PAGE = {"origin": "https://example.com"}
ID = "2026-10-30_120000-abcd"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    s = settings_module.Settings(tmp_path / "speech.json")
    s.update({"dataDir": str(tmp_path / "Transcripts"), "kbDir": str(tmp_path / "kb")})
    monkeypatch.setattr(engine, "settings", s)
    monkeypatch.setattr(engine.state, "store", None)
    store = engine.state.get_store()
    folder = store.root / ID
    folder.mkdir(parents=True)
    (folder / "transcript.json").write_text(json.dumps({"id": ID, "title": "Standup", "created": "2026-10-30T12:00:00", "utterances": [{"speaker": "A", "start": 0, "end": 1, "text": "Hello."}]}), "utf-8")
    return Client()


class Answer:
    def __init__(self, status: int, headers: dict, content: bytes):
        self.status_code, self.headers, self.content = status, headers, content

    def json(self):
        return json.loads(self.content)


class Client:
    """Calls the app as the server would: one ASGI request, its answer gathered."""

    def request(self, method: str, route: str, headers: dict | None = None, json: dict | None = None, params: dict | None = None, content: bytes | None = None) -> Answer:
        body = content if content is not None else b"" if json is None else __import__("json").dumps(json).encode()
        raw = {"host": "127.0.0.1:8765", **({"content-type": "application/json"} if json is not None else {}), **(headers or {})}
        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": method, "scheme": "http",
            "path": route, "raw_path": route.encode(), "query_string": urlencode(params or {}).encode(),
            "headers": [(k.lower().encode(), str(v).encode()) for k, v in raw.items()],
            "client": ("127.0.0.1", 50000), "server": ("127.0.0.1", 8765), "root_path": "",
        }
        sent: list[dict] = []
        incoming = [{"type": "http.request", "body": body, "more_body": False}]

        async def receive():
            return incoming.pop(0) if incoming else {"type": "http.disconnect"}

        async def send(message):
            sent.append(message)

        asyncio.run(engine.app(scope, receive, send))
        start = next(m for m in sent if m["type"] == "http.response.start")
        headers_out = {k.decode().lower(): v.decode() for k, v in start.get("headers", [])}
        return Answer(start["status"], headers_out, b"".join(m.get("body", b"") for m in sent if m["type"] == "http.response.body"))

    def get(self, route, **kw):
        return self.request("GET", route, **kw)

    def post(self, route, **kw):
        return self.request("POST", route, **kw)

    def options(self, route, **kw):
        return self.request("OPTIONS", route, **kw)

    def put(self, route, **kw):
        return self.request("PUT", route, **kw)


@pytest.mark.parametrize("route", ["/settings", "/transcripts", "/voices"])
def test_without_the_key_nothing_is_served(client, route):
    assert client.get(route).status_code == 401
    assert client.get(route, headers={"x-tyts-token": "wrong"}).status_code == 401
    assert client.get(route, headers=KEY).status_code == 200


def test_without_the_key_health_says_only_that_the_engine_is_up(client):
    bare = client.get("/health")
    assert bare.status_code == 200 and bare.json() == {"ok": True}


def test_the_engine_proves_it_holds_the_key(client):
    r = client.get("/health", headers={**KEY, "x-tyts-nonce": "n1"}).json()
    assert r["proof"] == auth.proof(KEY["x-tyts-token"], "n1") and "dataDir" in r


def test_a_nonce_without_the_key_gets_the_proof_and_nothing_else(client):
    # Tyts's first look: whatever holds the port learns no key from it, and the engine tells nothing but the proof.
    r = client.get("/health", headers={"x-tyts-nonce": "n1"})
    assert r.status_code == 200 and r.json() == {"proof": auth.proof(KEY["x-tyts-token"], "n1")}
    assert client.get("/health", headers={"x-tyts-nonce": "n" * (auth.NONCE_MAX + 1)}).json() == {"ok": True}


def test_a_web_page_and_any_extension_are_refused_everywhere(client):
    id = client.post("/recordings", headers=KEY, json={"source": "mic", "tracks": {"mic": {"startedAt": 0}}}).json()["id"]
    for who in (PAGE, OTHER, OURS, {"origin": "null"}):
        for method, route in (("GET", "/health"), ("GET", "/transcripts"), ("PUT", "/settings"), ("POST", "/recordings"),
                              ("PUT", f"/recordings/{id}/mic/0"), ("POST", f"/recordings/{id}/finish"), ("DELETE", f"/recordings/{id}")):
            assert client.request(method, route, headers={**who, **KEY}).status_code == 403, (who, method, route)
    assert engine.state.get_store().row(id)["status"] == "recording"


def test_an_extension_gets_no_cors_answer(client):
    r = client.options("/recordings", headers={**OTHER, "access-control-request-method": "POST"})
    assert r.status_code == 403 and "access-control-allow-origin" not in r.headers


def test_a_dns_rebinding_page_is_refused(client):
    assert client.get("/transcripts", headers={**KEY, "host": "evil.example:8765"}).status_code == 403


def test_the_engine_writes_no_file_a_caller_names(client, tmp_path):
    target = tmp_path / "Startup" / "x.bat"
    assert client.post(f"/transcripts/{ID}/export", headers=KEY, json={"format": "txt", "path": str(target)}).status_code in (404, 405)
    assert not target.exists()
    r = client.get(f"/transcripts/{ID}/file", headers=KEY, params={"format": "txt"})
    assert r.status_code == 200 and b"Hello." in r.content
    assert client.get(f"/transcripts/{ID}/file", headers=KEY, params={"format": "exe"}).status_code == 400


def test_no_api_pages(client):
    for route in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(route, headers=KEY).status_code == 404


@pytest.mark.parametrize("raw, kept", [
    ("Inbox", "Inbox"),
    ("Notes/Tyts", "Notes/Tyts"),
    ("Notes\\Tyts", "Notes/Tyts"),
    ("..\\..\\Startup", "Inbox"),
    ("a/../../b", "Inbox"),
    ("C:\\Users\\x\\Startup", "Inbox"),
    ("\\\\host\\share", "Inbox"),
    ("/etc", "Inbox"),
])
def test_the_notes_folder_stays_inside_the_knowledge_base(raw, kept):
    assert settings_module.clean_inbox(raw) == kept


def test_a_note_is_written_inside_the_knowledge_base_whatever_the_folder_says(tmp_path):
    kb = tmp_path / "kb"
    for sub in ("../out", str(tmp_path / "elsewhere")):
        assert notes.inbox(str(kb), sub).resolve().is_relative_to(kb.resolve())
    assert notes.inbox(str(kb), "Inbox") == kb / "Inbox"


@pytest.mark.parametrize("bad", ["D:", "C:x", "..", "a/b", "a\\b", " x", "x.", ""])
def test_a_transcript_id_never_leaves_the_library(tmp_path, bad):
    with pytest.raises(KeyError):
        Store(tmp_path).folder(bad)


def test_pyannote_reports_nothing():
    assert os.environ["PYANNOTE_METRICS_ENABLED"] == "0"


def test_the_key_is_made_once_and_kept(tmp_path, monkeypatch):
    monkeypatch.delenv("TYTS_SPEECH_TOKEN")
    file = tmp_path / "speech-token"
    first = auth.load_token(file)
    assert len(first) == 64 and file.read_text("utf-8") == first
    assert auth.load_token(file) == first
    monkeypatch.setenv("TYTS_SPEECH_TOKEN", "given")
    assert auth.load_token(file) == "given"


def test_a_named_speaker_is_offered_by_voice_and_the_prints_never_leave(client):
    import voices

    store = engine.state.get_store()
    store.save(ID, {"id": ID, "title": "Standup", "created": "2026-10-30T12:00:00", "speakers": {"S1": {"name": "Speaker 1"}},
                    "utterances": [{"speaker": "S1", "start": 0, "end": 1, "text": "Hello."}]})
    before = "2026-10-01_120000-0000"
    voices.known.keep(before, {"S1": [1.0, 0.0]})
    voices.known.keep(ID, {"S1": [0.9, 0.1]})
    assert voices.known.learn("Sasha", before, "S1")
    shown = client.request("PATCH", f"/transcripts/{ID}", headers=KEY, json={"notes": "x"}).json()
    assert shown["voiceHints"] == {"S1": {"name": "Sasha", "score": 0.99}} and "print" not in json.dumps(shown)
    assert shown["speakers"]["S1"]["name"] == "Speaker 1"
    no = client.request("PATCH", f"/transcripts/{ID}", headers=KEY, json={"voiceRejected": {"S1": "Sasha"}}).json()
    assert no["voiceHints"] == {} and no["voiceRejected"] == {"S1": ["Sasha"]}
    client.request("PATCH", f"/transcripts/{ID}", headers=KEY, json={"speakers": {"S1": "Sasha"}})
    assert client.get("/voices", headers=KEY).json() == [{"name": "Sasha", "meetings": 2}]
    assert client.request("DELETE", "/voices", headers={**KEY, **PAGE}).status_code == 403
    assert client.request("DELETE", "/voices", headers=KEY, json={"name": "Sasha"}).status_code == 200
    assert client.get("/voices", headers=KEY).json() == []
    assert client.request("DELETE", "/voices", headers=KEY).status_code == 200
    assert not voices.known.path.exists()
