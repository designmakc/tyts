// The card: two halves, a text on top and its other side under it, each with
// Copy under it (halves.ts); Listen and Translate differ in their buttons.
// Listen: the English on top, read aloud, with a remote that highlights the
// spoken sentence and word from a cursor the arrows move; "one by one" reads
// a sentence and waits; each paragraph has its own play button in the margin.
// Translate: the text as it is in a field the person edits, translated into
// any language, Swap and Paste; ▶ Listen reads its English half when pressed.
// Check: the person's English in the same field, under it the text with its
// mistakes struck out and set right, and the main one said in their language.
// In either, a click on an English word shows its meanings (Shift+hover too),
// a dotted line marks the rarer ones, and a click on a sentence marks its
// other side. The HTML of the halves arrives rendered from the main process.

import { hotkeyLabel } from '../hotkey'
import { findLanguage, labelCode, langCode, voiceMatches } from '../languages'
import { chosenNatural } from '../natural'
import { languageName as uiLanguageName, levelName, t, type Key } from '../i18n'
import { updateSentences } from './sweep'
import type { BusyPart, CardKind, CardState, CardView, CheckResult, DiffPart, HostVoice, NaturalState, TextResult, ToHost, ToView, TranslationState, TutorHost, ViewConfig } from '../protocol'
import { dwmFlag, el, html, icon } from './dom'
import { glyph } from './glyphs'
import { fieldText, halfBar, paint, plainOf, rangeIndexAt, sentenceRanges } from './halves'
import { caretAt, WordHover } from './hover'
import { Player } from './player'
import { markRare } from './rare'
import { canOpenSpeechSettings, voiceSteps } from './voices'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

dwmFlag()

const post = (message: ToHost) => window.tutorHost.post(message)

const state = {
  card: undefined as CardView | undefined,
  config: { voice: '', rate: 1, wordHint: 'shift', rareWords: true, oneAtATime: false } as ViewConfig,
  /** The most common English words: the others get a dotted line. */
  common: new Set<string>(),
  pinned: false,
  /** The card fills the screen's work area. */
  maximized: false,
  /** The translation under the English; the native-language button hides it. */
  showTranslation: true,
  hostVoices: undefined as HostVoice[] | undefined,
  hostCanSpeak: false,
  platform: '',
  webVoices: [] as SpeechSynthesisVoice[],
  natural: undefined as NaturalState | undefined,
  /** The person pressed Listen: the natural voice is offered from then on. */
  listened: false,
  naturalJustReady: false,
  /** The card whose text is on screen, and the last one read aloud by itself. */
  shownId: -1,
  readId: -1,
  /** The English sentence Listen starts from, and the first sentence of the reading under way (-1: a word, not the text). */
  cursor: 0,
  readFrom: -1,
  reading: '' as string,
  /** The text card whose text is in the field: later messages for it keep the person's edits and languages. */
  textId: -1,
}

// ---------------------------------------------------------------- voices

function targetCode(): string {
  return langCode(state.card?.target ?? 'English')
}

function webVoice(): SpeechSynthesisVoice | undefined {
  const named = state.config.voice ? state.webVoices.find(v => v.name === state.config.voice) : undefined
  if (named) return named
  if (state.config.voice && state.hostVoices?.some(v => v.name === state.config.voice)) return undefined
  const matching = state.webVoices.filter(v => voiceMatches(v.lang, targetCode()))
  return matching.find(v => v.localService) ?? matching[0]
}

function hasVoice(): boolean {
  const code = targetCode()
  if (code === 'en' && state.natural?.status === 'ready') return true
  if (state.webVoices.some(v => voiceMatches(v.lang, code))) return true
  if (state.hostVoices === undefined) return true
  return state.hostCanSpeak && state.hostVoices.some(v => voiceMatches(v.lang, code))
}

function naturalVoice(): string | undefined {
  if (targetCode() !== 'en' || state.natural?.status !== 'ready') return undefined
  return chosenNatural(state.config.voice)?.id
}

// Chromium starts audio on a gesture unless told otherwise; the main process tells it otherwise.
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
    lang: () => targetCode(),
    voice: webVoice,
    rate: () => state.config.rate,
    hostCanSpeak: () => state.hostCanSpeak,
    natural: naturalVoice,
    audio: () => openAudio(),
    naturalFailed: message => showHint([t('card.naturalStopped', { message })], 10_000),
    entered: index => {
      // The field's sentence being read, marked where the person typed it.
      if (state.reading === 'src') return paint('reading', readRanges[index])
      if (state.readFrom < 0) return
      state.cursor = state.readFrom + index
      markCursor()
    },
    // The whole text read through: Listen starts over. One by one, the cursor stays for a repeat.
    finished: () => {
      if (state.reading === 'card' && !state.config.oneAtATime) state.cursor = 0
      markCursor()
    },
  },
  () => updatePlayButtons(),
)

// ---------------------------------------------------------------- skeleton

/** The key that called the card, as lit keycaps ("Control+C*2": Ctrl C ×2); the function's name follows it. */
function viaKeys(via: string | undefined): HTMLElement | null {
  if (!via) return null
  const parts = via.split('+').filter(Boolean)
  const twice = parts.some(p => p.endsWith('*2'))
  const keys = parts.map(p => hotkeyLabel(p.replace(/\*2$/, '')))
  return el(
    'span',
    { class: 'via', title: t(twice ? 'card.openedByTwice' : 'card.openedBy', { keys: keys.join('+') }) },
    ...keys.map(k => el('span', { class: 'key lit' }, k)),
    twice ? el('span', { class: 'x2' }, '×2') : null,
  )
}

const root = document.getElementById('root') as HTMLDivElement

const kindLabel = el('span', { class: 'card-kind' })
const translationButton = el('button', { class: 'toggle', 'aria-pressed': 'true', onclick: () => toggleTranslation() }, 'RU')
const pinButton = el('button', { class: 'icon-btn', 'aria-pressed': 'false', onclick: () => togglePin() }, glyph('pin'))
// The card fills the screen and goes back; main says which it is (a double click on the bar does the same).
const maximizeButton = el('button', { class: 'icon-btn', 'aria-pressed': 'false', onclick: () => post({ type: 'maximize', on: !state.maximized }) }, glyph('maximize'))
const closeButton = el('button', { class: 'icon-btn', title: `${t('common.close')} (Esc)`, 'aria-label': t('common.close'), onclick: () => post({ type: 'close' }) }, glyph('close'))
const header = el('header', { class: 'bar' }, kindLabel, el('span', { class: 'grow' }), translationButton, pinButton, maximizeButton, closeButton)

