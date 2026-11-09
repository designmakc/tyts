"""Who spoke when: pyannote's community-1 pipeline; on a Mac, FluidAudio through a helper of ours.

Hugging Face asks for a free token once, to download it; after that the
pipeline is loaded from MODELS_DIR/diarization and works offline. A token is
checked as soon as it is saved (`Setup`), and the model downloaded there and
then, so the window can say at once whether speakers will work.

On a Mac (2026-11-09) the speakers are told apart by FluidAudio on the Neural Engine
(CoreML), run as vendor/speakers-mac on a WAV of the samples: 10 minutes of a call in
7.5 s on an M1 with 8 GB, where pyannote took 6-14 minutes. Its models are downloaded by
Tyts into MODELS_DIR/speakers-mac; no Hugging Face key, no torch.
"""

from __future__ import annotations

import importlib.util
import json
import logging
import os
import subprocess
import sys
import tempfile
import threading
import wave
from pathlib import Path
from typing import Callable

import numpy as np

from audio import RATE
from settings import MODELS_DIR

log = logging.getLogger("tyts.diarize")

REPO = "pyannote/speaker-diarization-community-1"
LOCAL = MODELS_DIR / "diarization"
MAC_MODELS = MODELS_DIR / "speakers-mac"
# A 3 h call takes about 2 minutes on an M1; 30 minutes is for a Mac far busier than that.
MAC_TIMEOUT = 30 * 60

_download_lock = threading.Lock()


class NeedsToken(Exception):
    """Speakers are not split until a Hugging Face token lets the model download."""


class NeedsPart(Exception):
    """The speakers part (pyannote and torch; on a Mac the helper and its models) is not here."""


def mac() -> bool:
    return sys.platform == "darwin"


def helper() -> Path:
    """The Mac's helper: app.asar.unpacked/vendor beside this engine folder, in development the repo's vendor."""
    path = os.environ.get("TYTS_SPEAKERS_HELPER")
    return Path(path) if path else Path(__file__).resolve().parent.parent / "vendor" / "speakers-mac"


def installed() -> bool:
    if mac():
        return helper().is_file() and os.access(helper(), os.X_OK)
    # find_spec of "pyannote.audio" imports "pyannote" first, and raises when even that is missing.
    return importlib.util.find_spec("pyannote") is not None and importlib.util.find_spec("pyannote.audio") is not None


def downloaded() -> bool:
    if mac():
        return MAC_MODELS.is_dir() and any(MAC_MODELS.iterdir())
    return (LOCAL / "config.yaml").exists()


def download(token: str) -> None:
    """The whole pipeline into LOCAL, once; the setup and a job may both ask."""
    with _download_lock:
        if downloaded():
            return
        from huggingface_hub import snapshot_download

        log.info("downloading %s", REPO)
        snapshot_download(REPO, local_dir=str(LOCAL), token=token)


class Setup:
    """A token's check and the model's download, in the background.

    state: idle, checking, downloading, ready, bad-token (wrong or deleted),
    no-access (the model's terms are not accepted), failed (no connection…).
    """

    def __init__(self):
        self.state = "ready" if downloaded() else "idle"
        self.message = ""
        self._lock = threading.Lock()

    def start(self, token: str) -> None:
        if mac():  # no key on a Mac: the models come with the speakers part
            return
        with self._lock:
            if self.state in ("checking", "downloading") or not token:
                return
            if downloaded():
                self.state = "ready"
                return
            self.state, self.message = "checking", ""
        threading.Thread(target=self._run, args=(token,), name="tyts-setup", daemon=True).start()

    def _run(self, token: str) -> None:
        from huggingface_hub import HfApi
        from huggingface_hub.errors import GatedRepoError, HfHubHTTPError, RepositoryNotFoundError

        try:
            # The key itself first: for a gated model Hugging Face answers a wrong key and a
            # missing agreement alike.
            HfApi().whoami(token=token)
            HfApi().auth_check(REPO, token=token)
        except GatedRepoError:
            self.state, self.message = "no-access", ""
            return
        except (RepositoryNotFoundError, HfHubHTTPError) as error:
            status = getattr(getattr(error, "response", None), "status_code", None)
            if isinstance(error, RepositoryNotFoundError) or status in (401, 403):
                self.state, self.message = "bad-token", ""
            else:
                self.state, self.message = "failed", f"Hugging Face answered {status or 'with an error'}"
            return
        except Exception as error:
            log.warning("token check failed: %s", error)
            self.state, self.message = "failed", "No connection to Hugging Face"
            return
        self.state = "downloading"
        try:
            download(token)
            self.state = "ready"
        except Exception as error:
            log.exception("download failed")
            self.state, self.message = "failed", f"The download failed: {error}"


def status(token: str, setup: Setup) -> str:
    """For /health: ready, needs-token, or where the setup is; on a Mac ready or missing."""
    if mac():
        return "ready" if installed() and downloaded() else "missing"
    if downloaded():
        return "ready"
    if setup.state not in ("idle", "ready"):
        return setup.state
    return "missing" if token else "needs-token"


