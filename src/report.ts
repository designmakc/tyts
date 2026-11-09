// A problem report (Tyts › Report a problem, the tray's Report): one zip the
// person sends by hand, attached to an email or a GitHub issue; Tyts sends
// nothing itself (2026-10-31, the owner). It holds Tyts's three logs, each
// with the one before it (log.ts rotate), what this computer is (device.json)
// and the settings with the person's own lists only counted; never their
// words, mistakes, translations, phrases or transcripts, nor the Hugging Face
// key (speech.json and speech-token are not taken). The Windows account's
// name and the computer's are replaced in every line, and a key or token cut.

import { execFile } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { t } from './i18n'
import { oldLog } from './log'
import { systemTar } from './download'

export const REPORT_EMAIL = 'designmakc@gmail.com'
export const ISSUES = 'https://github.com/designmakc/tyts/issues/new'

/** The logs a report takes from Tyts's folder, each with its `.old.log`. */
export const LOGS = ['tyts.log', 'speech.log', 'translate.log'] as const
/** The end of each log: the lines before a problem, not the whole history. */
const TAIL = 512_000
/** The settings that are the person's own lists: counted, never copied. */
const OWN_LISTS = ['keepWords', 'vocabulary', 'corrections', 'apps'] as const
/** How long a link may be: a mailto Windows hands over whole, a GitHub address GitHub takes. */
const MAIL_MOST = 1800
const ISSUE_MOST = 6000

/** Who the lines must not name: the Windows account (and its profile folder's name), and the computer. */
export type Names = { you: string[]; computer: string }

export function namesHere(): Names {
  return { you: [os.userInfo().username, path.basename(os.homedir())], computer: os.hostname() }
}

/** Tyts and Windows, in one line of the report, the email and the issue. */
export type ReportFacts = { version: string; build: string; electron: string; windows: string; arch: string; os?: string }

export const factsLine = (f: ReportFacts): string =>
  `Tyts ${f.version}${f.build ? ` dev, built ${f.build}` : ''} · ${f.os ?? 'Windows'} ${f.windows} ${f.arch} · Electron ${f.electron}`

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** A name as a whole word, never inside a longer one ("ann" stays in "announce"). */
const whole = (name: string) => new RegExp(`(?<![\\p{L}\\p{N}_])${escape(name)}(?![\\p{L}\\p{N}_])`, 'giu')
/** A name as a profile folder, whatever its length: C:\Users\<name>, also with / or JSON's \\. */
const profile = (name: string) => new RegExp(`(?<=[\\\\/]Users(?:\\\\{1,2}|/))${escape(name)}(?![\\p{L}\\p{N}_])`, 'giu')

