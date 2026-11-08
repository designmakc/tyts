"""The transcripts folder as a notebook: recordings put into it are imported once and dated by the file,
a call is saved into it beside a Markdown, and a question finds the passages that answer it."""

import os
import time

import pytest

import app as engine
import calls
from test_call import client, fake_sound, record, worker  # noqa: F401  (fixtures)
from test_security import KEY


@pytest.fixture()
def folder(client):
    folder = engine.state.get_store().root
    (folder / "meeting about badges.mp3").write_bytes(b"x")
    (folder / "notes.txt").write_bytes(b"x")
    (folder / ".hidden.mp3").write_bytes(b"x")
    old = time.time() - 3600
    os.utime(folder / "meeting about badges.mp3", (old, old))
    return folder


def test_files_in_the_folder_are_imported_once_and_dated_by_the_file(client, folder):
    store = engine.state.get_store()
    queued = []
    assert calls.scan(store, queued.append) == 1
    row = store.row(queued[0])
    assert row["title"] == "meeting about badges" and row["source"] == "file"
    assert row["created"].startswith(time.strftime("%Y-%m-%d", time.localtime(time.time() - 3600)))
    assert row["job"]["inputs"][0]["path"] == str(folder / "meeting about badges.mp3")
    # Again: nothing new; a file just written waits; a deleted transcript's file is not imported again.
    assert calls.scan(store, queued.append) == 0
    (folder / "fresh.wav").write_bytes(b"x")
    assert calls.scan(store, queued.append) == 0
    assert calls.scan(store, queued.append, now=time.time() + 120) == 1
    assert client.request("DELETE", f"/transcripts/{queued[0]}", headers=KEY).status_code == 200
    assert calls.scan(store, queued.append, now=time.time() + 120) == 0


def test_a_call_is_saved_into_the_folder_with_its_markdown_and_the_summary_follows(client, fake_sound, folder):
    id = record(client)
    store = engine.state.get_store()
    worker()._transcribe(id, store.row(id))
    file = store.row(id)["file"]
    assert file and file.endswith("Call.ogg") and os.path.dirname(file) == str(folder)
    md = folder / (os.path.basename(file)[:-4] + ".md")
    assert "hello budget" in md.read_text("utf-8") and "## Summary" not in md.read_text("utf-8")
    assert client.put(f"/transcripts/{id}/summary", headers=KEY, json={"summary": {"text": "### Short\nThe budget is approved.", "template": "general"}}).status_code == 200
    assert "The budget is approved." in md.read_text("utf-8")
    # Neither the saved call nor the transcripts' own audio.ogg is imported as a new file.
    assert calls.scan(store, lambda id: None, now=time.time() + 120) == 1  # only "meeting about badges.mp3"


def test_a_question_finds_the_passages_by_word_prefixes(client, fake_sound):
    id = record(client)
    store = engine.state.get_store()
    worker()._transcribe(id, store.row(id))
    assert calls.terms("что мы решили по бейджам?") == ["что", "реши", "бейдж"]
    found = client.get("/ask", headers=KEY, params={"q": "what about the budgets"}).json()
    assert len(found) == 1 and found[0]["id"] == id and "budget" in found[0]["text"] and found[0]["at"] == 0  # the line before the hit comes along
    assert client.get("/ask", headers=KEY, params={"q": "elephants"}).json() == []
