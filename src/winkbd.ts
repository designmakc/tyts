// Windows' keyboard layouts, through user32 and koffi: the layouts installed,
// what each key types in one, the window in front and its layout, switching
// it, the text cursor's place and typing. Used by the main process and by the
// keyboard thread (kbd-worker.ts), each loading user32 for itself.

import * as path from 'node:path'

import koffi from 'koffi'
import { loadLib } from './native'

import { isExtendedKey } from './hotkey'
import { keyId, tableOf, type KeyTable } from './layoutfix'

const user32 = loadLib('user32.dll')
const kernel32 = loadLib('kernel32.dll')
const advapi32 = loadLib('advapi32.dll')
const shell32 = loadLib('shell32.dll')

const POINT = koffi.struct('KbdPoint', { x: 'int32', y: 'int32' })
const RECT = koffi.struct('KbdRect', { left: 'int32', top: 'int32', right: 'int32', bottom: 'int32' })
const GUITHREADINFO = koffi.struct('KbdGuiThreadInfo', {
  cbSize: 'uint32',
  flags: 'uint32',
  hwndActive: 'intptr',
  hwndFocus: 'intptr',
  hwndCapture: 'intptr',
  hwndMenuOwner: 'intptr',
  hwndMoveSize: 'intptr',
  hwndCaret: 'intptr',
  rcCaret: RECT,
})
const KEYBDINPUT = koffi.struct('KbdKeybdInput', { wVk: 'uint16', wScan: 'uint16', dwFlags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr' })
// INPUT is a type and a union as large as its mouse member: 40 bytes on 64-bit Windows.
const INPUT = koffi.struct('KbdInput', { type: 'uint32', ki: KEYBDINPUT, pad: koffi.array('uint8', 8) })

const GetKeyboardLayoutList = user32.func('int __stdcall GetKeyboardLayoutList(int n, void *list)')
const GetKeyboardLayout = user32.func('intptr __stdcall GetKeyboardLayout(uint32 tid)')
const ToUnicodeEx = user32.func('int __stdcall ToUnicodeEx(uint32 vk, uint32 scan, const uint8_t *state, void *buf, int n, uint32 flags, intptr hkl)')
const MapVirtualKeyExW = user32.func('uint32 __stdcall MapVirtualKeyExW(uint32 code, uint32 type, intptr hkl)')
const LCIDToLocaleName = kernel32.func('int __stdcall LCIDToLocaleName(uint32 lcid, void *name, int n, uint32 flags)')
const GetForegroundWindow = user32.func('intptr __stdcall GetForegroundWindow()')
const GetWindowThreadProcessId = user32.func('uint32 __stdcall GetWindowThreadProcessId(intptr hwnd, _Out_ uint32 *pid)')
const PostMessageW = user32.func('bool __stdcall PostMessageW(intptr hwnd, uint32 msg, uintptr w, intptr l)')
const SetForegroundWindow = user32.func('bool __stdcall SetForegroundWindow(intptr hwnd)')
const GetKeyState = user32.func('short __stdcall GetKeyState(int vk)')
const AttachThreadInput = user32.func('bool __stdcall AttachThreadInput(uint32 thread, uint32 to, bool attach)')
const IsHungAppWindow = user32.func('bool __stdcall IsHungAppWindow(intptr hwnd)')
const GetCurrentThreadId = kernel32.func('uint32 __stdcall GetCurrentThreadId()')
const GetGUIThreadInfo = user32.func('bool __stdcall GetGUIThreadInfo(uint32 tid, _Inout_ KbdGuiThreadInfo *info)')
const ClientToScreen = user32.func('bool __stdcall ClientToScreen(intptr hwnd, _Inout_ KbdPoint *point)')
const GetWindowRect = user32.func('bool __stdcall GetWindowRect(intptr hwnd, _Out_ KbdRect *rect)')
const MONITORINFO = koffi.struct('KbdMonitorInfo', { cbSize: 'uint32', rcMonitor: RECT, rcWork: RECT, dwFlags: 'uint32' })
const MonitorFromWindow = user32.func('intptr __stdcall MonitorFromWindow(intptr hwnd, uint32 flags)')
const GetMonitorInfoW = user32.func('bool __stdcall GetMonitorInfoW(intptr monitor, _Inout_ KbdMonitorInfo *info)')
const IsZoomed = user32.func('bool __stdcall IsZoomed(intptr hwnd)')
const MONITOR_DEFAULTTONEAREST = 2
const SendInput = user32.func('uint32 __stdcall SendInput(uint32 n, KbdInput *inputs, int size)')
const OpenProcess = kernel32.func('intptr __stdcall OpenProcess(uint32 access, bool inherit, uint32 pid)')
const QueryFullProcessImageNameW = kernel32.func('bool __stdcall QueryFullProcessImageNameW(intptr process, uint32 flags, void *name, _Inout_ uint32 *size)')
const CloseHandle = kernel32.func('bool __stdcall CloseHandle(intptr handle)')
const OpenProcessToken = advapi32.func('bool __stdcall OpenProcessToken(intptr process, uint32 access, _Out_ intptr *token)')
const GetTokenInformation = advapi32.func('bool __stdcall GetTokenInformation(intptr token, int cls, _Out_ uint32 *info, uint32 size, _Out_ uint32 *returned)')
const SHQueryUserNotificationState = shell32.func('int32 __stdcall SHQueryUserNotificationState(_Out_ int32 *state)')
const EnumWindowsProc = koffi.proto('bool __stdcall KbdEnumWindowsProc(intptr hwnd, intptr param)')
const EnumWindows = user32.func('bool __stdcall EnumWindows(KbdEnumWindowsProc *proc, intptr param)')
const IsWindowVisible = user32.func('bool __stdcall IsWindowVisible(intptr hwnd)')
const GetWindowTextLengthW = user32.func('int __stdcall GetWindowTextLengthW(intptr hwnd)')
const GetWindow = user32.func('intptr __stdcall GetWindow(intptr hwnd, uint32 cmd)')
const GetWindowLongPtrW = user32.func('intptr __stdcall GetWindowLongPtrW(intptr hwnd, int index)')
const GetClassNameW = user32.func('int __stdcall GetClassNameW(intptr hwnd, void *name, int n)')
const SetWindowPos = user32.func('bool __stdcall SetWindowPos(intptr hwnd, intptr after, int x, int y, int cx, int cy, uint32 flags)')
const HWND_TOPMOST = -1
const SWP_NOSIZE = 0x1
const SWP_NOMOVE = 0x2
const SWP_NOACTIVATE = 0x10
const GW_HWNDPREV = 3
const GW_OWNER = 4
const GWL_EXSTYLE = -20
const WS_EX_TOPMOST = 0x8
const WS_EX_TRANSPARENT = 0x20
const DWMWA_CLOAKED = 14

const WM_INPUTLANGCHANGEREQUEST = 0x0050
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
const TOKEN_QUERY = 0x0008
const TOKEN_ELEVATION = 20
/** SHQueryUserNotificationState: a program on the full screen, a Direct3D one, presentation mode. */
export const FULL_SCREEN_STATES = new Set([2, 3, 4])
const INPUT_KEYBOARD = 1
const KEYEVENTF_EXTENDEDKEY = 0x0001
const KEYEVENTF_KEYUP = 0x0002
const KEYEVENTF_UNICODE = 0x0004
/** Keys Kryakl presses itself carry this, so the keyboard thread lets them by. */
export const OWN_KEYS = 0x2a7a
/** Keys the person pressed while a fix was being typed, pressed again after it: theirs, not Kryakl's. */
export const REPLAY_KEYS = 0x2a7b
/** The main process's Ctrl+C and Ctrl+V (winclip.ts): another program's keys to the thread, but never "a program pressing keys by itself". */
export const MAIN_KEYS = 0x2a7c

/** A layout's id as settings.ts keeps it: the low half of its handle, "04090409". */
export function layoutId(hkl: bigint | number): string {
  return BigInt.asUintN(32, BigInt(hkl)).toString(16).toUpperCase().padStart(8, '0')
}

export type InstalledLayout = { id: string; hkl: bigint; tag: string }

/** The layouts Windows has, in its order, with the language tag of each ("en-US"). */
export function installedLayouts(): InstalledLayout[] {
  const n = GetKeyboardLayoutList(0, null) as number
  const buffer = Buffer.alloc(8 * n)
  GetKeyboardLayoutList(n, buffer)
  const out: InstalledLayout[] = []
  for (let i = 0; i < n; i++) {
    const hkl = buffer.readBigInt64LE(i * 8)
    const name = Buffer.alloc(85 * 2)
    const length = LCIDToLocaleName(Number(hkl & 0xffffn), name, 85, 0) as number
    const tag = length > 1 ? name.toString('utf16le', 0, (length - 1) * 2) : ''
    out.push({ id: layoutId(hkl), hkl, tag })
  }
  return out
}

/** The keys that may type a character: space, digits, letters, punctuation, the key by the left Shift. */
const TYPING_KEYS = [0x20, ...range(0x30, 0x39), ...range(0x41, 0x5a), ...range(0xba, 0xc0), ...range(0xdb, 0xdf), 0xe2]

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

/** What each key types in a layout, with and without Shift; dead keys and keys that type nothing are left out. */
export function layoutTable(hkl: bigint): KeyTable {
  const state = Buffer.alloc(256)
  const out = Buffer.alloc(16)
  const entries: [string, string][] = []
  for (const shift of [false, true]) {
    state[0x10] = shift ? 0x80 : 0
    for (const vk of TYPING_KEYS) {
      // 4: leave the keyboard's state (a dead key pressed) as it is.
      const n = ToUnicodeEx(vk, MapVirtualKeyExW(vk, 0, hkl), state, out, 8, 4, hkl) as number
      if (n !== 1) continue
      const char = out.toString('utf16le', 0, 2)
      if (/\P{C}/u.test(char)) entries.push([keyId(vk, shift), char])
    }
  }
  return tableOf(entries)
}

export type Foreground = { hwnd: bigint; tid: number; pid: number }

export function foreground(): Foreground {
  const hwnd = BigInt(GetForegroundWindow() as number | bigint)
  const pid = [0]
  const tid = GetWindowThreadProcessId(hwnd, pid) as number
  return { hwnd, tid, pid: pid[0] ?? 0 }
}

/** The layout a thread types in. */
export function layoutOf(tid: number): bigint {
  return BigInt.asIntN(64, BigInt(GetKeyboardLayout(tid) as number | bigint))
}

/** Brings a window to the front, with the keyboard; Windows allows it while Kryakl's own window is in front. */
export function focusWindow(hwnd: bigint): boolean {
  return !!SetForegroundWindow(hwnd)
}

/**
 * Whether Caps Lock is on, as the window in front sees it. A thread that
 * takes no keyboard input of its own (the keyboard thread) is never told, so
 * it borrows the front window's input state for the moment of the question;
 * not from a hung window, which could hold it up.
 */
export function capsLockOf(front: Foreground): boolean {
  const me = GetCurrentThreadId() as number
  const attached = front.tid !== 0 && front.tid !== me && !IsHungAppWindow(front.hwnd) && !!AttachThreadInput(me, front.tid, true)
  try {
    return (Number(GetKeyState(0x14)) & 1) === 1
  } finally {
    if (attached) AttachThreadInput(me, front.tid, false)
  }
}

/**
 * Asks a window to type in another layout, as Windows' own switch does: the
 * window with the keyboard (a Chromium window answers for its own focused
 * child, not always for its frame, 2026-11-07) and the frame itself.
 */
export function switchLayout(hwnd: bigint, hkl: bigint): void {
  const pid = [0]
  const tid = GetWindowThreadProcessId(hwnd, pid) as number
  const info: Record<string, unknown> = { cbSize: koffi.sizeof(GUITHREADINFO) }
  const focus = tid && GetGUIThreadInfo(tid, info) ? BigInt(info.hwndFocus as number | bigint) : 0n
  if (focus && focus !== hwnd) PostMessageW(focus, WM_INPUTLANGCHANGEREQUEST, 0, hkl)
  PostMessageW(hwnd, WM_INPUTLANGCHANGEREQUEST, 0, hkl)
}

/** Where a thread's text cursor is on the screen, in physical pixels; undefined when the program draws its own (browsers, Electron apps). */
export function caretOf(tid: number): { x: number; y: number; h: number } | undefined {
  const info: Record<string, unknown> = { cbSize: koffi.sizeof(GUITHREADINFO) }
  if (!GetGUIThreadInfo(tid, info)) return undefined
  const hwnd = info.hwndCaret as number | bigint
  const rect = info.rcCaret as { left: number; top: number; right: number; bottom: number }
  if (!hwnd) return undefined
  const point = { x: rect.left, y: rect.top }
  if (!ClientToScreen(hwnd, point)) return undefined
  return { x: point.x, y: point.y, h: Math.max(1, rect.bottom - rect.top) }
}

/** A window's frame on the screen, in physical pixels; undefined for no window or an empty one. */
export function windowRect(hwnd: bigint): { x: number; y: number; width: number; height: number } | undefined {
  if (!hwnd) return undefined
  const rect: Record<string, number> = {}
  if (!GetWindowRect(hwnd, rect)) return undefined
  const { left = 0, top = 0, right = 0, bottom = 0 } = rect
  if (right <= left || bottom <= top) return undefined
  return { x: left, y: top, width: right - left, height: bottom - top }
}

type GetAttribute = (hwnd: bigint | number, attr: number, value: number[], size: number) => number
let getAttribute: GetAttribute | undefined
function dwmAttribute(): GetAttribute {
  return (getAttribute ??= loadLib('dwmapi.dll').func('int32 __stdcall DwmGetWindowAttribute(intptr hwnd, uint32 attr, _Out_ uint32 *value, uint32 size)'))
}

/** Why Windows hides a window it calls visible (another virtual desktop, a suspended app): 0 when it does not. */
function cloakOf(hwnd: bigint | number): number {
  const value = [0]
  return dwmAttribute()(hwnd, DWMWA_CLOAKED, value, 4) === 0 ? (value[0] ?? 0) : 0
}

function exStyleOf(hwnd: bigint | number): number {
  return Number(GetWindowLongPtrW(hwnd, GWL_EXSTYLE))
}

/** What Windows itself makes of a window Electron says is shown. */
export type Sight = {
  topmost: boolean
  /** DWM's cloak: 1 the app, 2 the shell (another virtual desktop), 4 its owner's; 0 not hidden. */
  cloaked: number
  /** The windows over it that Windows draws, nearest first: "exe (class, on top, click-through)". */
  above: string[]
}

/** Whether Windows really shows a window: on top or not, cloaked or not, and what lies over it. */
export function sightOf(hwnd: bigint): Sight {
  const own = windowRect(hwnd)
  const above: string[] = []
  // Up the z-order from the window itself, so only those above it are seen; a few hundred at most.
  let next = hwnd as bigint | number
  for (let i = 0; own && i < 2000 && above.length < 3; i++) {
    next = GetWindow(next, GW_HWNDPREV) as bigint | number
    if (!next) break
    if (!IsWindowVisible(next) || cloakOf(next)) continue
    const rect = windowRect(BigInt(next))
    if (!rect || rect.x >= own.x + own.width || own.x >= rect.x + rect.width || rect.y >= own.y + own.height || own.y >= rect.y + rect.height) continue
    const pid = [0]
    GetWindowThreadProcessId(next, pid)
    const name = Buffer.alloc(512)
    const length = GetClassNameW(next, name, 256) as number
    const style = exStyleOf(next)
    const notes = [name.toString('utf16le', 0, length * 2), style & WS_EX_TOPMOST ? 'on top' : '', style & WS_EX_TRANSPARENT ? 'click-through' : ''].filter(Boolean)
    above.push(`${exeOf(pid[0] ?? 0) || `pid ${pid[0]}`} (${notes.join(', ')})`)
  }
  return { topmost: (exStyleOf(hwnd) & WS_EX_TOPMOST) !== 0, cloaked: cloakOf(hwnd), above }
}

/**
 * A window above every other, those kept on top too, the focus left where it
 * is. Windows sometimes leaves a window kept on top under ordinary ones, its
 * flag still set (2026-10-29, the dictation badge under VS Code): this puts it
 * back, as Electron's setAlwaysOnTop is not known to when it thinks it is there.
 */
export function putOnTop(hwnd: bigint): boolean {
  return !!SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE)
}

const exes = new Map<number, string>()

/** A process's program, as its .exe name in lower case; empty when Windows does not say. */
export function exeOf(pid: number): string {
  const known = exes.get(pid)
  if (known !== undefined) return known
  let exe = ''
  const handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
  if (handle) {
    const name = Buffer.alloc(1024)
    const size = [512]
    if (QueryFullProcessImageNameW(handle, 0, name, size)) exe = path.win32.basename(name.toString('utf16le', 0, (size[0] ?? 0) * 2)).toLowerCase()
    CloseHandle(handle)
  }
  if (exes.size > 500) exes.clear()
  exes.set(pid, exe)
  return exe
}

const elevations = new Map<number, boolean>()

/**
 * Whether a process runs as administrator: Windows keeps its keys from the
 * hooks of a program that does not. A process whose token cannot even be read
 * counts as one.
 */
export function elevated(pid: number): boolean {
  const known = elevations.get(pid)
  if (known !== undefined) return known
  let answer = false
  const handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
  if (handle) {
    const token = [0]
    if (OpenProcessToken(handle, TOKEN_QUERY, token)) {
      const info = [0]
      const size = [0]
      answer = !!GetTokenInformation(token[0], TOKEN_ELEVATION, info, 4, size) && info[0] !== 0
      CloseHandle(token[0])
    } else answer = true
    CloseHandle(handle)
  }
  if (elevations.size > 500) elevations.clear()
  elevations.set(pid, answer)
  return answer
}

/** The programs with a window open now (visible, titled, owned by none), by .exe name, in order. */
export function windowedApps(): string[] {
  const pids = new Set<number>()
  const visit = koffi.register((hwnd: number | bigint) => {
    if (IsWindowVisible(hwnd) && (GetWindowTextLengthW(hwnd) as number) > 0 && !GetWindow(hwnd, GW_OWNER)) {
      const pid = [0]
      GetWindowThreadProcessId(hwnd, pid)
      if (pid[0]) pids.add(pid[0])
    }
    return true
  }, koffi.pointer(EnumWindowsProc))
  try {
    EnumWindows(visit, 0)
  } finally {
    koffi.unregister(visit)
  }
  return [...new Set([...pids].map(exeOf).filter(Boolean))].sort()
}

/** Whether a program fills the screen now: a game, a video or a presentation on the full screen. */
export function fullScreenNow(): boolean {
  const state = notificationState()
  if (!FULL_SCREEN_STATES.has(state)) return false
  const hwnd = BigInt(GetForegroundWindow() as number | bigint)
  const win = windowRect(hwnd)
  const info: Record<string, unknown> = { cbSize: koffi.sizeof(MONITORINFO) }
  const monitor = hwnd ? MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) : 0
  const screen = monitor && GetMonitorInfoW(monitor, info) ? (info.rcMonitor as { left: number; top: number; right: number; bottom: number }) : undefined
  return quietFor(state, win, screen, !!hwnd && !!IsZoomed(hwnd))
}

