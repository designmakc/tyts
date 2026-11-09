// The keyboard helper's own thread: Windows' low-level keyboard and mouse
// hooks, with a message loop of their own, so a busy main process never holds
// up typing (Windows drops a hook that answers late). What is done with each
// key is typist.ts's; this file lends it Windows. workerData: the port to the
// main process, which wakes the loop with a thread message after each message
// it posts. Whether the field typed in is a password is asked of a thread of
// its own (field-worker.ts), as the program in front answers that.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { MessageChannel, receiveMessageOnPort, Worker, workerData, type MessagePort } from 'node:worker_threads'

import koffi from 'koffi'
import { loadLib } from './native'

import { lexiconOf, type KeyTable, type Lexicon } from './layoutfix'
import { MASK_KEYS, Typist, type KbdConfig, type KbdIn, type KbdOut } from './typist'
import { capsLockOf, caretOf, elevated, exeOf, foreground, fullScreenNow, installedLayouts, layoutId, layoutOf, layoutTable, MAIN_KEYS, notificationState, OWN_KEYS, press, REPLAY_KEYS, switchLayout } from './winkbd'

const port = (workerData as { port: MessagePort }).port
const send = (message: KbdOut) => port.postMessage(message)

const user32 = loadLib('user32.dll')
const kernel32 = loadLib('kernel32.dll')
const winmm = loadLib('winmm.dll')
const PlaySoundW = winmm.func('bool __stdcall PlaySoundW(const char16_t *sound, intptr module, uint32 flags)')
const SND_ASYNC = 0x0001
const SND_NODEFAULT = 0x0002
const SND_FILENAME = 0x00020000

