import { describe, expect, it } from 'vitest'

import { HOLD_TAP_MS, HoldToTalk } from './holdtalk'

describe('hold the key to talk', () => {
  it('finishes the phrase when the key that started it is let go after holding', () => {
    const h = new HoldToTalk()
    h.pressed(1000, true)
    expect(h.released(1000 + HOLD_TAP_MS)).toBe(true)
  })

  it('keeps a quick tap a toggle: the phrase goes on until the next press', () => {
    const h = new HoldToTalk()
    h.pressed(1000, true)
    expect(h.released(1000 + HOLD_TAP_MS - 1)).toBe(false)
    // The second press stops it (the toggle); its release does nothing more.
    h.pressed(5000, false)
    expect(h.released(9000)).toBe(false)
  })

  it('answers one release per press', () => {
    const h = new HoldToTalk()
    h.pressed(0, true)
    expect(h.released(2000)).toBe(true)
    expect(h.released(3000)).toBe(false)
  })

  it('does nothing for a release with no press', () => {
    expect(new HoldToTalk().released(1000)).toBe(false)
  })
})
