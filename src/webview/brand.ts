// Tyts's logo and icon as the pages draw them (2026-11-06): the text logo "тиць•"
// (theme.css `.logo`, the name in lower case and a coral dot, the tap) and the app
// icon, a tap and its ripple, white on a coral tile (build/icon.svg), where the
// logo has no room.

import { t } from '../i18n'
import { el, html } from './dom'

/** The text logo; its size is the place's font size. Its word is the name in the interface's language, in lower case in Cyrillic: Tyts, тиць. */
export function logo(): HTMLElement {
  const name = t('app.name')
  return el('span', { class: 'logo', 'aria-label': name }, el('span', {}, /[а-яіїєґ]/i.test(name) ? name.toLowerCase() : name), el('span', { class: 'dot', 'aria-hidden': 'true' }))
}

/** The app icon, `px` pixels square. */
export function tile(px: number): SVGSVGElement {
  const svg = html(
    `<svg class="tile" width="${px}" height="${px}" viewBox="0 0 256 256" aria-hidden="true">` +
      '<rect x="16" y="16" width="224" height="224" rx="56" fill="#FF5A36"/>' +
      (px <= 32
        ? '<circle cx="128" cy="128" r="34" fill="#fff"/><circle cx="128" cy="128" r="78" fill="none" stroke="#fff" stroke-width="26"/>'
        : '<circle cx="128" cy="128" r="25" fill="#fff"/><circle cx="128" cy="128" r="57" fill="none" stroke="#fff" stroke-width="11"/><circle cx="128" cy="128" r="93" fill="none" stroke="#fff" stroke-width="11" opacity=".55"/>') +
      '</svg>',
  ).firstElementChild
  return svg as SVGSVGElement
}
