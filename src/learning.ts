// What Tyts learned from the person's typing (the keyboard thread reports
// it, typist.ts), kept in learning.json in the app's folder, on this computer
// only:
//   fixedOnce  words fixed by hand once (the fix key, or erased and typed
//              again in another layout), as typed, and the language they went
//              into; fixed by hand again, they move to
//   alwaysFix  words fixed by themselves from then on;
//   myWords    words of the person's, in no list, typed right three times:
//              never fixed, and fixed into ("Лкнфлд" → "Tyts");
//   tally      the words on their way there, by a fingerprint only (a salted
//              hash), never the word: how often, and the day last seen; one
//              unseen for 30 days is forgotten.
// A word stands in one list at a time; Kept as typed (settings' keepWords)
// is the other side: a word kept is fixed no more, a word fixed by hand
// again is kept no more.

import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

import type { Learned } from './typist'

export const ONCE_MOST = 200
export const TALLY_MOST = 2000
export const TALLY_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

type Data = { salt: string; fixedOnce: Learned[]; alwaysFix: Learned[]; myWords: Learned[]; tally: Record<string, [number, number]> }

/** The three lists of words, as a backup carries them. */
export type LearnedLists = { fixedOnce: Learned[]; alwaysFix: Learned[]; myWords: Learned[] }

/** What the keyboard thread is given of it. */
export type LearnedConfig = { alwaysFix: Learned[]; myWords: Learned[]; tally: Record<string, number>; salt: string }

export class LearnStore {
  private data: Data
  private timer: NodeJS.Timeout | undefined

  constructor(
    private readonly file: string,
    private readonly now: () => number = Date.now,
  ) {
    let raw: Partial<Data> = {}
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Data>
    } catch {
      raw = {}
    }
    this.data = {
      salt: typeof raw.salt === 'string' && raw.salt ? raw.salt : randomBytes(16).toString('hex'),
      fixedOnce: learnedList(raw.fixedOnce),
      alwaysFix: learnedList(raw.alwaysFix),
      myWords: learnedList(raw.myWords),
      tally: tallyOf(raw.tally),
    }
    if (this.prune() || !raw.salt) this.save()
  }

  get alwaysFix(): readonly Learned[] {
    return this.data.alwaysFix
  }

  get myWords(): readonly Learned[] {
    return this.data.myWords
  }

  forThread(): LearnedConfig {
    return {
      alwaysFix: this.data.alwaysFix,
      myWords: this.data.myWords,
      tally: Object.fromEntries(Object.entries(this.data.tally).map(([hash, [count]]) => [hash, count])),
      salt: this.data.salt,
    }
  }

  /** A word fixed by hand: noted the first time; the second, it is fixed always. True when the lists the thread uses changed. */
  fixedByHand(learned: Learned): boolean {
    const same = (l: Learned) => l.word === learned.word && l.lang === learned.lang
    if (this.data.alwaysFix.some(same)) return false
    if (this.data.fixedOnce.some(same)) {
      this.data.fixedOnce = this.data.fixedOnce.filter(l => !same(l))
      this.data.alwaysFix = [learned, ...this.data.alwaysFix.filter(l => l.word !== learned.word)]
      this.save()
      return true
    }
    this.data.fixedOnce = [learned, ...this.data.fixedOnce].slice(0, ONCE_MOST)
    this.saveSoon()
    return false
  }

  /** A word of the person's typed right again, by its fingerprint; with the word when it is learned. True when the lists the thread uses changed. */
  tally(hash: string, count: number, word?: Learned): boolean {
    if (word) {
      delete this.data.tally[hash]
      if (!this.data.myWords.some(l => l.word === word.word && l.lang === word.lang)) this.data.myWords = [word, ...this.data.myWords]
      this.data.alwaysFix = this.data.alwaysFix.filter(l => l.word !== word.word)
      this.save()
      return true
    }
    this.data.tally[hash] = [count, Math.floor(this.now() / DAY_MS)]
    this.saveSoon()
    return false
  }

  /** A word kept as typed is fixed no more. True when the lists the thread uses changed. */
  kept(word: string): boolean {
    return this.unlearn(word)
  }

  /** A learned fix found wrong is forgotten, noted once or always. True when something went. */
  unlearn(word: string): boolean {
    const before = this.data.alwaysFix.length + this.data.fixedOnce.length
    this.data.alwaysFix = this.data.alwaysFix.filter(l => l.word !== word)
    this.data.fixedOnce = this.data.fixedOnce.filter(l => l.word !== word)
    if (this.data.alwaysFix.length + this.data.fixedOnce.length === before) return false
    this.save()
    return true
  }

  remove(list: 'alwaysFix' | 'myWords', word: string): void {
    this.data[list] = this.data[list].filter(l => l.word !== word)
    this.save()
  }

  /** The learned words, for a backup; the fingerprints stay (salted here, words on their way). */
  lists(): LearnedLists {
    return { fixedOnce: [...this.data.fixedOnce], alwaysFix: [...this.data.alwaysFix], myWords: [...this.data.myWords] }
  }

  /** Learned words from a backup: a word in none of the lists here is added to its list; how many came (the keyboard thread learns of them with the next applyKeyboard). */
  merge(lists: Partial<Record<keyof LearnedLists, unknown>>): number {
    const known = new Set([...this.data.fixedOnce, ...this.data.alwaysFix, ...this.data.myWords].map(l => l.word))
    let added = 0
    for (const list of ['myWords', 'alwaysFix', 'fixedOnce'] as const) {
      for (const l of learnedList(lists[list])) {
        if (known.has(l.word)) continue
        known.add(l.word)
        this.data[list] = [...this.data[list], l]
        added++
      }
    }
    if (added === 0) return 0
    this.data.fixedOnce = this.data.fixedOnce.slice(0, ONCE_MOST)
    this.save()
    return added
  }

  /** Everything learned goes, the fingerprints too. */
  forget(): void {
    this.data = { salt: randomBytes(16).toString('hex'), fixedOnce: [], alwaysFix: [], myWords: [], tally: {} }
    this.save()
  }

  /** Fingerprints unseen for too long, and the oldest past the cap, go; true when something went. */
  prune(): boolean {
    const today = Math.floor(this.now() / DAY_MS)
    const entries = Object.entries(this.data.tally)
    const kept = entries
      .filter(([, [, day]]) => today - day <= TALLY_DAYS)
      .sort((a, b) => b[1][1] - a[1][1])
      .slice(0, TALLY_MOST)
    if (kept.length === entries.length) return false
    this.data.tally = Object.fromEntries(kept)
    return true
  }

  /** Written at once (no later than the next start would read it). */
  flush(): void {
    if (this.timer) this.save()
  }

  /** Tallies come often while one types: written once they settle. */
  private saveSoon(): void {
    if (this.timer) return
    this.timer = setTimeout(() => this.save(), 5000)
  }

  private save(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    this.prune()
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2) + '\n', 'utf8')
    } catch (error) {
      console.warn('Tyts: could not save what it learned', error)
    }
  }
}

function learnedList(raw: unknown): Learned[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((l): l is Learned => !!l && typeof l.word === 'string' && typeof l.lang === 'string' && !!l.word && !!l.lang)
}

function tallyOf(raw: unknown): Record<string, [number, number]> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, [number, number]> = {}
  for (const [hash, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') out[hash] = [value[0], value[1]]
  }
  return out
}
