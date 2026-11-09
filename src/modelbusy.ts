// The local model too slow just now (2026-10-31, the owner: "если карта или
// процессор занят, переключаться на быструю модель"): another program took
// the graphics card (an emulator filled its memory, llama.cpp fit fewer
// layers on it, 3 words a second instead of 100) or the processor. A
// sentence far slower than its usual time here gives the job to Fast, and
// Fast translates until the model is tried again.

import type { LlmModel } from './llmfiles'
import type { BusyPart } from './protocol'
import { cardRoom } from './resources'

/** A sentence may take this many times its usual time here before the model is called busy, and never less than SLOW_MIN_S. */
export const SLOW_TIMES = 5
export const SLOW_MIN_S = 4
/** How long Fast translates before the model is tried again. */
export const BUSY_MS = 2 * 60_000

export type ModelBusy = { model: LlmModel; where: BusyPart; until: number }

/** The part kept busy, in words: "the graphics card is busy". */
export function busyName(part: BusyPart): string {
  return part === 'card' ? 'graphics card' : 'processor'
}

/**
 * Seconds a sentence may take here, from the seconds a sentence the model
 * took lately (`sentence`, real use); none while fewer than `sure` are known:
 * a model never timed here cannot be called slow.
 */
export function slowAfter(sentence: readonly number[], sure: number): number | undefined {
  if (sentence.length < sure || sentence.length === 0) return undefined
  const sorted = [...sentence].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  const usual = sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
  return Math.max(SLOW_MIN_S, SLOW_TIMES * usual)
}

/**
 * Whether the model is tried again: once its time is out, and, on a card
 * whose free memory is known (`free` MB, NVIDIA's), only when it holds the
 * model whole as measured while loaded (`need` MB), with room around it
 * (resources.ts): llama.cpp fits what is free when it starts, so less would
 * be as slow as before.
 */
export function tryAgain(busy: ModelBusy, now: number, free: number | undefined, need: number | undefined): boolean {
  if (now < busy.until) return false
  if (busy.where !== 'card' || free === undefined || need === undefined) return true
  return cardRoom(free, need)
}
