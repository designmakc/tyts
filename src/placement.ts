// Where the card opens: just below and to the right of the pointer, turned to
// the other side of it where the screen ends, and never outside the screen's
// work area (the taskbar excluded).

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }

const OFFSET = 14

export function placeNear(point: Point, size: { width: number; height: number }, area: Rect): Rect {
  const width = Math.min(size.width, area.width)
  const height = Math.min(size.height, area.height)
  let x = point.x + OFFSET
  let y = point.y + OFFSET
  if (x + width > area.x + area.width) x = point.x - OFFSET - width
  if (y + height > area.y + area.height) y = point.y - OFFSET - height
  x = Math.min(Math.max(x, area.x), area.x + area.width - width)
  y = Math.min(Math.max(y, area.y), area.y + area.height - height)
  return { x: Math.round(x), y: Math.round(y), width, height }
}

const MENU_GAP = 8
/** The menu starts a little left of the text cursor, so its letters stand under the text. */
const MENU_LEFT = 12

/**
 * Kryakl's menu: under the text cursor (`top` to `bottom`, at `x`; the pointer
 * has them equal), over it where the screen ends, never outside the work area.
 */
export function placeMenu(at: { x: number; top: number; bottom: number }, size: { width: number; height: number }, area: Rect): Rect {
  const width = Math.min(size.width, area.width)
  const height = Math.min(size.height, area.height)
  const right = area.x + area.width
  const bottom = area.y + area.height
  const x = Math.min(Math.max(at.x - MENU_LEFT, area.x), right - width)
  let y = at.bottom + MENU_GAP
  if (y + height > bottom) y = at.top - MENU_GAP - height
  y = Math.min(Math.max(y, area.y), bottom - height)
  return { x: Math.round(x), y: Math.round(y), width, height }
}

const TRAY_GAP = 8

/**
 * The tray's panel: by the tray icon, on the side away from the taskbar
 * (above it when the taskbar is at the bottom), never outside the work area.
 * An icon inside the work area (in the hidden icons' flyout) gets the panel
 * above it, or below where there is no room.
 */
export function placeByTray(icon: Rect, size: { width: number; height: number }, area: Rect): Rect {
  const width = Math.min(size.width, area.width - 2 * TRAY_GAP)
  const height = Math.min(size.height, area.height - 2 * TRAY_GAP)
  const right = area.x + area.width
  const bottom = area.y + area.height
  let x = icon.x + icon.width / 2 - width / 2
  let y = icon.y + icon.height / 2 - height / 2
  if (icon.y >= bottom) y = bottom - TRAY_GAP - height
  else if (icon.y + icon.height <= area.y) y = area.y + TRAY_GAP
  else if (icon.x >= right) x = right - TRAY_GAP - width
  else if (icon.x + icon.width <= area.x) x = area.x + TRAY_GAP
  else y = icon.y - TRAY_GAP - height >= area.y ? icon.y - TRAY_GAP - height : icon.y + icon.height + TRAY_GAP
  x = Math.min(Math.max(x, area.x + TRAY_GAP), right - TRAY_GAP - width)
  y = Math.min(Math.max(y, area.y + TRAY_GAP), bottom - TRAY_GAP - height)
  return { x: Math.round(x), y: Math.round(y), width, height }
}

/** The card grew or shrank: it keeps its top unless the screen ends, then moves up. */
export function resize(bounds: Rect, height: number, area: Rect): Rect {
  const h = Math.min(height, area.height)
  const y = Math.min(bounds.y, area.y + area.height - h)
  return { ...bounds, y: Math.max(y, area.y), height: h }
}

/** The dictation badge's gap above the work area's bottom edge, with no offset of the person's. */
export const BADGE_GAP = 12

/**
 * The dictation badge: its bottom centre at the work area's bottom centre
 * (BADGE_GAP above it) moved by the person's offset, and never outside the
 * work area, so an offset kept from a larger screen still shows.
 */
export function placeBadge(offset: { dx: number; dy: number }, size: { width: number; height: number }, area: Rect): Rect {
  const width = Math.min(size.width, area.width)
  const height = Math.min(size.height, area.height)
  const x = area.x + area.width / 2 + offset.dx - width / 2
  const y = area.y + area.height - BADGE_GAP + offset.dy - height
  return {
    x: Math.round(Math.min(Math.max(x, area.x), area.x + area.width - width)),
    y: Math.round(Math.min(Math.max(y, area.y), area.y + area.height - height)),
    width,
    height,
  }
}

/** Where a window flying from `from` to `to` is at `progress` (0…1): it sets off slowly and speeds up, as a thing falling in. */
export function flightPoint(from: { x: number; y: number }, to: { x: number; y: number }, progress: number): { x: number; y: number } {
  const eased = Math.min(1, Math.max(0, progress)) ** 2
  return { x: Math.round(from.x + (to.x - from.x) * eased), y: Math.round(from.y + (to.y - from.y) * eased) }
}

/** The offset a badge dropped at `bounds` keeps: placeBadge's in reverse. */
export function badgeOffset(bounds: Rect, area: Rect): { dx: number; dy: number } {
  return {
    dx: Math.round(bounds.x + bounds.width / 2 - (area.x + area.width / 2)),
    dy: Math.round(bounds.y + bounds.height - (area.y + area.height - BADGE_GAP)),
  }
}

const BAR_GAP = 8

/**
 * The bar by a selection: its pill (`size`) centred on the selection's end (`at.x`),
 * BAR_GAP above its lines (`top`), below them (`bottom`) where the work area has no room
 * for the pill and its tooltip's `band`. The window is `wide` at least (a tooltip may be
 * wider than the pill), the pill in its middle, the band on the side away from the text
 * (`above`: the bar is over the text, its band on top). `pill`: the pill alone.
 */
export function placeBar(
  at: { x: number; top: number; bottom: number },
  size: { width: number; height: number },
  band: number,
  wide: number,
  area: Rect,
): { window: Rect; pill: Rect; above: boolean } {
  const width = Math.min(Math.max(size.width, wide), area.width)
  const height = size.height
  const x = Math.round(Math.min(Math.max(at.x - width / 2, area.x), area.x + area.width - width))
  const up = at.top - BAR_GAP - height
  // Above whenever the pill itself fits there (so it never covers the next line); the tooltips' band may be cut by the screen's edge.
  const above = up >= area.y
  const y = Math.round(above ? up : Math.min(at.bottom + BAR_GAP, area.y + area.height - height - band))
  const pillWidth = Math.min(size.width, width)
  const pill = { x: Math.round(x + (width - pillWidth) / 2), y, width: pillWidth, height }
  const top = above ? Math.max(area.y, y - band) : y
  return { window: { x, y: top, width, height: height + (above ? y - top : band) }, pill, above }
}
