// The call recording's panel: one hidden window that records and shows it. All
// of the computer's sound (getDisplayMedia, which main answers with the screen's
// loopback sound, its picture dropped here at once) and the microphone, each a
// MediaRecorder of 10 s chunks sent to the speech engine as a meeting's are
// (tracks `system` and `mic`); a chunk that never goes is counted as `lost`.
// The panel: a red dot, "Call", the time, Pause, Stop and a chevron that hides
// it, the recording going on; under them the source, or what is wrong.
// Screenshots: the picture getDisplayMedia gives is kept while a call records;
// with `callShots` a frame every 4 s is sent when it changed (shots.ts), and the
// camera button or the shot key sends one always, marked manual.
// With `callLive` the engine reads a rough draft of the words as the chunks come
// (engine/live.py); the speech-bubble button opens it, the window taller, and it
// is asked for every 2 s while open. The final transcript comes after the call.

import { t } from '../i18n'
import { onMac } from '../hotkey'
import type { CallState, SpeechResult, ToHost, ToView, TutorHost } from '../protocol'
import { TrackSender } from '../capturesend'
import { liveAnswer, liveRows, type LiveRow, type LiveState } from '../calllive'
import { changed, frameHash, SHOT_SIDE } from '../shots'
import { el } from './dom'
import { lucide } from './lucide'
import { micTrouble } from './recorder'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

const host = window.tutorHost
const post = (message: ToHost) => host.post(message)
const root = document.getElementById('panel')!

const SLICE = 10_000
/** No sound from the computer for this long at the start: the panel asks the person to check the source. */
const SILENT_MS = 60_000
/** Louder than this, the computer's sound is there (RMS, 0…1). */
const HEARD = 0.005

type Track = { name: 'mic' | 'system'; stream: MediaStream; recorder: MediaRecorder; sender: TrackSender }

let state: CallState = 'idle'
let id: string | undefined
let tracks: Track[] = []
let micMissing = false
let silent = false
let heard = false
let error = ''
/** Started by itself (callwatch.ts): the panel says so and offers not to record. */
let auto = false
/** "Record the call?" asked for this program, while nothing records. */
let asking: string | null = null
/** Seconds recorded before the last pause, and since when the time runs again. */
let before = 0
let since = 0
let started = 0
let listening: number | undefined
let ticking: number | undefined
/** The screen's picture while a call records, the shots' times from `startedAt`, every 4 s with `periodic`. */
let video: MediaStreamTrack | undefined
let startedAt = 0
let periodic = false
let shooting: number | undefined
let lastShot: Uint8Array | undefined
let shotsSent: Promise<unknown> = Promise.resolve()
const SHOT_EVERY = 4000
const SHOT_WIDTH = 1280
/** The draft of the words: asked for at the start, what the engine said of it, open on the panel, its rows. */
let live = false
let liveState: LiveState = 'off'
let open = false
let rows: LiveRow[] = []
let polling: number | undefined
const POLL_EVERY = 2000
let meter: { context: AudioContext; analyser: AnalyserNode; samples: Float32Array<ArrayBuffer> } | undefined

const speech = <T>(method: string, route: string, body?: unknown) => host.call({ call: 'speech', method, route, body }) as Promise<SpeechResult<T>>

function seconds(): number {
  return before + (state === 'recording' && since ? (Date.now() - since) / 1000 : 0)
}

