// Kryakl's settings, kept in settings.json in the app's folder
// (%APPDATA%\Kryakl). The learned language is English: the natural voice and
// the word dictionaries are English ones.

import { COPY_TWICE } from './hotkey'
import { isUiLanguage, type UiLanguage } from './i18n'
import { findLanguage, LANGUAGES } from './languages'
import type { WordHintMode } from './protocol'
import type { Prefer } from './speechplan'
import type { SummaryTemplate } from './summary'
import type { AppPart } from './typist'

/** A call recording by itself (callwatch.ts): off, asked, or at once. */
export type CallAuto = 'off' | 'ask' | 'record'
const CALL_AUTO: readonly CallAuto[] = ['off', 'ask', 'record']

/** A program by its .exe name (lower case): the parts of the keyboard helper left out there, and the layout it starts in ('' for none). */
export type AppRule = { exe: string; off: AppPart[]; layout: string }

export const APP_PARTS: readonly AppPart[] = ['fix', 'switch', 'badge', 'keys']

export const TARGET = 'English'

/** The reading speeds offered; 1.5 is the fastest the voices keep clear. */
export const RATES: readonly number[] = [0.75, 0.9, 1, 1.15, 1.3, 1.5]

export type ThemeMode = 'system' | 'light' | 'dark'

/** The sounds of a layout switch, media/switch/<name>-<1|2|3>.wav (English's note, then the others' lower): glass and pluck are Kenney's (CC0), string and duck Kryakl's own. */
export const SWITCH_SOUNDS = ['glass', 'pluck', 'string', 'duck'] as const
export type SwitchSound = (typeof SWITCH_SOUNDS)[number]

/** Kryakl's local language models (llmfiles.ts): Accurate is Gemma 4 E4B, Most accurate Gemma 4 12B; each translates and checks English. */
export type LlmModel = 'accurate' | 'most'
export type TranslationLevel = 'fast' | LlmModel
/** The learner's English for Talk, on the common European scale (CEFR): the duck keeps to it (duck.ts LEVELS). */
export type TalkLevel = 'A2' | 'B1' | 'B2'
/** The summary's templates (summary.ts) and the longest instruction of the person's own. */
export const SUMMARY_TEMPLATES: readonly SummaryTemplate[] = ['general', 'standup', 'interview', 'lecture', 'own']
export const SUMMARY_OWN_MAX = 500
/** The person's own summary templates, at most, and the longest name of one. */
export const SUMMARY_TEMPLATES_MAX = 20
export const TEMPLATE_NAME_MAX = 60
/** A recording's notes, at most (engine/app.py NOTES_MAX). */
export const NOTES_MAX = 20_000
/** A summary template of the person's own: its name and its instruction to the model. */
export type OwnTemplate = { name: string; text: string }
export const TALK_LEVELS: readonly TalkLevel[] = ['A2', 'B1', 'B2']
/** What the learner tells the duck about themselves, at most. */
export const TALK_ABOUT_MAX = 500
/** Text editing: how a dictated phrase is put right by the local model (dictedit.ts); `own` is the person's instruction. */
export type EditStyle = 'clean' | 'business' | 'aiTask' | 'list' | 'own'
export const EDIT_STYLES: readonly EditStyle[] = ['clean', 'business', 'aiTask', 'list', 'own']
export const EDIT_OWN_MAX = 500

/** The levels (and the models) as the pages and the card name them. */
export const LEVEL_NAMES: Readonly<Record<TranslationLevel, string>> = { fast: 'Fast', accurate: 'Accurate', most: 'Most accurate' }

export const CARD_WIDTH = { min: 320, max: 1200 }
/** A card's height cap set by hand; 0 is automatic (most of the screen). */
export const CARD_HEIGHT = { min: 160, max: 2400 }

