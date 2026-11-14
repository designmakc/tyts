// Messages between the main process and the card, the small window that
// shows one picked text or one snipped piece of the screen at a time.
import type { NoteScope, Passage, Turn } from './ask'
import type { DictationEntry } from './dictationlog'
import type { DeviceProfile } from './hardware'
import type { WordTime } from './kokoro'
import type { Gloss } from './lemma'
import type { NaturalState } from './natural'
import type { EdgeStyle, LlmModel, Settings, TranslationLevel } from './settings'
import type { AccessId, AccessRow } from './access'
import type { SummaryLength, SummaryTemplate } from './summary'
import type { TopMode, TopRow } from './toplook'
import type { SpeechPackState, SpeechPart } from './speechpack'
import type { Choice, Feature, FeaturePlan, SpeechPlan } from './speechplan'
import type { SpeechHealth, SpeechResult, SpeechServiceState } from './speechservice'
import type { TalkState, TalkTurn } from './talk'
import type { TalkRecord, TalkSummary } from './talks'
import type { TranslationEntry } from './translationlog'
import type { Clip } from './cliphistory'
import type { TranslatorState } from './translator'
import type { MistakeEntry } from './mistakes'
import type { Learned } from './typist'
import type { DiffPart } from './worddiff'
import type { SavedWord } from './words'

/** The word dictionary for the person's language: here, none for the language, coming, failed, or not downloaded yet. */
export type DictionaryStatus = 'ready' | 'none' | 'downloading' | 'failed' | 'absent'

export type { Choice, DeviceProfile, DictationEntry, DiffPart, Feature, FeaturePlan, Gloss, MistakeEntry, NaturalState, SavedWord, Settings, SpeechHealth, SpeechPackState, SpeechPart, SpeechPlan, SpeechResult, TalkRecord, TalkSummary, TalkTurn, WordTime }

/**
 * What the card is for, and where the text came from. To listen to it, in
 * English with its translation under it: `selection` (copied or selected in
 * any program), `screenshot` (read from a snipped piece of the screen). To
 * translate it, shown as it is with its translation, From and To, like
 * DeepL: `translate` (selected), `text` (read from the screen). To check the
 * person's own English, its mistakes marked and set right: `check`.
 */
export type CardKind = 'selection' | 'screenshot' | 'translate' | 'text' | 'check' | 'explain' | 'rewrite'

/** The translation under a text shown as it is (a `translate` or `text` card), asked for with `translateText`. */
export type TextResult =
  | { status: 'none' }
  | { status: 'translating' }
  /** The translator for `language` (a code) is downloading, once. */
  | { status: 'downloading'; language: string; progress: number; size: number }
  /**
   * `text`: the translation as plain text (Copy, Paste); `html`: the same,
   * every sentence a `span.t` (render.ts textOutHtml); `sentences`: the
   * text's sentences in order, as translated, for the card to find in its field;
   * `drafts`: how many sentences are still quick drafts (`span.t.draft`), the
   * accurate model's translation replacing them one by one; `busy`: Fast
   * translated it, the model too slow just now.
   */
  | { status: 'ready'; text: string; from: string; to: string; html: string; sentences: string[]; drafts?: number; busy?: BusyPart }
  | { status: 'failed'; message: string }

/** What kept the local model too slow just now, so Fast translated instead (modelbusy.ts): the graphics card or the processor taken by another program. */
export type BusyPart = 'card' | 'processor'

/** Check my English's answer under the person's text (a `check` card), asked for with `checkText`. */
export type CheckResult =
  | { status: 'none' }
  | { status: 'checking' }
  /** The checker's model is downloading, once. */
  | { status: 'downloading'; progress: number; size: number }
  /**
   * `text`: the text checked; `corrected`: it set right (Copy, Paste; the
   * same text when it was right); `parts`: what changed, word by word
   * (worddiff.ts); `note`: the main mistake in the person's language, or "".
   */
  | { status: 'ready'; text: string; corrected: string; parts: DiffPart[]; note: string }
  | { status: 'failed'; message: string }

/** The card's lower half: the translation, or what keeps it. */
export type TranslationState =
  | { status: 'translating' }
  /** The translator for this language pair is downloading, once. */
  | { status: 'downloading'; progress: number; size: number }
  /** `drafts`, `busy`: as a text's (TextResult). */
  | { status: 'ready'; html: string; drafts?: number; busy?: BusyPart }
  | { status: 'failed'; message: string }

/**
 * What the card shows. `done`: `html` is the text in English (see render.ts),
 * on top; an English text is done at once, while its translation still comes.
 */
