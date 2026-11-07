"""The words: faster-whisper, on an NVIDIA card when the gpu part is there, else on the CPU;
on a Mac on Apple silicon with the mac part, Whisper turbo on its graphics through mlx-whisper (MlxWhisper).

A long recording gets times for every word; a dictated phrase just its text, fast.
Which model runs where is Kryakl's plan (settings.py `plan`); this module loads
what it is told and says when the card cannot take it (`CudaFailed`).
"""

from __future__ import annotations

import importlib.util
import logging
import os
import sys
import threading
from types import SimpleNamespace
from pathlib import Path
from typing import Callable

import numpy as np

import phantoms
from audio import RATE
from settings import CATALOG, MODELS_DIR

log = logging.getLogger("tyts.asr")

# Whisper writes in the style of the text before it; without one it sometimes
# drops capitals and full stops for a whole recording.
STYLE = {
    "ru": "Здравствуйте. Давайте начнём, у нас сегодня несколько вопросов.",
    "uk": "Добрий день. Давайте почнемо, у нас сьогодні кілька питань.",
    "en": "Hello, everyone. Let's get started, we have a few things to discuss today.",
}

# A language Whisper hears that is neither of the ones expected (the person's own,
# English) is taken only when it is this sure; else the likelier expected one.
SURE_OTHER = 0.7
# Speech heard as neither English nor an expected language is taken for English only when
# English is this likely: told to expect English, Whisper writes any other speech as an
# English translation (2026-10-31: Russian dictated with Ukrainian and English expected came
# out in English). The person's own language is closer.
PLAUSIBLE_ENGLISH = 0.2
# Among the expected ones the person's own language (the first) gives way only to one this many
# times as likely: told the wrong language Whisper writes a translation, and no later step can
# bring the words back. Measured 2026-11-05 with turbo on clips of read speech: a breath alone
# and the first 0.3 s of Russian read as English 2 to 4 times likelier than Russian; a whole
# second of English reads at least 19 times likelier, a second of Russian never the other way.
OWN_LEAN = 5


def _cuda_dirs() -> list[Path]:
    """Where cuBLAS 12 and cuDNN 9 are: the gpu part's nvidia wheels, or torch's CUDA build (speakers-gpu)."""
    site = Path(sys.prefix) / "Lib" / "site-packages"
    dirs = [d for d in (site / "nvidia").glob("*/bin") if d.is_dir()]
    torch = importlib.util.find_spec("torch")
    if torch and torch.origin:
        lib = Path(torch.origin).parent / "lib"
        if (lib / "cudnn64_9.dll").exists():
            dirs.append(lib)
    return dirs


_dlls_added = False


def _cuda_dlls() -> None:
    global _dlls_added
    if _dlls_added:
        return
    for d in _cuda_dirs():
        os.add_dll_directory(str(d))
        os.environ["PATH"] = str(d) + os.pathsep + os.environ.get("PATH", "")
    _dlls_added = True


def torch_cuda() -> bool:
    """torch's CUDA build is installed (the speakers-gpu part): speakers run on the card."""
    torch = importlib.util.find_spec("torch")
    return bool(torch and torch.origin and (Path(torch.origin).parent / "lib" / "cudnn64_9.dll").exists())


def gpu() -> bool:
    """An NVIDIA card and the CUDA libraries to use it (the gpu or speakers-gpu part)."""
    if not _cuda_dirs():
        return False
    try:
        import ctranslate2

        return ctranslate2.get_cuda_device_count() > 0
    except Exception:
        return False


