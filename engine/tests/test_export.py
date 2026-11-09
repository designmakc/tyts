import json

import export

T = {
    "title": "Call",
    "created": "2026-03-05T14:07:00",
    "duration": 125,
    "source": "meet",
    "speakers": {"me": {"name": "Me"}, "S1": {"name": "Speaker 1"}},
    "utterances": [
        {"speaker": "me", "start": 0, "end": 4, "text": "Hello there. How are you?"},
        {"speaker": "S1", "start": 5, "end": 7, "text": "Fine."},
    ],
}
SOLO = {**T, "speakers": {"S1": {"name": "Speaker 1"}}, "utterances": [{"speaker": "S1", "start": 3, "end": 4, "text": "Note."}]}


def test_clock():
    assert export.clock(12) == "00:12"
    assert export.clock(3723) == "1:02:03"
    assert export.clock(12.345, ",") == "00:00:12,345"
    assert export.clock(3723.5, ".") == "01:02:03.500"


def test_length():
    assert export.length(30) == "30 s"
    assert export.length(125) == "2 min"
    assert export.length(3900) == "1 h 5 min"


def test_when():
    assert export.when("2026-03-05T14:07:00") == "5 March 2026, 14:07"


def test_name_and_participants():
    assert export.name(T, "me") == "Me"
    assert export.name(T, "zzz") == "zzz"
    assert export.participants(T) == ["Me", "Speaker 1"]


def test_to_txt():
    lines = export.to_txt(T).splitlines()
    assert lines[0] == "Call"
    assert lines[1] == "5 March 2026, 14:07 · 2 min · Meeting"
    assert lines[3] == "[00:00] Me: Hello there. How are you?"
    assert lines[4] == "[00:05] Speaker 1: Fine."


def test_to_md_multi_and_solo():
    md = export.to_md(T)
    assert md.startswith("# Call")
    assert "**Speakers:** Me, Speaker 1" in md
    assert "**Me** `00:00`" in md
    solo = export.to_md(SOLO, heading=False)
    assert not solo.startswith("#") and "Speakers" not in solo
    assert "`00:03`" in solo


def test_cues_split_sentences_and_share_time():
    cs = export.cues(T)
    assert [c[2] for c in cs] == ["Me: Hello there.", "Me: How are you?", "Speaker 1: Fine."]
    assert cs[0][0] == 0 and abs(cs[1][1] - 4) < 1e-9
    assert cs[0][1] == cs[1][0]


def test_cues_solo_has_no_speaker_prefix():
    assert export.cues(SOLO)[0][2] == "Note."


def test_srt():
    srt = export.to_srt(T)
    assert srt.startswith("1\n00:00:00,000 --> ")
    assert "\n2\n" in srt
    assert "\n3\n00:00:05,000 --> 00:00:07,000\nSpeaker 1: Fine." in srt


def test_vtt():
    vtt = export.to_vtt(T)
    assert vtt.startswith("WEBVTT\n\n00:00:00.000 --> ")
    assert "," not in vtt.split("\n")[2]


def test_write_txt_and_json(tmp_path):
    export.write(T, "txt", tmp_path / "a.txt")
    assert (tmp_path / "a.txt").read_text("utf-8") == export.to_txt(T)
    export.write(T, "json", tmp_path / "a.json")
    assert json.loads((tmp_path / "a.json").read_text("utf-8")) == T
