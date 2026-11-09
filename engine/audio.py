"""Sound in and out: any audio or video file to 16 kHz mono samples, samples to Ogg Opus.

PyAV carries its own FFmpeg, so nothing has to be installed on the system.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Callable

import av
import numpy as np

RATE = 16000
BAD_SHARE = 0.02  # more damaged packets than this and the file is refused

Progress = Callable[[float], None]


class Every:
    """Calls `report` with a share done at most once a second: an hour of audio has 180 000 packets."""

    def __init__(self, report: Progress | None, seconds: float = 1.0):
        self.report = report
        self.seconds = seconds
        self.last = 0.0

    def __call__(self, share: float) -> None:
        now = time.monotonic()
        if self.report and now - self.last >= self.seconds:
            self.last = now
            self.report(min(max(share, 0.0), 1.0))


def decode(path: Path | str, progress: Progress | None = None) -> np.ndarray:
    """The file's audio mixed down to mono float32 at 16 kHz.

    A damaged packet here and there (phones often leave one at the very start)
    is skipped, as players do; a file mostly damaged is refused. Progress is
    the time read over the file's length, when the file knows its length (a
    browser recording does not).
    """
    report = Every(progress)
    resampler = av.AudioResampler(format="flt", layout="mono", rate=RATE)
    parts: list[np.ndarray] = []
    packets = bad = 0
    with av.open(str(path)) as container:
        if not container.streams.audio:
            raise ValueError("The file has no sound")
        stream = container.streams.audio[0]
        length = container.duration / av.time_base if container.duration else 0.0
        for packet in container.demux(stream):
            packets += 1
            if length and packet.pts is not None:
                report(float(packet.pts * stream.time_base) / length)
            try:
                frames = packet.decode()
            except av.error.InvalidDataError:
                bad += 1
                continue
            for frame in frames:
                frame.pts = None  # MediaRecorder's chunks carry gaps the resampler must not fill
                for out in resampler.resample(frame):
                    parts.append(out.to_ndarray().reshape(-1))
        for out in resampler.resample(None):
            parts.append(out.to_ndarray().reshape(-1))
    if packets and bad / packets > BAD_SHARE:
        raise ValueError(f"The file is damaged: {bad} of {packets} pieces of sound cannot be read")
    if not parts:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(parts).astype(np.float32, copy=False)


def decode_from(path: Path | str, first: int, longest: int) -> tuple[np.ndarray, list[int]]:
    """A recording still growing, decoded from its packet `first` on (the ones before are read, not decoded) until
    `longest` samples: the samples, and where each packet decoded begins in them. The count is decode()'s
    (frames as they come, no gaps filled), so a time here is a time in the whole file decoded later."""
    resampler = av.AudioResampler(format="flt", layout="mono", rate=RATE)
    parts: list[np.ndarray] = []
    starts: list[int] = []
    at = 0.0
    with av.open(str(path)) as container:
        stream = container.streams.audio[0]
        # A decoder started anew drops Opus's pre-skip (OpusHead's, 312 at 48 kHz) as it did once at the file's
        # start: put back as silence after a later packet, so its sound stays where the whole file's has it.
        head = stream.codec_context.extradata or b""
        pad = round(int.from_bytes(head[10:12], "little") * RATE / 48000) if first and head.startswith(b"OpusHead") else 0
        parts.append(np.zeros(pad, dtype=np.float32))
        for n, packet in enumerate(container.demux(stream)):
            if n < first:
                continue
            if at >= longest:
                break
            starts.append(round(at))
            at += pad
            pad = 0
            try:
                frames = packet.decode()
            except av.error.InvalidDataError:
                continue
            for frame in frames:
                at += frame.samples * RATE / frame.sample_rate
                frame.pts = None
                for out in resampler.resample(frame):
                    parts.append(out.to_ndarray().reshape(-1))
        for out in resampler.resample(None):
            parts.append(out.to_ndarray().reshape(-1))
    return np.concatenate(parts).astype(np.float32, copy=False), starts


def mix(tracks: list[tuple[np.ndarray, float]]) -> np.ndarray:
    """Tracks with their start offsets in seconds, summed into one, clipped to [-1, 1]."""
    length = max((int(offset * RATE) + len(samples) for samples, offset in tracks), default=0)
    out = np.zeros(length, dtype=np.float32)
    for samples, offset in tracks:
        start = int(offset * RATE)
        out[start:start + len(samples)] += samples
    np.clip(out, -1.0, 1.0, out=out)
    return out


def pad(samples: np.ndarray, offset: float) -> np.ndarray:
    """The track shifted right by its offset, so its times match the mix."""
    if offset <= 0:
        return samples
    return np.concatenate([np.zeros(int(offset * RATE), dtype=np.float32), samples])


def save_opus(samples: np.ndarray, path: Path, bitrate: int = 24000, progress: Progress | None = None) -> None:
    """Mono Ogg Opus, about 11 MB an hour: enough to hear again what was said."""
    report = Every(progress)
    tmp = path.with_suffix(".part")
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with av.open(str(tmp), "w", format="ogg") as out:
        stream = out.add_stream("libopus", rate=RATE)
        stream.bit_rate = bitrate
        stream.layout = "mono"
        step = RATE * 10
        for start in range(0, len(pcm), step):
            report(start / max(len(pcm), 1))
            frame = av.AudioFrame.from_ndarray(pcm[start:start + step].reshape(1, -1), format="s16", layout="mono")
            frame.sample_rate = RATE
            for packet in stream.encode(frame):
                out.mux(packet)
        for packet in stream.encode(None):
            out.mux(packet)
    tmp.replace(path)


def duration(samples: np.ndarray) -> float:
    return len(samples) / RATE
