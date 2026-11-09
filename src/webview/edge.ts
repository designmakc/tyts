// The panel at the top of the screen (main.ts showEdge, edgepanel.ts): one line
// for what stands in the way, then a row of buttons: Dictate, Paste the last
// phrase, Calls, Record a call, and Report, Settings, Quit. The pointer on a
// button opens its card under the row: the last phrases (a click pastes one),
// the last calls (a click opens one), the recording, the quick switches. The
// panel never takes the focus, so what it types goes where the person was.

import { hotkeyLabel } from '../hotkey'
import { formatDate, t } from '../i18n'
import type { EdgeAct, EdgeView, ToHost, ToView, TrayCommand, TutorHost } from '../protocol'
import type { Settings } from '../settings'
import { dwmFlag, el } from './dom'
import { lucide, type LucideName } from './lucide'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

dwmFlag()

const post = (message: ToHost) => window.tutorHost.post(message)
const act = (a: EdgeAct) => post({ type: 'edgeAct', ...a })
const tray = (command: TrayCommand) => post({ type: 'tray', command })

const root = document.getElementById('root') as HTMLDivElement
type Card = 'dictate' | 'calls' | 'record' | 'settings'
let view: EdgeView | undefined
let open: Card | undefined

const keyText = (hotkey: string) => (hotkey ? el('span', { class: 'kt' }, `${hotkeyLabel(hotkey.replace(/\*2$/, ''))}${hotkey.endsWith('*2') ? ' ×2' : ''}`) : null)

/** A button of the row: a click runs it, the pointer on it opens its card. */
function button(icon: LucideName, label: string, run: () => void, card?: Card, opts: { on?: boolean; off?: boolean } = {}): HTMLElement {
  return el(
    'button',
    {
      class: `eb${card && card === open ? ' open' : ''}${opts.on ? ' on' : ''}`,
      title: label,
      'aria-label': label,
      disabled: opts.off,
      onclick: run,
      onmouseenter: () => {
        if (card === open) return
        open = card
        render()
      },
    },
    lucide(icon, 's'),
  )
}

function statusLine(v: EdgeView): HTMLElement | null {
  if (v.problem === 'noEngine') return el('div', { class: 'estatus' }, lucide('circle-alert', 's'), el('span', {}, t('edge.noEngine')), el('button', { class: 'link', onclick: () => act({ act: 'setup' }) }, t('edge.setup')))
  if (v.problem === 'paused')
    return el('div', { class: 'estatus' }, lucide('pause', 's'), el('span', {}, t('edge.paused')), el('button', { class: 'link', onclick: () => post({ type: 'saveSettings', patch: { paused: false } }) }, t('tray.resume')))
  return null
}

function switchRow(id: 'autoFix' | 'switchOn' | 'layoutBadge', label: string, on: boolean): HTMLElement {
  return el(
    'button',
    { class: 'erow', role: 'switch', 'aria-checked': String(on), onclick: () => post({ type: 'saveSettings', patch: { [id]: !on } as Partial<Settings> }) },
    el('span', { class: 'l' }, label),
    el('span', { class: on ? 'tg on' : 'tg' }),
  )
}

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }

function card(v: EdgeView): HTMLElement | null {
  const head = (title: string, more?: HTMLElement | null) => el('div', { class: 'ehead' }, el('b', {}, title), more ?? null)
  switch (open) {
    case 'dictate':
      return el(
        'div',
        { class: 'ecard' },
        head(t('edge.recent'), keyText(v.keys.dictate)),
        ...(v.recent.length
          ? v.recent.map(r => el('button', { class: 'erow', title: t('edge.pasteThis'), onclick: () => act({ act: 'paste', at: r.at }) }, el('span', { class: 'l clip' }, r.text)))
          : [el('p', { class: 'empty' }, t('edge.recentEmpty'))]),
      )
    case 'calls':
      return el(
        'div',
        { class: 'ecard' },
        head(t('calls.title'), el('button', { class: 'link', onclick: () => tray('transcripts') }, t('edge.allCalls'))),
        ...(v.calls.length
          ? v.calls.map(c => el('button', { class: 'erow', onclick: () => act({ act: 'openCall', id: c.id }) }, el('span', { class: 'l clip' }, c.title), el('span', { class: 'kt' }, formatDate(new Date(c.created), DATE))))
          : [el('p', { class: 'empty' }, t('edge.callsEmpty'))]),
      )
    case 'record':
      return el(
        'div',
        { class: 'ecard' },
        head(v.call ? t('call.stop') : t('call.record'), keyText(v.keys.call)),
        el('p', { class: 'note' }, t('call.recordNote')),
        el('button', { class: v.call ? 'ebtn stop' : 'ebtn', onclick: () => tray('call') }, v.call ? t('call.stopShort') : t('call.record')),
      )
    case 'settings':
      return el(
        'div',
        { class: 'ecard' },
        head(t('tray.settings'), el('button', { class: 'link', onclick: () => tray('settings') }, t('edge.allSettings'))),
        switchRow('autoFix', t('tray.autoFix'), v.autoFix),
        switchRow('switchOn', t('edge.switchOn'), v.switchOn),
        switchRow('layoutBadge', t('tray.layoutBadge'), v.layoutBadge),
      )
    default:
      return null
  }
}

function render(): void {
  const v = view
  if (!v) return
  const speech = !v.speech
  root.replaceChildren(
    ...[
      statusLine(v),
      el(
        'div',
        { class: 'ebar' },
        el(
          'div',
          { class: 'egroup' },
          button('mic', `${t('edge.dictate')}${v.keys.dictate ? ` · ${hotkeyLabel(v.keys.dictate)}` : ''}`, () => act({ act: 'dictate' }), 'dictate', { on: v.dictating, off: speech }),
          button('text-cursor', t('dictate.againKey'), () => act({ act: 'again' }), 'dictate', { off: !v.recent.length }),
        ),
        el(
          'div',
          { class: 'egroup' },
          button('file-text', t('calls.title'), () => tray('transcripts'), 'calls', { off: speech }),
          button('video', v.call ? t('call.stop') : t('call.record'), () => tray('call'), 'record', { on: v.call, off: speech }),
        ),
        el('span', { class: 'gap' }),
        button('bug', t('tray.reportTitle'), () => tray('report')),
        button('settings', t('tray.settings'), () => tray('settings'), 'settings'),
        button('power', t('tray.quit'), () => tray('quit')),
      ),
      card(v),
    ].filter((n): n is HTMLElement => n !== null),
  )
}

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window || event.data.type !== 'edge') return
  view = event.data.view
  render()
})

// Shown anew: no card open until the pointer asks for one.
document.addEventListener('mouseleave', () => {
  if (!open) return
  open = undefined
  render()
})

new ResizeObserver(() => post({ type: 'edgeHeight', px: Math.ceil(document.body.getBoundingClientRect().height) + 2 })).observe(document.body)
post({ type: 'edgeReady' })
