// The first-run setup: four steps in the window before Home is ever shown.
// Your language → this computer → what you need (with what is advised here,
// and what it costs) → Download, one button for everything, with the
// downloads' progress. Finish or Skip set `setupDone`; the window then goes
// to Home and plays the opening moment. The steps and the choice live here
// while the window lives (it only hides); the advice is setup.ts's.

import { cardText, mainCard, shortCpu } from '../hardware'
import { languageName, t } from '../i18n'
import { LANGUAGES } from '../languages'
import type { AppView, ToHost } from '../protocol'
import type { Settings } from '../settings'
import { cost, recommend, recommendedChoice, sizeText, speakersWhere, type Advice, type Choice, type Item } from '../setup'
import { minutes, seconds } from '../speechplan'
import { el } from './dom'
import { lucide, type LucideName } from './lucide'
import { installed, running } from './speech'
import { aside, bad, bar, btn, card, chip, grp, ib, linkBtn, recommended, seg, select, toggleCard, twoNames, uiLanguageCard } from './ui'

export type SetupHooks = {
  save: (patch: Partial<Settings>) => void
  post: (message: ToHost) => void
  /** Draw the setup again after a step or a switch changed here. */
  redraw: () => void
}

const STEPS = [t('setup.step1'), t('setup.step2'), t('setup.step3'), t('setup.step4')] as const
const CAPS = [t('setup.cap1'), t('setup.cap2'), t('setup.cap3'), t('setup.cap4')] as const

let step = 1
let choice: Choice | undefined
/** Download was pressed: the fourth step shows the downloads going. */
let started = false
/** The language the first snapshot came with: Windows' own, marked as advised. */
let firstNative = ''

/** The setup is over (or begins again on another first run). */
export function resetSetup(): void {
  step = 1
  choice = undefined
  started = false
  firstNative = ''
}

/** A green chip saying this is the advice, with why under the card's title. */
function advised(node: HTMLElement, a: Advice): HTMLElement {
  if (!a.on) return node
  const l = node.querySelector('.l')
  const first = l?.querySelector('small')
  const mark = recommended()
  if (l) l.insertBefore(mark, first ?? null)
  return node
}

export function setupNodes(v: AppView, h: SetupHooks): HTMLElement[] {
  if (!firstNative) firstNative = v.settings.native
  const c = (choice ??= recommendedChoice(v))
  const r = recommend(v)
  const body = step === 1 ? languageStep(v, h) : step === 2 ? computerStep(v, h, c, r) : step === 3 ? needStep(v, h, c, r) : downloadStep(v, h, c)
  const go = (to: number) => {
    step = Math.max(1, Math.min(4, to))
    h.redraw()
  }
  const finish = () => h.save({ setupDone: true, speechTestAgreed: c.test })
  const skip = () => h.save({ setupDone: true })
  const download = () => {
    start(v, h, c)
    started = true
    go(4)
  }
  const room = step === 3 ? cost(c, v).fits : true
  const next =
    step === 3
      ? btn([lucide('download', 's'), t('setup.download')], download, 'primary')
      : step === 4
        ? btn(t('setup.finish'), finish, 'primary')
        : btn([t('setup.next'), lucide('chevron-right', 's')], () => go(step + 1), 'primary')
  if (!room) next.disabled = true
  return [
    el(
      'div',
      { class: 'shead' },
      el('div', { class: 'sprog' }, ...STEPS.map((_, i) => el('i', { class: i + 1 === step ? 'on' : i + 1 < step ? 'done' : '' })), el('span', {}, t('setup.stepOf', { step, total: STEPS.length }))),
      el('div', { class: 'stitle-line' }, el('span', { class: 'stitle' }, STEPS[step - 1]), el('span', { class: 'scap' }, CAPS[step - 1])),
      el('div', { class: 'sline' }),
    ),
    el('div', { class: 'sbody' }, ...body),
    el(
      'div',
      { class: 'sfoot' },
      step > 1 && !(step === 4 && started) ? linkBtn(t('setup.back'), () => go(step - 1)) : null,
      el('span', { class: 'gap' }),
      step < 4 ? linkBtn(t('setup.skip'), skip) : null,
      next,
    ),
  ]
}

