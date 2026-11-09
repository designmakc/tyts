import { describe, expect, test } from 'vitest'

import { codeOfVk, COPY_TWICE, HotkeyRecorder, hotkeyLabel, isAccelerator, isCopyTwice, isExtendedKey, parseHotkey } from './hotkey'

/** Events in order: "+Code" down, "-Code" up, "@ms" time passes, "mouse4" a side button; what they record. */
function record(...events: string[]): string[] {
  const recorder = new HotkeyRecorder()
  let now = 0
  const out: string[] = []
  for (const e of events) {
    if (e.startsWith('@')) {
      now += Number(e.slice(1))
      continue
    }
    now += 50
    const r = e.startsWith('mouse') ? recorder.mouse(Number(e.slice(5))) : e.startsWith('+') ? recorder.keydown(e.slice(1), now) : recorder.keyup(e.slice(1), now)
    if (r) out.push(r.partial ? `(${r.hotkey})` : r.more ? `${r.hotkey}?` : r.hotkey)
  }
  return out
}

describe('recording keys', () => {
  test('keys with modifiers, as Electron writes them', () => {
    expect(record('+ControlLeft', '+AltLeft', '+KeyT')).toEqual(['Control+Alt+T'])
    expect(record('+ControlLeft', '+ShiftLeft', '+ArrowUp')).toEqual(['Control+Shift+Up'])
    expect(record('+ControlLeft', '+Slash')).toEqual(['Control+/'])
    expect(record('+F8')).toEqual(['F8'])
  })

  test('a modifier tapped once (it may yet become a double), twice, or with another', () => {
    expect(record('+ControlLeft', '-ControlLeft')).toEqual(['LeftControl?'])
    expect(record('+ControlLeft', '-ControlLeft', '+ControlLeft', '-ControlLeft')).toEqual(['LeftControl?', 'LeftControl*2'])
    expect(record('+ControlLeft', '-ControlLeft', '@600', '+ControlLeft', '-ControlLeft')).toEqual(['LeftControl?', 'LeftControl?'])
    expect(record('+ControlLeft', '+ShiftLeft', '-ShiftLeft', '-ControlLeft')).toEqual(['Control+Shift'])
  })

  test('a key alone, a side button of the mouse', () => {
    expect(record('+Pause')).toEqual(['Pause'])
    expect(record('+CapsLock')).toEqual(['CapsLock'])
    expect(record('mouse4')).toEqual(['MouseForward'])
    expect(record('+ControlLeft', 'mouse3')).toEqual(['Control+MouseBack'])
  })

  test('a typing key needs a modifier', () => {
    expect(record('+KeyQ', '-KeyQ')).toEqual([])
    expect(record('+Space')).toEqual([])
  })

  test('Esc with a modifier is a key; alone it is nothing (the field gives up on it)', () => {
    expect(record('+ControlLeft', '+Escape')).toEqual(['Control+Escape'])
    expect(record('+ShiftLeft', '+AltLeft', '+Escape')).toEqual(['Alt+Shift+Escape'])
    expect(record('+Escape')).toEqual([])
    const recorder = new HotkeyRecorder()
    expect(recorder.holding()).toBe(false)
    recorder.keydown('ControlLeft')
    expect(recorder.holding()).toBe(true)
  })

  test('Shift+Caps Lock', () => {
    expect(record('+ShiftLeft', '+CapsLock')).toEqual(['Shift+CapsLock'])
  })

  test('Ctrl+C once is copying, no key; twice within a moment it is Ctrl+C twice', () => {
    expect(record('+ControlLeft', '+KeyC', '-KeyC', '-ControlLeft')).toEqual(['(Control+C)'])
    expect(record('+ControlLeft', '+KeyC', '-KeyC', '+KeyC')).toEqual(['(Control+C)', COPY_TWICE])
    // Ctrl let go between the two presses: still twice.
    expect(record('+ControlLeft', '+KeyC', '-KeyC', '-ControlLeft', '+ControlLeft', '+KeyC')).toEqual(['(Control+C)', COPY_TWICE])
    // Too slow: two single copies.
    expect(record('+ControlLeft', '+KeyC', '-KeyC', '@500', '+KeyC')).toEqual(['(Control+C)', '(Control+C)'])
    // Another key between them.
    expect(record('+ControlLeft', '+KeyC', '+KeyV', '+KeyC')).toEqual(['(Control+C)', 'Control+V', '(Control+C)'])
    // Ctrl+Shift+C is a key of its own.
    expect(record('+ControlLeft', '+ShiftLeft', '+KeyC')).toEqual(['Control+Shift+C'])
  })
})

