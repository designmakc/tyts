// A call's screenshots (webview/capture.ts takes them, the engine keeps them in
// the recording's folder, transcript.json lists them): whether a frame changed
// enough to keep, and which ones the transcript shows. Pure, shared by the pages.

/** One screenshot as transcript.json lists it: seconds from the start, its file, taken by the person, or marked key by the summary's pass. */
export type Shot = { at: number; file: string; manual?: boolean; key?: boolean }

/** A frame's fingerprint: SHOT_SIDE × SHOT_SIDE grayscale, a bit each, set where brighter than the mean (average hash). */
export const SHOT_SIDE = 16
/** Bits of 256 that must differ for a frame to count as new. */
// ponytail: a fixed threshold read off no measurement; tune it once real calls show too many or too few shots
export const SHOT_CHANGE = 12

/** The fingerprint of a small RGBA picture (canvas ImageData's data, SHOT_SIDE² pixels). */
export function frameHash(rgba: ArrayLike<number>): Uint8Array {
  const n = SHOT_SIDE * SHOT_SIDE
  const gray = new Float64Array(n)
  let sum = 0
  for (let i = 0; i < n; i++) {
    gray[i] = 0.299 * (rgba[i * 4] ?? 0) + 0.587 * (rgba[i * 4 + 1] ?? 0) + 0.114 * (rgba[i * 4 + 2] ?? 0)
    sum += gray[i]!
  }
  const mean = sum / n
  return Uint8Array.from(gray, g => (g > mean ? 1 : 0))
}

export function hamming(a: Uint8Array, b: Uint8Array): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Keep this frame? The first always; then only one far enough from the last kept. */
export const changed = (last: Uint8Array | undefined, next: Uint8Array): boolean => !last || hamming(last, next) >= SHOT_CHANGE

/** The shots the transcript shows: those the person took and those the summary's pass marked key, by time. */
export const shownShots = (shots: readonly Shot[] = []): Shot[] => shots.filter(s => s.manual || s.key).sort((a, b) => a.at - b.at)

// ---------------------------------------------------------------- key frames: what a speaker points at

/** Words a speaker says when pointing at the screen, in Russian, Ukrainian and English. */
// ponytail: a list read off no measurement; bare "here"/"тут" would mark every other line, so only the pointing phrases
const POINTER = new RegExp(
  '(?<!\\p{L})(?:' +
    [
      'вот (?:тут|здесь|так|это)', 'смотрите', 'посмотрите', 'гляньте', 'как (?:видите|видно)', 'видите', 'я сделал(?:а)? так', 'на экране', 'покажу',
      'ось (?:тут|де|так|це)', 'дивіться', 'подивіться', 'як (?:бачите|видно)', 'бачите', 'я зробив(?:ла)? так', 'на екрані',
      'right here', 'over here', 'here is', "here's", 'here you (?:can )?see', 'look at (?:this|that)', 'look here', 'as you can see', 'you can see',
      'on (?:the )?screen', 'let me show', "i'll show", 'i did it like this',
    ].join('|') +
    ')(?!\\p{L})',
  'iu',
)

export const pointsAtScreen = (text: string): boolean => POINTER.test(text.replace(/’/g, "'"))

/** The shot a moment shows: the last at or before it within 30 s, else the first after it within 10 s. */
export function shotAt(shots: readonly Shot[], at: number): Shot | undefined {
  let before: Shot | undefined
  let after: Shot | undefined
  for (const s of shots) {
    if (s.at <= at) {
      if (at - s.at <= 30 && (!before || s.at > before.at)) before = s
    } else if (s.at - at <= 10 && (!after || s.at < after.at)) after = s
  }
  return before ?? after
}

/** The files to mark key: the shot of every line that points at the screen. */
export function keyShots(shots: readonly Shot[], lines: readonly { start: number; text: string }[]): string[] {
  const files = new Set<string>()
  for (const l of lines) {
    if (!pointsAtScreen(l.text)) continue
    const s = shotAt(shots, l.start)
    if (s) files.add(s.file)
  }
  return [...files]
}

// ---------------------------------------------------------------- speaker names from a call's tiles (experimental)

/** Words of a call program's own buttons and labels: a line with one is no person's name. */
const UI_WORDS = new Set(
  ('share screen leave end call mute unmute chat participants people recording record meeting view gallery speaker host co-host you me ' +
    'camera video audio settings more reactions apps join start stop raise hand present presenting whiteboard breakout rooms security ' +
    'zoom teams google meet telegram discord slack facetime skype webex microsoft new file edit window help ' +
    'демонстрация экран экрана выйти завершить звук камера видео чат участники запись встреча настройки ещё реакции вы я ' +
    'демонстрація екран екрана вийти завершити звук камера відео чат учасники запис зустріч налаштування ще реакції ви').split(' '),
)

/** The person's name a line reads as ("Olga Petrova (Host)" → "Olga Petrova"): two or three capitalized words of letters, none a call program's; null for any other line. */
export function nameIn(line: string): string | null {
  const name = line.replace(/\s*\([^()]*\)\s*$/, '').trim()
  const words = name.split(/\s+/)
  if (words.length < 2 || words.length > 3 || name.length > 40) return null
  return words.every(w => /^\p{Lu}[\p{Ll}'’-]+$/u.test(w) && !UI_WORDS.has(w.toLowerCase())) ? name : null
}

/**
 * A name for each speaker from the text read off the shots near their turns (`seen[speaker]`: one list of lines per shot):
 * the name seen near this speaker's turns more often than near anyone else's, in half of their shots at least. Speakers
 * shown side by side (a gallery) give no hint. The person's own track ("me") is left out by the caller. A hint only.
 */
export function speakerHints(seen: Record<string, string[][]>): Record<string, string> {
  const share: Record<string, Map<string, number>> = {}
  for (const [speaker, shots] of Object.entries(seen)) {
    const counts = new Map<string, number>()
    for (const lines of shots) for (const name of new Set(lines.map(nameIn).filter((n): n is string => !!n))) counts.set(name, (counts.get(name) ?? 0) + 1)
    share[speaker] = new Map([...counts].map(([name, n]) => [name, n / Math.max(1, shots.length)]))
  }
  const picks: { speaker: string; name: string; score: number }[] = []
  for (const [speaker, names] of Object.entries(share)) {
    const scored = [...names]
      .filter(([, s]) => s >= 0.5)
      .map(([name, s]) => ({ name, score: s - Math.max(0, ...Object.entries(share).filter(([k]) => k !== speaker).map(([, m]) => m.get(name) ?? 0)) }))
      .sort((a, b) => b.score - a.score)
    const [best, second] = scored
    if (best && best.score > 0 && (!second || best.score > second.score)) picks.push({ speaker, ...best })
  }
  // One name, one speaker: the likelier keeps it.
  const out: Record<string, string> = {}
  const taken = new Set<string>()
  for (const p of picks.sort((a, b) => b.score - a.score)) if (!taken.has(p.name)) (taken.add(p.name), (out[p.speaker] = p.name))
  return out
}
