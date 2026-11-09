// The bar by a selection (settings.selectionBar), in the main process: a duck-yellow
// dot under the start of a text the person selected with the mouse in another
// program, which opens into a pill of actions under the pointer (media/bar.html,
// webview/bar.ts). The keyboard thread tells where a selection ended (typist.ts
// `selected`); about a second later the program is asked whether it really has one
// and where it starts (Accessibility or UI Automation, never the clipboard), and only
// then the dot shows. The window never takes the keyboard, and a click on it never
// reaches it: the keyboard thread keeps the click from every window (a click on any
// window takes the keyboard from the program, and its selection with it) and says
// where it was (`barClick`); the page names the button. The pointer is looked at
// from here, as a window that never takes the keyboard may get no pointer events.
// A key, a click elsewhere, the wheel or another window ends it (`barGone`); away
// from the pointer the pill folds back into the dot and the dot goes (menu.ts barTick).

import { BrowserWindow, screen } from 'electron'

import { t } from './i18n'
import { BAR_LIST, BAR_ROW, barTick, isBarAction, type BarAction, type BarClock } from './menu'
import { BAR_BOX, placeBar, placeDot, type Rect } from './placement'
import type { BarView, ToHost, ToView } from './protocol'
import { handleOf } from './winclip'
import { putOnTop } from './winkbd'

const MAC = process.platform === 'darwin'
// Windows' hooks count physical pixels; a Mac's tap already counts Electron's points.
const toScreen = (win: BrowserWindow, rect: Rect): Rect => (MAC ? rect : screen.dipToScreenRect(win, rect))
const toDip = (point: { x: number; y: number }): { x: number; y: number } => (MAC ? point : screen.screenToDipPoint(point))

/** After the mouse-up the program is asked this much later, so the dot comes about a second after the selection ends. */
export const BAR_DELAY_MS = 900
/** How often the pointer is looked at while the bar shows. */
const LOOK_MS = 50
/** With no line height known (the press's point), the line is taken as this tall around it. */
const LINE = 16

/** Where the selection starts (the hooks' pixels: its first character's left edge and line), when the program says; `ok` false: no selection, or a password field. */
export type BarSelection = { ok: boolean; at?: { x: number; y: number; h: number } }

export type BarOptions = {
  page: string
  preload: string
  query: () => Record<string, string>
  /** "Don't show in <program>"'s name for the program in front. */
  program: () => string
  /** Whether the program in front has a selection, and where it starts. */
  ask: () => Promise<BarSelection>
  /** The keyboard thread learns where the bar is (the hooks' pixels), or that it is gone. */
  keys: (on: boolean, rect?: Rect) => void
  /** A button was clicked; the bar is gone by now. */
  run: (action: BarAction) => void
  log: (win: BrowserWindow) => void
}

export class SelectionBar {
  private win: BrowserWindow | undefined
  private ready = false
  private turn = 0
  private shown = 0
  private open = false
  private clock: BarClock = { phase: 'dot', away: 0 }
  private listAbove = false
  private size = { width: 0, height: 0 }
  private box: Rect = { x: 0, y: 0, width: BAR_BOX, height: BAR_BOX }
  private pointer = { x: -1, y: -1 }
  private looking: NodeJS.Timeout | undefined
  private waiting: NodeJS.Timeout | undefined

  constructor(private readonly o: BarOptions) {}

  /** A selection ended, starting about `start` (the hooks' pixels): asked of the program a moment later, the dot shown when it has one. */
  selected(start: { x: number; y: number }): void {
    this.gone()
    const turn = this.turn
    this.waiting = setTimeout(() => {
      this.waiting = undefined
      void this.o
        .ask()
        .catch((): BarSelection => ({ ok: false }))
        .then(sel => {
          if (turn !== this.turn) return
          if (!sel.ok) return this.o.keys(false)
          const top = toDip(sel.at ?? { x: start.x, y: start.y - LINE / 2 })
          const bottom = sel.at ? toDip({ x: sel.at.x, y: sel.at.y + sel.at.h }).y : top.y + LINE
          const area = screen.getDisplayNearestPoint({ x: Math.round(top.x), y: Math.round(bottom) }).workArea
          this.box = placeDot({ x: top.x, top: top.y, bottom }, area)
          this.show()
        })
    }, BAR_DELAY_MS)
  }

  /** Ended (the keyboard thread, a dictation, the settings, a pick): nothing waits, nothing shows, the thread keeps no click. */
  gone(): void {
    this.turn++
    if (this.waiting) clearTimeout(this.waiting)
    this.waiting = undefined
    if (this.looking) clearInterval(this.looking)
    this.looking = undefined
    const was = this.open
    this.open = false
    if (this.win && !this.win.isDestroyed()) this.win.hide()
    if (was) this.o.keys(false)
  }

