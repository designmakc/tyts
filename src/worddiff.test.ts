import { describe, expect, it } from 'vitest'

import { changesOf, wordDiff, type DiffPart } from './worddiff'

/** The parts as one line: ~~struck~~ and **put in**. */
const marked = (parts: DiffPart[]) => parts.map(p => (p.kind === 'del' ? `~~${p.text}~~` : p.kind === 'ins' ? `**${p.text}**` : p.text)).join('')

describe('wordDiff', () => {
  it('marks the words changed, struck and new together', () => {
    expect(marked(wordDiff('I want to learn English and can we made tutor option?', 'I want to learn English, and can we make a tutor option?'))).toBe(
      'I want to learn English**,** and can we ~~made~~**make a** tutor option?',
    )
    expect(marked(wordDiff('I dictate or tupe in English and you show my my mistake?', 'I dictate or type in English and you show me my mistakes?'))).toBe(
      'I dictate or ~~tupe~~**type** in English and you show ~~my~~**me** my ~~mistake~~**mistakes**?',
    )
  })

  it('keeps the spaces of the corrected text around a word struck out or put in', () => {
    expect(marked(wordDiff('We discussed about the plan.', 'We discussed the plan.'))).toBe('We discussed ~~about~~ the plan.')
    expect(marked(wordDiff('Lets meet tomorow at 10.', "Let's meet tomorrow at 10."))).toBe("~~Lets~~**Let's** meet ~~tomorow~~**tomorrow** at 10.")
    expect(marked(wordDiff('Hello world', 'Hello, world'))).toBe('Hello**,** world')
  })

  it('is one kept run for a text without mistakes, and keeps its lines', () => {
    expect(wordDiff('I agree with you.', 'I agree with you.')).toEqual([{ kind: 'same', text: 'I agree with you.' }])
    expect(marked(wordDiff('He don\'t like it.\n\nShe can speaks.', 'He doesn\'t like it.\n\nShe can speak.'))).toBe(
      "He ~~don't~~**doesn't** like it.\n\nShe can ~~speaks~~**speak**.",
    )
  })

  it('reads every script and a case changed as a change', () => {
    expect(marked(wordDiff('The deadline is in monday.', 'The deadline is on Monday.'))).toBe('The deadline is ~~in monday~~**on Monday**.')
  })
})

describe('changesOf', () => {
  it('pairs what was struck with what came in', () => {
    const parts = wordDiff('We discussed about the plan yesterday and can made it', 'We discussed the plan yesterday, and can make it')
    expect(changesOf(parts)).toEqual([
      { wrong: 'about', right: '' },
      { wrong: '', right: ',' },
      { wrong: 'made', right: 'make' },
    ])
  })
})
