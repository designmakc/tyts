import { describe, expect, it } from 'vitest'

import { EDGE_DWELL_MS, EDGE_LEAVE_MS, EdgeWatch, hotSpot, panelPlace, type Rect } from './edgepanel'

const main: Rect = { x: 0, y: 0, width: 1440, height: 900 }
const second: Rect = { x: 1440, y: -200, width: 1920, height: 1080 }
const mid = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y })

describe('the panel at the top of the screen', () => {
  it('shows once the pointer rests at the top middle, not before', () => {
    const w = new EdgeWatch()
    expect(w.step({ now: 0, point: mid(main), screen: main, fullScreen: false })).toBeUndefined()
    expect(w.step({ now: EDGE_DWELL_MS - 1, point: mid(main), screen: main, fullScreen: false })).toBeUndefined()
    expect(w.step({ now: EDGE_DWELL_MS, point: mid(main), screen: main, fullScreen: false })).toBe('show')
  })

  it('a pointer passing by, at a corner or lower down shows nothing', () => {
    const w = new EdgeWatch()
    w.step({ now: 0, point: mid(main), screen: main, fullScreen: false })
    w.step({ now: 100, point: { x: 720, y: 30 }, screen: main, fullScreen: false })
    expect(w.step({ now: 400, point: mid(main), screen: main, fullScreen: false })).toBeUndefined()
    for (const point of [{ x: 5, y: 0 }, { x: 1430, y: 0 }, { x: 720, y: 5 }]) {
      const corner = new EdgeWatch()
      corner.step({ now: 0, point, screen: main, fullScreen: false })
      expect(corner.step({ now: 1000, point, screen: main, fullScreen: false })).toBeUndefined()
    }
  })

  it('never over a program that fills the screen', () => {
    const w = new EdgeWatch()
    w.step({ now: 0, point: mid(main), screen: main, fullScreen: true })
    expect(w.step({ now: 1000, point: mid(main), screen: main, fullScreen: true })).toBeUndefined()
  })

  it('on a second screen above the first, at its own top', () => {
    const w = new EdgeWatch()
    w.step({ now: 0, point: mid(second), screen: second, fullScreen: false })
    expect(w.step({ now: EDGE_DWELL_MS, point: mid(second), screen: second, fullScreen: false })).toBe('show')
    expect(hotSpot(second)).toEqual({ x: 2160, y: -200, width: 480, height: 2 })
  })

  it('stays while the pointer is on it or back at the spot, and goes once it has been away a moment', () => {
    const w = new EdgeWatch()
    const panel = panelPlace({ ...main, y: 25, height: 875 }, { width: 480, height: 160 })
    expect(panel).toEqual({ x: 480, y: 25, width: 480, height: 160 })
    const on = { x: 700, y: 120 }
    const off = { x: 700, y: 400 }
    expect(w.step({ now: 0, point: on, screen: main, fullScreen: false, panel })).toBeUndefined()
    expect(w.step({ now: 100, point: off, screen: main, fullScreen: false, panel })).toBeUndefined()
    // Back on it in time: it stays, and the time away starts again.
    expect(w.step({ now: 300, point: on, screen: main, fullScreen: false, panel })).toBeUndefined()
    expect(w.step({ now: 400, point: off, screen: main, fullScreen: false, panel })).toBeUndefined()
    expect(w.step({ now: 400 + EDGE_LEAVE_MS, point: off, screen: main, fullScreen: false, panel })).toBe('hide')
  })
})
