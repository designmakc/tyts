// The speech engine as a running service: engine/app.py under the Python the
// speech pack installed, on 127.0.0.1:<port>. Started once a part is
// installed, started again when it falls over, stopped with Kryakl. One
// already answering on the port (run by hand) is used when it proves it holds
// the engine's key (auth.py); another program on the port is not, and never
// receives the key: it is sent only once the proof holds. Every feature and
// every other app (the Chrome extension) speaks to it over HTTP.

import { spawn, type ChildProcess } from 'node:child_process'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as path from 'node:path'

import { rotate } from './log'
import type { Bench } from './speechplan'

export const SPEECH_PORT = 8765
/** How many ports from SPEECH_PORT on the engine may take (extension/background.js looks through the same ones). */
export const SPEECH_PORTS = 10

/**
 * The first port from `from` on that 127.0.0.1 lets one listen on. Windows may hold 8765 for itself (Hyper-V's and
 * WSL's excluded port ranges: uvicorn then exits with 3 at every start), or another program (Kryakl) may sit on it.
 */
export async function freePort(from: number, count = SPEECH_PORTS, skip: ReadonlySet<number> = new Set()): Promise<number | undefined> {
  for (let port = from; port < from + count; port++) {
    if (skip.has(port)) continue
    const free = await new Promise<boolean>(resolve => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
    })
    if (free) return port
  }
  return undefined
}

const RETRIES = [2, 5, 10, 30] // seconds before each new start; after the last it stays down

export type SpeechServiceState = 'off' | 'starting' | 'ready' | 'down'

export type SpeechTestState = { state: 'idle' | 'waiting' | 'running' | 'done' | 'failed'; done: number; total: number; current: string; message: string; at: string }

/** The engine's /health, as much of it as Kryakl reads (the optional parts come from engines of 0.2 on). */
export type SpeechHealth = {
  version: string
  device: 'cuda' | 'cpu' | 'metal' | null
  parts: { core: boolean; gpu: boolean; speakers: boolean; mac?: boolean }
  /** The model each feature has now, from the plan, and where it runs. */
  models: Record<'transcripts' | 'dictation', { name: string; state: 'ready' | 'missing' | 'downloading'; progress?: number; device?: 'cuda' | 'cpu'; compute?: string }>
  /** The models downloaded (catalog names). */
  downloaded?: string[]
  /** The models in memory now and where ("speakers" for who spoke when). */
  loaded?: { model: string; device: 'cuda' | 'cpu' | 'metal' }[]
  /** The Chrome extension last seen (it pings every 15 min; `seen` is Unix seconds). */
  extension?: { id: string; version: string; seen: number } | null
  /** Why the card is not used though it is there. */
  fallback?: string | null
  /** The speed test. */
  calibration?: SpeechTestState
  bench?: Bench
  /** Where speakers are told apart: on the card when torch's CUDA build is installed. */
  speakersDevice?: 'cuda' | 'cpu'
  diarization: 'ready' | 'missing' | 'needs-token' | 'checking' | 'downloading' | 'bad-token' | 'no-access' | 'failed'
  diarizationMessage: string
  busy: string | null
  queued: number
  dataDir: string
  kbDir: string
}

/**
 * The engine's key, kept in `file` (speech-token beside the engine's settings, in the person's own
 * %APPDATA%), made the first time: Kryakl sends it with every call, and an engine run by hand reads it there.
 */
export function speechToken(file: string): string {
  try {
    const kept = fs.readFileSync(file, 'utf8').trim()
    if (kept) return kept
  } catch {
    // none yet
  }
  const made = randomBytes(32).toString('hex')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, made, 'utf8')
  return made
}

/** An answer to /health that an engine of Kryakl's gives (of any version), keyed or not. */
export function looksLikeEngine(health: unknown): boolean {
  return typeof health === 'object' && health !== null && 'parts' in health && 'diarization' in health
}

/** Whether the engine's answer to a nonce shows it holds the key (auth.py `proof`). */
export function provesKey(token: string, nonce: string, proof: unknown): boolean {
  const want = createHmac('sha256', token).update(nonce).digest()
  const got = typeof proof === 'string' && /^[0-9a-f]{64}$/.test(proof) ? Buffer.from(proof, 'hex') : undefined
  return !!got && timingSafeEqual(want, got)
}

export type SpeechResult<T = unknown> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string }

export type SpeechServiceOptions = {
  python: () => string
  engineDir: string
  port: number
  log: string
  /** Where Python keeps its compiled files: not in the app's folder, which updates replace. */
  pycache: string
  /** The engine's key (speechToken): sent with every call, given to the engine Kryakl starts. */
  token: string
  /** Stops an engine of an older Kryakl, left running without the key (Kryakl stopped without stopping it); Kryakl's own starts after. */
  stopStale?: () => Promise<void>
  env?: Record<string, string>
  change: () => void
  /** The engine proved on a port: main tells the Chrome extension (speechport.ts), which may not probe for it. */
  onPort?: (port: number) => void
}

