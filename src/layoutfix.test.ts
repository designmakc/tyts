import { describe, expect, test } from 'vitest'

import { EN, LEXICONS, RU, strokes, TABLES, UK } from './layouts.fixture'
import { bestLayout, caseSlip, chooseFix, convertText, coreOf, layoutsAfter, learnable, meantThere, nextLayout, sourceLayout, typeIn, wordsMeant, type KeyTable, type Reading } from './layoutfix'

/** How the keys typed as `text` in `lang` read in each layout of `cycle`. */
function readings(text: string, lang: string, cycle = ['en', 'ru', 'uk']): { typed: Reading; others: Reading[] } {
  const s = strokes(text, lang)
  const read = (code: string): Reading => ({ layout: code, lang: code, text: typeIn(s, TABLES[code] as KeyTable, l => TABLES[l]) })
  return { typed: read(lang), others: cycle.filter(c => c !== lang).map(read) }
}

function fix(text: string, lang: string, cycle?: string[], keep: string[] = []): string | undefined {
  const { typed, others } = readings(text, lang, cycle)
  return chooseFix(typed, others, LEXICONS, new Set(keep))?.text
}

/** The layout the fix key turns the keys typed as `text` in `lang` into, judged by the words. */
function best(text: string, lang: string, cycle?: string[]): string | undefined {
  const { typed, others } = readings(text, lang, cycle)
  return bestLayout(typed, others, LEXICONS)?.layout
}

describe('keys in another layout', () => {
  test('the same keys read in each layout', () => {
    expect(readings('ghbdtn', 'en').others.map(r => r.text)).toEqual(['привет', 'привет'])
    expect(typeIn(strokes("s]'", 'en'), RU, l => TABLES[l])).toBe('ыъэ')
    expect(typeIn(strokes("s]'", 'en'), UK, l => TABLES[l])).toBe('іїє')
    expect(typeIn(strokes('Ghbdtn?', 'en'), RU, l => TABLES[l])).toBe('Привет,')
  })

  test('a selected text is converted key by key', () => {
    expect(convertText('Ghbdtn? vbh!', EN, RU)).toBe('Привет, мир!')
    expect(convertText('руддщ цщкдв', RU, EN)).toBe('hello world')
    expect(sourceLayout('ghbdtn', [{ id: 'en', table: EN }, { id: 'ru', table: RU }])).toBe('en')
    expect(sourceLayout('руддщ', [{ id: 'en', table: EN }, { id: 'ru', table: RU }])).toBe('ru')
  })

  test('a selected text of signs alone goes by its signs, the layout in front winning a tie', () => {
    const layouts = [{ id: 'en', table: EN }, { id: 'ru', table: RU }]
    expect(sourceLayout('&&&&', layouts, 'ru')).toBe('en')
    expect(sourceLayout('????', layouts, 'ru')).toBe('ru')
    expect(sourceLayout('????', layouts)).toBe('en')
    expect(sourceLayout('привет?', layouts, 'en')).toBe('ru')
    expect(convertText('&&&&', EN, RU)).toBe('????')
    expect(convertText('????', RU, EN)).toBe('&&&&')
  })

  test('the layouts after one go round the cycle, itself left out', () => {
    expect(layoutsAfter(['en', 'ru', 'uk'], 'ru')).toEqual(['uk', 'en'])
    expect(layoutsAfter(['en', 'ru', 'uk'], 'en')).toEqual(['ru', 'uk'])
    expect(layoutsAfter(['en', 'ru'], undefined)).toEqual(['en', 'ru'])
  })

  test('the next layout goes round', () => {
    expect(nextLayout(['en', 'ru'], 'en')).toBe('ru')
    expect(nextLayout(['en', 'ru'], 'ru')).toBe('en')
    expect(nextLayout(['en', 'ru'], 'uk')).toBe('en')
    expect(nextLayout([], 'en')).toBeUndefined()
  })
})