const voiceText = el('span', { class: 'banner-text' })
const voiceButton = el('button', { class: 'primary-btn', onclick: () => downloadNatural() })
const voiceClose = el(
  'button',
  {
    class: 'icon-btn',
    title: t('common.notNow'),
    'aria-label': t('common.notNow'),
    onclick: () => {
      if (state.natural?.status === 'ready') state.naturalJustReady = false
      else post({ type: 'dismissNatural' })
      renderVoiceBanner()
    },
  },
  icon('close'),
)
const voiceBanner = el('div', { class: 'banner voice-banner', hidden: true }, voiceText, voiceButton, voiceClose)

/**
 * Fast translated it, the local model too slow just now (another program on
 * the graphics card or the processor, 2026-10-31): said in the card, with the
 * model offered for this text, however long it takes.
 */
function busyNotice(): { box: HTMLElement; show(busy: BusyPart | undefined): void } {
  const text = el('span', { class: 'banner-text' })
  const button = el('button', { class: 'quiet-btn', onclick: () => state.card && post({ type: 'waitForModel', id: state.card.id }) })
  const box = el('div', { class: 'banner busy-banner', role: 'status', hidden: true }, el('span', { class: 'dot', 'aria-hidden': 'true' }), text, button)
  return {
    box,
    show(busy) {
      const level = state.card?.level ?? 'fast'
      box.hidden = !busy || level === 'fast'
      if (!busy || level === 'fast') return
      text.textContent = t(busy === 'card' ? 'card.busyCard' : 'card.busyProcessor', { level: levelName(level) })
      button.textContent = t('card.useAnyway', { level: levelName(level) })
    },
  }
}
const listenBusy = busyNotice()
const textBusy = busyNotice()

const stateView = el('div', { class: 'empty', hidden: true })
// The English half: its words open the word card.
const body = el('div', { class: 'body', 'data-words': true })
const listenButton = el('button', { class: 'listen', 'data-play': 'message', 'data-key': 'card' }, glyph('play'), el('span', { class: 'listen-label' }, t('common.listen')))
const prevButton = el('button', { class: 'icon-btn', title: `${t('card.prev')} (←)`, 'aria-label': t('card.prev'), onclick: () => step(-1) }, glyph('prev'))
const nextButton = el('button', { class: 'icon-btn', title: `${t('card.next')} (→)`, 'aria-label': t('card.next'), onclick: () => step(1) }, glyph('next'))
const oneButton = el('button', { class: 'chip', 'aria-pressed': 'false', onclick: () => toggleOneAtATime() }, t('card.oneByOne'))
// The keyboard is the interface: Space's job, next to the buttons it stands for.
const spaceLabel = el('span', { class: 'kl' }, t('card.spaceListen'))
const spaceHint = el('span', { class: 'space-hint', 'aria-hidden': 'true' }, spaceLabel, el('span', { class: 'key' }, 'Space'))
const translation = el('div', { class: 'translation' })
// The translation's Copy, once there is one.
const translationBar = halfBar([copyButton(() => plainOf(translation))], [])
const remote = el('div', { class: 'remote' }, spaceHint, prevButton, listenButton, nextButton, oneButton)
// What the card has to say of its text (a long one translated in part).
const note = el('footer', { class: 'card-foot', hidden: true })
const article = el(
  'article',
  { class: 'msg assistant' },
  body,
  halfBar([copyButton(() => plainOf(body))], [remote]),
  el('section', { class: 'lower' }, translation, translationBar, listenBusy.box),
)
const list = el('main', { class: 'list', hidden: true }, article, note)

/** After an edit, the text is translated again once typing pauses this long. */
const RETRANSLATE_MS = 700

// The translator: the text in a field (fixed by hand, as Windows misreads some letters), Copy, the two languages and Swap, the translation under them with Copy and Paste.
let retranslate: number | undefined
/** Paste was pressed while the translation was still coming: it is pasted once in. */
let pasteWhenReady = false
/** The focus was moved by Tab: a button reached so keeps its own Enter; one only clicked stays focused (into the next card too) and Enter still pastes. */
let focusByTab = false
/** The text last sent to be translated: its translation, once in, finds the field's sentences. */
let sentText = ''
/** The field's sentences as ranges, numbered as the translation's; none while the text differs from the one translated. */
let fieldRanges: (Range | undefined)[] | undefined
/** The ranges of the field's sentences being read aloud, in the reading's order. */
let readRanges: (Range | undefined)[] = []
// Plain text only, so the caret stays where it is: the dotted words and the marks are highlights over it.
const textField = el('div', {
  class: 'text-field',
  contenteditable: 'plaintext-only',
  role: 'textbox',
  'aria-multiline': 'true',
  spellcheck: 'false',
  dir: 'auto',
  'aria-label': t('card.text'),
  // An edit: the marks and the word card go, the reading stops, and the text is translated again once typing pauses.
  oninput: () => {
    updateTextButtons()
    pasteWhenReady = false
    hover.hide()
    stopTextReading()
    unmarkField()
    window.clearTimeout(retranslate)
    retranslate = window.setTimeout(() => {
      retranslate = undefined
      translateText()
    }, RETRANSLATE_MS)
  },
  // Enter pastes, as a chat sends; Shift+Enter is a new line.
  onkeydown: event => {
    const key = event as KeyboardEvent
    if (key.key === 'Enter' && !key.shiftKey && canPaste()) {
      key.preventDefault()
      // An Enter held down repeats: it pastes once.
      if (!key.repeat) paste()
    }
  },
})
const textCopy = copyButton(() => fieldText(textField))
const textListen = listenText('src')
const fromSelect = el('select', { 'aria-label': t('card.from'), title: t('card.fromTitle'), onchange: () => pickLanguage('from') })
const toSelect = el('select', { 'aria-label': t('card.into'), title: t('card.intoTitle'), onchange: () => pickLanguage('to') })
const swapButton = el('button', { class: 'swap-btn', title: t('card.swapTitle'), onclick: () => swapLanguages() }, icon('arrow-swap'), el('span', {}, t('card.swap')))
/** A list of languages drawn as a pill: the select itself, its arrow over it. */
const pill = (select: HTMLSelectElement) => el('span', { class: 'select-pill' }, select, icon('chevron-down'))
const textLangs = el('span', { class: 'text-langs' }, pill(fromSelect), el('span', { class: 'to', 'aria-hidden': 'true' }, '→'), pill(toSelect), swapButton)
const textResult = el('div', { class: 'text-result', hidden: true })
// Nothing leaves the computer, and the card says so where the translation is made.
const textFoot = el('footer', { class: 'card-foot' })
const textView = el(
  'main',
  { class: 'text-view', hidden: true },
  textField,
  halfBar([textCopy, textListen], [textLangs]),
  textResult,
  textBusy.box,
  textFoot,
)
const hint = el('div', { class: 'toast', role: 'status', hidden: true })

