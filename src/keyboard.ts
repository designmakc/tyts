// The main process's side of the keyboard helper (kbd-worker.ts): the thread
// runs only while one of its parts is on (the switch key, fixing as one types,
// the fix key, the layout badge) or a key field of the app window waits for a
// key (`record`), and gets the settings each time they change.
// The badge itself is a small window that never takes focus or clicks.

import * as path from 'node:path'
import { MessageChannel, Worker } from 'node:worker_threads'

import { BrowserWindow, screen } from 'electron'
import koffi from 'koffi'
import { loadLib } from './native'

import { isAccelerator, isCopyTwice } from './hotkey'
import type { LearnedConfig } from './learning'
import type { Rect } from './placement'
import { RECORD_MS, type KbdConfig, type KbdIn, type KbdOut, type KeyAction, type Learned } from './typist'
import type { KeyboardLayout } from './protocol'
import { myLanguages, type Settings } from './settings'
import { caretOf, foreground, installedLayouts } from './winkbd'
import { macKeyboardLayouts } from './kbdmac'

/** The Mac's keyboard helper (build/kbd-mac.swift), beside dist/ in vendor/. */
let macHelper = ''

const user32 = loadLib('user32.dll')
const PostThreadMessageW = user32.func('bool __stdcall PostThreadMessageW(uint32 tid, uint32 msg, uintptr w, intptr l)')
const WM_APP_PORT = 0x8000

/** The languages the layout fixer has word lists for (media/layout/<code>.txt). */
export const FIX_LANGUAGES = ['en', 'ru', 'uk', 'bg', 'mk', 'el', 'he', 'ar', 'fa', 'ka']

const BADGE = { width: 36, height: 22 }
/** With Caps Lock on, the badge says so too ("EN ⇪"). */
const BADGE_CAPS_WIDTH = 54
const BADGE_MS = 900
/** A word the badge says while Kryakl works stays up to this long, unless taken down sooner. */
const SAY_MS = 15_000

type MainAction = Exclude<KeyAction, 'switch' | 'fix' | 'layout'>

export type KeyboardEvents = {
  /** A fix was taken back: keep the word as typed from now on. */
  keep(word: string): void
  /** A word was fixed by itself: as typed, and what it became. */
  autoFixed(word: string, fixed: string): void
  /** The person fixed a word by hand; a word of theirs was typed right again (learning.ts). */
  fixedByHand(learned: Learned): void
  tally(hash: string, count: number, word?: Learned): void
  /** A learned fix that makes no word of a word, to forget. */
  unlearn(word: string): void
  /** A fix by hand was not learned: the field said it is a password or would not say; or it made no word of a word. */
  notLearned(why: 'field' | 'noWord'): void
  /** The fix key with a selection: convert it into the next of `cycle`; `layout` is the window's now. */
  selection(cycle: string[], layout: string): void
  /** A key Electron's shortcuts cannot hold, for selecting, snipping or a snip's text, was pressed. */
  hotkey(action: MainAction): void
  /** A dictation key went up again (hold to talk). */
  hotkeyUp(action: 'dictate' | 'english' | 'practice'): void
  /** The program in front lately; whether it runs as administrator. */
  app(exe: string, elevated: boolean): void
  /** The layout in front, and Caps Lock (for the tray's icon). */
  layout(layout: string, caps: boolean): void
  /** Another program pressed keys by itself. */
  foreignKeys(): void
  /** A key went down or up while a key field waits for one (`record`): KeyboardEvent.code, at (ms since 1970). */
  recorded(code: string, down: boolean, at: number): void
  /** A key the open menu took (KeyboardEvent.code). */
  menuKey(code: string): void
  /** Another key, a click elsewhere or another window closed the menu. */
  menuClosed(): void
  failed(message: string): void
}

/** Windows' keyboard layouts for the settings: the language's name in English and its short tag. */
export function keyboardLayouts(): KeyboardLayout[] {
  if (process.platform === 'darwin') return macKeyboardLayouts(macHelper)
  const names = new Intl.DisplayNames(['en'], { type: 'language' })
  return installedLayouts().map(l => {
    let name = l.tag || l.id
    try {
      if (l.tag) name = names.of(l.tag) ?? l.tag
    } catch {
      // A tag Intl does not know keeps its own form.
    }
    return { id: l.id, name, short: (l.tag.split('-')[0] ?? l.id).toUpperCase(), lang: (l.tag.split('-')[0] ?? '').toLowerCase() }
  })
}