export type CardState =
  | { status: 'reading' }
  | { status: 'translating' }
  | { status: 'downloading'; progress: number; size: number }
  | { status: 'done'; html: string; translation: TranslationState; note?: string }
  /**
   * The translator's text, as it is: `from` is the language it seems to be
   * in and `to` the one it is translated into (codes, out of `languages`,
   * those the translator has); `canPaste`: it was selected in a window the
   * translation can be pasted into, over the selection.
   */
  /** `mine`: the languages the person uses, put first in From and To. */
  | { status: 'text'; text: string; from: string; to: string; languages: string[]; mine?: string[]; result: TextResult; canPaste?: boolean }
  /** Check my English: the person's text as it is (editable) and what the checker (`model`, its level's name: Accurate) says of it; `canPaste` as a text's. */
  | { status: 'check'; text: string; result: CheckResult; model: string; canPaste?: boolean }
  /** Rewrite… (rewrite.ts): the selection, and Explain's answer or a rewrite with no window to paste into; `answer` empty while the model works, `failed` when it says why there is none. */
  | { status: 'explain'; text: string; answer: string; failed?: boolean }
  /** The snipped piece of the screen holds no text. */
  | { status: 'empty' }
  /** Windows has no text recognition installed for any language the card could use. */
  | { status: 'no-ocr' }
  | { status: 'failed'; message: string }

export type CardView = {
  /** A new id is a new text: the card scrolls to the top and may read it aloud. */
  id: number
  kind: CardKind
  state: CardState
  /** The learned language (English) and the person's own. */
  target: string
  native: string
  /** The translation level the card translates with (Settings). */
  level: TranslationLevel
  /** The level's model too slow just now: Fast translates until it is tried again (modelbusy.ts). */
  busy?: BusyPart
  /** Read the English aloud as soon as the card has it. */
  autoRead: boolean
  /**
   * The key that called the card, lit in its header (hotkey.ts notation;
   * "Control+C*2" for Ctrl+C pressed twice); none when it came from the tray.
   */
  via?: string
}

/** When the word card shows: while Shift is held over a word, on any hover, or never. */
export type WordHintMode = 'shift' | 'hover' | 'off'

export type ViewConfig = { voice: string; rate: number; wordHint: WordHintMode; rareWords: boolean; oneAtATime: boolean }

/**
 * The app window's places: Home (always first), the five action pages, the person's lists, Settings, Models,
 * Disk space, About; 'checkModel' is Models › Check and talk. The names before 2026-11-04 still come (a second
 * start, an older page): 'talk' and 'check' open English, 'listen' and 'screen' Translate, 'dictate' Voice typing,
 * 'transcribe' Recordings and meetings, 'keyboard' Keyboard layout, 'howto' Home.
 */
export type AppTab =
  | 'home'
  | 'translate'
  | 'english'
  | 'voice'
  | 'recordings'
  | 'layout'
  | 'words'
  | 'mistakes'
  | 'transcripts'
  | 'vocabulary'
  | 'kept'
  | 'settings'
  | 'models'
  | 'checkModel'
  | 'storage'
  | 'about'
  | 'report'
  | 'talk'
  | 'listen'
  | 'check'
  | 'screen'
  | 'dictate'
  | 'transcribe'
  | 'keyboard'
  | 'howto'

export type HostVoice = { name: string; lang: string }

/** A keyboard layout Windows has: `id` as settings.ts keeps it ("04090409"), `name` as Windows calls its language. */
/** One of Windows' layouts: `lang` is its language's code, as the layout fixer's word lists are named. */
export type KeyboardLayout = { id: string; name: string; short: string; lang: string }

/**
 * The speech engine (Dictate, Transcribe, Transcripts): its installed parts,
 * the running service and what it reports. `download` is each choice's size in MB.
 */
export type SpeechView = {
  pack: SpeechPackState
  service: SpeechServiceState
  trouble?: string
  health?: SpeechHealth
  port: number
  download: { core: number; gpu: number; speakers: number }
  /** What each choice takes on the disk once installed, in MB. */
  installed: { core: number; gpu: number; speakers: number }
  /**
   * Who spoke when: where it runs (the person's choice, else the advice), each way's download and disk in MB,
   * and whether the voices' model itself is on the disk already (then no Hugging Face key is asked).
   */
  speakers: {
    on: 'cuda' | 'cpu'
    sizes: Record<'cuda' | 'cpu', { download: number; installed: number }>
    model: boolean
    /** A Mac: its own chip tells the voices apart (FluidAudio's models, ~21 MB); no key, no place to choose. */
    ane?: true
  }
  /** The model dictation downloads at its first use (0 MB: it is here), on the processor or on the card, and its time for a phrase. */
  firstModel: { cpu: { model: string; mb: number; phrase: number }; cuda: { model: string; mb: number; phrase: number } }
  /** Free space where the engine goes. */
  disk: { freeMb: number; drive: string }
  /** This computer: processor, memory, cards. */
  device: DeviceProfile
  /** Which model runs where and how long each takes here. */
  plan: SpeechPlan
  /** The speed test: offered now (the person has not agreed, and something is still unmeasured), agreed once, models it would measure. */
  test: { offer: boolean; agreed: boolean; runs: number }
  /** The dictation keys are registered (false: another program holds one). */
  keysOk: { dictate: boolean; note: boolean; english: boolean; again: boolean; practice: boolean; talk: boolean; meeting: boolean; shot: boolean }
}

