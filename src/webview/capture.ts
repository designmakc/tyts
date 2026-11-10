// The call recording's panel: one hidden window that records and shows it. All
// of the computer's sound (getDisplayMedia, which main answers with the screen's
// loopback sound, its picture dropped here at once) and the microphone, each a
// MediaRecorder of 10 s chunks sent to the speech engine as a meeting's are
// (tracks `system` and `mic`); a chunk that never goes is counted as `lost`.
// The panel: a red dot, "Call", the time, Pause, Stop and a chevron that hides
// it, the recording going on; under them the source, or what is wrong.
// Screenshots: the picture getDisplayMedia gives is kept while a call records;
// a frame is sent when the person asks for one (the camera button, the shot key), and the
// camera button or the shot key sends one always, marked manual.
// With `callLive` the engine reads a rough draft of the words as the chunks come
// (engine/live.py); the speech-bubble button opens it, the window taller, and it
// is asked for every 2 s while open. The final transcript comes after the call.

import { t } from '../i18n'
import { onMac } from '../hotkey'
import type { CallState, SpeechResult, ToHost, ToView, TutorHost } from '../protocol'
import { TrackSender } from '../capturesend'
import { liveAnswer, liveRows, type LiveRow, type LiveState } from '../calllive'
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
/** The computer's sound is asked for this many times when its recorder does not start (the sound devices change as a call begins), a second apart. */
const SYSTEM_TRIES = 3
/** No sound from the computer for this long at the start: the panel asks the person to check the source. */
const SILENT_MS = 60_000
/** Louder than this, the computer's sound is there (RMS, 0…1). */
const HEARD = 0.005

type Track = { name: 'mic' | 'system'; stream: MediaStream; recorder: MediaRecorder; sender: TrackSender }

let state: CallState = 'idle'
let id: string | undefined
let tracks: Track[] = []
let micMissing = false
/** The computer's sound could not be recorded (its recorder did not start, tried again): the call goes on with the microphone alone. */
let systemMissing = false
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
/** The screen's picture while a call records, the shots' times from `startedAt`. */
let video: MediaStreamTrack | undefined
let startedAt = 0
/** The last shot's fate, said on the panel for a moment: the person sees it was kept, or that it was not. */
let shotNote: '' | 'ok' | 'failed' = ''
let shotNoting: number | undefined
const SHOT_NOTE_MS = 2500
let shotsSent: Promise<unknown> = Promise.resolve()
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

/** "Copy a phrase for the chat" (main copies call.phrase), "Copied" for a moment after. */
let copied: number | undefined
function copyPhrase(): HTMLElement {
  if (copied) return el('span', { class: 'link done', role: 'status' }, t('common.copied'))
  return link(t('call.copyPhrase'), () => {
    post({ type: 'captureCopyPhrase' })
    copied = window.setTimeout(() => {
      copied = undefined
      draw()
    }, 1500)
    draw()
  })
}

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
          ...(state === 'recording' && video ? [button('camera', t('call.shot'), () => void shot())] : []),
          ...(live ? [button('message-square-text', t(open ? 'call.liveHide' : 'call.liveShow'), toggleDraft, open ? 'on' : '')] : []),
          state === 'paused' ? button('play', t('call.resume'), resume) : button('pause', t('call.pause'), pause),
          button('square', t('call.stopShort'), () => void stop(), 'stop'),
        ]
      : []),
    button('chevron-down', t('call.hide'), () => post({ type: 'captureHide' }), 'tuck'),
  )
  const note = shotNote
    ? el('div', { class: `note ${shotNote === 'ok' ? 'good' : 'warn'}` }, t(shotNote === 'ok' ? 'call.shotKept' : 'call.shotFailed'))
    : error
    ? el('div', { class: 'note error' }, el('span', {}, error), onMac ? el('button', { class: 'link', onclick: () => post({ type: 'captureOpenSettings' }) }, t('call.openSettings')) : null)
    : systemMissing && (state === 'recording' || state === 'paused')
      ? el('div', { class: 'note warn' }, el('span', {}, t('call.noSystem')), onMac ? el('button', { class: 'link', onclick: () => post({ type: 'captureOpenSettings' }) }, t('call.openSettings')) : null)
      : silent
        ? el('div', { class: 'note warn' }, t('call.silent'))
      : micMissing
        ? el('div', { class: 'note warn' }, t('call.noMic'))
        : auto && state !== 'stopping'
          ? el('div', { class: 'note' }, t('call.autoStarted'), link(t('call.dontRecord'), () => void discard()), copyPhrase())
          : el('div', { class: 'note' }, busy ? '' : t('call.allSound'), busy ? null : copyPhrase())
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
 * One frame of the screen to the engine (shots/<ms>-m.jpg in the recording's folder), 1280 px wide, because the
 * person asked (the panel's button, the one at the top of the screen, the shot key). True when it was kept.
 * Nothing about the picture is logged.
 */
async function takeShot(): Promise<boolean> {
  if (state !== 'recording' || !video || video.readyState !== 'live' || !id) return false
  const ms = Date.now() - startedAt
  const recording = id
  try {
    // Chromium's ImageCapture has grabFrame; the DOM types know only takePhoto.
    const frame = await (new ImageCapture(video) as ImageCapture & { grabFrame(): Promise<ImageBitmap> }).grabFrame()
    const scale = Math.min(1, SHOT_WIDTH / frame.width)
    const canvas = new OffscreenCanvas(Math.round(frame.width * scale), Math.round(frame.height * scale))
    canvas.getContext('2d')!.drawImage(frame, 0, 0, canvas.width, canvas.height)
    frame.close()
    const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 })).arrayBuffer())
    const sent = speech('PUT', `/recordings/${recording}/shots/${ms}?manual=1`, bytes)
    shotsSent = Promise.all([shotsSent, sent])
    const answer = await sent
    if (!answer.ok) console.warn(`call: a screenshot was not kept (${answer.status ?? ''})`)
    return answer.ok
  } catch (e) {
    console.warn(`call: no screenshot (${e instanceof Error ? e.name : 'error'})`)
    return false
  }
}

