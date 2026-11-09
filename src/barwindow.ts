// The bar by a selection (settings.selectionBar), in the main process: a small
// pill of actions by a text the person selected with the mouse in another program
// (media/bar.html, webview/bar.ts). The keyboard thread tells where a selection
// ended (typist.ts `selected`); a moment later the program is asked whether it
// really has one (Accessibility or UI Automation, never the clipboard), and only
// then the bar shows, over the selection's end. It never takes the keyboard, so
// the program keeps its selection for the action a click runs. A key, a click
// elsewhere, the wheel or another window ends it (`barGone`), and so do 6 s
// without the pointer over it.

import { BrowserWindow, screen } from 'electron'

import { t } from './i18n'
import { BAR_ROW, rewriteGroups, isBarAction, type BarAction } from './menu'
import { placeBar, type Rect } from './placement'
import type { BarView, ToHost, ToView } from './protocol'
import { handleOf } from './winclip'
import { putOnTop } from './winkbd'

const MAC = process.platform === 'darwin'
// Windows' hooks count physical pixels; a Mac's tap already counts Electron's points.
const toScreen = (win: BrowserWindow, rect: Rect): Rect => (MAC ? rect : screen.dipToScreenRect(win, rect))
const toDip = (point: { x: number; y: number }): { x: number; y: number } => (MAC ? point : screen.screenToDipPoint(point))

/** After the mouse-up, the program is asked this much later: a double click's selection has settled by then. */
export const BAR_DELAY_MS = 250
/** The bar goes after this long without the pointer over it. */
export const BAR_IDLE_MS = 6000
const LOOK_MS = 250
/** The tooltip's band beside the pill, and the window's least width (a tooltip may be wider than the pill). */
const BAND = 26
const WIDE = 280

/** Where the selection is (the hooks' pixels: its end's right edge, its lines), when the program says; `ok` false: no selection, or a password field. */
export type BarSelection = { ok: boolean; at?: { x: number; y: number; h: number } }

export type BarOptions = {
  page: string
  preload: string
  query: () => Record<string, string>
  lang: () => Parameters<typeof rewriteGroups>[0]
  /** Whether the program in front has a selection, and where. */
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
  private above = true
  private size = { width: 0, height: 0 }
  private at = { x: 0, top: 0, bottom: 0 }
  private seen = 0
  private looking: NodeJS.Timeout | undefined
  private waiting: NodeJS.Timeout | undefined

  constructor(private readonly o: BarOptions) {}

  /** A selection ended at `point` (the hooks' pixels): asked of the program a moment later, shown when it has one. */
  selected(point: { x: number; y: number }): void {
    const turn = ++this.turn
    this.hideWindow()
    if (this.waiting) clearTimeout(this.waiting)
    this.waiting = setTimeout(() => {
      this.waiting = undefined
      void this.o
        .ask()
        .catch((): BarSelection => ({ ok: false }))
        .then(sel => {
          if (turn !== this.turn) return
          if (!sel.ok) return this.o.keys(false)
          const end = sel.at ? { x: sel.at.x, y: sel.at.y } : point
          const top = toDip(end)
          this.at = { x: top.x, top: top.y, bottom: sel.at ? toDip({ x: sel.at.x, y: sel.at.y + sel.at.h }).y : top.y }
          this.show()
        })
    }, BAR_DELAY_MS)
  }

  /** The keyboard thread ended it (a key, a click elsewhere, the wheel, another window), or the settings did. */
  gone(): void {
    this.turn++
    if (this.waiting) clearTimeout(this.waiting)
    this.waiting = undefined
    this.hideWindow()
  }

  /** Hidden by itself (idle, a click on it): the thread is told. */
  private hide(): void {
    this.gone()
    this.o.keys(false)
  }

  private hideWindow(): void {
    this.open = false
    if (this.looking) clearInterval(this.looking)
    this.looking = undefined
    if (this.win && !this.win.isDestroyed()) this.win.hide()
  }

  private show(): void {
    this.open = true
    this.shown++
    this.seen = Date.now()
    this.window()
    this.send()
    if (this.size.width > 0) this.place()
    // The pointer over it keeps it; 6 s away from it, it goes.
    this.looking = setInterval(() => {
      const win = this.win
      if (!win || win.isDestroyed() || !win.isVisible()) return
      const p = screen.getCursorScreenPoint()
      const b = win.getBounds()
      if (p.x >= b.x && p.x < b.x + b.width && p.y >= b.y && p.y < b.y + b.height) this.seen = Date.now()
      else if (Date.now() - this.seen > BAR_IDLE_MS) this.hide()
    }, LOOK_MS)
  }

  private send(): void {
    const win = this.win
    if (!win || win.isDestroyed() || !this.ready) return
    const lang = this.o.lang()
    const view: BarView = {
      row: BAR_ROW.map(id => ({ id, tip: id === 'copy' ? t('bar.copy') : t(`menu.${id}`) })),
      sub: rewriteGroups(lang)[0]!.map(item => ({ id: item.id, label: t(`menu.${item.id}`) })),
      back: t('bar.back'),
      above: this.above,
      n: this.shown,
    }
    win.webContents.send('to-view', { type: 'bar', view } satisfies ToView)
  }

  /** Over the selection's end, inside its screen's work area; the thread learns where the pill is, for a click on it. */
  private place(): void {
    const win = this.win
    if (!win || win.isDestroyed() || !this.open) return
    const area = screen.getDisplayNearestPoint({ x: Math.round(this.at.x), y: Math.round(this.at.bottom) }).workArea
    const { window, pill, above } = placeBar(this.at, this.size, BAND, WIDE, area)
    if (above !== this.above) {
      this.above = above
      this.send()
    }
    win.setBounds(window)
    if (!win.isVisible()) win.showInactive()
    putOnTop(handleOf(win))
    this.o.keys(true, toScreen(win, pill))
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
        if (this.open) this.place()
        return true
      case 'barPick':
        if (!this.open || !isBarAction(message.id, this.o.lang())) return true
        this.hide()
        this.o.run(message.id)
        return true
      default:
        return false
    }
  }

  private window(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) return this.win
    const win = new BrowserWindow({
      width: WIDE,
      height: 36 + BAND,
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
      // The program in front keeps the keyboard and its selection; on a Mac a panel is not even made active by a click.
      focusable: false,
      ...(MAC ? { type: 'panel' } : {}),
      title: t('app.name'),
      webPreferences: { preload: this.o.preload, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
    })
    win.setAlwaysOnTop(true, 'pop-up-menu')
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