export type Settings = {
  /** The person's own language, by its English name. */
  native: string
  /**
   * Other languages the person uses, by code, beyond their own and English
   * (always in): dictation, the translator's guess and the screen's text are
   * read as one of these.
   */
  languages: string[]
  /** "natural:<id>" for a natural voice, a system voice's name, or empty for Automatic. */
  voice: string
  rate: number
  /** Read the English aloud as soon as a card has it. */
  autoRead: boolean
  /** Listen reads one sentence and waits; the arrows step. */
  oneAtATime: boolean
  wordHint: WordHintMode
  /** A dotted line under the words outside the 3000 most common ones. */
  rareWords: boolean
  /** Light, dark, or as Windows is. */
  theme: ThemeMode
  /** The interface's language (i18n): English unless the person picks Ukrainian or Russian; never taken from Windows by itself. */
  uiLanguage: UiLanguage
  /** The card's width, and how tall it may grow (0: automatic), as last set by dragging its edge. */
  cardWidth: number
  cardHeight: number
  /** One key for every action: it opens Kryakl's menu by the text cursor, a letter picks (menu.ts); empty for none. */
  menuKey: string
  /**
   * Keys (hotkey.ts; empty for none): listen to the selection (Kryakl copies it), or to a piece of the screen;
   * Ctrl+C twice ("Control+C*2") may be the key of one action on the selection: select, translate, inPlace or check.
   */
  selectKey: string
  snipKey: string
  /** translate the selection, or a piece of the screen. */
  translateKey: string
  textKey: string
  /** Translate the selection in place: the translation pasted over it, no card. */
  inPlaceKey: string
  /** Check my English: the selection's mistakes in the card, set right, Paste over it (checker.ts). */
  checkKey: string
  /** An empty card to type into, from anywhere: the translator, the checker (the tray's Type to translate…, Check my English…). */
  typeKey: string
  typeCheckKey: string
  /** The keyboard: a key (hotkey.ts) that switches the layout to the next of `layouts`; empty for none. `switchOn` turns it and the layouts' own keys off without forgetting them. */
  switchKey: string
  switchOn: boolean
  /** The layouts that key goes through, in order, as Windows names them ("04090409"); empty: all of them. */
  layouts: string[]
  /** A key of each layout's own (layout id → key), going to it at once. */
  layoutKeys: Record<string, string>
  /** A word typed in the wrong layout is typed again in the right one, and the layout switched. */
  autoFix: boolean
  /** Fixing as one types also sets right two capitals at a word's start ("ПРивет") and a word typed with Caps Lock left on ("пРИВЕТ"). */
  fixTwoCaps: boolean
  fixCapsLock: boolean
  /** Words in capitals are left as typed. */
  keepCaps: boolean
  /** A word is fixed after a second without a key too, not only when it ends. */
  fixOnPause: boolean
  /** A quiet click when a word is fixed by itself. */
  fixSound: boolean
  /** A sound when the person switches the layout (Kryakl's keys or Windows' own), `switchSoundName`, a note of its own for each layout. */
  switchSound: boolean
  switchSoundName: SwitchSound
  /** Kryakl learns from the person's typing (learning.ts): words fixed by hand, words of theirs. */
  learn: boolean
  /** A key that types the words at the end, typed in the wrong layout, again in the right one (again: the next layout), or converts the selection; empty for none. `fixKeyOn` turns it off without forgetting it. */
  fixKey: string
  fixKeyOn: boolean
  /** Programs with parts of the keyboard helper left out, or a layout of their own. */
  apps: AppRule[]
  /** Words, as typed (lower case), never fixed by themselves: the ones a fix was taken back from, or added by hand. */
  keepWords: string[]
  /** A badge with the layout by the text cursor whenever the layout (or Caps Lock) changes. */
  layoutBadge: boolean
  /** The tray icon shows the layout in front, as a keycap ("en"). */
  trayLayout: boolean
  /** Nothing of the keyboard helper while a program fills the screen (a game, a presentation, a video). */
  quietFullScreen: boolean
  /** The panel at the top of the screen (edgepanel.ts): the pointer resting at the top middle shows it. Off by default. */
  edgePanel: boolean
  /** A key that pauses Kryakl and resumes it; a key that opens its window. Empty for none. */
  pauseKey: string
  windowKey: string
  /**
   * Dictate's keys (hotkey.ts notation; empty for none): type what is said where the
   * cursor is, type it in English, or keep it as a note in the knowledge base. They
   * work once the speech engine is installed.
   */
  dictateKey: string
  englishKey: string
  noteKey: string
  /** Types the last dictated phrase again where the cursor is (dictationlog.ts); empty for none. */
  againKey: string
  /** Practice: a phrase spoken in English, checked in the card (Check my English) instead of typed. */
  practiceKey: string
  /** Talk to the duck (talk.ts): opens the window on Talk and listens; pressed again, sends what was said; while the duck speaks, stops it and listens. */
  talkKey: string
  /** Records a call (capture.ts): all of the computer's sound and the microphone; pressed again, stops and saves. None by default. */
  meetingKey: string
  /** A screenshot of the screen now, while a call records (marked manual, always kept). None by default; Electron's keys only (no double taps). */
  shotKey: string
  /** While a call records, a screenshot every 4 s when the screen changed, beside the sound. Off by default. */
  callShots: boolean
  /** While a call records, a rough draft of its words on the panel (engine live.py, the dictation model on the processor). Off by default. */
  callLive: boolean
  /** The reminder that the others' consent is needed was shown once, before the first call recording. */
  callConsentSeen: boolean
  /** A known call program holding the microphone 10 s (callwatch.ts): nothing, a question, or a recording at once. Off by default. */
  callAuto: CallAuto
  /** Where the call panel sits, as `dictationBadge` (its own place, not the badge's). */
  callPanelOffset: { dx: number; dy: number }
  /** A recorded call's summary is made as soon as it is transcribed, when the model is downloaded. */
  callSummaryAuto: boolean
  /** The template of a summary made by itself and the first one picked on a page. */
  callTemplate: SummaryTemplate
  /** The person's own instruction for the template `own` (SUMMARY_OWN_MAX characters at most). */
  callOwn: string
  /** The person's own summary templates, picked in the calls window's Summary. */
  callTemplates: OwnTemplate[]
  /** Summaries are written in the person's language instead of the meeting's. */
  callSummaryMine: boolean
  /** Experimental: names for a call's speakers read off its screenshots, offered as hints, never applied by themselves. Off by default. */
  callNames: boolean
  /** Talk: the duck's answers are read aloud as they come. */
  talkAloud: boolean
  /** The talk window (webview/talk.ts) stays over other windows: its pin. */
  talkOnTop: boolean
  /** Talk: the learner's English level, which the duck speaks at. */
  talkLevel: TalkLevel
  /** Talk: what the learner told the duck about themselves (a name, work, interests); the duck reads it in every talk. */
  talkAbout: string
  /** Text editing: each dictated phrase goes through the local model before it is typed; off until the person turns it on. */
  dictateEdit: boolean
  dictateEditStyle: EditStyle
  /** Their own instruction, for the style `own`. */
  dictateEditOwn: string
  /** Where the talk window was last left, in screen pixels; none until it is moved or sized (it opens by the bottom right of the screen). */
  talkBounds: { x: number; y: number; width: number; height: number } | null
  /**
   * Where the dictation badge sits: its bottom centre from the bottom centre of
   * the work area of the screen being typed in, in CSS pixels, as the person
   * last dropped it (0, 0 is 12 px above the taskbar's edge, in the middle).
   */
  dictationBadge: { dx: number; dy: number }
  /** The badge shows while a phrase is dictated; off, only the tray's red dot does, and the badge comes up only to say what went wrong. */
  dictationPanel: boolean
  /** Hold a dictation key to talk: the release finishes the phrase (a quick tap still toggles). Not the note key. */
  dictateHold: boolean
  /**
   * Words dictation and transcripts spell as written, one line each as the
   * person typed it: the word, then what it may be heard as in parentheses
   * ("Kryakl (крякл, кракл)"); vocabulary.ts reads them.
   */
  vocabulary: string[]
  /**
   * Which translator every card and key uses: Fast (Firefox's models), or the
   * local model (`model`, llmtranslator.ts), downloaded when picked. A card
   * waits for the level picked, never another. Never a model other than `model`.
   */
  translationLevel: TranslationLevel
  /** The one local model, Accurate (Gemma 4 E4B) or Most accurate (Gemma 4 12B): Check my English uses it, and translation when it is not Fast. */
  model: LlmModel
  /** Speech models: the most accurate this computer runs in time, or quicker ones. */
  speechPrefer: Prefer
  /** A speech model the person picked for dictation and for transcripts (models.json names); empty: chosen for this computer. */
  dictationModel: string
  transcriptsModel: string
  /** Where "who spoke when" runs: chosen for this computer (the graphics card when it has room), the card, or the processor. */
  speakersDevice: 'auto' | 'cuda' | 'cpu'
  /** The person agreed to the speed test: it runs again by itself when something changes (a model, a card). */
  speechTestAgreed: boolean
  /** "Not now" to the test: what it would have measured then, and when; it is offered again when that changes, a day later at the soonest. */
  speechTestDeclinedKey: string
  speechTestDeclinedAt: number
  /** Start Kryakl when Windows starts. */
  startWithWindows: boolean
  /** The offer of the natural voice was closed. */
  naturalDismissed: boolean
  /** The local models whose offer to Translate on Fast was answered (taken or Not now): it shows once per model, once the model is here for Check or Talk. */
  shareOfferSeen: LlmModel[]
  /** The Home's opening moment (one line through fix, translate, listen) has played once; Replay plays it again. */
  introSeen: boolean
  /** Kryakl paused: all its keys and reactions off (Ctrl+C twice, the keyboard helper, dictation) until turned back on. */
  paused: boolean
  /** The settings file's keys are of this kind (`KEYS_VERSION`); an older file held Ctrl+C twice as a switch, `doubleCopy`. */
  keysVersion: number
  /**
   * The first-run setup (the window's wizard: language, this computer, what to
   * download) was finished or skipped. A settings file from before the wizard
   * counts as done; only a fresh install starts with it false (main.ts).
   */
  setupDone: boolean
}

