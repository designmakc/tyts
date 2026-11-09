"""Markdown files in the knowledge base: a voice note, or a whole transcript sent there."""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

import export

UNSAFE = re.compile(r'[<>:"/\\|?*\x00-\x1f]+')


class NoKnowledgeBase(Exception):
    """No knowledge-base folder is chosen in the settings yet."""


def inbox(kb_dir: str, sub: str) -> Path:
    """The notes' folder: `sub` inside the knowledge base, never anywhere else (an absolute or ../ one is the base itself)."""
    if not kb_dir:
        raise NoKnowledgeBase()
    base = Path(kb_dir)
    inside = Path(sub.replace("\\", "/")) if sub else None
    # By the path itself, not where links lead: an Inbox that is a link to another drive stays the person's Inbox.
    if inside is None or inside.is_absolute() or inside.drive or inside.anchor or ".." in inside.parts:
        folder = base
    else:
        folder = base / inside
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def first_words(text: str, limit: int = 6) -> str:
    words = re.findall(r"[\w'-]+", text)[:limit]
    return " ".join(words) or "Note"


def file_name(stem: str) -> str:
    stem = UNSAFE.sub(" ", stem).strip(" .")
    return re.sub(r"\s+", " ", stem)[:80].rstrip(" .") or "Note"


def free(folder: Path, stem: str) -> Path:
    path = folder / f"{stem}.md"
    n = 2
    while path.exists():
        path = folder / f"{stem} ({n}).md"
        n += 1
    return path


def frontmatter(fields: dict) -> str:
    lines = ["---"]
    for key, value in fields.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            lines += [f'  - "{v}"' for v in value]
        else:
            lines.append(f"{key}: {value}")
    return "\n".join(lines + ["---", ""])


def write_note(t: dict, kb_dir: str, sub: str) -> Path:
    created = datetime.fromisoformat(t["created"])
    text = "\n\n".join(u["text"] for u in t.get("utterances", []))
    path = free(inbox(kb_dir, sub), file_name(f"{created:%Y-%m-%d %H%M} {first_words(text)}"))
    head = frontmatter({
        "created": created.isoformat(timespec="minutes"),
        "duration": export.clock(t.get("duration", 0)),
        "source": "voice note",
        "tags": ["voice"],
    })
    path.write_text(head + "\n" + text + "\n", "utf-8")
    return path


def write_transcript(t: dict, kb_dir: str, sub: str) -> Path:
    created = datetime.fromisoformat(t["created"])
    path = free(inbox(kb_dir, sub), file_name(f"{created:%Y-%m-%d} {t.get('title', '')}"))
    head = frontmatter({
        "created": created.isoformat(timespec="minutes"),
        "duration": export.clock(t.get("duration", 0)),
        "source": export.SOURCES.get(t.get("source", ""), t.get("source", "")),
        "participants": export.participants(t),
        "tags": ["transcript"],
    })
    path.write_text(head + "\n" + export.to_md(t) + "\n", "utf-8")
    return path
