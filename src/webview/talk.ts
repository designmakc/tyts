// Talk to the duck: the talk window (media/talk.html; talk.ts in the main
// process holds the talk, talks.ts keeps it). The Talk key, Space or the round
// button starts listening: the person speaks English and the words show as
// they are heard (a dictation session of the speech engine, English only); the
// next press sends the line. Its marks come under it in about a second, the
// duck's answer in about three, read aloud with each word lit. A press while
// the duck speaks or thinks stops it and listens again; Esc drops the line
// being said, or quiets the duck. A click on a word of the duck's opens the
// word card; a click on the person's own line reads it set right. The talk
// keeps to its last line while the person is there; scrolled up, a ↓ brings
// it back. Turns are drawn again only when changed, so a line being read,
// heard or typed is never replaced. The history (the clock in the bar) lists
// the talks put away: beside the talk in a wide window, over it in a narrow
// one; a click goes on with one. The window's settings are the app window's
// Talk page (the gear); the model's name in the bar opens its choice.

import { formatDate, languageName, levelName, sizeText, t, type Key } from '../i18n'
import { voiceMatches } from '../languages'
import { chosenNatural } from '../natural'
import type { HostVoice, SpeechResult, TalkSummary, TalkTurn, TalkWindowView, ToView } from '../protocol'
import { TOPICS } from '../topics'
import { tile } from './brand'
import { dwmFlag, el } from './dom'
import { glyph } from './glyphs'
import { WordHover } from './hover'
import { caps } from './keycaps'
import { lucide } from './lucide'
import { Player } from './player'
import { markRare } from './rare'
import { micTrouble, StreamRecorder } from './recorder'
import { duckTurn, myTurn } from './turns'
import { post } from './ui'
import { Wave } from './wave'

dwmFlag()

/** The latest snapshot of the window. */
let view: TalkWindowView | undefined
/** Listening: asking for the microphone and the engine, hearing, or finishing the line. */
let phase: 'idle' | 'starting' | 'listening' | 'sending' = 'idle'
let recorder: StreamRecorder | undefined
/** What the engine heard so far of the line being said. */
let heard = ''
/** A line went to the main process: the next view has it among the turns. */
let sent = false
/** Why listening did not start or failed, until the next press. */
let trouble = ''
/** The last duck's line read aloud by itself: only newer ones are. */
let lastRead = 0
/** The newest turn drawn: a newer one while scrolled up shows the ↓. */
let lastSeen = 0
let clock: number | undefined
/** A talk of the history asked to go on: once it is the one going on, its lines are not read aloud again. */
let continuing = ''

// ---------------------------------------------------------------- the voice and the word card

let hostVoices: HostVoice[] = []
let hostCanSpeak = false
let webVoices: SpeechSynthesisVoice[] = []
let common = new Set<string>()

function webVoice(): SpeechSynthesisVoice | undefined {
  const name = view?.voice ?? ''
  const named = name ? webVoices.find(v => v.name === name) : undefined
  if (named) return named
  if (name && hostVoices.some(v => v.name === name)) return undefined
  const english = webVoices.filter(v => voiceMatches(v.lang, 'en'))
  return english.find(v => v.localService) ?? english[0]
}

let audioOut: AudioContext | undefined
function openAudio(): AudioContext | undefined {
  if (!audioOut) {
    try {
      audioOut = new AudioContext({ sampleRate: 24_000 })
    } catch {
      return undefined
    }
  }
  if (audioOut.state === 'suspended') void audioOut.resume()
  return audioOut
}

const player = new Player(
  post,
  {
    lang: () => 'en',
    voice: webVoice,
    rate: () => view?.rate ?? 1,
    hostCanSpeak: () => hostCanSpeak,
    natural: () => (view?.natural === 'ready' ? chosenNatural(view.voice)?.id : undefined),
    audio: () => openAudio(),
    naturalFailed: () => undefined,
    finished: () => drawComposer(),
  },
  () => drawComposer(),
)

