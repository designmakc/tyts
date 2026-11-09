// Tyts's menu on one key (menuwindow.ts shows it, the keyboard thread takes
// its keys): the actions in the sidebar's groups, each with the letter of its
// name in the interface's language. A letter is a physical key
// (KeyboardEvent.code), so it picks the same item in any layout: Russian's
// П is the key of English G. The tester's idea of 2026-11-04, the owner's
// prototype's table.

import type { UiLanguage } from './i18n'
import type { RewriteStyle } from './rewrite'

/** What an item of the menu does (main.ts runMenu). */
export type MenuAction = 'translate' | 'listen' | 'inPlace' | 'screen' | 'check' | 'talk' | 'rewrite' | 'dictate' | 'english' | 'fix' | 'awake' | 'clipboard' | RewriteStyle

/** An item: what it does, the letter shown, and the key that picks it; `label` in place of the action's name (a clip of the clipboard history). */
export type MenuItem = { id: MenuAction; letter: string; code: string; label?: string }

type Row = [MenuAction, string, string]

/** The groups, each item's letter and key, per interface language: the translating, the English, the voice, the layout, keeping the computer awake. */
const MENU: Readonly<Record<UiLanguage, readonly (readonly Row[])[]>> = {
  ru: [
    [
      ['translate', 'П', 'KeyG'],
      ['listen', 'Ч', 'KeyX'],
      ['inPlace', 'З', 'KeyP'],
      ['screen', 'Э', 'Quote'],
    ],
    [
      ['check', 'А', 'KeyF'],
      ['talk', 'Р', 'KeyH'],
      ['rewrite', 'Е', 'KeyT'],
    ],
    [
      ['dictate', 'Г', 'KeyU'],
      ['english', 'В', 'KeyD'],
    ],
    [
      ['fix', 'И', 'KeyB'],
      ['clipboard', 'Б', 'Comma'],
    ],
    [['awake', 'Н', 'KeyY']],
  ],
  uk: [
    [
      ['translate', 'П', 'KeyG'],
      ['listen', 'Ч', 'KeyX'],
      ['inPlace', 'З', 'KeyP'],
      ['screen', 'Е', 'KeyT'],
    ],
    [
      ['check', 'А', 'KeyF'],
      ['talk', 'Р', 'KeyH'],
      ['rewrite', 'С', 'KeyC'],
    ],
    [
      ['dictate', 'Г', 'KeyU'],
      ['english', 'К', 'KeyR'],
    ],
    [
      ['fix', 'В', 'KeyD'],
      ['clipboard', 'Б', 'Comma'],
    ],
    [['awake', 'Н', 'KeyY']],
  ],
  en: [
    [
      ['translate', 'T', 'KeyT'],
      ['listen', 'R', 'KeyR'],
      ['inPlace', 'P', 'KeyP'],
      ['screen', 'S', 'KeyS'],
    ],
    [
      ['check', 'C', 'KeyC'],
      ['talk', 'D', 'KeyD'],
      ['rewrite', 'W', 'KeyW'],
    ],
    [
      ['dictate', 'V', 'KeyV'],
      ['english', 'E', 'KeyE'],
    ],
    [
      ['fix', 'F', 'KeyF'],
      ['clipboard', 'H', 'KeyH'],
    ],
    [['awake', 'K', 'KeyK']],
  ],
}

/** Rewrite…'s own list, opened in the menu in place of its groups: what the local model does to the selection (rewrite.ts). */
const REWRITE: Readonly<Record<UiLanguage, readonly Row[]>> = {
  ru: [
    ['shorten', 'С', 'KeyC'],
    ['polite', 'В', 'KeyD'],
    ['formal', 'О', 'KeyJ'],
    ['natural', 'А', 'KeyF'],
    ['explain', 'П', 'KeyG'],
  ],
  uk: [
    ['shorten', 'С', 'KeyC'],
    ['polite', 'В', 'KeyD'],
    ['formal', 'О', 'KeyJ'],
    ['natural', 'А', 'KeyF'],
    ['explain', 'П', 'KeyG'],
  ],
  en: [
    ['shorten', 'S', 'KeyS'],
    ['polite', 'P', 'KeyP'],
    ['formal', 'F', 'KeyF'],
    ['natural', 'N', 'KeyN'],
    ['explain', 'E', 'KeyE'],
  ],
}

