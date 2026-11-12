// The Notes page: everything the person keeps as words in one list (the dictated notes, the calls
// and recordings of the library, the knowledge base folder's Markdown files), a word found in all of
// it, and beside the list a conversation with the notes: a question is searched in all of them, the
// local model answers from the places found and cites them as [n] (ask.ts), a citation opens the
// note at that place. A transcript opens as the Transcripts page draws it (transcripts.ts); a file
// of the folder opens here, to be renamed, shown in its folder or moved to the trash.

import { CITE, cited, type NoteScope, type Passage, type Turn } from '../ask'
import { formatDate, t } from '../i18n'
import type { KbRow } from '../kbnotes'
import type { AppView, HostCall } from '../protocol'
import { el, icon } from './dom'
import { api, clock, installed, pickKb, problem, redrawPage, running, toast, type Row } from './speech'
import { meta, openTranscript, openedTranscript, snippet, transcriptsBody } from './transcripts'
import { btn, linkBtn, post, select } from './ui'

type Kind = 'note' | 'call' | 'kb'
type Item = { kind: Kind; title: string; created: string; about: string; snippet?: string; id?: string; file?: string }
/** One question of the conversation and what came of it. */
type Message = {
  question: string
  state: 'finding' | 'reading' | 'done' | 'nothing' | 'stopped' | 'error'
  found: Passage[]
  text: string
  error?: string
  /** Every place found is listed, not only those the answer cites. */
  all?: boolean
  stopping?: boolean
  /** When the model began to read the places: an answer long in coming says why it may be. */
  since?: number
}
type OpenFile = { path: string; title: string; created: string; text?: string; mark?: string; jump?: boolean; deleting?: boolean }

const ns = {
  rows: undefined as Row[] | undefined,
  files: undefined as KbRow[] | undefined,
  query: '',
  kind: 'all' as Kind | 'all',
  scope: 'all' as NoteScope,
  /** The one note the questions are about, when the person asked from an open note. */
  only: undefined as { id?: string; file?: string; title: string } | undefined,
  chat: [] as Message[],
  file: undefined as OpenFile | undefined,
  wasOpen: false,
  listTop: 0,
  logTop: 0,
  /** The conversation moved on: its end is shown after the next draw. */
  toEnd: false,
}

/** The right column's scrolling part: the conversation, or the note open. */
const scroller = (...children: (HTMLElement | null)[]) =>
  el('div', { class: 'nlog', id: 'nlog', 'aria-live': 'polite', onscroll: (event: Event) => (ns.logTop = (event.target as HTMLElement).scrollTop) }, ...children)
/** Another thing shows on the right: it starts from its top (the conversation, from its end). */
const turnTo = (chat = false) => ((ns.logTop = 0), (ns.toEnd = chat))

const host = <T>(request: HostCall) => window.tutorHost.call(request) as Promise<T>
const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
const KINDS: Record<Kind, string> = { note: t('notes.dictated'), call: t('notes.calls'), kb: t('notes.files') }

let findTimer = 0
/** An answer not here after this long: the page says a large model may not fit this computer's memory. */
const SLOW_MS = 20_000

async function load(): Promise<void> {
  const query = ns.query
  const [rows, kb] = await Promise.all([
    api<Row[]>('GET', `/transcripts?q=${encodeURIComponent(query)}`).catch(() => undefined),
    host<{ dir: string; files: KbRow[] }>({ call: 'kbList', query }).catch(() => undefined),
  ])
  if (query !== ns.query) return
  if (rows) ns.rows = rows
  ns.files = kb?.files ?? ns.files ?? []
  redrawPage()
}

/** The page opened: the list is read anew (a note dictated or a file added meanwhile is in it). */
export function enterNotes(): void {
  void load()
}

function items(): Item[] {
  const rows: Item[] = (ns.rows ?? []).map(r => ({ kind: r.source === 'note' ? 'note' : 'call', title: r.title, created: r.created, about: meta(r), snippet: r.snippet, id: r.id }))
  const files: Item[] = (ns.files ?? []).map(f => ({ kind: 'kb', title: f.title, created: f.created, about: `${formatDate(new Date(f.created), DAY)} · ${t('notes.file')}`, snippet: f.snippet, file: f.path }))
  return [...rows, ...files].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
}

// ---------------------------------------------------------------- the list