describe('fixing as one types', () => {
  test('a word typed in the wrong layout is fixed', () => {
    expect(fix('ghbdtn', 'en', ['en', 'ru'])).toBe('привет')
    expect(fix('руддщ', 'ru', ['en', 'ru'])).toBe('hello')
    expect(fix('yf', 'en', ['en', 'ru'])).toBe('на')
    expect(fix('cjj,otybt', 'en', ['en', 'ru'])).toBe('сообщение')
    expect(fix('Ghbdtn?', 'en', ['en', 'ru'])).toBe('Привет,')
    expect(fix('ghbdtnbr', 'en', ['en', 'ru'])).toBe('приветик')
  })

  test('Russian or Ukrainian, by the words', () => {
    expect(fix('lzre.', 'en')).toBe('дякую')
    expect(fix('ghbdsn', 'en')).toBe('привіт')
    expect(fix('pltcm', 'en')).toBe('здесь')
  })

  test('words right as typed are left alone', () => {
    for (const w of ['hello', 'world', 'to', 'ok', 'usb', "don't"]) expect(fix(w, 'en', ['en', 'ru'])).toBeUndefined()
    for (const w of ['привет', 'на', 'мир']) expect(fix(w, 'ru', ['en', 'ru'])).toBeUndefined()
  })

  test('keys that are signs here and letters there: ;t → же, ,s → бы; it. stays', () => {
    expect(fix(';t', 'en', ['en', 'ru'])).toBe('же')
    expect(fix(',s', 'en', ['en', 'ru'])).toBe('бы')
    for (const w of ['it.', 'to`', ',the', "f'"]) expect(fix(w, 'en', ['en', 'ru'])).toBeUndefined()
  })

  test('a word learned to fix always goes into its language, word as typed or not', () => {
    const { typed, others } = readings('vs', 'en', ['en', 'ru'])
    expect(chooseFix(typed, others, LEXICONS, new Set())).toBeUndefined()
    expect(chooseFix(typed, others, LEXICONS, new Set(), new Map([['vs', 'ru']]))?.text).toBe('мы')
  })

  test('a learned fix that makes no word of a word is not used, nor learned', () => {
    const word = readings('привет', 'ru', ['en', 'ru'])
    expect(chooseFix(word.typed, word.others, LEXICONS, new Set(), new Map([['привет', 'en']]))).toBeUndefined()
    expect(learnable(word.typed, word.others[0] as Reading, LEXICONS)).toBe(false)
    // No word as typed, a word or no word there: the person's to teach.
    const keys = readings('ghbdtn', 'en', ['en', 'ru'])
    expect(learnable(keys.typed, keys.others[0] as Reading, LEXICONS)).toBe(true)
    expect(learnable(readings('kryf', 'en', ['en', 'ru']).typed, readings('kryf', 'en', ['en', 'ru']).others[0] as Reading, LEXICONS)).toBe(true)
    // A word into a word: "f" → "а".
    const f = readings('f', 'en', ['en', 'ru'])
    expect(learnable(f.typed, f.others[0] as Reading, LEXICONS)).toBe(true)
    expect(chooseFix(f.typed, f.others, LEXICONS, new Set(), new Map([['f', 'ru']]))?.text).toBe('а')
  })

  test('not words, but not to touch: names in camel case, digits, mail, links, kept words', () => {
    expect(coreOf('iPhone')).toBe('iphone')
    expect(fix('iPhone', 'en', ['en', 'ru'])).toBeUndefined()
    expect(fix('ghbdtn1', 'en', ['en', 'ru'])).toBeUndefined()
    expect(fix('ghbdtn', 'en', ['en', 'ru'], ['ghbdtn'])).toBeUndefined()
    expect(fix('f', 'en', ['en', 'ru'])).toBeUndefined()
  })
})

