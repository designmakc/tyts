import { afterEach, describe, expect, it, vi } from 'vitest'

const windows = vi.hoisted(() => [] as { shown: number; hidden: number; moves: { x: number; y: number }[]; bounds: { x: number; y: number; width: number; height: number }; heard: Record<string, () => void> }[])

vi.mock('electron', () => {
  const area = { x: 0, y: 0, width: 1920, height: 1040 }
  class BrowserWindow {
    shown = 0
    hidden = 0
    moves: { x: number; y: number }[] = []
    bounds = { x: 0, y: 0, width: 360, height: 64 }
    heard: Record<string, () => void> = {}
    webContents = { send: vi.fn(), on: vi.fn(), setWindowOpenHandler: vi.fn() }
    constructor() {
      windows.push(this)
    }
    on(event: string, listener: () => void) {
      this.heard[event] = listener
    }
    setAlwaysOnTop() {}
    removeMenu() {}
    loadFile() {
      return Promise.resolve()
    }
    isDestroyed() {
      return false
    }
    isVisible() {
      return this.shown > this.hidden
    }
    getBounds() {
      return this.bounds
    }
    setBounds(bounds: BrowserWindow['bounds']) {
      this.bounds = bounds
    }
    setPosition(x: number, y: number) {
      this.moves.push({ x, y })
      this.bounds = { ...this.bounds, x, y }
    }
    showInactive() {
      this.shown++
    }
    hide() {
      this.hidden++
      this.heard.hide?.()
    }
  }
  return {
    BrowserWindow,
    globalShortcut: { register: vi.fn(), unregister: vi.fn() },
    screen: { getDisplayNearestPoint: () => ({ workArea: area }), getDisplayMatching: () => ({ workArea: area }), getCursorScreenPoint: () => ({ x: 0, y: 0 }) },
    shell: {},
  }
})
vi.mock('./dwm', () => ({ frameWindow: vi.fn() }))
vi.mock('./winclip', () => ({ handleOf: vi.fn() }))
vi.mock('./winkbd', () => ({ foreground: () => ({ hwnd: 0 }), putOnTop: vi.fn(), sightOf: vi.fn(), windowRect: vi.fn() }))

import { Dictation, type DictationOptions } from './dictation'
import type { DictationMode, ToView } from './protocol'

type Inside = {
  send: (message: ToView) => void
  typeHeard: (mode: DictationMode, heard: string, language: string, sure: number) => Promise<void>
}

function setup(over: Partial<DictationOptions> = {}) {
  const typed: string[] = []
  const logged: unknown[] = []
  const sent: ToView[] = []
  const toEnglish = vi.fn(async (text: string) => ({ text: `EN ${text}` }))
  const edit = vi.fn(async (text: string): Promise<{ text: string; note?: string }> => ({ text: `edited ${text}` }))
  const check = vi.fn()
  const d = new Dictation({
    paste: async (text: string) => void typed.push(text),
    toEnglish,
    edit,
    editing: () => true,
    corrections: () => [],
    check,
    languageOf: () => 'ru',
    log: { add: (entry: unknown) => void logged.push(entry) },
    logged: vi.fn(),
    onChange: vi.fn(),
    ...over,
  } as unknown as DictationOptions)
  const inside = d as unknown as Inside
  inside.send = message => void sent.push(message)
  d.state = 'working'
  return { d, hear: (mode: DictationMode, text: string) => inside.typeHeard(mode, text, 'ru', 0.9), typed, logged, sent, toEnglish, edit, check }
}

describe('a phrase heard, with text editing', () => {
  it('types the phrase as heard while editing is off', async () => {
    const { hear, typed, logged, edit } = setup({ editing: () => false })
    await hear('type', 'привет мир')
    expect(edit).not.toHaveBeenCalled()
    expect(typed).toEqual(['привет мир '])
    expect(logged).toEqual([{ mode: 'type', text: 'привет мир' }])
  })

  it('types the edit, and keeps what was said in the phrase list', async () => {
    const { hear, typed, logged, sent } = setup()
    await hear('type', 'привет мир')
    expect(sent).toContainEqual({ type: 'dictationEditing' })
    expect(typed).toEqual(['edited привет мир '])
    expect(logged).toEqual([{ mode: 'type', text: 'edited привет мир', heard: 'привет мир' }])
  })

  it('puts a learned correction right before the edit, and keeps what was said', async () => {
    const { hear, typed, logged, edit } = setup({ editing: () => false, corrections: () => [{ heard: 'тиц', right: 'Tyts' }] })
    await hear('type', 'открой тиц')
    expect(edit).not.toHaveBeenCalled()
    expect(typed).toEqual(['открой Tyts '])
    expect(logged).toEqual([{ mode: 'type', text: 'открой Tyts', heard: 'открой тиц' }])
  })

  it('edits first and translates what comes of it', async () => {
    const { hear, typed, toEnglish } = setup()
    await hear('english', 'привет мир')
    expect(toEnglish).toHaveBeenCalledWith('edited привет мир', 'ru')
    expect(typed).toEqual(['EN edited привет мир '])
  })

  it('says in the badge why a phrase went as said', async () => {
    const { hear, typed, sent } = setup({ edit: async text => ({ text, note: 'typed as said' }) })
    await hear('type', 'привет мир')
    expect(typed).toEqual(['привет мир '])
    expect(sent).toContainEqual({ type: 'dictationDone', text: 'привет мир', note: 'typed as said' })
  })

  it('types nothing once Esc stopped the edit', async () => {
    let started = (): void => undefined
    const asked = new Promise<void>(resolve => {
      started = resolve
    })
    const { d, hear, typed, logged } = setup({
      edit: (text, signal) =>
        new Promise(resolve => {
          signal.addEventListener('abort', () => resolve({ text }))
          started()
        }),
    })
    const heard = hear('type', 'привет мир')
    await asked
    d.cancel()
    await heard
    expect(typed).toEqual([])
    expect(logged).toEqual([])
  })

  it('never edits spoken practice', async () => {
    const { hear, edit, check } = setup()
    await hear('check', 'I has a dog')
    expect(edit).not.toHaveBeenCalled()
    expect(check).toHaveBeenCalledWith('I has a dog')
  })
})

