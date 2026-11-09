// The tray's panel, in place of Windows' menu, drawn as the window's sidebar
// and given air (P1, 2026-10-30): the way into the app window at the top (the
// brand with the version, or Open, a yellow button) with Tyts's state, then
// Actions (the copied text, a text to type or check, a piece of the screen,
// with their keys as quiet text; the note and Transcripts once the engine is
// in), Quick settings, Your words ("Keep a word as typed…", which opens into a
// field in place while the layout is fixed; the words to spell and the words
// kept, each opening its page in the window), and a footer of Pause, Settings,
// Report and Quit. A menu in behaviour: ↑ ↓ move, Enter runs, Esc or a click elsewhere
// puts it away (the main process hides it, and after any command). Everything
// shown comes in one `tray` message, sent again whenever any of it changes.

import { hotkeyLabel } from '../hotkey'
import { languageName, t } from '../i18n'
import type { Settings } from '../settings'
import type { ToHost, ToView, TrayCommand, TrayView, TutorHost } from '../protocol'
import { versionText } from '../version'
import { logo } from './brand'
import { dwmFlag, el } from './dom'
import { lucide, type LucideName } from './lucide'

declare global {
  interface Window {
    tutorHost: TutorHost
  }
}

dwmFlag()

const post = (message: ToHost) => window.tutorHost.post(message)

const root = document.getElementById('root') as HTMLDivElement

/** A key as quiet text, as the row names it: "Control+Alt+S" → "Ctrl+Alt+S", "RightControl*2" → "Right Ctrl ×2". */
function keyText(hotkey: string): HTMLElement {
  const twice = hotkey.endsWith('*2')
  return el('span', { class: 'kt' }, `${hotkeyLabel(hotkey.replace(/\*2$/, ''))}${twice ? ' ×2' : ''}`)
}

/** One command: a full-width row, its icon, its keys at the right end (none when it has no key). */
function command(id: string, icon: LucideName, label: string, run: TrayCommand, hotkey = ''): HTMLElement {
  return el(
    'button',
    { class: 'cmd', 'data-nav': true, 'data-id': id, onclick: () => post({ type: 'tray', command: run }) },
    lucide(icon, 's'),
    el('span', { class: 'l' }, label),
    hotkey ? keyText(hotkey) : null,
  )
}

type Switch = 'autoFix' | 'switchOn' | 'layoutBadge' | 'trayLayout' | 'paused'

/** One quick setting: saved at once, and the panel stays, as a switch is not a command. */
function toggle(id: Switch, icon: LucideName, label: string, on: boolean): HTMLElement {
  const knob = el('span', { class: on ? 'tg on' : 'tg' })
  const row: HTMLElement = el(
    'button',
    {
      class: 'cmd',
      'data-nav': true,
      'data-id': id,
      role: 'switch',
      'aria-checked': String(on),
      onclick: () => {
        const next = row.getAttribute('aria-checked') !== 'true'
        row.setAttribute('aria-checked', String(next))
        knob.classList.toggle('on', next)
        post({ type: 'saveSettings', patch: { [id]: next } as Partial<Settings> })
      },
    },
    lucide(icon, 's'),
    el('span', { class: 'l' }, label),
    knob,
  )
  return row
}

/** Keep the computer awake: a switch like the others, run by main (the time it stays on is a setting), the time left beside it. */
function awakeRow(v: TrayView): HTMLElement {
  const { on, left } = v.awake
  return el(
    'button',
    { class: 'cmd', 'data-nav': true, 'data-id': 'awake', role: 'switch', 'aria-checked': String(on), onclick: () => post({ type: 'tray', command: 'awake' }) },
    lucide('clock', 's'),
    el('span', { class: 'l' }, t('tray.awake')),
    on ? el('span', { class: 'kt' }, left ? t('tray.awakeLeft', { time: left }) : t('tray.awakeUntilOff')) : null,
    el('span', { class: on ? 'tg on' : 'tg' }),
  )
}

// ---------------------------------------------------------------- Keep a word as typed

/**
 * The row's state: the row; its field, open in place (the panel stays); or
 * "Kept: …" for a moment after Enter. A view that comes while the field is
 * open waits, so what is typed is never redrawn away.
 */
let keep: { mode: 'row' } | { mode: 'field' } | { mode: 'kept'; word: string } = { mode: 'row' }
let waiting: TrayView | undefined
let keepTimer: number | undefined
const KEPT_MS = 1500

function keepRow(v: TrayView): HTMLElement {
  if (keep.mode === 'kept')
    return el('div', { class: 'cmd kept', 'data-id': 'keepWord', role: 'status' }, lucide('check', 's'), el('span', { class: 'l' }, t('tray.kept', { word: keep.word })))
  return el(
    'button',
    { class: 'cmd', 'data-nav': true, 'data-id': 'keepWord', title: t('tray.keepWordTitle'), onclick: () => openKeep(v) },
    lucide('lock', 's'),
    el('span', { class: 'l' }, t('tray.keepWord')),
  )
}