function clock(s: number): string {
  const n = Math.floor(s)
  const h = Math.floor(n / 3600)
  const mm = String(Math.floor((n % 3600) / 60)).padStart(h ? 2 : 1, '0')
  const ss = String(n % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function tell(): void {
  post({ type: 'captureState', state, ...(id ? { id } : {}), seconds: Math.round(seconds()), silent, micMissing, ...(error ? { error } : {}) })
}

function set(next: CallState): void {
  state = next
  tell()
  draw()
}

function button(icon: Parameters<typeof lucide>[0], label: string, onclick: () => void, cls = ''): HTMLElement {
  return el('button', { class: `pb ${cls}`, title: label, 'aria-label': label, onclick }, lucide(icon, 's'))
}

const link = (label: string, onclick: () => void) => el('button', { class: 'link', onclick }, label)

function answer(record: boolean): void {
  asking = null
  post({ type: 'captureAnswer', record })
  draw()
}

function draw(): void {
  if (asking && state === 'idle') {
    root.className = 'panel asking'
    root.replaceChildren(
      el('div', { class: 'line' }, el('i', { class: 'dot still' }), el('span', { class: 'what' }, t('call.askTitle')), el('span', { class: 'gap' }), button('chevron-down', t('call.hide'), () => post({ type: 'captureHide' }), 'tuck')),
      el('div', { class: 'note' }, t('call.askNote', { app: asking }), link(t('call.askRecord'), () => answer(true)), link(t('call.askLater'), () => answer(false))),
    )
    return
  }
  const busy = state === 'starting' || state === 'stopping'
  const head = el(
    'div',
    { class: 'line' },
    el('i', { class: `dot ${state === 'recording' ? '' : 'still'}` }),
    el('span', { class: 'what' }, t('call.panel')),
    el('span', { class: 'time' }, state === 'starting' ? t('call.starting') : state === 'stopping' ? t('call.saving') : state === 'paused' ? `${clock(seconds())} · ${t('call.paused')}` : clock(seconds())),
    el('span', { class: 'gap' }),
    ...(state === 'recording' || state === 'paused'
      ? [
          ...(state === 'recording' && video ? [button('camera', t('call.shot'), () => void shot(true))] : []),
          ...(live ? [button('message-square-text', t(open ? 'call.liveHide' : 'call.liveShow'), toggleDraft, open ? 'on' : '')] : []),
          state === 'paused' ? button('play', t('call.resume'), resume) : button('pause', t('call.pause'), pause),
          button('square', t('call.stopShort'), () => void stop(), 'stop'),
        ]
      : []),
    button('chevron-down', t('call.hide'), () => post({ type: 'captureHide' }), 'tuck'),
  )
  const note = error
    ? el('div', { class: 'note error' }, el('span', {}, error), onMac ? el('button', { class: 'link', onclick: () => post({ type: 'captureOpenSettings' }) }, t('call.openSettings')) : null)
    : silent
      ? el('div', { class: 'note warn' }, t('call.silent'))
      : micMissing
        ? el('div', { class: 'note warn' }, t('call.noMic'))
        : auto && state !== 'stopping'
          ? el('div', { class: 'note' }, t('call.autoStarted'), link(t('call.dontRecord'), () => void discard()))
          : el('div', { class: 'note' }, busy ? '' : t('call.allSound'))
  root.className = `panel ${state}${open ? ' open' : ''}`
  root.replaceChildren(head, ...(open ? [draft()] : []), note)
  const list = root.querySelector('.rows')
  if (list) list.scrollTop = list.scrollHeight
}

/** The draft's rows, or why there are none; always marked as a draft. */
function draft(): HTMLElement {
  const why: Partial<Record<LiveState, string>> = { missing: t('call.liveMissing'), card: t('call.liveCard'), failed: t('call.liveFailed'), off: t('call.liveFailed') }
  const said = why[liveState]
  const body = said
    ? [el('div', { class: 'empty' }, said)]
    : rows.length
      ? rows.map(r =>
          el('div', { class: `row ${r.who}` }, el('span', { class: 'who' }, t(r.who === 'me' ? 'call.liveMe' : 'call.liveOthers')), el('span', { class: 'at' }, clock(r.at)), el('span', { class: 'said' }, r.gap ? t('call.liveGap') : r.text)),
        )
      : [el('div', { class: 'empty' }, t('call.liveWaiting'))]
  return el(
    'div',
    { class: 'draft' },
    el('div', { class: 'mark' }, liveState === 'paused' ? t('call.livePaused') : t('call.liveDraft')),
    el('div', { class: 'rows' }, ...body),
  )
}

async function poll(): Promise<void> {
  if (!open || !id) return
  const answer = await speech<unknown>('GET', `/recordings/${id}/live`)
  if (!open) return
  if (answer.ok) {
    const got = liveAnswer(answer.data)
    // 'off' after a start that said otherwise: the engine was restarted, the draft is gone.
    liveState = got.state
    rows = liveRows(got.lines)
  }
  draw()
}

function toggleDraft(): void {
  setDraft(!open)
}

function setDraft(next: boolean): void {
  if (next === open) return
  open = next
  post({ type: 'captureExpand', open })
  window.clearInterval(polling)
  if (open) {
    polling = window.setInterval(() => void poll(), POLL_EVERY)
    void poll()
  }
  draw()
}

/** The computer's sound: main answers with the screen's loopback sound; the picture is kept for the screenshots, a frame a second. */
async function computerSound(): Promise<{ sound: MediaStream; picture?: MediaStreamTrack }> {
  const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
  const [picture, ...rest] = display.getVideoTracks()
  for (const v of rest) v.stop()
  const audio = display.getAudioTracks()
  if (audio.length === 0) {
    picture?.stop()
    throw new Error(t('call.noSound'))
  }
  void picture?.applyConstraints({ frameRate: 1 }).catch(() => undefined)
  return { sound: new MediaStream(audio), ...(picture ? { picture } : {}) }
}

/**
 * One frame of the screen to the engine (shots/<ms>[-m].jpg in the recording's folder), 1280 px wide:
 * `manual` always, else only when it changed since the last one kept. Nothing about the picture is logged.
 */
async function shot(manual: boolean): Promise<void> {
  if (state !== 'recording' || !video || video.readyState !== 'live' || !id) return
  const ms = Date.now() - startedAt
  const recording = id
  try {
    // Chromium's ImageCapture has grabFrame; the DOM types know only takePhoto.
    const frame = await (new ImageCapture(video) as ImageCapture & { grabFrame(): Promise<ImageBitmap> }).grabFrame()
    const small = new OffscreenCanvas(SHOT_SIDE, SHOT_SIDE).getContext('2d', { willReadFrequently: true })!
    small.drawImage(frame, 0, 0, SHOT_SIDE, SHOT_SIDE)
    const hash = frameHash(small.getImageData(0, 0, SHOT_SIDE, SHOT_SIDE).data)
    if (!manual && !changed(lastShot, hash)) return frame.close()
    lastShot = hash
    const scale = Math.min(1, SHOT_WIDTH / frame.width)
    const canvas = new OffscreenCanvas(Math.round(frame.width * scale), Math.round(frame.height * scale))
    canvas.getContext('2d')!.drawImage(frame, 0, 0, canvas.width, canvas.height)
    frame.close()
    const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 })).arrayBuffer())
    const sent = speech('PUT', `/recordings/${recording}/shots/${ms}${manual ? '?manual=1' : ''}`, bytes)
    shotsSent = Promise.all([shotsSent, sent])
    const answer = await sent
    if (!answer.ok) console.warn(`call: a screenshot was not kept (${answer.status ?? ''})`)
  } catch (e) {
    console.warn(`call: no screenshot (${e instanceof Error ? e.name : 'error'})`)
  }
}

