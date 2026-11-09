"""Voices recognised across meetings (2026-11-09): a voice print per name the person gave.

A transcript's speakers each get a voice print (the diarizer's mean embedding of their turns,
`keep`). When the person names a speaker, that print is filed under the name, one per meeting
(`learn`); the name's print is the mean of its meetings. A new transcript's speakers are compared
with the names' prints by cosine similarity, and a close one is only *suggested* ("probably
Sasha", `suggest`); the person accepts it (which names the speaker, and so files one meeting
more) or rejects it (the transcript's `voiceRejected`, never suggested for that speaker again).

The prints are the person's: kept only in APP_DIR/voices.json on this computer (never in the
transcripts folder, which the person may choose and share), never logged, removed only by the
person (one name, or all) and, for a meeting's unnamed speakers, with the meeting.
"""

from __future__ import annotations

import json
import os
import re
import threading
from pathlib import Path

import numpy as np

from settings import APP_DIR

# Cosine similarity at which a stored voice is suggested. FluidAudio (the same WeSpeaker
# ResNet34 model as pyannote community-1) gives a turn to a known speaker within one meeting
# at distance 0.65, and refines a speaker's print only within 0.45; across meetings (another
# microphone, another day) only the stricter bound is taken: similarity 0.55.
THRESHOLD = 0.55
# The names merge.renumber gives: a speaker so named is not named yet.
UNNAMED = re.compile(r"(Speaker \d+|Me)")
# ponytail: the prints of the latest meetings only; ~8 KB a meeting, so the file stays under ~3 MB.
MEETINGS_KEPT = 300


def unit(vector) -> np.ndarray | None:
    try:
        v = np.asarray(vector, dtype=np.float64).ravel()
    except (TypeError, ValueError):
        return None
    n = float(np.linalg.norm(v)) if v.size else 0.0
    return v / n if np.isfinite(n) and n > 0 else None


def short(v: np.ndarray) -> list[float]:
    return [round(float(x), 5) for x in v]


def keyed(raw: dict, labels: list[str], keys: list[str]) -> dict[str, np.ndarray]:
    """The diarizer's prints by its labels → by the transcript's keys (S1…), from each utterance's
    label before merge.renumber and its key after."""
    out = {}
    for label, key in zip(labels, keys):
        if key not in out and label in raw:
            v = unit(raw[label])
            if v is not None:
                out[key] = v
    return out


class Voices:
    """voices.json: {"names": {name: {meeting: {"key", "print"}}}, "meetings": {meeting: {key: print}}}."""

    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()

    def _read(self) -> dict:
        try:
            data = json.loads(self.path.read_text("utf-8"))
        except (OSError, ValueError):
            data = {}
        if not isinstance(data, dict):
            data = {}
        return {"names": data.get("names") or {}, "meetings": data.get("meetings") or {}}

    def _write(self, data: dict) -> None:
        data = {"names": {n: m for n, m in data["names"].items() if m}, "meetings": {k: v for k, v in data["meetings"].items() if v}}
        if not data["names"] and not data["meetings"]:
            self.path.unlink(missing_ok=True)
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        part = self.path.with_suffix(".part")
        part.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
        os.replace(part, self.path)

    def keep(self, meeting: str, prints: dict[str, np.ndarray]) -> None:
        """A meeting's speakers' prints by key, replacing what it had (a split made again)."""
        with self._lock:
            data = self._read()
            data["meetings"][meeting] = {key: short(v) for key, v in prints.items()}
            # Meeting ids begin with their date (store.new_id): the oldest go first.
            for old in sorted(data["meetings"])[:-MEETINGS_KEPT]:
                del data["meetings"][old]
            self._write(data)

    def drop_meeting(self, meeting: str) -> None:
        """A deleted meeting's prints; what was filed under a name stays, the person confirmed it."""
        with self._lock:
            data = self._read()
            if data["meetings"].pop(meeting, None) is not None:
                self._write(data)

    def learn(self, name: str, meeting: str, key: str) -> bool:
        """`key` of `meeting` is `name`: its print is filed there, out of any name it was under before."""
        name = name.strip()
        if not name or UNNAMED.fullmatch(name):
            return False
        with self._lock:
            data = self._read()
            v = unit(data["meetings"].get(meeting, {}).get(key))
            if v is None:
                return False
            for meetings in data["names"].values():
                if meetings.get(meeting, {}).get("key") == key:
                    del meetings[meeting]
            data["names"].setdefault(name, {})[meeting] = {"key": key, "print": short(v)}
            self._write(data)
            return True

    def forget(self, name: str | None = None) -> None:
        """One name's prints, or (None) every print, the meetings' too."""
        with self._lock:
            data = self._read()
            if name is None:
                data = {"names": {}, "meetings": {}}
            else:
                data["names"].pop(name, None)
            self._write(data)

    def list(self) -> list[dict]:
        names = self._read()["names"]
        return sorted(({"name": n, "meetings": len(m)} for n, m in names.items()), key=lambda x: x["name"].lower())

    def suggest(self, meeting: str, t: dict) -> dict[str, dict]:
        """{key: {name, score}} for a transcript's speakers not named yet: one name per speaker and one
        speaker per name, the closest pairs first; nothing below THRESHOLD, nothing rejected for that
        speaker, no name the transcript has already, no name learned from this meeting itself."""
        data = self._read()
        mine = data["meetings"].get(meeting) or {}
        speakers = t.get("speakers") or {}
        if not mine or not data["names"]:
            return {}
        known = {}
        for name, meetings in data["names"].items():
            if meeting in meetings:
                continue
            vectors = [v for v in (unit(m.get("print")) for m in meetings.values()) if v is not None]
            if vectors and len({v.size for v in vectors}) == 1:
                mean = unit(np.mean(vectors, axis=0))
                if mean is not None:
                    known[name] = mean
        taken = {s.get("name") for s in speakers.values()}
        rejected = t.get("voiceRejected") or {}
        pairs = []
        for key, vector in mine.items():
            v = unit(vector)
            if v is None or key not in speakers or not UNNAMED.fullmatch(str(speakers[key].get("name", ""))):
                continue
            for name, p in known.items():
                if p.size == v.size and name not in taken and name not in rejected.get(key, []):
                    score = float(v @ p)
                    if score >= THRESHOLD:
                        pairs.append((score, key, name))
        out: dict[str, dict] = {}
        for score, key, name in sorted(pairs, reverse=True):
            if key not in out and name not in {x["name"] for x in out.values()}:
                out[key] = {"name": name, "score": round(score, 2)}
        return out


# The one file of them, in Tyts's own data folder.
known = Voices(APP_DIR / "voices.json")