// ---------------------------------------------------------------- the window's parts

const root = document.getElementById('root')!
root.className = 'talk'

const keyCaps = el('span', { class: 'head-key' })
const historyButton = el('button', { class: 'ib', title: t('talk.yourTalks'), 'aria-label': t('talk.yourTalks'), 'aria-pressed': 'false', onclick: () => showHistory(!historyShown()) }, lucide('history'))
const modelChip = el('button', { class: 'model-chip', onclick: () => post({ type: 'talkWindow', action: 'model' }) })
const pinButton = el('button', { class: 'ib', onclick: () => post({ type: 'talkPin', on: !view?.onTop }) })
const maxButton = el('button', { class: 'ib', onclick: () => post({ type: 'talkWindow', action: 'maximize' }) })
const header = el(
  'header',
  { class: 'bar' },
  historyButton,
  tile(18),
  el('span', { class: 'head-name' }, t('menu.talk')),
  keyCaps,
  modelChip,
  el('span', { class: 'grow' }),
  pinButton,
  el('button', { class: 'ib', title: t('talk.settings'), 'aria-label': t('talk.settings'), onclick: () => post({ type: 'talkWindow', action: 'settings' }) }, lucide('settings')),
  maxButton,
  el('button', { class: 'ib', title: t('common.close'), 'aria-label': t('common.close'), onclick: () => post({ type: 'talkWindow', action: 'close' }) }, lucide('x')),
)

const notice = el('div', { class: 'talk-notice' })
const empty = el('div', { class: 'talk-empty' })
const list = el('div', { class: 'turns' })
const live = el('div', { class: 'turn me live', hidden: true })
const typing = el('div', { class: 'turn duck typing', hidden: true }, tile(28), el('div', { class: 'bubble' }, el('span', { class: 'dots' }, el('i'), el('i'), el('i'))))
const failed = el('p', { class: 'warn talk-failed', hidden: true })
const feedIn = el('div', { class: 'feed-in' }, empty, list, live, typing, failed)
const feed = el('div', { class: 'feed' }, feedIn)
const toEnd = el('button', { class: 'to-end', hidden: true, title: t('talk.toEnd'), 'aria-label': t('talk.toEnd'), onclick: () => follow(true) }, lucide('arrow-down', 's'))

const micButton = el('button', { class: 'mic', onclick: () => toggle() })
const status = el('div', { class: 'cstatus', 'aria-live': 'polite' })
const field = el('input', { type: 'text', class: 'field', placeholder: t('talk.typePlaceholder'), autocomplete: 'off', spellcheck: 'false', 'aria-label': t('talk.typeAria') })
field.addEventListener('keydown', event => {
  if (event.key === 'Enter' && field.value.trim()) {
    event.preventDefault()
    say(field.value)
    field.value = ''
  } else if (event.key === 'Escape' && field.value) {
    event.preventDefault()
    event.stopPropagation()
    field.value = ''
  }
})
const newButton = el('button', { class: 'btn new', title: t('talk.newTitle'), onclick: () => newTalk() }, lucide('square-pen'), t('talk.new'))
const composer = el('div', { class: 'composer' }, el('div', { class: 'composer-in' }, micButton, el('div', { class: 'cmain' }, status, el('div', { class: 'crow' }, field, newButton))))
const wave = new Wave()
const time = el('span', { class: 'time' }, '0:00')

const historyList = el('div', { class: 'hlist' })
const historyFoot = el('div', { class: 'hfoot' })
const history = el(
  'aside',
  { class: 'history', 'aria-label': t('talk.yourTalks') },
  el('div', { class: 'hhead' }, el('span', { class: 'htitle' }, t('talk.yourTalks')), el('button', { class: 'ib hclose', title: t('common.close'), 'aria-label': t('talk.closeList'), onclick: () => showHistory(false) }, lucide('x'))),
  el('button', { class: 'btn hnew', onclick: () => newTalk() }, lucide('square-pen'), t('talk.new')),
  historyList,
  historyFoot,
)
const scrim = el('div', { class: 'scrim', hidden: true, onclick: () => showHistory(false) })

