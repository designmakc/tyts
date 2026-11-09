"""A call recorded from the whole computer's sound: the microphone as "me", the system's sound split by voice,
and the summary kept in transcript.json (searched, exported, kept when transcribed again)."""

import json
import sqlite3

import numpy as np
import pytest

import app as engine
import audio
import export
import jobs
import notes
import settings as settings_module
from jobs import Worker
from store import Store
from test_security import KEY, Client

MIC, SYSTEM = 0.1, 0.2  # each track's samples, so the fake model knows which one it hears
SUMMARY = {"text": "### Short\nThe budget is approved.", "template": "general", "mine": False, "language": "en", "made": "2026-11-06T12:00:00"}


def w(word, start, end):
    return {"word": word, "start": start, "end": end}


class FakeModel:
    name, device, compute = "fake", "cpu", "int8"

    def transcribe(self, samples, language, hotwords, step):
        if abs(float(samples[-1]) - MIC) < 1e-6:
            # My microphone heard me, and the speakers' "hello" a moment after they said it.
            return [{"words": [w(" unique", 0, 0.5), w(" hello", 5.1, 5.6)]}], "en"
        return [{"words": [w(" hello", 5, 5.5), w(" budget", 6, 6.5)]}], "en"


class FakeBench:
    def words(self, *args):
        pass


@pytest.fixture()
def client(tmp_path, monkeypatch):
    s = settings_module.Settings(tmp_path / "speech.json")
    s.update({"dataDir": str(tmp_path / "Transcripts"), "kbDir": str(tmp_path / "kb")})
    monkeypatch.setattr(engine, "settings", s)
    monkeypatch.setattr(engine.state, "store", None)
    monkeypatch.setattr(engine.worker, "submit", lambda id: None)
    return Client()


def worker() -> Worker:
    """The real job code, with the sound and the models made up."""
    out = object.__new__(Worker)
    out.settings = engine.settings
    out.get_store = engine.state.get_store
    out.words_model = lambda: FakeModel()
    out.bench = FakeBench()
    out.yield_to_dictation = lambda: None
    out._speakers = lambda id, samples, wanted, progress: ([(0, 10, "SPEAKER_00")], "ok")
    out.diarizer = jobs.Diarizer()
    return out


@pytest.fixture()
def fake_sound(monkeypatch):
    def decode(path, progress=None):
        return np.full(audio.RATE * 10, MIC if "mic" in str(path) else SYSTEM, dtype=np.float32)

    monkeypatch.setattr(audio, "decode", decode)
    monkeypatch.setattr(audio, "save_opus", lambda samples, path, **kw: path.write_bytes(b"ogg"))


def record(client) -> str:
    started = client.post("/recordings", headers=KEY, json={"source": "system", "app": "Zoom", "tracks": {"mic": {"startedAt": 0}, "system": {"startedAt": 0}}})
    assert started.status_code == 200
    id = started.json()["id"]
    for track in ("mic", "system"):
        assert client.request("PUT", f"/recordings/{id}/{track}/0", headers=KEY, content=b"webm").status_code == 204
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={"lost": 2}).status_code == 200
    return id


def test_a_call_is_recorded_from_two_tracks_with_its_program_and_lost_chunks(client, fake_sound):
    id = record(client)
    store = engine.state.get_store()
    row = store.row(id)
    assert row["title"] == "Call" and row["source"] == "system"
    assert row["job"]["app"] == "Zoom" and row["job"]["lost"] == 2
    # The library names the program while it records and once it is done (the job is cut down then).
    assert [r["app"] for r in client.get("/transcripts", headers=KEY).json()] == ["Zoom"]
    worker()._transcribe(id, store.row(id))
    t = store.transcript(id)
    assert t["app"] == "Zoom" and t["lost"] == 2
    assert [r["app"] for r in client.get("/transcripts", headers=KEY).json()] == ["Zoom"]
    assert [r["app"] for r in client.get("/transcripts", headers=KEY, params={"q": "budget"}).json()] == ["Zoom"]
    # The two-track way: my microphone is "me", the echo of their "hello" is gone from it.
    assert [(u["speaker"], u["text"]) for u in t["utterances"]] == [("me", "unique"), ("S1", "hello budget")]
    assert {x["track"] for x in t["words"]} == {"mic", "system"}


