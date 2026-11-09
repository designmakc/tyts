// Keyboards for the tests: what the letter keys of a US, a Russian and a
// Ukrainian keyboard type, and the word lists of their languages.

import * as fs from 'node:fs'

import { keyId, lexiconOf, tableOf, type KeyTable, type Stroke } from './layoutfix'

const VKS = [...'QWERTYUIOP'].map(c => c.charCodeAt(0)).concat(0xdb, 0xdd, ...[...'ASDFGHJKL'].map(c => c.charCodeAt(0)), 0xba, 0xde, ...[...'ZXCVBNM'].map(c => c.charCodeAt(0)), 0xbc, 0xbe, 0xbf, 0xc0, 0x20)
const DIGITS = [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37]

function layout(lower: string, upper: string, shiftedDigits: string): KeyTable {
  const entries: [string, string][] = []
  ;[...lower].forEach((c, i) => entries.push([keyId(VKS[i] as number, false), c]))
  ;[...upper].forEach((c, i) => entries.push([keyId(VKS[i] as number, true), c]))
  ;[...shiftedDigits].forEach((c, i) => entries.push([keyId(DIGITS[i] as number, true), c]))
  DIGITS.forEach((vk, i) => entries.push([keyId(vk, false), String(i + 1)]))
  return tableOf(entries)
}

export const EN = layout("qwertyuiop[]asdfghjkl;'zxcvbnm,./` ", 'QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?~ ', '!@#$%^&')
export const RU = layout('йцукенгшщзхъфывапролджэячсмитьбю.ё ', 'ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,Ё ', '!"№;%:?')
export const UK = layout("йцукенгшщзхїфівапролджєячсмитьбю.' ", 'ЙЦУКЕНГШЩЗХЇФІВАПРОЛДЖЄЯЧСМИТЬБЮ,₴ ', '!"№;%:?')
export const TABLES: Record<string, KeyTable> = { en: EN, ru: RU, uk: UK }

const words = (code: string) => fs.readFileSync(`media/layout/${code}.txt`, 'utf8').split('\n').filter(Boolean)
export const LEXICONS = { en: lexiconOf(words('en')), ru: lexiconOf(words('ru')), uk: lexiconOf(words('uk')) }

/** The strokes that type `text` in a layout. */
export function strokes(text: string, lang: string): Stroke[] {
  return [...text].map(c => {
    const key = TABLES[lang]?.keys.get(c)
    if (!key) throw new Error(`no key for ${c} in ${lang}`)
    const [vk, shift] = key.split(':')
    return { vk: Number(vk), shift: shift === '1', caps: false, layout: lang }
  })
}