describe('short words meant in another layout', () => {
  function meant(text: string, lang: string, there: string): boolean {
    const { typed, others } = readings(text, lang, ['en', 'ru'])
    return meantThere(typed, others.find(o => o.lang === there) as Reading, LEXICONS)
  }

  test('a rare word as typed, a common one there: z → я, vs → мы, lf → да', () => {
    for (const w of ['z', 'd', 'c', 'vs', 'lf', 'ds']) expect(meant(w, 'en', 'ru')).toBe(true)
  })

  test('a common word as typed stays: в, с, it, the', () => {
    for (const w of ['в', 'с', 'я']) expect(meant(w, 'ru', 'en')).toBe(false)
    for (const w of ['it', 'the', 'a', 'i']) expect(meant(w, 'en', 'ru')).toBe(false)
  })

  test('walking back from the last word, while each was meant there', () => {
    const pair = (text: string) => {
      const { typed, others } = readings(text, 'en', ['en', 'ru'])
      return { typed, there: others[0] as Reading }
    }
    expect(wordsMeant(['hello', 'z', 'rfr'].map(pair), LEXICONS)).toBe(2)
    expect(wordsMeant(['ghbdtn', 'vbh'].map(pair), LEXICONS, new Set(), Number.POSITIVE_INFINITY)).toBe(2)
    expect(wordsMeant(['ghbdtn', 'vbh'].map(pair), LEXICONS)).toBe(1)
  })
})

/** Each word of `words` (space-separated) typed in `lang`; `cycle` holds the layouts to read them in. */
const each = (words: string) => words.split(' ')

