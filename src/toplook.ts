// The look at the top of the screen (settings.edgeStyle: plain, glow, drop): what
// shows there, over every program and under no pointer, while dictation listens
// (the glow or the drop) and while a call records (the draft's last lines, with
// settings.callLive and callLiveTop). main.ts keeps the window (media/top.html,
// webview/top.ts); the panel at the top (edge.html) comes in the same style.
// Pure: tested in toplook.test.ts.

import type { LiveRow } from './calllive'
import type { EdgeStyle } from './settings'

export type TopMode = 'dictate' | 'call'
export type TopRow = { who: 'me' | 'others'; text: string }

/** How often the call's draft is asked for while its lines show at the top. */
export const TOP_LIVE_MS = 2000
export const TOP_SIZE = { width: 560, height: 220 }
/** The most lines of a call at the top, and the most letters of one (its end is kept: the newest words). */
const TOP_ROWS = 3
const TOP_LETTERS = 180

export type TopInput = {
  style: EdgeStyle
  /** Dictation is listening now. */
  dictating: boolean
  /** A call records now, its draft read (`callLive`) and wanted at the top (`callLiveTop`). */
  callLines: boolean
  paused: boolean
  /** A program fills the screen, and Tyts keeps quiet then (`quietFullScreen`). */
  quiet: boolean
}

/** What the top of the screen shows now, if anything: dictation's look before a call's lines (it is short). */
export function topMode(o: TopInput): TopMode | undefined {
  if (o.paused || o.quiet) return undefined
  if (o.dictating && o.style !== 'plain') return 'dictate'
  return o.callLines ? 'call' : undefined
}

/** The draft's last lines as the top shows them: no gaps, the newest words of a long line. */
export function topRows(rows: LiveRow[]): TopRow[] {
  return rows
    .filter(r => !r.gap && r.text.trim())
    .slice(-TOP_ROWS)
    .map(r => {
      const text = r.text.trim()
      return { who: r.who, text: text.length > TOP_LETTERS ? `…${text.slice(text.indexOf(' ', text.length - TOP_LETTERS) + 1 || -TOP_LETTERS)}` : text }
    })
}
