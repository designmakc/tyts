// The keyboard helper's thread on a Mac, kbd-worker.ts's twin: the keys come
// from vendor/kbd-mac (build/kbd-mac.swift, a CGEventTap) as JSON lines, are
// read as Windows keys (kbdmac.ts) and go to the same Typist, so fixing as one
// types, the fix key, the switch and layout keys and the keys Electron cannot
// hold work by the same rules. The helper waits for the answer to each key
// (keep it from the program or not). A "window" here is the program in front,
// by its process id. workerData: the port to the main process, the helper's path.
// Nothing typed is logged.

import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createInterface } from 'node:readline'
import { workerData, type MessagePort } from 'node:worker_threads'

import { MAC_TO_VK, macCaret, macLang, macTable, VK_TO_MAC, type MacLayout } from './kbdmac'
import { lexiconOf, type KeyTable, type Lexicon } from './layoutfix'
import { Typist, type KbdConfig, type KbdIn, type KbdOut, type TypistEnv } from './typist'
import type { Press } from './winkbd'

const { port, helper } = workerData as { port: MessagePort; helper: string }
const send = (message: KbdOut) => port.postMessage(message)

/** The main process shows this as the keyboard helper's trouble, with a way to System Settings (webview/app.ts). */
const MAC_ACCESS = 'macAccess'
const MAC_INPUT = 'macInput'
const TICK_MS = 150

const child = spawn(helper, [], { stdio: ['pipe', 'pipe', 'ignore'] })
const tell = (command: Record<string, unknown>) => child.stdin.write(`${JSON.stringify(command)}\n`)

let config: KbdConfig | undefined
let front = { pid: 0, name: '' }
const names = new Map<number, string>()
let source = ''
let caps = false
let full = false
const layouts = new Map<string, { lang: string; table: KeyTable }>()
const lexicons: Record<string, Lexicon> = {}

function readLayouts(list: MacLayout[]): void {
  layouts.clear()
  for (const l of list) layouts.set(l.id, { lang: macLang(l), table: macTable(l) })
}

function sound(file: string | undefined): void {
  if (file) tell({ c: 'sound', path: file })
}

function press(keys: readonly Press[]): void {
  const out: Record<string, unknown>[] = []
  for (const key of keys) {
    if ('char' in key) out.push({ t: key.char })
    else if ('again' in key) out.push({ r: key.again.scan, u: key.again.up })
    // Caps Lock posted as a key does not turn it on a Mac: the helper turns its state over (IOKit).
    else if ('vk' in key && key.vk === 0x14) out.push({ caps: true })
    else if ('vk' in key && VK_TO_MAC[key.vk] !== undefined) out.push({ k: VK_TO_MAC[key.vk] })
    // `release` is Windows' (an Alt or Win tap let go behind a key that types nothing).
  }
  if (out.length) tell({ c: 'press', keys: out })
}

const env: TypistEnv = {
  now: () => Date.now(),
  foreground: () => ({ hwnd: BigInt(front.pid), tid: front.pid, pid: front.pid }),
  layoutOf: () => source,
  layout: id => layouts.get(id),
  installed: () => [...layouts.keys()],
  exeOf: pid => names.get(pid) ?? '',
  elevated: () => false,
  ownExe: path.basename(process.execPath).toLowerCase(),
  switchLayout: (_, id) => {
    tell({ c: 'select', id })
    source = id
  },
  press,
  later: () => setImmediate(() => guarded(undefined, () => typist.typeFix())),
  mask: () => undefined,
  askField: () => tell({ c: 'field' }),
  // The helper says when a window of the program in front covers a whole screen.
  fullScreen: () => full,
  click: () => sound(config?.clickFile),
  chime: note => sound(config?.switchFiles[note]),
  // The helper's answer comes later than this asks: keyboard.ts asks it itself (`caret`) for each badge.
  caretOf: () => undefined,
  capsOf: () => caps,
  send,
  doubleClickMs: 500,
}
const typist = new Typist(env)