/**
 * Whether the keys go quiet for the screen as it is. Windows' "busy" (2) is
 * said for any window that fills a monitor, on any monitor, and for a
 * maximized frameless window too (2026-11-07: the owner's Claude window,
 * maximized, kept every key of Tyts off while they typed in it), so it counts
 * only when the window in front itself covers its whole monitor and is not
 * merely maximized; a Direct3D program on the full screen (3) and
 * presentation mode (4) always do.
 */
export function quietFor(
  state: number,
  win: { x: number; y: number; width: number; height: number } | undefined,
  screen: { left: number; top: number; right: number; bottom: number } | undefined,
  zoomed: boolean,
): boolean {
  if (state === 3 || state === 4) return true
  if (state !== 2 || !win || !screen || zoomed) return false
  return win.x <= screen.left && win.y <= screen.top && win.x + win.width >= screen.right && win.y + win.height >= screen.bottom
}

/** Windows' own word on the screen (SHQueryUserNotificationState): 2 busy, 3 a Direct3D program on the full screen, 4 presentation mode; 0 when it will not say. */
export function notificationState(): number {
  const state = [0]
  return (SHQueryUserNotificationState(state) as number) >= 0 ? (state[0] ?? 0) : 0
}

/**
 * A key to press: a virtual key, a character typed as itself whatever the
 * layout, or one half of a key press as the person made it (`again`).
 */
