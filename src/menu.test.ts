import { describe, expect, test } from 'vitest'

import { menuGroups, menuKeyOf } from './menu'
import { placeMenu } from './placement'

describe('the items', () => {
  test('ten in five groups with the speech engine, the voice\'s group gone without it', () => {
    for (const lang of ['en', 'uk', 'ru'] as const) {
      expect(menuGroups(lang, true).map(g => g.length)).toEqual([4, 2, 2, 1, 1])
      expect(menuGroups(lang, false).map(g => g.length)).toEqual([4, 2, 1, 1])
    }
  })

  test('in each language every letter is its own key', () => {
    for (const lang of ['en', 'uk', 'ru'] as const) {
      const items = menuGroups(lang, true).flat()
      expect(new Set(items.map(i => i.code)).size).toBe(items.length)
      expect(new Set(items.map(i => i.letter)).size).toBe(items.length)
    }
  })

  test('a Russian or Ukrainian letter is the key that types it in ЙЦУКЕН', () => {
    const code = (lang: 'uk' | 'ru', id: string) => menuGroups(lang, true).flat().find(i => i.id === id)?.code
    expect(code('ru', 'translate')).toBe('KeyG')
    expect(code('ru', 'screen')).toBe('Quote')
    expect(code('uk', 'fix')).toBe('KeyD')
    expect(code('ru', 'awake')).toBe('KeyY')
  })
})

describe('a key in the open menu', () => {
  const items = menuGroups('en', true).flat()

  test('a letter picks its item, wherever the light is', () => {
    expect(menuKeyOf('KeyF', items, 0)).toEqual({ pick: 8 })
  })

  test('the arrows go round, Enter picks what is lit, Esc closes', () => {
    expect(menuKeyOf('ArrowUp', items, 0)).toEqual({ lit: 9 })
    expect(menuKeyOf('ArrowDown', items, 9)).toEqual({ lit: 0 })
    expect(menuKeyOf('Enter', items, 3)).toEqual({ pick: 3 })
    expect(menuKeyOf('Escape', items, 3)).toBe('close')
  })

  test('a letter of the other language\'s table is nothing here', () => {
    expect(menuKeyOf('KeyB', items, 0)).toBeUndefined()
  })
})

describe('where it opens', () => {
  const area = { x: 0, y: 0, width: 1000, height: 800 }
  const size = { width: 300, height: 400 }

  test('under the text cursor, a little left of it', () => {
    expect(placeMenu({ x: 200, top: 100, bottom: 120 }, size, area)).toEqual({ x: 188, y: 128, width: 300, height: 400 })
  })

  test('over it where the screen ends', () => {
    expect(placeMenu({ x: 200, top: 600, bottom: 620 }, size, area).y).toBe(192)
  })

  test('never outside the work area, on a screen left of the first too', () => {
    expect(placeMenu({ x: 990, top: 100, bottom: 120 }, size, area).x).toBe(700)
    expect(placeMenu({ x: 5, top: 100, bottom: 120 }, size, area).x).toBe(0)
    expect(placeMenu({ x: -1900, top: 100, bottom: 120 }, size, { ...area, x: -1920 }).x).toBe(-1912)
  })
})
