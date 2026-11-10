import { describe, expect, test } from 'vitest'

import { accessRows, missing, type AccessRaw } from './access'

const mac: AccessRaw = { platform: 'darwin', mic: 'granted', screen: 'granted', trusted: true, keys: 'unknown' }

describe('what the system lets Tyts do', () => {
  test('a Mac with everything given: three rows, all fine; the keys row only once the keyboard said something', () => {
    expect(accessRows(mac)).toEqual([
      { id: 'mic', state: 'ok' },
      { id: 'screen', state: 'ok' },
      { id: 'access', state: 'ok' },
    ])
    expect(accessRows({ ...mac, keys: 'seen' }).at(-1)).toEqual({ id: 'input', state: 'ok' })
    expect(missing(accessRows(mac))).toBe(0)
  })

  test('never asked: the system can still show its own question; refused: only its settings help', () => {
    const rows = accessRows({ ...mac, mic: 'not-determined', screen: 'denied', trusted: false })
    expect(rows).toEqual([
      { id: 'mic', state: 'ask' },
      { id: 'screen', state: 'settings' },
      { id: 'access', state: 'ask' },
    ])
    expect(missing(rows)).toBe(3)
    expect(accessRows({ ...mac, mic: 'restricted' })[0]).toEqual({ id: 'mic', state: 'settings' })
  })

  test('Input Monitoring is named once the keyboard helper sees only modifier keys', () => {
    expect(accessRows({ ...mac, keys: 'blocked' }).at(-1)).toEqual({ id: 'input', state: 'settings' })
    // Without Accessibility the helper cannot tell yet.
    expect(accessRows({ ...mac, trusted: false, keys: 'blocked' }).map(r => r.id)).toEqual(['mic', 'screen', 'access'])
  })

  test('Windows has the microphone alone; a system that cannot say counts as fine', () => {
    expect(accessRows({ platform: 'win32', mic: 'denied', screen: 'granted', trusted: true, keys: 'unknown' })).toEqual([{ id: 'mic', state: 'settings' }])
    expect(accessRows({ platform: 'win32', mic: 'unknown', screen: 'unknown', trusted: true, keys: 'unknown' })).toEqual([{ id: 'mic', state: 'ok' }])
    expect(accessRows({ platform: 'linux', mic: 'denied', screen: 'denied', trusted: false, keys: 'unknown' })).toEqual([])
  })
})