class Diarizer:
    def __init__(self):
        self._pipeline = None
        self._lock = threading.Lock()
        self.device = "ane" if mac() else "cpu"
        # The last run's voice print per label (the mean embedding of its turns), for voices.py.
        self.voices: dict[str, list[float]] = {}

    @property
    def loaded(self) -> bool:
        return self._pipeline is not None

    def load(self, token: str) -> None:
        if mac():  # nothing stays in memory: the helper runs only while it splits
            if not installed() or not downloaded():
                raise NeedsPart()
            self.device = "ane"
            return
        with self._lock:
            if self._pipeline is not None:
                return
            if not installed():
                raise NeedsPart()
            if not downloaded():
                if not token:
                    raise NeedsToken()
                download(token)
            import torch
            from pyannote.audio import Pipeline

            pipeline = Pipeline.from_pretrained(str(LOCAL))
            self.device = "cpu"
            if torch.cuda.is_available():
                try:
                    pipeline.to(torch.device("cuda"))
                    self.device = "cuda"
                except Exception as error:  # the card is full (Whisper on it): slower, but it still works
                    log.warning("speakers on the GPU failed (%s); using the CPU", error)
                    pipeline.to(torch.device("cpu"))
            self._pipeline = pipeline

    def unload(self) -> None:
        with self._lock:
            self._pipeline = None

    def diarize(
        self,
        samples: np.ndarray,
        token: str,
        speakers: int | None = None,
        progress: Callable[[float], None] | None = None,
    ) -> list[tuple[float, float, str]]:
        """Turns as (start, end, label), one speaker at a time (the exclusive diarization); each label's voice print in `voices`."""
        self.voices = {}
        self.load(token)
        if len(samples) < RATE:
            return []
        if mac():
            turns, self.voices = _helper_turns(samples, speakers, progress)
            return turns
        import torch

        # shares of the run, measured on an hour of speech: the voice prints (embeddings) take most of it
        steps = {"segmentation": 0.15, "speaker_counting": 0.2, "embeddings": 0.95, "discrete_diarization": 1.0}

        def hook(step, artifact, file=None, total=None, completed=None):
            if progress and step in steps:
                done = completed / total if total else 1.0
                previous = max([v for v in steps.values() if v < steps[step]], default=0.0)
                progress(previous + (steps[step] - previous) * done)

        options = {"num_speakers": speakers} if speakers else {}
        waveform = torch.from_numpy(np.ascontiguousarray(samples)).unsqueeze(0)
        output = self._pipeline({"waveform": waveform, "sample_rate": RATE}, hook=hook, **options)
        annotation = getattr(output, "exclusive_speaker_diarization", None) or getattr(output, "speaker_diarization", output)
        # community-1 gives one embedding per speaker, in speaker_diarization.labels() order.
        prints = getattr(output, "speaker_embeddings", None)
        if prints is not None:
            labels = output.speaker_diarization.labels()
            self.voices = {str(label): np.asarray(prints[i]).tolist() for i, label in enumerate(labels) if i < len(prints)}
        return [
            (round(turn.start, 2), round(turn.end, 2), str(label))
            for turn, _, label in annotation.itertracks(yield_label=True)
        ]


def _helper_turns(samples: np.ndarray, speakers: int | None, progress: Callable[[float], None] | None) -> tuple[list[tuple[float, float, str]], dict[str, list[float]]]:
    """The Mac's helper on a WAV of our own (16 kHz mono PCM16): "progress done total" lines on stderr, one line of JSON on stdout
    (the turns, and each speaker's voice print under "embeddings"; a helper from before 2026-11-09 gives none)."""
    fd, wav = tempfile.mkstemp(prefix="tyts-speakers-", suffix=".wav")
    os.close(fd)
    try:
        with wave.open(wav, "wb") as out:
            out.setnchannels(1)
            out.setsampwidth(2)
            out.setframerate(RATE)
            out.writeframes((np.clip(samples, -1.0, 1.0) * 32767).astype("<i2").tobytes())
        args = [str(helper()), "--models", str(MAC_MODELS)]
        if speakers:
            args += ["--speakers", str(int(speakers))]
        # stdout to a file: a long call's turns would fill a pipe while stderr is being read.
        with tempfile.TemporaryFile() as stdout:
            proc = subprocess.Popen(args + [wav], stdout=stdout, stderr=subprocess.PIPE, text=True)
            late = threading.Event()
            timer = threading.Timer(MAC_TIMEOUT, lambda: (late.set(), proc.kill()))
            timer.start()
            last = ""
            try:
                for line in proc.stderr:
                    parts = line.split()
                    if len(parts) == 3 and parts[0] == "progress":
                        try:
                            done, total = float(parts[1]), float(parts[2])
                        except ValueError:
                            continue
                        if progress and total > 0:
                            progress(min(1.0, done / total))
                    elif line.strip():
                        last = line.strip()
                code = proc.wait()
            finally:
                timer.cancel()
                if proc.poll() is None:
                    proc.kill()
                    proc.wait()
            if late.is_set():
                raise RuntimeError(f"the speakers helper took longer than {MAC_TIMEOUT // 60} minutes")
            if code == 3:
                raise NeedsPart(last)
            if code != 0:
                raise RuntimeError(last or f"the speakers helper exited with {code}")
            stdout.seek(0)
            result = json.loads(stdout.read().decode("utf-8") or "{}")
        turns = [(round(float(a), 2), round(float(b), 2), str(label)) for a, b, label in result.get("turns", [])]
        prints = result.get("embeddings") or {}
        return turns, {str(k): list(v) for k, v in prints.items() if isinstance(v, list)}
    finally:
        os.unlink(wav)
