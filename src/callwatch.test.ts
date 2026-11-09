import { describe, expect, test } from 'vitest'

import { answer, callOf, idleWatch, keepRecording, parseMicRegistry, step, topicTitle, type CallInput, type CallWatch, type MicUser } from './callwatch'

const OWN = { pid: 100, exe: '/Applications/Kryakl.app/Contents/MacOS/Kryakl' }
const zoom: MicUser = { pid: 7, name: 'zoom.us', titles: ['Zoom Meeting'] }

/** Looks every 2 s from `from` to `to` (ms) with the same input; the acts that came. */
function run(s: CallWatch, from: number, to: number, input: Omit<CallInput, 'now'>): [CallWatch, string[]] {
  const acts: string[] = []
  for (let now = from; now <= to; now += 2000) {
    const [next, act] = step(s, { ...input, now })
    s = next
    if (act.do !== 'none') acts.push(`${act.do}@${now / 1000}`)
  }
  return [s, acts]
}

const base = { mode: 'record' as const, blocked: false, recording: false, own: OWN }

describe('a call recording that starts by itself', () => {
  test('starts once a call program holds the microphone 10 s in a row, stops 20 s after it lets go', () => {
    let [s, acts] = run(idleWatch(), 0, 14_000, { ...base, users: [zoom] })
    expect(acts).toEqual(['start@10'])
    expect(s.auto).toBe(true)
    ;[s, acts] = run(s, 16_000, 30_000, { ...base, users: [zoom], recording: true })
    expect(acts).toEqual([])
    ;[s, acts] = run(s, 32_000, 56_000, { ...base, users: [], recording: true })
    expect(acts).toEqual(['stop@52'])
    expect(s.app).toBeNull()
  })

  test('a voice message under 10 s starts nothing', () => {
    let [s, acts] = run(idleWatch(), 0, 8000, { ...base, users: [{ pid: 9, name: 'Telegram', titles: [] }] })
    ;[s, acts] = [s, [...acts, ...run(s, 10_000, 40_000, { ...base, users: [] })[1]]]
    expect(acts).toEqual([])
  })

  test('the microphone let go a moment starts the 10 s again', () => {
    let [s, acts] = run(idleWatch(), 0, 6000, { ...base, users: [zoom] })
    ;[s] = run(s, 8000, 8000, { ...base, users: [] })
    ;[s, acts] = run(s, 10_000, 18_000, { ...base, users: [zoom] })
    expect(acts).toEqual([])
    expect(run(s, 20_000, 20_000, { ...base, users: [zoom] })[1]).toEqual(['start@20'])
  })

  test('Kryakl itself, a program that is no call, off, blocked or a recording running: nothing', () => {
    const me: MicUser = { pid: OWN.pid, name: 'zoom.us', titles: [] }
    expect(run(idleWatch(), 0, 30_000, { ...base, users: [me] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, users: [{ pid: 3, name: 'Kryakl', titles: [] }] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, users: [{ pid: 3, name: 'QuickTime Player', titles: [] }] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, mode: 'off', users: [zoom] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, blocked: true, users: [zoom] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, recording: true, users: [zoom] })[1]).toEqual([])
    expect(run(idleWatch(), 0, 30_000, { ...base, users: null })[1]).toEqual([])
  })

  test('a recording the person started is never stopped by the call', () => {
    const [s] = run(idleWatch(), 0, 30_000, { ...base, recording: true, users: [zoom] })
    expect(run(s, 32_000, 80_000, { ...base, recording: true, users: [] })[1]).toEqual([])
  })

  test('stopped by the person, the call ends with nothing more', () => {
    let [s] = run(idleWatch(), 0, 10_000, { ...base, users: [zoom] })
    ;[s] = run(s, 12_000, 40_000, { ...base, recording: false, users: [zoom] })
    expect(run(s, 42_000, 80_000, { ...base, recording: false, users: [] })[1]).toEqual([])
  })

  test('ask: Not now holds for the call; Record starts and stops with it; let go unanswered, the question goes', () => {
    const ask = { ...base, mode: 'ask' as const }
    let [s, acts] = run(idleWatch(), 0, 30_000, { ...ask, users: [zoom] })
    expect(acts).toEqual(['ask@10'])
    ;[s] = answer(s, false, 31_000)
    expect(run(s, 32_000, 60_000, { ...ask, users: [zoom] })[1]).toEqual([])

    ;[s] = run(idleWatch(), 0, 10_000, { ...ask, users: [zoom] })
    const [after, act] = answer(s, true, 11_000)
    expect(act).toMatchObject({ do: 'start', app: 'Zoom' })
    expect(run(after, 12_000, 40_000, { ...ask, users: [], recording: true })[1]).toEqual(['stop@32'])

    ;[s] = run(idleWatch(), 0, 10_000, { ...ask, users: [zoom] })
    expect(run(s, 12_000, 40_000, { ...ask, users: [] })[1]).toEqual(['unask@32'])
  })

  test('kept from a minute on', () => {
    expect(keepRecording(59)).toBe(false)
    expect(keepRecording(60)).toBe(true)
  })
})

