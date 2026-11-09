import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, expect, test } from 'vitest'

import type { StoragePart } from './protocol'
import { cleanable, folderSize, isUnder, markAway, measureParts, partPackages, speechModelDir, splitSpeech, withUse, type UseContext } from './storage'

const made: string[] = []
afterEach(() => made.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })))

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-storage-'))
  made.push(dir)
  return dir
}

test('a folder\'s size is its files\', deep down; a file is its own size; nothing there is nothing', async () => {
  const root = tempDir()
  fs.mkdirSync(path.join(root, 'a', 'b'), { recursive: true })
  fs.writeFileSync(path.join(root, 'one.bin'), Buffer.alloc(100))
  fs.writeFileSync(path.join(root, 'a', 'two.bin'), Buffer.alloc(20))
  fs.writeFileSync(path.join(root, 'a', 'b', 'three.bin'), Buffer.alloc(3))
  expect(await folderSize(root)).toEqual({ bytes: 123, shared: 0 })
  expect(await folderSize(path.join(root, 'one.bin'))).toEqual({ bytes: 100, shared: 0 })
  expect(await folderSize(path.join(root, 'missing'))).toEqual({ bytes: 0, shared: 0 })
})

test('a file hard-linked from elsewhere (uv\'s cache) counts as shared', async () => {
  const root = tempDir()
  fs.mkdirSync(path.join(root, 'cache'))
  fs.mkdirSync(path.join(root, 'env'))
  fs.writeFileSync(path.join(root, 'cache', 'torch.dll'), Buffer.alloc(50))
  fs.linkSync(path.join(root, 'cache', 'torch.dll'), path.join(root, 'env', 'torch.dll'))
  fs.writeFileSync(path.join(root, 'env', 'own.dll'), Buffer.alloc(7))
  expect(await folderSize(path.join(root, 'env'))).toEqual({ bytes: 57, shared: 50 })
})

test('a download used from outside Kryakl\'s folder is marked away; the person\'s own things and what is not there are not', () => {
  const home = 'C:\\Users\\you\\AppData\\Local\\Kryakl'
  const parts = markAway(
    [
      { id: 'speech', path: 'C:\\Users\\you\\AppData\\Local\\Altype\\speech', bytes: 7e9, shared: 0 },
      { id: 'voice', path: 'c:\\users\\you\\appdata\\local\\kryakl\\voice', bytes: 2e8, shared: 0 },
      { id: 'dict', path: 'C:\\Users\\you\\AppData\\Local\\Kryakl2\\dict', bytes: 3e6, shared: 0 },
      { id: 'most', path: 'C:\\Users\\you\\AppData\\Local\\Altype\\translate\\models\\m.gguf', bytes: 0, shared: 0 },
      { id: 'yours', path: 'C:\\Users\\you\\AppData\\Roaming\\Kryakl', bytes: 1e6, shared: 0 },
    ],
    home,
    ['speech', 'voice', 'dict', 'most'],
  )
  expect(parts.filter(p => p.away).map(p => p.id)).toEqual(['speech', 'dict'])
  expect(isUnder(home, home)).toBe(true)
})

test('parts are measured in the order given', async () => {
  const root = tempDir()
  fs.writeFileSync(path.join(root, 'model.gguf'), Buffer.alloc(10))
  fs.mkdirSync(path.join(root, 'engine'))
  fs.writeFileSync(path.join(root, 'engine', 'llama.exe'), Buffer.alloc(5))
  const parts = await measureParts([
    { id: 'accurate', path: path.join(root, 'model.gguf') },
    { id: 'llama', path: path.join(root, 'engine') },
    { id: 'voice', path: path.join(root, 'none') },
  ])
  expect(parts.map(p => [p.id, p.bytes])).toEqual([
    ['accurate', 10],
    ['llama', 5],
    ['voice', 0],
  ])
})

test("the speech engine's packages: who spoke when's and the graphics card's, the rest the program's", () => {
  const names = ['torch', 'torchaudio', 'torch_pitch_shift', 'pyannote', 'pytorch_lightning', 'lightning_fabric', 'asteroid_filterbanks', 'nvidia', 'numpy', 'ctranslate2', 'onnx_asr']
  expect(partPackages(names)).toEqual({ gpu: ['nvidia'], speakers: ['torch', 'torchaudio', 'torch_pitch_shift', 'pyannote', 'pytorch_lightning', 'lightning_fabric', 'asteroid_filterbanks'] })
})

