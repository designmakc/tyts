import * as fs from 'node:fs'

import { describe, expect, test } from 'vitest'

import { lineScore, mergeLine, pickLines, type OcrReading } from './ocrpick'
import type { OcrLine } from './ocrtext'

const list = (code: string) => new Set(fs.readFileSync(`media/layout/${code}.txt`, 'utf8').split('\n'))
const en = list('en')
const ru = list('ru')
const known = (word: string) => en.has(word) || ru.has(word)

const reading = (lang: string, texts: string[], h = 13): OcrReading => ({
  lang,
  lines: texts.map((text, i): OcrLine => ({ text, x: 10, y: 10 + i * 21, w: 880, h })),
})

// What Windows' two engines read on 2026-10-29 from text drawn at 13 px, scaled up twice.
const englishText = [
  "Mozilla's —32 MB model (Bergamot) mistranslates short instructions: the owner asked whether",
  'the speech engine (CTranslate2 runtime, RTX card) can be used for translation. Yes, the engine and',
  "the card can. Whisper can't translate text, so a new model is needed, chosen with a setting.",
  'the CUDA libraries in the gpu part; one FastAPl app; a model catalog (engine/models.json); downloads.',
]
const englishByRussian = [
  "Mozilla's —32 МВ model (Bergamot) mistranslates short instructions: the owner asked whether",
  'the speech engine (CTranslate2 runtime, RTX card) сап be used for translation. Yes, the engine and',
  "the card сап. Whisper can't translate text, so а new model is needed, chosen with а setting.",
  'the CUDA libraries [п the дри part; опе FastAPl арр; а model catalog (engine/models.json); downloads.',
]
const mixedText = [
  'Кнопки сундука и молнии поменять местами.',
  'открой Settings и включи Translate in place, потом нажми Paste.',
  'скачать модель TranslateGemma 48 (2,5 ГБ) для видеокарты RTX 2080 SUPER.',
]
const mixedByEnglish = [
  'KHonKb1 CYHAYKa Moni-Olbi not,aeHRTb MeaaMb1.',
  'OTKPOVi Settings BK.mOl-U1 Translate in place, nOTOM Haxtvlbl Paste.',
  'CKagaTb MOAenb TranslateGemma 4B (2,5 rS) AnR BblAeOGPTbl RTX 2080 SUPER.',
]

describe('lineScore', () => {
  test('Cyrillic look-alikes between English words count against a line', () => {
    expect(lineScore("the card can. Whisper can't translate text", known)).toBeGreaterThan(lineScore("the card сап. Whisper can't translate text", known))
    expect(lineScore('so a new model', known)).toBeGreaterThan(lineScore('so а new model', known))
  })

  test('a Russian word next to an English one is no look-alike', () => {
    expect(lineScore('открой Settings и включи Translate', known)).toBe(5)
  })

  test('a bracket by a letter or mixed scripts count against a word', () => {
    expect(lineScore('a[ready', known)).toBe(-1)
    expect(lineScore('KНопКи', known)).toBe(-1)
    expect(lineScore('— 2080, (2,5)', known)).toBe(0)
  })
})

describe('mergeLine', () => {
  test('a stretch the other reading reads better is taken from it', () => {
    expect(mergeLine('Открой Settings и включи Translate (п place.', 'OTKPOVi Settings BK.mOl-U1 Translate in place.', known)).toBe(
      'Открой Settings и включи Translate in place.',
    )
    expect(mergeLine('Открой Settings и включи Translate in р1асе, потом', 'OTKpovi Settings Translate in place, noTOM', known)).toBe(
      'Открой Settings и включи Translate in place, потом',
    )
  })

  test('words read alike, a stretch read no better, or a word only one has stay as they are', () => {
    expect(mergeLine('а потом нажми', 'a noTOM HaxM', known)).toBe('а потом нажми')
    expect(mergeLine('the card can', 'the card', known)).toBe('the card can')
    expect(mergeLine('the card', 'the card can', known)).toBe('the card')
    expect(mergeLine('', 'the card', known)).toBe('')
  })
})

describe('pickLines', () => {
  test('English text: the English engine wins over the Russian one, line by line', () => {
    const lines = pickLines([reading('ru', englishByRussian), reading('en-US', englishText)], known)
    expect(lines.map(l => l.text)).toEqual(englishText)
  })

  test('Russian text with English words: the Russian engine wins', () => {
    const lines = pickLines([reading('ru', mixedText), reading('en-US', mixedByEnglish)], known)
    expect(lines.map(l => l.text)).toEqual(mixedText)
  })

  test('a picture of both: each line from the engine that reads it', () => {
    const russian = reading('ru', [englishByRussian[2] ?? '', mixedText[0] ?? ''])
    const english = reading('en-US', [englishText[2] ?? '', mixedByEnglish[0] ?? ''])
    expect(pickLines([russian, english], known).map(l => l.text)).toEqual([englishText[2], mixedText[0]])
  })

  test('a line split in two by one engine is taken whole from the other, in the first reading’s order', () => {
    const russian: OcrReading = {
      lang: 'ru',
      lines: [
        { text: 'the card сап', x: 10, y: 10, w: 200, h: 13 },
        { text: 'be used', x: 230, y: 10, w: 100, h: 13 },
        { text: 'Кнопки сундука', x: 10, y: 40, w: 200, h: 13 },
      ],
    }
    const english: OcrReading = {
      lang: 'en-US',
      lines: [
        { text: 'KHonKb1 CYHAYKa', x: 10, y: 40, w: 200, h: 13 },
        { text: 'the card can be used', x: 10, y: 10, w: 320, h: 13 },
      ],
    }
    expect(pickLines([russian, english], known).map(l => l.text)).toEqual(['the card can be used', 'Кнопки сундука'])
  })

  test('one reading is taken as it is; a line only one engine saw is kept in its place', () => {
    expect(pickLines([reading('ru', mixedText)], known).map(l => l.text)).toEqual(mixedText)
    const russian = reading('ru', [mixedText[0] ?? ''])
    const english: OcrReading = { lang: 'en-US', lines: [{ text: 'Paste', x: 10, y: 60, w: 50, h: 13 }] }
    expect(pickLines([russian, english], known).map(l => l.text)).toEqual([mixedText[0], 'Paste'])
    expect(pickLines([], known)).toEqual([])
  })
})
