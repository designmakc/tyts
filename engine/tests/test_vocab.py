"""Words spelled as the person wants them: what they are heard as, another case, a near miss."""

import pytest

import merge
import vocab

VOCABULARY = [
    {"word": "Altype", "heard": ["альтайп", "алтайп", "all type"]},
    {"word": "Paximizer", "heard": []},
    {"word": "Peshynskyi", "heard": []},
    {"word": "Льоша", "heard": ["леша"]},
    {"word": "Lisa", "heard": []},
]


@pytest.mark.parametrize("said, written", [
    ("I use альтайп daily.", "I use Altype daily."),
    ("Open all type, then save", "Open Altype, then save"),
    ("the paximiser report", "the Paximizer report"),
    ("Peshinsky said", "Peshynskyi said"),
    ("Лёша пришёл", "Льоша пришёл"),
    ("ALTYPE's plan", "Altype's plan"),
    ("lisa and Алтайп’s key", "Lisa and Altype’s key"),
])
def test_correct(said, written):
    assert vocab.correct(said, VOCABULARY) == written


@pytest.mark.parametrize("said", [
    "Which type? Alt key. Altai trip. Maximizer on. Make a list.",
    "Паксимайзер",
    "all, type",  # punctuation between: two words, not a name
    "Paximizer2 and paximizer2",  # digits match only exactly
])
def test_left_alone(said):
    assert vocab.correct(said, VOCABULARY) == said


def test_a_tie_between_two_spellings_changes_nothing():
    two = [{"word": "Kowalska", "heard": []}, {"word": "Kowalski", "heard": []}]
    assert vocab.correct("Kowalsky came", two) == "Kowalsky came"
    assert vocab.correct("Kowalskaa came", two) == "Kowalska came"


def test_an_empty_vocabulary_changes_nothing():
    assert vocab.correct("all type", []) == "all type"
    segments = [{"text": "all type", "words": [{"start": 0, "end": 1, "word": " all"}]}]
    assert vocab.correct_segments(segments, []) is segments


def test_distance_counts_a_swap_as_one():
    assert vocab.distance("paxmiizer", "paximizer", 2) == 1
    assert vocab.distance("abcdef", "uvwxyz", 2) == 3


def test_words_keep_their_times_and_a_heard_name_spans_its_words():
    words = [{"start": 0.0, "end": 0.3, "word": " all"}, {"start": 0.3, "end": 0.6, "word": " type,"}, {"start": 0.7, "end": 1.0, "word": " fine."}]
    assert vocab.correct_words(words, VOCABULARY) == [{"start": 0.0, "end": 0.6, "word": " Altype,"}, {"start": 0.7, "end": 1.0, "word": " fine."}]
    # A long pause between them: two words, not one name.
    apart = [{"start": 0.0, "end": 0.3, "word": " all"}, {"start": 1.5, "end": 1.8, "word": " type"}]
    assert vocab.correct_words(apart, VOCABULARY) == apart


def test_corrected_segments_still_merge_with_valid_ranges():
    segments = [
        {"start": 0.0, "end": 1.0, "text": "I use all type.", "words": [
            {"start": 0.0, "end": 0.2, "word": " I"}, {"start": 0.2, "end": 0.4, "word": " use"},
            {"start": 0.4, "end": 0.6, "word": " all"}, {"start": 0.6, "end": 1.0, "word": " type."}]},
        # A name never spans two segments.
        {"start": 1.2, "end": 2.0, "text": "All", "words": [{"start": 1.2, "end": 1.4, "word": " All"}]},
        {"start": 1.4, "end": 2.0, "text": "type is the paximiser.", "words": [
            {"start": 1.4, "end": 1.6, "word": " type"}, {"start": 1.6, "end": 1.7, "word": " is"},
            {"start": 1.7, "end": 1.8, "word": " the"}, {"start": 1.8, "end": 2.0, "word": " paximiser."}]},
    ]
    fixed = vocab.correct_segments(segments, VOCABULARY)
    assert [s["text"] for s in fixed] == ["I use Altype.", "All", "type is the Paximizer."]
    assert segments[0]["text"] == "I use all type."  # the input is not changed underneath
    utterances, kept = merge.single(fixed, None)
    assert [w["word"] for w in kept] == [" I", " use", " Altype.", " All", " type", " is", " the", " Paximizer."]
    for u in utterances:
        first, last = u["w"]
        assert "".join(kept[i]["word"] for i in range(first, last + 1)).strip() == u["text"]
    assert kept[2]["start"] == 0.4 and kept[2]["end"] == 1.0


def test_hotwords_join_dedupe_and_cap():
    assert vocab.hotwords(VOCABULARY, "Altype; Visual Studio, Lisa\nOpenAI") == "Altype, Paximizer, Peshynskyi, Льоша, Lisa, Visual Studio, OpenAI"
    many = [{"word": f"Name{i}", "heard": []} for i in range(60)]
    assert len(vocab.hotwords(many).split(", ")) == 40
    capped = vocab.hotwords(many, chars=20)
    assert capped == "Name0, Name1, Name2" and len(capped) <= 20
    assert vocab.hotwords([], "") == ""
