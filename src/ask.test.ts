import { describe, expect, it } from 'vitest'
import { cited, passagesText } from './ask'

describe('a question to the calls', () => {
  it('numbers the passages and reads the citations back', () => {
    const text = passagesText([{ id: 'a', title: 'Design sync', created: '2026-11-03T10:00:00', at: 754, text: 'We keep the badges yellow.' }])
    expect(text).toBe('[1] Design sync · 2026-11-03 · 12:34\nWe keep the badges yellow.')
    expect(cited('Yellow [1], as said twice [1]; nothing from [3] or [0].', 2)).toEqual([1])
  })
})
