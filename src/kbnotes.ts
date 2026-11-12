// The knowledge base folder's Markdown files as notes: the Notes page lists them beside the
// recordings, finds a word in them, and a question to the notes reads their paragraphs too (ask.ts).
// The folder is read when the page asks, never kept in memory or indexed ahead.
// ponytail: every file is read again for each search; an index by modified time when a folder of
// thousands of notes makes the list slow.

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import type { Passage } from './ask'

/** A note file: `made`, the minute Tyts wrote it at (its own voice notes and transcripts sent to the folder). */
export type KbNote = { path: string; title: string; created: string; made?: string; body: string }
/** A note file in the Notes page's list, with the found words when searched (marked [ ] as the engine's are). */
export type KbRow = { path: string; title: string; created: string; snippet?: string }

const MOST_FILES = 5000
const MOST_BYTES = 1_000_000
const PASSAGE_CHARS = 1200
const UNSAFE = /[<>:"/\\|?*\x00-\x1f]+/g

/** The question's words as search prefixes, as the engine cuts them (engine/calls.py terms): "бейджам" → "бейдж". */
export function terms(question: string): string[] {
  const out: string[] = []
  for (const word of question.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []) {
    if (word.length < 3) continue
    const prefix = word.length < 5 ? word : word.slice(0, Math.max(4, word.length - 2))
    if (!out.includes(prefix)) out.push(prefix)
  }
  return out
}

/** A Markdown file as a note: its title (the first heading, else the file's name), its date and its text without the front matter. */
export function parseNote(file: string, text: string, modified: Date): KbNote {
  const front = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/.exec(text)
  const head = front?.[1] ?? ''
  const body = (front ? text.slice(front[0].length) : text).trim()
  const written = /^created:\s*(\S+)/m.exec(head)?.[1] ?? ''
  const created = written && !Number.isNaN(Date.parse(written)) ? written : modified.toISOString()
  // Tyts's own files (engine/notes.py): a source and one of its two tags.
  const own = !!written && /^source:/m.test(head) && /^\s*-\s*"(voice|transcript)"/m.test(head)
  const title = /^#\s+(.+)$/m.exec(body)?.[1]?.trim() || path.basename(file).replace(/\.md$/i, '')
  return { path: file, title, created, made: own ? written.slice(0, 16) : undefined, body }
}

/** The words around the first of `words` found in the text, the word marked [ ]; nothing when none is there. */
export function snippetOf(text: string, words: string[]): string | undefined {
  const low = text.toLowerCase()
  for (const word of words) {
    const at = low.indexOf(word)
    if (at < 0) continue
    const from = Math.max(0, at - 40)
    const end = at + word.length
    const cut = (s: string) => s.replace(/\s+/g, ' ')
    return `${from ? '…' : ''}${cut(text.slice(from, at))}[${text.slice(at, end)}]${cut(text.slice(end, end + 60))}${end + 60 < text.length ? '…' : ''}`
  }
  return undefined
}

/** The notes for the list, the newest first; with a query, those that have every word of it. */
export function listRows(notes: KbNote[], query: string): KbRow[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return notes
    .filter(n => {
      const all = `${n.title}\n${n.body}`.toLowerCase()
      return words.every(w => all.includes(w))
    })
    .map(n => ({ path: n.path, title: n.title, created: n.created, snippet: words.length ? snippetOf(n.body, words) : undefined }))
    .sort((a, b) => b.created.localeCompare(a.created))
}

/** The paragraphs of the notes that have any of the words, each a passage a question can be answered from. */
export function filePassages(notes: KbNote[], words: string[]): Passage[] {
  const out: Passage[] = []
  if (!words.length) return out
  for (const n of notes)
    for (const paragraph of n.body.split(/\n\s*\n/)) {
      const low = paragraph.toLowerCase()
      if (!words.some(w => low.includes(w))) continue
      out.push({ id: '', file: n.path, source: 'kb', title: n.title, created: n.created, at: 0, text: paragraph.trim().slice(0, PASSAGE_CHARS) })
    }
  return out
}

/** The passages that say most about the words, the best first, as many as the model reads in one go. */
export function best(passages: Passage[], words: string[], chars = 6000, most = 10): Passage[] {
  const score = (p: Passage) => {
    const low = `${p.title}\n${p.text}`.toLowerCase()
    const hit = words.filter(w => low.includes(w))
    return hit.length * 1000 + hit.reduce((n, w) => n + low.split(w).length - 1, 0)
  }
  const out: Passage[] = []
  let used = 0
  for (const p of passages.map(p => ({ p, s: score(p) })).sort((a, b) => b.s - a.s).map(x => x.p)) {
    if (out.length >= most || used + p.text.length > chars) break
    used += p.text.length
    out.push(p)
  }
  return out
}

/** A file's new path for the name the person typed: the same folder, a name a file may have, `.md` kept. */
export function renamed(file: string, name: string): string {
  const stem = name.trim().replace(/\.md$/i, '').replace(UNSAFE, ' ').replace(/\s+/g, ' ').replace(/^[ .]+|[ .]+$/g, '').slice(0, 80).trimEnd()
  if (!stem) throw new Error('A note needs a name')
  return path.join(path.dirname(file), `${stem}.md`)
}

/** Whether `file` is a Markdown file inside the folder `dir` (both as the file system resolves them). */
export function inside(dir: string, file: string): boolean {
  const base = path.resolve(dir)
  const full = path.resolve(file)
  return !!dir && full.startsWith(base + path.sep) && /\.md$/i.test(full)
}

/** Every Markdown file of the folder, the folders inside it too; hidden folders, links and very large files are left out. */
export async function readKb(dir: string): Promise<KbNote[]> {
  const out: KbNote[] = []
  const folders = [dir]
  while (folders.length && out.length < MOST_FILES) {
    const folder = folders.pop()!
    let entries: import('node:fs').Dirent[]
    try {
      entries = await fs.readdir(folder, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue
      const full = path.join(folder, e.name)
      if (e.isDirectory()) folders.push(full)
      else if (e.isFile() && /\.md$/i.test(e.name) && out.length < MOST_FILES) {
        try {
          const stat = await fs.stat(full)
          if (stat.size <= MOST_BYTES) out.push(parseNote(full, await fs.readFile(full, 'utf8'), stat.mtime))
        } catch {
          // a file that went away or cannot be read is no note
        }
      }
    }
  }
  return out
}
