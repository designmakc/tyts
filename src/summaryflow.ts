// The small decisions around a call's summary that main (which makes it) and
// the page (which shows it) share: the model's input from a transcript, the
// time left, whether it is made by itself. No node modules: the page imports it.

import type { SummaryInput, SummaryLine } from './summary'

/** The person's notes a summary reads, at most: every part is that much shorter. */
export const NOTES_CHARS = 2000

/** The transcript as the engine stores it, the parts a summary reads. */
export interface SummarySource {
  title: string
  duration: number
  language?: string | null
  lost?: number
  speakers: Record<string, { name: string }>
  utterances: { speaker: string; start: number; text: string }[]
  /** The person's own notes on it (the calls window's Notes). */
  notes?: string
}

export function summaryInput(tr: SummarySource): SummaryInput {
  const lines: SummaryLine[] = tr.utterances
    .filter(u => u.text.trim())
    .map(u => ({ speaker: tr.speakers[u.speaker]?.name ?? u.speaker, start: u.start, text: u.text.trim() }))
  const notes = tr.notes?.trim().slice(0, NOTES_CHARS)
  return { title: tr.title, lines, duration: tr.duration, language: tr.language || null, ...(tr.lost ? { lost: tr.lost } : {}), ...(notes ? { notes } : {}) }
}

/** Seconds left from the parts done so far at their average pace; null until the first part is done, and while the parts are joined. */
export function secondsLeft(part: number, parts: number, started: number, now: number): number | null {
  if (part < 1 || part > parts) return null
  return Math.max(0, Math.round(((now - started) / 1000 / part) * (parts - part)))
}

/** A call's summary is made by itself when the person wants it and the model is here: nothing is downloaded for it. */
export const autoSummaryWanted = (auto: boolean, modelReady: boolean): boolean => auto && modelReady

/** "[12:34]" or "[1:02:03]" in a summary line: the topic's time, which the page makes a link. */
export const TOPIC_STAMP = /\[((?:\d+:)?\d{1,2}:\d{2})\]/

/** A summary line split around its first time: text before, the time as written, its seconds, text after; null when it has none. */
export function topicIn(line: string): { before: string; stamp: string; at: number; after: string } | null {
  const m = TOPIC_STAMP.exec(line)
  if (!m) return null
  const at = (m[1] as string).split(':').reduce((sum, n) => sum * 60 + Number(n), 0)
  return { before: line.slice(0, m.index), stamp: m[1] as string, at, after: line.slice(m.index + m[0].length) }
}

/** The word of a topic that links a screenshot, by the summary's language: "(screenshot 12:41)". */
export const SHOT_WORD = { en: 'screenshot', uk: 'знімок', ru: 'снимок' } as const

const SHOT_STAMP = new RegExp(`\\s*\\((?:${Object.values(SHOT_WORD).join('|')}) ((?:\\d+:)?\\d{1,2}:\\d{2})\\)`)

/** A summary line's screenshot: the text without it, the mark as written and its time; null when it has none. */
export function shotIn(line: string): { text: string; mark: string; at: number } | null {
  const m = SHOT_STAMP.exec(line)
  if (!m) return null
  const at = (m[1] as string).split(':').reduce((sum, n) => sum * 60 + Number(n), 0)
  return { text: line.slice(0, m.index) + line.slice(m.index + m[0].length), mark: m[0].trim(), at }
}
