import { describe, expect, test } from 'vitest'

import { normalize } from './settings'
import { parseEntry, vocabularyFor } from './vocabulary'

describe('words to spell', () => {
  test('a line is the word, then what it is heard as in parentheses', () => {
    expect(parseEntry('Peshynskyi')).toEqual({ word: 'Peshynskyi', heard: [] })
    expect(parseEntry('Altype (альтайп, алтайп, all type)')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп', 'all type'] })
    expect(parseEntry('Altype ( , altype,, альтайп ')).toEqual({ word: 'Altype', heard: ['альтайп'] })
    expect(parseEntry('(альтайп)')).toEqual({ word: '', heard: ['альтайп'] })
  })

  test('an empty or blank line has no word and nothing heard', () => {
    expect(parseEntry('')).toEqual({ word: '', heard: [] })
    expect(parseEntry('   \t ')).toEqual({ word: '', heard: [] })
  })

  test('empty parentheses leave the word with nothing heard', () => {
    expect(parseEntry('Altype ()')).toEqual({ word: 'Altype', heard: [] })
    expect(parseEntry('Altype (   )')).toEqual({ word: 'Altype', heard: [] })
  })

  test('spaces around the word and the commas do not matter', () => {
    expect(parseEntry('  Altype   (  альтайп ,алтайп  ,   all type )  ')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп', 'all type'] })
  })

  test('Cyrillic and Latin mix freely, on both sides', () => {
    expect(parseEntry('Altype (альтайп, алтайп)')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп'] })
    expect(parseEntry('Альтайп (Altype, all type)')).toEqual({ word: 'Альтайп', heard: ['Altype', 'all type'] })
  })

  test('parentheses without a closing one still read what follows', () => {
    expect(parseEntry('Altype (альтайп, алтайп')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп'] })
    expect(parseEntry('Altype (')).toEqual({ word: 'Altype', heard: [] })
  })

  test('text after the closing parenthesis is ignored', () => {
    expect(parseEntry('Altype (альтайп) and more')).toEqual({ word: 'Altype', heard: ['альтайп'] })
  })

  test('a heard form given twice is kept once, and the word itself is not a heard form in any case', () => {
    expect(parseEntry('Altype (альтайп, альтайп, алтайп)')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп'] })
    expect(parseEntry('Altype (ALTYPE, altype, Альтайп)')).toEqual({ word: 'Altype', heard: ['Альтайп'] })
  })

  test('a very long line is read whole', () => {
    const long = 'x'.repeat(5000)
    expect(parseEntry(long)).toEqual({ word: long, heard: [] })
    const many = Array.from({ length: 500 }, (_, i) => `h${i}`)
    expect(parseEntry(`Word (${many.join(', ')})`).heard).toEqual(many)
  })

  test('the engine gets every line with a word', () => {
    expect(vocabularyFor({ vocabulary: ['Peshynskyi', '(nothing)', 'Altype (all type)'] })).toEqual([
      { word: 'Peshynskyi', heard: [] },
      { word: 'Altype', heard: ['all type'] },
    ])
  })

  test('settings keep tidy lines, one per word', () => {
    const lines = normalize({ vocabulary: ['  Altype \n (all   type) ', 'altype (альтайп)', 'x'.repeat(300), 5, ''] }).vocabulary
    expect(lines).toEqual(['Altype (all type)', 'x'.repeat(120)])
    expect(normalize({ vocabulary: Array.from({ length: 300 }, (_, i) => `w${i}`) }).vocabulary).toHaveLength(200)
  })

  test('settings drop blank lines, lines without a word and a vocabulary that is not a list', () => {
    expect(normalize({ vocabulary: ['', '   ', '\n\t', '(only heard)', 'Altype ()'] }).vocabulary).toEqual(['Altype ()'])
    expect(normalize({ vocabulary: 'Altype' }).vocabulary).toEqual([])
    expect(normalize({ vocabulary: null }).vocabulary).toEqual([])
    expect(normalize({}).vocabulary).toEqual([])
  })

  test('settings keep the same word once whatever its case, the first line winning', () => {
    expect(normalize({ vocabulary: ['Altype (альтайп)', 'ALTYPE', 'altype (all type)', 'Альтайп', 'альтайп'] }).vocabulary).toEqual(['Altype (альтайп)', 'Альтайп'])
  })

  test('settings cut a long line at 120 characters, even inside the parentheses', () => {
    const line = `Altype (${Array.from({ length: 40 }, (_, i) => `form${i}`).join(', ')})`
    const kept = normalize({ vocabulary: [line] }).vocabulary[0] ?? ''
    expect(kept.length).toBeLessThanOrEqual(120)
    expect(parseEntry(kept).word).toBe('Altype')
    expect(parseEntry(kept).heard.length).toBeGreaterThan(5)
  })

  test('a line saved by settings reads back the same', () => {
    const [line] = normalize({ vocabulary: ['  Altype  (альтайп ,  алтайп) '] }).vocabulary
    expect(line).toBe('Altype (альтайп , алтайп)')
    expect(parseEntry(line ?? '')).toEqual({ word: 'Altype', heard: ['альтайп', 'алтайп'] })
  })
})
