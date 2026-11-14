r"""The speech engine's settings: %APPDATA%\Tyts\speech.json.

Tyts's own settings (keys, theme) are its settings.json beside it; these are
the ones the engine acts on.
"""

from __future__ import annotations

import ctypes
import json
import logging
import os
import shutil
import sqlite3
import threading
import uuid
from contextlib import closing
from pathlib import Path

from vocab import split_items

log = logging.getLogger("tyts.settings")

# A test run gives its own folders; the real ones are Tyts's.
TEST_HOME = os.environ.get("TYTS_SPEECH_HOME")
APP_DIR = Path(TEST_HOME or Path(os.environ.get("APPDATA", Path.home())) / "Tyts")
# Tyts says where the engine is installed: %LOCALAPPDATA%\Tyts\speech.
SPEECH_DIR = Path(os.environ.get("TYTS_SPEECH_DIR") or Path(os.environ.get("LOCALAPPDATA", Path.home())) / "Tyts" / "speech")
MODELS_DIR = SPEECH_DIR / "models"
SETTINGS_FILE = APP_DIR / "speech.json"

# The speech models Tyts can use: engine/models.json, shared with src/speechplan.ts.
CATALOG = json.loads((Path(__file__).resolve().parent / "models.json").read_text("utf-8"))
MODELS = tuple(m["name"] for m in CATALOG["models"] if m["backend"] == "whisper")
# Every model, Whisper or not (Parakeet dictates on the processor), with where and for what it may run.
ALL_MODELS = {m["name"]: m for m in CATALOG["models"]}
# Dictation on the CPU while Tyts has sent no plan (an older Tyts, or the plan
# not made yet): large-v3-turbo takes ~6 s for a 7 s phrase there, small ~2 s.
CPU_DICTATION = "small"
LANGUAGES = ("auto", "ru", "en")
DEVICES = ("cpu", "cuda")
FEATURES = ("dictation", "transcripts")
COMPUTE = {"cpu": ("int8",), "cuda": ("float16", "int8_float16")}


def documents_dir() -> Path:
    """The person's Documents folder, wherever Windows moved it (OneDrive)."""
    try:
        folder_id = uuid.UUID("{FDD39AD0-238F-46AF-ADB4-6C85480369C7}")  # FOLDERID_Documents
        guid = (ctypes.c_byte * 16).from_buffer_copy(folder_id.bytes_le)
        out = ctypes.c_wchar_p()
        if ctypes.windll.shell32.SHGetKnownFolderPath(guid, 0, None, ctypes.byref(out)) == 0:
            path = Path(out.value)
            ctypes.windll.ole32.CoTaskMemFree(out)
            return path
    except (AttributeError, OSError):
        pass
    return Path.home() / "Documents"


def default_data_dir() -> Path:
    r"""The transcripts' folder unless the person chose another: Documents\Tyts\Transcripts."""
    return documents_dir() / "Tyts" / "Transcripts"


def defaults() -> dict:
    return {
        "model": "large-v3-turbo",
        "language": "auto",
        # The old way of naming words for Whisper (one string); moved into `vocabulary` once, kept for older callers.
        "hotwords": "",
        # Words to be spelled right: [{word, heard: [what the recognizer writes instead]}] (vocab.py).
        "vocabulary": [],
        "hfToken": "",
        "dataDir": str(default_data_dir()),
        "kbDir": "",
        "kbInbox": "Inbox",
        # What runs where, made by Tyts from this computer's measurements (src/speechplan.ts):
        # {threads, cpu: {dictation: {model, beam}, transcripts: {model}}, cuda: {... compute}}.
        "plan": {},
        # How fast each model runs here: {fingerprint, at, runs: {"model|device|compute": {phrase, rtf, n, at}}}.
        "bench": {},
    }


# A transcript still being made: the worker holds its folder and its job's paths (jobs.py finish_recording).
UNFINISHED = ("queued", "working", "recording")


def _same(a: Path, b: Path) -> bool:
    return os.path.normcase(str(a.resolve())) == os.path.normcase(str(b.resolve()))


def _unfinished(folder: Path) -> str:
    """Why the library cannot move now, or "" when nothing in it is being made."""
    db = folder / "index.db"
    if db.exists():
        try:
            with closing(sqlite3.connect(f"{db.as_uri()}?mode=ro", uri=True)) as con:
                found = con.execute(
                    f"select count(*) from transcripts where status in ({','.join('?' * len(UNFINISHED))})", UNFINISHED
                ).fetchone()[0]
        except sqlite3.Error as error:
            return f"its index could not be read ({error})"
        if found:
            return f"{found} transcript(s) not finished yet"
    return ""


def _prefixes(folder: Path) -> set[str]:
    """How a path into the folder may be written: as given and resolved, in the file system's case."""
    return {os.path.normcase(os.path.abspath(folder)), os.path.normcase(str(folder.resolve()))}


