// The word card: click any English word in the card, or hold Shift and
// hover it (mouse or pen), and its dictionary meanings appear at once; the
// `wordHint` setting makes the hover plain instead, or turns the card off. The word under the
// pointer is found from the text position, so nothing in the message is
// re-rendered; it is highlighted with the CSS Highlight API and looked up in
// the extension host's offline dictionary, once per word. Only English has
// dictionaries; another learned language gets a short note instead.

import { t } from '../i18n'
import type { Gloss, GlossMissing, ToHost, ToView, WordHintMode } from '../protocol'
import { el, icon } from './dom'

const HIGHLIGHT = 'tutor-hover'
const HIDE_DELAY_MS = 180
const WORD = /[A-Za-z'’]/

type Answer = Extract<ToView, { type: 'gloss' }>
/** Answers that change by themselves: asked again on the next hover rather than kept. */
const PASSING: ReadonlySet<GlossMissing> = new Set(['downloading', 'download-failed'])
type Hit = { word: string; range: Range; rect: DOMRect }
/** Where the pointer last was, and whether Shift was held then. */
type Point = { x: number; y: number; shift: boolean }

type HighlightRegistryLike = { set(name: string, value: unknown): void; delete(name: string): void }

function highlights(): HighlightRegistryLike | undefined {
  return (globalThis as unknown as { CSS?: { highlights?: HighlightRegistryLike } }).CSS?.highlights
}

export function caretAt(x: number, y: number): { node: Node; offset: number } | undefined {
  const doc = document as unknown as {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  const p = doc.caretPositionFromPoint?.(x, y)
  if (p) return { node: p.offsetNode, offset: p.offset }
  const r = doc.caretRangeFromPoint?.(x, y)
  return r ? { node: r.startContainer, offset: r.startOffset } : undefined
}

/** The English word under a point, inside a text in English (`[data-words]`: either half of a card, or its field), not code or buttons. */
function wordAtPoint(x: number, y: number): Hit | undefined {
  const caret = caretAt(x, y)
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return undefined
  const parent = caret.node.parentElement
  if (!parent?.closest('[data-words]') || parent.closest('pre, code, button, .word-card')) return undefined
  const text = (caret.node as Text).data
  let start = caret.offset
  if (!WORD.test(text[start] ?? '') && WORD.test(text[start - 1] ?? '')) start -= 1
  if (!WORD.test(text[start] ?? '')) return undefined
  let end = start
  while (start > 0 && WORD.test(text[start - 1] ?? '')) start--
  while (end < text.length && WORD.test(text[end] ?? '')) end++
  while (start < end && /['’]/.test(text[start] ?? '')) start++
  while (end > start && /['’]/.test(text[end - 1] ?? '')) end--
  if (end - start < 2) return undefined
  const range = document.createRange()
  range.setStart(caret.node, start)
  range.setEnd(caret.node, end)
  const rect = range.getBoundingClientRect()
  const slack = 2
  if (x < rect.left - slack || x > rect.right + slack || y < rect.top - slack || y > rect.bottom + slack) return undefined
  return { word: text.slice(start, end), range, rect }
}

export type WordHoverOptions = {
  host: HTMLElement
  area: HTMLElement
  post: (message: ToHost) => void
  nativeName: () => string
  /** When the card shows: while Shift is held, on any hover, or never. */
  mode: () => WordHintMode
  /** Reads a word aloud. */
  speak: (word: string) => void
  /** The sentence around a word in a text not cut into sentence spans (a field). */
  sentenceAt?: (range: Range) => string | undefined
  /** How far down the page's own bar reaches: the card goes under a word rather than over it. The card's bar by default. */
  ceiling?: () => number
}

export class WordHover {
  private readonly card: HTMLElement
  private current: Hit | undefined
  private readonly answers = new Map<string, Answer | 'pending'>()
  private hideTimer: number | undefined
  private frame = 0
  private lastPoint: Point | undefined
  /** The card was opened by a click: it stays until a click elsewhere, a scroll or another word, and takes clicks itself. */
  private clicked = false
  /** Whether a word is in the notebook, and how it is said, by the word in lower case. */
  private readonly saved = new Map<string, boolean>()
  private readonly ipa = new Map<string, string>()

  constructor(private readonly options: WordHoverOptions) {
    // A pure tooltip: the pointer passes through it to the text underneath,
    // so it never blocks the next word.
    this.card = el('div', { class: 'word-card', role: 'tooltip', hidden: true })
    options.host.append(this.card)
    options.area.addEventListener('pointermove', event => this.onMove(event), { passive: true })
    options.area.addEventListener('pointerleave', () => {
      if (!this.clicked) this.scheduleHide()
    })
    window.addEventListener('scroll', () => this.hide(), { passive: true })
    window.addEventListener('blur', () => this.hide())
    // Shift pressed while the pointer rests on a word shows the card at once; released, the card goes.
    window.addEventListener('keydown', event => {
      if (event.key !== 'Shift' || event.repeat || !this.lastPoint) return
      this.lastPoint = { ...this.lastPoint, shift: true }
      this.probe(this.lastPoint)
    })
    window.addEventListener('keyup', event => {
      if (event.key !== 'Shift') return
      if (this.lastPoint) this.lastPoint = { ...this.lastPoint, shift: false }
      if (this.options.mode() === 'shift' && !this.clicked) this.hide()
    })
  }

  /** A click at a point: the card for the word there, or none; true when there is a word. */
  showAt(x: number, y: number): boolean {
    const hit = this.options.mode() === 'off' ? undefined : wordAtPoint(x, y)
    if (!hit) {
      this.hide()
      return false
    }
    this.clicked = true
    this.show(hit)
    return true
  }

  /** An answer from the dictionary; shown when it is for the word under the pointer. */
  onGloss(answer: Answer): void {
    const key = answer.word.toLowerCase()
    this.answers.set(key, answer)
    if (answer.saved !== undefined) this.saved.set(key, answer.saved)
    if (this.current && this.current.word.toLowerCase() === key) this.render()
    if (answer.missing && PASSING.has(answer.missing)) this.answers.delete(key)
  }

  /** How the word is said, from the natural voice's phonemizer. */
  onIpa(word: string, ipa: string): void {
    const key = word.toLowerCase()
    this.ipa.set(key, ipa)
    if (this.current?.word.toLowerCase() === key) this.render()
  }

  /** The word went into the notebook, or left it. */
  onSaved(word: string, saved: boolean): void {
    const key = word.toLowerCase()
    this.saved.set(key, saved)
    if (this.current?.word.toLowerCase() === key) this.render()
  }

  /** The language pair changed, or a dictionary arrived: earlier answers no longer hold. */
  forget(): void {
    this.answers.clear()
    const word = this.current?.word
    if (!word) return
    this.answers.set(word.toLowerCase(), 'pending')
    this.options.post({ type: 'lookup', word })
    this.render()
  }

  /** The sentence a word was met in: the sentence span around it (`span.s`, `span.t`), or the field's sentence. */
  private sentenceOf(hit: Hit): string {
    const span = hit.range.startContainer.parentElement?.closest('span.s, span.t')?.textContent
    return (span ?? this.options.sentenceAt?.(hit.range) ?? '').trim()
  }

  /** Drops the card when the text it points at was redrawn. */
  refresh(): void {
    if (this.current && !this.current.range.startContainer.isConnected) this.hide()
  }

  hide(): void {
    this.cancelHide()
    this.clicked = false
    this.current = undefined
    this.card.hidden = true
    highlights()?.delete(HIGHLIGHT)
  }

  private onMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') return
    this.lastPoint = { x: event.clientX, y: event.clientY, shift: event.shiftKey }
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      if (this.lastPoint) this.probe(this.lastPoint)
    })
  }

  private probe(point: Point): void {
    const mode = this.options.mode()
    if (mode === 'off' || (mode === 'shift' && !point.shift)) {
      if (!this.clicked) this.hide()
      return
    }
    const hit = wordAtPoint(point.x, point.y)
    if (!hit) {
      if (!this.clicked) this.scheduleHide()
      return
    }
    this.clicked = false
    this.show(hit)
  }

  private show(hit: Hit): void {
    this.cancelHide()
    const same =
      this.current &&
      this.current.range.startContainer === hit.range.startContainer &&
      this.current.range.startOffset === hit.range.startOffset
    // The same word again, perhaps clicked this time: the card's buttons follow.
    if (same) return this.render()
    this.current = hit
    const registry = highlights()
    const HighlightCtor = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight
    if (registry && HighlightCtor) registry.set(HIGHLIGHT, new HighlightCtor(hit.range))
    const key = hit.word.toLowerCase()
    if (!this.answers.has(key)) {
      this.answers.set(key, 'pending')
      this.options.post({ type: 'lookup', word: hit.word })
    }
    this.render()
  }

  private render(): void {
    const hit = this.current
    if (!hit) return
    const answer = this.answers.get(hit.word.toLowerCase())
    const gloss: Gloss | undefined = answer && answer !== 'pending' ? answer.gloss : undefined
    const lower = hit.word.toLowerCase()
    const leadsWithBase = gloss && gloss.base !== lower
    const ipa = this.ipa.get(lower)
    const saved = this.saved.get(lower) === true
    const head = el(
      'div',
      { class: 'wc-head' },
      el('span', { class: 'wc-word' }, leadsWithBase ? gloss.base : hit.word),
      leadsWithBase ? el('span', { class: 'wc-form' }, t('word.from', { word: hit.word })) : null,
      ipa ? el('span', { class: 'wc-ipa' }, `/${ipa}/`) : null,
      this.clicked ? el('span', { class: 'grow' }) : null,
      this.clicked
        ? el('button', { class: 'icon-btn', title: t('word.say'), 'aria-label': t('word.say'), onclick: () => this.options.speak(hit.word) }, icon('unmute'))
        : null,
      this.clicked
        ? el(
            'button',
            {
              class: 'icon-btn',
              'aria-pressed': String(saved),
              title: saved ? t('word.remove') : t('word.save'),
              'aria-label': saved ? t('word.remove') : t('word.save'),
              onclick: () => this.toggleSaved(hit, saved),
            },
            icon(saved ? 'star-full' : 'star-empty'),
          )
        : null,
    )
    const sense = ([pos, translations]: [string, string]) =>
      el('div', { class: 'wc-sense' }, el('span', { class: 'wc-pos' }, pos), ` ${translations}`)
    let body: HTMLElement[]
    if (!answer || answer === 'pending') body = [el('div', { class: 'wc-note' }, '…')]
    else if (answer.missing && answer.missing !== 'not-found') body = [el('div', { class: 'wc-note' }, this.note(answer.missing))]
    else if (!gloss) body = [el('div', { class: 'wc-note' }, t('word.notFound'))]
    else
      body = gloss.entries.flatMap((entry, i) =>
        i === 0
          ? entry.senses.map(sense)
          : [el('div', { class: 'wc-also' }, entry.form), ...entry.senses.map(sense)],
      )
    this.card.replaceChildren(head, ...body)
    this.card.classList.toggle('clicked', this.clicked)
    this.card.hidden = false
    this.place(hit.rect)
  }

  private toggleSaved(hit: Hit, saved: boolean): void {
    if (saved) this.options.post({ type: 'unsaveWord', word: hit.word })
    else this.options.post({ type: 'saveWord', word: hit.word, sentence: this.sentenceOf(hit) })
  }

  private note(missing: GlossMissing): string {
    const pair = t('word.pair', { lang: this.options.nativeName() })
    switch (missing) {
      case 'not-english':
        return t('word.notEnglish', { lang: this.options.nativeName() })
      case 'no-dictionary':
        return t('word.noDictionary', { pair })
      case 'downloading':
        return t('word.downloading', { pair })
      case 'download-failed':
        return t('word.failed', { pair })
      case 'download-off':
        return t('word.off', { pair })
      default:
        return ''
    }
  }

  /**
   * Above the word, over lines already read, so the next words stay free to
   * hover; below it only when there is no room above (under the header).
   */
  private place(rect: DOMRect): void {
    const card = this.card
    const width = Math.min(300, window.innerWidth - 16)
    card.style.width = `${width}px`
    const left = Math.max(8, Math.min(rect.left - 8, window.innerWidth - width - 8))
    card.style.left = `${left}px`
    const height = card.offsetHeight
    const headerBottom = this.options.ceiling?.() ?? document.querySelector('.bar')?.getBoundingClientRect().bottom ?? 0
    const above = rect.top - height - 6
    card.style.top = `${above >= headerBottom + 4 ? above : rect.bottom + 6}px`
  }

  private scheduleHide(): void {
    if (this.hideTimer !== undefined || !this.current) return
    this.hideTimer = window.setTimeout(() => {
      this.hideTimer = undefined
      this.hide()
    }, HIDE_DELAY_MS)
  }

  private cancelHide(): void {
    if (this.hideTimer !== undefined) window.clearTimeout(this.hideTimer)
    this.hideTimer = undefined
  }
}
