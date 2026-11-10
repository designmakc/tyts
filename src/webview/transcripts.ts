// Transcribe and Transcripts: a new transcription (a file dropped anywhere in
// the window or picked, or the microphone), the library of every transcript
// (searched by its words), and one transcript: its progress while the engine
// works, then who said what, editable, with the sound under it, export, copy,
// the knowledge base. The library and an unfinished transcript follow the
// engine's work by asking it again every moment and a half; the bar moves in
// place, so its light keeps running.

import { formatDate, languageName, levelName, t } from '../i18n'
import type { Answer } from '../ask'
import { CITE, cited } from '../ask'
import { liveAnswer, liveRows, type LiveState } from '../calllive'
import type { AppView } from '../protocol'
import { NOTES_MAX, SUMMARY_OWN_MAX, SUMMARY_TEMPLATES_MAX, TEMPLATE_NAME_MAX } from '../settings'
import type { SummaryTemplate } from '../summary'
import { shownShots } from '../shots'
import { secondsLeft, shotIn, topicIn } from '../summaryflow'
import { el, icon } from './dom'
import { caps } from './keycaps'
import { ChunkRecorder, micTrouble } from './recorder'
import {
  api,
  clock,
  fault,
  fileName,
  installed,
  length,
  minutesPerHour,
  minutesText,
  phrase,
  pickKb,
  problem,
  redrawPage,
  running,
  showFile,
  SpeechError,
  size as speechSize,
  speakersMissing,
  toast,
  type Row,
  type Source,
  type Transcript,
  type Utterance,
} from './speech'
import { aside, bar, btn, card, linkBtn, post, row, seg, select, toggleKnob } from './ui'

type Hooks = {
  view: () => AppView | undefined
  /** The Transcripts page is the one open. */
  shown: () => boolean
  /** Opens the Transcripts page (on a transcript, when it is set). */
  show: () => void
  /** Opens the Transcribe page (the engine and the speakers are set up there). */
  setup: () => void
  /** The list stays beside an open transcript (the calls window): it follows the engine too. */
  beside?: boolean
}

let hooks: Hooks = { view: () => undefined, shown: () => false, show: () => {}, setup: () => {} }
export const setTranscriptHooks = (h: Hooks) => (hooks = h)

const SOURCES: Record<Source, { label: string; icon: string }> = {
  file: { label: t('tr.srcFile'), icon: 'file-media' },
  mic: { label: t('tr.srcMic'), icon: 'mic' },
  meet: { label: 'Google Meet', icon: 'organization' },
  system: { label: t('tr.srcAllSound'), icon: 'organization' },
  note: { label: t('tr.srcNote'), icon: 'note' },
}
const STAGES: [string, string][] = [
  ['decode', t('tr.stageDecode')],
  ['words', t('tr.stageWords')],
  ['speakers', t('tr.stageSpeakers')],
  ['save', t('tr.stageSave')],
]
/** Each stage's share of the bar: engine/jobs.py WEIGHTS. */
const WEIGHTS: Record<string, [number, number]> = { decode: [0, 0.1], words: [0.1, 0.6], speakers: [0.6, 0.95], save: [0.95, 1] }
const FORMATS: [string, string][] = [
  ['docx', 'Word · .docx'],
  ['md', 'Markdown · .md'],
  ['txt', `${t('tr.fmtText')} · .txt`],
  ['srt', `${t('tr.fmtSubs')} · .srt`],
  ['vtt', `${t('tr.fmtSubs')} · .vtt`],
  ['json', `${t('tr.fmtData')} · .json`],
]
/** Whisper's codes for the languages a person may name as their own, where it knows them. */
const CODES: Record<string, string> = {
  Russian: 'ru', Ukrainian: 'uk', German: 'de', French: 'fr', Spanish: 'es', Italian: 'it', Polish: 'pl', Portuguese: 'pt',
  Turkish: 'tr', Dutch: 'nl', Czech: 'cs', Japanese: 'ja', Chinese: 'zh', Korean: 'ko', Arabic: 'ar', Persian: 'fa',
  Kazakh: 'kk', Hebrew: 'he', Swedish: 'sv', Greek: 'el', Hungarian: 'hu', Romanian: 'ro', Bulgarian: 'bg', Finnish: 'fi',
  Danish: 'da', Norwegian: 'no', Serbian: 'sr', Croatian: 'hr', Slovak: 'sk', Lithuanian: 'lt', Latvian: 'lv', Estonian: 'et',
}

const tx = {
  rows: undefined as Row[] | undefined,
  query: '',
  /** The transcript open on the page; empty: the library. */
  openId: '',
  row: undefined as Row | undefined,
  transcript: undefined as Transcript | undefined,
  recorder: undefined as ChunkRecorder | undefined,
  /** A question to the calls (ask.ts): the one asked, its answer, or why there is none. */
  question: '',
  asking: false,
  answer: undefined as Answer | undefined,
  askError: '',
  /** A moment to play from once the transcript opens (a cited passage). */
  seekTo: undefined as number | undefined,
  language: 'auto',
  speakers: 0,
  /** The delete button was tapped once: it asks. */
  deleting: false,
  /** The export menu is open. */
  exporting: false,
  /** "Transcribe again" was tapped once: it asks. */
  redoing: false,
  // The summary block of the transcript `sumFor`: the template, the person's own instruction, the language, and its two questions.
  sumFor: '',
  /** The template picked: a built-in one, `t<n>` the person's own n-th (settings.callTemplates), `new` one being written. */
  template: 'general' as string,
  /** The own template being written or changed: its name and its instruction. */
  ownName: '',
  own: '',
  mine: false,
  editing: false,
  replacing: false,
  /** The transcript whose summary was being made when last drawn: it is read again once that is over. */
  sumBusy: '',
  /** What an open transcript shows: its lines, the person's notes, or the summary. */
  tab: 'text' as Tab,
}

type Tab = 'text' | 'notes' | 'summary'

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }

function meta(r: { created: string; duration: number; source: Source; app?: string }, long = false): string {
  const parts = [formatDate(new Date(r.created), long ? DAY : DATE)]
  if (r.duration) parts.push(length(r.duration))
  // A call is named by its program (Zoom) when the engine says which, else by its source.
  parts.push((r.source === 'system' && r.app) || (SOURCES[r.source]?.label ?? r.source))
  return parts.join(' · ')
}

// ---------------------------------------------------------------- new

const languages = (v: AppView): [string, string][] => {
  const own = CODES[v.settings.native]
  return [['auto', t('tr.auto')], ['en', languageName('English')], ...(own ? [[own, languageName(v.settings.native)] as [string, string]] : [])]
}

/** Files to the engine, read where they are; one opens as it is transcribed, several wait in the library. */
export async function transcribeFiles(files: File[]): Promise<void> {
  const ids: string[] = []
  for (const file of files) {
    const path = window.tutorHost.pathOf(file)
    if (!path) continue
    try {
      ids.push((await api<{ id: string }>('POST', '/transcripts', { path, language: tx.language === 'auto' ? null : tx.language, speakers: tx.speakers || null })).id)
    } catch (error) {
      toast(`${file.name}: ${problem(error)}`, undefined, true)
    }
  }
  if (ids.length === 1) openTranscript(ids[0] as string)
  else if (ids.length > 1) {
    toast(t('tr.filesWaiting', { n: ids.length }))
    openTranscript('')
  }
}

const picker = el('input', {
  type: 'file',
  accept: 'audio/*,video/*,.mkv,.m4a,.opus,.flac',
  multiple: true,
  hidden: true,
  onchange: (event: Event) => {
    const input = event.target as HTMLInputElement
    void transcribeFiles([...(input.files ?? [])]).finally(() => (input.value = ''))
  },
})
document.body.append(picker)

