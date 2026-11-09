// The translator's own thread: Mozilla's Bergamot engine (the offline
// translator of Firefox, built to WebAssembly) with the models of the
// language pairs asked for, loaded once each. A batch of sentences is
// translated in one call; the thread holds the models' memory, so the main
// process ends it after a while without use. workerData: the engine's loader
// and WebAssembly file (vendor/bergamot).

import * as fs from 'node:fs'
import * as vm from 'node:vm'
import { parentPort, workerData } from 'node:worker_threads'

export type ModelFiles = Partial<Record<FileType, string>>
export type MtIn = { type: 'translate'; id: number; pair: string; files: ModelFiles; sentences: string[] }
export type MtOut = { type: 'done'; id: number; translations: string[] } | { type: 'failed'; id: number; message: string }

type FileType = 'model' | 'lex' | 'vocab' | 'srcvocab' | 'trgvocab'

// The few parts of the engine's interface used here (Firefox's translations-engine.worker.js uses the same).
type Deletable = { delete(): void }
type Vector<T> = Deletable & { push_back(item: T): void; size(): number; get(index: number): unknown }
type AlignedMemory = { getByteArrayView(): Uint8Array }
type TranslationModel = Deletable
type Responses = Deletable & { get(index: number): { getTranslatedText(): string } }
type Bergamot = {
  AlignedMemory: new (size: number, alignment: number) => AlignedMemory
  AlignedMemoryList: new () => Vector<AlignedMemory>
  TranslationModel: new (from: string, to: string, config: string, model: AlignedMemory, lex: AlignedMemory | null, vocabs: Vector<AlignedMemory>, quality: null) => TranslationModel
  BlockingService: new (options: { cacheSize: number }) => {
    translate(model: TranslationModel, messages: Vector<string>, options: Vector<ResponseOptions>): Responses
  }
  VectorString: new () => Vector<string>
  VectorResponseOptions: new () => Vector<ResponseOptions>
}
type ResponseOptions = { qualityScores: boolean; alignment: boolean; html: boolean }

/** Each file of a model sits in the engine's memory at this alignment. */
const ALIGNMENT: Record<FileType, number> = { model: 256, lex: 64, vocab: 64, srcvocab: 64, trgvocab: 64 }

const { loader, wasm } = workerData as { loader: string; wasm: string }

/** The decoder settings Firefox uses: greedy search, no quality model. */
function configFor(modelFile: string): string {
  const options: Record<string, string> = {
    'beam-size': '1',
    normalize: '1.0',
    'word-penalty': '0',
    'max-length-break': '128',
    'mini-batch-words': '1024',
    workspace: '128',
    'max-length-factor': '2.0',
    'skip-cost': 'true',
    'cpu-threads': '0',
    quiet: 'true',
    'quiet-translation': 'true',
    'gemm-precision': modelFile.endsWith('intgemm8.bin') ? 'int8shiftAll' : 'int8shiftAlphaAll',
    alignment: 'soft',
  }
  // Marian reads a YAML block: the indentation is part of it.
  const indent = '            '
  return '\n' + Object.entries(options).map(([k, v]) => `${indent}${k}: ${v}\n`).join('') + indent
}

const engine: Promise<Bergamot> = new Promise((resolve, reject) => {
  const loadBergamot = vm.compileFunction(`${fs.readFileSync(loader, 'utf8')}\nreturn loadBergamot`, [], { filename: loader })() as (
    module: object,
  ) => Bergamot
  const bergamot = loadBergamot({
    INITIAL_MEMORY: 41_943_040,
    print: () => undefined,
    printErr: () => undefined,
    onAbort: () => reject(new Error('the translator did not start')),
    // Resolved a turn later, once `bergamot` holds the module.
    onRuntimeInitialized: () => setTimeout(() => resolve(bergamot), 0),
    wasmBinary: fs.readFileSync(wasm),
  })
})

const models = new Map<string, TranslationModel>()
let service: InstanceType<Bergamot['BlockingService']> | undefined

function modelFor(b: Bergamot, pair: string, files: ModelFiles): TranslationModel {
  const cached = models.get(pair)
  if (cached) return cached
  const memory = (type: FileType): AlignedMemory | null => {
    const file = files[type]
    if (!file) return null
    const bytes = fs.readFileSync(file)
    const aligned = new b.AlignedMemory(bytes.byteLength, ALIGNMENT[type])
    aligned.getByteArrayView().set(bytes)
    return aligned
  }
  const model = memory('model')
  if (!model || !files.model) throw new Error(`no model for ${pair}`)
  const vocabs = new b.AlignedMemoryList()
  for (const type of files.vocab ? (['vocab'] as const) : (['srcvocab', 'trgvocab'] as const)) {
    const vocab = memory(type)
    if (!vocab) throw new Error(`no ${type} for ${pair}`)
    vocabs.push_back(vocab)
  }
  const [from = '', to = ''] = pair.split('-')
  const created = new b.TranslationModel(from, to, configFor(files.model), model, memory('lex'), vocabs, null)
  models.set(pair, created)
  return created
}

async function translate(m: Extract<MtIn, { type: 'translate' }>): Promise<string[]> {
  const b = await engine
  const model = modelFor(b, m.pair, m.files)
  service ??= new b.BlockingService({ cacheSize: 0 })
  const messages = new b.VectorString()
  const options = new b.VectorResponseOptions()
  try {
    for (const sentence of m.sentences) {
      messages.push_back(sentence)
      options.push_back({ qualityScores: false, alignment: false, html: false })
    }
    const responses = service.translate(model, messages, options)
    try {
      return m.sentences.map((_, i) => responses.get(i).getTranslatedText())
    } finally {
      responses.delete()
    }
  } finally {
    messages.delete()
    options.delete()
  }
}

parentPort?.on('message', (m: MtIn) => {
  translate(m).then(
    translations => parentPort?.postMessage({ type: 'done', id: m.id, translations } satisfies MtOut),
    error => parentPort?.postMessage({ type: 'failed', id: m.id, message: error instanceof Error ? error.message : String(error) } satisfies MtOut),
  )
})
