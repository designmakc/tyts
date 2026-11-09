// The first-run setup's advice: what to download on this computer, and what
// the person's choice costs; and the Models page's Use recommended, the models
// advised here in place of the ones picked. Pure, so the window and the tests
// share it. The numbers come from the app's snapshot: the speech plan
// (speechplan.ts), the parts' sizes (speechhost.ts view), the voice's and the
// translator's size.

import { translationAdvice } from './hardware'
import { languageName, levelName, sizeText, t } from './i18n'
import { scriptFor } from './languages'
import { NATURAL_PREFIX } from './natural'
import type { AppView } from './protocol'
import type { Settings, TranslationLevel } from './settings'
import type { SpeechPart } from './speechpack'
import { minutes, seconds } from './speechplan'

/** What the person takes from the setup: the switches of its third step, and the test of its fourth. */
export type Choice = {
  voice: 'natural' | 'windows'
  autoFix: boolean
  layoutBadge: boolean
  gpu: boolean
  dictate: boolean
  transcribe: boolean
  speakers: boolean
  /** Where who spoke when runs: the graphics card (PyTorch for it, large) or the processor (small, slow). */
  speakersOn: 'cuda' | 'cpu'
  startWithWindows: boolean
  /** Run the speed test once the models are here. */
  test: boolean
}

/** One piece of advice: whether to turn it on, and why, in a few words. */
export type Advice = { on: boolean; why: string }

export type Recommendation = Record<'voice' | 'autoFix' | 'gpu' | 'dictate' | 'transcribe' | 'speakers' | 'startWithWindows', Advice>

/** A few cores cannot make the natural voice faster than it speaks: a Windows voice is instant. */
const VOICE_CORES = 4
/** The word dictionary's download, roughly (a gzipped JSON; the store does not know its size). */
const DICTIONARY_MB = 5

/** What this computer is good for, from the plan and the profile; the chips and the switches' first state. */
export function recommend(v: AppView): Recommendation {
  const s = v.speech
  const d = s.device
  const plan = s.plan
  const cyrillic = scriptFor(v.settings.native) === 'Cyrillic'
  const weak = d.cpu.cores < VOICE_CORES
  const chosen = plan.transcripts.chosen
  const hourCpu = minutes(chosen.estimate)
  // The planner always finds a model that keeps the time; a meeting needs a good one too.
  const rough = chosen.model === 'tiny' || chosen.model === 'base'
  return {
    voice: weak ? { on: false, why: t('setup.why.voiceWeak') } : { on: true, why: t('setup.why.voice') },
    autoFix: cyrillic ? { on: true, why: t('setup.why.autoFix', { lang: languageName(v.settings.native) }) } : { on: false, why: t('setup.why.autoFixLatin') },
    gpu: plan.offers.gpu
      ? { on: true, why: t('setup.why.gpu', { card: seconds(s.firstModel.cuda.phrase), cpu: seconds(s.firstModel.cpu.phrase) }) }
      : { on: false, why: d.at ? t('setup.why.noGpu') : t('setup.lookingCard') },
    dictate: { on: true, why: t('setup.why.dictate', { model: s.firstModel.cpu.model, time: seconds(s.firstModel.cpu.phrase) }) },
    transcribe:
      chosen.fits && !rough
        ? { on: true, why: t(plan.offers.gpu ? 'setup.why.transcribeCard' : 'setup.why.transcribe', { model: chosen.label, time: hourCpu }) }
        : { on: false, why: t(rough ? 'setup.why.transcribeRough' : 'setup.why.transcribeSlow', { model: chosen.label, time: hourCpu }) },
    // A Mac tells the voices apart on its own chip, quickly and with a small download (2026-11-09).
    speakers: v.speech.speakers.ane
      ? { on: true, why: t('setup.why.speakersMac', { time: minutes(plan.speakers.cpu) }) }
      : plan.offers.speakersGpu && plan.speakers.cuda !== undefined
        ? { on: true, why: t('setup.why.speakers', { time: minutes(plan.speakers.cuda) }) }
        : { on: false, why: t('setup.why.speakersSlow', { time: minutes(plan.speakers.cpu) }) },
    startWithWindows: { on: true, why: t('setup.why.startWithWindows') },
  }
}

/** The choice the setup starts with: the advice, turned on. */
export function recommendedChoice(v: AppView): Choice {
  const r = recommend(v)
  return {
    voice: r.voice.on ? 'natural' : 'windows',
    autoFix: r.autoFix.on,
    layoutBadge: false,
    gpu: r.gpu.on,
    dictate: r.dictate.on,
    transcribe: r.transcribe.on,
    speakers: r.speakers.on && r.transcribe.on,
    speakersOn: v.speech.plan.speakers.advised,
    startWithWindows: true,
    test: true,
  }
}