async function start(title: string, app?: string, byItself = false, shots = false, words = false): Promise<void> {
  if (state !== 'idle') return
  periodic = shots
  live = words
  liveState = 'off'
  rows = []
  lastShot = undefined
  asking = null
  auto = byItself
  error = ''
  micMissing = false
  silent = false
  heard = false
  before = 0
  since = 0
  set('starting')
  let system: MediaStream
  try {
    const got = await computerSound()
    system = got.sound
    video = got.picture
  } catch (e) {
    error = t('call.failed', { why: e instanceof Error && e.message ? e.message : String(e) })
    return set('idle')
  }
  let mic: MediaStream | undefined
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
  } catch (e) {
    console.warn(`call: no microphone (${micTrouble(e)})`)
    micMissing = true
  }
  startedAt = Date.now()
  const opened = await speech<{ id: string; live?: string }>('POST', '/recordings', {
    source: 'system',
    title,
    ...(app ? { app } : {}),
    ...(live ? { live: true } : {}),
    tracks: { system: { startedAt }, ...(mic ? { mic: { startedAt } } : {}) },
  })
  if (!opened.ok) {
    for (const s of [system, mic]) for (const track of s?.getTracks() ?? []) track.stop()
    video?.stop()
    video = undefined
    error = t('call.failed', { why: opened.error })
    return set('idle')
  }
  id = opened.data.id
  liveState = liveAnswer({ state: opened.data.live }).state
  const call = (method: string, route: string, body?: unknown) => speech(method, route, body)
  tracks = [
    ...(mic ? [{ name: 'mic' as const, stream: mic }] : []),
    { name: 'system' as const, stream: system },
  ].map(({ name, stream }) => {
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 })
    const sender = new TrackSender(call, id!, name)
    recorder.ondataavailable = event => {
      if (event.data.size > 0) sender.send(event.data.arrayBuffer().then(b => new Uint8Array(b)))
    }
    return { name, stream, recorder, sender }
  })
  for (const track of tracks) track.recorder.start(SLICE)
  // The system cut the computer's sound off (another capture took it, the screen went away): what came is saved.
  for (const track of system.getAudioTracks()) track.addEventListener('ended', () => void stop())
  listen(system)
  started = Date.now()
  since = started
  ticking = window.setInterval(draw, 1000)
  if (periodic && video) shooting = window.setInterval(() => void shot(false), SHOT_EVERY)
  set('recording')
}