def _moved(path, prefixes: set[str], new: Path):
    """The path as it is after the move, or None when it does not point into the old folder."""
    if not isinstance(path, str) or not path:
        return None
    full = os.path.abspath(path)
    key = os.path.normcase(full)
    for prefix in prefixes:
        if key == prefix or key.startswith(prefix.rstrip(os.sep) + os.sep):
            return str(new) + full[len(prefix.rstrip(os.sep)):]
    return None


def _repoint(new: Path, prefixes: set[str]) -> int:
    """Jobs keep absolute paths to their sound (a failed one's inputs, for Retry): pointed into the new folder.

    Nothing else in the library is absolute: transcript.json names its audio relatively, a note's path is in the knowledge base."""
    db = new / "index.db"
    if not db.exists():
        return 0
    changed = 0
    with closing(sqlite3.connect(str(db))) as con, con:
        # The notebook's files (calls.py): the recording a transcript came from or was saved as, and the ignored ones.
        for table, column, key in (("transcripts", "file", "id"), ("ignored", "path", "path")):
            for k, path in con.execute(f"select {key}, {column} from {table} where {column} is not null").fetchall():
                moved = _moved(path, prefixes, new)
                if moved is not None:
                    con.execute(f"update {table} set {column}=? where {key}=?", (moved, k))
        for id, raw in con.execute("select id, job from transcripts").fetchall():
            job = json.loads(raw or "{}")
            inputs = job.get("inputs") if isinstance(job, dict) else None
            touched = False
            for item in inputs if isinstance(inputs, list) else []:
                path = _moved(item.get("path"), prefixes, new) if isinstance(item, dict) else None
                if path is not None:
                    item["path"] = path
                    touched = True
            if touched:
                con.execute("update transcripts set job=? where id=?", (json.dumps(job, ensure_ascii=False), id))
                changed += 1
    return changed


def move_library(settings: "Settings", new: Path, close) -> None:
    """The library moved into a folder the person picked (POST /library/move): every entry of the old folder
    goes into the new one (made when missing; what is in it already stays and is read as the notebook),
    the index last; `close` lets go of the open index first. Raises ValueError with the reason when it cannot:
    a transcript still being made, the new folder inside the old or the other way round, a name in the way.
    A move that fails half way is put back."""
    old = Path(settings["dataDir"])
    new = Path(os.path.abspath(new))
    if new.exists() and not new.is_dir():
        raise ValueError(f"{new} is not a folder")
    if old.is_dir() and _same(old, new):
        return
    for a, b in ((old, new), (new, old)):
        if os.path.normcase(os.path.abspath(b)).startswith(os.path.normcase(os.path.abspath(a)).rstrip(os.sep) + os.sep):
            raise ValueError("One folder is inside the other")
    why = _unfinished(old) if old.is_dir() else ""
    if why:
        raise ValueError(f"Not now: {why}")
    entries = sorted(old.iterdir(), key=lambda p: p.name == "index.db") if old.is_dir() else []
    taken = [e.name for e in entries if (new / e.name).exists()]
    if taken:
        raise ValueError(f"{new} already holds {', '.join(taken[:3])}")
    close()
    new.mkdir(parents=True, exist_ok=True)
    moved: list[Path] = []
    try:
        for entry in entries:
            shutil.move(str(entry), str(new / entry.name))
            moved.append(entry)
    except OSError as error:
        for entry in moved:
            shutil.move(str(new / entry.name), str(entry))
        raise ValueError(f"Could not move {entry.name}: {error}") from error
    settings.update({"dataDir": str(new)})
    try:
        _repoint(new, _prefixes(old))
    except (sqlite3.Error, ValueError, OSError) as error:
        log.warning("moved the transcripts, but their files still name %s: %s", old, error)
    log.info("moved the transcripts from %s to %s", old, new)


def clean_plan(plan: dict) -> dict:
    """A plan as Tyts sends it, with anything this engine does not know left out."""
    out: dict = {}
    if isinstance(plan.get("fingerprint"), str):
        out["fingerprint"] = plan["fingerprint"][:64]
    if isinstance(plan.get("threads"), int) and 1 <= plan["threads"] <= 256:
        out["threads"] = plan["threads"]
    for device in DEVICES:
        entries = plan.get(device)
        if not isinstance(entries, dict):
            continue
        for feature in FEATURES:
            entry = entries.get(feature)
            known = ALL_MODELS.get(entry.get("model")) if isinstance(entry, dict) else None
            runs_on = known.get("devices", DEVICES) if known else ()
            # A processor-only model may stand in the card's plan: it runs on the processor beside the card's Whisper (jobs.py entry).
            if not known or not (device in runs_on or "cpu" in runs_on) or feature not in known.get("features", FEATURES):
                continue
            clean = {"model": entry["model"]}
            if device in runs_on and entry.get("compute") in COMPUTE[device]:
                clean["compute"] = entry["compute"]
            # A Mac's graphics (asr.MlxWhisper): the processor's entry with compute "mlx", as jobs.py knows only cpu and cuda plans.
            if device == "cpu" and "metal" in runs_on and entry.get("compute") == "mlx":
                clean["compute"] = "mlx"
            if isinstance(entry.get("beam"), int) and 1 <= entry["beam"] <= 10:
                clean["beam"] = entry["beam"]
            out.setdefault(device, {})[feature] = clean
    return out