// ---------------------------------------------------------------- 1 · your language

function languageStep(v: AppView, h: SetupHooks): HTMLElement[] {
  const s = v.settings
  const nameOf = (code: string) => LANGUAGES.find(l => l.code === code)?.name ?? code
  const used =[s.native, 'English', ...s.languages.map(nameOf)]
  const rest = LANGUAGES.filter(l => !used.includes(l.name))
  const own = card(
    'languages',
    t('setup.step1'),
    [t('setup.languageNote')],
    select(
      s.native,
      v.languages.map(l => [l.name, twoNames(l.native, languageName(l.name))]),
      native => {
        choice = undefined
        h.save({ native })
      },
    ),
  )
  if (s.native === firstNative) advised(own, { on: true, why: '' })
  return [
    uiLanguageCard(s.uiLanguage, uiLanguage => h.save({ uiLanguage })),
    grp(t('setup.step1')),
    own,
    s.native === firstNative ? aside('info', t('setup.windowsIn', { lang: languageName(s.native) })) : null,
    grp(t('setup.otherLanguages')),
    card(
      'plus',
      t('setup.addLanguage'),
      [t('setup.addLanguageNote')],
      select<string>('', [['', t('setup.pickLanguage')], ...rest.map((l): [string, string] => [l.code, twoNames(languageName(l.name), l.native)])], code => code && h.save({ languages: [...s.languages, code] })),
    ),
    card('globe', languageName('English'), [t('setup.always')], null),
    ...s.languages.map(code => card('globe', languageName(nameOf(code)), [], ib('x', t('ui.remove', { item: languageName(nameOf(code)) }), () => h.save({ languages: s.languages.filter(x => x !== code) })))),
  ].filter((n): n is HTMLElement => n !== null)
}

// ---------------------------------------------------------------- 2 · this computer

function computerStep(v: AppView, h: SetupHooks, c: Choice, r: ReturnType<typeof recommend>): HTMLElement[] {
  const s = v.speech
  const d = s.device
  const looking = d.at === 0
  const gpu = mainCard(d)
  const spin = () => el('i', { class: 'spin' })
  const cardNote = looking ? el('small', { class: 'kstate busy' }, spin(), t('setup.lookingCard')) : gpu ? cardText(gpu) : t('setup.noCard')
  const onCard = s.plan.offers.gpu && c.gpu
  const verdict = onCard
    ? card('sparkles', t('setup.onCard'), [t('setup.onCardNote', { time: seconds(s.firstModel.cuda.phrase), model: s.firstModel.cuda.model })], null)
    : card('sparkles', t('setup.onCpu'), [t('setup.onCpuNote', { time: seconds(s.firstModel.cpu.phrase), model: s.firstModel.cpu.model, hour: minutes(s.plan.transcripts.chosen.estimate) })], null)
  verdict.classList.add('total')
  return [
    grp(t('setup.hardware')),
    card(
      'cpu',
      t('setup.processor'),
      [
        looking
          ? el('small', { class: 'kstate busy' }, spin(), t('setup.cpuLooking', { cpu: shortCpu(d.cpu.name) }))
          : t('setup.cpuCores', { cpu: shortCpu(d.cpu.name), n: d.cpu.cores }) + (d.laptop ? ` · ${t('setup.laptop')}` : ''),
      ],
      null,
    ),
    card('memory-stick', t('setup.memory'), [t('size.gb', { n: d.ramGb })], null),
    card('monitor', t('setup.graphicsCard'), [cardNote], null),
    grp(t('setup.means')),
    verdict,
    s.plan.offers.gpu
      ? advised(
          toggleCard(
            'monitor',
            t('setup.useCard'),
            c.gpu,
            on => {
              c.gpu = on
              h.redraw()
            },
            r.gpu.why,
          ),
          r.gpu,
        )
      : null,
    looking ? aside('info', t('setup.stillLooking')) : null,
  ].filter((n): n is HTMLElement => n !== null)
}

