// The Mac's keys in the Windows terms typist.ts thinks in: a Mac key code
// (Carbon's kVK_*) as a virtual-key code, a layout's characters as a KeyTable.
// Cmd is Ctrl here, as Kryakl's keys read it on a Mac (hotkey.ts hotkeyLabel
// shows Control as ⌘); Option is Alt; Control is Win.

import { execFileSync } from 'node:child_process'

import { keyId, tableOf, type KeyTable } from './layoutfix'
import type { KeyboardLayout } from './protocol'
import type { Caret } from './typist'

/** Mac key code → Windows virtual-key code; keys left out (the number pad, Fn) are no key to Kryakl. */
export const MAC_TO_VK: Readonly<Record<number, number>> = {
  // Letters, in the Mac's order.
  0: 0x41, 11: 0x42, 8: 0x43, 2: 0x44, 14: 0x45, 3: 0x46, 5: 0x47, 4: 0x48, 34: 0x49, 38: 0x4a, 40: 0x4b, 37: 0x4c, 46: 0x4d,
  45: 0x4e, 31: 0x4f, 35: 0x50, 12: 0x51, 15: 0x52, 1: 0x53, 17: 0x54, 32: 0x55, 9: 0x56, 13: 0x57, 7: 0x58, 16: 0x59, 6: 0x5a,
  // Digits.
  29: 0x30, 18: 0x31, 19: 0x32, 20: 0x33, 21: 0x34, 23: 0x35, 22: 0x36, 26: 0x37, 28: 0x38, 25: 0x39,
  // Signs: ; = , - . / ` [ \ ] ' and the ISO key by the left Shift.
  41: 0xba, 24: 0xbb, 43: 0xbc, 27: 0xbd, 47: 0xbe, 44: 0xbf, 50: 0xc0, 33: 0xdb, 42: 0xdc, 30: 0xdd, 39: 0xde, 10: 0xe2,
  // Return, Tab, Space, Backspace, Esc, Forward Delete, Home, End, Page Up, Page Down, the arrows.
  36: 0x0d, 48: 0x09, 49: 0x20, 51: 0x08, 53: 0x1b, 117: 0x2e, 115: 0x24, 119: 0x23, 116: 0x21, 121: 0x22, 123: 0x25, 124: 0x27, 125: 0x28, 126: 0x26,
  // Cmd, Shift, Option, Control (left, right), Caps Lock.
  55: 0xa2, 54: 0xa3, 56: 0xa0, 60: 0xa1, 58: 0xa4, 61: 0xa5, 59: 0x5b, 62: 0x5c, 57: 0x14,
  // F1–F20.
  122: 0x70, 120: 0x71, 99: 0x72, 118: 0x73, 96: 0x74, 97: 0x75, 98: 0x76, 100: 0x77, 101: 0x78, 109: 0x79, 103: 0x7a, 111: 0x7b,
  105: 0x7c, 107: 0x7d, 113: 0x7e, 106: 0x7f, 64: 0x80, 79: 0x81, 80: 0x82, 90: 0x83,
}

export const VK_TO_MAC: Readonly<Record<number, number>> = Object.fromEntries(Object.entries(MAC_TO_VK).map(([mac, vk]) => [vk, Number(mac)]))

/** A layout as the helper reports it: per Mac key code, what it types without and with Shift ('' for nothing). */
export type MacLayout = { id: string; name: string; lang: string; keys: Record<string, [string, string]> }

/** What a Mac layout's keys type, as typist.ts reads a Windows layout's. */
export function macTable(layout: MacLayout): KeyTable {
  const entries: [string, string][] = []
  for (const shift of [false, true]) {
    for (const [code, chars] of Object.entries(layout.keys)) {
      const vk = MAC_TO_VK[Number(code)]
      const char = chars[shift ? 1 : 0]
      if (vk !== undefined && char) entries.push([keyId(vk, shift), char])
    }
  }
  return tableOf(entries)
}

/** A language code of the layout fixer's ("uk" from "uk-UA"), lower case. */
export function macLang(layout: MacLayout): string {
  return (layout.lang.split(/[-_]/)[0] ?? '').toLowerCase()
}

/** A Mac layout for the settings: its name as macOS gives it, its language's short tag. */
export function macKeyboardLayout(layout: MacLayout): KeyboardLayout {
  const lang = macLang(layout)
  return { id: layout.id, name: layout.name || layout.id, short: (lang || layout.id.split('.').pop() || '?').slice(0, 2).toUpperCase(), lang }
}

let cached: { at: number; list: KeyboardLayout[] } | undefined
/** The Mac's keyboard layouts, asked of the helper (`kbd-mac layouts`), kept 10 s. */
export function macKeyboardLayouts(helper: string): KeyboardLayout[] {
  if (cached && Date.now() - cached.at < 10_000) return cached.list
  let list: KeyboardLayout[] = []
  try {
    list = (JSON.parse(execFileSync(helper, ['layouts'], { encoding: 'utf8', timeout: 3000 })) as MacLayout[]).map(macKeyboardLayout)
  } catch {
    // No helper (a build without it): no layouts, as on a computer with none.
  }
  cached = { at: Date.now(), list }
  return list
}

/** The helper's `caret` answer as the badge's place: points from the main screen's top left; none when it found none or a nonsense one. */
export function macCaret(answer: { x?: unknown; y?: unknown; h?: unknown }): Caret | undefined {
  const { x, y, h } = answer
  if (typeof x !== 'number' || typeof y !== 'number' || typeof h !== 'number') return undefined
  if (![x, y, h].every(Number.isFinite) || h <= 0 || h > 400) return undefined
  return { x, y, h }
}