test("a speech model's folder is where the engine keeps it", () => {
  expect(speechModelDir('M', { name: 'large-v3', backend: 'whisper', repo: 'Systran/faster-whisper-large-v3' })).toBe(path.join('M', 'whisper', 'models--Systran--faster-whisper-large-v3'))
  expect(speechModelDir('M', { name: 'parakeet-tdt-0.6b-v3', backend: 'parakeet', repo: 'istupakov/parakeet-tdt-0.6b-v3-onnx' })).toBe(path.join('M', 'parakeet-tdt-0.6b-v3'))
})

test("the program's line keeps what is neither the speakers' part nor the card's", () => {
  const parts = splitSpeech([
    { id: 'speech', path: 'S', bytes: 5000, shared: 3000 },
    { id: 'speakers', path: 'S', bytes: 4200, shared: 2800 },
    { id: 'gpu', path: 'S', bytes: 0, shared: 0 },
  ])
  expect(parts.map(p => [p.id, p.bytes, p.shared])).toEqual([
    ['speech', 800, 200],
    ['speakers', 4200, 2800],
    ['gpu', 0, 0],
  ])
})

const context: UseContext = {
  level: 'accurate',
  model: 'accurate',
  languages: ['ru', 'en'],
  native: 'ru',
  naturalVoice: true,
  build: 'vulkan',
  speech: { dictation: 'large-v3-turbo', transcripts: 'large-v3-turbo', reserve: { dictation: 'small' } },
}

const part = (id: StoragePart['id'], item?: string, bytes = 1e6): StoragePart => ({ id, ...(item ? { item } : {}), path: 'P', bytes, shared: 0 })

test('each part says what uses it; a part nothing uses is marked, a reserve for the processor is not', () => {
  const parts = withUse(
    [
      part('fast', 'ru'),
      part('fast', 'uk'),
      part('dict', 'de'),
      part('voice'),
      part('accurate'),
      part('most'),
      part('unused'),
      part('llama', 'vulkan'),
      part('llama', 'cuda'),
      part('speechModel', 'large-v3-turbo'),
      part('speechModel', 'large-v3'),
      part('speechModel', 'small'),
      part('speakers'),
      part('yours'),
    ],
    context,
  )
  const seen = parts.map(p => [p.id + (p.item ? `:${p.item}` : ''), p.users?.join(' · ') ?? '-', p.unused ? 'unused' : p.reserve ? `reserve ${p.reserve}` : ''])
  expect(seen).toEqual([
    ['fast:ru', 'Translate', ''],
    ['fast:uk', '', 'unused'],
    ['dict:de', '', 'unused'],
    ['voice', 'Listen', ''],
    ['accurate', 'Translate · Check', ''],
    ['most', '', 'unused'],
    ['unused', '', 'unused'],
    ['llama:vulkan', 'Translate · Check', ''],
    ['llama:cuda', '', 'unused'],
    ['speechModel:large-v3-turbo', 'Dictate · Transcribe', ''],
    ['speechModel:large-v3', '', 'unused'],
    ['speechModel:small', '', 'reserve Dictate'],
    ['speakers', 'Transcribe', ''],
    ['yours', '-', ''],
  ])
})

test('text editing makes the model and its build serve Dictate too', () => {
  const parts = withUse([part('accurate'), part('llama', 'vulkan')], { ...context, level: 'fast', edit: true })
  expect(parts.map(p => p.users)).toEqual([['Check', 'Dictate'], ['Check', 'Dictate']])
})

test('the model serves Check alone while Translate is on Fast; a Windows voice leaves the natural one unused', () => {
  const parts = withUse([part('accurate'), part('llama', 'vulkan'), part('voice')], { ...context, level: 'fast', naturalVoice: false })
  expect(parts.map(p => p.users)).toEqual([['Check'], ['Check'], []])
  expect(parts[2]?.unused).toBe(true)
})

test('Clean up takes only what nothing uses and what takes room', () => {
  const parts = withUse([part('fast', 'uk'), part('most', undefined, 0), part('accurate')], context)
  expect(cleanable(parts).map(p => p.id + (p.item ? `:${p.item}` : ''))).toEqual(['fast:uk'])
})
