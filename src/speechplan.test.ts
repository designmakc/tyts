import { describe, expect, it } from 'vitest'

import type { DeviceProfile } from './hardware'
import { BUDGET, cpuFactor, gpuOffer, minutes, planSpeech, runKey, seconds, testKey, testRuns, type PlanInput } from './speechplan'

const i9: DeviceProfile = {
  cpu: { name: 'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz', cores: 8, threads: 16 },
  ramGb: 32,
  gpus: [{ name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia', vramMb: 8192, driver: '610.88', computeCap: 7.5 }],
  laptop: false,
  at: 1,
}

const weakLaptop: DeviceProfile = {
  cpu: { name: 'Intel(R) Core(TM) i5-8250U', cores: 4, threads: 8 },
  ramGb: 8,
  gpus: [{ name: 'Intel(R) UHD Graphics 620', vendor: 'intel', vramMb: 0, driver: '31.0.101.2111' }],
  laptop: true,
  at: 1,
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    profile: i9,
    fingerprint: 'fp',
    bench: undefined,
    cuda: false,
    speakersCuda: false,
    speakers: false,
    downloaded: [],
    native: 'ru',
    prefer: 'accuracy',
    pins: { dictation: '', transcripts: '' },
    ...over,
  }
}

const m1: DeviceProfile = {
  cpu: { name: 'Apple M1', cores: 6, threads: 8 },
  ramGb: 16,
  gpus: [{ name: 'Apple M1 GPU', vendor: 'other', vramMb: 0, driver: '' }],
  laptop: true,
  at: 1,
}

describe('planSpeech', () => {
  it('an M1 with the mac part: Parakeet dictates and transcribes calls in its languages, turbo on Metal in the others', () => {
    const downloaded = ['large-v3-turbo', 'parakeet-tdt-0.6b-v3']
    const plan = planSpeech(input({ profile: m1, metal: true, downloaded, languages: ['ru', 'en'] }))
    expect(plan.transcripts.chosen).toMatchObject({ model: 'parakeet-tdt-0.6b-v3', device: 'cpu' })
    expect(plan.engine.cpu.transcripts.model).toBe('parakeet-tdt-0.6b-v3')
    expect(plan.dictation.chosen.model).toBe('parakeet-tdt-0.6b-v3')
    // Turbo kept from before gives way too.
    expect(planSpeech(input({ profile: m1, metal: true, downloaded, languages: ['ru', 'en'], previous: { transcripts: 'large-v3-turbo' } })).transcripts.chosen.model).toBe('parakeet-tdt-0.6b-v3')
    // A language Parakeet does not know: turbo on Metal, as before; picked by the person, it stays.
    const japanese = planSpeech(input({ profile: m1, metal: true, downloaded, languages: ['ru', 'ja'] }))
    expect(japanese.transcripts.chosen).toMatchObject({ model: 'large-v3-turbo', device: 'metal', compute: 'mlx', basis: 'guess' })
    expect(japanese.engine.cpu.transcripts).toEqual({ model: 'large-v3-turbo', compute: 'mlx' })
    expect(planSpeech(input({ profile: m1, metal: true, downloaded, pins: { dictation: '', transcripts: 'large-v3-turbo' } })).transcripts.chosen.model).toBe('large-v3-turbo')
    expect(testRuns(input({ profile: m1, metal: true, downloaded }), japanese)).toContainEqual({ model: 'large-v3-turbo', device: 'metal', compute: 'mlx', beam: 2 })
    // A measured Metal run is this Mac's own.
    const bench = { fingerprint: 'fp', runs: { [runKey('large-v3-turbo', 'metal', 'mlx')]: { rtf: 0.04 } } }
    expect(planSpeech(input({ profile: m1, metal: true, downloaded, languages: ['ja'], native: 'ja', bench })).transcripts.chosen.basis).toBe('measured')
    // Without the part, turbo is the processor's.
    expect(planSpeech(input({ profile: m1, downloaded })).transcripts.choices.some(c => c.device === 'metal')).toBe(false)
  })

  it('a weak laptop dictates Russian with Parakeet, Kazakh with a quick Whisper', () => {
    const plan = planSpeech(input({ profile: weakLaptop }))
    expect(plan.device).toBe('cpu')
    expect(plan.dictation.chosen.model).toBe('parakeet-tdt-0.6b-v3')
    expect(plan.engine.cpu.dictation.model).toBe('parakeet-tdt-0.6b-v3')
    // Parakeet does calls on a Mac only.
    expect(plan.transcripts.choices.some(c => c.model === 'parakeet-tdt-0.6b-v3')).toBe(false)
    const kazakh = planSpeech(input({ profile: weakLaptop, native: 'kk' }))
    expect(kazakh.dictation.chosen.model).toBe('base')
    expect(kazakh.dictation.choices.find(c => c.model === 'parakeet-tdt-0.6b-v3')?.why).toMatch(/language/)
  })

  it('the card is left to other programs: Parakeet dictates on the processor, the card transcribes', () => {
    const downloaded = ['large-v3-turbo', 'parakeet-tdt-0.6b-v3']
    const plan = planSpeech(input({ cuda: true, downloaded, languages: ['ru', 'en'] }))
    expect(plan.device).toBe('cuda')
    expect(plan.dictation.chosen).toMatchObject({ model: 'parakeet-tdt-0.6b-v3', device: 'cpu', compute: 'int8' })
    expect(plan.engine.cuda?.dictation).toEqual({ model: 'parakeet-tdt-0.6b-v3', beam: 2 })
    expect(plan.engine.cuda?.transcripts).toEqual({ model: 'large-v3-turbo', compute: 'float16' })
    // Not for a language Parakeet does not know, nor when the person picked a model.
    expect(planSpeech(input({ cuda: true, downloaded, native: 'kk' })).dictation.chosen).toMatchObject({ model: 'large-v3-turbo', device: 'cuda' })
    const kazakhToo = planSpeech(input({ cuda: true, downloaded, languages: ['ru', 'en', 'kk'] })).dictation
    expect(kazakhToo.chosen.model).toBe('large-v3-turbo')
    expect(kazakhToo.choices.find(c => c.model === 'parakeet-tdt-0.6b-v3')?.why).toMatch(/every language/)
    expect(planSpeech(input({ cuda: true, downloaded, pins: { dictation: 'large-v3-turbo', transcripts: '' } })).dictation.chosen.device).toBe('cuda')
  })

  it('until Parakeet is here the card dictates, and Parakeet is offered for the processor', () => {
    const plan = planSpeech(input({ cuda: true, downloaded: ['large-v3-turbo'] }))
    expect(plan.dictation.chosen).toMatchObject({ model: 'large-v3-turbo', device: 'cuda' })
    expect(plan.dictation.better).toMatchObject({ model: 'parakeet-tdt-0.6b-v3', device: 'cpu', downloaded: false })
  })

  it('a weak laptop transcribes with turbo, whose decoder is light, and keeps the large model out of its memory', () => {
    const plan = planSpeech(input({ profile: weakLaptop, native: 'kk' }))
    expect(plan.dictation.chosen.model).toBe('base')
    expect(plan.dictation.chosen.estimate).toBeLessThanOrEqual(BUDGET.dictation.accuracy)
    expect(plan.transcripts.chosen.model).toBe('large-v3-turbo')
    expect(plan.dictation.chosen.basis).toBe('guess')
    // 8 GB: large-v3 needs more than a third of it.
    expect(plan.transcripts.choices.find(c => c.model === 'large-v3')?.why).toMatch(/memory/)
    expect(plan.offers.gpu).toBe(false)
  })

  it('speed over accuracy takes quicker models and a beam of one', () => {
    const plan = planSpeech(input({ profile: weakLaptop, prefer: 'speed', native: 'kk' }))
    expect(plan.dictation.chosen.model).toBe('tiny')
    expect(plan.engine.cpu.dictation).toEqual({ model: 'tiny', beam: 1 })
  })

  it('a downloaded model within the budget is used, and a better one offered', () => {
    const plan = planSpeech(input({ downloaded: ['base', 'small'], native: 'kk' }))
    expect(plan.dictation.chosen.model).toBe('small')
    const russian = planSpeech(input({ downloaded: ['base', 'small'] }))
    expect(russian.dictation.chosen.model).toBe('small')
    expect(russian.dictation.better?.model).toBe('parakeet-tdt-0.6b-v3')
    const slow = planSpeech(input({ profile: weakLaptop, downloaded: ['tiny'], native: 'kk' }))
    expect(slow.dictation.chosen.model).toBe('tiny')
    expect(slow.dictation.better?.model).toBe('base')
  })

  it('a model too slow here is left for a quicker one that will download (going down needs no asking)', () => {
    const plan = planSpeech(input({ profile: weakLaptop, downloaded: ['small'], native: 'kk' }))
    expect(plan.dictation.chosen.model).toBe('base')
    expect(plan.dictation.chosen.downloaded).toBe(false)
  })

  it('the card: one model for both, in float16 when it fits, both plans for the engine', () => {
    const plan = planSpeech(input({ cuda: true, downloaded: ['small', 'large-v3-turbo'] }))
    expect(plan.device).toBe('cuda')
    expect(plan.transcripts.chosen.model).toBe('large-v3-turbo')
    expect(plan.dictation.chosen.model).toBe('large-v3-turbo')
    expect(plan.engine.cuda?.transcripts).toEqual({ model: 'large-v3-turbo', compute: 'float16' })
    expect(plan.engine.cuda?.dictation.beam).toBe(5)
    // Should the card fail, the processor's own choice.
    expect(plan.engine.cpu.dictation.model).toBe('small')
    expect(plan.offers).toEqual({ gpu: true, speakersGpu: true })
    // large-v3 fits the card and is better: offered, not downloaded on its own.
    expect(plan.transcripts.better?.model).toBe('large-v3')
  })

  it('a fresh install on a strong card downloads turbo first, not the 3 GB model', () => {
    const plan = planSpeech(input({ cuda: true }))
    expect(plan.transcripts.chosen.model).toBe('large-v3-turbo')
    expect(plan.dictation.chosen.model).toBe('large-v3-turbo')
    expect(plan.transcripts.better?.model).toBe('large-v3')
  })

  it('a small card takes int8_float16, and too small a card is left out', () => {
    const small: DeviceProfile = { ...i9, gpus: [{ ...i9.gpus[0]!, vramMb: 3072 }] }
    const plan = planSpeech(input({ profile: small, cuda: true }))
    expect(plan.transcripts.choices.find(c => c.model === 'large-v3-turbo')?.compute).toBe('int8_float16')
    expect(plan.transcripts.choices.find(c => c.model === 'large-v3')?.why).toMatch(/too big/)
    expect(plan.offers.speakersGpu).toBe(false)
    expect(gpuOffer({ ...i9, gpus: [{ ...i9.gpus[0]!, vramMb: 1024 }] })).toBe(false)
    expect(gpuOffer({ ...i9, gpus: [{ ...i9.gpus[0]!, driver: '472.12' }] })).toBe(false)
    expect(gpuOffer(undefined, true)).toBe(true)
  })

  it('measured numbers replace the guesses, and scale to the models not measured', () => {
    const bench = { fingerprint: 'fp', runs: { [runKey('small', 'cpu', 'int8')]: { phrase: 3.0, rtf: 0.4 } } }
    const plan = planSpeech(input({ bench, downloaded: ['small'], native: 'kk' }))
    const small = plan.dictation.choices.find(c => c.model === 'small')!
    expect(small).toMatchObject({ estimate: 3.0, basis: 'measured', fits: false })
    const base = plan.dictation.choices.find(c => c.model === 'base')!
    expect(base.basis).toBe('scaled')
    expect(base.estimate).toBeCloseTo((3.0 * 0.45) / 1.4, 5)
    expect(plan.dictation.chosen.model).toBe('base')
  })

  it('a pinned model is kept whatever it costs', () => {
    const plan = planSpeech(input({ profile: weakLaptop, pins: { dictation: 'large-v3-turbo', transcripts: '' } }))
    expect(plan.dictation.pinned).toBe(true)
    expect(plan.dictation.chosen.model).toBe('large-v3-turbo')
    expect(plan.dictation.chosen.fits).toBe(false)
  })

  it('a model near the budget is kept while the numbers move a little', () => {
    const runs = (phrase: number) => ({ fingerprint: 'fp', runs: { [runKey('small', 'cpu', 'int8')]: { phrase, rtf: 0.2 } } })
    const kk = { native: 'kk' }
    expect(planSpeech(input({ ...kk, bench: runs(1.6), downloaded: ['small', 'base'] })).dictation.chosen.model).toBe('base')
    expect(planSpeech(input({ ...kk, bench: runs(1.6), downloaded: ['small', 'base'], previous: { dictation: 'small' } })).dictation.chosen.model).toBe('small')
    expect(planSpeech(input({ ...kk, bench: runs(2.0), downloaded: ['small', 'base'], previous: { dictation: 'small' } })).dictation.chosen.model).toBe('base')
  })

  it('the hour counts speakers when their part is here', () => {
    const without = planSpeech(input()).transcripts.chosen.estimate
    const withSpeakers = planSpeech(input({ speakers: true })).transcripts.chosen.estimate
    expect(withSpeakers - without).toBeCloseTo(60 * 0.8, 1)
  })

  it('a Mac tells its speakers apart on the Neural Engine: its own guess, or its measurement', () => {
    const mac = { profile: m1, metal: true, languages: ['ja'], native: 'ja' }
    const without = planSpeech(input(mac)).transcripts.chosen.estimate
    expect(planSpeech(input({ ...mac, speakers: true })).transcripts.chosen.estimate - without).toBeCloseTo(60 * 0.0125, 3)
    expect(planSpeech(input(mac)).speakers.cpu).toBe(1)
    const bench = { fingerprint: 'fp', runs: { 'speakers|ane': { rtf: 0.05 } } }
    expect(planSpeech(input({ ...mac, bench })).speakers.cpu).toBe(3)
  })

  it('tests the downloaded models not yet measured, the smallest first, and remembers a decline by them', () => {
    const bench = { fingerprint: 'fp', runs: { [runKey('small', 'cpu', 'int8')]: { phrase: 1.4, rtf: 0.2 } } }
    const i = input({ bench, downloaded: ['large-v3-turbo', 'small', 'base', 'parakeet-tdt-0.6b-v3'] })
    const plan = planSpeech(i)
    expect(testRuns(i, plan)).toEqual([
      { model: 'base', device: 'cpu', beam: 2 },
      { model: 'parakeet-tdt-0.6b-v3', device: 'cpu', beam: 2 },
      { model: 'large-v3-turbo', device: 'cpu', beam: 2 },
    ])
    expect(testKey(i, plan)).toBe('fp|cpu|base,small,parakeet-tdt-0.6b-v3,large-v3-turbo')
    // On a card's computer each is measured where it runs.
    const card = input({ cuda: true, downloaded: ['large-v3-turbo', 'parakeet-tdt-0.6b-v3'] })
    expect(testRuns(card, planSpeech(card))).toEqual([
      { model: 'parakeet-tdt-0.6b-v3', device: 'cpu', beam: 2 },
      { model: 'large-v3-turbo', device: 'cuda', compute: 'float16', beam: 5 },
    ])
  })
})

describe('the numbers as said', () => {
  it('seconds and minutes', () => {
    expect(seconds(0.43)).toBe('0.4 s')
    expect(seconds(12.4)).toBe('12 s')
    expect(minutes(12.4)).toBe('12 min')
    expect(minutes(70)).toBe('1 h 10 min')
    expect(minutes(120)).toBe('2 h')
  })

  it('a laptop of four cores is about twice slower than the reference desktop', () => {
    expect(cpuFactor(weakLaptop)).toBeCloseTo(1.98, 2)
    expect(cpuFactor(i9)).toBe(1)
  })
  it('an Apple silicon Mac transcribes with turbo, not the tiny it happens to have, and dictates with Parakeet', () => {
    for (const mac of [
      { cpu: { name: 'Apple M1', cores: 6, threads: 8 }, ramGb: 8, gpus: [{ name: 'Apple M1 GPU', vendor: 'other' as const, vramMb: 0, driver: '' }], laptop: true, at: 1 },
      { cpu: { name: 'Apple M2 Pro', cores: 8, threads: 10 }, ramGb: 16, gpus: [], laptop: true, at: 1 },
    ]) {
      for (const downloaded of [[], ['tiny'], ['tiny', 'parakeet-tdt-0.6b-v3']]) {
        const plan = planSpeech(input({ profile: mac, downloaded, languages: ['ru', 'en'], previous: { transcripts: 'tiny' } }))
        expect(plan.transcripts.chosen.model).toBe('large-v3-turbo')
        expect(plan.dictation.chosen.model).toBe('parakeet-tdt-0.6b-v3')
      }
    }
  })
})
