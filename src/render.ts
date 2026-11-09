import type { Line, Pair, TextLine } from './translate'

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * One half of the card as plain paragraphs (a picked text is not markdown):
 * every line is a paragraph (lines broken mid-sentence were joined back by
 * `unwrapLines`), list markers stay, everything is escaped. Every sentence is
 * a span carrying its number across the text, so a sentence and its other
 * side find each other.
 */
function halfHtml<P>(lines: readonly { prefix: string; pairs: readonly P[] }[], sentence: (pair: P, i: number) => string): string {
  let i = 0
  return lines
    .filter(line => line.pairs.length > 0)
    .map(line => `<p>${escapeHtml(line.prefix)}${line.pairs.map(p => sentence(p, i++)).join(' ')}</p>`)
    .join('')
}

/** The card's upper half: the text in English, every sentence a `span.s` the voice reads. */
export function englishHtml(lines: readonly Line[]): string {
  return halfHtml(lines, (p: Pair, i) => `<span class="s" data-i="${i}" dir="auto">${escapeHtml(p.en)}</span>`)
}

/** A translation's sentence: `span.t`, and `span.t.draft` while it is a quick draft the accurate one will replace. */
const outSpan = (text: string, i: number, draft?: boolean) => `<span class="t${draft ? ' draft' : ''}" data-i="${i}" dir="auto">${escapeHtml(text)}</span>`

/** The lower half: the other side of every sentence, a `span.t`; a sentence without one stays as it is. */
export function translationHtml(lines: readonly Line[]): string {
  return halfHtml(lines, (p: Pair, i) => outSpan(p.other ?? p.en, i, p.draft))
}

/** The translator's lower half: every sentence's translation a `span.t`, numbered as the text's sentences are. */
export function textOutHtml(lines: readonly TextLine[]): string {
  return halfHtml(lines, (p, i) => outSpan(p.out, i, p.draft))
}

/** How many sentences of the lines are still drafts. */
export function draftsIn(lines: readonly (Line | TextLine)[]): number {
  let n = 0
  for (const line of lines) for (const p of line.pairs) if (p.draft) n++
  return n
}