def card_free_mb() -> int | None:
    """The NVIDIA cards' free memory now, in MB, all together (nvidia-smi, which the driver puts in
    System32); None when it cannot say."""
    exe = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "nvidia-smi.exe"
    if not exe.is_file():
        return None
    import subprocess

    try:
        out = subprocess.run([str(exe), "--query-gpu=memory.free", "--format=csv,noheader,nounits"], capture_output=True, text=True, timeout=10, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except (OSError, subprocess.SubprocessError):
        return None
    values = [int(v) for v in out.stdout.split() if v.isdigit()]
    return sum(values) if values else None


WHISPER_DIR = MODELS_DIR / "whisper"
_MODELS = {m["name"]: m for m in CATALOG["models"]}
_WHISPER = {name: m for name, m in _MODELS.items() if m["backend"] == "whisper"}
# What a model weighs, to tell how far its first download is.
SIZES = {name: m["bytes"] for name, m in _MODELS.items()}
# Parakeet's files as onnx-asr reads them, int8, its features computed by numpy (no preprocessor model).
PARAKEET_FILES = ("config.json", "vocab.txt", "encoder-model.int8.onnx", "decoder_joint-model.int8.onnx")


def backend(name: str) -> str:
    return _MODELS.get(name, {}).get("backend", "")


def mlx_ready() -> bool:
    """A Mac on Apple silicon with the mac part (mlx-whisper) installed: Whisper runs on its graphics (Metal)."""
    import platform

    return sys.platform == "darwin" and platform.machine() == "arm64" and importlib.util.find_spec("mlx_whisper") is not None


def _on_mlx(name: str) -> bool:
    """This model is kept and run as MLX's copy here (the catalog's `mlx` repo), not faster-whisper's."""
    return "mlx" in _MODELS.get(name, {}) and mlx_ready()


def _mlx_dir(name: str) -> Path:
    return WHISPER_DIR / "mlx" / name


def _cache_dir(name: str) -> Path:
    """Where a model's files are: Hugging Face's models--<owner>--<repo> for Whisper, a folder of its own for Parakeet."""
    if _on_mlx(name):
        return _mlx_dir(name)
    if backend(name) == "whisper":
        return WHISPER_DIR / ("models--" + _WHISPER[name]["repo"].replace("/", "--"))
    return MODELS_DIR / name


def downloaded(name: str) -> bool:
    if _on_mlx(name):
        return any((_mlx_dir(name) / f).is_file() for f in ("weights.safetensors", "weights.npz"))
    if backend(name) == "whisper":
        return any(_cache_dir(name).glob("snapshots/*/model.bin"))
    if backend(name) == "parakeet":
        return all((_cache_dir(name) / f).is_file() for f in PARAKEET_FILES)
    return False


fetching: set[str] = set()


def model_state(name: str) -> dict:
    """ready, missing, or downloading with a share done (the files that arrived over the model's size)."""
    if downloaded(name):
        return {"name": name, "state": "ready"}
    if name in fetching:
        got = sum(f.stat().st_size for f in _cache_dir(name).glob("**/*") if f.is_file()) if name in _MODELS else 0
        return {"name": name, "state": "downloading", "progress": round(min(got / SIZES.get(name, max(got, 1)), 0.99), 3)}
    return {"name": name, "state": "missing"}


def fetch(name: str) -> str:
    """The model's folder, downloaded first when it is not here (once; `fetching` shows it meanwhile)."""
    here = downloaded(name)
    if not here:
        fetching.add(name)
    try:
        if backend(name) == "parakeet":
            if not here:
                from huggingface_hub import snapshot_download

                snapshot_download(_MODELS[name]["repo"], local_dir=str(_cache_dir(name)), allow_patterns=list(PARAKEET_FILES))
            return str(_cache_dir(name))
        if _on_mlx(name):
            if not here:
                from huggingface_hub import snapshot_download

                snapshot_download(_MODELS[name]["mlx"]["repo"], local_dir=str(_mlx_dir(name)))
            return str(_mlx_dir(name))
        return _fetch_whisper(name, here)
    finally:
        fetching.discard(name)


def _fetch_whisper(name: str, here: bool | None = None) -> str:
    """faster-whisper's copy of the model (a Mac whose MLX failed falls back to it on the processor)."""
    if here is None:
        here = any((WHISPER_DIR / ("models--" + _WHISPER[name]["repo"].replace("/", "--"))).glob("snapshots/*/model.bin"))
    if not here:
        fetching.add(name)
    try:
        from faster_whisper.utils import download_model

        return download_model(name, cache_dir=str(WHISPER_DIR), local_files_only=here)
    finally:
        fetching.discard(name)


class CudaFailed(Exception):
    """The card would not take the model (too small, busy, a driver too old): the processor's plan applies."""


def _speech_only(samples: np.ndarray) -> np.ndarray | None:
    """The phrase with its silences cut out (Silero VAD, inside faster-whisper); None when nobody spoke."""
    from faster_whisper.vad import VadOptions, collect_chunks, get_speech_timestamps

    chunks = get_speech_timestamps(samples, VadOptions(min_silence_duration_ms=500, speech_pad_ms=300))
    if not chunks:
        return None
    pieces, _ = collect_chunks(samples, chunks)
    speech = np.concatenate(pieces) if pieces else np.array([], dtype=np.float32)
    return speech if len(speech) >= RATE // 4 else None


def pick_language(probs: dict[str, float], expected: tuple[str, ...] | list[str], strict: bool = False) -> str:
    """Whisper's likeliest language, unless it is an unexpected one it is not sure of: then the likelier expected one.

    `strict`: the caller knows only the expected ones are spoken (Ukrainian heard in Russian
    speech is a mistake there, however sure), so the likeliest of them, the first
    of them winning a close call (OWN_LEAN)."""
    top = max(probs, key=probs.get)
    pool = [c for c in expected if c in probs]
    if top != "en" and top not in pool and probs.get("en", 0.0) < PLAUSIBLE_ENGLISH and any(c != "en" for c in pool):
        pool = [c for c in pool if c != "en"]
    if strict:
        if pool:
            best = max(pool, key=lambda c: probs[c])
            own = expected[0]
            return own if own in pool and probs[best] < OWN_LEAN * probs[own] else best
        log.warning("strict language asked, but Whisper knows none of %s", list(expected))
    if not pool or top in pool or probs[top] >= SURE_OTHER:
        return top
    return max(pool, key=lambda c: probs[c])


def _log_pick(language: str, probs: dict[str, float], expected, speech: np.ndarray) -> None:
    """Why a phrase came out in its language, should it be the wrong one; never its words."""
    heard = ", ".join(f"{c} {probs.get(c, 0.0):.3f}" for c in dict.fromkeys([language, *expected]))
    log.info("language %s on %.1f s of speech (%s)", language, len(speech) / RATE, heard)


def _said(segments, speech: np.ndarray) -> str:
    """A dictated phrase's text, without the credits and sign-offs Whisper adds from its subtitles (phantoms.py)."""
    segments = list(segments)
    text = " ".join(s.text.strip() for s in segments).strip()
    if not segments:
        return text
    sound = phantoms.Sound(
        len(speech) / RATE,
        max(s.no_speech_prob for s in segments),
        min(s.avg_logprob for s in segments),
    )
    return phantoms.clean(text, sound, dictation=True)


class Transcriber:
    def __init__(self, workers: int = 1):
        self._model = None
        self._key: tuple | None = None
        self._warm: tuple | None = None
        self._lock = threading.Lock()
        self.workers = workers
        self.name: str | None = None
        self.device: str | None = None
        self.compute: str | None = None

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def load(self, name: str, device: str = "cpu", compute: str | None = None, threads: int = 0) -> None:
        """The model on that device: on the card in `compute` (float16 first, then int8_float16), raising
        CudaFailed when neither fits; on the processor in int8 with `threads` threads (0: CTranslate2's 4)."""
        with self._lock:
            key = (name, device, compute, threads)
            if self._model is not None and self._key == key:
                return
            self._model = None
            self._key = None
            self._warm = None
            if device == "metal" or compute == "mlx":
                # A Mac's graphics through MLX (the plan says so by the processor's entry's compute "mlx").
                if _on_mlx(name):
                    self._model = MlxWhisper(name)
                    self.name, self.device, self.compute, self._key = name, "metal", "mlx", key
                    return
                log.warning("%s on Metal is not here (no mlx-whisper or no MLX copy); on the processor", name)
                device = "cpu"
            path = _fetch_whisper(name)
            from faster_whisper import WhisperModel

            if device == "cuda":
                _cuda_dlls()
                first = compute or "float16"
                tries = [first, "int8_float16"] if first == "float16" else [first]
                problem: Exception | None = None
                for kind in tries:
                    try:
                        self._model = WhisperModel(path, device="cuda", compute_type=kind, num_workers=self.workers)
                        self.compute = kind
                        break
                    except Exception as error:  # out of memory, a driver too old, no card after all
                        problem = error
                        log.warning("%s in %s on the GPU failed: %s", name, kind, error)
                if self._model is None:
                    raise CudaFailed(str(problem) or type(problem).__name__)
            else:
                self._model = WhisperModel(path, device="cpu", compute_type="int8", cpu_threads=threads, num_workers=self.workers)
                self.compute = "int8"
            self.name = name
            self.device = device
            self._key = key

    def unload(self, name: str | None = None) -> None:
        """Out of memory; with `name`, only while it still holds that model (a job may have loaded another meanwhile)."""
        with self._lock:
            if name is not None and self.name != name:
                return
            self._model = None
            self._key = None
            self._warm = None
            self.name = None

    def transcribe(
        self,
        samples: np.ndarray,
        language: str | None = None,
        hotwords: str = "",
        progress: Callable[[float], None] | None = None,
    ) -> tuple[list[dict], str]:
        """Segments as {start, end, text, words: [{start, end, word}]} and the language spoken (the model loaded first)."""
        if isinstance(self._model, MlxWhisper):
            return self._model.transcribe(samples, language, hotwords, progress)
        total = max(len(samples) / RATE, 0.01)
        if language is None:
            try:
                language = self._model.detect_language(samples, vad_filter=True)[0]
            except Exception:  # nothing but silence: Whisper finds no speech either way
                language = None
        segments, info = self._model.transcribe(
            samples,
            language=language,
            initial_prompt=STYLE.get(language),
            beam_size=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 700},
            # The previous text keeps punctuation going from window to window; the VAD and the
            # silence threshold keep it from looping on long recordings.
            condition_on_previous_text=True,
            hallucination_silence_threshold=2.0,
            hotwords=hotwords or None,
        )
        out = []
        for segment in segments:
            if progress:
                progress(min(segment.end / total, 1.0))
            words = [
                {"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word}
                for w in (segment.words or [])
                if w.word.strip()
            ]
            kept = phantoms.clean_segment(
                {"start": round(segment.start, 2), "end": round(segment.end, 2), "text": segment.text.strip(), "words": words},
                phantoms.Sound(segment.end - segment.start, segment.no_speech_prob, segment.avg_logprob),
            )
            if kept:
                out.append(kept)
        return out, info.language

    def dictate(
        self,
        samples: np.ndarray,
        language: str | None = None,
        expected: tuple[str, ...] | list[str] = (),
        hotwords: str = "",
        beam: int = 5,
        before: str = "",
        strict: bool = False,
    ) -> tuple[str, str, float]:
        """A short phrase's text, its language and how sure Whisper is of it (0…1): no word times.

        The sound is encoded once: the language is read from the same pass the words
        come from (faster-whisper's own way encodes it twice), among the `expected`
        ones unless Whisper is sure of another (never another with `strict`).
        `before`: the text said just before (a dictation's earlier pieces), so this
        one goes on in its style.
        """
        speech = _speech_only(samples)
        if speech is None:
            return "", language or "", 0.0
        if isinstance(self._model, MlxWhisper):
            return self._model.dictate(speech, language, expected, hotwords, before, strict)
        try:
            return self._one_pass(speech, language, expected, hotwords, beam, before, strict)
        except (AttributeError, TypeError, KeyError) as error:  # faster-whisper changed underneath
            log.warning("one-pass dictation failed (%s); using faster-whisper's own way", error)
            return self._two_passes(speech, language, hotwords, beam, expected, strict)

    def _one_pass(self, speech: np.ndarray, language: str | None, expected, hotwords: str, beam: int, before: str = "", strict: bool = False) -> tuple[str, str, float]:
        from faster_whisper.audio import pad_or_trim
        from faster_whisper.tokenizer import Tokenizer

        model = self._model
        extractor = model.feature_extractor
        features = extractor(speech)
        encoded = model.encode(pad_or_trim(features[:, : extractor.nb_max_frames]))
        sure = 1.0
        if language is None:
            if model.model.is_multilingual:
                probs = {token[2:-2]: p for token, p in model.model.detect_language(encoded)[0]}
                language = pick_language(probs, expected, strict)
                sure = float(probs[language])
                _log_pick(language, probs, expected, speech)
            else:
                language = "en"
        # The options as faster-whisper fills them (thresholds, suppressed tokens…), from a call
        # that only prepares: its segments are a generator that is never run.
        prompt = " ".join(p for p in (STYLE.get(language), before[-150:].strip()) if p) or None
        _, info = model.transcribe(
            speech[:RATE],
            language=language,
            beam_size=beam,
            initial_prompt=prompt,
            without_timestamps=True,
            condition_on_previous_text=False,
            vad_filter=False,
            hotwords=hotwords or None,
        )
        tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task="transcribe", language=language)
        segments = model.generate_segments(features, tokenizer, info.transcription_options, False, encoded)
        return _said(segments, speech), language, sure

    def _two_passes(self, speech: np.ndarray, language: str | None, hotwords: str, beam: int, expected=(), strict: bool = False) -> tuple[str, str, float]:
        sure = 1.0
        if language is None:
            try:
                top, sure, every = self._model.detect_language(speech)
                # Every language's chance, so the expected ones are preferred here as in one pass.
                probs = dict(every) if every else {top: sure}
                language = pick_language(probs, expected, strict)
                sure = probs.get(language, sure)
                _log_pick(language, probs, expected, speech)
            except Exception:
                language = None
        segments, info = self._model.transcribe(
            speech,
            language=language,
            initial_prompt=STYLE.get(language) if language else None,
            beam_size=beam,
            vad_filter=False,
            condition_on_previous_text=False,
            hotwords=hotwords or None,
        )
        return _said(segments, speech), info.language, float(sure)

    def warm(self) -> None:
        """Runs the loaded model once (once per load: a card's first run sets itself up for seconds;
        again, on the processor, it would only take a second from the phrase being spoken)."""
        if self._warm == self._key:
            return
        noise = (np.random.default_rng(0).standard_normal(RATE) * 0.01).astype(np.float32)
        if isinstance(self._model, MlxWhisper):
            self._model.run(noise, language="en")
            self._warm = self._key
            return
        list(self._model.transcribe(noise, language="en", vad_filter=False, without_timestamps=True)[0])
        self._warm = self._key


