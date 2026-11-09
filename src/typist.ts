// What the keyboard helper does with each key and click, apart from Windows
// (kbd-worker.ts feeds it from the hooks and lends it Windows through
// `TypistEnv`). It keeps the keys typed since the last click (never what they
// spell, and nothing on disk), and:
//   - the switch key moves the window in front to the next layout; a layout's
//     own key, to that layout;
//   - a word typed in the wrong layout is erased and typed again in the right
//     one when it ends, with the short words just before it that were meant
//     there too; a stray capital is set right (the fix key at once takes the
//     fix back; Backspace is only Backspace);
//   - the fix key types the words at the end of what was typed, that read as
//     words in another layout, again in it (again: the next layout), or asks
//     the main process to convert the selection;
//   - it learns from the person's typing: a word fixed by hand, a word of
//     theirs typed right again and again (learning.ts keeps them);
//   - a change of layout in front is reported, for the badge by the cursor;
//   - the other keys Electron's shortcuts cannot hold (a double tap of Ctrl,
//     a mouse button, Ctrl+Esc) are reported to the main process, which acts on them;
//   - while a key field of Kryakl's waits for a key, every key goes to it and
//     to nothing else (Ctrl+Esc opens no Start, Shift+Caps Lock turns nothing).
// Words in a password field are never fixed nor learned; in a program on the
// full screen (a game, a presentation) nothing is done at all.

import { createHash } from 'node:crypto'

import { codeOfVk, DOUBLE_MS, modOf, parseHotkey, type HotkeySpec, type Mod } from './hotkey'
import {
  bestLayout,
  caseSlip,
  charOf,
  chooseFix,
  convertText,
  coreOf,
  learnable,
  layoutsAfter,
  nextLayout,
  plausibility,
  rankOf,
  typeIn,
  withWords,
  wordsMeant,
  type KeyTable,
  type Lexicon,
  type Reading,
  type Stroke,
} from './layoutfix'
import { MENU_MOVES } from './menu'
import type { Rect } from './placement'
import type { Press } from './winkbd'

/** What a key does: switch or fix the layout here, or go to one layout; the others are the main process's. */
export type KeyAction =
  | 'switch'
  | 'fix'
  | 'layout'
  | 'select'
  | 'snip'
  | 'translate'
  | 'text'
  | 'inPlace'
  | 'check'
  | 'type'
  | 'typeCheck'
  | 'dictate'
  | 'english'
  | 'note'
  | 'again'
  | 'practice'
  | 'talk'
  | 'meeting'
  | 'pause'
  | 'window'
  | 'menu'
  | 'clipboard'

/** The parts of the keyboard helper a program can be left out of: fixing as one types, the switch and layout keys, the badge, every key of Kryakl's. */
export type AppPart = 'fix' | 'switch' | 'badge' | 'keys'

/** The field's answer to "is it a password?": yes, no, or it would not say. */
export type FieldAnswer = boolean | 'unknown'

/**
 * Programs whose typing teaches no words: terminals (a password typed at ssh or sudo is in a field
 * that says it is no password) and password managers. Fixing still works there.
 */
export const UNLEARNED_APPS: ReadonlySet<string> = new Set([
  'windowsterminal.exe',
  'conhost.exe',
  'openconsole.exe',
  'cmd.exe',
  'powershell.exe',
  'pwsh.exe',
  'wsl.exe',
  'mintty.exe',
  'putty.exe',
  'kitty.exe',
  'mobaxterm.exe',
  'alacritty.exe',
  'wezterm-gui.exe',
  'tabby.exe',
  'conemu.exe',
  'conemu64.exe',
  'hyper.exe',
  'warp.exe',
  'termius.exe',
  'keepass.exe',
  'keepassxc.exe',
  '1password.exe',
  'bitwarden.exe',
  'enpass.exe',
  'dashlane.exe',
  'proton pass.exe',
  // A Mac's, by the program's own name.
  'terminal',
  'iterm2',
  'ghostty',
  'alacritty',
  'kitty',
  'wezterm-gui',
  '1password',
  'bitwarden',
  'keepassxc',
])

/** The keys that start and stop a dictation; the menu's starts one from its items. */
const DICTATION_ACTIONS: ReadonlySet<KeyAction> = new Set(['dictate', 'english', 'note', 'practice', 'menu'])

/** A word learned from the person's typing: as typed (lower case), and the language it goes into, or belongs to. */
export type Learned = { word: string; lang: string }

export type KbdConfig = {
  /** The key of each action this thread watches for (hotkey.ts); an action left out has none here. */
  keys: Partial<Record<Exclude<KeyAction, 'layout'>, string>>
  /** Hold to talk (`dictateHold`): a dictation key that is a modifier tapped alone acts as it goes down, so its release can finish the phrase. */
  hold?: boolean
  /** A key per layout (id → key), for going to that layout at once. */
  layoutKeys: Record<string, string>
  autoFix: boolean
  /** Fixing as one types also sets right two capitals at a word's start, and a word typed with Caps Lock left on. */
  fixTwoCaps: boolean
  fixCapsLock: boolean
  /** Words in capitals are left as typed. */
  keepCaps: boolean
  /** A word is fixed after a second without a key too, not only when it ends. */
  fixOnPause: boolean
  /** A quiet click when a word is fixed by itself (`clickFile`, a .wav). */
  fixSound: boolean
  clickFile: string
  /** A sound when the person switches the layout (`switchFiles`: English's note, then the other layouts' lower ones). */
  switchSound: boolean
  switchFiles: string[]
  badge: boolean
  /** The layout in front is reported for the tray's icon too. */
  trayLayout: boolean
  /** The layouts the keys go through, in order (ids); all of Windows' when empty. */
  cycle: string[]
  /** The languages the person uses (codes): with no layouts chosen, the keys go through those of Windows' in them. */
  languages: string[]
  /** Programs by .exe name, the parts left out there and the layout each starts in ('' for none). */
  apps: Record<string, { off: AppPart[]; layout: string }>
  keepWords: string[]
  /** Learning from the person's typing (learning.ts): on, what it learned, and the fingerprints of words typed right so far. */
  learn: boolean
  alwaysFix: Learned[]
  myWords: Learned[]
  tally: Record<string, number>
  salt: string
  /** Nothing is done while a program fills the screen (a game, a presentation, a video). */
  quietFullScreen: boolean
  /** The word lists by language code (media/layout/<code>.txt). */
  words: Record<string, string>
}

export type KbdIn =
  | { type: 'config'; config: KbdConfig }
  | { type: 'switchTo'; layout: string }
  /** The main process is done with the selection: converted and selected again (`selected`), the fix key goes on with it. */
  | { type: 'converted'; selected: boolean }
  /** A dictation started or ended: while it runs, its keys work on the full screen too, so it can always be stopped. */
  | { type: 'dictating'; on: boolean }
  /** A key field of the app window (`hwnd`) waits for a key: the keys pressed there are reported and kept from Windows, `RECORD_MS` at most; `on: false` ends it. */
  | { type: 'record'; on: boolean; hwnd?: bigint }
  /**
   * Kryakl's menu (the menu key) is open by the window in front, or no longer: its letters (`codes`, KeyboardEvent.code),
   * ↑ ↓, Enter and Esc go to it alone, as `menuKey`; any other key, or a click outside `rect` (physical pixels), closes it and goes on.
   */
  | { type: 'menu'; on: boolean; codes?: string[]; rect?: Rect }
  /** The fix key's action, asked by the menu's item. */
  | { type: 'fix' }
  /** A Mac: Cmd+V pressed by the helper itself, marked as Kryakl's, so its tap lets it through. */
  | { type: 'paste' }
  | { type: 'quit' }

