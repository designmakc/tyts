r"""The transcripts folder as the person's notebook: Tyts's own recordings and anyone else's, in one place.

The library (settings `dataDir`, Documents\Tyts\Transcripts) is the folder: media put in it (another
program's recordings) is transcribed once, dated by the file; a call Tyts records is saved there too,
its sound copied beside a Markdown of the text and the summary, so the folder reads as a notebook
(Obsidian opens it as it is). The transcripts' own folders (<id>/transcript.json, audio.ogg) are the
library's and never imported. Nothing of the person's is ever moved or deleted; a file whose transcript
they delete is not imported again.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import time
from datetime import datetime
from pathlib import Path

import export
import notes
from store import Store

log = logging.getLogger("tyts.calls")

MEDIA = {".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v", ".mp3", ".m4a", ".wav", ".ogg", ".oga", ".opus", ".flac", ".aac", ".wma"}
SETTLED = 60  # seconds since the file last changed: one still being written waits
SCAN_EVERY = 300
WORD = re.compile(r"\w+")
TRANSCRIPT_FOLDER = re.compile(r"\d{4}-\d\d-\d\d_\d{6}-[0-9a-f]{4}")  # store.new_id


def scan(store: Store, submit, now: float | None = None) -> int:
    """Queues every media file of the library folder not transcribed before; how many."""
    base = store.root
    if not base.is_dir():
        return 0
    now = time.time() if now is None else now
    known = store.known_files()
    queued = 0
    for path in sorted(base.rglob("*")):
        parts = path.relative_to(base).parts
        if not path.is_file() or path.suffix.lower() not in MEDIA or any(p.startswith(".") for p in parts):
            continue
        if TRANSCRIPT_FOLDER.fullmatch(parts[0]):
            continue  # a transcript's own folder: its audio.ogg is the library's
        full = os.path.abspath(path)
        if os.path.normcase(full) in known:
            continue
        try:
            stat = path.stat()
        except OSError:
            continue
        if now - stat.st_mtime < SETTLED:
            continue
        job = {"kind": "file", "inputs": [{"path": full, "track": "main", "offset": 0, "temp": False}]}
        submit(store.create(path.stem, "file", "queued", job, created=datetime.fromtimestamp(stat.st_mtime), file=full))
        queued += 1
    if queued:
        log.info("transcripts folder: %d new file(s) queued", queued)
    return queued


def save_call(store: Store, id: str, t: dict) -> str:
    """A call's sound copied into the library folder as `<date> <title>.ogg`, beside the transcripts' folders; its path."""
    created = datetime.fromisoformat(t["created"])
    stem = notes.file_name(f"{created:%Y-%m-%d %H%M} {t.get('title', '')}")
    target = store.root / f"{stem}.ogg"
    n = 2
    while target.exists():
        target = store.root / f"{stem} ({n}).ogg"
        n += 1
    shutil.copyfile(store.folder(id) / t.get("audio", "audio.ogg"), target)
    return str(target)


def write_md(t: dict, file: str) -> Path:
    """The text and the summary as Markdown beside the recording, the same name; written over each time."""
    media = Path(file)
    path = media.with_suffix(".md")
    head = notes.frontmatter({
        "created": datetime.fromisoformat(t["created"]).isoformat(timespec="minutes"),
        "duration": export.clock(t.get("duration", 0)),
        "source": export.SOURCES.get(t.get("source", ""), t.get("source", "")),
        "participants": export.participants(t),
        "audio": f'"{media.name}"',
        "tags": ["call"],
    })
    path.write_text(head + "\n" + export.to_md(t) + "\n", "utf-8")
    return path


# ---------------------------------------------------------------- a question to the calls

def terms(question: str) -> list[str]:
    """The question's words as search prefixes: "бейджам" → "бейдж", so "бейджи" and "бейджей" match too.

    ponytail: a prefix of the word stands in for a stemmer; a real one (Snowball) when questions miss their answers."""
    out: list[str] = []
    for word in WORD.findall(question.lower()):
        if len(word) < 3:
            continue
        prefix = word if len(word) < 5 else word[: max(4, len(word) - 2)]
        if prefix not in out:
            out.append(prefix)
    return out


def passages(store: Store, question: str, most: int = 8, chars: int = 6000) -> list[dict]:
    """The pieces of the transcripts that say most about the question: {id, title, created, at, text}, the best first."""
    words = terms(question)
    if not words:
        return []
    out: list[dict] = []
    used = 0
    for id in store.search_ids(" OR ".join(f'"{w}"*' for w in words), most):
        t = store.transcript(id)
        if not t:
            continue
        lines = t.get("utterances", [])
        hits = [i for i, u in enumerate(lines) if any(w in u["text"].lower() for w in words)]
        # Each hit with its neighbours; runs that touch become one passage.
        spans: list[list[int]] = []
        for i in hits:
            a, b = max(0, i - 1), min(len(lines), i + 2)
            if spans and a <= spans[-1][1]:
                spans[-1][1] = b
            else:
                spans.append([a, b])
        for a, b in spans[:3]:
            text = " ".join(f"{export.name(t, u['speaker'])}: {u['text']}" if len(t.get('speakers', [])) > 1 else u["text"] for u in lines[a:b])
            text = text[:1200]
            if used + len(text) > chars:
                return out
            used += len(text)
            out.append({"id": id, "title": t.get("title", ""), "created": t.get("created", ""), "at": lines[a]["start"], "text": text})
    return out
