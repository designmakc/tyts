"""A rough draft of a call's words while it records (the owner, 2026-11-09, after comparing with a reference app).

The call panel's chunks (MediaRecorder's WebM/Opus, 10 s slices, cut anywhere in
the stream) go to disk as before and, when the recording asked for it, also into
a `Feed` per track: one growing byte stream that PyAV demuxes and decodes as it
arrives, to 16 kHz samples. One thread per call cuts each track's sound at a
pause (the VAD of stream.py) and has the dictation model on the processor read
the piece; the line is kept in memory as "Me" (`mic`) or "Others" (`system`).

It is a draft and the lowest of priorities: nothing is read while a transcript
is being made, a phrase is dictated or the speed test runs, and a track that
falls more than BEHIND seconds behind drops what it could not read (a gap in
the lines). Nothing is written to disk or logged: the lines go with the call.
The final transcript after the call is made from the chunks on disk as before.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Callable

import numpy as np

from audio import RATE
from stream import PAUSE, quietest, speech_in

log = logging.getLogger("tyts.live")

LOOK_EVERY = 2.0  # seconds of new sound before the VAD looks again
LONGEST = 20.0  # seconds: a piece nobody pauses in is cut at its quietest moment
BEHIND = 60.0  # seconds of sound waiting: more and it is dropped
LINES_KEPT = 2000
LINES_SHOWN = 30
QUIET_FOR = 180.0  # seconds without a chunk: the feed ends (the recording was cut off)
NAMES = {"mic": "me", "system": "others"}

# (sound, the track's text before) -> text
Recognize = Callable[[np.ndarray, str], str]


class Feed:
    """A byte stream read by PyAV in another thread: `read` waits for the next chunk; b"" once closed."""

    def __init__(self, quiet_for: float = QUIET_FOR):
        self._chunks: list[bytes] = []
        self._buf = b""
        self._closed = False
        self._quiet_for = quiet_for
        self._cond = threading.Condition()

    def put(self, data: bytes) -> None:
        with self._cond:
            if not self._closed:
                self._chunks.append(data)
                self._cond.notify_all()

    def close(self) -> None:
        with self._cond:
            self._closed = True
            self._cond.notify_all()

    def read(self, n: int = -1) -> bytes:
        with self._cond:
            while not self._buf and not self._chunks:
                if self._closed or not self._cond.wait(self._quiet_for):
                    self._closed = True
                    return b""
            self._buf += b"".join(self._chunks)
            self._chunks.clear()
            n = len(self._buf) if n is None or n < 0 else n
            out, self._buf = self._buf[:n], self._buf[n:]
            return out


class Track:
    """One track's chunks in order, decoded as they come; its sound not yet read, from `offset` samples."""

    def __init__(self, name: str, quiet_for: float = QUIET_FOR, run: bool = True):
        self.name = name
        self.feed = Feed(quiet_for)
        self.next = 0
        self.ended = False
        self.offset = 0  # samples of the track before `sound`
        self.sound = np.zeros(0, dtype=np.float32)
        self._parts: list[np.ndarray] = []  # decoded since the last look, joined to `sound` then
        self.looked = 0  # len(sound) at the VAD's last look
        self.before = ""
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._decode, name=f"tyts-live-{name}", daemon=True)
        if run:
            self._thread.start()

    def add(self, seq: int, data: bytes) -> None:
        """Chunks come in order (capturesend.ts); a retry is ignored, a chunk lost breaks the stream: the track stops."""
        if seq < self.next or self.ended:
            return
        if seq > self.next:
            self.stop()
            return
        self.next += 1
        self.feed.put(data)

    def stop(self) -> None:
        self.ended = True
        self.feed.close()

    def _decode(self) -> None:
        import av

        try:
            resampler = av.AudioResampler(format="flt", layout="mono", rate=RATE)
            with av.open(self.feed, format="webm", options={"probesize": "4096", "analyzeduration": "0"}) as container:
                for packet in container.demux(container.streams.audio[0]):
                    try:
                        frames = packet.decode()
                    except av.error.InvalidDataError:
                        continue
                    for frame in frames:
                        frame.pts = None
                        for out in resampler.resample(frame):
                            self._append(out.to_ndarray().reshape(-1))
        except Exception as error:
            log.info("live %s: the sound could not be read further (%s)", self.name, type(error).__name__)
        finally:
            self.ended = True

    def _append(self, samples: np.ndarray) -> None:
        with self._lock:
            self._parts.append(samples.astype(np.float32, copy=False))

    def take(self, end: int) -> np.ndarray:
        """The first `end` samples of the sound waiting, gone from it."""
        with self._lock:
            self._join()
            piece, self.sound = self.sound[:end], self.sound[end:]
            self.offset += end
            self.looked = max(0, self.looked - end)
            return piece

    def _join(self) -> None:
        if self._parts:
            self.sound = np.concatenate([self.sound, *self._parts])
            self._parts = []

    def waiting(self) -> np.ndarray:
        with self._lock:
            self._join()
            return self.sound


