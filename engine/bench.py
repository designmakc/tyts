"""How fast each model runs on this computer.

A short test (`Calibrator`, run when the person agrees in Tyts) measures every
model already downloaded on a bundled clip: a 7 s phrase as Dictate recognizes it,
and 30 s as Transcribe does. Real use keeps the numbers up afterwards: every
transcription's words and speakers, every dictated phrase. Tyts reads them from
/health (`bench`) and chooses the models from them (src/speechplan.ts).

Kept in speech.json as {fingerprint, at, runs: {"model|device|compute": {phrase, rtf, n, at, source, tested}}};
`tested` keeps the test's own numbers, against which real use far slower is not counted (`OUTLIER`).
The fingerprint is this computer's (processor, memory, cards, driver), as Tyts
sends it with the plan: on another computer the numbers start again.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import audio
from asr import CudaFailed, backend, recognizer
from audio import RATE

log = logging.getLogger("tyts.bench")

# ~39 s of English read by Tyts's natural voice (Kokoro): made for this test, nobody's recording.
CLIP = Path(__file__).resolve().parent / "calibration" / "clip.ogg"
PHRASE_SECONDS = 7
# One 30 s window, as each of a long recording's: more would count a part-filled second window as a whole one.
WINDOW_SECONDS = 29
# A test's number replaces the old one; real use moves it this far towards what it saw.
USE_WEIGHT = 0.25
# Real use this many times slower than the test (or than the number so far) is another program on the
# card or the processor, not the model's speed: not counted (2026-10-31, an emulator on the card made
# turbo's phrases 2 s against 0.22 s tested, and the plan walked dictation down to base for good).
OUTLIER = 3.0
# Real use shorter than this says little: loading and the first window weigh too much.
SHORTEST = {"words": 60.0, "speakers": 120.0, "phrase": (3.0, 15.0), "proportional": (1.5, 30.0)}


def key(model: str, device: str, compute: str) -> str:
    return f"{model}|{device}|{compute}"


def speakers_key(device: str) -> str:
    return f"speakers|{device}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Bench:
    def __init__(self, settings):
        self.settings = settings
        self._lock = threading.Lock()

    def runs(self) -> dict:
        return dict(self.settings["bench"].get("runs", {}))

    def reset(self, fingerprint: str) -> None:
        """Another computer (or a new card, driver): its own numbers from now on."""
        with self._lock:
            self.settings.update({"bench": {"fingerprint": fingerprint, "runs": {}}})

    def record(self, name: str, source: str = "use", **values: float) -> None:
        """phrase (seconds for a 7 s phrase) and/or rtf (seconds per second of sound) for one model on one device."""
        with self._lock:
            bench = dict(self.settings["bench"])
            runs = dict(bench.get("runs", {}))
            run = dict(runs.get(name, {}))
            tested = dict(run.get("tested") or {})
            counted = False
            for field, value in values.items():
                if value is None or value <= 0:
                    continue
                old = run.get(field)
                if source == "test":
                    tested[field] = round(value, 4)
                    mixed = value
                elif old is None:
                    mixed = value
                else:
                    usual = tested.get(field, old)
                    if value > usual * OUTLIER:
                        log.info("%s: %s %.2f against %.2f usual here: something else is busy, not counted", name, field, value, usual)
                        continue
                    mixed = old + (value - old) * USE_WEIGHT
                run[field] = round(mixed, 4)
                counted = True
            if not counted:
                return
            if tested:
                run["tested"] = tested
            run["n"] = int(run.get("n", 0)) + 1
            run["at"] = _now()
            run["source"] = "test" if source == "test" or run.get("source") == "test" else "use"
            runs[name] = run
            bench["runs"] = runs
            bench["at"] = run["at"]
            self.settings.update({"bench": bench})

    def failed(self, name: str, reason: str) -> None:
        with self._lock:
            bench = dict(self.settings["bench"])
            runs = dict(bench.get("runs", {}))
            runs[name] = {**runs.get(name, {}), "failed": reason[:200], "at": _now()}
            bench["runs"] = runs
            self.settings.update({"bench": bench})

    def phrase(self, model: str, device: str, compute: str, seconds: float, took: float) -> None:
        """A dictated phrase (or a piece of one) as it went: Whisper's cost is mostly one 30 s window, so a phrase
        of a few seconds stands for a 7 s one; Parakeet's follows the length, so it is scaled to 7 s."""
        if backend(model) == "parakeet":
            low, high = SHORTEST["proportional"]
            if low <= seconds <= high:
                self.record(key(model, device, compute), phrase=took * PHRASE_SECONDS / seconds)
            return
        low, high = SHORTEST["phrase"]
        if low <= seconds <= high:
            self.record(key(model, device, compute), phrase=took)

    def words(self, model: str, device: str, compute: str, seconds: float, took: float) -> None:
        if seconds >= SHORTEST["words"]:
            self.record(key(model, device, compute), rtf=took / seconds)

    def speakers(self, device: str, seconds: float, took: float) -> None:
        if seconds >= SHORTEST["speakers"]:
            self.record(speakers_key(device), rtf=took / seconds)


