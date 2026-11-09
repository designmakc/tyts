// The files of Kryakl's local language models: llama.cpp's builds and the
// models they run, Google's Gemma 4 E4B (Accurate) and Gemma 4 12B (Most
// accurate). The person uses one of them (`model` in the settings): it
// translates (llmtranslator.ts) and checks English (checker.ts), so the two
// never load a model each. Nothing is downloaded before the person picks one.
// The engine is llama.cpp's Vulkan build (any graphics card, or the
// processor), or its CUDA build for a model that does not fit an NVIDIA card
// (`engineFor`; hardware.ts translationAdvice), or on a Mac its Apple silicon
// build (Metal; never CUDA), each unpacked once into
// <root>\engine\<build>-<sha256 head> and shared by every model; the models are
// <root>\models\<sha256 head>-<file>. All pinned with size and SHA-256 in
// llm-manifest.json. One server (llama.ts) serves them all, one model at a time.
// A model file the manifest no longer names (TranslateGemma, until 0.10.1) is
// `unused`: shown on the Storage page, deleted only when the person says so.

import * as fs from 'node:fs'
import * as path from 'node:path'

import { fetchPinned, openStream, unzip, type Pinned } from './download'
import type { LlamaServer, LlamaTarget } from './llama'
import manifest from './llm-manifest.json'
import type { LlmModel } from './settings'

export type { LlmModel }
export type LlmEngine = 'vulkan' | 'cuda'

/** `strip`: leading folders the archives' paths start with. `mac`: the build for macOS Apple silicon, where there is one. */
type Build = { name: string; files: Pinned[]; strip?: number; mac?: Build }
export type ModelFile = Pinned & { name: string; file: string }
export type LlmManifest = { engine: Record<LlmEngine, Build>; models: Record<LlmModel, ModelFile>; languages: Record<string, string> }

const MANIFEST = manifest as LlmManifest
const MODELS: readonly LlmModel[] = ['accurate', 'most']
const ENGINES: readonly LlmEngine[] = ['vulkan', 'cuda']
const MAC = process.platform === 'darwin'
/** The server's file name in a build. */
const SERVER = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'

/** A kind's build here: on a Mac its `mac` one (Metal, used by itself) when the manifest has it. */
const buildOf = (m: LlmManifest, kind: LlmEngine): Build => (MAC && m.engine[kind].mac) || m.engine[kind]

/** Each model, and how it is named. */
export const LLM_MODELS: Readonly<Record<LlmModel, ModelFile>> = MANIFEST.models
/** The languages the models are asked to translate, named in English, by code. */
export const LLM_LANGUAGES: Readonly<Record<string, string>> = MANIFEST.languages

/** Where the engines and the models are kept under `root`. */
export function llmPaths(root: string, m: LlmManifest = MANIFEST) {
  const engineDir = (kind: LlmEngine) => path.join(root, 'engine', `${kind}-${buildOf(m, kind).files[0]?.sha256.slice(0, 12)}`)
  return {
    engineDir,
    exe: (kind: LlmEngine) => path.join(engineDir(kind), SERVER),
    model: (model: LlmModel) => path.join(root, 'models', `${m.models[model].sha256.slice(0, 12)}-${m.models[model].file}`),
  }
}

export type ModelState = {
  status: 'absent' | 'downloading' | 'ready' | 'failed'
  /** 0..1 while downloading. */
  progress: number
  /** The download in MB. */
  size: number
}

export type LlmFilesOptions = {
  root: string
  server: LlamaServer
  /** The build a model runs on here; Vulkan when not given. */
  engineFor?: (model: LlmModel) => LlmEngine
  open?: (url: string) => Promise<AsyncIterable<Uint8Array>>
  /** What to download (tests give small files of their own). */
  manifest?: LlmManifest
}