def test_no_lost_chunks_are_not_written(client, fake_sound):
    started = client.post("/recordings", headers=KEY, json={"source": "system", "tracks": {"system": {"startedAt": 0}}})
    id = started.json()["id"]
    client.request("PUT", f"/recordings/{id}/system/0", headers=KEY, content=b"webm")
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={"lost": 0}).status_code == 200
    worker()._transcribe(id, engine.state.get_store().row(id))
    t = engine.state.get_store().transcript(id)
    assert "lost" not in t and "app" not in t


def test_bad_lost_and_long_app(client):
    long = client.post("/recordings", headers=KEY, json={"source": "system", "app": "x" * 200, "tracks": {"system": {"startedAt": 0}}})
    assert len(engine.state.get_store().row(long.json()["id"])["job"]["app"]) == 80
    id = long.json()["id"]
    client.request("PUT", f"/recordings/{id}/system/0", headers=KEY, content=b"webm")
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={"lost": -1}).status_code == 400


def test_the_summary_is_kept_searched_and_survives_a_redo(client, fake_sound):
    id = record(client)
    store = engine.state.get_store()
    # Not done yet: no summary.
    assert client.request("PUT", f"/transcripts/{id}/summary", headers=KEY, json={"summary": SUMMARY}).status_code == 409
    worker()._transcribe(id, store.row(id))
    assert client.request("PUT", "/transcripts/2020-01-01_000000-dead/summary", headers=KEY, json={"summary": SUMMARY}).status_code == 404
    assert client.request("PUT", f"/transcripts/{id}/summary", headers=KEY, json={"summary": {**SUMMARY, "text": None}}).status_code == 400
    assert client.request("PUT", f"/transcripts/{id}/summary", headers=KEY, json={"summary": {**SUMMARY, "text": "x" * 100_001}}).status_code == 400
    put = client.request("PUT", f"/transcripts/{id}/summary", headers=KEY, json={"summary": SUMMARY})
    assert put.status_code == 200 and put.json() == {"ok": True}
    assert store.transcript(id)["summary"] == SUMMARY
    assert [r["summarized"] for r in client.get("/transcripts", headers=KEY).json()] == [1]
    assert [r["id"] for r in client.get("/transcripts", headers=KEY, params={"q": "approved"}).json()] == [id]
    # Transcribed again from its saved sound: the summary, the program and the lost chunks stay.
    store.update(id, status="queued", job={"kind": "system", "task": "redo", "keepAudio": True,
                                           "inputs": [{"path": str(store.folder(id) / "audio.ogg"), "track": "main", "offset": 0, "temp": False}]})
    worker()._transcribe(id, store.row(id))
    t = store.transcript(id)
    assert t["summary"] == SUMMARY and t["app"] == "Zoom" and t["lost"] == 2
    # Removed.
    assert client.request("PUT", f"/transcripts/{id}/summary", headers=KEY, json={"summary": None}).status_code == 200
    assert "summary" not in store.transcript(id)
    assert [r["summarized"] for r in client.get("/transcripts", headers=KEY).json()] == [0]
    assert client.get("/transcripts", headers=KEY, params={"q": "approved"}).json() == []


def test_an_older_library_gets_the_new_columns(tmp_path):
    db = sqlite3.connect(tmp_path / "index.db")
    db.executescript("""
        create table transcripts(id text primary key, title text not null, source text not null, created text not null,
          duration real default 0, status text not null, stage text default '', progress real default 0,
          error text default '', language text default '', speakers_status text default '', job text default '{}', touched text default '');
        insert into transcripts(id, title, source, created, status) values('2026-01-01_000000-abcd', 'Old', 'file', '2026-01-01T00:00:00', 'done');
    """)
    db.commit()
    db.close()
    row = Store(tmp_path).list()[0]
    assert row["summarized"] == 0 and row["app"] is None


