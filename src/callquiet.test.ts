import { describe, expect, it } from 'vitest'

import { ANSWER_MS, QUIET_MS, quiet } from './callquiet'

describe('a call left recording in silence', () => {
  const heard = 1_000_000

  it('says nothing while somebody was heard lately', () => {
    expect(quiet(heard, heard)).toBe('fine')
    expect(quiet(heard, heard + QUIET_MS - 1)).toBe('fine')
  })

  it('asks after ten quiet minutes, counting the seconds down', () => {
    expect(quiet(heard, heard + QUIET_MS)).toEqual({ left: 60 })
    expect(quiet(heard, heard + QUIET_MS + 15_400)).toEqual({ left: 45 })
    expect(quiet(heard, heard + QUIET_MS + ANSWER_MS - 1)).toEqual({ left: 1 })
  })

  it('stops when the minute passes unanswered', () => {
    expect(quiet(heard, heard + QUIET_MS + ANSWER_MS)).toBe('stop')
    expect(quiet(heard, heard + 3 * QUIET_MS)).toBe('stop')
  })

  it('goes back to fine once a sound or an answer moves the last heard moment', () => {
    const asked = heard + QUIET_MS + 30_000
    expect(quiet(asked, asked + 1000)).toBe('fine')
  })
})
