// The menu on one key, by the text cursor: Tyts's logo, the actions in their
// groups, each with its letter, and a line on how to use it. The window never
// takes the keyboard: the keyboard thread reads the letters, the arrows, Enter
// and Esc, and the main process (menuwindow.ts) says what to draw. Here only the
// pointer is the page's own: it lights an item, and a click picks it.

import { t } from '../i18n'
import type { MenuView, ToHost, ToView, TutorHost } from '../protocol'
import { logo } from './brand'
import { dwmFlag, el } from './dom'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

dwmFlag()

const post = (message: ToHost) => window.tutorHost.post(message)
const root = document.getElementById('root') as HTMLDivElement

/** The items drawn: a move of the light only changes their classes, so a click never loses the row it began on. */
let drawn = ''
let rows: HTMLElement[] = []

function draw(view: MenuView): void {
  rows = []
  const groups = view.groups.flatMap((group, g) => [
    g > 0 ? el('div', { class: 'kd' }) : null,
    ...group.map(item => {
      const row = el('div', { class: 'ki', role: 'menuitem', 'data-i': rows.length }, el('span', { class: 'key' }, item.letter), el('span', { class: 'l' }, item.label))
      rows.push(row)
      return row
    }),
  ])
  root.replaceChildren(el('div', { class: 'kh' }, logo()), ...groups.filter(n => n !== null), el('div', { class: 'kf' }, view.foot ?? t('menu.foot')))
}

function paint(view: MenuView): void {
  const groups = JSON.stringify([view.groups, view.foot])
  if (groups !== drawn) {
    drawn = groups
    draw(view)
  }
  rows.forEach((row, i) => {
    row.classList.toggle('fire', i === view.fired)
    row.classList.toggle('on', i === view.lit && i !== view.fired)
  })
}

const indexAt = (target: EventTarget | null): number | undefined => {
  const row = target instanceof Element ? target.closest<HTMLElement>('[data-i]') : null
  return row ? Number(row.dataset.i) : undefined
}

let hovered: number | undefined
root.addEventListener('mousemove', event => {
  const index = indexAt(event.target)
  if (index === undefined || index === hovered) return
  hovered = index
  post({ type: 'menuHover', index })
})
root.addEventListener('mouseleave', () => {
  hovered = undefined
})
root.addEventListener('click', event => {
  const index = indexAt(event.target)
  if (index !== undefined) post({ type: 'menuPick', index })
})

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  if (event.data.type === 'menu') paint(event.data.view)
})

// The window is as tall as the panel, with the page's border above and below.
new ResizeObserver(() => {
  if (drawn) post({ type: 'menuHeight', px: Math.ceil(root.getBoundingClientRect().height) + 2 })
}).observe(root)

post({ type: 'menuReady' })