root.append(header, el('div', { class: 'talk-body' }, history, el('div', { class: 'talk-main' }, notice, el('div', { class: 'feed-wrap' }, feed, toEnd), composer), scrim))

const hover = new WordHover({
  host: document.body,
  area: feed,
  post,
  nativeName: () => (view?.native ? languageName(view.native) : t('lang.yours')),
  mode: () => view?.wordHint ?? 'shift',
  speak: word => void player.play('word', [el('span', {}, word)]),
  ceiling: () => header.getBoundingClientRect().bottom,
})
feed.addEventListener('click', event => {
  const target = event.target as Element
  if (target.closest('button, input, .word-card')) return
  if (target.closest('[data-words]')) hover.showAt((event as MouseEvent).clientX, (event as MouseEvent).clientY)
  else hover.hide()
})

// ---------------------------------------------------------------- keeping to the last line

/** The person is at the last line: a line coming in, or one growing (heard, its note), keeps it in view. */
let atEnd = true
const nearEnd = () => feed.scrollHeight - feed.scrollTop - feed.clientHeight < 32

feed.addEventListener(
  'scroll',
  () => {
    hover.hide()
    atEnd = nearEnd()
    if (atEnd) toEnd.hidden = true
  },
  { passive: true },
)

/** To the last line, when the person is there (or asked, `now`). */
function follow(now = false): void {
  if (now) atEnd = true
  if (!atEnd) return
  feed.scrollTop = feed.scrollHeight
  toEnd.hidden = true
}

// A line heard word by word, a note coming in, the window resized: still at the end.
new ResizeObserver(() => follow()).observe(feedIn)
new ResizeObserver(() => follow()).observe(feed)

// ---------------------------------------------------------------- the history

/** A window this wide keeps the history beside the talk; a narrower one opens it over the talk. */
const wide = matchMedia('(min-width: 720px)')
const DOCKED_KEY = 'tyts.talk.history'
/** Beside the talk (a wide window): open until closed, kept between opens. */
let docked = (() => {
  try {
    return localStorage.getItem(DOCKED_KEY) !== 'closed'
  } catch {
    return true
  }
})()
/** Over the talk (a narrow window): open until a talk is picked, Esc, or a click beside it. */
let over = false
/** Clear all pressed once: a second press within 4 s clears. */
let clearing: number | undefined
/** What the list was drawn from: drawn again only when the talks (or the day) change. */
let historyFrom = ''

const historyShown = () => (wide.matches ? docked : over)

function showHistory(on: boolean): void {
  if (wide.matches) {
    docked = on
    try {
      localStorage.setItem(DOCKED_KEY, on ? 'open' : 'closed')
    } catch {}
  } else over = on
  placeHistory()
}

function placeHistory(): void {
  const on = historyShown()
  root.classList.toggle('wide', wide.matches)
  root.classList.toggle('history-open', on)
  scrim.hidden = !on || wide.matches
  historyButton.setAttribute('aria-pressed', String(on))
  historyButton.title = on ? t('talk.hideTalks') : t('talk.yourTalks')
  if (!on) stopClearing()
}

wide.addEventListener('change', () => {
  over = false
  placeHistory()
})

const DAY_MS = 24 * 60 * 60 * 1000
const topicName = (id: string) => (TOPICS.some(topic => topic.id === id) ? t(`topic.${id}` as Key) : id)

type Day = 'today' | 'yesterday' | 'earlier'
const DAY_NAMES: Record<Day, Key> = { today: 'talk.today', yesterday: 'talk.yesterday', earlier: 'talk.earlier' }

function groupOf(iso: string, now: number): Day {
  const today = new Date(now).setHours(0, 0, 0, 0)
  const at = Date.parse(iso)
  return at >= today ? 'today' : at >= today - DAY_MS ? 'yesterday' : 'earlier'
}