const KBDLLHOOKSTRUCT = koffi.struct('KbdHookInfo', { vkCode: 'uint32', scanCode: 'uint32', flags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr' })
const MSLLHOOKSTRUCT = koffi.struct('KbdMouseInfo', { x: 'int32', y: 'int32', mouseData: 'uint32', flags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr' })
const MSG = koffi.struct('KbdMsg', { hwnd: 'intptr', message: 'uint32', wParam: 'uintptr', lParam: 'intptr', time: 'uint32', x: 'int32', y: 'int32', lPrivate: 'uint32' })
const HookProc = koffi.proto('intptr __stdcall KbdHookProc(int code, uintptr wParam, void *lParam)')
const SetWindowsHookExW = user32.func('intptr __stdcall SetWindowsHookExW(int id, KbdHookProc *proc, intptr module, uint32 tid)')
const UnhookWindowsHookEx = user32.func('bool __stdcall UnhookWindowsHookEx(intptr hook)')
const CallNextHookEx = user32.func('intptr __stdcall CallNextHookEx(intptr hook, int code, uintptr wParam, void *lParam)')
const GetMessageW = user32.func('int __stdcall GetMessageW(_Out_ KbdMsg *msg, intptr hwnd, uint32 min, uint32 max)')
const PostThreadMessageW = user32.func('bool __stdcall PostThreadMessageW(uint32 tid, uint32 msg, uintptr w, intptr l)')
const SetTimer = user32.func('uintptr __stdcall SetTimer(intptr hwnd, uintptr id, uint32 ms, void *proc)')
const KillTimer = user32.func('bool __stdcall KillTimer(intptr hwnd, uintptr id)')
const GetDoubleClickTime = user32.func('uint32 __stdcall GetDoubleClickTime()')
const GetModuleHandleW = kernel32.func('intptr __stdcall GetModuleHandleW(const char16_t *name)')
const GetCurrentThreadId = kernel32.func('uint32 __stdcall GetCurrentThreadId()')

const WH_KEYBOARD_LL = 13
const WH_MOUSE_LL = 14
const WM_KEYDOWN = 0x0100
const WM_SYSKEYDOWN = 0x0104
const WM_TIMER = 0x0113
const WM_LBUTTONDOWN = 0x0201
const WM_LBUTTONUP = 0x0202
const WM_RBUTTONDOWN = 0x0204
const WM_MBUTTONDOWN = 0x0207
const WM_XBUTTONDOWN = 0x020b
const WM_XBUTTONUP = 0x020c
const WM_MOUSEWHEEL = 0x020a
const WM_MOUSEHWHEEL = 0x020e
/** The main process posted a message. */
const WM_APP_PORT = 0x8000
/** A fix decided in the hook is typed once the hook has answered. */
const WM_APP_FIX = 0x8001
/** The field thread answered. */
const WM_APP_FIELD = 0x8002
/** An Alt or Win tap of Kryakl's is let go behind a key that types nothing (wParam: the key). */
const WM_APP_MASK = 0x8003
/** AutoHotkey's key that types nothing. */
const VK_MASK = 0xe8
const LLKHF_INJECTED = 0x10
/** The thread's clock: the layout in front (for the badge), the program in front, a program on the full screen, a word left standing. */
const TICK_MS = 150

const tid = GetCurrentThreadId() as number

let config: KbdConfig | undefined
let fullScreen = false

/**
 * The thread that asks whether the field typed in is a password: started with fixing or learning, so
 * its first answer is not late (an answer later than 300 ms teaches nothing, typist.ts FieldAnswer).
 */
let field: { worker: Worker; port: MessagePort } | undefined
function fieldThread(): { worker: Worker; port: MessagePort } {
  if (!field) {
    const { port1, port2 } = new MessageChannel()
    const worker = new Worker(path.join(__dirname, 'field-worker.js'), { workerData: { port: port2, tid }, transferList: [port2] })
    field = { worker, port: port1 }
  }
  return field
}
function askField(): void {
  fieldThread().port.postMessage('ask')
}

/** Each layout Windows has: its handle, language and what its keys type, read once. */
const layouts = new Map<string, { hkl: bigint; lang: string; table: KeyTable }>()
function readLayouts(): void {
  for (const l of installedLayouts()) {
    if (!layouts.has(l.id)) layouts.set(l.id, { hkl: l.hkl, lang: l.tag.split('-')[0]?.toLowerCase() ?? '', table: layoutTable(l.hkl) })
  }
}
function layout(id: string) {
  if (!layouts.has(id)) readLayouts()
  return layouts.get(id)
}

const typist = new Typist(
  {
    now: () => Date.now(),
    foreground,
    layoutOf: thread => layoutId(layoutOf(thread)),
    layout,
    installed: () => {
      readLayouts()
      return [...layouts.keys()]
    },
    exeOf,
    elevated,
    ownExe: path.win32.basename(process.execPath).toLowerCase(),
    switchLayout: (hwnd, id) => {
      const info = layout(id)
      if (info) switchLayout(hwnd, info.hkl)
    },
    press,
    later: () => PostThreadMessageW(tid, WM_APP_FIX, 0, 0),
    mask: vk => PostThreadMessageW(tid, WM_APP_MASK, vk, 0),
    askField,
    fullScreen: () => fullScreen,
    click: () => {
      if (config?.clickFile) PlaySoundW(config.clickFile, 0, SND_FILENAME | SND_ASYNC | SND_NODEFAULT)
    },
    chime: note => {
      const file = config?.switchFiles[note]
      if (file) PlaySoundW(file, 0, SND_FILENAME | SND_ASYNC | SND_NODEFAULT)
    },
    caretOf,
    capsOf: capsLockOf,
    send,
    doubleClickMs: GetDoubleClickTime() as number,
  },
)

// ---------------------------------------------------------------- messages

const lexicons: Record<string, Lexicon> = {}
let timer = 0
let running = true

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function drainPort(): void {
  for (let m = receiveMessageOnPort(port); m; m = receiveMessageOnPort(port)) {
    const message = m.message as KbdIn
    if (message.type === 'quit') running = false
    else if (message.type === 'switchTo') typist.switchTo(message.layout)
    else if (message.type === 'converted') typist.converted(message.selected)
    else if (message.type === 'dictating') typist.setDictating(message.on)
    else if (message.type === 'record') typist.record(message.on, message.hwnd)
    else if (message.type === 'menu') typist.menu(message.on, message.codes, message.rect)
    else if (message.type === 'fix') typist.fixNow()
    else if (message.type === 'paste' || message.type === 'caret') continue // a Mac's
    else {
      const badgeWas = config?.badge || config?.trayLayout
      config = message.config
      readLayouts()
      typist.configure(config, lexicons)
      if (config.autoFix || config.learn) fieldThread()
      // The word lists of the cycle's languages, for fixing; read once, then given the person's own words.
      let read = false
      // The menu has the fix key's action among its items.
      if (config.autoFix || config.keys.fix || config.keys.menu) {
        for (const lang of new Set(typist.cycle().map(id => layout(id)?.lang ?? ''))) {
          const file = config.words[lang]
          if (lexicons[lang] || !file) continue
          try {
            lexicons[lang] = lexiconOf(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean))
            read = true
          } catch (error) {
            send({ type: 'error', message: `the ${lang} word list did not load: ${messageOf(error)}` })
          }
        }
      }
      if (read) typist.configure(config, lexicons)
      if ((config.badge || config.trayLayout) && !badgeWas) {
        typist.forgetLayout()
        typist.lookAtLayout()
      }
      if (!timer) timer = Number(SetTimer(0, 0, TICK_MS, null))
    }
  }
}

function drainField(): void {
  if (!field) return
  for (let m = receiveMessageOnPort(field.port); m; m = receiveMessageOnPort(field.port)) typist.fieldIs((m.message as { secret: boolean | null }).secret ?? 'unknown')
}

function tick(): void {
  const quiet = !!config?.quietFullScreen && fullScreenNow()
  const state = quiet ? notificationState() : 0
  // Quiet on the full screen turns every key off without a word: tyts.log says when it starts and ends (2026-11-07).
  if (quiet !== fullScreen) send({ type: 'note', text: quiet ? `quiet: the window in front fills its screen (Windows' state ${state}, ${exeOf(foreground().pid) || '?'}); the keys do nothing until it is gone` : 'quiet: over' })
  fullScreen = quiet
  typist.tick()
}

// The first keys after the start, counted once for tyts.log, so a computer where nothing happens says why.
const seen = { keys: 0, foreign: 0, own: 0 }
function look(vk: number, down: boolean, own: boolean, foreign: boolean): void {
  if (seen.keys >= 40 || !down) return
  seen.keys++
  if (own) seen.own++
  if (foreign) seen.foreign++
  if (seen.keys !== 40) return
  const front = foreground()
  const source = layoutId(layoutOf(front.tid))
  const langs = typist.cycle().map(id => layouts.get(id)?.lang ?? '?')
  const keys = config ? Object.keys(config.keys).join(' ') || 'none' : 'none'
  send({
    type: 'note',
    text: `keys: ${seen.keys} down, ${seen.foreign} foreign, ${seen.own} own; in front ${exeOf(front.pid) || '?'}${elevated(front.pid) ? ' (elevated: no fixing or switching there)' : ''}; source ${layouts.has(source) ? 'known' : 'unknown'} (${source}, ${layouts.get(source)?.lang ?? '?'}); cycle ${langs.join(' ') || 'none'}; word lists ${Object.keys(lexicons).join(' ') || 'none'}; autoFix ${config?.autoFix}; thread keys ${keys}; quiet ${fullScreen}`,
  })
}

let failures = 0
function guarded<T>(fallback: T, body: () => T): T {
  try {
    return body()
  } catch (error) {
    if (failures++ < 5) send({ type: 'error', message: messageOf(error) })
    return fallback
  }
}

// ---------------------------------------------------------------- hooks and the loop

type KeyInfo = { vkCode: number; scanCode: number; flags: number; dwExtraInfo: number | bigint }
let foreignSeen = false

const keyboardProc = koffi.register((code: number, wParam: number | bigint, lParam: unknown) => {
  if (code >= 0) {
    const swallow = guarded(false, () => {
      const info = koffi.decode(lParam, KBDLLHOOKSTRUCT) as KeyInfo
      const message = Number(wParam)
      const injected = (info.flags & LLKHF_INJECTED) !== 0
      const mark = Number(info.dwExtraInfo)
      // Kryakl's own keys; the person's keys pressed again after a fix count as theirs; any other program's are foreign.
      const own = injected && mark === OWN_KEYS
      const foreign = injected && mark !== OWN_KEYS && mark !== REPLAY_KEYS
      // The settings say so once when another program presses keys by itself (the main process's copy and paste are Kryakl's).
      if (foreign && !foreignSeen && mark !== MAIN_KEYS && !MASK_KEYS.has(info.vkCode)) {
        foreignSeen = true
        send({ type: 'foreignKeys' })
      }
      const down = message === WM_KEYDOWN || message === WM_SYSKEYDOWN
      look(info.vkCode, down, own, foreign)
      return typist.key(info.vkCode, info.scanCode, down, own, foreign)
    })
    if (swallow) return 1
  }
  return CallNextHookEx(0, code, wParam, lParam)
}, koffi.pointer(HookProc))

const MOUSE: Record<number, Parameters<Typist['mouse']>[0]> = {
  [WM_LBUTTONDOWN]: 'left-down',
  [WM_LBUTTONUP]: 'left-up',
  [WM_RBUTTONDOWN]: 'other-down',
  [WM_MBUTTONDOWN]: 'other-down',
  [WM_XBUTTONDOWN]: 'x-down',
  [WM_XBUTTONUP]: 'x-up',
  [WM_MOUSEWHEEL]: 'wheel',
  [WM_MOUSEHWHEEL]: 'wheel',
}

const mouseProc = koffi.register((code: number, wParam: number | bigint, lParam: unknown) => {
  const event = MOUSE[Number(wParam)]
  if (code >= 0 && event) {
    const swallow = guarded(false, () => {
      const info = koffi.decode(lParam, MSLLHOOKSTRUCT) as { x: number; y: number; mouseData: number; time: number }
      // A side button's number is the high word of mouseData.
      return typist.mouse(event, info.x, info.y, info.time, (info.mouseData >>> 16) & 0xffff)
    })
    if (swallow) return 1
  }
  return CallNextHookEx(0, code, wParam, lParam)
}, koffi.pointer(HookProc))

drainPort()
const module = GetModuleHandleW(null)
const keyboardHook = SetWindowsHookExW(WH_KEYBOARD_LL, keyboardProc, module, 0)
const mouseHook = SetWindowsHookExW(WH_MOUSE_LL, mouseProc, module, 0)
if (!keyboardHook || !mouseHook) send({ type: 'error', message: 'Windows did not let Tyts watch the keyboard' })
else send({ type: 'note', text: 'hooks set: the keyboard and the mouse are watched' })
// The main process learns where to wake this thread.
send({ type: 'thread', tid })

const msg: Record<string, unknown> = {}
while (running && (GetMessageW(msg, 0, 0, 0) as number) > 0) {
  const message = msg.message as number
  if (message === WM_APP_PORT) guarded(undefined, drainPort)
  else if (message === WM_APP_FIX) guarded(undefined, () => typist.typeFix())
  else if (message === WM_APP_FIELD) guarded(undefined, drainField)
  else if (message === WM_APP_MASK) guarded(undefined, () => press([{ vk: VK_MASK }, { release: Number(msg.wParam) }]))
  else if (message === WM_TIMER) guarded(undefined, tick)
}
if (timer) KillTimer(0, timer)
void field?.worker.terminate()
UnhookWindowsHookEx(keyboardHook)
UnhookWindowsHookEx(mouseHook)
koffi.unregister(keyboardProc)
koffi.unregister(mouseProc)