export type Press = { vk: number } | { char: string } | { again: { vk: number; scan: number; up: boolean } } | { release: number }

/** Presses keys in the program in front: marked as Kryakl's own, unless pressed again for the person. */
export function press(keys: readonly Press[]): void {
  const inputs: unknown[] = []
  // An extended key says so, or Windows takes it for its twin: Right Alt let go for Left Alt, an arrow for the number pad's.
  const event = (vk: number, scan: number, flags: number, own = true) =>
    inputs.push({ type: INPUT_KEYBOARD, ki: { wVk: vk, wScan: scan, dwFlags: isExtendedKey(vk) ? flags | KEYEVENTF_EXTENDEDKEY : flags, time: 0, dwExtraInfo: own ? OWN_KEYS : REPLAY_KEYS }, pad: [0, 0, 0, 0, 0, 0, 0, 0] })
  for (const key of keys) {
    if ('again' in key) {
      event(key.again.vk, key.again.scan, key.again.up ? KEYEVENTF_KEYUP : 0, false)
    } else if ('release' in key) {
      event(key.release, 0, KEYEVENTF_KEYUP)
    } else if ('vk' in key) {
      event(key.vk, 0, 0)
      event(key.vk, 0, KEYEVENTF_KEYUP)
    } else {
      for (let i = 0; i < key.char.length; i++) {
        const unit = key.char.charCodeAt(i)
        event(0, unit, KEYEVENTF_UNICODE)
        event(0, unit, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP)
      }
    }
  }
  if (inputs.length > 0) SendInput(inputs.length, inputs, koffi.sizeof(INPUT))
}
