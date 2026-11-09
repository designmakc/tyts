// Kryakl is a guest on the computer (2026-10-31, the owner: "наш продукт не
// должен съедать все ресурсы компьютера"): the person's own programs (an
// emulator, a game, a call) own the graphics card, and Kryakl takes only what is
// free. A local model goes on the card whole or not at all: llama.cpp's own
// `--fit` puts as many layers on it as its free memory holds, and half a model
// is both slow (3 words a second instead of 20, an emulator on the RTX 2080
// SUPER that day) and still holds gigabytes the other program wanted. So the
// card's free memory is looked at before a model starts, and with too little
// Fast translates (modelbusy.ts says so in the card). Speech leaves the card by
// itself: dictation runs on the processor (speechplan.ts).

/** What a model on the card leaves free for the programs around it, beyond its own memory. */
export const CARD_HEADROOM_MB = 512

/** Whether a model taking `need` MB of the card fits whole in `free` MB, with room left for the person's programs. */
export function cardRoom(free: number, need: number): boolean {
  return free >= need + CARD_HEADROOM_MB
}

/**
 * One reading shared by everyone asking within `ttlMs` (nvidia-smi is a
 * process of its own: a key press and the job after it read it once), and a
 * reading under way is waited for, never started twice.
 */
export function sharedReading<T>(read: () => Promise<T>, ttlMs: number, now: () => number = Date.now): () => Promise<T> {
  let last: { at: number; value: T } | undefined
  let pending: Promise<T> | undefined
  return () => {
    if (last && now() - last.at < ttlMs) return Promise.resolve(last.value)
    pending ??= read()
      .then(value => {
        last = { at: now(), value }
        return value
      })
      .finally(() => (pending = undefined))
    return pending
  }
}
