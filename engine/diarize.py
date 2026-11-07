"""Who spoke when: pyannote's community-1 pipeline.

Hugging Face asks for a free token once, to download it; after that the
pipeline is loaded from MODELS_DIR/diarization and works offline. A token is
checked as soon as it is saved (`Setup`), and the model downloaded there and
then, so the window can say at once whether speakers will work.
"""

from __future__ import annotations

import importlib.util
import logging
import threading
from typing import Callable

import numpy as np

from audio import RATE
from settings import MODELS_DIR

log = logging.getLogger("tyts.diarize")

REPO = "pyannote/speaker-diarization-community-1"
LOCAL = MODELS_DIR / "diarization"

_download_lock = threading.Lock()


class NeedsToken(Exception):
    """Speakers are not split until a Hugging Face token lets the model download."""


class NeedsPart(Exception):
    """The speakers part (pyannote and torch) is not installed."""


def installed() -> bool:
    # find_spec of "pyannote.audio" imports "pyannote" first, and raises when even that is missing.
    return importlib.util.find_spec("pyannote") is not None and importlib.util.find_spec("pyannote.audio") is not None


def downloaded() -> bool:
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
    """For /health: ready, needs-token, or where the setup is."""
    if downloaded():
        return "ready"
    if setup.state not in ("idle", "ready"):
        return setup.state
    return "missing" if token else "needs-token"


class Diarizer:
    def __init__(self):
        self._pipeline = None
        self._lock = threading.Lock()
        self.device = "cpu"

    @property
    def loaded(self) -> bool:
        return self._pipeline is not None

    def load(self, token: str) -> None:
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
        """Turns as (start, end, label), one speaker at a time (the exclusive diarization)."""
        self.load(token)
        import torch

        if len(samples) < RATE:
            return []
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
        return [
            (round(turn.start, 2), round(turn.end, 2), str(label))
            for turn, _, label in annotation.itertracks(yield_label=True)
        ]
