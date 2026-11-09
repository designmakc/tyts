import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Awake, awakeEnd, minutesLeft } from './awake'

describe('keep the computer awake', () => {
  test('ends after the hours chosen, or never', () => {
    expect(awakeEnd(4, 1000)).toBe(1000 + 4 * 3_600_000)
    expect(awakeEnd(0, 1000)).toBeNull()
    expect(minutesLeft(null, 5)).toBeNull()
    expect(minutesLeft(60 * 60_000, 59_000)).toBe(60)
    expect(minutesLeft(60_000, 120_000)).toBe(0)
  })

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('holds the blocker the screen asks for, lets it go at the end and says so', () => {
    const blocker = { start: vi.fn(() => 7), stop: vi.fn() }
    const changed = vi.fn()
    const awake = new Awake(blocker, changed)
    awake.start(1, false)
    expect(blocker.start).toHaveBeenCalledWith('prevent-app-suspension')
    expect(awake.left()).toBe(60)
    vi.advanceTimersByTime(30 * 60_000)
    expect(awake.left()).toBe(30)
    vi.advanceTimersByTime(30 * 60_000)
    expect(awake.on).toBe(false)
    expect(blocker.stop).toHaveBeenCalledWith(7)
    expect(changed).toHaveBeenCalled()
  })

  test('until turned off: no end; started again, the old blocker goes', () => {
    let n = 0
    const blocker = { start: vi.fn(() => ++n), stop: vi.fn() }
    const awake = new Awake(blocker, () => undefined)
    awake.start(0, true)
    expect(blocker.start).toHaveBeenCalledWith('prevent-display-sleep')
    vi.advanceTimersByTime(100 * 3_600_000)
    expect(awake.on).toBe(true)
    expect(awake.left()).toBeNull()
    awake.start(8, false)
    expect(blocker.stop).toHaveBeenCalledWith(1)
    awake.stop()
    expect(blocker.stop).toHaveBeenCalledWith(2)
    expect(awake.on).toBe(false)
  })
})