T = {
    "title": "Weekly sync", "created": "2026-03-05T14:07:00", "duration": 125, "source": "system",
    "speakers": {"me": {"name": "Me"}, "S1": {"name": "Speaker 1"}},
    "utterances": [{"speaker": "me", "start": 0, "end": 4, "text": "Hello there."}, {"speaker": "S1", "start": 5, "end": 7, "text": "Fine."}],
    "summary": {**SUMMARY, "text": "### Decisions\n- Ship on Friday"},
}


def test_exports_put_the_summary_on_top(tmp_path):
    md = export.to_md(T)
    assert "Call" in export.meta_line(T)
    assert md.index("## Summary") < md.index("- Ship on Friday") < md.index("Hello there.")
    txt = export.to_txt(T)
    assert txt.index("Summary") < txt.index("- Ship on Friday") < txt.index("Hello there.")
    export.to_docx(T, tmp_path / "t.docx")
    from docx import Document
    paragraphs = [p.text for p in Document(str(tmp_path / "t.docx")).paragraphs]
    assert paragraphs.index("Summary") < paragraphs.index("Ship on Friday") < next(i for i, p in enumerate(paragraphs) if "Hello there." in p)
    kb = notes.write_transcript(T, str(tmp_path / "kb"), "").read_text("utf-8")
    assert kb.index("## Summary") < kb.index("Hello there.")


def test_notes_are_kept_searched_exported_and_no_edit(client, fake_sound):
    id = record(client)
    store = engine.state.get_store()
    worker()._transcribe(id, store.row(id))
    got = client.request("PATCH", f"/transcripts/{id}", headers=KEY, json={"notes": "Ask Olga about the invoice"})
    assert got.status_code == 200 and got.json()["notes"] == "Ask Olga about the invoice"
    t = store.transcript(id)
    assert t["notes"] == "Ask Olga about the invoice" and "edited" not in t
    assert [r["id"] for r in client.get("/transcripts", headers=KEY, params={"q": "invoice"}).json()] == [id]
    md = export.to_md(t)
    assert md.index("## Notes") < md.index("Ask Olga") < md.index("## Transcript")
    # Cut to its most; emptied, it is gone.
    client.request("PATCH", f"/transcripts/{id}", headers=KEY, json={"notes": "x" * (engine.NOTES_MAX + 5)})
    assert len(store.transcript(id)["notes"]) == engine.NOTES_MAX
    client.request("PATCH", f"/transcripts/{id}", headers=KEY, json={"notes": "  "})
    assert "notes" not in store.transcript(id)
    assert client.get("/transcripts", headers=KEY, params={"q": "invoice"}).json() == []


def test_exports_without_a_summary_are_as_before():
    plain = {k: v for k, v in T.items() if k != "summary"}
    assert "Summary" not in export.to_md(plain) and "Summary" not in export.to_txt(plain)
    assert "Transcript" not in export.to_txt(plain)


JPEG = b"\xff\xd8\xff\xe0frame"


