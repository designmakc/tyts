// Dictate: a key, in any program, starts recording in the badge (a small
// window at the bottom of the screen being typed in, where the person last
// dropped it, that never takes the focus, so the program keeps it); the same
// key again stops. Then, by the key:
//   type     the text is typed where the cursor is (through the clipboard,
//            which is put back as it was), put right first by the local model
//            when text editing is on (dictedit.ts),
//   english  the same, translated into English first by Kryakl's translator,
//   note     the recording goes into the knowledge base as a .md file
//            (through the engine's library), and a balloon says where.
// Esc while recording throws it away. Typed phrases go into the log
// (dictationlog.ts), so the again key can type the last one once more.

import * as fs from 'node:fs'
import * as path from 'node:path'

import { BrowserWindow, globalShortcut, screen, shell } from 'electron'

import { openable } from './bridge'
import { applyCorrections, type Correction } from './corrections'
import type { DictationLog } from './dictationlog'
import { frameWindow } from './dwm'
import { HoldToTalk } from './holdtalk'
import { t } from './i18n'
import { log } from './log'
import { badgeOffset, flightPoint, placeBadge, type Rect } from './placement'
import type { DictationMode, ToHost, ToView } from './protocol'
import type { Settings } from './settings'
import type { SpeechHost } from './speechhost'
import { handleOf } from './winclip'
import { foreground, putOnTop, sightOf, windowRect, type Sight } from './winkbd'

/** The badge is as wide as this; as tall as its page, from one line of words to about six (then they scroll). */
const BADGE = { width: 360, min: 64, max: 180 }
/** How soon after it shows, then how often while it is up, the badge asks whether Windows shows it too. */
const LOOK_MS = { first: 500, every: 2000 }
const NOTE_WAIT_MS = 5 * 60_000
/** A phrase's start waits this long for the engine's session; past it the phrase is recorded whole (no words while it is spoken). */
export const SESSION_WAIT_MS = 1000
/** How long the badge says something of a phrase it typed (Fast translated it). */
const NOTE_SHOWN_MS = 3000
/** How long the badge takes to fly into the tray, as the page's shrinking (dictation.css), and how often it moves meanwhile. */
const FLIGHT_MS = 260
const FLIGHT_STEP_MS = 16
/** The most languages the engine weighs a phrase against. */
const MOST_EXPECTED = 8

export type DictationOptions = {
  page: string
  /** What the page's address carries: Windows' frame, the interface's language (main.ts pageQuery). */
  query: () => Record<string, string>
  preload: string
  speech: SpeechHost
  /** Types the text in the program in front, the clipboard kept. */
  paste: (text: string) => Promise<void>
  /** The text in English; `from` is the language the engine heard. */
  /** The phrase in English; `note`, said in the badge after it is typed (Fast translated it, the model too slow just now). */
  toEnglish: (text: string, from: string) => Promise<{ text: string; note?: string }>
  /** The phrase as text editing leaves it; `note`, said in the badge after it is typed (typed as said, and why). Off, it comes back as it was. */
  edit: (text: string, signal: AbortSignal) => Promise<{ text: string; note?: string }>
  /** Whether a phrase goes through text editing now. */
  editing: () => boolean
  /** The pairs learned from the person's fixes (corrections.ts), put right in a phrase before anything else. */
  corrections: () => readonly Correction[]
  /** A phrase is starting: the model loads while it is spoken. */
  warm: () => void
  /** Practice: a phrase spoken in English, shown checked (Check my English) instead of typed. */
  check: (text: string) => void
  /** The languages the person uses (their own, English, the others they named): a phrase is taken as one of them, never another. */
  expected: () => string[]
  /** The language of a text by its letters and words (translate.ts), when Whisper was unsure. */
  languageOf: (text: string) => string
  balloon: (title: string, content: string, click?: () => void) => void
  /** The engine is not installed yet: Dictate's page offers it. */
  needsEngine: () => void
  /** The app window on Report a problem: the engine would not start. */
  report: () => void
  /** The app window on a transcript: a note that stayed in Transcripts. */
  openTranscript: (id: string) => void
  onChange: () => void
  /** The phrases typed lately. */
  log: DictationLog
  /** A phrase went into the log, or the log was cleared: the Dictate page shows the latest. */
  logged: () => void
  /** Whether the badge shows while a phrase is dictated; it still comes up to say what went wrong. */
  panel: () => boolean
  /** The middle of the tray icon, where a badge folded away flies. */
  trayPoint: () => { x: number; y: number }
  /** Where the person last dropped the badge, from the bottom centre of the work area; and keeping a new place. */
  offset: () => Settings['dictationBadge']
  /** Hold the key to talk: its release (`release`) finishes a phrase it started by holding. */
  hold: () => boolean
  moved: (offset: Settings['dictationBadge']) => void
}