export const DEFAULTS: Settings = {
  native: 'Russian',
  languages: [],
  voice: '',
  rate: 1,
  autoRead: true,
  oneAtATime: false,
  wordHint: 'shift',
  rareWords: true,
  theme: 'system',
  uiLanguage: 'en',
  cardWidth: 440,
  cardHeight: 0,
  menuKey: '',
  selectKey: '',
  snipKey: 'Control+Alt+S',
  translateKey: '',
  textKey: 'Control+Alt+T',
  inPlaceKey: '',
  checkKey: '',
  typeKey: '',
  typeCheckKey: '',
  switchKey: '',
  switchOn: true,
  layouts: [],
  layoutKeys: {},
  autoFix: false,
  fixTwoCaps: true,
  fixCapsLock: true,
  keepCaps: false,
  fixOnPause: false,
  fixSound: false,
  switchSound: false,
  switchSoundName: 'glass',
  learn: true,
  fixKey: '',
  fixKeyOn: true,
  apps: [],
  keepWords: [],
  layoutBadge: false,
  trayLayout: false,
  quietFullScreen: true,
  edgePanel: false,
  pauseKey: '',
  windowKey: '',
  dictateKey: 'Control+Alt+D',
  englishKey: '',
  noteKey: 'Control+Alt+N',
  againKey: '',
  practiceKey: '',
  talkKey: '',
  meetingKey: '',
  shotKey: '',
  callShots: false,
  callLive: false,
  callConsentSeen: false,
  callAuto: 'off',
  callPanelOffset: { dx: 0, dy: 0 },
  callSummaryAuto: true,
  callTemplate: 'general',
  callOwn: '',
  callTemplates: [],
  callSummaryMine: false,
  callNames: false,
  talkAloud: true,
  talkOnTop: false,
  talkLevel: 'B1',
  talkAbout: '',
  dictateEdit: false,
  dictateEditStyle: 'clean',
  dictateEditOwn: '',
  talkBounds: null,
  dictationBadge: { dx: 0, dy: 0 },
  dictationPanel: true,
  dictateHold: false,
  vocabulary: [],
  translationLevel: 'fast',
  model: 'accurate',
  speechPrefer: 'accuracy',
  dictationModel: '',
  transcriptsModel: '',
  speakersDevice: 'auto',
  speechTestAgreed: false,
  speechTestDeclinedKey: '',
  speechTestDeclinedAt: 0,
  startWithWindows: true,
  naturalDismissed: false,
  shareOfferSeen: [],
  introSeen: false,
  paused: false,
  keysVersion: 2,
  setupDone: true,
}

