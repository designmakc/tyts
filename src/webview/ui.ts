// The small parts every page of the app window is made of: a group's name,
// a card with its notes and control, a card that opens a page of its own, a
// page that is a list to add to, switches, choices, links and chips.

import { t, UI_LANGUAGES, type UiLanguage } from '../i18n'
import type { ToHost } from '../protocol'
import { el, icon } from './dom'
import { lucide, type LucideName } from './lucide'

export const post = (message: ToHost) => window.tutorHost.post(message)

/** A group's name over its cards; `n` is a count after it, `right` a link at the end of the line (Clear). */
export const grp = (text: string, n?: string | number, right?: HTMLElement | null) =>
  el('div', { class: 'grp' }, text, n !== undefined && n !== '' ? el('span', { class: 'n' }, String(n)) : null, right ?? null)
export const bad = (text: string) => el('small', { class: 'bad' }, text)
export type Note = string | HTMLElement | null | undefined | false

const notesOf = (notes: Note[]) => notes.filter(n => !!n).map(n => (typeof n === 'string' ? el('small', {}, n) : n))

/** A line of a page: what it is (with notes under it) and its control on the right. */
export function row(label: string | HTMLElement, notes: Note[], ...controls: (HTMLElement | null)[]): HTMLElement {
  return el('div', { class: 'row' }, el('div', { class: 'l' }, label, ...notesOf(notes)), ...controls)
}

/** A line with an icon before it. */
export function card(name: LucideName, label: string | HTMLElement, notes: Note[], ...controls: (HTMLElement | null)[]): HTMLElement {
  const node = row(label, notes, ...controls)
  node.prepend(lucide(name))
  return node
}

/** A card that opens a page of its own: its value on the right (green with a check when `ok`), then a chevron. */
export function navCard(name: LucideName | null, title: string, note: Note | Note[], value: string | null, onOpen: () => void, id = '', ok = false): HTMLButtonElement {
  return el(
    'button',
    { class: 'row navc', 'data-sub': id || undefined, onclick: onOpen },
    name ? lucide(name) : null,
    el('div', { class: 'l' }, title, ...notesOf(Array.isArray(note) ? note : [note])),
    value ? el('span', { class: ok ? 'v ok' : 'v' }, ok ? lucide('check', 's') : null, value) : null,
    lucide('chevron-right', 'chev'),
  )
}

/**
 * One choice of a few (an action's model on the Models page): a ring before
 * the line, filled in the one in use; a tap anywhere on the line but its own
 * buttons picks it. No `pick`: it cannot be picked here.
 */
export function radioRow(label: string | HTMLElement, notes: Note[], on: boolean, pick: (() => void) | undefined, ...controls: (HTMLElement | null)[]): HTMLElement {
  const node = el(
    'div',
    {
      class: `row radio${on ? ' on' : ''}${pick ? '' : ' off'}`,
      role: 'radio',
      'aria-checked': String(on),
      'aria-disabled': pick ? undefined : 'true',
      tabindex: pick && !on ? '0' : undefined,
    },
    el('span', { class: 'ring', 'aria-hidden': 'true' }),
    el('div', { class: 'l' }, label, ...notesOf(notes)),
    ...controls,
  )
  const choose = (event: Event) => {
    if (on || !pick || (event.target as Element).closest('button, a, input, select')) return
    node.classList.add('on')
    pick()
  }
  node.addEventListener('click', choose)
  node.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    choose(event)
  })
  return node
}

/** The advice for this computer, after a line's title. */
export const recommended = () => el('span', { class: 'chip good' }, lucide('check', 's'), t('ui.recommended'))

/** A small round-cornered icon button: remove, earlier, later. */
export function ib(name: LucideName, label: string, onclick: () => void, disabled = false): HTMLButtonElement {
  return el('button', { class: 'ib', title: label, 'aria-label': label, disabled, onclick }, lucide(name))
}