root.append(header, voiceBanner, stateView, list, textView, hint)

const hover = new WordHover({
  host: root,
  area: root,
  post,
  sentenceAt: range => (fieldRanges ? fieldRanges[rangeIndexAt(fieldRanges, range.startContainer, range.startOffset)]?.toString() : undefined),
  nativeName: () => (state.card?.native ? uiLanguageName(state.card.native) : t('lang.yours')),
  mode: () => state.config.wordHint,
  // A word alone, read by the same voice as the text; the text's reading stops for it.
  speak: word => {
    state.readFrom = -1
    state.reading = 'word'
    if (!hasVoice() || !player.play('word', [el('span', {}, word)])) noVoiceHint()
  },
})

/** The English halves on screen: Listen's upper one; the translator's field (once its sentences are found) and translation, when in English. */
function englishHalves(): Element[] {
  if (!list.hidden) return [body]
  if (textView.hidden) return []
  return [...(fieldRanges && textField.hasAttribute('data-words') ? [textField] : []), ...textResult.querySelectorAll('.text-out[data-words]')]
}

function markRareWords(): void {
  markRare(englishHalves(), state.common, state.config.rareWords)
}

// The window is as tall as the card's content, with the page's border above and below; a maximized card fills the screen instead
// (its page as tall as the window), so its height says nothing until it is restored.
function postHeight(): void {
  if (!state.maximized) post({ type: 'height', px: Math.ceil(document.body.getBoundingClientRect().height) + 2 })
}
new ResizeObserver(() => postHeight()).observe(document.body)

// ---------------------------------------------------------------- rendering

function downloadNatural(): void {
  if (state.natural) state.natural = { ...state.natural, status: 'downloading', progress: 0 }
  post({ type: 'downloadNatural' })
  renderVoiceBanner()
}

function renderVoiceBanner(): void {
  const n = state.natural
  const shown =
    !!n &&
    n.status !== 'unsupported' &&
    targetCode() === 'en' &&
    // The translator reads only when asked: its offer waits for a Listen.
    (!translator(state.card) || state.listened) &&
    (n.status === 'ready' ? state.naturalJustReady : n.status === 'downloading' || (state.listened && !n.dismissed))
  voiceBanner.hidden = !shown
  if (!shown || !n) return
  voiceButton.hidden = n.status !== 'absent' && n.status !== 'failed'
  voiceClose.hidden = n.status === 'downloading'
  switch (n.status) {
    case 'absent':
      voiceText.textContent = t('card.voiceOffer')
      voiceButton.textContent = t('card.voiceDownload', { size: n.size })
      return
    case 'failed':
      voiceText.textContent = t('card.voiceFailed')
      voiceButton.textContent = t('common.retry')
      return
    case 'downloading':
      voiceText.textContent = t('card.voiceDownloading', { pct: Math.round(n.progress * 100) })
      return
    case 'ready':
      voiceText.textContent = t('card.voiceReady')
      return
  }
}

/** The header's name for the card: its function, and the screen when the text was read from it. */
const KINDS: Record<CardKind, [Key, Key?]> = {
  selection: ['kind.listen'],
  screenshot: ['kind.listen', 'kind.screen'],
  translate: ['kind.translate'],
  text: ['kind.translate', 'kind.screen'],
  check: ['kind.check'],
  explain: ['kind.explain'],
  rewrite: ['kind.rewrite'],
}

/** The kinds with the text as it is in a field, and its other side under it: the translator's, and Check my English. */
const translator = (c: CardView | undefined) => c?.kind === 'translate' || c?.kind === 'text' || c?.kind === 'check' || c?.kind === 'explain' || c?.kind === 'rewrite'

/** Check my English: the field is the person's English, checked instead of translated. */
const checking = () => state.card?.kind === 'check'

function renderChrome(): void {
  const c = state.card
  const [kindName, source] = KINDS[c?.kind ?? 'selection']
  kindLabel.replaceChildren(viaKeys(c?.via) ?? '', el('span', { class: 'kind-name' }, t(kindName), source ? el('span', { class: 'kind-source' }, ` · ${t(source)}`) : null))
  // The translator has no translation under an English text to hide.
  translationButton.hidden = translator(c)
  translationButton.textContent = labelCode(c?.native)
  translationButton.setAttribute('aria-pressed', String(state.showTranslation))
  translationButton.title = t(state.showTranslation ? 'card.hideTranslation' : 'card.showTranslation', { lang: uiLanguageName(c?.native ?? '') })
  pinButton.setAttribute('aria-pressed', String(state.pinned))
  pinButton.title = state.pinned ? t('card.unpin') : t('card.pin')
  renderMaximized()
  document.body.classList.toggle('no-translation', !state.showTranslation)
  oneButton.setAttribute('aria-pressed', String(state.config.oneAtATime))
  oneButton.title = state.config.oneAtATime ? t('card.oneOn') : t('card.oneOff')
  document.body.classList.toggle('no-voice', !hasVoice())
  renderVoiceBanner()
  updatePlayButtons()
}

function status(text: string): HTMLElement {
  return el('p', { class: 'empty-text status-line' }, icon('loading', 'codicon-modifier-spin'), text)
}

/** Translating, with the level's name unless it is Fast; Fast's while the model is too slow. */
function translating(): string {
  const level = state.card?.level ?? 'fast'
  if (state.card?.busy && level !== 'fast') return t('card.translatingFast')
  return level === 'fast' ? t('card.translating') : t('card.translatingLevel', { level: levelName(level) })
}

/** 1.4 of 84 MB; 1.2 of 2.5 GB. */
const amount = (mb: number, of: number) => (of >= 1000 ? t('card.ofGb', { a: (mb / 1000).toFixed(1), b: (of / 1000).toFixed(1) }) : t('card.ofMb', { a: mb.toFixed(1), b: of }))