export class SpeechService {
  state: SpeechServiceState = 'off'
  /** The port the engine is on: the one asked for, or the next free one when that one is taken (freePort). */
  port: number
  health: SpeechHealth | undefined
  trouble: string | undefined
  private child: ChildProcess | undefined
  private failures = 0
  private timer: NodeJS.Timeout | undefined
  private stopped = true
  private seen = ''
  private staleStopped = false
  /** The older engine being stopped: no look at the port meanwhile. */
  private stopping: Promise<void> | undefined
  /** The engine on the port has proved it holds the key (`check`): only then is the key sent to it. */
  private proved = false
  /** A port is being picked for the engine (launch): no second start meanwhile. */
  private launching = false
  /** Ports of SPEECH_PORT's ten where another program answered, or uvicorn could not bind (exit 3): not tried again until Restart. */
  private taken = new Set<number>()

  constructor(private readonly o: SpeechServiceOptions) {
    this.port = o.port
  }

  get base(): string {
    return `http://127.0.0.1:${this.port}`
  }

  /** The key, once the engine on the port has proved it holds it; before, nothing on the port gets it. */
  get token(): string | undefined {
    return this.proved ? this.o.token : undefined
  }

  async start(): Promise<void> {
    if (!this.stopped) return
    this.stopped = false
    this.failures = 0
    this.set('starting')
    if (!(await this.check())) void this.launch()
    clearInterval(this.timer)
    this.timer = setInterval(() => void this.check(), 2000)
  }

  restart(): void {
    this.failures = 0
    this.trouble = undefined
    this.taken.clear()
    // The key goes only where the proof was seen: a new port is a new engine to prove.
    this.proved = false
    this.health = undefined
    this.port = this.o.port
    if (this.child) this.child.kill()
    else if (!this.stopped) void this.launch()
    else void this.start()
  }

  stop(): void {
    this.stopped = true
    clearInterval(this.timer)
    this.child?.kill()
    this.child = undefined
    this.proved = false
    this.health = undefined
    this.set('off')
  }

  private async launch(): Promise<void> {
    if (this.launching) return
    this.launching = true
    try {
      await this.spawnEngine()
    } finally {
      this.launching = false
    }
  }

  private async spawnEngine(): Promise<void> {
    const python = this.o.python()
    if (!fs.existsSync(python)) {
      this.set('down', 'The speech engine is not installed')
      return
    }
    this.set('starting')
    // Nothing of ours answers on the port: the first of the ten that can be listened on and that no other program took.
    const port = await freePort(this.o.port, SPEECH_PORTS, this.taken)
    if (this.stopped || this.child) return
    if (port === undefined) {
      this.set('down', `Ports ${this.o.port}–${this.o.port + SPEECH_PORTS - 1} are all taken by other programs: quit one, then press Restart`)
      return
    }
    this.port = port
    fs.mkdirSync(path.dirname(this.o.log), { recursive: true })
    // Past 2 MB a start begins it afresh, the last one kept as speech.old.log.
    rotate(this.o.log, 2_000_000)
    const log = fs.createWriteStream(this.o.log, { flags: 'a' })
    log.write(`\n--- ${new Date().toISOString()} start on port ${this.port}\n`)
    const child = spawn(python, ['app.py', '--port', String(this.port)], {
      cwd: this.o.engineDir,
      env: { ...process.env, ...this.o.env, KRYA_SPEECH_TOKEN: this.o.token, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONPYCACHEPREFIX: this.o.pycache },
      windowsHide: true,
    })
    child.stdout.pipe(log, { end: false })
    child.stderr.pipe(log, { end: false })
    child.on('error', error => log.write(`--- ${error}\n`))
    child.on('exit', code => {
      log.end(`--- exit ${code}\n`)
      if (this.child === child) this.child = undefined
      // Whatever takes the port next proves itself again before it gets the key.
      this.proved = false
      if (this.stopped) return
      // uvicorn's startup failure: the port was taken between the look and the bind, or Windows keeps it from
      // Python alone (an excluded port range), so the next start goes to another port at once.
      if (code === 3 && this.taken.size + 1 < SPEECH_PORTS) {
        this.taken.add(port)
        void this.launch()
        return
      }
      const wait = RETRIES[this.failures]
      this.failures++
      if (wait === undefined) {
        this.set('down', `The speech engine keeps stopping (${code}): see ${this.o.log}`)
        return
      }
      this.set('starting')
      setTimeout(() => !this.stopped && !this.child && void this.launch(), wait * 1000)
    })
    this.child = child
  }

