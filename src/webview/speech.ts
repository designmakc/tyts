// What the speech pages share: the engine's HTTP API as the window sees it
// (its library's rows and transcripts, its own settings), short messages at
// the bottom of the window, and the two things a page offers before its
// feature can work: the engine's parts to download, and the Hugging Face key
// that lets speakers be told apart.

import { cardText, mainCard, nvidiaCard, shortCpu } from '../hardware'
import { levelName, sizeText, t, type Key } from '../i18n'
import type { AppView, Choice, Feature, SpeechHealth, SpeechPart, SpeechResult } from '../protocol'
import type { SummaryTemplate } from '../summary'
import { estimateText, minutes, MODELS, seconds, type Basis } from '../speechplan'
import { el, icon } from './dom'
import { aside, bad, bar, btn, card, chip, grp, ib, link, linkBtn, post, radioRow, recommended, row, seg, toggleKnob } from './ui'

export type Source = 'file' | 'mic' | 'meet' | 'system' | 'note'
export type Stage = '' | 'decode' | 'words' | 'speakers' | 'save'

/** A line of the engine's library (store.py LIST_COLUMNS), with the found words when searched. */
export type Row = {
  id: string
  title: string
  source: Source
  created: string
  duration: number
  status: 'recording' | 'queued' | 'working' | 'done' | 'failed'
  stage: Stage
  progress: number
  error: string
  language: string
  speakers_status: string
  /** 1 when the transcript has a summary. */
  summarized?: number
  /** The call program's name, when the engine gives it with the row. */
  app?: string
  snippet?: string
}

import type { Shot } from '../shots'

export type Utterance = { speaker: string; start: number; end: number; text: string; edited?: boolean }

export type Transcript = {
  id: string
  title: string
  source: Source
  created: string
  duration: number
  language: string
  speakers: Record<string, { name: string }>
  utterances: Utterance[]
  speakersStatus: 'ok' | 'single' | 'no-part' | 'needs-token' | 'failed'
  note?: string
  noteError?: string
  /** The words' times are kept: speakers can be split later without recognizing the text again. */
  hasWords?: boolean
  edited?: string
  /** The call program recorded (Zoom…), pieces of the recording that never reached the engine. */
  app?: string
  lost?: number
  summary?: SummaryRecord
  /** A call's screenshots (shots.ts): the transcript shows the person's and the key ones. */
  shots?: Shot[]
  /** Names read off the call's screen (callNames), by speaker: offered until applied or dismissed. */
  speakerHints?: Record<string, string>
}

/** A summary as the engine keeps it (PUT /transcripts/{id}/summary): Markdown with `[mm:ss]` topics. */
export type SummaryRecord = { text: string; template: SummaryTemplate; mine: boolean; language: string | null; made: string; edited?: string }

/** The engine's own settings (engine/settings.py); the key itself never comes back, only whether there is one. */
export type EngineSettings = {
  model: string
  language: string
  hotwords: string
  /** The words to spell as the engine holds them: Kryakl's `vocabulary` setting, sent with the plan. */
  vocabulary: { word: string; heard: string[] }[]
  hasToken: boolean
  dataDir: string
  kbDir: string
  kbInbox: string
  /** The calls folder (engine/calls.py); empty: none. */
}

export type Diarization = SpeechHealth['diarization']

export class SpeechError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/** One call to the engine; its refusal is thrown with the engine's own words. */
export async function api<T>(method: string, route: string, body?: unknown): Promise<T> {
  const r = (await window.tutorHost.call({ call: 'speech', method, route, body })) as SpeechResult<T>
  if (!r.ok) throw new SpeechError(r.error, r.status)
  return r.data
}

export const problem = (error: unknown) => (error instanceof Error ? error.message : String(error))
export const fileName = (path: string) => path.split(/[\\/]/).pop() ?? path

// ---------------------------------------------------------------- the redraw

let redraw = () => {}
/** The window's way to draw the open page again, after something here changed. */
export function onRedraw(fn: () => void): void {
  redraw = fn
}
export const redrawPage = () => redraw()

// ---------------------------------------------------------------- times

