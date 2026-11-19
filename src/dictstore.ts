// Word dictionaries (English → the person's language). English → Russian is
// shipped with the app; the others are downloaded once, when the person asks
// (the setup, or Download on a word's card), from a GitHub release, each
// checked against its size and SHA-256 before it is kept.

import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { gunzipSync } from 'node:zlib'

import type { Dictionary } from './lemma'

export const DICT_RELEASE = 'https://github.com/ikstro/cc-translator/releases/download/dict-1'
/** Shipped in media/dict/. */
export const BUNDLED: ReadonlySet<string> = new Set(['ru'])
/** A file of the release as it must arrive: its bytes and its SHA-256. */
export type Pin = { size: number; sha256: string }
/** On the release (WikDict has these pairs): each `en-<code>.json.gz` as it was on 2026-11-14; another file is refused. */
export const PINNED: Readonly<Record<string, Pin>> = {
  es: { size: 588738, sha256: 'a0f4c62b521e8b166697babcd0d19c0bdc66374004acbc685a8896f9746dee53' },
  de: { size: 656704, sha256: 'a64eab37a9a23cf8f5dc52ee5f56a763a712c00ed8e3fa29a419ee3128286f60' },
  fr: { size: 577810, sha256: 'ab8bacc9f97907d8add9a64d3097170c6241fa8eaf1699bd033492920355f2ac' },
  it: { size: 523348, sha256: 'c6fb73fdd19ee84b580993a5fc015d481c599da7b1f025d57e3cd955c5d71d3f' },
  pt: { size: 478096, sha256: '60aa02d9760cf99098f2eeb3019716ead3760e12437297d3ab1c7929083c3681' },
  pl: { size: 547149, sha256: 'db6b652fd7c6a221f7f57da6d246f832087c3bf156dc3a951f9b8f0ccc5c9c0b' },
  cs: { size: 392544, sha256: '737dfa4c4a14be8488dba998eab29032a34034296ec0c987856ff0552476095a' },
  nl: { size: 416716, sha256: 'dcb7b2ec1f4bd2bb21d73c7be7e64907291f4c9e826d36ca3424e2afcd6a3a63' },
  sv: { size: 426104, sha256: 'c3888805d06c97892b74cd89f944df714f8ac4ac641c9dd9621ad753f487b587' },
  nb: { size: 199775, sha256: 'eb76e2c83110316d5982da882a8f2b8245bf0d73744da094d6ac547ac77459e4' },
  da: { size: 292445, sha256: '242da686b448fb8ecbe552a14d59a8b09e02ed662f89fe1fdd8c8090d4bf7372' },
  fi: { size: 627508, sha256: '9b7ad3c32bd9dac0933a5ca2772c33d257bfc4720fa6e954ee8cdb9fc7e65aca' },
  el: { size: 415520, sha256: 'a1a89357727e8a459cfd5b846f594cbcada943986a71d8a09eeea9297fdcdfb5' },
  tr: { size: 329520, sha256: 'dc9bce4885baba992f3b5b3794b2f4309862df94e99714ef133934405fa0171b' },
  bg: { size: 469524, sha256: '27f0789ddcf8a18fe434bde19b9bb184489ed930df6c944c331f82a667b292d4' },
  ja: { size: 401671, sha256: 'b59bf6e7588478c2663861a658b71fc4f680402c28c26a9cc54be656e1d614a6' },
  zh: { size: 195844, sha256: '207eaffffd11f50ffa5e5743d50c48bbc20fc792d8b042d3d54571754301ba3e' },
  id: { size: 182243, sha256: 'acdc42ac5df841a7af474b65b73e45eebcc124a473a743a72d3c2834cde2af31' },
}
export const DOWNLOADABLE: ReadonlySet<string> = new Set(Object.keys(PINNED))
/** After a failed download, the next word looked up tries again once this has passed. */
export const RETRY_MS = 60_000

export function dictionaryUrl(code: string): string {
  return `${DICT_RELEASE}/en-${code}.json.gz`
}

export type DictState =
  | { status: 'ready'; dict: Dictionary }
  /** No dictionary exists for this language. */
  | { status: 'none' }
  | { status: 'downloading' }
  | { status: 'failed'; at: number }
  /** Not on this computer yet, and downloads are turned off. */
  | { status: 'off' }

