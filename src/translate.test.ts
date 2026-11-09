import * as fs from 'node:fs'

import { describe, expect, test } from 'vitest'

import { englishHtml, translationHtml } from './render'
import {
  directionOf,
  drafted,
  englishReady,
  languageOf,
  pairText,
  plainText,
  splitText,
  targetFor,
  throughEnglish,
  translateLines,
  translatePairs,
  translatePlain,
  type LanguageWords,
  type Line,
  type TextLine,
  type Translate,
} from './translate'

/** A translator that marks what it was asked: "[ru>en] text". */
const fake: Translate = async (sentences, from, to) => sentences.map(s => `[${from}>${to}] ${s}`)

describe('pairText', () => {
  test('each sentence goes the way its script says', async () => {
    const lines = await pairText('Сборка упала. Check the log.', 'Russian', fake)
    expect(lines).toEqual([
      {
        prefix: '',
        pairs: [
          { en: '[ru>en] Сборка упала.', other: 'Сборка упала.' },
          { en: 'Check the log.', other: '[en>ru] Check the log.' },
        ],
      },
    ])
  })

  test('keeps list markers, collapses empty lines into one paragraph break, drops trailing ones', async () => {
    const lines = await pairText('- Open it.\r\n\r\n\r\n2) Run it.\n\n', 'Russian', fake)
    expect(lines.map(l => [l.prefix, l.pairs.length])).toEqual([
      ['- ', 1],
      ['', 0],
      ['2) ', 1],
    ])
  })

  test('a sentence with too few letters, or a missing answer, stays as it is', async () => {
    const none: Translate = async sentences => sentences.map(() => undefined)
    expect(await pairText('42. Run it.', 'Russian', none)).toEqual([{ prefix: '42. ', pairs: [{ en: 'Run it.' }] }])
    expect(directionOf('OK', 'Russian')).toBeUndefined()
    expect(directionOf('Готово', 'Russian')).toBe('en')
    expect(directionOf('Done here', 'Russian')).toBe('native')
  })

  test('a sentence in the person’s script goes into English however many English words it holds', () => {
    // From a screenshot: the path is not in backticks, and Latin letters are half of them.
    expect(directionOf('Доска, раунд 3 (сборщик opus high, тот же design-lab/2026-10-25-clubs-review/build/build.mjs, новый раздел наверху)', 'Russian')).toBe('en')
    expect(directionOf('Run `npm test` in E:/Cursor/tu-talk first.', 'Russian')).toBe('native')
    // A single stray letter does not make an English sentence Russian.
    expect(directionOf('Press Ctrl+С twice.', 'Russian')).toBe('native')
    // A Latin-script native: no way to tell German from English yet.
    expect(directionOf('Das ist ein Test.', 'German')).toBe('native')
  })
})

describe('splitText', () => {
  test('an English text reads in English before anything is translated', async () => {
    const split = splitText('Check the log. OK', 'Russian')
    expect(englishReady(split)).toBe(true)
    const before = englishHtml(split.lines)
    const lines = await translateLines(split, 'Russian', fake)
    expect(englishHtml(lines)).toBe(before)
    expect(lines[0]?.pairs.map(p => p.other)).toEqual(['[en>ru] Check the log.', undefined])
  })

  test('a text in the person’s script waits for its English', () => {
    expect(englishReady(splitText('Сборка упала. Check the log.', 'Russian'))).toBe(false)
  })
})

describe('englishHtml, translationHtml', () => {
  test('two halves: every line a paragraph, escaped sides, sentences numbered across the text', async () => {
    const lines = await pairText('Use <b>.\nСтоп.\n\n- Next', 'Russian', fake)
    expect(englishHtml(lines)).toBe(
      '<p><span class="s" data-i="0" dir="auto">Use &lt;b&gt;.</span></p><p><span class="s" data-i="1" dir="auto">[ru&gt;en] Стоп.</span></p>' +
        '<p>- <span class="s" data-i="2" dir="auto">Next</span></p>',
    )
    expect(translationHtml(lines)).toBe(
      '<p><span class="t" data-i="0" dir="auto">[en&gt;ru] Use &lt;b&gt;.</span></p><p><span class="t" data-i="1" dir="auto">Стоп.</span></p>' +
        '<p>- <span class="t" data-i="2" dir="auto">[en&gt;ru] Next</span></p>',
    )
  })

  test('a chat’s single line breaks are paragraphs; a sentence broken across lines is one', async () => {
    const chat = 'Card size: drag an edge.\nListen to parts: the remote.\nHotkeys:\nCtrl+C twice can be turned off.'
    expect(englishHtml(await pairText(chat, 'Russian', fake)).match(/<p>/g)).toHaveLength(4)
    const pdf = 'The quick brown fox\njumps over the lazy dog.'
    expect(englishHtml(await pairText(pdf, 'Russian', fake))).toBe('<p><span class="s" data-i="0" dir="auto">The quick brown fox jumps over the lazy dog.</span></p>')
  })
})