/** What keeps the person from seeing a badge Windows calls shown; empty when nothing does. */
function troubleOf(sight: Sight): string {
  return [sight.topmost ? '' : 'not on top', sight.cloaked ? `cloaked ${sight.cloaked}` : '', sight.above.length ? `under ${sight.above.join(', ')}` : ''].filter(Boolean).join('; ')
}

type Transcript = { title: string; note?: string; noteError?: string }
type Row = { status: string; error: string }

export class Dictation {
  state: 'idle' | 'recording' | 'working' = 'idle'
  mode: DictationMode = 'type'
  private badge: BrowserWindow | undefined
  private badgeReady = false
  private waiting: ToView[] = []
  /** The engine is being asked for a session: a second press now would come before the badge starts. */
  private opening = false
  /** The height the badge's page asked for: its bottom edge stays where it is when it changes. */
  private height = BADGE.min
  private looking: NodeJS.Timeout | undefined
  /** What Windows was last found doing to the badge, as logged; empty while it shows it on top. */
  private trouble = ''
  /** Windows cloaked the badge: a new one is made before the next phrase. */
  private stale: false | string = false
  /** Ends the edit under way: the phrase was thrown away. */
  private editStop: AbortController | undefined
  /** The badge is out of sight for this phrase, folded away or not wanted: the recording goes on in it all the same. */
  private tucked = false
  /** The screen this phrase started on: a badge brought back comes up there. */
  private area: Rect = { x: 0, y: 0, width: 0, height: 0 }
  /** The person is moving the badge: a new height waits for the drop. */
  private dragging = false
  /** The height the page last asked for, kept while the badge cannot take it. */
  private asked: number = BADGE.min
  private flight: NodeJS.Timeout | undefined
  private holding = new HoldToTalk()
  /** Let go while the engine was still being asked for a session: finished once it starts. */
  private finishOnStart = false

  constructor(private readonly o: DictationOptions) {}

  /** A Dictate key: the first press starts, the next one (any of the three) stops. */
  press(mode: DictationMode, key: string): void {
    if (this.opening) return
    this.holding.pressed(Date.now(), this.state === 'idle')
    if (this.state === 'idle') void this.start(mode, key)
    else if (this.state === 'recording') this.stop()
  }

  /** A dictation key went up (the keyboard thread saw it): held long enough, the phrase it started finishes; a tap stays a toggle. Never a note's. */
  release(): void {
    if (!this.o.hold() || !this.holding.released(Date.now()) || this.mode === 'note') return
    if (this.opening) this.finishOnStart = true
    else if (this.state === 'recording') this.stop()
  }

