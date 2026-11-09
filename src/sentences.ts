// Cuts a line of plain text into the sentences the card pairs with their
// translations. A list item or quote line keeps its marker outside and stays
// one unit; any other line is split into sentences.

const PREFIX = /^(\s*(?:(?:[-*+•]|\d+[.)])\s+(?:\[[ xX]\]\s+)?|>\s*)+)?(.*)$/s
// A sentence ends at . ! ? … before a space and a capital (any script), a
// digit, an opening quote or bracket, or a letter of a script without case
// (Chinese, Arabic, Hebrew, Thai…); or right after a full-width 。！？. Before
// a lower-case letter too, after . ! ? that ends a word of two letters or
// more (a post written in lower case: Firefox's models drop such a sentence
// when it comes glued to the one before); never after p.m. or U.S.
const SENTENCE_BREAK = /(?<=[.!?…])\s+(?=[\p{Lu}\p{Lo}\p{N}"'«„“(\[*_`])|(?<=[。！？])\s*(?=\S)|(?<=(?<![\p{L}\p{N}.])\p{L}{2,}[.!?])\s+(?=\p{Ll})/u
// Abbreviations whose dot ends no sentence; protected before the split.
const ABBREVIATIONS = /(?<![\p{L}\p{N}])(e\.g|i\.e|etc|vs|cf|approx|incl|fig|vol|Mr|Mrs|Ms|Dr|No|St|т\.е|т\.д|т\.п|др|см|напр|прим|стр|рис|тыс|млн|млрд|руб|ул|г)\./gu
const DOT = '\u0001'

export function splitSentences(body: string): string[] {
  const protectedBody = body.replace(ABBREVIATIONS, m => m.replace(/\./g, DOT))
  return protectedBody
    .split(SENTENCE_BREAK)
    .map(s => s.replace(new RegExp(DOT, 'g'), '.').trim())
    .filter(Boolean)
}

export function splitPrefix(raw: string): { prefix: string; body: string } {
  const m = PREFIX.exec(raw)
  return { prefix: m?.[1] ?? '', body: m?.[2] ?? raw }
}

/**
 * Joins back lines broken in the middle of a sentence (a PDF, an email, a
 * terminal): the line before ends in a letter, digit, comma or hyphen, not
 * at a sentence's end, and the next starts in lower case. A word broken with
 * a hyphen is joined back into one. A list item or quote broken so goes on
 * in the next line too, which never starts a new item; any other single line
 * break starts a new paragraph, as in chats and web pages.
 */
export function unwrapLines(lines: readonly string[]): string[] {
  const out: string[] = []
  let open = false
  for (const raw of lines) {
    const line = raw.trimEnd()
    const last = out.length - 1
    const previous = out[last]
    const next = line.trimStart()
    const continues =
      open &&
      previous !== undefined &&
      /^\p{Ll}/u.test(next) &&
      !splitPrefix(line).prefix &&
      /[\p{L}\p{N},\-–—]$/u.test(previous)
    if (continues) {
      out[last] = /\p{L}-$/u.test(previous) ? previous.slice(0, -1) + next : `${previous} ${next}`
    } else {
      out.push(line)
    }
    // An empty line ends the paragraph.
    open = next.length > 0
  }
  return out
}

/** One line: its list marker or quote arrow, then its sentences (a list item is one). */
export function lineUnits(line: string): { prefix: string; sentences: string[] } {
  const { prefix, body } = splitPrefix(line.trimEnd())
  if (!body.trim()) return { prefix: '', sentences: [] }
  return { prefix, sentences: prefix ? [body.trim()] : splitSentences(body) }
}
