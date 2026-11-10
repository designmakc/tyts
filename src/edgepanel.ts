// When the panel at the top of the screen shows and goes (main.ts asks every
// EDGE_TICK_MS while it is on): the pointer resting at the top edge of a
// screen, near its middle, for EDGE_DWELL_MS shows it there; once the pointer
// has been off the panel (and off that spot) for EDGE_LEAVE_MS it goes. Never
// over a program that fills the screen. Pure: tested in edgepanel.test.ts.

export type Rect = { x: number; y: number; width: number; height: number }
export type Point = { x: number; y: number }

export const EDGE_TICK_MS = 150
export const EDGE_DWELL_MS = 300
export const EDGE_LEAVE_MS = 400
/** The spot at the top edge, centred on the screen: as wide as the panel. */
export const EDGE_WIDTH = 480
/** How close to the very top the pointer must be, and how far off the panel it may stray. */
const EDGE_DEPTH = 2
const EDGE_SLACK = 16

/** The spot on a screen (its bounds) where the pointer shows the panel. */
export function hotSpot(screen: Rect): Rect {
  const width = Math.min(EDGE_WIDTH, screen.width)
  return { x: Math.round(screen.x + (screen.width - width) / 2), y: screen.y, width, height: EDGE_DEPTH }
}

const inside = (p: Point, r: Rect, slack = 0) => p.x >= r.x - slack && p.x < r.x + r.width + slack && p.y >= r.y - slack && p.y < r.y + r.height + slack

export type EdgeInput = {
  now: number
  point: Point
  /** The bounds of the screen the pointer is on. */
  screen: Rect
  /** A program fills that screen. */
  fullScreen: boolean
  /** The panel's bounds while it shows. */
  panel?: Rect
}

export class EdgeWatch {
  private since: number | undefined
  private away: number | undefined

  /** One look at the pointer: 'show' (on `screen`), 'hide', or nothing to do. */
  step(o: EdgeInput): 'show' | 'hide' | undefined {
    const atSpot = inside(o.point, hotSpot(o.screen))
    if (o.panel) {
      this.since = undefined
      if (atSpot || inside(o.point, o.panel, EDGE_SLACK)) {
        this.away = undefined
        return undefined
      }
      this.away ??= o.now
      if (o.now - this.away < EDGE_LEAVE_MS) return undefined
      this.away = undefined
      return 'hide'
    }
    this.away = undefined
    if (!atSpot || o.fullScreen) {
      this.since = undefined
      return undefined
    }
    this.since ??= o.now
    if (o.now - this.since < EDGE_DWELL_MS) return undefined
    this.since = undefined
    return 'show'
  }
}

/** Where the panel goes on a screen: centred, just under the top of its work area (under a Mac's menu bar). */
export function panelPlace(work: Rect, size: { width: number; height: number }): Rect {
  const width = Math.min(size.width, work.width)
  return { x: Math.round(work.x + (work.width - width) / 2), y: work.y, width, height: Math.min(size.height, work.height) }
}