export type KbdOut =
  /** The thread to wake after posting: the first message. */
  | { type: 'thread'; tid: number }
  /** The layout in front changed, or Caps Lock did (the first look too, for the tray's icon); `badge`: show it by the text cursor, whose place in physical pixels comes when the program has a system one. */
  | { type: 'layout'; layout: string; caps: boolean; badge: boolean; caret?: Caret }
  /** A fix was taken back: the word, as typed, is kept from now on. */
  | { type: 'keep'; word: string }
  /** A word was fixed by itself, in a field not known to be a password: as typed (as Kept as typed would hold it) and what it became; the tray offers to keep it. */
  | { type: 'autoFixed'; word: string; fixed: string }
  /** The person fixed a word by hand (the fix key, or erased and typed again in another layout): as typed, and the language it went into. */
  | { type: 'fixedByHand'; word: string; lang: string }
  /** A word of the person's, in no list, was typed right once more (`count` times by its fingerprint); at `LEARN_AFTER`, the word itself. */
  | { type: 'tally'; hash: string; count: number; word?: Learned }
  /** A learned fix that turns a word of its list into no word ("привет" → "ghbdtn"): forgotten, as typed. */
  | { type: 'unlearn'; word: string }
  /** Something learned was dropped, for the log: `field`, the field said it is a password or would not say; `noWord`, the fix made no word of a word. */
  | { type: 'notLearned'; why: 'field' | 'noWord' }
  /** The fix key with a selection: the main process copies it, converts it into the next layout and pastes it; `layout` is the window's now. */
  | { type: 'selection'; cycle: string[]; layout: string }
  /** The program in front, by its .exe name, when it changes; `elevated`: it runs as administrator, so its keys never reach the hooks. */
  | { type: 'app'; exe: string; elevated: boolean }
  /** A key of the main process's was pressed. */
  | { type: 'hotkey'; action: Exclude<KeyAction, 'switch' | 'fix' | 'layout'> }
  /** A dictation key (not a tap of a modifier) went up again: held to talk, its phrase finishes (holdtalk.ts). */
  | { type: 'hotkeyUp'; action: 'dictate' | 'english' | 'practice' }
  /** Another program pressed keys by itself, for the first time since the thread started. */
  | { type: 'foreignKeys' }
  /** A key went down or up while a key field waits (`record`), as KeyboardEvent.code names it ('' for a key no hotkey names), at `at` (ms since 1970). */
  | { type: 'recorded'; code: string; down: boolean; at: number }
  /** A key the open menu took: one of its letters, ArrowUp, ArrowDown, Enter or Escape, as KeyboardEvent.code names it. */
  | { type: 'menuKey'; code: string }
  /** Another key, a click outside, or another window in front closed the menu; the key or click went on. */
  | { type: 'menuClosed' }
  | { type: 'error'; message: string }
  /** A line for tyts.log of how the thread is doing (counts only, never what was typed). */
  | { type: 'note'; text: string }

export type Caret = { x: number; y: number; h: number }
export type Front = { hwnd: bigint; tid: number; pid: number }

/** What the typist needs of Windows. */
export type TypistEnv = {
  now(): number
  foreground(): Front
  /** The layout a thread types in, by id. */
  layoutOf(tid: number): string
  /** A layout Windows has: its language code and what its keys type. */
  layout(id: string): { lang: string; table: KeyTable } | undefined
  /** The layouts Windows has, in its order. */
  installed(): string[]
  exeOf(pid: number): string
  /** Whether a process runs as administrator (its keys never reach the hooks). */
  elevated(pid: number): boolean
  /** The keyboard helper's own program, never reported as the one typed in. */
  ownExe: string
  switchLayout(hwnd: bigint, layout: string): void
  press(keys: readonly Press[]): void
  /** Calls `typeFix` once the hook has answered. */
  later(): void
  /** Once the hook has answered, presses a key that types nothing and lets go of `vk` (Alt or Win), so no menu opens. */
  mask(vk: number): void
  /** Asks whether the field with the keyboard in this window is a password; the answer comes later, to `fieldIs`. */
  askField(front: Front): void
  /** Whether a program fills the screen now (a game, a presentation). */
  fullScreen(): boolean
  /** The quiet click of a word fixed by itself. */
  click(): void
  /** The sound of a layout switch, in a note: 0 English's, then lower. */
  chime(note: number): void
  caretOf(tid: number): Caret | undefined
  /** Whether Caps Lock is on, as the window in front sees it. */
  capsOf(front: Front): boolean
  send(message: KbdOut): void
  doubleClickMs: number
}

/** A mouse button or the wheel; `x-down` and `x-up` are a side button's, with its number (1 back, 2 forward). */
export type MouseEvent = 'left-down' | 'left-up' | 'other-down' | 'x-down' | 'x-up' | 'wheel'

const VK_BACK = 0x08
const VK_TAB = 0x09
const VK_RETURN = 0x0d
const VK_CAPITAL = 0x14
const VK_DELETE = 0x2e
const VK_A = 0x41
/** A conversion of the selection not done by then is taken as lost (the main process answers in a second or two). */
const CONVERT_MS = 5000
/** Presses kept while a conversion runs: each one more layout round the cycle. */
const AGAIN_MOST = 4
/** Keys that move the text cursor, PageUp to Down, and Delete. */
const MOVES = new Set([0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, VK_DELETE])

/** Keys that type nothing, which programs press to keep Alt or Win from opening a menu (0xE8 is AutoHotkey's, 0xFF PowerToys'). */
export const MASK_KEYS: ReadonlySet<number> = new Set([0x07, 0xe8, 0xff])
const VK_LCONTROL = 0xa2
/** The scan code of the Left Ctrl that AltGr sends with Right Alt. */
const ALTGR_CTRL_SCAN = 0x21d
/** Alt and Win, left and right: tapped alone, they open a program's menu or Start. */
const MENU_KEYS: ReadonlySet<number> = new Set([0xa4, 0xa5, 0x5b, 0x5c])

/** A key field waits for a key this long at most: then the keys are Windows' again, whatever the page said. */
export const RECORD_MS = 20_000
/** The menu left open this long stops taking keys, whatever the main process said. */
export const MENU_MS = 120_000

/** Caps Lock is asked of Windows again when the last answer is older than this (Windows may turn it off on Shift). */
const CAPS_FRESH_MS = 1000
/** After Kryakl switches a window's layout, Windows may go on naming the old one for a while: the new one is trusted until Windows agrees, or this long. */
const SWITCH_TRUST_MS = 3000

/** A modifier tapped alone counts while held no longer than this. */
const TAP_MS = 600
/** The keys kept: enough for a few sentences. */
const MAX_RUN = 500
/** A word stopped at this long without a key is fixed then, when fixing on a pause is on. */
export const PAUSE_MS = 1000
/** Keys erased are compared with a word typed again in another layout this long after. */
const ERASED_MS = 10_000
/** A word of the person's typed right this many times is learned. */
export const LEARN_AFTER = 3
/** An answer about the field that does not come in this long is taken as "no password". */
const FIELD_WAIT_MS = 300

type Typed = Stroke & { end: boolean }
type Span = { start: number; end: number }
type Bound = { action: KeyAction; spec: HotkeySpec; layout?: string }
type Fix = {
  erase: number
  text: string
  key?: number
  to: string
  hwnd: bigint
  /** Caps Lock is pressed first: off after a word typed with it left on, on again when that fix is taken back. */
  toggleCaps?: boolean
  /** Fixed by itself (the click sounds), not by the fix key. */
  auto?: boolean
  /** What to press instead when the fix is called off (a password field): the key that ended the word, as typed. */
  plain?: Press[]
  /** Undoes what deciding the fix changed, when it is called off. */
  undo?: () => void
  /** A fix by itself, once typed: the word as typed and what it became, for the main process. */
  report?: { word: string; fixed: string }
}

export class Typist {
  private config: KbdConfig = {
    keys: {},
    layoutKeys: {},
    autoFix: false,
    fixTwoCaps: false,
    fixCapsLock: false,
    keepCaps: false,
    fixOnPause: false,
    fixSound: false,
    clickFile: '',
    switchSound: false,
    switchFiles: [],
    badge: false,
    trayLayout: false,
    cycle: [],
    languages: [],
    apps: {},
    keepWords: [],
    learn: false,
    alwaysFix: [],
    myWords: [],
    tally: {},
    salt: '',
    quietFullScreen: false,
    words: {},
  }
  private keys: Bound[] = []
  private keep = new Set<string>()
  private always = new Map<string, string>()
  /** The person's own words (learned), by `mineKey`. */
  private mine = new Set<string>()
  private tally = new Map<string, number>()
  private lexicons: Record<string, Lexicon> = {}

