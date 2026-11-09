// Kryakl's keys, written like Electron's accelerators and recorded from key
// presses in the settings. Beyond a key with modifiers ("Control+Alt+K",
// which Electron's shortcuts hold), the keyboard thread (kbd-worker.ts)
// matches what Electron cannot: a modifier tapped alone ("LeftControl") or
// twice ("LeftControl*2"), modifiers pressed together and let go
// ("Control+Shift", as Windows switches layouts), a key alone ("Pause"), and
// the mouse's side buttons ("MouseBack", "Control+MouseForward"). Ctrl+C
// pressed twice ("Control+C*2") is neither's: clipboard.ts DoubleCopy sees it
// as two copies, and main.ts runs the action whose key it is.

import { t } from './i18n'

export type Mod = 'Control' | 'Alt' | 'Shift' | 'Super'

export type HotkeySpec =
  /** One modifier pressed and let go with nothing else: its left or right key. */
  | { kind: 'tap'; vk: number }
  /** The same modifier tapped twice, quickly. */
  | { kind: 'double'; vk: number }
  /** Modifiers pressed together and let go with nothing else, either side of each. */
  | { kind: 'chord'; mods: Mod[] }
  | { kind: 'key'; mods: Mod[]; vk: number }
  /** A side button of the mouse: 1 back, 2 forward. */
  | { kind: 'mouse'; mods: Mod[]; button: 1 | 2 }
  /** Ctrl+C pressed twice: two copies, seen on the clipboard (never by the hooks nor Electron). */
  | { kind: 'copyTwice' }

/** Ctrl+C pressed twice, a key of the actions on the selected text. */
export const COPY_TWICE = 'Control+C*2'

/** The second tap of a double comes within this of the first. */
export const DOUBLE_MS = 400

const MODS: readonly Mod[] = ['Control', 'Alt', 'Shift', 'Super']

/** Left and right modifier keys: their name in a hotkey, KeyboardEvent.code and virtual-key code. */
const TAPS: readonly { name: string; code: string; vk: number; mod: Mod }[] = [
  { name: 'LeftControl', code: 'ControlLeft', vk: 0xa2, mod: 'Control' },
  { name: 'RightControl', code: 'ControlRight', vk: 0xa3, mod: 'Control' },
  { name: 'LeftShift', code: 'ShiftLeft', vk: 0xa0, mod: 'Shift' },
  { name: 'RightShift', code: 'ShiftRight', vk: 0xa1, mod: 'Shift' },
  { name: 'LeftAlt', code: 'AltLeft', vk: 0xa4, mod: 'Alt' },
  { name: 'RightAlt', code: 'AltRight', vk: 0xa5, mod: 'Alt' },
  { name: 'LeftSuper', code: 'MetaLeft', vk: 0x5b, mod: 'Super' },
  { name: 'RightSuper', code: 'MetaRight', vk: 0x5c, mod: 'Super' },
]

const BUTTONS: Record<string, 1 | 2> = { MouseBack: 1, MouseForward: 2 }