/** Transcribe's own rows: the drop zone, the options, the microphone. */
export function newRows(v: AppView): HTMLElement[] {
  const zone = el(
    'div',
    { class: 'zone', role: 'button', tabindex: 0, onclick: () => picker.click(), onkeydown: (e: Event) => (e as KeyboardEvent).key === 'Enter' && picker.click() },
    icon('cloud-upload'),
    el('div', { class: 'zt' }, el('b', {}, t('tr.dropTitle')), el('small', {}, t('tr.dropNote', { time: minutesPerHour(v) >= 60 ? t('tr.anHour') : minutesText(minutesPerHour(v)) }))),
    btn(t('tr.pick'), event => (event.stopPropagation(), picker.click())),
  )
  return [
    zone,
    card('languages', t('tr.language'), [t('tr.languageNote')], seg(tx.language, languages(v), language => (tx.language = language))),
    card(
      'users',
      t('tr.speakers'),
      [t('tr.speakersNote')],
      seg(tx.speakers, [[0, t('tr.auto')], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], speakers => (tx.speakers = speakers), true),
    ),
    micRow(),
  ]
}

function micRow(): HTMLElement {
  const r = tx.recorder
  if (!r) return card('mic', t('tr.micTitle'), [t('tr.micNote')], btn([el('i', { class: 'dot' }), t('tr.record')], () => void startMic(), 'rec'))
  return el(
    'div',
    { class: 'row live' },
    el('div', { class: 'l' }, el('span', { class: 'livehead' }, el('i', { class: 'dot pulse' }), t('tr.recording'), el('span', { class: 'mtime' }, clock(r.seconds))), el('span', { class: 'level' }, el('i'))),
    el('span', { class: 'kchg' }, linkBtn(t('common.cancel'), () => void cancelMic()), btn(t('tr.stopTranscribe'), () => void stopMic(), 'primary')),
  )
}

// The time and the level move on their own, whatever the page was drawn from.
window.setInterval(() => {
  const r = tx.recorder
  if (!r) return
  for (const tr of document.querySelectorAll('.mtime')) tr.textContent = clock(r.seconds)
  for (const l of document.querySelectorAll<HTMLElement>('.level i')) l.style.transform = `scaleX(${r.level().toFixed(2)})`
}, 100)

async function startMic(): Promise<void> {
  const r = new ChunkRecorder(window.tutorHost.call, { source: 'mic', slice: 10_000, language: tx.language === 'auto' ? undefined : tx.language, speakers: tx.speakers || undefined })
  try {
    await r.start()
    tx.recorder = r
    // The tray shows the red dot while it records.
    post({ type: 'micRecording', on: true })
  } catch (error) {
    toast(micTrouble(error), undefined, true)
  }
  redrawPage()
}

async function stopMic(): Promise<void> {
  const r = tx.recorder
  tx.recorder = undefined
  post({ type: 'micRecording', on: false })
  redrawPage()
  if (!r) return
  try {
    const id = await r.finish()
    if (r.lost) toast(t('tr.lostPiece'), undefined, true)
    openTranscript(id)
  } catch (error) {
    fault(error)
  }
}

async function cancelMic(): Promise<void> {
  const r = tx.recorder
  tx.recorder = undefined
  post({ type: 'micRecording', on: false })
  redrawPage()
  await r?.cancel()
}

// Files dropped anywhere in the window are transcribed with Transcribe's options.
const drop = el('div', { class: 'drop' }, el('div', {}, icon('cloud-upload'), el('b', {}, t('tr.dropHere'))))
document.body.append(drop)
let dragDepth = 0
const carriesFiles = (event: DragEvent) => !!event.dataTransfer?.types.includes('Files')
window.addEventListener('dragenter', event => {
  if (!carriesFiles(event)) return
  dragDepth++
  drop.classList.add('on')
})
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1)
  if (!dragDepth) drop.classList.remove('on')
})
window.addEventListener('dragover', event => event.preventDefault())
window.addEventListener('drop', event => {
  event.preventDefault()
  dragDepth = 0
  drop.classList.remove('on')
  const files = [...(event.dataTransfer?.files ?? [])]
  if (!files.length) return
  const v = hooks.view()
  // Without the engine the files have nowhere to go: Transcribe offers it.
  if (!v || !running(v)) return hooks.setup()
  void transcribeFiles(files)
})

// ---------------------------------------------------------------- the library

let searchTimer: number | undefined

async function loadRows(): Promise<void> {
  try {
    const rows = await api<Row[]>('GET', `/transcripts?q=${encodeURIComponent(tx.query)}`)
    const changed = JSON.stringify(rows) !== JSON.stringify(tx.rows)
    tx.rows = rows
    if (changed && hooks.shown() && (!tx.openId || hooks.beside)) redrawPage()
  } catch {
    // the engine is away; the page says so from the view
  }
}

/** A transcript is open, not the library: the bar's crumb then leads back to it. */
export const transcriptOpen = () => !!tx.openId

export function transcriptsBody(v: AppView): HTMLElement[] {
  if (!installed(v)) return [row(t('tr.needEngine'), [t('tr.needEngineNote')], linkBtn(t('tr.transcribeLink'), () => hooks.setup()))]
  if (!running(v)) return [row(t('speech.starting'), [t('tr.startingNote')], null)]
  return tx.openId ? transcriptPage(v) : libraryPage(v)
}

const pathNote = (path: string) => el('small', { class: 'path', title: path }, el('bdi', {}, path))

/** The library folder is the notebook (engine/calls.py): media put into it is transcribed, calls recorded here are saved into it.
 *  Change moves the whole library where the person picks (POST /library/move); what is in that folder already stays and is read. */
export function libraryFolderCard(v: AppView): HTMLElement | null {
  const dataDir = v.speech.health?.dataDir
  if (!dataDir) return null
  const change = async () => {
    const folder = (await window.tutorHost.call({ call: 'pickFolder', title: t('transcribe.keptIn'), current: dataDir })) as string | null
    if (!folder || folder === dataDir) return
    try {
      await api('POST', '/library/move', { to: folder })
      toast(t('tr.movedLib', { folder }))
      void loadRows()
    } catch (error) {
      toast(problem(error), undefined, true)
    }
  }
  return card('folder', t('transcribe.keptIn'), [pathNote(dataDir), t('tr.folderNote')], linkBtn(t('tr.open'), () => post({ type: 'openPath', path: dataDir })), linkBtn(t('dictate.change'), () => void change()))
}

async function askCalls(question: string): Promise<void> {
  tx.question = question
  tx.answer = undefined
  tx.askError = ''
  tx.asking = true
  redrawPage()
  try {
    tx.answer = (await window.tutorHost.call({ call: 'askCalls', question })) as Answer
  } catch (error) {
    tx.askError = problem(error) === 'needModel' ? t('tr.askNeedModel') : problem(error)
  }
  tx.asking = false
  redrawPage()
}

/** The question's field, and under it the answer with its citations as links into the calls. */
function askRows(): HTMLElement[] {
  const input = el('input', { type: 'search', placeholder: t('tr.ask'), value: tx.question })
  const form = el(
    'form',
    { class: 'search ask', onsubmit: (event: Event) => (event.preventDefault(), input.value.trim() && !tx.asking && void askCalls(input.value.trim())) },
    icon('comment-discussion'),
    input,
    btn(t('tr.askBtn'), () => form.requestSubmit(), 'primary'),
  )
  const out: HTMLElement[] = [form]
  if (tx.asking) out.push(el('p', { class: 'answer muted' }, t('tr.asking')))
  else if (tx.askError) out.push(el('p', { class: 'answer muted' }, tx.askError))
  else if (tx.answer) {
    const a = tx.answer
    if (!a.sources.length) out.push(el('p', { class: 'answer muted' }, t('tr.askNothing')))
    else {
      const open = (n: number) => {
        const p = a.sources[n - 1]
        if (p) openTranscript(p.id, p.at)
      }
      const text = el('div', { class: 'answer' })
      let last = 0
      for (const m of a.text.matchAll(CITE)) {
        text.append(a.text.slice(last, m.index), el('button', { class: 'cite', onclick: () => open(Number(m[1])) }, m[1] as string))
        last = (m.index ?? 0) + m[0].length
      }
      text.append(a.text.slice(last))
      const used = cited(a.text, a.sources.length)
      const list = (used.length ? used : a.sources.map((_, i) => i + 1)).map(n => {
        const p = a.sources[n - 1]!
        return el('li', {}, el('button', { class: 'cite', onclick: () => open(n) }, String(n)), ' ', linkBtn(`${p.title} · ${formatDate(new Date(p.created), DATE)} · ${clock(p.at)}`, () => open(n)))
      })
      out.push(text, el('ul', { class: 'sources' }, ...list))
    }
  }
  return out
}