describe('one letter and two, in English, Russian and Ukrainian', () => {
  const pair = (from: string, to: string) => (text: string) => {
    const { typed, others } = readings(text, from, [from, to])
    return { typed, there: others[0] as Reading }
  }
  const goes = (from: string, to: string, ...words: string[]) => wordsMeant(words.map(pair(from, to)), LEXICONS)

  test('a letter alone is never fixed by itself, nor chosen by the fix key', () => {
    for (const c of 'abcdefghijklmnopqrstuvwxyz') expect([fix(c, 'en'), best(c, 'en')]).toEqual([undefined, undefined])
    for (const c of 'йцукенгшщзхъфывапролджэячсмитьбюё') expect([fix(c, 'ru'), best(c, 'ru')]).toEqual([undefined, undefined])
    for (const c of 'йцукенгшщзхїфівапролджєячсмитьбю') expect([fix(c, 'uk'), best(c, 'uk')]).toEqual([undefined, undefined])
  })

  test('a letter goes with the word fixed after it when it is a common word there and a rare one as typed', () => {
    for (const c of 'zdcefjrbg') expect(goes('en', 'ru', c, 'rfr'), c).toBe(2)
    for (const c of 'aisntlxvpq') expect(goes('en', 'ru', c, 'rfr'), c).toBe(1)
    for (const c of 'sq') expect(goes('en', 'uk', c, 'oj'), c).toBe(2)
    for (const c of 'фшьщ') expect(goes('ru', 'en', c, 'еру'), c).toBe(2)
    for (const c of 'выедутсрнаяи') expect(goes('ru', 'en', c, 'еру'), c).toBe(1)
    expect(goes('ru', 'en', 'Ш', 'Вщтэе')).toBe(2)
    expect(goes('ru', 'en', 'в', 'и', 'еру')).toBe(1)
    expect(goes('en', 'ru', 'plan', 'b')).toBe(1)
  })

  test('a sign key alone goes along when it is a common word there: , → б, \' → є; not when it is a bare letter: [ → х, . → ю', () => {
    expect(goes('en', 'ru', 'z', ',', 'cltkfk')).toBe(3)
    expect(goes('en', 'uk', "'", 'wt')).toBe(2)
    expect(goes('en', 'ru', ';', 'yt')).toBe(2)
    expect(goes('en', 'ru', '[', 'rfr')).toBe(1)
    expect(goes('en', 'ru', '.', 'rfr')).toBe(1)
    expect(goes('en', 'ru', '`', 'rfr')).toBe(1)
  })

  test('Russian words of one to three letters typed right stay', () => {
    const ru = 'я в и с у а о к ж б э ы он мы ты вы да не на но из за же бы ну от до по ли их им ей ем ох ах эй ой уж что это как так вот все кто или нет его мне они она там тут вам нас дом год лет раз сам три два ваш наш мой'
    for (const w of each(ru)) expect(fix(w, 'ru'), w).toBeUndefined()
  })

  test('Ukrainian words of one or two letters typed right stay, with English beside and with Russian too', () => {
    const uk = 'я в у і и з а ж є б й ю ї ми ви ти це що на не за до як та ні ще із їх їй їм зі чи бо же ну от по'
    for (const w of each(uk)) expect([fix(w, 'uk', ['en', 'uk']), fix(w, 'uk')], w).toEqual([undefined, undefined])
  })

  test('English words of one or two letters typed right stay, abbreviations too', () => {
    const en = 'a i it to in is on no so of if go up us am be we he me my or an as do hi oh ok by at tv pc hp cv fb js ts ui ux ip id io ai ml cs qa os vm ft bg gb mb tb ms dr mr vs ds lf ns ye db ot sp ps oj lj'
    for (const w of each(en)) expect(fix(w, 'en'), w).toBeUndefined()
  })

  test('English keys meant in Russian: jy → он, yt → не, \'nj → это, ;t → же, ,s → бы', () => {
    for (const [keys, word] of [['jy', 'он'], ['yt', 'не'], ["'nj", 'это'], [';t', 'же'], [',s', 'бы'], ['rfr', 'как'], ['xnj', 'что']]) {
      expect(fix(keys as string, 'en', ['en', 'ru']), keys).toBe(word)
    }
  })

  test('English keys meant in Ukrainian: wt → це, nb → ти, ][ → їх, xb → чи, ,j → бо', () => {
    for (const [keys, word] of [['wt', 'це'], ['nb', 'ти'], ['vb', 'ми'], ['zr', 'як'], ['nf', 'та'], ['][', 'їх'], ['xb', 'чи'], [',j', 'бо']]) {
      expect(fix(keys as string, 'en'), keys).toBe(word)
    }
  })

  test('English typed in the Russian layout: шы → is, ше → it, щл → ok', () => {
    const en = 'is it to in on no so go up us am be we me my or an as do oh ok'
    for (const w of each(en)) expect(fix(convertText(w, EN, RU), 'ru'), w).toBe(w)
  })

  test('a known limit: he, of, if, hi, by, at typed in the Russian layout stay alone (ру, ща, ша, рш, ин, фе are in its list), and go with a word after', () => {
    for (const w of each('he of if hi by at')) {
      const typed = convertText(w, EN, RU)
      expect(fix(typed, 'ru'), w).toBeUndefined()
      expect(goes('ru', 'en', typed, 'шы'), w).toBe(2)
    }
  })

  test('a known limit: kb, in no English list, becomes ли', () => {
    expect(fix('kb', 'en', ['en', 'ru'])).toBe('ли')
  })

  test('two capitals are an abbreviation, left as typed: NB, KB, VB, ЩЛ; the fix key still takes them', () => {
    for (const w of each('NB KB VB')) expect(fix(w, 'en'), w).toBeUndefined()
    expect(fix('ЩЛ', 'ru')).toBeUndefined()
    expect(best('NB', 'en')).toBe('uk')
    expect(best('ЩЛ', 'ru')).toBe('en')
  })
})

