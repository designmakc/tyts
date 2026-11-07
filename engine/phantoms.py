"""Phrases Whisper writes where nobody said them.

Whisper learned from subtitles, and subtitles end in credits and sign-offs: in a
pause, a breath, the silence a short phrase is padded with, it may write
"Субтитры сделал DimaTorzok" or "Продолжение следует..." though nobody said so.
Three kinds, each cut on its own terms:

- credits ("Субтитры сделал DimaTorzok", "Редактор субтитров А.Синецкая",
  "Subtitles by the Amara.org community"): nobody says them; cut wherever they are.
- sign-offs of a video ("Спасибо за просмотр!", "Продолжение следует...",
  "Подписывайтесь на канал", "Thanks for watching!"): at the end of the text or as
  all of it. A dictation never ends so, so there they are cut always; in a
  recording someone may say them, so only when the sound does not carry them
  (`Sound.weak`) or there is more text than sound (`Sound.too_fast`).
- thanks ("Спасибо.", "Thank you.", "Спасибо за внимание."): people say them all
  the time, so only when they are all of the text and the sound does not carry it.

The thresholds are first guesses, to be tuned on the owner's recordings (bench.py):
the app log counts every cut (never its words).
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

log = logging.getLogger("tyts.phantoms")

# Whisper's own measures of a segment: the chance there was no speech, and how sure it was of its words.
NO_SPEECH = 0.4
LOW_LOGPROB = -0.8
# Letters and digits a second that nobody speaks faster than (dictation runs at 10–15).
FAST = 22.0

_SENTENCE_END = r"[^.!?…\n]*[.!?…]*"

CREDITS = [re.compile(p, re.IGNORECASE) for p in (
    r"[^.!?…\n]*\bdima\s?torzok\b" + _SENTENCE_END,
    r"[^.!?…\n]*\bamara\.org\b" + _SENTENCE_END,
    r"[^.!?…\n]*\bcastingwords\b" + _SENTENCE_END,
    r"\b(?:субтитры|субтитри)\s+(?:сделал|сделала|сделаны|делал|создавал|создал|подготовил|подготовила|подогнал|"
    r"зробив|зробила|зроблені|створив|створено|створені|підготував)\s" + _SENTENCE_END,
    r"\bредактор\s+субтитр(?:ов|ів)\s+[^\n]*?(?:[.!?…](?=\s|$)|$)",
    r"\bкоректор\w*\s+[А-ЯЁІЇЄҐ]\.\s?[А-ЯЁІЇЄҐ][\w-]+[.!]*",
    r"\bкорректор\s+[А-ЯЁ]\.\s?[А-ЯЁ][\w-]+[.!]*",
    r"\b(?:subtitles|captions|subtitled|captioned)\s+by\s+(?:the\s+)?(?:amara|castingwords|rev\.com)" + _SENTENCE_END,
)]

SIGN_OFFS = [re.compile(p) for p in (
    # ru
    r"(?:всем )?спасибо за просмотр(?: (?:этого )?видео)?",
    r"продолжение следует",
    r"(?:и )?подписывайтесь на (?:наш |мой |этот )?канал",
    r"(?:и )?подпишись на (?:наш |мой )?канал",
    r"(?:ставьте|ставим) лайк(?:и)?(?: и подписывайтесь на (?:наш |мой )?канал)?",
    r"до (?:встречи|скорой встречи) в (?:следующем|новом) (?:видео|выпуске)",
    # uk
    r"(?:всім )?дякую за перегляд",
    r"далі буде",
    r"продовження (?:буде|слідує)",
    r"(?:і )?підписуй(?:те)?с[ья] на (?:наш |мій )?канал",
    r"(?:ставте|ставимо) лайк(?:и)?(?: і підписуйтеся на канал)?",
    # en
    r"(?:thank you|thanks)(?: (?:so|very) much)? for watching",
    r"(?:please )?(?:like and )?subscribe(?: to (?:my|our|the) channel)?",
    r"see you in the next (?:video|one|episode)",
    r"to be continued",
)]

THANKS = [re.compile(p) for p in (
    r"(?:большое )?спасибо(?: большое| вам)?",
    r"спасибо за внимание",
    r"(?:щиро )?дякую(?: вам)?",
    r"дякую за увагу",
    r"thank you(?: (?:so|very) much)?",
    r"thanks(?: a lot)?",
    r"thank you for your attention",
)]

_SENTENCE = re.compile(r"[^.!?…\n]+(?:[.!?…]+|$)")


@dataclass
class Sound:
    """What the sound behind a text says of it: the seconds of speech, Whisper's no-speech chance, its mean log probability."""

    seconds: float | None = None
    no_speech: float = 0.0
    logprob: float = 0.0

    @property
    def weak(self) -> bool:
        return self.no_speech >= NO_SPEECH or self.logprob <= LOW_LOGPROB

    def too_fast(self, text: str) -> bool:
        return bool(self.seconds) and sum(c.isalnum() for c in text) / self.seconds > FAST


