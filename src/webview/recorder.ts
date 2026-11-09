// The microphone, for Dictate's badge and Transcribe's recordings. A phrase
// to type goes to the engine as it is spoken, raw 16 kHz PCM a quarter of a
// second at a time, and is recognized meanwhile (`StreamRecorder`); an engine
// older than that gets it whole at the end (`PhraseRecorder`). A note or a
// recording goes to the speech engine while it is made, a chunk every few
// seconds (`ChunkRecorder`), so a closed window loses at most the last one.

import { t } from '../i18n'
import type { HostCall, SpeechResult } from '../protocol'

export type Call = (request: HostCall) => Promise<unknown>

/** The browser's own echo and noise handling suits speech close to the microphone; a room recording keeps everything. */
async function microphone(close: boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: close, noiseSuppression: close, autoGainControl: true, channelCount: 1 } })
}

class Meter {
  private context: AudioContext
  private analyser: AnalyserNode
  private samples: Float32Array<ArrayBuffer>

  constructor(stream: MediaStream) {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 1024
    this.samples = new Float32Array(this.analyser.fftSize)
    this.context.createMediaStreamSource(stream).connect(this.analyser)
  }

  /** How loud it is now, 0…1. */
  level(): number {
    this.analyser.getFloatTimeDomainData(this.samples)
    let sum = 0
    for (const v of this.samples) sum += v * v
    return Math.min(1, Math.sqrt(sum / this.samples.length) * 4)
  }

  close(): void {
    void this.context.close()
  }
}

function stopped(recorder: MediaRecorder | undefined): Promise<void> {
  if (!recorder || recorder.state === 'inactive') return Promise.resolve()
  return new Promise(resolve => {
    recorder.onstop = () => resolve()
    recorder.stop()
  })
}

/** A short phrase, recorded whole. */
export class PhraseRecorder {
  startedAt = 0
  private stream: MediaStream | undefined
  private recorder: MediaRecorder | undefined
  private meter: Meter | undefined
  private chunks: Blob[] = []

  async start(): Promise<void> {
    this.stream = await microphone(true)
    this.startedAt = Date.now()
    this.meter = new Meter(this.stream)
    this.recorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 48000 })
    this.recorder.ondataavailable = event => event.data.size > 0 && this.chunks.push(event.data)
    this.recorder.start(250)
  }

  level(): number {
    return this.meter?.level() ?? 0
  }

  get seconds(): number {
    return this.startedAt ? (Date.now() - this.startedAt) / 1000 : 0
  }

  /** The recording, as webm. */
  async finish(): Promise<Uint8Array> {
    await stopped(this.recorder)
    this.release()
    return new Uint8Array(await new Blob(this.chunks, { type: 'audio/webm' }).arrayBuffer())
  }

  async cancel(): Promise<void> {
    await stopped(this.recorder)
    this.release()
  }

  private release(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop()
    this.meter?.close()
    this.stream = undefined
    this.meter = undefined
  }
}

export type ChunkOptions = {
  source: 'mic' | 'note'
  title?: string
  language?: string
  speakers?: number
  /** Milliseconds per chunk. */
  slice: number
}

const RETRIES = 3

/** A recording the engine receives while it is made. */
export class ChunkRecorder {
  id: string | undefined
  startedAt = 0
  /** Set when a chunk could not be delivered: the recording will be missing a piece. */
  lost = false
  private recorder: MediaRecorder | undefined
  private stream: MediaStream | undefined
  private meter: Meter | undefined
  private seq = 0
  private uploads: Promise<void> = Promise.resolve()

  constructor(
    private readonly call: Call,
    private readonly o: ChunkOptions,
  ) {}

  private speech<T>(method: string, route: string, body?: unknown): Promise<SpeechResult<T>> {
    return this.call({ call: 'speech', method, route, body }) as Promise<SpeechResult<T>>
  }

  /** Asks for the microphone, opens the recording in the engine, starts sending. */
  async start(): Promise<void> {
    this.stream = await microphone(this.o.source === 'note')
    this.startedAt = Date.now()
    const opened = await this.speech<{ id: string }>('POST', '/recordings', {
      source: this.o.source,
      title: this.o.title,
      language: this.o.language,
      speakers: this.o.speakers,
      tracks: { main: { startedAt: this.startedAt } },
    })
    if (!opened.ok) {
      this.release()
      throw new Error(opened.error)
    }
    this.id = opened.data.id
    this.meter = new Meter(this.stream)
    this.recorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 48000 })
    this.recorder.ondataavailable = event => {
      if (event.data.size > 0) this.upload(event.data)
    }
    this.recorder.start(this.o.slice)
  }

  private upload(blob: Blob): void {
    const seq = this.seq++
    this.uploads = this.uploads.then(async () => {
      const bytes = new Uint8Array(await blob.arrayBuffer())
      for (let attempt = 0; attempt < RETRIES; attempt++) {
        if ((await this.speech('PUT', `/recordings/${this.id}/main/${seq}`, bytes)).ok) return
        await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)))
      }
      this.lost = true
    })
  }

  level(): number {
    return this.meter?.level() ?? 0
  }

  get seconds(): number {
    return this.startedAt ? (Date.now() - this.startedAt) / 1000 : 0
  }

  /** Stops, sends what is left, and hands the recording to the engine. Its id. */
  async finish(): Promise<string> {
    await stopped(this.recorder)
    await this.uploads
    this.release()
    const r = await this.speech('POST', `/recordings/${this.id}/finish`, { language: this.o.language, speakers: this.o.speakers })
    if (!r.ok) throw new Error(r.error)
    return this.id!
  }

  async cancel(): Promise<void> {
    await stopped(this.recorder)
    this.release()
    if (this.id) await this.speech('DELETE', `/recordings/${this.id}`)
  }

  private release(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop()
    this.meter?.close()
    this.stream = undefined
    this.meter = undefined
  }
}