/** Since 0.16 Ctrl+C twice is a key of an action (`COPY_TWICE`), no longer the switch `doubleCopy`. */
export const KEYS_VERSION = 2

/** The actions on the selected text, the only ones Ctrl+C twice may be the key of (it copies the selection itself). */
export const COPY_TWICE_KEYS = ['selectKey', 'translateKey', 'inPlaceKey', 'checkKey'] as const

/**
 * A settings file (or a backup's) from before Ctrl+C twice was a key held it as
 * a switch, on unless turned off (absent: on, the default then): it becomes
 * the key of "Translate and read aloud" (`selectKey`) when that has none; one
 * that has a key keeps it, and Ctrl+C twice is off. A fresh install has none.
 */
function movedSelectKey(raw: unknown, r: Record<string, unknown>, selectKey: string): string {
  if (!raw || typeof raw !== 'object' || r.keysVersion === KEYS_VERSION) return selectKey
  if (selectKey || r.doubleCopy === false || Object.values(r).includes(COPY_TWICE)) return selectKey
  return COPY_TWICE
}

export const VOCABULARY = { lines: 200, chars: 120 }

/** The vocabulary's lines tidied: one line each, single spaces, short; the same word (before its parentheses) once. */
function vocabularyLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const line = item.replace(/\s+/g, ' ').trim().slice(0, VOCABULARY.chars).trim()
    const word = (line.split('(')[0] ?? '').trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(line)
    if (out.length >= VOCABULARY.lines) break
  }
  return out
}

