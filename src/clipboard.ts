// Ctrl+C pressed twice in a row asks for a translation of what was copied.
// Windows announces every change of the clipboard; a program that puts
// several formats there one after another announces it several times within
// a few milliseconds, so changes closer than `MIN_GAP_MS` count as one copy.

const MIN_GAP_MS = 40
const MAX_GAP_MS = 650

export class DoubleCopy {
  private first = Number.NEGATIVE_INFINITY

  /** One clipboard change at `now`; `ctrl`: Ctrl is held. True on the second copy of a pair. */
  change(now: number, ctrl: boolean): boolean {
    if (!ctrl) {
      this.first = Number.NEGATIVE_INFINITY
      return false
    }
    const gap = now - this.first
    if (gap < MIN_GAP_MS) return false
    if (gap <= MAX_GAP_MS) {
      this.first = Number.NEGATIVE_INFINITY
      return true
    }
    this.first = now
    return false
  }
}