/** 0:07, 12:40, 1:02:13. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Minutes an hour of sound takes here with the model chosen for transcripts, speakers included when their part is here. */
export function minutesPerHour(v: AppView): number {
  return Math.max(1, Math.round(v.speech.plan.transcripts.chosen.estimate))
}

/** 40 s, 12 min, 1 h 4 min. */
export function length(seconds: number): string {
  if (seconds < 60) return t('speech.sec', { n: Math.round(seconds) })
  const minutes = Math.round(seconds / 60)
  return minutes >= 60 ? t('speech.hMin', { h: Math.floor(minutes / 60), m: minutes % 60 }) : t('speech.min', { n: minutes })
}

/** 0.4 s, 2.1 s, 12 s; 12 min, 1 h 10 min: speechplan.ts's, in the interface's language. */
export { minutes as minutesText, seconds as secondsText }

const BASIS_KEYS: Record<Basis, Key> = { measured: 'speech.basisMeasured', scaled: 'speech.basisScaled', guess: 'speech.basisGuess' }

/** engine/models.json's `about` of each model, in the interface's language. */
const ABOUT: Record<string, Key> = {
  tiny: 'speech.aboutTiny',
  base: 'speech.aboutBase',
  small: 'speech.aboutSmall',
  'large-v3-turbo': 'speech.aboutTurbo',
  'large-v3': 'speech.aboutLarge',
  'parakeet-tdt-0.6b-v3': 'speech.aboutParakeet',
}
export const aboutOf = (c: Choice) => (ABOUT[c.model] ? t(ABOUT[c.model] as Key) : c.about)

/** speechplan.ts's reasons a model cannot run here, in the interface's language. */
const WHY: Record<string, Key> = {
  'too big for this graphics card': 'speech.whyTooBig',
  'needs more memory than this computer has': 'speech.whyMemory',
  'not for your language': 'speech.whyLanguage',
  'not for every language you use': 'speech.whyLanguages',
}
const whyOf = (c: Choice) => (WHY[c.why] ? t(WHY[c.why] as Key) : c.why)

/**
 * Splits a phrase at its `{name}` places and puts the nodes given there:
 * "Open {page} and…" with a link for `page`.
 */
export function phrase(text: string, nodes: Record<string, Node | string>): (Node | string)[] {
  return text
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map(part => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1]
      return name && name in nodes ? (nodes[name] as Node | string) : part
    })
}

// ---------------------------------------------------------------- messages

const toasts = el('div', { class: 'toasts', role: 'status' })
document.body.append(toasts)

/** A short message at the bottom of the window, with one thing to do about it at most. */
export function toast(text: string, action?: { label: string; run: () => void }, fault = false): void {
  const node = el(
    'div',
    { class: fault ? 'toast bad' : 'toast' },
    el('span', {}, text),
    action ? el('button', { class: 'link', onclick: () => (action.run(), node.remove()) }, action.label) : null,
  )
  toasts.append(node)
  window.setTimeout(() => node.remove(), action ? 7000 : 3500)
}

export const fault = (error: unknown) => toast(problem(error), undefined, true)
export const showFile = (path: string) => ({ label: t('speech.show'), run: () => post({ type: 'showInFolder', path }) })

// ---------------------------------------------------------------- the engine's settings

let engine: EngineSettings | undefined
let asking = false

/** The engine's settings, once it runs; asked for once and kept, then followed by each change made here. */
export function engineSettings(v: AppView): EngineSettings | undefined {
  if (v.speech.service !== 'ready') return undefined
  if (!engine && !asking) {
    asking = true
    api<EngineSettings>('GET', '/settings').then(
      s => {
        engine = s
        asking = false
        redraw()
      },
      () => (asking = false),
    )
  }
  return engine
}

/** The engine went away (removed, restarted): its settings are asked for again. */
export function forgetEngine(): void {
  engine = undefined
}

export async function saveEngine(changes: Partial<EngineSettings> & { hfToken?: string }): Promise<boolean> {
  try {
    engine = await api<EngineSettings>('PUT', '/settings', changes)
    redraw()
    return true
  } catch (error) {
    fault(error)
    return false
  }
}

/** The knowledge base: a folder of .md files (an Obsidian vault will do). */
export async function pickKb(): Promise<void> {
  const folder = (await window.tutorHost.call({ call: 'pickFolder', title: t('speech.kbFolder'), current: engine?.kbDir ?? '' })) as string | null
  if (folder && (await saveEngine({ kbDir: folder }))) toast(t('speech.kbSet', { folder }))
}

