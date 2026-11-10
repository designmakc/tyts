// The wave of a voice being heard: the last three seconds of sound, one bar
// per 50 ms, mirrored round the middle, newest at the right edge; silence is a
// row of 2 px dots. Dictate's badge and Talk draw it under the words heard.

import { el } from './dom'

const WAVE = 60
const STEP = 3
const BAR = 2

export class Wave {
  readonly canvas = el('canvas', { class: 'wave' })
  private readonly levels: number[] = new Array<number>(WAVE).fill(0)
  private frame: number | undefined
  private on = false

  /** How loud the next 50 ms were, 0…1. */
  hear(level: number): void {
    this.levels.push(level)
    if (this.levels.length > WAVE) this.levels.shift()
    this.ask()
  }

  /** One drawing at the next frame, however many levels came before it. */
  private ask(): void {
    if (this.on && this.frame === undefined) this.frame = requestAnimationFrame(() => this.draw())
  }

  /** Drawn at each new level from now on (20 a second), flat to begin with: nothing of the last phrase's sound. */
  start(): void {
    this.stop()
    this.levels.fill(0)
    this.on = true
    this.ask()
  }

  stop(): void {
    this.on = false
    if (this.frame !== undefined) cancelAnimationFrame(this.frame)
    this.frame = undefined
  }

  private draw(): void {
    this.frame = undefined
    const wave = this.canvas
    const ratio = devicePixelRatio || 1
    const w = wave.clientWidth
    const h = wave.clientHeight
    const sized = wave.width === Math.round(w * ratio) && wave.height === Math.round(h * ratio)
    if (!sized) {
      wave.width = Math.round(w * ratio)
      wave.height = Math.round(h * ratio)
    }
    const c = wave.getContext('2d')
    if (!c) return
    c.setTransform(ratio, 0, 0, ratio, 0, 0)
    c.clearRect(0, 0, w, h)
    // A mark that only has to be seen (--mark): the duck's marigold on light, its yellow on dark.
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--mark').trim()
    c.globalAlpha = 0.7
    const shown = Math.min(WAVE, Math.floor(w / STEP))
    for (let i = 0; i < shown; i++) {
      const bar = Math.max(2, Math.round(this.levels[WAVE - shown + i]! * h))
      c.fillRect(w - (shown - i) * STEP, (h - bar) / 2, BAR, bar)
    }
  }
}