describe('the call and its title', () => {
  const title = (name: string, titles: string[]) => {
    const call = callOf({ pid: 1, name, titles })
    return call && (topicTitle(call) ?? call.app)
  }
  test('call programs, by their windows', () => {
    expect(title('Slack', ['general (Channel) - Acme - Slack', 'Huddle: #design – Acme'])).toBe('Slack · #design')
    expect(title('zoom.us', ['Zoom Meeting', 'Quarterly review - Zoom'])).toBe('Zoom · Quarterly review')
    expect(title('zoom.us', ['Zoom Meeting', 'Zoom Workplace'])).toBe('Zoom')
    expect(title('MSTeams', ['Design sync | Microsoft Teams'])).toBe('Microsoft Teams · Design sync')
    expect(title('Telegram', ['Anna'])).toBe('Telegram')
    expect(title('C:\\Users\\x\\AppData\\Roaming\\Zoom\\bin\\Zoom.exe', [])).toBe('Zoom')
    expect(title('MSTeams_8wekyb3d8bbwe', [])).toBe('Microsoft Teams')
  })
  test('a browser counts only on Meet, Zoom or Teams', () => {
    expect(title('Google Chrome', ['Meet – Планёрка'])).toBe('Google Meet · Планёрка')
    expect(title('Microsoft Edge', ['Meet - abc-defg-hij - Microsoft Edge'])).toBe('Google Meet · abc-defg-hij')
    expect(title('Google Chrome', ['Inbox (3) - Gmail', 'Meet'])).toBe('Google Meet')
    expect(title('Google Chrome', ['Standup | Microsoft Teams'])).toBe('Microsoft Teams · Standup')
    expect(title('Arc', ['Zoom'])).toBe('Zoom')
    expect(title('Google Chrome', ['YouTube', 'Meeting notes - Google Docs'])).toBeNull()
    expect(title('Google Chrome', [])).toBeNull()
  })
})

test('Windows: the programs on the microphone, from the registry', () => {
  const out = [
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone\\MSTeams_8wekyb3d8bbwe',
    '    LastUsedTimeStop    REG_QWORD    0x0',
    '',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone\\NonPackaged\\C:#Users#x#AppData#Roaming#Zoom#bin#Zoom.exe',
    '    LastUsedTimeStop    REG_QWORD    0x0',
    '',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone\\NonPackaged\\C:#Program Files#Telegram#Telegram.exe',
    '    LastUsedTimeStop    REG_QWORD    0x1db4f2a3c5e6f70',
    '',
    'End of search: 3 match(es) found.',
  ].join('\r\n')
  expect(parseMicRegistry(out)).toEqual(['MSTeams_8wekyb3d8bbwe', 'C:\\Users\\x\\AppData\\Roaming\\Zoom\\bin\\Zoom.exe'])
})