/** Keys that may stand alone: pressing them types nothing. Electron's shortcuts take none of them alone. */
const LONE: Record<string, number> = { Pause: 0x13, CapsLock: 0x14, ScrollLock: 0x91, Insert: 0x2d }
/** Keys that need a modifier: alone, they type. Named as Electron names them. */
const NAMED: Record<string, number> = {
  Space: 0x20,
  Tab: 0x09,
  Enter: 0x0d,
  Backspace: 0x08,
  Delete: 0x2e,
  Home: 0x24,
  End: 0x23,
  PageUp: 0x21,
  PageDown: 0x22,
  Up: 0x26,
  Down: 0x28,
  Left: 0x25,
  Right: 0x27,
  // Esc alone cancels everywhere; with a modifier (Ctrl+Esc, which opens Start) it is a key of the keyboard thread's.
  Escape: 0x1b,
  '`': 0xc0,
  '-': 0xbd,
  '=': 0xbb,
  '[': 0xdb,
  ']': 0xdd,
  '\\': 0xdc,
  ';': 0xba,
  "'": 0xde,
  ',': 0xbc,
  '.': 0xbe,
  '/': 0xbf,
}
/** KeyboardEvent.code of the signs, by their name. */
const SIGNS: Record<string, string> = { Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/' }

/** The virtual-key code of a key's name in a hotkey, and whether it may stand alone. */
function keyCode(name: string): { vk: number; alone: boolean } | undefined {
  if (name in LONE) return { vk: LONE[name] as number, alone: true }
  const f = /^F([1-9]|1\d|2[0-4])$/.exec(name)
  if (f) return { vk: 0x6f + Number(f[1]), alone: true }
  if (/^[A-Z0-9]$/.test(name)) return { vk: name.charCodeAt(0), alone: false }
  if (name in NAMED) return { vk: NAMED[name] as number, alone: false }
  return undefined
}

export function parseHotkey(hotkey: string): HotkeySpec | undefined {
  if (hotkey === COPY_TWICE) return { kind: 'copyTwice' }
  const parts = hotkey.split('+').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return undefined
  if (parts.length === 1) {
    const [name, times] = (parts[0] as string).split('*')
    const tap = TAPS.find(t => t.name === name)
    if (tap && times === undefined) return { kind: 'tap', vk: tap.vk }
    if (tap && times === '2') return { kind: 'double', vk: tap.vk }
  }
  const mods = parts.filter((p): p is Mod => (MODS as readonly string[]).includes(p))
  const rest = parts.filter(p => !(MODS as readonly string[]).includes(p))
  if (rest.length === 0) return mods.length >= 2 ? { kind: 'chord', mods: sortMods(mods) } : undefined
  if (rest.length !== 1) return undefined
  const last = rest[0] as string
  const button = BUTTONS[last]
  if (button) return { kind: 'mouse', mods: sortMods(mods), button }
  const key = keyCode(last)
  if (!key || (!key.alone && mods.length === 0)) return undefined
  return { kind: 'key', mods: sortMods(mods), vk: key.vk }
}

/**
 * Whether Electron's shortcuts can hold a hotkey: a key with a modifier, or
 * F1–F24. Everything else is the keyboard thread's, Esc with a modifier too
 * (Windows takes Ctrl+Esc for Start before a shortcut sees it; the hook keeps
 * it from Start).
 */
export function isAccelerator(hotkey: string): boolean {
  const spec = parseHotkey(hotkey)
  if (spec?.kind !== 'key') return false
  const name = hotkey.split('+').pop() ?? ''
  return !(name in LONE) && name !== 'Escape' && (spec.mods.length > 0 || /^F\d+$/.test(name))
}

/** Ctrl+C twice: the clipboard's, never a key of the keyboard thread or of Electron. */
export function isCopyTwice(hotkey: string): boolean {
  return hotkey === COPY_TWICE
}

function sortMods(mods: readonly Mod[]): Mod[] {
  return MODS.filter(m => mods.includes(m))
}

/** The modifier a virtual-key code is, either side; undefined for any other key. */
export function modOf(vk: number): Mod | undefined {
  if (vk === 0x11) return 'Control'
  if (vk === 0x10) return 'Shift'
  if (vk === 0x12) return 'Alt'
  return TAPS.find(t => t.vk === vk)?.mod
}

/**
 * Keys Windows calls extended (their scan code comes after 0xE0): Right Alt,
 * Right Ctrl, the Win and Menu keys, the arrows and the six keys above them,
 * Print Screen, Num Lock and the number pad's /. A key pressed by a program
 * must say so: Right Alt let go without it is read as Left Alt let go, and
 * Right Alt stays down for Windows (every Ctrl+C after it a Ctrl+Alt+C).
 */
const EXTENDED: ReadonlySet<number> = new Set([0xa5, 0xa3, 0x5b, 0x5c, 0x5d, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2c, 0x2d, 0x2e, 0x6f, 0x90])

export function isExtendedKey(vk: number): boolean {
  return EXTENDED.has(vk)
}

export const onMac = typeof process !== 'undefined' && process.platform ? process.platform === 'darwin' : typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)