  private show(): void {
    this.open = true
    this.shown++
    this.clock = { phase: 'dot', away: Date.now() }
    this.listAbove = false
    this.pointer = { x: -1, y: -1 }
    this.window()
    this.send()
    this.place()
    this.looking = setInterval(() => this.look(), LOOK_MS)
  }

  /** The pointer over the window or not: the dot opens, the pill folds, the dot goes; the page lights the button under it. */
  private look(): void {
    const win = this.win
    if (!win || win.isDestroyed() || !win.isVisible()) return
    const p = screen.getCursorScreenPoint()
    const b = win.getBounds()
    const inside = p.x >= b.x && p.x < b.x + b.width && p.y >= b.y && p.y < b.y + b.height
    const next = barTick(this.clock, inside, Date.now())
    if (next === 'gone') return this.gone()
    const changed = next.phase !== this.clock.phase
    this.clock = next
    if (changed) {
      this.send()
      this.place()
    }
    const at = inside ? { x: p.x - b.x, y: p.y - b.y } : { x: -1, y: -1 }
    if (at.x === this.pointer.x && at.y === this.pointer.y) return
    this.pointer = at
    win.webContents.send('to-view', { type: 'barPointer', ...at } satisfies ToView)
  }

  private send(): void {
    const win = this.win
    if (!win || win.isDestroyed() || !this.ready) return
    const label = (id: BarAction): string =>
      id === 'notHere' ? t('bar.notHere', { app: this.o.program() || t('bar.thisProgram') }) : id === 'copy' || id === 'settings' || id === 'listen' || id === 'check' ? t(`bar.${id}`) : t(`menu.${id}`)
    const view: BarView = {
      phase: this.clock.phase,
      row: BAR_ROW.map(id => ({ id, label: label(id) })),
      more: t('bar.more'),
      list: BAR_LIST.map(group => group.map(id => ({ id, label: label(id) }))),
      listAbove: this.listAbove,
      n: this.shown,
    }
    win.webContents.send('to-view', { type: 'bar', view } satisfies ToView)
  }

  /** The dot's square, or the pill (and its list) from it; the thread learns the window's place, for the clicks it keeps. */
  private place(): void {
    const win = this.win
    if (!win || win.isDestroyed() || !this.open) return
    let bounds = this.box
    if (this.clock.phase !== 'dot') {
      if (this.size.width <= 0) return
      const area = screen.getDisplayNearestPoint({ x: this.box.x, y: this.box.y }).workArea
      const height = this.clock.phase === 'list' ? this.size.height : BAR_BOX
      const placed = placeBar(this.box, { width: this.size.width, height }, area)
      bounds = placed.window
      if (placed.listAbove !== this.listAbove) {
        this.listAbove = placed.listAbove
        this.send()
      }
    }
    win.setBounds(bounds)
    if (!win.isVisible()) win.showInactive()
    putOnTop(handleOf(win))
    this.o.keys(true, toScreen(win, bounds))
  }

  /** A click the keyboard thread kept from every window, at this point (the hooks' pixels): the page says which button it hit. */
  click(point: { x: number; y: number }): void {
    const win = this.win
    if (!win || win.isDestroyed() || !this.open) return
    const p = toDip(point)
    const b = win.getBounds()
    win.webContents.send('to-view', { type: 'barClick', x: p.x - b.x, y: p.y - b.y } satisfies ToView)
  }

  /** The page's messages; true when the message was the bar's. */
  onMessage(message: ToHost): boolean {
    switch (message.type) {
      case 'barReady':
        this.ready = true
        if (this.open) this.send()
        return true
      case 'barSize':
        this.size = { width: message.width, height: message.height }
        if (this.open && this.clock.phase !== 'dot') this.place()
        return true
      case 'barPick':
        if (!this.open) return true
        if (message.id === 'more') {
          this.clock = { phase: this.clock.phase === 'list' ? 'pill' : 'list', away: undefined }
          this.send()
          this.place()
          return true
        }
        if (!isBarAction(message.id)) return true
        this.gone()
        this.o.run(message.id)
        return true
      default:
        return false
    }
  }

  private window(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) return this.win
    const win = new BrowserWindow({
      width: BAR_BOX,
      height: BAR_BOX,
      show: false,
      frame: false,
      transparent: true,
      hasShadow: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      // The program in front keeps the keyboard and its selection (its clicks never reach this window either).
      focusable: false,
      ...(MAC ? { type: 'panel' } : {}),
      title: t('app.name'),
      webPreferences: { preload: this.o.preload, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
    })
    win.setAlwaysOnTop(true, 'pop-up-menu')
    // No click is the window's: the keyboard thread keeps them and says where.
    win.setIgnoreMouseEvents(true)
    win.removeMenu()
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', event => event.preventDefault())
    this.o.log(win)
    win.on('closed', () => {
      if (this.win !== win) return
      this.win = undefined
      this.ready = false
      this.size = { width: 0, height: 0 }
    })
    void win.loadFile(this.o.page, { query: this.o.query() })
    this.win = win
    return win
  }
}
