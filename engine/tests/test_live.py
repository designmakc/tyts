"""A call's words while it records (live.py): WebM chunks cut anywhere decode as they come, pieces are cut at
pauses, the draft waits while anything else reads, falls behind with a gap, and never downloads a model."""

import io
import time

import av
import numpy as np
import pytest

import app as engine
import asr
import live
import settings as settings_module
from audio import RATE
from test_security import KEY, Client
from test_stream import fake_speech


def webm(seconds: float) -> bytes:
    """Opus in WebM, as MediaRecorder writes it: a tone, so the sound is easy to tell from silence."""
    out = io.BytesIO()
    with av.open(out, "w", format="webm") as c:
        s = c.add_stream("libopus", rate=48000, layout="mono")
        x = (0.3 * np.sin(2 * np.pi * 440 * np.arange(int(48000 * seconds)) / 48000)).astype(np.float32)
        for i in range(0, len(x), 960):
            f = av.AudioFrame.from_ndarray(x[None, i : i + 960], format="flt", layout="mono")
            f.sample_rate = 48000
            for p in s.encode(f):
                c.mux(p)
        for p in s.encode(None):
            c.mux(p)
    return out.getvalue()


def wait(until, seconds=10.0):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        if until():
            return True
        time.sleep(0.02)
    return False


