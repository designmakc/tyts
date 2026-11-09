// Fixing as one types on a Mac, driven as kbdmac-worker.ts drives Typist: the
// layouts as `kbd-mac layouts` printed them on the owner's Mac (ABC, Ukrainian-PC,
// RussianWin), Mac key codes through MAC_TO_VK, the settings of that Mac.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test } from 'vitest'

import { MAC_TO_VK, macLang, macTable, type MacLayout } from './kbdmac'
import { lexiconOf, type KeyTable, type Lexicon } from './layoutfix'
import { DEFAULTS, myLanguages } from './settings'
import { Typist, type KbdConfig, type KbdOut } from './typist'
import type { Press } from './winkbd'

const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'mac-layouts.json'), 'utf8')) as MacLayout[]
const layouts = new Map<string, { lang: string; table: KeyTable }>(list.map(l => [l.id, { lang: macLang(l), table: macTable(l) }]))
const ABC = 'com.apple.keylayout.ABC'

test('ghbdtn and Space typed in ABC become привет', () => {
  let source = ABC
  let now = 0
  const pressed: Press[] = []
  const sent: KbdOut[] = []
  const typist = new Typist({
    now: () => now,
    foreground: () => ({ hwnd: 7n, tid: 7, pid: 7 }),
    layoutOf: () => source,
    layout: id => layouts.get(id),
    installed: () => [...layouts.keys()],
    exeOf: () => 'textedit',
    elevated: () => false,
    ownExe: 'kryakl',
    switchLayout: (_, id) => (source = id),
    press: keys => pressed.push(...keys),
    later: () => setImmediate(() => typist.typeFix()),
    mask: () => undefined,
    askField: () => queueMicrotask(() => typist.fieldIs(false)),
    fullScreen: () => false,
    click: () => undefined,
    chime: () => undefined,
    caretOf: () => undefined,
    capsOf: () => false,
    send: m => sent.push(m),
    doubleClickMs: 500,
  })
  const s = { ...DEFAULTS, autoFix: true, languages: ['ru'], native: 'Ukrainian' }
  const config: Partial<KbdConfig> = { keys: {}, layoutKeys: {}, autoFix: true, cycle: [], languages: myLanguages(s), apps: {}, keepWords: [], learn: false, quietFullScreen: false }
  const lexicons: Record<string, Lexicon> = {}
  for (const lang of ['en', 'uk', 'ru']) lexicons[lang] = lexiconOf(fs.readFileSync(path.join(__dirname, '..', 'media', 'layout', `${lang}.txt`), 'utf8').split('\n').filter(Boolean))
  typist.configure({ ...(typist as unknown as { config: KbdConfig }).config, ...config }, lexicons)
  expect(new Set(typist.cycle().map(id => layouts.get(id)?.lang))).toEqual(new Set(['en', 'uk', 'ru']))
  // g h b d t n, then Space.
  for (const code of [5, 4, 11, 2, 17, 45, 49]) {
    now += 80
    typist.key(MAC_TO_VK[code]!, code, true, false, false)
    typist.key(MAC_TO_VK[code]!, code, false, false, false)
  }
  return new Promise<void>(done =>
    setTimeout(() => {
      expect(pressed.filter(p => 'char' in p).map(p => (p as { char: string }).char).join('')).toContain('привет')
      done()
    }, 50),
  )
})
