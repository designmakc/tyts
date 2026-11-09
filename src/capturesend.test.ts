import { describe, expect, test } from 'vitest'

import { TrackSender } from './capturesend'

type Sent = { method: string; route: string }

/** The engine as a list of answers, one per call, and what was asked of it. */
function engine(answers: number[]) {
  const asked: Sent[] = []
  const call = async (method: string, route: string) => {
    asked.push({ method, route })
    const status = answers.shift() ?? 200
    return { ok: status >= 200 && status < 300, status }
  }
  return { asked, call }
}

const now = () => Promise.resolve()

describe('a track\'s chunks', () => {
  test('go in order, numbered from 0, each once when the engine takes it', async () => {
    const e = engine([])
    const s = new TrackSender(e.call, 'r1', 'system', now)
    s.send(new Uint8Array([1]))
    s.send(new Uint8Array([2]))
    await s.done()
    expect(e.asked.map(a => `${a.method} ${a.route}`)).toEqual(['PUT /recordings/r1/system/0', 'PUT /recordings/r1/system/1'])
    expect(s.lost).toBe(0)
  })

  test('a chunk the engine refuses is tried five times, then counted lost, and the next one still goes', async () => {
    const e = engine([500, 500, 0, 500, 500, 200])
    const s = new TrackSender(e.call, 'r1', 'mic', now)
    s.send(new Uint8Array([1]))
    s.send(new Uint8Array([2]))
    await s.done()
    expect(e.asked.map(a => a.route)).toEqual([...Array(5).fill('/recordings/r1/mic/0'), '/recordings/r1/mic/1'])
    expect(s.lost).toBe(1)
  })

  test('409 means the engine has it already: no retry, nothing lost', async () => {
    const e = engine([409])
    const s = new TrackSender(e.call, 'r1', 'mic', now)
    s.send(new Uint8Array([1]))
    await s.done()
    expect(e.asked).toHaveLength(1)
    expect(s.lost).toBe(0)
  })

  test('a call that throws is a failed try', async () => {
    let n = 0
    const s = new TrackSender(
      async () => {
        if (n++ < 2) throw new Error('gone')
        return { ok: true, status: 200 }
      },
      'r1',
      'mic',
      now,
    )
    s.send(new Uint8Array([1]))
    await s.done()
    expect(n).toBe(3)
    expect(s.lost).toBe(0)
  })
})