/** The row turned into its field: the last word fixed by itself in it, as typed and all selected, what it became beside it. */
function openKeep(v: TrayView): void {
  const row = root.querySelector<HTMLElement>('[data-id="keepWord"]')
  if (!row) return
  keep = { mode: 'field' }
  const note = v.keep.word && v.keep.fixed ? el('span', { class: 'kt keep-note', title: `${v.keep.word} → ${v.keep.fixed}` }, `→ ${v.keep.fixed}`) : null
  const field = el('input', {
    class: 'keep-field',
    type: 'text',
    value: v.keep.word,
    placeholder: t('tray.keepPlaceholder'),
    'aria-label': t('tray.keepAria'),
    spellcheck: 'false',
    autocomplete: 'off',
  }) as HTMLInputElement
  // The word typed is no longer the one fixed: its fix goes.
  field.addEventListener('input', () => note?.remove())
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      const word = field.value.trim().toLowerCase()
      if (!word) return closeKeep()
      post({ type: 'keepWord', word })
      keep = { mode: 'kept', word }
      redraw()
      window.clearTimeout(keepTimer)
      keepTimer = window.setTimeout(() => {
        keep = { mode: 'row' }
        redraw()
      }, KEPT_MS)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeKeep(true)
    } else event.stopPropagation()
  })
  field.addEventListener('blur', () => {
    if (keep.mode === 'field') closeKeep()
  })
  const edit = el('div', { class: 'cmd keep-edit', 'data-id': 'keepWord' }, lucide('lock', 's'), field, note)
  row.replaceWith(edit)
  field.focus()
  field.select()
}

/** Back to the row, nothing added; `refocus`: the keys go on from it (Esc). */
function closeKeep(refocus = false): void {
  keep = { mode: 'row' }
  if (waiting) return redraw()
  const edit = root.querySelector<HTMLElement>('[data-id="keepWord"]')
  if (edit && last) edit.replaceWith(keepRow(last))
  if (refocus) focusRow(root.querySelector<HTMLElement>('[data-id="keepWord"]'))
}

/** The last view drawn, or one that waited for the field. */
function redraw(): void {
  const v = waiting ?? last
  waiting = undefined
  if (v) render(v)
}

// ---------------------------------------------------------------- the panel

/** The footer's Pause: a switch that names what a press does, Resume (in the paused indigo) while paused; the panel stays. */
function pauseButton(paused: boolean): HTMLElement {
  return el(
    'button',
    {
      class: paused ? 'fb paused' : 'fb',
      'data-nav': true,
      'data-id': 'paused',
      role: 'switch',
      'aria-checked': String(paused),
      title: paused ? t('tray.pausedTitle') : t('tray.pauseTitle'),
      onclick: () => post({ type: 'saveSettings', patch: { paused: !paused } }),
    },
    lucide(paused ? 'play' : 'pause', 's'),
    paused ? t('tray.resume') : t('tray.pause'),
  )
}

/** A group of rows under its name, as the sidebar's groups are. */
function group(label: string, ...rows: (HTMLElement | null)[]): HTMLElement {
  return el('section', { class: 'sec' }, el('div', { class: 'grp' }, label), ...rows)
}

/** Tyts's state in a few words: paused, or whether the translator for the person's language is here; nothing when there is nothing to say. */
function status(v: TrayView): HTMLElement | null {
  if (v.paused) return el('span', { class: 'st paused', title: t('tray.pausedTitle') }, el('span', { class: 'dot' }), t('tray.paused'))
  switch (v.translator) {
    case 'ready':
      return el('span', { class: 'st', title: t('tray.readyTitle', { pair: t('lang.pairEnglish', { lang: languageName(v.native) }) }) }, el('span', { class: 'dot' }), t('tray.ready'))
    case 'downloading':
      return el('span', { class: 'st' }, t('tray.downloading'))
    case 'absent':
      return el('span', { class: 'st' }, t('tray.firstUse'))
    default:
      return null
  }
}

let last: TrayView | undefined