/** A line that is a switch: a tap anywhere on it turns it over at once, before the main process answers. */
export function toggle(label: string, on: boolean, onchange: (on: boolean) => void, ...notes: Note[]): HTMLElement {
  const knob = el('span', { class: on ? 'tg on' : 'tg' })
  const node = el(
    'button',
    {
      class: 'row trow',
      role: 'switch',
      'aria-checked': String(on),
      onclick: () => {
        const next = node.getAttribute('aria-checked') !== 'true'
        node.setAttribute('aria-checked', String(next))
        knob.classList.toggle('on', next)
        onchange(next)
      },
    },
    el('span', { class: 'l' }, label, ...notesOf(notes)),
    knob,
  )
  return node
}

/** A switch with an icon before its line. */
export function toggleCard(name: LucideName, label: string, on: boolean, onchange: (on: boolean) => void, ...notes: Note[]): HTMLElement {
  const node = toggle(label, on, onchange, ...notes)
  node.prepend(lucide(name))
  return node
}

/** A switch without a line of its own (Ctrl + C twice sits by its keys). */
export function toggleKnob(on: boolean, onchange: (on: boolean) => void, label: string): HTMLElement {
  const node = el('button', {
    class: on ? 'tg on' : 'tg',
    role: 'switch',
    'aria-checked': String(on),
    'aria-label': label,
    onclick: () => {
      const next = node.getAttribute('aria-checked') !== 'true'
      node.setAttribute('aria-checked', String(next))
      node.classList.toggle('on', next)
      onchange(next)
    },
  })
  return node
}

/** Choices side by side; the one tapped lights at once. */
export function seg<T extends string | number>(value: T, options: [T, string][], onchange: (value: T) => void, mono = false): HTMLElement {
  const node = el('span', { class: mono ? 'seg mono' : 'seg', role: 'radiogroup' })
  for (const [v, label] of options) {
    const b = el(
      'button',
      {
        class: v === value ? 'on' : '',
        role: 'radio',
        'aria-checked': String(v === value),
        onclick: () => {
          for (const other of node.children) {
            other.classList.toggle('on', other === b)
            other.setAttribute('aria-checked', String(other === b))
          }
          onchange(v)
        },
      },
      label,
    )
    node.append(b)
  }
  return node
}

/** What a list's button holds: its choices, the one shown, what a pick does, and a key that finds its twin after a redraw. */
interface SelState {
  options: [string | number, string][]
  value: string | number
  pick: (value: string | number) => void
  key: string
}
const sels = new WeakMap<HTMLButtonElement, SelState>()

/**
 * A list to pick from: a quiet button with the choice and a chevron, and
 * Tyts's own list under it (`openSel`), never Windows' (which stuck to the
 * window's edge with its text on the right). A value no choice has shows the
 * first, as a `<select>` does; picking the one shown changes nothing.
 */
