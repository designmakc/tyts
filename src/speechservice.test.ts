import { createHmac } from 'node:crypto'
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as net from 'node:net'
import type { AddressInfo } from 'node:net'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { freePort, provesKey, SPEECH_PORTS, SpeechService, speechToken } from './speechservice'

const dirs: string[] = []
afterEach(async () => {
  // A stand-in engine killed by stop() holds its folder (its cwd, the service's speech.log stream, closed in the child's
  // exit handler) a moment longer, and Windows then says EBUSY: tried again with the event loop let run between.
  for (const dir of dirs.splice(0)) {
    for (let i = 0; ; i++) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
        break
      } catch (error) {
        if (i >= 50) throw error
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
})

describe('the speech engine\'s key', () => {
  test('is made once, random, and kept beside the engine\'s settings', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryakl-token-'))
    dirs.push(dir)
    const file = path.join(dir, 'Kryakl', 'speech-token')
    const first = speechToken(file)
    expect(first).toMatch(/^[0-9a-f]{64}$/)
    expect(fs.readFileSync(file, 'utf8')).toBe(first)
    expect(speechToken(file)).toBe(first)
  })

  test('an engine on the port is Kryakl\'s only when it answers the nonce with the key (auth.py proof)', () => {
    const answer = (key: string, nonce: string) => createHmac('sha256', key).update(nonce).digest('hex')
    expect(provesKey('k', 'n1', answer('k', 'n1'))).toBe(true)
    expect(provesKey('k', 'n1', answer('other', 'n1'))).toBe(false)
    expect(provesKey('k', 'n1', answer('k', 'n2'))).toBe(false)
    for (const none of [undefined, null, '', 'zz', 42, {}]) expect(provesKey('k', 'n1', none)).toBe(false)
  })
})

describe('the engine on the port', () => {
  const answer = (key: string, nonce: string) => createHmac('sha256', key).update(nonce).digest('hex')
  const ENGINE = { ok: true, version: '0.2.0', parts: { core: true }, diarization: 'missing' }

  /** Kryakl's engine as app.py's guard answers: the proof alone without the key, everything with it. */
  const realEngine = (req: http.IncomingMessage) => {
    const keyed = req.headers['x-krya-token'] === 'k'
    const nonce = req.headers['x-krya-nonce'] ? String(req.headers['x-krya-nonce']) : ''
    if (req.url === '/health') return keyed ? { ...ENGINE, ...(nonce ? { proof: answer('k', nonce) } : {}) } : nonce ? { proof: answer('k', nonce) } : { ok: true }
    return keyed ? { items: [] } : undefined
  }

  /**
   * A server on a free port of 127.0.0.1 answering as `reply` says (undefined: 401); what the service made of it,
   * and every request it received. `then` uses the service before it stops.
   */
  async function onPort(reply: (req: http.IncomingMessage) => unknown, then?: (service: SpeechService) => Promise<void>) {
    const received: { url: string; headers: http.IncomingHttpHeaders }[] = []
    const server = http.createServer((req, res) => {
      received.push({ url: String(req.url), headers: req.headers })
      const body = reply(req)
      res.statusCode = body === undefined ? 401 : 200
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body ?? { detail: 'the engine\'s key is needed' }))
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryakl-engine-'))
    dirs.push(dir)
    const stopStale = vi.fn(async () => undefined)
    const service: SpeechService = new SpeechService({
      python: () => path.join(dir, 'no-python.exe'),
      engineDir: dir,
      port: (server.address() as AddressInfo).port,
      log: path.join(dir, 'speech.log'),
      pycache: path.join(dir, 'pycache'),
      token: 'k',
      stopStale,
      change: () => undefined,
    })
    await service.start()
    const seen = { state: service.state, trouble: service.trouble, health: service.health, token: service.token }
    await then?.(service)
    service.stop()
    await new Promise<void>(resolve => server.close(() => resolve()))
    return { ...seen, stopStale, received, keyed: received.filter(r => 'x-krya-token' in r.headers) }
  }

  test('Kryakl\'s own engine proves it holds the key before it gets it, and is then used', async () => {
    let listed: unknown
    const r = await onPort(realEngine, async service => {
      listed = await service.call('GET', '/transcripts')
    })
    // The first look carries the nonce alone; the key follows the proof.
    expect(r.received[0]).toMatchObject({ url: '/health' })
    expect(r.received[0]!.headers).not.toHaveProperty('x-krya-token')
    expect(r.keyed.map(k => k.url)).toEqual(['/health', '/transcripts'])
    expect(r.state).toBe('ready')
    expect(r.token).toBe('k')
    expect(r.health).toMatchObject({ version: '0.2.0' })
    expect(r.health).not.toHaveProperty('proof')
    expect(listed).toMatchObject({ ok: true, data: { items: [] } })
    expect(r.stopStale).not.toHaveBeenCalled()
  })

  test('an older engine of Kryakl\'s without the key is stopped, once, and Kryakl starts its own', async () => {
    const r = await onPort(() => ENGINE)
    expect(r.stopStale).toHaveBeenCalledTimes(1)
    // Its own start was tried: there is no Python here, so it says so.
    expect(r.state).toBe('down')
    expect(r.trouble).toBe('The speech engine is not installed')
    expect(r.keyed).toEqual([])
  })

  test('another program on the port is neither used nor stopped: Kryakl\'s engine starts on the next port', async () => {
    const r = await onPort(() => ({ ok: true }))
    expect(r.stopStale).not.toHaveBeenCalled()
    // Its own start was tried on another port: there is no Python here, so it says so.
    expect(r.trouble).toBe('The speech engine is not installed')
    expect(r.health).toBeUndefined()
    expect(r.keyed).toEqual([])
  })

  test.each([
    ['answers ok', () => ({ ok: true })],
    ['looks like an engine', () => ENGINE],
    ['makes up a proof', () => ({ ...ENGINE, proof: answer('guess', 'n') })],
    ['answers nothing useful', () => 'hello'],
  ])('a program that took the port first (%s) never receives the key', async (_, squat) => {
    const r = await onPort(squat, async service => {
      expect(await service.call('GET', '/transcripts')).toMatchObject({ ok: false, status: 0 })
      expect(await service.call('PUT', '/settings', { plan: {} })).toMatchObject({ ok: false })
      await expect(service.bytes('/transcripts/x/file?format=txt')).rejects.toThrow()
    })
    expect(r.received.length).toBeGreaterThan(0)
    expect(r.keyed).toEqual([])
    expect(r.token).toBeUndefined()
    expect(r.state).not.toBe('ready')
  })
})