/** When a talk ended: the time today and yesterday, the day before that. */
const whenOf = (iso: string, group: Day) =>
  group === 'earlier' ? formatDate(new Date(iso), { day: 'numeric', month: 'short' }) : formatDate(new Date(iso), { hour: '2-digit', minute: '2-digit' })

/** A talk in the list: its topic, the person's first line, how long it was; a click goes on with it, × deletes it. The one going on is lit. */
function talkItem(talk: TalkSummary, group: Day, going: boolean): HTMLElement {
  const meta = [t('talk.lines', { n: talk.lines }), talk.marked ? t('talk.withMistake', { n: talk.marked }) : '', going ? t('talk.goingOnMeta') : whenOf(talk.ended, group)].filter(Boolean).join(' · ')
  return el(
    'div',
    { class: going ? 'hitem on' : 'hitem' },
    el(
      'button',
      { class: 'hopen', 'aria-current': going ? 'true' : undefined, title: going ? t('talk.goingOnTitle') : t('talk.goOn'), onclick: () => (going ? !wide.matches && showHistory(false) : goOn(talk.id)) },
      el('span', { class: 'hname' }, topicName(talk.topic)),
      el('span', { class: 'hfirst' }, talk.first ? `“${talk.first}”` : t('talk.firstLine')),
      el('small', {}, meta),
    ),
    going ? null : el('button', { class: 'ib hdel', title: t('talk.delete'), 'aria-label': t('talk.delete'), onclick: () => post({ type: 'talkDelete', id: talk.id }) }, lucide('x')),
  )
}

/** The talk going on, then the ones put away by day; Clear all at the foot. */
function drawHistory(v: TalkWindowView): void {
  const now = Date.now()
  const from = JSON.stringify(v.talks) + new Date(now).toDateString()
  if (from === historyFrom) return
  historyFrom = from
  const { current, past } = v.talks
  const nodes: HTMLElement[] = []
  if (current) nodes.push(el('h3', {}, t('talk.goingOn')), talkItem(current, 'today', true))
  let group = ''
  for (const talk of past) {
    const g = groupOf(talk.ended, now)
    if (g !== group) nodes.push(el('h3', {}, t(DAY_NAMES[(group = g)])))
    nodes.push(talkItem(talk, g, false))
  }
  if (!past.length) nodes.push(el('p', { class: 'hempty' }, t('talk.historyEmpty')))
  historyList.replaceChildren(...nodes)
  drawFoot()
}

function drawFoot(): void {
  const n = view?.talks.past.length ?? 0
  historyFoot.replaceChildren(...(n ? [el('button', { class: clearing ? 'hclear sure' : 'hclear', onclick: () => clearAll() }, clearing ? (n === 1 ? t('talk.sureOne') : t('talk.sureAll', { n })) : t('talk.clearAll'))] : []))
}

function clearAll(): void {
  if (clearing === undefined) {
    clearing = window.setTimeout(stopClearing, 4000)
    return drawFoot()
  }
  stopClearing()
  post({ type: 'talksClear' })
}

function stopClearing(): void {
  if (clearing === undefined) return
  window.clearTimeout(clearing)
  clearing = undefined
  drawFoot()
}

/** A talk of the history goes on in the window; the one going on now is put away. */
function goOn(id: string): void {
  if (phase !== 'idle') cancel()
  player.stop()
  hover.hide()
  heard = ''
  continuing = id
  post({ type: 'talkContinue', id })
  if (!wide.matches) showHistory(false)
}

// ---------------------------------------------------------------- what keeps Talk from working here

/** What stands in the way, said above the talk; `stop`: no talk at all, `deaf`: typing only. */
type Block = { stop: boolean; deaf: boolean; node: HTMLElement } | undefined

