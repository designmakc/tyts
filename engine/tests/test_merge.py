import merge


def w(word, start, end, speaker=None):
    d = {"word": word, "start": start, "end": end}
    if speaker:
        d["speaker"] = speaker
    return d


def test_words_of_copies():
    seg = [{"words": [w(" hi", 0, 1)]}]
    out = merge.words_of(seg)
    out[0]["speaker"] = "x"
    assert "speaker" not in seg[0]["words"][0]


def test_assign_without_turns():
    words = [w("a", 0, 1)]
    merge.assign(words, [])
    assert words[0]["speaker"] == "S1"


def test_assign_most_overlap_and_nearest():
    turns = [(0, 2, "A"), (2, 10, "B")]
    words = [w("x", 1.5, 3.0), w("y", 4, 5), w("z", 12, 12.5)]
    merge.assign(words, turns)
    assert [x["speaker"] for x in words] == ["B", "B", "B"]


def test_assign_far_word_keeps_previous_speaker():
    words = [w("a", 0, 1), w("b", 50, 51)]
    merge.assign(words, [(0, 1, "A"), (100, 110, "B")])
    assert [x["speaker"] for x in words] == ["A", "A"]


def test_group_merges_same_speaker():
    words = [w(" Hello", 0, 1, "A"), w(" world.", 1, 2, "A"), w(" Hi", 2.2, 3, "B")]
    out = merge.group(words)
    assert [(u["speaker"], u["text"]) for u in out] == [("A", "Hello world."), ("B", "Hi")]


def test_group_splits_on_long_pause_after_sentence_only():
    assert len(merge.group([w(" One.", 0, 1, "A"), w(" Two", 5, 6, "A")])) == 2
    assert len(merge.group([w(" One", 0, 1, "A"), w(" two", 5, 6, "A")])) == 1


def test_group_drops_empty():
    assert merge.group([w("  ", 0, 1, "A")]) == []


def test_renumber_order_and_me():
    us = [{"speaker": "SPEAKER_05"}, {"speaker": "me"}, {"speaker": "SPEAKER_01"}, {"speaker": "SPEAKER_05"}]
    speakers = merge.renumber(us)
    assert [u["speaker"] for u in us] == ["S1", "me", "S2", "S1"]
    assert list(speakers) == ["me", "S1", "S2"]
    assert speakers["me"]["name"] == "Me"
    assert speakers["S2"]["name"] == "Speaker 2"


def test_renumber_without_me():
    assert "me" not in merge.renumber([{"speaker": "X"}])


def test_drop_echo_removes_words_they_said():
    mine = [w(" hello", 1, 1.5), w(" there", 1.5, 2), w(" banana", 10, 10.5)]
    theirs = [w(" hello", 1.1, 1.6), w(" there", 1.6, 2.1)]
    assert [x["word"] for x in merge.drop_echo(mine, theirs)] == [" banana"]


def test_drop_echo_short_word_follows_neighbour():
    mine = [w(" и", 1, 1.1), w(" привет", 1.1, 1.6), w(" и", 20, 20.1), w(" пока", 20.1, 20.6)]
    theirs = [w(" привет", 1.2, 1.7)]
    assert [x["word"] for x in merge.drop_echo(mine, theirs)] == [" и", " пока"]


def test_drop_echo_no_theirs_keeps_all():
    mine = [w(" hello", 0, 1)]
    assert merge.drop_echo(mine, []) == mine


def test_single():
    segs = [{"words": [w(" Hi.", 0, 1), w(" Bye", 1, 2)]}]
    out, words = merge.single(segs, [(0, 2, "SPEAKER_00")])
    assert out[0]["speaker"] == "SPEAKER_00" and out[0]["text"] == "Hi. Bye"
    assert out[0]["w"] == [0, 1]
    assert words == [{"start": 0, "end": 1, "word": " Hi.", "track": "main"}, {"start": 1, "end": 2, "word": " Bye", "track": "main"}]


