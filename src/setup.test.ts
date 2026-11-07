import { describe, expect, it } from 'vitest'

import type { DeviceProfile } from './hardware'
import type { AppView } from './protocol'
import { DEFAULTS } from './settings'
import { planSpeech } from './speechplan'
import { cost, recommend, recommendedChoice, recommendedModels } from './setup'

const i9: DeviceProfile = {
  cpu: { name: 'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz', cores: 8, threads: 16 },
  ramGb: 32,
  gpus: [{ name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia', vramMb: 8192, driver: '610.88', computeCap: 7.5 }],
  laptop: false,
  at: 1,
}

const laptop: DeviceProfile = {
  cpu: { name: 'Intel(R) Core(TM) i3-7020U', cores: 2, threads: 4 },
  ramGb: 8,
  gpus: [{ name: 'Intel(R) HD Graphics 620', vendor: 'intel', vramMb: 0, driver: '1' }],
  laptop: true,
  at: 1,
}

/** A snapshot of a fresh install on `profile`: nothing downloaded, the engine absent. */
function view(profile: DeviceProfile, over: Partial<AppView> = {}): AppView {
  const plan = planSpeech({ profile, fingerprint: 'fp', bench: undefined, cuda: false, speakersCuda: false, speakers: false, downloaded: [], native: 'ru', prefer: 'accuracy', pins: { dictation: '', transcripts: '' } })
  const nvidia = profile.gpus.some(g => g.vendor === 'nvidia')
  return {
    settings: { ...DEFAULTS, native: 'Russian', setupDone: false },
    version: '0.9.0',
    build: '',
    dev: false,
    natural: { status: 'absent', progress: 0, size: 170, dismissed: false },
    hostVoices: [],
    languages: [],
    words: [],
    keysOk: { snip: true, select: true, translate: true, text: true, inPlace: true, check: true, type: true, typeCheck: true, pause: true, window: true },
    learned: { alwaysFix: [], myWords: [] },
    translations: [],
    translator: 'absent',
    layouts: [],
    rivals: [],
    keyboardApps: [],
    foreignKeys: false,
    speech: {
      pack: { status: 'absent', parts: [], nvidia },
      service: 'off',
      port: 8765,
      download: { core: 160, gpu: 1150, speakers: plan.offers.speakersGpu ? 3000 : 250 },
      installed: { core: 330, gpu: 1700, speakers: plan.offers.speakersGpu ? 4000 : 900 },
      speakers: { on: plan.speakers.advised, sizes: { cuda: { download: 3000, installed: 4000 }, cpu: { download: 250, installed: 900 } }, model: false },
      firstModel: { cpu: { model: 'Parakeet', mb: 670, phrase: 0.3 }, cuda: { model: 'Whisper turbo', mb: 1600, phrase: 0.5 } },
      disk: { freeMb: 120_000, drive: 'C:' },
      device: profile,
      plan,
      test: { offer: false, agreed: false, runs: 0 },
      keysOk: { dictate: true, note: true, english: true, again: true, practice: true, talk: true, meeting: true, shot: true },
    },
    call: { state: 'idle', seconds: 0 },
    summaries: {},
    dictation: { recent: [] },
    translatorState: { status: 'absent', progress: 0, size: 84 },
    translation: { fast: { status: 'absent', progress: 0, size: 84 }, accurate: { status: 'absent', progress: 0, size: 5155 }, most: { status: 'absent', progress: 0, size: 6976 } },
    models: { accurate: { status: 'absent', progress: 0, size: 5155 }, most: { status: 'absent', progress: 0, size: 6976 } },
    modelSpeed: {},
    dictionary: { status: 'ready' },
    mistakes: [],
    ...over,
  }
}

describe('recommend', () => {
  it('an i9 with an RTX: everything on, the speakers on the card, the natural voice', () => {
    const r = recommend(view(i9))
    expect(r.voice.on).toBe(true)
    expect(r.autoFix.on).toBe(true)
    expect(r.gpu.on).toBe(true)
    expect(r.dictate.on).toBe(true)
    expect(r.transcribe.on).toBe(true)
    expect(r.speakers.on).toBe(true)
    expect(r.gpu.why).toMatch(/graphics card/)
  })

  it('a two-core laptop: a Windows voice, dictation yes, transcripts with turbo in time, speakers and the card not advised', () => {
    const r = recommend(view(laptop))
    expect(r.voice.on).toBe(false)
    expect(r.dictate.on).toBe(true)
    expect(r.transcribe.on).toBe(true)
    expect(r.transcribe.why).toMatch(/an hour/)
    expect(r.speakers.on).toBe(false)
    expect(r.gpu.on).toBe(false)
  })

  it('one core: only a rough model keeps the time, so transcripts are possible but not advised', () => {
    const r = recommend(view({ ...laptop, cpu: { name: 'Celeron', cores: 1, threads: 2 } }))
    expect(r.transcribe.on).toBe(false)
    expect(r.transcribe.why).toMatch(/rough/)
  })

  it('a Latin-script language does not get the layout fixer by default', () => {
    const v = view(i9)
    v.settings.native = 'German'
    expect(recommend(v).autoFix.on).toBe(false)
  })
})

describe('cost', () => {
  it('adds up what the recommended choice downloads on the i9, and the disk has room', () => {
    const v = view(i9)
    const c = cost(recommendedChoice(v), v)
    const keys = c.items.map(i => i.key)
    expect(keys).toContain('translator')
    expect(keys).toContain('voice')
    expect(keys).toContain('engine')
    expect(c.parts).toEqual(['core', 'gpu', 'speakers'])
    expect(c.download).toBeGreaterThan(84 + 170 + 160 + 1150 + 3000)
    expect(c.fits).toBe(true)
    // The dictionary is here: listed, free.
    expect(c.items.find(i => i.key === 'dictionary')?.mb).toBe(0)
  })

  it('a small disk does not fit the engine; without speech it fits', () => {
    const v = view(i9, { speech: { ...view(i9).speech, disk: { freeMb: 2000, drive: 'C:' } } })
    const full = cost(recommendedChoice(v), v)
    expect(full.fits).toBe(false)
    const light = cost({ ...recommendedChoice(v), dictate: false, transcribe: false, speakers: false }, v)
    expect(light.parts).toEqual([])
    expect(light.fits).toBe(true)
  })

  it('who spoke when on the card carries the card’s part; on the processor it is small', () => {
    const v = view(i9)
    const engine = (c: ReturnType<typeof cost>) => c.items.find(i => i.key === 'engine')?.mb
    const onCard = cost({ ...recommendedChoice(v), speakersOn: 'cuda' }, v)
    expect(engine(onCard)).toBe(160 + 3000)
    const onCpu = cost({ ...recommendedChoice(v), speakersOn: 'cpu' }, v)
    expect(engine(onCpu)).toBe(160 + 1150 + 250)
    expect(onCpu.parts).toEqual(['core', 'gpu', 'speakers'])
    // Without the card's part, the card cannot run them: the processor's size.
    expect(engine(cost({ ...recommendedChoice(v), gpu: false, speakersOn: 'cuda' }, v))).toBe(160 + 250)
  })

  it('advises the card for the voices on the i9, with the minutes for each way', () => {
    const v = view(i9)
    expect(recommendedChoice(v).speakersOn).toBe('cuda')
    expect(v.speech.plan.speakers.cuda).toBeLessThan(5)
    expect(v.speech.plan.speakers.cpu).toBeGreaterThan(30)
  })

  it('parts already installed and a ready translator cost nothing', () => {
    const base = view(i9)
    const v = view(i9, { translatorState: { status: 'ready', progress: 1, size: 84 }, speech: { ...base.speech, pack: { status: 'ready', parts: ['core', 'gpu'], nvidia: true } } })
    const c = cost({ ...recommendedChoice(v), speakers: false }, v)
    expect(c.items.find(i => i.key === 'translator')?.mb).toBe(0)
    expect(c.parts).toEqual([])
  })
})

describe('recommendedModels', () => {
  /** The engine installed here, with these parts. */
  const withEngine = (v: AppView, parts: AppView['speech']['pack']['parts'], speakersOn?: 'cuda' | 'cpu'): AppView => ({
    ...v,
    speech: { ...v.speech, pack: { ...v.speech.pack, status: 'ready', parts, ...(speakersOn ? { speakersOn } : {}) } },
  })

  it('an RTX 2080 SUPER of 8 GB: Accurate for Translate and Check, downloaded once; Automatic speech; the natural voice', () => {
    const base = view(i9)
    const v = withEngine({ ...base, settings: { ...base.settings, dictationModel: 'large-v3', speechPrefer: 'speed' } }, ['core', 'gpu'])
    const a = recommendedModels(v)
    expect(a.patch).toEqual({ translationLevel: 'accurate', dictationModel: '', speechPrefer: 'accuracy' })
    expect(a.changes.map(c => `${c.what}: ${c.from} → ${c.to} ${c.mb}`)).toEqual([
      'Translate: Fast → Accurate 5155',
      'Voice: Windows voice → Natural voice 170',
      `Voice typing: ${v.speech.plan.dictation.chosen.label} → Automatic 0`,
      'Automatic speech models: Speed first → Accuracy first 0',
    ])
    expect(a.download).toBe(5155 + 170)
    expect(a.model).toBe(true)
    expect(a.natural).toBe(true)
    expect(a.parts).toEqual([])
  })

  it('a laptop without a card: Fast, a Windows voice in place of the natural one, the model left as it is', () => {
    const base = view(laptop)
    const v = {
      ...base,
      settings: { ...base.settings, translationLevel: 'accurate' as const, model: 'accurate' as const },
      natural: { ...base.natural, status: 'ready' as const },
      hostVoices: [{ name: 'Microsoft Zira Desktop', lang: 'en-US' }],
    }
    const a = recommendedModels(v)
    expect(a.patch).toEqual({ translationLevel: 'fast', voice: 'Microsoft Zira Desktop' })
    expect(a.changes.map(c => `${c.what}: ${c.from} → ${c.to} ${c.mb}`)).toEqual(['Translate: Accurate → Fast 84', 'Voice: Natural voice → Microsoft Zira Desktop 0'])
    expect(a.model).toBe(false)
  })

  it('what is as advised already changes nothing', () => {
    const base = view(i9)
    const v = { ...base, settings: { ...base.settings, translationLevel: 'accurate' as const }, natural: { ...base.natural, status: 'ready' as const }, models: { ...base.models, accurate: { status: 'ready' as const, progress: 1, size: 5155 } } }
    expect(recommendedModels(v)).toEqual({ patch: {}, changes: [], download: 0, model: false, natural: false, parts: [] })
  })

  it('the graphics card\'s part added, and who spoke when moved to the card', () => {
    const base = view(i9)
    const v = withEngine({ ...base, settings: { ...base.settings, speakersDevice: 'cpu' } }, ['core', 'speakers'], 'cpu')
    const a = recommendedModels(v)
    expect(a.parts).toEqual(['gpu', 'speakers'])
    expect(a.changes.filter(c => c.what !== 'Translate' && c.what !== 'Voice').map(c => `${c.what}: ${c.from} → ${c.to} ${c.mb}`)).toEqual([
      'Voice typing and recordings: processor → graphics card 1150',
      'Who spoke when: processor → graphics card 3000',
    ])
  })
})