describe('a text as it is', () => {
  const lists = JSON.parse(fs.readFileSync('media/lang-words.json', 'utf8')) as Record<string, string[]>
  const words: LanguageWords = {
    common: Object.fromEntries(Object.entries(lists).map(([code, list]) => [code, new Set(list)])),
    english: new Set(fs.readFileSync('media/layout/en.txt', 'utf8').split('\n')),
  }

  test('its language is guessed from its letters and its common words', () => {
    const cases: [string, string][] = [
      ['Привет, как дела? Я сегодня работаю дома.', 'ru'],
      ['Привіт, як справи? Я сьогодні працюю вдома.', 'uk'],
      ['Здравей, как си? Днес работя вкъщи и това е добре.', 'bg'],
      ['Сәлеметсіз бе, қалыңыз қалай?', 'kk'],
      ['The weather is nice today and I am going to the park.', 'en'],
      ['Ich habe heute keine Zeit, aber morgen komme ich gern.', 'de'],
      ["Je ne sais pas ce que tu veux dire, mais c'est bien.", 'fr'],
      ['No sé qué quieres decir, pero está bien.', 'es'],
      ['Nie wiem, co chcesz powiedzieć, ale to jest dobre.', 'pl'],
      ['Bugün çok yorgunum ama yarın seninle buluşabilirim.', 'tr'],
      ['من امروز به پارک رفتم', 'fa'],
      ['أنا لا أعرف ماذا تريد', 'ar'],
      ['Καλημέρα, τι κάνεις;', 'el'],
      ['今日はいい天気ですね', 'ja'],
    ]
    for (const [text, code] of cases) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, code])
  })

  test('a short text: English by its words, or the person\'s own language', () => {
    expect(languageOf('hello', 'Russian', words)).toBe('en')
    expect(languageOf('Straße', 'German', words)).toBe('de')
    expect(languageOf('кошка', 'Bulgarian', words)).toBe('bg')
  })

  test('the languages the person uses narrow the guess within their script', () => {
    const text = 'Днес съм вкъщи.'
    expect(languageOf(text, 'Russian', words)).toBe('bg')
    expect(languageOf(text, 'Russian', words, ['ru', 'en'])).toBe('ru')
    expect(languageOf('Ich bin da', 'Russian', words, ['ru', 'en', 'de'])).toBe('de')
    // A short Latin line stays English; a script none of them uses, and letters only one language has, as before.
    expect(languageOf('hello', 'Russian', words, ['ru', 'en'])).toBe('en')
    expect(languageOf('今日はいい天気ですね', 'Russian', words, ['ru', 'en'])).toBe('ja')
    expect(languageOf('Привіт, як справи?', 'Russian', words, ['ru', 'en'])).toBe('uk')
  })

  test('translated into English from the person\'s language, into it from any other', () => {
    expect(targetFor('ru', 'Russian')).toBe('en')
    expect(targetFor('en', 'Russian')).toBe('ru')
    expect(targetFor('de', 'Russian')).toBe('ru')
  })

  test('the target is the person\'s own language for any language but their own, and English for their own', () => {
    expect(targetFor('uk', 'Russian')).toBe('ru')
    expect(targetFor('ja', 'German')).toBe('de')
    expect(targetFor('de', 'German')).toBe('en')
    expect(targetFor('en', 'Ukrainian')).toBe('uk')
    expect(targetFor('uk', 'Ukrainian')).toBe('en')
  })

  test('і ї є ґ are Ukrainian, whoever the person is', () => {
    for (const text of ['їжак', 'єдність', 'ґанок', 'Привіт друзі', 'Мій дім']) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, 'uk'])
    expect(languageOf('їжак', 'Bulgarian', words, ['bg', 'en'])).toBe('uk')
  })

  test('ы э ё are Russian, even for a Ukrainian or Bulgarian', () => {
    for (const text of ['Это ёж', 'сыр', 'эхо']) expect([text, languageOf(text, 'Ukrainian', words)]).toEqual([text, 'ru'])
    expect(languageOf('сыр', 'Bulgarian', words, ['bg', 'en'])).toBe('ru')
  })

  test('ђ ћ џ љ њ are Serbian', () => {
    for (const text of ['ђак', 'ћао свима', 'џем', 'љубав', 'њихов дом']) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, 'sr'])
  })

  test('қ ғ ү ұ һ ә ө are Kazakh, ahead of і and ы', () => {
    for (const text of ['қала', 'тағам', 'күн', 'ұлы', 'ақша һәм', 'әке', 'өмір']) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, 'kk'])
    expect(languageOf('Қазақстан — біздің ыстық үй', 'Russian', words)).toBe('kk')
  })

  test.fails('ң is Kazakh too, but its letters list leaves it out', () => {
    expect(languageOf('аңшы', 'Russian', words)).toBe('kk')
  })

  test('پ چ ژ گ are Persian, even for an Arabic speaker', () => {
    for (const text of ['پدر', 'چای', 'ژاله', 'گل سرخ']) expect([text, languageOf(text, 'Arabic', words)]).toEqual([text, 'fa'])
    expect(languageOf('أنا لا أعرف ماذا تريد', 'Persian', words)).toBe('ar')
  })

  test('a script of one language is that language', () => {
    const cases: [string, string][] = [
      ['Καλημέρα κόσμε', 'el'],
      ['שלום עולם', 'he'],
      ['გამარჯობა მსოფლიო', 'ka'],
      ['Բարեւ աշխարհ', 'hy'],
      ['नमस्ते दुनिया', 'hi'],
      ['สวัสดีชาวโลก', 'th'],
      ['你好，世界', 'zh'],
      ['안녕하세요 세계', 'ko'],
      ['こんにちは世界', 'ja'],
      ['日本語のテキストです', 'ja'],
    ]
    for (const [text, code] of cases) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, code])
  })

  test('a script of one language is that language even when the person does not use it', () => {
    expect(languageOf('שלום עולם', 'Russian', words, ['ru', 'en'])).toBe('he')
    expect(languageOf('გამარჯობა', 'German', words, ['de', 'en'])).toBe('ka')
  })

  test('a text with no letters at all is English', () => {
    for (const text of ['12345', '3.14 + 2 = 5', '😀😀😀', '', '   ', '!!! ???']) expect([text, languageOf(text, 'Russian', words)]).toEqual([text, 'en'])
  })

  test('a link alone is English, and one inside a Russian text does not change it', () => {
    expect(languageOf('https://example.com/a/b?c=1', 'Russian', words)).toBe('en')
    expect(languageOf('https://ru.wikipedia.org/wiki/Привет', 'Russian', words)).toBe('en')
    expect(languageOf('Привет, смотри https://example.com/page и скажи мне', 'Russian', words)).toBe('ru')
  })

  test('Cyrillic without a marker letter goes by common words, and only among the languages the person uses', () => {
    const text = 'Я не знаю, что делать дальше'
    expect(languageOf(text, 'German', words)).toBe('ru')
    expect(languageOf('Днес съм вкъщи.', 'German', words)).toBe('bg')
    expect(languageOf('Днес съм вкъщи.', 'German', words, ['de', 'en', 'ru'])).toBe('ru')
    expect(languageOf(text, 'German', words, ['de', 'en', 'bg'])).toBe('bg')
  })

  test('a pool with no language of the text\'s script leaves all 32 in play', () => {
    expect(languageOf('Днес съм вкъщи.', 'German', words, ['de', 'en'])).toBe('bg')
    expect(languageOf('Привіт, як справи? Я сьогодні працюю вдома.', 'German', words, ['de', 'en'])).toBe('uk')
    expect(languageOf('أنا لا أعرف ماذا تريد', 'Russian', words, ['ru', 'en'])).toBe('ar')
    expect(languageOf('Я не знаю, что делать дальше', 'German', words, ['de', 'en'])).toBe('ru')
  })

  test('a pool of Latin languages keeps a Latin text among them', () => {
    expect(languageOf('Ich habe heute keine Zeit, aber morgen komme ich gern.', 'Russian', words, ['ru', 'en', 'de'])).toBe('de')
    expect(languageOf('The weather is nice today and I am going to the park.', 'Russian', words, ['ru', 'en', 'de'])).toBe('en')
    expect(languageOf('No sé qué quieres decir, pero está bien.', 'Russian', words, ['ru', 'en'])).toBe('en')
  })

  test('translated through English when neither side is English', async () => {
    const calls: string[] = []
    const translate: Translate = async (sentences, from, to) => {
      calls.push(`${from}-${to}`)
      return sentences.map(s => `${to}(${s})`)
    }
    expect(await translatePlain('Hallo. Wie geht es?\n\n- Gut', 'de', 'ru', translate)).toBe('ru(en(Hallo.)) ru(en(Wie geht es?))\n\n- ru(en(Gut))')
    expect(calls).toEqual(['de-en', 'en-ru'])
    calls.length = 0
    expect(await translatePlain('Hello.', 'en', 'en', translate)).toBe('Hello.')
    expect(calls).toEqual([])
  })
})

