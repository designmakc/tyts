// A backup of what the person made in Tyts, one file to keep or to take to
// another computer (Settings › Backup): the settings, the word notebook, the
// mistakes, what Tyts learned from their typing (the words, never the
// fingerprints, which are salted on this computer), the recent translations,
// the dictated phrases and the talks with the duck put away. Not in it: the downloads (they download again),
// the speech engine's settings with the Hugging Face key (a secret), the
// transcripts (their own folder), this computer's measurements. Importing
// replaces the settings and adds the rest to what is here, so nothing here is
// lost. A settings file exported by 0.10.0–0.10.1 (the settings alone) imports too.
// An older backup's switch Ctrl+C twice (`doubleCopy`) is read as settings.ts
// normalize reads an old settings file: the key of Translate and read aloud.

import { t } from './i18n'
import type { LearnedLists } from './learning'

export const BACKUP_KIND = 'tyts-backup'
/** The kinds Tyts's and Altype's backups carry: read as Tyts's own. */
export const OLD_BACKUP_KINDS: readonly unknown[] = ['oldname-backup', 'altype-backup']

export type BackupParts = {
  words: unknown[]
  mistakes: unknown[]
  learned: Partial<Record<keyof LearnedLists, unknown>>
  translations: unknown[]
  dictation: unknown[]
  /** The talks with the duck that New talk put away (talks.ts); none in a backup from before 0.12. */
  talks: unknown[]
}

export type Backup = { kind: typeof BACKUP_KIND; version: string; exported: string; settings: unknown } & BackupParts

/** What a file holds: settings to take, and the libraries to add. */
export type BackupRead = { settings: Record<string, unknown> } & BackupParts

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const object = (v: unknown): Record<string, unknown> | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined)

export function makeBackup(version: string, now: Date, settings: unknown, parts: BackupParts): Backup {
  return { kind: BACKUP_KIND, version, exported: now.toISOString(), settings, ...parts }
}

/** A backup, or a settings file from before backups; throws on anything else. */
export function readBackup(raw: unknown): BackupRead {
  const r = object(raw)
  if (!r) throw new Error('it holds no settings')
  if (r.kind !== BACKUP_KIND && !OLD_BACKUP_KINDS.includes(r.kind)) return { settings: r, words: [], mistakes: [], learned: {}, translations: [], dictation: [], talks: [] }
  return {
    settings: object(r.settings) ?? {},
    words: list(r.words),
    mistakes: list(r.mistakes),
    learned: object(r.learned) ?? {},
    translations: list(r.translations),
    dictation: list(r.dictation),
    talks: list(r.talks),
  }
}

/** What a backup holds, in a line: "settings, 120 words, 3 mistakes, 8 learned words, 30 translations, 12 dictated phrases, 4 talks". */
export function backupSummary(b: BackupRead): string {
  const learned = (['fixedOnce', 'alwaysFix', 'myWords'] as const).reduce((n, k) => n + list(b.learned[k]).length, 0)
  return [
    t('backup.settings'),
    b.words.length ? t('backup.words', { n: b.words.length }) : '',
    b.mistakes.length ? t('backup.mistakes', { n: b.mistakes.length }) : '',
    learned ? t('backup.learned', { n: learned }) : '',
    b.translations.length ? t('backup.translations', { n: b.translations.length }) : '',
    b.dictation.length ? t('backup.phrases', { n: b.dictation.length }) : '',
    b.talks.length ? t('backup.talks', { n: b.talks.length }) : '',
  ]
    .filter(Boolean)
    .join(', ')
}