function libraryPage(v: AppView): HTMLElement[] {
  const [tools, ...rest] = transcriptsHome(v)
  tools!.append(btn([icon('window'), t('calls.openWindow')], () => post({ type: 'tray', command: 'transcripts' }), '', t('calls.openWindowNote')))
  return [tools!, ...rest, list(v)]
}

/** The search, the questions to the calls and the folders: what the library has besides its list. */
function transcriptsHome(v: AppView): HTMLElement[] {
  const kb = v.speech.health?.kbDir
  return [
    el(
      'div',
      { class: 'tools' },
      el(
        'label',
        { class: 'search' },
        icon('search'),
        el('input', {
          type: 'search',
          placeholder: t('tr.search'),
          value: tx.query,
          oninput: (event: Event) => {
            tx.query = (event.target as HTMLInputElement).value
            window.clearTimeout(searchTimer)
            searchTimer = window.setTimeout(() => void loadRows(), 200)
          },
        }),
      ),
      btn([icon('add'), t('tr.new')], () => hooks.setup(), '', t('tr.newTitle')),
    ),
    ...askRows(),
    libraryFolderCard(v),
    kb === '' ? aside('book-open', t('tr.needKb'), ' ', linkBtn(t('tr.choose'), () => void pickKb())) : null,
    speakersMissing(v, () => hooks.setup()),
  ].filter((n): n is HTMLElement => n !== null)
}

/**
 * The calls window: every recording on the left (the search over it), and on the right the one
 * open, or the questions to the calls and the folders while none is.
 */
export function callsColumns(v: AppView): { list: HTMLElement[]; open: HTMLElement[] } {
  if (!installed(v) || !running(v)) return { list: [], open: transcriptsBody(v) }
  const [tools, ...rest] = transcriptsHome(v)
  return { list: [tools!, list(v)], open: tx.openId ? transcriptPage(v) : rest }
}

function list(v: AppView): HTMLElement {
  const rows = tx.rows
  if (!rows) return el('ul', { class: 'tl' }, el('li', { class: 'empty' }, t('tr.openingLib')))
  if (!rows.length) {
    if (tx.query) return el('ul', { class: 'tl' }, el('li', { class: 'empty' }, t('tr.nothing')))
    const tip = (glyph: string, ...text: (Node | string)[]) => el('li', {}, icon(glyph), el('span', {}, ...text))
    return el(
      'div',
      { class: 'tempty' },
      el('b', {}, t('tr.emptyTitle')),
      el(
        'ul',
        {},
        tip('cloud-upload', t('tr.tipDrop')),
        tip('mic', t('tr.tipMic')),
        tip('note', ...phrase(t('tr.tipNote'), { keys: caps(v.settings.noteKey) })),
      ),
    )
  }
  return el(
    'ul',
    { class: 'tl' },
    ...rows.map(r =>
      el(
        'li',
        {},
        el(
          'button',
          { class: r.id === tx.openId ? 'ti on' : 'ti', 'aria-current': r.id === tx.openId ? 'true' : undefined, onclick: () => openTranscript(r.id) },
          el('span', { class: 'src' }, icon(SOURCES[r.source]?.icon ?? 'file')),
          el('span', { class: 'tm' }, el('b', {}, r.title), el('small', {}, meta(r)), r.snippet ? snippet(r.snippet) : null),
          statusChip(r) ?? (r.summarized ? el('span', { class: 'chip lit' }, t('sum.title')) : null),
        ),
      ),
    ),
  )
}

/** The search marks the found words with [ ]; they become marks. */
function snippet(text: string): HTMLElement {
  const out = el('span', { class: 'snip' })
  for (const part of text.split(/(\[[^\]]*\])/)) {
    if (part.startsWith('[') && part.endsWith(']')) out.append(el('mark', {}, part.slice(1, -1)))
    else if (part) out.append(part)
  }
  return out
}

function statusChip(r: Row): HTMLElement | null {
  if (r.status === 'done') return null
  if (r.status === 'failed') return el('span', { class: 'chip bad' }, t('tr.failed'))
  if (r.status === 'recording') return el('span', { class: 'chip rec' }, el('i', { class: 'dot pulse' }), t('tr.recordingChip'))
  if (r.status === 'queued') return el('span', { class: 'chip off' }, t('tr.waiting'))
  return el('span', { class: 'chip lit' }, `${Math.round(r.progress * 100)}%`)
}

// ---------------------------------------------------------------- a transcript

/** Opens a transcript on the Transcripts page; an empty id, the library. */
export function openTranscript(id: string, at?: number): void {
  if (id !== tx.openId) stopPlayer()
  // Another recording, or a cited moment of this one: its lines.
  if (id !== tx.openId || at !== undefined) tx.tab = 'text'
  tx.openId = id
  tx.seekTo = at
  tx.deleting = tx.exporting = tx.redoing = false
  if (id && tx.row?.id !== id) {
    tx.row = undefined
    tx.transcript = undefined
  }
  if (id) void loadTranscript()
  else void loadRows()
  if (hooks.shown()) redrawPage()
  else hooks.show()
}

/** Back from a transcript to the library; false when the library is what shows. */
export function backToList(): boolean {
  if (!tx.openId) return false
  openTranscript('')
  return true
}

/** The page closed: the sound stops. */
export function leaveTranscripts(): void {
  stopPlayer()
}

const busy = (status?: string) => status === 'queued' || status === 'working'

async function loadTranscript(): Promise<void> {
  const id = tx.openId
  try {
    const r = await api<{ row: Row; transcript: Transcript | null }>('GET', `/transcripts/${id}`)
    if (id !== tx.openId) return
    const before = tx.row?.id === id ? tx.row : undefined
    tx.row = r.row
    if (r.transcript || r.row.status !== 'done') tx.transcript = r.transcript ?? undefined
    pace.see(r.row)
    if (!hooks.shown()) return
    if (r.row.status === 'done' && before?.status === 'done') return
    // Still on its way: only the card moves, the page stays as it is.
    const card = document.querySelector<HTMLElement>('.progress')
    if (card && busy(before?.status) && busy(r.row.status)) return updateProgress(card, r.row)
    redrawPage()
  } catch (error) {
    if (error instanceof SpeechError && error.status === 404) openTranscript('')
  }
}

function transcriptPage(v: AppView): HTMLElement[] {
  const r = tx.row
  if (!r || r.id !== tx.openId) return [el('p', { class: 'opening' }, t('tr.opening'))]
  const tr = tx.transcript
  const title = el('h2', {
    class: 'ttitle',
    contenteditable: tr ? 'plaintext-only' : false,
    spellcheck: 'false',
    title: tr ? t('tr.rename') : undefined,
    onkeydown: (event: Event) => {
      const e = event as KeyboardEvent
      if (e.key === 'Enter') (e.preventDefault(), (e.target as HTMLElement).blur())
      if (e.key === 'Escape') (e.preventDefault(), ((e.target as HTMLElement).textContent = tr?.title ?? r.title), (e.target as HTMLElement).blur())
    },
    onblur: (event: Event) => {
      const node = event.target as HTMLElement
      const text = node.textContent?.trim() ?? ''
      if (tr && text && text !== tr.title) void patch({ title: text }).then(() => void loadRows())
      else node.textContent = tr?.title ?? r.title
    },
  })
  title.textContent = tr?.title ?? r.title
  const head = el('div', { class: 'thead' }, title, el('small', { class: 'tmeta' }, meta(tr ?? r, true)))
  if (r.status !== 'done' || !tr) {
    stopPlayer()
    return [head, progressCard(r)]
  }
  const tab = tr.source === 'note' && tx.tab === 'summary' ? 'text' : tx.tab
  const shown = tab === 'notes' ? [notesBlock(tr)] : tab === 'summary' ? [summaryBlock(v, tr)] : [speakersStrip(tr), utterances(v, tr)]
  const nodes = [head, actions(tr), ...notices(v, r, tr), tabs(tr, tab), ...shown, player(v, tr)].filter((n): n is HTMLElement => n !== null)
  if (tx.seekTo !== undefined) {
    const at = tx.seekTo
    tx.seekTo = undefined
    window.setTimeout(() => jumpTo(tr, at), 0)
  }
  return nodes
}

