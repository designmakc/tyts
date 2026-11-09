import { describe, expect, test } from 'vitest'

import { paragraphsOf, type OcrLine } from './ocrtext'

const line = (text: string, y: number, x = 10): OcrLine => ({ text, x, y, w: 300, h: 20 })

describe('paragraphsOf', () => {
  test('lines close under each other are one paragraph; a hyphenated word is joined back', () => {
    expect(paragraphsOf([line('The build failed again, so we have to', 0), line('check the log be-', 26), line('fore the release.', 52)])).toBe(
      'The build failed again, so we have to check the log before the release.',
    )
  })

  test('a wide gap or a line far to the side starts a new paragraph', () => {
    const text = paragraphsOf([line('Settings', 0), line('Dark mode', 60), line('Turn it on', 86), line('Cancel', 112, 400)])
    expect(text).toBe('Settings\n\nDark mode Turn it on\n\nCancel')
  })

  test('a dash between words stays, empty lines are skipped', () => {
    expect(paragraphsOf([line('A well-', 0), line('Known fact', 26), line('  ', 52)])).toBe('A well- Known fact')
    expect(paragraphsOf([])).toBe('')
  })
})
