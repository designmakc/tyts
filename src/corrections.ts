// What dictation learned from the person's own fixes: they edit a phrase in
// the list of recent ones, Tyts finds the one small change (worddiff.ts) and
// offers to remember it ("Remember: «тиц» → «Tyts»?"). A remembered pair is
// put right in every phrase after, before it is typed and before the model's
// edit (dictation.ts typeHeard); a name or term on the right also goes to the
// recognizer as a word to spell (vocabulary.ts). A large rewrite or a short
// word is not learned: a three-letter word would be changed everywhere.

import { changesOf, wordDiff } from './worddiff'

/** What the recognizer wrote, and what the person wants instead. */
export type Correction = { heard: string; right: string }

/** At most this many pairs, a change of at most `words` words, a left side of at least `letters` letters, each side `chars` long. */
export const CORRECTIONS = { most: 500, words: 5, letters: 4, chars: 80 }

export type Found = { ok: true; correction: Correction } | { ok: false; why: 'none' | 'big' | 'short' }

const WORD = /[\p{L}\p{N}]/u
const edges = (s: string) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').replace(/\s+/g, ' ')
const words = (s: string) => (s ? s.split(' ').length : 0)
const key = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

/** The phrase as typed against the person's fix: one change of up to five words, or why not. */
export function findCorrection(was: string, now: string): Found {
  const changes = changesOf(wordDiff(was, now)).filter(c => WORD.test(c.wrong) || WORD.test(c.right))
  if (changes.length === 0) return { ok: false, why: 'none' }
  if (changes.length > 1) return { ok: false, why: 'big' }
  const heard = edges(changes[0]!.wrong)
  const right = edges(changes[0]!.right)
  // A word only added or only taken out is no mishearing to put right.
  if (!heard || !right) return { ok: false, why: 'none' }
  if (words(heard) > CORRECTIONS.words || words(right) > CORRECTIONS.words) return { ok: false, why: 'big' }
  if (heard.replace(/[^\p{L}\p{N}]/gu, '').length < CORRECTIONS.letters) return { ok: false, why: 'short' }
  return { ok: true, correction: { heard, right } }
}

/** The list with `c` added last (the same left side replaced), the oldest dropped past the cap. */
export function addCorrection(list: readonly Correction[], c: Correction): Correction[] {
  return correctionList([...list.filter(x => key(x.heard) !== key(c.heard)), c])
}

/** The settings' list tidied: pairs of strings, short, the same left side once (the later wins), the newest `most`. */
export function correctionList(raw: unknown): Correction[] {
  if (!Array.isArray(raw)) return []
  const byHeard = new Map<string, Correction>()
  for (const item of raw) {
    const r = item as Partial<Correction> | null
    if (!r || typeof r.heard !== 'string' || typeof r.right !== 'string') continue
    const heard = r.heard.replace(/\s+/g, ' ').trim().slice(0, CORRECTIONS.chars)
    const right = r.right.replace(/\s+/g, ' ').trim().slice(0, CORRECTIONS.chars)
    if (!heard || !right || heard === right) continue
    byHeard.delete(key(heard))
    byHeard.set(key(heard), { heard, right })
  }
  return [...byHeard.values()].slice(-CORRECTIONS.most)
}

/** `right` in the case of what it replaces: as written when it has capitals of its own (a name), else following the match. */
function caseLike(match: string, right: string): string {
  if (right !== right.toLowerCase()) return right
  if (match.length > 1 && match === match.toUpperCase() && match !== match.toLowerCase()) return right.toUpperCase()
  const first = match.charAt(0)
  return first !== first.toLowerCase() ? right.charAt(0).toUpperCase() + right.slice(1) : right
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Every remembered pair put right in `text`: whole words, any case, in one pass (a fix is never fixed again). */
export function applyCorrections(text: string, list: readonly Correction[]): string {
  if (!text || list.length === 0) return text
  const right = new Map(list.map(c => [key(c.heard), c.right]))
  // Longest first, so "Visual Studio" wins over "Visual".
  const alts = [...right.keys()].sort((a, b) => b.length - a.length).map(h => escape(h).replace(/ /g, '\\s+'))
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts.join('|')})(?![\\p{L}\\p{N}])`, 'giu')
  return text.replace(re, m => {
    const r = right.get(key(m))
    return r === undefined ? m : caseLike(m, r)
  })
}