/**
 * What the talk window draws (webview/talk.ts): the talk (talk.ts), the
 * settings it reads, and what stands in its way. `engine`: the speech engine
 * that hears the person; `model`: the local model that checks and answers,
 * named; `needsCard`: this computer's graphics card cannot hold Accurate
 * whole, so no talk is offered; `slow`: the model picked runs partly on the
 * card or on the processor here; `busy`: another program holds the card or
 * the processor now; `keyTaken`: the Talk key could not be registered;
 * `talks`: the history panel's list; `maximized`: the window fills the screen.
 */
export type TalkWindowView = {
  talk: TalkState
  talks: TalksView
  maximized: boolean
  talkKey: string
  talkAloud: boolean
  onTop: boolean
  voice: string
  rate: number
  wordHint: Settings['wordHint']
  rareWords: boolean
  native: string
  natural: NaturalState['status']
  engine: 'absent' | 'starting' | 'ready'
  /** `full`: the model's own name ("Gemma 4 E4B"), for the bar's tooltip. */
  model: { name: string; full: string } & TranslatorState
  needsCard: boolean
  slow: boolean
  busy?: BusyPart
  keyTaken: boolean
}

/** The talks (talks.ts): the one going on and those put away, newest first, for the talk window's history. */
export type TalksView = { current?: TalkSummary; past: TalkSummary[] }

/** A call recording (capture.ts): getting the sound, recording, paused, being saved, or none. */
export type CallState = 'idle' | 'starting' | 'recording' | 'paused' | 'stopping'

/** Everything the app window shows, sent whole whenever any of it changes. */
export type AppView = {
  settings: Settings
  /** What the system lets Tyts do (access.ts), for the Permissions page; read anew each time the window is shown or comes to the front. */
  access: AccessRow[]
  version: string
  /** When this copy was built, and from which commit ("30 Oct, 07:12 (ff17ba8, changed)"). */
  build: string
  /** A run from source, not an installed copy. */
  dev: boolean
  natural: NaturalState
  hostVoices: HostVoice[]
  /** The languages a person may name as their own: English name and own name. */
  languages: { name: string; native: string }[]
  words: SavedWord[]
  /** Each shortcut is registered (false: another program holds it). */
  keysOk: { snip: boolean; select: boolean; translate: boolean; text: boolean; inPlace: boolean; check: boolean; type: boolean; typeCheck: boolean; pause: boolean; window: boolean }
  /** What Tyts learned from the person's typing (learning.ts): words fixed always, words of theirs. */
  learned: { alwaysFix: Learned[]; myWords: Learned[] }
  /** A program that runs as administrator was in front lately: its keys never reach Tyts. */
  elevatedApp?: string
  /** The texts translated lately, newest first (the last 10). */
  translations: TranslationEntry[]
  /** The clipboard history: the pinned first, then the texts copied lately, newest first (empty while it is off and was never on). */
  clips: Clip[]
  /** The translator between English and the person's language: here, downloading, or to be downloaded on the first translation. */
  translator: 'absent' | 'downloading' | 'ready' | 'failed' | 'unsupported'
  /** The keyboard layouts Windows has, in its order. */
  layouts: KeyboardLayout[]
  /** Why the keyboard helper does not run, when it should. */
  keyboardTrouble?: string
  /** The program typed in last (its .exe name), to keep words in it as typed. */
  lastApp?: string
  /** Other layout switchers running now (EveryLang, Punto Switcher): they would fix words twice. */
  rivals: string[]
  /** Other programs known to watch the keyboard, running now (AutoHotkey, WhisperTyping…): no harm, named so the person knows. */
  keyboardApps: string[]
  /** Some program pressed keys by itself since the keyboard helper started; Tyts ignores those. */
  foreignKeys: boolean
  speech: SpeechView
  /** The call recording now, and its seconds recorded (the pauses left out). */
  call: { state: CallState; seconds: number }
  /** Summaries being made, by transcript id: part `part` of `parts` since `started` (ms); `error` when it failed (kept until tried again). */
  summaries: Record<string, { part: number; parts: number; started: number; error?: string }>
  /** The phrases dictated lately, newest first (the last 10). */
  dictation: { recent: DictationEntry[] }
  /** The translator for the person's language with its download's progress and size (MB), for the setup's list. */
  translatorState: TranslatorState
  /** Each translation level's models for the person's language (Fast: Firefox's pair), for the Translate page. */
  translation: Record<TranslationLevel, TranslatorState>
  /** Each local model's download, whatever the language (Check my English; never `unsupported`). */
  models: Record<LlmModel, TranslatorState>
  /**
   * Seconds a local model takes here, each once measured a few times: a
   * sentence translated, a text checked, the duck's answer in Talk, and
   * loading the model after it was let go; `card`: the MB of the graphics
   * card it holds while loaded.
   */
  modelSpeed: Partial<Record<LlmModel, { sentence?: number; text?: number; reply?: number; start?: number; card?: number }>>
  /** The local model loaded now, and whether on the graphics card (Models › This computer says what Tyts holds right now). */
  llmLoaded?: { model: LlmModel; onCard: boolean }
  /** The word dictionary for the person's language. */
  dictionary: { status: DictionaryStatus }
  /** The mistakes checked texts had, newest first (mistakes.ts). */
  mistakes: MistakeEntry[]
  /** The talk going on, for the Talk page's line. */
  talk?: TalkSummary
  /** What Tyts keeps on this computer, measured once the Storage page was opened. */
  storage?: StorageView
}

