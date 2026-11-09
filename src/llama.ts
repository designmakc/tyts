// llama.cpp's server (llama-server.exe of a build llmtranslator.ts
// downloads) as a process of Kryakl's own: one model at a time, on a free port
// of 127.0.0.1, started by the first request (or a key that will make one,
// `warm`), stopped after three idle minutes (ten until 2026-10-31: the card's
// memory back sooner) and with Kryakl. On Vulkan llama.cpp puts as many of the model's layers on
// the graphics card as its memory holds (its own `--fit`); CUDA takes them all
// (`allLayers`), NVIDIA's driver lending the card the computer's memory for
// the rest, which is far quicker than splitting. A card that cannot take the
// model at all (an old driver, a broken Vulkan) leaves it on the processor
// (`--device none`) until Kryakl starts again.

import { spawn as nodeSpawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as path from 'node:path'

import { rotate } from './log'

const IDLE_MS = 3 * 60_000
/** The 12B model from a slow disk takes a while to load. */
const READY_MS = 3 * 60_000
const POLL_MS = 250
const STOP_MS = 5000

export type LlamaOptions = {
  log: string
  idleMs?: number
  readyMs?: number
  spawn?: (exe: string, args: string[], env: NodeJS.ProcessEnv) => ChildProcess
  freePort?: () => Promise<number>
  fetch?: typeof fetch
}

/** What to run: a build's llama-server.exe and a model; `allLayers`, every layer on the card (CUDA). */
export type LlamaTarget = { exe: string; model: string; allLayers?: boolean }

type Running = LlamaTarget & {
  key: string
  cpu: boolean
  child?: ChildProcess
  ready: Promise<string>
  isReady: boolean
  stopped: boolean
}

/** A port nobody listens on now. */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no free port'))))
    })
  })
}

/** The server's arguments: the model, 8192 tokens shared by four sentences at once, no web page, no /slots; where its layers go. */
export function serverArgs(target: LlamaTarget, port: number, cpu: boolean): string[] {
  const where = cpu ? ['--device', 'none'] : target.allLayers ? ['-ngl', 'all'] : []
  return ['-m', target.model, '--host', '127.0.0.1', '--port', String(port), '-c', '8192', '-np', '4', '--kv-unified', '--no-webui', '--no-slots', ...where]
}

/**
 * The server's environment: Kryakl's own, without the person's LLAMA_* settings (LLAMA_ARG_TOOLS would give
 * the model a shell), with Kryakl's key: llama.cpp answers anyone on 127.0.0.1 (any program, a web page)
 * unless asked for a key, which it takes from LLAMA_API_KEY (never in the arguments, which other programs can read).
 */
export function serverEnv(from: NodeJS.ProcessEnv, apiKey: string): NodeJS.ProcessEnv {
  const env = Object.fromEntries(Object.entries(from).filter(([name]) => !/^LLAMA_/i.test(name)))
  return { ...env, LLAMA_API_KEY: apiKey }
}

const keyOf = (t: LlamaTarget) => `${t.exe}|${t.model}`

export class LlamaServer {
  private running: Running | undefined
  private busy = 0
  private idle: NodeJS.Timeout | undefined
  /** When the last request ended, or the server was warmed. */
  private usedAt = 0
  /** Builds and models the card could not take: on the processor until Kryakl starts again. */
  private readonly cpuOnly = new Set<string>()

  /** The key every request to the server carries (Authorization: Bearer), new each time Kryakl starts. */
  readonly apiKey = randomBytes(32).toString('hex')

  constructor(private readonly o: LlamaOptions) {}

  /** How long a running server has had nothing to do (ms); undefined while it serves, or when none runs. */
  get restingFor(): number | undefined {
    return this.running && this.busy === 0 ? Date.now() - this.usedAt : undefined
  }

  /** The model loaded and answering now, if any (not while it starts). */
  get loaded(): string | undefined {
    return this.running?.isReady ? this.running.model : undefined
  }

  /** The model being served now, and by which build, if any. */
  get model(): string | undefined {
    return this.running?.model
  }

  get exe(): string | undefined {
    return this.running?.exe
  }

  /** Whether the server running now was started on the processor (the card could not take the model). */
  get onProcessor(): boolean {
    return !!this.running?.cpu
  }

  /** Runs `job` against the server of `target` (its base URL; `loaded`: whether it waited for the model to load), started first when another one or none runs. */
  async run<T>(target: LlamaTarget, job: (base: string, loaded: boolean) => Promise<T>): Promise<T> {
    this.busy++
    clearTimeout(this.idle)
    const r = this.running
    const warm = r !== undefined && r.key === keyOf(target) && r.isReady
    try {
      return await job(await this.ready(target), !warm)
    } finally {
      this.busy--
      this.touch()
    }
  }

