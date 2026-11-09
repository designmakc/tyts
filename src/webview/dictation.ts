// Dictate's badge at the bottom of the screen. The main process says when to
// start, stop or throw away; the badge records, shows the phrase as the engine
// hears it (recognized while it is spoken), the time and the level, and then
// hands over the text (to be typed) or finishes the note in the engine. Its
// window follows the panel's height; the keys are on the Dictate page, not here.

import { t, type Key } from '../i18n'
import type { DictationMode, ToView, TutorHost } from '../protocol'
import { el } from './dom'
import { lucide } from './lucide'
import { ChunkRecorder, micTrouble, PhraseRecorder, StreamRecorder, type StreamStatus } from './recorder'
import { Wave } from './wave'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

const host = window.tutorHost
const root = document.getElementById('badge')!
const TITLES: Record<DictationMode, Key> = { type: 'dict.type', english: 'dict.english', note: 'dict.note', check: 'dict.check' }

type Recorder = PhraseRecorder | ChunkRecorder | StreamRecorder
let recorder: Recorder | undefined
let mode: DictationMode = 'type'
/** The microphone and the engine are still being asked: a quick stop waits for them. */
let starting: Promise<void> = Promise.resolve()
let timer: number | undefined
/** The text being finished was thrown away (Esc while typing): its answer is not typed. */
let dropped = false
/** Seconds of sound waiting behind the piece being recognized: the engine is behind the voice. */
const BEHIND = 4
let words: HTMLElement | undefined
let dot: HTMLElement | undefined
let time: HTMLElement | undefined
/** The phrase heard so far, kept for the panel while it is typed. */
let said = ''
/** The model is being fetched: its progress stands in the time's place. */
let fetching = false

