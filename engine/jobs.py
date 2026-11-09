"""One worker on the GPU: a queue of transcripts to make, one at a time.

A job is kept in its row (`job`), so a queue cut short by a restart picks up
where it was. A recording whose chunks stopped coming (the browser closed
mid-meeting) is finished with what arrived.

Besides new transcripts (`task` absent), a finished one can be worked on again:
"speakers" splits it by speaker from its saved sound and words, "redo"
recognizes its saved sound anew (for transcripts made before words were kept).
"""

from __future__ import annotations

import bisect
import gc
import json
import logging
import os
import queue
import re
import shutil
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Callable

import asr
import audio
import calls
import merge
import notes
import vocab
import voices
from asr import CudaFailed, Parakeet, Transcriber
from bench import Bench
from diarize import Diarizer, NeedsPart, NeedsToken
from settings import ALL_MODELS, CPU_DICTATION, Settings
from store import Store

log = logging.getLogger("tyts.jobs")

IDLE_UNLOAD = 600     # seconds without work before the processor's models are let go
CARD_IDLE = 180       # the graphics card's sooner: it is the person's programs' (2026-10-31)
CARD_HEADROOM_MB = 512  # what a model on the card leaves free for them, as Tyts's src/resources.ts
# Seconds without a phrase before dictation's model is let go: longer when there is memory to spare.
DICTATION_IDLE = {"roomy": 1800, "tight": 600}
YIELD_LONGEST = 60    # seconds a transcription on the processor waits at most for a dictation to finish
STALE = 180           # seconds without a chunk before a recording counts as cut off
# Each stage's share of the bar, by the time it takes on an hour of audio
# (src/webview/app.ts keeps the same numbers to say how far a stage is).
WEIGHTS = {"decode": (0.0, 0.1), "words": (0.1, 0.6), "speakers": (0.6, 0.95), "save": (0.95, 1.0)}
# A finished transcript worked on again: when that fails, the old one stays.
AGAIN = ("speakers", "redo")
# A call is transcribed while it records, a piece at a time, where the plan reads calls with Parakeet (a Mac,
# 2026-11-09: a call of two hours on an 8 GB M1 waited ~50 min after Stop). Only the rest is left for the end.
PIECE = 300   # seconds of new sound on a track before its next piece is transcribed
SLICE = 10    # seconds in one chunk the recording sends (src/webview/capture.ts SLICE)
PREROLL = 50  # packets (1 s) decoded before a piece's start and thrown away: Opus settles in a few frames
QUIET = 0.3   # seconds of silence between two spans of speech (each padded 0.3 s) where a piece may end


def ram_gb() -> float:
    """This computer's memory, in GB (Windows' GlobalMemoryStatusEx); 8 when it cannot be read."""
    try:
        import ctypes

        class Status(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("load", ctypes.c_ulong), ("total", ctypes.c_ulonglong), ("free", ctypes.c_ulonglong),
                        ("pageTotal", ctypes.c_ulonglong), ("pageFree", ctypes.c_ulonglong), ("virtualTotal", ctypes.c_ulonglong),
                        ("virtualFree", ctypes.c_ulonglong), ("extended", ctypes.c_ulonglong)]

        status = Status()
        status.length = ctypes.sizeof(Status)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return status.total / 2**30
    except (AttributeError, OSError):
        pass
    return 8.0