def _prompt(*parts: str | None) -> str | None:
    """Whisper's initial prompt: the style, the text before, the words to spell (faster-whisper's hotwords), 400 characters at most."""
    text = " ".join(p.strip() for p in parts if p and p.strip())
    return text[-400:] or None


class MlxWhisper:
    """Whisper on a Mac's graphics (Apple silicon, Metal) through mlx-whisper, the MLX copy of the model
    (the catalog's `mlx` repo). It gives the same segments and words as the faster-whisper path, so
    phantoms, vocab, merge and the speakers work on it unchanged. What it lacks: no beam (MLX decodes
    greedily), no hotwords (the words to spell go into the prompt), no VAD before the words.
    Loaded by Transcriber when the plan says `metal`; mlx_whisper keeps the weights itself after the first call."""

    def __init__(self, name: str):
        self.name = name
        self.path = fetch(name)

    def run(self, samples: np.ndarray, **options) -> dict:
        import mlx_whisper

        return mlx_whisper.transcribe(samples, path_or_hf_repo=self.path, verbose=None, **options)

    def detect(self, speech: np.ndarray) -> dict[str, float] | None:
        """Every language's chance from the first 30 s, as faster-whisper's one pass gives it; None when
        mlx-whisper's insides moved (then the caller decides without them)."""
        try:
            from mlx_whisper.audio import N_FRAMES, N_SAMPLES, log_mel_spectrogram, pad_or_trim
            from mlx_whisper.transcribe import ModelHolder
            import mlx.core as mx

            model = ModelHolder.get_model(self.path, mx.float16)
            mel = log_mel_spectrogram(speech, n_mels=model.dims.n_mels, padding=N_SAMPLES)
            _, probs = model.detect_language(pad_or_trim(mel, N_FRAMES, axis=-2).astype(mx.float16))
            return {k: float(v) for k, v in dict(probs).items()}
        except Exception as error:
            log.warning("mlx language detection failed: %s", error)
            return None

    def transcribe(self, samples: np.ndarray, language: str | None, hotwords: str = "", progress: Callable[[float], None] | None = None) -> tuple[list[dict], str]:
        out = self.run(
            samples,
            language=language,
            initial_prompt=_prompt(STYLE.get(language or ""), hotwords),
            word_timestamps=True,
            condition_on_previous_text=True,
            hallucination_silence_threshold=2.0,
        )
        total = max(len(samples) / RATE, 0.01)
        segments = []
        for segment in out.get("segments", []):
            if progress:
                progress(min(segment["end"] / total, 1.0))
            words = [
                {"start": round(w["start"], 2), "end": round(w["end"], 2), "word": w["word"]}
                for w in segment.get("words") or []
                if w["word"].strip()
            ]
            kept = phantoms.clean_segment(
                {"start": round(segment["start"], 2), "end": round(segment["end"], 2), "text": segment["text"].strip(), "words": words},
                phantoms.Sound(segment["end"] - segment["start"], segment.get("no_speech_prob", 0.0), segment.get("avg_logprob", 0.0)),
            )
            if kept:
                segments.append(kept)
        return segments, out.get("language") or language or ""

    def dictate(self, speech: np.ndarray, language: str | None, expected=(), hotwords: str = "", before: str = "", strict: bool = False) -> tuple[str, str, float]:
        """The speech (silences cut already) as a phrase; the language among the expected ones as pick_language
        decides, when the language's chances can be had; else, `strict`, the person's own (the first expected)."""
        sure = 1.0
        if language is None and expected:
            probs = self.detect(speech)
            if probs:
                language = pick_language(probs, expected, strict)
                sure = probs.get(language, 0.0)
                _log_pick(language, probs, expected, speech)
            elif strict:
                # ponytail: no chances, so no OWN_LEAN: the first expected language always; fix when mlx-whisper's detect_language is reachable for sure.
                language = expected[0]
        out = self.run(
            speech,
            language=language,
            initial_prompt=_prompt(STYLE.get(language or ""), before[-150:], hotwords),
            condition_on_previous_text=False,
            without_timestamps=True,
        )
        segments = [
            SimpleNamespace(text=s["text"], no_speech_prob=s.get("no_speech_prob", 0.0), avg_logprob=s.get("avg_logprob", 0.0))
            for s in out.get("segments", [])
        ]
        return _said(segments, speech), language or out.get("language", ""), float(sure)