/** Transcript · Notes · Summary (a note has no summary); the summary's tab says when one is made or being made. */
function tabs(tr: Transcript, tab: Tab): HTMLElement {
  const making = !!tx.sumBusy && tx.sumBusy === tr.id
  const items: [Tab, string, boolean][] = [
    ['text', t('calls.tabText'), false],
    ['notes', t('calls.tabNotes'), !!tr.notes?.trim()],
    ...(tr.source === 'note' ? [] : [['summary', t('calls.tabSummary'), !!tr.summary || making] as [Tab, string, boolean]]),
  ]
  return el(
    'div',
    { class: 'seg ttabs', role: 'tablist' },
    ...items.map(([id, label, dot]) =>
      el('button', { class: id === tab ? 'ttab on' : 'ttab', role: 'tab', 'aria-selected': String(id === tab), onclick: () => ((tx.tab = id), redrawPage()) }, label, dot ? el('i', { class: 'tdot' }) : null),
    ),
  )
}

/** The person's own notes on the recording: saved when the field is left; the summary reads them. */
function notesBlock(tr: Transcript): HTMLElement {
  const field = el('textarea', { class: 'field report tnotes', 'data-live': `notes-${tr.id}`, maxlength: NOTES_MAX, placeholder: t('calls.notesPlaceholder'), 'aria-label': t('calls.tabNotes') })
  field.value = tr.notes ?? ''
  field.rows = Math.min(30, Math.max(10, field.value.split('\n').length + 2))
  field.addEventListener('blur', () => {
    if (field.value !== (tr.notes ?? '')) void patch({ notes: field.value }).then(() => (toast(t('calls.notesSaved')), redrawPage()))
  })
  return el('div', { class: 'notes' }, field, el('small', { class: 'muted' }, t('calls.notesNote')))
}

// ---------------------------------------------------------------- a call while it records
// The open recording: the person's notes beside the draft of the words (engine/live.py, with
// `callLive`). One element kept across the page's redraws, so what is typed, its cursor and the
// draft's scroll stay. The notes are kept by the engine as they are typed (PUT /recordings/<id>/notes)
// and become the transcript's; the draft's lines are only shown, never kept or logged.

type Recording = { id: string; root: HTMLElement; lines: HTMLElement; field: HTMLTextAreaElement; saved: string; timer?: number }
let rec: Recording | undefined
const NOTES_KEEP_MS = 800
/** The draft's rows shown: the call's last few minutes. */
const LIVE_ROWS = 200

function recordingView(r: Row): HTMLElement {
  if (rec?.id === r.id) return rec.root
  leaveRecording()
  const lines = el('div', { class: 'reclines' })
  const field = el('textarea', { class: 'field report tnotes', maxlength: NOTES_MAX, placeholder: t('calls.notesPlaceholder'), 'aria-label': t('calls.tabNotes') })
  const root = el(
    'div',
    { class: 'recview' },
    el('div', { class: 'recside' }, el('b', {}, t('calls.tabNotes')), field, el('small', { class: 'muted' }, t('calls.notesWhile'))),
    el('div', { class: 'recside' }, el('b', {}, el('i', { class: 'dot pulse' }), ' ', t('tr.recording')), lines),
  )
  const me: Recording = { id: r.id, root, lines, field, saved: '' }
  field.addEventListener('input', () => {
    window.clearTimeout(me.timer)
    me.timer = window.setTimeout(() => void keepNotes(me), NOTES_KEEP_MS)
  })
  field.addEventListener('blur', () => void keepNotes(me))
  // Notes typed before the window was closed and opened again.
  void api<{ notes: string }>('GET', `/recordings/${r.id}/notes`)
    .then(a => {
      me.saved = a.notes
      if (!field.value) field.value = a.notes
    })
    .catch(() => undefined)
  rec = me
  void followLive()
  return root
}

/** What is typed goes to the engine; a transcript made meanwhile takes it as its notes. */
async function keepNotes(me: Recording): Promise<void> {
  window.clearTimeout(me.timer)
  const notes = me.field.value
  if (notes === me.saved) return
  try {
    await api('PUT', `/recordings/${me.id}/notes`, { notes })
    me.saved = notes
  } catch (error) {
    if (!(error instanceof SpeechError) || error.status !== 409) return fault(error)
    await api('PATCH', `/transcripts/${me.id}`, { notes }).then(() => (me.saved = notes), fault)
  }
}

/** The recording is no longer the one shown: its last words typed are kept first. */
function leaveRecording(): void {
  if (!rec) return
  void keepNotes(rec)
  rec = undefined
}

/** The draft's rows, or why there are none. */
async function followLive(): Promise<void> {
  const me = rec
  if (!me) return
  let state: LiveState = 'failed'
  let rows: ReturnType<typeof liveRows> = []
  try {
    const got = liveAnswer(await api<unknown>('GET', `/recordings/${me.id}/live`))
    state = got.state
    rows = liveRows(got.lines, LIVE_ROWS)
  } catch {
    // The engine did not answer: the page's own notice says so; the draft waits.
  }
  if (rec !== me) return
  const off = hooks.view()?.settings.callLive ? t('tr.afterStop') : t('calls.liveOff')
  const why: Partial<Record<LiveState, string>> = { missing: t('call.liveMissing'), card: t('call.liveCard'), failed: t('call.liveFailed'), off }
  const said = why[state] ?? (rows.length ? '' : t('call.liveWaiting'))
  const atEnd = me.lines.scrollHeight - me.lines.scrollTop - me.lines.clientHeight < 40
  me.lines.replaceChildren(
    ...(said
      ? [el('small', { class: 'muted' }, said)]
      : [
          ...rows.map(l =>
            el('div', { class: `lline ${l.who}` }, el('span', { class: 'who' }, t(l.who === 'me' ? 'call.liveMe' : 'call.liveOthers')), el('span', { class: 'at' }, clock(l.at)), el('span', {}, l.gap ? t('call.liveGap') : l.text)),
          ),
          el('small', { class: 'muted' }, state === 'paused' ? t('call.livePaused') : t('call.liveDraft')),
        ]),
  )
  if (atEnd) me.lines.scrollTop = me.lines.scrollHeight
}

function progressCard(r: Row): HTMLElement {
  if (r.status === 'failed') {
    return el(
      'div',
      { class: 'card bad' },
      el('b', {}, t('tr.couldNot')),
      el('small', {}, r.error),
      el(
        'div',
        { class: 'cardbtns' },
        btn(t('common.tryAgain'), async () => {
          try {
            await api('POST', `/transcripts/${r.id}/retry`)
            void loadTranscript()
          } catch (error) {
            fault(error)
          }
        }),
        linkBtn(t('tr.delete'), () => void remove(r.id)),
      ),
    )
  }
  if (r.status === 'recording') return recordingView(r)
  leaveRecording()
  const card = el(
    'div',
    { class: 'card progress' },
    el('b', { class: 'plead' }),
    el('span', { class: 'track' }, el('i')),
    el('small', { class: 'pstat' }),
    el('ol', { class: 'stages' }, ...STAGES.map(([, label]) => el('li', {}, label))),
    el('small', { class: 'pnote' }, t('tr.background')),
  )
  updateProgress(card, r)
  return card
}

function updateProgress(card: HTMLElement, r: Row): void {
  const at = STAGES.findIndex(s => s[0] === r.stage)
  const lead = card.querySelector('.plead')
  if (lead) lead.textContent = r.status === 'queued' ? t('tr.waitingTurn') : `${STAGES[at]?.[1] ?? t('tr.starting')}…`
  const track = card.querySelector<HTMLElement>('.track')
  track?.classList.toggle('live', r.status === 'working')
  const fill = track?.firstElementChild as HTMLElement | null
  if (fill) fill.style.width = `${(r.progress * 100).toFixed(1)}%`
  const line = card.querySelector('.pstat')
  if (line) line.textContent = progressLine(r)
  card.querySelectorAll('.stages li').forEach((li, i) => (li.className = i < at ? 'done' : i === at ? 'now' : ''))
}

