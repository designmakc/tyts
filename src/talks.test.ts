import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { LOG_DAYS } from './dictationlog'
import type { TalkTurn } from './talk'
import { summaryOf, TALKS_MOST, TalkStore } from './talks'

const dirs: string[] = []
function tempFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-talks-'))
  dirs.push(dir)
  return path.join(dir, 'talks.json')
}
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

const DAY = 24 * 60 * 60 * 1000
const START = Date.parse('2026-11-01T12:00:00Z')

const duck = (id: number, text: string): TalkTurn => ({ id, who: 'duck', text })
const me = (id: number, text: string, more: Partial<TalkTurn> = {}): TalkTurn => ({ id, who: 'me', text, ...more })

describe('TalkStore', () => {
  test('the talk going on survives a restart, a line still being checked kept as said', () => {
    const file = tempFile()
    const store = new TalkStore(file, () => START)
    store.keep('cafe', [duck(1, 'Hi, welcome in!'), me(2, 'A coffee, please.', { checking: true })])
    store.flush()
    const again = new TalkStore(file, () => START)
    expect(again.current()).toMatchObject({ topic: 'cafe', turns: [duck(1, 'Hi, welcome in!'), me(2, 'A coffee, please.')] })
    expect(again.current()?.turns[1]).not.toHaveProperty('checking')
  })

  test('New talk puts the talk away when the person said something, and drops one with the duck alone', () => {
    let now = START
    const store = new TalkStore(tempFile(), () => now)
    store.keep('cafe', [duck(1, 'Hi!')])
    store.archive()
    expect(store.list()).toEqual([])
    expect(store.current()).toBeUndefined()
    store.keep('day', [duck(1, 'How was your day?'), me(2, 'It was good.')])
    now += 60_000
    store.keep('day', [duck(1, 'How was your day?'), me(2, 'It was good.'), duck(3, 'Great!')])
    store.archive()
    expect(store.list()).toHaveLength(1)
    expect(store.list()[0]).toMatchObject({ topic: 'day', started: new Date(START).toISOString(), ended: new Date(now).toISOString() })
    expect(store.current()).toBeUndefined()
  })

  test('a talk of the past goes on, the one going on put away in its place', () => {
    const store = new TalkStore(tempFile(), () => START)
    store.keep('trip', [me(1, 'I went to Rome.')])
    store.archive()
    const id = store.list()[0]!.id
    store.keep('work', [me(1, 'I make websites.')])
    expect(store.continue(id)?.topic).toBe('trip')
    expect(store.current()?.id).toBe(id)
    expect(store.list().map(t => t.topic)).toEqual(['work'])
    expect(store.continue('nope')).toBeUndefined()
  })

  test('keeps 50 talks at most and none older than 30 days', () => {
    let now = START
    const file = tempFile()
    const store = new TalkStore(file, () => now)
    for (let i = 0; i < TALKS_MOST + 3; i++) {
      store.keep('free', [me(1, `line ${i}`)])
      store.archive()
      now += 1000
    }
    expect(store.list()).toHaveLength(TALKS_MOST)
    expect(store.list()[0]!.turns[0]!.text).toBe(`line ${TALKS_MOST + 2}`)
    now += (LOG_DAYS + 1) * DAY
    expect(new TalkStore(file, () => now).list()).toEqual([])
  })

  test('removes one, clears the past but not the talk going on, merges a backup by id', () => {
    const store = new TalkStore(tempFile(), () => START)
    store.keep('a', [me(1, 'one')])
    store.archive()
    store.keep('b', [me(1, 'two')])
    store.archive()
    const [b, a] = store.list()
    store.remove(a!.id)
    expect(store.list().map(t => t.topic)).toEqual(['b'])
    store.keep('c', [me(1, 'three')])
    store.clear()
    expect(store.list()).toEqual([])
    expect(store.current()?.topic).toBe('c')
    expect(store.merge([a, b, { id: 'bad' }])).toBe(2)
    expect(store.merge([a])).toBe(0)
  })

  test('a summary counts the lines and the ones marked, and names the first line of the person', () => {
    const t = { id: 'x', topic: 'cafe', started: '', ended: '', turns: [duck(1, 'Hi!'), me(2, 'I has a dog.', { parts: [{ kind: 'del', text: 'has' }] }), duck(3, 'Nice!'), me(4, 'Yes.')] } as const
    expect(summaryOf({ ...t, turns: [...t.turns] })).toMatchObject({ lines: 4, marked: 1, first: 'I has a dog.' })
  })
})