// ---------------------------------------------------------------- the parts

export const installed = (v: AppView) => v.speech.pack.parts.includes('core')
export const hasPart = (v: AppView, part: SpeechPart) => v.speech.pack.parts.includes(part)
/** The engine is here and answering. */
export const running = (v: AppView) => installed(v) && v.speech.service === 'ready'

/** The graphics card's part comes with the first download unless the person turns it off. */
let withGpu = true

/** A part being installed or removed now: its line with the bar, or undefined. */
export function packWork(v: AppView): HTMLElement | undefined {
  const p = v.speech.pack
  if (p.status === 'removing') return row(t('speech.removing'), [], null)
  if (p.status !== 'installing') return undefined
  // A part taken out (Storage's ×): the same sync, with fewer parts.
  if (p.installing && p.installing.length < p.parts.length) return row(t('speech.removingPart'), [t('speech.backSoon'), bar(p.progress ?? 0)], el('span', { class: 'pct' }, `${Math.round((p.progress ?? 0) * 100)}%`))
  const what = p.step === 'tool' ? t('speech.stepTool') : t('speech.stepPackages')
  const pct = Math.round((p.progress ?? 0) * 100)
  const parts = (p.installing ?? []).filter(x => !p.parts.includes(x))
  const name = parts.includes('speakers') && p.parts.includes('core') ? t('speech.dlSpeakers') : t('speech.dlEngine')
  return row(name, [what, bar(p.progress ?? 0)], el('span', { class: 'pct' }, `${pct}%`))
}

/**
 * What the speech engine needs before `feature` works: its download (with
 * the graphics card's part when there is an NVIDIA card), the download going
 * on, why it failed, or the service starting. Nothing once it runs.
 */
export function engineRows(v: AppView, feature: string): HTMLElement[] {
  const s = v.speech
  const work = packWork(v)
  if (work && !installed(v)) return [work]
  if (!installed(v)) {
    const gpu = s.pack.nvidia && withGpu
    const mb = s.download.core + (gpu ? s.download.gpu : 0)
    const first = gpu ? s.firstModel.cuda : s.firstModel.cpu
    // On the disk: the parts and the first model; while installing, the download's cache too.
    const keeps = s.installed.core + (gpu ? s.installed.gpu : 0) + first.mb
    const needs = Math.round((keeps + mb) * 1.1)
    const short = s.disk.freeMb > 0 && s.disk.freeMb < needs
    const go = () => post({ type: 'installSpeech', parts: gpu ? ['core', 'gpu'] : ['core'] })
    const failed = s.pack.status === 'failed'
    const card = nvidiaCard(s.device)
    const download = btn(failed ? t('common.tryAgain') : t('speech.download'), go, 'primary')
    download.disabled = short
    return [
      row(
        needsEngine(feature),
        [
          failed
            ? bad(t('speech.dlStopped', { why: s.pack.message ?? t('speech.unknownError') }))
            : t('speech.dlOffer', { size: size(mb), disk: size(keeps), model: first.model }),
          short
            ? bad(t('speech.needsFree', { need: size(needs), drive: s.disk.drive, free: size(s.disk.freeMb) }))
            : s.disk.freeMb > 0
              ? t('speech.freeOn', { free: size(s.disk.freeMb), drive: s.disk.drive })
              : null,
        ],
        download,
      ),
      s.pack.nvidia
        ? row(
            t('speech.useGpu'),
            [t('speech.gpuMore', { size: size(s.download.gpu), gpu: seconds(s.firstModel.cuda.phrase), cpu: seconds(s.firstModel.cpu.phrase), card: card ? cardText(card) : 'NVIDIA' })],
            toggleKnob(withGpu, on => ((withGpu = on), redraw()), t('speech.useGpu')),
          )
        : null,
    ].filter((n): n is HTMLElement => n !== null)
  }
  if (work) return [work]
  if (s.service === 'starting' || s.service === 'off') return [row(t('speech.starting'), [], null)]
  if (s.service === 'down') return [row(t('speech.notRunning'), [bad(s.trouble ?? t('speech.itStopped'))], linkBtn(t('speech.restart'), () => post({ type: 'restartSpeech' })))]
  return []
}