/** Samples per chunk sent while dictating: a quarter of a second at 16 kHz. */
const STREAM_CHUNK = 4000
/** Samples per level for the badge's wave: 50 ms at 16 kHz. */
const LEVEL_SPAN = 800
/** Levels kept for a page that has not taken them: three seconds. */
const LEVELS_KEPT = 60

export type StreamStatus = { pending: number; heard: string; model?: { state: string; progress?: number } }
export type Heard = { text: string; language: string; sure: number }

/**
 * A dictation sent to the engine while it is spoken (engine/stream.py), so
 * only its tail is left to recognize when the key is let go. The badge keeps
 * its own copy of the sound: should the session fail, the whole of it goes to
 * /dictate at the end instead.
 */
export class StreamRecorder {
  startedAt = 0
  private stream: MediaStream | undefined
  private context: AudioContext | undefined
  private kept: Int16Array[] = []
  private waiting = new Int16Array(STREAM_CHUNK)
  private filled = 0
  private seq = 0
  private uploads: Promise<void> = Promise.resolve()
  private broken = false
  private loudness = 0
  /** The sound's levels, one per 50 ms, not yet taken by the page. */
  private heard: number[] = []
  private spanSum = 0
  private spanCount = 0

  constructor(
    private readonly call: Call,
    private readonly session: string,
    private readonly expected: string[],
    private readonly onStatus: (status: StreamStatus) => void,
  ) {}

  private speech<T>(method: string, route: string, body?: unknown): Promise<SpeechResult<T>> {
    return this.call({ call: 'speech', method, route, body }) as Promise<SpeechResult<T>>
  }

  async start(): Promise<void> {
    this.stream = await microphone(true)
    this.startedAt = Date.now()
    this.context = new AudioContext({ sampleRate: 16000 })
    await this.context.audioWorklet.addModule('pcm-worklet.js')
    const source = this.context.createMediaStreamSource(this.stream)
    const tap = new AudioWorkletNode(this.context, 'pcm-tap')
    tap.port.onmessage = (event: MessageEvent<Float32Array>) => this.take(event.data)
    // A node is run only when something listens to it: a silent gain to the speakers does.
    const mute = this.context.createGain()
    mute.gain.value = 0
    source.connect(tap).connect(mute).connect(this.context.destination)
  }

  private take(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i]!
      this.spanSum += v * v
      if (++this.spanCount === LEVEL_SPAN) {
        // How loud these 50 ms were, 0…1, as Meter measures it.
        this.loudness = Math.min(1, Math.sqrt(this.spanSum / LEVEL_SPAN) * 4)
        this.heard.push(this.loudness)
        if (this.heard.length > LEVELS_KEPT) this.heard.shift()
        this.spanSum = 0
        this.spanCount = 0
      }
      this.waiting[this.filled++] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)))
      if (this.filled === STREAM_CHUNK) {
        this.send(this.waiting)
        this.waiting = new Int16Array(STREAM_CHUNK)
        this.filled = 0
      }
    }
  }

  private send(chunk: Int16Array): void {
    this.kept.push(chunk)
    const seq = this.seq++
    this.uploads = this.uploads.then(async () => {
      if (this.broken) return
      const bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      for (let attempt = 0; attempt < RETRIES; attempt++) {
        const r = await this.speech<StreamStatus>('PUT', `/dictate/sessions/${this.session}/${seq}`, bytes)
        if (r.ok) return this.onStatus(r.data)
        if (r.status === 404) break
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
      }
      this.broken = true
    })
  }

  /** How loud the latest 50 ms were, 0…1. */
  level(): number {
    return this.loudness
  }

  /** Every level since the last call, oldest first, one per 50 ms of sound: the wave misses none. */
  levels(): number[] {
    const taken = this.heard
    this.heard = []
    return taken
  }

  get seconds(): number {
    return this.startedAt ? (Date.now() - this.startedAt) / 1000 : 0
  }

  /** Stops, sends the tail, and waits for the whole text. */
  async finish(): Promise<Heard> {
    this.release()
    const tail = this.waiting.slice(0, this.filled)
    this.kept.push(tail)
    await this.uploads
    if (!this.broken) {
      const r = await this.speech<Heard>('POST', `/dictate/sessions/${this.session}/finish`, new Uint8Array(tail.buffer))
      if (r.ok) return r.data
    }
    // The session failed: the whole sound at once, as before sessions.
    const all = new Int16Array(this.kept.reduce((n, c) => n + c.length, 0))
    let at = 0
    for (const c of this.kept) (all.set(c, at), (at += c.length))
    const expected = this.expected.map(encodeURIComponent).join(',')
    const r = await this.speech<Heard>('POST', `/dictate?language=auto&expected=${expected}&strict=1&format=pcm16`, new Uint8Array(all.buffer))
    if (!r.ok) throw new Error(r.error)
    return r.data
  }

  async cancel(): Promise<void> {
    this.release()
    this.broken = true
    await this.speech('DELETE', `/dictate/sessions/${this.session}`)
  }

  private release(): void {
    for (const track of this.stream?.getTracks() ?? []) track.stop()
    void this.context?.close()
    this.stream = undefined
    this.context = undefined
  }
}

/** What getUserMedia's refusal means, in words. */
export function micTrouble(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError') return t('mic.denied')
  if (name === 'NotFoundError') return t('mic.none')
  if (name === 'NotReadableError') return t('mic.busy')
  return error instanceof Error ? error.message : String(error)
}
