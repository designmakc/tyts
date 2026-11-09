// The bar by a selection: a dot under the start of a text selected in another
// program, opening into a pill of named buttons, and "…"'s list. The window never
// takes the keyboard, and even a click on it never reaches it: the keyboard thread
// keeps the click from every window (so the program keeps its selection) and main
// says where it was (`barClick`), as it says where the pointer is (`barPointer`);
// this page only draws, lights the button under the pointer and names the one clicked.

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
const list = document.getElementById('list') as HTMLDivElement

const ICONS: Record<string, LucideName> = { translate: 'languages', listen: 'volume-2', check: 'spell-check' }

let drawn = ''
let shown = -1

function draw(view: BarView): void {
  pill.replaceChildren(
    el('span', { class: 'dot-mark' }),
    el('span', { class: 'sep' }),
    ...view.row.map(item => el('button', { type: 'button', 'data-id': item.id }, lucide(ICONS[item.id] ?? 'sparkles'), item.label)),
    el('button', { type: 'button', class: 'more', 'data-id': 'more', 'aria-label': view.more }, lucide('ellipsis')),
  )
  list.replaceChildren(
    ...view.list.flatMap((group, g) => [
      ...(g > 0 ? [el('div', { class: 'kd' })] : []),
      ...group.map(item => el('button', { type: 'button', role: 'menuitem', 'data-id': item.id }, item.label)),
    ]),
  )
}

const buttonAt = (x: number, y: number): HTMLElement | null => (x < 0 ? null : (document.elementFromPoint(x, y)?.closest<HTMLElement>('button[data-id]') ?? null))

let lit: HTMLElement | null = null
function light(button: HTMLElement | null): void {
  if (button === lit) return
  lit?.classList.remove('on')
  lit = button
  lit?.classList.add('on')
}

function size(): void {
  // offset sizes: the showing's scale is no change of size.
  post({ type: 'barSize', width: root.offsetWidth, height: root.offsetHeight })
}

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  const m = event.data
  if (m.type === 'barPointer') return light(root.classList.contains('p-dot') ? null : buttonAt(m.x, m.y))
  if (m.type === 'barClick') {
    const id = root.classList.contains('p-dot') ? undefined : buttonAt(m.x, m.y)?.dataset.id
    if (id) post({ type: 'barPick', id })
    return
  }
  if (m.type !== 'bar') return
  const view = m.view
  const content = JSON.stringify([view.row, view.list, view.more])
  if (content !== drawn) {
    drawn = content
    draw(view)
    lit = null
  }
  for (const phase of ['dot', 'pill', 'list'] as const) root.classList.toggle(`p-${phase}`, view.phase === phase)
  root.classList.toggle('above', view.listAbove)
  if (view.phase === 'dot') light(null)
  if (view.n !== shown) {
    shown = view.n
    // Faded and grown in again at each showing.
    root.classList.remove('in')
    void root.offsetWidth
    root.classList.add('in')
  }
  size()
})

new ResizeObserver(size).observe(root)

post({ type: 'barReady' })