export class KeyboardHelper {
  private worker: Worker | undefined
  private port: import('node:worker_threads').MessagePort | undefined
  private tid = 0
  private badge: BrowserWindow | undefined
  private badgeTimer: NodeJS.Timeout | undefined
  private shorts = new Map<string, string>()
  /** A part of the settings needs the thread; a key field waits for a key (and stops waiting by itself after RECORD_MS). */
  private needed = false
  private recording = false
  private recordTimer: NodeJS.Timeout | undefined

  constructor(
    private readonly workerPath: string,
    private readonly wordsDir: string,
    /** The sounds, out of the app's archive: Windows plays them from a file of its own. */
    private readonly soundsDir: string,
    private readonly events: KeyboardEvents,
  ) {
    macHelper = path.join(path.dirname(path.dirname(workerPath)), 'vendor', 'kbd-mac')
  }

  /**
   * Starts, configures or ends the thread for these settings: the layout keys
   * are always its, the others only when Electron's shortcuts cannot hold them
   * (a double tap of Ctrl, a side button of the mouse). Paused, it keeps the
   * pause key only, when that is its.
   */
  apply(s: Settings, learned: LearnedConfig): void {
    const keys: KbdConfig['keys'] = {}
    // Ctrl+C twice is the clipboard's (main.ts), never the thread's.
    const its = (key: string) => !!key && !isAccelerator(key) && !isCopyTwice(key)
    if (s.paused) {
      if (its(s.pauseKey)) keys.pause = s.pauseKey
    } else {
      if (s.switchKey && s.switchOn) keys.switch = s.switchKey
      if (s.fixKey && s.fixKeyOn) keys.fix = s.fixKey
      // Always the thread's, with a modifier too: Electron's shortcut would end what was typed before the menu's fix item could fix it.
      // On a Mac a key Electron can hold stays Electron's (main.ts registers it): it works without Accessibility.
      if (s.menuKey && !isCopyTwice(s.menuKey) && !(process.platform === 'darwin' && isAccelerator(s.menuKey))) keys.menu = s.menuKey
      for (const [action, key] of [
        ['select', s.selectKey],
        ['snip', s.snipKey],
        ['translate', s.translateKey],
        ['text', s.textKey],
        ['inPlace', s.inPlaceKey],
        ['check', s.checkKey],
        ['type', s.typeKey],
        ['typeCheck', s.typeCheckKey],
        ['dictate', s.dictateKey],
        ['english', s.englishKey],
        ['note', s.noteKey],
        ['again', s.againKey],
        ['practice', s.practiceKey],
        ['talk', s.talkKey],
        ['meeting', s.meetingKey],
        ['pause', s.pauseKey],
        ['window', s.windowKey],
        ['clipboard', s.clipboardHistory ? s.clipboardKey : ''],
      ] as const) {
        // Held to talk, a dictation key is the thread's whatever it is: only the thread sees it go up.
        const held = s.dictateHold && (action === 'dictate' || action === 'english' || action === 'practice') && !!key && !isCopyTwice(key)
        if (its(key) || held) keys[action] = key
      }
    }
    const on = !s.paused
    const layoutKeys = on && s.switchOn ? s.layoutKeys : {}
    const apps = Object.fromEntries(s.apps.map(a => [a.exe, { off: a.off, layout: a.layout }]))
    const watched = on && (s.autoFix || s.layoutBadge || s.trayLayout || s.switchSound || Object.keys(layoutKeys).length > 0 || s.apps.some(a => a.layout))
    this.needed = Object.keys(keys).length > 0 || watched
    if (!this.needed && !this.recording) return this.stop()
    const config: KbdConfig = {
      keys,
      layoutKeys,
      autoFix: on && s.autoFix,
      fixTwoCaps: s.fixTwoCaps,
      fixCapsLock: s.fixCapsLock,
      keepCaps: s.keepCaps,
      fixOnPause: s.fixOnPause,
      fixSound: s.fixSound,
      clickFile: path.join(this.soundsDir, 'fix.wav'),
      switchSound: on && s.switchSound,
      switchFiles: [1, 2, 3].map(n => path.join(this.soundsDir, 'switch', `${s.switchSoundName}-${n}.wav`)),
      badge: on && s.layoutBadge,
      trayLayout: on && s.trayLayout,
      cycle: s.layouts,
      languages: myLanguages(s),
      hold: s.dictateHold,
      apps: on ? apps : {},
      keepWords: s.keepWords,
      learn: on && s.learn,
      ...learned,
      quietFullScreen: s.quietFullScreen,
      words: Object.fromEntries(FIX_LANGUAGES.map(code => [code, path.join(this.wordsDir, `${code}.txt`)])),
    }
    // Kept for a key field alone: no part of it acts (nothing is fixed, so nothing is learned).
    if (!this.needed) config.learn = false
    const fresh = !this.worker
    if (fresh) this.start()
    this.post({ type: 'config', config })
    // A thread started during a dictation learns of it at once.
    if (fresh && this.dictatingNow) this.post({ type: 'dictating', on: true })
  }