export type DictStoreOptions = {
  bundledDir: string
  cacheDir: string
  fetchGz: (url: string) => Promise<Uint8Array>
  /** What each language's file must be (PINNED; a test's own). */
  pins?: Readonly<Record<string, Pin>>
  /** A download finished: words looked up while it ran can be asked again. */
  onReady: (code: string) => void
  /** A download started, finished or failed: whatever shows the dictionary's state can show it again. */
  onChange?: (code: string) => void
  now?: () => number
}

/** Reads a JSON dictionary, or undefined when it is missing or not shaped as one. */
export function parseDictionary(json: string): Dictionary | undefined {
  try {
    const value = JSON.parse(json) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    return value as Dictionary
  } catch {
    return undefined
  }
}

export class DictionaryStore {
  private readonly states = new Map<string, DictState>()

  constructor(private readonly options: DictStoreOptions) {}

  /** The dictionary for a language code, starting its download when allowed and needed. */
  get(code: string, allowDownload: boolean): DictState {
    const now = this.options.now?.() ?? Date.now()
    const known = this.states.get(code)
    if (known && (known.status !== 'failed' || now - known.at < RETRY_MS)) return known

    if (BUNDLED.has(code)) return this.remember(code, this.readFile(path.join(this.options.bundledDir, `en-${code}.json`)))
    if (!DOWNLOADABLE.has(code)) return this.remember(code, { status: 'none' })
    const cached = this.readFile(this.cacheFile(code))
    if (cached.status === 'ready') return this.remember(code, cached)
    if (!allowDownload) return { status: 'off' }

    this.states.set(code, { status: 'downloading' })
    void this.download(code)
    this.options.onChange?.(code)
    return { status: 'downloading' }
  }

  /** The person asked for it (Download, Try again): a download that failed is tried again at once, not after the wait. */
  ask(code: string): DictState {
    if (this.states.get(code)?.status === 'failed') this.states.delete(code)
    return this.get(code, true)
  }

  /** How the dictionary for a language stands, from its file's being there: nothing read, nothing downloaded. */
  status(code: string): DictState['status'] {
    const known = this.states.get(code)
    if (known && (known.status !== 'failed' || (this.options.now?.() ?? Date.now()) - known.at < RETRY_MS)) return known.status
    if (BUNDLED.has(code)) return fs.existsSync(path.join(this.options.bundledDir, `en-${code}.json`)) ? 'ready' : 'none'
    if (!DOWNLOADABLE.has(code)) return 'none'
    return fs.existsSync(this.cacheFile(code)) ? 'ready' : 'off'
  }

  /** The downloaded dictionaries deleted; the next word downloads its language's again (the bundled ones stay). */
  clear(): void {
    if ([...this.states.values()].some(s => s.status === 'downloading')) return
    this.states.clear()
    fs.rmSync(this.options.cacheDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    this.options.onChange?.('')
  }

  /** One language's downloaded dictionary deleted; its next word downloads it again (a bundled one stays). */
  remove(code: string): void {
    if (this.states.get(code)?.status === 'downloading' || BUNDLED.has(code)) return
    this.states.delete(code)
    fs.rmSync(this.cacheFile(code), { force: true, maxRetries: 10, retryDelay: 200 })
    this.options.onChange?.(code)
  }

  private async download(code: string): Promise<void> {
    try {
      const gz = await this.options.fetchGz(dictionaryUrl(code))
      const pin = (this.options.pins ?? PINNED)[code]
      if (!pin || gz.length !== pin.size || createHash('sha256').update(gz).digest('hex') !== pin.sha256) throw new Error('not the pinned dictionary')
      const json = gunzipSync(gz).toString('utf8')
      const dict = parseDictionary(json)
      if (!dict) throw new Error('not a dictionary')
      fs.mkdirSync(this.options.cacheDir, { recursive: true })
      const file = this.cacheFile(code)
      fs.writeFileSync(`${file}.tmp`, json, 'utf8')
      fs.renameSync(`${file}.tmp`, file)
      this.states.set(code, { status: 'ready', dict })
      this.options.onReady(code)
    } catch {
      this.states.set(code, { status: 'failed', at: this.options.now?.() ?? Date.now() })
    }
    this.options.onChange?.(code)
  }

  private cacheFile(code: string): string {
    return path.join(this.options.cacheDir, `en-${code}.json`)
  }

  private readFile(file: string): DictState {
    try {
      const dict = parseDictionary(fs.readFileSync(file, 'utf8'))
      return dict ? { status: 'ready', dict } : { status: 'none' }
    } catch {
      return { status: 'none' }
    }
  }

  private remember(code: string, state: DictState): DictState {
    this.states.set(code, state)
    return state
  }
}