/** A word as Kept as typed holds it: trimmed and in lower case, as the keyboard thread compares them. */
export const keptForm = (text: string): string => text.trim().toLowerCase()

/** Kept as typed with `text` added (the page's Add and the tray's field); undefined when it is empty or there already. */
export function addKept(list: readonly string[], text: string): string[] | undefined {
  const word = keptForm(text)
  if (!word || list.includes(word)) return undefined
  return [...list, word]
}

/** The languages a text of the person's is read as, by code: their own, English, then the others they named. */
export function myLanguages(s: Pick<Settings, 'native' | 'languages'>): string[] {
  return [...new Set([findLanguage(s.native)?.code ?? '', 'en', ...s.languages].filter(Boolean))]
}

/**
 * The programs' rules, whatever the file held: one per program, known parts
 * only. A file from before (`fixApps`, programs where words were never fixed)
 * becomes rules that leave fixing out.
 */
function appRules(raw: unknown, old: unknown): AppRule[] {
  const items = Array.isArray(raw) ? raw : Array.isArray(old) ? old.map(exe => ({ exe, off: ['fix'], layout: '' })) : []
  const seen = new Set<string>()
  const out: AppRule[] = []
  for (const item of items) {
    const r = (item && typeof item === 'object' ? item : {}) as { exe?: unknown; off?: unknown; layout?: unknown }
    const exe = typeof r.exe === 'string' ? r.exe.trim().toLowerCase() : ''
    if (!exe || seen.has(exe)) continue
    seen.add(exe)
    const off = Array.isArray(r.off) ? APP_PARTS.filter(p => (r.off as unknown[]).includes(p)) : []
    const layout = typeof r.layout === 'string' && /^[0-9A-F]{8}$/i.test(r.layout) ? r.layout.toUpperCase() : ''
    out.push({ exe, off, layout })
  }
  return out
}