class Calibrator:
    """The test: each asked model loaded fresh, run on the clip, its times kept; one model after another,
    and only while the engine has nothing else to do (a job or a phrase that comes meanwhile goes first,
    and the step it disturbed runs again)."""

    def __init__(self, bench: Bench, idle, unload, busy_count, threads):
        self.bench = bench
        self._idle = idle  # () -> bool: no transcription running or queued
        self._unload = unload  # () -> None: the engine's own models off, so the test has the memory
        self._busy_count = busy_count  # () -> int: grows with every phrase and job started
        self._threads = threads  # () -> int
        self._thread: threading.Thread | None = None
        self.state = "idle"  # idle, waiting, running, done, failed
        self.done = 0
        self.total = 0
        self.current = ""
        self.message = ""
        self.at = ""

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def status(self) -> dict:
        return {"state": self.state, "done": self.done, "total": self.total, "current": self.current, "message": self.message, "at": self.at}

    def start(self, runs: list[dict], expected: list[str]) -> bool:
        """runs: [{model, device, compute, beam}]. False when a test is already going."""
        if self.running:
            return False
        runs = [r for r in runs if isinstance(r, dict) and r.get("model")]
        self.total = len(runs) * 2
        self.done = 0
        self.message = ""
        self.state = "waiting"
        self._thread = threading.Thread(target=self._run, args=(runs, expected), name="tyts-calibrate", daemon=True)
        self._thread.start()
        return True

    def _wait_idle(self) -> None:
        while not self._idle():
            self.state = "waiting"
            time.sleep(1.0)
        self.state = "running"

    def _step(self, measure):
        """Runs one measurement while nothing else runs; again (once) when something started meanwhile."""
        for _ in range(3):
            self._wait_idle()
            before = self._busy_count()
            value = measure()
            if self._busy_count() == before:
                return value
            log.info("the test was disturbed; measuring again")
        return value

    def _run(self, runs: list[dict], expected: list[str]) -> None:
        try:
            clip = audio.decode(CLIP)
            phrase = clip[: PHRASE_SECONDS * RATE]
            samples = clip[: WINDOW_SECONDS * RATE]
            length = len(samples) / RATE
            self._wait_idle()
            self._unload()
            for run in runs:
                model, device = run["model"], run.get("device", "cpu")
                self.current = model
                t = recognizer(model)
                try:
                    self._wait_idle()
                    t.load(model, device, run.get("compute"), self._threads())
                    t.warm()
                except CudaFailed as error:
                    self.bench.failed(key(model, device, run.get("compute") or "float16"), str(error))
                    self.done += 2
                    continue
                name = key(model, device, t.compute or "int8")
                beam = int(run.get("beam") or (5 if device == "cuda" else 2))

                def dictation() -> float:
                    best = float("inf")
                    for _ in range(2):
                        started = time.perf_counter()
                        t.dictate(phrase, None, expected, "", beam)
                        best = min(best, time.perf_counter() - started)
                    return best

                def transcription() -> float:
                    started = time.perf_counter()
                    t.transcribe(samples, "en")
                    return (time.perf_counter() - started) / length

                took = self._step(dictation)
                self.done += 1
                # Parakeet dictates only: its long-recording time is not asked.
                rtf = self._step(transcription) if hasattr(t, "transcribe") else None
                self.done += 1
                self.bench.record(name, source="test", phrase=took, rtf=rtf)
                log.info("test: %s phrase %.2f s, rtf %s", name, took, rtf)
                t.unload()
            self.state = "done"
            self.at = _now()
        except Exception as error:
            log.exception("the test failed")
            self.state = "failed"
            self.message = str(error) or type(error).__name__
        finally:
            self.current = ""
