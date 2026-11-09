// Kryakl's menu on one key (menuwindow.ts shows it, the keyboard thread takes
// its keys): the actions in the sidebar's groups, each with the letter of its
// name in the interface's language. A letter is a physical key
// (KeyboardEvent.code), so it picks the same item in any layout: Russian's
// П is the key of English G. The tester's idea of 2026-11-04, the owner's
// prototype's table.

import type { UiLanguage } from './i18n'
import type { RewriteStyle } from './rewrite'

/** What an item of the menu does (main.ts runMenu). */
export type MenuAction = 'translate' | 'listen' | 'inPlace' | 'screen' | 'check' | 'talk' | 'rewrite' | 'dictate' | 'english' | 'fix' | RewriteStyle

/** An item: what it does, the letter shown, and the key that picks it. */
export type MenuItem = { id: MenuAction; letter: string; code: string }

type Row = [MenuAction, string, string]

/** The groups, each item's letter and key, per interface language: the translating, the English, the voice, the layout. */
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
    [['fix', 'И', 'KeyB']],
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
    [['fix', 'В', 'KeyD']],
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
    [['fix', 'F', 'KeyF']],
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

/** The menu's groups for this language; the voice's items only once the speech engine is installed. */
export function menuGroups(lang: UiLanguage, speech: boolean): MenuItem[][] {
  return MENU[lang]
    .map(group => group.filter(([id]) => speech || !VOICE.has(id)).map(([id, letter, code]) => ({ id, letter, code })))
    .filter(group => group.length > 0)
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