def finish_recording(store: Store, id: str, options: dict | None = None, interrupted: bool = False) -> bool:
    """Joins a recording's chunks per track and queues it. False when nothing arrived."""
    row = store.row(id)
    if row is None or row["status"] != "recording":
        return False
    job = row["job"]
    incoming = store.folder(id) / "incoming"
    starts = {track: info.get("startedAt", 0) for track, info in job.get("tracks", {}).items()}
    first = min(starts.values(), default=0)
    inputs = []
    for track in starts:
        parts = sorted(incoming.glob(f"{track}-*.part"))
        if not parts:
            continue
        joined = incoming / f"{track}.webm"
        with joined.open("wb") as out:
            for part in parts:
                with part.open("rb") as src:
                    shutil.copyfileobj(src, out)
                part.unlink()
        inputs.append({"path": str(joined), "track": track, "offset": (starts[track] - first) / 1000, "temp": True})
    if not inputs:
        store.delete(id)
        return False
    job["inputs"] = inputs
    job.update({k: v for k, v in (options or {}).items() if k in ("language", "speakers", "lost")})
    store.update(id, status="queued", job=job, stage="", progress=0, error="The recording was cut off; what arrived is transcribed" if interrupted else "")
    return True


def cut_at_silence(spans: list[tuple[int, int]], length: int) -> int:
    """Where a piece of `length` samples ends: in the middle of the last silence of QUIET s or more (after the
    last speech, 1 s before the end at most), so no word is split. With no such silence, where Silero itself
    split the last span (its 30 s longest)."""
    quiet = int(QUIET * audio.RATE)
    cut = None
    for a, b in zip([0] + [end for _, end in spans], [start for start, _ in spans] + [length]):
        if b - a >= quiet:
            cut = max((a + b) // 2, b - audio.RATE) if b == length else (a + b) // 2
    if cut is None and spans and spans[-1][0] > 0:
        cut = spans[-1][0]
    return cut if cut is not None else length


def shifted(segments: list[dict], by: float) -> list[dict]:
    """Segments with their times and their words' moved by `by` seconds."""
    move = lambda x: {**x, "start": round(x["start"] + by, 2), "end": round(x["end"] + by, 2)}
    return [{**move(s), "words": [move(w) for w in s.get("words") or []]} for s in segments]


def read_pieces(path: Path) -> dict | None:
    """A track's pieces kept while it recorded (incoming/pieces-{track}.json), or None when missing or broken."""
    try:
        kept = json.loads(path.read_text("utf-8"))
        ok = (isinstance(kept["end"], (int, float)) and kept["end"] >= 0 and isinstance(kept["segments"], list)
              and all(isinstance(s, dict) and isinstance(s["start"], (int, float)) and isinstance(s["end"], (int, float))
                      and isinstance(s.get("words", []), list) for s in kept["segments"])
              and all(isinstance(kept[k], int) for k in ("covered", "first", "firstAt")))
        return kept if ok else None
    except (OSError, ValueError, KeyError, TypeError):
        return None


# A call's screenshots (PUT /recordings/{id}/shots/{ms}): shots/<ms from the start>[-m].jpg, -m for one the person took.
SHOT_NAME = re.compile(r"(\d{1,9})(-m)?\.jpg")


def shots_in(folder: Path, before: list | None = None) -> list[dict]:
    """The recording's screenshots by time, as transcript.json keeps them; `key` (set by the summary's pass) kept from `before`."""
    keys = {s.get("file") for s in before or [] if isinstance(s, dict) and s.get("key")}
    out = []
    for path in sorted((folder / "shots").glob("*.jpg"), key=lambda p: int(SHOT_NAME.fullmatch(p.name).group(1)) if SHOT_NAME.fullmatch(p.name) else -1):
        m = SHOT_NAME.fullmatch(path.name)
        if not m:
            continue
        shot = {"at": int(m.group(1)) / 1000, "file": path.name, "manual": bool(m.group(2))}
        if path.name in keys:
            shot["key"] = True
        out.append(shot)
    return out


class Worker:
    def __init__(self, settings: Settings, get_store: Callable[[], Store]):
        self.settings = settings
        self.get_store = get_store
        # Two workers: a dictated phrase need not wait for a long recording's window when both use one model.
        self.transcriber = Transcriber(workers=2)
        # Dictation's own model, when the plan gives it another one than transcripts (on the CPU, a quicker one).
        self.dictator = Transcriber()
        # Parakeet, when the plan has it dictate (the processor, a European language).
        self.parakeet = Parakeet()
        self.last_dictation = time.monotonic()
        # A dictation is being recognized now (app.py's sessions): a transcription on the processor waits for it.
        self.dictating: Callable[[], bool] = lambda: False
        self.diarizer = Diarizer()
        self.bench = Bench(settings)
        self.queue: queue.Queue[str] = queue.Queue()
        self.current: str | None = None
        # Pieces of a call being transcribed while it records (_pieces): the worker is not idle then.
        self.piecing = False
        # Recordings whose pieces failed once: the end transcribes the rest of them whole.
        self.unpieced: set[str] = set()
        self.last_work = time.monotonic()
        self.last_scan = 0.0
        # Why the card is not used though it is there (it would not take a model); the processor's plan applies until a restart.
        self.fallback: str | None = None
        # Grows with every phrase and job started: the speed test sees it was disturbed.
        self.activity = 0
        self._thread = threading.Thread(target=self._run, name="tyts-worker", daemon=True)

    def start(self) -> None:
        store = self.get_store()
        for row in store.rows(("queued", "working")):
            self.submit(row["id"])
        self._thread.start()

    def submit(self, id: str) -> None:
        self.queue.put(id)

    @property
    def device(self) -> str | None:
        return self.transcriber.device or self.dictator.device

    # ------------------------------------------------------------ the plan

    def use_cuda(self) -> bool:
        return not self.fallback and asr.gpu()

    def threads(self) -> int:
        """The processor's threads for one model: the plan's (the physical cores), else half the logical ones."""
        return int(self.settings["plan"].get("threads") or max(1, (os.cpu_count() or 2) // 2))

    def entry(self, feature: str, device: str | None = None) -> tuple[str, dict]:
        """The device and {model, compute?, beam?} for dictation or transcripts: Tyts's plan, else the rule before plans."""
        device = device or ("cuda" if self.use_cuda() else "cpu")
        planned = self.settings["plan"].get(device, {}).get(feature)
        if planned:
            # A processor-only model in the card's plan (Parakeet dictating, the card left to the person's programs) runs on the processor.
            runs_on = ALL_MODELS.get(planned["model"], {}).get("devices") or [device]
            return (device if device in runs_on else runs_on[0]), planned
        model = self.settings["model"]
        if feature == "dictation" and device == "cpu":
            model = CPU_DICTATION
        return device, {"model": model}

    def _card_full(self, t: Transcriber, entry: dict) -> str | None:
        """Why the card cannot take this model whole now (another program holds its memory), or None.
        A model already on it holds its memory, and a card that cannot say is tried as before."""
        if t.loaded and t.device == "cuda" and t.name == entry["model"]:
            return None
        need = ALL_MODELS.get(entry["model"], {}).get("vramMb", {}).get(entry.get("compute") or "float16", 0)
        free = asr.card_free_mb()
        if free is None or not need or free >= need + CARD_HEADROOM_MB:
            return None
        return f"the graphics card has {free} MB free, {entry['model']} needs {need}"

    def _load(self, t: Transcriber, feature: str) -> tuple[str, dict]:
        device, entry = self.entry(feature)
        # The card is the person's programs' (2026-10-31): too little of it free, this one on the processor.
        full = self._card_full(t, entry) if device == "cuda" else None
        if full:
            log.info("%s: %s; on the processor this time", feature, full)
            device, entry = self.entry(feature, "cpu")
        try:
            t.load(entry["model"], device, entry.get("compute"), self.threads())
        except CudaFailed as error:
            self.fallback = str(error)
            log.warning("the card would not take %s; the processor's plan from now on", entry["model"])
            device, entry = self.entry(feature, "cpu")
            t.load(entry["model"], device, None, self.threads())
        return device, entry

    def words_model(self) -> Transcriber | Parakeet:
        """The transcripts' model, loaded: Parakeet is dictation's own copy when the plan gives it both (a Mac's calls)."""
        _, entry = self.entry("transcripts")
        if asr.backend(entry["model"]) == "parakeet":
            self.parakeet.load(entry["model"], "cpu", None, self.threads())
            return self.parakeet
        self._load(self.transcriber, "transcripts")
        return self.transcriber

    def dictation_model(self) -> tuple[Transcriber | Parakeet, dict]:
        """Dictation's model, loaded: the transcripts' own when the plan gives both the same (one copy in memory)."""
        self.last_dictation = time.monotonic()
        device, entry = self.entry("dictation")
        if asr.backend(entry["model"]) == "parakeet":
            self.parakeet.load(entry["model"], "cpu", None, self.threads())
            return self.parakeet, entry
        _, words = self.entry("transcripts", device)
        same = words["model"] == entry["model"] and words.get("compute") == entry.get("compute")
        t = self.transcriber if same else self.dictator
        _, entry = self._load(t, "dictation")
        return t, entry

    def unload_all(self) -> None:
        self.transcriber.unload()
        self.dictator.unload()
        self.parakeet.unload()
        self.diarizer.unload()
        gc.collect()
        try:
            import torch

            torch.cuda.empty_cache()
        except Exception:
            pass

    def idle(self) -> bool:
        return self.current is None and self.queue.empty() and not self.piecing

    def drop_unplanned(self, busy: Callable[[], bool] = lambda: False) -> list[str]:
        """The models in memory that no feature's plan names now (the person picked another): out at once, not
        after resting, so they hold no memory and their files can go. Never while a job or a phrase may use one."""
        if not self.idle() or self.dictating() or busy():
            return []
        # The other device's plan counts too: the processor's is the reserve should the card refuse.
        planned = {self.entry(feature, device)[1]["model"] for feature in ("dictation", "transcripts") for device in ("cuda", "cpu")}
        gone = []
        for t in (self.transcriber, self.dictator, self.parakeet):
            name = t.name
            if t.loaded and name not in planned:
                t.unload(name)
                gone.append(name)
        if gone:
            log.info("unloaded, no longer planned: %s", ", ".join(gone))
            gc.collect()
        return gone

    def yield_to_dictation(self) -> None:
        """A transcription on the processor stops between its windows while someone dictates: the phrase comes first."""
        until = time.monotonic() + YIELD_LONGEST
        while self.dictating() and time.monotonic() < until:
            time.sleep(0.05)

    def _run(self) -> None:
        while True:
            try:
                id = self.queue.get(timeout=30)
            except queue.Empty:
                self._housekeeping()
                continue
            self.current = id
            self.activity += 1
            try:
                self._process(id)
            except Exception as error:
                log.exception("job %s failed", id)
                self._failed(id, str(error) or type(error).__name__)
            finally:
                self.current = None
                self.last_work = time.monotonic()

    def _failed(self, id: str, message: str) -> None:
        store = self.get_store()
        row = store.row(id)
        task = row["job"].get("task") if row else None
        if task in AGAIN and store.transcript(id):
            what = "split by speaker" if task == "speakers" else "transcribe again"
            store.update(id, status="done", stage="", progress=1.0, error=f"Could not {what}: {message}", job={"kind": row["job"].get("kind")})
        else:
            store.update(id, status="failed", stage="", error=message)

    def scan_calls(self) -> int:
        """Media put into the transcripts folder queued (at a change of the folder, and every few minutes)."""
        self.last_scan = time.monotonic()
        try:
            return calls.scan(self.get_store(), self.submit)
        except OSError as error:
            log.warning("transcripts folder: %s", error)
            return 0

    def _housekeeping(self) -> None:
        self.drop_unplanned()
        store = self.get_store()
        if time.monotonic() - self.last_scan > calls.SCAN_EVERY:
            self.scan_calls()
        now = datetime.now()
        for row in store.rows(("recording",)):
            touched = datetime.fromisoformat(row["touched"] or row["created"])
            if (now - touched).total_seconds() > STALE and finish_recording(store, row["id"], interrupted=True):
                self.submit(row["id"])
        self._pieces()
        now = time.monotonic()
        keep = DICTATION_IDLE["roomy" if ram_gb() >= 12 else "tight"]

        # The graphics card is the person's (2026-10-31): a model on it goes after a few idle minutes, as llama.cpp's.
        def resting(device: str | None) -> bool:
            return now - self.last_work > (CARD_IDLE if device == "cuda" else IDLE_UNLOAD)

        def dictating(device: str | None) -> bool:
            return now - self.last_dictation < (CARD_IDLE if device == "cuda" else keep)

        gone = []
        if self.diarizer.loaded and resting(self.diarizer.device):
            self.diarizer.unload()
            gone.append("speakers")
        # The transcripts' model goes, unless dictation shares it and is still in use.
        shared = self.transcriber.loaded and self.transcriber.name == self.entry("dictation")[1]["model"]
        if self.transcriber.loaded and resting(self.transcriber.device) and not (shared and dictating(self.transcriber.device)):
            gone.append(f"{self.transcriber.name} ({self.transcriber.device})")
            self.transcriber.unload()
        for t in (self.dictator, self.parakeet):
            if t.loaded and not dictating(t.device):
                gone.append(f"{t.name} for dictation ({t.device})")
                t.unload()
        if gone:
            log.info("unloaded after resting: %s", ", ".join(gone))
            gc.collect()

    # ------------------------------------------------------------ a call's pieces while it records

    def _pieces(self) -> None:
        """Calls being recorded, transcribed piece by piece where the plan reads them with Parakeet. It runs in
        the worker's own loop when the queue is empty (every 30 s), so never beside a job on the same model and,
        like a job, waiting between batches for a dictation; a long job in the queue holds the pieces back."""
        if asr.backend(self.entry("transcripts")[1]["model"]) != "parakeet":
            return
        store = self.get_store()
        for row in store.rows(("recording",)):
            job = row["job"]
            tracks = job.get("tracks", {})
            # Only a call's two tracks: the end reads them apart (the microphone as "me"), anything else mixed.
            if row["id"] in self.unpieced or job.get("kind") != "system" or not {"mic", "system"} <= set(tracks):
                continue
            first = min(info.get("startedAt", 0) for info in tracks.values())
            self.piecing = True
            try:
                for track in ("mic", "system"):
                    offset = (tracks[track].get("startedAt", 0) - first) / 1000
                    while self.queue.empty() and self._piece(store.folder(row["id"]) / "incoming", track, offset, job):
                        pass
            except Exception:
                # The recording goes on; the end transcribes from the last piece kept.
                log.exception("pieces of %s failed", row["id"])
                self.unpieced.add(row["id"])
            finally:
                self.piecing = False

    def _piece(self, incoming: Path, track: str, offset: float, job: dict) -> bool:
        """The track's next piece, once PIECE s of new sound have come: from the last piece's end to a silence,
        transcribed and kept with its times on the recording's in pieces-{track}.json. True when one was made.
        Only this piece's sound is held: the chunks so far are joined on disk and read from the last piece on."""
        path = incoming / f"pieces-{track}.json"
        kept = read_pieces(path) or {"covered": 0, "first": 0, "firstAt": 0, "end": offset, "segments": [], "language": ""}
        parts = sorted(incoming.glob(f"{track}-*.part"))[:-1]  # the newest may be being written still
        if len(parts) * SLICE - kept["covered"] / audio.RATE < PIECE:
            return False
        joined = incoming / f"pieces-{track}.webm"
        try:
            # ponytail: joined anew each time (tens of MB a track); keep it growing if two hours' copying shows.
            with joined.open("wb") as out:
                for part in parts:
                    with part.open("rb") as src:
                        shutil.copyfileobj(src, out)
            skip = kept["covered"] - kept["firstAt"]
            samples, starts = audio.decode_from(joined, kept["first"], skip + PIECE * audio.RATE)
        finally:
            joined.unlink(missing_ok=True)
        new = samples[skip:]
        # Chunks lost on the way: less sound than counted, so wait for more.
        if len(new) < (PIECE - SLICE) * audio.RATE:
            return False
        cut = cut_at_silence(asr.speech_spans(new), len(new))
        self.activity += 1
        settings = self.settings.get()
        language = job.get("language") or settings["language"]
        segments, spoken = self._recognize(new[:cut], None if language == "auto" else language, settings)
        covered = kept["covered"] + cut
        k = max(bisect.bisect_right(starts, covered - kept["firstAt"]) - 1 - PREROLL, 0)
        kept.update(segments=kept["segments"] + shifted(segments, offset + kept["covered"] / audio.RATE), covered=covered,
                    first=kept["first"] + k, firstAt=kept["firstAt"] + starts[k], end=round(offset + covered / audio.RATE, 3),
                    language=spoken or kept["language"])
        part = path.with_suffix(".part")
        part.write_text(json.dumps(kept), "utf-8")
        part.replace(path)
        return True

    def _recognize(self, samples, language: str | None, settings: dict, step: Callable[[float], None] = lambda p: None) -> tuple[list[dict], str]:
        """The transcripts' model's segments for this sound and the language heard, spelled as the vocabulary says.
        A job's tracks and a call's pieces both come this way."""
        t = self.words_model()

        def each(p):
            step(p)
            if t.device == "cpu":
                self.yield_to_dictation()

        started = time.perf_counter()
        segments, spoken = t.transcribe(samples, language, vocab.hotwords(settings["vocabulary"], settings["hotwords"]), each)
        self.bench.words(t.name, t.device, t.compute, audio.duration(samples), time.perf_counter() - started)
        # Spelled as the vocabulary says before the words are numbered and kept (merge.py), so the
        # kept words, the utterances and a later split by speaker all read the same; in a meeting
        # both tracks are corrected alike, so the echo of a name is still found on the microphone.
        return vocab.correct_segments(segments, settings["vocabulary"]), spoken

    def _process(self, id: str) -> None:
        row = self.get_store().row(id)
        if row is None or row["status"] not in ("queued", "working"):
            return
        if row["job"].get("task") == "speakers":
            self._resplit(id, row)
        else:
            self._transcribe(id, row)

    def _progress(self, id: str) -> Callable[..., None]:
        store = self.get_store()

        def progress(stage: str, part: float = 0.0) -> None:
            a, b = WEIGHTS[stage]
            store.update(id, status="working", stage=stage, progress=round(a + (b - a) * part, 3))

        return progress

    def _speakers(self, id: str, samples, wanted: int | None, progress) -> tuple[list | None, str]:
        """Speaker turns and how it went: ok, no-part, needs-token or failed (the text is kept either way)."""
        progress("speakers")
        try:
            token = self.settings["hfToken"]
            self.diarizer.load(token)
            started = time.perf_counter()
            turns = self.diarizer.diarize(samples, token, wanted, lambda p: progress("speakers", p))
            self.bench.speakers(self.diarizer.device, audio.duration(samples), time.perf_counter() - started)
            return turns, "ok"
        except NeedsPart:
            return None, "no-part"
        except NeedsToken:
            return None, "needs-token"
        except Exception:
            log.exception("speakers failed for %s", id)
            return None, "failed"

    def _transcribe(self, id: str, row: dict) -> None:
        store = self.get_store()
        job = row["job"]
        kind = job.get("kind", row["source"])
        settings = self.settings.get()
        progress = self._progress(id)

        progress("decode")
        inputs = job.get("inputs", [])
        tracks = {}
        for n, item in enumerate(inputs):
            share = lambda p, n=n: progress("decode", (n + p) / len(inputs))
            tracks[item["track"]] = (audio.decode(item["path"], share), item.get("offset", 0.0))
        # The mix is made only when it is used: a call's two tracks of two hours are 450 MB each, and on a
        # Mac of 8 GB every copy more sent the run into swap (2026-11-09).
        duration = max((offset + audio.duration(samples) for samples, offset in tracks.values()), default=0.0)
        if duration < 0.5:
            raise ValueError("The recording is empty")
        # The window can say how far into the recording the words are.
        store.update(id, duration=round(duration, 2))

        language = job.get("language") or settings["language"]
        language = None if language == "auto" else language
        speakers_status = "single"

        def words(samples, share=(0.0, 1.0)):
            a, b = share
            return self._recognize(samples, language, settings, lambda p: progress("words", a + (b - a) * p))

        # Loading the model, finding the language and cutting the silence come before the first words.
        progress("words")
        # A call (the computer's sound; a meeting of the Chrome extension's days, its tab, alike): the microphone is "me", the rest by voice.
        other = next((t for t in ("tab", "system") if t in tracks), None)
        if kind in ("meet", "system") and "mic" in tracks and other:
            mine = audio.pad(*tracks["mic"])
            theirs = audio.pad(*tracks[other])
            # The shifted copies replace the tracks, so each sound is held once.
            tracks = {"mic": (mine, 0.0), other: (theirs, 0.0)}
            # The pieces transcribed while the call recorded (_piece): only the sound after them is read now.
            # Missing, broken or past the track's end, the track is read whole: the text is never lost.
            pieces = {}
            for track, samples in (("mic", mine), (other, theirs)):
                kept = None if job.get("task") else read_pieces(store.folder(id) / "incoming" / f"pieces-{track}.json")
                if kept and kept["end"] <= audio.duration(samples):
                    pieces[track] = kept
            start = {track: int(round(pieces[track]["end"] * audio.RATE)) if track in pieces else 0 for track in ("mic", other)}
            rest = len(mine) - start["mic"], len(theirs) - start[other]
            share = rest[0] / max(sum(rest), 1)

            def words_after(track, samples, share):
                segments, spoken = words(samples[start[track]:], share)
                if track not in pieces:
                    return segments, spoken
                kept = pieces[track]
                return kept["segments"] + shifted(segments, start[track] / audio.RATE), spoken or kept.get("language") or ""

            # On a Mac's plan (Parakeet) the microphone's echo of the speakers is silenced before it is read;
            # the pieces made during the call read it as it was (the other track was not at hand).
            if isinstance(self.words_model(), Parakeet):
                n = min(len(mine), len(theirs))
                muted = asr.mute_echo(mine[start["mic"]:n], theirs[start["mic"]:n])
                log.info("the microphone's echo of the speakers: %.0f s not read", muted)
            my_segments, my_language = words_after("mic", mine, (0.0, share))
            their_segments, their_language = words_after(other, theirs, (share, 1.0))
            spoken = their_language if their_segments else my_language
            turns, speakers_status = self._speakers(id, theirs, job.get("speakers"), progress)
            utterances, kept = merge.meeting(my_segments, their_segments, turns, other)
        else:
            mixed = audio.mix(list(tracks.values()))
            tracks = {"mixed": (mixed, 0.0)}
            segments, spoken = words(mixed)
            turns = None
            if kind != "note":
                turns, speakers_status = self._speakers(id, mixed, job.get("speakers"), progress)
            utterances, kept = merge.single(segments, turns)
            if kind == "note":
                for u in utterances:
                    u["speaker"] = merge.ME

        progress("save")
        labels = [u["speaker"] for u in utterances]
        speakers = merge.renumber(utterances)
        prints = voices.keyed(self.diarizer.voices, labels, [u["speaker"] for u in utterances]) if turns else {}
        if not job.get("keepAudio"):
            audio.save_opus(audio.mix(list(tracks.values())), store.folder(id) / "audio.ogg", progress=lambda p: progress("save", p * 0.9))
        transcript = {
            "id": id,
            "title": row["title"],
            "source": row["source"],
            "created": row["created"],
            "duration": round(duration, 2),
            "language": spoken,
            "speakers": speakers,
            "utterances": utterances,
            "words": kept,
            "audio": "audio.ogg",
            "speakersStatus": speakers_status,
        }
        # A transcript made again keeps what is not made from the sound: the summary, the call's program, its lost chunks.
        before = store.transcript(id) or {}
        for key in ("app", "lost", "summary"):
            value = job.get(key, before.get(key))
            if value:
                transcript[key] = value
        shots = shots_in(store.folder(id), before.get("shots"))
        if shots:
            transcript["shots"] = shots
        if kind == "note":
            transcript["title"] = notes.first_words(" ".join(u["text"] for u in utterances), 8)
            try:
                transcript["note"] = str(notes.write_note(transcript, settings["kbDir"], settings["kbInbox"]))
            except notes.NoKnowledgeBase:
                transcript["noteError"] = "No knowledge base folder is chosen: the note stays in Transcripts"
        # A call goes into the transcripts folder beside a Markdown of its text (calls.py); an imported file gets the Markdown beside it.
        file = row.get("file")
        if kind == "system" and not file:
            try:
                file = calls.save_call(store, id, transcript)
            except OSError as error:
                log.warning("transcripts folder: could not save the call: %s", error)
        if file:
            store.update(id, file=file)
            try:
                calls.write_md(transcript, file)
            except OSError as error:
                log.warning("transcripts folder: could not write the Markdown: %s", error)
        store.save(id, transcript)
        # Each speaker's voice print, to be filed under the name the person gives (voices.py); none without speakers.
        voices.known.keep(id, prints)
        # The sources go only now: a job that fails on the way can run again from them.
        for item in inputs:
            if item.get("temp"):
                Path(item["path"]).unlink(missing_ok=True)
        shutil.rmtree(store.folder(id) / "incoming", ignore_errors=True)
        store.update(id, status="done", stage="", progress=1.0, speakers_status=speakers_status, job={"kind": kind})

    def _resplit(self, id: str, row: dict) -> None:
        """Speakers for a finished transcript from its saved sound and words; the text is not recognized again."""
        store = self.get_store()
        progress = self._progress(id)
        t = store.transcript(id)
        if not t or not t.get("words"):
            raise ValueError("the recording keeps no words")
        progress("decode")
        samples = audio.decode(store.folder(id) / t.get("audio", "audio.ogg"), lambda p: progress("decode", p))
        store.update(id, duration=t.get("duration", 0))
        turns, status = self._speakers(id, samples, row["job"].get("speakers"), progress)
        if status == "no-part":
            raise ValueError("the speakers part is not installed")
        if status == "needs-token":
            raise ValueError("a Hugging Face key is needed")
        if status != "ok":
            raise ValueError("the speakers model failed, see speech.log")
        progress("save")
        me = t.get("speakers", {}).get(merge.ME)
        t["utterances"] = merge.resplit(t, turns or [])
        labels = [u["speaker"] for u in t["utterances"]]
        t["speakers"] = merge.renumber(t["utterances"])
        # The speakers are new: their prints too, and what was rejected for the old ones goes.
        voices.known.keep(id, voices.keyed(self.diarizer.voices, labels, [u["speaker"] for u in t["utterances"]]))
        t.pop("voiceRejected", None)
        if me and merge.ME in t["speakers"]:
            t["speakers"][merge.ME] = me
        t["speakersStatus"] = "ok"
        store.save(id, t)
        store.update(id, status="done", stage="", progress=1.0, speakers_status="ok", error="", job={"kind": row["job"].get("kind")})
