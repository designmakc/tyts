// A call recording's chunks on their way to the speech engine, one track at a
// time, in order, each tried five times; 409 is the engine saying it has it. A chunk
// that never goes is counted, never fatal: the recording goes on, and the count
// goes with `finish` as `lost`.

export type ChunkCall = (method: string, route: string, body?: unknown) => Promise<{ ok: boolean; status?: number }>

const TRIES = 5

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export class TrackSender {
  /** Chunks that never reached the engine. */
  lost = 0
  private seq = 0
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private readonly call: ChunkCall,
    private readonly id: string,
    private readonly track: string,
    /** Before the try after `attempt` (0-based): a second more each time. */
    private readonly wait: (ms: number) => Promise<void> = pause,
  ) {}

  /** `bytes` may still be on its way (a recorder's chunk being read): its place in the order is taken now. */
  send(bytes: Uint8Array | Promise<Uint8Array>): void {
    const seq = this.seq++
    this.queue = this.queue.then(async () => {
      let body: Uint8Array
      try {
        body = await bytes
      } catch {
        this.lost++
        return
      }
      for (let attempt = 0; attempt < TRIES; attempt++) {
        try {
          const r = await this.call('PUT', `/recordings/${this.id}/${this.track}/${seq}`, body)
          if (r.ok || r.status === 409) return
        } catch {
          // A try like any other.
        }
        if (attempt < TRIES - 1) await this.wait(1000 * (attempt + 1))
      }
      this.lost++
    })
  }

  /** Every chunk sent so far has gone or been counted lost. */
  done(): Promise<void> {
    return this.queue
  }
}