/**
 * A part of what Tyts keeps (storage.ts): Firefox's models and the word dictionaries by language, the natural voice, the
 * two language models and an older Tyts's, llama.cpp's builds, each speech model, the speech engine's program and its
 * graphics card's and speakers' parts, the person's own things.
 */
export type StorageId = 'fast' | 'dict' | 'voice' | 'accurate' | 'most' | 'unused' | 'llama' | 'speechModel' | 'speech' | 'gpu' | 'speakers' | 'speakersOld' | 'yours' | 'transcripts'
/**
 * Its place, its bytes, and how many of them are files linked from elsewhere too (a developer's uv cache), which a removal does not free.
 * `item`: the language's code (fast, dict), the speech model's name, the build (llama: vulkan, cuda). `users`: the actions it serves now;
 * `unused`: nothing uses it, Clean up removes it; `reserve`: kept for when the graphics card fails ("Dictate"), not cleaned up.
 */
export type StoragePart = { id: StorageId; item?: string; path: string; bytes: number; shared: number; users?: string[]; unused?: boolean; reserve?: string }
/** `refused`: the parts the last removal or Clean up could not take off the disk, each with why, in the interface's language. */
export type StorageView = { measuring: boolean; root: string; drive: string; freeMb: number; parts: StoragePart[]; refused?: Refused[] }
export type Refused = { id: StorageId; item?: string; why: string }

/** What the tray's panel shows, sent whole whenever any of it changes. */
export type TrayView = {
  /** The keys of its commands, hotkey.ts notation ("Control+C*2" for Ctrl+C twice); empty when there is none. */
  keys: { listenCopied: string; typeToTranslate: string; checkEnglish: string; talk: string; snipListen: string; snipTranslate: string; switch: string; call: string }
  /** The quick settings' switches: fixing as one types, the switch key, the badge, the layout in the tray's icon, Tyts paused. */
  autoFix: boolean
  switchOn: boolean
  layoutBadge: boolean
  trayLayout: boolean
  paused: boolean
  /** "Keep a word as typed…": shown while the fixer works (fixing as one types, or the fix key on); `word` the last word fixed by itself, as typed, and `fixed` what it became (empty when none, or it is kept already). */
  keep: { on: boolean; word: string; fixed: string }
  /** The speech engine is installed: a note can be started from here; one is being recorded now. */
  speech: { installed: boolean; recording: boolean; noteKey: string }
  /** A call is being recorded: its row stops it. */
  call: boolean
  /** Keep the computer awake (awake.ts): on, and for how long still ("3 h 20 min", or empty until turned off). */
  awake: { on: boolean; left: string }
  /** The translator between English and the person's language (as `AppView.translator`). */
  translator: AppView['translator']
  native: string
  version: string
  build: string
  dev: boolean
}

/**
 * What the panel at the top of the screen shows (edgepanel.ts, webview/edge.ts): one problem in the way, if any;
 * whether there is a speech engine, a phrase or a call being recorded; the keys; the switches; the last phrases
 * dictated and the last calls recorded.
 */
/** What the top of the screen shows while dictation listens or a call records (toplook.ts). */
export type TopView = { style: EdgeStyle; mode: TopMode; rows: TopRow[] }

export type EdgeView = {
  /** The look the panel comes in with (settings.edgeStyle). */
  style: EdgeStyle
  problem: '' | 'noEngine' | 'paused'
  speech: boolean
  dictating: boolean
  call: boolean
  /** A call records (not starting, paused or stopping): a screenshot can be taken. */
  recording: boolean
  /** The screenshot just asked for: kept, or not; said for a moment. */
  shot: '' | 'ok' | 'failed'
  keys: { dictate: string; again: string; call: string; fix: string }
  autoFix: boolean
  switchOn: boolean
  layoutBadge: boolean
  recent: { at: string; text: string }[]
  calls: { id: string; title: string; created: string; duration: number }[]
}