const settingsLink = () => el('button', { class: 'btn', onclick: () => post({ type: 'talkWindow', action: 'settings' }) }, t('common.openSettings'))
const noticeRow = (name: Parameters<typeof lucide>[0], text: string, note: string, control?: HTMLElement | null) =>
  el('div', { class: 'notice' }, lucide(name, 's'), el('div', { class: 'l' }, text, el('small', {}, note)), control ?? null)

/**
 * The model not downloaded (it checks and answers), a computer whose graphics
 * card cannot hold the model (an answer would take 15 s or more: no talk is
 * offered), the speech engine missing or starting (it hears the person; a
 * typed line still goes), or the duck slow here or just now.
 */
function blockOf(v: TalkWindowView): Block {
  if (v.needsCard)
    return { stop: true, deaf: true, node: noticeRow('cpu', t('talk.needsCard'), t('talk.needsCardNote')) }
  if (v.model.status !== 'ready') {
    const fetching = v.model.status === 'downloading'
    const note = fetching ? t('talk.downloading', { pct: Math.round(v.model.progress * 100) }) : v.model.status === 'failed' ? t('talk.downloadFailed') : t('talk.downloadIt')
    return { stop: true, deaf: true, node: noticeRow('download', t('talk.needsModel', { name: v.model.name, size: sizeText(v.model.size) }), note, fetching ? null : settingsLink()) }
  }
  if (v.engine === 'absent') return { stop: false, deaf: true, node: noticeRow('mic-off', t('talk.noEngine'), t('talk.noEngineNote'), settingsLink()) }
  if (v.engine === 'starting') return { stop: false, deaf: true, node: el('p', { class: 'aside' }, lucide('loader', 's turning'), el('span', {}, t('talk.engineStarting'))) }
  if (v.slow) return { stop: false, deaf: false, node: el('p', { class: 'aside amber' }, lucide('circle-alert', 's'), el('span', {}, t('talk.slow', { name: v.model.name, accurate: levelName('accurate') }))) }
  if (v.busy) return { stop: false, deaf: false, node: el('p', { class: 'aside amber' }, lucide('circle-alert', 's'), el('span', {}, t(v.busy === 'card' ? 'talk.busyCard' : 'talk.busyProcessor'))) }
  return undefined
}

let block: Block

// ---------------------------------------------------------------- drawing

/** Each turn's node and what it was drawn from: only a changed turn is drawn again. */
const drawn = new Map<number, { node: HTMLElement; from: string }>()

function turnNode(turn: TalkTurn): HTMLElement {
  if (turn.who === 'me') return myTurn(turn, () => void player.play(`me${turn.id}`, [el('span', {}, turn.corrected ?? turn.text)]))
  const node = duckTurn(turn, () => readDuck(node))
  return node
}

/** The empty talk: the duck and the topics to start on. */
function drawEmpty(): void {
  const stop = !!block?.stop
  empty.replaceChildren(
    tile(48),
    el('h2', {}, t('menu.talk')),
    el('p', {}, t('talk.intro')),
    el('div', { class: 'topics' }, ...TOPICS.map(topic => el('button', { class: 'chip topic', disabled: stop, onclick: () => post({ type: 'talkStart', topic: topic.id }) }, topicName(topic.id)))),
    el('small', {}, block?.deaf ? t('talk.orTypeHello') : t('talk.orSayHello')),
  )
}

