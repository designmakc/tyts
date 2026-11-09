import { describe, expect, it } from 'vitest'

import { modOf } from './hotkey'
import { MAC_TO_VK, macCaret, macKeyboardLayout, macLang, macTable, VK_TO_MAC, type MacLayout } from './kbdmac'
import { charOf, convertText } from './layoutfix'

// Mac key codes of the letters g h b d t n, as Carbon's kVK_ANSI_* name them.
const KEYS = { g: 5, h: 4, b: 11, d: 2, t: 17, n: 45, comma: 43 }
const layout = (id: string, lang: string, chars: Record<number, [string, string]>): MacLayout => ({
  id,
  name: id,
  lang,
  keys: Object.fromEntries(Object.entries(chars)) as MacLayout['keys'],
})
const abc = layout('com.apple.keylayout.ABC', 'en', { 5: ['g', 'G'], 4: ['h', 'H'], 11: ['b', 'B'], 2: ['d', 'D'], 17: ['t', 'T'], 45: ['n', 'N'], 43: [',', '<'] })
const russian = layout('com.apple.keylayout.RussianWin', 'ru', { 5: ['п', 'П'], 4: ['р', 'Р'], 11: ['и', 'И'], 2: ['в', 'В'], 17: ['е', 'Е'], 45: ['т', 'Т'], 43: ['б', 'Б'] })

describe('Mac keys as Windows keys', () => {
  it('maps every Mac key to one Windows key and back', () => {
    const vks = Object.values(MAC_TO_VK)
    expect(new Set(vks).size).toBe(vks.length)
    for (const [mac, vk] of Object.entries(MAC_TO_VK)) expect(VK_TO_MAC[vk]).toBe(Number(mac))
  })

  it('reads the letters by their place, as Windows names them', () => {
    expect(MAC_TO_VK[KEYS.g]).toBe(0x47)
    expect(MAC_TO_VK[KEYS.n]).toBe(0x4e)
    expect(MAC_TO_VK[KEYS.comma]).toBe(0xbc)
    expect(MAC_TO_VK[49]).toBe(0x20) // Space ends a word
    expect(MAC_TO_VK[51]).toBe(0x08) // Delete is Backspace
  })

  it('reads Cmd as Ctrl, Option as Alt, Control as Win', () => {
    expect(modOf(MAC_TO_VK[55] as number)).toBe('Control')
    expect(modOf(MAC_TO_VK[54] as number)).toBe('Control')
    expect(modOf(MAC_TO_VK[58] as number)).toBe('Alt')
    expect(modOf(MAC_TO_VK[56] as number)).toBe('Shift')
    expect(modOf(MAC_TO_VK[59] as number)).toBe('Super')
  })

  it('makes a layout table typist.ts reads', () => {
    const table = macTable(russian)
    expect(charOf(table, 0x47, false, false)).toBe('п')
    expect(charOf(table, 0x47, true, false)).toBe('П')
    expect(charOf(table, 0x47, false, true)).toBe('П')
    expect(convertText('ghbdtn', macTable(abc), table)).toBe('привет')
    expect(convertText('ghbdtn,', macTable(abc), table)).toBe('приветб')
  })

  it('leaves out keys that type nothing', () => {
    const table = macTable(layout('x', 'en', { 5: ['g', ''] }))
    expect(charOf(table, 0x47, true, false)).toBeUndefined()
  })

  it('names the language as the layout fixer does', () => {
    expect(macLang(layout('a', 'uk-UA', {}))).toBe('uk')
    expect(macLang(layout('a', 'zh_Hans', {}))).toBe('zh')
    expect(macKeyboardLayout(russian)).toEqual({ id: russian.id, name: russian.id, short: 'RU', lang: 'ru' })
  })
})

describe('the text cursor on a Mac', () => {
  it("takes the helper's place as it is, in points", () => {
    expect(macCaret({ x: 479, y: 751, h: 20 })).toEqual({ x: 479, y: 751, h: 20 })
  })

  it('takes none for no answer, an empty one or a nonsense one', () => {
    expect(macCaret({})).toBeUndefined()
    expect(macCaret({ x: 10, y: 20 })).toBeUndefined()
    expect(macCaret({ x: 10, y: 20, h: 0 })).toBeUndefined()
    expect(macCaret({ x: Number.NaN, y: 20, h: 18 })).toBeUndefined()
    expect(macCaret({ x: 10, y: 20, h: 900 })).toBeUndefined()
    expect(macCaret({ x: '10', y: 20, h: 18 })).toBeUndefined()
  })
})