def cut(sound: np.ndarray, speech: Callable[[np.ndarray], list[tuple[int, int]]], done: bool = False) -> int:
    """Where the next piece ends: after the last speech followed by a pause, at the quietest moment of a piece
    too long, the whole sound once it is all here; 0 for no piece yet. Sound without speech is all a piece
    (the caller drops it unread)."""
    if done:
        return len(sound)
    spans = speech(sound)
    if not spans:
        # Silence: dropped, but the last pause's worth kept, a word may start there.
        return max(0, len(sound) - int(PAUSE * RATE))
    closed = [end for _, end in spans if end <= len(sound) - int(PAUSE * RATE)]
    if closed:
        return closed[-1]
    if len(sound) >= LONGEST * RATE:
        return quietest(sound, len(sound) - 3 * RATE, len(sound))
    return 0


class Live:
    """One call's draft: its tracks, the thread that reads them, the lines so far."""

    def __init__(self, tracks: list[str], recognize: Recognize, may_run: Callable[[], bool], speech=speech_in, quiet_for: float = QUIET_FOR, every: float = 1.0, run: bool = True):
        """`run`: False in tests, which feed the sound and step it themselves."""
        self.tracks = {name: Track(name, quiet_for, run) for name in tracks if name in NAMES}
        self.lines: list[dict] = []
        self.state = "listening"  # listening, paused (something else is reading), failed, done
        self._recognize = recognize
        self._may_run = may_run
        self._speech = speech
        self._every = every
        self._stopped = False
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._run, name="tyts-live", daemon=True)
        if run:
            self._thread.start()

    def add(self, track: str, seq: int, data: bytes) -> None:
        t = self.tracks.get(track)
        if t is not None:
            t.add(seq, data)

    def stop(self) -> None:
        self._stopped = True
        for t in self.tracks.values():
            t.stop()

    def view(self) -> dict:
        with self._lock:
            return {"state": self.state, "lines": self.lines[-LINES_SHOWN:]}

    def _line(self, track: str, at: float, text: str = "", gap: bool = False) -> None:
        with self._lock:
            last = self.lines[-1] if self.lines else None
            if gap and last and last.get("gap") and last["who"] == NAMES[track]:
                return
            self.lines.append({"who": NAMES[track], "at": round(at, 1), **({"gap": True} if gap else {"text": text})})
            del self.lines[:-LINES_KEPT]

    def step(self) -> bool:
        """One look at every track; True when something was read or dropped."""
        did = False
        allowed = self._may_run()
        self.state = "listening" if allowed else "paused"
        for t in self.tracks.values():
            sound = t.waiting()
            if len(sound) > BEHIND * RATE:
                at = t.offset / RATE
                t.take(len(sound) - int(PAUSE * RATE))
                self._line(t.name, at, gap=True)
                did = True
                continue
            done = t.ended
            if not allowed or (not done and len(sound) - t.looked < LOOK_EVERY * RATE):
                continue
            t.looked = len(sound)
            end = cut(sound, self._speech, done)
            if not end:
                continue
            at = t.offset / RATE
            piece = t.take(end)
            did = True
            if not self._speech(piece):
                continue
            text = self._recognize(piece, t.before).strip()
            if text:
                t.before = text
                self._line(t.name, at, text)
        return did

    def finished(self) -> bool:
        return all(t.ended and not len(t.waiting()) for t in self.tracks.values())

    def _run(self) -> None:
        try:
            while not self._stopped and not self.finished():
                if not self.step():
                    time.sleep(self._every)
        except Exception as error:
            self.state = "failed"
            log.warning("live: stopped (%s)", type(error).__name__)
            return
        self.state = "done"


class Lives:
    """The calls recording now with their drafts, by the recording's id."""

    def __init__(self):
        self._lives: dict[str, Live] = {}
        self._lock = threading.Lock()

    def open(self, id: str, live: Live) -> Live:
        with self._lock:
            # A recording cut off (jobs.py finished it, nobody called stop): its draft goes with the next call.
            for old in [k for k, v in self._lives.items() if v.state in ("done", "failed")]:
                del self._lives[old]
            self._lives[id] = live
        return live

    def get(self, id: str) -> Live | None:
        return self._lives.get(id)

    def add(self, id: str, track: str, seq: int, data: bytes) -> None:
        live = self._lives.get(id)
        if live is not None:
            live.add(track, seq, data)

    def stop(self, id: str) -> None:
        with self._lock:
            live = self._lives.pop(id, None)
        if live is not None:
            live.stop()
