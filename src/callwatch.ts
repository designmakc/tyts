// A call recording that starts by itself (settings.callAuto): the decisions,
// pure and tested. Main feeds `step` the programs holding the microphone every
// 2 s (src/micwatch.ts: mic-mac on a Mac, the registry on Windows); a known call
// program holding it 10 s in a row starts or asks, the microphone free 20 s
// stops what started by itself, and such a recording under a minute is dropped.
// Window titles are read here for the call's name only, never logged.

import { appOf } from './callapps'
import type { CallAuto } from './settings'

/** A program taking input from the microphone: its pid (0 when unknown), its executable's name or path, its windows' titles. */
export type MicUser = { pid: number; name: string; titles: string[] }

export const START_AFTER_MS = 10_000
export const STOP_AFTER_MS = 20_000
/** An auto-started recording shorter than this is deleted, never transcribed (a voice message, a call cut short). */
export const KEEP_SECONDS = 60
/** Started by itself, the recording may take this long to begin (a permission asked) before it counts as stopped by the person. */
const STARTING_MS = 15_000

export type CallWatch = {
  /** The call program holding the microphone, and since when; null when none. */
  app: string | null
  since: number
  /** The microphone let go at, while a call was handled; 0 while held. */
  freeSince: number
  /** This call was started, asked or declined: nothing more until it ends. */
  handled: boolean
  asking: boolean
  /** The recording running is the one started by itself (or on a Record answer). */
  auto: boolean
  startedAt: number
  title: string | null
}

export type CallAct = { do: 'none' } | { do: 'start' | 'ask'; app: string; title: string | null } | { do: 'stop' } | { do: 'unask' }

export const idleWatch = (): CallWatch => ({ app: null, since: 0, freeSince: 0, handled: false, asking: false, auto: false, startedAt: 0, title: null })

export type CallInput = {
  /** The programs taking input now; null when the system cannot say (macOS before 14.4): nothing starts. */
  users: MicUser[] | null
  now: number
  mode: CallAuto
  /** Kryakl itself dictates, talks, records the microphone, is paused, or has no speech engine. */
  blocked: boolean
  /** A call recording runs (any). */
  recording: boolean
  own: { pid: number; exe: string }
}

const NONE: CallAct = { do: 'none' }

const BROWSERS = new Set(['google chrome', 'chrome', 'microsoft edge', 'msedge', 'arc', 'safari', 'firefox', 'brave browser', 'brave', 'opera', 'vivaldi', 'chromium', 'yandex'])

const own = (name: string) => (name.trim().split(/[\\/]/).pop() ?? '').toLowerCase().replace(/\.exe$/, '')

/** The call in a browser, by its window's title: Google Meet, Zoom or Teams on the web; else null. */
function webCall(titles: string[]): { app: string; topic: string | null } | null {
  for (const raw of titles) {
    const title = raw.replace(/\s+[-–—]\s+(Google Chrome|Microsoft Edge|Brave|Arc|Safari|Mozilla Firefox|Opera|Vivaldi|Chromium|Yandex)$/i, '').trim()
    const meet = /^(?:Google\s+)?Meet(?:\s*[-–—:]\s*(.+))?$/i.exec(title)
    if (meet) return { app: 'Google Meet', topic: topicOf(meet[1]) }
    const teams = /^(.*?)\s*\|\s*Microsoft Teams$/i.exec(title)
    if (teams) return { app: 'Microsoft Teams', topic: topicOf(teams[1]) }
    if (/^Zoom(?:\s+Meeting)?(?:\s*[-–—|].*)?$/i.test(title)) return { app: 'Zoom', topic: null }
  }
  return null
}

const GENERIC = /^(zoom|zoom meeting|zoom workplace.*|microsoft teams|teams|slack|telegram|discord|facetime|skype|webex|meeting|calendar|chat|activity|chats?)$/i

function topicOf(text: string | undefined): string | null {
  const topic = (text ?? '').replace(/\s+/g, ' ').trim()
  return topic && !GENERIC.test(topic) ? topic.slice(0, 80) : null
}

