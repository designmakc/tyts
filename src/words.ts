// The word notebook: the English words the person saved from the word card,
// each with its dictionary form, meanings and the sentence it was met in.
// Kept in words.json in the app's folder; one entry per dictionary form.
// Exported as a tab-separated file Anki imports as Basic cards.

import * as fs from 'node:fs'
import * as path from 'node:path'

import type { Sense } from './lemma'

export type SavedWord = {
  id: number
  /** The word as it was met in the text. */
  word: string
  /** Its dictionary form, the key of the notebook. */
  base: string
  senses: Sense[]
  sentence: string
  /** ISO date and time. */
  addedAt: string
}

export type NewWord = Omit<SavedWord, 'id' | 'addedAt'>

export class WordStore {
  private words: SavedWord[] = []
  private nextId = 1

  constructor(private readonly file: string) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
      if (Array.isArray(raw)) this.words = raw.filter(isSavedWord)
    } catch {
      this.words = []
    }
    this.nextId = this.words.reduce((n, w) => Math.max(n, w.id), 0) + 1
  }

  /** Newest first. */
  list(): SavedWord[] {
    return [...this.words].reverse()
  }

  has(base: string): boolean {
    return this.words.some(w => w.base === base.toLowerCase())
  }

  /** Saves a word once; saving it again returns the entry already there. */
  add(word: NewWord): SavedWord {
    const base = word.base.toLowerCase()
    const existing = this.words.find(w => w.base === base)
    if (existing) return existing
    const entry: SavedWord = { ...word, base, id: this.nextId++, addedAt: new Date().toISOString() }
    this.words.push(entry)
    this.save()
    return entry
  }

  remove(id: number): void {
    const n = this.words.length
    this.words = this.words.filter(w => w.id !== id)
    if (this.words.length !== n) this.save()
  }

  /** Words from a backup: each one not here yet is added with its date; how many came. */
  merge(list: readonly unknown[]): number {
    const here = new Set(this.words.map(w => w.base))
    const added = list.filter(isSavedWord).filter(w => {
      const base = w.base.toLowerCase()
      if (here.has(base)) return false
      here.add(base)
      return true
    })
    if (added.length === 0) return 0
    for (const w of added) this.words.push({ ...w, base: w.base.toLowerCase(), id: this.nextId++ })
    // Oldest first, as they were saved.
    this.words.sort((a, b) => Date.parse(a.addedAt) - Date.parse(b.addedAt))
    this.save()
    return added.length
  }

  removeBase(base: string): void {
    const n = this.words.length
    this.words = this.words.filter(w => w.base !== base.toLowerCase())
    if (this.words.length !== n) this.save()
  }

  private save(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify(this.words, null, 2) + '\n', 'utf8')
  }
}

function isSavedWord(w: unknown): w is SavedWord {
  const r = w as Partial<SavedWord> | null
  return (
    !!r &&
    typeof r.id === 'number' &&
    typeof r.word === 'string' &&
    typeof r.base === 'string' &&
    Array.isArray(r.senses) &&
    typeof r.sentence === 'string' &&
    typeof r.addedAt === 'string'
  )
}

/** The meanings as one line: "verb go, walk; noun walk". */
export function sensesText(senses: readonly Sense[]): string {
  return senses.map(([pos, translations]) => (pos ? `${pos} ${translations}` : translations)).join('; ')
}

/**
 * Anki's import: one card a line, front and back separated by a tab, HTML
 * allowed. Front: the word; back: its meanings and the sentence it came from.
 */
export function ankiTsv(words: readonly SavedWord[]): string {
  const cell = (s: string) => s.replace(/[\t\n\r]+/g, ' ').trim()
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return words
    .map(w => {
      const front = w.base === w.word.toLowerCase() ? w.base : `${w.base} (${w.word})`
      const meanings = w.senses.map(([pos, translations]) => (pos ? `<i>${esc(pos)}</i> ${esc(translations)}` : esc(translations))).join('<br>')
      const back = w.sentence ? `${meanings}<br><br>${esc(w.sentence)}` : meanings
      return `${cell(front)}\t${cell(back)}`
    })
    .join('\n')
}

/** A plain-text list for the clipboard: "word — meanings". */
export function wordsText(words: readonly SavedWord[]): string {
  return words.map(w => `${w.base} — ${sensesText(w.senses)}`).join('\n')
}
