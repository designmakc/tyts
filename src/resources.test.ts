import { describe, expect, test } from 'vitest'

import { CARD_HEADROOM_MB, cardRoom, sharedReading } from './resources'

describe('Kryakl, a guest on the graphics card', () => {
  test('a model goes on the card whole, with room left for the programs around it', () => {
    // Accurate holds 3080 MB of the RTX 2080 SUPER; an emulator left 2.5 GB free.
    expect(cardRoom(2500, 3080)).toBe(false)
    expect(cardRoom(3080, 3080)).toBe(false)
    expect(cardRoom(3080 + CARD_HEADROOM_MB, 3080)).toBe(true)
    // The card free: 6.5 GB.
    expect(cardRoom(6500, 3080)).toBe(true)
  })

  test('one reading shared while fresh, a reading under way never started twice', async () => {
    let clock = 0
    let reads = 0
    let free = 4000
    const read = sharedReading(
      async () => {
        reads++
        return free
      },
      5000,
      () => clock,
    )
    const [a, b] = await Promise.all([read(), read()])
    expect([a, b, reads]).toEqual([4000, 4000, 1])
    free = 1000
    clock = 4999
    expect(await read()).toBe(4000)
    clock = 5000
    expect(await read()).toBe(1000)
    expect(reads).toBe(2)
  })
})