export function select<T extends string | number>(value: T, options: [T, string][], onchange: (value: T) => void): HTMLElement {
  const shown = options.find(([v]) => v === value) ?? options[0]
  const node = el(
    'button',
    { type: 'button', class: 'sel', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' },
    el('span', { class: 'sv' }, shown?.[1] ?? ''),
    lucide('chevron-down', 's'),
  )
  sels.set(node, {
    options,
    value: shown?.[0] ?? value,
    pick: v => onchange(v as T),
    key: options.map(([v]) => String(v)).join('\u0001'),
  })
  node.addEventListener('click', () => (dropdown?.anchor === node ? closeSel(true) : openSel(node)))
  node.addEventListener('keydown', event => {
    if (dropdown || !['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key) || event.altKey || event.ctrlKey) return
    event.preventDefault()
    openSel(node)
  })
  return node
}

const SEL_ROW = 32 // px, as `.sel-opt` in app.css
const SEL_ROWS = 10
const SEL_FILTER_FROM = 13 // a filter over a list longer than 12
const SEL_GAP = 4
const SEL_EDGE = 8

interface Dropdown {
  anchor: HTMLButtonElement
  pop: HTMLElement
  list: HTMLElement
  filter?: HTMLInputElement
  items: HTMLElement[]
  active: number
  typed: string
  typedAt: number
  done: () => void
}
let dropdown: Dropdown | undefined
let selIds = 0

/** Opens the list of a `select()` button in the page's body: under it, right edges together, upward when below has no room. */
function openSel(anchor: HTMLButtonElement): void {
  closeSel(false)
  const state = sels.get(anchor)
  if (!state) return
  const id = `sel-${++selIds}`
  const list = el('div', { class: 'sel-list', role: 'listbox', id, tabindex: '-1' })
  const items: HTMLElement[] = state.options.map(([v, label], i) => {
    const on = v === state.value
    return el('div', { class: on ? 'sel-opt on' : 'sel-opt', role: 'option', id: `${id}-${i}`, 'aria-selected': String(on) }, lucide('check', 's'), el('span', {}, label))
  })
  list.append(...items)
  const empty = el('div', { class: 'sel-empty', hidden: true }, t('tr.nothing'))
  let filter: HTMLInputElement | undefined
  const pop = el('div', { class: 'sel-pop' })
  if (state.options.length >= SEL_FILTER_FROM) {
    filter = el('input', {
      type: 'search',
      role: 'combobox',
      'aria-controls': id,
      'aria-expanded': 'true',
      'aria-autocomplete': 'list',
      placeholder: t('nav.search'),
      'aria-label': t('nav.search'),
      spellcheck: 'false',
    })
    pop.append(el('label', { class: 'sel-filter' }, lucide('search', 's'), filter))
  }
  pop.append(list, empty)
  document.body.append(pop)

  const d: Dropdown = { anchor, pop, list, filter, items, active: -1, typed: '', typedAt: 0, done: () => {} }
  dropdown = d
  anchor.setAttribute('aria-expanded', 'true')

  const visible = () => items.filter(item => !item.hidden)
  const setActive = (index: number, scroll = true) => {
    items[d.active]?.classList.remove('active')
    d.active = index
    const item = items[index]
    const owner = filter ?? list
    if (!item) return owner.removeAttribute('aria-activedescendant')
    item.classList.add('active')
    owner.setAttribute('aria-activedescendant', item.id)
    if (!scroll) return
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight
  }
  const move = (step: number, to?: 'first' | 'last') => {
    const shown = visible()
    if (!shown.length) return
    const at = d.active >= 0 ? shown.indexOf(items[d.active]!) : -1
    const next = to === 'first' ? 0 : to === 'last' ? shown.length - 1 : at < 0 ? 0 : Math.max(0, Math.min(shown.length - 1, at + step))
    setActive(items.indexOf(shown[next]!))
  }
  const pick = (index: number) => {
    const s = sels.get(d.anchor)
    const choice = s?.options[index]
    closeSel(true)
    if (!s || !choice || choice[0] === s.value) return
    s.value = choice[0]
    const v = d.anchor.querySelector('.sv')
    if (v) v.textContent = choice[1]
    s.pick(choice[0])
  }

  // Placed once its rows are in, so its height is known.
  const place = () => {
    const r = d.anchor.getBoundingClientRect()
    const natural = Math.min(pop.offsetWidth, 340) // its longest choice, up to a point
    const width = Math.min(Math.max(r.width, 220, natural), window.innerWidth - 2 * SEL_EDGE)
    pop.style.width = `${width}px`
    pop.style.left = `${Math.max(SEL_EDGE, Math.min(r.right - width, window.innerWidth - SEL_EDGE - width))}px`
    const chrome = pop.offsetHeight - list.offsetHeight // the filter and the padding
    const want = chrome + Math.min(SEL_ROWS, Math.max(1, items.length)) * SEL_ROW
    const below = window.innerHeight - r.bottom - SEL_GAP - SEL_EDGE
    const above = r.top - SEL_GAP - SEL_EDGE
    const down = below >= Math.min(want, chrome + 3 * SEL_ROW) || below >= above
    pop.style.maxHeight = `${Math.max(chrome + SEL_ROW, Math.min(want, down ? below : above))}px`
    pop.style.top = down ? `${r.bottom + SEL_GAP}px` : `${r.top - SEL_GAP - pop.offsetHeight}px`
    pop.classList.toggle('up', !down)
  }
  pop.style.visibility = 'hidden'
  pop.style.top = '0px'
  pop.style.left = '0px'
  place()
  pop.style.visibility = ''
  const current = items.findIndex(item => item.classList.contains('on'))
  if (current >= 0) {
    setActive(current, false)
    list.scrollTop = Math.max(0, items[current]!.offsetTop - (list.clientHeight - SEL_ROW) / 2)
  } else move(0, 'first')
  ;(filter ?? list).focus({ preventScroll: true })

  filter?.addEventListener('input', () => {
    const q = filter!.value.trim().toLowerCase()
    for (const item of items) item.hidden = !!q && !(item.textContent ?? '').toLowerCase().includes(q)
    empty.hidden = visible().length > 0
    const keep = items[d.active]
    if (keep && !keep.hidden) setActive(d.active)
    else move(0, 'first')
  })
  // A press in the list keeps the focus where it is; a click picks.
  pop.addEventListener('mousedown', event => event.target !== filter && event.preventDefault())
  list.addEventListener('pointermove', event => {
    const item = (event.target as Element).closest<HTMLElement>('.sel-opt')
    if (item && items.indexOf(item) !== d.active) setActive(items.indexOf(item), false)
  })
  list.addEventListener('click', event => {
    const item = (event.target as Element).closest<HTMLElement>('.sel-opt')
    if (item) pick(items.indexOf(item))
  })

  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing) return
    const handled = () => (event.preventDefault(), event.stopPropagation())
    switch (event.key) {
      case 'Escape':
        // The page's own Esc (Back) must not see it.
        handled()
        return closeSel(true)
      case 'Tab':
        // Back on the button, so the browser's Tab goes on from there.
        return closeSel(true)
      case 'ArrowDown':
        return handled(), move(1)
      case 'ArrowUp':
        return handled(), move(-1)
      case 'PageDown':
        return handled(), move(SEL_ROWS - 1)
      case 'PageUp':
        return handled(), move(1 - SEL_ROWS)
      case 'Home':
      case 'End':
        if (filter) return
        return handled(), move(0, event.key === 'Home' ? 'first' : 'last')
      case 'Enter':
        handled()
        return items[d.active] && !items[d.active]!.hidden ? pick(d.active) : undefined
    }
    // A letter jumps to the next choice that starts with what was typed (the filter takes letters itself).
    if (filter || event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return
    if (event.key === ' ' && !d.typed) return handled(), d.active >= 0 ? pick(d.active) : undefined
    handled()
    const now = event.timeStamp
    d.typed = now - d.typedAt < 700 ? d.typed + event.key.toLowerCase() : event.key.toLowerCase()
    d.typedAt = now
    const same = [...d.typed].every(c => c === d.typed[0])
    const probe = same ? d.typed.charAt(0) : d.typed
    const from = same ? d.active + 1 : Math.max(0, d.active)
    for (let k = 0; k < items.length; k++) {
      const i = (from + k) % items.length
      if ((items[i]!.textContent ?? '').trim().toLowerCase().startsWith(probe)) return setActive(i)
    }
  }
  const onDown = (event: PointerEvent) => {
    const target = event.target as Node
    if (!pop.contains(target) && !d.anchor.contains(target)) closeSel(false)
  }
  const onScroll = (event: Event) => {
    if (!(event.target instanceof Node) || !pop.contains(event.target)) closeSel(false)
  }
  const onBlur = () => closeSel(false)
  // A redraw puts a fresh twin of the button in its place: the list goes on under it, else it closes.
  const watch = new MutationObserver(() => {
    if (d.anchor.isConnected) return
    const key = sels.get(d.anchor)?.key
    const twin = [...document.querySelectorAll<HTMLButtonElement>('button.sel')].find(b => sels.get(b)?.key === key)
    if (!twin) return closeSel(false)
    d.anchor = twin
    twin.setAttribute('aria-expanded', 'true')
  })
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('pointerdown', onDown, true)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('blur', onBlur)
  window.addEventListener('resize', onBlur)
  watch.observe(document.body, { childList: true, subtree: true })
  d.done = () => {
    window.removeEventListener('keydown', onKey, true)
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('resize', onBlur)
    watch.disconnect()
  }
}

/** Closes the open list; `focus` gives the keyboard back to its button (Esc, a pick). */
function closeSel(focus: boolean): void {
  const d = dropdown
  if (!d) return
  dropdown = undefined
  d.done()
  d.pop.remove()
  d.anchor.setAttribute('aria-expanded', 'false')
  if (focus && d.anchor.isConnected) d.anchor.focus({ preventScroll: true })
}

/** The interface's language, each named in itself; picked, every window of Tyts loads again in it (Settings, the setup's first step). */
export function uiLanguageCard(current: UiLanguage, save: (uiLanguage: UiLanguage) => void): HTMLElement {
  return card(
    'globe',
    t('settings.uiLanguage'),
    [t('settings.uiLanguageNote')],
    seg<UiLanguage>(
      current,
      UI_LANGUAGES.map(l => [l.code, l.name]),
      language => language !== current && save(language),
    ),
  )
}

export const linkBtn = (text: string, onclick: () => void, disabled = false) => el('button', { class: 'link', disabled, onclick }, text)
/** A language by two names, by one where they are the same ("Русский", not "Русский · русский"). */
export const twoNames = (first: string, second: string) => (first.toLowerCase() === second.toLowerCase() ? first : `${first} · ${second}`)
export const chip = (text: string, cls = '') => el('span', { class: `chip${cls ? ' ' + cls : ''}` }, text)

/** A button: `primary` is the blue one, `danger` the red one. */
export function btn(label: (Node | string)[] | string, onclick: (event: Event) => void, cls = '', title?: string): HTMLButtonElement {
  return el('button', { class: `btn${cls ? ' ' + cls : ''}`, onclick, title, 'aria-label': title }, ...(typeof label === 'string' ? [label] : label))
}

export function link(url: string, text: string): HTMLElement {
  return el('a', { href: url, onclick: (event: Event) => (event.preventDefault(), post({ type: 'openLink', url })) }, text)
}

/** A progress bar, 0…1. */
export function bar(progress: number): HTMLElement {
  const fill = el('i', { class: 'fill' })
  fill.style.width = `${Math.round(progress * 100)}%`
  return el('span', { class: 'bar' }, fill)
}

/** A line for a notice under a page's cards: calm (`aside`), or a fault (`warn`). */
export const aside = (name: LucideName, ...text: (Node | string)[]) => el('p', { class: 'aside' }, lucide(name, 's'), el('span', {}, ...text))
export const warn = (...text: (Node | string)[]) => el('p', { class: 'warn' }, lucide('circle-alert', 's'), el('span', {}, ...text))

/** A field whose typed text survives the page being drawn again: the body moves it over instead of making a new one. */
export function liveField(id: string, placeholder: string, label: string, onkey: (key: string, field: HTMLInputElement) => void): HTMLInputElement {
  const field = el('input', {
    type: 'text',
    class: 'field',
    placeholder,
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': label,
    'data-live': id,
  })
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault()
      onkey(event.key, field)
    }
  })
  return field
}