/** "Dictate needs the speech engine": the pages name the feature by its English id (Dictate, Transcribe). */
function needsEngine(feature: string): string {
  if (feature === 'Dictate') return t('speech.needsDictate')
  if (feature === 'Transcribe') return t('speech.needsTranscribe')
  return t('speech.needs', { feature })
}

/** 480 MB, 1.6 GB. */
export const size = sizeText

const where = (c: Choice) => (c.device === 'cuda' ? t('speech.onCard') : c.device === 'metal' ? t('speech.onMetal') : t('speech.onProcessor'))

/** The model a feature uses now, as the engine has it: downloading shows how far. */
function liveModel(v: AppView, feature: Feature): SpeechHealth['models']['dictation'] | undefined {
  return v.speech.health?.models[feature === 'dictation' ? 'dictation' : 'transcripts']
}

const FEATURES: Feature[] = ['dictation', 'transcripts']
const pin = (feature: Feature, model: string) => post({ type: 'saveSettings', patch: { [feature === 'dictation' ? 'dictationModel' : 'transcriptsModel']: model } })

/**
 * One action's speech model (Models › Dictate, Models › Transcribe): Automatic
 * first, the most accurate model quick enough here (speechplan.ts: on the card
 * dictation shares the transcripts' model; on the processor it needs one that
 * answers in a second), then each model the action can run, with its time here,
 * its size, and whether the other action uses it too, so one model serves both
 * where that costs nothing. A pick downloads it when it is not here. A model on
 * the disk that nothing uses can go; one kept for the processor says so.
 */
export function speechChoiceRows(v: AppView, feature: Feature): HTMLElement[] {
  const plan = v.speech.plan
  const p = plan[feature]
  const other: Feature = feature === 'dictation' ? 'transcripts' : 'dictation'
  // The other device's plan: what runs when the card refuses a model.
  const spare = plan.device === 'cuda' ? plan.engine.cpu : undefined
  const budget = feature === 'dictation' ? t('speech.budgetPhrase', { time: seconds(p.budget) }) : t('speech.budgetHour', { time: minutes(p.budget) })
  const live = (name: string) => [liveModel(v, 'dictation'), liveModel(v, 'transcripts')].find(m => m?.name === name && m.state === 'downloading')
  const out: HTMLElement[] = [
    radioRow(
      el('span', {}, t('speech.automatic'), recommended()),
      [
        t('speech.autoNote', { budget }),
        p.pinned ? null : t('speech.usesNow', { model: p.chosen.label }),
        // Dictation leaves the card to the person's programs (speechplan.ts forDevice).
        feature === 'dictation' && plan.device === 'cuda' && (p.chosen.device === 'cpu' || p.better?.device === 'cpu')
          ? p.chosen.device === 'cpu'
            ? t('speech.autoCpu')
            : t('speech.autoMoves', { model: p.better?.label ?? '' })
          : null,
      ],
      !p.pinned,
      () => pin(feature, ''),
    ),
  ]
  for (const c of p.choices) {
    const on = p.pinned && p.chosen.model === c.model
    const here = p.chosen.model === c.model
    const shared = plan[other].chosen.model === c.model
    const backup = spare && !here && !shared ? FEATURES.filter(f => spare[f]?.model === c.model) : []
    const loading = live(c.model)
    const notes: (string | HTMLElement | null)[] = c.why
      ? [`${aboutOf(c)} · ${whyOf(c)}`]
      : [
          [estimateText(feature, c), where(c), t(BASIS_KEYS[c.basis]), on && !c.fits ? t('speech.slower') : null].filter(Boolean).join(' · '),
          `${aboutOf(c)} · ${c.downloaded ? t('speech.sizeHere', { size: size(c.mb) }) : t('speech.sizePick', { size: size(c.mb) })}`,
          here && !p.pinned ? t('speech.autoUses') : null,
          shared ? t(other === 'dictation' ? 'speech.sharedDictate' : 'speech.sharedTranscribe') : null,
          loading ? bar(loading.progress ?? 0) : null,
        ]
    if (!here && !shared && c.downloaded)
      notes.push(
        backup.length
          ? t(backup.length > 1 ? 'speech.keptBoth' : backup[0] === 'dictation' ? 'speech.keptDictate' : 'speech.keptTranscribe')
          : t('speech.notUsedNow'),
      )
    const pick = c.why
      ? undefined
      : () => {
          if (!c.downloaded) post({ type: 'downloadSpeechModel', model: c.model })
          pin(feature, c.model)
        }
    // The engine keeps a model it plans or holds: one nothing plans can go.
    const remove = c.downloaded && !here && !shared && !backup.length && !loading ? ib('x', t('speech.removeModel', { model: c.label, size: size(c.mb) }),() => post({ type: 'removeStored', id: 'speechModel', item: c.model })) : null
    const node = radioRow(c.label, notes, on, pick, loading ? el('span', { class: 'pct' }, `${Math.round((loading.progress ?? 0) * 100)}%`) : null, remove)
    if (c.why) node.classList.add('dim')
    out.push(node)
  }
  return out
}