def test_meeting_sorted_and_echo_removed():
    mine = [{"words": [w(" hello", 5, 5.5), w(" unique", 0, 0.5)]}]
    theirs = [{"words": [w(" hello", 5.1, 5.6)]}]
    out, words = merge.meeting(mine, theirs, [(0, 10, "SPEAKER_00")])
    assert [(u["speaker"], u["text"]) for u in out] == [("me", "unique"), ("SPEAKER_00", "hello")]
    # the echoed "hello" of my microphone is not kept either
    assert [(x["word"], x["track"]) for x in words] == [(" unique", "mic"), (" hello", "tab")]


def transcript_of(segments, turns=None):
    utterances, words = merge.single(segments, turns)
    return {"utterances": utterances, "words": words, "speakers": merge.renumber(utterances)}


TALK = [{"words": [w(" Hello", 0, 0.5), w(" there.", 0.5, 1), w(" Fine", 1.2, 1.6), w(" thanks.", 1.6, 2)]}]
TWO = [(0, 1.1, "SPEAKER_00"), (1.1, 2.5, "SPEAKER_01")]


def test_resplit_regroups_one_speaker_into_two():
    t = transcript_of(TALK)
    assert len(t["utterances"]) == 1
    out = merge.resplit(t, TWO)
    assert [(u["speaker"], u["text"]) for u in out] == [("SPEAKER_00", "Hello there."), ("SPEAKER_01", "Fine thanks.")]


def test_resplit_keeps_an_edited_line_whole():
    t = transcript_of(TALK)
    t["utterances"][0]["text"] = "Hello there. Fine, thanks!"
    t["utterances"][0]["edited"] = True
    out = merge.resplit(t, [(0, 0.5, "SPEAKER_00"), (0.5, 2.5, "SPEAKER_01")])
    assert [(u["speaker"], u["text"]) for u in out] == [("SPEAKER_01", "Hello there. Fine, thanks!")]


def test_resplit_leaves_me_alone():
    mine = [{"words": [w(" Mine", 0, 0.5)]}]
    theirs = [{"words": [w(" Yours.", 3, 3.5), w(" Also", 6, 6.5)]}]
    utterances, words = merge.meeting(mine, theirs, None)
    out = merge.resplit({"utterances": utterances, "words": words}, [(2, 4, "SPEAKER_00"), (5, 7, "SPEAKER_01")])
    assert [(u["speaker"], u["text"]) for u in out] == [("me", "Mine"), ("SPEAKER_00", "Yours."), ("SPEAKER_01", "Also")]


def test_smooth_gives_a_lone_word_back():
    words = [w(" какой", 0, 0.4, "A"), w(" степ,", 0.4, 0.8, "B"), w(" если", 0.8, 1.2, "A"), w(" доставка.", 1.2, 1.8, "A")]
    merge.smooth(words)
    assert [x["speaker"] for x in words] == ["A", "A", "A", "A"]


def test_smooth_moves_a_new_sentence_start_to_its_speaker():
    words = [w(" кто-то?", 0, 0.5, "A"), w(" Ну,", 0.6, 0.8, "A"), w(" сложнее", 0.8, 1.2, "A"), w(" разработка", 1.3, 1.8, "B"), w(" идёт.", 1.8, 2.2, "B")]
    merge.smooth(words)
    assert [x["speaker"] for x in words] == ["A", "B", "B", "B", "B"]


def test_smooth_finishes_a_sentence_with_its_last_word():
    words = [w(" Какая", 0, 0.4, "A"), w(" разница", 0.4, 0.9, "A"), w(" здесь.", 1.0, 1.4, "B"), w(" Мы", 1.6, 1.8, "B"), w(" решили", 1.8, 2.3, "B"), w(" так.", 2.3, 2.6, "B")]
    merge.smooth(words)
    assert [x["speaker"] for x in words] == ["A", "A", "A", "B", "B", "B"]


def test_smooth_leaves_a_clean_change_alone():
    words = [w(" Готово.", 0, 0.5, "A"), w(" Спасибо", 1, 1.5, "B")]
    merge.smooth(words)
    assert [x["speaker"] for x in words] == ["A", "B"]


def test_majority():
    assert merge.majority(TWO, 0.8, 2.0) == "SPEAKER_01"
    assert merge.majority(TWO, 5, 6) is None
