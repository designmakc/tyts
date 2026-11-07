// Kryakl at rest is a good neighbour (docs/backlog.md, "Контракт ресурсов"): after a few idle minutes it holds
// nothing of the graphics card. `node scripts/idle-check.mjs [minutes]` waits that long (0: looks at once),
// then lists Kryakl's processes with their memory, asks the speech engine which models it has in memory, and
// says whether anything of Kryakl's is still on the card. Kryakl runs as it is (installed or `npm start`); this
// script starts nothing and changes nothing. Exit 1 when something stays on the card.
import { execFileSync } from 'node:child_process'
import { createHmac, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const minutes = Number(process.argv[2] ?? 5)
const home = process.env.TYTS_TEST_HOME ?? path.join(process.env.APPDATA ?? "", "Tyts")
const port = Number(process.env.TYTS_SPEECH_PORT ?? 8765)

if (minutes > 0) {
  console.log(`Waiting ${minutes} min; use nothing of Kryakl's meanwhile…`)
  await new Promise(resolve => setTimeout(resolve, minutes * 60_000))
}

// Kryakl's processes: the app (installed, or Electron from this repository), llama.cpp's server, the speech engine's Python.
const ps = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
const listing = execFileSync(ps, ['-NoProfile', '-Command', 'Get-Process | Where-Object Path | Select-Object Id, Name, Path, PrivateMemorySize64 | ConvertTo-Json -Compress'], { encoding: 'utf8' })
const repo = path.resolve('.').toLowerCase()
const mine = JSON.parse(listing).filter(p => {
  const exe = p.Path.toLowerCase()
  return /\\tyts\.exe$/.test(exe) || (exe.startsWith(repo) && /electron\.exe$/.test(exe)) || /\\llama-server\.exe$/.test(exe) || (/\\(tyts|kryakl|krya|altype)\\speech\\/.test(exe) && /pythonw?\.exe$/.test(exe))
})
const mb = bytes => Math.round(bytes / 1048576)
console.log('\nKryakl\'s processes (private memory):')
for (const p of mine) console.log(`  ${String(mb(p.PrivateMemorySize64)).padStart(6)} MB  ${p.Name} (${p.Id})`)
console.log(`  ${String(mb(mine.reduce((n, p) => n + p.PrivateMemorySize64, 0))).padStart(6)} MB  together`)

const onCard = []
if (mine.some(p => /llama-server/i.test(p.Name))) onCard.push('llama.cpp\'s server is running (Translate / Check my English)')

// The engine's models, asked as Kryakl asks: its proof of the key first, the key only once it is right.
let token = ''
try {
  token = readFileSync(path.join(home, 'speech-token'), 'utf8').trim()
} catch {}
const base = `http://127.0.0.1:${port}`
try {
  const nonce = randomBytes(16).toString('hex')
  const look = await (await fetch(`${base}/health`, { headers: { 'x-tyts-nonce': nonce } })).json()
  if (!token || look.proof !== createHmac('sha256', token).update(nonce).digest('hex')) throw new Error('not Kryakl\'s engine, or no key here')
  const health = await (await fetch(`${base}/health`, { headers: { 'x-tyts-token': token } })).json()
  const loaded = health.loaded
  if (!loaded) console.log(`\nThe speech engine (${health.version}) does not say what it has in memory: one of Kryakl 0.12.0 or older`)
  else console.log(`\nThe speech engine has in memory: ${loaded.length ? loaded.map(m => `${m.model} (${m.device})`).join(', ') : 'nothing'}`)
  for (const m of loaded ?? []) if (m.device === 'cuda') onCard.push(`the speech engine's ${m.model}`)
} catch (error) {
  console.log(`\nThe speech engine did not answer (${error.message}): not running, or another Kryakl's`)
}

console.log(onCard.length ? `\nOn the graphics card after ${minutes} idle min: ${onCard.join('; ')}` : `\nNothing of Kryakl's on the graphics card after ${minutes} idle min.`)
process.exit(onCard.length ? 1 : 0)