function openItem(item: Item): void {
  turnTo()
  if (item.file) return void openFile(item.file, item.title, item.created)
  ns.file = undefined
  openTranscript(item.id ?? '')
}

function listColumn(v: AppView): HTMLElement {
  const all = items()
  const field = el('input', {
    type: 'text',
    'data-live': 'notesFind',
    placeholder: t('notes.find'),
    'aria-label': t('notes.find'),
    value: ns.query,
    oninput: (event: Event) => {
      ns.query = (event.target as HTMLInputElement).value
      window.clearTimeout(findTimer)
      findTimer = window.setTimeout(() => void load(), 200)
    },
  })
  const count = (kind: Kind | 'all') => (kind === 'all' ? all.length : all.filter(i => i.kind === kind).length)
  const chips = (['all', 'note', 'call', 'kb'] as const).map(kind =>
    el(
      'button',
      { class: kind === ns.kind ? 'nchip on' : 'nchip', 'aria-pressed': String(kind === ns.kind), onclick: () => ((ns.kind = kind), (ns.listTop = 0), redrawPage()) },
      kind === 'all' ? t('notes.all') : KINDS[kind],
      el('span', { class: 'num' }, String(count(kind))),
    ),
  )
  const shown = ns.kind === 'all' ? all : all.filter(i => i.kind === ns.kind)
  const open = openedTranscript()?.id
  const line = (item: Item) => {
    const on = item.file ? item.file === ns.file?.path : !ns.file && !!item.id && item.id === open
    return el(
      'li',
      {},
      el(
        'button',
        { class: on ? 'ti on' : 'ti', 'aria-current': on ? 'true' : undefined, onclick: () => openItem(item) },
        el('span', { class: 'tm' }, el('b', {}, item.title), el('small', {}, item.about), item.snippet ? snippet(item.snippet) : null),
      ),
    )
  }
  const body: HTMLElement[] = []
  if (!ns.rows && !ns.files) body.push(el('p', { class: 'nnote' }, t('tr.opening')))
  else if (!shown.length) body.push(el('p', { class: 'nnote' }, t(ns.query ? 'tr.nothing' : 'notes.empty')))
  else if (ns.query) body.push(el('ul', { class: 'tl' }, ...shown.map(line)))
  else {
    // By when: today, the last seven days, everything before.
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const groups: [string, Item[]][] = [
      [t('notes.today'), shown.filter(i => new Date(i.created).getTime() >= today)],
      [t('notes.week'), shown.filter(i => new Date(i.created).getTime() < today && new Date(i.created).getTime() >= today - 6 * 86_400_000)],
      [t('notes.earlier'), shown.filter(i => new Date(i.created).getTime() < today - 6 * 86_400_000)],
    ]
    for (const [name, list] of groups) if (list.length) body.push(el('h3', { class: 'ngroup' }, name), el('ul', { class: 'tl' }, ...list.map(line)))
  }
  return el(
    'section',
    { class: 'ncol nside', 'aria-label': t('nav.notes') },
    el('div', { class: 'tools' }, el('label', { class: 'search' }, icon('search'), field)),
    el('div', { class: 'nchips' }, ...chips),
    ns.query && shown.length
      ? el('p', { class: 'nfound' }, t('notes.foundCount', { n: shown.length }), ' ', linkBtn(t('notes.askThis'), () => askFrom(`${t('tr.askStart4')} ${ns.query}`)))
      : null,
    el('div', { class: 'nlist', onscroll: (event: Event) => (ns.listTop = (event.target as HTMLElement).scrollTop) }, ...body),
    el('div', { class: 'nfoot' }, btn(t('notes.dictate'), () => post({ type: 'tray', command: 'note' })), ...(v.speech.health?.kbDir === '' ? [el('small', {}, t('tr.needKb')), linkBtn(t('tr.choose'), () => void pickKb().then(load))] : [])),
  )
}

// ---------------------------------------------------------------- a file of the folder

async function openFile(path: string, title: string, created: string, mark?: string): Promise<void> {
  if (openedTranscript()) openTranscript('')
  ns.file = { path, title, created, mark, jump: !!mark }
  redrawPage()
  try {
    const note = await host<{ title: string; created: string; text: string }>({ call: 'kbRead', path })
    if (ns.file?.path !== path) return
    ns.file = { ...ns.file, ...note }
  } catch (error) {
    if (ns.file?.path !== path) return
    ns.file = undefined
    toast(problem(error), undefined, true)
    void load()
  }
  redrawPage()
}