/** A first use: the translator for a pair (Fast), or the local model (a level's, the checker's: the same one) comes once, with how much of it is in and what happens meanwhile. */
function downloading(pair: string, progress: number, size: number, meanwhile = ''): HTMLElement {
  const level = state.card?.level ?? 'fast'
  const s = state.card?.state
  const model = s?.status === 'check' ? s.model : undefined
  const done = Math.min(1, Math.max(0, progress))
  const bar = el('i')
  bar.style.width = `${(done * 100).toFixed(1)}%`
  return el(
    'div',
    { class: 'download', role: 'status' },
    el('div', { class: 'kl' }, t('card.firstUse')),
    el(
      'div',
      { class: 'download-head' },
      el('b', {}, model ? t('card.modelOf', { name: model }) : level === 'fast' ? t('card.translatorPair', { pair }) : t('card.modelOf', { name: levelName(level) })),
      el('span', { class: 'kl' }, amount(done * size, size)),
    ),
    el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(done * 100) }, bar),
    el('p', {}, `${t(model ? 'card.fromHfChecks' : level === 'fast' ? 'card.fromMozilla' : 'card.fromHfTranslates')}${meanwhile ? ' ' + meanwhile : ''}`),
  )
}

function failed(message: string, retry: () => void = () => post({ type: 'retry' })): HTMLElement[] {
  return [
    el('p', { class: 'empty-title' }, checking() ? t('card.notChecked') : t('card.notTranslated')),
    el('p', { class: 'empty-text' }, message),
    el('p', {}, el('button', { class: 'primary-btn', onclick: () => retry() }, t('common.tryAgain'))),
  ]
}

/** The lower half; the same translation is left as it is, so a mark on it stays, and a draft becomes the accurate one sentence by sentence (sweep.ts). */
function renderTranslation(c: CardView, tr: TranslationState): void {
  translationBar.hidden = tr.status !== 'ready'
  listenBusy.show(tr.status === 'ready' ? tr.busy : undefined)
  if (tr.status === 'ready') {
    if (translation.dataset.html === tr.html) return
    const next = html(tr.html)
    if (!translation.dataset.html || !updateSentences(translation, next, markRareWords)) translation.replaceChildren(next)
    translation.dataset.html = tr.html
    return
  }
  delete translation.dataset.html
  switch (tr.status) {
    case 'translating':
      translation.replaceChildren(status(translating()))
      return
    case 'downloading':
      translation.replaceChildren(downloading(pairName(c.native), tr.progress, tr.size, t('card.readMeanwhile')))
      return
    case 'failed':
      translation.replaceChildren(...failed(tr.message))
      return
  }
}

function renderState(): void {
  const c = state.card
  const s = c?.state
  const done = s?.status === 'done'
  const text = s?.status === 'text' || s?.status === 'check'
  list.hidden = !done
  textView.hidden = !text
  stateView.hidden = done || text || !s
  if (!c || !s) return
  if (s.status === 'text' || s.status === 'check') {
    renderText(c, s)
    return
  }
  if (s.status === 'done') {
    // The English stays as it is while its translation comes in: the voice reads on.
    if (state.shownId !== c.id || body.dataset.html !== s.html) {
      if (player.reads(body)) player.stop()
      body.replaceChildren(html(s.html))
      body.dataset.html = s.html
      addParagraphButtons()
      hover.refresh()
    }
    renderTranslation(c, s.translation)
    hover.refresh()
    note.textContent = s.note ?? ''
    note.hidden = !s.note
    if (state.shownId !== c.id) window.scrollTo({ top: 0 })
    state.shownId = c.id
    autoRead(c)
    return
  }
  state.shownId = c.id
  switch (s.status) {
    case 'reading':
      stateView.replaceChildren(status(t('card.readingScreen')))
      return
    case 'translating':
      stateView.replaceChildren(status(translating()))
      return
    case 'downloading':
      stateView.replaceChildren(downloading(pairName(c.native), s.progress, s.size))
      return
    case 'empty':
      stateView.replaceChildren(
        el('p', { class: 'empty-title' }, t('card.noText')),
        el('p', { class: 'empty-text' }, t('card.noTextNote')),
      )
      return
    case 'no-ocr':
      stateView.replaceChildren(
        el('p', { class: 'empty-title' }, t('card.noOcr')),
        el(
          'p',
          { class: 'empty-text' },
          t('card.noOcrNote', { lang: uiLanguageName(c.native) }),
        ),
        el('p', {}, el('button', { class: 'primary-btn', onclick: () => post({ type: 'openLanguageSettings' }) }, t('card.openLanguageSettings'))),
      )
      return
    case 'failed':
      stateView.replaceChildren(...failed(s.message))
      return
    case 'explain':
      // The selection quoted, then the answer: selectable, so a rewrite with nowhere to go can be copied.
      stateView.replaceChildren(
        el('p', { class: 'empty-text' }, s.text),
        s.answer ? el('p', { class: s.failed ? 'empty-title' : 'explain-answer' }, s.answer) : status(t('card.explaining')),
      )
      return
  }
}

// ---------------------------------------------------------------- text card

function languageName(code: string): string {
  return findLanguage(code) ? uiLanguageName(code) : code.toUpperCase()
}

/** "Ukrainian ⇄ English", in the interface's language. */
const pairName = (nameOrCode: string) => t('lang.pairEnglish', { lang: uiLanguageName(nameOrCode) })

/**
 * A text card. The field and the two languages are filled once per card: a
 * later message for it (the translation coming in) keeps what the person
 * typed, the caret and the languages picked. The result follows the state.
 */
function renderText(c: CardView, s: Extract<CardState, { status: 'text' | 'check' }>): void {
  if (state.textId !== c.id) {
    state.textId = c.id
    lastOut = undefined
    lastCheck = undefined
    pasteWhenReady = false
    focusByTab = false
    window.clearTimeout(retranslate)
    retranslate = undefined
    setFieldText(s.text)
    textLangs.hidden = s.status === 'check'
    textField.setAttribute('aria-label', s.status === 'check' ? t('card.yourEnglish') : t('card.text'))
    textField.dataset.placeholder = s.status === 'check' ? t('card.typeEnglish') : ''
    if (s.status === 'text') fillLanguages(s.languages, s.from, s.to, s.mine ?? [])
    syncLanguages()
    delete textResult.dataset.key
    hover.hide()
    window.scrollTo({ top: 0 })
  }
  state.shownId = c.id
  if (s.status === 'check') renderCheckResult(s.result, !!s.canPaste)
  else renderTextResult(s.result, !!s.canPaste)
  textBusy.show(s.status === 'text' && s.result.status === 'ready' ? s.result.busy : undefined)
  hover.refresh()
  const improving = s.status === 'text' && s.result.status === 'ready' && !!s.result.drafts
  // Fast did it, the local model too slow just now: the notice above says why.
  const busy = s.status === 'text' && s.result.status === 'ready' && !!s.result.busy
  const by = s.status === 'check' ? t('card.checkedBy', { model: s.model }) : improving ? t('card.improving', { level: levelName(c.level) }) : t('card.translatedBy', { level: levelName(busy ? 'fast' : c.level) })
  const long = s.status === 'text' && s.result.status === 'ready' && !!s.result.rest
  textFoot.textContent = long ? t('card.longText') : s.canPaste ? t('card.newLine', { by }) : by
  // Said under a translation, or one on its way; not under nothing, or a failure.
  textFoot.hidden = s.result.status === 'none' || s.result.status === 'failed'
  updateTextButtons()
}