describe('reading keys back', () => {
  test('for matching', () => {
    expect(parseHotkey('LeftControl')).toEqual({ kind: 'tap', vk: 0xa2 })
    expect(parseHotkey('LeftControl*2')).toEqual({ kind: 'double', vk: 0xa2 })
    expect(parseHotkey('Shift+Control')).toEqual({ kind: 'chord', mods: ['Control', 'Shift'] })
    expect(parseHotkey('Pause')).toEqual({ kind: 'key', mods: [], vk: 0x13 })
    expect(parseHotkey('Control+MouseBack')).toEqual({ kind: 'mouse', mods: ['Control'], button: 1 })
    expect(parseHotkey('Control+Escape')).toEqual({ kind: 'key', mods: ['Control'], vk: 0x1b })
    expect(parseHotkey('Shift+CapsLock')).toEqual({ kind: 'key', mods: ['Shift'], vk: 0x14 })
    expect(parseHotkey(COPY_TWICE)).toEqual({ kind: 'copyTwice' })
    expect(parseHotkey('Escape')).toBeUndefined()
    expect(parseHotkey('Q')).toBeUndefined()
    expect(parseHotkey('')).toBeUndefined()
  })

  test('Electron holds a key with a modifier, or an F key; the keyboard thread the rest', () => {
    expect(isAccelerator('Control+Alt+T')).toBe(true)
    expect(isAccelerator('F8')).toBe(true)
    expect(isAccelerator('LeftControl*2')).toBe(false)
    expect(isAccelerator('Pause')).toBe(false)
    expect(isAccelerator('Control+Pause')).toBe(false)
    expect(isAccelerator('MouseForward')).toBe(false)
    // Windows takes Ctrl+Esc for Start: the hook holds Esc's keys.
    expect(isAccelerator('Control+Escape')).toBe(false)
    expect(isAccelerator('Shift+CapsLock')).toBe(false)
    // Ctrl+C twice is the clipboard's.
    expect(isAccelerator(COPY_TWICE)).toBe(false)
    expect(isCopyTwice(COPY_TWICE)).toBe(true)
    expect(isCopyTwice('Control+C')).toBe(false)
  })

  test.skipIf(process.platform === 'darwin')('shown the Windows way', () => {
    expect(hotkeyLabel('Control+Alt+S')).toBe('Ctrl+Alt+S')
    expect(hotkeyLabel('LeftControl')).toBe('Left Ctrl')
    expect(hotkeyLabel('LeftControl*2')).toBe('Left Ctrl twice')
    expect(hotkeyLabel('Control+Shift')).toBe('Ctrl+Shift')
    expect(hotkeyLabel('CapsLock')).toBe('Caps Lock')
    expect(hotkeyLabel('Control+MouseBack')).toBe('Ctrl+Mouse Back')
    expect(hotkeyLabel('Control+Escape')).toBe('Ctrl+Esc')
    expect(hotkeyLabel(COPY_TWICE)).toBe('Ctrl+C twice')
  })

  test("the hook's keys named as a page names them", () => {
    expect(codeOfVk(0x43)).toBe('KeyC')
    expect(codeOfVk(0x37)).toBe('Digit7')
    expect(codeOfVk(0x7b)).toBe('F12')
    expect(codeOfVk(0x1b)).toBe('Escape')
    expect(codeOfVk(0x14)).toBe('CapsLock')
    expect(codeOfVk(0xa2)).toBe('ControlLeft')
    expect(codeOfVk(0xa5)).toBe('AltRight')
    expect(codeOfVk(0x5b)).toBe('MetaLeft')
    expect(codeOfVk(0x26)).toBe('ArrowUp')
    expect(codeOfVk(0x20)).toBe('Space')
    expect(codeOfVk(0xbf)).toBe('Slash')
    expect(codeOfVk(0x13)).toBe('Pause')
    expect(codeOfVk(0x5d)).toBeUndefined()
  })
})

describe('keys Kryakl presses', () => {
  test('Right Alt, Right Ctrl, the Win keys and the arrows are extended: let go without saying so, Right Alt would stay down', () => {
    for (const vk of [0xa5, 0xa3, 0x5b, 0x5c, 0x25, 0x26, 0x27, 0x28, 0x2e, 0x24]) expect(isExtendedKey(vk), vk.toString(16)).toBe(true)
  })

  test('Left Alt, Left Ctrl, the letters and the signs are not', () => {
    for (const vk of [0xa4, 0xa2, 0xa0, 0xa1, 0x43, 0x56, 0x08, 0x0d, 0xe8, 0xbf]) expect(isExtendedKey(vk), vk.toString(16)).toBe(false)
  })
})

test.skipIf(process.platform !== 'darwin')('Mac: Command recorded as Control, so Command+C twice is Control+C*2', () => {
  expect(record('+MetaLeft', '+KeyC', '-KeyC', '+KeyC')).toEqual(['(Control+C)', 'Control+C*2'])
})