/** "23 of 64 min · about 2 min left", "40%", or what it waits for. */
function progressLine(r: Row): string {
  if (r.status === 'queued') return t('tr.startsAfter')
  const [a, b] = WEIGHTS[r.stage] ?? [0, 1]
  const part = Math.min(1, Math.max(0, (r.progress - a) / (b - a)))
  const parts: string[] = []
  if (r.stage === 'words' && part === 0) parts.push(t('tr.loadingModel'))
  else if (r.stage === 'words' && r.duration && r.source !== 'meet') parts.push(position(part * r.duration, r.duration))
  else if (part > 0) parts.push(`${Math.round(part * 100)}%`)
  // Not said while a stage stands still (a model loading): any number then would be a guess.
  const left = part > 0 ? pace.left(r) : ''
  if (left) parts.push(left)
  return parts.join(' · ')
}

function position(at: number, total: number): string {
  return total >= 120 ? t('tr.posMin', { at: Math.floor(at / 60), total: Math.round(total / 60) }) : t('tr.posClock', { at: clock(at), total: clock(total) })
}

/** The bar's recent positions, to tell how fast it goes now (stages differ in speed). */
const pace = {
  id: '',
  seen: [] as [number, number][],
  see(r: Row): void {
    const now = Date.now()
    if (this.id !== r.id) (this.id = r.id), (this.seen = [])
    this.seen = this.seen.filter(([tr, p]) => now - tr < 30_000 && p <= r.progress)
    this.seen.push([now, r.progress])
  },
  left(r: Row): string {
    const first = this.seen[0]
    if (this.id !== r.id || !first) return ''
    const spent = (Date.now() - first[0]) / 1000
    const done = r.progress - first[1]
    if (spent < 8 || done < 0.01) return ''
    const left = ((1 - r.progress) * spent) / done
    return left < 60 ? t('tr.underMinute') : t('tr.minLeft', { n: Math.round(left / 60) })
  },
}

async function patch(changes: unknown): Promise<void> {
  try {
    const tr = await api<Transcript>('PATCH', `/transcripts/${tx.openId}`, changes)
    const recount = tr.utterances.length !== tx.transcript?.utterances.length
    tx.transcript = tr
    if (recount) redrawPage()
  } catch (error) {
    fault(error)
  }
}

function actions(tr: Transcript): HTMLElement {
  const copy = btn([icon('copy'), t('common.copy')], async () => {
    try {
      await window.tutorHost.call({ call: 'copy', text: await api<string>('GET', `/transcripts/${tr.id}/text?format=txt`) })
      toast(t('tr.copied'))
    } catch (error) {
      fault(error)
    }
  })
  const menu = tx.exporting
    ? el(
        'div',
        { class: 'menu', role: 'menu' },
        ...FORMATS.map(([format, label]) =>
          el(
            'button',
            {
              class: 'mi',
              role: 'menuitem',
              onclick: async () => {
                tx.exporting = false
                redrawPage()
                try {
                  const path = (await window.tutorHost.call({ call: 'exportTranscript', id: tr.id, format, name: tr.title })) as string | null
                  if (path) toast(t('tr.saved', { file: fileName(path) }), showFile(path))
                } catch (error) {
                  fault(error)
                }
              },
            },
            label,
          ),
        ),
      )
    : null
  const exporter = el(
    'span',
    { class: 'menuwrap' },
    btn([icon('desktop-download'), t('tr.export'), icon('chevron-down')], event => {
      event.stopPropagation()
      tx.exporting = !tx.exporting
      redrawPage()
    }),
    menu,
  )
  const toKb =
    tr.source !== 'note'
      ? btn([icon('book'), t('tr.toKb')], async () => {
          try {
            const { path } = await api<{ path: string }>('POST', `/transcripts/${tr.id}/to-kb`)
            toast(t('tr.inKb', { file: fileName(path) }), showFile(path))
          } catch (error) {
            const choose = error instanceof SpeechError && error.status === 409
            toast(problem(error), choose ? { label: t('tr.chooseFolder'), run: () => void pickKb() } : undefined, true)
          }
        })
      : null
  const del = tx.deleting
    ? el(
        'span',
        { class: 'confirm' },
        el('small', {}, t('tr.deleteAsk')),
        btn(t('tr.delete'), () => void remove(tr.id), 'danger'),
        linkBtn(t('tr.keep'), () => ((tx.deleting = false), redrawPage())),
      )
    : el('button', { class: 'ib del', title: t('tr.delete'), 'aria-label': t('tr.delete'), onclick: () => ((tx.deleting = true), redrawPage()) }, icon('trash'))
  return el('div', { class: 'tools tacts' }, copy, exporter, toKb, el('span', { class: 'gap' }), del)
}

// An open export menu closes on any click elsewhere.
window.addEventListener('click', event => {
  if (!tx.exporting || (event.target as Element).closest?.('.menuwrap')) return
  tx.exporting = false
  redrawPage()
})

async function remove(id: string): Promise<void> {
  try {
    await api('DELETE', `/transcripts/${id}`)
    toast(t('tr.deleted'))
    openTranscript('')
  } catch (error) {
    fault(error)
  }
}

function notices(v: AppView, r: Row, tr: Transcript): HTMLElement[] {
  const out: HTMLElement[] = []
  const note = tr.note
  if (note) {
    out.push(
      aside('book-open', ...phrase(t('tr.inKb'), { file: el('b', {}, fileName(note)) }), ' ', linkBtn(t('tr.open'), () => post({ type: 'openPath', path: note })), linkBtn(t('tr.showInFolder'), () => post({ type: 'showInFolder', path: note }))),
    )
  }
  if (tr.noteError) out.push(aside('info', tr.noteError, ' ', linkBtn(t('tr.chooseFolder'), () => void pickKb())))
  if (r.error) out.push(aside('circle-alert', r.error))
  if (tr.lost) out.push(aside('info', t('sum.lost', { n: tr.lost })))
  const speakers = speakersNotice(v, tr)
  if (speakers) out.push(speakers)
  return out
}

/** Can this transcript be split by speaker now, and how: from its words, or only by recognizing it anew. */
function splitWay(tr: Transcript): 'words' | 'redo' | null {
  if (tr.source === 'note' || tr.speakersStatus === 'ok') return null
  if (tr.hasWords) return 'words'
  return tr.source === 'file' || tr.source === 'mic' ? 'redo' : null
}

/** Speakers missing from a transcript: what to do about it, right where it shows. */
function speakersNotice(v: AppView, tr: Transcript): HTMLElement | null {
  if (tr.source === 'note' || tr.speakersStatus === 'ok' || tr.speakersStatus === 'single') return null
  // "Me" is the name the engine gives the microphone's track (stored in the transcript), so it stays as drawn.
  const meet = tr.source === 'meet' || tr.source === 'system' ? ` ${t('tr.meetNote')}` : ''
  const why =
    tr.speakersStatus === 'failed'
      ? t('tr.whyFailed')
      : tr.speakersStatus === 'no-part'
        ? `${t('tr.whyNoPart')}${meet}`
        : // A Mac asks for no key (2026-11-09): one made there while a key was needed says the part was missing.
          `${t(v.speech.speakers.ane ? 'tr.whyNoPart' : 'tr.whyNoKey')}${meet}`
  const missing = speakersMissing(v, () => hooks.setup())
  if (missing) return aside('users', why, ' ', linkBtn(t('tr.setUpSpeakers'), () => hooks.setup()))
  const way = splitWay(tr)
  if (!way) return aside('users', `${why} ${t('tr.noWords')}`)
  const run = () => void splitSpeakers(tr.id)
  if (way === 'words') return aside('users', `${why} ${t('tr.noRecog')}`, ' ', linkBtn(t('tr.split'), run))
  // Made before the words' times were kept: only a full new pass can split it.
  const minutes = Math.max(1, Math.round((tr.duration / 3600) * minutesPerHour(v)))
  if (tx.redoing) {
    return aside(
      'users',
      tr.edited ? t('tr.editsLost') : t('tr.goOn'),
      ' ',
      linkBtn(t('tr.again'), run),
      linkBtn(t('common.notNow'), () => ((tx.redoing = false), redrawPage())),
    )
  }
  return aside('users', `${why} ${t('tr.redoTime', { n: minutes })}`, ' ', linkBtn(t('tr.again'), () => ((tx.redoing = true), redrawPage())))
}

async function splitSpeakers(id: string): Promise<void> {
  tx.redoing = false
  try {
    await api('POST', `/transcripts/${id}/speakers`, {})
    if (tx.openId === id && tx.row) {
      tx.row = { ...tx.row, status: 'queued', progress: 0, stage: '' }
      redrawPage()
    }
  } catch (error) {
    fault(error)
  }
}

