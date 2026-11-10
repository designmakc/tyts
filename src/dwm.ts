// Windows 11 draws a frameless window's edge itself: rounded corners and a
// 1px border (DWM). A page that draws its own border too shows two. So on
// Windows 11 Kryakl's windows take DWM's edge in Kryakl's colors, and the
// pages leave theirs transparent (`html.dwm`, told by `?frame=dwm`).
// Windows 10 knows neither attribute: the pages keep their own border there.

import * as os from 'node:os'

import type { BrowserWindow } from 'electron'
import { loadLib } from './native'

import { handleOf } from './winclip'

/** Windows 11 is build 22000 and later. */
export const WIN11 = process.platform === 'win32' && Number(os.release().split('.')[2]) >= 22000

const DWMWA_WINDOW_CORNER_PREFERENCE = 33
const DWMWA_BORDER_COLOR = 34
const DWMWA_COLOR_NONE = 0xfffffffe
const CORNERS = { default: 0, square: 1, round: 2, small: 3 } as const

type SetAttribute = (hwnd: bigint, attr: number, value: Buffer, size: number) => number
let setAttribute: SetAttribute | undefined
/** dwmapi is loaded on the first frame, so other systems never touch it. */
function dwm(): SetAttribute {
  return (setAttribute ??= loadLib('dwmapi.dll').func('int32_t __stdcall DwmSetWindowAttribute(intptr_t hwnd, uint32_t attr, void *value, uint32_t size)'))
}

export type Frame = {
  corner: keyof typeof CORNERS
  /** '#rrggbb', or 'none' for no border at all. */
  border: string
}

/** Gives the window Windows 11's edge: its corners and its border's color. Nothing elsewhere. */
export function frameWindow(win: BrowserWindow, opts: Frame): void {
  if (!WIN11 || win.isDestroyed()) return
  try {
    const hwnd = handleOf(win)
    set(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, CORNERS[opts.corner])
    set(hwnd, DWMWA_BORDER_COLOR, opts.border === 'none' ? DWMWA_COLOR_NONE : colorRef(opts.border))
  } catch (error) {
    console.warn('Tyts: Windows did not take the window frame', error)
  }
}

function set(hwnd: bigint, attr: number, value: number): void {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0)
  const result = dwm()(hwnd, attr, buffer, 4)
  if (result !== 0) throw new Error(`DwmSetWindowAttribute(${attr}) answered 0x${(result >>> 0).toString(16)}`)
}

/** '#rrggbb' as Windows writes a color: 0x00BBGGRR. */
function colorRef(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) throw new Error(`Not a color: ${hex}`)
  const [r, g, b] = [m[1], m[2], m[3]].map(part => parseInt(part!, 16)) as [number, number, number]
  return (b << 16) | (g << 8) | r
}