/** The talk as the main process holds it: new and changed turns drawn, the others left as they are. */
function draw(v: TalkWindowView): void {
  const first = !view
  view = v
  const talk = v.talk
  // Opened on a talk kept from before, or one of the history taken up again: its lines are not read aloud again.
  const resumed = !!continuing && v.talks.current?.id === continuing
  if (first || resumed) lastRead = Math.max(0, ...talk.turns.filter(turn => turn.who === 'duck').map(turn => turn.id))
  if (resumed) continuing = ''
  block = blockOf(v)
  notice.replaceChildren(...(block ? [block.node] : []))
  root.classList.toggle('stopped', !!block?.stop)
  keyCaps.replaceChildren(...(v.talkKey ? [caps(v.talkKey)] : []))
  pinButton.replaceChildren(lucide('pin'))
  pinButton.setAttribute('aria-pressed', String(v.onTop))
  pinButton.title = v.onTop ? t('talk.unpin') : t('talk.pin')
  pinButton.setAttribute('aria-label', pinButton.title)
  maxButton.replaceChildren(glyph(v.maximized ? 'restore' : 'maximize'))
  maxButton.title = v.maximized ? t('common.restore') : t('common.maximize')
  maxButton.setAttribute('aria-label', maxButton.title)
  root.classList.toggle('maxed', v.maximized)
  modelChip.textContent = v.model.name
  modelChip.title = t('talk.modelTitle', { model: v.model.full })
  drawHistory(v)
  empty.hidden = talk.turns.length > 0
  if (!empty.hidden) drawEmpty()
  const seen = new Set<number>()
  let before: Element | null = null
  for (const turn of talk.turns) {
    seen.add(turn.id)
    const from = JSON.stringify(turn)
    let known = drawn.get(turn.id)
    // A line being read keeps its node until the reading is over.
    if (!known || (known.from !== from && !player.reads(known.node))) {
      const node = turnNode(turn)
      known?.node.replaceWith(node)
      known = { node, from }
      drawn.set(turn.id, known)
    }
    if (known.node.parentElement !== list || known.node.previousElementSibling !== before) {
      if (before) before.after(known.node)
      else list.prepend(known.node)
    }
    before = known.node
  }
  for (const [id, known] of drawn)
    if (!seen.has(id)) {
      // A new talk or one continued while the duck spoke: its old line goes quiet.
      if (player.reads(known.node)) player.stop()
      known.node.remove()
      drawn.delete(id)
    }
  // The line just sent stays where it was heard until the main process has it: the view after it.
  if (sent) (heard = ''), (sent = false)
  drawLive()
  typing.hidden = talk.status !== 'thinking'
  failed.hidden = talk.status !== 'failed'
  failed.replaceChildren(lucide('circle-alert', 's'), el('span', {}, t('talk.failed', { message: talk.message ?? t('talk.noAnswer') })))
  markRare([...list.querySelectorAll('.turn.duck .bubble')], common, v.rareWords)
  readNew(v)
  drawComposer()
  const last = talk.turns.at(-1)?.id ?? 0
  // Opened, a new talk or one taken up again: at the end; a new line while scrolled up shows the ↓.
  if (first || resumed || !talk.turns.length) follow(true)
  else if (last > lastSeen && !atEnd) toEnd.hidden = false
  lastSeen = last
}

/** The line being said, as heard so far. */
function drawLive(): void {
  const showing = phase === 'listening' || phase === 'starting' || phase === 'sending' || !!heard
  live.hidden = !showing
  if (!showing) return
  live.replaceChildren(el('div', { class: 'bubble' }, heard ? el('div', { class: 'said' }, heard) : el('div', { class: 'said waiting' }, phase === 'starting' ? t('talk.startingMic') : t('common.listening'))))
}

/** The newest answer of the duck, read aloud once it comes (Read the duck aloud). */
function readNew(v: TalkWindowView): void {
  const newest = [...v.talk.turns].reverse().find(turn => turn.who === 'duck')
  if (!newest || newest.id <= lastRead) return
  lastRead = newest.id
  if (!v.talkAloud || phase !== 'idle') return
  const node = drawn.get(newest.id)?.node
  if (node) readDuck(node)
}

function readDuck(node: HTMLElement): void {
  player.play(`duck${node.dataset.id}`, [...node.querySelectorAll<HTMLElement>('span.s')])
}

