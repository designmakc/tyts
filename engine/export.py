"""A transcript as TXT, Markdown, SRT, VTT, DOCX or JSON."""

from __future__ import annotations

import io
import json
import os
import re
from datetime import datetime
from pathlib import Path

FORMATS = ("txt", "md", "srt", "vtt", "docx", "json")
SOURCES = {"meet": "Meeting", "file": "File", "mic": "Microphone", "note": "Note", "system": "Call"}
MONTHS = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
SENTENCE = re.compile(r"(?<=[.!?…])\s+")


def clock(seconds: float, millis: str | None = None) -> str:
    """00:12, 1:02:03; with millis="," or "." the subtitle form 00:00:12,345."""
    total = round(seconds * 1000)  # rounded once, so 0.9996 s carries into 00:00:01,000
    whole, ms = divmod(total, 1000) if millis else (int(seconds), 0)
    h, m, s = whole // 3600, whole % 3600 // 60, whole % 60
    if millis:
        return f"{h:02}:{m:02}:{s:02}{millis}{ms:03}"
    return f"{h}:{m:02}:{s:02}" if h else f"{m:02}:{s:02}"


def length(seconds: float) -> str:
    minutes = round(seconds / 60)
    if minutes < 1:
        return f"{int(seconds)} s"
    return f"{minutes // 60} h {minutes % 60} min" if minutes >= 60 else f"{minutes} min"


def when(created: str) -> str:
    d = datetime.fromisoformat(created)
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}, {d:%H:%M}"


def name(t: dict, key: str) -> str:
    return t.get("speakers", {}).get(key, {}).get("name", key)


def participants(t: dict) -> list[str]:
    seen = []
    for u in t.get("utterances", []):
        if u["speaker"] not in seen:
            seen.append(u["speaker"])
    return [name(t, k) for k in seen]


def meta_line(t: dict) -> str:
    return " · ".join([when(t["created"]), length(t.get("duration", 0)), SOURCES.get(t.get("source", ""), "")])


def summary_of(t: dict) -> str:
    """The call's summary (Markdown, made by Kryakl), or nothing."""
    return ((t.get("summary") or {}).get("text") or "").strip()


def notes_of(t: dict) -> str:
    """The person's own notes on the recording, or nothing."""
    return (t.get("notes") or "").strip()


def heads(t: dict) -> list[tuple[str, str]]:
    """What goes before the transcript, by its heading: the summary, then the person's notes."""
    return [(head, text) for head, text in (("Summary", summary_of(t)), ("Notes", notes_of(t))) if text]


def to_txt(t: dict) -> str:
    lines = [t.get("title", ""), meta_line(t), ""]
    for head, text in heads(t):
        lines += [head, "", text, ""]
    if heads(t):
        lines += ["Transcript", ""]
    lines += [f"[{clock(u['start'])}] {name(t, u['speaker'])}: {u['text']}" for u in t.get("utterances", [])]
    return "\n".join(lines) + "\n"


def to_md(t: dict, heading: bool = True) -> str:
    out = [f"# {t.get('title', '')}", ""] if heading else []
    out += [f"*{meta_line(t)}*", ""]
    for head, text in heads(t):
        out += [f"## {head}", "", text, ""]
    if heads(t):
        out += ["## Transcript", ""]
    people = participants(t)
    if len(people) > 1:
        out += [f"**Speakers:** {', '.join(people)}", ""]
    previous = None
    for u in t.get("utterances", []):
        if len(people) > 1 and u["speaker"] != previous:
            out.append(f"**{name(t, u['speaker'])}** `{clock(u['start'])}`  ")
        elif len(people) <= 1:
            out.append(f"`{clock(u['start'])}`  ")
        out += [u["text"], ""]
        previous = u["speaker"]
    return "\n".join(out)


def cues(t: dict) -> list[tuple[float, float, str]]:
    """Utterances cut into subtitles of a sentence or so, the time shared out by length."""
    out = []
    for u in t.get("utterances", []):
        parts = [p for p in SENTENCE.split(u["text"]) if p]
        span = max(u["end"] - u["start"], 0.1)
        chars = sum(len(p) for p in parts) or 1
        start = u["start"]
        speaker = name(t, u["speaker"])
        multi = len(t.get("speakers", {})) > 1
        for p in parts:
            end = start + span * len(p) / chars
            out.append((start, end, f"{speaker}: {p}" if multi else p))
            start = end
    return out


def to_srt(t: dict) -> str:
    return "\n".join(
        f"{i}\n{clock(a, ',')} --> {clock(b, ',')}\n{text}\n" for i, (a, b, text) in enumerate(cues(t), 1)
    )


def to_vtt(t: dict) -> str:
    return "WEBVTT\n\n" + "\n".join(f"{clock(a, '.')} --> {clock(b, '.')}\n{text}\n" for a, b, text in cues(t))


def to_docx(t: dict, path) -> None:
    """Into a file's path, or any binary stream (render)."""
    from docx import Document
    from docx.shared import Pt, RGBColor

    doc = Document()
    doc.add_heading(t.get("title", ""), level=1)
    meta = doc.add_paragraph(meta_line(t))
    meta.runs[0].font.color.rgb = RGBColor(0x6E, 0x76, 0x81)
    for head, text in heads(t):
        doc.add_heading(head, level=2)
        for line in text.splitlines():
            if line.startswith("#"):
                doc.add_heading(line.lstrip("#").strip(), level=3)
            elif line.startswith("- "):
                doc.add_paragraph(line[2:], style="List Bullet")
            elif line.strip():
                doc.add_paragraph(line)
    if heads(t):
        doc.add_heading("Transcript", level=2)
    people = participants(t)
    if len(people) > 1:
        doc.add_paragraph(f"Speakers: {', '.join(people)}")
    for u in t.get("utterances", []):
        p = doc.add_paragraph()
        stamp = p.add_run(f"{clock(u['start'])}  ")
        stamp.font.color.rgb = RGBColor(0x6E, 0x76, 0x81)
        stamp.font.size = Pt(9)
        if len(people) > 1:
            p.add_run(f"{name(t, u['speaker'])}: ").bold = True
        p.add_run(u["text"])
    doc.save(path if hasattr(path, "write") else str(path))


def render(t: dict, fmt: str) -> bytes:
    """The transcript in a format, as the file's bytes."""
    if fmt == "docx":
        out = io.BytesIO()
        to_docx(t, out)
        return out.getvalue()
    text = {
        "txt": to_txt,
        "md": to_md,
        "srt": to_srt,
        "vtt": to_vtt,
        "json": lambda t: json.dumps(t, ensure_ascii=False, indent=1),
    }[fmt](t)
    # Lines end as a text file written on this system has them (CRLF on Windows), as the files written before did.
    return text.replace("\n", os.linesep).encode("utf-8")


def write(t: dict, fmt: str, path: Path) -> None:
    path.write_bytes(render(t, fmt))