let failures = 0
function guarded<T>(fallback: T, body: () => T): T {
  try {
    return body()
  } catch (error) {
    if (failures++ < 5) send({ type: 'error', message: error instanceof Error ? error.message : String(error) })
    return fallback
  }
}

function configure(next: KbdConfig): void {
  const badgeWas = config?.badge || config?.trayLayout
  config = next
  typist.configure(config, lexicons)
  let read = false
  if (config.autoFix || config.keys.fix || config.keys.menu) {
    for (const lang of new Set(typist.cycle().map(id => layouts.get(id)?.lang ?? ''))) {
      const file = config.words[lang]
      if (lexicons[lang] || !file) continue
      try {
        lexicons[lang] = lexiconOf(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean))
        read = true
      } catch (error) {
        send({ type: 'error', message: `the ${lang} word list did not load: ${error instanceof Error ? error.message : String(error)}` })
      }
    }
  }
  if (read) typist.configure(config, lexicons)
  if ((config.badge || config.trayLayout) && !badgeWas) {
    typist.forgetLayout()
    typist.lookAtLayout()
  }
}

port.on('message', (message: KbdIn) =>
  guarded(undefined, () => {
    if (message.type === 'quit') return quit()
    if (message.type === 'switchTo') return typist.switchTo(message.layout)
    if (message.type === 'converted') return typist.converted(message.selected)
    if (message.type === 'dictating') return typist.setDictating(message.on)
    // The key field is in Kryakl's own window: the program in front is this process.
    if (message.type === 'record') return typist.record(message.on, BigInt(process.pid))
    if (message.type === 'menu') return typist.menu(message.on, message.codes, message.rect)
    if (message.type === 'fix') return typist.fixNow()
    // 9: V's key code.
    if (message.type === 'paste') return tell({ c: 'press', keys: [{ k: 9, cmd: true }] })
    if (message.type === 'caret') return tell({ c: 'caret', n: message.n, pid: front.pid })
    if (message.type === 'sel') return tell({ c: 'sel', n: message.n, pid: front.pid })
    if (message.type === 'bar') return typist.barShown(message.on, message.rect)
    // A config before the helper said hello waits for its layouts.
    pending = message.config
    if (layouts.size) configure(message.config)
  }),
)
let pending: KbdConfig | undefined

type HelperEvent =
  | { e: 'hello'; dbl: number; layouts: MacLayout[]; access?: Access }
  | { e: 'layouts'; list: MacLayout[] }
  | { e: 'ready'; access?: Access }
  | { e: 'denied'; access?: Access }
  | { e: 'noInput'; access?: Access }
  | { e: 'app'; pid: number; name: string }
  | { e: 'src'; id: string }
  | { e: 'k'; n?: number; w?: boolean; c: number; d: boolean; caps: boolean; f: boolean; src?: string }
  | { e: 'm'; t: Parameters<Typist['mouse']>[0]; x: number; y: number; time: number; b: number }
  | { e: 'field'; secret: boolean | null }
  | { e: 'caret'; n: number; x?: number; y?: number; h?: number }
  | { e: 'full'; on: boolean; name: string }
  | { e: 'sel'; n: number; ok?: boolean; secret?: boolean; x?: number; y?: number; h?: number }

type Access = { listen: boolean; post: boolean; ax: boolean }
// What macOS lets the helper do, into tyts.log once per change (no characters).
let accessSaid = ''
function sayAccess(when: string, a?: Access): void {
  if (!a) return
  const text = `mac access (${when}): input monitoring ${a.listen}, post events ${a.post}, accessibility ${a.ax}`
  if (text.slice(text.indexOf(':')) === accessSaid) return
  accessSaid = text.slice(text.indexOf(':'))
  send({ type: 'note', text })
}

