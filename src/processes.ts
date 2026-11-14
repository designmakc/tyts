// The programs running on this computer, and those run from inside a folder of Tyts's (an older speech
// engine left running): found through PowerShell, stopped so the folder's files are let go.

import { spawn } from 'node:child_process'

import { pathOf, POWERSHELL } from './system32'

/** A stop that failed: what was said and the error. */
export type Warn = (message: string, error: unknown) => void

/** A program running on this computer: its process id, its file name, the full path of its executable. */
export type RunningProcess = { pid: number; name: string; path: string }

/** Windows' list of programs as `PROCESS_SCRIPT` prints it, a line each: "pid<TAB>name<TAB>path". */
export function parseProcesses(text: string): RunningProcess[] {
  return text
    .split(/\r?\n/)
    .map(line => line.split('\t'))
    .filter(f => f.length >= 3 && /^\d+$/.test(f[0]!.trim()) && f[2]!.trim())
    .map(([pid, name, file]) => ({ pid: Number(pid), name: name!.trim(), path: file!.trim() }))
}

/** The programs run from inside `dir` (the speech engine's python.exe and uv.exe, llama-server.exe); never Tyts itself (`self`). */
export function holdersIn(processes: readonly RunningProcess[], dir: string, self = process.pid): RunningProcess[] {
  const P = pathOf(dir)
  const root = P.resolve(dir).toLowerCase().replace(/[\\/]+$/, '') + P.sep
  return processes.filter(p => p.pid !== self && P.resolve(p.path).toLowerCase().startsWith(root))
}

/** Every program Windows lets this user see, with its executable's path (UTF-8, for folders named in any language). */
const PROCESS_SCRIPT = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath } | ForEach-Object { "$($_.ProcessId)\`t$($_.Name)\`t$($_.ExecutablePath)" }`

const PROCESS_ARGS = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(PROCESS_SCRIPT, 'utf16le').toString('base64')]
const PROCESS_TIMEOUT_MS = 20_000

/** The programs running now, asked of Windows through PowerShell while Tyts goes on (a second or so); none when it does not answer. */
export function runningProcessesSoon(): Promise<RunningProcess[]> {
  if (process.platform !== 'win32') return Promise.resolve([])
  return new Promise(resolve => {
    const child = spawn(POWERSHELL, PROCESS_ARGS, { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    let out = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (out += chunk))
    const timer = setTimeout(() => child.kill(), PROCESS_TIMEOUT_MS)
    child.on('error', () => (clearTimeout(timer), resolve([])))
    child.on('exit', code => (clearTimeout(timer), resolve(code === 0 ? parseProcesses(out) : [])))
  })
}

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    // Running, but not this user's to signal.
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/**
 * Stops the programs run from inside `dir` (`holdersIn`) and waits up to `waitMs` for them to be gone, while Tyts
 * goes on (an older speech engine left running). Returns those stopped and those still running (another user's,
 * or one that would not stop).
 */
export async function freeFolderSoon(dir: string, processes: readonly RunningProcess[], warn: Warn = () => undefined, waitMs = 5000): Promise<{ stopped: RunningProcess[]; holding: RunningProcess[] }> {
  const holders = stopHolders(dir, processes, warn)
  const until = Date.now() + waitMs
  while (holders.some(p => alive(p.pid)) && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 100))
  return settled(holders)
}

function stopHolders(dir: string, processes: readonly RunningProcess[], warn: Warn): RunningProcess[] {
  const holders = holdersIn(processes, dir)
  for (const p of holders) {
    try {
      process.kill(p.pid)
    } catch (error) {
      warn(`Tyts: could not stop ${p.name} (${p.pid}), run from ${dir}`, error)
    }
  }
  return holders
}

function settled(holders: readonly RunningProcess[]): { stopped: RunningProcess[]; holding: RunningProcess[] } {
  const holding = holders.filter(p => alive(p.pid))
  return { stopped: holders.filter(p => !holding.includes(p)), holding }
}
