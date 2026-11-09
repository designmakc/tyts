// Windows tells a window about every change of the clipboard
// (WM_CLIPBOARDUPDATE) once it is registered as a listener; the main process
// hears it through the card window's message hook. Whether Ctrl is held is
// read from the keyboard state at that moment. user32 is called through koffi.

import { spawn } from 'node:child_process'
import type { BrowserWindow } from 'electron'
import koffi from 'koffi'
import { loadLib } from './native'

import { MAIN_KEYS } from './winkbd'

const WM_CLIPBOARDUPDATE = 0x031d
const VK_CONTROL = 0x11

const user32 = loadLib('user32.dll')
const AddClipboardFormatListener = user32.func('bool __stdcall AddClipboardFormatListener(intptr_t hwnd)')
const RemoveClipboardFormatListener = user32.func('bool __stdcall RemoveClipboardFormatListener(intptr_t hwnd)')
const GetAsyncKeyState = user32.func('short __stdcall GetAsyncKeyState(int vKey)')

/** The window's HWND, as koffi takes an `intptr_t`. */
export function handleOf(window: BrowserWindow): bigint {
  const buffer = window.getNativeWindowHandle()
  return buffer.length >= 8 ? buffer.readBigUInt64LE(0) : BigInt(buffer.readUInt32LE(0))
}

/** Calls `onChange` on every clipboard change until the returned function is called. */
export function watchClipboard(window: BrowserWindow, onChange: () => void, macHelper?: string): () => void {
  if (process.platform === 'darwin' && macHelper) return watchClipboardMac(macHelper, onChange)
  if (process.platform !== 'win32') throw new Error('not on this system yet')
  const hwnd = handleOf(window)
  window.hookWindowMessage(WM_CLIPBOARDUPDATE, () => onChange())
  if (!AddClipboardFormatListener(hwnd)) throw new Error('Windows did not let Tyts watch the clipboard')
  return () => {
    RemoveClipboardFormatListener(hwnd)
    // On quitting, the window may be gone already.
    if (!window.isDestroyed()) window.unhookWindowMessage(WM_CLIPBOARDUPDATE)
  }
}

const WM_RENDERFORMAT = 0x0305
const WM_RENDERALLFORMATS = 0x0306

/** The window owns Kryakl's promised text (winclipboard.ts): `onRead` when a program asks for it, `onGoing` when the window goes first. */
export function watchRendering(window: BrowserWindow, onRead: () => void, onGoing: () => void): () => void {
  if (process.platform !== 'win32') return () => {}
  // Called within Windows' message: the text must be handed over before the hook returns.
  window.hookWindowMessage(WM_RENDERFORMAT, () => onRead())
  window.hookWindowMessage(WM_RENDERALLFORMATS, () => onGoing())
  return () => {
    if (window.isDestroyed()) return
    window.unhookWindowMessage(WM_RENDERFORMAT)
    window.unhookWindowMessage(WM_RENDERALLFORMATS)
  }
}

const keybd_event = user32.func('void __stdcall keybd_event(uint8_t vk, uint8_t scan, uint32_t flags, uintptr_t extra)')
const KEYEVENTF_KEYUP = 0x0002
const VK_SHIFT = 0x10
const VK_MENU = 0x12
const VK_LWIN = 0x5b
const VK_RWIN = 0x5c
const VK_C = 0x43
const VK_V = 0x56
const VK_RETURN = 0x0d
const MODIFIERS = [VK_CONTROL, VK_SHIFT, VK_MENU, VK_LWIN, VK_RWIN]

function held(vk: number): boolean {
  return (Number(GetAsyncKeyState(vk)) & 0x8000) !== 0
}

/** On a Mac: whether Command was held at the last change, as build/clip-mac.swift read it then. */
let commandAtChange = false
/** On a Mac: whether the last change was marked by a password manager (nspasteboard.org's concealed or transient type). */
let concealedAtChange = false

/** A Mac's last clipboard change was a password manager's, marked for others to leave alone. */
export function macConcealed(): boolean {
  return concealedAtChange
}

/** A Mac's clipboard changes, from build/clip-mac.swift: one line a change, 1 when Command was held, " concealed" after it for a password manager's copy. */
function watchClipboardMac(exe: string, onChange: () => void): () => void {
  const child = spawn(exe, [], { stdio: ['pipe', 'pipe', 'ignore'] })
  let rest = ''
  child.stdout.on('data', (chunk: Buffer) => {
    const lines = (rest + chunk.toString()).split('\n')
    rest = lines.pop() ?? ''
    for (const line of lines) {
      const [command, mark] = line.trim().split(' ')
      commandAtChange = command === '1'
      concealedAtChange = mark === 'concealed'
      onChange()
    }
  })
  let stopped = false
  child.on('error', error => console.warn('Tyts: the clipboard watcher did not start', error))
  child.on('exit', code => {
    if (!stopped) console.warn(`Tyts: the clipboard watcher stopped (${code})`)
  })
  return () => {
    stopped = true
    child.kill()
  }
}