/** A text safe to send: the names are `<you>` and `<computer>`, a Hugging Face key or a bearer token is cut. */
export function cleanText(text: string, names: Names): string {
  let out = text.replace(/\bhf_[A-Za-z0-9]{8,}/g, 'hf_…').replace(/\b(Bearer|X-Tyts-Token:?)(\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1$2…')
  for (const name of new Set(names.you.filter(Boolean))) {
    out = out.replace(profile(name), '<you>')
    // A short name ("al") would hide words too; in a path it is gone already.
    if (name.length >= 3) out = out.replace(whole(name), '<you>')
  }
  if (names.computer.length >= 3) out = out.replace(whole(names.computer), '<computer>')
  return out
}

/** The settings with the person's own lists counted (what was kept as typed, the words to spell, the programs), what they told the duck only measured. */
export function settingsSummary(settings: object): Record<string, unknown> {
  const out: Record<string, unknown> = { ...settings }
  for (const key of OWN_LISTS) {
    const list = out[key]
    if (Array.isArray(list)) out[key] = `${list.length} not shown`
  }
  // What they told the duck about themselves: only how long it is.
  if (typeof out.talkAbout === 'string') out.talkAbout = `${out.talkAbout.length} characters, not shown`
  // Their own instruction for dictated text: the same.
  if (typeof out.dictateEditOwn === 'string') out.dictateEditOwn = `${out.dictateEditOwn.length} characters, not shown`
  // Their own instruction for a call's summary: the same.
  if (typeof out.callOwn === 'string') out.callOwn = `${out.callOwn.length} characters, not shown`
  return out
}

/** "Tyts report 2026-10-31 14-05.zip", in local time. */
export function reportName(at: Date): string {
  const two = (n: number) => String(n).padStart(2, '0')
  return `Tyts report ${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())} ${two(at.getHours())}-${two(at.getMinutes())}.zip`
}

export type ReportInput = {
  /** Tyts's folder, %APPDATA%\Tyts: the logs and device.json. */
  dir: string
  /** Where the zip goes. */
  out: string
  /** What the person wrote: sent as written. */
  message: string
  facts: ReportFacts
  /** A line each on the parts' state (the speech engine, the model), cleaned like the logs. */
  status: string[]
  settings: object
  names: Names
  at: Date
}

/** report.txt: what happened, Tyts and Windows, the parts, the settings. */
export function reportText(i: Omit<ReportInput, 'dir' | 'out'>): string {
  return [
    `Tyts problem report, ${i.at.toISOString()}`,
    '',
    'What happened',
    i.message.trim() || '(nothing written)',
    '',
    factsLine(i.facts),
    '',
    ...i.status.map(line => cleanText(line, i.names)),
    '',
    'Settings (your own lists only counted)',
    cleanText(JSON.stringify(settingsSummary(i.settings), null, 2), i.names),
    '',
  ].join('\n')
}

/** The last `most` bytes of a file from its first whole line, or undefined when there is none. */
function tail(file: string, most: number): string | undefined {
  let fd: number
  try {
    fd = fs.openSync(file, 'r')
  } catch {
    return undefined
  }
  try {
    const size = fs.fstatSync(fd).size
    const start = Math.max(0, size - most)
    const buffer = Buffer.alloc(size - start)
    fs.readSync(fd, buffer, 0, buffer.length, start)
    const text = buffer.toString('utf8')
    return start === 0 ? text : `[… the earlier part left out]\n${text.slice(text.indexOf('\n') + 1)}`
  } finally {
    fs.closeSync(fd)
  }
}

/** A zip of `files` (names in `dir`) at `out`, by the system's own tar (bsdtar on Windows and a Mac), which writes zip files too. */
function zip(dir: string, files: string[], out: string): Promise<void> {
  return new Promise((resolve, reject) =>
    execFile(systemTar(), ['-a', '-c', '-f', out, '-C', dir, ...files], { windowsHide: true }, (error, _stdout, stderr) =>
      error ? reject(new Error(`Could not make ${path.basename(out)}: ${String(stderr).trim() || error.message}`)) : resolve(),
    ),
  )
}

/** Writes the report's zip at `out`, made in a folder of the system's temp that goes after; its path. */
export async function makeReport(i: ReportInput): Promise<string> {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-report-'))
  try {
    const files: string[] = []
    const put = (name: string, text: string) => {
      fs.writeFileSync(path.join(temp, name), text, 'utf8')
      files.push(name)
    }
    put('report.txt', reportText(i))
    for (const log of LOGS) {
      for (const name of [path.basename(oldLog(log)), log]) {
        const text = tail(path.join(i.dir, name), TAIL)
        if (text !== undefined) put(name, cleanText(text, i.names))
      }
    }
    const device = tail(path.join(i.dir, 'device.json'), TAIL)
    if (device !== undefined) put('device.json', cleanText(device, i.names))
    fs.mkdirSync(path.dirname(i.out), { recursive: true })
    fs.rmSync(i.out, { force: true })
    await zip(temp, files, i.out)
    return i.out
  } finally {
    fs.rmSync(temp, { recursive: true, force: true })
  }
}

/** `text` cut so that, encoded for a link, it takes at most `budget` characters (a Cyrillic letter takes six). */
export function fitEncoded(text: string, budget: number): string {
  if (encodeURIComponent(text).length <= budget) return text
  const more = encodeURIComponent('…').length
  let used = 0
  let out = ''
  for (const ch of text) {
    const cost = encodeURIComponent(ch).length
    if (used + cost + more > budget) break
    used += cost
    out += ch
  }
  return `${out}…`
}

/** The first line of what the person wrote, for a subject or a title. */
const headline = (message: string, most: number) => {
  const line = message.trim().split(/\r?\n/)[0]?.trim() ?? ''
  return line.length > most ? `${line.slice(0, most - 1)}…` : line
}

/** The email: to Tyts's author, the text and the facts in it, a line on the zip to attach (a link cannot carry it). */
export function mailUrl(message: string, facts: ReportFacts, file: string): string {
  const subject = encodeURIComponent(`Tyts ${facts.version}: ${headline(message, 60) || t('ui.reportSubject')}`)
  const foot = `\r\n\r\n${factsLine(facts)}\r\n${t('ui.reportAttach', { file })}`
  const head = `mailto:${REPORT_EMAIL}?subject=${subject}&body=`
  const said = (message.trim() || t('ui.reportAsk')).replace(/\r?\n/g, '\r\n')
  return head + encodeURIComponent(fitEncoded(said, MAIL_MOST - head.length - encodeURIComponent(foot).length) + foot)
}

/** A new GitHub issue with the text and the facts in it; the zip is dragged onto the page. */
export function issueUrl(message: string, facts: ReportFacts, file: string): string {
  const title = encodeURIComponent(headline(message, 80) || t('ui.reportTitle'))
  const foot = `\n\n### Tyts\n\n${factsLine(facts)}\n\n${t('ui.reportDrag', { file })}`
  const head = `${ISSUES}?title=${title}&body=`
  const said = `### ${t('ui.reportWhat')}\n\n${message.trim() || '…'}`
  return head + encodeURIComponent(fitEncoded(said, ISSUE_MOST - head.length - encodeURIComponent(foot).length) + foot)
}
