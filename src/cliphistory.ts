// The clipboard history (off by default): the texts the person copied lately,
// to paste one again from a list by the text cursor (main.ts openClips). Kept in
// clips.json in the app's folder: the last CLIPS_MOST copies, newest first, and
// up to PINS_MOST pinned ones that stay through "Clear". Never logged: only counts.

import * as fs from 'node:fs'
import * as path from 'node:path'

export type Clip = {
  /** ISO date and time it was copied (its id). */
  at: string
  text: string
  pinned?: boolean
}

export const CLIPS_MOST = 30
export const PINS_MOST = 10
/** A copy longer than this (a whole document) is not kept. */
export const CLIP_CHARS = 20_000

export class ClipHistory {
  private clips: Clip[] = []

  constructor(
    private readonly file: string,
    private readonly now: () => number = Date.now,
  ) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown
      if (Array.isArray(raw)) this.clips = raw.filter(isClip)
    } catch {
      this.clips = []
    }
    this.prune()
  }

  /** The pinned first, then the others, newest first. */
  list(): Clip[] {
    return [...this.clips.filter(c => c.pinned), ...this.clips.filter(c => !c.pinned)]
  }

  /** A copy kept; the same text copied again only moves up (pinned stays pinned). True when the list changed. */
  add(text: string): boolean {
    if (!text.trim() || text.length > CLIP_CHARS) return false
    if (this.clips[0]?.text === text) return false
    const old = this.clips.find(c => c.text === text)
    this.clips = this.clips.filter(c => c !== old)
    this.clips.unshift({ at: new Date(this.now()).toISOString(), text, ...(old?.pinned ? { pinned: true } : {}) })
    this.prune()
    this.save()
    return true
  }

  /** Pinned or not; false when PINS_MOST are pinned already. */
  pin(at: string, on: boolean): boolean {
    const clip = this.clips.find(c => c.at === at)
    if (!clip || !!clip.pinned === on) return !!clip
    if (on && this.clips.filter(c => c.pinned).length >= PINS_MOST) return false
    if (on) clip.pinned = true
    else delete clip.pinned
    this.prune()
    this.save()
    return true
  }

  remove(at: string): void {
    const n = this.clips.length
    this.clips = this.clips.filter(c => c.at !== at)
    if (this.clips.length !== n) this.save()
  }

  /** Everything but the pinned. */
  clear(): void {
    const n = this.clips.length
    this.clips = this.clips.filter(c => c.pinned)
    if (this.clips.length !== n) this.save()
  }

  /** The unpinned past CLIPS_MOST go, and pins past PINS_MOST lose their pin. */
  private prune(): void {
    let pins = 0
    let rest = 0
    this.clips = this.clips.filter(c => {
      if (c.pinned && ++pins > PINS_MOST) delete c.pinned
      return c.pinned || ++rest <= CLIPS_MOST
    })
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(this.file, JSON.stringify(this.clips, null, 2) + '\n', 'utf8')
    } catch (error) {
      console.warn('Tyts: could not save the clipboard history', error)
    }
  }
}

/** One line of a clip for a list: its spaces and line breaks as single spaces, cut at `most` characters. */
export function clipLine(text: string, most = 60): string {
  const line = text.replace(/\s+/g, ' ').trim()
  return line.length > most ? line.slice(0, most - 1) + '…' : line
}

function isClip(c: unknown): c is Clip {
  const r = c as Partial<Clip> | null
  return !!r && typeof r.at === 'string' && typeof r.text === 'string' && (r.pinned === undefined || typeof r.pinned === 'boolean')
}
