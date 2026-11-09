"""Voices recognised across meetings: prints filed under names, offered back only as suggestions."""

import numpy as np

import voices

A, B, C = [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]
NEW = "2026-11-09_120000-aaaa"
OLD = "2026-11-01_120000-bbbb"


def transcript(**names):
    return {"speakers": {"me": {"name": "Me"}, **{k: {"name": v} for k, v in names.items()}}}


def known(tmp_path):
    v = voices.Voices(tmp_path / "voices.json")
    v.keep(OLD, {"S1": np.array(A), "S2": np.array(B)})
    assert v.learn("Sasha", OLD, "S1")
    return v


def test_keyed_follows_renumber():
    raw = {"SPEAKER_01": [2.0, 0.0], "SPEAKER_00": [0.0, 3.0], "SPEAKER_09": [0.0, 0.0]}
    out = voices.keyed(raw, ["me", "SPEAKER_01", "SPEAKER_00", "SPEAKER_01", "SPEAKER_09"], ["me", "S1", "S2", "S1", "S3"])
    assert {k: list(v) for k, v in out.items()} == {"S1": [1.0, 0.0], "S2": [0.0, 1.0]}  # unit length; a zero print is none


def test_a_close_voice_is_suggested_never_named(tmp_path):
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array([0.1, 0.9, 0.0]), "S2": np.array([0.9, 0.2, 0.1])})
    t = transcript(S1="Speaker 1", S2="Speaker 2")
    assert v.suggest(NEW, t) == {"S2": {"name": "Sasha", "score": 0.97}}
    assert t["speakers"]["S2"]["name"] == "Speaker 2"


def test_below_the_threshold_nothing(tmp_path):
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array([0.5, 0.5, 0.7])})  # cosine with A ≈ 0.5
    assert v.suggest(NEW, transcript(S1="Speaker 1")) == {}


def test_rejected_named_or_taken_is_not_offered(tmp_path):
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array(A), "S2": np.array([0.9, 0.1, 0.0])})
    both = transcript(S1="Speaker 1", S2="Speaker 2")
    assert v.suggest(NEW, both) == {"S1": {"name": "Sasha", "score": 1.0}}  # one speaker per name, the closest
    assert v.suggest(NEW, {**both, "voiceRejected": {"S1": ["Sasha"]}}) == {"S2": {"name": "Sasha", "score": 0.99}}
    assert v.suggest(NEW, transcript(S1="Olga", S2="Speaker 2")) == {"S2": {"name": "Sasha", "score": 0.99}}
    assert v.suggest(NEW, transcript(S1="Sasha", S2="Speaker 2")) == {}


def test_a_name_learns_each_meeting_and_moves_with_a_rename(tmp_path):
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array([0.8, 0.6, 0.0])})
    assert v.learn("Sasha", NEW, "S1")
    assert v.list() == [{"name": "Sasha", "meetings": 2}]
    assert v.learn("Olga", NEW, "S1")  # renamed: that meeting's print goes with it
    assert v.list() == [{"name": "Olga", "meetings": 1}, {"name": "Sasha", "meetings": 1}]
    assert not v.learn("Speaker 2", OLD, "S2") and not v.learn("Nobody", OLD, "S9")
    assert v.list() == [{"name": "Olga", "meetings": 1}, {"name": "Sasha", "meetings": 1}]


def test_forget_one_all_and_a_deleted_meeting(tmp_path):
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array(A)})
    v.drop_meeting(NEW)
    assert v.suggest(NEW, transcript(S1="Speaker 1")) == {}
    v.forget("Sasha")
    assert v.list() == []
    assert v.learn("Olga", OLD, "S2")
    v.forget()
    assert v.list() == [] and not (tmp_path / "voices.json").exists()


def test_old_meetings_go_first(tmp_path, monkeypatch):
    monkeypatch.setattr(voices, "MEETINGS_KEPT", 1)
    v = known(tmp_path)
    v.keep(NEW, {"S1": np.array(C)})
    assert not v.learn("Olga", OLD, "S2")  # the older meeting's prints went
    assert v.list() == [{"name": "Sasha", "meetings": 1}]  # what was named stays
