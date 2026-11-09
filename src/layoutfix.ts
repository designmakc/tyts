// What the keyboard helper decides about text typed in the wrong layout,
// without Windows: the keys pressed are kept, not the letters, so a word can
// be read in every layout ("ghbdtn" in the Russian one is "привет"). A word
// is fixed by itself only when it is no word as typed and a frequent word in
// another layout (or a learned one), short words before it going along when
// they were meant there; the fix key turns the words at the end that were
// meant in another layout into the one that makes the best word of the last.

/** One key with or without Shift: `${vk}:${0|1}`. */
export type KeyId = string

/** What each key types in one layout, and back. */
export type KeyTable = { chars: Map<KeyId, string>; keys: Map<string, KeyId> }

export function keyId(vk: number, shift: boolean): KeyId {
  return `${vk}:${shift ? 1 : 0}`
}

export function tableOf(entries: Iterable<[KeyId, string]>): KeyTable {
  const chars = new Map<KeyId, string>()
  const keys = new Map<string, KeyId>()
  for (const [key, char] of entries) {
    chars.set(key, char)
    // A character two keys type (a digit on the number pad) is typed back with the first.
    if (!keys.has(char)) keys.set(char, key)
  }
  return { chars, keys }
}

/** The character a key types in a layout; Caps Lock turns the case of letters. */
export function charOf(table: KeyTable, vk: number, shift: boolean, caps: boolean): string | undefined {
  const char = table.chars.get(keyId(vk, shift))
  if (char === undefined || !caps) return char
  return char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()
}

/** A key pressed: the key, Shift and Caps Lock, and the layout (its id) it typed in. */
export type Stroke = { vk: number; shift: boolean; caps: boolean; layout: string }

/** What the strokes type in `table`; a key that types nothing there stays as it typed. */
export function typeIn(strokes: readonly Stroke[], table: KeyTable, own: (layout: string) => KeyTable | undefined): string {
  return strokes
    .map(s => {
      const here = charOf(table, s.vk, s.shift, s.caps)
      if (here !== undefined) return here
      const home = own(s.layout)
      return (home && charOf(home, s.vk, s.shift, s.caps)) ?? ''
    })
    .join('')
}

// ---------------------------------------------------------------- words

/** The words of a language, most frequent first, and the three-letter runs they are made of. */
export type Lexicon = { rank: Map<string, number>; trigrams: Set<string> }

export function lexiconOf(words: readonly string[]): Lexicon {
  const rank = new Map<string, number>()
  const trigrams = new Set<string>()
  words.forEach((word, i) => {
    if (rank.has(word)) return
    rank.set(word, i)
    for (const t of trigramsOf(word)) trigrams.add(t)
  })
  return { rank, trigrams }
}

/** Where the person's own words (learned from their typing) stand among a language's: known, neither rare nor among the commonest. */
export const MY_WORD_RANK = 5000

/** A language's words with the person's own added (a copy; the list read from disk stays as it is). */
export function withWords(lexicon: Lexicon, words: readonly string[]): Lexicon {
  if (words.length === 0) return lexicon
  const rank = new Map(lexicon.rank)
  const trigrams = new Set(lexicon.trigrams)
  for (const word of words) {
    if (!rank.has(word)) rank.set(word, MY_WORD_RANK)
    for (const t of trigramsOf(word)) trigrams.add(t)
  }
  return { rank, trigrams }
}

function trigramsOf(word: string): string[] {
  const marked = `^${word}$`
  const out: string[] = []
  for (let i = 0; i + 3 <= marked.length; i++) out.push(marked.slice(i, i + 3))
  return out
}

/** The share of a word's three-letter runs the language has: 1 for any real-looking word, low for "ghbdtn" in English. */
export function plausibility(word: string, lexicon: Lexicon): number {
  const runs = trigramsOf(bare(word))
  return runs.filter(t => lexicon.trigrams.has(t)).length / runs.length
}

/** An apostrophe where a word has one: an English ending (don't, I'm, we're, I'll) or a Ukrainian one before я, ю, є, ї (п'ять, ім'я). */
const APOSTROPHE_WORD = /'(?:t|s|m|d|re|ve|ll)$|'[яюєї]/

/**
 * Such a word without its apostrophe, as the word lists keep it: "don't" is
 * "dont", "п'ять" is "пять". Any other apostrophe stays: "h'q" (рэй typed in
 * English) is not "hq".
 */