/** What Automatic leans to: accuracy or speed. */
export function preferRow(v: AppView): HTMLElement {
  return row(
    t('speech.prefers'),
    [v.settings.speechPrefer === 'speed' ? t('speech.preferSpeedNote') : t('speech.preferAccNote')],
    seg(
      v.settings.speechPrefer,
      [
        ['accuracy', t('speech.accuracy')],
        ['speed', t('speech.speed')],
      ],
      speechPrefer => post({ type: 'saveSettings', patch: { speechPrefer } }),
    ),
  )
}

/** The graphics card's part, on the speech models' pages, when there is an NVIDIA card that can take it. */
export function gpuRow(v: AppView): HTMLElement | null {
  const p = v.speech.pack
  if (!p.nvidia || !installed(v)) return null
  if (hasPart(v, 'gpu')) return row(t('speech.gpuTitle'), [el('small', { class: 'ok' }, t('speech.installed')), cardNote(v)])
  return row(
    t('speech.gpuTitle'),
    [t('speech.gpuOffer', { size: size(v.speech.download.gpu) }), cardNote(v)],
    Object.assign(btn(t('speech.add'),() => post({ type: 'installSpeech', parts: ['gpu'] })), { disabled: p.status !== 'ready' }),
  )
}

/** The speed test going on: which model, how far. */
function testWork(v: AppView): HTMLElement | null {
  const c = v.speech.health?.calibration
  if (!c || (c.state !== 'running' && c.state !== 'waiting')) return null
  const share = c.total ? c.done / c.total : 0
  const what = c.state === 'waiting' ? t('speech.testWaits') : t('speech.testStep', { model: c.current || t('speech.testStarting'), n: Math.min(c.total, c.done + 1), total: c.total })
  return row(t('speech.testing'), [what, bar(share)], el('span', { class: 'pct' }, `${Math.round(share * 100)}%`))
}

/**
 * The offer of the speed test, once there is something to measure and the
 * person has not answered it: each downloaded model runs once on a short clip,
 * then the models are chosen from what this computer really does.
 */
export function testOffer(v: AppView): HTMLElement | null {
  const work = testWork(v)
  if (work) return work
  const test = v.speech.test
  if (!test.offer) return null
  return el(
    'div',
    { class: 'offer' },
    icon('dashboard'),
    el(
      'div',
      { class: 'ot' },
      el('b', {}, t('speech.testAsk')),
      el('small', {}, test.runs > 1 ? t('speech.testNoteMany') : t('speech.testNoteOne')),
      el('span', { class: 'acts' }, btn(t('speech.testRun'), () => post({ type: 'testSpeech' }), 'primary'), linkBtn(t('common.notNow'),() => post({ type: 'declineSpeechTest' }))),
    ),
  )
}