/** The topic a known call program's window says: Slack's huddle, Zoom's meeting, a Teams meeting. */
function appTopic(app: string, titles: string[]): string | null {
  for (const title of titles) {
    if (app === 'Slack') {
      const huddle = /Huddle(?:\s+in)?[:\s]\s*(.+?)(?:\s+[-–—|]\s+.*)?$/i.exec(title)
      if (huddle) return topicOf(huddle[1])
      continue
    }
    if (app === 'Microsoft Teams') {
      const teams = /^(.*?)\s*\|\s*(?:.*\|\s*)?Microsoft Teams$/i.exec(title)
      const topic = topicOf(teams ? teams[1]!.split('|')[0] : title)
      if (topic) return topic
      continue
    }
    if (app === 'Zoom') {
      const topic = topicOf(title.replace(/\s*[-–—|]\s*Zoom(?: Meeting| Workplace)?$/i, ''))
      if (topic) return topic
    }
  }
  return null
}

/** The call a program on the microphone is, with its window's topic; null when it is no known call (a browser counts only with Meet, Zoom or Teams in a title). */
export function callOf(user: MicUser): { app: string; topic: string | null } | null {
  const app = appOf(user.name) ?? appOf(own(user.name).split('_')[0] ?? '')
  if (app) return { app, topic: appTopic(app, user.titles) }
  return BROWSERS.has(own(user.name)) ? webCall(user.titles) : null
}

/** "Slack · #design", or null for the dated title (callapps.ts callTitle). */
export const topicTitle = (call: { app: string; topic: string | null }): string | null => (call.topic ? `${call.app} · ${call.topic}` : null)

/** One look at the microphone: the next state and what to do. */
export function step(s: CallWatch, input: CallInput): [CallWatch, CallAct] {
  const { now } = input
  // The person stopped (or dropped) the recording started by itself: nothing more for this call.
  if (s.auto && !input.recording && now - s.startedAt > STARTING_MS) s = { ...s, auto: false }
  const users = (input.users ?? []).filter(u => u.pid !== input.own.pid && own(u.name) !== own(input.own.exe))
  const held = input.users === null ? null : users.map(callOf).find(c => c !== null) ?? null

  if (held) {
    if (s.app !== held.app && !s.handled) s = { ...idleWatch(), app: held.app, since: now }
    s = { ...s, freeSince: 0, title: topicTitle(held) ?? s.title }
    if (!s.handled && s.app === held.app && now - s.since >= START_AFTER_MS && input.mode !== 'off' && !input.blocked && !input.recording) {
      const app = s.app
      if (input.mode === 'record') return [{ ...s, handled: true, auto: true, startedAt: now }, { do: 'start', app, title: s.title }]
      return [{ ...s, handled: true, asking: true }, { do: 'ask', app, title: s.title }]
    }
    return [s, NONE]
  }

  if (!s.app) return [s, NONE]
  // Let go before 10 s (a voice message): forgotten at once.
  if (!s.handled) return [idleWatch(), NONE]
  const freeSince = s.freeSince || now
  if (now - freeSince < STOP_AFTER_MS) return [{ ...s, freeSince }, NONE]
  if (s.auto && input.recording) return [idleWatch(), { do: 'stop' }]
  if (s.asking) return [idleWatch(), { do: 'unask' }]
  return [idleWatch(), NONE]
}

/** The person answered the question: Record starts as if by itself (it stops with the call); Not now holds for this call. */
export function answer(s: CallWatch, record: boolean, now: number): [CallWatch, CallAct] {
  if (!s.asking || !s.app) return [{ ...s, asking: false }, NONE]
  if (!record) return [{ ...s, asking: false }, NONE]
  return [{ ...s, asking: false, auto: true, startedAt: now }, { do: 'start', app: s.app, title: s.title }]
}

/** Whether a recording started by itself is kept once the call ends. */
export const keepRecording = (seconds: number): boolean => seconds >= KEEP_SECONDS

/**
 * The programs Windows says hold the microphone now, from
 * `reg query …\ConsentStore\microphone /s /v LastUsedTimeStop`: a key whose
 * LastUsedTimeStop is 0. A desktop program's key is its path with # for \;
 * a Store app's its package family ("MSTeams_8wekyb3d8bbwe").
 */
export function parseMicRegistry(stdout: string): string[] {
  const out: string[] = []
  let key = ''
  for (const line of stdout.split(/\r?\n/)) {
    if (/^HKEY_/i.test(line)) key = line.trim()
    const value = /^\s+LastUsedTimeStop\s+REG_QWORD\s+0x([0-9a-f]+)/i.exec(line)
    if (!value || !key || parseInt(value[1]!, 16) !== 0) continue
    const name = key.split('\\').pop() ?? ''
    if (name) out.push(name.replace(/#/g, '\\'))
  }
  return out
}