/** The field's text, put in by the card (a new text, or Swap): its marks go with the old one. */
function setFieldText(text: string): void {
  textField.textContent = text
  sentText = text
  unmarkField()
}

/** The field's marks (pairs, the sentence read, dotted words), dropped while its text is not the one translated. */
function unmarkField(): void {
  fieldRanges = undefined
  paint('pair')
  paint('reading')
  for (const marked of textView.querySelectorAll('.pair')) marked.classList.remove('pair')
  markRareWords()
}

/** What the languages decide: the field's language, and whether its words are English ones to click and read. */
function syncLanguages(): void {
  const english = checking() || fromSelect.value === 'en'
  textField.lang = checking() ? 'en' : fromSelect.value
  textField.toggleAttribute('data-words', english)
  textListen.hidden = !english
}

/** Both lists: the languages the person uses first (`mine`, in their order), then the others by name; a code the list lacks falls back to English. */
function fillLanguages(codes: string[], from: string, to: string, mine: string[] = []): void {
  const first = mine.filter(c => codes.includes(c))
  const rest = codes.filter(c => !first.includes(c)).sort((a, b) => languageName(a).localeCompare(languageName(b)))
  const fallback = codes.includes('en') ? 'en' : (rest[0] ?? first[0] ?? '')
  const option = (c: string) => el('option', { value: c }, languageName(c))
  for (const [select, code] of [
    [fromSelect, from],
    [toSelect, to],
  ] as const) {
    select.replaceChildren(
      ...(first.length && rest.length
        ? [el('optgroup', { label: t('card.yours') }, ...first.map(option)), el('optgroup', { label: t('card.allLanguages') }, ...rest.map(option))]
        : [...first, ...rest].map(option)),
    )
    select.value = codes.includes(code) ? code : fallback
    select.dataset.was = select.value
  }
}

/** A language picked on one side: if the other side had it, the two swap. Once a translation was asked for, it follows at once. */
function pickLanguage(side: 'from' | 'to'): void {
  const [changed, other] = side === 'from' ? [fromSelect, toSelect] : [toSelect, fromSelect]
  if (other.value === changed.value && changed.dataset.was) other.value = changed.dataset.was
  fromSelect.dataset.was = fromSelect.value
  toSelect.dataset.was = toSelect.value
  stopTextReading()
  syncLanguages()
  markRareWords()
  const s = state.card?.state
  if (s?.status === 'text' && s.result.status !== 'none') translateText()
}

/**
 * The two languages change places, as in DeepL: a translation in, it becomes
 * the text, translated back; else the text is translated the other way.
 */
function swapLanguages(): void {
  const s = state.card?.state
  ;[fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value]
  fromSelect.dataset.was = fromSelect.value
  toSelect.dataset.was = toSelect.value
  stopTextReading()
  syncLanguages()
  if (s?.status === 'text' && s.result.status === 'ready') {
    setFieldText(s.result.text)
    updateTextButtons()
  }
  markRareWords()
  translateText()
}

/** The text as it stands in the field, maybe fixed by hand, from and into the languages picked; Check's checked. */
function translateText(): void {
  const c = state.card
  const text = fieldText(textField)
  if (!c || !text.trim()) return
  sentText = text
  if (c.kind === 'check') post({ type: 'checkText', id: c.id, text })
  else post({ type: 'translateText', id: c.id, text, from: fromSelect.value, to: toSelect.value })
}

/** A translation as the card shows it: its text (to copy and paste), language and sentences. */
type Out = { text: string; to: string; html: string }

/** The card's last translation: shown faded while a newer one comes, so editing the text does not blank it. */
let lastOut: Out | undefined

/**
 * The translation with Copy, ▶ Listen when it is in English, and Paste when
 * it came from a selection; `ready`: Listen and Paste may be pressed (not
 * while drafts are still being replaced); `stale`: the last one, faded, while
 * a newer one comes.
 */
function outBlock(out: Out, canPaste: boolean, ready: boolean, stale = !ready): HTMLElement[] {
  return [el('div', { class: `text-out${stale ? ' stale' : ''}`, lang: out.to, dir: 'auto', 'data-words': out.to === 'en' }, html(out.html)), outBar(out, canPaste, ready)]
}

function outBar(out: Out, canPaste: boolean, ready: boolean): HTMLElement {
  // Its key, Enter, is drawn on it by card.css, so the button's name stays "Paste".
  const title = ready ? t('card.pasteOver') : t('card.pasteLater')
  const pasteButton = el('button', { class: 'paste-btn', title, disabled: !ready, onclick: () => paste() }, t('common.paste'))
  return halfBar([copyButton(() => out.text), out.to === 'en' && ready ? listenText('out') : null], canPaste ? [pasteButton] : [])
}

