// A dotted line under the words outside the most common English ones: a hint
// of what to click. Drawn with the CSS Highlight API over the sentences'
// text, so the text itself is untouched and the reading's highlight,
// the word card and the voice see the same nodes.

import { baseForms } from '../lemma'

const HIGHLIGHT = 'rare-word'
const WORD = /[A-Za-z][A-Za-z'’]*[A-Za-z]/g

type HighlightRegistryLike = { set(name: string, value: unknown): void; delete(name: string): void }

function registry(): HighlightRegistryLike | undefined {
  return (globalThis as unknown as { CSS?: { highlights?: HighlightRegistryLike } }).CSS?.highlights
}

/** Whether a word, as met in a text, is outside the common list; a name (capitalized mid-sentence) never is. */
export function isRare(word: string, atStart: boolean, common: ReadonlySet<string>): boolean {
  if (word.length < 3) return false
  if (!atStart && /^[A-Z]/.test(word)) return false
  if (/[A-Z]/.test(word.slice(1))) return false
  return !baseForms(word).some(form => common.has(form))
}

/** A sentence's end before a word in a field's text: the word starts the next one. */
const SENTENCE_END = /(?:[.!?…]["'”’»)\]]*\s+|\n\s*)$/

/**
 * The ranges of the rare words in a text node, `text` being its data: one
 * sentence, or (`field`) a field's whole text, where a word after a
 * sentence's end starts one too.
 */
export function rareSpans(text: string, common: ReadonlySet<string>, field = false): [number, number][] {
  const spans: [number, number][] = []
  for (const m of text.matchAll(WORD)) {
    const atStart = /^\s*$/.test(text.slice(0, m.index)) || (field && SENTENCE_END.test(text.slice(Math.max(0, m.index - 12), m.index)))
    if (isRare(m[0], atStart, common)) spans.push([m.index, m.index + m[0].length])
  }
  return spans
}

/**
 * Marks the rare words under each of `containers`, the English halves of a
 * card: in their sentences (`span.s`, `span.t`), or, in a field not cut into
 * sentences, in its text. Clears the marks first; `on` false leaves none.
 */
export function markRare(containers: readonly Element[], common: ReadonlySet<string>, on: boolean): void {
  const reg = registry()
  const HighlightCtor = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight
  if (!reg || !HighlightCtor) return
  reg.delete(HIGHLIGHT)
  if (!on || common.size === 0) return
  const ranges: Range[] = []
  for (const container of containers) {
    const sentences = [...container.querySelectorAll('span.s, span.t')]
    const field = sentences.length === 0
    for (const part of field ? [container] : sentences) {
      const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        // A word Check my English struck out is wrong, not rare.
        if (node.parentElement?.closest('del')) continue
        const text = (node as Text).data
        for (const [start, end] of rareSpans(text, common, field)) {
          const range = document.createRange()
          range.setStart(node, start)
          range.setEnd(node, end)
          ranges.push(range)
        }
      }
    }
  }
  if (ranges.length > 0) reg.set(HIGHLIGHT, new HighlightCtor(...ranges))
}