  /** The keys typed in the window `runWindow` since the last click, move or shortcut. */
  private run: Typed[] = []
  private runWindow = 0n
  /** Where in the run the person switched the layout: the fix key never reaches back over it. */
  private boundary = 0
  /** The person just switched the layout: the next word is as they meant it. */
  private trustNext = false
  /** The layout the last key was typed in, in which window. */
  private lastLayout: { hwnd: bigint; layout: string } | undefined
  /** The layout Kryakl switched to by itself, until the next key: a change to it is not the person's. */
  private ownSwitch: string | undefined
  /** What was done last: typing (the fix key fixes it), selecting (it converts the selection), or something else. */
  private last: 'typed' | 'selected' | 'none' = 'none'
  /** The last word fixed by itself, taken back by the fix key right after. */
  private autoFixed: { start: number; end: number; from: string; word: string; typed: Typed[]; capsOff: boolean } | undefined
  /** The fix key's last conversion of typed keys: pressed again, it goes on to the next layout; typing on, it is learned. */
  private cycling: { start: number; end: number; to: string; from: string; words: Span[] } | undefined
  /** The main process is converting the selection, since when; the fix key pressed meanwhile goes on with it once it is selected again (`again` times). */
  private converting: { since: number; again: number } | undefined
  /** A fix waiting to be typed; keys pressed meanwhile wait for it, then are pressed again. */
  private pending: Fix | undefined
  /** Waiting for the answer about the field before typing `pending`. */
  private asking: { since: number } | undefined
  private queued: { vk: number; scan: number; up: boolean }[] = []
  /**
   * The field typed in is a password (true), is not (false), would not say ('unknown': no answer, or
   * none in time), or was not asked about since the run began. Only a field that said it is no
   * password teaches words; one that would not say is still fixed, as before the question.
   */
  private secret: FieldAnswer | undefined
  /** Learning that waits for the answer about the field. */
  private toLearn: KbdOut[] = []
  /** The keys erased by Backspace lately, first one first, for a word typed again in another layout; `erasing` while Backspaces go on. */
  private erased: { strokes: Typed[]; at: number; hwnd: bigint } | undefined
  private erasing = false
  /** A word of the person's typed right, counted once typing goes on past it (not erased). */
  private candidate: { word: string; lang: string } | undefined
  /** When a key was last typed, and whether the word stopped there was looked at for a fix. */
  private typedAt = 0
  private pauseChecked = true
  private held = new Set<number>()
  /** Keys whose press was a hotkey: their release is kept from the program too. */
  private swallowed = new Set<number>()
  /** A modifier pressed alone, and the modifiers pressed together since none was held. */
  private tap: { vk: number; since: number; held?: boolean } | undefined
  private chord = { mods: new Set<Mod>(), clean: false }
  /** The last tap of a modifier: when it was let go, and the layout before it, if it switched one (a double takes that back). */
  private lastTap: { vk: number; at: number; before?: string } | undefined
  /** Side buttons that were a hotkey: their release is kept from the program too. */
  private swallowedButtons = new Set<number>()
  private lastDown: { x: number; y: number; time: number; double: boolean } | undefined
  private shown = { layout: '', caps: false }
  private reportedExe = ''
  private frontWindow = 0n
  /** Caps Lock, as last asked of Windows (or flipped by its key since), and when. */
  private caps = false
  private capsAt = Number.NEGATIVE_INFINITY
  /** The layout Kryakl last switched a window to, trusted over Windows' late answer. */
  private expected: { hwnd: bigint; layout: string; until: number } | undefined
  /** For the switch's sound: the layout last heard in front, and the last switch Kryakl made (silent, or sounded already). */
  private heard: { hwnd: bigint; layout: string } | undefined
  private made: { hwnd: bigint; layout: string } | undefined
  /** A key field waits for a key in this window, until then; the keys it took down, whose release it takes too. */
  private recording: { hwnd: bigint; until: number } | undefined
  private recordDown = new Set<number>()
  /** The menu is open over this window, until then: the keys it takes, and where it is on the screen (physical pixels). */
  private menuOpen: { codes: ReadonlySet<string>; rect: Rect | undefined; hwnd: bigint; until: number } | undefined
  /** The left button went down on the menu: its release is the menu's too. */
  private clickInMenu = false
  /** A dictation key held down: its release is told (hold to talk). */
  private holdKey: { vk: number; action: 'dictate' | 'english' | 'practice' } | undefined

  constructor(private readonly env: TypistEnv) {}

  configure(config: KbdConfig, lexicons: Readonly<Record<string, Lexicon>>): void {
    this.config = config
    const keys: Bound[] = []
    for (const [action, key] of Object.entries(config.keys) as [KeyAction, string][]) {
      const spec = parseHotkey(key)
      if (spec) keys.push({ action, spec })
    }
    for (const [layout, key] of Object.entries(config.layoutKeys)) {
      const spec = parseHotkey(key)
      if (spec) keys.push({ action: 'layout', spec, layout })
    }
    this.keys = keys
    this.keep = new Set(config.keepWords.map(w => w.toLowerCase()))
    this.always = new Map(config.alwaysFix.map(l => [l.word, l.lang]))
    this.mine = new Set(config.myWords.map(l => mineKey(l.lang, l.word)))
    this.tally = new Map(Object.entries(config.tally))
    const mine = new Map<string, string[]>()
    for (const { word, lang } of config.myWords) mine.set(lang, [...(mine.get(lang) ?? []), word])
    this.lexicons = Object.fromEntries(Object.entries(lexicons).map(([lang, lexicon]) => [lang, withWords(lexicon, mine.get(lang) ?? [])]))
    this.forgetNoWords()
  }

  /** Learned fixes that turn a word of its list into no word are dropped here and forgotten (learned before `learnable` held them back). */
  private forgetNoWords(): void {
    const layouts = this.cycle().flatMap(id => {
      const info = this.env.layout(id)
      return info ? [{ id, ...info }] : []
    })
    for (const [word, lang] of this.always) {
      const typing = layouts.filter(l => l.lang !== lang && [...word].every(c => !/\p{L}/u.test(c) || l.table.keys.has(c)))
      const from = typing.find(l => rankOf(this.lexicons[l.lang], word) !== undefined) ?? typing[0]
      const to = layouts.find(l => l.lang === lang)
      if (!from || !to) continue
      const typed: Reading = { layout: from.id, lang: from.lang, text: word }
      const there: Reading = { layout: to.id, lang, text: convertText(word, from.table, to.table) }
      if (learnable(typed, there, this.lexicons)) continue
      this.always.delete(word)
      this.env.send({ type: 'unlearn', word })
    }
  }

  /**
   * The layouts the keys go through: those chosen that Windows has; else
   * Windows' layouts in the languages the person uses, when two or more are
   * (a layout added once for another language stays out of the way); else all.
   */
  cycle(): string[] {
    const chosen = this.config.cycle.filter(id => this.env.layout(id))
    if (chosen.length > 0) return chosen
    const all = this.env.installed()
    const mine = all.filter(id => this.config.languages.includes(this.env.layout(id)?.lang ?? ''))
    return mine.length >= 2 ? mine : all
  }

  /** Whether a part is off in the program in front. */
  private offHere(part: AppPart, front = this.env.foreground()): boolean {
    return this.config.apps[this.env.exeOf(front.pid)]?.off.includes(part) ?? false
  }

  private quiet(): boolean {
    return this.config.quietFullScreen && this.env.fullScreen()
  }

  /** A dictation is running (the main process says): its keys stay on in full screen. */
  private dictating = false

  setDictating(on: boolean): void {
    this.dictating = on
  }


  // ---------------------------------------------------------------- keys

  /**
   * A key went down or up; `own`: pressed by Kryakl itself; `foreign`: by
   * another program. True keeps it from the program.
   */
  key(vk: number, scan: number, down: boolean, own = false, foreign = false): boolean {
    if (own) return false
    // Right Alt in a layout with AltGr (Russian's ₽, Ukrainian's ґ) comes with a Left Ctrl Windows makes up: no key of the person's, or Right Alt would never be tapped alone.
    if (vk === VK_LCONTROL && scan === ALTGR_CTRL_SCAN) return false
    if (foreign) {
      this.foreignKey(vk, down)
      return false
    }
    if (this.recordKey(vk, down)) return true
    if (down && this.menuKey(vk)) return true
    if (!down && this.holdKey?.vk === vk) {
      this.env.send({ type: 'hotkeyUp', action: this.holdKey.action })
      this.holdKey = undefined
    }
    // Typed while a fix is on its way: pressed again after it.
    if (this.pending) {
      this.queued.push({ vk, scan, up: !down })
      return true
    }
    const mod = modOf(vk)
    if (!down) {
      this.held.delete(vk)
      // An Alt or Win tap that is one of Kryakl's keys: its key-up is let go later, after a key that types nothing (VS Code's menu bar took the focus from its chat).
      if (mod && this.onModifierUp(vk)) {
        this.env.mask(vk)
        return true
      }
      return this.swallowed.delete(vk)
    }
    const repeat = this.held.has(vk)
    this.held.add(vk)
    if (this.quiet()) {
      // A game or a presentation: no key of Kryakl's, no fixing; modifiers are still followed, so none seems held after.
      // But a dictation started before the full screen must still stop with its key: its taps and keys are read, and only they act (`allowed`); nothing typed is fixed.
      if (this.dictating && mod) {
        if (!repeat) this.onModifierDown(vk)
        return false
      }
      this.spoilTap()
      const hotkey = this.dictating ? this.hotkeyOf(vk, this.heldMods()) : undefined
      if (hotkey && this.allowed(hotkey)) {
        this.swallowed.add(vk)
        if (!repeat) this.act(hotkey)
        return true
      }
      this.resetRun()
      this.last = 'none'
      return false
    }
    if (mod) {
      if (!repeat) this.onModifierDown(vk)
      return false
    }
    this.spoilTap()
    const mods = this.heldMods()
    const hotkey = this.hotkeyOf(vk, mods) ?? this.fixAfterShift(vk, mods)
    if (hotkey && this.allowed(hotkey)) {
      this.swallowed.add(vk)
      if (!repeat) this.act(hotkey)
      return true
    }
    if (vk === VK_CAPITAL) {
      // Windows turns it as the key goes down; asked right now, it would not know yet.
      if (!repeat) {
        this.caps = !this.caps
        this.capsAt = this.env.now()
      }
      return false
    }
    return this.onTyping(vk, mods)
  }