/** Rewrite…'s list for this language: the four that replace the selection, then Explain. */
export const rewriteGroups = (lang: UiLanguage): MenuItem[][] => [REWRITE[lang].map(([id, letter, code]) => ({ id, letter, code }))]

/** The voice's items, which need the speech engine. */
const VOICE: ReadonlySet<MenuAction> = new Set(['dictate', 'english'])

/** The menu's groups for this language; the voice's items only once the speech engine is installed, the clipboard history's only when it is on. */
export function menuGroups(lang: UiLanguage, speech: boolean, clips = false): MenuItem[][] {
  return MENU[lang]
    .map(group => group.filter(([id]) => (speech || !VOICE.has(id)) && (clips || id !== 'clipboard')).map(([id, letter, code]) => ({ id, letter, code })))
    .filter(group => group.length > 0)
}

/** What a button of the bar by a selection does: the menu's actions on a selection (main.ts runMenu), Copy, leaving this program out, the setting's page. */
export type BarAction = 'translate' | 'listen' | 'check' | 'copy' | 'notHere' | 'settings' | RewriteStyle

/** The pill's buttons, after the dot; "…" opens the list (`BAR_LIST`). */
export const BAR_ROW: readonly BarAction[] = ['translate', 'listen', 'check']

/** "…"'s list: the rewrite styles and Copy, then, after a line, leaving this program out and the settings. */
export const BAR_LIST: readonly (readonly BarAction[])[] = [
  ['shorten', 'polite', 'formal', 'natural', 'explain', 'copy'],
  ['notHere', 'settings'],
]

/** Whether a page's word names a button of the bar. */
export function isBarAction(id: string): id is BarAction {
  return (BAR_ROW as readonly string[]).includes(id) || BAR_LIST.some(group => (group as readonly string[]).includes(id))
}

/** The bar's look: the dot alone, the pill, or the pill with "…"'s list. */
export type BarPhase = 'dot' | 'pill' | 'list'
/** The pill folds back into the dot this long after the pointer left it; the dot goes this long after that (or after it came). */
export const BAR_FOLD_MS = 600
export const BAR_DOT_MS = 4000
/** What the bar is now: its look, and since when the pointer has been away from it (undefined: over it). */
export type BarClock = { phase: BarPhase; away: number | undefined }

/** The bar's next look, the pointer over it (`inside`) or not at `now`: over the dot it opens; away, the pill folds and the dot goes ('gone'). */
export function barTick(c: BarClock, inside: boolean, now: number): BarClock | 'gone' {
  if (inside) return { phase: c.phase === 'dot' ? 'pill' : c.phase, away: undefined }
  const away = c.away ?? now
  if (c.phase !== 'dot') return now - away >= BAR_FOLD_MS ? { phase: 'dot', away: now } : { phase: c.phase, away }
  return now - away >= BAR_DOT_MS ? 'gone' : { phase: 'dot', away }
}

/** The keys the menu takes besides its letters: ↑ ↓ move, Enter picks, Esc closes. */
export const MENU_MOVES: ReadonlySet<string> = new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Escape'])

/** What a key pressed in the open menu does: picks an item (its index among all), moves the light, or closes it. */
export function menuKeyOf(code: string, items: readonly MenuItem[], lit: number): { pick: number } | { lit: number } | 'close' | undefined {
  const n = items.length
  if (code === 'Escape') return 'close'
  if (n === 0) return undefined
  if (code === 'ArrowDown') return { lit: (lit + 1) % n }
  if (code === 'ArrowUp') return { lit: (lit + n - 1) % n }
  if (code === 'Enter') return { pick: Math.min(Math.max(lit, 0), n - 1) }
  const i = items.findIndex(it => it.code === code)
  return i >= 0 ? { pick: i } : undefined
}

/** The clipboard history's list as the menu's items: the pinned, then the others; digits 1–9 pick the first nine. */
export function clipGroups(clips: readonly { text: string; pinned?: boolean }[], line: (text: string) => string): MenuItem[][] {
  let n = 0
  const item = (c: { text: string }): MenuItem => {
    const digit = ++n <= 9 ? String(n) : ''
    return { id: 'clipboard', letter: digit, code: digit ? `Digit${digit}` : '', label: line(c.text) }
  }
  return [clips.filter(c => c.pinned).map(item), clips.filter(c => !c.pinned).map(item)].filter(g => g.length > 0)
}
