"""The library: one folder per transcript under the data folder, and index.db to list and search them.

<data>/<id>/transcript.json   what was said (the source of truth)
<data>/<id>/audio.ogg         the sound, to hear a line again
<data>/<id>/incoming/         a recording's chunks until it is finished
"""

from __future__ import annotations

import json
import os
import secrets
import shutil
import sqlite3
import threading
from datetime import datetime
from pathlib import Path

COLUMNS = ("id", "title", "source", "created", "duration", "status", "stage", "progress", "error", "language", "speakers_status", "job", "touched", "summarized", "app", "file")
LIST_COLUMNS = ("id", "title", "source", "created", "duration", "status", "stage", "progress", "error", "language", "speakers_status", "summarized", "app")


def new_id(now: datetime | None = None) -> str:
    now = now or datetime.now()
    return f"{now:%Y-%m-%d_%H%M%S}-{secrets.token_hex(2)}"


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


class Store:
    def __init__(self, root: Path):
        self.root = root
        root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._db = sqlite3.connect(str(root / "index.db"), check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._db.executescript(
            """
            create table if not exists transcripts(
              id text primary key, title text not null, source text not null, created text not null,
              duration real default 0, status text not null, stage text default '', progress real default 0,
              error text default '', language text default '', speakers_status text default '',
              job text default '{}', touched text default '');
            create virtual table if not exists search using fts5(id unindexed, title, body, tokenize='unicode61 remove_diacritics 2');
            """
        )
        # A library from before summaries and calls gets their columns.
        have = {r["name"] for r in self._db.execute("pragma table_info(transcripts)")}
        with self._db:
            if "summarized" not in have:
                self._db.execute("alter table transcripts add column summarized integer default 0")
            if "app" not in have:
                self._db.execute("alter table transcripts add column app text")
            # The transcripts folder as a notebook (calls.py): the file a transcript came from or was saved as, and files not to import again.
            if "file" not in have:
                self._db.execute("alter table transcripts add column file text")
            self._db.execute("create table if not exists ignored(path text primary key)")

    def folder(self, id: str) -> Path:
        # One folder right inside the library: no separators, no "..", no drive ("D:" alone is drive D on Windows).
        if not id or "/" in id or "\\" in id or ".." in id or ":" in id or id.strip(" .") != id:
            raise KeyError(id)
        return self.root / id

    def create(self, title: str, source: str, status: str, job: dict | None = None, created: datetime | None = None, file: str | None = None) -> str:
        """A row; `created` for a recording made before (a file put into the transcripts folder, dated by the file), `file` the file it came from."""
        id = new_id()
        self.folder(id).mkdir(parents=True)
        when = created.isoformat(timespec="seconds") if created else now_iso()
        with self._lock, self._db:
            self._db.execute(
                "insert into transcripts(id, title, source, created, status, job, touched, app, file) values(?,?,?,?,?,?,?,?,?)",
                (id, title, source, when, status, json.dumps(job or {}, ensure_ascii=False), now_iso(), (job or {}).get("app"), file),
            )
        return id

    def known_files(self) -> set[str]:
        """Every file a transcript came from or was saved as, and those deleted, in the file system's case."""
        with self._lock:
            rows = self._db.execute("select file from transcripts where file is not null union select path from ignored").fetchall()
        return {os.path.normcase(r[0]) for r in rows}

    def search_ids(self, match: str, limit: int) -> list[str]:
        """The transcripts an FTS5 query matches, the best first; an unreadable query finds nothing."""
        with self._lock:
            try:
                rows = self._db.execute("select id from search where search match ? order by bm25(search) limit ?", (match, limit)).fetchall()
            except sqlite3.OperationalError:
                return []
        return [r[0] for r in rows]

    def update(self, id: str, **fields) -> None:
        if "job" in fields:
            fields["job"] = json.dumps(fields["job"], ensure_ascii=False)
        keys = [k for k in fields if k in COLUMNS and k != "id"]
        if not keys:
            return
        with self._lock, self._db:
            self._db.execute(
                f"update transcripts set {', '.join(f'{k}=?' for k in keys)} where id=?",
                [fields[k] for k in keys] + [id],
            )

    def row(self, id: str) -> dict | None:
        with self._lock:
            r = self._db.execute("select * from transcripts where id=?", (id,)).fetchone()
        if r is None:
            return None
        out = dict(r)
        out["job"] = json.loads(out["job"] or "{}")
        return out

    def rows(self, status: tuple[str, ...]) -> list[dict]:
        with self._lock:
            found = self._db.execute(
                f"select * from transcripts where status in ({','.join('?' * len(status))}) order by created", status
            ).fetchall()
        return [dict(r) | {"job": json.loads(r["job"] or "{}")} for r in found]

    def list(self, query: str = "") -> list[dict]:
        columns = ", ".join(f"t.{c}" for c in LIST_COLUMNS)
        with self._lock:
            if query.strip():
                terms = " ".join(f'"{t}"*' for t in query.replace('"', " ").split())
                found = self._db.execute(
                    f"select {columns}, snippet(search, 2, '[', ']', '…', 12) as snippet from search s "
                    "join transcripts t on t.id = s.id where search match ? order by t.created desc",
                    (terms,),
                ).fetchall()
            else:
                found = self._db.execute(f"select {columns} from transcripts t order by t.created desc").fetchall()
        return [dict(r) for r in found]

    def transcript(self, id: str) -> dict | None:
        try:
            return json.loads((self.folder(id) / "transcript.json").read_text("utf-8"))
        except (OSError, ValueError, KeyError):
            return None

    def save(self, id: str, transcript: dict) -> None:
        """Writes transcript.json and puts its text in the search index."""
        folder = self.folder(id)
        tmp = folder / "transcript.tmp"
        tmp.write_text(json.dumps(transcript, ensure_ascii=False, indent=1), "utf-8")
        tmp.replace(folder / "transcript.json")
        summary = (transcript.get("summary") or {}).get("text", "")
        body = "\n".join([u["text"] for u in transcript.get("utterances", [])] + ([summary] if summary else []))
        with self._lock, self._db:
            self._db.execute("delete from search where id=?", (id,))
            self._db.execute("insert into search(id, title, body) values(?,?,?)", (id, transcript.get("title", ""), body))
            self._db.execute(
                "update transcripts set title=?, duration=?, language=?, summarized=?, app=coalesce(?, app) where id=?",
                (transcript.get("title", ""), transcript.get("duration", 0), transcript.get("language", ""), int(bool(summary)), transcript.get("app"), id),
            )

    def delete(self, id: str) -> None:
        with self._lock, self._db:
            # A file of the transcripts folder whose transcript goes is not imported again.
            self._db.execute("insert or ignore into ignored(path) select file from transcripts where id=? and file is not null", (id,))
            self._db.execute("delete from transcripts where id=?", (id,))
            self._db.execute("delete from search where id=?", (id,))
        shutil.rmtree(self.folder(id), ignore_errors=True)
