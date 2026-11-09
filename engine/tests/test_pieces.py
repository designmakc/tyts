"""A call transcribed piece by piece while it records (Parakeet's plan), so after Stop only the rest is read."""

import queue
from pathlib import Path

import numpy as np
import pytest

import app as engine
import asr
import audio
import jobs
from jobs import Worker
from test_call import KEY, client, w  # noqa: F401 (client is a fixture)

RATE = audio.RATE
MIC, SYSTEM = 0.1, 0.2
PACKET = 320  # samples of one 20 ms Opus packet at 16 kHz


class FakeModel:
    name, device, compute = "fake", "cpu", "int8"

    def __init__(self):
        self.heard = []  # (track, seconds) of every sound it was given

    def transcribe(self, samples, language, hotwords, step):
        mic = abs(float(samples[0]) - MIC) < 1e-6
        self.heard.append(("mic" if mic else "system", round(len(samples) / RATE, 2)))
        return [{"start": 1.0, "end": 1.5, "text": "x", "words": [w(" mine" if mic else " theirs", 1.0, 1.5)]}], "en"


class FakeBench:
    def words(self, *args):
        pass


def worker(model: str = "parakeet-tdt-0.6b-v3") -> Worker:
    out = object.__new__(Worker)
    out.settings = engine.settings
    out.get_store = engine.state.get_store
    out.model = FakeModel()
    out.words_model = lambda: out.model
    out.entry = lambda feature, device=None: ("cpu", {"model": model})
    out.bench = FakeBench()
    out.yield_to_dictation = lambda: None
    out._speakers = lambda id, samples, wanted, progress: ([(0, 10_000, "SPEAKER_00")], "ok")
    out.diarizer = jobs.Diarizer()
    out.queue = queue.Queue()
    out.piecing, out.unpieced, out.activity = False, set(), 0
    return out


@pytest.fixture()
def fake_sound(monkeypatch):
    """A part is 4 bytes and SLICE seconds; speech everywhere but a silence of 1 s at 200-201 s of each piece."""
    def sound(path, seconds):
        return np.full(int(seconds * RATE), MIC if "mic" in Path(path).name else SYSTEM, dtype=np.float32)

    def decode_from(path, first, longest):
        total = path.stat().st_size // 4 * jobs.SLICE * RATE
        n = max(min(total - first * PACKET, longest), 0)
        return sound(path, n / RATE), [i * PACKET for i in range(n // PACKET)]

    monkeypatch.setattr(audio, "decode_from", decode_from)
    monkeypatch.setattr(audio, "decode", lambda path, progress=None: sound(path, Path(path).stat().st_size // 4 * jobs.SLICE))
    monkeypatch.setattr(audio, "save_opus", lambda samples, path, **kw: path.write_bytes(b"ogg"))
    monkeypatch.setattr(asr, "speech_spans", lambda s: [(0, 200 * RATE), (201 * RATE, len(s))])


def start(client) -> str:
    started = client.post("/recordings", headers=KEY, json={"source": "system", "tracks": {"mic": {"startedAt": 0}, "system": {"startedAt": 0}}})
    return started.json()["id"]


def send(client, id, upto: int, since: int = 0) -> None:
    for seq in range(since, upto):
        for track in ("mic", "system"):
            assert client.request("PUT", f"/recordings/{id}/{track}/{seq}", headers=KEY, content=b"webm").status_code == 204


def pieces(id, track):
    return jobs.read_pieces(engine.state.get_store().folder(id) / "incoming" / f"pieces-{track}.json")


def test_a_piece_is_made_only_past_piece_seconds_and_cut_at_a_silence(client, fake_sound):
    id = start(client)
    wk = worker()
    send(client, id, 30)  # 290 s, the newest chunk not counted
    wk._pieces()
    assert wk.model.heard == [] and pieces(id, "mic") is None
    send(client, id, 32, 30)
    wk._pieces()
    # 300 s read, cut in the middle of the silence at 200-201 s: the rest waits for the next piece.
    assert wk.model.heard == [("mic", 200.5), ("system", 200.5)]
    kept = pieces(id, "system")
    assert kept["end"] == 200.5 and kept["covered"] == 200.5 * RATE
    assert [(x["word"], x["start"]) for s in kept["segments"] for x in s["words"]] == [(" theirs", 1.0)]
    # Not enough new sound since: nothing more.
    wk._pieces()
    assert len(wk.model.heard) == 2
    # The next piece starts where the last ended, its times on the recording's.
    send(client, id, 52, 32)
    wk._pieces()
    kept = pieces(id, "mic")
    assert kept["end"] == 401 and [x["start"] for s in kept["segments"] for x in s["words"]] == [1.0, 201.5]


def test_the_end_reads_only_the_sound_after_the_pieces(client, fake_sound):
    id = start(client)
    wk = worker()
    send(client, id, 32)
    wk._pieces()
    send(client, id, 40, 32)
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={}).status_code == 200
    wk.model.heard.clear()
    store = engine.state.get_store()
    wk._transcribe(id, store.row(id))
    # 400 s a track, 200.5 s of each done while it recorded.
    assert wk.model.heard == [("mic", 199.5), ("system", 199.5)]
    t = store.transcript(id)
    assert sorted((x["track"], x["word"], x["start"]) for x in t["words"]) == [
        ("mic", " mine", 1.0), ("mic", " mine", 201.5), ("system", " theirs", 1.0), ("system", " theirs", 201.5)]
    assert not (store.folder(id) / "incoming").exists()


@pytest.mark.parametrize("broken", [None, "{", '{"end": 5, "segments": "x"}'])
def test_a_missing_or_broken_piece_file_means_the_whole_track(client, fake_sound, broken):
    id = start(client)
    wk = worker()
    send(client, id, 32)
    wk._pieces()
    path = engine.state.get_store().folder(id) / "incoming" / "pieces-system.json"
    if broken is None:
        path.unlink()
    else:
        path.write_text(broken)
    assert client.post(f"/recordings/{id}/finish", headers=KEY, json={}).status_code == 200
    wk.model.heard.clear()
    wk._transcribe(id, engine.state.get_store().row(id))
    assert wk.model.heard == [("mic", 119.5), ("system", 320.0)]
    assert len(engine.state.get_store().transcript(id)["words"]) == 3


def test_nothing_is_done_while_whisper_reads_the_calls(client, fake_sound):
    id = start(client)
    wk = worker("large-v3-turbo")
    send(client, id, 40)
    wk._pieces()
    assert wk.model.heard == [] and pieces(id, "mic") is None


def test_a_piece_ends_in_a_silence_never_inside_speech():
    s = RATE
    assert jobs.cut_at_silence([(0, 100 * s), (102 * s, 300 * s)], 300 * s) == 101 * s
    # Speech on to the end: the last silence before it.
    assert jobs.cut_at_silence([(0, 50 * s), (51 * s, 280 * s), (280 * s, 300 * s)], 300 * s) == int(50.5 * s)
    # A silence at the end: 1 s before the end at most.
    assert jobs.cut_at_silence([(0, 100 * s)], 300 * s) == 299 * s
    assert jobs.cut_at_silence([], 300 * s) == 299 * s
    # No silence at all: where Silero split its last span.
    assert jobs.cut_at_silence([(0, 30 * s), (30 * s, 60 * s)], 60 * s) == 30 * s
