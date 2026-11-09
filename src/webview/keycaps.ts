// Keys drawn as keycaps, the same way on every page: the keyboard is the interface.

import { hotkeyLabel } from '../hotkey'
import { t } from '../i18n'
import { el } from './dom'

/** Ctrl+C pressed twice, as the app window and the tray name the Listen key. */
export const COPY_TWICE = 'Control+C*2'

/** A hotkey as keycaps: "LeftControl*2" → [Left Ctrl] ×2, "Control+Alt+S" → [Ctrl][Alt][S]; none → a dashed "not set". */
export function caps(hotkey: string, chain?: string): HTMLElement {
  const attrs = chain ? { class: 'kg', 'data-chain': chain } : { class: 'kg' }
  if (!hotkey) return el('span', attrs, el('span', { class: 'key none' }, t('keys.notSet')))
  const twice = hotkey.endsWith('*2')
  const parts = hotkey.replace(/\*2$/, '').split('+')
  return el('span', attrs, ...parts.map(part => el('span', { class: 'key' }, hotkeyLabel(part))), twice ? el('span', { class: 'x2' }, '×2') : null)
}
