// A checked text with its mistakes, as Check my English marks them (worddiff.ts):
// the wrong words struck out, the fix after them. Mistakes and Talk draw it.

import type { DiffPart } from '../protocol'
import { el } from './dom'

/** A text with its mistakes, as the card marks them: struck out, then set right. */
export function withMarks(parts: readonly DiffPart[]): Node[] {
  return parts.flatMap((p, i) =>
    p.kind === 'same'
      ? [document.createTextNode(p.text)]
      : [el(p.kind, {}, p.text), ...(p.kind === 'del' && parts[i + 1]?.kind === 'ins' ? [document.createTextNode(' ')] : [])],
  )
}
