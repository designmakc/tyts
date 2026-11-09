// Who holds the microphone, every 2 s, for a call recording that starts by
// itself (callwatch.ts decides). A Mac: build/mic-mac.swift, a process of its
// own that prints a line every 2 s. Windows: the privacy registry's
// LastUsedTimeStop through reg.exe (no window titles there, so a call in a
// browser is not seen). Only states go into the log, never titles.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import readline from 'node:readline'

import { parseMicRegistry, type MicUser } from './callwatch'
import { system32 } from './system32'

const LOOK_MS = 2000
const RESTART_MS = 10_000
const MIC_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone'

/** Starts watching; `report` gets the programs on the microphone (null: the system cannot say). Returns the stop. */
export function watchMic(helper: string | undefined, report: (users: MicUser[] | null) => void, log: (line: string) => void): () => void {
  let stopped = false
  if (process.platform === 'win32') {
    const timer = setInterval(() => {
      execFile(system32('reg.exe'), ['query', MIC_KEY, '/s', '/v', 'LastUsedTimeStop'], { windowsHide: true, timeout: 3000 }, (error, stdout) => {
        // reg.exe exits 1 when nothing matches: nobody has used the microphone yet.
        if (!stopped) report(error && !stdout ? [] : parseMicRegistry(stdout).map(name => ({ pid: 0, name, titles: [] })))
      })
    }, LOOK_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }
  if (process.platform !== 'darwin' || !helper) return () => undefined
  let child: ChildProcess | undefined
  let again: NodeJS.Timeout | undefined
  const start = () => {
    const run = spawn(helper, [], { stdio: ['ignore', 'pipe', 'ignore'] })
    child = run
    readline.createInterface({ input: run.stdout! }).on('line', line => {
      try {
        const got = JSON.parse(line) as { apps: { pid: number; name: string; titles: string[] }[] | null }
        report(got.apps ? got.apps.map(a => ({ pid: a.pid, name: a.name, titles: a.titles ?? [] })) : null)
      } catch {
        // A line cut short: the next comes in 2 s.
      }
    })
    run.on('error', error => log(`call watch: the microphone helper did not start: ${error.message}`))
    run.on('exit', code => {
      if (stopped) return
      log(`call watch: the microphone helper ended (${code ?? 'signal'}), started again in ${RESTART_MS / 1000} s`)
      again = setTimeout(start, RESTART_MS)
    })
  }
  start()
  return () => {
    stopped = true
    clearTimeout(again)
    child?.kill()
  }
}
