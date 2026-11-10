// A call left recording after everybody has gone: when neither the microphone nor the computer's
// sound was heard for ten minutes the panel asks, counts a minute down and stops the recording,
// which is saved and transcribed as any other. A sound, or "Keep recording", moves `lastHeard`
// and the question goes away by itself; a pause is the person's own and is not counted.

/** Nobody heard for this long: the panel asks. */
export const QUIET_MS = 10 * 60_000
/** The question waits this long for an answer, then the recording stops. */
export const ANSWER_MS = 60_000

export type Quiet = 'fine' | { left: number } | 'stop'

/** What a recording does `now`, its last sound heard at `lastHeard` (both ms): nothing, ask with `left` seconds to go, or stop. */
export function quiet(lastHeard: number, now: number): Quiet {
  const over = now - lastHeard - QUIET_MS
  if (over < 0) return 'fine'
  if (over >= ANSWER_MS) return 'stop'
  return { left: Math.ceil((ANSWER_MS - over) / 1000) }
}
