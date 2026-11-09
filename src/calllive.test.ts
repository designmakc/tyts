import { describe, expect, it } from 'vitest'

import { liveAnswer, liveRows } from './calllive'

describe('the draft of a call', () => {
  it('takes only well-formed lines and known states', () => {
    expect(liveAnswer(null)).toEqual({ state: 'off', lines: [] })
    expect(liveAnswer({ state: 'weird', lines: 'x' })).toEqual({ state: 'off', lines: [] })
    const a = liveAnswer({ state: 'missing', lines: [{ who: 'me', at: 1, text: 'hi' }, { who: 'x', at: 1, text: 'no' }, { who: 'others', at: 2 }, { who: 'others', at: 3, gap: true }] })
    expect(a.state).toBe('missing')
    expect(a.lines).toEqual([{ who: 'me', at: 1, text: 'hi' }, { who: 'others', at: 3, gap: true }])
  })

  it('joins one speaker’s lines and keeps the last rows', () => {
    const lines = [
      { who: 'me', at: 0, text: 'Hello' },
      { who: 'me', at: 3, text: 'there' },
      { who: 'others', at: 4, text: 'Hi' },
      { who: 'others', at: 9, gap: true },
      { who: 'others', at: 70, text: 'again' },
    ] as const
    const rows = liveRows([...lines])
    expect(rows).toEqual([
      { who: 'me', at: 0, text: 'Hello there', gap: false },
      { who: 'others', at: 4, text: 'Hi', gap: false },
      { who: 'others', at: 9, text: '', gap: true },
      { who: 'others', at: 70, text: 'again', gap: false },
    ])
    expect(liveRows([...lines], 2).map(r => r.at)).toEqual([9, 70])
  })
})