/** A tile of the person's own list on top of an action's page: its icon and count, its name, a quiet line under it; a tap opens the list. */
export type Tile = { icon: LucideName; title: string; count?: string | number; sub?: string; open: () => void; id?: string }

export function tiles(list: Tile[]): HTMLElement {
  return el(
    'div',
    { class: 'tiles' },
    ...list.map(x =>
      el(
        'button',
        { class: 'tcell', 'data-sub': x.id || undefined, onclick: x.open },
        el('span', { class: 'tt' }, lucide(x.icon), x.count !== undefined && x.count !== '' ? el('span', { class: 'tc' }, String(x.count)) : null),
        el('span', { class: 'tn' }, x.title),
        x.sub ? el('span', { class: 'ts', title: x.sub }, x.sub) : null,
      ),
    ),
  )
}

/** The models a page runs on: one framed plate at its foot, each line opening its choice on the Models page. */
export function enginePlate(lines: { title: string; value: string; open: () => void; id?: string }[]): HTMLElement {
  return el(
    'div',
    { class: 'engine' },
    el('div', { class: 'eh' }, lucide('cpu', 's'), t('nav.models')),
    ...lines.map(l => el('button', { class: 'eline', 'data-sub': l.id || undefined, onclick: l.open }, el('span', { class: 'el' }, l.title), el('span', { class: 'ev' }, l.value), lucide('chevron-right', 'chev'))),
  )
}