/** The round button and the line over the field: what a press does now. */
function drawComposer(): void {
  const v = view
  if (!v) return
  const stopped = !!block?.stop
  const deaf = !!block?.deaf
  const speaking = !!player.key?.startsWith('duck')
  const thinking = v.talk.status === 'thinking'
  micButton.disabled = deaf || phase === 'starting' || phase === 'sending'
  field.disabled = stopped
  field.placeholder = deaf ? t('talk.typeOnly') : t('talk.typePlaceholder')
  micButton.className = `mic ${phase === 'listening' ? 'listening' : phase === 'idle' ? 'idle' : 'busy'}`
  micButton.replaceChildren(phase === 'listening' ? lucide('send-horizontal') : phase === 'idle' ? lucide('mic') : lucide('loader', 'turning'))
  const label = phase === 'listening' ? t('talk.send') : t('talk.talk')
  micButton.title = label
  micButton.setAttribute('aria-label', label)
  const press = v.talkKey ? [caps(v.talkKey), el('span', {}, t('common.or')), caps('Space')] : [caps('Space')]
  if (stopped) status.replaceChildren(el('span', {}, t('talk.notPossible')))
  else if (deaf) status.replaceChildren(...(speaking ? [lucide('volume-2', 's'), el('span', {}, t('talk.speaking'))] : thinking ? [el('span', {}, t('talk.thinking'))] : [el('span', {}, t('talk.typingOnly'))]))
  else if (trouble) status.replaceChildren(el('span', { class: 'bad' }, trouble), el('span', {}, t('talk.pressAgain')))
  else if (phase === 'listening') status.replaceChildren(el('span', { class: 'rec' }), ...withKeys('talk.listeningPress', press), time, wave.canvas)
  else if (phase === 'starting') status.replaceChildren(el('span', {}, t('talk.startingMic')))
  else if (phase === 'sending') status.replaceChildren(el('span', {}, t('talk.finishing')))
  else if (speaking) status.replaceChildren(lucide('volume-2', 's'), ...withKeys('talk.speakingPress', press))
  else if (thinking) status.replaceChildren(...withKeys('talk.thinkingPress', press))
  else status.replaceChildren(...withKeys('talk.press', press))
  newButton.disabled = v.talk.turns.length === 0 && phase === 'idle'
}

/** A phrase with keycaps in its `{keys}` place ("Press {keys} to talk"): the words on either side as spans, the caps between. */
function withKeys(key: Key, keys: HTMLElement[]): HTMLElement[] {
  const [before = '', after = ''] = t(key, { keys: '\u0000' }).split('\u0000').map(part => part.trim())
  return [...(before ? [el('span', {}, before)] : []), ...keys, ...(after ? [el('span', {}, after)] : [])]
}

// ---------------------------------------------------------------- listening

/** The Talk key, Space or the button: listen, send what was heard, or stop the duck and listen. */
function toggle(): void {
  if (!view || block?.deaf) return
  if (phase === 'listening') return void send()
  if (phase === 'idle') void listen()
}

async function openSession(): Promise<string> {
  const r = (await window.tutorHost.call({ call: 'speech', method: 'POST', route: '/dictate/sessions', body: { expected: ['en'], strict: true } })) as SpeechResult<{ id: string }>
  if (!r.ok) throw new Error(r.error)
  return r.data.id
}

async function listen(): Promise<void> {
  player.stop()
  if (view?.talk.status === 'thinking') post({ type: 'talkInterrupt' })
  trouble = ''
  heard = ''
  phase = 'starting'
  hover.hide()
  // The model loads while the person speaks.
  post({ type: 'talkListen' })
  post({ type: 'micRecording', on: true })
  drawLive()
  drawComposer()
  follow(true)
  try {
    const id = await openSession()
    const r = new StreamRecorder(window.tutorHost.call, id, ['en'], s => {
      const text = s.heard.trim()
      if (!text || text === heard || recorder !== r) return
      heard = text
      drawLive()
    })
    recorder = r
    await r.start()
    if (recorder !== r) return
    phase = 'listening'
    wave.start()
    time.textContent = '0:00'
    clock = window.setInterval(() => {
      for (const level of r.levels()) wave.hear(level)
      const s = Math.floor(r.seconds)
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    }, 50)
  } catch (error) {
    trouble = micTrouble(error)
    void recorder?.cancel()
    recorder = undefined
    phase = 'idle'
    post({ type: 'micRecording', on: false })
  }
  drawLive()
  drawComposer()
}

