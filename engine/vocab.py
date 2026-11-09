"""Words the person wants spelled right: surnames, product names, their own terms.

The vocabulary is a list of {word, heard}: `word` is the spelling, `heard` what
the recognizer writes instead ("кря", "края" for Kryakl). Whisper is
told the spellings beforehand (`hotwords`), and whatever it still writes its
own way is put right afterwards (`correct`, `correct_segments`): first what it
was heard as, then the spelling in another case, then, for a long word, a near
miss of one or two letters. Only words are touched; the text between them
(spaces, punctuation) stays as it was.

Parakeet takes no hotwords, so for it the correction is all there is.
"""

from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

TOKEN = re.compile(r"\w+(?:['’-]\w+)*")
SUFFIXES = ("'s", "’s")
LONGEST_RUN = 3  # tokens in the longest thing a word may be heard as
WORD_GAP = 1.0  # seconds: two words further apart than this are never one heard name
FUZZY_SHORTEST = 5  # letters: a shorter word is too easily another word to be guessed at


def _norm(token: str) -> str:
    return token.casefold().replace("ё", "е")


def _forms(token: str) -> tuple[str, str, str]:
    """(the token normalized, the same without an English 's, the 's as it was written)."""
    full = _norm(token)
    for suffix in SUFFIXES:
        if full.endswith(suffix) and len(full) > len(suffix):
            return full, full[: -len(suffix)], token[-len(suffix):]
    return full, full, ""


def split_items(items: str) -> list[str]:
    """Old-style hotwords: items between commas, semicolons and line breaks (never spaces: "Visual Studio" is one)."""
    return [s.strip() for s in re.split(r"[,;\r\n]+", items or "") if s.strip()]


def hotwords(vocabulary: list[dict], extra: str = "", most: int = 40, chars: int = 400) -> str:
    """Whisper's hotwords: the spellings in the vocabulary's order, then `extra`'s, each once, within the caps.

    Whisper reads them as a prompt, which has little room: a long list would crowd out the text before."""
    out: list[str] = []
    seen: set[str] = set()
    length = 0
    for word in [e["word"] for e in vocabulary or [] if isinstance(e, dict) and e.get("word")] + split_items(extra):
        key = word.casefold()
        if key in seen:
            continue
        grown = length + (2 if out else 0) + len(word)
        if len(out) >= most or grown > chars:
            break
        seen.add(key)
        out.append(word)
        length = grown
    return ", ".join(out)


def _script(text: str) -> str | None:
    """latin or cyrillic when every character is a letter of that script; else None."""
    found = None
    for ch in text:
        if not ch.isalpha():
            return None
        name = unicodedata.name(ch, "")
        script = "latin" if name.startswith("LATIN") else "cyrillic" if name.startswith("CYRILLIC") else None
        if script is None or (found and script != found):
            return None
        found = script
    return found


