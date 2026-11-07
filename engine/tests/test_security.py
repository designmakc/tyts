"""Who may call the engine, and what it never does for anyone.

Requests go through the real app, as ASGI calls (no HTTP client needed): a web
page, another Chrome extension, a program without the engine's key, a path out
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

KEY = {"x-krya-token": os.environ["KRYA_SPEECH_TOKEN"]}
OURS = {"origin": auth.EXTENSION_ORIGIN}
OTHER = {"origin": "chrome-extension://" + "b" * 32}
PAGE = {"origin": "https://example.com"}
ID = "2026-10-30_120000-abcd"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    s = settings_module.Settings(tmp_path / "speech.json")
    s.update({"dataDir": str(tmp_path / "Transcripts"), "kbDir": str(tmp_path / "kb")})
    monkeypatch.setattr(engine, "settings", s)
    monkeypatch.setattr(engine.state, "store", None)
    monkeypatch.setattr(engine, "EXTENSION_FILE", tmp_path / "extension.json")
    monkeypatch.setattr(engine, "extension", None)
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


@pytest.mark.parametrize("route", ["/settings", "/transcripts"])
def test_without_the_key_nothing_is_served(client, route):
    assert client.get(route).status_code == 401
    assert client.get(route, headers={"x-krya-token": "wrong"}).status_code == 401
    assert client.get(route, headers=KEY).status_code == 200


def test_without_the_key_health_says_only_that_the_engine_is_up(client):
    bare = client.get("/health")
    assert bare.status_code == 200 and bare.json() == {"ok": True}


def test_the_engine_proves_it_holds_the_key(client):
    r = client.get("/health", headers={**KEY, "x-krya-nonce": "n1"}).json()
    assert r["proof"] == auth.proof(KEY["x-krya-token"], "n1") and "dataDir" in r


def test_a_nonce_without_the_key_gets_the_proof_and_nothing_else(client):
    # Kryakl's first look: whatever holds the port learns no key from it, and the engine tells nothing but the proof.
    r = client.get("/health", headers={"x-krya-nonce": "n1"})
    assert r.status_code == 200 and r.json() == {"proof": auth.proof(KEY["x-krya-token"], "n1")}
    assert client.get("/health", headers={"x-krya-nonce": "n" * (auth.NONCE_MAX + 1)}).json() == {"ok": True}
    # The extension's ping without an Origin still says hello.
    assert client.get("/health", headers={"x-krya-extension": "0.4.0"}).json() == {"ok": True}
    assert engine.extension["version"] == "0.4.0"


def test_a_web_page_and_another_extension_are_refused_everywhere(client):
    for who in (PAGE, OTHER, {"origin": "null"}):
        for method, route in (("GET", "/health"), ("GET", "/transcripts"), ("PUT", "/settings"), ("POST", "/recordings")):
            assert client.request(method, route, headers={**who, **KEY}).status_code == 403, (who, method, route)


def test_kryakl_s_extension_records_and_says_hello_but_reads_nothing(client):
    assert client.get("/health", headers={**OURS, "x-krya-extension": "0.4.0"}).json() == {"ok": True, "version": engine.VERSION, "engine": "tyts"}
    assert engine.extension["id"] == auth.EXTENSION_ID
    assert client.post("/recordings", headers=OURS, json={"source": "meet", "title": "x", "tracks": {"tab": {"startedAt": 0}}}).status_code == 200
    for method, route in (("GET", "/transcripts"), ("GET", f"/transcripts/{ID}/text"), ("PUT", "/settings"), ("GET", "/settings")):
        assert client.request(method, route, headers=OURS).status_code == 403, (method, route)


def meeting(client, headers=OURS) -> str:
    r = client.post("/recordings", headers=headers, json={"source": "meet", "title": "x", "tracks": {"tab": {"startedAt": 0}}})
    assert r.status_code == 200
    return r.json()["id"]


@pytest.mark.parametrize("source", ["note", "mic"])
def test_the_extension_s_origin_starts_no_note_and_no_microphone(client, source):
    # Any program here can send the extension's Origin; it records a meeting and nothing of Kryakl's.
    tracks = {"main" if source == "note" else "mic": {"startedAt": 0}}
    assert client.post("/recordings", headers=OURS, json={"source": source, "tracks": tracks}).status_code == 403
    assert client.post("/recordings", headers=KEY, json={"source": source, "tracks": tracks}).status_code == 200


def test_the_extension_s_origin_touches_no_recording_of_kryakl_s(client):
    id = client.post("/recordings", headers=KEY, json={"source": "mic", "tracks": {"mic": {"startedAt": 0}}}).json()["id"]
    assert client.put(f"/recordings/{id}/mic/0", headers=OURS, content=b"x").status_code == 403
    assert client.post(f"/recordings/{id}/finish", headers=OURS, json={}).status_code == 403
    assert client.request("DELETE", f"/recordings/{id}", headers=OURS).status_code == 403
    assert engine.state.get_store().row(id)["status"] == "recording"


def test_a_meeting_by_the_extension_s_origin_fills_no_more_than_its_cap(client, monkeypatch):
    monkeypatch.setattr(engine, "EXTENSION_RECORDING_MAX", 100)
    monkeypatch.setattr(engine, "EXTENSION_CHUNK_MAX", 60)
    monkeypatch.setattr(engine, "_received", {})
    id = meeting(client)
    assert client.put(f"/recordings/{id}/tab/0", headers=OURS, content=b"a" * 61).status_code == 413
    assert client.put(f"/recordings/{id}/tab/0", headers=OURS, content=b"a" * 60).status_code == 204
    # The same chunk sent again replaces the first: its bytes are not counted twice.
    assert client.put(f"/recordings/{id}/tab/0", headers=OURS, content=b"a" * 60).status_code == 204
    assert client.put(f"/recordings/{id}/tab/1", headers=OURS, content=b"a" * 41).status_code == 413
    assert client.put(f"/recordings/{id}/tab/1", headers=OURS, content=b"a" * 40).status_code == 204
    assert client.put(f"/recordings/{id}/tab/2", headers=OURS, content=b"a").status_code == 413
    incoming = engine.state.get_store().folder(id) / "incoming"
    assert sum(f.stat().st_size for f in incoming.iterdir()) == 100
    # After a restart the count is taken from the folder.
    engine._received.clear()
    assert client.put(f"/recordings/{id}/tab/2", headers=OURS, content=b"a").status_code == 413


def test_the_cap_holds_only_the_extension_s_origin(client, monkeypatch):
    monkeypatch.setattr(engine, "EXTENSION_RECORDING_MAX", 10)
    id = meeting(client, KEY)
    assert client.put(f"/recordings/{id}/tab/0", headers=KEY, content=b"a" * 50).status_code == 204


def test_another_extension_gets_no_cors_answer(client):
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
    ("Notes/Kryakl", "Notes/Kryakl"),
    ("Notes\\Kryakl", "Notes/Kryakl"),
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
    monkeypatch.delenv("KRYA_SPEECH_TOKEN")
    file = tmp_path / "speech-token"
    first = auth.load_token(file)
    assert len(first) == 64 and file.read_text("utf-8") == first
    assert auth.load_token(file) == first
    monkeypatch.setenv("KRYA_SPEECH_TOKEN", "given")
    assert auth.load_token(file) == "given"