/** Ctrl held now; on a Mac, Command held at the clipboard's last change (its own reading, not the key now). */
export function ctrlHeld(): boolean {
  if (process.platform === 'darwin') return commandAtChange
  return held(VK_CONTROL)
}

/**
 * Presses Ctrl+C in the program in front, as the person would: once the
 * shortcut's own keys are let go (an Alt still down would make it Ctrl+Alt+C),
 * or after `maxWaitMs` regardless. Resolves to the modifiers still down when
 * it was pressed, by name ("Right Alt"): none, unless one outlasted the wait.
 */
export async function pressCopy(maxWaitMs = 1500): Promise<string[]> {
  return pressWithCtrl(VK_C, maxWaitMs)
}

/** Presses Ctrl+V in the program in front, the same way. */
export async function pressPaste(maxWaitMs = 1500): Promise<string[]> {
  return pressWithCtrl(VK_V, maxWaitMs)
}

/** Resolves once none of `keys` is held, or after `maxWaitMs` regardless. */
async function letGo(keys: readonly number[], maxWaitMs: number): Promise<void> {
  const until = Date.now() + maxWaitMs
  while (keys.some(held) && Date.now() < until) {
    await new Promise(resolve => setTimeout(resolve, 15))
  }
}

/**
 * Resolves once Enter and the modifiers are let go: a key still down when
 * another window comes to the front reaches that window (an Enter held there
 * sends a chat message).
 */
export function keysLetGo(maxWaitMs = 1500): Promise<void> {
  return letGo([VK_RETURN, ...MODIFIERS], maxWaitMs)
}

const VK_LEFT = 0x25
const VK_RIGHT = 0x27
const KEYEVENTF_EXTENDEDKEY = 0x0001

/**
 * An arrow, said to be the extended key: without it Windows takes it for the
 * number pad's, and with NumLock on lets go of Shift for it (2026-10-31).
 */
function pressArrow(vk: number, times: number): void {
  for (let i = 0; i < times; i++) {
    keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY, MAIN_KEYS)
    keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, MAIN_KEYS)
  }
}

/**
 * The text just pasted, `chars` before the cursor, selected again: Left to
 * its start, then Shift+Right to its end, so the cursor ends where it was,
 * after the text, as in a selection made left to right.
 */
export async function pressSelectBack(chars: number, maxWaitMs = 1500): Promise<void> {
  await letGo(MODIFIERS, maxWaitMs)
  pressArrow(VK_LEFT, chars)
  keybd_event(VK_SHIFT, 0, 0, MAIN_KEYS)
  pressArrow(VK_RIGHT, chars)
  keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, MAIN_KEYS)
}

const GetForegroundWindow = user32.func('intptr_t __stdcall GetForegroundWindow()')

/** Resolves once `hwnd` is the window in front (Windows brings it there a moment after being asked), or after `maxWaitMs` regardless. */
export async function inFront(hwnd: bigint, maxWaitMs = 500): Promise<void> {
  const until = Date.now() + maxWaitMs
  while (BigInt(GetForegroundWindow() as number | bigint) !== hwnd && Date.now() < until) {
    await new Promise(resolve => setTimeout(resolve, 15))
  }
}

const AllowSetForegroundWindow = user32.func('bool __stdcall AllowSetForegroundWindow(uint32_t pid)')
const ASFW_ANY = 0xffffffff

/** Lets any program come to the front next (Windows lets the program in front allow it): a Chrome that runs already, say. */
export function allowForeground(): void {
  AllowSetForegroundWindow(ASFW_ANY)
}

/** Each side's modifier keys, by the names tyts.log gives them. */
const SIDES: readonly [number, string][] = [
  [0xa2, 'Left Ctrl'],
  [0xa3, 'Right Ctrl'],
  [0xa0, 'Left Shift'],
  [0xa1, 'Right Shift'],
  [0xa4, 'Left Alt'],
  [0xa5, 'Right Alt'],
  [VK_LWIN, 'Left Win'],
  [VK_RWIN, 'Right Win'],
]

async function pressWithCtrl(vk: number, maxWaitMs: number): Promise<string[]> {
  await letGo(MODIFIERS, maxWaitMs)
  const down = SIDES.filter(([key]) => held(key)).map(([, name]) => name)
  keybd_event(VK_CONTROL, 0, 0, MAIN_KEYS)
  keybd_event(vk, 0, 0, MAIN_KEYS)
  keybd_event(vk, 0, KEYEVENTF_KEYUP, MAIN_KEYS)
  keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, MAIN_KEYS)
  return down
}
