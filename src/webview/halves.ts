// What the card's two halves share, in Listen and in Translate alike: the
// text on top and its other side under it, each with a bar under it (Copy on
// the left, the function's own buttons on the right). The English half's
// words open the word card (`data-words`); a sentence and its other side are
// marked together. In Translate the upper half is a field the person edits:
// its DOM stays plain text, so the caret never jumps, and its sentences are
// found as ranges and marked with the CSS Highlight API instead of spans.

import { el } from './dom'

/** A half's bar: Copy (and Listen) on the left, the half's own buttons on the right. */
export function halfBar(left: readonly (HTMLElement | null)[], right: readonly HTMLElement[]): HTMLElement {
  return el('div', { class: 'half-bar' }, ...left, el('span', { class: 'grow' }), ...right)
}

/** The text under `node`, without the buttons in its margins. */
function textOf(node: Node): string {
  let text = ''
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  for (let t = walker.nextNode(); t; t = walker.nextNode()) if (!t.parentElement?.closest('button')) text += (t as Text).data
  return text
}

/** A rendered half as plain text: one line per paragraph. */
export function plainOf(block: Element): string {
  const paragraphs = [...block.querySelectorAll(':scope > p')]
  return (paragraphs.length ? paragraphs.map(textOf) : [textOf(block)]).join('\n').trim()
}

/** A field's text, and where each of its characters lives; a line break (`<br>`) counts as "\n" with no place. */
type Flat = { text: string; at: ({ node: Text; offset: number } | undefined)[] }

function flatten(field: Element): Flat {
  const flat: Flat = { text: '', at: [] }
  const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n instanceof Text) {
      flat.text += n.data
      for (let i = 0; i < n.data.length; i++) flat.at.push({ node: n, offset: i })
    } else if (n instanceof HTMLBRElement) {
      flat.text += '\n'
      flat.at.push(undefined)
    }
  }
  return flat
}

/** What the person typed in a field, its lines as they see them. */
export function fieldText(field: Element): string {
  return flatten(field).text
}

/** What a sentence is matched by: its letters and signs, as lines are joined and words broken by a hyphen are mended before translating. */
const SKIP = /[\s\-‐‑]/u

/**
 * The ranges of `sentences` (the field's sentences in order, as the
 * translator was given them) in the field's text; a sentence not found there
 * gets none, and the search goes on after the last one found.
 */
export function sentenceRanges(field: Element, sentences: readonly string[]): (Range | undefined)[] {
  const flat = flatten(field)
  let kept = ''
  const where: { node: Text; offset: number }[] = []
  for (let i = 0; i < flat.text.length; i++) {
    const at = flat.at[i]
    if (!at || SKIP.test(flat.text[i] ?? '')) continue
    kept += flat.text[i]
    where.push(at)
  }
  let from = 0
  return sentences.map(sentence => {
    const key = [...sentence].filter(ch => !SKIP.test(ch)).join('')
    const i = key ? kept.indexOf(key, from) : -1
    const start = where[i]
    const end = where[i + key.length - 1]
    if (i < 0 || !start || !end) return undefined
    from = i + key.length
    const range = document.createRange()
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset + 1)
    return range
  })
}

/** The number of the range a point of the text is in, or -1. */
export function rangeIndexAt(ranges: readonly (Range | undefined)[], node: Node, offset: number): number {
  return ranges.findIndex(r => {
    try {
      return !!r && r.isPointInRange(node, offset)
    } catch {
      return false
    }
  })
}

type HighlightRegistryLike = { set(name: string, value: unknown): void; delete(name: string): void }

/** Marks `ranges` as CSS Highlight `name` (card.css draws it); none clears it. */
export function paint(name: string, ...ranges: (Range | undefined)[]): void {
  const registry = (globalThis as unknown as { CSS?: { highlights?: HighlightRegistryLike } }).CSS?.highlights
  const HighlightCtor = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight
  if (!registry || !HighlightCtor) return
  const some = ranges.filter((r): r is Range => !!r)
  if (some.length) registry.set(name, new HighlightCtor(...some))
  else registry.delete(name)
}