def distance(a: str, b: str, limit: int) -> int:
    """Optimal string alignment distance (a swap of two neighbours is one edit); limit + 1 once it is past the limit."""
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    before: list[int] = []
    row = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, before, row = before, row, [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cost = a[i - 1] != b[j - 1]
            row[j] = min(before[j] + 1, row[j - 1] + 1, before[j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                row[j] = min(row[j], prev[j - 2] + 1)
        if min(row) > limit:
            return limit + 1
    return row[-1]


def _limit(letters: int) -> int:
    return 0 if letters <= 4 else 1 if letters <= 7 else 2


class Matcher:
    """A vocabulary made ready for matching: what each run of normalized tokens stands for, and the spellings to guess at."""

    def __init__(self, entries: tuple[tuple[str, tuple[str, ...]], ...]):
        self.runs: dict[tuple[str, ...], str] = {}
        self.known: set[str] = set()
        # The spellings of one word that a near miss may be: by first letter, as (normalized, spelling, script).
        self.fuzzy: dict[str, list[tuple[str, str, str]]] = {}
        spellings: list[tuple[tuple[str, ...], str]] = []
        for word, heard in entries:
            for alias in heard:
                tokens = tuple(_norm(t) for t in TOKEN.findall(alias))
                if 1 <= len(tokens) <= LONGEST_RUN:
                    self.runs.setdefault(tokens, word)
                    self.known.update(tokens)
            spellings.append((tuple(_norm(t) for t in TOKEN.findall(word)), word))
        # A spelling is also what it is heard as, in any case ("KRYAKL", "visual studio"); after the aliases, which come first.
        for tokens, word in spellings:
            if 1 <= len(tokens) <= LONGEST_RUN:
                self.runs.setdefault(tokens, word)
                self.known.update(tokens)
            if len(tokens) == 1 and TOKEN.fullmatch(word):
                script = _script(tokens[0])
                if script and _limit(len(tokens[0])):
                    self.fuzzy.setdefault(tokens[0][0], []).append((tokens[0], word, script))

    def guess(self, stem: str) -> str | None:
        """The one spelling this word is a near miss of, or None (none near, or two equally near)."""
        if len(stem) < FUZZY_SHORTEST or stem in self.known:
            return None
        script = _script(stem)
        if script is None:
            return None
        best, found, tie = 99, None, False
        for norm, word, their_script in self.fuzzy.get(stem[0], ()):
            if their_script != script or abs(len(norm) - len(stem)) > 2:
                continue
            limit = _limit(len(norm))
            d = distance(stem, norm, limit)
            if d > limit or d == 0:
                continue
            if d < best:
                best, found, tie = d, word, False
            elif d == best and word != found:
                tie = True
        return None if tie else found


@lru_cache(maxsize=8)
def _matcher(key: tuple) -> Matcher:
    return Matcher(key)


def matcher(vocabulary: list[dict]) -> Matcher | None:
    """The vocabulary compiled once (the same list comes with every phrase); None when it is empty."""
    key = tuple(
        (e["word"], tuple(h for h in e.get("heard") or () if isinstance(h, str)))
        for e in vocabulary or ()
        if isinstance(e, dict) and isinstance(e.get("word"), str) and e["word"]
    )
    return _matcher(key) if key else None


def _plan(m: Matcher, tokens: list[str], joinable: list[bool]) -> list[tuple[int, int, str]]:
    """(first token, last token, the text they become) for every change: aliases and spellings
    by the longest run first, then near misses. `joinable[k]`: token k and k + 1 may be one name."""
    out: list[tuple[int, int, str]] = []
    forms = [_forms(t) for t in tokens]
    guessed: dict[str, str | None] = {}
    i = 0
    while i < len(tokens):
        done = False
        for n in range(min(LONGEST_RUN, len(tokens) - i), 0, -1):
            if not all(joinable[i : i + n - 1]):
                continue
            # Only the last token of a run may lose its 's (and get it back after the spelling).
            head = tuple(forms[k][0] for k in range(i, i + n - 1))
            full, stem, suffix = forms[i + n - 1]
            word = m.runs.get(head + (full,))
            if word is None and suffix:
                word = m.runs.get(head + (stem,))
                word = word + suffix if word is not None else None
            if word is not None:
                if word != " ".join(tokens[i : i + n]):
                    out.append((i, i + n - 1, word))
                i += n
                done = True
                break
        if done:
            continue
        full, stem, suffix = forms[i]
        if not any(ch.isdigit() for ch in stem) and full not in m.known:
            if stem not in guessed:
                guessed[stem] = m.guess(stem)
            if guessed[stem]:
                out.append((i, i, guessed[stem] + suffix))
        i += 1
    return out


def correct(text: str, vocabulary: list[dict]) -> str:
    """A phrase spelled as the vocabulary says."""
    m = matcher(vocabulary)
    if m is None or not text:
        return text
    found = list(TOKEN.finditer(text))
    joinable = [text[a.end() : b.start()].isspace() for a, b in zip(found, found[1:])]
    changes = _plan(m, [f.group() for f in found], joinable)
    for first, last, word in reversed(changes):
        text = text[: found[first].start()] + word + text[found[last].end() :]
    return text


def correct_words(words: list[dict], vocabulary: list[dict]) -> list[dict]:
    """Timed words ({start, end, word} with its leading space and its punctuation) spelled as the vocabulary says.

    A name heard as several words becomes one word that spans their times."""
    m = matcher(vocabulary)
    if m is None or not words:
        return words
    where: list[tuple[int, re.Match]] = [(n, f) for n, w in enumerate(words) for f in TOKEN.finditer(w["word"])]
    joinable = []
    for (n, a), (k, b) in zip(where, where[1:]):
        if n == k:
            joinable.append(words[n]["word"][a.end() : b.start()].isspace())
        else:
            between = words[n]["word"][a.end() :] + words[k]["word"][: b.start()]
            joinable.append(k == n + 1 and between.isspace() and words[k]["start"] - words[n]["end"] < WORD_GAP)
    changes = _plan(m, [f.group() for _, f in where], joinable)
    if not changes:
        return words
    out = [dict(w) for w in words]
    gone: set[int] = set()
    for first, last, word in reversed(changes):
        (p, a), (q, b) = where[first], where[last]
        merged = out[p]["word"][: a.start()] + word + out[q]["word"][b.end() :]
        out[p]["word"] = merged
        if q != p:
            out[p]["end"] = out[q]["end"]
            gone.update(range(p + 1, q + 1))
    return [w for n, w in enumerate(out) if n not in gone]


def correct_segments(segments: list[dict], vocabulary: list[dict]) -> list[dict]:
    """A transcription's segments spelled as the vocabulary says, each on its own (a name never spans two)."""
    if matcher(vocabulary) is None:
        return segments
    out = []
    for segment in segments:
        segment = dict(segment)
        if segment.get("words"):
            words = correct_words(segment["words"], vocabulary)
            if words is not segment["words"]:
                segment["words"] = words
                segment["text"] = "".join(w["word"] for w in words).strip()
        elif segment.get("text"):
            segment["text"] = correct(segment["text"], vocabulary)
        out.append(segment)
    return out