def _norm(sentence: str) -> str:
    s = sentence.casefold().replace("ё", "е").replace("’", "'")
    return " ".join(re.sub(r"[^\w' ]+", " ", s).split())


def _is(patterns: list[re.Pattern], sentence: str) -> bool:
    s = _norm(sentence)
    return any(p.fullmatch(s) for p in patterns)


def _merge(spans: list[tuple[int, int]]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for a, b in sorted(spans):
        if out and a <= out[-1][1]:
            out[-1] = (out[-1][0], max(out[-1][1], b))
        else:
            out.append((a, b))
    return out


def phantoms(text: str, sound: Sound, dictation: bool) -> list[tuple[int, int]]:
    """Where in `text` Whisper wrote what nobody said: (start, end) spans, in order, not overlapping."""
    cut = [m.span() for p in CREDITS for m in p.finditer(text) if m.group().strip()]
    cut = _merge(cut)

    def inside(a: int, b: int) -> bool:
        return any(x <= a and b <= y for x, y in cut)

    sentences = [m.span() for m in _SENTENCE.finditer(text) if m.group().strip() and not inside(*m.span())]
    left = lambda: " ".join(text[a:b] for a, b in sentences)  # noqa: E731
    while sentences:
        a, b = sentences[-1]
        last = text[a:b]
        whole = len(sentences) == 1
        if _is(SIGN_OFFS, last):
            if not (dictation or sound.weak or sound.too_fast(left())):
                break
        elif _is(THANKS, last):
            if not (whole and sound.weak):
                break
        else:
            break
        cut.append((a, b))
        sentences.pop()
    return _merge(cut)


def _without(text: str, spans: list[tuple[int, int]]) -> str:
    kept, at = [], 0
    for a, b in spans:
        kept.append(text[at:a])
        at = b
    kept.append(text[at:])
    out = " ".join("".join(kept).split())
    return re.sub(r"\s+([,.!?…;:])", r"\1", out).strip(" ,;:—-")


def clean(text: str, sound: Sound, dictation: bool) -> str:
    """The text without what Whisper made up (see the module's note)."""
    spans = phantoms(text, sound, dictation)
    if not spans:
        return text
    # How much, never what: were a cut ever wrong, the log would hold what the person said.
    log.info("cut what nobody said: %d piece(s), %d letters", len(spans), sum(b - a for a, b in spans))
    return _without(text, spans)


def clean_segment(segment: dict, sound: Sound) -> dict | None:
    """A recording's segment ({start, end, text, words}) without its made-up phrases and their words; None when nothing is left."""
    text = segment["text"]
    spans = phantoms(text, sound, dictation=False)
    if not spans:
        return segment
    # How much, never what: were a cut ever wrong, the log would hold what the person said.
    log.info("cut what nobody said: %d piece(s), %d letters", len(spans), sum(b - a for a, b in spans))
    kept = _without(text, spans)
    if not kept:
        return None
    words, at = [], 0
    for w in segment["words"]:
        token = w["word"].strip()
        found = text.find(token, at) if token else -1
        if found < 0:
            words.append(w)
            continue
        at = found + len(token)
        if not any(a <= found and at <= b for a, b in spans):
            words.append(w)
    start = words[0]["start"] if words else segment["start"]
    end = words[-1]["end"] if words else segment["end"]
    return {**segment, "start": start, "end": end, "text": kept, "words": words}
