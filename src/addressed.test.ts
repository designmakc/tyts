import { describe, expect, test } from 'vitest'

import { addressHints, type Said } from './addressed'

const talk = (...lines: [string, string][]): Said[] => lines.map(([speaker, text], i) => ({ speaker, start: i * 5, end: i * 5 + 4, text }))

describe('names from how speakers are spoken to', () => {
  test('the one who answers a call by name gets the name', () => {
    const hints = addressHints(
      talk(['S1', 'Коля, что у тебя?'], ['S2', 'У меня всё готово.'], ['S1', 'Спасибо, Коля, отлично.'], ['S2', 'Да.'], ['S1', 'Лера, расскажи, что у тебя.'], ['S3', 'Я доделала макет.'], ['S2', 'Лера, а когда релиз?'], ['S3', 'В пятницу.']),
    )
    expect(hints).toEqual({ S2: 'Коля', S3: 'Лера' })
  })
  test('one call by name is enough; a name between commas is not', () => {
    expect(addressHints(talk(['S1', 'Что скажешь, Оля?'], ['S2', 'Согласна.']))).toEqual({ S2: 'Оля' })
    expect(addressHints(talk(['S1', 'Марина, как дела?'], ['S2', 'Хорошо.']))).toEqual({ S2: 'Марина' })
    expect(addressHints(talk(['S1', 'В прошлый раз, ладно, было, Максим.'], ['S2', 'Да.'], ['S1', 'Вот у нас был, Азербайджан, тогда.'], ['S2', 'Да.']))).toEqual({})
  })
  test('common words and openers are no names', () => {
    expect(addressHints(talk(['S1', 'Слушай, а когда релиз?'], ['S2', 'Завтра.'], ['S1', 'Короче, делаем так.'], ['S2', 'Ок.'], ['S1', 'Завтра, значит.'], ['S2', 'Да, завтра.']))).toEqual({})
  })
  test('a name two speakers answered to equally, a late answer, and my own track give no hint', () => {
    expect(addressHints(talk(['S1', 'Ну что, Оля?'], ['S2', 'Да.'], ['S1', 'Ну что, Оля?'], ['S3', 'Да.']))).toEqual({})
    expect(addressHints([{ speaker: 'S1', start: 0, end: 4, text: 'Ну что, Оля?' }, { speaker: 'S2', start: 60, text: 'Да.' }])).toEqual({})
    expect(addressHints(talk(['S1', 'Что скажешь, Коля?'], ['me', 'Согласен.']))).toEqual({})
  })
})
