/**
 * Kryakl's own glyphs, drawn on the 16 px grid of the design: codicons have
 * no skip-to-sentence pair, play and stop must share one shape language (one
 * turns into the other in place), the card's pin stands upright, and the app
 * window's minimize and close sit beside them in the same strokes.
 */
const GLYPHS = {
  play: '<path class="f" d="M5 3.2v9.6c0 .5.5.8.9.5l7-4.8a.6.6 0 0 0 0-1L5.9 2.7c-.4-.3-.9 0-.9.5z"/>',
  stop: '<rect class="f" x="3.5" y="3.5" width="9" height="9" rx="1.8"/>',
  prev: '<path d="M3.5 3.5v9"/><path class="f" d="M12.5 3.6v8.8c0 .4-.5.7-.8.4L6 8.4a.5.5 0 0 1 0-.8l5.7-4.4c.3-.3.8 0 .8.4z"/>',
  next: '<path d="M12.5 3.5v9"/><path class="f" d="M3.5 3.6v8.8c0 .4.5.7.8.4L10 8.4a.5.5 0 0 0 0-.8L4.3 3.2c-.3-.3-.8 0-.8.4z"/>',
  pin: '<path d="M6 2.5h4M7 2.5v3.8L4.5 9h7L9 6.3V2.5M8 9v4.5"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  minimize: '<path d="M4 8h8"/>',
  maximize: '<rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/>',
  restore: '<rect x="3.5" y="5.5" width="7" height="7" rx="1.5"/><path d="M6 3.5h5a1.5 1.5 0 0 1 1.5 1.5v5"/>',
}

export type GlyphName = keyof typeof GLYPHS

export function glyph(name: GlyphName): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'glyph')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  svg.dataset.shape = name
  svg.innerHTML = GLYPHS[name]
  return svg
}
