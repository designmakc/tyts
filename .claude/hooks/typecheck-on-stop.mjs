// Stop hook: a turn that changed TypeScript in src/ may not end while the typecheck fails.
// The typecheck also fails when a phrase is missing from uk.ts or ru.ts, so this guards the
// three-languages rule too. Plain Node, no dependencies: the same on Windows, WSL and a Mac.
// Exit 0 lets the turn end; exit 2 sends stderr back to Claude, which goes on and fixes it.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

let input = {}
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  // No input or not JSON: check as on a first stop.
}

// Already continuing because of this hook: let the turn end, never loop.
if (input.stop_hook_active === true) process.exit(0)

// Dependencies are not installed: there is no tsc to run.
if (!existsSync(join(root, 'node_modules'))) process.exit(0)

// -uall lists the files of a new folder one by one, not the folder alone.
const status = spawnSync('git', ['status', '--porcelain', '-uall', '--', 'src'], { cwd: root, encoding: 'utf8' })
if (status.status !== 0 || !/\.ts"?$/m.test(status.stdout)) process.exit(0)

// npm is npm.cmd on Windows, which only a shell can start; the command is a fixed string.
const check = spawnSync('npm run typecheck', { cwd: root, shell: true, encoding: 'utf8' })
if (check.status === 0) process.exit(0)

const output = [check.stdout, check.stderr, check.error?.message].filter(Boolean).join('\n')
const tail = output.trim().split(/\r?\n/).slice(-40).join('\n')
console.error(`npm run typecheck fails; fix it before ending the turn (last 40 lines):\n${tail}`)
process.exit(2)