async function rename(file: OpenFile, name: string): Promise<void> {
  try {
    const path = await host<string>({ call: 'kbRename', path: file.path, name })
    if (ns.file?.path === file.path) ns.file = { ...ns.file, path, title: name }
    if (ns.only?.file === file.path) ns.only = { file: path, title: name }
  } catch (error) {
    toast(problem(error) === 'nameTaken' ? t('notes.nameTaken') : problem(error), undefined, true)
  }
  void load()
}

async function trash(file: OpenFile): Promise<void> {
  try {
    await host({ call: 'kbTrash', path: file.path })
    if (ns.only?.file === file.path) ns.only = undefined
    ns.file = undefined
    toast(t('notes.trashed'))
  } catch (error) {
    toast(problem(error), undefined, true)
  }
  void load()
}

/** The way back to the conversation, over an open note. */
const backLine = () =>
  el(
    'p',
    { class: 'nback' },
    linkBtn(t('notes.back'), () => {
      turnTo(true)
      ns.file = undefined
      if (openedTranscript()) openTranscript('')
      else redrawPage()
    }),
  )

/** The question's field under an open note: what is asked is asked of this note alone. */
function askOne(only: { id?: string; file?: string; title: string }): HTMLElement {
  const field = el('input', { type: 'text', 'data-live': 'notesAskOne', placeholder: t('notes.askOne'), 'aria-label': t('notes.askOne') })
  const form = el(
    'form',
    {
      class: 'nask',
      onsubmit: (event: Event) => {
        event.preventDefault()
        const question = field.value.trim()
        if (!question || busy()) return
        field.value = ''
        ns.only = only
        askFrom(question, true)
      },
    },
    el('label', { class: 'search' }, field),
    btn(t('tr.askBtn'), () => {}, 'primary'),
  )
  return form
}

function filePane(file: OpenFile): HTMLElement[] {
  const title = el('h2', {
    class: 'ttitle',
    contenteditable: 'plaintext-only',
    spellcheck: 'false',
    title: t('tr.rename'),
    onkeydown: (event: Event) => {
      const e = event as KeyboardEvent
      if (e.key === 'Enter') (e.preventDefault(), (e.target as HTMLElement).blur())
      if (e.key === 'Escape') (e.preventDefault(), ((e.target as HTMLElement).textContent = file.title), (e.target as HTMLElement).blur())
    },
    onblur: (event: Event) => {
      const node = event.target as HTMLElement
      const name = node.textContent?.trim() ?? ''
      if (name && name !== file.title) void rename(file, name)
      else node.textContent = file.title
    },
  })
  title.textContent = file.title
  const actions = file.deleting
    ? el('div', { class: 'confirm' }, el('small', {}, t('notes.trashAsk')), btn(t('notes.trash'), () => void trash(file), 'danger'), linkBtn(t('common.cancel'), () => ((file.deleting = false), redrawPage())))
    : el(
        'div',
        { class: 'confirm' },
        linkBtn(t('notes.open'), () => post({ type: 'openPath', path: file.path })),
        linkBtn(t('notes.show'), () => post({ type: 'showInFolder', path: file.path })),
        linkBtn(t('notes.copy'), () => void host({ call: 'copy', text: file.text ?? '' }).then(() => toast(t('tr.copied')))),
        linkBtn(t('notes.trash'), () => ((file.deleting = true), redrawPage())),
      )
  const text =
    file.text === undefined
      ? el('p', { class: 'nnote' }, t('tr.opening'))
      : el(
          'div',
          { class: 'ntext' },
          ...file.text.split(/\n\s*\n/).map(paragraph => el('p', { class: file.mark && paragraph.trim().startsWith(file.mark.slice(0, 200)) ? 'cited' : undefined }, paragraph.trim())),
        )
  if (file.jump && file.text !== undefined) {
    file.jump = false
    window.setTimeout(() => document.querySelector('.ntext .cited')?.scrollIntoView({ block: 'center' }), 0)
  }
  return [
    backLine(),
    el('div', { class: 'thead' }, title, el('small', { class: 'tmeta' }, `${formatDate(new Date(file.created), DAY)} · ${t('notes.file')}`)),
    actions,
    scroller(text),
    askOne({ file: file.path, title: file.title }),
  ]
}