describe('the panel while a phrase is dictated', () => {
  afterEach(() => {
    vi.useRealTimers()
    windows.length = 0
  })

  /** A phrase started on a computer with the engine ready, the badge's window made. */
  async function started(over: Partial<DictationOptions> = {}) {
    const typed: string[] = []
    const d = new Dictation({
      page: 'dictation.html',
      preload: 'preload.js',
      query: () => ({}),
      speech: { installed: true, ready: true, call: async () => ({ ok: true, data: { id: 'session' } }) },
      paste: async (text: string) => void typed.push(text),
      editing: () => false,
      corrections: () => [],
      languageOf: () => 'ru',
      expected: () => ['ru', 'en'],
      warm: vi.fn(),
      offset: () => ({ dx: 0, dy: 0 }),
      panel: () => true,
      trayPoint: () => ({ x: 1900, y: 1060 }),
      log: { add: vi.fn() },
      logged: vi.fn(),
      onChange: vi.fn(),
      moved: vi.fn(),
      ...over,
    } as unknown as DictationOptions)
    const phrase = async () => {
      d.press('type', 'Control+Alt+D')
      await new Promise(resolve => setTimeout(resolve))
    }
    await phrase()
    const badge = windows[windows.length - 1]!
    const heard = (text: string) => (d as unknown as Inside).typeHeard('type', text, 'ru', 0.9)
    return { d, badge, typed, phrase, heard }
  }

  it('shows it for a phrase', async () => {
    const { badge } = await started()
    expect(badge.shown).toBe(1)
  })

  it('still makes the window with the setting off, as the recording runs in it, and shows nothing', async () => {
    const { badge } = await started({ panel: () => false })
    expect(badge.shown).toBe(0)
  })

  it('folds away at once where motion is reduced, for this phrase only', async () => {
    const { d, badge, phrase, heard, typed } = await started()
    d.onMessage({ type: 'dictationTuck', fly: false })
    expect(badge.hidden).toBe(1)
    d.state = 'working'
    await heard('привет мир')
    expect(typed).toEqual(['привет мир '])
    expect(badge.shown).toBe(1)
    await phrase()
    expect(badge.shown).toBe(2)
  })

  it('flies into the tray, its corner on the icon, and is hidden there', async () => {
    const { d, badge } = await started()
    vi.useFakeTimers()
    d.onMessage({ type: 'dictationTuck', fly: true })
    vi.advanceTimersByTime(300)
    expect(badge.hidden).toBe(1)
    expect(badge.moves.length).toBeGreaterThan(5)
    const last = badge.moves[badge.moves.length - 1]!
    expect(last.x).toBeGreaterThan(1400)
    expect(last.y).toBeGreaterThan(900)
    // Done flying: it moves no more.
    const moves = badge.moves.length
    vi.advanceTimersByTime(100)
    expect(badge.moves.length).toBe(moves)
  })

  it('does nothing once the phrase is over', async () => {
    const { d, badge } = await started()
    d.state = 'idle'
    d.onMessage({ type: 'dictationTuck', fly: false })
    expect(badge.hidden).toBe(0)
  })

  it('comes up to say why a phrase went as said', async () => {
    const { d, badge, heard } = await started({ editing: () => true, edit: async text => ({ text, note: 'typed as said' }) })
    d.onMessage({ type: 'dictationTuck', fly: false })
    d.state = 'working'
    await heard('вот такая фраза')
    expect(badge.shown).toBe(2)
  })

  it('comes up to say what went wrong, with the setting off too', async () => {
    const { d, badge } = await started({ panel: () => false })
    d.onMessage({ type: 'dictationFailed', message: 'The microphone is off' })
    expect(badge.shown).toBe(1)
  })

  it('keeps a new height for the drop while it is being moved', async () => {
    const { d, badge } = await started()
    badge.heard['will-move']?.()
    d.onMessage({ type: 'dictationHeight', px: 120 })
    expect(badge.bounds.height).toBe(64)
    badge.heard.moved?.()
    expect(badge.bounds.height).toBe(120)
  })
})