/** One thing to download: its name, what it is for, its size (0: here already). */
export type Item = {
  key: 'translator' | 'dictionary' | 'voice' | 'engine' | `model:${string}`
  label: string
  note: string
  mb: number
}

export type Cost = {
  items: Item[]
  /** To download, and what stays on the disk, in MB. */
  download: number
  disk: number
  /** The engine's parts and the models the choice needs (the ones not here yet). */
  parts: SpeechPart[]
  models: string[]
  /** The disk has room (unknown free space counts as room). */
  fits: boolean
}

const speechNeeded = (c: Choice) => c.dictate || c.transcribe

/** Where the choice's speakers would run: the card only with its part chosen and room on it, else the processor. */
export function speakersWhere(c: Choice, v: AppView): 'cuda' | 'cpu' {
  return c.speakersOn === 'cuda' && c.gpu && v.speech.pack.nvidia && v.speech.plan.offers.speakersGpu ? 'cuda' : 'cpu'
}

/** What a choice costs on this computer, item by item. */
export function cost(c: Choice, v: AppView): Cost {
  const s = v.speech
  const items: Item[] = []
  let disk = 0
  const tr = v.translatorState
  if (tr.status !== 'unsupported') {
    const mb = tr.status === 'ready' ? 0 : tr.size
    const pair = t('lang.pairEnglish', { lang: languageName(v.settings.native) })
    items.push({ key: 'translator', label: t('setup.item.translator', { pair }), note: mb ? t('setup.item.translatorNote') : t('setup.hereAlready'), mb })
    disk += mb
  }
  const dict = v.dictionary.status
  if (dict !== 'none') {
    const mb = dict === 'ready' ? 0 : DICTIONARY_MB
    items.push({ key: 'dictionary', label: t('setup.item.dictionary'), note: mb ? t('setup.item.dictionaryNote') : t('setup.hereAlready'), mb })
    disk += mb
  }
  if (c.voice === 'natural') {
    const here = v.natural.status === 'ready'
    items.push({ key: 'voice', label: t('setup.item.voice'), note: here ? t('setup.hereAlready') : t('setup.item.voiceNote'), mb: here ? 0 : v.natural.size })
    if (!here) disk += v.natural.size
  }
  const parts: SpeechPart[] = []
  const models: string[] = []
  if (speechNeeded(c)) {
    const have = new Set(s.pack.parts)
    const wanted: SpeechPart[] = ['core', ...(c.gpu && s.pack.nvidia ? (['gpu'] as SpeechPart[]) : []), ...(c.transcribe && c.speakers ? (['speakers'] as SpeechPart[]) : [])]
    for (const part of wanted) if (!have.has(part)) parts.push(part)
    // The speakers' PyTorch for the card carries the card's libraries itself: with it, the card's part costs nothing more.
    const where = speakersWhere(c, v)
    const cardInside = where === 'cuda' && wanted.includes('speakers')
    const size = (p: SpeechPart, kind: 'download' | 'installed') =>
      p === 'speakers' ? s.speakers.sizes[where][kind] : p === 'gpu' && cardInside ? 0 : s[kind][p]
    const mb = parts.reduce((n, p) => n + size(p, 'download'), 0)
    const onDisk = parts.reduce((n, p) => n + size(p, 'installed'), 0)
    const names = { core: t('setup.item.core'), gpu: t('setup.item.gpu'), speakers: t('setup.item.speakers') }
    items.push({
      key: 'engine',
      label: t('setup.item.engine'),
      note: parts.length ? t('setup.item.engineNote', { parts: parts.map(p => names[p]).join(', '), size: t('size.mb', { n: Math.round(onDisk) }) }) : t('setup.hereAlready'),
      mb,
    })
    disk += onDisk
    const downloaded = new Set(s.health?.downloaded ?? s.plan.dictation.choices.filter(x => x.downloaded).map(x => x.model))
    const want = [...(c.dictate ? [s.plan.dictation.chosen] : []), ...(c.transcribe ? [s.plan.transcripts.chosen] : [])]
    for (const m of want) {
      if (models.includes(m.model)) continue
      models.push(m.model)
      const here = downloaded.has(m.model) || m.downloaded
      items.push({ key: `model:${m.model}`, label: m.label, note: here ? t('setup.hereAlready') : m.about, mb: here ? 0 : m.mb })
      if (!here) disk += m.mb
    }
  }
  const download = items.reduce((n, i) => n + i.mb, 0)
  const free = s.disk.freeMb
  return { items, download, disk, parts, models: models.filter(m => !(s.health?.downloaded ?? []).includes(m)), fits: free <= 0 || free >= disk * 1.1 }
}

// ---------------------------------------------------------------- Use recommended

/** One change Use recommended makes, in words: what, from and to, and the MB it downloads. */
export type ModelChange = { what: string; from: string; to: string; mb: number }

