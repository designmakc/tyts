// Holding a dictation key to talk (`dictateHold`): the press starts a phrase,
// the release finishes it. A quick tap stays the old toggle (the phrase goes on
// until the next press), so a key pressed as before still works. The release
// comes from the keyboard thread (typist.ts `hotkeyUp`), which sees keys go up.

/** Held this long or more, the release finishes the phrase; a shorter press is a tap. */
export const HOLD_TAP_MS = 300

export class HoldToTalk {
  /** When the key that started the phrase went down; undefined when the last press did not start one. */
  private startedAt: number | undefined

  /** A dictation key went down; `starting`: it started a phrase (the next press of a toggle stops it instead). */
  pressed(at: number, starting: boolean): void {
    this.startedAt = starting ? at : undefined
  }

  /** The key went up: true when the phrase it started is to finish now. */
  released(at: number): boolean {
    const started = this.startedAt
    this.startedAt = undefined
    return started !== undefined && at - started >= HOLD_TAP_MS
  }
}
