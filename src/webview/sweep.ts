// A quick draft becoming the accurate translation (2026-10-31, the owner's
// pick "B · Sweep" of three, design-lab/2026-10-31-draft/): with Accurate or
// Most accurate, Fast's translation shows at once, every sentence a
// `span.t.draft` a soft grey light passes over (card.css), and the model's
// sentences replace it one by one: the draft fades out, the new words appear
// left to right, each a moment at the strong tone, settling to the
// translation's, while the block's height glides to its new size. No blur and
// no yellow (the owner: "Yellow blur on black looks bad"). With reduced
// motion a sentence is swapped at once.

import { el } from './dom'

/** kinetics.colorion.co's glide: quick, no overshoot. */
const GLIDE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const FADE_MS = 120
const WORD_MS = 520
const WORD_GAP_MS = 32
const HEIGHT_MS = 320

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** A translation's paragraphs and sentence numbers, without their words: two with the same shape differ in their sentences only. */
function shapeOf(root: ParentNode): string {
  return JSON.stringify(
    [...root.children].map(p => [...p.childNodes].map(n => (n instanceof HTMLElement && n.matches('span.t') ? `#${n.dataset.i}` : (n.textContent ?? '')))),
  )
}

/** The block's height glides from what it was to what it is now; the text is clipped meanwhile. */
function glide(block: HTMLElement, before: number): void {
  const after = block.getBoundingClientRect().height
  if (Math.abs(after - before) < 1) return
  block.style.overflow = 'hidden'
  const a = block.animate([{ height: `${before}px` }, { height: `${after}px` }], { duration: HEIGHT_MS, easing: GLIDE })
  const done = () => block.style.removeProperty('overflow')
  a.finished.then(done, done)
}

/** What a sentence span shows, or is turning into. */
const target = (t: HTMLElement) => t.dataset.to ?? t.textContent ?? ''

/** A draft sentence swept into `text`; `settled` once it is one plain text again. */
async function sweep(t: HTMLElement, block: HTMLElement, text: string, settled: () => void): Promise<void> {
  t.dataset.to = text
  if (still()) {
    t.classList.remove('draft')
    t.textContent = text
    delete t.dataset.to
    return settled()
  }
  // The light stops passing over it first (card.css), then it fades.
  t.classList.add('fading')
  const out = t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in', fill: 'forwards' })
  await out.finished.catch(() => undefined)
  t.classList.remove('fading')
  // Replaced again meanwhile, or gone with the card's text.
  if (t.dataset.to !== text || !t.isConnected) return
  const before = block.getBoundingClientRect().height
  const words = text.split(/(?<=\s)/u).map(w => el('span', { class: 'w' }, w))
  t.replaceChildren(...words)
  t.classList.remove('draft')
  out.cancel()
  glide(block, before)
  const ins = words.map((w, i) =>
    w.animate(
      [
        { opacity: 0, color: 'var(--strong)' },
        { opacity: 1, color: 'var(--strong)', offset: 0.35 },
        { opacity: 1, color: 'var(--translation)' },
      ],
      { duration: WORD_MS, delay: WORD_GAP_MS * i, easing: 'ease-out', fill: 'backwards' },
    ),
  )
  await Promise.all(ins.map(a => a.finished)).catch(() => undefined)
  if (t.dataset.to !== text || !t.isConnected) return
  // One text node again, as the word card, the marks and the voice expect.
  t.textContent = text
  delete t.dataset.to
  settled()
}

/**
 * Puts a translation (render.ts, `next`) into `block` sentence by sentence
 * when only its sentences changed (the same paragraphs and numbers): a draft
 * that turned accurate is swept in, any other change is set at once, the rest
 * is left as it is, so a mark on it stays. False when the shape differs: the
 * caller puts the whole of it in. `settled`: a sweep is over (the words are
 * plain text again, to be marked).
 */
export function updateSentences(block: HTMLElement, next: DocumentFragment, settled: () => void): boolean {
  if (shapeOf(block) !== shapeOf(next)) return false
  const old = [...block.querySelectorAll<HTMLElement>('span.t')]
  next.querySelectorAll<HTMLElement>('span.t').forEach((n, k) => {
    const t = old[k]
    if (!t) return
    const text = n.textContent ?? ''
    const draft = n.classList.contains('draft')
    const wasDraft = t.classList.contains('draft') && t.dataset.to === undefined
    if (target(t) === text && wasDraft === draft) return
    if (wasDraft && !draft) {
      void sweep(t, block, text, settled)
      return
    }
    t.getAnimations({ subtree: true }).forEach(a => a.cancel())
    t.classList.remove('fading')
    delete t.dataset.to
    t.textContent = text
    t.classList.toggle('draft', draft)
  })
  return true
}
