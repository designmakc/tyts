// The call recording's window (media/capture.html, webview/capture.ts): it
// records all of the computer's sound and the microphone and shows its panel
// at the bottom of the screen; hidden, it goes on recording. The page owns the
// recording and says how it goes; this side keeps its state for the tray, the
// app window and quitting, answers its request for the computer's sound (and
// nobody else's), and, should the page die, hands what reached the engine over
// to be transcribed. Only ids and numbers go into the log.

import { BrowserWindow, desktopCapturer, screen, type Session } from 'electron'

import { pageOf } from './bridge'
import { frameWindow } from './dwm'
import { badgeOffset, placeBadge } from './placement'
import type { CallState, ToHost, ToView } from './protocol'

const PANEL = { width: 360, height: 96 }
/** The panel with its draft of the words open: taller, growing upward from where it stands. */
const OPEN = { width: 420, height: 340 }

export type CaptureOptions = {
  page: string
  preload: string
  query: () => Record<string, string>
  offset: () => { dx: number; dy: number }
  moved: (offset: { dx: number; dy: number }) => void
  /** The state changed: the tray and the app window follow. */
  onChange: () => void
  /** The page is gone with a recording open: hand it to the engine from here. */
  finish: (id: string) => Promise<unknown>
  /** The person asked for the system's settings from the panel. */
  openSettings: () => void
  /** "Record the call?" answered on the panel. */
  answered: (record: boolean) => void
  log: (line: string) => void
}

type CaptureMessage = Extract<ToHost, { type: 'captureState' | 'captureDone' | 'captureHide' | 'captureOpenSettings' | 'captureAnswer' | 'captureExpand' }>

export class CallCapture {
  state: CallState = 'idle'
  id: string | undefined
  /** Seconds recorded when the page said so last, and when that was (the time runs on while recording). */
  private secondsAt = { seconds: 0, at: 0 }
  private win: BrowserWindow | undefined
  private ready = false
  private waiting: ToView[] = []
  private stopped: ((id: string | null) => void)[] = []
  private hiding: NodeJS.Timeout | undefined

  constructor(private readonly o: CaptureOptions) {}

  /** Recording, paused, or on its way in or out: the tray's red dot, and quitting asks. */
  get busy(): boolean {
    return this.state !== 'idle'
  }

  get seconds(): number {
    const { seconds, at } = this.secondsAt
    return Math.round(seconds + (this.state === 'recording' && at ? (Date.now() - at) / 1000 : 0))
  }

  /** `auto`: started by itself (callwatch.ts); the panel says so and offers not to record. `live`: a draft of the words can be opened. */
  start(title: string, app?: string, auto = false, live = false): void {
    if (this.busy) return
    clearTimeout(this.hiding)
    this.state = 'starting'
    this.o.onChange()
    this.send({ type: 'capture', command: 'start', title, ...(app ? { app } : {}), ...(auto ? { auto } : {}), ...(live ? { live } : {}) })
    this.show()
  }

  /** A screenshot now (the shot key, the button at the top of the screen); only while the call records, false otherwise. The page answers with `captureShot`. */
  shot(): boolean {
    if (this.state !== 'recording') return false
    this.send({ type: 'capture', command: 'shot' })
    return true
  }

  /** "Record the call?" on the panel, while nothing records; answered through `answered`. */
  ask(app: string): void {
    if (this.busy) return
    clearTimeout(this.hiding)
    this.send({ type: 'capture', command: 'ask', app })
    this.show()
  }

  /** The call ended unanswered: the question goes. */
  unask(): void {
    this.send({ type: 'capture', command: 'unask' })
    if (!this.busy) this.hideSoon(0)
  }

  /** Stops and deletes the recording, nothing transcribed (an auto-started one under a minute). */
  discard(): Promise<void> {
    if (!this.busy) return Promise.resolve()
    const done = new Promise<void>(resolve => this.stopped.push(() => resolve()))
    this.send({ type: 'capture', command: 'discard' })
    return done
  }

  /** Stops and saves; the transcript's id once the engine has it, null when nothing was recorded. */
  stop(): Promise<string | null> {
    if (!this.busy) return Promise.resolve(null)
    const done = new Promise<string | null>(resolve => this.stopped.push(resolve))
    this.send({ type: 'capture', command: 'stop' })
    return done
  }

  /**
   * The page asks main for the computer's sound: only this window gets it, the screen's loopback sound with
   * the whole screen, whose picture the page keeps for the screenshots. The call program's window alone is
   * not given: a window source's title rarely names the program, a minimized one gives black frames, and
   * whether the loopback sound comes with a window source on a Mac is not known.
   */
  allowCapture(session: Session): void {
    session.setDisplayMediaRequestHandler((request, callback) => {
      const frame = request.frame
      if (!frame || frame.parent || pageOf(frame.url) !== 'capture') {
        this.o.log('call: another page asked for the screen, refused')
        return callback(null)
      }
      desktopCapturer
        .getSources({ types: ['screen'] })
        .then(sources => {
          const screenSource = sources[0]
          if (!screenSource) this.o.log('call: the system gave no screen to take the sound with')
          callback(screenSource ? { video: screenSource, audio: 'loopback' } : null)
        })
        .catch(error => {
          this.o.log(`call: the system gave no screen: ${error instanceof Error ? error.message : String(error)}`)
          callback(null)
        })
    })
  }

