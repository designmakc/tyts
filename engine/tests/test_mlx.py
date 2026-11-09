import sys
import types

import numpy as np

import asr
from audio import RATE
from settings import clean_plan


def fake_mlx(monkeypatch, tmp_path, result):
    """mlx_whisper as a module of our own: what it was called with, and the answer given."""
    calls = []
    module = types.ModuleType("mlx_whisper")
    module.transcribe = lambda audio, **kw: calls.append(kw) or result
    monkeypatch.setitem(sys.modules, "mlx_whisper", module)
    monkeypatch.setattr(asr, "mlx_ready", lambda: True)
    monkeypatch.setattr(asr, "fetch", lambda name: str(tmp_path))
    return calls


RESULT = {
    "text": " Hello there. OldName works.",
    "language": "en",
    "segments": [
        {"start": 0.0, "end": 1.5, "text": " Hello there.", "avg_logprob": -0.2, "no_speech_prob": 0.01,
         "words": [{"word": " Hello", "start": 0.0, "end": 0.6, "probability": 0.9}, {"word": " there.", "start": 0.6, "end": 1.5, "probability": 0.9}, {"word": " ", "start": 1.5, "end": 1.5, "probability": 0.1}]},
        {"start": 1.5, "end": 3.0, "text": " OldName works.", "avg_logprob": -0.3, "no_speech_prob": 0.02,
         "words": [{"word": " OldName", "start": 1.5, "end": 2.0, "probability": 0.8}, {"word": " works.", "start": 2.0, "end": 3.0, "probability": 0.9}]},
    ],
}


def test_metal_transcribes_as_faster_whisper_does(monkeypatch, tmp_path):
    calls = fake_mlx(monkeypatch, tmp_path, RESULT)
    # Speech from 2 s to 5 s, the rest silence: only the speech is read, its times put back on the recording's.
    monkeypatch.setattr(asr, "speech_spans", lambda samples: [(2 * RATE, 5 * RATE)])
    t = asr.Transcriber()
    t.load("large-v3-turbo", "cpu", "mlx")
    assert (t.device, t.compute, t.loaded) == ("metal", "mlx", True)
    seen = []
    segments, language = t.transcribe(np.zeros(RATE * 8, np.float32), None, "OldName, Tyts", seen.append)
    assert language == "en"
    assert segments == [
        {"start": 2.0, "end": 3.5, "text": "Hello there.", "words": [{"start": 2.0, "end": 2.6, "word": " Hello"}, {"start": 2.6, "end": 3.5, "word": " there."}]},
        {"start": 3.5, "end": 5.0, "text": "OldName works.", "words": [{"start": 3.5, "end": 4.0, "word": " OldName"}, {"start": 4.0, "end": 5.0, "word": " works."}]},
    ]
    assert seen == [1.0]
    kw = calls[0]
    assert kw["word_timestamps"] and kw["language"] is None and kw["path_or_hf_repo"] == str(tmp_path)
    assert kw["initial_prompt"] == "OldName, Tyts"


def test_a_long_call_goes_batch_by_batch(monkeypatch, tmp_path):
    calls = fake_mlx(monkeypatch, tmp_path, RESULT)
    # Two batches of speech: the bar moves after each, the language found first holds, the text before is the prompt.
    monkeypatch.setattr(asr, "speech_spans", lambda samples: [(0, 30 * RATE), (40 * RATE, 70 * RATE)])
    monkeypatch.setitem(asr.BATCH_SPEECH, "whisper", 30)
    t = asr.Transcriber()
    t.load("large-v3-turbo", "metal")
    seen = []
    segments, language = t.transcribe(np.zeros(RATE * 80, np.float32), None, "", seen.append)
    assert seen == [0.5, 1.0] and language == "en" and len(calls) == 2
    assert calls[1]["language"] == "en" and calls[1]["initial_prompt"] == "Hello there. OldName works."
    assert [s["start"] for s in segments] == [0.0, 1.5, 40.0, 41.5]


