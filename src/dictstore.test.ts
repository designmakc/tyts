import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterEach, describe, expect, test } from 'vitest'

import { DictionaryStore, PINNED, RETRY_MS, dictionaryUrl, type Pin } from './dictstore'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

const pinOf = (bytes: Uint8Array): Pin => ({ size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })

/** `pins`: what each file must be; left out, whatever the test's download gives is the pinned file. */
function setup(fetch: (url: string) => Promise<Uint8Array>, pins?: Record<string, Pin>) {
  let given: Pin | undefined
  const fetchGz = async (url: string) => {
    const bytes = await fetch(url)
    given = pinOf(bytes)
    return bytes
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dictstore-'))
  dirs.push(root)
  const bundledDir = path.join(root, 'bundled')
  fs.mkdirSync(bundledDir)
  fs.writeFileSync(path.join(bundledDir, 'en-ru.json'), JSON.stringify({ go: [['verb', 'идти']] }))
  const ready: string[] = []
  const changes: string[] = []
  let now = 1_000
  const store = new DictionaryStore({
    bundledDir,
    cacheDir: path.join(root, 'cache'),
    fetchGz,
    pins: pins ?? new Proxy({}, { get: () => given }),
    onReady: c => ready.push(c),
    onChange: c => changes.push(`${c} ${store.status(c)}`),
    now: () => now,
  })
  return { store, ready, changes, root, tick: (ms: number) => (now += ms) }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('dictionary store', () => {
  test('the bundled dictionary needs no download', () => {
    const { store } = setup(() => Promise.reject(new Error('no network')))
    const state = store.get('ru', true)
    expect(state.status).toBe('ready')
  })

  test('a language without a dictionary asks nothing', () => {
    let asked = 0
    const { store } = setup(() => (asked++, Promise.reject(new Error('x'))))
    expect(store.get('ko', true).status).toBe('none')
    expect(asked).toBe(0)
  })

  test('downloads once, caches on disk, and says when it is ready', async () => {
    const urls: string[] = []
    const { store, ready } = setup(async url => (urls.push(url), gzipSync(JSON.stringify({ go: [['verb', 'gehen']] }))))
    expect(store.get('de', true).status).toBe('downloading')
    expect(store.get('de', true).status).toBe('downloading')
    await flush()
    expect(ready).toEqual(['de'])
    expect(urls).toEqual([dictionaryUrl('de')])
    expect(store.get('de', true).status).toBe('ready')
  })

  test('a download that is not the pinned file is refused and not kept', async () => {
    const real = gzipSync(JSON.stringify({ go: [['verb', 'gehen']] }))
    const other = gzipSync(JSON.stringify({ go: [['verb', 'something else']] }))
    const { store, ready, root } = setup(async () => other, { de: pinOf(real) })
    expect(store.get('de', true).status).toBe('downloading')
    await flush()
    expect(store.get('de', false).status).toBe('failed')
    expect(ready).toEqual([])
    expect(fs.existsSync(path.join(root, 'cache'))).toBe(false)
    // Every language offered has its file pinned.
    for (const pin of Object.values(PINNED)) expect(pin.sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  test('a cached dictionary is read from disk without a download', async () => {
    const first = setup(async () => gzipSync(JSON.stringify({ go: [['verb', 'aller']] })))
    first.store.get('fr', true)
    await flush()
    const again = new DictionaryStore({
      bundledDir: path.join(first.root, 'bundled'),
      cacheDir: path.join(first.root, 'cache'),
      fetchGz: () => Promise.reject(new Error('offline')),
      onReady: () => {},
    })
    expect(again.get('fr', false).status).toBe('ready')
  })

  test('downloads turned off leave a missing dictionary alone', () => {
    let asked = 0
    const { store } = setup(() => (asked++, Promise.reject(new Error('x'))))
    expect(store.get('es', false).status).toBe('off')
    expect(asked).toBe(0)
  })

  test('a failed download is tried again after a while', async () => {
    let asked = 0
    const { store, tick } = setup(() => (asked++, Promise.reject(new Error('offline'))))
    store.get('pl', true)
    await flush()
    expect(store.get('pl', true).status).toBe('failed')
    tick(RETRY_MS + 1)
    expect(store.get('pl', true).status).toBe('downloading')
    expect(asked).toBe(2)
  })

  test('the status reads no file and starts no download', async () => {
    let asked = 0
    const { store } = setup(async () => (asked++, gzipSync(JSON.stringify({ go: [['verb', 'ir']] }))))
    expect(store.status('ru')).toBe('ready')
    expect(store.status('ko')).toBe('none')
    expect(store.status('es')).toBe('off')
    expect(asked).toBe(0)
    store.get('es', true)
    expect(store.status('es')).toBe('downloading')
    await flush()
    expect(store.status('es')).toBe('ready')
  })

  test('says when a download starts, ends and fails', async () => {
    const ok = setup(async () => gzipSync(JSON.stringify({ go: [['verb', 'gehen']] })))
    ok.store.get('de', true)
    await flush()
    expect(ok.changes).toEqual(['de downloading', 'de ready'])
    const bad = setup(() => Promise.reject(new Error('offline')))
    bad.store.get('pl', true)
    await flush()
    expect(bad.changes).toEqual(['pl downloading', 'pl failed'])
  })
})
