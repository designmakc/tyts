// The menu on one key, in the main process: a small window by the text cursor
// (media/menu.html, webview/menu.ts), made at the first press and hidden between
// uses. It never takes the keyboard, so the program in front keeps its focus and
// its selection: while it is open the keyboard thread reads its keys (typist.ts
// `menu`). What a pick does is main.ts's.

import { BrowserWindow, screen } from 'electron'

import { frameWindow } from './dwm'
import { t } from './i18n'
import { menuKeyOf, type MenuAction, type MenuItem } from './menu'
import { placeMenu, type Rect } from './placement'

// Windows' hooks and caret count physical pixels; on a Mac they already are Electron's points (and its screen has no dipToScreenRect).
const MAC = process.platform === 'darwin'
const toScreen = (win: BrowserWindow, rect: Rect): Rect => (MAC ? rect : screen.dipToScreenRect(win, rect))
const toDip = (point: { x: number; y: number }): { x: number; y: number } => (MAC ? point : screen.screenToDipPoint(point))
import type { MenuView, ToHost, ToView } from './protocol'
import { handleOf } from './winclip'
import { putOnTop } from './winkbd'

const WIDTH = 300
/** A first guess of its height, until the page says. */
const HEIGHT = 420
/** The item picked stays lit this long before the menu goes and its action runs. */
const FIRE_MS = 120

export type MenuOptions = {
  page: string
  preload: string
  query: () => Record<string, string>
  /** The window's ground and edge, in the theme's colors. */
  background: () => string
  border: () => string
  /** The groups to show now. */
  groups: () => MenuItem[][]
  /** An item's own list (Rewrite…'s), shown in place of the groups when it is picked. */
  sub: (action: MenuAction) => MenuItem[][] | undefined
  /** The text cursor of the window in front, in physical pixels, when it has a system one. */
  caret: () => { x: number; y: number; h: number } | undefined
  /** The keyboard thread takes the menu's keys, or no longer; `rect`: where it is, in physical pixels. */
  keys: (on: boolean, codes?: string[], rect?: Rect) => void
  /** An item was picked; the menu is gone by now. */
  run: (action: MenuAction) => void
  log: (win: BrowserWindow) => void
}

/** Another list in the same window in place of the actions (the clipboard history): its items, its line at the foot, and what a pick does. */
export type MenuList = { groups: MenuItem[][]; foot: string; run: (index: number) => void }

export class TytsMenu {
  private list: MenuList | undefined
  private win: BrowserWindow | undefined
  private ready = false
  private open = false
  private groups: MenuItem[][] = []
  private items: MenuItem[] = []
  private lit = 0
  private fired = -1
  private height = 0
  private at = { x: 0, top: 0, bottom: 0 }
  private firing: NodeJS.Timeout | undefined

  constructor(private readonly o: MenuOptions) {}

  get isOpen(): boolean {
    return this.open
  }

  /** `list`: that list instead of the actions. */
  toggle(list?: MenuList): void {
    if (this.open) this.close()
    else this.show(list)
  }

  /** Opens by the text cursor, else by the pointer; the keys are taken at once, the window shows as soon as its height is known. */
  private show(list?: MenuList): void {
    this.list = list
    const caret = this.o.caret()
    if (caret) {
      const top = toDip({ x: caret.x, y: caret.y })
      this.at = { x: top.x, top: top.y, bottom: toDip({ x: caret.x, y: caret.y + caret.h }).y }
    } else {
      const p = screen.getCursorScreenPoint()
      this.at = { x: p.x, top: p.y, bottom: p.y }
    }
    this.groups = list?.groups ?? this.o.groups()
    this.items = this.groups.flat()
    this.lit = 0
    this.fired = -1
    this.open = true
    this.o.keys(true, this.codes())
    this.window()
    this.send()
    if (this.height > 0 && this.ready) this.place()
  }

  private codes(): string[] {
    return this.items.map(item => item.code).filter(Boolean)
  }

  /** Closes it: the keyboard is the program's again. */
  close(): void {
    if (!this.open) return
    this.o.keys(false)
    this.closed()
  }

  /** The keyboard thread closed it itself (another key, a click elsewhere): it only goes. */
  closed(): void {
    this.open = false
    if (this.firing) clearTimeout(this.firing)
    this.firing = undefined
    if (this.win && !this.win.isDestroyed()) this.win.hide()
    // Hidden with nothing lit: the next opening shows no trace of the last pick.
    this.lit = 0
    this.fired = -1
    this.send()
  }

