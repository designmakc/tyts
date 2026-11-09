import pytest

import notes

T = {
    "title": "Weekly sync",
    "created": "2026-03-05T14:07:00",
    "duration": 65,
    "source": "meet",
    "speakers": {"me": {"name": "Me"}, "S1": {"name": "Speaker 1"}},
    "utterances": [
        {"speaker": "me", "start": 0, "end": 4, "text": "Buy milk tomorrow morning please remember"},
        {"speaker": "S1", "start": 5, "end": 7, "text": "Ok."},
    ],
}


def test_first_words():
    assert notes.first_words("one two three four five six seven") == "one two three four five six"
    assert notes.first_words("...") == "Note"


def test_file_name():
    assert notes.file_name('a/b:c*"d"?') == "a b c d"
    assert notes.file_name("  ...  ") == "Note"
    assert len(notes.file_name("x" * 200)) == 80


def test_free_numbers_duplicates(tmp_path):
    (tmp_path / "n.md").write_text("x")
    assert notes.free(tmp_path, "n").name == "n (2).md"
    (tmp_path / "n (2).md").write_text("x")
    assert notes.free(tmp_path, "n").name == "n (3).md"


def test_frontmatter():
    fm = notes.frontmatter({"a": 1, "tags": ["x", "y"]})
    assert fm == '---\na: 1\ntags:\n  - "x"\n  - "y"\n---\n'


def test_no_knowledge_base():
    with pytest.raises(notes.NoKnowledgeBase):
        notes.write_note(T, "", "")


def test_write_note(tmp_path):
    path = notes.write_note(T, str(tmp_path), "Inbox")
    assert path.parent == tmp_path / "Inbox"
    assert path.name == "2026-03-05 1407 Buy milk tomorrow morning please remember.md"
    text = path.read_text("utf-8")
    assert "source: voice note" in text and "duration: 01:05" in text
    assert text.endswith("Buy milk tomorrow morning please remember\n\nOk.\n")
    assert notes.write_note(T, str(tmp_path), "Inbox").name.endswith("(2).md")


def test_write_transcript(tmp_path):
    path = notes.write_transcript(T, str(tmp_path), "")
    assert path == tmp_path / "2026-03-05 Weekly sync.md"
    text = path.read_text("utf-8")
    assert "source: Meeting" in text
    assert '  - "Me"' in text and '  - "Speaker 1"' in text
    assert "# Weekly sync" in text
