// One talk with the duck, held by the main process while Kryakl runs (the page
// only draws it). The person's line is checked (Check my English: its mistakes
// marked in place, a note in their own language) and answered by the duck
// (duck.ts) at once, both on the same model, so the marks come in about a
// second and the answer in about three. The answer keeps to what was said,
// mistakes and all. A new line while the duck still thinks takes its place:
// the answer under way is dropped, the check is not. talks.ts keeps it on
// disk, so it goes on after Kryakl starts again; New talk puts it away there.

import type { CheckOutcome } from './checker'
import type { Said } from './duck'
import { opener as openerOf } from './topics'
import { wordDiff, type DiffPart } from './worddiff'

/** The turns kept in one talk; the duck sees only the latest anyway. */
const KEPT = 200

/**
 * A line of the talk: the person's (`me`) as they said it, then, once
 * checked, `corrected` and the marks (`parts`, worddiff.ts) and the `note`
 * on its main mistake, none when it was right; the duck's as it said it.
 */
export type TalkTurn = { id: number; who: 'me' | 'duck'; text: string; checking?: boolean; corrected?: string; parts?: DiffPart[]; note?: string }

/** Idle (the person's turn), the duck thinking of an answer, or its answer failed (`message`). */
export type TalkStatus = 'idle' | 'thinking' | 'failed'

export type TalkState = { turns: TalkTurn[]; status: TalkStatus; topic: string; message?: string }

export type TalkOptions = {
  check: (text: string) => Promise<CheckOutcome>
  reply: (turns: readonly Said[], topic: string, signal: AbortSignal) => Promise<string>
  /** A line with a mistake, for Library › Mistakes. */
  mistake?: (text: string, corrected: string, note: string) => void
  onChange: () => void
  log?: (line: string) => void
  /** The duck's first line on a topic (duck.ts opener). */
  opener?: (topic: string) => string
}

export class Talk {
  private turns: TalkTurn[] = []
  private status: TalkStatus = 'idle'
  private topic = 'free'
  private message: string | undefined
  private next = 1
  private answering: AbortController | undefined

  constructor(private readonly o: TalkOptions) {}

  state(): TalkState {
    return { turns: this.turns, status: this.status, topic: this.topic, ...(this.message ? { message: this.message } : {}) }
  }

  /** The talk kept from before (talks.ts): it goes on where it was. */
  restore(kept: { topic: string; turns: readonly TalkTurn[] }): void {
    this.drop()
    this.turns = kept.turns.map(({ checking: _checking, ...t }) => t).slice(-KEPT)
    this.topic = kept.topic
    this.next = Math.max(0, ...this.turns.map(t => t.id)) + 1
    this.o.onChange()
  }

  /** A new talk on a topic: the duck says its first line. */
  start(topic: string): void {
    this.drop()
    this.turns = []
    this.topic = topic
    this.add({ who: 'duck', text: (this.o.opener ?? openerOf)(topic) })
    this.o.onChange()
  }

  /** The person said (or typed) a line: checked and answered at once. */
  say(said: string): void {
    const text = said.replace(/\s+/g, ' ').trim()
    if (!text) return
    this.drop()
    const turn = this.add({ who: 'me', text, checking: true })
    this.status = 'thinking'
    this.message = undefined
    this.o.onChange()
    this.o
      .check(text)
      .then(out => {
        const corrected = out.corrected.replace(/\s+/g, ' ').trim()
        if (corrected && corrected !== text) {
          Object.assign(turn, { corrected, parts: wordDiff(text, corrected), note: out.note })
          this.o.mistake?.(text, corrected, out.note)
        }
      })
      // Unchecked, the line stays as said, without marks; the answer still comes.
      .catch(error => this.o.log?.(`talk: the line was not checked: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => {
        turn.checking = false
        this.o.onChange()
      })
    const answering = new AbortController()
    this.answering = answering
    const history: Said[] = this.turns.map(t => ({ who: t.who, text: t.text }))
    this.o
      .reply(history, this.topic, answering.signal)
      .then(answer => {
        if (this.answering !== answering) return
        this.add({ who: 'duck', text: answer })
        this.status = 'idle'
      })
      .catch(error => {
        if (this.answering !== answering) return
        this.status = 'failed'
        this.message = error instanceof Error ? error.message : String(error)
      })
      .finally(() => {
        if (this.answering !== answering) return
        this.answering = undefined
        this.o.onChange()
      })
  }

  /** The person's turn again: the answer under way, if any, is dropped (the key pressed while the duck thinks). */
  interrupt(): void {
    if (!this.answering && this.status === 'idle') return
    this.drop()
    this.o.onChange()
  }

  /** New talk: nothing said yet. */
  clear(): void {
    this.drop()
    this.turns = []
    this.topic = 'free'
    this.o.onChange()
  }

  private drop(): void {
    this.answering?.abort()
    this.answering = undefined
    this.status = 'idle'
    this.message = undefined
  }

  private add(turn: Omit<TalkTurn, 'id'>): TalkTurn {
    const added = { id: this.next++, ...turn }
    this.turns = [...this.turns, added].slice(-KEPT)
    return added
  }
}