function speakerClass(tr: Transcript, key: string): string {
  if (key === 'me') return 'sp-me'
  return `sp-${(Object.keys(tr.speakers).filter(k => k !== 'me').indexOf(key) % 6) + 1}`
}

/** The speakers as chips, each renamed in place; their names change in the text at once. */
function speakersStrip(tr: Transcript): HTMLElement | null {
  const keys = Object.keys(tr.speakers)
  if (keys.length < 2) return null
  const strip = el('div', { class: 'spk' })
  for (const key of keys) {
    const name = tr.speakers[key]?.name ?? key
    const chipNode = el('button', { class: `chip sp ${speakerClass(tr, key)}`, title: t('tr.rename') }, el('i', { class: 'sw' }), name)
    chipNode.addEventListener('click', () => {
      const input = el('input', { type: 'text', class: 'field', value: name, 'aria-label': t('tr.speakerName') })
      let done = false
      const finish = (keep: boolean) => {
        if (done) return
        done = true
        const next = input.value.trim()
        const s = tr.speakers[key]
        if (keep && next && s && next !== s.name) {
          s.name = next
          void patch({ speakers: { [key]: next } })
          for (const who of document.querySelectorAll<HTMLElement>(`.who[data-speaker="${key}"]`)) who.textContent = next
          chipNode.lastChild!.textContent = next
        }
        input.replaceWith(chipNode)
      }
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') finish(true)
        if (event.key === 'Escape') (event.preventDefault(), finish(false))
      })
      input.addEventListener('blur', () => finish(true))
      chipNode.replaceWith(input)
      input.select()
    })
    strip.append(chipNode)
  }
  strip.append(el('small', {}, t('tr.tapRename')))
  const voiceBox = voiceOffers(tr)
  // Names read off the screen (callNames): only offered; Apply renames as a tap on the chip does.
  const hints = Object.entries(tr.speakerHints ?? {}).filter(([key]) => tr.speakers[key])
  if (hints.length === 0) return voiceBox ? el('div', {}, strip, voiceBox) : strip
  const offers = hints.map(([key, name]) => {
    const forget = () => {
      delete tr.speakerHints?.[key]
      offer.remove()
      if (!box.querySelector('.namehint')) box.remove()
    }
    const offer = el(
      'div',
      { class: 'namehint' },
      el('span', {}, `${tr.speakers[key]!.name} → ${name}?`),
      linkBtn(t('tr.applyName'), () => {
        tr.speakers[key]!.name = name
        forget()
        void patch({ speakers: { [key]: name }, speakerHints: { [key]: null } }).then(redrawPage)
      }),
      linkBtn(t('tr.dismissName'), () => (forget(), void patch({ speakerHints: { [key]: null } }))),
    )
    return offer
  })
  const box = el('div', { class: 'namehints' }, ...offers, el('small', {}, t('tr.nameHintNote')))
  return el('div', {}, strip, box, voiceBox)
}

/** Names recognised by voice from earlier meetings (engine/voices.py): offered, never applied by themselves. Accept names the speaker
 * (which teaches the voice one meeting more); No is remembered for that speaker. */
function voiceOffers(tr: Transcript): HTMLElement | null {
  const hints = Object.entries(tr.voiceHints ?? {}).filter(([key]) => tr.speakers[key])
  if (hints.length === 0) return null
  const offers = hints.map(([key, hint]) => {
    const forget = () => {
      delete tr.voiceHints?.[key]
      offer.remove()
      if (!box.querySelector('.namehint')) box.remove()
    }
    const offer = el(
      'div',
      { class: 'namehint' },
      el('span', {}, t('tr.voiceHint', { speaker: tr.speakers[key]!.name, name: hint.name })),
      linkBtn(t('tr.acceptName'), () => {
        tr.speakers[key]!.name = hint.name
        forget()
        void patch({ speakers: { [key]: hint.name } }).then(redrawPage)
      }),
      linkBtn(t('tr.notThem'), () => (forget(), void patch({ voiceRejected: { [key]: hint.name } }))),
    )
    return offer
  })
  const box = el('div', { class: 'namehints' }, ...offers, el('small', {}, t('tr.voiceHintNote')))
  return box
}

function speakerMenu(tr: Transcript, i: number, label: HTMLElement): void {
  document.querySelector('.whomenu')?.remove()
  const menu = el(
    'div',
    { class: 'menu whomenu', role: 'menu' },
    ...Object.entries(tr.speakers).map(([key, s]) =>
      el(
        'button',
        {
          class: `mi ${speakerClass(tr, key)}`,
          role: 'menuitem',
          onclick: () => {
            menu.remove()
            const u = tr.utterances[i]
            if (!u || u.speaker === key) return
            u.speaker = key
            void patch({ utterances: { [i]: { speaker: key } } }).then(redrawPage)
          },
        },
        el('i', { class: 'sw' }),
        s.name,
      ),
    ),
  )
  label.after(menu)
  window.setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }))
}

/** A call's screenshot from the engine (main adds the key to the app window's requests), large on a click. */
function shotImage(v: AppView, tr: Transcript, file: string): string {
  return `http://127.0.0.1:${v.speech.port}/transcripts/${encodeURIComponent(tr.id)}/shots/${encodeURIComponent(file)}`
}

function showShot(src: string): void {
  const close = () => (box.remove(), window.removeEventListener('keydown', esc, true))
  const esc = (event: KeyboardEvent) => event.key === 'Escape' && (event.preventDefault(), event.stopPropagation(), close())
  const box = el('div', { class: 'shotbig', onclick: close }, el('img', { src, alt: '' }))
  window.addEventListener('keydown', esc, true)
  document.body.append(box)
}

function utterances(v: AppView, tr: Transcript): HTMLElement {
  const many = Object.keys(tr.speakers).length > 1
  const list = el('div', { class: 'utts' })
  // The screenshots go in at their time, each before the first line said after it.
  const shots = shownShots(tr.shots)
  let next = 0
  const shotsUntil = (at: number) => {
    const due = []
    while (next < shots.length && shots[next]!.at < at) due.push(shots[next++]!)
    if (due.length === 0) return
    list.append(
      el('div', { class: 'shots' }, ...due.map(s => {
        const src = shotImage(v, tr, s.file)
        return el('button', { class: 'shot', title: clock(s.at), onclick: () => showShot(src) }, el('img', { src, alt: '', loading: 'lazy' }))
      })),
    )
  }
  tr.utterances.forEach((u: Utterance, i: number) => {
    shotsUntil(u.start)
    const first = i === 0 || tr.utterances[i - 1]?.speaker !== u.speaker
    const text = el('div', {
      class: 'ut',
      contenteditable: 'plaintext-only',
      spellcheck: 'false',
      onkeydown: (event: Event) => {
        const e = event as KeyboardEvent
        const node = e.target as HTMLElement
        if (e.key === 'Enter' && !e.shiftKey) (e.preventDefault(), node.blur())
        if (e.key === 'Escape') (e.preventDefault(), (node.textContent = tr.utterances[i]?.text ?? ''), node.blur())
      },
      onblur: (event: Event) => {
        const value = (event.target as HTMLElement).textContent?.trim() ?? ''
        const now = tr.utterances[i]
        if (now && value !== now.text) {
          now.text = value
          void patch({ utterances: { [i]: { text: value } } })
        }
      },
    })
    text.textContent = u.text
    const who = many && first ? el('button', { class: 'who', 'data-speaker': u.speaker, title: t('tr.anotherSpeaker') }, tr.speakers[u.speaker]?.name ?? u.speaker) : null
    who?.addEventListener('click', event => (event.stopPropagation(), speakerMenu(tr, i, who)))
    list.append(
      el(
        'div',
        { class: `utt${first ? ' first' : ''}${who ? ' has-who' : ''}${i === heard ? ' now' : ''} ${speakerClass(tr, u.speaker)}`, 'data-i': String(i) },
        el('button', { class: 'at', title: t('tr.listenFrom'), onclick: () => seek(u.start) }, clock(u.start)),
        el('div', { class: 'ub' }, who, text),
      ),
    )
  })
  shotsUntil(Infinity)
  return list
}

// ---------------------------------------------------------------- the summary

