import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vitest'

import { CLIPS_MOST, ClipHistory, PINS_MOST, clipLine } from './cliphistory'

function history(): { h: ClipHistory; file: string } {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-clips-')), 'clips.json')
  let now = Date.parse('2026-11-09T10:00:00Z')
  return { h: new ClipHistory(file, () => (now += 1000)), file }
}

describe('the clipboard history', () => {
  test('newest first; the same text again only moves up; blank is not kept', () => {
    const { h } = history()
    h.add('one')
    h.add('two')
    expect(h.add('two')).toBe(false)
    h.add('one')
    expect(h.add('  \n')).toBe(false)
    expect(h.list().map(c => c.text)).toEqual(['one', 'two'])
  })

  test('the last CLIPS_MOST kept, the pinned besides, first in the list', () => {
    const { h } = history()
    h.add('keep')
    h.pin(h.list()[0]!.at, true)
    for (let i = 0; i < CLIPS_MOST + 5; i++) h.add(`copy ${i}`)
    const list = h.list()
    expect(list).toHaveLength(CLIPS_MOST + 1)
    expect(list[0]).toMatchObject({ text: 'keep', pinned: true })
    expect(list[1]?.text).toBe(`copy ${CLIPS_MOST + 4}`)
  })

  test('PINS_MOST pins at most; Clear keeps them; kept on disk', () => {
    const { h, file } = history()
    for (let i = 0; i <= PINS_MOST; i++) h.add(`p${i}`)
    const results = h.list().map(c => h.pin(c.at, true))
    expect(results.filter(Boolean)).toHaveLength(PINS_MOST)
    h.clear()
    expect(h.list()).toHaveLength(PINS_MOST)
    const again = new ClipHistory(file)
    expect(again.list()).toHaveLength(PINS_MOST)
    again.remove(again.list()[0]!.at)
    expect(again.list()).toHaveLength(PINS_MOST - 1)
  })

  test('one line for the list', () => {
    expect(clipLine('a\n  b\tc')).toBe('a b c')
    expect(clipLine('x'.repeat(100), 10)).toBe('x'.repeat(9) + '…')
  })
})
