// The glow and the drop as elements (media/topfx.css): the look at the top of
// the screen (top.ts) and its preview in Settings (app.ts) draw the same ones.

import type { EdgeStyle } from '../settings'
import { el } from './dom'

const SPARKS = 7

/** The look's box, or nothing for the plain one. */
export function topFx(style: EdgeStyle): HTMLElement | null {
  if (style === 'plain') return null
  if (style === 'drop') return el('div', { class: 'fx drop' }, el('span', { class: 'bead' }), el('span', { class: 'glint' }), el('span', { class: 'live' }))
  const box = el('div', { class: 'fx glow' }, el('span', { class: 'cone' }), el('span', { class: 'core' }))
  for (let i = 0; i < SPARKS; i++) {
    const spark = el('span', { class: 'spark' })
    // Set from here, not in markup: the pages' policy takes no inline styles.
    const from = (Math.random() - 0.5) * 36
    spark.style.setProperty('--x0', `${from.toFixed(0)}px`)
    spark.style.setProperty('--x1', `${(from * (1.3 + Math.random() * 0.9)).toFixed(0)}px`)
    spark.style.setProperty('--y', `${(40 + Math.random() * 36).toFixed(0)}px`)
    spark.style.setProperty('--d', `${(2.6 + Math.random() * 2.2).toFixed(2)}s`)
    spark.style.setProperty('--w', `${(-Math.random() * 5).toFixed(2)}s`)
    box.append(spark)
  }
  return box
}