def test_screenshots_are_kept_beside_the_sound_and_listed_by_time(client, fake_sound):
    started = client.post("/recordings", headers=KEY, json={"source": "system", "tracks": {"system": {"startedAt": 0}}})
    id = started.json()["id"]
    client.request("PUT", f"/recordings/{id}/system/0", headers=KEY, content=b"webm")
    assert client.request("PUT", f"/recordings/{id}/shots/12000", headers=KEY, content=JPEG).status_code == 204
    assert client.request("PUT", f"/recordings/{id}/shots/4000", headers=KEY, content=JPEG, params={"manual": "1"}).status_code == 204
    # Not a JPEG, too large, a time out of range, no key, a page's Origin: refused.
    assert client.request("PUT", f"/recordings/{id}/shots/1", headers=KEY, content=b"png").status_code == 415
    assert client.request("PUT", f"/recordings/{id}/shots/1", headers=KEY, content=b"\xff\xd8" + b"x" * (2 << 20)).status_code == 413
    assert client.request("PUT", f"/recordings/{id}/shots/-1", headers=KEY, content=JPEG).status_code == 400
    assert client.request("PUT", f"/recordings/{id}/shots/1", content=JPEG).status_code == 401
    assert client.request("PUT", f"/recordings/{id}/shots/1", headers={"origin": "chrome-extension://" + "a" * 32}, content=JPEG).status_code == 403
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={}).status_code == 200
    # The call has ended: no more.
    assert client.request("PUT", f"/recordings/{id}/shots/20000", headers=KEY, content=JPEG).status_code == 409
    store = engine.state.get_store()
    worker()._transcribe(id, store.row(id))
    t = store.transcript(id)
    assert t["shots"] == [{"at": 4.0, "file": "4000-m.jpg", "manual": True}, {"at": 12.0, "file": "12000.jpg", "manual": False}]
    got = client.get(f"/transcripts/{id}/shots/4000-m.jpg", headers=KEY)
    assert got.status_code == 200 and got.content == JPEG
    assert client.get(f"/transcripts/{id}/shots/..%2Fspeech.json", headers=KEY).status_code in (400, 404)
    assert client.get(f"/transcripts/{id}/shots/audio.ogg", headers=KEY).status_code == 400
    # A shot marked key by the summary's pass stays so when the call is transcribed again.
    t["shots"][1]["key"] = True
    store.save(id, t)
    store.update(id, status="queued", job={"kind": "system", "task": "redo", "keepAudio": True,
                                           "inputs": [{"path": str(store.folder(id) / "audio.ogg"), "track": "main", "offset": 0, "temp": False}]})
    worker()._transcribe(id, store.row(id))
    assert store.transcript(id)["shots"][1] == {"at": 12.0, "file": "12000.jpg", "manual": False, "key": True}
    # Deleted with the recording.
    assert client.request("DELETE", f"/transcripts/{id}", headers=KEY).status_code == 200
    assert not (store.folder(id) / "shots").exists()


def test_a_microphone_recording_takes_no_screenshots(client):
    id = client.post("/recordings", headers=KEY, json={"source": "mic", "tracks": {"main": {"startedAt": 0}}}).json()["id"]
    assert client.request("PUT", f"/recordings/{id}/shots/1", headers=KEY, content=JPEG).status_code == 409


def test_key_screenshots_and_speaker_hints_are_marks_not_edits(client, fake_sound):
    id = client.post("/recordings", headers=KEY, json={"source": "system", "tracks": {"system": {"startedAt": 0}}}).json()["id"]
    client.request("PUT", f"/recordings/{id}/system/0", headers=KEY, content=b"webm")
    client.request("PUT", f"/recordings/{id}/shots/12000", headers=KEY, content=JPEG)
    client.post(f"/recordings/{id}/finish", headers=KEY, json={})
    store = engine.state.get_store()
    worker()._transcribe(id, store.row(id))
    speaker = next(iter(store.transcript(id)["speakers"]))
    got = client.request("PATCH", f"/transcripts/{id}", headers=KEY, json={
        "shots": {"12000.jpg": {"key": True}, "../x.jpg": {"key": True}, "9.jpg": {"key": True}},
        "speakerHints": {speaker: "Olga Petrova", "S9": "Nobody", "me": "Me Myself"},
    })
    assert got.status_code == 200
    t = store.transcript(id)
    assert t["shots"] == [{"at": 12.0, "file": "12000.jpg", "manual": False, "key": True}]
    assert t["speakerHints"] == ({speaker: "Olga Petrova"} if speaker != "me" else {})
    assert "edited" not in t
    client.request("PATCH", f"/transcripts/{id}", headers=KEY, json={"shots": {"12000.jpg": {"key": False}}, "speakerHints": {speaker: None}})
    t = store.transcript(id)
    assert "key" not in t["shots"][0] and "speakerHints" not in t
    # Only Kryakl: no key, or a page's Origin, is refused.
    assert client.request("PATCH", f"/transcripts/{id}", json={"shots": {}}).status_code == 401
    assert client.request("PATCH", f"/transcripts/{id}", headers={"origin": "chrome-extension://" + "a" * 32}, json={"shots": {}}).status_code in (401, 403)
