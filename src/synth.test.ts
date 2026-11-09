import { EventEmitter } from 'node:events'

import { describe, expect, test } from 'vitest'

import { NaturalSpeaker, type WorkerIn, type WorkerOut } from './synth'

/** A voice process that answers only when told to. */
class FakeChild extends EventEmitter {
  sent: WorkerIn[] = []
  stderr = null
  send(m: WorkerIn): boolean {
    this.sent.push(m)
    return true
  }
  kill(): void {
    this.emit('exit', 0)
  }
  /** The process made sentence `index` of `job`. */
  made(job: number, index: number): void {
    this.emit('message', { type: 'audio', job, index, samples: new Float32Array([job, index]), words: [] } satisfies WorkerOut)
  }
  speaks(): string[] {
    return this.sent.filter(m => m.type === 'speak').map(m => (m.type === 'speak' ? `${m.job}:${m.text}` : ''))
  }
}

function setUp() {
  const child = new FakeChild()
  const heard: string[] = []
  const speaker = new NaturalSpeaker(
    'worker.js',
    () => ({ dir: 'v', model: '', binding: 'b', phonemizer: '', voice: () => '' }),
    {
      audio: (id, index, samples) => heard.push(`${id}/${index}=${samples[0]}:${samples[1]}`),
      failed: (id, message) => heard.push(`${id} failed ${message}`),
      phonemes: () => undefined,
    },
    { fork: (() => child) as never },
  )
  return { child, heard, speaker }
}

describe('NaturalSpeaker', () => {
  test('a sentence made once plays again at once, without the process', () => {
    const { child, heard, speaker } = setUp()
    speaker.speak(1, ['One.', 'Two.'], 'af_heart', 1)
    child.made(1, 0)
    child.made(1, 1)
    speaker.speak(2, ['Two.'], 'af_heart', 1)
    expect(heard).toEqual(['1/0=1:0', '1/1=1:1', '2/0=1:1'])
    expect(child.speaks()).toEqual(['1:One.', '1:Two.'])
  })

  test('a sentence still being made for a stopped reading serves the next one', () => {
    const { child, heard, speaker } = setUp()
    speaker.speak(1, ['One.', 'Two.', 'Three.', 'Four.'], 'af_heart', 1)
    expect(child.speaks()).toEqual(['1:One.', '1:Two.', '1:Three.'])
    // Stopped while "One." is being made; the next reading starts with it, then "Four.".
    speaker.speak(2, ['One.', 'Four.'], 'af_heart', 1)
    expect(child.sent.filter(m => m.type === 'cancel')).toEqual([{ type: 'cancel', job: 1 }])
    expect(child.speaks()).toEqual(['1:One.', '1:Two.', '1:Three.', '2:Four.'])
    child.made(1, 0)
    child.made(2, 1)
    expect(heard).toEqual(['2/0=1:0', '2/1=2:1'])
  })

  test('the sentence after a reading is made and kept, not read', () => {
    const { child, heard, speaker } = setUp()
    speaker.speak(1, ['One.'], 'af_heart', 1, ['Two.'])
    expect(child.speaks()).toEqual(['1:One.', '1:Two.'])
    child.made(1, 0)
    child.made(1, 1)
    expect(heard).toEqual(['1/0=1:0'])
    speaker.speak(2, ['Two.'], 'af_heart', 1)
    expect(heard).toEqual(['1/0=1:0', '2/0=1:1'])
  })

  test('another voice or speed is another sound', () => {
    const { child, speaker } = setUp()
    speaker.speak(1, ['One.'], 'af_heart', 1)
    child.made(1, 0)
    speaker.speak(2, ['One.'], 'af_heart', 1.5)
    expect(child.speaks()).toEqual(['1:One.', '2:One.'])
  })
})