/** A hotkey as Windows writes keys: "Left Ctrl", "Ctrl+Shift", "Left Ctrl twice", "Mouse Back". */
export function hotkeyLabel(hotkey: string): string {
  // A key pressed twice that is not a modifier tapped: "Ctrl+C twice".
  if (hotkey.endsWith('*2') && hotkey.includes('+')) return t('keys.twice', { key: hotkeyLabel(hotkey.slice(0, -2)) })
  // On a Mac, Ctrl is Cmd there (registerMacKeys in main.ts).
  const name = (mod: string) => (mod === 'Control' ? (onMac ? '⌘' : 'Ctrl') : mod === 'Alt' && onMac ? '⌥' : mod === 'Super' ? 'Win' : mod)
  return hotkey
    .split('+')
    .map(part => {
      const [key, times] = part.split('*')
      const side = /^(Left|Right)(Control|Shift|Alt|Super)$/.exec(key ?? '')
      if (side) {
        const label = `${side[1]} ${name(side[2] as string)}`
        return times === '2' ? t('keys.twice', { key: label }) : label
      }
      if (part === 'CapsLock') return 'Caps Lock'
      if (part === 'Escape') return 'Esc'
      if (part === 'ScrollLock') return 'Scroll Lock'
      if (part === 'MouseBack') return 'Mouse Back'
      if (part === 'MouseForward') return 'Mouse Forward'
      if (part === 'CommandOrControl' || part === 'CmdOrCtrl') return onMac ? '⌘' : 'Ctrl'
      return name(part)
    })
    .join('+')
}

/** The name of a non-modifier key in a hotkey, from KeyboardEvent.code. */
function nameOfCode(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^Arrow(Up|Down|Left|Right)$/.test(code)) return code.slice(5)
  if (code in SIGNS) return SIGNS[code]
  if (code in LONE || code in NAMED || /^F([1-9]|1\d|2[0-4])$/.test(code)) return code
  return undefined
}

/** Virtual-key codes of the keys named by KeyboardEvent.code alone (Space, Tab…), for the hook's keys. */
const CODES: Record<number, string> = Object.fromEntries([
  ...Object.entries(LONE).map(([code, vk]) => [vk, code]),
  ...Object.entries(NAMED).filter(([name]) => /^[A-Z]/.test(name)).map(([name, vk]) => [vk, /^(Up|Down|Left|Right)$/.test(name) ? `Arrow${name}` : name]),
  ...Object.entries(SIGNS).map(([code, sign]) => [NAMED[sign] as number, code]),
  ...TAPS.map(t => [t.vk, t.code]),
  [0x10, 'ShiftLeft'],
  [0x11, 'ControlLeft'],
  [0x12, 'AltLeft'],
])

/**
 * KeyboardEvent.code of a key the low-level hook saw, by its virtual-key code
 * (the hook names Left and Right Ctrl, Shift, Alt and Win apart), so the hook's
 * keys feed the recorder as a page's would; undefined for a key no hotkey names.
 */
export function codeOfVk(vk: number): string | undefined {
  if (vk >= 0x41 && vk <= 0x5a) return `Key${String.fromCharCode(vk)}`
  if (vk >= 0x30 && vk <= 0x39) return `Digit${String.fromCharCode(vk)}`
  if (vk >= 0x70 && vk <= 0x87) return `F${vk - 0x6f}`
  return CODES[vk]
}

/**
 * A hotkey recorded; `more`: a tap, which a second tap within DOUBLE_MS
 * makes a double. It counts as it is once that time passes with no key.
 */
