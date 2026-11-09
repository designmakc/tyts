// Windows OCR gives a snipped piece of the screen back as lines with their
// boxes. Lines close under each other are one paragraph and are joined into
// one line (a word hyphenated at the end of a line is joined back); a wider
// gap, or a line that starts far to the left or right of the one above,
// starts a new paragraph.

export type OcrLine = { text: string; x: number; y: number; w: number; h: number }

/** A gap under a line wider than this share of the usual line height starts a new paragraph. */
const PARAGRAPH_GAP = 0.8

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

export function paragraphsOf(lines: readonly OcrLine[]): string {
  const kept = lines.filter(l => l.text.trim().length > 0)
  const height = median(kept.map(l => l.h))
  const paragraphs: string[] = []
  let current = ''
  let previous: OcrLine | undefined
  for (const line of kept) {
    const text = line.text.trim()
    const together =
      previous !== undefined &&
      line.y - (previous.y + previous.h) < PARAGRAPH_GAP * height &&
      line.y >= previous.y &&
      Math.abs(line.x - previous.x) < 2 * height
    if (!together) {
      if (current) paragraphs.push(current)
      current = text
    } else if (/\p{L}-$/u.test(current) && /^\p{Ll}/u.test(text)) {
      current = current.slice(0, -1) + text
    } else {
      current += ' ' + text
    }
    previous = line
  }
  if (current) paragraphs.push(current)
  return paragraphs.join('\n\n')
}
