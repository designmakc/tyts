"""A dictation heard while it is spoken.

The badge sends the microphone as it records: raw 16-bit PCM at 16 kHz, a
quarter of a second at a time. The session keeps it all and, every half
second, looks with the VAD (Silero, inside faster-whisper) at what is not yet
recognized: a stretch of speech followed by a pause of 0.6 s or more is a piece
of its own, and one thread recognizes the pieces in order while the person
goes on talking. When the key is let go, only the tail is left to recognize;
and when the person stopped a moment before letting go (the usual case), the
tail was recognized already, as a guess made in that pause.

Whisper pays a full 30 s window for any piece, so its pieces are long (4 s or
more on the processor, 10 s on the card); Parakeet costs what the sound lasts,
so its pieces may be short. Whisper's language is found once, on the first
piece, among the expected ones (the person's own, English), and kept; each
piece is told the text before it, so it goes on in its style. A guess or a
preview only settles it by standing for a whole piece: on one word before a
pause Whisper took Russian for English, and the whole phrase came out an
English translation (2026-11-05).

Nothing is kept: the sound lives in memory until the session is over.
"""

from __future__ import annotations

import logging
import secrets
import threading
import time
from typing import Callable

import numpy as np

from audio import RATE

log = logging.getLogger("tyts.stream")

PAUSE = 0.6  # seconds of silence that end a piece
PAD = 0.2  # seconds of silence kept after the speech of a piece
SCAN_EVERY = 0.5  # seconds of new sound between two looks at what is not recognized yet
GUESS_AFTER = 0.3  # seconds of silence after speech before the open tail is recognized ahead
QUIET_TAIL = 3.0  # seconds before the longest piece where a cut is looked for when nobody pauses
STALE = 30.0  # seconds without a chunk before a session is thrown away
# (shortest piece, longest piece) in seconds, per recognizer and device.
PIECES = {("whisper", "cpu"): (4.0, 25.0), ("whisper", "cuda"): (10.0, 25.0), ("parakeet", "cpu"): (1.5, 20.0)}
# Someone who talks without pausing still sees the words: every so many seconds of new speech, the
# last few seconds are recognized only to be shown. Only where that is cheap (Whisper on the
# processor pays a whole window each time, so it shows words at the pauses only).
PREVIEW_EVERY = {("parakeet", "cpu"): 2.0, ("whisper", "cuda"): 3.0}
PREVIEW_SPAN = 6.0

# (sound, language or None, expected languages, text before) -> (text, language, how sure)
Recognize = Callable[[np.ndarray, "str | None", list, str], "tuple[str, str, float]"]


def speech_in(samples: np.ndarray) -> list[tuple[int, int]]:
    """Stretches of speech as (start, end) samples; pauses shorter than PAUSE stay inside them."""
    if len(samples) < RATE // 4:
        return []
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    chunks = get_speech_timestamps(samples, VadOptions(min_silence_duration_ms=int(PAUSE * 1000), speech_pad_ms=0, min_speech_duration_ms=150))
    return [(c["start"], c["end"]) for c in chunks]


