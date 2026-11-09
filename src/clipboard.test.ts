import { describe, expect, test } from 'vitest'

import { DoubleCopy } from './clipboard'

describe('DoubleCopy', () => {
  test('a second Ctrl+C soon after the first asks; a third starts over', () => {
    const d = new DoubleCopy()
    expect(d.change(1000, true)).toBe(false)
    expect(d.change(1300, true)).toBe(true)
    expect(d.change(1500, true)).toBe(false)
  })

  test('formats announced a few ms apart are one copy', () => {
    const d = new DoubleCopy()
    expect(d.change(1000, true)).toBe(false)
    expect(d.change(1005, true)).toBe(false)
    expect(d.change(1010, true)).toBe(false)
    expect(d.change(1400, true)).toBe(true)
  })

  test('too slow, or a change without Ctrl (a menu, another program), is no pair', () => {
    const d = new DoubleCopy()
    d.change(1000, true)
    expect(d.change(2000, true)).toBe(false)
    expect(d.change(2200, false)).toBe(false)
    expect(d.change(2400, true)).toBe(false)
  })
})
