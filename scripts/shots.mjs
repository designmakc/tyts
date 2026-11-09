// Pictures of every surface of the app window, the tray panel and the dictation badge, made
// offscreen by scripts/shots/harness.ts under Electron: npm run shots -> .cache/shots/*.png
// and log.txt. Build first (dist/preload.js, media/*.js); the installed Kryakl may keep running.
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import electron from 'electron'
import { build } from 'esbuild'

mkdirSync('.cache/shots', { recursive: true })
await build({ entryPoints: ['scripts/shots/harness.ts'], bundle: true, platform: 'node', format: 'cjs', target: 'node22', external: ['electron'], outfile: '.cache/shots/harness.js', logLevel: 'warning' })
// A shell from VS Code may carry ELECTRON_RUN_AS_NODE, which would make Electron plain Node.
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
const r = spawnSync(String(electron), ['.cache/shots/harness.js'], { stdio: 'inherit', env })
process.exit(r.status ?? 1)
