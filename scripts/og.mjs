// The landing's pictures for links shared in chats and social networks (2026-11-06): site/og-<lang>.png,
// 1200×630, Tyts's sign, the tagline with its coral dot, one line of what it does, the address.
// Drawn by Chromium offscreen with the app's own fonts. Run under Electron: npx electron scripts/og.mjs
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { app, BrowserWindow } from 'electron'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const font = name => pathToFileURL(path.join(root, 'media', 'fonts', name)).href

const TEXT = {
  en: { name: 'Tyts', beta: 'beta', tag: 'Tyts — and done', line: 'Fixes the layout, translates, types what you say and checks your English. AI that runs on your own computer.', foot: 'no cloud · no subscription · open source' },
  uk: { name: 'тиць', beta: 'бета', tag: 'Тиць — і готово', line: 'Виправляє розкладку, перекладає, друкує сказане й перевіряє вашу англійську. ШІ, що працює на вашому комп’ютері.', foot: 'без хмари · без підписки · відкритий код' },
  ru: { name: 'тиць', beta: 'бета', tag: 'Тиць — и готово', line: 'Исправляет раскладку, переводит, печатает сказанное и проверяет ваш английский. ИИ, который работает на вашем компьютере.', foot: 'без облака · без подписки · открытый код' },
}

const ripple = px =>
  `<svg width="${px}" height="${px}" viewBox="16 16 224 224"><rect x="16" y="16" width="224" height="224" rx="56" fill="#FF5A36"/><circle cx="128" cy="128" r="25" fill="#fff"/><circle cx="128" cy="128" r="57" fill="none" stroke="#fff" stroke-width="11"/><circle cx="128" cy="128" r="93" fill="none" stroke="#fff" stroke-width="11" opacity=".55"/></svg>`

const page = t => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(${font('inter-latin.woff2')}) format('woff2');unicode-range:U+0000-024F,U+2000-206F}
@font-face{font-family:Inter;src:url(${font('inter-cyrillic.woff2')}) format('woff2');unicode-range:U+0400-04FF}
@font-face{font-family:Mono;src:url(${font('jbmono-latin.woff2')}) format('woff2');unicode-range:U+0000-024F,U+2000-206F}
@font-face{font-family:Mono;src:url(${font('jbmono-cyrillic.woff2')}) format('woff2');unicode-range:U+0400-04FF}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#171413;color:#f4f0ee;font-family:Inter,sans-serif;padding:64px 72px;display:flex;flex-direction:column;overflow:hidden;position:relative}
.ring{position:absolute;right:-170px;top:-150px;width:620px;height:620px;border-radius:50%;border:2px solid rgba(255,90,54,.22)}
.ring.b{right:-60px;top:-40px;width:400px;height:400px;border-color:rgba(255,90,54,.35)}
.head{display:flex;align-items:center;gap:18px}
.head svg{border-radius:14px}
.name{font-weight:800;font-size:38px;letter-spacing:-1px;display:flex;align-items:baseline}
.dot{display:inline-block;width:.26em;height:.26em;border-radius:50%;background:#FF5A36;margin-left:.07em}
.beta{font:500 18px Mono,monospace;color:#a59d98;border:1px solid #3b3633;border-radius:999px;padding:4px 14px;margin-left:6px}
h1{font-weight:800;font-size:108px;letter-spacing:-4px;line-height:1;margin-top:74px;display:flex;align-items:baseline;white-space:nowrap}
p{font-size:31px;line-height:1.38;color:#c2bab5;margin-top:30px;max-width:960px}
.foot{margin-top:auto;display:flex;justify-content:space-between;font:500 22px Mono,monospace;color:#a59d98}
.foot b{color:#f4f0ee;font-weight:500}
</style></head><body><div class="ring"></div><div class="ring b"></div>
<div class="head">${ripple(64)}<span class="name">${t.name}<span class="dot"></span></span><span class="beta">${t.beta}</span></div>
<h1>${t.tag}<span class="dot"></span></h1>
<p>${t.line}</p>
<div class="foot"><span>${t.foot}</span><b>designmakc.github.io/tyts</b></div>
</body></html>`

async function main() {
  const win = new BrowserWindow({ width: 1200, height: 630, show: false, useContentSize: true, webPreferences: { offscreen: true } })
  for (const [lang, t] of Object.entries(TEXT)) {
    const file = path.join(app.getPath('temp'), `tyts-og-${lang}.html`)
    fs.writeFileSync(file, page(t))
    await win.loadFile(file)
    await win.webContents.executeJavaScript('document.fonts.ready.then(() => 1)')
    await new Promise(r => setTimeout(r, 300))
    const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1200, height: 630 })
    fs.writeFileSync(path.join(root, 'site', `og-${lang}.png`), image.resize({ width: 1200, height: 630 }).toPNG())
    fs.rmSync(file)
  }
  win.destroy()
}

app.whenReady().then(main).then(
  () => app.quit(),
  error => {
    console.error(error)
    app.exit(1)
  },
)
