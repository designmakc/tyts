import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { LearnStore, TALLY_DAYS } from './learning'

const DAY_MS = 24 * 60 * 60 * 1000
const dirs: string[] = []
const stores: LearnStore[] = []

function store(now = () => 100 * DAY_MS): { s: LearnStore; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-learn-'))
  dirs.push(dir)
  const file = path.join(dir, 'learning.json')
  const s = new LearnStore(file, now)
  stores.push(s)
  return { s, file }
}

afterEach(() => {
  // A write still waiting goes now, before its folder does.
  for (const s of stores.splice(0)) s.flush()
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe('what Kryakl learns', () => {
  test('a word fixed by hand twice is fixed always', () => {
    const { s } = store()
    expect(s.fixedByHand({ word: 'vs', lang: 'ru' })).toBe(false)
    expect(s.alwaysFix).toEqual([])
    expect(s.fixedByHand({ word: 'vs', lang: 'ru' })).toBe(true)
    expect(s.alwaysFix).toEqual([{ word: 'vs', lang: 'ru' }])
  })

  test('a word kept as typed is fixed no more', () => {
    const { s } = store()
    s.fixedByHand({ word: 'vs', lang: 'ru' })
    s.fixedByHand({ word: 'vs', lang: 'ru' })
    expect(s.kept('vs')).toBe(true)
    expect(s.alwaysFix).toEqual([])
  })

  test('a word of the person\'s is kept by its fingerprint until it is learned, then by itself', () => {
    const { s, file } = store()
    s.tally('abc', 1)
    s.flush()
    expect(fs.readFileSync(file, 'utf8')).not.toContain('kryakl')
    expect(s.forThread().tally).toEqual({ abc: 1 })
    expect(s.tally('abc', 3, { word: 'kryakl', lang: 'en' })).toBe(true)
    expect(s.myWords).toEqual([{ word: 'kryakl', lang: 'en' }])
    expect(s.forThread().tally).toEqual({})
  })

  test('fingerprints unseen for a month are forgotten; Forget all takes everything and a new salt', () => {
    let now = 100 * DAY_MS
    const { s } = store(() => now)
    s.tally('old', 1)
    now += (TALLY_DAYS + 1) * DAY_MS
    s.tally('new', 1)
    s.flush()
    expect(Object.keys(s.forThread().tally)).toEqual(['new'])
    const salt = s.forThread().salt
    s.forget()
    expect(s.forThread()).toMatchObject({ alwaysFix: [], myWords: [], tally: {} })
    expect(s.forThread().salt).not.toBe(salt)
  })

  test('it is read back from its file', () => {
    const { s, file } = store()
    s.fixedByHand({ word: 'vs', lang: 'ru' })
    s.fixedByHand({ word: 'vs', lang: 'ru' })
    const again = new LearnStore(file, () => 100 * DAY_MS)
    expect(again.alwaysFix).toEqual([{ word: 'vs', lang: 'ru' }])
    expect(again.forThread().salt).toBe(s.forThread().salt)
  })
})

test('a backup’s learned words are added to their lists unless a list here has the word', () => {
  const { s, file } = store()
  s.tally('h', 3, { word: 'Kryakl', lang: 'en' })
  const added = s.merge({
    alwaysFix: [{ word: 'ghbdtn', lang: 'ru' }, { word: 'Kryakl', lang: 'ru' }],
    myWords: [{ word: 'Figma', lang: 'en' }],
    fixedOnce: 'junk',
  })
  expect(added).toBe(2)
  expect(s.lists()).toEqual({ fixedOnce: [], alwaysFix: [{ word: 'ghbdtn', lang: 'ru' }], myWords: [{ word: 'Kryakl', lang: 'en' }, { word: 'Figma', lang: 'en' }] })
  s.flush()
  expect(new LearnStore(file).lists().myWords).toHaveLength(2)
})