/** A shot, and its fate said here and to main (the panel at the top of the screen says it too). */
async function shot(): Promise<void> {
  const ok = await takeShot()
  post({ type: 'captureShot', ok })
  shotNote = ok ? 'ok' : 'failed'
  window.clearTimeout(shotNoting)
  shotNoting = window.setTimeout(() => {
    shotNote = ''
    draw()
  }, SHOT_NOTE_MS)
  draw()
}

async function start(title: string, app?: string, byItself = false, words = false): Promise<void> {
  if (state !== 'idle') return
  live = words
  liveState = 'off'
  rows = []
  asking = null
  auto = byItself
  error = ''
  micMissing = false
  systemMissing = false
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
  // The recorders start before the engine is asked for a recording: one that does not start (the
  // system refused it, 2026-11-09 and 11-10: the call then recorded the microphone unseen and could
  // not be stopped) is tried again or left out, and what the others record waits for the recording's id.
  type Begun = { name: 'mic' | 'system'; stream: MediaStream; recorder: MediaRecorder; at: number; early: Blob[] }
  const begin = (name: 'mic' | 'system', stream: MediaStream): Begun | undefined => {
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 })
      const early: Blob[] = []
      recorder.ondataavailable = event => {
        if (event.data.size > 0) early.push(event.data)
      }
      recorder.start(SLICE)
      return { name, stream, recorder, at: Date.now(), early }
    } catch (e) {
      const sound = stream.getAudioTracks().map(a => `${a.readyState}${a.muted ? ', muted' : ''}`).join('; ') || 'no track'
      console.warn(`call: the ${name} recorder did not start (${e instanceof Error ? e.name : 'error'}; its sound: ${sound})`)
      return undefined
    }
  }
  let theirs = begin('system', system)
  for (let tries = 1; !theirs && tries < SYSTEM_TRIES; tries++) {
    for (const s of system.getTracks()) s.stop()
    video?.stop()
    video = undefined
    await new Promise(done => setTimeout(done, 1000))
    try {
      const got = await computerSound()
      system = got.sound
      video = got.picture
    } catch {
      break
    }
    theirs = begin('system', system)
  }
  // Without its sound the screen's picture is still kept, while the system gives it: a screenshot can be taken.
  if (!theirs) for (const s of system.getTracks()) s.stop()
  if (video && video.readyState !== 'live') video = undefined
  const mine = mic ? begin('mic', mic) : undefined
  if (mic && !mine) {
    for (const s of mic.getTracks()) s.stop()
    micMissing = true
  }
  systemMissing = !theirs
  const begun = [mine, theirs].filter((b): b is Begun => !!b)
  const end = () => {
    for (const b of begun) {
      b.recorder.ondataavailable = null
      b.recorder.stop()
      for (const s of b.stream.getTracks()) s.stop()
    }
    video?.stop()
    video = undefined
  }
  if (begun.length === 0) {
    error = t('call.failed', { why: t('call.noSound') })
    return set('idle')
  }
  startedAt = Math.min(...begun.map(b => b.at))
  const opened = await speech<{ id: string; live?: string }>('POST', '/recordings', {
    source: 'system',
    title,
    ...(app ? { app } : {}),
    ...(live ? { live: true } : {}),
    tracks: Object.fromEntries(begun.map(b => [b.name, { startedAt: b.at }])),
  })
  if (!opened.ok) {
    end()
    error = t('call.failed', { why: opened.error })
    return set('idle')
  }
  id = opened.data.id
  liveState = liveAnswer({ state: opened.data.live }).state
  const call = (method: string, route: string, body?: unknown) => speech(method, route, body)
  tracks = begun.map(({ name, stream, recorder, early }) => {
    const sender = new TrackSender(call, id!, name)
    const send = (chunk: Blob) => sender.send(chunk.arrayBuffer().then(b => new Uint8Array(b)))
    for (const chunk of early) send(chunk)
    recorder.ondataavailable = event => {
      if (event.data.size > 0) send(event.data)
    }
    return { name, stream, recorder, sender }
  })
  // The system cut the computer's sound off (another capture took it, the screen went away): what came is saved.
  if (theirs) {
    for (const track of system.getAudioTracks()) track.addEventListener('ended', () => void stop())
    listen(system)
  }
  started = Date.now()
  since = started
  ticking = window.setInterval(draw, 1000)
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
  if (message.command === 'start') void start(message.title ?? '', message.app, !!message.auto, !!message.live)
  else if (message.command === 'shot') void shot()
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