/** Stops listening; the recorder, to finish or drop. */
function quiet(): StreamRecorder | undefined {
  window.clearInterval(clock)
  clock = undefined
  wave.stop()
  const r = recorder
  recorder = undefined
  post({ type: 'micRecording', on: false })
  return r
}

async function send(): Promise<void> {
  const r = quiet()
  if (!r) return
  phase = 'sending'
  drawComposer()
  try {
    const out = await r.finish()
    phase = 'idle'
    const text = out.text.trim()
    if (text) {
      heard = text
      say(text)
    } else {
      heard = ''
      trouble = t('talk.nothingHeard')
    }
  } catch (error) {
    phase = 'idle'
    heard = ''
    trouble = error instanceof Error ? error.message : String(error)
  }
  drawLive()
  drawComposer()
}

/** Esc while listening: the line is dropped, nothing goes to the duck. */
function cancel(): void {
  const r = quiet()
  phase = 'idle'
  heard = ''
  void r?.cancel()
  drawLive()
  drawComposer()
}

function say(text: string): void {
  player.stop()
  trouble = ''
  sent = true
  follow(true)
  post({ type: 'talkSay', text })
}

function newTalk(): void {
  if (phase !== 'idle') cancel()
  player.stop()
  hover.hide()
  heard = ''
  post({ type: 'talkClear' })
  if (!wide.matches) showHistory(false)
}

/** The window closed or minimized: the microphone and the voice stop; the talk stays. */
function hidden(): void {
  if (phase !== 'idle') cancel()
  player.stop()
  hover.hide()
}

window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
  const target = event.target instanceof Element ? event.target : document.body
  const typingHere = target.closest('input, textarea, select, [contenteditable]')
  if (event.key === ' ' && !typingHere && !target.closest('button')) {
    event.preventDefault()
    if (!event.repeat) toggle()
  } else if (event.key === 'Escape') {
    // The line being said goes first, then the list over the talk, then the duck's voice, then the word card.
    if (phase === 'listening' || phase === 'starting') (event.preventDefault(), cancel())
    else if (over && !wide.matches) (event.preventDefault(), showHistory(false))
    else if (player.key) (event.preventDefault(), player.stop())
    else hover.hide()
  }
})

// The voice and the word card answer the page that asked (main.ts).
window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  const m = event.data
  switch (m.type) {
    case 'talkView':
      return draw(m.view)
    case 'gloss':
      return hover.onGloss(m)
    case 'ipa':
      return hover.onIpa(m.word, m.ipa)
    case 'saved':
      return hover.onSaved(m.word, m.saved)
    case 'dictReady':
      return hover.forget()
    case 'common':
      common = new Set(m.words)
      if (view) markRare([...list.querySelectorAll('.turn.duck .bubble')], common, view.rareWords)
      return
    case 'hostVoices':
      hostVoices = m.voices
      hostCanSpeak = m.canSpeak
      return
    case 'progress':
      return player.onHostProgress(m.id, m.pos, m.len)
    case 'speakDone':
      return player.onHostDone(m.id)
    case 'stop':
      return player.stop()
    case 'naturalAudio':
      return player.onNaturalAudio(m.id, m.index, m.samples, m.words)
    case 'naturalFailed':
      return player.onNaturalFailed(m.id, m.message)
    case 'talk':
      return m.command === 'hidden' ? hidden() : toggle()
  }
})

if ('speechSynthesis' in window) {
  const refresh = () => (webVoices = window.speechSynthesis.getVoices())
  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
}

placeHistory()
post({ type: 'talkReady' })
