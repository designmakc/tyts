// The phrases dictated lately, so the last one can be typed again and the
// Dictate page can show a few to copy. Kept in dictation.json in the app's
// folder, newest first, and kept small by itself: 200 phrases at most and
// none older than 30 days. Notes are not logged: they are in Transcripts.

import * as fs from 'node:fs'
import * as path from 'node:path'

export type DictationEntry = {
  /** ISO date and time. */
  at: string
  mode: 'type' | 'english'
  /** What was typed. */
  text: string
  /** What was said, before it was edited or translated. */
  heard?: string
}

export const LOG_MOST = 200
export const LOG_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export class DictationLog {
  private entries: DictationEntry[] = []

  constructor(
    private readonly file: string,
    private readonly now: () => number = Date.now,
  ) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
      if (Array.isArray(raw)) this.entries = raw.filter(isEntry)
    } catch {
      this.entries = []
    }
    // Whatever order the file had, the newest is first.
    this.entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    if (this.prune()) this.save()
  }

  /** Newest first; `limit` of them. */
  list(limit?: number): DictationEntry[] {
    return this.entries.slice(0, limit ?? this.entries.length)
  }

  last(): DictationEntry | undefined {
    return this.entries[0]
  }

  add(entry: Omit<DictationEntry, 'at'>): DictationEntry {
    const added: DictationEntry = { at: new Date(this.now()).toISOString(), mode: entry.mode, text: entry.text, ...(entry.heard !== undefined && entry.heard !== entry.text ? { heard: entry.heard } : {}) }
    this.entries.unshift(added)
    this.prune()
    this.save()
    return added
  }

  /** Phrases from a backup: one not here is added, past the cap and the age dropped as always; how many stayed. */
  merge(list: readonly unknown[]): number {
    const key = (e: DictationEntry) => `${e.at}\u0000${e.text}`
    const here = new Set(this.entries.map(key))
    const added = list.filter(isEntry).filter(e => !here.has(key(e)))
    if (added.length === 0) return 0
    this.entries = [...this.entries, ...added].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    this.prune()
    this.save()
    return added.filter(e => this.entries.includes(e)).length
  }

  /** One phrase forgotten, by when it was typed. */
  remove(at: string): void {
    const n = this.entries.length
    this.entries = this.entries.filter(e => e.at !== at)
    if (this.entries.length !== n) this.save()
  }

  /** One phrase as the person fixed it (the list's pencil); what was heard stays as it was. */
  update(at: string, text: string): void {
    const e = this.entries.find(x => x.at === at)
    const now = text.trim()
    if (!e || !now || e.text === now) return
    if (e.heard === undefined) e.heard = e.text
    e.text = now
    if (e.heard === e.text) delete e.heard
    this.save()
  }

  clear(): void {
    if (this.entries.length === 0) return
    this.entries = []
    this.save()
  }

  /** Drops what is past the cap or the age; true when something went. */
  prune(): boolean {
    const n = this.entries.length
    const oldest = this.now() - LOG_DAYS * DAY_MS
    this.entries = this.entries.filter(e => Date.parse(e.at) >= oldest).slice(0, LOG_MOST)
    return this.entries.length !== n
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(this.file, JSON.stringify(this.entries, null, 2) + '\n', 'utf8')
    } catch (error) {
      console.warn('Tyts: could not save the dictated phrases', error)
    }
  }
}

function isEntry(e: unknown): e is DictationEntry {
  const r = e as Partial<DictationEntry> | null
  return (
    !!r &&
    typeof r.at === 'string' &&
    Number.isFinite(Date.parse(r.at)) &&
    (r.mode === 'type' || r.mode === 'english') &&
    typeof r.text === 'string' &&
    (r.heard === undefined || typeof r.heard === 'string')
  )
}