// ---------------------------------------------------------------- the conversation

const busy = () => ns.chat.some(m => m.state === 'finding' || m.state === 'reading')

/** Asks from outside the field (a found word, an open note): the conversation shows, and the question goes. */
function askFrom(question: string, now = false): void {
  turnTo(true)
  ns.file = undefined
  if (openedTranscript()) openTranscript('')
  if (now) return void ask(question)
  redrawPage()
  window.setTimeout(() => {
    const field = document.querySelector<HTMLInputElement>('input[data-live="notesAsk"]')
    if (!field) return
    field.value = question
    field.focus()
  }, 0)
}

async function ask(question: string): Promise<void> {
  const before = ns.chat.filter(m => m.state === 'done')
  const turns: Turn[] = before.map(m => ({ question: m.question, answer: m.text }))
  const m: Message = { question, state: 'finding', found: [], text: '' }
  ns.chat.push(m)
  const draw = () => ((ns.toEnd = true), redrawPage())
  draw()
  try {
    m.found = await host<Passage[]>({ call: 'findPassages', question, scope: ns.only ? 'all' : ns.scope, only: ns.only && { id: ns.only.id, file: ns.only.file }, before: before.at(-1)?.question })
    if (m.stopping) return
    if (!m.found.length) m.state = 'nothing'
    else {
      m.state = 'reading'
      m.since = Date.now()
      window.setTimeout(redrawPage, SLOW_MS + 100)
      draw()
      const text = await host<string>({ call: 'answerNotes', question, passages: m.found, before: turns })
      if (m.stopping) return
      m.text = text
      m.state = m.text ? 'done' : 'nothing'
    }
  } catch (error) {
    if (m.stopping) return
    m.state = 'error'
    m.error = problem(error) === 'needModel' ? t('tr.askNeedModel') : problem(error)
  }
  draw()
}

/** Stop: the page says so at once (a large model may still be loading, and a load cannot be ended); what comes later is dropped. */
function stop(m: Message): void {
  m.stopping = true
  m.state = 'stopped'
  void host({ call: 'stopAnswer' })
  redrawPage()
}

function openSource(p: Passage): void {
  turnTo()
  if (p.file) return void openFile(p.file, p.title, p.created, p.text)
  ns.file = undefined
  openTranscript(p.id, p.at)
}

const sourceAbout = (p: Passage) =>
  [p.file ? t('notes.file') : p.source === 'note' ? t('tr.srcNote') : '', formatDate(new Date(p.created), DAY), p.file || p.source === 'note' ? '' : clock(p.at)].filter(Boolean).join(' · ')

function answer(m: Message): HTMLElement {
  if (m.state === 'finding' || m.state === 'reading')
    return el(
      'div',
      { class: 'nwait' },
      el('i', { class: 'dot pulse' }),
      m.state === 'finding' ? t('notes.finding') : t('notes.reading', { n: m.found.length }),
      btn(t('notes.stop'), () => stop(m)),
      m.state === 'reading' && Date.now() - (m.since ?? Date.now()) >= SLOW_MS ? el('small', { class: 'nslow' }, t('notes.slow')) : null,
    )
  if (m.state !== 'done') return el('p', { class: 'nnote' }, m.state === 'nothing' ? t('notes.nothingFound') : m.state === 'stopped' ? t('notes.stopped') : (m.error ?? ''))
  const text = el('div', { class: 'nanswer' })
  let last = 0
  for (const c of m.text.matchAll(CITE)) {
    const p = m.found[Number(c[1]) - 1]
    text.append(m.text.slice(last, c.index), p ? el('button', { class: 'cite', onclick: () => openSource(p) }, c[1] as string) : c[0])
    last = (c.index ?? 0) + c[0].length
  }
  text.append(m.text.slice(last))
  const used = cited(m.text, m.found.length)
  const listed = m.all || !used.length ? m.found.map((_, i) => i + 1) : used
  return el(
    'div',
    { class: 'nturn' },
    el('small', { class: 'ncount' }, t('notes.count', { found: m.found.length, used: used.length })),
    text,
    el('small', { class: 'ncount' }, t('notes.sources')),
    el(
      'ul',
      { class: 'nsources' },
      ...listed.map(n => {
        const p = m.found[n - 1]!
        return el(
          'li',
          {},
          el('button', { class: 'nsource', onclick: () => openSource(p) }, el('span', { class: 'num' }, String(n)), el('span', { class: 'tm' }, el('b', {}, p.title, el('small', {}, ` · ${sourceAbout(p)}`)), el('span', { class: 'snip' }, p.text.slice(0, 160)))),
        )
      }),
    ),
    el(
      'div',
      { class: 'confirm' },
      linkBtn(t('notes.copyAnswer'), () => void host({ call: 'copy', text: m.text.replace(CITE, '').replace(/ +([.,;:])/g, '$1') }).then(() => toast(t('common.copied')))),
      used.length && used.length < m.found.length ? linkBtn(m.all ? t('notes.showUsed') : t('notes.showAll', { n: m.found.length }), () => ((m.all = !m.all), redrawPage())) : null,
    ),
  )
}

