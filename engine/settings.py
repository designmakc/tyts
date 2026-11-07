r"""The speech engine's settings: %APPDATA%\Kryakl\speech.json.

Kryakl's own settings (keys, theme) are its settings.json beside it; these are
the ones the engine acts on. Kryakl was Krya until 0.15 and Altype until 0.11: Altype's speech.json
moves over once, when Kryakl itself could not move it. Altscribe, the app this
engine came from, is adopted once too: its settings and its downloaded models.
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

log = logging.getLogger("kryakl.settings")

# A test run gives its own folders; the real ones are Kryakl's. ALTYPE_SPEECH_HOME is the old name's.
TEST_HOME = os.environ.get("KRYA_SPEECH_HOME") or os.environ.get("ALTYPE_SPEECH_HOME")
APP_DIR = Path(TEST_HOME or Path(os.environ.get("APPDATA", Path.home())) / "Tyts")
# Kryakl says where the engine is installed: %LOCALAPPDATA%\Kryakl\speech, or an old name's when it could not move.
SPEECH_DIR = Path(os.environ.get("KRYA_SPEECH_DIR") or Path(os.environ.get("LOCALAPPDATA", Path.home())) / "Tyts" / "speech")
MODELS_DIR = SPEECH_DIR / "models"
SETTINGS_FILE = APP_DIR / "speech.json"

# Altype, an older name: its speech engine settings, and the transcripts folder it gave new users.
ALTYPE_SETTINGS = Path(os.environ.get("APPDATA", Path.home())) / "Altype" / "speech.json"

OLD_SETTINGS = Path(os.environ.get("APPDATA", Path.home())) / "Altscribe" / "engine.json"
OLD_MODELS = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "Altscribe" / "models"

# The speech models Kryakl can use: engine/models.json, shared with src/speechplan.ts.
CATALOG = json.loads((Path(__file__).resolve().parent / "models.json").read_text("utf-8"))
MODELS = tuple(m["name"] for m in CATALOG["models"] if m["backend"] == "whisper")
# Every model, Whisper or not (Parakeet dictates on the processor), with where and for what it may run.
ALL_MODELS = {m["name"]: m for m in CATALOG["models"]}
# Dictation on the CPU while Kryakl has sent no plan (an older Kryakl, or the plan
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
    r"""The transcripts' folder unless the person chose another: Documents\Kryakl\Transcripts.

    Krya's and Altype's (Documents\Krya\Transcripts, Documents\Altype\Transcripts) move there at a real start
    (move_transcripts)."""
    return documents_dir() / "Tyts" / "Transcripts"


def old_data_dirs() -> list[Path]:
    r"""The old names' default transcripts folders, newest first: Krya's until 0.15, Altype's until 0.11."""
    return [documents_dir() / name / "Transcripts" for name in ("Krya", "Altype")]


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
        # The calls folder (calls.py): recordings in it are transcribed, calls recorded here are saved into it.
        "callsDir": "",
        # What runs where, made by Kryakl from this computer's measurements (src/speechplan.ts):
        # {threads, cpu: {dictation: {model, beam}, transcripts: {model}}, cuda: {... compute}}.
        "plan": {},
        # How fast each model runs here: {fingerprint, at, runs: {"model|device|compute": {phrase, rtf, n, at}}}.
        "bench": {},
    }


def adopt_altype(file: Path = SETTINGS_FILE, old: Path = ALTYPE_SETTINGS) -> None:
    """Altype's speech.json, once, when Kryakl did not move it over itself (main.ts moves it at start)."""
    if file.exists() or not old.exists():
        return
    try:
        file.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(old), str(file))
        log.info("adopted Altype's speech settings")
    except OSError as error:
        log.warning("could not adopt Altype's speech settings: %s", error)


def adopt_altscribe(file: Path = SETTINGS_FILE) -> None:
    """Altscribe's settings (its library folder, knowledge base, Hugging Face key) and models, once."""
    if TEST_HOME:
        return
    adopt_altype(file)
    if not file.exists() and OLD_SETTINGS.exists():
        try:
            file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(OLD_SETTINGS, file)
            log.info("adopted Altscribe's settings")
        except OSError as error:
            log.warning("could not adopt Altscribe's settings: %s", error)
    if not MODELS_DIR.exists() and OLD_MODELS.exists():
        try:
            MODELS_DIR.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(OLD_MODELS), str(MODELS_DIR))
            log.info("adopted Altscribe's models")
        except OSError as error:
            log.warning("could not adopt Altscribe's models: %s", error)


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


def move_transcripts(settings: "Settings", old: Path | None = None, new: Path | None = None) -> bool:
    r"""Krya's or Altype's library (Documents\Krya\Transcripts, Documents\Altype\Transcripts) becomes Kryakl's
    (Documents\Kryakl\Transcripts), once, by a rename; with no `old` given, each old name's in turn, newest first.

    Only the old default moves, never a folder the person chose; only into a Kryakl folder that is
    missing or empty; only when no transcript is being made (a failed one's leftover chunks do not
    hold it; its job's paths are pointed into the new folder). Anything in the way: nothing moves,
    dataDir stays, and the next start tries again. Run before the library is opened."""
    if old is None:
        if TEST_HOME:
            return False
        return any(move_transcripts(settings, o, new) for o in old_data_dirs())
    new = new or default_data_dir()
    current = Path(settings["dataDir"])
    # dataDir naming Kryakl's own default (a speech.json without dataDir) counts too: the old default showed the old name's there.
    if not old.is_dir() or not (_same(current, old) or _same(current, new)):
        return False
    if new.exists():
        if not new.is_dir() or any(new.iterdir()):
            log.info("transcripts stay in %s: %s already holds files", old, new)
            return False
    why = _unfinished(old)
    if why:
        log.info("transcripts stay in %s for now: %s", old, why)
        return False
    prefixes = _prefixes(old)
    try:
        if new.exists():
            new.rmdir()
        new.parent.mkdir(parents=True, exist_ok=True)
        os.rename(old, new)
    except OSError as error:
        log.warning("transcripts stay in %s for now, the move failed: %s", old, error)
        return False
    settings.update({"dataDir": str(new)})
    try:
        _repoint(new, prefixes)
    except (sqlite3.Error, ValueError, OSError) as error:
        log.warning("moved the transcripts, but their jobs still name %s: %s", old, error)
    try:
        old.parent.rmdir()  # Documents\Krya or \Altype, when nothing else is in it
    except OSError:
        pass
    log.info("moved the transcripts from %s to %s", old, new)
    return True


def clean_plan(plan: dict) -> dict:
    """A plan as Kryakl sends it, with anything this engine does not know left out."""
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
    """The vocabulary as Kryakl sends it, as [{word, heard}]; a bare string is a word heard no other way.

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
    """The notes' folder inside the knowledge base: a relative path (Inbox, Notes/Kryakl), never out of it."""
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
