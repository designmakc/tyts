import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { DictationLog, LOG_DAYS, LOG_MOST } from './dictationlog'

const dirs: string[] = []
function tempFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-dictation-'))
  dirs.push(dir)
  return path.join(dir, 'dictation.json')
}
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

const DAY = 24 * 60 * 60 * 1000
const START = Date.parse('2026-10-28T12:00:00Z')

describe('DictationLog', () => {
  test('keeps phrases newest first, the last one at hand, and survives a restart', () => {
    const file = tempFile()
    let now = START
    const log = new DictationLog(file, () => now)
    expect(log.last()).toBeUndefined()
    log.add({ mode: 'type', text: 'first' })
    now += 1000
    log.add({ mode: 'english', text: 'Hello', heard: 'Привет' })
    expect(log.last()).toMatchObject({ mode: 'english', text: 'Hello', heard: 'Привет' })
    expect(log.list().map(e => e.text)).toEqual(['Hello', 'first'])
    expect(log.list(1).map(e => e.text)).toEqual(['Hello'])
    expect(new DictationLog(file, () => now).list().map(e => e.text)).toEqual(['Hello', 'first'])
  })

  test('keeps at most 200 phrases, dropping the oldest', () => {
    let now = START
    const log = new DictationLog(tempFile(), () => now)
    for (let i = 0; i < LOG_MOST + 5; i++) {
      log.add({ mode: 'type', text: `phrase ${i}` })
      now += 1000
    }
    expect(log.list()).toHaveLength(LOG_MOST)
    expect(log.last()?.text).toBe(`phrase ${LOG_MOST + 4}`)
    expect(log.list().at(-1)?.text).toBe('phrase 5')
  })

  test('forgets phrases older than 30 days, on the next add and on reading the file', () => {
    const file = tempFile()
    let now = START
    const log = new DictationLog(file, () => now)
    log.add({ mode: 'type', text: 'old' })
    now += (LOG_DAYS - 1) * DAY
    log.add({ mode: 'type', text: 'newer' })
    now += 2 * DAY
    log.add({ mode: 'type', text: 'newest' })
    expect(log.list().map(e => e.text)).toEqual(['newest', 'newer'])
    now += (LOG_DAYS - 1) * DAY
    expect(new DictationLog(file, () => now).list().map(e => e.text)).toEqual(['newest'])
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toHaveLength(1)
  })

  test('clear empties it for good', () => {
    const file = tempFile()
    const log = new DictationLog(file, () => START)
    log.add({ mode: 'type', text: 'gone' })
    log.clear()
    expect(log.list()).toEqual([])
    expect(new DictationLog(file, () => START).last()).toBeUndefined()
  })

  test('a missing or broken file is an empty log', () => {
    expect(new DictationLog(tempFile()).list()).toEqual([])
    const broken = tempFile()
    fs.writeFileSync(broken, '{ not json', 'utf8')
    expect(new DictationLog(broken).list()).toEqual([])
    const odd = tempFile()
    fs.writeFileSync(odd, JSON.stringify([{ at: 'never', mode: 'type', text: 'x' }, { at: new Date(START).toISOString(), mode: 'note', text: 'y' }, 7]), 'utf8')
    expect(new DictationLog(odd, () => START).list()).toEqual([])
  })
})

test('a backup’s phrases are added once, newest first', () => {
  const log = new DictationLog(tempFile(), () => START)
  const mine = log.add({ mode: 'type', text: 'Привет' })
  const earlier = { at: new Date(START - DAY).toISOString(), mode: 'english', text: 'Hello', heard: 'Привет' }
  expect(log.merge([mine, earlier, { at: 'never', mode: 'type', text: 'x' }])).toBe(1)
  expect(log.list().map(e => e.text)).toEqual(['Привет', 'Hello'])
})