class Parakeet:
    """NVIDIA's Parakeet TDT 0.6B v3 through onnx-asr, int8 on the processor: 25 European languages, with
    their punctuation and capitals. It costs what the sound lasts (Whisper pads every phrase to a 30 s
    window), so a phrase takes a third of a second on a desktop processor. It does not say which
    language it heard: the caller finds out from the text."""

    def __init__(self):
        self._model = None
        self._key: tuple | None = None
        self._warm: tuple | None = None
        self._lock = threading.Lock()
        self.name: str | None = None
        self.device = "cpu"
        self.compute = "int8"

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def load(self, name: str, device: str = "cpu", compute: str | None = None, threads: int = 0) -> None:
        with self._lock:
            key = (name, threads)
            if self._model is not None and self._key == key:
                return
            self._model = None
            self._key = None
            self._warm = None
            path = fetch(name)
            import onnx_asr
            import onnxruntime as rt

            options = rt.SessionOptions()
            if threads:
                options.intra_op_num_threads = threads
            self._model = onnx_asr.load_model(_MODELS[name]["onnx"], path, quantization="int8", sess_options=options, providers=["CPUExecutionProvider"])
            self.name = name
            self._key = key

    def unload(self, name: str | None = None) -> None:
        with self._lock:
            if name is not None and self.name != name:
                return
            self._model = None
            self._key = None
            self._warm = None
            self.name = None

    def dictate(self, samples: np.ndarray, language: str | None = None, expected=(), hotwords: str = "", beam: int = 0, before: str = "", strict: bool = False) -> tuple[str, str, float]:
        """The phrase's text; its language is unknown here ("", sure 0), so `strict` has nothing to hold."""
        speech = _speech_only(samples)
        if speech is None:
            return "", language or "", 0.0
        return str(self._model.recognize(speech)).strip(), language or "", 0.0

    def warm(self) -> None:
        if self._warm == self._key:
            return
        noise = (np.random.default_rng(0).standard_normal(RATE) * 0.01).astype(np.float32)
        self._model.recognize(noise)
        self._warm = self._key


def recognizer(name: str):
    """A fresh, unloaded recognizer for this model: Whisper's or Parakeet's."""
    return Parakeet() if backend(name) == "parakeet" else Transcriber()