// ---------------------------------------------------------------- 3 · what you need

function needStep(v: AppView, h: SetupHooks, c: Choice, r: ReturnType<typeof recommend>): HTMLElement[] {
  const s = v.speech
  const tr = v.translatorState
  const pair = t('lang.pairEnglish', { lang: languageName(v.settings.native) })
  const flip = (key: keyof Choice) => (on: boolean) => {
    ;(c as unknown as Record<string, unknown>)[key] = on
    if (key === 'transcribe' && !on) c.speakers = false
    h.redraw()
  }
  const translatorNote =
    tr.status === 'unsupported' ? t('setup.noTranslator') : tr.status === 'ready' ? t('setup.translatorHere', { pair }) : t('setup.translatorOnce', { pair, size: sizeText(tr.size) })
  const dictNote = { ready: t('setup.dictReady'), absent: t('setup.dictOnce'), downloading: t('setup.dictComing'), failed: t('setup.dictOnce'), none: t('setup.dictNone') }[v.dictionary.status]
  const engineMb = s.download.core + (c.gpu && s.pack.nvidia ? s.download.gpu : 0)
  const dictateModel = s.plan.dictation.chosen
  const transcribeModel = s.plan.transcripts.chosen
  const all = cost(c, v)
  const total = card(
    'hard-drive',
    t('setup.toDownload', { size: sizeText(all.download) }),
    [
      `${t('setup.onDisk', { size: sizeText(all.disk) })} · ${s.disk.freeMb > 0 ? t('setup.freeOn', { size: sizeText(s.disk.freeMb), drive: s.disk.drive }) : t('setup.freeUnknown')}`,
      all.fits ? null : bad(t('setup.noRoom')),
    ],
    null,
  )
  total.classList.add('total')
  if (!all.fits) total.classList.add('bad')
  return [
    grp(t('setup.alwaysGroup')),
    card('languages', t('setup.listenTranslate'), [translatorNote, dictNote], el('span', { class: 'chip' }, t('setup.alwaysOn'))),
    advised(
      card(
        'volume-2',
        t('setup.voice'),
        [r.voice.why],
        seg<Choice['voice']>(
          c.voice,
          [
            ['natural', v.natural.status === 'ready' ? t('setup.naturalHere') : t('setup.naturalSize', { size: sizeText(v.natural.size) })],
            ['windows', t('setup.windowsVoice')],
          ],
          voice => {
            c.voice = voice
            h.redraw()
          },
        ),
      ),
      { on: r.voice.on, why: '' },
    ),
    grp(t('setup.keyboard')),
    advised(toggleCard('keyboard', t('tray.autoFix'), c.autoFix, flip('autoFix'), r.autoFix.why), r.autoFix),
    toggleCard('type', t('tray.layoutBadge'), c.layoutBadge, flip('layoutBadge'), t('setup.badgeNote')),
    grp(t('setup.speech')),
    advised(
      toggleCard(
        'mic',
        t('dict.type'),
        c.dictate,
        flip('dictate'),
        t('setup.dictateNote', { why: r.dictate.why, engine: sizeText(engineMb), model: dictateModel.label, size: dictateModel.downloaded ? t('setup.here') : sizeText(dictateModel.mb) }),
      ),
      r.dictate,
    ),
    advised(
      toggleCard(
        'audio-lines',
        t('setup.transcribe'),
        c.transcribe,
        flip('transcribe'),
        t(c.dictate ? 'setup.transcribeNote' : 'setup.transcribeNoteEngine', {
          why: r.transcribe.why,
          model: transcribeModel.label,
          size: transcribeModel.downloaded ? t('setup.here') : sizeText(transcribeModel.mb),
          engine: sizeText(engineMb),
        }),
      ),
      r.transcribe,
    ),
    c.transcribe ? advised(toggleCard('users', t('setup.speakers'), c.speakers, flip('speakers'), `${r.speakers.why} · ${sizeText(s.speakers.sizes[speakersWhere(c, v)].download)}`), r.speakers) : null,
    // A Mac has no place to choose: its speakers run on its own chip.
    c.transcribe && c.speakers && !s.speakers.ane ? speakersOnCard(v, h, c) : null,
    grp(t('app.name')),
    advised(toggleCard('power', t('setup.startWithWindows'), c.startWithWindows, flip('startWithWindows'), r.startWithWindows.why), r.startWithWindows),
    grp(t('setup.allOfIt')),
    total,
    aside('info', t('setup.keysLater')),
  ].filter((n): n is HTMLElement => n !== null)
}