/** A short item of a list as a chip: its text, what goes with it (after `sep`), a cross; a tap on the text opens it when it can. */
export type ChipItem = { text: string; more?: string; title?: string; open?: () => void; remove: () => void }

export function wordChips(items: ChipItem[], sep = ''): HTMLElement {
  return el(
    'div',
    { class: 'wchips' },
    ...items.map(c =>
      el(
        'span',
        { class: 'wchip', title: c.title },
        c.open ? el('button', { class: 'ww', onclick: c.open }, c.text) : el('span', { class: 'ww' }, c.text),
        c.more ? el('span', { class: 'wx' }, sep ? `${sep} ${c.more}` : c.more) : null,
        el('button', { class: 'wdel', title: t('ui.remove', { item: c.text }), 'aria-label': t('ui.remove', { item: c.text }), onclick: c.remove }, lucide('x')),
      ),
    ),
  )
}

/** A sentence of a list on one line: the text, what goes with it, quiet; a tap on it does `open`, its cross shows under the pointer and on focus. */
export type LineItem = { text: string | HTMLElement; more?: string; title?: string; open?: () => void; remove?: () => void; removeLabel?: string; edit?: () => void; editLabel?: string }

export function lineList(items: LineItem[], cls = ''): HTMLElement {
  return el(
    'div',
    { class: cls ? `lines ${cls}` : 'lines' },
    ...items.map(x =>
      el(
        'div',
        { class: 'ln', title: x.title },
        x.open ? el('button', { class: 'la', onclick: x.open }, x.text) : el('span', { class: 'la' }, x.text),
        x.more ? el('span', { class: 'lb' }, x.more) : null,
        x.edit ? el('button', { class: 'wdel', title: x.editLabel, 'aria-label': x.editLabel, onclick: x.edit }, lucide('pencil-line')) : null,
        x.remove ? el('button', { class: 'wdel', title: x.removeLabel ?? t('ui.forget'), 'aria-label': x.removeLabel ?? t('ui.forget'), onclick: x.remove }, lucide('x')) : null,
      ),
    ),
  )
}

