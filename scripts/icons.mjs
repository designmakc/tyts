// Draws Tyts's pictures (2026-11-06): the app icon is a tap and its ripple, white on a
// coral rounded tile (build/icon.svg): build/icon.png (512 px), build/icon.ico (16, 24,
// 32, 48, 256) and media/icon.png (128 px); at 32 px and under one thicker ripple. The
// tray's icon is the ripple without a tile, the ring in the taskbar's ink and the dot
// coral: media/tray-light.png, tray-dark.png, each with its @2x, tray-*-paused.png (45 %),
// and tray-recording.png, a red dot, while anything records. All of it is drawn on a
// canvas; the SVG is copied to media/. Run under Electron: npm run icons.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow } from 'electron'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The tile's coral and the ripple's white (build/icon.svg). */
const TILE = { k: '#FF5A36', w: '#FFFFFF' }
/** The tray's colours by the taskbar's theme: the ripple in the ink of Windows' own glyphs there, the dot coral. */
const TASKBAR = {
  light: { ink: '#1b1b1b', dot: '#FF5A36' },
  dark: { ink: '#f2f2f2', dot: '#FF7A5C' },
}
/** Recording: a plain red dot, Windows' own record red; the same as theme.css `--rec` (the dictation badge's dot). */
const RECORD = { r: '#E81123' }
/** A round dot of radius `r` on a `size` grid, as rows. */
const disc = (size, r) => [...Array(size)].map((_, y) => [...Array(size)].map((_, x) => ((x + 0.5 - size / 2) ** 2 + (y + 0.5 - size / 2) ** 2 <= r * r ? 'r' : '.')).join(''))

/** Runs in the page: the app icon at `size`, as a PNG data URL; at 32 px and under one thicker ripple. */
function drawTile(size, c) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')
  // build/icon.svg's numbers, on its 256-unit grid.
  g.scale(size / 256, size / 256)
  g.fillStyle = c.k
  g.beginPath()
  g.roundRect(16, 16, 224, 224, 56)
  g.fill()
  const ring = (r, w, a) => {
    g.globalAlpha = a
    g.lineWidth = w
    g.strokeStyle = c.w
    g.beginPath()
    g.arc(128, 128, r, 0, Math.PI * 2)
    g.stroke()
  }
  const small = size <= 32
  g.fillStyle = c.w
  g.beginPath()
  g.arc(128, 128, small ? 34 : 25, 0, Math.PI * 2)
  g.fill()
  if (small) ring(78, 26, 1)
  else {
    ring(57, 11, 1)
    ring(93, 11, 0.55)
  }
  return canvas.toDataURL('image/png')
}

/** Runs in the page: the tray's ripple without a tile at `size` px, the ring in `c.ink`, the dot in `c.dot`, `alpha` opaque. */
function drawTray(size, c, alpha) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')
  g.scale(size / 16, size / 16)
  g.globalAlpha = alpha
  g.strokeStyle = c.ink
  g.lineWidth = 1.7
  g.beginPath()
  g.arc(8, 8, 5.9, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = c.dot
  g.beginPath()
  g.arc(8, 8, 2.5, 0, Math.PI * 2)
  g.fill()
  return canvas.toDataURL('image/png')
}

/** Runs in the page: `rows` of pixels on a 16 grid in `colours` (by character), each pixel `scale` wide, `alpha` opaque. */
function drawPixels(rows, colours, scale, alpha) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = rows.length * scale
  const g = canvas.getContext('2d')
  g.globalAlpha = alpha
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!colours[ch]) return
      g.fillStyle = colours[ch]
      g.fillRect(x * scale, y * scale, scale, scale)
    }),
  )
  return canvas.toDataURL('image/png')
}

/** An .ico holding PNG pictures, smallest first. */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  pngs.forEach(([size, png], i) => {
    const at = 6 + 16 * i
    header.writeUInt8(size >= 256 ? 0 : size, at)
    header.writeUInt8(size >= 256 ? 0 : size, at + 1)
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(png.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...pngs.map(([, png]) => png)])
}

async function main() {
  const win = new BrowserWindow({ width: 320, height: 240, show: false, webPreferences: { offscreen: true } })
  await win.loadURL('data:text/html,<!DOCTYPE html><html><body></body></html>')
  const png = url => Buffer.from(url.split(',')[1], 'base64')
  const run = async (fn, ...args) => png(await win.webContents.executeJavaScript(`(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(', ')})`))
  const tile = size => run(drawTile, size, TILE)
  const pngs = []
  for (const size of [16, 24, 32, 48, 256]) pngs.push([size, await tile(size)])
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), ico(pngs))
  fs.writeFileSync(path.join(root, 'build', 'icon.png'), await tile(512))
  fs.writeFileSync(path.join(root, 'media', 'icon.png'), await tile(128))
  // The tray: 16 px and its @2x, which Electron takes on a screen at 200 %.
  const tray = async (name, colours, alpha = 1) => {
    fs.writeFileSync(path.join(root, 'media', `${name}.png`), await run(drawTray, 16, colours, alpha))
    fs.writeFileSync(path.join(root, 'media', `${name}@2x.png`), await run(drawTray, 32, colours, alpha))
  }
  for (const [theme, colours] of Object.entries(TASKBAR)) {
    await tray(`tray-${theme}`, colours)
    await tray(`tray-${theme}-paused`, colours, 0.45)
  }
  // The dot is round at either size: its 32 px picture is drawn on a 32 grid, not doubled.
  fs.writeFileSync(path.join(root, 'media', 'tray-recording.png'), await run(drawPixels, disc(16, 5.5), RECORD, 1, 1))
  fs.writeFileSync(path.join(root, 'media', 'tray-recording@2x.png'), await run(drawPixels, disc(32, 11), RECORD, 1, 1))
  fs.copyFileSync(path.join(root, 'build', 'icon.svg'), path.join(root, 'media', 'icon.svg'))
  win.destroy()
}

app.whenReady().then(main).then(
  () => app.quit(),
  error => {
    console.error(error)
    app.exit(1)
  },
)
