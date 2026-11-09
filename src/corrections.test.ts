import { describe, expect, test } from 'vitest'

import { addCorrection, applyCorrections, CORRECTIONS, correctionList, findCorrection } from './corrections'
import { normalize } from './settings'
import { vocabularyFor } from './vocabulary'

describe('a fix of a dictated phrase', () => {
  test('one word or a few changed is a correction to remember', () => {
    expect(findCorrection('Открой тицц, пожалуйста.', 'Открой Tyts, пожалуйста.')).toEqual({ ok: true, correction: { heard: 'тицц', right: 'Tyts' } })
    expect(findCorrection('we use visual studio code', 'we use VS code')).toEqual({ ok: true, correction: { heard: 'visual studio', right: 'VS' } })
    expect(findCorrection('send it to peshinsky', 'send it to Peshynskyi')).toEqual({ ok: true, correction: { heard: 'peshinsky', right: 'Peshynskyi' } })
  })

  test('only punctuation, or a word added or taken out, is nothing to learn', () => {
    expect(findCorrection('hello world', 'hello world.')).toEqual({ ok: false, why: 'none' })
    expect(findCorrection('hello world', 'hello big world')).toEqual({ ok: false, why: 'none' })
  })

  test('a rewrite, two changes or more than five words is too big', () => {
    expect(findCorrection('one two three four five six', 'a b c d e f')).toEqual({ ok: false, why: 'big' })
    expect(findCorrection('the kryakl app and the titts app', 'the Kryakl app and the Tyts app')).toEqual({ ok: false, why: 'big' })
  })

  test('a left side shorter than four letters is refused', () => {
    expect(findCorrection('I saw the cat', 'I saw the dog')).toEqual({ ok: false, why: 'short' })
  })
})

describe('learned corrections put right', () => {
  const list = [
    { heard: 'тицц', right: 'Tyts' },
    { heard: 'джейсон', right: 'JSON' },
    { heard: 'visual studio', right: 'vs code' },
    { heard: 'tehh', right: 'the' },
  ]

  test('whole words only, any case', () => {
    expect(applyCorrections('Тицц и тиццы, ТИЦЦ', list)).toBe('Tyts и тиццы, Tyts')
    expect(applyCorrections('open Visual   Studio now', list)).toBe('open Vs code now')
    expect(applyCorrections('TEHH end, Tehh start, tehh', list)).toBe('THE end, The start, the')
  })

  test('a fix is never fixed again, and the text is the same with no list', () => {
    expect(applyCorrections('aaaa bbbb', [{ heard: 'aaaa', right: 'bbbb' }, { heard: 'bbbb', right: 'cccc' }])).toBe('bbbb cccc')
    expect(applyCorrections('тицц', [])).toBe('тицц')
  })

  test('the same left side once, the newest kept, the cap held', () => {
    expect(addCorrection([{ heard: 'Тицц', right: 'Tits' }], { heard: 'тицц', right: 'Tyts' })).toEqual([{ heard: 'тицц', right: 'Tyts' }])
    const many = Array.from({ length: CORRECTIONS.most + 3 }, (_, i) => ({ heard: `word${i}`, right: `w${i}` }))
    const kept = correctionList(many)
    expect(kept).toHaveLength(CORRECTIONS.most)
    expect(kept[0]!.heard).toBe('word3')
  })

  test('the settings keep only pairs of words', () => {
    expect(normalize({ corrections: [{ heard: ' тицц ', right: 'Tyts' }, { heard: 'x' }, 'nope', { heard: 'same', right: 'same' }] }).corrections).toEqual([{ heard: 'тицц', right: 'Tyts' }])
    expect(normalize({}).corrections).toEqual([])
  })

  test("a name or term on the right is a word to spell, the person's own words first", () => {
    expect(vocabularyFor({ vocabulary: ['JSON (джейсон)'], corrections: list })).toEqual([
      { word: 'JSON', heard: ['джейсон'] },
      { word: 'Tyts', heard: ['тицц'] },
    ])
  })
})
