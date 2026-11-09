import { describe, expect, test } from 'vitest'

import { draftsIn, englishHtml, escapeHtml, textOutHtml, translationHtml } from './render'
import { splitText, type Line } from './translate'

const line = (prefix: string, ...pairs: { en: string; other?: string }[]): Line => ({ prefix, pairs })

describe('escapeHtml', () => {
  test('escapes ampersands first, then angle brackets', () => {
    expect(escapeHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  test('leaves quotes alone, as text is never put in an attribute', () => {
    expect(escapeHtml('say "hi"')).toBe('say "hi"')
  })
})

describe('englishHtml', () => {
  test('escapes < > & and keeps quotes in the English half, and the marker', () => {
    const html = englishHtml([line('> ', { en: '<b>"Tom & Jerry"</b>' })])
    expect(html).toBe('<p>&gt; <span class="s" data-i="0" dir="auto">&lt;b&gt;"Tom &amp; Jerry"&lt;/b&gt;</span></p>')
  })

  test('numbers sentences on across paragraphs and joins a line\'s sentences with a space', () => {
    const html = englishHtml([line('', { en: 'One.' }, { en: 'Two.' }), line('- ', { en: 'Three.' }), line('', { en: 'Four.' })])
    expect(html).toBe(
      '<p><span class="s" data-i="0" dir="auto">One.</span> <span class="s" data-i="1" dir="auto">Two.</span></p>' +
        '<p>- <span class="s" data-i="2" dir="auto">Three.</span></p>' +
        '<p><span class="s" data-i="3" dir="auto">Four.</span></p>',
    )
  })

  test('draws nothing for an empty text', () => {
    expect(englishHtml([])).toBe('')
  })

  test('a line without sentences draws no paragraph and takes no number', () => {
    const html = englishHtml([line('', { en: 'A.' }), line(''), line('', { en: 'B.' })])
    expect(html.match(/<p>/g)).toHaveLength(2)
    expect(html).toContain('data-i="1"')
    expect(html).not.toContain('data-i="2"')
  })

  test('a sentence of only spaces stays a span, as it is not trimmed here', () => {
    expect(englishHtml([line('', { en: '   ' })])).toBe('<p><span class="s" data-i="0" dir="auto">   </span></p>')
  })
})

describe('a split text drawn', () => {
  test('empty lines and lines of only spaces make no paragraphs of their own', () => {
    const { lines } = splitText('First.\n\n   \nSecond.\n  \n', 'Russian')
    const html = englishHtml(lines)
    expect(html.match(/<p>/g)).toHaveLength(2)
    expect(html).toContain('data-i="1"')
    expect(translationHtml(lines).match(/<p>/g)).toHaveLength(2)
  })

  test('a text of only spaces draws nothing', () => {
    expect(englishHtml(splitText('  \n \n', 'Russian').lines)).toBe('')
  })
})

describe('translationHtml', () => {
  test('escapes < > & and keeps quotes in the other half', () => {
    const html = translationHtml([line('', { en: 'x', other: '<i>"Том & Джерри"</i>' })])
    expect(html).toBe('<p><span class="t" data-i="0" dir="auto">&lt;i&gt;"Том &amp; Джерри"&lt;/i&gt;</span></p>')
  })

  test('a sentence without a translation shows its English, escaped', () => {
    expect(translationHtml([line('', { en: 'a < b' })])).toBe('<p><span class="t" data-i="0" dir="auto">a &lt; b</span></p>')
  })

  test('an empty translation is not replaced by the English', () => {
    expect(translationHtml([line('', { en: 'x', other: '' })])).toBe('<p><span class="t" data-i="0" dir="auto"></span></p>')
  })

  test('numbers sentences on across paragraphs as the English half does', () => {
    const lines = [line('', { en: 'a', other: 'А' }), line(''), line('1. ', { en: 'b', other: 'Б' }, { en: 'c', other: 'В' })]
    expect(translationHtml(lines).match(/data-i="(\d)"/g)).toEqual(['data-i="0"', 'data-i="1"', 'data-i="2"'])
    expect(translationHtml(lines)).toContain('<p>1. <span class="t" data-i="1"')
  })

  test('escapes a list marker too', () => {
    expect(translationHtml([line('&gt; ', { en: 'a' })])).toContain('<p>&amp;gt; <span')
  })
})

describe('textOutHtml', () => {
  test("the translator's lower half: every translation a span.t numbered as the text's sentences", () => {
    const lines = [
      { prefix: '', pairs: [{ src: 'Hallo.', out: 'Hello.' }, { src: 'Wie?', out: 'How?' }] },
      { prefix: '', pairs: [] },
      { prefix: '- ', pairs: [{ src: 'a < b', out: 'a < b' }] },
    ]
    expect(textOutHtml(lines)).toBe(
      '<p><span class="t" data-i="0" dir="auto">Hello.</span> <span class="t" data-i="1" dir="auto">How?</span></p><p>- <span class="t" data-i="2" dir="auto">a &lt; b</span></p>',
    )
  })
})

test('a draft sentence is span.t.draft until its accurate translation replaces it; drafts are counted', () => {
  const lines = [{ prefix: '', pairs: [{ src: 'One.', out: 'Раз.', draft: true }, { src: 'Two.', out: 'Два.' }] }]
  expect(textOutHtml(lines)).toBe('<p><span class="t draft" data-i="0" dir="auto">Раз.</span> <span class="t" data-i="1" dir="auto">Два.</span></p>')
  expect(translationHtml([{ prefix: '', pairs: [{ en: 'One.', other: 'Раз.', draft: true }] }])).toContain('class="t draft"')
  expect(draftsIn(lines)).toBe(1)
  const done = [{ prefix: '', pairs: [{ src: 'One.', out: 'Раз.' }] }]
  expect(draftsIn(done)).toBe(0)
})