function chatPane(): HTMLElement[] {
  const field = el('input', { type: 'text', 'data-live': 'notesAsk', placeholder: t('notes.askField'), 'aria-label': t('notes.askField') })
  const form = el(
    'form',
    {
      class: 'nask',
      onsubmit: (event: Event) => {
        event.preventDefault()
        // The field kept across redraws is the one on the page: this one may be its fresh twin.
        const live = document.querySelector<HTMLInputElement>('input[data-live="notesAsk"]') ?? field
        const question = live.value.trim()
        if (!question || busy()) return
        live.value = ''
        void ask(question)
      },
    },
    el('label', { class: 'search' }, field),
    btn(t('tr.askBtn'), () => {}, 'primary'),
  )
  const starts = el(
    'div',
    { class: 'confirm' },
    ...(['tr.askStart1', 'tr.askStart2', 'tr.askStart3', 'tr.askStart4'] as const).map(key =>
      linkBtn(`${t(key)}…`, () => {
        const live = document.querySelector<HTMLInputElement>('input[data-live="notesAsk"]') ?? field
        live.value = `${t(key)} `
        live.focus()
      }),
    ),
  )
  const where = ns.only
    ? el('span', { class: 'nwhere' }, t('notes.onlyIn', { title: ns.only.title }), ' ', linkBtn(t('notes.everywhere'), () => ((ns.only = undefined), redrawPage())))
    : el(
        'span',
        { class: 'nwhere' },
        t('notes.where'),
        select<NoteScope>(ns.scope, [['all', t('notes.scopeAll')], ['note', t('notes.scopeNote')], ['call', t('notes.scopeCall')], ['kb', t('notes.scopeKb')]], scope => ((ns.scope = scope), redrawPage())),
      )
  return [
    el(
      'header',
      { class: 'nhead' },
      el('div', {}, el('h2', {}, t('notes.askTitle')), el('small', {}, t('notes.askNote'))),
      where,
      ns.chat.length ? btn(t('notes.newChat'), () => (ns.chat.filter(m => m.state === 'finding' || m.state === 'reading').forEach(stop), (ns.chat = []), redrawPage())) : null,
    ),
    scroller(el('div', { class: 'nturns' }, ...ns.chat.flatMap(m => [el('p', { class: 'nq' }, m.question), answer(m)]))),
    starts,
    form,
  ]
}

// ---------------------------------------------------------------- the page

export function notesBody(v: AppView): HTMLElement[] {
  // Without the engine there is no library and no folder to read: the Transcripts page's own words say what to do.
  if (!installed(v) || !running(v)) return transcriptsBody(v)
  const opened = openedTranscript()
  // A transcript closed (renamed or deleted, maybe, while it was open): the list is read again.
  if (ns.wasOpen && !opened) void load()
  ns.wasOpen = !!opened
  const right = ns.file ? filePane(ns.file) : opened ? [backLine(), scroller(...transcriptsBody(v)), askOne(opened)] : chatPane()
  // The columns are drawn anew each time: each keeps the place it was scrolled to, the conversation its end when it moved on.
  window.setTimeout(() => {
    const list = document.querySelector('.nlist')
    if (list) list.scrollTop = ns.listTop
    const log = document.getElementById('nlog')
    if (log) log.scrollTop = ns.toEnd ? log.scrollHeight : ns.logTop
    ns.toEnd = false
  }, 0)
  return [el('div', { class: 'notes' }, listColumn(v), el('section', { class: 'ncol nmain' }, ...right))]
}
