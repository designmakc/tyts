// A call's words while it records (engine/live.py, GET /recordings/{id}/live): the
// draft's lines as the call panel shows them. Pure, shared by the panel and its test.

export type LiveState = 'off' | 'listening' | 'paused' | 'missing' | 'card' | 'failed' | 'done'

export type LiveLine = { who: 'me' | 'others'; at: number; text?: string; gap?: boolean }

export type LiveRow = { who: 'me' | 'others'; at: number; text: string; gap: boolean }

/** The engine's answer as the panel takes it: anything odd is no line, an unknown state is 'off'. */
export function liveAnswer(raw: unknown): { state: LiveState; lines: LiveLine[] } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as { state?: unknown; lines?: unknown }
  const states: LiveState[] = ['off', 'listening', 'paused', 'missing', 'card', 'failed', 'done']
  const state = states.includes(r.state as LiveState) ? (r.state as LiveState) : 'off'
  const lines = Array.isArray(r.lines)
    ? r.lines.filter((l): l is LiveLine => !!l && (l.who === 'me' || l.who === 'others') && typeof l.at === 'number' && (l.gap === true || typeof l.text === 'string'))
    : []
  return { state, lines }
}

/** Lines of one speaker in a row joined into one, a gap as its own row; the last `keep` rows. */
export function liveRows(lines: LiveLine[], keep = 12): LiveRow[] {
  const rows: LiveRow[] = []
  for (const l of lines) {
    const last = rows[rows.length - 1]
    if (!l.gap && last && !last.gap && last.who === l.who) last.text += ` ${l.text}`
    else rows.push({ who: l.who, at: l.at, text: l.gap ? '' : (l.text ?? ''), gap: !!l.gap })
  }
  return rows.slice(-keep)
}