VOCABULARY_MOST = 200
WORD_LONGEST = 48
HEARD_MOST = 8


def _alias(raw) -> str | None:
    """What a word may be heard as: one to three words, spaces made single; None when it is not that."""
    if not isinstance(raw, str):
        return None
    tokens = raw.split()
    return " ".join(tokens) if 1 <= len(tokens) <= 3 and len(" ".join(tokens)) <= WORD_LONGEST else None


def clean_vocabulary(raw) -> list[dict]:
    """The vocabulary as Tyts sends it, as [{word, heard}]; a bare string is a word heard no other way.

    Anything else (an empty word, a line break, a fourth word in an alias) is left out without a word:
    the list is typed by a person, and one slip should not cost the rest."""
    out: list[dict] = []
    seen: set[str] = set()
    for entry in raw if isinstance(raw, list) else []:
        if isinstance(entry, str):
            entry = {"word": entry, "heard": []}
        if not isinstance(entry, dict) or not isinstance(entry.get("word"), str):
            continue
        word = entry["word"].strip()
        if not 1 <= len(word) <= WORD_LONGEST or "\n" in word or "\r" in word or word.casefold() in seen:
            continue
        heard: list[str] = []
        for alias in entry.get("heard") if isinstance(entry.get("heard"), list) else []:
            alias = _alias(alias)
            if alias and alias.casefold() not in {h.casefold() for h in heard} and len(heard) < HEARD_MOST:
                heard.append(alias)
        seen.add(word.casefold())
        out.append({"word": word, "heard": heard})
        if len(out) >= VOCABULARY_MOST:
            break
    return out


def clean_inbox(raw) -> str:
    """The notes' folder inside the knowledge base: a relative path (Inbox, Notes/Tyts), never out of it."""
    if not isinstance(raw, str):
        return "Inbox"
    parts = [p.strip() for p in raw.replace("\\", "/").split("/")]
    if raw.strip()[:1] in ("/", "\\") or any(":" in p or p == ".." for p in parts):
        return "Inbox"
    return "/".join(p for p in parts if p and p != ".")


class Settings:
    def __init__(self, file: Path = SETTINGS_FILE):
        self.file = file
        self._lock = threading.Lock()
        self.reload()

    def reload(self) -> None:
        values = defaults()
        try:
            stored = json.loads(self.file.read_text("utf-8"))
            values.update({k: v for k, v in stored.items() if k in values})
        except (OSError, ValueError):
            pass
        with self._lock:
            self._values = values
            self._check()
            # The hotwords string of before become the vocabulary's words, once.
            if not self._values["vocabulary"] and isinstance(self._values["hotwords"], str) and self._values["hotwords"].strip():
                self._values["vocabulary"] = clean_vocabulary(split_items(self._values["hotwords"]))
                self._values["hotwords"] = ""
                try:
                    self._save()
                except OSError as error:
                    log.warning("could not save the vocabulary: %s", error)

    def _save(self) -> None:
        self.file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.file.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._values, ensure_ascii=False, indent=2), "utf-8")
        tmp.replace(self.file)

    def _check(self) -> None:
        if self._values["model"] not in MODELS:
            self._values["model"] = "large-v3-turbo"
        if self._values["language"] not in LANGUAGES:
            self._values["language"] = "auto"
        self._values["plan"] = clean_plan(self._values["plan"])
        self._values["vocabulary"] = clean_vocabulary(self._values["vocabulary"])
        self._values["kbInbox"] = clean_inbox(self._values["kbInbox"])
        if not isinstance(self._values["bench"].get("runs"), dict):
            self._values["bench"] = {}

    def get(self) -> dict:
        with self._lock:
            return dict(self._values)

    def __getitem__(self, key: str):
        with self._lock:
            return self._values[key]

    def update(self, changes: dict) -> dict:
        with self._lock:
            for key, value in changes.items():
                if key in self._values and isinstance(value, type(self._values[key])):
                    self._values[key] = value.strip() if isinstance(value, str) and key != "hotwords" else value
            self._check()
            self._save()
            return dict(self._values)

    @property
    def data_dir(self) -> Path:
        return Path(self["dataDir"])
