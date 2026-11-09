import { describe, expect, it } from 'vitest'

import { topMode, topRows } from './toplook'

const base = { style: 'glow' as const, dictating: false, callLines: false, paused: false, quiet: false }

describe('topMode', () => {
  it('shows nothing when nothing goes on', () => {
    expect(topMode(base)).toBeUndefined()
  })
  it('shows the look while dictation listens, unless the look is plain', () => {
    expect(topMode({ ...base, dictating: true })).toBe('dictate')
    expect(topMode({ ...base, dictating: true, style: 'drop' })).toBe('dictate')
    expect(topMode({ ...base, dictating: true, style: 'plain' })).toBeUndefined()
  })
  it("shows a call's lines in any look, dictation first", () => {
    expect(topMode({ ...base, callLines: true, style: 'plain' })).toBe('call')
    expect(topMode({ ...base, callLines: true, dictating: true })).toBe('dictate')
    expect(topMode({ ...base, callLines: true, dictating: true, style: 'plain' })).toBe('call')
  })
  it('keeps quiet when paused or over a program that fills the screen', () => {
    expect(topMode({ ...base, dictating: true, callLines: true, paused: true })).toBeUndefined()
    expect(topMode({ ...base, dictating: true, callLines: true, quiet: true })).toBeUndefined()
  })
})

describe('topRows', () => {
  const row = (who: 'me' | 'others', text: string, gap = false) => ({ who, at: 0, text, gap })
  it('keeps the last three lines with words', () => {
    expect(topRows([row('me', 'one'), row('others', 'two'), row('me', '', true), row('me', ' '), row('others', 'three'), row('me', 'four')])).toEqual([
      { who: 'others', text: 'two' },
      { who: 'others', text: 'three' },
      { who: 'me', text: 'four' },
    ])
  })
  it('keeps the newest words of a long line, cut at a word', () => {
    const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ')
    const [got] = topRows([row('me', long)])
    expect(got!.text.startsWith('…word')).toBe(true)
    expect(got!.text.endsWith('word79')).toBe(true)
    expect(got!.text.length).toBeLessThanOrEqual(181)
  })
  it('cuts a line of one endless word too', () => {
    expect(topRows([row('me', 'a'.repeat(400))])[0]!.text.length).toBe(181)
  })
})
