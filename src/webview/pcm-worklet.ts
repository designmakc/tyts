// Runs in the audio thread of Dictate's badge (an AudioWorklet, media/pcm-worklet.js):
// the microphone's samples, at the AudioContext's 16 kHz, handed to the page a
// tenth of a second at a time. The page turns them into 16-bit PCM for the engine.

declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

const BATCH = 1600

class PcmTap extends AudioWorkletProcessor {
  private buffer = new Float32Array(BATCH)
  private filled = 0

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    let at = 0
    while (at < channel.length) {
      const n = Math.min(BATCH - this.filled, channel.length - at)
      this.buffer.set(channel.subarray(at, at + n), this.filled)
      this.filled += n
      at += n
      if (this.filled === BATCH) {
        const out = this.buffer
        this.port.postMessage(out, [out.buffer])
        this.buffer = new Float32Array(BATCH)
        this.filled = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-tap', PcmTap)
