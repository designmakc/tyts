import { afterEach, describe, expect, it } from 'vitest'
import { en, type Key, type Phrase } from './en'
import { engineMessage } from './engine'
import { languageName, levelName, setUiLanguage, sizeText, t } from './index'
import { ru } from './ru'
import { uk } from './uk'

const keys = Object.keys(en) as Key[]
const varsOf = (p: Phrase) => [...new Set((typeof p === 'string' ? p : Object.values(p).join(' ')).match(/\{\w+\}/g) ?? [])].sort()

afterEach(() => setUiLanguage('en'))

describe('the dictionaries', () => {
  for (const [name, dict] of [
    ['uk', uk],
    ['ru', ru],
  ] as const) {
    it(`${name} has every phrase, and no other`, () => {
      expect(Object.keys(dict).sort()).toEqual([...keys].sort())
    })

    it(`${name} fills in what English fills in`, () => {
      const wrong = keys.filter(k => varsOf(dict[k]).join() !== varsOf(en[k]).join())
      expect(wrong).toEqual([])
    })

    it(`${name} gives every plural its four forms`, () => {
      const plural = keys.filter(k => typeof en[k] === 'object')
      for (const k of plural) {
        const p = dict[k]
        expect(typeof p, k).toBe('object')
        if (typeof p === 'object') expect([p.one, p.few, p.many, p.other].every(Boolean), k).toBe(true)
      }
    })

    it(`${name} is translated, not left in English`, () => {
      // Names and keys may stay as they are; a whole English sentence may not.
      const same = keys.filter(k => typeof en[k] === 'string' && (en[k] as string).split(' ').length > 2 && dict[k] === en[k])
      expect(same).toEqual([])
    })

    it(`${name} names the app Тиць, never Kryakl, but for a folder's name`, () => {
      const latin = keys.filter(k => !k.startsWith('about.') && /Kryakl(?! › Reports)/.test(JSON.stringify(dict[k])))
      expect(latin).toEqual([])
      expect(dict['app.name']).toBe('Тиць')
    })
  }
})

describe('t', () => {
  it('fills in a phrase', () => {
    expect(t('tray.kept', { word: 'ghbdtn' })).toBe('Kept: ghbdtn')
    setUiLanguage('uk')
    expect(t('tray.kept', { word: 'ghbdtn' })).toBe('Додано: ghbdtn')
  })

  it('takes the plural form from n', () => {
    expect(t('talk.lines', { n: 1 })).toBe('1 line')
    expect(t('talk.lines', { n: 5 })).toBe('5 lines')
    setUiLanguage('ru')
    expect([1, 2, 5, 21, 22, 11].map(n => t('talk.lines', { n }))).toEqual(['1 реплика', '2 реплики', '5 реплик', '21 реплика', '22 реплики', '11 реплик'])
    setUiLanguage('uk')
    expect([1, 3, 7, 21].map(n => t('talk.lines', { n }))).toEqual(['1 репліка', '3 репліки', '7 реплік', '21 репліка'])
  })

  it('names languages, levels and sizes in the interface’s language', () => {
    expect(languageName('Ukrainian')).toBe('Ukrainian')
    expect(levelName('most')).toBe('Most accurate')
    expect(sizeText(5200)).toBe('5.2 GB')
    setUiLanguage('uk')
    expect(languageName('Ukrainian')).toBe('українська')
    expect(languageName('ru')).toBe('російська')
    expect(levelName('accurate')).toBe('Точний')
    expect(sizeText(84)).toBe('84 МБ')
    // A decimal comma, as Ukrainian writes it.
    expect(sizeText(5200)).toBe('5,2 ГБ')
    setUiLanguage('ru')
    expect(languageName('English')).toBe('английский')
    // A language Kryakl does not know keeps the name given.
    expect(languageName('Klingon')).toBe('Klingon')
  })
})

describe('engineMessage', () => {
  it('puts the speech engine’s refusals in the interface’s language, its reasons as they are', () => {
    expect(engineMessage('No such transcript')).toBe('No such transcript')
    setUiLanguage('ru')
    expect(engineMessage('No such transcript')).toBe('Такой расшифровки нет')
    expect(engineMessage('Could not recognize: CUDA out of memory')).toBe('Не удалось распознать: CUDA out of memory')
    expect(engineMessage('Could not remove small: Access is denied')).toBe('Не удалось удалить small: Access is denied')
    expect(engineMessage('Something new')).toBe('Something new')
  })
})