/** Under the bar: what the translation is doing, or the translation with its own Copy and Paste. The same result is left as it is, so a selection in it stays. */
function renderTextResult(r: TextResult, canPaste: boolean): void {
  const key = JSON.stringify([r, canPaste])
  if (textResult.dataset.key === key) return
  textResult.dataset.key = key
  textResult.hidden = r.status === 'none'
  const ready = r.status === 'ready' && !r.drafts
  // The same translation, a sentence of it come in: only the sentences change (sweep.ts), and its marks stay.
  const out = textResult.querySelector<HTMLElement>(':scope > .text-out:not(.stale)')
  if (r.status === 'ready' && out && lastOut?.to === r.to && updateSentences(out, html(r.html), markRareWords)) {
    lastOut = { text: r.text, to: r.to, html: r.html }
    out.nextElementSibling?.replaceWith(outBar(lastOut, canPaste, ready))
    fieldRanges = retranslate === undefined && fieldText(textField) === sentText ? sentenceRanges(textField, r.sentences) : undefined
    if (ready && pasteWhenReady) {
      pasteWhenReady = false
      paste()
    }
    return
  }
  // The translation read aloud is about to be replaced.
  if (player.key === 'out') player.stop()
  for (const marked of textView.querySelectorAll('.pair')) marked.classList.remove('pair')
  paint('pair')
  switch (r.status) {
    case 'none':
      textResult.replaceChildren()
      return
    case 'translating':
      textResult.replaceChildren(status(translating()), ...(lastOut ? outBlock(lastOut, canPaste, false) : []))
      return
    case 'downloading':
      textResult.replaceChildren(downloading(pairName(r.language), r.progress, r.size))
      return
    case 'ready':
      lastOut = { text: r.text, to: r.to, html: r.html }
      textResult.replaceChildren(...outBlock(lastOut, canPaste, ready, false))
      // The translation of exactly the text in the field: its sentences are found there, to mark and to read.
      fieldRanges = retranslate === undefined && fieldText(textField) === sentText ? sentenceRanges(textField, r.sentences) : undefined
      if (ready && pasteWhenReady) {
        pasteWhenReady = false
        paste()
      }
      return
    case 'failed':
      textResult.replaceChildren(...failed(r.message, () => translateText()))
      return
  }
}

/** Check's last answer: shown faded while the edited text is checked again. */
let lastCheck: Extract<CheckResult, { status: 'ready' }> | undefined

/** The text with its mistakes: the person's words struck out, the right ones put in after them (a space between), the rest as it was. */
function markedText(parts: readonly DiffPart[]): Node[] {
  const out: Node[] = []
  for (const [i, part] of parts.entries()) {
    if (part.kind === 'same') {
      out.push(document.createTextNode(part.text))
      continue
    }
    out.push(el(part.kind, { class: part.kind }, part.text))
    if (part.kind === 'del' && parts[i + 1]?.kind === 'ins') out.push(document.createTextNode(' '))
  }
  return out
}

/**
 * Check's answer: the text marked (or "Looks right"), the main mistake in
 * the person's language, then Copy, ▶ Listen and Paste of the text set right;
 * `ready`: Listen and Paste may be pressed.
 */
function checkBlock(r: Extract<CheckResult, { status: 'ready' }>, canPaste: boolean, ready: boolean): HTMLElement[] {
  const pasteButton = el('button', { class: 'paste-btn', title: t('card.pasteChecked'), disabled: !ready, onclick: () => paste() }, t('common.paste'))
  const changed = r.parts.some(p => p.kind !== 'same')
  const fade = ready ? '' : ' stale'
  return [
    changed
      ? el('div', { class: `text-out check-out${fade}`, lang: 'en', 'data-words': true }, ...markedText(r.parts))
      : el('p', { class: `check-clean${fade}` }, icon('check'), t('card.looksRight')),
    ...(changed && r.note ? [el('p', { class: `check-note${fade}`, lang: langCode(state.card?.native ?? '') }, r.note)] : []),
    // A right text: the field's own Copy and Listen are enough.
    halfBar(changed ? [copyButton(() => r.corrected), ready ? listenText('out') : null] : [], canPaste ? [pasteButton] : []),
  ]
}

/** Under the field: what the checker is doing, or its answer. The same answer is left as it is, so a selection in it stays. */
function renderCheckResult(r: CheckResult, canPaste: boolean): void {
  const key = JSON.stringify([r, canPaste])
  if (textResult.dataset.key === key) return
  textResult.dataset.key = key
  textResult.hidden = r.status === 'none'
  // The text set right read aloud is about to be replaced.
  if (player.key === 'out') player.stop()
  switch (r.status) {
    case 'none':
      textResult.replaceChildren()
      return
    case 'checking':
      textResult.replaceChildren(status(t('common.checking')), ...(lastCheck ? checkBlock(lastCheck, canPaste, false) : []))
      return
    case 'downloading':
      textResult.replaceChildren(downloading('', r.progress, r.size))
      return
    case 'ready':
      lastCheck = r
      textResult.replaceChildren(...checkBlock(r, canPaste, true))
      if (pasteWhenReady) {
        pasteWhenReady = false
        paste()
      }
      return
    case 'failed':
      textResult.replaceChildren(...failed(r.message, () => translateText()))
      return
  }
}

/** An empty field has nothing to copy, read or translate. */
function updateTextButtons(): void {
  const empty = !fieldText(textField).trim()
  textCopy.disabled = empty
  textListen.disabled = empty
  swapButton.disabled = empty
}

/** The translation, pasted over the selection it was made from; only once it is in. */
function canPaste(): boolean {
  const s = state.card?.state
  return (s?.status === 'text' || s?.status === 'check') && !!s.canPaste
}

/**
 * The translation, pasted over the selection it was made from. One still
 * coming (or an edit not yet sent to be translated) is pasted once it is in.
 */
function paste(): void {
  const c = state.card
  const s = c?.state
  if (!c || (s?.status !== 'text' && s?.status !== 'check') || !s.canPaste) return
  if (retranslate !== undefined) {
    window.clearTimeout(retranslate)
    retranslate = undefined
    pasteWhenReady = true
    return translateText()
  }
  // Check pastes the text set right; a translation whose drafts are still being replaced, once the accurate one is in.
  const drafts = s.status === 'text' && s.result.status === 'ready' && !!s.result.drafts
  // A long text's end, left untranslated, goes back after the translation: the selection it is pasted over held it.
  if (s.result.status === 'ready' && !drafts) return post({ type: 'pasteText', id: c.id, text: s.status === 'check' ? s.result.corrected : s.result.text + (s.result.rest ?? '') })
  if (drafts || s.result.status === 'translating' || s.result.status === 'checking' || s.result.status === 'downloading') pasteWhenReady = true
}

function copyButton(text: () => string): HTMLButtonElement {
  return el('button', { class: 'quiet-btn', title: t('common.copy'), onclick: () => copy(text()) }, icon('copy'), el('span', {}, t('common.copy')))
}

/** The translator's ▶ Listen, beside Copy under its English half (`src` the field, `out` the translation); it turns into Stop while reading. */
function listenText(key: 'src' | 'out'): HTMLButtonElement {
  return el('button', { class: 'quiet-btn icon-only', 'data-play': 'text', 'data-key': key, title: t('card.listenSpace'), 'aria-label': t('common.listen') }, glyph('play'))
}

function copy(text: string): void {
  post({ type: 'copyText', text })
  showHint([t('common.copied')], 1500)
}

// ---------------------------------------------------------------- reading