describe('words with an apostrophe', () => {
  test("English typed in the Russian layout: Вщтэе → Don't, шэь → i'm, with the sign after", () => {
    const words = "don't Don't i'm it's can't we're you've I'll didn't don't. don't, Don't!"
    for (const w of each(words)) expect(fix(convertText(w, EN, RU), 'ru'), w).toBe(w)
  })

  test("and in the Ukrainian one: Вщтєе → Don't", () => {
    for (const w of each("Don't i'm")) expect(fix(convertText(w, EN, UK), 'uk'), w).toBe(w)
  })

  test("Ukrainian typed in English: g`znm → п'ять, sv`z → ім'я", () => {
    expect(fix('g`znm', 'en')).toBe("п'ять")
    expect(fix('sv`z', 'en')).toBe("ім'я")
  })

  test("right as typed, it stays: don't, п'ять", () => {
    expect(fix("don't", 'en')).toBeUndefined()
    expect(fix("п'ять", 'uk')).toBeUndefined()
    expect(fix("ім'я", 'uk', ['en', 'uk'])).toBeUndefined()
  })
})

describe('Russian or Ukrainian: the same word in both lists', () => {
  function into(text: string, prefer: string[]): string | undefined {
    const { typed, others } = readings(text, 'en')
    return chooseFix(typed, others, LEXICONS, new Set(), new Map(), new Set(), prefer)?.layout
  }

  test("goes into the layout of the person's own language", () => {
    for (const w of each('yf nfr dct yt ckjdj ;t')) {
      expect(into(w, ['ru', 'en', 'uk']), w).toBe('ru')
      expect(into(w, ['uk', 'en', 'ru']), w).toBe('uk')
    }
  })

  test('a word only one of them has goes there, whatever the person speaks', () => {
    expect(into('ghbdsn', ['ru', 'en'])).toBe('uk')
    expect(into("'nj", ['uk', 'en'])).toBe('ru')
    expect(into('wt', ['ru', 'en'])).toBe('uk')
  })

  test('the fix key too', () => {
    const { typed, others } = readings('yf', 'en')
    expect(bestLayout(typed, others, LEXICONS, ['ru', 'en'])?.layout).toBe('ru')
    expect(bestLayout(typed, others, LEXICONS, ['uk', 'en'])?.layout).toBe('uk')
  })
})

describe('stray capitals', () => {
  const letter = () => true
  test('two at the start, from four letters', () => {
    expect(caseSlip(strokes('HEllo', 'en'), letter)?.kind).toBe('two')
    expect(caseSlip(strokes('IDs', 'en'), letter)).toBeUndefined()
    expect(caseSlip(strokes('Hello', 'en'), letter)).toBeUndefined()
  })

  test('Caps Lock left on, Shift held for the first', () => {
    const typed = strokes('Ghbdtn', 'en').map(s => ({ ...s, caps: true }))
    const slip = caseSlip(typed, letter)
    expect(slip?.kind).toBe('caps')
    expect(typeIn(slip?.strokes ?? [], RU, l => TABLES[l])).toBe('Привет')
  })
})

describe('the fix key', () => {
  test('takes the layout that makes the best word, not the next one', () => {
    expect(best('ghbdtn', 'en')).toBe('ru')
    expect(best('ghbdsn', 'en')).toBe('uk')
    expect(best('руддщ', 'ru')).toBe('en')
  })

  test('an explicit press converts what typing leaves alone: digits, a capital inside, a short word', () => {
    expect(best('ghbdtn1', 'en', ['en', 'ru'])).toBe('ru')
    expect(best('gHbdtn', 'en', ['en', 'ru'])).toBe('ru')
    expect(best('yf', 'en', ['en', 'ru'])).toBe('ru')
  })

  test('no word in any layout: none, so the key takes the next one', () => {
    expect(best('hello', 'en', ['en', 'ru'])).toBeUndefined()
    expect(best('R3', 'en', ['en', 'ru'])).toBeUndefined()
  })

  test('a layout without a word list is never chosen', () => {
    const { typed, others } = readings('ghbdtn', 'en', ['en', 'ru'])
    expect(bestLayout(typed, others.map(o => ({ ...o, lang: 'xx' })), LEXICONS)).toBeUndefined()
  })
})