/** Is the computer's sound there? Asked twice a second; silent through the first minute, the panel says so. */
function listen(stream: MediaStream): void {
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 1024
  context.createMediaStreamSource(stream).connect(analyser)
  meter = { context, analyser, samples: new Float32Array(analyser.fftSize) }
  listening = window.setInterval(() => {
    if (!meter || state !== 'recording') return
    meter.analyser.getFloatTimeDomainData(meter.samples)
    let sum = 0
    for (const v of meter.samples) sum += v * v
    if (Math.sqrt(sum / meter.samples.length) > HEARD) heard = true
    const next = !heard && Date.now() - started > SILENT_MS
    if (next !== silent) {
      silent = next
      tell()
      draw()
    }
    // Once heard, nothing more to ask.
    if (heard) window.clearInterval(listening)
  }, 500)
}

/**
 * A pause records silence rather than nothing: the chunks go on, so the engine
 * never takes a long pause for a recording cut off, and the tracks stay in step.
 */
function pause(): void {
  if (state !== 'recording') return
  before = seconds()
  since = 0
  for (const track of tracks) for (const s of track.stream.getTracks()) s.enabled = false
  set('paused')
}

function resume(): void {
  if (state !== 'paused') return
  for (const track of tracks) for (const s of track.stream.getTracks()) s.enabled = true
  since = Date.now()
  set('recording')
}

const stopped = (recorder: MediaRecorder) =>
  recorder.state === 'inactive' ? Promise.resolve() : new Promise<void>(resolve => (recorder.addEventListener('stop', () => resolve(), { once: true }), recorder.stop()))

/** Stops both tracks, sends what is left and hands the recording to the engine; says its id and the chunks lost. `drop`: deleted instead, nothing transcribed. */
async function stop(drop = false): Promise<void> {
  if (state === 'starting') {
    // Started still: it stops as soon as it records.
    const wait = window.setInterval(() => {
      if (state === 'starting') return
      window.clearInterval(wait)
      void stop(drop)
    }, 200)
    return
  }
  if (state !== 'recording' && state !== 'paused') return
  before = seconds()
  since = 0
  set('stopping')
  setDraft(false)
  live = false
  window.clearInterval(ticking)
  window.clearInterval(listening)
  window.clearInterval(shooting)
  video?.stop()
  video = undefined
  await Promise.all(tracks.map(track => stopped(track.recorder)))
  await Promise.all(tracks.map(track => track.sender.done()))
  // The engine takes shots only while the call records: every one sent goes before finish.
  await shotsSent.catch(() => undefined)
  const lost = tracks.reduce((n, track) => n + track.sender.lost, 0)
  for (const track of tracks) for (const s of track.stream.getTracks()) s.stop()
  void meter?.context.close()
  meter = undefined
  tracks = []
  auto = false
  if (drop) {
    // The engine deletes a recording only while it is still recording: before any finish.
    const gone = await speech('DELETE', `/recordings/${id}`)
    if (!gone.ok) console.warn(`call: the engine did not delete the recording (${gone.status ?? ''})`)
    post({ type: 'captureDone', id: null, lost: 0 })
  } else {
    const finished = await speech('POST', `/recordings/${id}/finish`, { lost })
    if (!finished.ok) console.warn(`call: the engine did not take the recording (${finished.status ?? ''})`)
    post({ type: 'captureDone', id: finished.ok ? (id ?? null) : null, lost })
  }
  id = undefined
  set('idle')
}

const discard = () => stop(true)

window.addEventListener('message', event => {
  const message = event.data as ToView
  if (event.source !== window || message?.type !== 'capture') return
  if (message.command === 'start') void start(message.title ?? '', message.app, !!message.auto, !!message.shots, !!message.live)
  else if (message.command === 'shot') void shot(true)
  else if (message.command === 'stop') void stop()
  else if (message.command === 'discard') void discard()
  else if (message.command === 'ask') {
    asking = message.app ?? ''
    draw()
  } else if (message.command === 'unask') {
    asking = null
    draw()
  }
  else if (message.command === 'pause') pause()
  else if (message.command === 'resume') resume()
})

draw()
post({ type: 'captureState', state: 'idle' })
