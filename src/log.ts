// Tyts's own log: a line per thing worth knowing after the fact (a window
// that did not show, a download that failed), in %APPDATA%\Tyts\tyts.log,
// beside the engine's speech.log. The console gets the same line; main.ts
// sends its warnings here too. Kept small: past 1 MB the file starts over,
// the last one kept as tyts.old.log, so a report (report.ts) still has the
// lines before a problem.

import * as fs from 'node:fs'
import * as path from 'node:path'

const MOST = 1_000_000

let file = ''

/** Where the log goes; until this is called, lines go to the console only. */
export function logTo(dir: string): void {
  file = path.join(dir, 'tyts.log')
}

/** The log before this one: tyts.log → tyts.old.log. */
export const oldLog = (file: string): string => `${file.replace(/\.log$/, '')}.old.log`

/** Starts a log afresh once it is past `most` bytes, the last one kept beside it (`oldLog`). */
export function rotate(file: string, most: number): void {
  try {
    if (fs.statSync(file).size > most) fs.renameSync(file, oldLog(file))
  } catch {
    // None yet, or held: written on as it is.
  }
}

export function log(line: string): void {
  const stamp = new Date().toISOString().slice(11, 23)
  console.log(`Tyts ${stamp} ${line}`)
  if (!file) return
  try {
    rotate(file, MOST)
    fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`)
  } catch {
    // The log is a help, never a fault.
  }
}