export type Recorded = { hotkey: string; more?: boolean; partial?: boolean }

/**
 * Records a hotkey from the key and mouse events of a settings field: a key
 * or side button with the modifiers held at that moment, or, once every
 * modifier is let go with no other key pressed, the modifier tapped alone
 * (or twice) or the modifiers pressed together. Ctrl+C is copying, no key:
 * pressed once it comes `partial` (nothing, unless a second follows within
 * DOUBLE_MS), twice it is "Control+C*2".
 */
export class HotkeyRecorder {
  private held = new Set<string>()
  private peak: string[] = []
  private other = false
  /** When the modifier held alone went down, and the last tap: when it was let go. */
  private downAt = 0
  private lastTap: { name: string; at: number } | undefined
  /** When Ctrl+C was pressed, waiting for a second. */
  private lastCopy: number | undefined

  /** A key went down at `now` (ms); returns the hotkey a non-modifier key makes, if any. */
  keydown(code: string, now = 0): Recorded | undefined {
    if (TAPS.some(t => t.code === code)) {
      if (this.held.size === 0) this.downAt = now
      this.held.add(code)
      if (this.held.size > this.peak.length) this.peak = [...this.held]
      return undefined
    }
    this.other = true
    this.lastTap = undefined
    const name = nameOfCode(code)
    const recorded = name ? this.withMods(name) : undefined
    if (recorded?.hotkey !== 'Control+C') {
      this.lastCopy = undefined
      return recorded
    }
    const twice = this.lastCopy !== undefined && now - this.lastCopy <= DOUBLE_MS
    this.lastCopy = twice ? undefined : now
    return twice ? { hotkey: COPY_TWICE } : { hotkey: recorded.hotkey, more: true, partial: true }
  }

  /** Whether a modifier is held now (Esc alone gives up; with one, it is a key). */
  holding(): boolean {
    return this.held.size > 0
  }

  /** A key went up at `now`; returns the tap, double or chord once the last modifier is let go. */
  keyup(code: string, now = 0): Recorded | undefined {
    if (!TAPS.some(t => t.code === code)) return undefined
    this.held.delete(code)
    if (this.held.size > 0) return undefined
    const peak = this.peak
    const other = this.other
    this.peak = []
    this.other = false
    if (other || peak.length === 0) return undefined
    if (peak.length > 1) {
      this.lastTap = undefined
      const mods = sortMods(peak.map(c => TAPS.find(t => t.code === c)?.mod).filter((m): m is Mod => !!m))
      return mods.length >= 2 ? { hotkey: mods.join('+') } : undefined
    }
    const name = TAPS.find(t => t.code === peak[0])?.name
    if (!name) return undefined
    const previous = this.lastTap
    this.lastTap = undefined
    if (previous?.name === name && this.downAt - previous.at <= DOUBLE_MS) return { hotkey: `${name}*2` }
    this.lastTap = { name, at: now }
    return { hotkey: name, more: true }
  }

  /** A mouse button went down: the back or forward button (3, 4 in DOM numbering) is a hotkey. */
  mouse(button: number): Recorded | undefined {
    this.lastTap = undefined
    this.lastCopy = undefined
    this.other = this.held.size > 0
    const name = button === 3 ? 'MouseBack' : button === 4 ? 'MouseForward' : undefined
    return name ? this.withMods(name) : undefined
  }

  reset(): void {
    this.held.clear()
    this.peak = []
    this.other = false
    this.lastTap = undefined
    this.lastCopy = undefined
  }

  private withMods(name: string): Recorded | undefined {
    const mods = sortMods([...this.held].map(c => TAPS.find(t => t.code === c)?.mod).filter((m): m is Mod => !!m).map(m => (onMac && m === 'Super' ? 'Control' : m)))
    const hotkey = [...new Set(mods), name].join('+')
    return parseHotkey(hotkey) ? { hotkey } : undefined
  }
}
