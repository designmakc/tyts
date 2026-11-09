import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { ankiTsv, sensesText, WordStore, wordsText } from './words'

const dirs: string[] = []
function tempFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '2talker-words-'))
  dirs.push(dir)
  return path.join(dir, 'words.json')
}
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe('WordStore', () => {
  test('saves a word once by its dictionary form, newest first, and survives a restart', () => {
    const file = tempFile()
    const store = new WordStore(file)
    const walked = store.add({ word: 'walked', base: 'walk', senses: [['verb', 'ходить']], sentence: 'We walked home.' })
    store.add({ word: 'Weather', base: 'weather', senses: [['noun', 'погода']], sentence: 'The weather is nice.' })
    expect(store.add({ word: 'walks', base: 'Walk', senses: [], sentence: 'He walks.' })).toBe(walked)
    expect(store.list().map(w => w.base)).toEqual(['weather', 'walk'])
    expect(store.has('WALK')).toBe(true)

    const again = new WordStore(file)
    expect(again.list().map(w => w.id)).toEqual([2, 1])
    again.remove(1)
    expect(new WordStore(file).list().map(w => w.base)).toEqual(['weather'])
    again.removeBase('weather')
    expect(again.list()).toEqual([])
  })

  test('a missing or broken file is an empty notebook', () => {
    const file = tempFile()
    expect(new WordStore(file).list()).toEqual([])
    fs.writeFileSync(file, '{not json')
    expect(new WordStore(file).list()).toEqual([])
    fs.writeFileSync(file, JSON.stringify([{ id: 1 }, { id: 2, word: 'a', base: 'a', senses: [], sentence: '', addedAt: 'x' }]))
    expect(new WordStore(file).list().map(w => w.id)).toEqual([2])
  })
})

describe('export', () => {
  const words = [
    { id: 1, word: 'walked', base: 'walk', senses: [['verb', 'ходить'], ['noun', 'прогулка']] as [string, string][], sentence: 'We <b>walked</b>\thome.', addedAt: '' },
    { id: 2, word: 'nice', base: 'nice', senses: [['adj', 'хороший']] as [string, string][], sentence: '', addedAt: '' },
  ]

  test('Anki: front and back a tab apart, HTML on the back, no tabs or line breaks inside', () => {
    expect(ankiTsv(words).split('\n')).toEqual([
      'walk (walked)\t<i>verb</i> ходить<br><i>noun</i> прогулка<br><br>We &lt;b&gt;walked&lt;/b&gt; home.',
      'nice\t<i>adj</i> хороший',
    ])
  })

  test('plain text', () => {
    expect(sensesText(words[0]!.senses)).toBe('verb ходить; noun прогулка')
    expect(wordsText(words)).toBe('walk — verb ходить; noun прогулка\nnice — adj хороший')
  })
})

test('a backup’s words are added once by their dictionary form, in the order they were saved', () => {
  const file = tempFile()
  const store = new WordStore(file)
  store.add({ word: 'went', base: 'go', senses: [], sentence: 'We went home.' })
  const old = { id: 7, word: 'Ran', base: 'RUN', senses: [], sentence: 'She ran.', addedAt: '2026-01-01T00:00:00.000Z' }
  expect(store.merge([old, { id: 8, word: 'going', base: 'go', senses: [], sentence: '', addedAt: '2026-02-01T00:00:00.000Z' }, 'junk'])).toBe(1)
  expect(store.list().map(w => [w.base, w.sentence])).toEqual([
    ['go', 'We went home.'],
    ['run', 'She ran.'],
  ])
  expect(new Set(store.list().map(w => w.id)).size).toBe(2)
  expect(new WordStore(file).merge([old])).toBe(0)
})