  message(m: CaptureMessage): void {
    switch (m.type) {
      case 'captureState': {
        if (!this.ready) {
          this.ready = true
          for (const w of this.waiting.splice(0)) this.win?.webContents.send('to-view', w)
          if (m.state === 'idle' && this.state === 'idle') return
        }
        const was = this.state
        this.state = m.state
        this.id = m.id ?? (m.state === 'idle' ? undefined : this.id)
        this.secondsAt = { seconds: m.seconds ?? 0, at: Date.now() }
        // Silence from the computer, "still there?", or the sound refused: shown even when it was hidden.
        if (m.silent || m.quiet || m.error) this.show()
        if (m.state !== was) this.o.log(`call: ${m.state}${m.id ? ` ${m.id}` : ''}${m.micMissing ? ', no microphone' : ''}${m.error ? ', the computer’s sound refused' : ''}`)
        // Saved already (captureDone came first), or it never began.
        if (m.state === 'idle') this.settle(null)
        this.o.onChange()
        return
      }
      case 'captureDone':
        this.o.log(`call: saved ${m.id ?? 'nothing'}, ${m.lost} chunks lost`)
        this.settle(m.id)
        this.hideSoon(1500)
        return
      case 'captureHide':
        this.win?.hide()
        return
      case 'captureOpenSettings':
        this.o.openSettings()
        return
      case 'captureExpand':
        this.resize(m.open ? OPEN : PANEL)
        return
      case 'captureAnswer':
        this.o.log(`call: asked, ${m.record ? 'record' : 'not now'}`)
        if (!m.record) this.hideSoon(0)
        this.o.answered(m.record)
        return
    }
  }

  private settle(id: string | null): void {
    for (const resolve of this.stopped.splice(0)) resolve(id)
  }

  private hideSoon(ms: number): void {
    clearTimeout(this.hiding)
    this.hiding = setTimeout(() => {
      if (!this.busy) this.win?.hide()
    }, ms)
  }

  /** The window to `size`, its bottom centre where it was (the panel sits at the window's bottom), kept on the screen. */
  private resize(size: { width: number; height: number }): void {
    const win = this.win
    if (!win || win.isDestroyed()) return
    const b = win.getBounds()
    const area = screen.getDisplayMatching(b).workArea
    const x = Math.min(Math.max(area.x, Math.round(b.x + (b.width - size.width) / 2)), area.x + area.width - size.width)
    const y = Math.min(Math.max(area.y, b.y + b.height - size.height), area.y + area.height - size.height)
    win.setBounds({ x, y, ...size })
  }

  private send(message: ToView): void {
    const win = this.window()
    if (this.ready) win.webContents.send('to-view', message)
    else this.waiting.push(message)
  }

  private show(): void {
    const win = this.window()
    const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    if (!win.isVisible()) win.setBounds(placeBadge(this.o.offset(), PANEL, area))
    win.showInactive()
  }

  /** The page's process is gone mid-recording: what reached the engine is transcribed, and the next call gets a new window. */
  private lost(reason: string): void {
    const id = this.id
    this.o.log(`call: the panel's page is gone (${reason})${id ? `, ${id} handed to the engine` : ''}`)
    if (id) void this.o.finish(id).catch(() => undefined)
    this.state = 'idle'
    this.id = undefined
    this.settle(id ?? null)
    this.win?.destroy()
    this.o.onChange()
  }

  private window(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) return this.win
    const win = new BrowserWindow({
      ...PANEL,
      show: false,
      frame: false,
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      // The call's program keeps the keyboard.
      focusable: false,
      title: 'Tyts call',
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      webPreferences: { preload: this.o.preload, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
    })
    frameWindow(win, { corner: 'square', border: 'none' })
    win.setAlwaysOnTop(true, 'pop-up-menu')
    win.removeMenu()
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', event => event.preventDefault())
    // Only a drag by the person moves it; the place is kept from the screen's bottom centre.
    win.on('moved', () => {
      const bounds = win.getBounds()
      this.o.moved(badgeOffset(bounds, screen.getDisplayMatching(bounds).workArea))
    })
    win.on('closed', () => {
      if (this.win !== win) return
      this.win = undefined
      this.ready = false
    })
    win.webContents.on('render-process-gone', (_event, details) => this.lost(details.reason))
    win.webContents.on('did-fail-load', (_event, code, description) => this.o.log(`call: the panel did not load: ${code} ${description}`))
    win.webContents.on('console-message', m => this.o.log(`call panel: ${m.message}`))
    this.ready = false
    void win.loadFile(this.o.page, { query: this.o.query() })
    this.win = win
    return win
  }

  dispose(): void {
    clearTimeout(this.hiding)
    this.win?.destroy()
  }
}
