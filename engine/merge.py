"""Words and speaker turns into utterances: who said what, in order."""

from __future__ import annotations

import re

ME = "me"
SENTENCE_END = re.compile(r"[.!?…]['\")»]*$")
WORD = re.compile(r"\w+", re.UNICODE)

PAUSE = 1.5       # a pause this long after a full stop starts a new utterance
LONGEST = 45.0    # a monologue is cut at the next full stop after this many seconds


def words_of(segments: list[dict]) -> list[dict]:
    return [dict(w) for s in segments for w in s["words"]]


def assign(words: list[dict], turns: list[tuple[float, float, str]]) -> None:
    """Each word gets the speaker whose turn overlaps it most, else the nearest one."""
    if not turns:
        for w in words:
            w["speaker"] = "S1"
        return
    turns = sorted(turns)
    i = 0
    previous = turns[0][2]
    for w in words:
        while i < len(turns) and turns[i][1] < w["start"] - 1.0:
            i += 1
        best, best_overlap, best_distance = None, 0.0, 1.0
        j = i
        while j < len(turns) and turns[j][0] <= w["end"] + 1.0:
            start, end, label = turns[j]
            overlap = min(end, w["end"]) - max(start, w["start"])
            distance = max(start - w["end"], w["start"] - end, 0.0)
            if overlap > best_overlap or (best_overlap == 0.0 and distance < best_distance):
                best, best_overlap, best_distance = label, max(overlap, 0.0), distance
            j += 1
        w["speaker"] = best or previous
        previous = w["speaker"]
    smooth(words)


ISLAND = 2     # words: a run this short inside someone else's speech is taken for noise
FRAGMENT = 3   # words: a sentence piece this short at a change of speaker moves to its sentence


def _runs(words: list[dict]) -> list[list[int]]:
    """Indexes of consecutive words with the same speaker."""
    runs: list[list[int]] = []
    for i, w in enumerate(words):
        if runs and words[runs[-1][-1]]["speaker"] == w["speaker"]:
            runs[-1].append(i)
        else:
            runs.append([i])
    return runs


def _ends(w: dict) -> bool:
    return SENTENCE_END.search(w["word"].strip()) is not None


def smooth(words: list[dict]) -> None:
    """The edges of speaker turns and the words' times never quite agree; this mends the two usual slips.

    A word or two of another speaker inside one person's speech go back to that person
    ("какой | степ, | если доставка"); and a sentence cut by a change of speaker goes
    whole to whoever said most of it ("кто-то? Ну, сложнее | разработка" → "Ну, сложнее"
    begins the next speaker's sentence).
    """
    for run_before, island, run_after in zip(_runs(words), _runs(words)[1:], _runs(words)[2:]):
        same = words[run_before[0]]["speaker"] == words[run_after[0]]["speaker"]
        short = len(island) <= ISLAND and words[island[-1]]["end"] - words[island[0]]["start"] < 1.0
        if same and short:
            for i in island:
                words[i]["speaker"] = words[run_before[0]]["speaker"]
    runs = _runs(words)
    for a, b in zip(runs, runs[1:]):
        if _ends(words[a[-1]]):
            continue  # the change falls between sentences: nothing to mend
        # The end of a: words after its last full stop, if few, start b's sentence.
        last_end = next((k for k in range(len(a) - 2, -1, -1) if _ends(words[a[k]])), None)
        if last_end is not None and len(a) - 1 - last_end <= FRAGMENT:
            for i in a[last_end + 1:]:
                words[i]["speaker"] = words[b[0]]["speaker"]
            continue
        # The start of b: words up to its first full stop, if few, finish a's sentence.
        first_end = next((k for k, i in enumerate(b) if _ends(words[i])), None)
        if first_end is not None and first_end + 1 <= FRAGMENT and first_end + 1 < len(b):
            for i in b[: first_end + 1]:
                words[i]["speaker"] = words[a[0]]["speaker"]


def group(words: list[dict]) -> list[dict]:
    """Words into utterances: a new one at a change of speaker, or at a full stop after a long pause or a long run.

    A word that carries its index in the stored words ("i") leaves the
    utterance a "w": [first, last] range, so speakers can be split again later.
    """
    out: list[dict] = []
    for w in words:
        last = out[-1] if out else None
        if last is not None:
            ended = SENTENCE_END.search(last["text"]) is not None
            same = w["speaker"] == last["speaker"]
            pause = w["start"] - last["end"]
            if same and not (ended and (pause > PAUSE or last["end"] - last["start"] > LONGEST)):
                last["text"] += w["word"]
                last["end"] = w["end"]
                if "i" in w:
                    last["w"][1] = w["i"]
                continue
        u = {"speaker": w["speaker"], "start": w["start"], "end": w["end"], "text": w["word"]}
        if "i" in w:
            u["w"] = [w["i"], w["i"]]
        out.append(u)
    for u in out:
        u["text"] = u["text"].strip()
    return [u for u in out if u["text"]]


def renumber(utterances: list[dict]) -> dict:
    """pyannote's SPEAKER_00… become S1, S2… in the order they first speak."""
    names: dict[str, str] = {}
    for u in utterances:
        if u["speaker"] == ME:
            continue
        if u["speaker"] not in names:
            names[u["speaker"]] = f"S{len(names) + 1}"
        u["speaker"] = names[u["speaker"]]
    speakers = {key: {"name": f"Speaker {key[1:]}"} for key in names.values()}
    if any(u["speaker"] == ME for u in utterances):
        speakers = {ME: {"name": "Me"}, **speakers}
    return speakers