function render(v: TrayView): void {
  last = v
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.id : undefined
  const openApp = () => post({ type: 'tray', command: 'open' })
  // The brand opens the window too; Open is the one the keys reach. The version beside it: a run from source says so, and when it was built.
  const version = el('span', { class: 'ver', title: t('tray.built', { build: v.build }) }, v.dev ? `${versionText(v.version)} dev` : versionText(v.version))
  const brand = el('button', { class: 'brand', tabindex: '-1', title: t('tray.openTyts'), onclick: openApp }, logo(), version)
  const open = el('button', { class: 'open', 'data-nav': true, 'data-id': 'open', onclick: openApp }, t('tray.open'))
  const panel = el(
    'div',
    { class: 'panel' },
    el('header', { class: 'head' }, brand, el('div', { class: 'side' }, status(v), open)),
    group(
      t('tray.actions'),
      command('listenCopied', 'volume-2', t('tray.listenCopied'), 'listenCopied', v.keys.listenCopied),
      command('translateCopied', 'languages', t('tray.translateCopied'), 'translateCopied'),
      command('typeToTranslate', 'pencil-line', t('tray.typeToTranslate'), 'typeToTranslate', v.keys.typeToTranslate),
      command('checkEnglish', 'graduation-cap', t('tray.checkEnglish'), 'checkEnglish', v.keys.checkEnglish),
      v.speech.installed ? command('talk', 'bird', `${t('menu.talk')}…`, 'talk', v.keys.talk) : null,
      command('listenScreen', 'monitor-speaker', t('tray.listenScreen'), 'listenScreen', v.keys.snipListen),
      command('translateScreen', 'scan-text', t('tray.translateScreen'), 'translateScreen', v.keys.snipTranslate),
      v.speech.installed ? command('note', 'notebook-pen', v.speech.recording ? t('tray.saveNote') : t('tray.newNote'), 'note', v.speech.noteKey) : null,
      v.speech.installed ? command('call', 'video', v.call ? t('call.stop') : t('call.record'), 'call', v.keys.call) : null,
      v.speech.installed ? command('transcripts', 'file-text', t('tray.transcripts'), 'transcripts') : null,
    ),
    group(
      t('tray.quick'),
      toggle('autoFix', 'spell-check', t('tray.autoFix'), v.autoFix),
      v.keys.switch ? toggle('switchOn', 'keyboard', t('tray.switchWith', { key: hotkeyLabel(v.keys.switch) }), v.switchOn) : null,
      toggle('layoutBadge', 'text-cursor', t('tray.layoutBadge'), v.layoutBadge),
      toggle('trayLayout', 'panel-bottom', t('tray.trayLayout'), v.trayLayout),
      awakeRow(v),
    ),
    group(
      t('tray.yourWords'),
      v.keep.on ? keepRow(v) : null,
      v.speech.installed ? command('vocabulary', 'mic', t('tray.vocabulary'), 'vocabulary') : null,
      command('kept', 'list', t('tray.keptList'), 'kept'),
    ),
    el(
      'footer',
      { class: 'foot' },
      pauseButton(v.paused),
      el('button', { class: 'fb', 'data-nav': true, 'data-id': 'settings', onclick: () => post({ type: 'tray', command: 'settings' }) }, lucide('settings', 's'), t('tray.settings')),
      el('button', { class: 'fb', 'data-nav': true, 'data-id': 'report', title: t('tray.reportTitle'), onclick: () => post({ type: 'tray', command: 'report' }) }, lucide('bug', 's'), t('tray.report')),
      el('button', { class: 'fb quit', 'data-nav': true, 'data-id': 'quit', title: t('tray.quit'), 'aria-label': t('tray.quit'), onclick: () => post({ type: 'tray', command: 'quit' }) }, lucide('power', 's'), el('span', {}, t('tray.quit'))),
    ),
  )
  root.replaceChildren(panel)
  // A change while the panel is open keeps the focus where it was.
  if (focused) focusRow(root.querySelector<HTMLElement>(`[data-id="${focused}"][data-nav]`))
}

/**
 * Focuses a row and marks it: the mark is what lights, as `:focus` does not
 * match while the window is not yet active (the moment it is shown).
 */
function focusRow(node: HTMLElement | null | undefined): void {
  if (!node) return
  node.focus()
  for (const other of root.querySelectorAll('.cur')) if (other !== node) other.classList.remove('cur')
  node.classList.add('cur')
}

/** The rows ↑ and ↓ move through, top to bottom. */
const navs = () => [...root.querySelectorAll<HTMLElement>('[data-nav]')]

function move(by: number): void {
  const all = navs()
  if (!all.length) return
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = at < 0 ? (by > 0 ? 0 : all.length - 1) : (at + by + all.length) % all.length
  focusRow(all[next])
}

// The highlight follows the input in use: the pointer's row, or the focused
// row once a key is pressed; never both, and no ring when the panel just opened.
const byKeys = (on: boolean) => document.body.classList.toggle('keys', on)

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault()
    return post({ type: 'trayClose' })
  }
  byKeys(true)
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(event.key === 'ArrowDown' ? 1 : -1)
  }
})
window.addEventListener('pointermove', () => byKeys(false))
// Tab moves the focus too.
window.addEventListener('focusin', event => {
  if (event.target instanceof HTMLElement && event.target.dataset.nav !== undefined) focusRow(event.target)
})

window.addEventListener('message', (event: MessageEvent<ToView>) => {
  if (event.source !== window) return
  const m = event.data
  if (m.type === 'tray') {
    if (keep.mode === 'field') waiting = m.view
    else render(m.view)
  } else if (m.type === 'trayShown') {
    byKeys(false)
    // Shown again: the field, or "Kept", is gone.
    if (keep.mode !== 'row') {
      window.clearTimeout(keepTimer)
      keep = { mode: 'row' }
      redraw()
    }
    // The first command, not Open: the panel is mostly opened to run one.
    focusRow(root.querySelector<HTMLElement>('.cmd[data-nav]'))
  }
})

// The window is as tall as the panel, with the page's border above and below.
new ResizeObserver(() => post({ type: 'trayHeight', px: Math.ceil(document.body.getBoundingClientRect().height) + 2 })).observe(document.body)

post({ type: 'trayReady' })