  private async start(mode: DictationMode, key: string): Promise<void> {
    if (!this.o.speech.installed) return this.o.needsEngine()
    if (!this.o.speech.ready) {
      // Given up after its restarts, it will not come by waiting: the notice says so and opens the report.
      if (this.o.speech.down) this.o.balloon(t('app.name'), t('dict.engineDown'), this.o.report)
      else this.o.balloon(t('app.name'), t('dict.engineStarting'))
      return
    }
    this.mode = mode
    this.finishOnStart = false
    if (mode === 'type' || mode === 'english') this.o.warm()
    // The screen to show on is the one with the window the text goes into, taken now, while it is in front.
    this.area = this.workArea()
    this.set('recording')
    const expected = this.expected(mode)
    let session: string | undefined
    if (mode !== 'note') {
      // Heard while it is spoken (the engine loads its model meanwhile); an engine without sessions gets the phrase whole.
      this.opening = true
      const asked = Date.now()
      const call = this.o.speech.call<{ id: string }>('POST', '/dictate/sessions', { expected, strict: true })
      try {
        // An engine slow to answer (the computer short of memory) is not waited for: the phrase is recorded whole meanwhile.
        const r = await Promise.race([call, new Promise<null>(resolve => setTimeout(resolve, SESSION_WAIT_MS, null))])
        if (r?.ok) session = r.data.id
        else if (r) void this.o.speech.call('POST', '/dictate/prepare')
        // The session that comes too late is nobody's.
        else void call.then(late => void (late.ok && this.o.speech.call('DELETE', `/dictate/sessions/${late.data.id}`)))
      } finally {
        this.opening = false
        log(`dictation: the engine ${session ? 'answered' : 'gave no session'} in ${Date.now() - asked} ms`)
      }
    }
    if (this.state !== 'recording') return
    if (this.stale) this.renew()
    const badge = this.window()
    this.height = this.asked = BADGE.min
    this.tucked = !this.o.panel()
    if (this.tucked) log('badge: not shown, as the setting says')
    else this.present(badge, `session ${session ? 'yes' : 'no'}`)
    this.send({ type: 'dictation', command: 'start', mode, key, ...(session ? { session } : {}), expected })
    globalShortcut.register('Escape', () => this.cancel())
    if (this.finishOnStart) {
      this.finishOnStart = false
      this.stop()
    }
  }

  /** The badge at the person's place on this phrase's screen, on top. */
  private present(badge: BrowserWindow, why: string): void {
    clearInterval(this.flight)
    const area = this.area
    const place = placeBadge(this.o.offset(), { width: BADGE.width, height: this.height }, area)
    badge.setBounds(place)
    badge.showInactive()
    // Shown again, a window keeps its old place in Windows' stack, and Windows may have put it under ordinary windows meanwhile.
    const before = this.sight(badge)
    this.raise(badge)
    const was = before ? troubleOf(before) : ''
    log(`badge: shown at ${JSON.stringify(badge.getBounds())} (asked ${JSON.stringify(place)}, area ${JSON.stringify(area)}, offset ${JSON.stringify(this.o.offset())}), visible ${badge.isVisible()}, ${why}${was ? `; was ${was}, raised` : ''}`)
    this.look(LOOK_MS.first)
  }

  /** The person folded the badge away: it flies into the tray's red dot, the recording going on; the next phrase shows it again. */
  private tuck(fly: boolean): void {
    const b = this.badge
    if (this.state === 'idle' || this.tucked || !b || b.isDestroyed()) return
    this.tucked = true
    if (!fly) return b.hide()
    const from = b.getBounds()
    const tray = this.o.trayPoint()
    // The panel shrinks into its bottom right corner: that corner lands on the icon.
    const to = { x: tray.x - from.width, y: tray.y - from.height }
    const began = Date.now()
    clearInterval(this.flight)
    this.flight = setInterval(() => {
      if (b.isDestroyed()) return clearInterval(this.flight)
      const progress = (Date.now() - began) / FLIGHT_MS
      if (progress >= 1) return b.hide()
      const at = flightPoint(from, to, progress)
      b.setPosition(at.x, at.y)
    }, FLIGHT_STEP_MS)
  }

  /** A badge out of sight comes up to say something the person has to know. */
  private reveal(): void {
    if (!this.tucked) return
    this.tucked = false
    this.height = this.asked
    if (this.badge && !this.badge.isDestroyed()) this.present(this.badge, 'brought back')
  }

  private stop(): void {
    this.set('working')
    // Esc stays: while the text is finished, it throws the phrase away (a note is saved regardless).
    if (this.mode === 'note') globalShortcut.unregister('Escape')
    this.send({ type: 'dictation', command: 'stop', mode: this.mode, key: '' })
  }

  cancel(): void {
    if (this.state !== 'recording' && !(this.state === 'working' && this.mode !== 'note')) return
    globalShortcut.unregister('Escape')
    this.editStop?.abort()
    this.send({ type: 'dictation', command: 'cancel', mode: this.mode, key: '' })
  }