test('freePort skips a port something listens on (Windows\' excluded ranges, another engine)', async () => {
  const server = http.createServer()
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const taken = (server.address() as AddressInfo).port
  expect(await freePort(taken, 1)).toBeUndefined()
  expect(await freePort(taken, 2)).not.toBe(taken)
  await new Promise<void>(resolve => server.close(() => resolve()))
})

describe('the engine\'s port', () => {
  /** A stand-in engine: app.py as a script node runs (node reads the file whatever its name), answering /health with the proof. */
  const FAKE_ENGINE = `
    const http = require('http'); const { createHmac } = require('crypto')
    const port = Number(process.argv[process.argv.indexOf('--port') + 1])
    const key = process.env.KRYA_SPEECH_TOKEN
    http.createServer((req, res) => {
      const nonce = req.headers['x-krya-nonce']
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: true, parts: {}, diarization: 'missing', version: 'fake', ...(nonce ? { proof: createHmac('sha256', key).update(String(nonce)).digest('hex') } : {}) }))
    }).listen(port, '127.0.0.1', err => { if (err) process.exit(3) }).on('error', () => process.exit(3))
  `
  const until = async (ok: () => boolean) => {
    for (let i = 0; i < 200 && !ok(); i++) await new Promise(r => setTimeout(r, 50))
  }

  test('its own port taken by something that does not answer HTTP: it starts on the next, and Restart goes back to the first', async () => {
    // Accepts and never answers (the service's look at it ends by its timeout); its sockets are cut when it closes.
    const sockets = new Set<net.Socket>()
    const blocker = net.createServer(socket => sockets.add(socket))
    await new Promise<void>(resolve => blocker.listen(0, '127.0.0.1', resolve))
    const first = (blocker.address() as AddressInfo).port
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryakl-engine-'))
    dirs.push(dir)
    fs.writeFileSync(path.join(dir, 'app.py'), FAKE_ENGINE)
    const service = new SpeechService({ python: () => process.execPath, engineDir: dir, port: first, log: path.join(dir, 'speech.log'), pycache: path.join(dir, 'pycache'), token: 'k', change: () => undefined })
    await service.start()
    await until(() => service.state === 'ready')
    expect(service.state).toBe('ready')
    expect(service.port).toBeGreaterThan(first)
    expect(service.port).toBeLessThan(first + SPEECH_PORTS)
    expect(service.token).toBe('k')
    expect(fs.readFileSync(path.join(dir, 'speech.log'), 'utf8')).toContain(`start on port ${service.port}`)
    // The first port set free and Restart: the engine comes back on it.
    for (const socket of sockets) socket.destroy()
    await new Promise<void>(resolve => blocker.close(() => resolve()))
    service.restart()
    await until(() => service.state === 'ready' && service.port === first)
    expect(service.port).toBe(first)
    service.stop()
  }, 30_000)
})