/** What the panel at the top of the screen does besides the tray's commands; each puts the panel away. */
export type EdgeAct = { act: 'dictate' } | { act: 'again' } | { act: 'shot' } | { act: 'paste'; at: string } | { act: 'openCall'; id: string } | { act: 'setup' }

/** What the tray's panel can do; each puts the panel away first. */
export type TrayCommand = 'listenCopied' | 'translateCopied' | 'typeToTranslate' | 'checkEnglish' | 'talk' | 'listenScreen' | 'translateScreen' | 'note' | 'call' | 'transcripts' | 'transcribe' | 'vocabulary' | 'kept' | 'settings' | 'report' | 'open' | 'quit' | 'awake'

/**
 * Why a word has no meanings: no dictionary exists for the person's language,
 * it is being downloaded, the download failed or is turned off, or the word
 * is not in it.
 */
export type GlossMissing = 'not-english' | 'no-dictionary' | 'downloading' | 'download-failed' | 'download-off' | 'not-found'

export type ToView =
  /** `maximized`: the card fills the screen's work area (and stays, pinned, until closed or restored). */
  | { type: 'card'; card: CardView; config: ViewConfig; pinned: boolean; maximized: boolean }
  /** `platform` is Node's name for the system (win32, darwin, linux), for the steps to add a voice. */
  | { type: 'hostVoices'; voices: HostVoice[]; canSpeak: boolean; platform: string }
  | { type: 'progress'; id: number; pos: number; len: number }
  | { type: 'speakDone'; id: number }
  | { type: 'stop' }
  | { type: 'gloss'; word: string; gloss?: Gloss; missing?: GlossMissing; saved?: boolean }
  /** The word's pronunciation, from the natural voice's phonemizer, once that voice is here. */
  | { type: 'ipa'; word: string; ipa: string }
  /** The word went into the notebook, or left it. */
  | { type: 'saved'; word: string; saved: boolean }
  /** The 3000 most common English words, for the dotted line under the others. */
  | { type: 'common'; words: string[] }
  /** A dictionary finished downloading: words asked while it ran can be asked again. */
  | { type: 'dictReady' }
  /** The app window's whole state. */
  | { type: 'app'; view: AppView }
  /** Show this tab of the app window (the tray's "About Tyts…"). */
  | { type: 'appTab'; tab: AppTab }
  /** The app window fills the screen or not (its button, a double click on its bar, Windows' keys): Maximize or Restore. */
  | { type: 'appWindow'; maximized: boolean }
  /** A key went down or up while a key field waits for one (`recordKeys`), read by the keyboard thread's hook: KeyboardEvent.code ('' for a key no hotkey names), at (ms since 1970). */
  | { type: 'keyEvent'; code: string; down: boolean; at: number }
  /** The tray's panel's whole state. */
  | { type: 'tray'; view: TrayView }
  /** Show this transcript in the app window (a finished note's balloon). */
  | { type: 'openTranscript'; id: string }
  /** A report was made at `file` for the person to attach, or could not be. */
  | { type: 'reported'; file?: string; error?: string }
  /** The Talk key, pressed anywhere: the talk window listens, sends what was said, or stops the duck and listens; `hidden`: the window was closed or minimized, the microphone and the voice stop. */
  | { type: 'talk'; command: 'toggle' | 'hidden' }
  /** The talk window's snapshot. */
  | { type: 'talkView'; view: TalkWindowView }
  /**
   * The dictation badge: record, then stop (and type it, or keep it as a note), or throw away.
   * `session`: the engine's dictation heard while spoken (engine/stream.py), when the engine has them;
   * `expected`: the languages the person uses (their own, English, the others named); the phrase is one of them.
   */
  | { type: 'dictation'; command: 'start' | 'stop' | 'cancel'; mode: DictationMode; key: string; session?: string; expected?: string[] }
  /** `note`: said in place of "Typed" (Fast translated it, the model too slow just now). */
  | { type: 'dictationDone'; text: string; note?: string }
  /** The phrase is with the local model (text editing). */
  | { type: 'dictationEditing' }
  | { type: 'dictationError'; message: string }
  /** The call recording's panel (capture.ts): record, under `title` (`app`: the call program running, for the engine; ), stop and save, pause or go on, take a screenshot now. */
  | { type: 'capture'; command: 'start' | 'stop' | 'pause' | 'resume' | 'discard' | 'ask' | 'unask' | 'shot'; title?: string; app?: string; auto?: boolean; live?: boolean }
  /** The tray's panel was just shown: focus its first command. */
  | { type: 'trayShown' }
  | { type: 'edge'; view: EdgeView; fresh?: boolean }
  | { type: 'top'; view: TopView }
  /** Tyts's menu on one key: what it draws now. */
  | { type: 'menu'; view: MenuView }
  /** The bar by a selection: what it draws now (`n` grows with each showing, which fades it in again). */
  | { type: 'bar'; view: BarView }
  /** Where the pointer is over the bar's window (CSS pixels; -1, -1 away from it): main looks, as a window that never takes the keyboard may get no pointer events. */
  | { type: 'barPointer'; x: number; y: number }
  /** A click on the bar there (CSS pixels): the keyboard thread kept it from every window, the page finds the button. */
  | { type: 'barClick'; x: number; y: number }
  | { type: 'natural'; state: NaturalState }
  /** One sentence of reading `id` in the natural voice: 24 kHz audio and when each of its words is spoken. */
  | { type: 'naturalAudio'; id: number; index: number; samples: Float32Array; words: WordTime[] }
  | { type: 'naturalFailed'; id: number; message: string }