  /** The badge's messages; true when the message was the badge's. */
  onMessage(message: ToHost): boolean {
    switch (message.type) {
      case 'dictationReady':
        this.badgeReady = true
        for (const m of this.waiting.splice(0)) this.send(m)
        return true
      case 'dictationAudio':
        void this.typePhrase(message.mode, message.audio)
        return true
      case 'dictationText':
        void this.typeHeard(message.mode, message.text, message.language, message.sure)
        return true
      case 'dictationNote':
        void this.awaitNote(message.id)
        return true
      case 'dictationHeight':
        this.fit(message.px)
        return true
      case 'dictationTuck':
        this.tuck(message.fly)
        return true
      case 'dictationCancelled':
        this.over()
        this.badge?.hide()
        return true
      case 'dictationFailed':
        this.fail(message.message)
        return true
      default:
        return false
    }
  }

  private async typePhrase(mode: DictationMode, audio: Uint8Array): Promise<void> {
    const expected = this.expected(mode).map(encodeURIComponent).join(',')
    // strict: a phrase is never taken for a language the person does not use.
    const r = await this.o.speech.call<{ text: string; language: string; sure?: number }>('POST', `/dictate?language=auto&expected=${expected}&strict=1`, audio)
    if (!r.ok) return this.fail(r.error)
    // An engine before 0.2 says nothing of how sure it is: its language is taken as it is.
    await this.typeHeard(mode, r.data.text, r.data.language, r.data.sure ?? 1)
  }

  /** The languages a phrase may be in: the person's, or English alone for practice (so a mistake is not heard as another language). */
  private expected(mode: DictationMode): string[] {
    return mode === 'check' ? ['en'] : this.o.expected().slice(0, MOST_EXPECTED)
  }