  /** A key field of Kryakl's waits for a key in window `hwnd` (`on`), or no longer. */
  record(on: boolean, hwnd = 0n): void {
    this.recording = on ? { hwnd, until: this.env.now() + RECORD_MS } : undefined
  }

  /**
   * While a key field waits and its window is in front, a key goes to the field
   * alone: reported, and kept from Windows and every program (Ctrl+Esc opens no
   * Start, Alt no menu, Caps Lock turns nothing). A key let go is kept too when
   * its press was, even once the field is done; a key held from before goes up
   * as usual. True keeps it.
   */
  private recordKey(vk: number, down: boolean): boolean {
    const at = this.env.now()
    if (!down) {
      if (!this.recordDown.delete(vk)) return false
      this.env.send({ type: 'recorded', code: codeOfVk(vk) ?? '', down: false, at })
      return true
    }
    const r = this.recording
    if (!r) return false
    if (at > r.until) {
      this.recording = undefined
      return false
    }
    if (this.env.foreground().hwnd !== r.hwnd) return false
    // Held down, Windows repeats it: the field has it already.
    if (this.recordDown.has(vk)) return true
    this.recordDown.add(vk)
    this.spoilTap()
    this.last = 'none'
    this.env.send({ type: 'recorded', code: codeOfVk(vk) ?? '', down: true, at })
    return true
  }

  /** Kryakl's menu opened over the window in front (its letters, `codes`; `rect`: where it is, once known), or closed by the main process. */
  menu(on: boolean, codes: readonly string[] = [], rect?: Rect): void {
    this.menuOpen = on ? { codes: new Set(codes), rect, hwnd: this.env.foreground().hwnd, until: this.env.now() + MENU_MS } : undefined
  }

  /** The fix key's action, asked by the menu's item: what was typed or selected before the menu opened is still there. */
  fixNow(): void {
    this.fixKey()
  }

  /** Closes the menu from here: the main process hides it. */
  private closeMenu(): void {
    this.menuOpen = undefined
    this.env.send({ type: 'menuClosed' })
  }

  /**
   * A key went down while the menu is open. Its letters (by physical key, so in
   * any layout, Shift or not), the arrows, Enter and Esc go to it alone, their
   * release too, and leave what was typed as it is, for the fix item. A modifier
   * passes and the menu stays; so does the menu key, which closes it by the usual
   * way. Any other key, or one with Ctrl, Alt or Win, closes it and goes on to
   * the program. True keeps it.
   */
  private menuKey(vk: number): boolean {
    const m = this.menuOpen
    if (!m) return false
    if (this.env.now() > m.until || this.env.foreground().hwnd !== m.hwnd) {
      this.closeMenu()
      return false
    }
    if (modOf(vk)) return false
    // Held down, Windows repeats it: the menu has it already; a key held from before the menu is no answer to it.
    if (this.swallowed.has(vk)) return true
    if (this.held.has(vk)) return false
    const mods = this.heldMods()
    if (this.hotkeyOf(vk, mods)?.action === 'menu') return false
    const code = codeOfVk(vk) ?? ''
    if (!mods.has('Control') && !mods.has('Alt') && !mods.has('Super') && (MENU_MOVES.has(code) || m.codes.has(code))) {
      this.swallowed.add(vk)
      this.spoilTap()
      this.env.send({ type: 'menuKey', code })
      return true
    }
    this.closeMenu()
    return false
  }

  /**
   * A mouse event while the menu is open. A click on it is its own: the text
   * under it keeps what was typed. A click anywhere else closes it and goes on
   * (the menu's own side button closes it by the usual way). True: it was the menu's.
   */
  private menuMouse(event: MouseEvent, x: number, y: number, button: number): boolean {
    if (event === 'left-up' && this.clickInMenu) {
      this.clickInMenu = false
      return true
    }
    const m = this.menuOpen
    if (!m || (event !== 'left-down' && event !== 'other-down' && event !== 'x-down')) return false
    const r = m.rect
    if (r && x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) {
      this.clickInMenu = event === 'left-down'
      return true
    }
    const mods = this.heldMods()
    const own = event === 'x-down' && this.keys.some(k => k.action === 'menu' && k.spec.kind === 'mouse' && k.spec.button === button && sameMods(mods, k.spec.mods))
    if (!own) this.closeMenu()
    return false
  }

  /**
   * A key another program pressed (another layout switcher, a macro tool, Kryakl's
   * own copy and paste): it never makes or breaks a tap of the person's keys,
   * which another switcher reacting to a Ctrl tap would; a modifier still
   * counts as held; anything typed means the keys kept no longer match the text.
   */
  private foreignKey(vk: number, down: boolean): void {
    // A key that types nothing, pressed as Alt or Win is let go so no menu opens, is no key at all.
    if (MASK_KEYS.has(vk)) return
    if (!down) {
      this.held.delete(vk)
      return
    }
    this.held.add(vk)
    if (!modOf(vk)) {
      this.resetRun()
      this.last = 'none'
    }
  }

  /** A mouse event; true keeps it from the program (a side button that is a hotkey). */
  mouse(event: MouseEvent, x: number, y: number, time: number, button = 0): boolean {
    if (this.menuMouse(event, x, y, button)) return false
    if (event === 'x-down') {
      this.spoilTap()
      const mods = this.heldMods()
      const hit = this.quiet() && !this.dictating ? undefined : this.keys.find(k => k.spec.kind === 'mouse' && k.spec.button === button && sameMods(mods, k.spec.mods))
      if (hit && this.allowed(hit)) {
        this.swallowedButtons.add(button)
        this.act(hit)
        return true
      }
      this.resetRun()
      this.last = 'none'
    } else if (event === 'x-up') {
      return this.swallowedButtons.delete(button)
    } else if (event === 'left-down') {
      this.spoilTap()
      this.resetRun()
      const d = this.lastDown
      const double = !!d && Math.abs(x - d.x) <= 4 && Math.abs(y - d.y) <= 4 && time - d.time <= this.env.doubleClickMs
      this.lastDown = { x, y, time, double }
      this.last = double ? 'selected' : 'none'
    } else if (event === 'left-up') {
      // A drag, a double or triple click, or a click with Shift selects.
      const d = this.lastDown
      if (d && (d.double || Math.abs(x - d.x) > 4 || Math.abs(y - d.y) > 4 || this.heldMods().has('Shift'))) this.last = 'selected'
    } else if (event === 'other-down') {
      this.spoilTap()
      this.resetRun()
      this.last = 'none'
    } else {
      // Ctrl with the wheel zooms: no tap.
      this.spoilTap()
    }
    return false
  }

  /**
   * The main process is done with the selection: converted and selected
   * again, the fix key goes on with it, and a press made meanwhile goes on at
   * once; not selected again, such a press is dropped.
   */
  converted(selected: boolean): void {
    const again = this.converting?.again ?? 0
    this.converting = undefined
    if (!selected) return
    this.last = 'selected'
    if (again > 0) this.convertSelection(again - 1)
  }

  /** Asks the main process to convert the selection into the next layout; `again`: presses still to follow. */
  private convertSelection(again = 0): void {
    this.last = 'none'
    this.converting = { since: this.env.now(), again }
    this.env.send({ type: 'selection', cycle: this.cycle(), layout: this.layoutNow(this.env.foreground()) })
  }

  /** The fix key pressed with Shift still down from selecting with Shift (Shift+End, then Pause): it is still the fix key. */
  private fixAfterShift(vk: number, mods: ReadonlySet<Mod>): Bound | undefined {
    if (this.last !== 'selected' || mods.size !== 1 || !mods.has('Shift')) return undefined
    const plain = this.hotkeyOf(vk, new Set())
    return plain?.action === 'fix' ? plain : undefined
  }

  private heldMods(): Set<Mod> {
    const mods = new Set<Mod>()
    for (const vk of this.held) {
      const mod = modOf(vk)
      if (mod) mods.add(mod)
    }
    return mods
  }

  /** Which key a key press with these modifiers is. */
  private hotkeyOf(vk: number, mods: ReadonlySet<Mod>): Bound | undefined {
    return this.keys.find(({ spec }) => spec.kind === 'key' && spec.vk === vk && sameMods(mods, spec.mods))
  }

