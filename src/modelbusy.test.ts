import { describe, expect, test } from 'vitest'

import { BUSY_MS, busyName, slowAfter, SLOW_MIN_S, tryAgain, type ModelBusy } from './modelbusy'

describe('the local model too slow just now', () => {
  test('a sentence may take five times its usual time here, never less than four seconds; nothing before three are timed', () => {
    expect(slowAfter([], 3)).toBeUndefined()
    expect(slowAfter([0.7, 0.8], 3)).toBeUndefined()
    // Accurate on the RTX 2080 SUPER: 0.7 s a sentence, so four seconds.
    expect(slowAfter([0.7, 0.71, 0.9], 3)).toBe(SLOW_MIN_S)
    // Most accurate partly on that card, 6 s a sentence: half a minute.
    expect(slowAfter([5.8, 6, 6.4, 9], 3)).toBe(31)
  })

  test('tried again once its time is out, on a card only when its free memory holds the model', () => {
    const busy: ModelBusy = { model: 'accurate', where: 'card', until: 1000 }
    expect(tryAgain(busy, 999, undefined, undefined)).toBe(false)
    expect(tryAgain(busy, 1000, undefined, undefined)).toBe(true)
    // An emulator still holds the card: 1.2 GB free, the model takes 3.4 GB.
    expect(tryAgain(busy, 1000, 1200, 3400)).toBe(false)
    expect(tryAgain(busy, 1000, 5000, 3400)).toBe(true)
    // The processor busy: no memory to look at.
    expect(tryAgain({ ...busy, where: 'processor' }, 1000, 0, 3400)).toBe(true)
    expect(BUSY_MS).toBe(120_000)
  })

  test('the part kept busy, in words', () => {
    expect(busyName('card')).toBe('graphics card')
    expect(busyName('processor')).toBe('processor')
  })
})