/** What a dictated phrase becomes: typed where the cursor is, typed in English, a note in the knowledge base, or English checked in the card (practice). */
export type DictationMode = 'type' | 'english' | 'note' | 'check'

/** The menu on one key: its groups of items by letter and name, the one lit, and the one just picked (-1 for none); both count through all the groups. */
export type MenuView = { groups: { letter: string; label: string }[][]; lit: number; fired: number; foot?: string }

/** The bar by a selection: the dot alone, the pill, or the pill and "…"'s list (over it when `listAbove`); the pill's buttons and the list's lines by name. */
export type BarView = { phase: 'dot' | 'pill' | 'list'; row: { id: string; label: string }[]; more: string; list: { id: string; label: string }[][]; listAbove: boolean; n: number }

export type ToHost =
  | { type: 'lookup'; word: string }
  | { type: 'ready' }
  | { type: 'speak'; id: number; items: string[]; lang: string; separator: string }
  /** Reads `items` in a natural voice; `naturalAt` says which of them started playing, so the next ones get made. */
  /** `ahead`: sentences to make after `items` and keep, not to read (what a step forward will want). */
  | { type: 'speakNatural'; id: number; items: string[]; voice: string; rate: number; ahead?: string[] }
  | { type: 'naturalAt'; id: number; index: number }
  | { type: 'downloadNatural' }
  /** The person closed the offer of the natural voice. */
  | { type: 'dismissNatural' }
  | { type: 'stop' }
  | { type: 'openSpeechSettings' }
  /** Windows Settings → Language, where text recognition for a language is added. */
  | { type: 'openLanguageSettings' }
  /** The card's content is this tall, in CSS pixels; the window follows. */
  | { type: 'height'; px: number }
  /** A pinned card stays open when another window is clicked. */
  | { type: 'pin'; on: boolean }
  /** The card fills the screen, or goes back to where and how big it was. */
  | { type: 'maximize'; on: boolean }
  | { type: 'close' }
  /** Translate the last text again, after a failure. */
  | { type: 'retry' }
  /** Translate card `id`'s text again with the level's model, however long it takes (Fast did it, the model too slow just now). */
  | { type: 'waitForModel'; id: number }
  /** Translate a text card's text (as it stands, maybe edited) from one language into another, by codes. */
  | { type: 'translateText'; id: number; text: string; from: string; to: string }
  /** Check a check card's English (as it stands, maybe edited). */
  | { type: 'checkText'; id: number; text: string }
  | { type: 'copyText'; text: string }
  /** Paste a translation (or a checked text set right) over the selection it was made from, in the window it was selected in. */
  | { type: 'pasteText'; id: number; text: string }
  /** Put a word into the notebook, with the sentence it was met in, or take it out. */
  | { type: 'saveWord'; word: string; sentence: string }
  | { type: 'unsaveWord'; word: string }
  // The app window.
  | { type: 'appReady' }
  | { type: 'saveSettings'; patch: Partial<Settings> }
  | { type: 'removeWord'; id: number }
  /** Save the notebook as a file for Anki, or copy it as text. */
  | { type: 'exportWords' }
  | { type: 'copyWords' }
  /** Open one of the About tab's links in the browser. */
  | { type: 'openLink'; url: string }
  /** The app window's own buttons: it has no Windows frame. Close hides it, as Tyts lives in the tray. */
  | { type: 'window'; action: 'minimize' | 'maximize' | 'close' }
  /** A key field waits for a key, or no longer: the keyboard thread reads the keys first (Ctrl+Esc, Shift+Caps Lock, Alt) and sends them as `keyEvent`. */
  | { type: 'recordKeys'; on: boolean }
  /** The Transcribe page's microphone recording (or Talk's listening) began or ended: the tray shows it. */
  | { type: 'micRecording'; on: boolean }
  /** Talk (talk.ts), from the talk window: a new talk on a topic, a line said or typed, the duck's answer under way dropped, New talk; `talkListen`: it began listening, so the model loads meanwhile. */
  | { type: 'talkStart'; topic: string }
  | { type: 'talkSay'; text: string }
  | { type: 'talkInterrupt' }
  | { type: 'talkClear' }
  | { type: 'talkListen' }
  /**
   * The talk window's page is ready for its snapshot; its pin; its bar's buttons: closed, maximized or put back, its settings (the app
   * window's Talk page) or its model (Models › Check my English) asked for; from its history, a talk put away continued or removed, every one forgotten.
   */
  | { type: 'talkReady' }
  | { type: 'talkPin'; on: boolean }
  | { type: 'talkWindow'; action: 'close' | 'maximize' | 'settings' | 'model' }
  | { type: 'talkContinue'; id: string }
  | { type: 'talkDelete'; id: string }
  | { type: 'talksClear' }
  /** From the app window's Talk page: open the talk window. */
  | { type: 'talkOpen' }
  // The menu on one key (menuwindow.ts): its page is ready; its content is this tall, in CSS pixels; the pointer is on an item, or clicked one (counted through all the groups).
  | { type: 'menuReady' }
  | { type: 'menuHeight'; px: number }
  | { type: 'menuHover'; index: number }
  | { type: 'menuPick'; index: number }
  // The bar by a selection (barwindow.ts): its page is ready; its pill (with the list when open) is this big, in CSS pixels; a button was clicked ('more': "…").
  | { type: 'barReady' }
  | { type: 'barSize'; width: number; height: number }
  | { type: 'barPick'; id: string }
  // The tray's panel.
  | { type: 'trayReady' }
  | { type: 'edgeReady' }
  | { type: 'topReady' }
  | { type: 'edgeHeight'; px: number }
  | ({ type: 'edgeAct' } & EdgeAct)
  /** The panel's content is this tall, in CSS pixels; the window follows. */
  | { type: 'trayHeight'; px: number }
  | { type: 'tray'; command: TrayCommand }
  /** The tray's "Keep a word as typed…" field: add it to Kept as typed (the panel stays). */
  | { type: 'keepWord'; word: string }
  /** Esc, or a click outside it. */
  | { type: 'trayClose' }
  // The speech engine; `models` are downloaded once the service runs (the setup's picks).
  | { type: 'installSpeech'; parts: SpeechPart[]; models?: string[] }
  /** The first-run setup: the translator for the person's language and its word dictionary, downloaded ahead of use. */
  | { type: 'prepareTranslator' }
  /** The translation level picked on the Translate page (a model: the one model, for Check too): saved, and its models downloaded. */
  | { type: 'translationLevel'; level: TranslationLevel }
  /** The one model picked on the Check page (translation too, when it is not Fast): saved and downloaded. */
  | { type: 'useModel'; model: LlmModel }
  /** Forget one kept mistake (by its time), or all of them. */
  | { type: 'forgetMistake'; at: string }
  | { type: 'clearMistakes' }
  | { type: 'prepareDictionary' }
  /** Run the speed test (the person agreed), or not now. */
  | { type: 'testSpeech' }
  | { type: 'declineSpeechTest' }
  /** A speech model downloaded now, ahead of its use. */
  | { type: 'downloadSpeechModel'; model: string }
  | { type: 'restartSpeech' }
  | { type: 'showInFolder'; path: string }
  | { type: 'openPath'; path: string }
  /** Forget the phrases dictated lately; the texts translated lately. */
  | { type: 'clearDictation' }
  | { type: 'clearTranslations' }
  /** One phrase or one translation forgotten, by when it was kept. */
  | { type: 'forgetPhrase'; at: string }
  | { type: 'fixPhrase'; at: string; text: string }
  | { type: 'forgetTranslation'; at: string }
  /** What Tyts learned from the person's typing: one word out of a list, or everything. */
  | { type: 'unlearn'; list: 'alwaysFix' | 'myWords'; word: string }
  | { type: 'forgetLearned' }
  /** The clipboard history: a clip pinned or not, one forgotten (by when it was copied), or all but the pinned. */
  | { type: 'clipPin'; at: string; on: boolean }
  | { type: 'clipForget'; at: string }
  | { type: 'clipsClear' }
  /** A backup of the settings and the libraries saved as a file, imported from one (the person picks it), or the settings all back to how they came. */
  | { type: 'exportBackup' }
  | { type: 'importBackup' }
  | { type: 'resetSettings' }
  /** Every key back to how it came (after a question). */
  | { type: 'resetKeys' }
  /** Report a problem (report.ts): the zip made and shown in its folder, then the email or the GitHub issue opened with `text` in it; or Tyts's folder with the logs opened. */
  | { type: 'reportProblem'; via: 'email' | 'github'; text: string }
  | { type: 'openLogs' }
  /**
   * Measure what Tyts keeps (the Models or Storage page opened). Remove one part (a language model: Fast in its place
   * when it translated; the speech engine whole, or its graphics card's or speakers' part); each downloads again when
   * wanted. Clean up removes every part nothing uses. Use recommended: the models advised for this computer, and their downloads.
   */
  | { type: 'storage' }
  | { type: 'removeStored'; id: StorageId; item?: string }
  | { type: 'cleanUp' }
  | { type: 'useRecommended' }
  /** What is left in the old folders moved into Tyts's: the engine and the model's server stopped first, Tyts started again after. */
  // The dictation badge.
  | { type: 'dictationReady' }
  /** A phrase to type: the whole recording, as webm (an engine without sessions). */
  | { type: 'dictationAudio'; mode: DictationMode; audio: Uint8Array }
  /** A phrase to type, recognized while it was spoken: its text, the language the engine heard ("" when it does not say) and how sure it is. */
  | { type: 'dictationText'; mode: DictationMode; text: string; language: string; sure: number }
  /** A note was recorded into the engine as this transcript. */
  | { type: 'dictationNote'; id: string }
  /** The badge's content is this tall, in CSS pixels; the window follows, its bottom edge kept. */
  | { type: 'dictationHeight'; px: number }
  /** The person folded the badge away for this phrase; `fly`: into the tray, or at once where motion is reduced. */
  | { type: 'dictationTuck'; fly: boolean }
  | { type: 'dictationCancelled' }
  // The call recording's panel: how the recording goes (`seconds` recorded; `silent`: no sound from the computer yet in its first minute;
  // `quiet`: nobody heard for ten minutes, the panel asks before it stops;
  // `micMissing`: the others alone; `error`: the computer's sound could not be had), its end (`id` null when nothing was recorded),
  // hidden by its chevron, or the system's settings asked for (macOS' Screen & System Audio Recording).
  | { type: 'captureState'; state: CallState; id?: string; seconds?: number; silent?: boolean; quiet?: boolean; micMissing?: boolean; error?: string }
  | { type: 'captureDone'; id: string | null; lost: number }
  | { type: 'captureHide' }
  | { type: 'captureOpenSettings' }
  /** The question "Record the call?" answered (callAuto 'ask'). */
  | { type: 'captureAnswer'; record: boolean }
  /** "Copy a phrase for the chat": main puts its own sentence (call.phrase) on the clipboard; the page names no text. */
  | { type: 'captureCopyPhrase' }
  /** The panel opened its draft of the words (taller) or closed it. */
  | { type: 'captureExpand'; open: boolean }
  /** A screenshot the person asked for was kept, or was not. */
  | { type: 'captureShot'; ok: boolean }
  /** From the app window's Recordings page: a call recording started, or stopped and saved. */
  | { type: 'toggleCall' }
  /** Makes (or makes again) a transcript's summary; main saves it in the engine. */
  /** The Permissions page: ask the system for this one, or open its settings where it was refused. */
  | { type: 'grantAccess'; id: AccessId }
  | { type: 'summarize'; id: string; template: SummaryTemplate; own?: string; mine: boolean; length?: SummaryLength }
  | { type: 'cancelSummary'; id: string }
  | { type: 'dictationFailed'; message: string }

