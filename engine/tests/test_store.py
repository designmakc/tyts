from datetime import datetime

import pytest

import store


@pytest.fixture
def s(tmp_path):
    return store.Store(tmp_path / "data")


def doc(title, *texts):
    return {"title": title, "duration": 12, "language": "ru", "utterances": [{"text": t} for t in texts]}


def test_new_id_format():
    assert store.new_id(datetime(2026, 3, 5, 14, 7, 9)).startswith("2026-03-05_140709-")


def test_create_row_update(s):
    id = s.create("T", "file", "queued", {"a": 1})
    assert s.folder(id).is_dir()
    r = s.row(id)
    assert r["title"] == "T" and r["job"] == {"a": 1}
    s.update(id, status="done", job={"b": 2}, bogus="x")
    r = s.row(id)
    assert r["id"] == id and r["status"] == "done" and r["job"] == {"b": 2}
    s.update(id, bogus="x")
    assert s.row("missing") is None


def test_rows_by_status(s):
    a = s.create("A", "file", "queued")
    s.create("B", "file", "done")
    assert [r["id"] for r in s.rows(("queued",))] == [a]


def test_folder_validation(s):
    for bad in ("", "a/b", "a\\b", ".."):
        with pytest.raises(KeyError):
            s.folder(bad)


def test_save_and_transcript(s):
    id = s.create("old", "file", "done")
    s.save(id, doc("New", "hello world"))
    assert s.transcript(id)["title"] == "New"
    assert not (s.folder(id) / "transcript.tmp").exists()
    r = s.row(id)
    assert (r["title"], r["duration"], r["language"]) == ("New", 12, "ru")
    assert s.transcript("nope") is None and s.transcript("../x") is None


def test_list_orders_newest_first(s):
    a = s.create("A", "file", "done")
    b = s.create("B", "file", "done")
    s.update(a, created="2020-01-01T00:00:00")
    assert [r["id"] for r in s.list()] == [b, a]


def test_search_prefix_cyrillic_and_title(s):
    a = s.create("Встреча", "meet", "done")
    b = s.create("Other", "meet", "done")
    s.save(a, doc("Встреча", "Обсудили бюджет проекта"))
    s.save(b, doc("Other", "nothing relevant"))
    assert [r["id"] for r in s.list("бюдж")] == [a]
    assert [r["id"] for r in s.list("БЮДЖЕТ")] == [a]
    assert [r["id"] for r in s.list("встре")] == [a]
    assert "[бюджет]" in s.list("бюдж")[0]["snippet"]
    assert s.list("zzz") == []
    assert len(s.list("  ")) == 2


def test_resave_replaces_index(s):
    id = s.create("T", "file", "done")
    s.save(id, doc("T", "alpha"))
    s.save(id, doc("T", "beta"))
    assert s.list("alpha") == [] and len(s.list("beta")) == 1


def test_delete(s):
    id = s.create("T", "file", "done")
    s.save(id, doc("T", "gamma"))
    s.delete(id)
    assert s.row(id) is None and not s.folder(id).exists() and s.list("gamma") == []