const TEMPLATES = (): [SummaryTemplate, string][] => [
  ['general', t('sum.tGeneral')],
  ['standup', t('sum.tStandup')],
  ['interview', t('sum.tInterview')],
  ['lecture', t('sum.tLecture')],
]

/** The block over a transcript: make a summary, how it goes, the summary itself (editable, copied, made again). */
function summaryBlock(v: AppView, tr: Transcript): HTMLElement | null {
  if (tr.source === 'note') return null
  if (tx.sumFor !== tr.id) {
    tx.sumFor = tr.id
    const was = tr.summary?.template ?? v.settings.callTemplate
    // The person's own instruction of a summary is not told apart later: the first own template stands for it.
    pickTemplate(was === 'own' ? (v.settings.callTemplates.length ? 't0' : 'general') : was, v)
    tx.mine = tr.summary?.mine ?? v.settings.callSummaryMine
    tx.editing = tx.replacing = false
  }
  const run = v.summaries[tr.id]
  if (run && !run.error) tx.sumBusy = tr.id
  else if (tx.sumBusy === tr.id) {
    // Made (or called off): what the engine now keeps is read.
    tx.sumBusy = ''
    void reloadSummary(tr.id)
  }
  const box = el('div', { class: 'sum' }, el('div', { class: 'sumhead' }, el('b', {}, t('sum.title'))))
  if (run && !run.error) {
    const stat = el('small', { class: 'sumstat' }, summaryLine(run))
    box.append(el('div', { class: 'sumrun' }, stat, bar(run.part / (run.parts + 1)), btn(t('common.cancel'), () => post({ type: 'cancelSummary', id: tr.id }))))
    return box
  }
  if (run?.error) {
    box.append(
      el(
        'div',
        { class: 'card bad' },
        el('b', {}, t('sum.failed')),
        el('small', {}, t('sum.failedNote')),
        el('div', { class: 'cardbtns' }, btn(t('common.tryAgain'), () => startSummary(tr))),
      ),
    )
  }
  const model = v.settings.model
  const files = v.models[model]
  if (files.status !== 'ready') {
    const fetching = files.status === 'downloading'
    box.append(
      el(
        'div',
        { class: 'sumneed' },
        el('div', { class: 'l' }, el('b', {}, t('sum.needModel', { name: levelName(model), size: speechSize(files.size) })), el('small', {}, fetching ? t('sum.downloading') : t('sum.needModelNote')), fetching ? bar(files.progress) : null),
        fetching ? el('span', { class: 'pct' }, `${Math.round(files.progress * 100)}%`) : btn(files.status === 'failed' ? t('common.tryAgain') : t('settings.download'), () => post({ type: 'useModel', model }), 'primary'),
      ),
    )
  }
  if (tr.summary) box.append(summaryView(v, tr))
  if (files.status === 'ready') box.append(summaryControls(v, tr))
  return box
}

/** "Making the summary: part 2 of 5 · 0:43 passed · about 1:20 left". */
function summaryLine(run: { part: number; parts: number; started: number }): string {
  if (run.part < 1 && run.parts <= 1) return t('sum.starting')
  const now = Date.now()
  const parts = [run.part > run.parts ? t('sum.joining') : run.part < 1 ? t('sum.starting') : t('sum.working', { part: run.part, parts: run.parts }), t('sum.passed', { time: clock((now - run.started) / 1000) })]
  const left = secondsLeft(run.part, run.parts, run.started, now)
  if (left !== null) parts.push(t('sum.left', { time: clock(left) }))
  return parts.join(' · ')
}

// The elapsed time and the time left tick between main's updates.
window.setInterval(() => {
  const stat = document.querySelector('.sumstat')
  const run = tx.sumBusy ? hooks.view()?.summaries[tx.sumBusy] : undefined
  if (stat && run) stat.textContent = summaryLine(run)
}, 1000)

function startSummary(tr: Transcript): void {
  tx.replacing = false
  const own = ownAt(tx.template)
  const text = own === undefined ? undefined : hooks.view()?.settings.callTemplates[own]?.text
  post({ type: 'summarize', id: tr.id, template: text === undefined ? (tx.template as SummaryTemplate) : 'own', ...(text === undefined ? {} : { own: text.slice(0, SUMMARY_OWN_MAX) }), mine: tx.mine })
}

/** `t3` → 3: the person's own template picked; undefined for a built-in one or a new one. */
const ownAt = (pick: string): number | undefined => (/^t\d+$/.test(pick) ? Number(pick.slice(1)) : undefined)

/** Picks a template; an own one (or a new one) fills the fields it is written in. */
function pickTemplate(pick: string, v: AppView): void {
  const own = ownAt(pick)
  const kept = own === undefined ? undefined : v.settings.callTemplates[own]
  tx.template = own !== undefined && !kept ? 'general' : pick
  tx.ownName = kept?.name ?? ''
  tx.own = kept?.text ?? ''
}

/** The person's own templates as the list shows them: by name, else by their first words. */
const ownLabel = (o: { name: string; text: string }) => o.name || (o.text.length > 40 ? `${o.text.slice(0, 40).trim()}…` : o.text)

/** Saves the template in the fields (a new one is added), or with `remove` takes it away. */
function saveTemplate(v: AppView, remove = false): void {
  const list = [...v.settings.callTemplates]
  const at = ownAt(tx.template)
  if (remove) {
    if (at !== undefined) list.splice(at, 1)
    tx.template = 'general'
  } else {
    const kept = { name: tx.ownName.trim(), text: tx.own.trim() }
    if (!kept.text) return toast(t('sum.templateEmpty'), undefined, true)
    if (at === undefined) {
      if (list.length >= SUMMARY_TEMPLATES_MAX) return toast(t('sum.templatesFull', { n: SUMMARY_TEMPLATES_MAX }), undefined, true)
      list.push(kept)
      tx.template = `t${list.length - 1}`
    } else list[at] = kept
  }
  post({ type: 'saveSettings', patch: { callTemplates: list } })
  toast(remove ? t('sum.templateRemoved') : t('sum.templateSaved'))
}

function summaryControls(v: AppView, tr: Transcript): HTMLElement {
  const make = btn(tr.summary ? t('sum.again') : t('sum.make'), () => {
    if (tr.summary?.edited && !tx.replacing) (tx.replacing = true), redrawPage()
    else startSummary(tr)
  }, tr.summary ? '' : 'primary')
  const ask = tx.replacing
    ? el('span', { class: 'confirm' }, el('small', {}, t('sum.replaceAsk')), btn(t('sum.replace'), () => startSummary(tr), 'danger'), linkBtn(t('common.cancel'), () => ((tx.replacing = false), redrawPage())))
    : make
  const options: [string, string][] = [...TEMPLATES(), ...v.settings.callTemplates.map((o, i): [string, string] => [`t${i}`, ownLabel(o)]), ['new', t('sum.newTemplate')]]
  const writing = tx.template === 'new' || ownAt(tx.template) !== undefined
  const name = el('input', { type: 'text', class: 'field', 'data-live': `tname-${tx.template}`, maxlength: TEMPLATE_NAME_MAX, placeholder: t('sum.templateName'), 'aria-label': t('sum.templateName') })
  name.value = tx.ownName
  name.addEventListener('input', () => (tx.ownName = name.value))
  const text = el('textarea', { class: 'field report about', 'data-live': `ttext-${tx.template}`, rows: 4, maxlength: SUMMARY_OWN_MAX, placeholder: t('sum.ownPlaceholder'), 'aria-label': t('sum.tOwn') })
  text.value = tx.own
  text.addEventListener('input', () => (tx.own = text.value))
  const editor = writing
    ? el(
        'div',
        { class: 'sumown' },
        name,
        text,
        el(
          'div',
          { class: 'cardbtns' },
          btn(t('sum.templateSave'), () => saveTemplate(v)),
          tx.template === 'new' ? null : linkBtn(t('sum.templateDelete'), () => saveTemplate(v, true)),
        ),
      )
    : null
  return el(
    'div',
    { class: 'sumctl' },
    el(
      'div',
      { class: 'sumrow' },
      select(tx.template, options, pick => {
        pickTemplate(pick, v)
        redrawPage()
      }),
      el('label', { class: 'summine' }, toggleKnob(tx.mine, on => (tx.mine = on), t('sum.mine')), t('sum.mine')),
      el('span', { class: 'gap' }),
      tx.template === 'new' ? null : ask,
    ),
    editor,
  )
}