  /** A key the thread took for it. */
  key(code: string): void {
    if (!this.open || this.firing) return
    const did = menuKeyOf(code, this.items, this.lit)
    if (did === 'close') this.close()
    else if (did && 'pick' in did) this.pick(did.pick)
    else if (did) this.light(did.lit)
  }

  private light(index: number): void {
    this.lit = index
    this.send()
  }

  /** An item picked: the keys go back at once, it stays lit a moment, then the menu goes and the action runs (in the program in front, which never lost the keyboard). */
  private pick(index: number): void {
    const item = this.items[index]
    if (!item || !this.open || this.firing) return
    const sub = this.o.sub(item.id)
    if (sub) {
      // Its list in place of the groups, the keys still the menu's: its letters now; the height it reports places it again.
      this.groups = sub
      this.items = sub.flat()
      this.lit = 0
      const win = this.win
      this.o.keys(true, this.codes(), win && !win.isDestroyed() ? toScreen(win, win.getBounds()) : undefined)
      this.send()
      return
    }
    this.o.keys(false)
    this.lit = index
    this.fired = index
    this.send()
    const list = this.list
    this.firing = setTimeout(() => {
      this.closed()
      if (list) list.run(index)
      else this.o.run(item.id)
    }, FIRE_MS)
  }

  /** The page's messages; true when the message was the menu's. */
  onMessage(message: ToHost): boolean {
    switch (message.type) {
      case 'menuReady':
        this.ready = true
        if (this.open) this.send()
        return true
      case 'menuHeight':
        this.height = message.px
        if (this.open) this.place()
        return true
      case 'menuHover':
        if (this.open && !this.firing && this.items[message.index]) this.light(message.index)
        return true
      case 'menuPick':
        this.pick(message.index)
        return true
      default:
        return false
    }
  }

  /** The interface's language changed: the window is made again in it at the next press. */
  languageChanged(): void {
    this.close()
    this.win?.destroy()
  }

  /** Windows' or the app's theme changed: its ground and edge follow; the page follows by itself. */
  repaint(): void {
    if (!this.win || this.win.isDestroyed()) return
    this.win.setBackgroundColor(this.o.background())
    frameWindow(this.win, { corner: 'round', border: this.o.border() })
  }

  private send(): void {
    if (!this.win || this.win.isDestroyed() || !this.ready) return
    const view: MenuView = {
      groups: this.groups.map(group => group.map(item => ({ letter: item.letter, label: item.label ?? t(`menu.${item.id}`) }))),
      ...(this.list ? { foot: this.list.foot } : {}),
      lit: this.lit,
      fired: this.fired,
    }
    this.win.webContents.send('to-view', { type: 'menu', view } satisfies ToView)
  }

  /** On the screen of the text cursor, inside its work area, without taking the keyboard; the thread learns where, for a click outside it. */
  private place(): void {
    const win = this.win
    if (!win || win.isDestroyed()) return
    const area = screen.getDisplayNearestPoint({ x: Math.round(this.at.x), y: Math.round(this.at.bottom) }).workArea
    const bounds = placeMenu(this.at, { width: WIDTH, height: this.height || HEIGHT }, area)
    win.setBounds(bounds)
    if (!win.isVisible()) win.showInactive()
    putOnTop(handleOf(win))
    if (!this.firing) this.o.keys(true, this.codes(), toScreen(win, win.getBounds()))
  }

  private window(): BrowserWindow {
    if (this.win && !this.win.isDestroyed()) return this.win
    const win = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      show: false,
      frame: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      // The program in front keeps the keyboard and its selection.
      focusable: false,
      title: t('app.name'),
      backgroundColor: this.o.background(),
      webPreferences: { preload: this.o.preload, contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
    })
    frameWindow(win, { corner: 'round', border: this.o.border() })
    win.setAlwaysOnTop(true, 'pop-up-menu')
    win.removeMenu()
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.webContents.on('will-navigate', event => event.preventDefault())
    this.o.log(win)
    win.on('closed', () => {
      if (this.win !== win) return
      this.win = undefined
      this.ready = false
      this.height = 0
    })
    void win.loadFile(this.o.page, { query: this.o.query() })
    this.win = win
    return win
  }
}
