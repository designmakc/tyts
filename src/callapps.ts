// The call programs Kryakl knows by their process, for a call recording's
// title: one of them running when the recording starts names it ("Zoom · 6
// November 14:30"); none, or two, and it is a "Call". Read from the list of
// processes (ps on a Mac, tasklist on Windows), never from the network.

import { execFile } from 'node:child_process'

import { formatDate, t } from './i18n'
import { system32 } from './system32'

/** A process's own name (its file, without .exe), lower case → the program. Helpers ("Discord Helper") are not the program. */
const CALL_APPS: Record<string, string> = {
  'zoom.us': 'Zoom',
  zoom: 'Zoom',
  'ms-teams': 'Microsoft Teams',
  msteams: 'Microsoft Teams',
  teams: 'Microsoft Teams',
  'microsoft teams': 'Microsoft Teams',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  facetime: 'FaceTime',
  skype: 'Skype',
  webex: 'Webex',
  ciscowebex: 'Webex',
  ciscocollabhost: 'Webex',
  'cisco webex meetings': 'Webex',
}

/** The one known call program among these processes (paths or names), or null when there is none or more than one. */
export function callApp(processNames: string[]): string | null {
  const found = new Set<string>()
  for (const name of processNames) {
    const app = appOf(name)
    if (app) found.add(app)
  }
  return found.size === 1 ? [...found][0]! : null
}

/** The call program a process is (by its path or name), or null. */
export function appOf(processName: string): string | null {
  const own = (processName.trim().split(/[\\/]/).pop() ?? '').toLowerCase().replace(/\.exe$/, '')
  return CALL_APPS[own] ?? null
}

/** "Call 6 November 14:30", or "Zoom · 6 November 14:30", in the interface's language. */
export function callTitle(app: string | null, at: Date): string {
  const when = `${formatDate(at, { day: 'numeric', month: 'long' })} ${formatDate(at, { hour: '2-digit', minute: '2-digit', hour12: false })}`
  return app ? `${app} · ${when}` : t('call.title', { when })
}

/** The processes running now, by path or name; none when the system would not say within 3 s. */
export function runningProcessNames(): Promise<string[]> {
  return new Promise(resolve => {
    const done = (error: Error | null, stdout: string, parse: (line: string) => string) => resolve(error ? [] : stdout.split(/\r?\n/).map(parse).filter(Boolean))
    if (process.platform === 'win32') {
      execFile(system32('tasklist.exe'), ['/fo', 'csv', '/nh'], { windowsHide: true, timeout: 3000 }, (error, stdout) =>
        done(error, stdout, line => (line.split(',')[0] ?? '').replace(/"/g, '')),
      )
    } else {
      execFile('/bin/ps', ['-axo', 'comm='], { timeout: 3000 }, (error, stdout) => done(error, stdout, line => line.trim()))
    }
  })
}