  /** A recognized phrase typed where the cursor is; in English first for the English key; checked in the card for practice. */
  private async typeHeard(mode: DictationMode, heard: string, language: string, sure: number): Promise<void> {
    if (this.state !== 'working') return
    let text = heard.trim()
    let note: string | undefined
    if (!text) return this.fail('Nothing was heard')
    if (mode === 'check') {
      this.badge?.hide()
      this.over()
      return this.o.check(text)
    }
    // Practice is left as said: a fix there would hide the person's own mistake.
    text = applyCorrections(text, this.o.corrections())
    try {
      // Whisper unsure, or a model that does not say (Parakeet): the language by the text's letters and words.
      const spoken = language && sure >= 0.5 ? language : this.o.languageOf(text)
      if (this.o.editing()) {
        const stop = new AbortController()
        this.editStop = stop
        this.send({ type: 'dictationEditing' })
        ;({ text, note } = await this.o.edit(text, stop.signal))
        this.editStop = undefined
        // Esc while it was edited: the phrase is gone (the badge says so in a moment).
        if (stop.signal.aborted) return
      }
      if (mode === 'english' && spoken !== 'en') {
        const english = await this.o.toEnglish(text, spoken)
        text = english.text
        note = english.note ?? note
      }
    } catch (error) {
      return this.fail(`Could not translate: ${error instanceof Error ? error.message : String(error)}`)
    }
    // Said in the badge a moment after it is typed; else the badge goes at once.
    if (note) {
      this.reveal()
      this.send({ type: 'dictationDone', text, note })
    } else this.badge?.hide()
    this.over()
    // A space after it, so the next phrase or word goes on without one typed by hand.
    try {
      await this.o.paste(`${text} `)
    } catch (error) {
      // Said in the badge, never an unhandled rejection; the phrase is still kept in the list below.
      console.warn('Tyts: could not type the phrase', error)
      this.fail(`Could not type it: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (note) this.hideSoon(NOTE_SHOWN_MS)
    this.o.log.add(mode === 'english' ? { mode, text, heard } : { mode: 'type', text, ...(text === heard.trim() ? {} : { heard }) })
    this.o.logged()
  }

  /** The again key: the last phrase typed once more where the cursor is (not logged again). */
  typeAgain(): void {
    if (this.state !== 'idle' || this.opening) return
    const last = this.o.log.last()
    if (!last) return this.o.balloon('Tyts', 'Nothing dictated yet')
    this.o.paste(`${last.text} `).catch(error => console.warn('Tyts: could not type the phrase again', error))
  }

  clearLog(): void {
    this.o.log.clear()
    this.o.logged()
  }

  private async awaitNote(id: string): Promise<void> {
    const until = Date.now() + NOTE_WAIT_MS
    while (Date.now() < until) {
      const r = await this.o.speech.call<{ row: Row; transcript: Transcript | null }>('GET', `/transcripts/${id}`)
      if (r.ok && r.data.row.status === 'done' && r.data.transcript) {
        const t = r.data.transcript
        this.over()
        if (t.note) {
          const file = t.note
          this.send({ type: 'dictationDone', text: path.basename(file, '.md') })
          this.o.balloon('Note saved', `${path.basename(file)}\nClick to open it.`, () => {
            if (openable(file, p => fs.statSync(p).isDirectory())) void shell.openPath(file)
          })
        } else {
          this.send({ type: 'dictationDone', text: t.title })
          this.o.balloon('The note is in Transcripts', t.noteError ?? 'No knowledge base folder is chosen yet: choose one on the Dictate page.', () => this.o.openTranscript(id))
        }
        this.hideSoon(2200)
        return
      }
      if (r.ok && r.data.row.status === 'failed') return this.fail(r.data.row.error || 'Could not transcribe the note')
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    this.over()
    this.badge?.hide()
  }

  private fail(message: string): void {
    this.over()
    this.reveal()
    this.send({ type: 'dictationError', message })
    this.hideSoon(3500)
  }

  private over(): void {
    globalShortcut.unregister('Escape')
    this.set('idle')
  }

  private hideSoon(ms: number): void {
    setTimeout(() => {
      if (this.state === 'idle') this.badge?.hide()
    }, ms)
  }

  private set(state: Dictation['state']): void {
    this.state = state
    this.o.onChange()
  }

  private send(message: ToView): void {
    const badge = this.window()
    if (this.badgeReady) badge.webContents.send('to-view', message)
    else this.waiting.push(message)
  }

  private window(): BrowserWindow {
    if (this.badge && !this.badge.isDestroyed()) return this.badge
    const b = new BrowserWindow({
      width: BADGE.width,
      height: BADGE.min,
      show: false,
      frame: false,
      resizable: false,
      // All of it is a drag region (dictation.css): the person puts it where it bothers least.
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      // The program being typed in keeps the focus, so the text lands there.
      focusable: false,
      title: 'Tyts dictation',
      // The page draws the pill itself (its 16 px corners and 1 px edge, dictation.css): the window around it is
      // see-through, on Windows 10 and 11 alike, as DWM's own round corner is fixed at about 8 px.
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      webPreferences: { preload: this.o.preload, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
    })
    // No edge of Windows 11's around it either: a square ghost behind the pill's round corners.
    frameWindow(b, { corner: 'square', border: 'none' })
    b.setAlwaysOnTop(true, 'pop-up-menu')
    b.removeMenu()
    b.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    b.webContents.on('will-navigate', event => event.preventDefault())
    // Both come only for a drag by the person, 'moved' once, when it ends (never for setBounds or a flight).
    b.on('will-move', () => {
      this.dragging = true
    })
    b.on('moved', () => {
      this.dragging = false
      this.dropped()
      this.fit(this.asked)
    })
    b.on('closed', () => {
      // A badge made again (renew) is not this one.
      if (this.badge !== b) return
      this.badge = undefined
      this.badgeReady = false
    })
    b.on('hide', () => {
      clearTimeout(this.looking)
      clearInterval(this.flight)
      log(`badge: hidden, state ${this.state}`)
    })
    b.on('unresponsive', () => log('badge: the page does not answer'))
    b.webContents.on('render-process-gone', (_event, details) => log(`badge: the page's process is gone: ${details.reason}`))
    b.webContents.on('did-fail-load', (_event, code, description) => log(`badge: the page did not load: ${code} ${description}`))
    b.webContents.on('console-message', m => log(`badge page: ${m.message} (${m.sourceId}:${m.lineNumber})`))
    void b.loadFile(this.o.page, { query: this.o.query() })
    log(`badge: window made, page ${this.o.page}`)
    this.badge = b
    return b
  }

  /** On top of every window, those kept on top too, the focus left where it is. */
  private raise(b: BrowserWindow): void {
    try {
      putOnTop(handleOf(b))
    } catch (error) {
      console.warn('Tyts: Windows did not put the badge on top', error)
    }
  }

  /** Windows' own view of the badge; undefined when it does not say. */
  private sight(b: BrowserWindow): Sight | undefined {
    try {
      return sightOf(handleOf(b))
    } catch (error) {
      console.warn('Tyts: could not ask Windows about the badge', error)
      return undefined
    }
  }

  /**
   * Electron may call the badge shown while the person sees nothing (2026-10-29:
   * every phrase logged "visible"; caught live, the badge lay under VS Code and
   * Chrome, its "on top" flag still set). So, while it is up, Windows' own
   * view: is it still on top, is it cloaked, does a window lie over it. A
   * change goes into the log once; off top or under a window it is raised at
   * once; a cloaked badge (another virtual desktop) records this phrase still,
   * so it is made again before the next one.
   */
  private look(after: number): void {
    clearTimeout(this.looking)
    this.looking = setTimeout(() => {
      const b = this.badge
      if (!b || b.isDestroyed() || !b.isVisible()) return
      const sight = this.sight(b)
      if (!sight) return
      const trouble = troubleOf(sight)
      if (trouble !== this.trouble) log(trouble ? `badge: Windows has it ${trouble}` : 'badge: Windows has it on top again')
      this.trouble = trouble
      if (sight.cloaked) this.stale = 'as Windows cloaked the last one'
      if (trouble) this.raise(b)
      this.look(LOOK_MS.every)
    }, after)
  }

  /** A new badge in place of one Windows cloaked (made now, it is on the desktop in use), or of one in the interface's old language. */
  private renew(): void {
    const why = this.stale
    this.stale = false
    this.badge?.destroy()
    this.badge = undefined
    this.badgeReady = false
    log(`badge: made again, ${why}`)
  }

  /** The interface's language changed: the next phrase gets a badge made in it. */
  languageChanged(): void {
    if (this.badge) this.stale = 'in the new language'
  }

  /**
   * The work area of the screen holding the window in front (the one the text
   * goes into); with no window there, or one Windows gives no size, the
   * screen under the pointer.
   */
  private workArea(): Rect {
    try {
      const rect = windowRect(foreground().hwnd)
      if (rect) return screen.getDisplayMatching(screen.screenToDipRect(null, rect)).workArea
    } catch (error) {
      console.warn('Tyts: could not find the window in front', error)
    }
    return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  }

  /** The page's new height, the bottom edge kept, inside the work area. */
  private fit(px: number): void {
    const b = this.badge
    if (!b || b.isDestroyed() || !Number.isFinite(px)) return
    const height = Math.round(Math.min(BADGE.max, Math.max(BADGE.min, px)))
    this.asked = height
    if (height === this.height || this.dragging || this.tucked) return
    this.height = height
    const now = b.getBounds()
    const area = screen.getDisplayMatching(now).workArea
    const y = Math.max(area.y, now.y + now.height - height)
    b.setBounds({ x: now.x, y, width: BADGE.width, height })
    log(`badge: page ${px} px → ${JSON.stringify(b.getBounds())} from ${JSON.stringify(now)}, visible ${b.isVisible()}`)
  }

  /** The person dropped the badge: the place is kept from that screen's bottom centre, for every screen. */
  private dropped(): void {
    const b = this.badge
    if (!b || b.isDestroyed()) return
    const bounds = b.getBounds()
    this.o.moved(badgeOffset(bounds, screen.getDisplayMatching(bounds).workArea))
  }

  dispose(): void {
    clearTimeout(this.looking)
    clearInterval(this.flight)
    this.badge?.destroy()
  }
}
