// Kryakl's menu on one key (menuwindow.ts shows it, the keyboard thread takes
// its keys): the actions in the sidebar's groups, each with the letter of its
// name in the interface's language. A letter is a physical key
// (KeyboardEvent.code), so it picks the same item in any layout: Russian's
// П is the key of English G. The tester's idea of 2026-11-04, the owner's
// prototype's table.

import type { UiLanguage } from './i18n'

/** What an item of the menu does (main.ts runMenu). */
export type MenuAction = 'translate' | 'listen' | 'inPlace' | 'screen' | 'check' | 'talk' | 'dictate' | 'english' | 'fix' | 'clipboard'

/** An item: what it does, the letter shown, and the key that picks it; `label` in place of the action's name (a clip of the clipboard history). */
export type MenuItem = { id: MenuAction; letter: string; code: string; label?: string }

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
    ],
    [
      ['dictate', 'Г', 'KeyU'],
      ['english', 'В', 'KeyD'],
    ],
    [
      ['fix', 'И', 'KeyB'],
      ['clipboard', 'Б', 'Comma'],
    ],
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
    ],
    [
      ['dictate', 'Г', 'KeyU'],
      ['english', 'К', 'KeyR'],
    ],
    [
      ['fix', 'В', 'KeyD'],
      ['clipboard', 'Б', 'Comma'],
    ],
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
    ],
    [
      ['dictate', 'V', 'KeyV'],
      ['english', 'E', 'KeyE'],
    ],
    [
      ['fix', 'F', 'KeyF'],
      ['clipboard', 'H', 'KeyH'],
    ],
  ],
}

/** The voice's items, which need the speech engine. */
const VOICE: ReadonlySet<MenuAction> = new Set(['dictate', 'english'])

/** The menu's groups for this language; the voice's items only once the speech engine is installed, the clipboard history's only when it is on. */
export function menuGroups(lang: UiLanguage, speech: boolean, clips = false): MenuItem[][] {
  return MENU[lang]
    .map(group => group.filter(([id]) => (speech || !VOICE.has(id)) && (clips || id !== 'clipboard')).map(([id, letter, code]) => ({ id, letter, code })))
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

/** The clipboard history's list as the menu's items: the pinned, then the others; digits 1–9 pick the first nine. */
export function clipGroups(clips: readonly { text: string; pinned?: boolean }[], line: (text: string) => string): MenuItem[][] {
  let n = 0
  const item = (c: { text: string }): MenuItem => {
    const digit = ++n <= 9 ? String(n) : ''
    return { id: 'clipboard', letter: digit, code: digit ? `Digit${digit}` : '', label: line(c.text) }
  }
  return [clips.filter(c => c.pinned).map(item), clips.filter(c => !c.pinned).map(item)].filter(g => g.length > 0)
}
