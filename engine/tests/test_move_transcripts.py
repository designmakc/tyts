import json
import os
from pathlib import Path

import pytest

import settings as engine_settings
import store


@pytest.fixture
def home(tmp_path, monkeypatch):
    """Documents with Altype's library in it, and speech.json naming it."""
    monkeypatch.setattr(engine_settings, "TEST_HOME", None)
    docs = tmp_path / "Documents"
    old = docs / "Altype" / "Transcripts"
    new = docs / "Tyts" / "Transcripts"
    s = store.Store(old)
    id = s.create("T", "file", "done")
    s.save(id, {"title": "T", "duration": 1, "language": "en", "utterances": [{"text": "hello"}]})
    s._db.close()
    file = tmp_path / "speech.json"
    file.write_text(json.dumps({"dataDir": str(old)}), "utf-8")
    return {"old": old, "new": new, "id": id, "settings": engine_settings.Settings(file), "file": file}


def move(h):
    return engine_settings.move_transcripts(h["settings"], h["old"], h["new"])


def saved_dir(h):
    return json.loads(h["file"].read_text("utf-8"))["dataDir"]


def stays(h):
    assert h["old"].is_dir() and (h["old"] / h["id"] / "transcript.json").exists()
    assert h["settings"]["dataDir"] == str(h["old"])


def test_moved(home):
    assert move(home)
    assert not home["old"].parent.exists()  # Documents\Altype, empty, is gone
    assert (home["new"] / home["id"] / "transcript.json").exists()
    assert home["settings"]["dataDir"] == saved_dir(home) == str(home["new"])
    s = store.Store(home["new"])
    assert [r["id"] for r in s.list("hello")] == [home["id"]]
    s._db.close()


def test_old_parent_kept_when_not_empty(home):
    (home["old"].parent / "other.txt").write_text("x")
    assert move(home)
    assert (home["old"].parent / "other.txt").exists()


def test_dir_of_kryakl_default_moves_too(home):
    home["settings"].update({"dataDir": str(home["new"])})
    assert move(home)
    assert (home["new"] / home["id"]).is_dir()


def test_chosen_folder_untouched(home, tmp_path):
    chosen = tmp_path / "Elsewhere"
    home["settings"].update({"dataDir": str(chosen)})
    assert not move(home)
    assert home["old"].is_dir() and not home["new"].exists()
    assert home["settings"]["dataDir"] == str(chosen)


def test_same_folder_other_case(home):
    home["settings"].update({"dataDir": str(home["old"]).upper()})
    if os.path.normcase("A") != os.path.normcase("a"):
        pytest.skip("case matters on this file system")
    assert move(home)


def test_kept_when_kryakl_folder_has_files(home):
    home["new"].mkdir(parents=True)
    (home["new"] / "x.txt").write_text("x")
    assert not move(home)
    stays(home)


def test_empty_kryakl_folder_replaced(home):
    home["new"].mkdir(parents=True)
    assert move(home)
    assert (home["new"] / home["id"]).is_dir() and not home["old"].exists()


@pytest.mark.parametrize("status", ["queued", "working", "recording"])
def test_kept_while_a_transcript_is_unfinished(home, status):
    s = store.Store(home["old"])
    s.create("U", "meet", status)
    s._db.close()
    assert not move(home)
    stays(home)


def test_kept_when_rename_fails(home, monkeypatch):
    def refuse(a, b):
        raise PermissionError("in use")

    monkeypatch.setattr(engine_settings.os, "rename", refuse)
    assert not move(home)
    stays(home)
    assert saved_dir(home) == str(home["old"])


def test_nothing_without_old_folder(tmp_path, monkeypatch):
    monkeypatch.setattr(engine_settings, "TEST_HOME", None)
    file = tmp_path / "speech.json"
    old = tmp_path / "Documents" / "Altype" / "Transcripts"
    file.write_text(json.dumps({"dataDir": str(old)}), "utf-8")
    s = engine_settings.Settings(file)
    assert not engine_settings.move_transcripts(s, old, tmp_path / "Documents" / "Tyts" / "Transcripts")


def test_kryas_library_moves_from_the_old_names_in_turn(tmp_path, monkeypatch):
    monkeypatch.setattr(engine_settings, "TEST_HOME", None)
    docs = tmp_path / "Documents"
    monkeypatch.setattr(engine_settings, "documents_dir", lambda: docs)
    krya = docs / "Krya" / "Transcripts"
    s = store.Store(krya)
    id = s.create("K", "file", "done")
    s._db.close()
    (docs / "Altype" / "Transcripts").mkdir(parents=True)
    file = tmp_path / "speech.json"
    file.write_text(json.dumps({"dataDir": str(krya)}), "utf-8")
    settings = engine_settings.Settings(file)
    assert engine_settings.move_transcripts(settings)
    assert (docs / "Tyts" / "Transcripts" / id).is_dir() and not krya.exists()
    assert settings["dataDir"] == str(docs / "Tyts" / "Transcripts")
    # Altype's is not the library any more: it stays where it is.
    assert (docs / "Altype" / "Transcripts").is_dir()


def test_failed_row_with_chunks_does_not_hold_the_move(home):
    s = store.Store(home["old"])
    id = s.create("F", "meet", "failed")
    s._db.close()
    (home["old"] / id / "incoming").mkdir()
    (home["old"] / id / "incoming" / "tab-000.part").write_bytes(b"x")
    assert move(home)
    assert (home["new"] / id / "incoming" / "tab-000.part").exists()


def test_failed_jobs_point_into_the_new_folder(home, tmp_path):
    s = store.Store(home["old"])
    redo = s.create("R", "file", "failed")
    (home["old"] / redo / "audio.ogg").write_bytes(b"ogg")
    meet = s.create("M", "meet", "failed")
    (home["old"] / meet / "incoming").mkdir()
    (home["old"] / meet / "incoming" / "tab.webm").write_bytes(b"webm")
    outside = tmp_path / "talk.mp3"
    outside.write_bytes(b"mp3")
    s.update(redo, job={"kind": "file", "task": "redo", "inputs": [{"path": str(home["old"] / redo / "audio.ogg"), "temp": False}]})
    # Written in another case, as Windows may hand it over (where the file system minds the case, as it is).
    other_case = str.upper if os.path.normcase("A") == "a" else str
    s.update(meet, job={"kind": "meet", "inputs": [{"path": other_case(str(home["old"] / meet / "incoming" / "tab.webm")), "temp": True},
                                                    {"path": str(outside), "temp": False}]})
    s._db.close()
    assert move(home)
    s = store.Store(home["new"])
    for id in (redo, meet):
        inputs = s.row(id)["job"]["inputs"]
        # app.py retry: every input must still be there.
        assert inputs and all(Path(i["path"]).exists() for i in inputs)
    assert s.row(redo)["job"]["inputs"][0]["path"] == str(home["new"] / redo / "audio.ogg")
    assert s.row(meet)["job"]["inputs"][0]["path"].lower() == str(home["new"] / meet / "incoming" / "tab.webm").lower()
    assert s.row(meet)["job"]["inputs"][1]["path"] == str(outside)
    s._db.close()


def test_failed_repoint_keeps_the_move(home, monkeypatch):
    def broken(new, prefixes):
        raise engine_settings.sqlite3.OperationalError("locked")

    monkeypatch.setattr(engine_settings, "_repoint", broken)
    assert move(home)
    assert (home["new"] / home["id"]).is_dir() and home["settings"]["dataDir"] == str(home["new"])