  /** The key of a tap or a double tap. */
  private keyOf(kind: 'tap' | 'double', vk: number): Bound | undefined {
    return this.keys.find(({ spec }) => spec.kind === kind && spec.vk === vk)
  }

  /** Whether a key works in the program in front: a program can be left out of Kryakl's keys, or of switching; the pause key works everywhere. */
  private allowed(key: Bound): boolean {
    if (key.action === 'pause') return true
    if (this.quiet() && !DICTATION_ACTIONS.has(key.action)) return false
    const front = this.env.foreground()
    if (this.offHere('keys', front)) return false
    return !((key.action === 'switch' || key.action === 'layout') && this.offHere('switch', front))
  }

  private act(key: Bound): void {
    if (!this.allowed(key)) return
    const { action } = key
    if (action === 'switch') this.switchNext()
    else if (action === 'layout') {
      if (key.layout) this.personSwitch(key.layout)
    } else if (action === 'fix') this.fixKey()
    else {
      if ((action === 'dictate' || action === 'english' || action === 'practice') && key.spec.kind === 'key') this.holdKey = { vk: key.spec.vk, action }
      this.env.send({ type: 'hotkey', action })
    }
  }

  private resetRun(): void {
    // The word before goes on as it was: one of the person's typed right.
    this.confirmCandidate()
    this.settleCycling()
    // A new run asks Windows for Caps Lock again, and the field anew.
    this.capsAt = Number.NEGATIVE_INFINITY
    this.run = []
    this.boundary = 0
    this.autoFixed = undefined
    this.cycling = undefined
    this.secret = undefined
    this.pauseChecked = true
  }

  private spoilTap(): void {
    this.tap = undefined
    this.lastTap = undefined
    this.chord.clean = false
  }

  private onModifierDown(vk: number): void {
    const mod = modOf(vk) as Mod
    if ([...this.held].every(k => k === vk)) {
      this.tap = { vk, since: this.env.now() }
      this.chord = { mods: new Set([mod]), clean: true }
      // Held to talk: acted on now, as a tap waits for the key-up that is to finish the phrase.
      // ponytail: a chord with this modifier (Option+letter) starts a phrase too; held keys are the person's pick.
      const bound = this.config.hold ? this.keyOf('tap', vk) : undefined
      const action = bound?.action
      if (bound && (action === 'dictate' || action === 'english' || action === 'practice') && this.allowed(bound)) {
        this.tap.held = true
        this.holdKey = { vk, action }
        this.env.send({ type: 'hotkey', action })
      }
    } else {
      this.tap = undefined
      this.chord.mods.add(mod)
    }
  }

  /** True: the tap was Alt or Win as a key of Kryakl's, to be let go behind a key that types nothing. */
  private onModifierUp(vk: number): boolean {
    const t = this.tap
    this.tap = undefined
    let mask = false
    if (t?.held) this.lastTap = undefined
    else if (t && t.vk === vk && this.chord.clean && this.env.now() - t.since <= TAP_MS) {
      // A double's first tap too: it cannot know yet whether a second comes.
      const bound = this.keyOf('tap', vk) ?? this.keyOf('double', vk)
      mask = MENU_KEYS.has(vk) && !!bound && this.allowed(bound)
      this.onTap(vk, t.since)
    } else this.lastTap = undefined
    if ([...this.held].some(k => modOf(k))) return mask
    const { mods, clean } = this.chord
    if (clean && mods.size >= 2) {
      const chord = this.keys.find(({ spec }) => spec.kind === 'chord' && sameMods(mods, spec.mods))
      if (chord) this.act(chord)
    }
    this.chord = { mods: new Set(), clean: false }
    return mask
  }

  /**
   * A modifier tapped alone, pressed at `since`: its tap acts at once; a
   * second tap soon after is the double, and takes back the first's layout
   * switch, so a tap can switch the layout without waiting to see if a
   * double comes.
   */
  private onTap(vk: number, since: number): void {
    const previous = this.lastTap
    this.lastTap = undefined
    const double = this.keyOf('double', vk)
    if (double && previous?.vk === vk && since - previous.at <= DOUBLE_MS) {
      if (previous.before) {
        this.switchWindow(this.env.foreground().hwnd, previous.before)
        this.trustNext = false
      }
      this.act(double)
      return
    }
    const tap = this.keyOf('tap', vk)
    const before = tap?.action === 'switch' || tap?.action === 'layout' ? this.layoutNow(this.env.foreground()) : undefined
    if (tap) this.act(tap)
    this.lastTap = { vk, at: this.env.now(), ...(before ? { before } : {}) }
  }

  /** A key that is no hotkey and no modifier: typing, a move, a shortcut. True keeps it from the program. */
  private onTyping(vk: number, mods: ReadonlySet<Mod>): boolean {
    if (mods.has('Control') || mods.has('Alt') || mods.has('Super')) {
      // Ctrl+A, and Ctrl+Shift with a move (a word, to the line's end) select.
      const selecting = (mods.size === 1 && mods.has('Control') && vk === VK_A) || (mods.size === 2 && mods.has('Control') && mods.has('Shift') && MOVES.has(vk) && vk !== VK_DELETE)
      this.last = selecting ? 'selected' : 'none'
      this.resetRun()
      return false
    }
    const shift = mods.has('Shift')
    if (MOVES.has(vk)) {
      this.last = shift && vk !== VK_DELETE ? 'selected' : 'none'
      this.resetRun()
      return false
    }
    if (vk === VK_BACK) return this.onBackspace()
    const front = this.env.foreground()
    if (front.hwnd !== this.runWindow) {
      this.resetRun()
      this.runWindow = front.hwnd
      this.erased = undefined
    }
    this.reportApp(front.pid)
    const now = this.env.now()
    if (now - this.capsAt > CAPS_FRESH_MS) {
      this.caps = this.env.capsOf(front)
      this.capsAt = now
    }
    const layout = this.layoutNow(front)
    this.noticeSwitch(front.hwnd, layout)
    const info = this.env.layout(layout)
    const stroke: Stroke = { vk, shift, caps: this.caps, layout }
    if (vk === VK_RETURN || vk === VK_TAB) {
      const fixed = !!info && this.wordEnds(stroke, undefined, front)
      this.resetRun()
      this.last = 'none'
      return fixed
    }
    const char = info ? charOf(info.table, vk, shift, this.caps) : undefined
    if (char === undefined) {
      this.resetRun()
      this.last = 'none'
      return false
    }
    const end = this.endsWord(stroke, char)
    if (end && this.wordEnds(stroke, char, front)) return true
    this.erasing = false
    if (!end) this.confirmCandidate()
    this.settleCycling()
    this.autoFixed = undefined
    this.cycling = undefined
    this.run.push({ ...stroke, end })
    if (this.run.length > MAX_RUN) {
      const cut = this.run.length - MAX_RUN
      this.run.splice(0, cut)
      this.boundary = Math.max(0, this.boundary - cut)
    }
    this.last = 'typed'
    this.typedAt = now
    this.pauseChecked = end
    return false
  }

  /** Backspace erases, a fixed word's letters too (its ending may be what is wrong); the fix key takes a fix back. */
  private onBackspace(): boolean {
    this.candidate = undefined
    this.cycling = undefined
    const gone = this.run.pop()
    if (gone) {
      // Erased keys, kept a while: the same keys typed again in another layout are a fix by hand.
      const now = this.env.now()
      const e = this.erased
      if (e && e.hwnd === this.runWindow && now - e.at < ERASED_MS && this.erasing) {
        e.strokes.unshift(gone)
        e.at = now
      } else this.erased = { strokes: [gone], at: now, hwnd: this.runWindow }
      this.erasing = true
    }
    this.boundary = Math.min(this.boundary, this.run.length)
    this.autoFixed = undefined
    this.pauseChecked = true
    return false
  }