/** Each layout's own key, by layout id; empty keys dropped. */
function layoutKeys(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [id, key] of Object.entries(raw as Record<string, unknown>)) {
    if (/^[0-9A-F]{8}$/i.test(id) && typeof key === 'string' && key.trim()) out[id.toUpperCase()] = key.trim()
  }
  return out
}

/** A window's place as whole numbers, or none when the file held anything else; main.ts checks it is still on a screen. */
function windowBounds(v: unknown): Settings['talkBounds'] {
  const r = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 20000 ? Math.round(x) : undefined)
  const [x, y, width, height] = [n(r.x), n(r.y), n(r.width), n(r.height)]
  return x === undefined || y === undefined || !width || !height || width < 0 || height < 0 ? null : { x, y, width, height }
}

/** The badge's offset as numbers, whatever the file held; a screen is never wider than this. */
function badgeOffset(v: unknown): Settings['dictationBadge'] {
  const r = (v && typeof v === 'object' ? v : {}) as { dx?: unknown; dy?: unknown }
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(Math.max(-20000, Math.min(20000, x))) : 0)
  return { dx: n(r.dx), dy: n(r.dy) }
}

/**
 * The level and the one model, kept in step: the model wins, so picking one on
 * the Check page moves a translation level that was the other model too. A
 * file from before the shared model (0.10.1) takes the model from its level.
 */
function levelAndModel(level: unknown, model: unknown): Pick<Settings, 'translationLevel' | 'model'> {
  const isModel = (v: unknown): v is LlmModel => v === 'accurate' || v === 'most'
  const m = isModel(model) ? model : isModel(level) ? level : DEFAULTS.model
  return { translationLevel: isModel(level) ? m : 'fast', model: m }
}