  /** The main process is done with the selection: selected again, the fix key goes on with it. */
  converted(selected: boolean): void {
    this.post({ type: 'converted', selected })
  }

  /** A dictation started or ended: its keys then work in full screen too. */
  dictating(on: boolean): void {
    if (on === this.dictatingNow) return
    this.dictatingNow = on
    if (this.worker) this.post({ type: 'dictating', on })
  }

  private dictatingNow = false

  /**
   * A key field of the app window (`hwnd`) waits for a key, or no longer: the
   * thread reports the keys pressed there and keeps them from Windows, so
   * Ctrl+Esc, Shift+Caps Lock or Alt can be recorded; it starts for this when
   * nothing else needs it, and ends after. RECORD_MS at most, whatever the page says.
   */
  record(on: boolean, hwnd: bigint = 0n): void {
    if (this.recordTimer) clearTimeout(this.recordTimer)
    this.recordTimer = undefined
    this.recording = on
    if (on) {
      if (!this.worker) {
        this.start()
        if (this.dictatingNow) this.post({ type: 'dictating', on: true })
      }
      this.post({ type: 'record', on: true, hwnd })
      this.recordTimer = setTimeout(() => this.record(false), RECORD_MS)
      return
    }
    if (!this.worker) return
    if (this.needed) this.post({ type: 'record', on: false })
    else this.stop()
  }

  /** The menu on one key opened or closed: while open the thread takes its keys (`codes`), and knows where it is on the screen (`rect`, physical pixels). */
  menu(on: boolean, codes: string[] = [], rect?: Rect): void {
    this.post(rect ? { type: 'menu', on, codes, rect } : { type: 'menu', on, codes })
  }

  /** The fix key's action, asked by the menu. */
  fixNow(): void {
    this.post({ type: 'fix' })
  }

  /** A Mac: Cmd+V through the running helper; false when it does not run. */
  paste(): boolean {
    if (!this.worker) return false
    this.post({ type: 'paste' })
    return true
  }

  /** Switches the window in front to a layout. */
  switchTo(layout: string): void {
    this.post({ type: 'switchTo', layout })
  }

  dispose(): void {
    if (this.recordTimer) clearTimeout(this.recordTimer)
    this.recording = false
    this.stop()
    this.badge?.destroy()
    this.badge = undefined
  }

  private start(): void {
    const { port1, port2 } = new MessageChannel()
    // On a Mac the keys come from a CGEventTap (kbdmac-worker.ts), to the same Typist.
    const mac = process.platform === 'darwin'
    const file = mac ? path.join(path.dirname(this.workerPath), 'kbdmac-worker.js') : this.workerPath
    const worker = new Worker(file, { workerData: { port: port2, ...(mac ? { helper: macHelper } : {}) }, transferList: [port2] })
    this.worker = worker
    this.port = port1
    this.tid = 0
    port1.on('message', (message: KbdOut) => this.onMessage(message))
    worker.on('error', error => this.events.failed(error.message))
    worker.on('exit', () => {
      if (this.worker !== worker) return
      this.worker = undefined
      this.port?.close()
      this.port = undefined
    })
  }

  private stop(): void {
    const worker = this.worker
    if (!worker) return
    this.post({ type: 'quit' })
    this.worker = undefined
    this.port?.close()
    this.port = undefined
    // The thread unhooks and ends by itself; a stuck one is ended anyway.
    setTimeout(() => void worker.terminate(), 1000)
  }

  private post(message: KbdIn): void {
    this.port?.postMessage(message)
    if (this.tid) PostThreadMessageW(this.tid, WM_APP_PORT, 0, 0)
  }