  /** A key that ends a word: a space, or a sign that is no letter in any layout of the cycle ("!", "-", "/" which is "." in Russian). */
  private endsWord(stroke: Stroke, char: string): boolean {
    if (/\s/.test(char)) return true
    return this.cycle().every(id => {
      const info = this.env.layout(id)
      const c = info ? charOf(info.table, stroke.vk, stroke.shift, stroke.caps) : undefined
      return c === undefined || !/[\p{L}\p{N}'’ʼ`]/u.test(c)
    })
  }

  /** Whether a key types a letter in a layout of the cycle. */
  private isLetter(s: Stroke): boolean {
    return [s.layout, ...this.cycle()].some(id => {
      const info = this.env.layout(id)
      const c = info ? charOf(info.table, s.vk, s.shift, s.caps) : undefined
      return c !== undefined && /\p{L}/u.test(c)
    })
  }

  private reading(strokes: readonly Stroke[], id: string): Reading {
    const info = this.env.layout(id)
    return { layout: id, lang: info?.lang ?? '', text: info ? typeIn(strokes, info.table, l => this.env.layout(l)?.table) : '' }
  }

  // ---------------------------------------------------------------- whose switch

  /**
   * A key typed in another layout than the last one in this window, and not
   * one Kryakl switched to by itself: the person switched (Windows' keys, the
   * language bar, Kryakl's switch key). The words before are as they meant
   * them, and so is the next one.
   */
  private noticeSwitch(hwnd: bigint, layout: string): void {
    const last = this.lastLayout
    if (last && last.hwnd === hwnd && last.layout !== layout && this.ownSwitch !== layout) this.markSwitch()
    this.ownSwitch = undefined
    this.lastLayout = { hwnd, layout }
  }

  private markSwitch(): void {
    this.boundary = this.run.length
    this.trustNext = true
  }

  // ---------------------------------------------------------------- fixing

  /** The words (runs of keys between word ends) from `from` on. */
  private spans(from: number): Span[] {
    const out: Span[] = []
    let start = -1
    for (let i = from; i <= this.run.length; i++) {
      const s = this.run[i]
      if (s && !s.end) {
        if (start < 0) start = i
      } else if (start >= 0) {
        out.push({ start, end: i })
        start = -1
      }
    }
    return out
  }

  /**
   * A word ends with `stroke` (a space, a sign, Enter or Tab; `char` is what
   * it types, none for Enter and Tab): it is learned from, and fixed when
   * typed in the wrong layout or with a stray capital. True when it is fixed.
   */
  private wordEnds(stroke: Stroke, char: string | undefined, front: Front): boolean {
    this.erasing = false
    this.settleSwitch(front)
    const start = this.wordStart()
    const word = this.run.slice(start)
    if (word.length === 0) return false
    const trusted = this.trustNext
    this.trustNext = false
    this.learnRetyped(word)
    if (this.config.autoFix && !trusted && !this.offHere('fix', front) && this.autoFix(start, stroke, char, front)) return true
    this.noteCandidate(word)
    return false
  }

  /** The first key of the word being typed: the one after the last key that ended a word. */
  private wordStart(): number {
    for (let i = this.run.length - 1; i >= 0; i--) if (this.run[i]?.end) return i + 1
    return 0
  }

  /**
   * The word from `start` to the end of the run, typed in one layout: fixed
   * into the layout that makes a word of it, with the short words before it
   * that were meant there too, or set right when a capital slipped.
   */
  private autoFix(start: number, stroke: Stroke | undefined, char: string | undefined, front: Front, paused = false): boolean {
    const word = this.run.slice(start)
    const own = word[word.length - 1]?.layout as string
    if (word.some(s => s.layout !== own)) return false
    const slip = caseSlip(word, s => this.isLetter(s))
    // A stray capital is set right only in a word of the word lists, in some layout: sRGB or iOS typed with Caps Lock on are as meant.
    const repaired =
      slip && (slip.kind === 'two' ? this.config.fixTwoCaps : this.config.fixCapsLock) && [own, ...this.cycle()].some(id => this.listed(this.reading(slip.strokes, id))) ? slip : undefined
    const keys = repaired?.strokes ?? word
    const typed = this.reading(keys, own)
    if (this.config.keepCaps && !repaired && [...typed.text].filter(c => /\p{L}/u.test(c)).length >= 2 && typed.text === typed.text.toUpperCase()) return false
    const others = this.cycle()
      .filter(id => id !== own)
      .map(id => this.reading(keys, id))
    let choice = chooseFix(typed, others, this.lexicons, this.keep, this.always, this.mine, this.config.languages)
    // Fixed on a pause only when the word as typed looks like none of its language: a word still being typed may yet become one.
    const ownLexicon = this.lexicons[typed.lang]
    const core = coreOf(typed.text)
    if (choice && paused && ownLexicon && core && plausibility(core, ownLexicon) >= 0.6) choice = undefined
    // A stray capital in a word of the layout typed in: set right where it is.
    if (!choice && repaired && this.listed(typed)) choice = typed
    if (!choice) return false
    // The window already types in the layout the word would go into: the keys were taken for the
    // layout Windows still named after a switch, and the word on screen is right as it is.
    if (choice.layout !== own && choice.layout === this.layoutNow(front)) {
      for (const s of word) s.layout = choice.layout
      return false
    }
    const to = choice.layout
    // Short words just before it, typed in the same layout and meant in the new one, go with it ("z rfr" → "я как").
    let from = start
    if (to !== own) {
      const before = this.spans(this.boundary).filter(s => s.end <= start)
      const tail: Span[] = []
      for (let i = before.length - 1; i >= 0; i--) {
        const s = before[i] as Span
        if (this.run.slice(s.start, s.end).some(k => k.layout !== own)) break
        tail.unshift(s)
      }
      const pairs = [...tail, { start, end: this.run.length }].map(s => {
        const strokes = this.run.slice(s.start, s.end)
        return { typed: this.reading(strokes, own), there: this.reading(strokes, to) }
      })
      const n = wordsMeant(pairs, this.lexicons, this.keep, 3)
      if (n > 1) from = (tail[tail.length - (n - 1)] as Span).start
    }
    const piece = this.run.slice(from)
    const saved = piece.map(s => ({ ...s }))
    const ending = char === undefined || !stroke ? '' : this.reading([stroke], to).text || char
    piece.forEach((s, i) => {
      const k = i >= start - from ? keys[i - (start - from)] : undefined
      if (k) Object.assign(s, { shift: k.shift, caps: k.caps })
      s.layout = to
    })
    if (stroke && char !== undefined) this.run.push({ ...stroke, layout: to, end: true })
    const capsOff = repaired?.kind === 'caps'
    const autoFixed =
      char === undefined && !paused ? undefined : { start: from, end: this.run.length, from: own, word: coreOf(typed.text) ?? typed.text.toLowerCase(), typed: saved, capsOff }
    this.autoFixed = autoFixed
    this.cycling = undefined
    this.last = 'typed'
    const text = this.reading(this.run.slice(from, from + piece.length), to).text
    const run = this.run
    this.schedule(
      {
        erase: piece.length,
        text: text + ending,
        ...(char === undefined && stroke ? { key: stroke.vk } : {}),
        to,
        hwnd: front.hwnd,
        ...(capsOff ? { toggleCaps: true } : {}),
        auto: true,
        report: { word: coreOf(typed.text) ?? typed.text.toLowerCase(), fixed: coreOf(this.reading(keys, to).text) ?? this.reading(keys, to).text },
        plain: stroke ? (char === undefined ? [{ vk: stroke.vk }] : [{ char }]) : [],
        // Called off: the keys go back to how they were typed (unless a click started a new run meanwhile).
        undo: () => {
          this.autoFixed = undefined
          if (this.run !== run) return
          saved.forEach((s, i) => Object.assign(run[from + i] as Typed, s))
          const after = run[from + saved.length]
          if (after && stroke) after.layout = stroke.layout
        },
      },
      front,
    )
    return true
  }

  /**
   * The fix key right after a word was fixed by itself: it goes
   * back as typed, case and all (Caps Lock on again, if the fix turned it off),
   * and is kept so from now on.
   */
  private takeBack(fixed: NonNullable<Typist['autoFixed']>): void {
    this.autoFixed = undefined
    fixed.typed.forEach((s, i) => Object.assign(this.run[fixed.start + i] as Typed, s))
    const strokes = this.run.slice(fixed.start, fixed.end)
    for (const s of strokes) s.layout = fixed.from
    this.env.send({ type: 'keep', word: fixed.word })
    this.keep.add(fixed.word)
    this.always.delete(fixed.word)
    this.ownSwitch = fixed.from
    this.schedule({ erase: strokes.length, text: this.reading(strokes, fixed.from).text, to: fixed.from, hwnd: this.runWindow, ...(fixed.capsOff ? { toggleCaps: true } : {}) })
  }

  /** Whether a reading is a word of its language's list, not one the person taught (their spelling may hold capitals the list has not kept). */
  private listed(reading: Reading): boolean {
    const core = coreOf(reading.text)
    return !!core && rankOf(this.lexicons[reading.lang], core) !== undefined && !this.mine.has(mineKey(reading.lang, core))
  }

  /**
   * The fix key: the words at the end of what was typed that read as words
   * in another layout, again in the layout that makes the best word of the
   * last (pressed again, in the next layout round the cycle), never reaching
   * back over a word right as typed, a word with digits or the place the
   * person switched the layout; signs alone at the end ("&&&&" → "????");
   * or the selection.
   */
  private fixKey(): void {
    const c = this.converting
    if (c && this.env.now() - c.since < CONVERT_MS) {
      // Pressed again before the last conversion was selected again: it goes on once it is.
      c.again = Math.min(c.again + 1, AGAIN_MOST)
      return
    }
    this.converting = undefined
    if (this.autoFixed && this.autoFixed.end === this.run.length) return this.takeBack(this.autoFixed)
    if (this.last === 'selected') return this.convertSelection()
    if (this.last !== 'typed' || this.run.length === 0 || this.env.foreground().hwnd !== this.runWindow) return
    this.candidate = undefined
    let start: number
    let to: string | undefined
    let from: string
    let words: Span[]
    let signs: ReturnType<Typist['signs']>
    if (this.cycling && this.cycling.end === this.run.length) {
      start = this.cycling.start
      from = this.cycling.from
      words = this.cycling.words
      to = nextLayout(this.cycle(), this.cycling.to)
    } else if ((signs = this.signs())) {
      start = signs.start
      from = signs.from
      to = signs.to
      words = []
    } else {
      const spans = this.spans(this.boundary)
      const last = spans.at(-1)
      if (!last) return
      from = this.run[last.end - 1]?.layout as string
      const letters = this.run.slice(last.start, last.end)
      const others = this.cycle()
        .filter(id => id !== from)
        .map(id => this.reading(letters, id))
      to = bestLayout(this.reading(letters, from), others, this.lexicons, this.config.languages)?.layout ?? nextLayout(this.cycle(), from)
      if (!to) return
      const tail: Span[] = []
      for (let i = spans.length - 1; i >= 0; i--) {
        const s = spans[i] as Span
        if (this.run.slice(s.start, s.end).some(k => k.layout !== from)) break
        tail.unshift(s)
      }
      const target = to
      const pairs = tail.map(s => {
        const strokes = this.run.slice(s.start, s.end)
        return { typed: this.reading(strokes, from), there: this.reading(strokes, target) }
      })
      words = tail.slice(tail.length - wordsMeant(pairs, this.lexicons, new Set(), Number.POSITIVE_INFINITY))
      start = (words[0] as Span).start
    }
    if (!to) return
    const tail = this.run.slice(start)
    const text = this.reading(tail, to).text
    for (const s of tail) s.layout = to
    this.cycling = { start, end: this.run.length, to, from, words }
    this.autoFixed = undefined
    this.ownSwitch = to
    this.schedule({ erase: tail.length, text, to, hwnd: this.runWindow })
  }

  /**
   * Signs at the end of what was typed with no word touching them ("&&&&",
   * "hello &&&&", spaces after them too): where they start, their layout and
   * the first round the cycle that reads them otherwise ("????"). Undefined
   * when a word's keys touch them ("ghbdtn&" goes as a word) or every layout
   * reads them alike ("!!!!").
   */
  private signs(): { start: number; from: string; to: string } | undefined {
    const space = (i: number) => {
      const s = this.run[i] as Typed
      return /\s/.test(this.reading([s], s.layout).text)
    }
    let end = this.run.length
    while (end > this.boundary && space(end - 1)) end--
    let start = end
    while (start > this.boundary && (this.run[start - 1] as Typed).end && !space(start - 1)) start--
    if (start === end || (start > this.boundary && !(this.run[start - 1] as Typed).end)) return undefined
    const from = (this.run[end - 1] as Typed).layout
    const piece = this.run.slice(start)
    const typed = this.reading(piece, from).text
    const to = layoutsAfter(this.cycle(), from).find(id => this.reading(piece, id).text !== typed)
    return to ? { start, from, to } : undefined
  }

  private switchNext(): void {
    const front = this.env.foreground()
    const to = nextLayout(this.cycle(), this.layoutNow(front))
    if (to) this.personSwitch(to)
  }

  /** The person switches the window in front to a layout (the switch key, a layout's own key). */
  private personSwitch(layout: string): void {
    const front = this.env.foreground()
    if (layout === this.layoutNow(front)) return
    this.switchWindow(front.hwnd, layout)
    this.chime(layout)
    if (front.hwnd === this.runWindow) this.markSwitch()
  }

  /** The switch's sound, in the layout's note: English's first, the others lower in the order of the cycle. */
  private chime(layout: string): void {
    if (!this.config.switchSound) return
    if (this.env.layout(layout)?.lang === 'en') return this.env.chime(0)
    const others = this.cycle().filter(id => this.env.layout(id)?.lang !== 'en')
    this.env.chime(Math.min(2, 1 + Math.max(0, others.indexOf(layout))))
  }

  /**
   * The layout in front changed in the same window, and not by Kryakl: the
   * person switched with Windows' own keys (or the language bar), and it
   * sounds too. Another window's layout is no switch.
   */
  private listenForSwitch(front: Front): void {
    if (!front.hwnd || !front.tid || this.quiet()) return
    const layout = this.layoutNow(front)
    const before = this.heard
    this.heard = { hwnd: front.hwnd, layout }
    if (!before || before.hwnd !== front.hwnd || before.layout === layout) return
    const made = this.made
    this.made = undefined
    if (made && made.hwnd === front.hwnd && made.layout === layout) return
    if (!this.offHere('switch', front)) this.chime(layout)
  }

  /** Switches the window in front to a layout (after a selection was converted). */
  switchTo(layout: string): void {
    this.ownSwitch = layout
    this.switchWindow(this.env.foreground().hwnd, layout)
  }

  /** Switches a window's layout, and trusts that layout until Windows names it too. */
  private switchWindow(hwnd: bigint, layout: string): void {
    this.env.switchLayout(hwnd, layout)
    this.made = { hwnd, layout }
    this.expected = { hwnd, layout, until: this.env.now() + SWITCH_TRUST_MS }
  }

  /** The layout the window in front types in: the one Kryakl just switched it to, until Windows agrees; else Windows' answer. */
  private layoutNow(front: Front): string {
    const named = this.env.layoutOf(front.tid)
    const e = this.expected
    if (e && e.hwnd === front.hwnd && e.layout !== named && this.env.now() < e.until) return e.layout
    if (e && e.hwnd === front.hwnd && e.layout !== named) this.switchFailed(e.layout, named)
    this.expected = undefined
    return named
  }

  /**
   * A switch asked of the window in front that it has not made by now (a word's
   * end, or the trust window out): the keys since were typed in the layout
   * Windows names, and the next word is nobody's switch to trust (2026-11-07:
   * Left Ctrl asked a Chromium window for English, it kept Russian, and
   * "цштвщцы" went by as the trusted word after a switch).
   */
  private settleSwitch(front: Front): void {
    const e = this.expected
    if (!e || e.hwnd !== front.hwnd) return
    this.expected = undefined
    const named = this.env.layoutOf(front.tid)
    if (named !== e.layout) this.switchFailed(e.layout, named)
  }

  private switchFailed(wanted: string, named: string): void {
    for (const s of this.run.slice(this.boundary)) if (s.layout === wanted) s.layout = named
    this.trustNext = false
    const lang = (id: string) => this.env.layout(id)?.lang ?? id
    this.env.send({ type: 'note', text: `switch: the window kept ${lang(named)}, asked for ${lang(wanted)}` })
  }

  // ---------------------------------------------------------------- learning

  /** Whether learning is on here: learned words serve fixing as one types and the fix key. */
  private learning(front = this.env.foreground()): boolean {
    return this.config.learn && (this.config.autoFix || !!this.config.keys.fix) && !this.offHere('fix', front) && !this.quiet() && !UNLEARNED_APPS.has(this.env.exeOf(front.pid))
  }

  /** A word that just ended, typed with the same keys as a word just erased but in another layout: fixed by hand. */
  private learnRetyped(word: readonly Typed[]): void {
    const e = this.erased
    this.erased = undefined
    if (!e || !this.learning() || this.env.now() - e.at > ERASED_MS) return
    const gone = e.strokes.slice(0, e.strokes.findIndex(s => s.end) < 0 ? e.strokes.length : e.strokes.findIndex(s => s.end))
    const was = gone[0]?.layout
    const now = word[0]?.layout
    if (!was || !now || was === now || gone.length !== word.length || gone.some(s => s.layout !== was)) return
    if (gone.some((s, i) => s.vk !== word[i]?.vk || s.shift !== word[i]?.shift)) return
    const core = coreOf(this.reading(gone, was).text)
    const lang = this.env.layout(now)?.lang
    if (!core || !lang || !/^\p{L}+$/u.test(core)) return
    if (!learnable(this.reading(gone, was), this.reading(word, now), this.lexicons)) return this.env.send({ type: 'notLearned', why: 'noWord' })
    this.learnLater({ type: 'fixedByHand', word: core, lang })
  }

  /** The fix key's conversion stands (typing went on): each of its words was fixed by hand. */
  private settleCycling(): void {
    const c = this.cycling
    if (!c || c.to === c.from || !this.learning()) return
    const lang = this.env.layout(c.to)?.lang
    if (!lang) return
    for (const w of c.words) {
      const strokes = this.run.slice(w.start, w.end)
      const typed = this.reading(strokes, c.from)
      const core = coreOf(typed.text)
      if (!core || !/^\p{L}+$/u.test(core)) continue
      if (!learnable(typed, this.reading(strokes, c.to), this.lexicons)) this.env.send({ type: 'notLearned', why: 'noWord' })
      else this.learnLater({ type: 'fixedByHand', word: core, lang })
    }
    this.cycling = undefined
  }

  /** A word left as typed: one of the person's when it is in no list and reads as no word elsewhere; counted once typing goes on past it. */
  private noteCandidate(word: readonly Typed[]): void {
    this.candidate = undefined
    if (!this.learning()) return
    const layout = word[0]?.layout as string
    const typed = this.reading(word, layout)
    const core = coreOf(typed.text)
    const lexicon = this.lexicons[typed.lang]
    if (!core || !lexicon || core.length < 3 || !/^\p{L}+$/u.test(core) || lexicon.rank.has(core) || this.keep.has(core) || this.always.has(core)) return
    const elsewhere = this.cycle().some(id => {
      if (id === layout) return false
      const r = this.reading(word, id)
      const c = coreOf(r.text)
      return !!c && rankOf(this.lexicons[r.lang], c) !== undefined
    })
    if (!elsewhere) this.candidate = { word: core, lang: typed.lang }
  }

  private confirmCandidate(): void {
    const c = this.candidate
    this.candidate = undefined
    if (!c) return
    const hash = createHash('sha256').update(`${this.config.salt}\n${c.lang}\n${c.word}`).digest('hex').slice(0, 16)
    const count = (this.tally.get(hash) ?? 0) + 1
    this.tally.set(hash, count)
    if (count < LEARN_AFTER) return this.env.send({ type: 'tally', hash, count })
    this.tally.delete(hash)
    this.lexicons[c.lang] = withWords(this.lexicons[c.lang] as Lexicon, [c.word])
    this.mine.add(mineKey(c.lang, c.word))
    this.learnLater({ type: 'tally', hash, count, word: c })
  }

  /** Learning sent once the field is known to be no password (asked when it is not known yet). */
  private learnLater(message: KbdOut): void {
    if (this.secret === true || this.secret === 'unknown') return this.notLearned([message])
    if (this.secret === false) return this.env.send(message)
    this.toLearn.push(message)
    if (!this.asking) {
      this.asking = { since: this.env.now() }
      this.env.askField(this.env.foreground())
    }
  }

  /** A fix by hand dropped for the field is said, for the log (a word typed right is not: that is every word). */
  private notLearned(dropped: readonly KbdOut[]): void {
    if (dropped.some(m => m.type === 'fixedByHand')) this.env.send({ type: 'notLearned', why: 'field' })
  }

  // ---------------------------------------------------------------- typing the fix

  /** A fix is typed after the hook has answered (a hook must answer at once), and, when fixed by itself, once the field is known to be no password. */
  private schedule(fix: Fix, front?: Front): void {
    this.pending = fix
    this.queued = []
    if (fix.auto && this.secret === undefined && front) {
      if (!this.asking) {
        this.asking = { since: this.env.now() }
        this.env.askField(front)
      }
      return
    }
    if (fix.auto && this.secret === true) return this.callOff()
    this.env.later()
  }

  /** The answer about the field typed in: a password field takes no fix and teaches nothing; one that would not say teaches nothing either. */
  fieldIs(secret: FieldAnswer): void {
    this.asking = undefined
    this.secret = secret
    const learn = this.toLearn
    this.toLearn = []
    if (secret === false) for (const m of learn) this.env.send(m)
    else this.notLearned(learn)
    if (!this.pending) return
    if (secret === true && this.pending.auto) this.callOff()
    else this.env.later()
  }

  /** The fix waiting is called off: the key that ended the word goes to the program as typed, then the keys typed meanwhile. */
  private callOff(): void {
    const fix = this.pending
    this.pending = undefined
    if (!fix) return
    fix.undo?.()
    const keys: Press[] = [...(fix.plain ?? [])]
    for (const again of this.queued) keys.push({ again })
    this.queued = []
    if (keys.length) this.env.press(keys)
  }

  typeFix(): void {
    const fix = this.pending
    this.pending = undefined
    if (!fix) return
    // The layout first: Windows hands a program its posted messages before its typing.
    this.switchWindow(fix.hwnd, fix.to)
    this.ownSwitch = fix.to
    const keys: Press[] = []
    if (fix.toggleCaps) {
      keys.push({ vk: VK_CAPITAL })
      this.caps = !this.caps
      this.capsAt = this.env.now()
    }
    for (let i = 0; i < fix.erase; i++) keys.push({ vk: VK_BACK })
    if (fix.text) keys.push({ char: fix.text })
    if (fix.key) keys.push({ vk: fix.key })
    // Keys typed meanwhile go again, as typing: the hook sees them anew.
    for (const again of this.queued) keys.push({ again })
    this.queued = []
    this.env.press(keys)
    if (fix.auto && this.config.fixSound) this.env.click()
    // Typed only once the field is known to be no password (or never answered, which counts as none).
    // The tray's "Keep a word" offers it (in memory only), unless the field said it is a password.
    if (fix.auto && fix.report && this.secret !== true) this.env.send({ type: 'autoFixed', ...fix.report })
  }

  // ---------------------------------------------------------------- the clock, the badge and the program in front

  /**
   * The thread's clock, a few times a second: the layout and Caps Lock in
   * front for the badge, the program in front (its own layout), a word left
   * standing a second (fixed then, when that is on), an answer about the
   * field that never came.
   */
  tick(): void {
    const now = this.env.now()
    if (this.asking && now - this.asking.since > FIELD_WAIT_MS) this.fieldIs('unknown')
    const front = this.env.foreground()
    if (this.menuOpen && (now > this.menuOpen.until || (front.hwnd && front.hwnd !== this.menuOpen.hwnd))) this.closeMenu()
    if (front.hwnd && front.hwnd !== this.frontWindow) {
      this.frontWindow = front.hwnd
      this.reportApp(front.pid)
      const exe = this.env.exeOf(front.pid)
      const layout = this.config.apps[exe]?.layout
      if (layout && this.env.layout(layout) && !this.quiet() && layout !== this.layoutNow(front)) {
        this.ownSwitch = layout
        this.switchWindow(front.hwnd, layout)
      }
    }
    if (this.config.badge || this.config.trayLayout) this.lookAtLayout(front)
    if (this.config.switchSound) this.listenForSwitch(front)
    if (this.config.autoFix && this.config.fixOnPause && !this.pauseChecked && !this.pending && now - this.typedAt >= PAUSE_MS) this.pauseFix(front)
  }

  /** A word stopped a second without a key: fixed as at its end, but nothing is pressed after it. */
  private pauseFix(front: Front): void {
    this.pauseChecked = true
    if (front.hwnd !== this.runWindow || this.trustNext || this.offHere('fix', front) || this.quiet()) return
    const last = this.spans(this.boundary).at(-1)
    if (!last || last.end !== this.run.length) return
    this.autoFix(last.start, undefined, undefined, front, true)
  }

  /** Looks at the layout and Caps Lock in front: a change is reported, for the badge (not on the first look) and the tray's icon. */
  lookAtLayout(front = this.env.foreground()): void {
    if (!front.tid || this.quiet()) return
    const layout = this.env.layoutOf(front.tid)
    // Caps Lock as the hook last saw its key (asking Windows a few times a second would borrow the front window's input each time).
    const caps = this.caps
    if (layout === this.shown.layout && caps === this.shown.caps) return
    const first = this.shown.layout === ''
    this.shown = { layout, caps }
    const badge = this.config.badge && !first && !this.offHere('badge', front)
    const caret = badge ? this.env.caretOf(front.tid) : undefined
    this.env.send({ type: 'layout', layout, caps, badge, ...(caret ? { caret } : {}) })
  }

  /** The next look at the layout in front is a first one again. */
  forgetLayout(): void {
    this.shown = { layout: '', caps: false }
  }

  private reportApp(pid: number): void {
    const exe = this.env.exeOf(pid)
    if (!exe || exe === this.env.ownExe || exe === this.reportedExe) return
    this.reportedExe = exe
    this.env.send({ type: 'app', exe, elevated: this.env.elevated(pid) })
  }
}

function sameMods(a: ReadonlySet<Mod>, b: readonly Mod[]): boolean {
  return a.size === b.length && b.every(m => a.has(m))
}

/** A learned word of the person's, as `chooseFix` and `listed` look it up. */
export function mineKey(lang: string, word: string): string {
  return `${lang}\n${word}`
}
