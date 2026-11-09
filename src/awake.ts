// Keep the computer awake (2026-11-09, as Aissia's "Keep Mac awake"): an
// Electron power save blocker for 1, 4 or 8 hours or until turned off, with
// the screen let to turn off or kept on (settings awakeHours, awakeScreen).
// Lives only for this run: a restart starts with the computer let to sleep.

/** The durations offered, in hours; 0 is until turned off. */
export const AWAKE_HOURS = [1, 4, 8, 0] as const
export type AwakeHours = (typeof AWAKE_HOURS)[number]

/** When it ends, ms since the epoch; null: until turned off. */
export function awakeEnd(hours: number, now: number): number | null {
  return hours > 0 ? now + hours * 3_600_000 : null
}

/** Whole minutes left, rounded up (59:01 left says 60); null: no end. */
export function minutesLeft(end: number | null, now: number): number | null {
  return end === null ? null : Math.max(0, Math.ceil((end - now) / 60_000))
}

/** What Electron's powerSaveBlocker gives, so the class can be tested. */
export type Blocker = { start(type: 'prevent-app-suspension' | 'prevent-display-sleep'): number; stop(id: number): void }

/** How often the time left is told again (and the end is noticed). */
const TICK_MS = 60_000

export class Awake {
  private id: number | undefined
  private end: number | null = null
  private timer: ReturnType<typeof setInterval> | undefined

  constructor(
    private readonly blocker: Blocker,
    /** Told on every change and once a minute while it runs to an end. */
    private readonly changed: () => void,
    private readonly now: () => number = Date.now,
  ) {}

  get on(): boolean {
    return this.id !== undefined
  }

  /** Minutes left; null: until turned off (or off: see `on`). */
  left(): number | null {
    return this.on ? minutesLeft(this.end, this.now()) : null
  }

  /** Kept awake for `hours` (0: until turned off) from now; `screen`: the screen stays on too. */
  start(hours: number, screen: boolean): void {
    this.release()
    this.id = this.blocker.start(screen ? 'prevent-display-sleep' : 'prevent-app-suspension')
    this.end = awakeEnd(hours, this.now())
    // ponytail: one minute's tick ends it up to a minute late, which is fine for hours.
    if (this.end !== null) this.timer = setInterval(() => this.tick(), TICK_MS)
    this.changed()
  }

  stop(): void {
    if (!this.on) return
    this.release()
    this.changed()
  }

  private tick(): void {
    if (this.end !== null && this.now() >= this.end) return this.stop()
    this.changed()
  }

  private release(): void {
    if (this.id !== undefined) this.blocker.stop(this.id)
    clearInterval(this.timer)
    this.id = undefined
    this.timer = undefined
    this.end = null
  }
}
