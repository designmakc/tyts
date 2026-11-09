// Tyts borrows the clipboard: to copy a selection, to paste a translation,
// a converted word or a dictated phrase, and the screen snip lands there.
// The guard keeps what the person had there and puts it back after, so
// nothing of Tyts's is left: one snapshot for a run of actions close
// together (a second press of the fix key would otherwise keep Tyts's own
// text as "what was there"); put back only while the clipboard still holds
// Tyts's doing (a copy the person made meanwhile stays); not written at
// all when nothing changed; tried again while another program holds it. A
// pasted text is only promised (winclipboard.ts): Windows asks Tyts for it
// when a program reads it (`read` decides who gets it), and what the person
// had goes back once the paste's program has it, not after a guessed moment
// (a slow program would paste the old content).

export type ClipboardBackend<S> = {
  /** Windows' number of the clipboard's latest change. */
  sequence(): number
  snapshot(): S
  restore(saved: S): void
  /** `paste`: promised, handed over when a program reads it, if the guard says so (`read`). */
  writeText(text: string, paste: boolean): void
}

/** Changes of Tyts's own this many back are still known as its own. */
const REMEMBERED = 32
/** Waits between tries while another program holds the clipboard. */
const RETRY_MS = [30, 60, 120, 240, 480]
/** A program that has read the pasted text finishes its paste within this. */
export const AFTER_READ_MS = 150
/** No read seen (another clipboard program read it first, or the paste went nowhere): back after this at most. */
export const READ_WAIT_MS = 2500

export class ClipboardGuard<S> {
  private saved: { content: S; sequence: number } | undefined
  private timer: ReturnType<typeof setTimeout> | undefined
  private ours: number[] = []
  /** The text written to paste: whether Ctrl+V was pressed for it, whether the paste's program has read it since, and the processes that asked before. */
  private paste: { pressed: boolean; read: boolean; watchers: Set<number> } | undefined
  /** The putting back waits for that read. */
  private awaitingRead = false

  constructor(
    private readonly backend: ClipboardBackend<S>,
    private readonly wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
  ) {}

  /** Before Tyts changes the clipboard: what is there is kept, unless an earlier action's keeping is still waiting to go back. */
  hold(): void {
    this.cancelTimer()
    if (!this.saved) this.saved = { content: this.backend.snapshot(), sequence: this.backend.sequence() }
  }

  /** Whether a run of Tyts's actions has the clipboard. */
  get holding(): boolean {
    return this.saved !== undefined
  }

  /** Puts a text there; `paste`: for pasting, which Tyts then presses (`pasted`). */
  async write(text: string, paste = false): Promise<void> {
    // Known before writing: a program may ask for the text while Windows is still announcing it.
    this.paste = paste ? { pressed: false, read: false, watchers: new Set() } : undefined
    await this.tried(() => this.backend.writeText(text, paste))
    this.claim()
  }

  /** Ctrl+V was pressed for the text written: the next read of it is the paste. */
  pasted(): void {
    if (this.paste) this.paste.pressed = true
  }

  /**
   * A program asks for the text written to paste (process `reader`, when its
   * window is known; `front`, the process in front); whether it gets it. Before
   * Ctrl+V nobody is pasting: the reader is a program watching the clipboard
   * that ignores Windows' mark asking it not to (Viber reads every change within
   * a millisecond), and it gets nothing, so the text stays promised for the
   * paste. After Ctrl+V the paste's program gets it, and what the person had
   * goes back a moment later; such a watcher still gets nothing, unless it is
   * the program in front (a translation pasted into Viber).
   */
  read(reader?: number, front?: number): boolean {
    const p = this.paste
    // A text promised outside a paste is given to anyone.
    if (!p) return true
    if (!p.pressed) {
      if (reader !== undefined) p.watchers.add(reader)
      return false
    }
    if (reader !== undefined && reader !== front && p.watchers.has(reader)) return false
    if (!p.read) {
      p.read = true
      if (this.awaitingRead && this.timer) this.schedule(AFTER_READ_MS)
    }
    return true
  }

  /** The clipboard as it is now is Tyts's doing: a copy it pressed in another program. */
  claim(): void {
    this.ours.push(this.backend.sequence())
    if (this.ours.length > REMEMBERED) this.ours.shift()
  }

  /** Whether the clipboard's latest change is Tyts's: its writing, a copy it pressed, or its putting back. */
  isOurs(): boolean {
    return this.ours.includes(this.backend.sequence())
  }

  /**
   * What the person had goes back in `ms`; without it, a moment after the
   * pasted text is read (READ_WAIT_MS at most), at once when nothing was
   * written to paste. Unless another action holds it again first.
   */
  release(ms?: number): void {
    const p = this.paste
    this.schedule(ms ?? (!p ? 0 : p.read ? AFTER_READ_MS : READ_WAIT_MS))
    this.awaitingRead = ms === undefined && p !== undefined && !p.read
  }

  private schedule(ms: number): void {
    this.cancelTimer()
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.putBack().catch(error => console.warn('Tyts: could not put the clipboard back', error))
    }, ms)
  }

  /** Forgets what was kept: the clipboard stays as it is. */
  drop(): void {
    this.cancelTimer()
    this.saved = undefined
  }

  /** Puts back what the person had, if the clipboard still holds Tyts's doing. */
  async putBack(): Promise<void> {
    const saved = this.take()
    if (saved) await this.tried(() => this.backend.restore(saved))
    if (saved) this.claim()
  }

  /** On quitting: what waits to go back goes back now, once. */
  flush(): void {
    const saved = this.take()
    if (!saved) return
    try {
      this.backend.restore(saved)
    } catch (error) {
      console.warn('Tyts: could not put the clipboard back on quitting', error)
    }
  }

  /** The kept content, when it should go back: not when nothing changed, nor when the latest change is not Tyts's. */
  private take(): S | undefined {
    this.cancelTimer()
    const saved = this.saved
    this.saved = undefined
    this.paste = undefined
    if (!saved) return undefined
    const now = this.backend.sequence()
    if (now === saved.sequence || !this.ours.includes(now)) return undefined
    return saved.content
  }

  private async tried(work: () => void): Promise<void> {
    for (let attempt = 0; ; attempt++) {
      try {
        return work()
      } catch (error) {
        const pause = RETRY_MS[attempt]
        if (pause === undefined) throw error
        await this.wait(pause)
      }
    }
  }

  private cancelTimer(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    this.awaitingRead = false
  }
}