/** Where who spoke when runs: the card (large, quick) or the processor (small, slow); the card only when it can. */
function speakersOnCard(v: AppView, h: SetupHooks, c: Choice): HTMLElement {
  const s = v.speech
  const where = speakersWhere(c, v)
  const time = (on: 'cuda' | 'cpu') => s.plan.speakers[on]
  const canCard = s.plan.offers.speakersGpu && c.gpu && s.pack.nvidia && time('cuda') !== undefined
  const note = t('setup.voicesHour', { time: minutes(time(where) ?? s.plan.speakers.cpu) })
  if (!canCard) return card('cpu', t('setup.runsOnCpu'), [note], null)
  const advice = s.plan.speakers.advised === 'cuda' ? t('setup.advisedCard') : t('setup.advisedCpu')
  const node = card(
    'cpu',
    t('setup.runsOn'),
    [note, where === s.plan.speakers.advised ? null : advice],
    seg<'cuda' | 'cpu'>(
      where,
      [
        ['cuda', `${t('setup.graphicsCard')} · ${sizeText(s.speakers.sizes.cuda.download)}`],
        ['cpu', `${t('setup.processor')} · ${sizeText(s.speakers.sizes.cpu.download)}`],
      ],
      on => {
        c.speakersOn = on
        h.redraw()
      },
    ),
  )
  return where === s.plan.speakers.advised ? advised(node, { on: true, why: '' }) : node
}

/** Download: the settings are saved, every download starts; the fourth step shows them. */
function start(v: AppView, h: SetupHooks, c: Choice): void {
  const all = cost(c, v)
  h.save({
    voice: '',
    naturalDismissed: c.voice === 'windows',
    autoFix: c.autoFix,
    layoutBadge: c.layoutBadge,
    startWithWindows: c.startWithWindows,
    speechTestAgreed: c.test,
    // The advice stays "automatic", so it follows the computer; another choice is kept as made.
    speakersDevice: speakersWhere(c, v) === v.speech.plan.speakers.advised ? 'auto' : speakersWhere(c, v),
  })
  const t = v.translatorState.status
  if (t === 'absent' || t === 'failed') h.post({ type: 'prepareTranslator' })
  const d = v.dictionary.status
  if (d === 'absent' || d === 'failed') h.post({ type: 'prepareDictionary' })
  if (c.voice === 'natural' && (v.natural.status === 'absent' || v.natural.status === 'failed')) h.post({ type: 'downloadNatural' })
  if (c.dictate || c.transcribe) {
    if (all.parts.length === 0 && running(v)) for (const model of all.models) h.post({ type: 'downloadSpeechModel', model })
    else if (all.parts.length || all.models.length) h.post({ type: 'installSpeech', parts: all.parts.length ? all.parts : ['core'], models: all.models })
  }
}

// ---------------------------------------------------------------- 4 · download