/**
 * Use recommended on this computer: the settings to save, each change in words,
 * what it downloads in all (MB), and what to fetch: the language model a change
 * gives Translate or Check, the natural voice, the speech engine's parts (the
 * graphics card's; the speakers' moved to where they are advised).
 */
export type ModelAdvice = { patch: Partial<Settings>; changes: ModelChange[]; download: number; model: boolean; natural: boolean; parts: SpeechPart[] }

/** Where who spoke when runs, as a change names it: graphics card, processor. */
const placeName = (on: 'cuda' | 'cpu') => t(on === 'cuda' ? 'busy.card' : 'busy.processor')

/** The models advised here in place of the ones picked; nothing changes what already is as advised. */
export function recommendedModels(v: AppView): ModelAdvice {
  const s = v.settings
  const sp = v.speech
  const r = recommend(v)
  const patch: Partial<Settings> = {}
  const changes: ModelChange[] = []
  const parts: SpeechPart[] = []
  const change = (what: string, from: string, to: string, mb = 0) => changes.push({ what, from, to, mb })
  const translate = t('kind.translate')

  // Translate and Check: the level the graphics card holds; without one Fast translates and Check keeps its model.
  const level: TranslationLevel = translationAdvice(sp.device).advised
  const model = level === 'fast' ? s.model : level
  if (level !== s.translationLevel) (patch.translationLevel = level), change(translate, levelName(s.translationLevel), levelName(level))
  if (model !== s.model) (patch.model = model), change(t('rec.check'), levelName(s.model), levelName(model))
  // A model given to Translate or Check comes with Apply, on the first line that names it.
  const fetchModel = (level !== 'fast' && patch.translationLevel !== undefined) || patch.model !== undefined ? v.models[model].status !== 'ready' && v.models[model].status !== 'downloading' : false
  const named = changes.find(c => c.to === levelName(model))
  if (fetchModel && named) named.mb = v.models[model].size
  const fast = changes.find(c => c.what === translate && level === 'fast')
  if (fast && v.translation.fast.status !== 'ready' && v.translation.fast.status !== 'downloading') fast.mb = v.translation.fast.size

  // Listen: the natural voice from four cores, else a Windows voice, which is instant.
  const ready = v.natural.status === 'ready'
  const natural = s.voice === '' ? ready : s.voice.startsWith(NATURAL_PREFIX)
  const windows = v.hostVoices.find(h => /^en\b/i.test(h.lang))?.name
  const voiceName = natural ? t('rec.naturalVoice') : s.voice || t('setup.windowsVoice')
  let fetchNatural = false
  if (r.voice.on && !natural) {
    // Automatic reads with the natural voice once it is here.
    if (s.voice) patch.voice = ''
    fetchNatural = !ready && v.natural.status !== 'downloading'
    change(t('rec.voice'), voiceName, t('rec.naturalVoice'), fetchNatural ? v.natural.size : 0)
  } else if (!r.voice.on && natural && windows) {
    patch.voice = windows
    change(t('rec.voice'), voiceName, windows)
  }

  // Voice typing and recordings: Automatic, accuracy first, on the graphics card when it can take them; who spoke when where advised.
  if (sp.pack.parts.includes('core')) {
    const features = [
      ['dictationModel', t('rec.dictate'), sp.plan.dictation],
      ['transcriptsModel', t('rec.transcribe'), sp.plan.transcripts],
    ] as const
    for (const [key, what, plan] of features) if (s[key]) (patch[key] = ''), change(what, plan.chosen.label, t('rec.automatic'))
    if (s.speechPrefer !== 'accuracy') (patch.speechPrefer = 'accuracy'), change(t('rec.speechModels'), t('rec.speed'), t('rec.accuracy'))
    if (r.gpu.on && sp.pack.nvidia && !sp.pack.parts.includes('gpu')) parts.push('gpu'), change(t('rec.dictateTranscribe'), placeName('cpu'), placeName('cuda'), sp.download.gpu)
    if (s.speakersDevice !== 'auto') {
      patch.speakersDevice = 'auto'
      const now = sp.plan.offers.speakersGpu && s.speakersDevice !== 'cpu' ? 'cuda' : 'cpu'
      const then = sp.plan.offers.speakersGpu ? 'cuda' : 'cpu'
      const moving = sp.pack.parts.includes('speakers') && (sp.pack.speakersOn ?? 'cpu') !== then
      if (moving) parts.push('speakers')
      if (now !== then) change(t('setup.speakers'), placeName(now), placeName(then), moving ? sp.speakers.sizes[then].download : 0)
    }
  }
  return { patch, changes, download: changes.reduce((n, c) => n + c.mb, 0), model: fetchModel, natural: fetchNatural, parts }
}

/** 480 MB, 2.9 GB, in the interface's language (i18n's). */
export { sizeText }