def _tokens(text: str) -> list[str]:
    return [t for t in WORD.findall(text.lower()) if len(t) > 2]


ECHO_WINDOW = 1.5  # seconds between their word and my microphone hearing it


def drop_echo(mine: list[dict], theirs: list[dict]) -> list[dict]:
    """Without headphones the microphone hears the others too: my words they said at the same moment go.

    Word by word, since my own speech and the echo end up in one Whisper segment. A
    word too short to judge (a, is, и) follows the judged word nearest to it in time.
    """
    theirs = sorted(theirs, key=lambda w: w["start"])
    echo: list[bool | None] = []
    i = 0
    for w in mine:
        tokens = _tokens(w["word"])
        if not tokens:
            echo.append(None)
            continue
        while i < len(theirs) and theirs[i]["end"] < w["start"] - ECHO_WINDOW:
            i += 1
        near = set()
        j = i
        while j < len(theirs) and theirs[j]["start"] <= w["end"] + ECHO_WINDOW:
            near.update(_tokens(theirs[j]["word"]))
            j += 1
        echo.append(all(t in near for t in tokens))
    judged = list(echo)
    for k, flag in enumerate(judged):
        if flag is not None:
            continue
        before = next((n for n in range(k - 1, -1, -1) if judged[n] is not None), None)
        after = next((n for n in range(k + 1, len(judged)) if judged[n] is not None), None)
        gap_before = mine[k]["start"] - mine[before]["end"] if before is not None else float("inf")
        gap_after = mine[after]["start"] - mine[k]["end"] if after is not None else float("inf")
        nearest = before if gap_before < gap_after else after
        echo[k] = bool(judged[nearest]) if nearest is not None else False
    return [w for w, flag in zip(mine, echo) if not flag]


def stored(words: list[dict], track: str) -> None:
    """Marks words with their track; `index` then numbers them as they are kept in transcript.json."""
    for w in words:
        w["track"] = track


def index(words: list[dict]) -> list[dict]:
    """Numbers the words ("i") and returns them as transcript.json keeps them."""
    for i, w in enumerate(words):
        w["i"] = i
    return [{"start": w["start"], "end": w["end"], "word": w["word"], "track": w["track"]} for w in words]


def single(segments: list[dict], turns: list[tuple[float, float, str]] | None) -> tuple[list[dict], list[dict]]:
    """Utterances, and the words kept to split speakers again later."""
    words = words_of(segments)
    stored(words, "main")
    kept = index(words)
    assign(words, turns or [])
    return group(words), kept


def meeting(
    mine: list[dict],
    theirs: list[dict],
    turns: list[tuple[float, float, str]] | None,
    track: str = "tab",
) -> tuple[list[dict], list[dict]]:
    """My microphone's segments as "me", the tab's (or a call's "system") split by speaker, echo removed, in time order."""
    my_words = words_of(mine)
    for w in my_words:
        w["speaker"] = ME
    their_words = words_of(theirs)
    assign(their_words, turns or [])
    my_words = drop_echo(my_words, their_words)
    stored(my_words, "mic")
    stored(their_words, track)
    kept = index(my_words + their_words)
    utterances = group(my_words) + group(their_words)
    utterances.sort(key=lambda u: (u["start"], u["end"]))
    return utterances, kept


def majority(turns: list[tuple[float, float, str]], start: float, end: float) -> str | None:
    """The speaker who talks most between start and end."""
    talk: dict[str, float] = {}
    for a, b, label in turns:
        overlap = min(b, end) - max(a, start)
        if overlap > 0:
            talk[label] = talk.get(label, 0.0) + overlap
    return max(talk, key=talk.get) if talk else None


def resplit(t: dict, turns: list[tuple[float, float, str]]) -> list[dict]:
    """A finished transcript's utterances made again from its words and new speaker turns.

    An utterance edited by hand keeps its text whole and goes to whoever spoke
    most of it; the rest are regrouped word by word. My microphone stays "me".
    """
    words = [dict(w) for w in t.get("words", [])]
    for i, w in enumerate(words):
        w["i"] = i
        if w.get("track") == "mic":
            w["speaker"] = ME
    assign([w for w in words if w.get("track") != "mic"], turns)
    out: list[dict] = []
    pending: list[dict] = []
    previous = turns[0][2] if turns else "S1"
    for u in sorted(t.get("utterances", []), key=lambda u: (u["start"], u["end"])):
        if u.get("edited") or "w" not in u:
            out.extend(group(pending))
            pending = []
            kept = dict(u)
            if kept["speaker"] != ME:
                kept["speaker"] = majority(turns, u["start"], u["end"]) or previous
                previous = kept["speaker"]
            out.append(kept)
        else:
            first, last = u["w"]
            pending.extend(words[first:last + 1])
            if pending and pending[-1]["speaker"] != ME:
                previous = pending[-1]["speaker"]
    out.extend(group(pending))
    out.sort(key=lambda u: (u["start"], u["end"]))
    return out