function summaryView(v: AppView, tr: Transcript): HTMLElement {
  const sum = tr.summary!
  const tools = el(
    'div',
    { class: 'sumtools' },
    btn([icon('copy'), t('common.copy')], async () => {
      try {
        await window.tutorHost.call({ call: 'copy', text: tr.summary?.text ?? '' })
        toast(t('sum.copied'))
      } catch (error) {
        fault(error)
      }
    }),
    btn(tx.editing ? t('sum.done') : t('sum.edit'), () => ((tx.editing = !tx.editing), redrawPage())),
    tx.editing ? el('small', {}, t('sum.editHint')) : null,
  )
  if (!tx.editing) return el('div', { class: 'sumbody' }, summaryText(v, tr, sum.text), tools)
  const field = el('textarea', { class: 'field report sumedit', 'aria-label': t('sum.title') })
  field.value = sum.text
  field.rows = Math.min(24, Math.max(8, sum.text.split('\n').length + 1))
  field.addEventListener('blur', () => void saveSummary(tr, field.value.trim()))
  return el('div', { class: 'sumbody' }, field, tools)
}

/** The summary's Markdown as headings, lines and bullets; a topic's time is a link to that place in the recording. */
function summaryText(v: AppView, tr: Transcript, text: string): HTMLElement {
  const out = el('div', { class: 'sumtext' })
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) {
      out.append(el('h4', {}, line.replace(/^#+\s*/, '')))
      continue
    }
    const bullet = line.startsWith('- ')
    const body = bullet ? line.slice(2) : line
    const node = el('div', { class: bullet ? 'sli' : 'sp' })
    const topic = topicIn(body)
    // A topic's screenshot, "(снимок 12:41)", opens it large.
    const shot = topic ? shotIn(topic.after) : null
    const file = shot ? tr.shots?.find(s => Math.abs(s.at - shot.at) <= 1)?.file : undefined
    const after = shot && file
      ? [shot.text, ' ', el('button', { class: 'stamp', title: t('sum.shot'), onclick: () => showShot(shotImage(v, tr, file)) }, shot.mark)]
      : [topic?.after ?? '']
    if (topic) node.append(topic.before, el('button', { class: 'stamp', title: t('sum.seek'), onclick: () => jumpTo(tr, topic.at) }, topic.stamp), ...after)
    else node.append(body)
    out.append(node)
  }
  return out
}

/** A topic's time: the sound goes there and the page to its line. */
function jumpTo(tr: Transcript, at: number): void {
  seek(at)
  let found = 0
  tr.utterances.forEach((u, i) => {
    if (u.start <= at + 0.3) found = i
  })
  document.querySelector(`.utt[data-i="${found}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

async function saveSummary(tr: Transcript, text: string): Promise<void> {
  if (!tr.summary || !text || text === tr.summary.text) return
  const before = tr.summary
  const next = { ...before, text, edited: new Date().toISOString() }
  // Shown at once; put back should the engine refuse.
  tr.summary = next
  try {
    await api('PUT', `/transcripts/${tr.id}/summary`, { summary: next })
  } catch (error) {
    tr.summary = before
    fault(error)
  }
}

/** The summary is made: the transcript is read again for it. */
async function reloadSummary(id: string): Promise<void> {
  try {
    const r = await api<{ row: Row; transcript: Transcript | null }>('GET', `/transcripts/${id}`)
    if (id !== tx.openId) return
    tx.row = r.row
    tx.transcript = r.transcript ?? tx.transcript
    tx.editing = tx.replacing = false
    if (hooks.shown()) redrawPage()
  } catch (error) {
    fault(error)
  }
}

// ---------------------------------------------------------------- the sound

/** The sound of the open transcript: one element kept outside the page, so a redraw never stops it. */
let audio: HTMLAudioElement | undefined
let audioId = ''
/** The utterance being heard. */
let heard = -1

function stopPlayer(): void {
  audio?.pause()
  audio?.removeAttribute('src')
  audio = undefined
  audioId = ''
  heard = -1
}

function soundOf(v: AppView, tr: Transcript): HTMLAudioElement {
  if (audio && audioId === tr.id) return audio
  stopPlayer()
  const a = new Audio(`http://127.0.0.1:${v.speech.port}/transcripts/${encodeURIComponent(tr.id)}/audio`)
  a.preload = 'metadata'
  const sync = () => {
    for (const p of document.querySelectorAll<HTMLElement>('.player')) {
      const playing = !a.paused
      p.classList.toggle('playing', playing)
      p.querySelector('.pp')?.replaceChildren(icon(playing ? 'debug-pause' : 'play'))
      const time = p.querySelector('.ptime')
      if (time) time.textContent = `${clock(a.currentTime)} / ${clock(tr.duration)}`
      const range = p.querySelector<HTMLInputElement>('.scrub')
      if (range && document.activeElement !== range) range.value = String(Math.round(a.currentTime * 10))
    }
    mark(tr, a.currentTime, !a.paused)
  }
  a.addEventListener('play', sync)
  a.addEventListener('pause', sync)
  a.addEventListener('timeupdate', sync)
  audio = a
  audioId = tr.id
  return a
}

function seek(at: number): void {
  if (!audio) return
  audio.currentTime = Math.max(0, at - 0.3)
  void audio.play()
}

const SPEEDS = [1, 1.25, 1.5, 2]

function player(v: AppView, tr: Transcript): HTMLElement {
  const a = soundOf(v, tr)
  const playing = !a.paused
  const range = el('input', { type: 'range', class: 'scrub', min: 0, max: Math.round(tr.duration * 10), value: Math.round(a.currentTime * 10), 'aria-label': t('tr.position') })
  range.addEventListener('input', () => (a.currentTime = Number(range.value) / 10))
  const speed = el('button', { class: 'speed', title: t('speech.speed') }, `${a.playbackRate}×`)
  speed.addEventListener('click', () => {
    const next = SPEEDS[(SPEEDS.indexOf(a.playbackRate) + 1) % SPEEDS.length] ?? 1
    a.playbackRate = next
    speed.textContent = `${next}×`
  })
  return el(
    'div',
    { class: playing ? 'player playing' : 'player' },
    el('button', { class: 'pp', title: t('tr.playSpace'), 'aria-label': t('tr.play'), onclick: () => (a.paused ? void a.play() : a.pause()) }, icon(playing ? 'debug-pause' : 'play')),
    el('span', { class: 'ptime' }, `${clock(a.currentTime)} / ${clock(tr.duration)}`),
    range,
    speed,
  )
}

/** The utterance being heard gets a mark, and comes into view while playing. */
function mark(tr: Transcript, at: number, follow: boolean): void {
  let lo = 0
  let hi = tr.utterances.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((tr.utterances[mid]?.start ?? 0) <= at + 0.3) (found = mid), (lo = mid + 1)
    else hi = mid - 1
  }
  if (found === heard) return
  heard = found
  document.querySelector('.utt.now')?.classList.remove('now')
  const node = document.querySelector<HTMLElement>(`.utt[data-i="${found}"]`)
  node?.classList.add('now')
  if (follow && node && !node.contains(document.activeElement)) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

// Space plays and pauses while a transcript is open and nothing is being typed.
window.addEventListener('keydown', event => {
  if (event.code !== 'Space' || !audio || !hooks.shown() || !tx.openId) return
  const target = event.target as HTMLElement
  if (target.isContentEditable || target.matches('input, textarea, select') || target.classList.contains('recording')) return
  event.preventDefault()
  if (audio.paused) void audio.play()
  else audio.pause()
})

// ---------------------------------------------------------------- following the engine

// The library and an unfinished transcript follow the engine's work.
window.setInterval(() => {
  const v = hooks.view()
  if (document.hidden || !v || !running(v) || !hooks.shown()) return
  if (!tx.openId || hooks.beside) void loadRows()
  if (tx.openId && tx.row && tx.row.status !== 'done') void loadTranscript()
  if (rec) void followLive()
}, 1500)

/** The page opened: the library is asked for at once. */
export function enterTranscripts(): void {
  if (tx.openId) void loadTranscript()
  else void loadRows()
}