describe('translatePairs', () => {
  const translate: Translate = async (sentences, _from, to) => sentences.map(s => `${to}(${s})`)

  test('every sentence beside its translation, lines and list markers kept, numbered in order', async () => {
    const lines = await translatePairs('Hallo. Wie geht es?\n\n- Gut', 'de', 'en', translate)
    expect(lines).toEqual([
      { prefix: '', pairs: [{ src: 'Hallo.', out: 'en(Hallo.)' }, { src: 'Wie geht es?', out: 'en(Wie geht es?)' }] },
      { prefix: '', pairs: [] },
      { prefix: '- ', pairs: [{ src: 'Gut', out: 'en(Gut)' }] },
    ])
    expect(lines.flatMap(l => l.pairs.map(p => p.src))).toEqual(['Hallo.', 'Wie geht es?', 'Gut'])
  })

  test('a line broken mid-sentence is one sentence, as the card finds it in the field', async () => {
    const lines = await translatePairs('This is a long\nsentence. And a word bro-\nken here.', 'en', 'ru', translate)
    expect(lines.flatMap(l => l.pairs.map(p => p.src))).toEqual(['This is a long sentence.', 'And a word broken here.'])
  })

  test('a sentence the translator leaves out stays as it is', async () => {
    const some: Translate = async sentences => sentences.map((s, i) => (i === 0 ? '  ' : `x(${s})`))
    const lines = await translatePairs('One. Two.', 'en', 'ru', some)
    expect(lines[0]?.pairs).toEqual([{ src: 'One.', out: 'One.' }, { src: 'Two.', out: 'x(Two.)' }])
  })

  test('plainText is what Copy and Paste take: the translations, line by line', async () => {
    const lines = await translatePairs('Hallo. Wie geht es?\n\n- Gut', 'de', 'ru', translate)
    expect(plainText(lines)).toBe(await translatePlain('Hallo. Wie geht es?\n\n- Gut', 'de', 'ru', translate))
    expect(plainText(lines)).toBe('ru(en(Hallo.)) ru(en(Wie geht es?))\n\n- ru(en(Gut))')
  })

  test('a direct translator goes from one language into the other without English between', async () => {
    expect(await translatePlain('Hallo. Wie geht es?', 'de', 'ru', translate, true)).toBe('ru(Hallo.) ru(Wie geht es?)')
  })
})

