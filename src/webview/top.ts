// The look at the top of the screen (main.ts applyTop, toplook.ts): the glow or
// the drop while dictation listens; a call's last words while it records. It is
// only looked at: no pointer reaches it, and it sends nothing but "ready".

import { t } from '../i18n'
import type { ToHost, ToView, TopView, TutorHost } from '../protocol'
import { el } from './dom'
import { topFx } from './topfx'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

const root = document.getElementById('root') as HTMLDivElement
/** What the look was drawn for: it is drawn anew only when that changes, so its motion runs on. */
let drawn = ''

function render(v: TopView): void {
  if (v.mode === 'dictate') {
    if (drawn === `d:${v.style}`) return
    drawn = `d:${v.style}`
    const fx = topFx(v.style)
    root.replaceChildren(...(fx ? [fx] : []))
    return
  }
  const lines = el(
    'div',
    { class: `lines ${v.style}` },
    ...(v.rows.length
      ? v.rows.map(r => el('div', { class: `line ${r.who}` }, el('span', { class: 'who' }, t(r.who === 'me' ? 'call.liveMe' : 'call.liveOthers')), el('span', {}, r.text)))
      : [el('div', { class: 'wait' }, t('call.liveWaiting'))]),
  )
  // The plate comes in once; its words change in place after that.
  if (drawn === `c:${v.style}`) lines.style.setProperty('animation', 'none')
  drawn = `c:${v.style}`
  root.replaceChildren(lines)
}

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window || event.data.type !== 'top') return
  render(event.data.view)
})

// Put away: the next time it shows it comes in anew.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return
  drawn = ''
  root.replaceChildren()
})

window.tutorHost.post({ type: 'topReady' } satisfies ToHost)
