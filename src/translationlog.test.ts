import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { LOG_DAYS, LOG_MOST } from './dictationlog'
import { TranslationLog } from './translationlog'

const dirs: string[] = []
function tempFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-translations-'))
  dirs.push(dir)
  return path.join(dir, 'translations.json')
}
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

const DAY = 24 * 60 * 60 * 1000
const START = Date.parse('2026-10-28T12:00:00Z')

describe('TranslationLog', () => {
  test('keeps translations newest first and survives a restart', () => {
    const file = tempFile()
    let now = START
    const log = new TranslationLog(file, () => now)
    expect(log.list()).toEqual([])
    log.add({ from: 'ru', to: 'en', text: 'Привет', translation: 'Hello' })
    now += 1000
    log.add({ from: 'en', to: 'ru', text: 'Bye', translation: 'Пока' })
    expect(log.list().map(e => e.text)).toEqual(['Bye', 'Привет'])
    expect(log.list(1).map(e => e.text)).toEqual(['Bye'])
    expect(new TranslationLog(file, () => now).list().map(e => e.text)).toEqual(['Bye', 'Привет'])
  })

  test('keeps the languages, the text, the translation and the time of each', () => {
    const log = new TranslationLog(tempFile(), () => START)
    log.add({ from: 'de', to: 'ru', text: 'Hallo', translation: 'Привет' })
    expect(log.list()).toEqual([{ at: new Date(START).toISOString(), from: 'de', to: 'ru', text: 'Hallo', translation: 'Привет' }])
  })

  test('trims the text and the translation', () => {
    const log = new TranslationLog(tempFile(), () => START)
    log.add({ from: 'en', to: 'ru', text: '  Hi \n', translation: ' Привет  ' })
    expect(log.list()[0]).toMatchObject({ text: 'Hi', translation: 'Привет' })
  })

  test('ignores a text or a translation that is empty', () => {
    const file = tempFile()
    const log = new TranslationLog(file, () => START)
    log.add({ from: 'en', to: 'ru', text: '   ', translation: 'x' })
    log.add({ from: 'en', to: 'ru', text: 'x', translation: '' })
    expect(log.list()).toEqual([])
    expect(fs.existsSync(file)).toBe(false)
  })

  test('the same text translated the same way again only moves up', () => {
    let now = START
    const log = new TranslationLog(tempFile(), () => now)
    log.add({ from: 'en', to: 'ru', text: 'one', translation: 'один' })
    now += 1000
    log.add({ from: 'en', to: 'ru', text: 'two', translation: 'два' })
    now += 1000
    log.add({ from: 'en', to: 'ru', text: ' one ', translation: 'раз' })
    expect(log.list().map(e => [e.text, e.translation])).toEqual([
      ['one', 'раз'],
      ['two', 'два'],
    ])
  })

  test('the same text into another language is kept apart', () => {
    let now = START
    const log = new TranslationLog(tempFile(), () => now)
    log.add({ from: 'en', to: 'ru', text: 'Hello', translation: 'Привет' })
    now += 1000
    log.add({ from: 'en', to: 'de', text: 'Hello', translation: 'Hallo' })
    expect(log.list().map(e => e.to)).toEqual(['de', 'ru'])
  })

  test('keeps at most 200 translations, dropping the oldest', () => {
    let now = START
    const log = new TranslationLog(tempFile(), () => now)
    for (let i = 0; i < LOG_MOST + 5; i++) {
      log.add({ from: 'en', to: 'ru', text: `text ${i}`, translation: `перевод ${i}` })
      now += 1000
    }
    expect(log.list()).toHaveLength(LOG_MOST)
    expect(log.list()[0]?.text).toBe(`text ${LOG_MOST + 4}`)
    expect(log.list().at(-1)?.text).toBe('text 5')
  })

  test('forgets translations older than 30 days, on the next add and on reading the file', () => {
    const file = tempFile()
    let now = START
    const log = new TranslationLog(file, () => now)
    log.add({ from: 'en', to: 'ru', text: 'old', translation: 'старое' })
    now += (LOG_DAYS - 1) * DAY
    log.add({ from: 'en', to: 'ru', text: 'newer', translation: 'новее' })
    now += 2 * DAY
    log.add({ from: 'en', to: 'ru', text: 'newest', translation: 'новейшее' })
    expect(log.list().map(e => e.text)).toEqual(['newest', 'newer'])
    now += (LOG_DAYS - 1) * DAY
    expect(new TranslationLog(file, () => now).list().map(e => e.text)).toEqual(['newest'])
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toHaveLength(1)
  })

  test('puts a file written out of order newest first and cuts it to 200 on reading', () => {
    const file = tempFile()
    const entry = (i: number) => ({ at: new Date(START - i * 1000).toISOString(), from: 'en', to: 'ru', text: `t${i}`, translation: `p${i}` })
    const rows = Array.from({ length: LOG_MOST + 3 }, (_, i) => entry(i)).reverse()
    fs.writeFileSync(file, JSON.stringify(rows), 'utf8')
    const log = new TranslationLog(file, () => START)
    expect(log.list()).toHaveLength(LOG_MOST)
    expect(log.list()[0]?.text).toBe('t0')
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toHaveLength(LOG_MOST)
  })

  test('clear empties it for good', () => {
    const file = tempFile()
    const log = new TranslationLog(file, () => START)
    log.add({ from: 'en', to: 'ru', text: 'gone', translation: 'ушло' })
    log.clear()
    expect(log.list()).toEqual([])
    expect(new TranslationLog(file, () => START).list()).toEqual([])
  })

  test('a missing or broken file is an empty log, and rows that are not entries are dropped', () => {
    expect(new TranslationLog(tempFile()).list()).toEqual([])
    const broken = tempFile()
    fs.writeFileSync(broken, '{ not json', 'utf8')
    expect(new TranslationLog(broken).list()).toEqual([])
    const notList = tempFile()
    fs.writeFileSync(notList, JSON.stringify({ at: new Date(START).toISOString() }), 'utf8')
    expect(new TranslationLog(notList, () => START).list()).toEqual([])
    const at = new Date(START).toISOString()
    const odd = tempFile()
    fs.writeFileSync(
      odd,
      JSON.stringify([
        { at: 'never', from: 'en', to: 'ru', text: 'x', translation: 'y' },
        { at, from: 'en', to: 'ru', text: 'x' },
        { at, from: 'en', to: 5, text: 'x', translation: 'y' },
        null,
        7,
        { at, from: 'en', to: 'ru', text: 'kept', translation: 'оставлено' },
      ]),
      'utf8',
    )
    expect(new TranslationLog(odd, () => START).list().map(e => e.text)).toEqual(['kept'])
  })

  test('saves into a folder that does not exist yet', () => {
    const base = tempFile()
    const file = path.join(path.dirname(base), 'deeper', 'translations.json')
    new TranslationLog(file, () => START).add({ from: 'en', to: 'ru', text: 'a', translation: 'б' })
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toHaveLength(1)
  })
})

test('a backup’s translations are added once, too old ones dropped as always', () => {
  const now = Date.parse('2026-10-30T12:00:00Z')
  const log = new TranslationLog(tempFile(), () => now)
  log.add({ from: 'ru', to: 'en', text: 'Привет', translation: 'Hi' })
  const at = (days: number) => new Date(now - days * DAY).toISOString()
  const added = log.merge([
    { at: at(1), from: 'ru', to: 'en', text: 'Привет', translation: 'Hello' },
    { at: at(2), from: 'en', to: 'ru', text: 'Build', translation: 'Сборка' },
    { at: at(LOG_DAYS + 1), from: 'en', to: 'ru', text: 'Old', translation: 'Старое' },
  ])
  expect(added).toBe(1)
  expect(log.list().map(e => e.translation)).toEqual(['Hi', 'Сборка'])
})