function bare(word: string): string {
  return APOSTROPHE_WORD.test(word) ? word.replace(/'/g, '') : word
}

/** How common a word is in a language (0 the commonest), with or without its apostrophes; undefined when it is no word there. */
export function rankOf(lexicon: Lexicon | undefined, word: string): number | undefined {
  return lexicon?.rank.get(word) ?? lexicon?.rank.get(bare(word))
}

const APOSTROPHES = /[’ʼ`]/g

/**
 * The word in a typed piece, in lower case: without the punctuation around
 * it; undefined when punctuation is left inside (other than an apostrophe
 * or a hyphen), so it is no word of this language.
 */
export function coreOf(text: string): string | undefined {
  const core = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').replace(APOSTROPHES, "'").toLowerCase()
  if (!core || /[^\p{L}'-]/u.test(core)) return undefined
  return core
}

/** A piece of text as one layout reads the keys: `lang` is the language whose words it is checked against. */
export type Reading = { layout: string; lang: string; text: string }

/** How rare a fixed word may be, by its length: a short one must be common to be trusted. */
function trusted(word: string, rank: number): boolean {
  if (word.length <= 2) return rank < 3000
  if (word.length === 3) return rank < 20000
  return true
}

function lettersOf(text: string): number {
  return [...text].filter(c => /\p{L}/u.test(c)).length
}

/**
 * The reading to fix a just-typed word into, if it is clearly typed in the
 * wrong layout: not a word as typed (nor a kept one), and a word, or at least
 * a word-shaped run of letters, in another layout. A piece with digits, an @
 * or a link, or a capital inside (iPhone), is left alone. A word as typed is
 * fixed only when keys that are signs in its layout are letters of a much
 * commoner word in another (";t" → "же"; "it." stays). A word the person
 * fixed by hand often enough (`always`: the word as typed → the language it
 * goes into) is fixed whatever it is, unless that makes no word of a word of
 * its list (`learnable`); a capital inside is left alone unless
 * another layout makes a word the person taught of it (`mine`, "lang\nword":
 * "ыКПИ" → "sRGB"), and so are two capitals (NB, KB: an abbreviation). The
 * same word in two languages goes into the layout of the one first in
 * `prefer` (the person's languages, their own first).
 */
export function chooseFix(
  typed: Reading,
  others: readonly Reading[],
  lexicons: Readonly<Record<string, Lexicon>>,
  keep: ReadonlySet<string>,
  always: ReadonlyMap<string, string> = new Map(),
  mine: ReadonlySet<string> = new Set(),
  prefer: readonly string[] = [],
): Reading | undefined {
  const t = typed.text
  if (/\d|@|:\/\/|^www\./i.test(t)) return undefined
  if (/\p{Ll}\p{Lu}/u.test(t)) {
    if (keep.has(t.toLowerCase())) return undefined
    return others.find(o => {
      const core = coreOf(o.text)
      return !!core && mine.has(`${o.lang}\n${core}`)
    })
  }
  const own = lexicons[typed.lang]
  if (!own) return undefined
  const core = coreOf(t)
  const word = core ?? t.toLowerCase()
  if (keep.has(word) || keep.has(t.toLowerCase())) return undefined
  const learned = always.get(word)
  const there = learned ? others.find(o => o.lang === learned && coreOf(o.text)) : undefined
  if (there && learnable(typed, there, lexicons)) return there
  if (/^\p{Lu}{2}$/u.test([...t].filter(c => /\p{L}/u.test(c)).join(''))) return undefined
  const rank = core === undefined ? undefined : rankOf(own, core)
  if (rank !== undefined) {
    const letters = lettersOf(t)
    const fits = others.filter(o => lettersOf(o.text) > letters && meantThere(typed, o, lexicons) && trustedReading(o, lexicons))
    return fits[0] && ownFirst(fits[0], fits, prefer)
  }
  return bestReading(others, lexicons, core === undefined ? 0 : plausibility(core, own), prefer)
}

/**
 * Whether a fix by hand may be learned, and a learned one used: never one
 * that turns a word of its own list into no word ("привет" → "ghbdtn": the
 * fix key pressed on a word typed right, or a fix erased and typed again).
 * Without both word lists there is nothing to judge by, and it may.
 */
export function learnable(typed: Reading, there: Reading, lexicons: Readonly<Record<string, Lexicon>>): boolean {
  const own = lexicons[typed.lang]
  const other = lexicons[there.lang]
  const core = coreOf(typed.text)
  if (!own || !other || core === undefined || rankOf(own, core) === undefined) return true
  const wanted = coreOf(there.text)
  return wanted !== undefined && rankOf(other, wanted) !== undefined
}

function trustedReading(reading: Reading, lexicons: Readonly<Record<string, Lexicon>>): boolean {
  const word = coreOf(reading.text)
  const rank = word === undefined ? undefined : rankOf(lexicons[reading.lang], word)
  return word !== undefined && word.length >= 2 && rank !== undefined && trusted(word, rank)
}

/**
 * Of the readings that make the same text as `chosen` (Russian and Ukrainian
 * share most short words, and either list holds some of the other's), the one
 * in the layout of the language first in `prefer`; `chosen` when none is.
 */
function ownFirst(chosen: Reading, readings: readonly Reading[], prefer: readonly string[]): Reading {
  const at = (r: Reading) => {
    const i = prefer.indexOf(r.lang)
    return i < 0 ? prefer.length : i
  }
  return readings.filter(r => r.text === chosen.text).reduce((a, b) => (at(b) < at(a) ? b : a), chosen)
}

/** How common a word as typed must at least be, by its length, for a much commoner word in another layout to win over it. */
const RARE = [0, 500, 1000, 2000]

/**
 * Whether a piece typed in one layout was meant in another: it reads as a
 * word there, and as typed it is none, or a much rarer one ("vs" → "мы",
 * "z" → "я"). A word common as typed stays ("в Telegram", "it."). A kept word
 * is never meant elsewhere.
 */
export function meantThere(typed: Reading, there: Reading, lexicons: Readonly<Record<string, Lexicon>>, keep: ReadonlySet<string> = new Set()): boolean {
  if (/\d|@|:\/\//.test(typed.text) || typed.layout === there.layout) return false
  const wanted = coreOf(there.text)
  const thereRank = wanted === undefined ? undefined : rankOf(lexicons[there.lang], wanted)
  if (thereRank === undefined) return false
  const core = coreOf(typed.text)
  if (core !== undefined && keep.has(core)) return false
  const rank = core === undefined ? undefined : rankOf(lexicons[typed.lang], core)
  if (rank === undefined) return true
  return rank >= (RARE[Math.min(core?.length ?? 3, 3)] ?? 0) && rank >= 10 * thereRank
}

/** How common a word of keys that are signs as typed must be there to go along: б, ж, э, є do; х, ъ, ю, ё, ї alone are no words. */
const SIGN_WORD = 1000

/**
 * The words before a fixed word that go with it (the fix key's whole piece,
 * or a short word typed just before a word fixed by itself): walking back
 * from the last, each word read in the layout the last goes into, while it
 * was meant there. A piece of signs ("," typed for "б") is as long as its
 * word there and goes only when that word is a common one. `words` are each
 * word's readings as typed and there, in order; the answer is how many of
 * the last ones go, the last always.
 */
export function wordsMeant(words: readonly { typed: Reading; there: Reading }[], lexicons: Readonly<Record<string, Lexicon>>, keep: ReadonlySet<string> = new Set(), most = 3): number {
  let n = words.length > 0 ? 1 : 0
  for (let i = words.length - 2; i >= 0; i--) {
    const w = words[i] as { typed: Reading; there: Reading }
    const core = coreOf(w.typed.text)
    const there = coreOf(w.there.text)
    const signs = core === undefined && (there === undefined || (rankOf(lexicons[w.there.lang], there) ?? SIGN_WORD) >= SIGN_WORD)
    if (((core ?? there)?.length ?? 99) > most || signs || !meantThere(w.typed, w.there, lexicons, keep)) break
    n++
  }
  return n
}

/**
 * The layout the fix key should turn the last word into: the best reading in
 * another layout with a word list, as `chooseFix` judges one, but without its
 * caution. The person asked, so digits, an @, a capital inside or a kept word
 * do not stop it. Undefined when no reading is a word (the key then takes
 * the next layout of the cycle).
 */
export function bestLayout(typed: Reading, others: readonly Reading[], lexicons: Readonly<Record<string, Lexicon>>, prefer: readonly string[] = []): Reading | undefined {
  const own = lexicons[typed.lang]
  const core = coreOf(typed.text)
  // A layout without a word list cannot say the typed piece looks right, so it counts as not.
  return bestReading(others, lexicons, own && core !== undefined ? plausibility(core, own) : 0, prefer)
}

/**
 * The reading most likely meant: a known word ranks by how common it is
 * (lower is better); an unknown one only when it looks like its language
 * and the typed piece, by `typedLooks` (its plausibility), does not. The
 * same word in two languages goes by `ownFirst`.
 */
function bestReading(others: readonly Reading[], lexicons: Readonly<Record<string, Lexicon>>, typedLooks: number, prefer: readonly string[] = []): Reading | undefined {
  const words: Reading[] = []
  let best: { reading: Reading; score: number } | undefined
  for (const other of others) {
    const lexicon = lexicons[other.lang]
    const word = coreOf(other.text)
    if (!lexicon || !word || word.length < 2) continue
    const rank = rankOf(lexicon, word)
    let score: number | undefined
    if (rank !== undefined) score = trusted(word, rank) ? rank : undefined
    else if (word.length >= 5 && plausibility(word, lexicon) === 1 && typedLooks < 0.6) score = 1_000_000
    if (score === undefined) continue
    words.push(other)
    if (!best || score < best.score) best = { reading: other, score }
  }
  return best && ownFirst(best.reading, words, prefer)
}

// ---------------------------------------------------------------- stray capitals

/**
 * A word's keys typed with a stray capital, and the keys as meant: two
 * capitals at the start ("ПРивет", `two`, from four letters), or Caps Lock
 * left on with Shift held for the first letter ("пРИВЕТ", `caps`, from three;
 * Caps Lock then goes off). `letter` says which keys type a letter.
 */
export function caseSlip(strokes: readonly Stroke[], letter: (s: Stroke) => boolean): { kind: 'two' | 'caps'; strokes: Stroke[] } | undefined {
  if (strokes.length === 0 || !strokes.every(letter)) return undefined
  const [first, second, ...rest] = strokes as [Stroke, Stroke, ...Stroke[]]
  if (strokes.length >= 3 && strokes.every(s => s.caps) && first.shift && [second, ...rest].every(s => !s.shift)) {
    return { kind: 'caps', strokes: strokes.map(s => ({ ...s, caps: false })) }
  }
  if (strokes.length >= 4 && strokes.every(s => !s.caps) && first.shift && second.shift && rest.every(s => !s.shift)) {
    return { kind: 'two', strokes: strokes.map((s, i) => (i === 1 ? { ...s, shift: false } : s)) }
  }
  return undefined
}

// ---------------------------------------------------------------- selected text

/**
 * The layout a text was typed in: the one whose keys type most of its
 * letters; the first on a tie. A text of signs alone goes by its signs
 * ("&&&&" is English's), the layout in front (`now`) winning a tie ("????"
 * is English's and Russian's).
 */
export function sourceLayout(text: string, layouts: readonly { id: string; table: KeyTable }[], now?: string): string | undefined {
  const letters = [...text].filter(c => /\p{L}/u.test(c))
  const signs = letters.length === 0
  const chars = signs ? [...text].filter(c => !/\s/u.test(c)) : letters
  let best: { id: string; count: number } | undefined
  for (const { id, table } of layouts) {
    const count = chars.filter(c => table.keys.has(c)).length
    if (!best || count > best.count || (signs && count === best.count && id === now)) best = { id, count }
  }
  return best && best.count > 0 ? best.id : undefined
}

/** A text typed in layout `from` as it reads when the same keys are pressed in `to`. */
export function convertText(text: string, from: KeyTable, to: KeyTable): string {
  let out = ''
  for (const char of text) {
    const key = from.keys.get(char)
    out += (key && to.chars.get(key)) ?? char
  }
  return out
}

/** The layout after `id` in the cycle, round; the first one when `id` is not in it. */
export function nextLayout(cycle: readonly string[], id: string | undefined): string | undefined {
  if (cycle.length === 0) return undefined
  const i = id === undefined ? -1 : cycle.indexOf(id)
  return cycle[(i + 1) % cycle.length]
}

/** The layouts after `id` round the cycle, `id` itself left out; the whole cycle when `id` is not in it. */
export function layoutsAfter(cycle: readonly string[], id: string | undefined): string[] {
  const i = id === undefined ? -1 : cycle.indexOf(id)
  return [...cycle.slice(i + 1), ...cycle.slice(0, Math.max(i, 0))]
}
