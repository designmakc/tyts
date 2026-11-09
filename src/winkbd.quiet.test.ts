import { describe, expect, it, vi } from 'vitest'

vi.mock('./native', () => ({ loadLib: () => ({ func: () => () => 0 }) }))
vi.mock('koffi', () => ({ default: { struct: () => ({}), proto: () => ({}), pointer: () => ({}), sizeof: () => 0, register: () => ({}), array: () => ({}), out: () => ({}), inout: () => ({}) } }))

describe('quiet on the full screen', async () => {
  const { quietFor } = await import('./winkbd')
  const screen = { left: 0, top: 0, right: 1920, bottom: 1080 }
  it('a Direct3D game or presentation mode is quiet whatever is in front', () => {
    expect(quietFor(3, undefined, undefined, false)).toBe(true)
    expect(quietFor(4, undefined, undefined, false)).toBe(true)
  })
  it('"busy" is quiet only for a window in front that covers its whole monitor and is not maximized', () => {
    expect(quietFor(2, { x: 0, y: 0, width: 1920, height: 1080 }, screen, false)).toBe(true)
    // The owner's Claude window, maximized and frameless, a few pixels over the edges: typing in it is no game.
    expect(quietFor(2, { x: -8, y: -8, width: 1936, height: 1096 }, screen, true)).toBe(false)
    // A window on the work area, or a full-screen video on the other monitor while this one is in front.
    expect(quietFor(2, { x: 0, y: 0, width: 1920, height: 1040 }, screen, false)).toBe(false)
    expect(quietFor(0, { x: 0, y: 0, width: 1920, height: 1080 }, screen, false)).toBe(false)
  })
})