/**
 * A page that is a list of words: a field to add to it at the top (Enter
 * adds too, Escape clears), then every item as a chip with a cross. Items
 * are kept lower case or however `normalize` says; one already there is not
 * added twice.
 */
export function listPage(o: {
  label: string
  placeholder: string
  note?: string
  items: readonly string[]
  count: string
  empty: string
  normalize?: (text: string) => string
  add: (item: string) => void
  remove: (item: string) => void
  itemNote?: (item: string) => string | null
  /** A card after the add card: a suggestion, for instance. */
  extra?: HTMLElement | null
}): HTMLElement[] {
  const norm = o.normalize ?? (text => text.trim())
  const add = (field: HTMLInputElement) => {
    const item = norm(field.value)
    if (!item) return field.focus()
    field.value = ''
    field.focus()
    if (o.items.some(x => x.toLowerCase() === item.toLowerCase())) return
    o.add(item)
  }
  const field = liveField('add', o.placeholder, o.label, (key, f) => (key === 'Enter' ? add(f) : ((f.value = ''), f.blur())))
  const addCard = el(
    'div',
    { class: 'row add' },
    el('div', { class: 'fields' }, field, btn([lucide('plus', 's'), t('ui.add')], () => add(field), 'primary')),
    o.note ? el('small', {}, o.note) : null,
  )
  const items = o.items.map(item => ({ text: item, title: o.itemNote?.(item) ?? undefined, remove: () => o.remove(item) }))
  return [
    grp(o.label),
    addCard,
    o.extra ?? null,
    grp(o.count, o.items.length || undefined),
    items.length ? wordChips(items) : aside('info', o.empty),
  ].filter((n): n is HTMLElement => n !== null)
}

/** Still the codicon glyph where a page draws one by name. */
export { icon }