/** Calls a page makes and waits for (ipcMain.handle), through `window.tutorHost.call`. */
export type HostCall =
  /** One call to the speech engine's HTTP API. */
  | { call: 'speech'; method: string; route: string; body?: unknown }
  | { call: 'pickFolder'; title: string; current: string }
  /** Save a transcript: a Save dialog, then the engine writes the file. */
  | { call: 'exportTranscript'; id: string; format: string; name: string }
  | { call: 'copy'; text: string }
  /** The programs with a window open now, by .exe name, for the Programs page: answers string[]. */
  | { call: 'runningApps' }
  /** A question to the recorded calls: the engine's passages, answered by the local model (ask.ts); answers Answer. */
  | { call: 'askCalls'; question: string }
  /** The Notes page: the knowledge base folder's Markdown files (kbnotes.ts), without those Tyts wrote from a transcript the library still has; answers { dir: string; files: KbRow[] }. */
  | { call: 'kbList'; query: string }
  /** One of those files: answers { title, created, text }. */
  | { call: 'kbRead'; path: string }
  /** A new name in the same folder: answers the new path; throws 'nameTaken' when a file has it. */
  | { call: 'kbRename'; path: string; name: string }
  /** To the system's trash, never deleted for good. */
  | { call: 'kbTrash'; path: string }
  /** The passages for a question to the notes: the engine's from the transcripts and the folder's files', the best first; `only` keeps to one note, `before` is the question asked before in the conversation. Answers Passage[]. */
  | { call: 'findPassages'; question: string; scope: NoteScope; only?: { id?: string; file?: string }; before?: string }
  /** The local model's answer from those passages (ask.ts), as text with [n]; `stopAnswer` ends it early. */
  | { call: 'answerNotes'; question: string; passages: Passage[]; before: Turn[] }
  | { call: 'stopAnswer' }

/** What every page has as `window.tutorHost` (preload.ts). */
export type TutorHost = {
  post(message: ToHost): void
  call(request: HostCall): Promise<unknown>
  /** A dropped or picked file's path on disk. */
  pathOf(file: File): string
}
