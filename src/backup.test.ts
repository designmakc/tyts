import { describe, expect, it } from 'vitest'

import { backupSummary, makeBackup, readBackup } from './backup'

describe('backup', () => {
  const parts = {
    words: [{ id: 1, word: 'went', base: 'go' }],
    mistakes: [{ at: '2026-10-30T10:00:00.000Z', text: 'He go.', corrected: 'He goes.', note: '' }],
    learned: { fixedOnce: [], alwaysFix: [{ word: 'ghbdtn', lang: 'ru' }], myWords: [{ word: 'Kryakl', lang: 'en' }] },
    translations: [],
    dictation: [{ at: '2026-10-30T10:00:00.000Z', mode: 'type', text: 'Привет' }],
    talks: [{ id: 'a1', topic: 'cafe', started: '2026-11-01T10:00:00.000Z', ended: '2026-11-01T10:05:00.000Z', turns: [] }],
  }

  it('reads back what it wrote, and says what it holds', () => {
    const file = JSON.parse(JSON.stringify(makeBackup('0.10.2', new Date('2026-10-30T12:00:00Z'), { theme: 'dark' }, parts)))
    expect(file).toMatchObject({ kind: 'tyts-backup', version: '0.10.2', exported: '2026-10-30T12:00:00.000Z' })
    const read = readBackup(file)
    expect(read).toEqual({ settings: { theme: 'dark' }, ...parts })
    expect(backupSummary(read)).toBe('settings, 1 word, 1 mistake, 2 learned words, 1 dictated phrase, 1 talk')
  })

  it('takes a settings file from before backups as the settings alone', () => {
    const read = readBackup({ theme: 'light', selectKey: 'Control+Alt+L' })
    expect(read.settings).toEqual({ theme: 'light', selectKey: 'Control+Alt+L' })
    expect(backupSummary(read)).toBe('settings')
  })

  it('refuses a file with no settings, and skips parts that are not lists', () => {
    expect(() => readBackup([1, 2])).toThrow('it holds no settings')
    expect(() => readBackup('text')).toThrow('it holds no settings')
    expect(readBackup({ kind: 'krya-backup', settings: [], words: 'many' })).toMatchObject({ settings: {}, words: [] })
    // A backup Altype made (its old name) is a backup still, not a settings file.
    expect(readBackup({ kind: 'altype-backup', settings: { native: 'Russian' }, words: [{ word: 'go' }] })).toMatchObject({ settings: { native: 'Russian' }, words: [{ word: 'go' }] })
  })
})
