// Words to spell: the person's own names and terms, one line each as typed on
// the Dictate page ("Peshynskyi", "Tyts (тиць, кракл)"). The part
// before the parentheses is how the word is written; inside them, what the
// recognizer may write instead. The engine (engine/vocab.py) tells Whisper the
// spellings and puts the heard forms right afterwards.

import type { Settings } from './settings'

export type VocabularyEntry = { word: string; heard: string[] }

/** One line read as a word and what it is heard as; a line without parentheses has no heard forms. */
export function parseEntry(line: string): VocabularyEntry {
  const open = line.indexOf('(')
  if (open < 0) return { word: line.trim(), heard: [] }
  const close = line.indexOf(')', open)
  const inside = line.slice(open + 1, close < 0 ? undefined : close)
  const word = line.slice(0, open).trim()
  const heard = [...new Set(inside.split(',').map(h => h.trim()).filter(h => h && h.toLowerCase() !== word.toLowerCase()))]
  return { word, heard }
}

/**
 * The vocabulary as the engine takes it (`PUT /settings`); lines without a word are left out.
 * A learned correction (corrections.ts) whose right side is a name or a term (a capital, a digit)
 * comes after, its left side what it is heard as; one of the person's own words is theirs alone.
 */
export function vocabularyFor(s: Pick<Settings, 'vocabulary'> & Partial<Pick<Settings, 'corrections'>>): VocabularyEntry[] {
  const own = s.vocabulary.map(parseEntry).filter(e => e.word)
  const mine = new Set(own.map(e => e.word.toLowerCase()))
  const learned: VocabularyEntry[] = []
  for (const c of s.corrections ?? []) {
    if (!/[\p{Lu}\p{N}]/u.test(c.right) || mine.has(c.right.toLowerCase())) continue
    const e = learned.find(x => x.word.toLowerCase() === c.right.toLowerCase())
    if (e) e.heard.push(c.heard)
    else learned.push({ word: c.right, heard: c.heard.toLowerCase() === c.right.toLowerCase() ? [] : [c.heard] })
  }
  return [...own, ...learned]
}
