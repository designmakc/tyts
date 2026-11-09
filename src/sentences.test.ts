import { describe, expect, test } from 'vitest'

import { lineUnits, splitSentences, unwrapLines } from './sentences'

describe('sentences', () => {
  test('splits a line into sentences, keeps a list item whole', () => {
    expect(lineUnits('Open the menu. Pick the disk.')).toEqual({ prefix: '', sentences: ['Open the menu.', 'Pick the disk.'] })
    expect(lineUnits('1. Run it as admin. Then wait.')).toEqual({ prefix: '1. ', sentences: ['Run it as admin. Then wait.'] })
    expect(lineUnits('• Готово.')).toEqual({ prefix: '• ', sentences: ['Готово.'] })
  })

  test('does not split after e.g. or т.е.', () => {
    expect(splitSentences('Use a tool, e.g. Victoria. It works.')).toEqual(['Use a tool, e.g. Victoria.', 'It works.'])
    expect(splitSentences('Возьми диск, т.е. Новый. Потом жди.')).toEqual(['Возьми диск, т.е. Новый.', 'Потом жди.'])
  })

  test('does not split after i.e., Mr., Dr. or etc.', () => {
    expect(splitSentences('Pick one, i.e. The first. Then go.')).toEqual(['Pick one, i.e. The first.', 'Then go.'])
    expect(splitSentences('Ask Mr. Smith about it. He knows.')).toEqual(['Ask Mr. Smith about it.', 'He knows.'])
    expect(splitSentences('Call Dr. Who. Now.')).toEqual(['Call Dr. Who.', 'Now.'])
    expect(splitSentences('Take pens, paper, etc. Then leave.')).toEqual(['Take pens, paper, etc. Then leave.'])
  })

  test('does not split after т.д. or т.п. in Russian', () => {
    expect(splitSentences('Купи хлеб, молоко и т.д. Потом звони.')).toEqual(['Купи хлеб, молоко и т.д. Потом звони.'])
  })

  test('an abbreviation inside a word does not count', () => {
    expect(splitSentences('It was a long list. No. Really.')).toEqual(['It was a long list.', 'No. Really.'])
    expect(splitSentences('Read the Pro. Then the Dr.')).toEqual(['Read the Pro.', 'Then the Dr.'])
  })

  test('a decimal number is not a sentence end', () => {
    expect(splitSentences('Version 3.5 is out. Update now.')).toEqual(['Version 3.5 is out.', 'Update now.'])
    expect(splitSentences('It costs 3.5 dollars.')).toEqual(['It costs 3.5 dollars.'])
  })

  test('an ellipsis ends a sentence only before a capital', () => {
    expect(splitSentences('Well... Maybe.')).toEqual(['Well...', 'Maybe.'])
    expect(splitSentences('Well... maybe so.')).toEqual(['Well... maybe so.'])
    expect(splitSentences('Хм… Может быть.')).toEqual(['Хм…', 'Может быть.'])
  })

  test('an opening quote after a full stop starts the next sentence', () => {
    expect(splitSentences('He left. "Go," he said.')).toEqual(['He left.', '"Go," he said.'])
    expect(splitSentences('Он ушёл. «Иди», — сказал он.')).toEqual(['Он ушёл.', '«Иди», — сказал он.'])
  })

  test.fails('a closing quote after the full stop ends its sentence, but the split looks only at the dot', () => {
    expect(splitSentences('He said "go." Then he left.')).toEqual(['He said "go."', 'Then he left.'])
  })

  test.fails('a closing guillemet after the full stop ends its sentence, but the split looks only at the dot', () => {
    expect(splitSentences('Он сказал: «Иди.» Потом ушёл.')).toEqual(['Он сказал: «Иди.»', 'Потом ушёл.'])
  })

  test('a question or an exclamation ends a sentence like a full stop', () => {
    expect(splitSentences('Really? Yes! Fine.')).toEqual(['Really?', 'Yes!', 'Fine.'])
    expect(splitSentences('Is it 5? No.')).toEqual(['Is it 5?', 'No.'])
  })

  test('a full stop inside a word or after an abbreviation does not split before lower case', () => {
    expect(splitSentences('Open file.txt and read it.')).toEqual(['Open file.txt and read it.'])
    expect(splitSentences('see you at 5 p.m. tomorrow')).toEqual(['see you at 5 p.m. tomorrow'])
    expect(splitSentences('the U.S. army came, e.g. today')).toEqual(['the U.S. army came, e.g. today'])
    expect(splitSentences('см. ниже, напр. так')).toEqual(['см. ниже, напр. так'])
  })

  test('a sentence written in lower case starts after the full stop of a word', () => {
    expect(splitSentences('the build broke again. so we leaned in. fine!')).toEqual(['the build broke again.', 'so we leaned in.', 'fine!'])
    expect(splitSentences('Сборка упала. проверь API.')).toEqual(['Сборка упала.', 'проверь API.'])
    expect(splitSentences('Well... maybe so.')).toEqual(['Well... maybe so.'])
  })

  test('a link or a file name with dots stays inside its sentence', () => {
    expect(splitSentences('Open https://example.com/a.b/c.html now. Then wait.')).toEqual(['Open https://example.com/a.b/c.html now.', 'Then wait.'])
    expect(splitSentences('Write to me@mail.example.com. Thanks.')).toEqual(['Write to me@mail.example.com.', 'Thanks.'])
  })

  test('a line in capitals is cut only at its full stops', () => {
    expect(splitSentences('WARNING: DO NOT TOUCH. CALL THE OFFICE.')).toEqual(['WARNING: DO NOT TOUCH.', 'CALL THE OFFICE.'])
    expect(splitSentences('WARNING DO NOT TOUCH')).toEqual(['WARNING DO NOT TOUCH'])
  })

  test('full-width marks end a sentence without a space', () => {
    expect(splitSentences('今日は晴れです。明日は雨です。')).toEqual(['今日は晴れです。', '明日は雨です。'])
  })

  test('markers are kept outside: numbered with a dot or a bracket, bullets and dashes', () => {
    expect(lineUnits('1. First step.')).toEqual({ prefix: '1. ', sentences: ['First step.'] })
    expect(lineUnits('12) Twelfth step. And more.')).toEqual({ prefix: '12) ', sentences: ['Twelfth step. And more.'] })
    expect(lineUnits('• A point. Another.')).toEqual({ prefix: '• ', sentences: ['A point. Another.'] })
    expect(lineUnits('- A dash item.')).toEqual({ prefix: '- ', sentences: ['A dash item.'] })
    expect(lineUnits('* A star item.')).toEqual({ prefix: '* ', sentences: ['A star item.'] })
    expect(lineUnits('  - [x] Done task.')).toEqual({ prefix: '  - [x] ', sentences: ['Done task.'] })
  })

  test('a number or a dash alone on a line is text, not a marker', () => {
    expect(lineUnits('1.')).toEqual({ prefix: '', sentences: ['1.'] })
    expect(lineUnits('-')).toEqual({ prefix: '', sentences: ['-'] })
  })

  test('a number or a dash without a space after it is not a marker', () => {
    expect(lineUnits('3.5 is a version. Use it.')).toEqual({ prefix: '', sentences: ['3.5 is a version.', 'Use it.'] })
    expect(lineUnits('-5 degrees today.')).toEqual({ prefix: '', sentences: ['-5 degrees today.'] })
  })

  test('a quote arrow is a marker, nested ones too', () => {
    expect(lineUnits('> Quoted words.')).toEqual({ prefix: '> ', sentences: ['Quoted words.'] })
    expect(lineUnits('> > Twice quoted.')).toEqual({ prefix: '> > ', sentences: ['Twice quoted.'] })
  })

  test('a line broken in the middle of a sentence is joined back; any other line break is a new paragraph', () => {
    expect(unwrapLines(['The quick brown fox', 'jumps over the lazy dog.'])).toEqual(['The quick brown fox jumps over the lazy dog.'])
    expect(unwrapLines(['It is a well-', 'known fact, and', 'it holds.'])).toEqual(['It is a wellknown fact, and it holds.'])
    expect(unwrapLines(['Горячие клавиши:', 'Ctrl+C дважды можно выключить.', 'клавишу скриншота можно поменять.'])).toEqual([
      'Горячие клавиши:',
      'Ctrl+C дважды можно выключить.',
      'клавишу скриншота можно поменять.',
    ])
    expect(unwrapLines(['Size: drag an edge', 'Listen to parts'])).toEqual(['Size: drag an edge', 'Listen to parts'])
    expect(unwrapLines(['- first item', 'continues here', '', 'next paragraph', 'goes on'])).toEqual(['- first item continues here', '', 'next paragraph goes on'])
  })

  test('a list item broken mid-sentence goes on; the next item, or a line in capitals, stays apart', () => {
    expect(unwrapLines(['- Кнопка в образце реальна (возврат – тумблер в новом', 'сборка). Чтобы проверить, нажмите.', '- Настоящая рассылка'])).toEqual([
      '- Кнопка в образце реальна (возврат – тумблер в новом сборка). Чтобы проверить, нажмите.',
      '- Настоящая рассылка',
    ])
    expect(unwrapLines(['- one item', '- another item'])).toEqual(['- one item', '- another item'])
    expect(unwrapLines(['- one item', 'A new line'])).toEqual(['- one item', 'A new line'])
    expect(unwrapLines(['> a quote broken', 'in two'])).toEqual(['> a quote broken in two'])
  })

  test('an empty line has no sentences', () => {
    expect(lineUnits('   ')).toEqual({ prefix: '', sentences: [] })
  })
})