/** The sentences the English voice reads: those with Latin letters; one left untranslated in another script is skipped. */
function englishSentences(): HTMLElement[] {
  return [...body.querySelectorAll<HTMLElement>('span.s')].filter(s => /\p{Script=Latin}/u.test(s.textContent ?? ''))
}

/** With two paragraphs or more, each gets a play button in the margin, outside its words. */
function addParagraphButtons(): void {
  const paragraphs = [...body.querySelectorAll<HTMLElement>(':scope > p')]
  const several = paragraphs.length > 1
  list.classList.toggle('paragraphs', several)
  if (!several) return
  paragraphs.forEach((p, i) =>
    p.prepend(
      el('button', { class: 'para-play', 'data-play': 'paragraph', 'data-key': `p:${i}`, title: t('card.listenParagraph'), 'aria-label': t('card.listenParagraph') }, glyph('play')),
    ),
  )
}

/**
 * Starts reading `els`, the first being English sentence `from`; `asked`: the
 * person pressed a button. The sentence after the reading is made ahead, so a
 * step forward, or the next paragraph, starts at once.
 */
function read(key: string, els: HTMLElement[], from: number, asked: boolean): void {
  if (els.length === 0) return
  if (asked) {
    state.listened = true
    state.naturalJustReady = false
    renderVoiceBanner()
  }
  state.readFrom = from
  state.reading = key
  const after = from >= 0 ? englishSentences()[from + els.length] : undefined
  // The field's sentences are read from spans of their own, out of sight: the page does not follow them.
  if (!hasVoice() || !player.play(key, els, { follow: key !== 'src' && !checking(), ahead: after ? [after] : [] })) {
    if (asked) noVoiceHint()
  }
}

/**
 * The translator's English half, to read: the translation's sentences, or
 * the field's, each as a span of its text with its range in the field (the
 * whole lines, while the field's sentences are not found yet).
 */
function textReading(key: 'src' | 'out'): { els: HTMLElement[]; ranges: (Range | undefined)[] } {
  const latin = (text: string) => /\p{Script=Latin}/u.test(text)
  // Check's other half is the text set right, read from spans of its own lines.
  const s = state.card?.state
  if (key === 'out' && s?.status === 'check')
    return { els: s.result.status === 'ready' ? s.result.corrected.split('\n').filter(latin).map(line => el('span', {}, line)) : [], ranges: [] }
  if (key === 'out') return { els: [...textResult.querySelectorAll<HTMLElement>('.text-out:not(.stale) span.t')].filter(s => latin(s.textContent ?? '')), ranges: [] }
  if (!fieldRanges) return { els: fieldText(textField).split('\n').filter(latin).map(line => el('span', {}, line)), ranges: [] }
  const found = fieldRanges.filter((r): r is Range => !!r && latin(r.toString()))
  return { els: found.map(r => el('span', {}, r.toString())), ranges: found }
}

/** ▶ Listen in the translator: its English half from the top; never by itself. */
function readText(key: 'src' | 'out'): void {
  const { els, ranges } = textReading(key)
  readRanges = ranges
  read(key, els, -1, true)
}

/** The translator's reading, stopped when its text or languages change. */
function stopTextReading(): void {
  if (player.key === 'src' || player.key === 'out') player.stop()
}

/** Space in the translator: its English half read, or stopped. */
function toggleTextReading(): void {
  if (player.key === 'src' || player.key === 'out') return player.stop()
  if (checking()) return state.card?.state.status === 'check' && state.card.state.result.status === 'ready' ? readText('out') : readText('src')
  if (fromSelect.value === 'en' && fieldText(textField).trim()) readText('src')
  else if (toSelect.value === 'en' && lastOut) readText('out')
}

/** Listen: from the cursor to the end, or the cursor's sentence alone, one by one. */
function listen(asked = true): void {
  const all = englishSentences()
  if (all.length === 0) return
  state.cursor = Math.min(Math.max(0, state.cursor), all.length - 1)
  const at = all[state.cursor]
  read('card', state.config.oneAtATime && at ? [at] : all.slice(state.cursor), state.cursor, asked)
}

/** The previous or the next sentence, read at once. */
function step(by: number): void {
  const all = englishSentences()
  if (all.length === 0) return
  state.cursor = Math.min(Math.max(0, state.cursor + by), all.length - 1)
  markCursor()
  listen()
}

function readParagraph(p: Element | null): void {
  if (!p) return
  const all = englishSentences()
  const els = all.filter(s => p.contains(s))
  const first = els[0]
  if (first) read(`p:${[...body.querySelectorAll(':scope > p')].indexOf(p)}`, els, all.indexOf(first), true)
}

/** One by one, the sentence Listen reads next is marked. */
function markCursor(): void {
  for (const marked of body.querySelectorAll('span.s.at')) marked.classList.remove('at')
  if (state.config.oneAtATime) englishSentences()[state.cursor]?.classList.add('at')
}

function toggleOneAtATime(): void {
  state.config = { ...state.config, oneAtATime: !state.config.oneAtATime }
  post({ type: 'saveSettings', patch: { oneAtATime: state.config.oneAtATime } })
  renderChrome()
  markCursor()
}

/** A new translation is read once, when "Read aloud when a card opens" is on; a text card never reads by itself. */
function autoRead(c: CardView): void {
  if (!c.autoRead || translator(c) || state.readId === c.id) return
  state.readId = c.id
  state.cursor = 0
  listen(false)
}

function updatePlayButtons(): void {
  for (const button of root.querySelectorAll<HTMLElement>('[data-play]')) {
    const playing = player.key !== null && button.dataset.key === player.key
    button.classList.toggle('is-playing', playing)
    // Play turns into stop in place.
    const shape = button.querySelector<SVGSVGElement>('svg.glyph')
    if (shape && shape.dataset.shape !== (playing ? 'stop' : 'play')) shape.replaceWith(glyph(playing ? 'stop' : 'play'))
    const label = button.querySelector('.listen-label')
    const name = playing ? t('common.stop') : t('common.listen')
    if (label) label.textContent = name
    button.setAttribute('aria-label', name)
    button.title = name
  }
  spaceLabel.textContent = player.key === 'card' ? t('card.spaceStop') : t('card.spaceListen')
  if (player.key !== 'src') paint('reading')
}

// ---------------------------------------------------------------- interaction

function toggleTranslation(): void {
  state.showTranslation = !state.showTranslation
  renderChrome()
}

function togglePin(): void {
  state.pinned = !state.pinned
  post({ type: 'pin', on: state.pinned })
  renderChrome()
}