/** Settings: this computer, the test, and accuracy or speed. */
export function computerRows(v: AppView): HTMLElement[] {
  const d = v.speech.device
  const card = mainCard(d)
  const cpu = [shortCpu(d.cpu.name), t('speech.cores', { n: d.cpu.cores }), t('size.gb', { n: d.ramGb }), d.laptop ? t('speech.laptop') : null].filter(Boolean).join(' · ')
  // A card speech cannot use says so (a Mac's graphics: Whisper turbo on Metal, else the processor).
  const cards = card ? (card.vendor === 'nvidia' ? cardText(card) : cardNote(v)) : d.at ? t('speech.noCard') : t('speech.lookingCard')
  const plan = v.speech.plan
  const tested = plan.measured ? t('speech.measured') : running(v) ? t('speech.guesses') : t('speech.testedLater')
  const work = testWork(v)
  return [
    row(
      cpu,
      [cards, tested],
      running(v) && !work ? linkBtn(v.speech.test.agreed && plan.measured ? t('speech.testAgain') : t('speech.test'), () => post({ type: 'testSpeech' }), v.speech.test.runs === 0 && !plan.dictation.choices.some(c => c.downloaded)) : null,
    ),
    ...(work ? [work] : []),
    row(t('speech.rightNow'), [heldNow(v)]),
  ]
}

/**
 * What Kryakl holds right now, said plainly (resources.ts: Kryakl is a guest on
 * the computer): each model in memory and where, the graphics card's first;
 * a model leaves it after three idle minutes.
 */