  /** Whether the port is taken care of: Kryakl's engine is there (or being started), or another program holds it. */
  private async check(): Promise<boolean> {
    if (this.stopping) return true
    try {
      // The proof first, without the key: the key goes only to an engine that shows it has it.
      const nonce = randomBytes(16).toString('hex')
      const look = (await this.askHealth({ 'x-krya-nonce': nonce })) as { proof?: unknown } | null
      if (!provesKey(this.o.token, nonce, look?.proof)) {
        this.proved = false
        this.health = undefined
        // An engine of an older Kryakl (it answers as one, but holds no key), left running: it goes, once, and Kryakl starts its own.
        if (!this.staleStopped && !this.child && !this.launching && looksLikeEngine(look) && this.o.stopStale) {
          this.staleStopped = true
          this.stopping = this.o.stopStale().catch(error => console.warn('Kryakl: could not stop the older speech engine', error))
          await this.stopping
          this.stopping = undefined
          if (!this.stopped && !this.child) void this.launch()
          return true
        }
        // Something else answers on the port without the key (another program, Kryakl's engine beside Tyts, another
        // account's): ours goes to the next port, never sending the key there.
        if (!this.child && !this.launching && !this.stopped && this.taken.size + 1 < SPEECH_PORTS) {
          this.taken.add(this.port)
          void this.launch()
          return true
        }
        if (!this.child) this.set('down', `Port ${this.port} is used by another program: quit it, then press Restart`)
        return true
      }
      this.proved = true
      const health = (await this.askHealth(this.auth)) as SpeechHealth & { proof?: unknown }
      delete health.proof
      this.health = health
      this.failures = 0
      if (this.state !== 'ready') this.o.onPort?.(this.port)
      this.set('ready')
      return true
    } catch {
      this.proved = false
      if (this.state === 'ready') this.set('starting')
      return false
    }
  }

  private async askHealth(headers: Record<string, string>): Promise<unknown> {
    const response = await fetch(`${this.base}/health`, { headers, signal: AbortSignal.timeout(1500) })
    if (!response.ok) throw new Error(String(response.status))
    return response.json()
  }

  /** The engine on the port has proved itself, or does now (a call right after its start comes before the next look). */
  private async provenNow(): Promise<boolean> {
    if (!this.proved && !this.stopped) await this.check()
    return this.proved
  }

  private get auth(): Record<string, string> {
    return { 'x-krya-token': this.o.token }
  }

  private set(state: SpeechServiceState, trouble?: string): void {
    this.state = state
    if (trouble !== undefined || state === 'ready' || state === 'off') this.trouble = trouble
    const now = JSON.stringify([state, this.trouble, this.health])
    if (now === this.seen) return
    this.seen = now
    this.o.change()
  }

  /** One call to the engine: JSON in and out, or bytes in (a recording's chunk, a dictated phrase). */
  async call<T = unknown>(method: string, route: string, body?: unknown): Promise<SpeechResult<T>> {
    const binary = body instanceof Uint8Array
    if (!(await this.provenNow())) return { ok: false, status: 0, error: 'The speech engine is not running' }
    try {
      const response = await fetch(this.base + route, {
        method,
        headers: { ...this.auth, ...(body === undefined ? {} : { 'content-type': binary ? 'application/octet-stream' : 'application/json' }) },
        body: body === undefined ? undefined : binary ? Buffer.from(body) : JSON.stringify(body),
        signal: AbortSignal.timeout(binary ? 120_000 : 30_000),
      })
      const text = await response.text()
      const data = text && /^[[{]/.test(text) ? JSON.parse(text) : text
      if (!response.ok) {
        const detail = typeof data === 'object' && data && 'detail' in data ? String((data as { detail: unknown }).detail) : text
        return { ok: false, status: response.status, error: detail || response.statusText }
      }
      return { ok: true, status: response.status, data: data as T }
    } catch (error) {
      return { ok: false, status: 0, error: this.state === 'ready' ? String(error) : 'The speech engine is not running' }
    }
  }

  /** A file's bytes from the engine (a transcript exported), or its refusal. */
  async bytes(route: string): Promise<Buffer> {
    if (this.state !== 'ready' || !(await this.provenNow())) throw new Error('The speech engine is not running')
    const response = await fetch(this.base + route, { headers: this.auth, signal: AbortSignal.timeout(60_000) })
    if (!response.ok) throw new Error((await response.text()) || response.statusText)
    return Buffer.from(await response.arrayBuffer())
  }

  dispose(): void {
    this.stop()
  }
}