/** The Maximize button as main's state has it: a square to fill the screen, two to go back. */
function renderMaximized(): void {
  const on = state.maximized
  maximizeButton.setAttribute('aria-pressed', String(on))
  maximizeButton.title = on ? t('common.restore') : t('common.maximize')
  maximizeButton.setAttribute('aria-label', maximizeButton.title)
  const shape = maximizeButton.querySelector<SVGSVGElement>('svg.glyph')
  if (shape && shape.dataset.shape !== (on ? 'restore' : 'maximize')) shape.replaceWith(glyph(on ? 'restore' : 'maximize'))
  if (document.body.classList.contains('maximized') === on) return
  document.body.classList.toggle('maximized', on)
  // Filling the screen, the field takes the height (card.css); back, main hears the content's height at once
  // (the page may have kept its size, so the observer stays still).
  postHeight()
}

let hintTimer: number | undefined
function showHint(content: (Node | string)[], ms = 6000): void {
  hint.replaceChildren(...content)
  hint.hidden = false
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hint.hidden = true), ms)
}

function noVoiceHint(): void {
  const target = state.card?.target ?? 'English'
  showHint(
    [
      `${t('card.noVoice')} ${voiceSteps(target, state.platform)} `,
      canOpenSpeechSettings(state.platform)
        ? el('button', { class: 'link', onclick: () => post({ type: 'openSpeechSettings' }) }, t('card.openSpeechSettings'))
        : '',
    ],
    15_000,
  )
}

/** Marks sentence `i` in both halves, the text and its other side (in the field, as a highlight); undefined clears the mark. */
function markPair(i: string | undefined): void {
  for (const marked of root.querySelectorAll('.pair')) marked.classList.remove('pair')
  paint('pair')
  if (i === undefined) return
  const view = list.hidden ? textView : list
  for (const side of view.querySelectorAll(`[data-i="${i}"]`)) side.classList.add('pair')
  if (!textView.hidden) paint('pair', fieldRanges?.[Number(i)])
}

/** The number of the sentence clicked: a sentence span's, or the field's sentence under the point. */
function sentenceClicked(target: HTMLElement, x: number, y: number): string | undefined {
  const sentence = target.closest<HTMLElement>('span.s, span.t')
  if (sentence && (list.contains(sentence) || textResult.contains(sentence))) return sentence.dataset.i
  if (!fieldRanges || !target.closest('.text-field')) return undefined
  const caret = caretAt(x, y)
  const i = caret ? rangeIndexAt(fieldRanges, caret.node, caret.offset) : -1
  return i < 0 ? undefined : String(i)
}

root.addEventListener('click', event => {
  const target = event.target as HTMLElement
  // The word card's own buttons.
  if (target.closest('.word-card')) return
  const playButton = target.closest<HTMLElement>('[data-play]')
  if (playButton) {
    event.stopPropagation()
    const key = playButton.dataset.key ?? ''
    if (player.key === key) player.stop()
    else if (playButton.dataset.play === 'paragraph') readParagraph(playButton.closest('p'))
    else if (key === 'src' || key === 'out') readText(key)
    else listen()
    return
  }
  markPair(sentenceClicked(target, event.clientX, event.clientY))
  hover.showAt(event.clientX, event.clientY)
})

// Esc puts the card away, and the voice with it. Space plays or stops, the arrows step through the sentences.
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') return post({ type: 'close' })
  if (event.key === 'Tab') focusByTab = true
  // Enter in the translator pastes; the text field has its own, a button reached by Tab keeps its own.
  if (event.key === 'Enter' && !event.shiftKey && canPaste()) {
    if (event.target instanceof Element && (event.target.closest('.text-field') || (focusByTab && event.target.closest('button')))) return
    event.preventDefault()
    if (!event.repeat) paste()
    return
  }
  if (event.ctrlKey || event.altKey || event.metaKey) return
  if (event.target instanceof Element && event.target.closest('button, input, select, textarea, [contenteditable]')) return
  // The translator: Space reads its English half, outside the field.
  if (!textView.hidden && event.key === ' ') {
    event.preventDefault()
    return toggleTextReading()
  }
  if (list.hidden) return
  if (event.key === ' ') {
    event.preventDefault()
    if (player.key === 'card') player.stop()
    else listen()
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    step(event.key === 'ArrowLeft' ? -1 : 1)
  }
})

for (const kind of ['wheel', 'touchmove']) window.addEventListener(kind, () => player.userScrolled(), { passive: true })
window.addEventListener('pointerdown', () => (focusByTab = false), true)

// ---------------------------------------------------------------- messages

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  const m = event.data
  switch (m.type) {
    case 'card': {
      const changedPair = state.card !== undefined && state.card.native !== m.card.native
      // A new text: whatever was being read stops, and Listen starts from the top.
      if (state.card && state.card.id !== m.card.id) {
        player.stop()
        state.cursor = 0
      }
      state.card = m.card
      state.config = m.config
      state.pinned = m.pinned
      state.maximized = m.maximized
      if (changedPair) hover.forget()
      renderChrome()
      renderState()
      markRareWords()
      markCursor()
      updatePlayButtons()
      return
    }
    case 'gloss':
      hover.onGloss(m)
      return
    case 'ipa':
      hover.onIpa(m.word, m.ipa)
      return
    case 'saved':
      hover.onSaved(m.word, m.saved)
      return
    case 'common':
      state.common = new Set(m.words)
      markRareWords()
      return
    case 'app':
      return
    case 'dictReady':
      hover.forget()
      return
    case 'hostVoices':
      state.hostVoices = m.voices
      state.hostCanSpeak = m.canSpeak
      state.platform = m.platform
      renderChrome()
      return
    case 'progress':
      player.onHostProgress(m.id, m.pos, m.len)
      return
    case 'speakDone':
      player.onHostDone(m.id)
      return
    case 'stop':
      player.stop()
      return
    case 'natural': {
      const was = state.natural
      if (was?.status === 'downloading' && m.state.status === 'ready') state.naturalJustReady = true
      state.natural = m.state
      renderChrome()
      return
    }
    case 'naturalAudio':
      player.onNaturalAudio(m.id, m.index, m.samples, m.words)
      return
    case 'naturalFailed':
      player.onNaturalFailed(m.id, m.message)
      return
  }
})

if ('speechSynthesis' in window) {
  const refresh = () => {
    state.webVoices = window.speechSynthesis.getVoices()
    renderChrome()
  }
  refresh()
  window.speechSynthesis.addEventListener('voiceschanged', refresh)
}

post({ type: 'ready' })
