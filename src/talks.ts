// The talks with the duck (Talk, talk.ts), kept in talks.json in the app's
// folder: the one going on, so it survives Kryakl quitting, and the ones New
// talk ended, newest first, for Library › Talks, where one is read again,
// continued or removed. Kept small by themselves as the other logs are
// (dictationlog.ts): 50 talks at most and none older than 30 days. A talk the
// person said nothing in (the duck's first line alone) is not kept.

import { randomUUID } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { LOG_DAYS } from './dictationlog'
import type { TalkTurn } from './talk'

export type TalkRecord = {
  id: string
  /** The topic it started on (topics.ts). */
  topic: string
  /** ISO date and time of its first line, and of its last. */
  started: string
  ended: string
  turns: TalkTurn[]
}

/** A talk in a list: when, on what, how long, how many lines had a mistake, and its first line of the person's. */
export type TalkSummary = { id: string; topic: string; started: string; ended: string; lines: number; marked: number; first: string }

export const TALKS_MOST = 50
/** How long a change waits before it is written: a turn changes the talk two or three times in a few seconds. */
const SAVE_MS = 500
const DAY_MS = 24 * 60 * 60 * 1000

type Saved = { current?: TalkRecord; past: TalkRecord[] }

export class TalkStore {
  private ongoing: TalkRecord | undefined
  private past: TalkRecord[] = []
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(
    private readonly file: string,
    private readonly now: () => number = Date.now,
  ) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Saved> | null
      this.ongoing = isRecord(raw?.current) ? clean(raw.current) : undefined
      this.past = Array.isArray(raw?.past) ? raw.past.filter(isRecord).map(clean) : []
    } catch {
      this.past = []
    }
    this.past.sort(newestFirst)
    if (this.prune()) this.write()
  }

  /** The talk going on, if any. */
  current(): TalkRecord | undefined {
    return this.ongoing
  }

  /** The talks ended, newest first. */
  list(): TalkRecord[] {
    return this.past
  }

  get(id: string): TalkRecord | undefined {
    return this.past.find(t => t.id === id) ?? (this.ongoing?.id === id ? this.ongoing : undefined)
  }

  /** The talk going on as it stands now: written a moment later. No turns: none goes on. */
  keep(topic: string, turns: readonly TalkTurn[]): void {
    if (turns.length === 0) this.ongoing = undefined
    else {
      const at = new Date(this.now()).toISOString()
      this.ongoing = { id: this.ongoing?.id ?? randomUUID(), topic, started: this.ongoing?.started ?? at, ended: at, turns: turns.map(settled) }
    }
    this.later()
  }

  /** New talk: the one going on goes into the past, when the person said anything in it. */
  archive(): void {
    const ended = this.ongoing
    this.ongoing = undefined
    if (ended && ended.turns.some(t => t.who === 'me')) {
      this.past = [ended, ...this.past.filter(t => t.id !== ended.id)]
      this.prune()
    }
    this.write()
  }

  /** A talk of the past goes on: the one going on now is put away first. */
  continue(id: string): TalkRecord | undefined {
    const going = this.past.find(t => t.id === id)
    if (!going) return undefined
    this.archive()
    this.past = this.past.filter(t => t.id !== id)
    this.ongoing = going
    this.write()
    return going
  }

  remove(id: string): void {
    const n = this.past.length
    this.past = this.past.filter(t => t.id !== id)
    if (this.past.length !== n) this.write()
  }

  /** Every talk of the past forgotten; the one going on stays. */
  clear(): void {
    if (this.past.length === 0) return
    this.past = []
    this.write()
  }

  /** Talks from a backup: one not here is added, past the cap and the age dropped as always; how many stayed. */
  merge(list: readonly unknown[]): number {
    const here = new Set([...this.past.map(t => t.id), this.ongoing?.id])
    const added = list.filter(isRecord).map(clean).filter(t => !here.has(t.id))
    if (added.length === 0) return 0
    this.past = [...this.past, ...added].sort(newestFirst)
    this.prune()
    this.write()
    return added.filter(t => this.past.includes(t)).length
  }

  /** What is waiting to be written, written now (Kryakl quits). */
  flush(): void {
    if (this.timer) this.write()
  }

  /** Drops what is past the cap or the age; true when something went. */
  private prune(): boolean {
    const n = this.past.length
    const oldest = this.now() - LOG_DAYS * DAY_MS
    this.past = this.past.filter(t => Date.parse(t.ended) >= oldest).slice(0, TALKS_MOST)
    return this.past.length !== n
  }

  private later(): void {
    if (this.timer) return
    this.timer = setTimeout(() => this.write(), SAVE_MS)
  }

  private write(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      const saved: Saved = { ...(this.ongoing ? { current: this.ongoing } : {}), past: this.past }
      fs.writeFileSync(this.file, JSON.stringify(saved) + '\n', 'utf8')
    } catch (error) {
      console.warn('Tyts: could not save the talks', error)
    }
  }
}

/** A talk in a list (Library › Talks). */
export function summaryOf(t: TalkRecord): TalkSummary {
  const mine = t.turns.filter(turn => turn.who === 'me')
  return { id: t.id, topic: t.topic, started: t.started, ended: t.ended, lines: t.turns.length, marked: mine.filter(turn => turn.parts?.length).length, first: mine[0]?.text ?? '' }
}

const newestFirst = (a: TalkRecord, b: TalkRecord) => Date.parse(b.ended) - Date.parse(a.ended)

/** A turn as kept: a line still being checked when Kryakl quit is kept as said. */
function settled(turn: TalkTurn): TalkTurn {
  const { checking: _checking, ...kept } = turn
  return kept
}

function clean(t: TalkRecord): TalkRecord {
  return { id: t.id, topic: t.topic, started: t.started, ended: t.ended, turns: t.turns.filter(isTurn).map(settled) }
}

function isRecord(t: unknown): t is TalkRecord {
  const r = t as Partial<TalkRecord> | null
  return (
    !!r &&
    typeof r.id === 'string' &&
    !!r.id &&
    typeof r.topic === 'string' &&
    typeof r.started === 'string' &&
    typeof r.ended === 'string' &&
    Number.isFinite(Date.parse(r.ended)) &&
    Array.isArray(r.turns)
  )
}

function isTurn(t: unknown): t is TalkTurn {
  const r = t as Partial<TalkTurn> | null
  return !!r && typeof r.id === 'number' && (r.who === 'me' || r.who === 'duck') && typeof r.text === 'string'
}
