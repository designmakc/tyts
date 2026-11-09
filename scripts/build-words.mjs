// Writes the word lists Kryakl ships, from FrequencyWords by Hermit Dave
// (OpenSubtitles 2018, CC BY-SA 4.0; see NOTICE):
//   - media/layout/<code>.txt: the most frequent words of each language the
//     layout fixer knows (src/layoutfix.ts), most frequent first, one a line,
//     lower case, letters of that language's alphabet only;
//   - media/lang-words.json: the 200 most frequent words of each language the
//     translator has that shares its script with others, by which
//     translate.ts `languageOf` tells them apart.
//
//   node scripts/build-words.mjs

import { mkdirSync, writeFileSync } from 'node:fs'

const COUNT = 50_000
const COMMON = 200
const BASE = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018'
/**
 * A word of the language: its letters, and an apostrophe inside (don't,
 * п'ять). The languages whose keyboards are mistaken for the English one, as
 * far as FrequencyWords has them: the Cyrillic ones, Greek, Hebrew, Arabic and
 * Persian, Georgian (no Belarusian, Kazakh or Armenian there; its Serbian is
 * mostly Latin, the Cyrillic words too few to trust).
 */
const ALPHABETS = {
  en: /^[a-z]+(?:'[a-z]+)*$/,
  ru: /^[а-яё]+$/,
  uk: /^[а-щьюяєіїґ]+(?:'[а-щьюяєіїґ]+)*$/,
  bg: /^[абвгдежзийклмнопрстуфхцчшщъьюя]+$/,
  mk: /^[абвгдѓежзѕијклљмнњопрстќуфхцчџш]+$/,
  el: /^[αβγδεζηθικλμνξοπρστυφχψωάέήίόύώϊϋΐΰς]+$/,
  he: /^[א-ת]+$/,
  ar: /^[ء-غف-ي]+$/,
  fa: /^[ء-غف-يپچژکگی]+$/,
  ka: /^[ა-ჺ]+$/,
}
/** Languages written in Latin, Cyrillic or Arabic letters, by Kryakl's code; FrequencyWords calls Norwegian `no`. */
const SHARED = ['en', 'es', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'nl', 'sv', 'nb', 'da', 'fi', 'tr', 'ro', 'hu', 'hr', 'sr', 'vi', 'id', 'ru', 'uk', 'bg', 'ar', 'fa']
const SOURCE = { nb: 'no' }

async function lines(code) {
  const source = SOURCE[code] ?? code
  const res = await fetch(`${BASE}/${source}/${source}_50k.txt`)
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`)
  return (await res.text()).split('\n').map(line => (line.split(' ')[0] ?? '').toLowerCase().replace(/[’ʼ]/g, "'"))
}

mkdirSync('media/layout', { recursive: true })
for (const [code, alphabet] of Object.entries(ALPHABETS)) {
  const words = new Set()
  for (const word of await lines(code)) {
    if (alphabet.test(word)) words.add(word)
    if (words.size >= COUNT) break
  }
  writeFileSync(`media/layout/${code}.txt`, [...words].join('\n') + '\n', 'utf8')
  console.log(`${code}: ${words.size} words`)
}

const common = {}
for (const code of SHARED) {
  const words = new Set()
  for (const word of await lines(code)) {
    if (/^\p{L}+(?:'\p{L}+)*$/u.test(word)) words.add(word)
    if (words.size >= COMMON) break
  }
  common[code] = [...words]
}
writeFileSync('media/lang-words.json', JSON.stringify(common) + '\n', 'utf8')
console.log(`lang-words: ${Object.keys(common).length} languages`)