function clock(seconds: number): string {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** The panel: the words on top (none when there are none to show), the status line under them. */
function show(kind: string, text: HTMLElement | null, ...line: (Node | string)[]): void {
  root.className = `badge ${kind}`
  root.replaceChildren(...(text ? [text] : []), el('div', { class: 'line' }, ...line), ...(kind === 'rec' || kind === 'busy' ? [tuckButton()] : []))
  if (text) toEnd(text)
}

/** Folds the badge into the tray for this phrase, the recording going on; it says so by the tray's red dot. */
function tuckButton(): HTMLElement {
  return el(
    'button',
    {
      class: 'tuck',
      title: t('dict.tuck'),
      'aria-label': t('dict.tuck'),
      onclick: () => {
        const fly = !matchMedia('(prefers-reduced-motion: reduce)').matches
        if (fly) root.classList.add('away')
        host.post({ type: 'dictationTuck', fly })
      },
    },
    lucide('chevron-down', 's'),
  )
}

/** The latest words in view; the top fades when earlier ones are above. */
function toEnd(text: HTMLElement): void {
  text.scrollTop = text.scrollHeight
  text.classList.toggle('more', text.scrollHeight > text.clientHeight + 1)
}

/** The words area: the phrase, or a muted line while there is none yet. */
function wordsOf(text: string, waiting = ''): HTMLElement {
  return el('div', { class: text ? 'words' : 'words waiting' }, text || waiting)
}

/** The whole phrase the engine heard so far; behind: the voice is ahead of the engine. */
function onStatus(status: StreamStatus): void {
  if (!words || !dot || !time) return
  const model = status.model
  fetching = model?.state === 'downloading'
  if (fetching) time.textContent = t('dict.gettingModel', { pct: Math.round((model?.progress ?? 0) * 100) })
  time.classList.toggle('fetch', fetching)
  const text = status.heard.trim()
  if (text && text !== said) {
    said = text
    words.textContent = text
    words.classList.remove('waiting')
    toEnd(words)
  }
  dot.classList.toggle('behind', status.pending > BEHIND)
  dot.title = status.pending > BEHIND ? 'catching up' : ''
}

/** The wave of the last three seconds of sound (wave.ts). */
let wave: Wave | undefined

/** The clock, the levels and the wave stop together. */
function quiet(): void {
  clearInterval(timer)
  timer = undefined
  wave?.stop()
  wave = undefined
}

function recording(): void {
  quiet()
  time = el('span', { class: 'time' }, '0:00')
  const heard = new Wave()
  wave = heard
  dot = el('span', { class: 'dot' })
  words = wordsOf('', t('common.listening'))
  said = ''
  fetching = false
  show('rec', words, dot, el('span', { class: 'what' }, t(TITLES[mode])), time, heard.canvas)
  // A new phrase's window starts at its smallest: told the panel's height even when it is the last one's.
  postHeight(true)
  // One tick per 50 ms: the clock, and the levels. A stream hands over every 50 ms it heard;
  // the others are asked how loud it is now.
  timer = window.setInterval(() => {
    if (!recorder || !time) return
    if (!fetching) time.textContent = clock(recorder.seconds)
    if (recorder instanceof StreamRecorder) for (const level of recorder.levels()) heard.hear(level)
    else heard.hear(recorder.level())
  }, 50)
  heard.start()
}

async function start(next: DictationMode, session?: string, expected: string[] = []): Promise<void> {
  mode = next
  dropped = false
  recorder =
    mode === 'note'
      ? new ChunkRecorder(host.call, { source: 'note', slice: 2000 })
      : session
        ? new StreamRecorder(host.call, session, expected, onStatus)
        : new PhraseRecorder()
  recording()
  try {
    starting = recorder.start()
    await starting
  } catch (error) {
    recorder = undefined
    quiet()
    host.post({ type: 'dictationFailed', message: micTrouble(error) })
  }
}

async function stop(): Promise<void> {
  await starting.catch(() => undefined)
  quiet()
  const r = recorder
  recorder = undefined
  if (!r) return
  const behind = dot?.classList.contains('behind')
  show('busy', said ? wordsOf(said) : null, el('span', { class: 'spin' }), el('span', { class: 'what' }, mode === 'note' ? t('dict.savingNote') : behind ? t('dict.catchingUp') : mode === 'check' ? t('common.checking') : t('dict.typing')))
  busy = r
  try {
    if (r instanceof ChunkRecorder) host.post({ type: 'dictationNote', id: await r.finish() })
    else if (r instanceof StreamRecorder) {
      const result = await r.finish()
      if (!dropped) host.post({ type: 'dictationText', mode, text: result.text, language: result.language, sure: result.sure })
    } else host.post({ type: 'dictationAudio', mode, audio: await r.finish() })
  } catch (error) {
    if (!dropped) host.post({ type: 'dictationFailed', message: error instanceof Error ? error.message : String(error) })
  } finally {
    if (busy === r) busy = undefined
  }
}

/** The recorder whose text is being finished now: Esc throws it away too. */
let busy: Recorder | undefined

async function cancel(): Promise<void> {
  await starting.catch(() => undefined)
  quiet()
  const r = recorder ?? busy
  recorder = undefined
  busy = undefined
  dropped = true
  await r?.cancel()
  host.post({ type: 'dictationCancelled' })
}

window.addEventListener('message', event => {
  const message = event.data as ToView
  if (event.source !== window || !message || typeof message.type !== 'string') return
  if (message.type === 'dictation') {
    if (message.command === 'start') void start(message.mode, message.session, message.expected)
    else if (message.command === 'stop') void stop()
    else void cancel()
  } else if (message.type === 'dictationEditing') {
    show('busy', said ? wordsOf(said) : null, el('span', { class: 'spin' }), el('span', { class: 'what' }, t('dict.editing')))
  } else if (message.type === 'dictationDone') {
    show('done', wordsOf(message.text), el('span', { class: 'check' }, '✓'), el('span', { class: 'what' }, message.note ?? (mode === 'note' ? t('dict.saved') : t('dict.typed'))))
  } else if (message.type === 'dictationError') {
    show('error', wordsOf(message.message), el('span', { class: 'what' }, mode === 'note' ? t('dict.noteFailed') : t('dict.nothingTyped')))
  }
})

// The window is as tall as the panel: the main process keeps its bottom edge in place.
let posted = 0
function postHeight(again = false): void {
  const px = Math.ceil(root.getBoundingClientRect().height)
  if (px === posted && !again) return
  posted = px
  host.post({ type: 'dictationHeight', px })
}
new ResizeObserver(() => postHeight()).observe(root)

host.post({ type: 'dictationReady' })