def test_silence_alone_gives_no_words(monkeypatch, tmp_path):
    calls = fake_mlx(monkeypatch, tmp_path, RESULT)
    monkeypatch.setattr(asr, "speech_spans", lambda samples: [])
    t = asr.Transcriber()
    t.load("large-v3-turbo", "metal")
    assert t.transcribe(np.zeros(RATE * 8, np.float32), "ru") == ([], "ru") and calls == []


def test_batches_join_spans_and_times_come_back():
    spans = [(0, 10 * RATE), (12 * RATE, 22 * RATE), (30 * RATE, 75 * RATE)]
    assert asr.batches(spans, 20) == [spans[:2], spans[2:]]
    joined = asr.Joined(np.zeros(RATE * 80, np.float32), spans[:2])
    assert len(joined.sound) == 20 * RATE
    assert (joined.at(0), joined.at(9.5), joined.at(10), joined.at(15)) == (0.0, 9.5, 12.0, 17.0)


def test_parakeet_transcribes_a_call_with_word_times(monkeypatch):
    class Result:
        tokens = [" При", "вет", ",", " мир", "."]
        timestamps = [0.0, 0.2, 0.4, 0.6, 0.9]

    class Model:
        def with_timestamps(self):
            return self

        def recognize(self, sound):
            return Result()

    monkeypatch.setattr(asr, "speech_spans", lambda samples: [(5 * RATE, 7 * RATE)])
    p = asr.Parakeet()
    p._model = Model()
    seen = []
    segments, language = p.transcribe(np.zeros(RATE * 10, np.float32), None, "", seen.append)
    assert language == "ru" and seen == [1.0]
    assert segments == [{"start": 5.0, "end": 6.8, "text": "Привет, мир.", "words": [
        {"start": 5.0, "end": 5.6, "word": " Привет,"}, {"start": 5.6, "end": 6.8, "word": " мир."}]}]


def test_metal_dictates_in_the_persons_own_language_when_it_cannot_tell(monkeypatch, tmp_path):
    calls = fake_mlx(monkeypatch, tmp_path, {"text": "привет", "language": "ru", "segments": [{"text": " Привет.", "avg_logprob": -0.1, "no_speech_prob": 0.01}]})
    monkeypatch.setattr(asr.MlxWhisper, "detect", lambda self, speech: None)
    t = asr.Transcriber()
    t.load("large-v3-turbo", "metal")
    text, language, _ = t._model.dictate(np.zeros(RATE, np.float32), None, ("ru", "en"), "", "", True)
    assert (text, language) == ("Привет.", "ru") and calls[0]["language"] == "ru"


def test_metal_dictation_picks_among_the_expected(monkeypatch, tmp_path):
    fake_mlx(monkeypatch, tmp_path, {"text": "", "segments": []})
    # English 3 times as likely as Russian, the person's own: under OWN_LEAN, so Russian.
    monkeypatch.setattr(asr.MlxWhisper, "detect", lambda self, speech: {"en": 0.6, "ru": 0.2, "de": 0.2})
    t = asr.Transcriber()
    t.load("large-v3-turbo", "metal")
    assert t._model.dictate(np.zeros(RATE, np.float32), None, ("ru", "en"), "", "", True)[1] == "ru"


def test_without_mlx_metal_falls_back_to_the_processor(monkeypatch):
    monkeypatch.setattr(asr, "mlx_ready", lambda: False)
    loaded = []
    monkeypatch.setattr(asr, "_fetch_whisper", lambda name: loaded.append(name) or "/nowhere")
    fw = types.ModuleType("faster_whisper")
    fw.WhisperModel = lambda path, **kw: kw
    monkeypatch.setitem(sys.modules, "faster_whisper", fw)
    t = asr.Transcriber()
    t.load("large-v3-turbo", "metal")
    assert (t.device, t.compute, loaded) == ("cpu", "int8", ["large-v3-turbo"])


def test_the_plan_keeps_mlx_for_turbo_only():
    plan = clean_plan({"cpu": {"transcripts": {"model": "large-v3-turbo", "compute": "mlx"}, "dictation": {"model": "small", "compute": "mlx"}}})
    assert plan == {"cpu": {"transcripts": {"model": "large-v3-turbo", "compute": "mlx"}, "dictation": {"model": "small"}}}