def test_chunks_cut_anywhere_are_decoded_as_they_come():
    data = webm(6)
    track = live.Track("system")
    pieces = [data[i : i + 5000] for i in range(0, len(data), 5000)]
    for seq, piece in enumerate(pieces[: len(pieces) // 2]):
        track.add(seq, piece)
    # Half the stream sent, the feed still open: half the sound is there already.
    assert wait(lambda: len(track.waiting()) > RATE)
    track.add(0, pieces[0])  # a retry: ignored
    for seq, piece in enumerate(pieces[len(pieces) // 2 :], start=len(pieces) // 2):
        track.add(seq, piece)
    track.feed.close()
    assert wait(lambda: track.ended)
    assert abs(len(track.waiting()) / RATE - 6) < 0.1


def test_a_lost_chunk_stops_the_track():
    track = live.Track("mic")
    track.add(1, b"x")
    assert track.ended


def test_a_quiet_feed_ends():
    assert live.Feed(quiet_for=0.05).read(10) == b""


def tone(seconds):
    return np.full(int(seconds * RATE), 0.3, dtype=np.float32)


def quiet(seconds):
    return np.zeros(int(seconds * RATE), dtype=np.float32)


def test_cut():
    # Speech, then a pause long enough: the piece ends with the speech.
    assert live.cut(np.concatenate([tone(2), quiet(1)]), fake_speech) == 2 * RATE
    # Speech still going: no piece yet, unless it is too long.
    assert live.cut(np.concatenate([quiet(1), tone(3)]), fake_speech) == 0
    long = live.cut(tone(live.LONGEST + 1), fake_speech)
    assert (live.LONGEST - 2) * RATE <= long <= (live.LONGEST + 1) * RATE
    # Silence goes but its last pause; at the end everything is a piece.
    assert live.cut(quiet(5), fake_speech) == 5 * RATE - int(live.PAUSE * RATE)
    assert live.cut(tone(1), fake_speech, done=True) == RATE


class Fed:
    """A Live with its tracks' decoded sound given directly (the decoders get nothing)."""

    @staticmethod
    def make(may_run=lambda: True):
        heard = []

        def recognize(sound, before):
            heard.append((len(sound), before))
            return f"words{len(heard)}"

        return live.Live(["mic", "system", "tab"], recognize, may_run, speech=fake_speech, run=False), heard


def test_lines_are_me_and_others_and_wait_while_something_else_reads():
    busy = [True]
    l, heard = Fed.make(lambda: not busy[0])
    assert set(l.tracks) == {"mic", "system"}
    l.tracks["mic"]._append(np.concatenate([tone(2), quiet(1)]))
    l.tracks["system"]._append(np.concatenate([quiet(3), tone(2), quiet(1)]))
    assert not l.step() and l.view()["state"] == "paused" and heard == []
    busy[0] = False
    assert l.step()
    lines = l.view()["lines"]
    assert [(x["who"], x["at"], x["text"]) for x in lines] == [("me", 0.0, "words1"), ("others", 0.0, "words2")]
    # The silence before the others' speech is cut away, unread; the next piece is told the text before it.
    l.tracks["mic"]._append(np.concatenate([tone(2), quiet(1)]))
    l.step()
    assert heard[-1][1] == "words1"


def test_a_track_far_behind_drops_its_sound_with_a_gap():
    l, heard = Fed.make(lambda: False)
    l.tracks["system"]._append(tone(live.BEHIND + 5))
    assert l.step()
    assert l.view()["lines"] == [{"who": "others", "at": 0.0, "gap": True}]
    assert len(l.tracks["system"].waiting()) < RATE and heard == []
    l.tracks["system"]._append(tone(live.BEHIND + 5))
    l.step()
    assert len(l.view()["lines"]) == 1  # one gap after another is one gap


@pytest.fixture()
def client(tmp_path, monkeypatch):
    s = settings_module.Settings(tmp_path / "speech.json")
    s.update({"dataDir": str(tmp_path / "Transcripts"), "kbDir": str(tmp_path / "kb")})
    monkeypatch.setattr(engine, "settings", s)
    monkeypatch.setattr(engine.state, "store", None)
    monkeypatch.setattr(engine.worker, "submit", lambda id: None)
    monkeypatch.setattr(engine.worker, "entry", lambda feature, device=None: ("cpu", {"model": "parakeet-tdt-0.6b-v3"}))
    return Client()


def start(client, live_on=True):
    return client.post("/recordings", headers=KEY, json={"source": "system", "live": live_on, "tracks": {"mic": {"startedAt": 0}, "system": {"startedAt": 0}}})


def test_without_the_dictation_model_nothing_downloads(client, monkeypatch):
    monkeypatch.setattr(asr, "downloaded", lambda name: False)
    monkeypatch.setattr(engine.worker, "dictation_model", lambda: pytest.fail("no model is loaded or downloaded"))
    answer = start(client).json()
    assert answer["live"] == "missing"
    assert client.get(f"/recordings/{answer['id']}/live", headers=KEY).json() == {"state": "missing", "lines": []}


def test_dictation_on_the_card_is_not_used(client, monkeypatch):
    monkeypatch.setattr(engine.worker, "entry", lambda feature, device=None: ("cuda", {"model": "large-v3-turbo"}))
    assert start(client).json()["live"] == "card"


def test_a_call_with_the_draft_is_finished_as_before(client, monkeypatch):
    monkeypatch.setattr(asr, "downloaded", lambda name: True)
    answer = start(client).json()
    id = answer["id"]
    assert answer["live"] == "listening"
    assert client.get(f"/recordings/{id}/live", headers=KEY).json()["state"] in ("listening", "paused")
    assert client.request("PUT", f"/recordings/{id}/system/0", headers=KEY, content=b"webm").status_code == 204
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={"lost": 0}).status_code == 200
    assert engine.lives.get(id) is None
    assert client.get(f"/recordings/{id}/live", headers=KEY).json()["state"] == "off"
    # The chunk went to disk as before: the final transcript is made from it.
    assert (engine.state.get_store().folder(id) / "incoming").exists() or engine.state.get_store().row(id)["status"] == "queued"


def test_without_the_switch_there_is_no_draft(client):
    answer = start(client, live_on=False).json()
    assert "live" not in answer and engine.lives.get(answer["id"]) is None


def test_the_draft_needs_the_key(client):
    assert client.get("/recordings/abc/live").status_code == 401
    assert client.get("/recordings/abc/live", headers={**KEY, "origin": "https://example.com"}).status_code == 403
