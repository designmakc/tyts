// What Tyts keeps on this computer, measured for the Storage page: every
// download in one folder (%LOCALAPPDATA%\Tyts) and the person's own things
// (%APPDATA%\Tyts, the transcripts). On a computer with uv of its own (a
// developer's), the speech engine's packages are hard links into uv's cache:
// the same bytes in two folders, counted as `shared` so the page can say what
// a removal really frees. That cache is not Tyts's and is not shown. Each
// part is told what it serves now (`withUse`): a part nothing uses is marked,
// for the pages to say so and for Clean up to remove.

import * as fs from 'node:fs'
import * as path from 'node:path'

import { pathOf } from './system32'

import type { StorageId, StoragePart } from './protocol'

export type Measured = { bytes: number; shared: number }

/** The bytes under `target` (a folder or a file), and how many of them are in files linked from elsewhere too; nothing when it is not there. Links to folders are not followed. */
export async function folderSize(target: string): Promise<Measured> {
  let stat: fs.Stats
  try {
    stat = await fs.promises.lstat(target)
  } catch {
    return { bytes: 0, shared: 0 }
  }
  if (stat.isFile()) return { bytes: stat.size, shared: stat.nlink > 1 ? stat.size : 0 }
  if (!stat.isDirectory()) return { bytes: 0, shared: 0 }
  let names: string[]
  try {
    names = await fs.promises.readdir(target)
  } catch {
    return { bytes: 0, shared: 0 }
  }
  const inside = await Promise.all(names.map(name => folderSize(path.join(target, name))))
  return inside.reduce((sum, m) => ({ bytes: sum.bytes + m.bytes, shared: sum.shared + m.shared }), { bytes: 0, shared: 0 })
}

/** A part: its place (and which one of its kind, `item`), and `only` these files in it when it is not all of it (the models no longer used, beside those in use). */
export type Place = { id: StorageId; item?: string; path: string; only?: readonly string[] }

/** Whether `target` is `dir` or inside it, whatever the case Windows wrote either in. */
export function isUnder(target: string, dir: string): boolean {
  const P = pathOf(dir)
  const rel = P.relative(P.resolve(dir).toLowerCase(), P.resolve(target).toLowerCase())
  return rel === '' || (!rel.startsWith('..') && !P.isAbsolute(rel))
}

/** The downloads Tyts uses from outside its folder `home` (a move that could not finish), marked `away`. */
export function markAway(parts: readonly StoragePart[], home: string, downloads: readonly StorageId[]): StoragePart[] {
  return parts.map(p => (downloads.includes(p.id) && p.bytes > 0 && !isUnder(p.path, home) ? { ...p, away: true } : p))
}

/** Each part measured, in the order given. */
export async function measureParts(parts: readonly Place[]): Promise<StoragePart[]> {
  const sizeOf = async (p: Place): Promise<Measured> => {
    if (!p.only) return folderSize(p.path)
    const each = await Promise.all(p.only.map(folderSize))
    return each.reduce((sum, m) => ({ bytes: sum.bytes + m.bytes, shared: sum.shared + m.shared }), { bytes: 0, shared: 0 })
  }
  return Promise.all(parts.map(async p => ({ id: p.id, ...(p.item ? { item: p.item } : {}), path: p.path, ...(await sizeOf(p)) })))
}

// ---------------------------------------------------------------- the speech engine's parts

/** Who spoke when's packages in the engine's site-packages (PyTorch, pyannote and what they bring), and the graphics card's (NVIDIA's libraries). */
const SPEAKER_PACKAGES = /^(torch|pyannote|lightning|pytorch_|asteroid)/i
const GPU_PACKAGES = /^nvidia/i

/** The folders of site-packages that are the speakers' part and the graphics card's part; the rest is the program itself. */
export function partPackages(names: readonly string[]): { gpu: string[]; speakers: string[] } {
  return { gpu: names.filter(n => GPU_PACKAGES.test(n)), speakers: names.filter(n => SPEAKER_PACKAGES.test(n)) }
}