// The first keys after the start, counted once for tyts.log, so a Mac where fixing does nothing says why.
const seen = { keys: 0, foreign: 0, unknown: 0, asked: 0, secret: 0 }
function look(event: { c: number; d: boolean; f: boolean; w?: boolean }, vk: number | undefined): void {
  if (seen.keys > 40 || !event.d) return
  seen.keys++
  if (event.f) seen.foreign++
  if (vk === undefined) seen.unknown++
  if (event.w) seen.asked++
  if (seen.keys !== 40) return
  const langs = typist.cycle().map(id => layouts.get(id)?.lang ?? '?')
  send({
    type: 'note',
    text: `mac keys: ${seen.keys} down, ${seen.foreign} foreign, ${seen.unknown} unknown, ${seen.asked} asked, ${seen.secret} secret fields; source ${layouts.has(source) ? 'known' : 'unknown'} (${source.split('.').pop()}); cycle ${langs.join(' ')}; word lists ${Object.keys(lexicons).join(' ') || 'none'}; autoFix ${config?.autoFix}`,
  })
}

function onHelper(event: HelperEvent): void {
  switch (event.e) {
    case 'hello':
      sayAccess('hello', event.access)
      env.doubleClickMs = event.dbl
      readLayouts(event.layouts)
      if (pending) configure(pending)
      return
    case 'layouts':
      readLayouts(event.list)
      if (config) configure(config)
      return
    case 'denied':
      sayAccess('denied', event.access)
      return send({ type: 'error', message: MAC_ACCESS })
    case 'noInput':
      // Accessibility given, Input Monitoring not: only modifiers reach the tap.
      sayAccess('no input', event.access)
      return send({ type: 'error', message: MAC_INPUT })
    case 'ready':
      sayAccess('ready', event.access)
      // The trouble said before is gone (main.ts keeps the last message; empty shows none).
      return send({ type: 'error', message: '' })
    case 'app':
      names.set(event.pid, event.name)
      front = { pid: event.pid, name: event.name }
      return
    case 'src':
      source = event.id
      return
    case 'caret': {
      const caret = macCaret(event)
      return send({ type: 'caret', n: event.n, ...(caret ? { caret } : {}) })
    }
    case 'sel': {
      const at = macCaret(event)
      return send({ type: 'sel', n: event.n, ok: event.ok === true, ...(event.secret ? { secret: true } : {}), ...(at ? { at } : {}) })
    }
    case 'full':
      full = event.on
      // As on Windows, tyts.log says when the quiet starts and ends (the program's name, nothing typed).
      if (config?.quietFullScreen) send({ type: 'note', text: full ? `quiet: a window of ${event.name || '?'} fills its screen; the keys do nothing until it is gone` : 'quiet: over' })
      return
    case 'field':
      if (event.secret) seen.secret++
      return typist.fieldIs(event.secret ?? 'unknown')
    case 'm':
      typist.mouse(event.t, event.x, event.y, event.time, event.b)
      return
    case 'k': {
      caps = event.caps
      if (event.src) source = event.src
      const vk = MAC_TO_VK[event.c]
      look(event, vk)
      const keep = vk !== undefined && guarded(false, () => typist.key(vk, event.c, event.d, false, event.f))
      if (event.w) tell({ c: 'r', n: event.n, s: keep })
      return
    }
  }
}

createInterface({ input: child.stdout }).on('line', line => {
  let event: HelperEvent
  try {
    event = JSON.parse(line) as HelperEvent
  } catch {
    return
  }
  guarded(undefined, () => onHelper(event))
})

let quitting = false
child.on('error', error => send({ type: 'error', message: `the Mac keyboard helper did not start: ${error.message}` }))
child.on('exit', code => {
  if (!quitting) send({ type: 'error', message: `the Mac keyboard helper stopped (${code ?? 'signal'})` })
  process.exit(0)
})

const timer = setInterval(() => guarded(undefined, () => typist.tick()), TICK_MS)

function quit(): void {
  quitting = true
  clearInterval(timer)
  child.kill()
}