export function normalize(raw: unknown, native = DEFAULTS.native): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings | 'fixApps' | 'doubleCopy', unknown>>
  const flag = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
  const key = (v: unknown, d: string) => (typeof v === 'string' ? v.trim() : d)
  const within = (v: unknown, range: { min: number; max: number }, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(range.max, Math.max(range.min, v))) : d
  const strings = (v: unknown, clean: (s: string) => string = s => s.trim()) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map(clean).filter(Boolean))] : []
  const known = typeof r.native === 'string' ? findLanguage(r.native) : undefined
  const own = known && known.name !== TARGET ? known.name : native
  const ownCode = findLanguage(own)?.code
  return {
    native: own,
    // The person's own and English are always in, so they are never listed twice.
    languages: strings(r.languages, s => s.trim().toLowerCase()).filter(c => c !== 'en' && c !== ownCode && LANGUAGES.some(l => l.code === c)),
    voice: typeof r.voice === 'string' ? r.voice : DEFAULTS.voice,
    rate: typeof r.rate === 'number' && r.rate >= 0.5 && r.rate <= 1.5 ? r.rate : DEFAULTS.rate,
    autoRead: flag(r.autoRead, DEFAULTS.autoRead),
    oneAtATime: flag(r.oneAtATime, DEFAULTS.oneAtATime),
    wordHint: r.wordHint === 'hover' || r.wordHint === 'off' ? r.wordHint : 'shift',
    rareWords: flag(r.rareWords, DEFAULTS.rareWords),
    theme: r.theme === 'light' || r.theme === 'dark' ? r.theme : 'system',
    uiLanguage: isUiLanguage(r.uiLanguage) ? r.uiLanguage : DEFAULTS.uiLanguage,
    cardWidth: within(r.cardWidth, CARD_WIDTH, DEFAULTS.cardWidth),
    cardHeight: r.cardHeight === 0 ? 0 : within(r.cardHeight, CARD_HEIGHT, DEFAULTS.cardHeight),
    menuKey: key(r.menuKey, DEFAULTS.menuKey),
    selectKey: movedSelectKey(raw, r, key(r.selectKey, DEFAULTS.selectKey)),
    snipKey: key(r.snipKey, DEFAULTS.snipKey),
    translateKey: key(r.translateKey, DEFAULTS.translateKey),
    textKey: key(r.textKey, DEFAULTS.textKey),
    inPlaceKey: key(r.inPlaceKey, DEFAULTS.inPlaceKey),
    checkKey: key(r.checkKey, DEFAULTS.checkKey),
    typeKey: key(r.typeKey, DEFAULTS.typeKey),
    typeCheckKey: key(r.typeCheckKey, DEFAULTS.typeCheckKey),
    switchKey: key(r.switchKey, DEFAULTS.switchKey),
    switchOn: flag(r.switchOn, DEFAULTS.switchOn),
    layouts: strings(r.layouts, s => s.trim().toUpperCase()).filter(s => /^[0-9A-F]{8}$/.test(s)),
    layoutKeys: layoutKeys(r.layoutKeys),
    autoFix: flag(r.autoFix, DEFAULTS.autoFix),
    fixTwoCaps: flag(r.fixTwoCaps, DEFAULTS.fixTwoCaps),
    fixCapsLock: flag(r.fixCapsLock, DEFAULTS.fixCapsLock),
    keepCaps: flag(r.keepCaps, DEFAULTS.keepCaps),
    fixOnPause: flag(r.fixOnPause, DEFAULTS.fixOnPause),
    fixSound: flag(r.fixSound, DEFAULTS.fixSound),
    switchSound: flag(r.switchSound, DEFAULTS.switchSound),
    switchSoundName: SWITCH_SOUNDS.find(n => n === r.switchSoundName) ?? DEFAULTS.switchSoundName,
    learn: flag(r.learn, DEFAULTS.learn),
    fixKey: key(r.fixKey, DEFAULTS.fixKey),
    fixKeyOn: flag(r.fixKeyOn, DEFAULTS.fixKeyOn),
    apps: appRules(r.apps, r.fixApps),
    // Lower case, as the keyboard thread compares them; the Set in `strings` drops the same word twice.
    keepWords: strings(r.keepWords, keptForm),
    layoutBadge: flag(r.layoutBadge, DEFAULTS.layoutBadge),
    trayLayout: flag(r.trayLayout, DEFAULTS.trayLayout),
    quietFullScreen: flag(r.quietFullScreen, DEFAULTS.quietFullScreen),
    edgePanel: flag(r.edgePanel, DEFAULTS.edgePanel),
    pauseKey: key(r.pauseKey, DEFAULTS.pauseKey),
    windowKey: key(r.windowKey, DEFAULTS.windowKey),
    dictateKey: key(r.dictateKey, DEFAULTS.dictateKey),
    englishKey: key(r.englishKey, DEFAULTS.englishKey),
    noteKey: key(r.noteKey, DEFAULTS.noteKey),
    againKey: key(r.againKey, DEFAULTS.againKey),
    practiceKey: key(r.practiceKey, DEFAULTS.practiceKey),
    talkKey: key(r.talkKey, DEFAULTS.talkKey),
    meetingKey: key(r.meetingKey, DEFAULTS.meetingKey),
    shotKey: key(r.shotKey, DEFAULTS.shotKey),
    callShots: flag(r.callShots, DEFAULTS.callShots),
    callLive: flag(r.callLive, DEFAULTS.callLive),
    callConsentSeen: flag(r.callConsentSeen, DEFAULTS.callConsentSeen),
    callAuto: CALL_AUTO.includes(r.callAuto as CallAuto) ? (r.callAuto as CallAuto) : DEFAULTS.callAuto,
    callPanelOffset: badgeOffset(r.callPanelOffset),
    callSummaryAuto: flag(r.callSummaryAuto, DEFAULTS.callSummaryAuto),
    callTemplate: SUMMARY_TEMPLATES.includes(r.callTemplate as SummaryTemplate) ? (r.callTemplate as SummaryTemplate) : DEFAULTS.callTemplate,
    callOwn: typeof r.callOwn === 'string' ? r.callOwn.slice(0, SUMMARY_OWN_MAX) : DEFAULTS.callOwn,
    callTemplates: ownTemplates(r.callTemplates, r.callOwn),
    callSummaryMine: flag(r.callSummaryMine, DEFAULTS.callSummaryMine),
    callNames: flag(r.callNames, DEFAULTS.callNames),
    talkAloud: flag(r.talkAloud, DEFAULTS.talkAloud),
    talkOnTop: flag(r.talkOnTop, DEFAULTS.talkOnTop),
    talkLevel: TALK_LEVELS.includes(r.talkLevel as TalkLevel) ? (r.talkLevel as TalkLevel) : DEFAULTS.talkLevel,
    talkAbout: typeof r.talkAbout === 'string' ? r.talkAbout.slice(0, TALK_ABOUT_MAX) : DEFAULTS.talkAbout,
    dictateEdit: flag(r.dictateEdit, DEFAULTS.dictateEdit),
    dictateEditStyle: EDIT_STYLES.includes(r.dictateEditStyle as EditStyle) ? (r.dictateEditStyle as EditStyle) : DEFAULTS.dictateEditStyle,
    dictateEditOwn: typeof r.dictateEditOwn === 'string' ? r.dictateEditOwn.slice(0, EDIT_OWN_MAX) : DEFAULTS.dictateEditOwn,
    talkBounds: windowBounds(r.talkBounds),
    dictationBadge: badgeOffset(r.dictationBadge),
    dictationPanel: flag(r.dictationPanel, DEFAULTS.dictationPanel),
    dictateHold: flag(r.dictateHold, DEFAULTS.dictateHold),
    vocabulary: vocabularyLines(r.vocabulary),
    ...levelAndModel(r.translationLevel, r.model),
    speechPrefer: r.speechPrefer === 'speed' ? 'speed' : 'accuracy',
    dictationModel: key(r.dictationModel, DEFAULTS.dictationModel),
    transcriptsModel: key(r.transcriptsModel, DEFAULTS.transcriptsModel),
    speakersDevice: r.speakersDevice === 'cuda' || r.speakersDevice === 'cpu' ? r.speakersDevice : 'auto',
    speechTestAgreed: flag(r.speechTestAgreed, DEFAULTS.speechTestAgreed),
    setupDone: flag(r.setupDone, DEFAULTS.setupDone),
    speechTestDeclinedKey: key(r.speechTestDeclinedKey, DEFAULTS.speechTestDeclinedKey),
    speechTestDeclinedAt: typeof r.speechTestDeclinedAt === 'number' && Number.isFinite(r.speechTestDeclinedAt) ? r.speechTestDeclinedAt : 0,
    startWithWindows: flag(r.startWithWindows, DEFAULTS.startWithWindows),
    naturalDismissed: flag(r.naturalDismissed, DEFAULTS.naturalDismissed),
    shareOfferSeen: strings(r.shareOfferSeen).filter((m): m is LlmModel => m === 'accurate' || m === 'most'),
    introSeen: flag(r.introSeen, DEFAULTS.introSeen),
    paused: flag(r.paused, DEFAULTS.paused),
    keysVersion: KEYS_VERSION,
  }
}

/** The person's templates as kept: each a name and a text, cut to size; none yet, the one instruction of before (`callOwn`) becomes the first. */
export function ownTemplates(raw: unknown, own: unknown): OwnTemplate[] {
  if (!Array.isArray(raw)) return typeof own === 'string' && own.trim() ? [{ name: '', text: own.slice(0, SUMMARY_OWN_MAX) }] : []
  return raw
    .filter((x): x is OwnTemplate => !!x && typeof x === 'object' && typeof x.name === 'string' && typeof x.text === 'string' && !!x.text.trim())
    .slice(0, SUMMARY_TEMPLATES_MAX)
    .map(x => ({ name: x.name.trim().slice(0, TEMPLATE_NAME_MAX), text: x.text.slice(0, SUMMARY_OWN_MAX) }))
}
