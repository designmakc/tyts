// This computer's parts as Kryakl describes them (device.ts finds them out):
// the types and what both the main process and the pages say of them.

import { t } from './i18n'

export type GpuVendor = 'nvidia' | 'amd' | 'intel' | 'other'

export type Gpu = {
  name: string
  vendor: GpuVendor
  /** Its own memory in MB; 0 when unknown (or shared, as an Intel chip's). */
  vramMb: number
  /** As NVIDIA numbers it (610.88) when nvidia-smi answered, else as Windows does. */
  driver: string
  /** NVIDIA's compute capability (7.5 for a Turing card), when nvidia-smi says it. */
  computeCap?: number
}

export type DeviceProfile = {
  cpu: { name: string; cores: number; threads: number }
  ramGb: number
  gpus: Gpu[]
  /** It has a battery: a laptop, often slower than its processor's name says. */
  laptop: boolean
  /** When Windows was asked (ms); 0 for what Node alone knows. */
  at: number
}

export function vendorOf(name: string, company = ''): GpuVendor {
  const s = `${name} ${company}`
  if (/nvidia|geforce|quadro|tesla|rtx/i.test(s)) return 'nvidia'
  if (/amd|radeon|advanced micro|ati /i.test(s)) return 'amd'
  if (/intel|iris|uhd graphics|\barc\b/i.test(s)) return 'intel'
  return 'other'
}

/** The best NVIDIA card: the one speech would use. */
export function nvidiaCard(p: DeviceProfile | undefined): Gpu | undefined {
  return p?.gpus.filter(g => g.vendor === 'nvidia').sort((a, b) => b.vramMb - a.vramMb)[0]
}

/** The card worth naming: NVIDIA first, then the one with the most memory of its own. */
export function mainCard(p: DeviceProfile | undefined): Gpu | undefined {
  return nvidiaCard(p) ?? p?.gpus.slice().sort((a, b) => b.vramMb - a.vramMb)[0]
}

/** "Intel Core i9-9900K" for "Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz". */
export function shortCpu(name: string): string {
  return name
    .replace(/\((R|TM|C)\)/gi, '')
    .replace(/\s+@.*$/, '')
    .replace(/\b(CPU|Processor)\b/gi, '')
    .replace(/\s+with\s+.*graphics.*$/i, '')
    .replace(/\s+\d+-Core\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "NVIDIA GeForce RTX 2080 SUPER · 8 GB"; a card without memory of its own by its name alone. */
export function cardText(g: Gpu): string {
  const name = g.name.replace(/\((R|TM)\)/gi, '').replace(/\s+/g, ' ').trim()
  return g.vramMb >= 1024 ? `${name} · ${t('size.gb', { n: Math.round(g.vramMb / 1024) })}` : name
}

/**
 * Where an accurate translator's model runs here: all on the card, partly on
 * it, or on the processor; `slow` when it takes long. `cuda`: the model does
 * not fit an NVIDIA card, whose own build (llama.cpp's CUDA, +670 MB) still
 * runs it about four times quicker than Vulkan (the driver lends it the
 * computer's memory: the 12B on the RTX 2080 SUPER, 12 tokens a second
 * against 3).
 */
export type LevelFit = { where: 'card' | 'part' | 'processor'; slow: boolean; cuda: boolean }

/** The model's own memory on the card, in MB, with its working room (Gemma 4 E4B, q4_0, whose per-layer embeddings stay in the computer's memory: 3.1 GB measured; Gemma 4 12B, q4_0, 7 GB of weights). */
export const LEVEL_VRAM_MB = { accurate: 3500, most: 9000 }

/** An NVIDIA card llama.cpp's CUDA 12.4 build runs on: compute 5.0, a driver of 551 or newer (as nvidia-smi numbers it). */
function cudaReady(g: Gpu | undefined): boolean {
  if (!g) return false
  if (g.computeCap && g.computeCap < 5) return false
  return !/^\d{3}\.\d+$/.test(g.driver) || Number(g.driver.split('.')[0]) >= 551
}

/**
 * How each model fits this computer, and the level to advise: Most accurate on
 * a card that holds its 12B model, Accurate on one that holds the E4B, Fast
 * without one (Accurate takes half a minute a text on a processor). The same
 * fit holds for checking English, which the same model does.
 * Any card with memory of its own counts, as llama.cpp's Vulkan build runs on
 * NVIDIA, AMD and Intel alike; a chip sharing the system's memory does not.
 */
/** How a model needing `need` MB on the card fits here. */
function fitter(p: DeviceProfile | undefined): (need: number) => LevelFit {
  const vram = p?.gpus.reduce((most, g) => Math.max(most, g.vramMb), 0) ?? 0
  const nvidia = cudaReady(nvidiaCard(p)) && (nvidiaCard(p)?.vramMb ?? 0) === vram
  return need =>
    vram >= need
      ? { where: 'card', slow: false, cuda: false }
      : vram >= need / 2
        ? { where: 'part', slow: true, cuda: nvidia }
        : { where: 'processor', slow: true, cuda: false }
}

export function translationAdvice(p: DeviceProfile | undefined): { advised: 'fast' | 'accurate' | 'most'; accurate: LevelFit; most: LevelFit } {
  const fit = fitter(p)
  const accurate = fit(LEVEL_VRAM_MB.accurate)
  const most = fit(LEVEL_VRAM_MB.most)
  return { advised: most.where === 'card' ? 'most' : accurate.where === 'card' ? 'accurate' : 'fast', accurate, most }
}