function downloadStep(v: AppView, h: SetupHooks, c: Choice): HTMLElement[] {
  const all = cost(c, v)
  const rows = all.items.map(item => itemRow(item, v, h))
  return [
    grp(started ? t('setup.downloading') : t('setup.toDownloadGroup'), all.items.length),
    ...rows,
    grp(t('setup.then')),
    advised(
      toggleCard(
        'play',
        t('setup.test'),
        c.test,
        on => {
          c.test = on
          h.save({ speechTestAgreed: on })
        },
        t('setup.testNote'),
      ),
      { on: true, why: '' },
    ),
    aside('info', started ? t('setup.canClose') : t('setup.notStarted')),
  ].filter((n): n is HTMLElement => n !== null)
}

const done = (what: string) => el('small', { class: 'kstate ok' }, lucide('check', 's'), what)
const waiting = (what: string) => el('small', {}, what)

/** One download's line: here, coming (with its bar), failed (with Try again), or waiting its turn. */
function itemRow(item: Item, v: AppView, h: SetupHooks): HTMLElement {
  const s = v.speech
  const icons: Record<string, LucideName> = { translator: 'languages', dictionary: 'book-open', voice: 'volume-2', engine: 'cpu' }
  const icon = icons[item.key] ?? 'audio-lines'
  const pct = (p: number) => el('span', { class: 'pct' }, `${Math.round(p * 100)}%`)
  let note: HTMLElement | string = item.note
  let control: HTMLElement | null = null
  if (item.key === 'translator') {
    const tr = v.translatorState
    if (tr.status === 'ready') note = done(t('setup.here'))
    else if (tr.status === 'downloading') (note = bar(tr.progress)), (control = pct(tr.progress))
    else if (tr.status === 'failed') (note = bad(t('talk.downloadFailed'))), (control = linkBtn(t('common.tryAgain'), () => h.post({ type: 'prepareTranslator' })))
    else note = started ? waiting(t('setup.starting')) : item.note
  } else if (item.key === 'dictionary') {
    const d = v.dictionary.status
    if (d === 'ready') note = done(t('setup.here'))
    else if (d === 'downloading') note = waiting(t('setup.coming'))
    else if (d === 'failed') (note = bad(t('talk.downloadFailed'))), (control = linkBtn(t('common.tryAgain'), () => h.post({ type: 'prepareDictionary' })))
    else note = started ? waiting(t('setup.starting')) : item.note
  } else if (item.key === 'voice') {
    const n = v.natural
    if (n.status === 'ready') note = done(t('setup.here'))
    else if (n.status === 'downloading') (note = bar(n.progress)), (control = pct(n.progress))
    else if (n.status === 'failed') (note = bad(t('talk.downloadFailed'))), (control = linkBtn(t('common.tryAgain'), () => h.post({ type: 'downloadNatural' })))
    else note = started ? waiting(t('setup.starting')) : item.note
  } else if (item.key === 'engine') {
    const p = s.pack
    if (p.status === 'installing') (note = el('span', {}, bar(p.progress ?? 0), el('small', {}, p.step === 'tool' ? t('setup.pythonManager') : t('setup.packages')))), (control = pct(p.progress ?? 0))
    else if (installed(v) && !item.mb) note = done(t('setup.here'))
    else if (p.status === 'failed') (note = bad(p.message ?? t('setup.installFailed'))), (control = linkBtn(t('common.tryAgain'), () => h.post({ type: 'installSpeech', parts: cost(choice ?? recommendedChoice(v), v).parts })))
    else note = started ? waiting(t('setup.starting')) : item.note
  } else {
    const model = item.key.slice('model:'.length)
    const live = Object.values(s.health?.models ?? {}).find(m => m.name === model)
    if (item.mb === 0 || s.health?.downloaded?.includes(model)) note = done(t('setup.here'))
    else if (live?.state === 'downloading') (note = bar(live.progress ?? 0)), (control = pct(live.progress ?? 0))
    else note = started ? waiting(running(v) ? t('setup.next2') : t('setup.afterEngine')) : item.note
  }
  const row = card(icon, item.label, [note, item.mb ? `${sizeText(item.mb)}` : null], control)
  return row
}

/** A chip for a line that is always on. */
export const always = () => chip(t('setup.alwaysOn'))