def quietest(samples: np.ndarray, start: int, end: int) -> int:
    """The middle of the quietest 100 ms between start and end."""
    window = RATE // 10
    best, at = float("inf"), (start + end) // 2
    for i in range(max(0, start), max(start + 1, end - window), window // 2):
        energy = float(np.mean(samples[i : i + window] ** 2))
        if energy < best:
            best, at = energy, i + window // 2
    return at


class Session:
    """One dictation: chunks in, pieces recognized in order, the whole text out."""

    def __init__(self, recognize: Recognize, kind: tuple[str, str], expected: list[str], language: str | None = None, speech=speech_in):
        self.id = secrets.token_hex(6)
        self._recognize = recognize
        self._speech = speech
        self.shortest, self.longest = PIECES.get(kind, (4.0, 25.0))
        self.preview_every = PREVIEW_EVERY.get(kind)
        self._preview: tuple[int, str] | None = None  # (where the open sound ended, its last words) shown meanwhile
        self.expected = expected
        self.language = language
        self.sure = 1.0 if language else 0.0
        self._sound = np.zeros(0, dtype=np.float32)
        self._parts: list[np.ndarray] = []
        self._length = 0
        self._seen: set[int] = set()
        self._cut = 0  # samples before this are in a closed piece
        self._open: tuple[int, int, list[tuple[int, int]]] | None = None  # (cut, length, speech spans) of the last look
        self._pieces: list[tuple[int, int]] = []  # closed, waiting to be recognized
        self._texts: list[str] = []
        self._guess: tuple[int, int, str, str, float] | None = None  # (start, end, text, language, sure): the open tail recognized ahead
        self._working: tuple[str, int, int] | None = None  # (piece|guess, start, end) being recognized
        self.state = "listening"  # listening, finishing, done, cancelled, failed
        self.error = ""
        self.took = 0.0
        self.touched = time.monotonic()
        self._lock = threading.Condition()
        self._thread = threading.Thread(target=self._run, name=f"tyts-session-{self.id}", daemon=True)
        self._thread.start()

    # ---------------------------------------------------------------- sound in

    def _whole(self) -> np.ndarray:
        if self._parts:
            self._sound = np.concatenate([self._sound, *self._parts])
            self._parts = []
        return self._sound

    def _append(self, pcm: bytes) -> None:
        if len(pcm) % 2:
            pcm = pcm[:-1]
        samples = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
        if len(samples):
            self._parts.append(samples)
            self._length += len(samples)

    def add(self, seq: int, pcm: bytes) -> None:
        """A chunk of 16-bit PCM; a chunk sent twice (a retry) counts once."""
        with self._lock:
            self.touched = time.monotonic()
            if self.state != "listening" or seq in self._seen:
                return
            self._seen.add(seq)
            self._append(pcm)
            looked = self._open[1] if self._open else 0
            if (self._length - looked) / RATE >= SCAN_EVERY:
                self._lock.notify_all()

    # ---------------------------------------------------------------- cutting

    def _look(self) -> list[tuple[int, int]]:
        """The speech in the open sound, from the VAD (lock held); looked at again only when there is more sound."""
        if not self._open or self._open[0] != self._cut or self._open[1] != self._length:
            self._open = (self._cut, self._length, self._speech(self._whole()[self._cut :]))
        return self._open[2]

    def _scan(self) -> None:
        """Closes the pieces the open sound holds now (lock held)."""
        open_len = self._length - self._cut
        if open_len <= 0:
            return
        spans = self._look()
        if not spans:
            # Silence only: dropped, but for a little in front of what may come.
            if open_len > 2 * RATE:
                self._cut = self._length - RATE // 2
                self._guess = None
            return
        heard = 0
        cut = None
        for i, (start, end) in enumerate(spans):
            heard += end - start
            nxt = spans[i + 1][0] if i + 1 < len(spans) else open_len
            if (nxt - end) / RATE >= PAUSE and heard / RATE >= self.shortest:
                cut = (end + min(int(PAD * RATE), (nxt - end) // 2), end)
        if cut is None and open_len / RATE >= self.longest:
            at = quietest(self._whole()[self._cut :], int((self.longest - QUIET_TAIL) * RATE), int(self.longest * RATE))
            cut = (at, None)
        if cut is not None:
            self._close(self._cut + cut[0], self._cut + cut[1] if cut[1] is not None else None)

    def _close(self, end: int, speech_end: int | None) -> None:
        """Ends a piece at `end`; the guess stands for it when it covered all its speech (lock held)."""
        start = self._cut
        self._cut = end
        guess, self._guess = self._guess, None
        if speech_end is not None and guess and guess[0] == start and speech_end <= guess[1]:
            if guess[2]:
                self._texts.append(guess[2])
            self._settle(guess[3], guess[4])
            return
        self._pieces.append((start, end))

    def _settle(self, language: str, sure: float) -> None:
        """The first whole piece decides the language for the rest (lock held)."""
        if self.language is None and language:
            self.language, self.sure = language, sure

    def _ahead(self) -> tuple[int, int] | None:
        """The open tail worth recognizing ahead: speech that ended a moment ago, not recognized yet (lock held)."""
        open_len = self._length - self._cut
        if open_len < RATE // 2:
            return None
        spans = self._look()
        if not spans:
            return None
        end = spans[-1][1]
        if (open_len - end) / RATE < GUESS_AFTER:
            return None
        if self._guess and self._guess[0] == self._cut and self._guess[1] >= self._cut + end:
            return None
        return self._cut, self._cut + min(open_len, end + int(PAD * RATE))

    # ---------------------------------------------------------------- recognizing

    def _next(self) -> tuple[str, int, int] | None:
        """What to recognize now, None when the session is over (lock held; waits)."""
        while True:
            if self.state in ("cancelled", "done", "failed"):
                return None
            if self.state == "listening":
                self._scan()
            if self._pieces:
                start, end = self._pieces.pop(0)
                return "piece", start, end
            if self.state == "finishing":
                self.state = "done"
                self._lock.notify_all()
                return None
            if self.state == "listening":
                ahead = self._ahead()
                if ahead:
                    return "guess", *ahead
                preview = self._previewable()
                if preview:
                    return "preview", *preview
            self._lock.wait(timeout=SCAN_EVERY)

    def _previewable(self) -> tuple[int, int] | None:
        """The last seconds of a long open stretch, to show what is heard (lock held)."""
        if not self.preview_every:
            return None
        open_len = self._length - self._cut
        shown = self._preview[0] if self._preview and self._preview[0] > self._cut else self._cut
        if open_len < RATE or (self._length - shown) / RATE < self.preview_every or not self._look():
            return None
        return max(self._cut, self._length - int(PREVIEW_SPAN * RATE)), self._length

    def _run(self) -> None:
        while True:
            with self._lock:
                job = self._next()
                if job is None:
                    return
                self._working = job
                sound = self._whole()[job[1] : job[2]]
                before = " ".join(self._texts)
            try:
                started = time.perf_counter()
                text, language, sure = self._recognize(sound, self.language, self.expected, before)
                spent = time.perf_counter() - started
            except Exception as error:
                log.exception("a piece of dictation failed")
                with self._lock:
                    self.state = "failed"
                    self.error = str(error) or type(error).__name__
                    self._working = None
                    self._lock.notify_all()
                return
            with self._lock:
                self.took += spent
                self._working = None
                if job[0] == "piece":
                    self._settle(language, sure)
                    if text:
                        self._texts.append(text)
                elif job[0] == "preview":
                    self._preview = (job[2], text)
                elif self._cut == job[1]:
                    self._guess = (job[1], job[2], text, language, sure)
                self._lock.notify_all()

    # ---------------------------------------------------------------- out

    def status(self) -> dict:
        """How long it is, how much sound waits behind the piece being recognized (the engine falling behind), and
        everything heard so far (the badge decides how much of it fits)."""
        with self._lock:
            waiting = sum(e - s for s, e in self._pieces)
            tail = self._guess[2] if self._guess and self._guess[0] == self._cut else self._preview[1] if self._preview and self._preview[0] > self._cut else ""
            heard = " ".join(t for t in self._texts + [tail] if t)
            return {"state": self.state, "seconds": round(self._length / RATE, 2), "pending": round(waiting / RATE, 2), "heard": heard}

    def finish(self, pcm: bytes, timeout: float = 120.0) -> dict:
        """The last chunk; waits for every piece; the whole text."""
        until = time.monotonic() + timeout
        with self._lock:
            self.touched = time.monotonic()
            if self.state == "listening":
                self._append(pcm)
                # A guess being made of the tail now is worth its wait: it is what the tail needs
                # (a preview is only for show: the tail is recognized whole after it).
                while self._working and self._working[0] in ("guess", "preview") and time.monotonic() < until:
                    self._lock.wait(timeout=0.1)
            # The guess may have failed meanwhile: then there is nothing to finish.
            if self.state == "listening":
                self._scan()
                if self._length > self._cut:
                    spans = self._look()
                    if spans:
                        self._close(self._length, self._cut + spans[-1][1])
                    else:
                        self._cut = self._length
                self.state = "finishing"
                self._lock.notify_all()
            while self.state == "finishing" and time.monotonic() < until:
                self._lock.wait(timeout=0.2)
            if self.state == "failed":
                raise RuntimeError(self.error)
            if self.state != "done":
                raise TimeoutError("the dictation took too long")
            return {
                "text": " ".join(t for t in self._texts if t).strip(),
                "language": self.language or "",
                "sure": round(self.sure, 3),
                "seconds": round(self._length / RATE, 2),
                "took": round(self.took, 2),
            }

    def cancel(self) -> None:
        with self._lock:
            if self.state in ("listening", "finishing"):
                self.state = "cancelled"
            self._lock.notify_all()

    @property
    def over(self) -> bool:
        return self.state in ("done", "cancelled", "failed")


class Sessions:
    """The dictations going on: one at a time (a new one ends the one before)."""

    def __init__(self):
        self._lock = threading.Lock()
        self._sessions: dict[str, Session] = {}

    def open(self, session: Session) -> Session:
        with self._lock:
            for old in self._sessions.values():
                old.cancel()
            self._sessions = {session.id: session}
        return session

    def get(self, id: str) -> Session | None:
        self.sweep()
        with self._lock:
            return self._sessions.get(id)

    def drop(self, id: str) -> None:
        with self._lock:
            s = self._sessions.pop(id, None)
        if s:
            s.cancel()

    def sweep(self) -> None:
        now = time.monotonic()
        with self._lock:
            for id, s in list(self._sessions.items()):
                if now - s.touched > STALE or (s.over and now - s.touched > 5):
                    s.cancel()
                    del self._sessions[id]

    def active(self) -> bool:
        with self._lock:
            return any(not s.over for s in self._sessions.values())
