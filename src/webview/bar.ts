// The bar by a selection: a row of icon buttons over or under the text selected
// in another program. The window never takes the keyboard, so the program keeps
// its selection; the main process (barwindow.ts) says what to draw and runs what
// is clicked. Here only the pointer is the page's own: a tooltip, Rewrite…'s row.

import type { BarView, ToHost, ToView, TutorHost } from '../protocol'
import { el } from './dom'
import { lucide, type LucideName } from './lucide'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

const post = (message: ToHost) => window.tutorHost.post(message)
const root = document.getElementById('root') as HTMLDivElement
const pill = document.getElementById('pill') as HTMLDivElement
const tip = document.getElementById('tip') as HTMLDivElement

const ICONS: Record<string, LucideName> = { translate: 'languages', listen: 'volume-2', check: 'spell-check', rewrite: 'wand-sparkles', copy: 'copy' }

let view: BarView | undefined
let shown = -1

function say(text: string): void {
  tip.replaceChildren(...(text ? [el('span', {}, text)] : []))
}

function button(label: string, content: Node | string, run: () => void, aria = label): HTMLButtonElement {
  const b = el('button', { type: 'button', 'aria-label': aria, onmouseenter: () => say(label), onmouseleave: () => say(''), onclick: run }, content)
  return b
}

function row(): void {
  if (!view) return
  pill.replaceChildren(
    ...view.row.map(item =>
      button(item.tip, lucide(ICONS[item.id] ?? 'sparkles'), () => {
        if (item.id === 'rewrite') return sub()
        post({ type: 'barPick', id: item.id })
      }),
    ),
  )
  say('')
  size()
}

/** Rewrite…'s row in place of the icons: the styles by name, and the way back. */
function sub(): void {
  if (!view) return
  const v = view
  pill.replaceChildren(
    button(v.back, lucide('chevron-left'), row),
    el('span', { class: 'sep' }),
    ...v.sub.map(item => button('', item.label, () => post({ type: 'barPick', id: item.id }), item.label)),
  )
  say('')
  size()
}

function size(): void {
  const r = pill.getBoundingClientRect()
  post({ type: 'barSize', width: Math.ceil(r.width), height: Math.ceil(r.height) })
}

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window || event.data.type !== 'bar') return
  view = event.data.view
  root.classList.toggle('above', view.above)
  if (view.n === shown) return
  shown = view.n
  row()
  // Faded in again at each showing.
  root.classList.remove('in')
  void root.offsetWidth
  root.classList.add('in')
})

post({ type: 'barReady' })
