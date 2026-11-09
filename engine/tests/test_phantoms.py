"""What Whisper writes where nobody spoke: cut when off the sound, kept when said."""

import pytest

from phantoms import Sound, clean, clean_segment

HEARD = Sound(seconds=3.0, no_speech=0.02, logprob=-0.2)  # the sound carries the text
SILENT = Sound(seconds=1.0, no_speech=0.7, logprob=-0.4)  # a breath, a pause


@pytest.mark.parametrize("said, written", [
    ("Привет, буду через десять минут. Субтитры сделал DimaTorzok", "Привет, буду через десять минут."),
    ("Купи хлеба. Субтитры создавал DimaTorzok.", "Купи хлеба."),
    ("Субтитры сделал DimaTorzok", ""),
    ("Сделай отчёт к пятнице. Редактор субтитров А.Синецкая Корректор А.Егорова", "Сделай отчёт к пятнице."),
    ("Окей. Субтитры подогнал «Симон»!", "Окей."),
    ("Добре, домовились. Субтитри зроблені спільнотою Amara.org", "Добре, домовились."),
    ("Send it today. Subtitles by the Amara.org community", "Send it today."),
    ("Субтитры сделал DimaTorzok. Начнём с первого пункта.", "Начнём с первого пункта."),
])
def test_credits_go_always(said, written):
    assert clean(said, HEARD, dictation=True) == written
    assert clean(said, HEARD, dictation=False) == written


@pytest.mark.parametrize("said, written", [
    ("Скинь мне файл. Продолжение следует...", "Скинь мне файл."),
    ("Встреча в три. Спасибо за просмотр! Подписывайтесь на канал!", "Встреча в три."),
    ("Ставьте лайки и подписывайтесь на канал.", ""),
    ("Надішли адресу. Дякую за перегляд!", "Надішли адресу."),
    ("I'll call you back. Thanks for watching!", "I'll call you back."),
])
def test_sign_offs_of_a_video_end_no_dictation(said, written):
    assert clean(said, HEARD, dictation=True) == written


@pytest.mark.parametrize("said", [
    "Спасибо за просмотр!",
    "На сегодня всё. Продолжение следует.",
    "Thanks for watching, see you next week. Thank you for watching.",
])
def test_a_recording_keeps_the_sign_offs_its_sound_carries(said):
    assert clean(said, HEARD, dictation=False) == said


def test_a_recording_drops_a_sign_off_over_silence():
    assert clean("Продолжение следует...", SILENT, dictation=False) == ""


def test_a_recording_drops_a_sign_off_too_long_for_its_sound():
    quick = Sound(seconds=0.8, no_speech=0.05, logprob=-0.3)
    assert clean("Да. Спасибо за просмотр!", quick, dictation=False) == "Да."


@pytest.mark.parametrize("said", [
    "Спасибо.",
    "Спасибо большое!",
    "Thank you.",
    "Дякую.",
    "Спасибо за внимание.",
])
def test_thanks_said_are_kept(said):
    assert clean(said, HEARD, dictation=True) == said


@pytest.mark.parametrize("said", ["Спасибо.", "Thank you.", "Спасибо за внимание."])
def test_thanks_over_silence_go(said):
    assert clean(said, SILENT, dictation=True) == ""


@pytest.mark.parametrize("said", [
    "Всё готово, спасибо.",
    "Хорошо. Спасибо.",  # thanks after a text: said, whatever the sound
    "Посмотри субтитры к фильму, там опечатка.",
    "Продолжение следует читать во второй главе.",
    "Подписывайтесь на канал Пети, он классный, и спасибо за просмотр моего отчёта.",
    "We need captions by Friday.",
])
def test_ordinary_text_is_left_alone(said):
    assert clean(said, SILENT, dictation=True) == said


def test_a_segment_loses_the_words_of_what_it_cut():
    segment = {
        "start": 10.0, "end": 14.0, "text": "До завтра. Субтитры сделал DimaTorzok",
        "words": [
            {"start": 10.0, "end": 10.3, "word": " До"},
            {"start": 10.3, "end": 10.9, "word": " завтра."},
            {"start": 11.0, "end": 11.6, "word": " Субтитры"},
            {"start": 11.6, "end": 12.0, "word": " сделал"},
            {"start": 12.0, "end": 14.0, "word": " DimaTorzok"},
        ],
    }
    kept = clean_segment(segment, HEARD)
    assert kept["text"] == "До завтра."
    assert [w["word"] for w in kept["words"]] == [" До", " завтра."]
    assert (kept["start"], kept["end"]) == (10.0, 10.9)


def test_a_segment_of_nothing_but_credits_is_gone():
    segment = {"start": 0.0, "end": 2.0, "text": "Субтитры сделал DimaTorzok", "words": []}
    assert clean_segment(segment, HEARD) is None


def test_a_clean_segment_is_the_same_object():
    segment = {"start": 0.0, "end": 2.0, "text": "Начинаем.", "words": []}
    assert clean_segment(segment, HEARD) is segment
