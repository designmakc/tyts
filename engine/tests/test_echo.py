"""The microphone's echo of the speakers is silenced before it is read; the person's own voice is kept."""

import numpy as np

import asr
from audio import RATE


def voice(seconds: float, seed: int) -> np.ndarray:
    """Noise whose loudness rises and falls like syllables, different for every seed."""
    rng = np.random.default_rng(seed)
    n = int(seconds * RATE)
    envelope = np.repeat(rng.uniform(0.05, 1.0, n // 1600 + 1), 1600)[:n]
    return (rng.standard_normal(n) * envelope * 0.1).astype(np.float32)


def test_echo_is_silenced_and_the_persons_voice_kept(monkeypatch):
    theirs = voice(10, 1)
    mine = np.zeros_like(theirs)
    delay = int(0.03 * RATE)
    # 1–5 s: the speakers' sound reaching the microphone 30 ms late, a little quieter; 6–10 s: the person.
    mine[RATE:5 * RATE] = 0.9 * theirs[RATE - delay:5 * RATE - delay]
    own = voice(4, 2)
    mine[6 * RATE:] = own
    monkeypatch.setattr(asr, "speech_spans", lambda x: [(RATE, 5 * RATE), (6 * RATE, 10 * RATE)])
    assert asr.mute_echo(mine, theirs) == 4.0
    assert not mine[RATE:5 * RATE].any()
    assert np.array_equal(mine[6 * RATE:], own)


def test_the_person_louder_over_the_others_is_kept(monkeypatch):
    theirs = voice(4, 3)
    # Both at once: the others' echo under the person's own, louder voice.
    mine = 0.3 * theirs + 3 * voice(4, 4)
    before = mine.copy()
    monkeypatch.setattr(asr, "speech_spans", lambda x: [(0, 4 * RATE)])
    assert asr.mute_echo(mine, theirs) == 0.0
    assert np.array_equal(mine, before)
