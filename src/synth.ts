// The host side of the natural voice: starts the voice process the first
// time the person listens with it, hands it a reading's sentences a couple
// ahead of the one playing in the webview, passes the audio back, and ends
// the process after a while without use (the model holds a few hundred MB).
//
// Made audio is kept by its text, voice and speed, so a sentence read again
// (a repeat, a step back, a paragraph already made ahead) plays at once; and
// a sentence the process is still making for a reading that was stopped is
// waited for, not asked for twice, when the next reading needs it.

import { fork, type ChildProcess } from 'node:child_process'
import * as os from 'node:os'
import * as path from 'node:path'

import type { WordTime } from './kokoro'
import type { VoicePaths } from './voicestore'

export type WorkerIn =
  | { type: 'speak'; job: number; index: number; text: string; voice: string; speed: number }
  | { type: 'cancel'; job: number }
  /** The pronunciation of a word, in IPA, from eSpeak. */
  | { type: 'phonemes'; text: string }

/** `failed` with job -1: the model did not load. */
export type WorkerOut =
  | { type: 'loaded' }
  /** `took`: seconds the sentence took to make (its sound lasts samples / 24 000). */
  | { type: 'audio'; job: number; index: number; samples: Float32Array; words: WordTime[]; took?: number }
  | { type: 'failed'; job: number; index?: number; message: string }
  | { type: 'phonemes'; text: string; ipa: string }

/** Sentences made ahead of the one playing. */
const AHEAD = 2
const IDLE_MS = 5 * 60_000
/** Made sentences kept for a repeat: a couple of minutes of speech. */
const CACHE_SIZE = 60

export type SynthEvents = {
  audio: (id: number, index: number, samples: Float32Array, words: WordTime[]) => void
  failed: (id: number, message: string) => void
  phonemes: (text: string, ipa: string) => void
  /** A sentence was made: how long that took and how long it plays, in seconds (this computer's speed). */
  made?: (took: number, seconds: number) => void
}

type Made = { samples: Float32Array; words: WordTime[] }

/**
 * A reading: `items` are delivered in order as they are made; `ahead` are
 * made after them only to be kept (the sentence one-by-one reads next).
 */
type Reading = {
  id: number
  job: number
  items: string[]
  ahead: string[]
  voice: string
  speed: number
  sent: number
  /** Indexes waiting for the audio of a text, by its key. */
  wanted: Map<string, number[]>
  delivered: number
}

/** What was sent to the process and not answered yet, oldest first: the first is being made. */
type Request = { job: number; index: number; key: string }

const keyOf = (text: string, voice: string, speed: number) => `${voice}|${speed}|${text}`

export type SpeakerOptions = {
  fork?: typeof fork
  /** The threads the voice gets: this computer's physical cores when known (device.ts), else half its logical ones. */
  threads?: () => number | undefined
}

export class NaturalSpeaker {
  private child: ChildProcess | undefined
  private job = 0
  private reading: Reading | undefined
  private idle: NodeJS.Timeout | undefined
  private stderr = ''
  private readonly cache = new Map<string, Made>()
  private requests: Request[] = []
  private readonly forkWorker: typeof fork
  private readonly threads: () => number | undefined

  constructor(
    private readonly workerPath: string,
    private readonly paths: () => VoicePaths | undefined,
    private readonly events: SynthEvents,
    options: SpeakerOptions = {},
  ) {
    this.forkWorker = options.fork ?? fork
    this.threads = options.threads ?? (() => undefined)
  }

  speak(id: number, items: string[], voice: string, speed: number, ahead: string[] = []): void {
    this.stop()
    const paths = this.paths()
    if (!paths) {
      this.events.failed(id, 'the natural voice is not downloaded')
      return
    }
    try {
      this.start(paths)
    } catch (error) {
      this.events.failed(id, String(error))
      return
    }
    this.job += 1
    this.reading = { id, job: this.job, items, ahead, voice, speed, sent: 0, wanted: new Map(), delivered: 0 }
    this.feed(0)
  }

  /** The webview started playing sentence `index` of reading `id`. */
  at(id: number, index: number): void {
    if (this.reading?.id === id) this.feed(index)
  }

  /** Asks for a word's pronunciation; the answer comes as the `phonemes` event. Silent without the voice. */
  phonemes(text: string): void {
    const paths = this.paths()
    if (!paths) return
    try {
      this.start(paths)
    } catch {
      return
    }
    this.child?.send({ type: 'phonemes', text } satisfies WorkerIn)
    this.touch()
  }

  stop(): void {
    const r = this.reading
    if (!r) return
    this.child?.send({ type: 'cancel', job: r.job } satisfies WorkerIn)
    // The process drops the job's waiting sentences; the one it is making goes on, and is kept.
    this.requests = this.requests.filter((q, i) => i === 0 || q.job !== r.job)
    this.reading = undefined
  }