export function heldNow(v: AppView): string {
  const card: string[] = []
  const processor: string[] = []
  const l = v.llmLoaded
  if (l) {
    const mb = v.modelSpeed[l.model]?.card
    ;(l.onCard ? card : processor).push(`${levelName(l.model)}${l.onCard && mb ? ` (${size(mb)})` : ''}`)
  }
  for (const m of v.speech.health?.loaded ?? []) {
    const name = m.model === 'speakers' ? t('speech.whoSpoke') : (MODELS.find(c => c.name === m.model)?.label ?? m.model)
    ;(m.device === 'cuda' || m.device === 'metal' ? card : processor).push(name)
  }
  if (!card.length && !processor.length) return t('speech.nothingLoaded')
  return [
    card.length ? t('speech.heldCard', { list: card.join(', ') }) : t('speech.nothingCard'),
    processor.length ? t('speech.heldCpu', { list: processor.join(', ') }) : null,
    card.length ? t('speech.letGo') : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** What the graphics card does for speech, said plainly. */
export function cardNote(v: AppView): string {
  const s = v.speech
  const card = mainCard(s.device)
  const gpuPart = hasPart(v, 'gpu')
  // A Mac's graphics runs Whisper turbo through MLX: not the processor, though no NVIDIA card.
  if (s.plan.transcripts.chosen.device === 'metal' || s.plan.dictation.chosen.device === 'metal') return t('speech.cardMetal', { name: card ? cardText(card) : 'Apple' })
  if (!card) return s.device.at ? t('speech.cardNone') : t('speech.looking')
  const name = cardText(card)
  if (card.vendor !== 'nvidia') return t('speech.cardNotNvidia', { name })
  if (!s.pack.nvidia && !gpuPart) return t('speech.cardTooSmall', { name })
  if (!gpuPart) return t('speech.cardAddPart', { name })
  if (s.health?.fallback) return t('speech.cardFallback', { name })
  if (s.plan.device === 'cpu') return t('speech.cardCpuPlan', { name })
  return t('speech.cardOn', { name })
}

// ---------------------------------------------------------------- speakers

const HF = {
  join: 'https://huggingface.co/join',
  model: 'https://huggingface.co/pyannote/speaker-diarization-community-1',
  tokens: 'https://huggingface.co/settings/tokens',
}

/** The speakers' model as the page says it: how it looks, and the words. */
const DIARIZATION: Record<Diarization, ['' | 'busy' | 'bad' | 'ok', string]> = {
  'needs-token': ['', t('speech.dzNeedsToken')],
  checking: ['busy', t('speech.dzChecking')],
  downloading: ['busy', t('speech.dzDownloading')],
  'bad-token': ['bad', t('speech.dzBadToken')],
  'no-access': ['bad', t('speech.dzNoAccess')],
  failed: ['bad', t('speech.dzFailed')],
  missing: ['', t('speech.dzMissing')],
  ready: ['ok', t('speech.dzReady')],
}

/** "Replace key" was tapped: the field and the steps come back. */
let replacing = false
/** The key as typed so far: a redraw (the engine's state moving on) keeps it in the field. */
let draft = ''
/** What was asked of the engine a moment ago, shown until its own state follows (within two seconds). */
let expected: { state: Diarization; until: number } | undefined

export function diarizationOf(v: AppView): Diarization {
  const real = v.speech.health?.diarization ?? 'needs-token'
  if (expected && Date.now() < expected.until && (real === 'needs-token' || real === 'missing' || real === 'bad-token' || real === 'no-access' || real === 'failed')) return expected.state
  expected = undefined
  return real
}

const follow = (state: Diarization) => {
  expected = { state, until: Date.now() + 3000 }
  redraw()
}

/**
 * Who spoke when: the speakers part to download, then the Hugging Face key
 * with its live state (checking, downloading, a bad key, no access to the
 * model, ready) and the four steps to get one.
 */
export function speakerRows(v: AppView): HTMLElement[] {
  const s = v.speech
  const out: HTMLElement[] = [...speakersDeviceRows(v), ...speakersInstallRows(v)]
  if (!hasPart(v, 'speakers')) return out
  if (!running(v)) return [...out, card('lock', t('speech.voicesModel'), [t('speech.voicesLater')], null)]
  return [...out, grp(t('speech.voicesModel')), ...keyRows(v)]
}

export const DEVICE_NAMES = { cuda: 'graphics card', cpu: 'processor' } as const

/** Where who spoke when runs, as the person may choose it: the card (when it has room) or the processor, each with its size and its time here. */
function speakersDeviceRows(v: AppView): HTMLElement[] {
  const s = v.speech
  const plan = s.plan.speakers
  const pick = (on: 'cuda' | 'cpu') => post({ type: 'saveSettings', patch: { speakersDevice: on === plan.advised ? 'auto' : on } })
  const option = (on: 'cuda' | 'cpu') => {
    const sz = s.speakers.sizes[on]
    const time = plan[on]
    const chosen = s.speakers.on === on
    const node = card(
      on === 'cuda' ? 'monitor' : 'cpu',
      on === 'cuda' ? t('speech.card') : t('speech.processor'),
      [
        time === undefined ? null : [t('speech.voicesHour', { time: minutes(time) }), plan.advised === on ? t('speech.advised') : null].filter(Boolean).join(' · '),
        t(on === 'cuda' ? 'speech.torchCard' : 'speech.torchCpu', { download: size(sz.download), disk: size(sz.installed) }),
      ],
      chosen ? chip(t('speech.chosen'), 'lit') : linkBtn(t('speech.use'), () => pick(on)),
    )
    if (chosen) node.classList.add('picked')
    return node
  }
  const rows: HTMLElement[] = [aside('info', t('speech.speakersInfo')), grp(t('speech.runsOn'))]
  if (s.plan.offers.speakersGpu && plan.cuda !== undefined) rows.push(option('cuda'))
  rows.push(option('cpu'))
  return rows
}

/** The part as it stands: to download for the chosen place, to switch to it, being installed, or installed. */
function speakersInstallRows(v: AppView): HTMLElement[] {
  const s = v.speech
  const work = packWork(v)
  if (work) return [work]
  const on = s.speakers.on
  const sz = s.speakers.sizes[on]
  const parts: SpeechPart[] = on === 'cuda' && !hasPart(v, 'gpu') ? ['gpu', 'speakers'] : ['speakers']
  const install = (label: string) => btn(label, () => post({ type: 'installSpeech', parts }), 'primary')
  const model = s.speakers.model ? t('speech.voicesHere') : t('speech.voicesKey')
  const room = s.disk.freeMb > 0 && s.disk.freeMb < sz.installed * 1.1 ? bad(t('speech.needsFreeAbout', { need: size(sz.installed * 1.1), drive: s.disk.drive, free: size(s.disk.freeMb) })) : null
  const onCard = on === 'cuda'
  if (!hasPart(v, 'speakers')) {
    const failed = s.pack.status === 'failed'
    return [
      grp(t('speech.downloadGrp')),
      card(
        'download',
        t(onCard ? 'speech.whoOnCard' : 'speech.whoOnCpu'),
        [t('speech.dlOnce', { size: size(sz.download), model }), failed ? bad(t('speech.dlStopped', { why: s.pack.message ?? t('speech.unknownError') })) : room],
        install(failed ? t('common.tryAgain') : t('speech.download')),
      ),
    ]
  }
  const there = s.pack.speakersOn ?? 'cpu'
  if (there !== on) {
    return [grp(t('speech.installed')), card('rotate-cw', t(there === 'cuda' ? 'speech.nowCard' : 'speech.nowCpu'), [t(onCard ? 'speech.switchCard' : 'speech.switchCpu', { size: size(sz.download) }), room], install(t('speech.switch')))]
  }
  return [
    grp(t('speech.installed')),
    card('circle-check', t(onCard ? 'speech.installedCard' : 'speech.installedCpu'), [el('small', { class: 'ok' }, t('speech.voicesHour', { time: minutes(s.plan.speakers[on] ?? s.plan.speakers.cpu) }))], null),
  ]
}

/** The Hugging Face key with its live state, and the four steps to get one while it is needed. */
function keyRows(v: AppView): HTMLElement[] {
  const s = v.speech
  const state = diarizationOf(v)
  const [kind, words] = DIARIZATION[state]
  const message = state === 'failed' && s.health?.diarizationMessage ? `${words}: ${s.health.diarizationMessage}` : words
  const note = el('small', { class: kind ? `kstate ${kind}` : 'kstate' }, kind === 'busy' ? el('i', { class: 'spin' }) : kind === 'ok' ? icon('check') : null, message)
  const again = (label: string) =>
    linkBtn(label, async () => {
      try {
        await api('POST', '/diarization/setup')
        follow('checking')
      } catch (error) {
        fault(error)
      }
    })
  const field = el('input', {
    type: 'password',
    class: 'field wide',
    placeholder: 'hf_…',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': t('speech.hfKey'),
    oninput: (event: Event) => (draft = (event.target as HTMLInputElement).value),
  })
  field.value = draft
  const saveKey = async () => {
    const value = field.value.trim()
    if (!value) return field.focus()
    field.blur()
    draft = ''
    replacing = false
    if (await saveEngine({ hfToken: value })) follow('checking')
  }
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter') void saveKey()
    if (event.key === 'Escape' && replacing) (event.preventDefault(), (replacing = false), field.blur(), redraw())
  })
  const entry = el('span', { class: 'kchg' }, field, btn(t('speech.save'), () => void saveKey(), 'primary'))
  const settled = state === 'ready' || state === 'missing'
  const control =
    settled && !replacing
      ? linkBtn(t('speech.replaceKey'), () => {
          replacing = true
          redraw()
        })
      : state === 'no-access'
        ? again(t('speech.checkAgain'))
        : state === 'failed'
          ? again(t('common.tryAgain'))
          : null
  // Once the model is on the disk the key has done its work: nothing to replace.
  if (state === 'ready' && !replacing) return [row(t('speech.voicesModel'), [note], null)]
  const out = [row(t('speech.hfKey'), [note], control)]
  const typing = (!settled && state !== 'checking' && state !== 'downloading') || replacing
  if (typing) {
    out.push(
      el(
        'ol',
        { class: 'steps' },
        el('li', {}, link(HF.join, t('speech.step1')), t('speech.step1Rest')),
        // Hugging Face's own words (its form's fields, Access Tokens, Read) stay as its site writes them.
        el('li', {}, ...phrase(t('speech.step2'), { page: link(HF.model, t('speech.step2Page')), use: el('b', {}, 'Meeting note taker') })),
        el('li', {}, ...phrase(t('speech.step3'), { tokens: link(HF.tokens, 'Access Tokens'), read: el('b', {}, 'Read') })),
        el('li', {}, t('speech.step4'), el('span', { class: 'kline' }, entry)),
      ),
    )
  }
  return out
}

/** A line under a page saying, calmly, what speakers still need, with the way there. */
export function speakersMissing(v: AppView, go: () => void): HTMLElement | null {
  if (!installed(v)) return null
  const state = v.speech.health?.diarization
  if (hasPart(v, 'speakers') && state !== 'needs-token' && state !== 'bad-token' && state !== 'no-access' && state !== 'failed') return null
  const why = !hasPart(v, 'speakers') ? t('speech.missingPart') : t('speech.missingKey')
  return aside('users', why, ' ', linkBtn(t('speech.setUp'), go))
}