/** Where the engine keeps a speech model (engine/asr.py `_cache_dir`): Hugging Face's models--<owner>--<repo> for Whisper, a folder of its own else. */
export function speechModelDir(models: string, m: { name: string; backend: string; repo: string }): string {
  return m.backend === 'whisper' ? path.join(models, 'whisper', `models--${m.repo.replace('/', '--')}`) : path.join(models, m.name)
}

/**
 * The speech engine measured whole (`speech`, which holds its packages), its parts measured on their own: the
 * program's line keeps what is neither the speakers' nor the card's, so nothing is counted twice.
 */
export function splitSpeech(parts: readonly StoragePart[]): StoragePart[] {
  const inner = parts.filter(p => p.id === 'gpu' || p.id === 'speakers' || p.id === 'speakersOld')
  const bytes = inner.reduce((n, p) => n + p.bytes, 0)
  const shared = inner.reduce((n, p) => n + p.shared, 0)
  return parts.map(p => (p.id === 'speech' ? { ...p, bytes: Math.max(0, p.bytes - bytes), shared: Math.max(0, p.shared - shared) } : p))
}

// ---------------------------------------------------------------- what each part serves

/** What the parts serve now. */
export type UseContext = {
  /** Translate's level, and the one language model: Check's always, Translate's unless it is Fast. */
  level: 'fast' | 'accurate' | 'most'
  model: 'accurate' | 'most'
  /** Text editing is on: dictated phrases go through that model too. */
  edit?: boolean
  /** The languages the person uses, by code: Fast's models for them translate, or show the quick draft. */
  languages: readonly string[]
  /** The person's own language: its dictionary gives the words' meanings in the cards. */
  native: string
  /** The natural voice reads (Automatic, or one of its voices picked). */
  naturalVoice: boolean
  /** The llama.cpp build the language model runs on here. */
  build: 'vulkan' | 'cuda'
  /** The speech model each action uses now, and those kept for the processor should the graphics card fail. */
  speech: { dictation: string; transcripts: string; reserve: { dictation?: string; transcripts?: string } }
}

/** The actions a part serves; undefined for the person's own things, which serve no action. */
function usersOf(p: StoragePart, c: UseContext): string[] | undefined {
  const when = (on: boolean, ...names: string[]) => (on ? names : [])
  switch (p.id) {
    case 'fast':
      return when(!!p.item && c.languages.includes(p.item), 'Translate')
    case 'dict':
      return when(p.item === c.native, 'Listen', 'Translate')
    case 'voice':
      return when(c.naturalVoice, 'Listen')
    case 'accurate':
    case 'most':
      return p.id === c.model ? [...when(c.level === p.id, 'Translate'), 'Check', ...when(!!c.edit, 'Dictate')] : []
    case 'llama':
      return p.item === c.build ? [...when(c.level !== 'fast', 'Translate'), 'Check', ...when(!!c.edit, 'Dictate')] : []
    case 'speechModel':
      return [...when(p.item === c.speech.dictation, 'Dictate'), ...when(p.item === c.speech.transcripts, 'Transcribe')]
    case 'unused':
      return []
    case 'speech':
    case 'gpu':
      return ['Dictate', 'Transcribe']
    case 'speakers':
      return ['Transcribe']
    // A Mac's pyannote left from before 2026-11-09: nothing uses it, Clean up removes it.
    case 'speakersOld':
      return []
    case 'yours':
    case 'transcripts':
      return undefined
  }
}

/** Each part with the actions it serves; one that serves none is `unused`, unless it is a speech model kept in reserve for the processor. */
export function withUse(parts: readonly StoragePart[], c: UseContext): StoragePart[] {
  return parts.map(p => {
    const users = usersOf(p, c)
    if (!users) return p
    if (users.length) return { ...p, users }
    const reserve = p.id === 'speechModel' ? [...(c.speech.reserve.dictation === p.item ? ['Dictate'] : []), ...(c.speech.reserve.transcripts === p.item ? ['Transcribe'] : [])] : []
    return reserve.length ? { ...p, users, reserve: reserve.join(' and ') } : { ...p, users, unused: true }
  })
}

/** What Clean up removes: the parts nothing uses that take room. */
export const cleanable = (parts: readonly StoragePart[]) => parts.filter(p => p.unused && p.bytes > 0)