  dispose(): void {
    this.reading = undefined
    this.requests = []
    if (this.idle) clearTimeout(this.idle)
    this.child?.kill()
    this.child = undefined
  }

  private feed(playing: number): void {
    const r = this.reading
    const child = this.child
    if (!r || !child) return
    while (r.sent < r.items.length && r.sent <= playing + AHEAD) {
      const index = r.sent++
      const key = keyOf(r.items[index] ?? '', r.voice, r.speed)
      const made = this.cache.get(key)
      if (made) {
        this.deliver(r, index, made)
        continue
      }
      const waiting = r.wanted.get(key)
      if (waiting) waiting.push(index)
      else r.wanted.set(key, [index])
      // Already being made (for a reading that was stopped): it will serve this one.
      if (!this.requests.some(q => q.key === key)) this.request(r, index, r.items[index] ?? '', key)
    }
    // Once the reading's own sentences are all asked for, the ones to keep follow.
    if (r.sent === r.items.length) {
      r.ahead.forEach((text, k) => {
        const key = keyOf(text, r.voice, r.speed)
        if (!this.cache.has(key) && !this.requests.some(q => q.key === key)) this.request(r, r.items.length + k, text, key)
      })
      r.ahead = []
    }
    this.touch()
  }

  private request(r: Reading, index: number, text: string, key: string): void {
    this.child?.send({ type: 'speak', job: r.job, index, text, voice: r.voice, speed: r.speed } satisfies WorkerIn)
    this.requests.push({ job: r.job, index, key })
  }

  private deliver(r: Reading, index: number, made: Made): void {
    r.delivered += 1
    // Every sentence is in: the reading needs nothing more, and the process may rest.
    if (r.delivered === r.items.length && this.reading === r) this.reading = undefined
    this.events.audio(r.id, index, made.samples, made.words)
  }

  private keep(key: string, made: Made): void {
    this.cache.delete(key)
    this.cache.set(key, made)
    while (this.cache.size > CACHE_SIZE) {
      const oldest = this.cache.keys().next().value
      if (oldest === undefined) break
      this.cache.delete(oldest)
    }
  }

  private start(paths: VoicePaths): void {
    if (this.child) return
    this.stderr = ''
    this.requests = []
    const child = this.forkWorker(this.workerPath, [], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        TUTOR_VOICE_DIR: paths.dir,
        // A Windows path with backslashes, or Windows loads its own older onnxruntime.dll from System32.
        TUTOR_ORT_BINDING: path.resolve(paths.binding),
        TUTOR_THREADS: String(Math.max(1, Math.min(8, this.threads() ?? Math.floor(os.availableParallelism() / 2)))),
      },
      execArgv: [],
      serialization: 'advanced',
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    })
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (chunk: string) => (this.stderr = (this.stderr + chunk).slice(-2000)))
    child.on('message', (m: WorkerOut) => this.onMessage(m))
    const gone = (why: string) => {
      if (this.child !== child) return
      this.child = undefined
      this.requests = []
      const r = this.reading
      this.reading = undefined
      if (r) this.events.failed(r.id, this.stderr.trim().split('\n').pop() || why)
    }
    child.on('error', error => gone(String(error)))
    child.on('exit', code => gone(`the voice process stopped (${code})`))
    this.child = child
  }

  private onMessage(m: WorkerOut): void {
    if (m.type === 'phonemes') return this.events.phonemes(m.text, m.ipa)
    if (m.type === 'loaded') return
    const at = m.type === 'failed' && m.index === undefined ? -1 : this.requests.findIndex(q => q.job === m.job && q.index === (m as { index?: number }).index)
    const request = at >= 0 ? this.requests.splice(at, 1)[0] : undefined
    const r = this.reading
    if (m.type === 'audio') {
      if (m.took) this.events.made?.(m.took, m.samples.length / 24_000)
      if (!request) return
      const made = { samples: m.samples, words: m.words }
      this.keep(request.key, made)
      const waiting = r?.wanted.get(request.key)
      if (!r || !waiting) return
      r.wanted.delete(request.key)
      for (const index of waiting) this.deliver(r, index, made)
      return
    }
    // A failure: the model did not load (-1), or a sentence the reading waits for failed.
    if (!r) return
    if (m.job === -1 || m.job === r.job || (request && r.wanted.has(request.key))) {
      this.reading = undefined
      this.events.failed(r.id, m.message)
    }
  }

  /** Ends the process once nothing has been read for a while. */
  private touch(): void {
    if (this.idle) clearTimeout(this.idle)
    this.idle = setTimeout(() => {
      if (this.reading) return this.touch()
      this.child?.kill()
      this.child = undefined
    }, IDLE_MS)
  }
}
