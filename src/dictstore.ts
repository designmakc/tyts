// Word dictionaries (English → the person's language). English → Russian is
// shipped inside the extension; the others are downloaded once, on the first
// word looked up, from the project's GitHub release and kept in the
// extension's own storage. Nothing else leaves the computer.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { gunzipSync } from 'node:zlib'

import type { Dictionary } from './lemma'

export const DICT_RELEASE = 'https://github.com/ikstro/cc-translator/releases/download/dict-1'
/** Shipped in media/dict/. */
export const BUNDLED: ReadonlySet<string> = new Set(['ru'])
/** On the release, built by scripts/build-dict.mjs --release (WikDict has these pairs). */
export const DOWNLOADABLE: ReadonlySet<string> = new Set([
  'es', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'nl', 'sv', 'nb', 'da', 'fi', 'el', 'tr', 'bg', 'ja', 'zh', 'id',
])
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