  /**
   * Starts the server of `target` ahead of a request (a key pressed, an empty
   * card opened), so the model loads while the text is copied, snipped or
   * typed; no request is made, and it stops when idle as after one. A server
   * busy with another model is left alone.
   */
  warm(target: LlamaTarget): void {
    if (this.running?.key === keyOf(target)) return this.touch()
    if (this.busy > 0) return
    this.usedAt = Date.now()
    this.ready(target).then(
      () => this.touch(),
      () => undefined,
    )
  }

  /** Stops the server; resolves once its process is gone (Windows keeps the model's file in use until then), or after a few seconds regardless. */
  stop(): Promise<void> {
    const r = this.running
    this.running = undefined
    clearTimeout(this.idle)
    if (!r) return Promise.resolve()
    r.stopped = true
    const child = r.child
    if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
    const gone = new Promise<void>(resolve => {
      child.once('exit', () => resolve())
      setTimeout(resolve, STOP_MS)
    })
    child.kill()
    return gone
  }

  dispose(): void {
    void this.stop()
  }

  private async ready(target: LlamaTarget): Promise<string> {
    const key = keyOf(target)
    // The model before is gone first: its memory on the card is free for the next.
    if (this.running && this.running.key !== key) await this.stop()
    const r = (this.running ??= this.launch(target, this.cpuOnly.has(key)))
    try {
      return await r.ready
    } catch (error) {
      if (r.cpu || r.stopped) throw error
      // The card could not take it: once more on the processor.
      this.cpuOnly.add(key)
      if (this.running === r) this.running = undefined
      return this.ready(target)
    }
  }

  private touch(): void {
    clearTimeout(this.idle)
    if (this.busy > 0 || !this.running) return
    this.usedAt = Date.now()
    this.idle = setTimeout(() => {
      if (this.busy === 0) void this.stop()
    }, this.o.idleMs ?? IDLE_MS)
  }

  private launch(target: LlamaTarget, cpu: boolean): Running {
    const r: Running = { ...target, key: keyOf(target), cpu, stopped: false, isReady: false, ready: Promise.resolve('') }
    r.ready = (async () => {
      const port = await (this.o.freePort ?? freePort)()
      if (r.stopped) throw new Error('llama.cpp was stopped')
      fs.mkdirSync(path.dirname(this.o.log), { recursive: true })
      // Past 2 MB a start begins it afresh, the last one kept as translate.old.log.
      rotate(this.o.log, 2_000_000)
      const log = fs.createWriteStream(this.o.log, { flags: 'a' })
      // A log that cannot be written is no reason to stop.
      log.on('error', () => undefined)
      log.write(`\n--- ${new Date().toISOString()} start ${path.basename(target.model)} with ${path.basename(path.dirname(target.exe))}${cpu ? ' on the processor' : ''}\n`)
      const spawn = this.o.spawn ?? ((file: string, args: string[], env: NodeJS.ProcessEnv) => nodeSpawn(file, args, { cwd: path.dirname(file), env, windowsHide: true }))
      const child = spawn(target.exe, serverArgs(target, port, cpu), serverEnv(process.env, this.apiKey))
      r.child = child
      // Its last words, for the error when it stops before it is ready.
      const tail: string[] = []
      const keep = (data: Buffer | string) => {
        log.write(data)
        tail.push(...String(data).split(/\r?\n/).filter(Boolean))
        tail.splice(0, Math.max(0, tail.length - 6))
      }
      child.stdout?.on('data', keep)
      child.stderr?.on('data', keep)
      let exit: string | undefined
      child.on('error', error => {
        exit ??= error.message
        log.write(`--- ${error.message}\n`)
      })
      child.on('exit', code => {
        exit ??= `exit ${code}`
        log.end(`--- exit ${code}\n`)
        if (this.running === r) this.running = undefined
      })
      if (r.stopped) child.kill()
      const base = `http://127.0.0.1:${port}`
      const get = this.o.fetch ?? fetch
      const deadline = Date.now() + (this.o.readyMs ?? READY_MS)
      for (;;) {
        if (r.stopped) throw new Error('llama.cpp was stopped')
        if (exit !== undefined) throw new Error(`llama.cpp stopped (${exit}): ${tail.join(' / ')}`)
        if (Date.now() > deadline) {
          child.kill()
          throw new Error('llama.cpp did not start in time')
        }
        try {
          const response = await get(`${base}/health`, { signal: AbortSignal.timeout(1000) })
          if (response.ok) {
            r.isReady = true
            return base
          }
        } catch {
          // still loading, or not listening yet
        }
        await new Promise(resolve => setTimeout(resolve, POLL_MS))
      }
    })()
    // Nobody may wait for it (stopped meanwhile): never an unhandled rejection.
    r.ready.catch(() => undefined)
    return r
  }
}