  private onMessage(message: KbdOut): void {
    switch (message.type) {
      case 'thread':
        this.tid = message.tid
        PostThreadMessageW(this.tid, WM_APP_PORT, 0, 0)
        return
      case 'layout':
        if (message.badge) this.showBadge(message.layout, message.caps, message.caret)
        this.events.layout(message.layout, message.caps)
        return
      case 'keep':
        this.events.keep(message.word)
        return
      case 'autoFixed':
        this.events.autoFixed(message.word, message.fixed)
        return
      case 'fixedByHand':
        this.events.fixedByHand({ word: message.word, lang: message.lang })
        return
      case 'tally':
        this.events.tally(message.hash, message.count, message.word)
        return
      case 'unlearn':
        this.events.unlearn(message.word)
        return
      case 'notLearned':
        this.events.notLearned(message.why)
        return
      case 'selection':
        this.events.selection(message.cycle, message.layout)
        return
      case 'hotkey':
        this.events.hotkey(message.action)
        return
      case 'hotkeyUp':
        this.events.hotkeyUp(message.action)
        return
      case 'app':
        this.events.app(message.exe, message.elevated)
        return
      case 'foreignKeys':
        this.events.foreignKeys()
        return
      case 'recorded':
        this.events.recorded(message.code, message.down, message.at)
        return
      case 'menuKey':
        this.events.menuKey(message.code)
        return
      case 'menuClosed':
        this.events.menuClosed()
        return
      case 'note':
        console.warn(`Tyts keyboard: ${message.text}`)
        return
      case 'error':
        this.events.failed(message.message)
        return
    }
  }

  // ---------------------------------------------------------------- the badge

  shortOf(layout: string): string {
    if (!this.shorts.has(layout)) for (const l of keyboardLayouts()) this.shorts.set(l.id, l.short)
    return this.shorts.get(layout) ?? '?'
  }

  /** A word in the badge by the text cursor while Kryakl works there (Translate in place); empty hides it. */
  say(text: string, ms = SAY_MS): void {
    if (!text) {
      if (this.badgeTimer) clearTimeout(this.badgeTimer)
      if (this.badge && !this.badge.isDestroyed()) this.badge.hide()
      return
    }
    const front = foreground()
    // A word or two: the badge as wide as its text (its mono caption, about 7 px a letter).
    const width = Math.max(BADGE.width, Math.ceil(text.length * 7.2) + 18)
    this.showBadgeText(text, { width, height: BADGE.height }, front.tid ? caretOf(front.tid) : undefined, ms)
  }

  /** Shows the layout's short name (and Caps Lock, when on) by the text cursor (physical pixels), or by the pointer when the program has no system cursor. */
  private showBadge(layout: string, caps: boolean, caret: { x: number; y: number; h: number } | undefined): void {
    const size = { width: caps ? BADGE_CAPS_WIDTH : BADGE.width, height: BADGE.height }
    this.showBadgeText(`${this.shortOf(layout)}${caps ? ' ⇪' : ''}`, size, caret, BADGE_MS)
  }

  private showBadgeText(text: string, size: { width: number; height: number }, caret: { x: number; y: number; h: number } | undefined, ms: number): void {
    const win = this.badgeWindow()
    const at = caret ? screen.screenToDipPoint({ x: caret.x, y: caret.y + caret.h }) : screen.getCursorScreenPoint()
    const offset = caret ? { x: 0, y: 4 } : { x: 14, y: 20 }
    const area = screen.getDisplayNearestPoint(at).workArea
    const x = Math.round(Math.min(Math.max(area.x, at.x + offset.x), area.x + area.width - size.width))
    const y = Math.round(Math.min(Math.max(area.y, at.y + offset.y), area.y + area.height - size.height))
    win.setBounds({ x, y, ...size })
    void win.webContents.executeJavaScript(`document.getElementById('badge').textContent = ${JSON.stringify(text)}`).catch(() => undefined)
    win.showInactive()
    if (this.badgeTimer) clearTimeout(this.badgeTimer)
    this.badgeTimer = setTimeout(() => win.hide(), ms)
  }

  private badgeWindow(): BrowserWindow {
    if (this.badge && !this.badge.isDestroyed()) return this.badge
    const win = new BrowserWindow({
      ...BADGE,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      focusable: false,
      skipTaskbar: true,
      hasShadow: false,
      alwaysOnTop: true,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false },
    })
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setIgnoreMouseEvents(true)
    void win.loadFile(path.join(path.dirname(this.wordsDir), 'badge.html'))
    this.badge = win
    return win
  }
}
