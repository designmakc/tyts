// The calls window (main.ts createCallsWindow): every recording on the left,
// searched by its words, and the one open on the right with its transcript,
// the person's notes and the summary. The Transcripts page's own code
// (transcripts.ts) draws both columns; this page is its frame: the bar, the
// window's buttons and the redraws, fed by main's `app` snapshot as the app
// window is.

import { t } from '../i18n'
import type { AppView, ToView } from '../protocol'
import { el } from './dom'
import { glyph } from './glyphs'
import { onRedraw } from './speech'
import { callsColumns, enterTranscripts, openTranscript, setTranscriptHooks } from './transcripts'
import { post } from './ui'

document.title = t('calls.title')
const root = document.getElementById('root') as HTMLDivElement
// app.css shows the page's body only while a page is open: here one always is.
root.classList.add('page-open')
const list = el('div', { class: 'clist' })
const body = el('div', { class: 'pbody' })
const maxButton = el('button', { class: 'icon-btn max', title: t('common.maximize'), 'aria-label': t('common.maximize'), onclick: () => post({ type: 'window', action: 'maximize' }) }, glyph('maximize'))
root.append(
  el('aside', { class: 'side' }, el('div', { class: 'brand' }, el('b', { class: 'ctitle' }, t('calls.title'))), list),
  el(
    'section',
    { class: 'main' },
    el(
      'header',
      { class: 'top' },
      el('span', { class: 'gap' }),
      el(
        'div',
        { class: 'wbtns' },
        el('button', { class: 'icon-btn', title: t('nav.minimize'), 'aria-label': t('nav.minimize'), onclick: () => post({ type: 'window', action: 'minimize' }) }, glyph('minimize')),
        maxButton,
        el('button', { class: 'icon-btn', title: t('common.close'), 'aria-label': t('common.close'), onclick: () => post({ type: 'window', action: 'close' }) }, glyph('close')),
      ),
    ),
    body,
  ),
)

let view: AppView | undefined
/** A redraw that came while a field was in use: drawn once it is left. */
let pending = false

/** A field is being typed in (a search, the notes, a template): redrawing now would take it away. */
const typing = () => {
  const a = document.activeElement as HTMLElement | null
  return !!a && root.contains(a) && (a.matches('input[type=text], input[type=search], textarea') || a.isContentEditable)
}

function render(): void {
  if (!view) return
  if (typing()) {
    pending = true
    return
  }
  pending = false
  const { list: left, open } = callsColumns(view)
  const scroll = [list.scrollTop, body.scrollTop]
  list.replaceChildren(...left)
  body.replaceChildren(...open)
  list.scrollTop = scroll[0]!
  body.scrollTop = scroll[1]!
}

root.addEventListener('focusout', () => pending && window.setTimeout(render, 0))

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  const m = event.data
  if (m.type === 'openTranscript') {
    openTranscript(m.id)
    return
  }
  if (m.type === 'appWindow') {
    const label = t(m.maximized ? 'common.restore' : 'common.maximize')
    maxButton.replaceChildren(glyph(m.maximized ? 'restore' : 'maximize'))
    maxButton.title = label
    maxButton.setAttribute('aria-label', label)
    root.classList.toggle('maxed', m.maximized)
    return
  }
  if (m.type !== 'app') return
  const first = !view
  view = m.view
  render()
  if (first) enterTranscripts()
})

// Escape closes an open recording; the list stays.
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.defaultPrevented && !typing()) openTranscript('')
})

onRedraw(render)
setTranscriptHooks({
  view: () => view,
  shown: () => true,
  show: render,
  // The engine and the speakers are set up on the app window's Transcribe page.
  setup: () => post({ type: 'tray', command: 'transcribe' }),
  beside: true,
})

post({ type: 'appReady' })