describe('a draft first, the accurate translation sentence by sentence', () => {
  /** An accurate translator answering its sentences one by one, in the order `order` gives, a tick apart. */
  const accurate =
    (order: number[] = []): Translate =>
    async (sentences, _from, to, progress) => {
      const out = sentences.map(s => `${to}{${s}}`)
      for (const i of order.length ? order : sentences.map((_, i) => i)) {
        await new Promise(resolve => setTimeout(resolve, 2))
        progress?.(i, out[i], false)
      }
      return out
    }
  const quick: Translate = async (sentences, _from, to) => sentences.map(s => `${to}~${s}`)

  test('the draft comes first, every sentence of it, and each accurate one replaces its own', async () => {
    const seen: TextLine[][] = []
    const lines = await translatePairs('One. Two. Three.', 'en', 'ru', drafted(accurate([1, 0, 2]), quick), true, l => seen.push(structuredClone(l)))
    expect(seen[2]?.[0]?.pairs).toEqual([
      { src: 'One.', out: 'ru~One.', draft: true },
      { src: 'Two.', out: 'ru~Two.', draft: true },
      { src: 'Three.', out: 'ru~Three.', draft: true },
    ])
    // The second sentence was ready first: it alone is accurate in the update after the draft.
    expect(seen.find(l => l[0]?.pairs.some(p => !p.draft))?.[0]?.pairs.map(p => p.out)).toEqual(['ru~One.', 'ru{Two.}', 'ru~Three.'])
    expect(seen.at(-1)?.[0]?.pairs.map(p => p.draft)).toEqual([undefined, undefined, undefined])
    expect(lines[0]?.pairs).toEqual([
      { src: 'One.', out: 'ru{One.}' },
      { src: 'Two.', out: 'ru{Two.}' },
      { src: 'Three.', out: 'ru{Three.}' },
    ])
  })

  test('a draft later than the accurate sentence never replaces it', async () => {
    const late: Translate = async (sentences, from, to) => (await new Promise(resolve => setTimeout(resolve, 30)), quick(sentences, from, to))
    const seen: TextLine[][] = []
    await translatePairs('One. Two.', 'en', 'ru', drafted(accurate(), late), true, l => seen.push(structuredClone(l)))
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(seen.flat().flatMap(l => l.pairs).some(p => p.out.includes('~'))).toBe(false)
  })

  test('a draft that fails changes nothing; nobody listening, only the accurate one runs', async () => {
    let asked = 0
    const broken: Translate = async () => {
      asked++
      throw new Error('no models')
    }
    expect(plainText(await translatePairs('One. Two.', 'en', 'ru', drafted(accurate(), broken), true, () => undefined))).toBe('ru{One.} ru{Two.}')
    expect(asked).toBe(1)
    expect(await drafted(accurate(), broken)(['One.'], 'en', 'ru')).toEqual(['ru{One.}'])
    expect(asked).toBe(1)
  })

  test('a model that gives up leaves the draft as the translation, its own sentences kept; any other error still fails', async () => {
    class Slow extends Error {}
    const givesUp: Translate = async (sentences, _from, to, progress) => {
      await new Promise(resolve => setTimeout(resolve, 2))
      progress?.(0, `${to}{${sentences[0]}}`, false)
      throw new Slow()
    }
    const gaveUp = (error: unknown) => error instanceof Slow
    const seen: TextLine[][] = []
    const lines = await translatePairs('One. Two.', 'en', 'ru', drafted(givesUp, quick, gaveUp), true, l => seen.push(structuredClone(l)))
    expect(lines[0]?.pairs).toEqual([
      { src: 'One.', out: 'ru{One.}' },
      { src: 'Two.', out: 'ru~Two.' },
    ])
    // Nobody listening: the draft is made then.
    expect(await drafted(givesUp, quick, gaveUp)(['One.'], 'en', 'ru')).toEqual(['ru~One.'])
    await expect(drafted(givesUp, quick)(['One.'], 'en', 'ru')).rejects.toBeInstanceOf(Slow)
  })

  test("Firefox's translator goes through English when neither side is", async () => {
    const english: Translate = async (sentences, from, to) => sentences.map(s => `${from}>${to}(${s})`)
    expect(await throughEnglish(english)(['Hallo.'], 'de', 'ru')).toEqual(['en>ru(de>en(Hallo.))'])
    expect(await throughEnglish(english)(['Hallo.'], 'de', 'en')).toEqual(['de>en(Hallo.)'])
    expect(await throughEnglish(english)(['Hallo.'], 'de', 'de')).toEqual(['Hallo.'])
  })

  test('Listen: drafts only under the text, never the English on top that the voice reads', async () => {
    const seen: Line[][] = []
    const lines = await translateLines(splitText('Привет. Hello there.', 'Russian'), 'Russian', drafted(accurate(), quick), l => seen.push(structuredClone(l)))
    const first = seen[0]?.[0]?.pairs
    expect(first?.[0]).toEqual({ en: 'en{Привет.}', other: 'Привет.' })
    expect(first?.[1]).toEqual({ en: 'Hello there.', other: 'ru~Hello there.', draft: true })
    expect(lines[0]?.pairs).toEqual([
      { en: 'en{Привет.}', other: 'Привет.' },
      { en: 'Hello there.', other: 'ru{Hello there.}' },
    ])
  })
})
