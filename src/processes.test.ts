import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, expect, test } from 'vitest'

import { freeFolderSoon, holdersIn, parseProcesses } from './processes'

const made: string[] = []
afterEach(() => made.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })))

function temp(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  made.push(dir)
  return dir
}

test('the programs run from inside a folder: whatever case Windows wrote the path in, never Tyts itself or a folder that only begins alike', () => {
  const text = [
    '4\tSystem\t',
    '120\tpython.exe\tC:\\Users\\you\\AppData\\Local\\Tyts\\speech\\env\\Scripts\\python.exe',
    '121\tllama-server.exe\tc:\\users\\YOU\\appdata\\local\\tyts\\translate\\engine\\vulkan-ab12\\llama-server.exe',
    '122\tpython.exe\tC:\\Users\\you\\AppData\\Local\\Tyts2\\python.exe',
    '123\tpython.exe\tE:\\Code\\tyts\\engine\\.venv\\Scripts\\python.exe',
    '125\tTyts.exe\tC:\\Users\\you\\AppData\\Local\\Tyts\\Tyts.exe',
    'garbage',
  ].join('\r\n')
  const processes = parseProcesses(text)
  expect(processes.map(p => p.pid)).toEqual([120, 121, 122, 123, 125])
  const holders = holdersIn(processes, 'C:\\Users\\you\\AppData\\Local\\Tyts\\', 125)
  expect(holders.map(p => p.pid)).toEqual([120, 121])
})

test('an older engine is stopped while Tyts goes on, and only a program run from inside its folder', async () => {
  const dir = temp('tyts-speech-')
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
  await new Promise(resolve => child.once('spawn', resolve))
  const inside = { pid: child.pid!, name: 'python.exe', path: path.join(dir, 'env', 'Scripts', 'python.exe') }
  // A folder whose name only begins as this one's is another folder.
  const beside = { pid: 2_000_000_000, name: 'python.exe', path: path.join(dir + '-other', 'python.exe') }
  const gone = new Promise(resolve => child.once('exit', resolve))
  let settled = false
  const freeing = freeFolderSoon(dir, [inside, beside]).finally(() => (settled = true))
  // Its wait is a timer, not main's thread held.
  expect(settled).toBe(false)
  const r = await freeing
  await gone
  expect(r.stopped.map(p => p.pid)).toEqual([child.pid])
  expect(r.holding).toEqual([])
})