export type LlmFiles = {
  readonly manifest: LlmManifest
  readonly server: LlamaServer
  state(model: LlmModel): ModelState
  /** Downloads what the model still needs (its engine too); resolves once it can run. */
  prepare(model: LlmModel, onProgress: (state: ModelState) => void): Promise<void>
  /** What the server runs for the model; throws while its files are not here. */
  target(model: LlmModel): LlamaTarget
  /** Deletes a model (an engine too once no model left needs it); its server is stopped and gone first, as Windows keeps a file in use. */
  remove(model: LlmModel): Promise<void>
  /** Model files here that no model of the manifest is (an older Kryakl's), and deleting them. */
  unused(): string[]
  removeUnused(): void
  /** A build deleted (the one no model runs on here now); its server stopped first. */
  removeEngine(kind: LlmEngine): Promise<void>
  dispose(): void
}

/** Deleted, tried again for a moment while Windows still holds it (a process just ended). */
function removePath(target: string): void {
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}

export function createLlmFiles(o: LlmFilesOptions): LlmFiles {
  const m = o.manifest ?? MANIFEST
  const { models } = m
  const paths = llmPaths(o.root, m)
  const { server } = o
  const open = o.open ?? openStream
  // ponytail: no CUDA on a Mac, so every model runs on the Vulkan kind's (Metal) build there.
  const engineFor = MAC ? () => 'vulkan' as const : (o.engineFor ?? (() => 'vulkan'))
  const builds = { vulkan: buildOf(m, 'vulkan'), cuda: buildOf(m, 'cuda') }

  const buildSize = (kind: LlmEngine) => builds[kind].files.reduce((n, f) => n + f.size, 0)
  const hasEngine = (kind: LlmEngine) => fs.existsSync(paths.exe(kind))
  const hasModel = (model: LlmModel) => {
    try {
      return fs.statSync(paths.model(model)).size === models[model].size
    } catch {
      return false
    }
  }

  /** Each engine's download while it runs (several models may wait for it), and its bytes so far. */
  const engineRunning = new Map<LlmEngine, Promise<void>>()
  const engineGot = new Map<LlmEngine, number>()
  /** A model's download: its bytes so far, out of `total` (the engine's in it when it was missing too). */
  const downloads = new Map<LlmModel, { got: number; total: number; engine?: LlmEngine; running: Promise<void> }>()
  const failed = new Set<LlmModel>()

  /** What a model still has to download here, in bytes. */
  const missing = (model: LlmModel) => (hasEngine(engineFor(model)) ? 0 : buildSize(engineFor(model))) + (hasModel(model) ? 0 : models[model].size)

  function state(model: LlmModel): ModelState {
    const download = downloads.get(model)
    if (download) {
      const kind = download.engine
      const engine = kind ? (hasEngine(kind) ? buildSize(kind) : (engineGot.get(kind) ?? 0)) : 0
      return { status: 'downloading', progress: Math.min(1, (engine + download.got) / download.total), size: Math.round(download.total / 1e6) }
    }
    if (hasEngine(engineFor(model)) && hasModel(model)) return { status: 'ready', progress: 1, size: Math.round(models[model].size / 1e6) }
    return { status: failed.has(model) ? 'failed' : 'absent', progress: 0, size: Math.round(missing(model) / 1e6) }
  }

  /** An engine: downloaded once (its zips one after another), unpacked beside a folder of an older build of its kind, which then goes. */
  function ensureEngine(kind: LlmEngine, onBytes: () => void): Promise<void> {
    if (hasEngine(kind)) return Promise.resolve()
    const running = engineRunning.get(kind)
    if (running) return running
    const job = (async () => {
      const base = path.join(o.root, 'engine')
      const dir = paths.engineDir(kind)
      const unpacking = `${dir}.part`
      fs.mkdirSync(base, { recursive: true })
      fs.rmSync(unpacking, { recursive: true, force: true })
      let done = 0
      for (const [i, file] of builds[kind].files.entries()) {
        const zip = path.join(base, `${path.basename(dir)}.${i}.zip`)
        await fetchPinned(file, zip, 'The engine', got => {
          engineGot.set(kind, done + got)
          onBytes()
        }, open)
        done += file.size
        await unzip(zip, unpacking, builds[kind].strip)
        fs.rmSync(zip, { force: true })
      }
      if (!fs.existsSync(path.join(unpacking, SERVER))) throw new Error('The engine came without its server')
      if (MAC) fs.chmodSync(path.join(unpacking, SERVER), 0o755)
      fs.renameSync(unpacking, dir)
      for (const name of fs.readdirSync(base)) if (name.startsWith(`${kind}-`) && name !== path.basename(dir)) fs.rmSync(path.join(base, name), { recursive: true, force: true })
    })().finally(() => {
      engineRunning.delete(kind)
      engineGot.delete(kind)
    })
    engineRunning.set(kind, job)
    return job
  }

  function prepare(model: LlmModel, onProgress: (state: ModelState) => void): Promise<void> {
    if (state(model).status === 'ready') return Promise.resolve()
    const existing = downloads.get(model)
    if (existing) return existing.running
    let shown = 0
    const tick = () => {
      const now = state(model)
      // Every whole percent, not every chunk.
      if (now.progress - shown < 0.01) return
      shown = now.progress
      onProgress(now)
    }
    const kind = engineFor(model)
    const entry = { got: 0, total: Math.max(1, missing(model)), ...(hasEngine(kind) ? {} : { engine: kind }), running: Promise.resolve() }
    entry.running = (async () => {
      await ensureEngine(kind, tick)
      if (hasModel(model)) return
      fs.mkdirSync(path.join(o.root, 'models'), { recursive: true })
      await fetchPinned(models[model], paths.model(model), models[model].name, got => {
        entry.got = got
        tick()
      }, open)
    })()
      .then(() => {
        failed.delete(model)
      })
      .catch(error => {
        failed.add(model)
        throw error
      })
      .finally(() => downloads.delete(model))
    downloads.set(model, entry)
    onProgress(state(model))
    return entry.running
  }

  function unused(): string[] {
    const dir = path.join(o.root, 'models')
    const ours = new Set(MODELS.map(model => path.basename(paths.model(model))))
    try {
      // A download of ours still running is its file with .part after it.
      return fs.readdirSync(dir).filter(name => !ours.has(name.replace(/\.part$/, ''))).map(name => path.join(dir, name))
    } catch {
      return []
    }
  }

  return {
    manifest: m,
    server,
    state,
    prepare,
    target(model) {
      const kind = engineFor(model)
      if (!hasEngine(kind) || !hasModel(model)) throw new Error(`${models[model].name} is not downloaded yet`)
      return { exe: paths.exe(kind), model: paths.model(model), allLayers: kind === 'cuda' }
    },
    async remove(model) {
      if (downloads.has(model)) return
      if (server.model === paths.model(model)) await server.stop()
      removePath(paths.model(model))
      failed.delete(model)
      // An engine no model left here needs goes too.
      for (const kind of ENGINES) {
        if (engineRunning.has(kind) || MODELS.some(other => hasModel(other) && engineFor(other) === kind)) continue
        if (server.exe === paths.exe(kind)) await server.stop()
        removePath(paths.engineDir(kind))
      }
    },
    unused,
    removeUnused() {
      for (const file of unused()) removePath(file)
    },
    async removeEngine(kind) {
      if (engineRunning.has(kind)) return
      if (server.exe === paths.exe(kind)) await server.stop()
      const base = path.join(o.root, 'engine')
      // An older build of its kind, or one half unpacked, goes with it.
      let names: string[] = []
      try {
        names = fs.readdirSync(base)
      } catch {
        return
      }
      for (const name of names) if (name.startsWith(`${kind}-`)) removePath(path.join(base, name))
    },
    dispose: () => server.dispose(),
  }
}

/** `work` over every item, at most `limit` at a time, results in order. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const lane = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await work(items[i] as T, i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
  return out
}
