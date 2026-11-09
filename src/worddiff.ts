// What Check my English changed, word by word: the person's text against the
// corrected one, as runs of words kept, struck out and put in. The marks come
// from here, never from the model, so they always show exactly what changed.

/** A run of the text: kept as it was, struck out (`del`) or put in (`ins`); a change is a `del`, an `ins`, or a `del` then an `ins`. */
export type DiffPart = { kind: 'same' | 'del' | 'ins'; text: string }

type Token = { pre: string; word: string }

/** Words (letters, digits, apostrophes) and single signs, each with the spaces before it. */
function tokens(text: string): { list: Token[]; tail: string } {
  const list: Token[] = []
  let end = 0
  for (const m of text.matchAll(/(\s*)([\p{L}\p{N}\p{M}'’]+|\S)/gu)) {
    list.push({ pre: m[1] ?? '', word: m[2] ?? '' })
    end = (m.index ?? 0) + m[0].length
  }
  return { list, tail: text.slice(end) }
}

/** Above this many word pairs the middle of a text is one change rather than a slow comparison. */
const MAX_CELLS = 4_000_000

type Op = { kind: DiffPart['kind']; token: Token }

/** The longest common run of words, as kept, struck out and put in, in order. */
function diffTokens(a: Token[], b: Token[]): Op[] {
  let start = 0
  while (start < a.length && start < b.length && a[start]!.word === b[start]!.word) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1]!.word === b[endB - 1]!.word) {
    endA--
    endB--
  }
  const head: Op[] = b.slice(0, start).map(token => ({ kind: 'same', token }))
  const tail: Op[] = b.slice(endB).map(token => ({ kind: 'same', token }))
  const x = a.slice(start, endA)
  const y = b.slice(start, endB)
  const n = x.length
  const m = y.length
  const middle: Op[] = []
  if (n * m > MAX_CELLS) {
    middle.push(...x.map(token => ({ kind: 'del' as const, token })), ...y.map(token => ({ kind: 'ins' as const, token })))
  } else {
    // dp[i][j]: the common words of x[i..] and y[j..].
    const w = m + 1
    const dp = new Uint32Array((n + 1) * w)
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i * w + j] = x[i]!.word === y[j]!.word ? dp[(i + 1) * w + j + 1]! + 1 : Math.max(dp[(i + 1) * w + j]!, dp[i * w + j + 1]!)
    let i = 0
    let j = 0
    while (i < n || j < m) {
      if (i < n && j < m && x[i]!.word === y[j]!.word) {
        middle.push({ kind: 'same', token: y[j]! })
        i++
        j++
      } else if (j >= m || (i < n && dp[(i + 1) * w + j]! >= dp[i * w + j + 1]!)) {
        middle.push({ kind: 'del', token: x[i++]! })
      } else {
        middle.push({ kind: 'ins', token: y[j++]! })
      }
    }
  }
  return [...head, ...middle, ...tail]
}

/** One line (or a whole text) compared: the corrected text's spacing, a change's struck and new words together. */
function diffLine(original: string, corrected: string): DiffPart[] {
  const a = tokens(original)
  const b = tokens(corrected)
  const ops = diffTokens(a.list, b.list)
  const parts: DiffPart[] = []
  const push = (kind: DiffPart['kind'], text: string) => {
    if (!text) return
    const last = parts.at(-1)
    if (last?.kind === kind) last.text += text
    else parts.push({ kind, text })
  }
  for (let k = 0; k < ops.length; ) {
    const op = ops[k]!
    if (op.kind === 'same') {
      push('same', op.token.pre + op.token.word)
      k++
      continue
    }
    const struck: Token[] = []
    const added: Token[] = []
    for (; k < ops.length && ops[k]!.kind !== 'same'; k++) (ops[k]!.kind === 'del' ? struck : added).push(ops[k]!.token)
    const join = (list: Token[]) => list.map((t, i) => (i ? t.pre : '') + t.word).join('')
    push('same', (added[0] ?? struck[0])!.pre)
    push('del', join(struck))
    push('ins', join(added))
  }
  push('same', b.tail)
  return parts
}

/** `original` against `corrected`, line by line when both have as many lines. */
export function wordDiff(original: string, corrected: string): DiffPart[] {
  const a = original.split('\n')
  const b = corrected.split('\n')
  if (a.length !== b.length) return diffLine(original, corrected)
  const parts: DiffPart[] = []
  a.forEach((line, i) => {
    for (const part of [...(i ? [{ kind: 'same' as const, text: '\n' }] : []), ...diffLine(line, b[i]!)]) {
      const last = parts.at(-1)
      if (last?.kind === part.kind && part.kind === 'same') last.text += part.text
      else parts.push({ ...part })
    }
  })
  return parts
}

/** Each change as the words struck out and the words put in (either may be empty). */
export function changesOf(parts: readonly DiffPart[]): { wrong: string; right: string }[] {
  const out: { wrong: string; right: string }[] = []
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k]!
    if (part.kind === 'del') {
      const next = parts[k + 1]
      if (next?.kind === 'ins') k++
      out.push({ wrong: part.text, right: next?.kind === 'ins' ? next.text : '' })
    } else if (part.kind === 'ins') out.push({ wrong: '', right: part.text })
  }
  return out
}
