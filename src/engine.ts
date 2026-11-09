// The offline translator: Firefox Translations' models, one pair per
// direction between English and the person's language, downloaded from
// Mozilla's attachment server on first use (mt-manifest.json, written by
// scripts/build-mt.mjs, names each file with its size and SHA-256), and run in
// a thread of their own (mt-worker.ts), ended after five idle minutes.
//
// models\<language>\<sha256 head>-<name>: the hash in the name keeps a file
// of a newer model from passing for the old one.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { Worker } from 'node:worker_threads'

import { fetchPinned } from './download'
import manifest from './mt-manifest.json'
import type { ModelFiles, MtIn, MtOut } from './mt-worker'
import type { Translator, TranslatorState } from './translator'

type ModelFile = { type: string; name: string; url: string; size: number; sha256: string }
type Manifest = { base: string; languages: Record<string, Record<string, ModelFile[]>> }

const MODELS = manifest as Manifest
const IDLE_MS = 5 * 60_000

/** The languages there is a translator for, by code. */
export const NATIVES: readonly string[] = Object.keys(MODELS.languages)

/** The engine's two files, shipped in vendor/bergamot. */
export type EngineFiles = { loader: string; wasm: string }

export function createTranslator(root: string, workerPath: string, engineFiles: EngineFiles): Translator {
  const downloads = new Map<string, { progress: number; running: Promise<void> }>()
  const failed = new Set<string>()
  let worker: Worker | undefined
  let idle: NodeJS.Timeout | undefined
  let nextId = 0
  const waiting = new Map<number, { resolve: (lines: string[]) => void; reject: (error: Error) => void }>()

  const filesOf = (native: string): ModelFile[] => Object.values(MODELS.languages[native] ?? {}).flat()
  const localPath = (native: string, file: ModelFile) => path.join(root, native, `${file.sha256.slice(0, 12)}-${file.name}`)
  const has = (native: string, file: ModelFile) => {
    try {
      return fs.statSync(localPath(native, file)).size === file.size
    } catch {
      return false
    }
  }
  const sizeOf = (native: string) => Math.max(1, Math.round(filesOf(native).reduce((n, f) => n + f.size, 0) / 1e6))

  function state(native: string): TranslatorState {
    if (!MODELS.languages[native]) return { status: 'unsupported', progress: 0, size: 0 }
    const size = sizeOf(native)
    const download = downloads.get(native)
    if (download) return { status: 'downloading', progress: download.progress, size }
    if (filesOf(native).every(f => has(native, f))) return { status: 'ready', progress: 1, size }
    return { status: failed.has(native) ? 'failed' : 'absent', progress: 0, size }
  }

  function fetchFile(native: string, file: ModelFile, onBytes: (got: number) => void): Promise<void> {
    return fetchPinned({ ...file, url: MODELS.base + file.url }, localPath(native, file), file.name, onBytes)
  }

  /** Files of this language left from older models. */
  function removeStale(native: string): void {
    const keep = new Set(filesOf(native).map(f => path.basename(localPath(native, f))))
    try {
      for (const name of fs.readdirSync(path.join(root, native))) if (!keep.has(name)) fs.rmSync(path.join(root, native, name), { force: true })
    } catch {
      // nothing there yet
    }
  }

  function prepare(native: string, onProgress: (state: TranslatorState) => void): Promise<void> {
    const s = state(native)
    if (s.status === 'unsupported') return Promise.reject(new Error(`Kryakl has no translator between English and this language yet`))
    if (s.status === 'ready') return Promise.resolve()
    const existing = downloads.get(native)
    if (existing) return existing.running
    const files = filesOf(native).filter(f => !has(native, f))
    const total = files.reduce((n, f) => n + f.size, 0)
    const entry = { progress: 0, running: Promise.resolve() }
    entry.running = (async () => {
      fs.mkdirSync(path.join(root, native), { recursive: true })
      removeStale(native)
      let done = 0
      let shown = 0
      for (const file of files) {
        await fetchFile(native, file, got => {
          entry.progress = (done + got) / total
          // Every whole percent, not every chunk.
          if (entry.progress - shown >= 0.01) {
            shown = entry.progress
            onProgress(state(native))
          }
        })
        done += file.size
      }
    })()
      .then(() => {
        failed.delete(native)
      })
      .catch(error => {
        failed.add(native)
        throw error
      })
      .finally(() => downloads.delete(native))
    downloads.set(native, entry)
    onProgress(state(native))
    return entry.running
  }

  function startWorker(): Worker {
    const w = new Worker(workerPath, { workerData: engineFiles })
    w.on('message', (m: MtOut) => {
      const job = waiting.get(m.id)
      if (!job) return
      waiting.delete(m.id)
      if (m.type === 'done') job.resolve(m.translations)
      else job.reject(new Error(m.message))
    })
    const gone = (error: Error) => {
      if (worker !== w) return
      worker = undefined
      for (const job of waiting.values()) job.reject(error)
      waiting.clear()
    }
    w.on('error', gone)
    w.on('exit', code => gone(new Error(`the translator stopped (${code})`)))
    return w
  }

  /** Ends the thread, and the memory of its models, once nothing has been translated for a while. */
  function touch(): void {
    if (idle) clearTimeout(idle)
    idle = setTimeout(() => {
      if (waiting.size > 0) return touch()
      void worker?.terminate()
      worker = undefined
    }, IDLE_MS)
  }

  async function translate(sentences: string[], from: string, to: string): Promise<(string | undefined)[]> {
    if (sentences.length === 0) return []
    const native = from === 'en' ? to : from
    const pair = `${from}-${to}`
    const model = MODELS.languages[native]?.[pair]
    if (!model) throw new Error(`no translator from ${from} into ${to}`)
    const files: ModelFiles = {}
    for (const file of model) files[file.type as keyof ModelFiles] = localPath(native, file)
    worker ??= startWorker()
    touch()
    const id = ++nextId
    const result = new Promise<string[]>((resolve, reject) => waiting.set(id, { resolve, reject }))
    worker.postMessage({ type: 'translate', id, pair, files, sentences } satisfies MtIn)
    return result
  }

  return {
    state,
    prepare,
    translate,
    dispose: () => {
      if (idle) clearTimeout(idle)
      void worker?.terminate()
      worker = undefined
    },
  }
}
