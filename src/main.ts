// Kryakl's main process. It lives in the tray and waits for a text:
//   - Ctrl+C twice in any program, or the listen key: the selected text;
//   - the snip key (Ctrl+Alt+S): Windows' own snipping overlay opens, and the
//     piece of the screen it puts on the clipboard is read with the OCR built
//     into Windows.
// The text is translated offline and shown in the card, a small window by the
// pointer: the text in English on top, read aloud by the natural voice or a
// system one, and its translation under it. Closing the card silences it.
// The translate keys (the selection, Ctrl+Alt+T for a piece of the screen)
// show the same card as a translator instead: the text as it is and its
// translation, from the language it is in into the person's own (from theirs
// into English), the two languages to change or swap.
//
// The app window (media/app.html) holds the notebook of saved words, the
// settings and how to use; the tray menu has the quick switches. The keyboard
// helper (keyboard.ts, kbd-worker.ts) switches and fixes layouts as one types.
// The speech engine (speechhost.ts: Python, installed in parts when first
// wanted) serves Dictate (dictation.ts), Transcribe and the calls.
//
// %APPDATA%\Kryakl\ (moved over from Krya's, Altype's, 2Talker's or tu-talk's folder, once: oldfolder.ts)
//   settings.json   see settings.ts
//   words.json      the word notebook (words.ts)
//   dictation.json  the phrases dictated lately, 30 days at most (dictationlog.ts)
//   translations.json  the texts translated lately, 30 days at most (translationlog.ts)
//   learning.json   what the layout fixer learned from the person's typing (learning.ts)
//   voice\          the natural voice, downloaded on request
//   dict\           word dictionaries for languages other than Russian
//   models\         the translator's models, one folder per language pair
//   speech.json     the speech engine's settings (engine/settings.py), speech.log
// %LOCALAPPDATA%\Kryakl\ (moved over from Krya's and Altype's, once; a part that could not move is used there)
// %LOCALAPPDATA%\Kryakl\speech\   the speech engine's Python, packages and models
// %LOCALAPPDATA%\Kryakl\translate\   llama.cpp and the Gemma 4 models (Accurate, Most accurate)

import * as fs from 'node:fs'
import * as path from 'node:path'

import { execFile, execFileSync } from 'node:child_process'

import { app, BrowserWindow, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, nativeTheme, powerMonitor, screen, session, shell, systemPreferences, Tray, type Rectangle } from 'electron'

import { backupSummary, makeBackup, readBackup, type BackupRead } from './backup'
import { callAllowed, messageAllowed, openable, pageOf, patchAllowed, type Page } from './bridge'
import { callApp, callTitle, runningProcessNames } from './callapps'
import { answer as answerCall, idleWatch, keepRecording, step as stepCall, type CallAct, type MicUser } from './callwatch'
import { watchMic } from './micwatch'
import { CallCapture } from './capture'
import { createChecker, type Checker } from './checker'
import { keyShots, shotAt, shownShots, speakerHints, type Shot } from './shots'
import { createSummarizer, type ScreenText, type SummaryTemplate } from './summary'
import { createAsker, type Passage } from './ask'
import { autoSummaryWanted, summaryInput, type SummarySource } from './summaryflow'
import { createEditor, type Editor } from './dictedit'
import { DoubleCopy } from './clipboard'
import { ClipboardGuard } from './clipguard'
import { Dictation } from './dictation'
import { createDuck, type Duck } from './duck'
import { DictationLog } from './dictationlog'
import { DOWNLOADABLE, DictionaryStore } from './dictstore'
import { openStream } from './download'
import { frameWindow, WIN11 } from './dwm'
import { createTranslator, NATIVES } from './engine'
import { LEVEL_VRAM_MB, translationAdvice } from './hardware'
import { COPY_TWICE, hotkeyLabel, isAccelerator, onMac } from './hotkey'
import { levelName, setUiLanguage, t } from './i18n'
import { engineMessage } from './i18n/engine'
import { FIX_LANGUAGES, KeyboardHelper, keyboardLayouts } from './keyboard'
import { cardMemoryFree, cardMemoryUsed, driveOf, freeMb, loadModelSpeeds, loadVoiceSpeed, median, nextModelSpeed, nextVoiceSpeed, saveModelSpeeds, saveVoiceSpeed, type ModelSpeeds, type VoiceSpeed } from './device'
import { defaultNative, findLanguage, langCode, scriptFor } from './languages'
import { convertText, layoutsAfter, nextLayout, sourceLayout, type KeyTable } from './layoutfix'
import { LearnStore } from './learning'
import { lookup, type Dictionary } from './lemma'
import { LlamaServer } from './llama'
import { createLlmFiles, LLM_MODELS, llmPaths, type LlmFiles } from './llmfiles'
import { createLlmTranslators, ModelSlow, type LlmTranslators } from './llmtranslator'
import { BUSY_MS, busyName, slowAfter, tryAgain, type ModelBusy } from './modelbusy'
import { cardRoom, sharedReading } from './resources'
import { MistakeStore } from './mistakes'
import { log, logTo } from './log'
import { NATURAL_PREFIX, systemVoiceName, type NaturalState } from './natural'
import { recognize, recognizeMac } from './ocr'
import { pickLines } from './ocrpick'
import { adoptLocalFolder, adoptOldFolders, freeFolder, hasToMove, healSpeech, leftIn, moveDownloads, OLD_LOCAL_FOLDERS, partDir, removeOldUpdaterCaches, type LeftPart, type Warn } from './oldfolder'
import { paragraphsOf } from './ocrtext'
import { menuGroups, type MenuAction } from './menu'
import { TytsMenu } from './menuwindow'
import { placeByTray, placeNear, resize, type Point } from './placement'
import type { AppTab, AppView, BusyPart, CardKind, CardState, CheckResult, DictationMode, DictionaryStatus, GlossMissing, HostCall, HostVoice, Refused, StorageId, StoragePart, StorageView, TalkWindowView, TextResult, ToHost, ToView, TranslationState, TrayCommand, TrayView, ViewConfig } from './protocol'
import { draftsIn, englishHtml, textOutHtml, translationHtml } from './render'
import { issueUrl, mailUrl, makeReport, namesHere, reportName, type ReportFacts } from './report'
import { addKept, CARD_WIDTH, DEFAULTS, keptForm, LEVEL_NAMES, myLanguages, normalize, SUMMARY_OWN_MAX, TARGET, type LlmModel, type Settings, type TranslationLevel } from './settings'
import { Speaker, listHostVoices } from './speech'
import { SpeechHost } from './speechhost'
import { MODELS as SPEECH_MODELS } from './speechplan'
import { SPEECH_PORT } from './speechservice'
import { recommendedModels } from './setup'
import { cleanable, markAway, measureParts, partPackages, speechModelDir, splitSpeech, withUse, type Place, type UseContext } from './storage'
import { NaturalSpeaker } from './synth'
import { system32 } from './system32'
import { Talk } from './talk'
import { summaryOf, TalkStore } from './talks'
import {
  drafted,
  englishReady,
  languageOf,
  plainText,
  splitText,
  targetFor,
  throughEnglish,
  translateLines,
  translatePairs,
  translatePlain,
  type LanguageWords,
  type Line,
  type TextLine,
  type Translate,
} from './translate'
import { TranslationLog } from './translationlog'
import type { Translator } from './translator'
import manifest from './voice-manifest.json'
import { vocabularyFor } from './vocabulary'
import { VoiceStore, type VoiceManifest } from './voicestore'
import { wordDiff } from './worddiff'
import { focus, focusedElement, release, saysNothingSelected, selectedText } from './uia'
import { allowForeground, ctrlHeld, handleOf, inFront, keysLetGo, pressCopy, pressPaste, pressSelectBack, watchClipboard, watchRendering } from './winclip'
import {
  privateCopy,
  readers as clipboardReaders,
  render as renderClipboardText,
  renderAll as renderAllClipboardText,
  restore as restoreClipboardSnapshot,
  sequence as clipboardSequence,
  snapshot as clipboardSnapshot,
  writeText as writeClipboardText,
  type ClipboardSnapshot,
} from './winclipboard'
import { caretOf, exeOf, focusWindow, foreground, fullScreenNow, installedLayouts, layoutTable, press, windowedApps } from './winkbd'
import { ankiTsv, WordStore, wordsText } from './words'

const CARD_MIN = 96
/** Without a height set by hand, a card grows to this share of the screen. */
const CARD_AUTO_SHARE = 0.7
/** The offline translator takes a few hundred ms a sentence: a longer text is cut. */
const MAX_TEXT_CHARS = 6000
/** How long after the snip shortcut a picture on the clipboard counts as the snip. */
const SNIP_WAIT_MS = 120_000
/** Programs put a copy on the clipboard in steps; it is read once they are done. */
const SETTLE_MS = 60
/** How long after Kryakl presses Ctrl+C the program's copy may come: a busy VS Code (Claude writing an answer) takes over half a second. */
const COPY_WAIT_MS = 2000
/** No copy by then: the field's selection is read through UI Automation instead (Claude's question box in VS Code never answers Ctrl+C). */
const UIA_WAIT_MS = 600
/** How long after Kryakl's own write to the clipboard a change is still taken for that write. */
const OWN_CLIPBOARD_MS = 300
/** A selection converted into another layout is selected again up to this long. */
const RESELECT_MOST = 400
/** Layout switchers that would fix words a second time, by their .exe name. */
const RIVALS: Record<string, string> = { 'everylang.exe': 'EveryLang', 'punto.exe': 'Punto Switcher' }
/** Other programs that watch the keyboard, by their .exe name: no harm, named on the Keyboard page. */
const KEYBOARD_APPS: Record<string, string> = {
  'autohotkey.exe': 'AutoHotkey',
  'autohotkey64.exe': 'AutoHotkey',
  'autohotkey32.exe': 'AutoHotkey',
  'autohotkeyu64.exe': 'AutoHotkey',
  'autohotkeyu32.exe': 'AutoHotkey',
  'whispertyping.exe': 'WhisperTyping',
  'powertoys.keyboardmanagerengine.exe': 'PowerToys Keyboard Manager',
  'listary.exe': 'Listary',
  'qtranslate.exe': 'QTranslate',
  'logioptionsplus_agent.exe': 'Logitech Options+',
}
/** The tray's panel: its width; a click on the tray icon this soon after the panel hid on that click's blur only closes it. */
const TRAY_WIDTH = 360
const TRAY_REOPEN_MS = 300
/** Ctrl+C pressed twice, a key of an action on the selection (settings.ts COPY_TWICE_KEYS), as a card's header draws it too. */
const DOUBLE_COPY = COPY_TWICE
/** The settings that are keys of actions. */
const ACTION_KEYS: readonly (keyof Settings)[] = ['menuKey', 'selectKey', 'snipKey', 'translateKey', 'textKey', 'inPlaceKey', 'checkKey', 'typeKey', 'typeCheckKey', 'switchKey', 'fixKey', 'pauseKey', 'windowKey']
/** The settings the keyboard thread is given (besides the keys). */
const KEYBOARD_SETTINGS: readonly (keyof Settings)[] = [
  'layouts',
  'languages',
  'switchOn',
  'layoutKeys',
  'autoFix',
  'fixTwoCaps',
  'fixCapsLock',
  'keepCaps',
  'fixOnPause',
  'fixSound',
  'switchSound',
  'switchSoundName',
  'learn',
  'fixKeyOn',
  'apps',
  'keepWords',
  'layoutBadge',
  'trayLayout',
  'quietFullScreen',
  'paused',
]
/** The links the About tab may open. */
const LINKS = new Set([
  'https://t.me/designmakc',
  'https://github.com/designmakc',
  'https://github.com/designmakc/tyts',
  'https://github.com/designmakc/tyts/releases',
  'https://github.com/designmakc/tyts/blob/main/NOTICE',
  'mailto:designmakc@gmail.com',
  'https://ikstro.com',
  'https://github.com/ikstro/kryakl',
  'https://github.com/ikstro/kryakl/releases',
  'https://github.com/ikstro/kryakl/blob/main/NOTICE',
  // The author's own places, and a letter to him (About).
  'https://github.com/ikstro',
  'https://linkedin.com/in/ikstro',
  'https://t.me/ikstrovert',
  'https://behance.net/ikstro',
  'mailto:hello@ikstro.com',
  // The steps to the speakers' model: an account, the model's terms, a Read token.
  'https://huggingface.co/join',
  'https://huggingface.co/pyannote/speaker-diarization-community-1',
  'https://huggingface.co/settings/tokens',
  // A Mac's Accessibility settings, for the keyboard helper's tap (the Keyboard layout page).
  'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
  'x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent',
])

/** The settings that are Dictate's keys (and Talk's, which listens as dictation does): registered only once the speech engine is installed. */
const DICTATION_KEYS: readonly (keyof Settings)[] = ['dictateKey', 'englishKey', 'noteKey', 'againKey', 'practiceKey', 'talkKey', 'meetingKey', 'shotKey']

// One Kryakl at a time, whichever folder it keeps its things in: the lock is taken on Kryakl's own
// folder first, before a test run moves to its own. A second copy (another start, `npm start`, a test
// run) hands its arguments to the first and quits; the first opens its window.
const theOnlyOne = app.requestSingleInstanceLock()
// A test run (TYTS_TEST_HOME; ALTYPE_TEST_HOME, the old name, still read) keeps to its own folders and port; the installed Kryakl is quit first.
const TEST_HOME = process.env.TYTS_TEST_HOME || process.env.ALTYPE_TEST_HOME || undefined
if (TEST_HOME) app.setPath('userData', TEST_HOME)
const speechPort = TEST_HOME ? Number(process.env.TYTS_TEST_PORT || process.env.ALTYPE_TEST_PORT) || 8797 : SPEECH_PORT

const userDir = () => app.getPath('userData')
const localAppData = () => process.env.LOCALAPPDATA ?? path.join(app.getPath('appData'), '..', 'Local')
/** %LOCALAPPDATA%\Kryakl: what is big and downloaded (the speech engine, the translation models), never roamed. */
const localDir = () => TEST_HOME ?? path.join(localAppData(), 'Tyts')
/** %LOCALAPPDATA%\Krya and \Altype, the old names' folders, newest first: a part that could not move out of one is used there (oldfolder.ts adoptLocalFolder). */
const oldLocalDirs = () => (TEST_HOME ? [] : OLD_LOCAL_FOLDERS.map(name => path.join(localAppData(), name)))
/** A part of localDir (speech, translate), or the old folder's when it is still there. */
const localPart = (name: string) => partDir(name, localDir(), ...oldLocalDirs())
/** A download's folder (the Firefox models, the voice, the word meanings): in localDir, beside the rest (oldfolder.ts moveDownloads); else where its move left it. */
const downloads = (name: string) => partDir(name, localDir(), ...oldLocalDirs(), userDir())
const settingsFile = () => path.join(userDir(), 'settings.json')
/** A file the packaged app keeps outside its archive: the workers run as separate processes. */
const unpacked = (...parts: string[]) => path.join(app.getAppPath(), ...parts).replace(/app\.asar([\\/])/, 'app.asar.unpacked$1')

/**
 * uv's own download cache on this computer, as uv finds it (UV_CACHE_DIR, else %LOCALAPPDATA%\uv\cache),
 * when it is there: the speech engine's packages already in it are taken from it, not downloaded again.
 */
function sharedUvCache(): string | undefined {
  const dir = process.env.UV_CACHE_DIR || (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'uv', 'cache') : '')
  return dir && fs.existsSync(dir) ? dir : undefined
}

let settings: Settings
let tray: Tray | undefined
let card: BrowserWindow | undefined
let cardReady = false
let pinned = false
let shownAt = 0
/** The card on screen; a newer text replaces it. */
let seq = 0
let shown: { id: number; kind: CardKind; state: CardState; via?: string } | undefined
let last: { id: number; text: string; kind: CardKind; note?: string } | undefined
let snipSince = 0
/** What the snip is for: the card to listen to, or the translator; the key that asked for it. */
let snipFor: Purpose = 'listen'
let snipVia: string | undefined
/** Kryakl is using the clipboard itself (converting a selection, pasting, putting it back): its changes are no requests. */
let clipboardBusy = false
/** What the person had on the clipboard, kept while Kryakl borrows it and put back after; the card's window owns Kryakl's writes. */
const clipGuard = new ClipboardGuard<ClipboardSnapshot>({
  sequence: clipboardSequence,
  snapshot: () => clipboardSnapshot(clipboardOwner()),
  restore: saved => restoreClipboardSnapshot(clipboardOwner(), saved),
  writeText: (text, paste) => writeClipboardText(clipboardOwner(), text, paste),
})
function clipboardOwner(): bigint {
  return card && !card.isDestroyed() ? handleOf(card) : 0n
}
/** Its last write is announced a moment later, until then. */
let ownClipboardUntil = 0
let stopWatching: (() => void) | undefined
let hostVoices: HostVoice[] | undefined
const copies = new DoubleCopy()
let appWin: BrowserWindow | undefined
let appReady = false
let quitting = false
let keysOk = { snip: true, select: true, translate: true, text: true, inPlace: true, check: true, type: true, typeCheck: true, pause: true, window: true }
let speechKeysOk = { dictate: true, note: true, english: true, again: true, practice: true, talk: true, meeting: true, shot: true }
let speech: SpeechHost
let dictation: Dictation
/** The call recording (capture.ts): the computer's sound and the microphone, in its own panel. */
let capture: CallCapture | undefined
/** Quitting asked about the call being recorded, and it is being saved: the next quit goes through. */
let callQuitAsked = false
/** What a click on the tray's balloon does, for the balloon shown last. */
let balloonClick: (() => void) | undefined
let keyboard: KeyboardHelper
/** The menu on one key, by the text cursor. */
let oneKeyMenu: TytsMenu | undefined
let keyboardTrouble: string | undefined
/** On a Mac without Accessibility the keyboard thread sees no key: the dictation keys held to talk go back to Electron's toggle. */
let keysUnseen = false
/** Which Mac permission keysUnseen waits for: 'macAccess' (Accessibility) or 'macInput' (Input Monitoring). */
let macTrouble = 'macAccess'
let lastApp: string | undefined
/** A program run as administrator was in front lately: Windows keeps its keys from Kryakl's hooks. */
let elevatedApp: string | undefined
/** The layout in front and Caps Lock, for the tray's icon (when it shows the layout). */
let frontLayout: { layout: string; caps: boolean } | undefined
let learned: LearnStore
let translationLog: TranslationLog
let rivals: string[] = []
let keyboardApps: string[] = []
let foreignKeys = false
let trayPanel: BrowserWindow | undefined
let trayReady = false
let trayHeight = 600
/** The last word fixed by itself, as typed and as fixed, for the tray's "Keep a word as typed…"; kept in memory only. */
let lastAutoFix: { word: string; fixed: string } | undefined
let trayShownAt = 0
let trayHiddenAt = 0
/** The Transcribe page records from the microphone (its `micRecording` message): the tray shows the red dot. */
let micRecording = false
/**
 * A selection key pressed Ctrl+C: the next copy is the selection, shown by
 * the pointer to listen to or translate, and the window it was selected in
 * (the clipboard as it was is kept by `clipGuard`).
 */
let copyWanted: { since: number; at: Point; purpose: Purpose; window: bigint; field: unknown; via?: string; exe: string } | undefined
/** A selection key found nothing copied: a copy that still comes this soon after, with Ctrl up (not the person's own Ctrl+C), is the program's late answer and is taken back. */
let lateCopyUntil = 0
const LATE_COPY_MS = 1500
/**
 * The translator open on a selection: the window to paste its translation
 * into, and the field the selection was in (UI Automation's element), to give
 * the keyboard back to: VS Code's chat, brought back to the front, does not
 * take it back by itself.
 */
let pasteTarget: { id: number; window: bigint; field: unknown; after?: string } | undefined
/** The window in front when the card opened, which gets the keyboard back when the card is closed (Esc, ✕). */
let cameFrom: bigint | undefined
/** The card's bounds when its edge began to be dragged; the content's height, which the card follows otherwise. */
let resizeFrom: Rectangle | undefined
let contentHeight = 160
/** The card fills the work area: its bounds before, to go back to. */
let maximizedFrom: Rectangle | undefined
/** Whether the card was pinned before it was maximized: it goes back to that on restore. */
let pinnedBefore = false
/** The tab the app window opens on, once its page is ready. */
let pendingTab: AppTab | undefined
/** The transcript it shows then (a note left in Transcripts, from its balloon). */
let pendingTranscript: string | undefined
/** The Talk key was pressed before the talk window's page was ready: it listens once it is. */
let pendingTalk = false
/** The talk with the duck (talk.ts), the duck's answers (duck.ts), and the talks kept on disk (talks.ts). */
let talk: Talk
let duck: Duck
let talks: TalkStore
/** The talk window (media/talk.html), made when first opened and hidden between uses. */
let talkWin: BrowserWindow | undefined
let talkReady = false
/**
 * The page that reads aloud now, the card or the talk window: the natural
 * voice's audio and the system voice's progress go to it. The page that asked
 * for a word's meanings last gets them.
 */
let voiceSink: VoicePage = 'card'
let glossSink: VoicePage = 'card'
type VoicePage = 'card' | 'talk'
let words: WordStore
let dictationLog: DictationLog
/** The most common English words, for the card's dotted lines; read once. */
let common: string[] | undefined

// ---------------------------------------------------------------- settings

function systemNative(): string {
  return defaultNative([app.getLocale(), ...app.getPreferredSystemLanguages()], TARGET)
}

/**
 * The app was called Krya until 0.15, Altype until 0.11, 2Talker and tu-talk before: its things move over once,
 * %APPDATA%'s item by item, %LOCALAPPDATA%'s whole when it can (the speech engine's Python set right
 * for its new place). A test run keeps to its own folder and moves nothing. Returns what moved, for the log.
 */
function adoptOldFolder(): Moved {
  if (TEST_HOME) return { moved: [], stopped: [], left: [] }
  const warn = (message: string, error: unknown) => console.warn(message, error)
  const moved = adoptOldFolders(app.getPath('appData'), userDir(), warn)
  const local = moveLocalFolder()
  if (app.isPackaged) removeOldUpdaterCaches(localAppData(), warn)
  return { ...local, moved: [...moved, ...local.moved] }
}

/** What stayed in one old folder after a move, and why. */
type LeftIn = { dir: string; parts: LeftPart[] }

/** What a move from the old folders did: what moved, the programs stopped to let go of their files, what stayed and why. */
type Moved = { moved: string[]; stopped: string[]; left: LeftIn[] }

/**
 * %LOCALAPPDATA%\Krya and \Altype into Kryakl's folder (oldfolder.ts adoptLocalFolder), newest first, and the
 * downloads from %APPDATA%\Kryakl (moveDownloads). Programs run from inside an old folder (the speech engine's
 * Python, llama-server, left by Krya, Altype or a run from source) keep its files in use, so they are stopped
 * first, only while it holds something to move.
 */
function moveLocalFolder(): Moved {
  const moved: string[] = []
  const stopped: string[] = []
  const left: LeftIn[] = []
  for (const old of oldLocalDirs()) {
    const errors = new Map<string, unknown>()
    const warn: Warn = (message, error, from) => {
      console.warn(message, error)
      if (from) errors.set(path.basename(from), error)
    }
    const freed = hasToMove(old, localDir()) ? freeFolder(old, undefined, warn) : { stopped: [], holding: [] }
    moved.push(...adoptLocalFolder(old, localDir(), warn).map(name => `local/${path.basename(old)}/${name}`))
    stopped.push(...freed.stopped.map(p => `${p.name} (${p.pid})`))
    const parts = leftIn(old, localDir(), errors, freed.holding)
    if (parts.length) left.push({ dir: old, parts })
  }
  moved.push(...moveDownloads(userDir(), localDir(), (message, error) => console.warn(message, error)).map(name => `downloads/${name}`))
  leftOld = left
  return { moved, stopped, left }
}

/** What the last move left in the old folders and why: the Storage page says it beside Move to Kryakl. */
let leftOld: LeftIn[] = []

/** The log's lines for a move: what was stopped for it, what stayed in each old folder and why. */
function logMoved(r: Moved): void {
  if (r.moved.length) log(`moved over from the old folders: ${r.moved.join(', ')}`)
  if (r.stopped.length) log(`stopped to free the old folders: ${r.stopped.join(', ')}`)
  for (const { dir, parts } of r.left) log(`left in ${dir}: ${parts.map(p => `${p.name} (${p.why})`).join(', ')}`)
}

/** The old names' programs, with the folder that says each was installed here: while one runs, its folders are in use. */
const OLD_APPS = [
  { exe: 'Krya.exe', folder: 'Krya', name: 'Krya' },
  { exe: 'Altype.exe', folder: 'Altype', name: 'Altype' },
]

/** The old name's program still running (Krya.exe or Altype.exe, an older install), so this start gives way; its name, else undefined. */
function oldAppRunning(): string | undefined {
  if (TEST_HOME) return undefined
  for (const old of OLD_APPS) {
    if (!fs.existsSync(path.join(app.getPath('appData'), old.folder, 'settings.json'))) continue
    try {
      const out = execFileSync(system32('tasklist.exe'), ['/FI', `IMAGENAME eq ${old.exe}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true, timeout: 5000 })
      if (out.toLowerCase().includes(`"${old.exe.toLowerCase()}"`)) return old.name
    } catch {
      // Windows did not answer: this start goes on.
    }
  }
  return undefined
}

function readSettings(): Settings {
  try {
    return normalize(JSON.parse(fs.readFileSync(settingsFile(), 'utf8')), systemNative())
  } catch {
    return normalize(undefined, systemNative())
  }
}

function saveSettings(patch: Partial<Settings>): void {
  const wasLanguage = settings.uiLanguage
  settings = normalize({ ...settings, ...patch }, settings.native)
  try {
    fs.mkdirSync(userDir(), { recursive: true })
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2) + '\n', 'utf8')
  } catch (error) {
    console.warn('Tyts: could not save the settings', error)
  }
  if ('startWithWindows' in patch) applyLoginItem()
  // A key may be Electron's or the keyboard thread's (hotkey.ts isAccelerator): both learn of any change.
  if ([...ACTION_KEYS, ...DICTATION_KEYS, 'paused', 'dictateHold'].some(k => k in patch)) registerShortcuts()
  if ([...ACTION_KEYS, ...DICTATION_KEYS, ...KEYBOARD_SETTINGS, 'dictateHold'].some(k => k in patch)) applyKeyboard()
  if ('trayLayout' in patch && !settings.trayLayout) frontLayout = undefined
  // Paused while a phrase is recorded: the phrase is dropped, as Esc would.
  if (patch.paused && settings.paused) dictation?.cancel()
  if ('theme' in patch) applyTheme()
  if (settings.uiLanguage !== wasLanguage) applyUiLanguage()
  // The speech models are chosen from these (speechplan.ts), and the words to spell go with the plan: sent to the engine again.
  if (speech && (['native', 'speechPrefer', 'dictationModel', 'transcriptsModel', 'speechTestAgreed', 'vocabulary'] as const).some(k => k in patch)) speech.replan()
  if ('talkOnTop' in patch) talkWin?.setAlwaysOnTop(settings.talkOnTop)
  if ('callAuto' in patch) void callAutoChanged()
  refreshTray()
  if (shown) postCard()
  postApp()
}

function applyLoginItem(): void {
  // A development run would register electron.exe itself.
  if (!app.isPackaged) return
  // Registered under the app's id, the one 2Talker used too: this replaces its entry.
  app.setLoginItemSettings({ openAtLogin: settings.startWithWindows })
  // tu-talk's entry had its own name and points at a program long gone.
  app.setLoginItemSettings({ openAtLogin: false, name: 'com.ikstro.tu-talk' })
}

/** The uninstaller asks its one question in the interface's language (build/installer.nsh reads it here); a run from source or a test run leaves the registry alone. */
function rememberUiLanguage(): void {
  if (!app.isPackaged || TEST_HOME) return
  execFile(system32('reg.exe'), ['add', 'HKCU\\Software\\Tyts', '/v', 'UiLanguage', '/d', settings.uiLanguage, '/f'], { windowsHide: true, timeout: 5000 }, () => undefined)
}

function config(): ViewConfig {
  return { voice: settings.voice, rate: settings.rate, wordHint: settings.wordHint, rareWords: settings.rareWords, oneAtATime: settings.oneAtATime }
}

/** What a window shows before its page paints: the card's and the badge's surface, the app window's and the tray's ground (theme.css). */
const cardColor = () => (nativeTheme.shouldUseDarkColors ? '#242120' : '#fbfaf9')
const appColor = () => (nativeTheme.shouldUseDarkColors ? '#1a1817' : '#f4f2f1')
/** The windows' edge, drawn by Windows 11 (dwm.ts): theme.css's `--border`. */
const borderColor = () => (nativeTheme.shouldUseDarkColors ? '#3b3633' : '#e7e2df')

/** What a page's address tells it: whether Windows draws its edge (then it draws none of its own), and the interface's language (i18n). */
const pageQuery = (): Record<string, string> => ({ ...(WIN11 ? { frame: 'dwm' } : {}), lang: settings.uiLanguage })
const pageOptions = () => ({ query: pageQuery() })

/**
 * The interface's language picked: main's own phrases follow, and every open
 * window loads again in it; the app window comes back on Settings (or the
 * setup, which draws itself), the card is put away, the talk keeps its lines.
 */
function applyUiLanguage(): void {
  setUiLanguage(settings.uiLanguage)
  rememberUiLanguage()
  const media = (page: string) => path.join(app.getAppPath(), 'media', page)
  if (appWin && !appWin.isDestroyed()) {
    appReady = false
    if (settings.setupDone) pendingTab = 'settings'
    void appWin.loadFile(media('app.html'), pageOptions())
  }
  if (card && !card.isDestroyed()) {
    if (shown) hideCard()
    cardReady = false
    void card.loadFile(media('card.html'), pageOptions())
  }
  if (talkWin && !talkWin.isDestroyed()) {
    talkReady = false
    void talkWin.loadFile(media('talk.html'), pageOptions())
  }
  if (trayPanel && !trayPanel.isDestroyed()) {
    trayReady = false
    void trayPanel.loadFile(media('tray.html'), pageOptions())
  }
  dictation?.languageChanged()
  oneKeyMenu?.languageChanged()
}

/** Light, dark or as Windows is: the pages follow `prefers-color-scheme`, which this sets. */
function applyTheme(): void {
  nativeTheme.themeSource = settings.theme
  applyColors()
}

/** The open windows' ground and edge in the theme's colors: on a change of the setting, and of Windows' own theme. */
function applyColors(): void {
  if (card && !card.isDestroyed()) {
    card.setBackgroundColor(cardColor())
    frameWindow(card, { corner: 'round', border: borderColor() })
  }
  if (appWin && !appWin.isDestroyed()) {
    appWin.setBackgroundColor(appColor())
    frameWindow(appWin, { corner: 'default', border: borderColor() })
  }
  if (trayPanel && !trayPanel.isDestroyed()) {
    trayPanel.setBackgroundColor(appColor())
    frameWindow(trayPanel, { corner: 'round', border: borderColor() })
  }
  if (talkWin && !talkWin.isDestroyed()) {
    talkWin.setBackgroundColor(cardColor())
    frameWindow(talkWin, { corner: 'round', border: borderColor() })
  }
  oneKeyMenu?.repaint()
  // The dictation badge needs nothing: its page draws its ground and edge, and follows the theme itself.
}

// ---------------------------------------------------------------- speech and words

let speaker: Speaker
let natural: NaturalSpeaker
let voiceStore: VoiceStore
let dictionaries: DictionaryStore

/** A message for the card or the talk window, whichever is meant. */
function toPage(page: VoicePage, message: ToView): void {
  if (page === 'card') post(message)
  else postTalkWindow(message)
}

/** Reading moves to `page`: the other page's reading was cut, and its player is told so. */
function voiceTo(page: VoicePage): void {
  if (voiceSink !== page) toPage(voiceSink, { type: 'stop' })
  voiceSink = page
}

function setUpSpeech(): void {
  speaker = new Speaker({
    progress: (id, pos, len) => toPage(voiceSink, { type: 'progress', id, pos, len }),
    done: id => toPage(voiceSink, { type: 'speakDone', id }),
  })
  voiceStore = new VoiceStore({
    manifest: manifest as VoiceManifest,
    root: downloads('voice'),
    platform: process.platform,
    arch: process.arch,
    open: url => openStream(url),
    onChange: () => {
      post({ type: 'natural', state: naturalState() })
      refreshTray()
      postApp()
    },
  })
  voiceSpeed = loadVoiceSpeed(deviceFile())
  natural = new NaturalSpeaker(
    unpacked('dist', 'voice-worker.js'),
    () => voiceStore.paths,
    {
      audio: (id, index, samples, words) => toPage(voiceSink, { type: 'naturalAudio', id, index, samples, words }),
      failed: (id, message) => toPage(voiceSink, { type: 'naturalFailed', id, message }),
      phonemes: (text, ipa) => {
        if (ipa) toPage(glossSink, { type: 'ipa', word: text, ipa })
      },
      made: (took, seconds) => voiceMade(took, seconds),
    },
    // The physical cores, once Windows has said them (speech.probe); half the threads until then.
    { threads: () => (speech?.profile.at ? speech.profile.cpu.cores : undefined) },
  )
  dictionaries = new DictionaryStore({
    bundledDir: path.join(app.getAppPath(), 'media', 'dict'),
    cacheDir: downloads('dict'),
    fetchGz: async url => {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return new Uint8Array(await res.arrayBuffer())
    },
    onReady: () => (post({ type: 'dictReady' }), toPage('talk', { type: 'dictReady' })),
    // The setup page follows the download: started, here or failed.
    onChange: () => postApp(),
  })
}

const deviceFile = () => path.join(userDir(), 'device.json')
/** How fast the natural voice makes speech on this computer, measured while it reads. */
let voiceSpeed: VoiceSpeed | undefined
/** Shown once a few sentences were made, so one slow start does not decide. */
const VOICE_SURE_AFTER = 3

function voiceMade(took: number, seconds: number): void {
  const before = naturalState().rtf
  voiceSpeed = nextVoiceSpeed(voiceSpeed, took, seconds)
  if (voiceSpeed && voiceSpeed.n % 5 === 0) saveVoiceSpeed(deviceFile(), voiceSpeed)
  const after = naturalState().rtf
  // The window learns of it when it first shows, and when the voice crosses being slower than it plays.
  if (before === undefined ? after !== undefined : (before > 1) !== ((after ?? 0) > 1)) postApp()
}

/** How fast each local model translates and checks on this computer, measured on real use. */
let modelSpeeds: ModelSpeeds = {}
/** Shown once a few were timed. */
const LEVEL_SURE_AFTER = 3

function modelTimed(model: LlmModel, timed: { sentence?: number; text?: number; reply?: number; start?: number }): void {
  modelSpeeds = { ...modelSpeeds, [model]: nextModelSpeed(modelSpeeds[model], timed) }
  saveModelSpeeds(deviceFile(), modelSpeeds)
  postApp()
}

/** Each model's measured seconds (a sentence, a text checked, loading it), each once timed a few times. */
function modelSpeedView(): AppView['modelSpeed'] {
  const sure = (list: number[] | undefined) => (list && list.length >= LEVEL_SURE_AFTER ? median(list) : undefined)
  const out: AppView['modelSpeed'] = {}
  for (const model of ['accurate', 'most'] as const) {
    const s = modelSpeeds[model]
    const view = { sentence: sure(s?.sentence), text: sure(s?.text), reply: sure(s?.reply), start: sure(s?.start), card: s?.card }
    const known = Object.fromEntries(Object.entries(view).filter(([, n]) => n !== undefined))
    if (Object.keys(known).length) out[model] = known
  }
  return out
}

function naturalState(): NaturalState {
  const rtf = voiceSpeed && voiceSpeed.n >= VOICE_SURE_AFTER ? Math.round(voiceSpeed.rtf * 100) / 100 : undefined
  return { ...voiceStore.state, dismissed: settings.naturalDismissed, ...(rtf !== undefined ? { rtf } : {}) }
}

/** The word dictionary for the person's language as the window shows it; "absent" is one that can be downloaded. */
function dictionaryStatus(): DictionaryStatus {
  const code = langCode(settings.native)
  const status = dictionaries.status(code)
  if (status === 'off') return DOWNLOADABLE.has(code) ? 'absent' : 'none'
  return status
}

/** A translator's models for the person's language downloaded ahead of their first use; the window follows it at most four times a second. */
function prepareTranslator(t: Translator): void {
  let last = 0
  t
    .prepare(langCode(settings.native), () => {
      if (Date.now() - last < 250) return
      last = Date.now()
      postApp()
    })
    .catch(error => console.warn('Tyts: the translator did not download', error))
    .finally(() => postApp())
}

function stopSpeaking(): void {
  speaker.stop()
  natural.stop()
}

/** The dictionary for the person's language, if it is here. */
function dictionary(): Dictionary | undefined {
  const state = dictionaries.get(langCode(settings.native), false)
  return state.status === 'ready' ? state.dict : undefined
}

function lookupWord(word: string, page: VoicePage = 'card'): void {
  glossSink = page
  const post = (message: ToView) => toPage(page, message)
  // The natural voice's phonemizer says how the word sounds; it answers as `ipa`.
  if (voiceStore.state.status === 'ready') natural.phonemes(word)
  const miss = (missing: GlossMissing) => post({ type: 'gloss', word, missing, saved: words.has(word) })
  const state = dictionaries.get(langCode(settings.native), true)
  if (state.status === 'none') return miss('no-dictionary')
  if (state.status === 'downloading') return miss('downloading')
  if (state.status === 'failed') return miss('download-failed')
  if (state.status === 'off') return miss('download-off')
  const gloss = lookup(state.dict, word)
  const saved = words.has(gloss?.base ?? word)
  post(gloss ? { type: 'gloss', word, gloss, saved } : { type: 'gloss', word, missing: 'not-found', saved })
}

// ---------------------------------------------------------------- the notebook

function saveWord(word: string, sentence: string): void {
  const dict = dictionary()
  const gloss = dict ? lookup(dict, word) : undefined
  words.add({ word, base: gloss?.base ?? word.toLowerCase(), senses: gloss?.entries.flatMap(e => e.senses) ?? [], sentence })
  // Both pages with a word card hear of it: the star follows wherever the word shows.
  post({ type: 'saved', word, saved: true })
  toPage('talk', { type: 'saved', word, saved: true })
  postApp()
}

function unsaveWord(word: string): void {
  const dict = dictionary()
  words.removeBase((dict && lookup(dict, word)?.base) ?? word)
  post({ type: 'saved', word, saved: false })
  toPage('talk', { type: 'saved', word, saved: false })
  postApp()
}

async function exportWords(): Promise<void> {
  const { filePath } = await dialog.showSaveDialog(appWin ?? ({} as BrowserWindow), {
    title: t('main.saveWords'),
    defaultPath: path.join(app.getPath('documents'), 'Tyts words.txt'),
    filters: [{ name: t('main.ankiText'), extensions: ['txt'] }],
  })
  if (filePath) fs.writeFileSync(filePath, ankiTsv(words.list()) + '\n', 'utf8')
}

/** A backup (backup.ts): the settings and everything the person made here, one file to keep or to take to another computer. */
async function exportBackup(): Promise<void> {
  const day = new Date().toISOString().slice(0, 10)
  const options: Electron.SaveDialogOptions = {
    title: t('main.saveBackup'),
    defaultPath: path.join(app.getPath('documents'), `Tyts backup ${day}.json`),
    filters: [{ name: t('main.backupFile'), extensions: ['json'] }],
  }
  const { filePath } = appWin ? await dialog.showSaveDialog(appWin, options) : await dialog.showSaveDialog(options)
  if (!filePath) return
  learned.flush()
  const backup = makeBackup(app.getVersion(), new Date(), settings, {
    words: words.list().reverse(),
    mistakes: mistakes.list(),
    learned: learned.lists(),
    translations: translationLog.list(),
    dictation: dictationLog.list(),
    talks: talks.list(),
  })
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2) + '\n', 'utf8')
}

/** A page's own errors into tyts.log, so a report says what broke there. */
function logPageErrors(win: BrowserWindow, name: string): void {
  win.webContents.on('console-message', m => {
    if (m.level === 'error') log(`${name} page: ${m.message} (${m.sourceId}:${m.lineNumber})`)
  })
}

/** Kryakl and Windows, for a report's first lines. */
function reportFacts(): ReportFacts {
  return { version: app.getVersion(), build: app.isPackaged ? '' : buildText(), electron: process.versions.electron, windows: process.getSystemVersion(), arch: process.arch, ...(process.platform === 'darwin' ? { os: 'macOS' } : {}) }
}

/** The parts' state at the moment of a report: the speech engine, the translation level and the model loaded. */
function reportStatus(): string[] {
  const service = speech?.service
  return [
    `Speech engine: ${service ? `${service.state}${service.trouble ? ` (${service.trouble})` : ''}` : 'not set up'}`,
    service?.health ? `Speech engine's health: ${JSON.stringify(service.health)}` : '',
    `Translation: ${LEVEL_NAMES[settings.translationLevel]}; the model ${LEVEL_NAMES[settings.model]} is ${llmFiles.state(settings.model).status}, ${llmFiles.server.model ? `loaded (${path.basename(llmFiles.server.model)})` : 'not loaded'}`,
  ].filter(Boolean)
}

/**
 * Report a problem (report.ts): the zip in Documents\Kryakl\Reports, shown in its
 * folder, then the email or the GitHub issue opened with the person's text in
 * it; they attach the zip and send it themselves.
 */
async function reportProblem(via: 'email' | 'github', text: string): Promise<void> {
  const at = new Date()
  log(`report: made for ${via}`)
  const out = path.join(app.getPath('documents'), 'Tyts', 'Reports', reportName(at))
  const facts = reportFacts()
  await makeReport({ dir: userDir(), out, message: text, facts, status: reportStatus(), settings, names: namesHere(), at })
  shell.showItemInFolder(out)
  await shell.openExternal(via === 'email' ? mailUrl(text, facts, path.basename(out)) : issueUrl(text, facts, path.basename(out)))
  appWin?.webContents.send('to-view', { type: 'reported', file: out } satisfies ToView)
}

/**
 * A backup the person picks, after a question that says what it holds: its
 * settings replace these (this computer's place for the dictation badge
 * stays), its words, mistakes, learned words and history are added to what is
 * here. A settings file from an older Kryakl is its settings alone.
 */
async function importBackup(): Promise<void> {
  const options: Electron.OpenDialogOptions = { title: t('main.openBackup'), defaultPath: app.getPath('documents'), filters: [{ name: t('main.backupFile'), extensions: ['json'] }], properties: ['openFile'] }
  const { canceled, filePaths } = appWin ? await dialog.showOpenDialog(appWin, options) : await dialog.showOpenDialog(options)
  const file = filePaths[0]
  if (canceled || !file) return
  let read: BackupRead
  try {
    read = readBackup(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch (error) {
    void dialog.showMessageBox({ type: 'warning', title: t('app.name'), message: t('main.backupUnread'), detail: messageOf(error) })
    return
  }
  const ask: Electron.MessageBoxOptions = {
    type: 'question',
    title: t('app.name'),
    message: t('main.importAsk'),
    detail: t('main.importDetail', { what: backupSummary(read) }),
    buttons: [t('main.import'), t('common.cancel')],
    defaultId: 0,
    cancelId: 1,
  }
  const { response } = appWin ? await dialog.showMessageBox(appWin, ask) : await dialog.showMessageBox(ask)
  if (response !== 0) return
  words.merge(read.words)
  mistakes.merge(read.mistakes)
  learned.merge(read.learned)
  translationLog.merge(read.translations)
  dictationLog.merge(read.dictation)
  talks.merge(read.talks)
  // All of the settings saved: the keys and the keyboard are applied again, the learned words with them; this computer's window places stay.
  // A backup from before Ctrl+C twice was a key (no keysVersion) moves its switch as an old settings file does (settings.ts).
  saveSettings(normalize({ ...settings, keysVersion: undefined, ...read.settings, dictationBadge: settings.dictationBadge, talkBounds: settings.talkBounds, setupDone: true }, settings.native))
  postApp()
}

/** All settings back to how they came, after a question; the person's language, the setup done and what Kryakl learned stay. */
async function resetSettings(): Promise<void> {
  const options: Electron.MessageBoxOptions = {
    type: 'question',
    title: t('app.name'),
    message: t('main.resetAsk'),
    detail: t('main.resetDetail'),
    buttons: [t('main.reset'), t('common.cancel')],
    defaultId: 1,
    cancelId: 1,
  }
  const { response } = appWin ? await dialog.showMessageBox(appWin, options) : await dialog.showMessageBox(options)
  if (response !== 0) return
  saveSettings({ ...DEFAULTS, native: settings.native, languages: settings.languages, uiLanguage: settings.uiLanguage, setupDone: true, introSeen: true })
}

/** Every key back to how it came, after a question: the actions', the layouts' own and the keys turned off (Ctrl+C twice is no action's then). */
async function resetKeys(): Promise<void> {
  const options: Electron.MessageBoxOptions = {
    type: 'question',
    title: t('app.name'),
    message: t('main.resetKeysAsk'),
    detail: t('main.resetKeysDetail'),
    buttons: [t('main.resetKeys'), t('common.cancel')],
    defaultId: 1,
    cancelId: 1,
  }
  const { response } = appWin ? await dialog.showMessageBox(appWin, options) : await dialog.showMessageBox(options)
  if (response !== 0) return
  const keys = Object.fromEntries([...ACTION_KEYS, ...DICTATION_KEYS].map(k => [k, DEFAULTS[k]]))
  saveSettings({ ...keys, layoutKeys: {}, switchOn: true, fixKeyOn: true })
}

// ---------------------------------------------------------------- the card

function createCard(): BrowserWindow {
  const win = new BrowserWindow({
    width: settings.cardWidth,
    height: 160,
    minWidth: CARD_WIDTH.min,
    minHeight: CARD_MIN,
    show: false,
    frame: false,
    // Its edges drag like any window's; the size is kept for the next cards.
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: t('app.name'),
    backgroundColor: cardColor(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  })
  frameWindow(win, { corner: 'round', border: borderColor() })
  // A drag of an edge (never the card's own growing) sets the width, or how tall a card may grow.
  win.on('will-resize', () => {
    if (!maximizedFrom) resizeFrom ??= win.getBounds()
  })
  win.on('resized', () => {
    if (maximizedFrom) return
    const from = resizeFrom
    resizeFrom = undefined
    if (!from) return
    const to = win.getBounds()
    const patch: Partial<Settings> = {}
    if (to.width !== from.width) patch.cardWidth = to.width
    if (to.height !== from.height) patch.cardHeight = to.height
    if (Object.keys(patch).length > 0) saveSettings(patch)
    fitCard()
  })
  win.setAlwaysOnTop(true, 'pop-up-menu')
  win.removeMenu()
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())
  // Clicking another window puts the card away, unless it is pinned or has only just opened.
  win.on('blur', () => {
    if (!pinned && Date.now() - shownAt > 400) hideCard()
  })
  // A double click on the bar (the drag region, Windows' caption) maximizes or restores it, as a window's title bar does.
  const WM_NCLBUTTONDBLCLK = 0x00a3
  const HTCAPTION = 2
  if (process.platform === 'win32')
    win.hookWindowMessage(WM_NCLBUTTONDBLCLK, wParam => {
      if (wParam.readUInt32LE(0) === HTCAPTION) maximizeCard(!maximizedFrom)
    })
  logPageErrors(win, 'card')
  void win.loadFile(path.join(app.getAppPath(), 'media', 'card.html'), pageOptions())
  return win
}

function post(message: ToView): void {
  if (card && cardReady && !card.isDestroyed()) card.webContents.send('to-view', message)
}

/** What a text is picked for: the card that reads its English aloud, the translator, its translation pasted over it, or its English checked. */
type Purpose = 'listen' | 'translate' | 'inPlace' | 'check'

let languageWordsRead: LanguageWords | undefined
/** The words that tell a text's language, read once. */
function languageWords(): LanguageWords {
  if (!languageWordsRead) {
    const read = (file: string) => {
      try {
        return fs.readFileSync(path.join(app.getAppPath(), 'media', file), 'utf8')
      } catch {
        return ''
      }
    }
    const lists = JSON.parse(read('lang-words.json') || '{}') as Record<string, string[]>
    languageWordsRead = {
      common: Object.fromEntries(Object.entries(lists).map(([code, words]) => [code, new Set(words)])),
      english: new Set(read(path.join('layout', 'en.txt')).split('\n')),
    }
  }
  return languageWordsRead
}

/** The word lists of the person's languages, read once each: a line read off the screen is judged by them. */
const ocrLists = new Map<string, ReadonlySet<string>>()
function ocrKnown(): (word: string) => boolean {
  const lists = myLanguages(settings).map(code => {
    if (code === 'en') return languageWords().english
    let list = ocrLists.get(code)
    if (!list) {
      list = languageWords().common[code] ?? new Set<string>()
      if (FIX_LANGUAGES.includes(code)) {
        try {
          list = new Set(fs.readFileSync(path.join(app.getAppPath(), 'media', 'layout', `${code}.txt`), 'utf8').split('\n'))
        } catch {
          // Its common words stay.
        }
      }
      ocrLists.set(code, list)
    }
    return list
  })
  return word => lists.some(list => list.has(word))
}

function commonWords(): string[] {
  if (!common) {
    try {
      common = fs.readFileSync(path.join(app.getAppPath(), 'media', 'common-en.txt'), 'utf8').split(/\r?\n/).filter(Boolean)
    } catch {
      common = []
    }
  }
  return common
}

// ---------------------------------------------------------------- the app window

/** esbuild.mjs: when this copy was built, and from which commit. */
declare const TYTS_BUILD: { at: string; commit: string; changed: boolean }

/** "30 Oct, 07:12 (ff17ba8, changed)": a run from source tells today's build from yesterday's. */
function buildText(): string {
  const at = new Date(TYTS_BUILD.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return TYTS_BUILD.commit ? `${at} (${TYTS_BUILD.commit}${TYTS_BUILD.changed ? ', changed' : ''})` : at
}

// ---------------------------------------------------------------- storage

/** What Kryakl keeps, measured once the Storage page was opened (storage.ts); again after a removal. */
let storage: StorageView | undefined
let measuring = false
let measureAgain = false

/** The names in a folder; none when it is not there. */
function namesIn(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function storagePlaces(): Place[] {
  const translate = localPart('translate')
  const models = llmPaths(translate)
  const builds = path.join(translate, 'engine')
  const fast = downloads('models')
  const dict = downloads('dict')
  const speechDir = localPart('speech')
  const site = path.join(speechDir, 'env', 'Lib', 'site-packages')
  const packages = partPackages(namesIn(site))
  const inSite = (names: string[]) => names.map(name => path.join(site, name))
  const voices = path.join(speechDir, 'models', 'diarization')
  const transcripts = speech?.service.health?.dataDir
  return [
    ...namesIn(fast).map((code): Place => ({ id: 'fast', item: code, path: path.join(fast, code) })),
    ...namesIn(dict).flatMap((name): Place[] => {
      const code = /^en-([a-z]+)\.json$/.exec(name)?.[1]
      return code ? [{ id: 'dict', item: code, path: path.join(dict, name) }] : []
    }),
    { id: 'voice', path: downloads('voice') },
    { id: 'accurate', path: models.model('accurate') },
    { id: 'most', path: models.model('most') },
    { id: 'unused', path: path.join(translate, 'models'), only: llmFiles.unused() },
    // Each build with what is left of an older one of its kind, or of one half unpacked.
    ...(['vulkan', 'cuda'] as const).map((kind): Place => ({ id: 'llama', item: kind, path: builds, only: namesIn(builds).filter(name => name.startsWith(`${kind}-`)).map(name => path.join(builds, name)) })),
    ...SPEECH_MODELS.map((m): Place => ({ id: 'speechModel', item: m.name, path: speechModelDir(path.join(speechDir, 'models'), m) })),
    // The engine but its speech models; its two parts are measured on their own and taken out of it (splitSpeech).
    { id: 'speech', path: speechDir, only: [...['installed.json', 'env', 'python', 'uv', 'cache', 'pycache'].map(name => path.join(speechDir, name)), voices] },
    { id: 'gpu', path: speechDir, only: inSite(packages.gpu) },
    { id: 'speakers', path: speechDir, only: [...inSite(packages.speakers), voices] },
    { id: 'yours', path: userDir() },
    ...(transcripts ? [{ id: 'transcripts' as const, path: transcripts }] : []),
  ]
}

/** Walks the parts (a few seconds for the speech engine's thousands of files); a call meanwhile measures once more after. */
function measureStorage(): void {
  if (measuring) {
    measureAgain = true
    return
  }
  measuring = true
  const root = localDir()
  storage = { measuring: true, root, drive: driveOf(root), freeMb: storage?.freeMb ?? 0, parts: storage?.parts ?? [] }
  postApp()
  measureParts(storagePlaces())
    .then(measured => {
      const parts = markAway(splitSpeech(measured), root, DOWNLOADED)
      storage = { measuring: false, root, drive: driveOf(root), freeMb: freeMb(root), parts, ...oldFolderView(parts) }
    })
    .catch(error => console.warn('Tyts: could not measure the storage', error))
    .finally(() => {
      measuring = false
      if (storage?.measuring) storage = { ...storage, measuring: false }
      postApp()
      if (measureAgain) {
        measureAgain = false
        measureStorage()
      }
    })
}

/** Measured again after a removal, when the page has been opened. */
const remeasure = () => (storage ? measureStorage() : postApp())

/** Kryakl's downloads, which belong in its one folder; the person's own things live elsewhere. */
const DOWNLOADED: readonly StorageId[] = ['fast', 'dict', 'voice', 'accurate', 'most', 'unused', 'llama', 'speechModel', 'speech', 'gpu', 'speakers']

/** What the parts serve now (storage.ts withUse): the settings, the build the model runs on here, the speech plan with its reserve on the other device. */
function useContext(): UseContext {
  const plan = speech.plan
  const other = plan.device === 'cuda' ? plan.engine.cpu : plan.engine.cuda
  return {
    level: settings.translationLevel,
    model: settings.model,
    edit: settings.dictateEdit,
    languages: myLanguages(settings),
    native: langCode(settings.native),
    naturalVoice: settings.voice === '' || settings.voice.startsWith(NATURAL_PREFIX),
    build: translationAdvice(speech.profile)[settings.model].cuda ? 'cuda' : 'vulkan',
    speech: { dictation: plan.dictation.chosen.model, transcripts: plan.transcripts.chosen.model, reserve: { dictation: other?.dictation.model, transcripts: other?.transcripts.model } },
  }
}

/** The storage as measured, each part told what it serves now: a changed setting shows at once, with no walk of the disk. */
const storageView = (s: StorageView): StorageView => ({ ...s, parts: withUse(s.parts, useContext()), ...(refused.length ? { refused } : {}) })

/** What the last removal or Clean up could not remove, and why: the page says it instead of staying silent. */
let refused: Refused[] = []

function noteRefused(id: StorageId, item: string | undefined, error: unknown): void {
  console.warn(`Tyts: could not remove ${id}${item ? ` ${item}` : ''}`, error)
  const why = engineMessage(error instanceof Error ? error.message : String(error))
  refused.push({ id, ...(item ? { item } : {}), why })
}

/** One part off the disk (the Models and Storage pages' ×, Clean up); each downloads again when wanted. */
async function removeStored(id: StorageId, item?: string): Promise<void> {
  switch (id) {
    case 'fast': {
      const codes = item ? [item] : namesIn(downloads('models'))
      if (codes.some(code => translator.state(code).status === 'downloading')) return
      // The engine lets go of its files first.
      translator.dispose()
      for (const code of codes) fs.rmSync(path.join(downloads('models'), code), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
      return
    }
    case 'dict':
      if (item) dictionaries.remove(item)
      else dictionaries.clear()
      return
    case 'voice':
      natural.dispose()
      voiceStore.remove()
      return
    case 'accurate':
    case 'most':
      // Fast translates in its place.
      if (settings.translationLevel === id) saveSettings({ translationLevel: 'fast' })
      return llmFiles.remove(id)
    case 'unused':
      llmFiles.removeUnused()
      return
    case 'llama':
      if (item === 'vulkan' || item === 'cuda') await llmFiles.removeEngine(item)
      return
    case 'speechModel': {
      if (!item) return
      const r = await speech.removeModel(item)
      if (!r.ok) throw new Error(r.error)
      return
    }
    case 'speech':
      await speech.remove()
      registerShortcuts()
      applyKeyboard()
      return
    case 'gpu':
    case 'speakers':
      await speech.removePart(id)
      return
    case 'yours':
    case 'transcripts':
      return
  }
}

/** Clean up: every part nothing uses off the disk, one after another; one that will not go is logged and the next goes on. */
async function cleanUp(): Promise<void> {
  if (!storage) return
  refused = []
  for (const p of cleanable(withUse(storage.parts, useContext()))) {
    try {
      await removeStored(p.id, p.item)
    } catch (error) {
      noteRefused(p.id, p.item, error)
    }
  }
}

/** Use recommended (the Models page): the models advised here saved, and what they need downloaded, as the page listed it. */
function useRecommended(): void {
  const advice = recommendedModels(appView())
  if (Object.keys(advice.patch).length) saveSettings(advice.patch)
  if ('translationLevel' in advice.patch) prepareTranslator(activeTranslator())
  if (advice.model && settings.translationLevel === 'fast') prepareModel()
  if (advice.natural) voiceStore.download().catch(error => console.warn('Tyts: the natural voice did not download', error))
  if (advice.parts.length)
    speech.install(advice.parts).then(
      () => (registerShortcuts(), applyKeyboard()),
      error => console.warn('Tyts: the speech engine did not install', error),
    )
}
/** Move to Kryakl is under way: the page shows it, and a second press waits. */
let movingToTyts = false

/** A download used from outside Kryakl's folder: the old one's place, and why the last move left it there. */
function oldFolderView(parts: readonly StoragePart[]): Pick<StorageView, 'old'> {
  const away = parts.find(p => p.away)
  if (!away) return {}
  const dir = oldLocalDirs().find(d => away.path.toLowerCase().startsWith(d.toLowerCase() + path.sep)) ?? path.dirname(away.path)
  const reasons = leftOld.find(l => l.dir === dir)?.parts ?? []
  const why = [...new Set(reasons.filter(p => p.why !== 'Kryakl has its own').map(p => p.why))].join('; ')
  return { old: { dir, moving: movingToTyts, ...(why ? { why } : {}) } }
}

/**
 * The Storage page's Move to Kryakl: what still lives in the old folders goes into Kryakl's. The speech engine,
 * the model's server, the voice and Firefox's translator let go of their files first; the programs run from the
 * old folder are stopped (moveLocalFolder). Each part keeps its place from Kryakl's start, so Kryakl starts again on
 * the Storage page once anything moved; when nothing could, the engine comes back and the page says why.
 */
async function moveToTyts(): Promise<void> {
  if (movingToTyts || TEST_HOME) return
  movingToTyts = true
  if (storage) storage = { ...storage, ...oldFolderView(storage.parts) }
  postApp()
  speech.service.stop()
  await llmFiles.server.stop()
  natural.dispose()
  translator.dispose()
  // The page's "moving" is drawn before the move holds the main process for a second or two.
  await new Promise(resolve => setTimeout(resolve, 300))
  const r = moveLocalFolder()
  log('move to Kryakl: pressed on the Storage page')
  logMoved(r)
  if (r.moved.length) {
    app.relaunch({ args: [...process.argv.slice(1).filter(a => a !== '--storage'), '--storage'] })
    app.quit()
    return
  }
  movingToTyts = false
  speech.start()
  measureStorage()
}

/** A download of Kryakl's own deleted from the Storage page; each downloads again when it is wanted next. */
function appView(): AppView {
  return {
    settings,
    version: app.getVersion(),
    build: buildText(),
    dev: !app.isPackaged,
    natural: naturalState(),
    hostVoices: hostVoices ?? [],
    languages: NATIVES.map(code => findLanguage(code))
      .filter(l => l !== undefined)
      .map(l => ({ name: l.name, native: l.native })),
    words: words.list(),
    keysOk,
    translator: activeTranslator().state(langCode(settings.native)).status,
    translatorState: translator.state(langCode(settings.native)),
    translation: {
      fast: translator.state(langCode(settings.native)),
      accurate: llm.accurate.state(langCode(settings.native)),
      most: llm.most.state(langCode(settings.native)),
    },
    models: { accurate: llmFiles.state('accurate'), most: llmFiles.state('most') },
    modelSpeed: modelSpeedView(),
    ...llmLoadedView(),
    dictionary: { status: dictionaryStatus() },
    mistakes: mistakes.list(),
    ...(talks.current() ? { talk: summaryOf(talks.current()!) } : {}),
    ...(storage ? { storage: storageView(storage) } : {}),
    layouts: keyboardLayouts(),
    ...(keyboardTrouble ? { keyboardTrouble } : {}),
    ...(lastApp ? { lastApp } : {}),
    ...(elevatedApp ? { elevatedApp } : {}),
    learned: { alwaysFix: [...learned.alwaysFix], myWords: [...learned.myWords] },
    translations: translationLog.list(10),
    rivals,
    keyboardApps,
    foreignKeys,
    speech: speech.view(speechKeysOk),
    call: { state: capture?.state ?? 'idle', seconds: capture?.seconds ?? 0 },
    summaries: Object.fromEntries(summaries),
    dictation: { recent: dictationLog.list(10) },
  }
}

function postApp(): void {
  if (appWin && appReady && !appWin.isDestroyed()) appWin.webContents.send('to-view', { type: 'app', view: appView() } satisfies ToView)
  postTalk()
}

function createAppWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 560,
    minHeight: 440,
    show: false,
    // The page draws its own sidebar and bar (the mark, the places, minimize and close); the edges still resize.
    frame: false,
    title: t('app.name'),
    icon: path.join(app.getAppPath(), 'media', 'icon.png'),
    backgroundColor: appColor(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })
  frameWindow(win, { corner: 'default', border: borderColor() })
  win.removeMenu()
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())
  // The page's maximize button shows Maximize or Restore, whichever way the window got there (a double click on the bar too).
  win.on('maximize', () => postAppWindow())
  win.on('unmaximize', () => postAppWindow())
  // Its errors go into tyts.log; a run from source shows the rest of what it says in the terminal.
  logPageErrors(win, 'app window')
  if (!app.isPackaged) {
    win.webContents.on('console-message', m => m.level !== 'error' && console.warn(`Tyts app window: ${m.message} (${m.sourceId}:${m.lineNumber})`))
    win.webContents.on('did-fail-load', (_event, code, description) => console.warn(`Tyts app window did not load: ${code} ${description}`))
  }
  // Closing hides: Kryakl lives in the tray.
  win.on('close', event => {
    if (quitting) return
    event.preventDefault()
    win.hide()
  })
  win.on('closed', () => {
    appWin = undefined
    appReady = false
  })
  void win.loadFile(path.join(app.getAppPath(), 'media', 'app.html'), pageOptions())
  return win
}

/** Whether the app window fills the screen, for its maximize button. */
function postAppWindow(): void {
  if (appWin && appReady && !appWin.isDestroyed()) appWin.webContents.send('to-view', { type: 'appWindow', maximized: appWin.isMaximized() } satisfies ToView)
}

/** Shows the app window, on `tab` if one is named; a window that was closed opens on Home. */
function openApp(tab?: AppTab): void {
  if (!appWin || appWin.isDestroyed()) appWin = createAppWindow()
  findRivals()
  if (!tab && !appWin.isVisible()) tab = 'home'
  if (tab) {
    if (appReady) appWin.webContents.send('to-view', { type: 'appTab', tab } satisfies ToView)
    else pendingTab = tab
  }
  if (appWin.isMinimized()) appWin.restore()
  appWin.show()
  appWin.focus()
}

/** The app window on one transcript. */
function openTranscript(id: string): void {
  openApp('transcripts')
  if (appReady) appWin?.webContents.send('to-view', { type: 'openTranscript', id } satisfies ToView)
  else pendingTranscript = id
}

function postCard(): void {
  if (!shown) return
  post({
    type: 'card',
    card: { ...shown, target: TARGET, native: settings.native, level: settings.translationLevel, ...busySpell(), autoRead: settings.autoRead },
    config: config(),
    pinned,
    maximized: !!maximizedFrom,
  })
}

/** Starts a new card by the pointer (or where a pinned card stands) and returns its id. */
function openCard(kind: CardKind, state: CardState, at: Point, via?: string): number {
  const id = ++seq
  shown = { id, kind, state, ...(via ? { via } : {}) }
  stopSpeaking()
  // A new card reads its own text: the duck, if it spoke, goes quiet.
  voiceTo('card')
  postCard()
  const win = card
  if (!win) return id
  // A card open already (pinned) keeps the window it came from.
  const front = foreground().hwnd
  const ours = [win, trayPanel].some(w => w && !w.isDestroyed() && handleOf(w) === front)
  if (!ours && front !== 0n) cameFrom = front
  if (!win.isVisible()) {
    const area = screen.getDisplayNearestPoint(at).workArea
    win.setBounds(placeNear(at, { width: settings.cardWidth, height: Math.max(CARD_MIN, win.getBounds().height) }, area))
    shownAt = Date.now()
    win.show()
  }
  win.focus()
  return id
}

/** Changes what card `id` shows, if it is still the one on screen. */
function setState(id: number, state: CardState): void {
  if (!shown || shown.id !== id) return
  shown = { ...shown, state }
  postCard()
}

function hideCard(): void {
  // A translation the translator holds as it closes is kept for the Translate page.
  const state = shown?.state
  if (state?.status === 'text' && state.result.status === 'ready' && !state.result.drafts && card?.isVisible()) logTranslation(state.text, state.result.text, state.result.from, state.result.to)
  // A checked text with a mistake goes into Mistakes once, as the card closes.
  if (state?.status === 'check' && state.result.status === 'ready' && card?.isVisible()) logMistake(state.result)
  // The voice is the card's to stop only while it reads for the card: the duck in the app window goes on.
  if (voiceSink === 'card') stopSpeaking()
  // The card plays the natural voice's audio, and its own voices, itself: they stop there.
  post({ type: 'stop' })
  pinned = false
  card?.hide()
  // The next card opens at its usual size.
  if (maximizedFrom && card && !card.isDestroyed()) {
    card.setResizable(true)
    card.setBounds(maximizedFrom)
  }
  maximizedFrom = undefined
}

/**
 * Esc or ✕: the card goes and the window it was called from gets the keyboard
 * back (hidden alone, the card leaves Windows to bring up a window of its
 * choosing), brought to the front while the card still is, as Windows allows;
 * a translator's field gets it too (VS Code's chat does not take it back by
 * itself). A click elsewhere only hides the card: that window was chosen.
 */
async function closeCard(): Promise<void> {
  const target = shown && pasteTarget?.id === shown.id ? pasteTarget : undefined
  const back = target?.window ?? cameFrom
  cameFrom = undefined
  pasteTarget = undefined
  if (back && card?.isFocused()) focusWindow(back)
  hideCard()
  if (!target?.field) return
  try {
    await inFront(target.window)
    focus(target.field)
  } finally {
    releaseField(target.field)
  }
}

/**
 * The card fills the work area of its screen (pinned meanwhile: it stays until closed or restored),
 * or goes back to its bounds and pin state before, kept inside that screen, and to its content's height.
 */
function maximizeCard(on: boolean): void {
  const win = card
  if (!win || win.isDestroyed() || on === !!maximizedFrom) return
  if (on) {
    const bounds = win.getBounds()
    maximizedFrom = bounds
    resizeFrom = undefined
    pinnedBefore = pinned
    pinned = true
    win.setResizable(false)
    win.setBounds(screen.getDisplayMatching(bounds).workArea)
  } else {
    const from = maximizedFrom ?? win.getBounds()
    maximizedFrom = undefined
    pinned = pinnedBefore
    const area = screen.getDisplayMatching(win.getBounds()).workArea
    const width = Math.min(from.width, area.width)
    const x = Math.min(Math.max(from.x, area.x), area.x + area.width - width)
    win.setResizable(true)
    win.setBounds(resize({ ...from, x, width }, from.height, area))
    fitCard()
  }
  postCard()
}

/** The card is as tall as its content, up to the height set by hand or most of the screen; never while its edge is dragged or it is maximized. */
function fitCard(): void {
  const win = card
  if (!win || win.isDestroyed() || resizeFrom || maximizedFrom) return
  const bounds = win.getBounds()
  const area = screen.getDisplayMatching(bounds).workArea
  const cap = settings.cardHeight || Math.round(area.height * CARD_AUTO_SHARE)
  const height = Math.round(Math.min(cap, Math.max(CARD_MIN, contentHeight)))
  if (height === bounds.height) return
  win.setBounds(resize(bounds, height, area))
}

function setCardHeight(px: number): void {
  contentHeight = px
  fitCard()
}

/** `page`: who sent it (bridge.ts), which the voice and the word card answer. */
function onMessage(message: ToHost, page: Page): void {
  if (dictation?.onMessage(message)) return
  if (oneKeyMenu?.onMessage(message)) return
  const asker: VoicePage = page === 'talk' ? 'talk' : 'card'
  switch (message.type) {
    case 'clearDictation':
      dictation.clearLog()
      return
    case 'clearTranslations':
      translationLog.clear()
      postApp()
      return
    case 'forgetPhrase':
      dictationLog.remove(message.at)
      postApp()
      return
    case 'forgetTranslation':
      translationLog.remove(message.at)
      postApp()
      return
    case 'unlearn':
      learned.remove(message.list, message.word)
      applyKeyboard()
      postApp()
      return
    case 'forgetLearned':
      learned.forget()
      applyKeyboard()
      postApp()
      return
    case 'exportBackup':
      exportBackup().catch(error => console.warn('Tyts: could not save the backup', error))
      return
    case 'importBackup':
      importBackup().catch(error => console.warn('Tyts: could not import the backup', error))
      return
    case 'resetSettings':
      resetSettings().catch(error => console.warn('Tyts: could not reset the settings', error))
      return
    case 'resetKeys':
      resetKeys().catch(error => console.warn('Tyts: could not reset the keys', error))
      return
    case 'installSpeech':
      speech.install(message.parts, message.models).then(
        () => (registerShortcuts(), applyKeyboard()),
        error => console.warn('Tyts: the speech engine did not install', error),
      )
      return
    case 'prepareTranslator':
      prepareTranslator(translator)
      return
    case 'translationLevel':
      // A model picked here is the one model: Check uses it too.
      saveSettings(message.level === 'fast' ? { translationLevel: 'fast' } : { translationLevel: message.level, model: message.level })
      prepareTranslator(activeTranslator())
      return
    case 'useModel':
      saveSettings({ model: message.model })
      prepareModel()
      return
    case 'forgetMistake':
      mistakes.remove(message.at)
      postApp()
      return
    case 'clearMistakes':
      mistakes.clear()
      postApp()
      return
    case 'prepareDictionary':
      dictionaries.get(langCode(settings.native), true)
      return
    case 'testSpeech':
      saveSettings({ speechTestAgreed: true })
      void speech.test(true)
      return
    case 'declineSpeechTest':
      saveSettings({ speechTestDeclinedKey: speech.declineKey(), speechTestDeclinedAt: Date.now() })
      return
    case 'downloadSpeechModel':
      void speech.downloadModel(message.model).then(() => postApp())
      return
    case 'storage':
      measureStorage()
      return
    case 'moveToTyts':
      void moveToTyts().catch(error => {
        movingToTyts = false
        leftOld = oldLocalDirs().map(dir => ({ dir, parts: [{ name: path.basename(dir), why: messageOf(error) }] }))
        console.warn('Tyts: could not move the old folder', error)
        remeasure()
      })
      return
    case 'removeStored':
      refused = []
      void removeStored(message.id, message.item)
        .catch(error => noteRefused(message.id, message.item, error))
        .finally(() => (postApp(), remeasure()))
      return
    case 'cleanUp':
      void cleanUp().finally(() => (postApp(), remeasure()))
      return
    case 'useRecommended':
      useRecommended()
      return
    case 'restartSpeech':
      speech.restart()
      return
    case 'showInFolder':
      if (typeof message.path === 'string' && path.win32.isAbsolute(message.path)) shell.showItemInFolder(message.path)
      return
    case 'openPath':
      // A folder, a note or a text file; never a program, a script or a shortcut. One of Kryakl's own
      // folders not made yet (the transcripts' before the first transcript) is made, then opened.
      makeOwnFolder(message.path)
      if (openable(message.path, isDirectory)) void shell.openPath(message.path)
      else log(`openPath: refused ${message.path}`)
      return
    case 'ready':
      cardReady = true
      postCard()
      post({ type: 'natural', state: naturalState() })
      post({ type: 'common', words: commonWords() })
      void sendHostVoices()
      return
    case 'speak':
      voiceTo(asker)
      natural.stop()
      speaker.speak(message.id, message.items.join(message.separator), message.lang, systemVoiceName(settings.voice), settings.rate)
      return
    case 'speakNatural':
      voiceTo(asker)
      speaker.stop()
      natural.speak(message.id, message.items, message.voice, message.rate, message.ahead)
      return
    case 'naturalAt':
      natural.at(message.id, message.index)
      return
    case 'downloadNatural':
      voiceStore.download().catch(error => console.warn('Tyts: the natural voice did not download', error))
      return
    case 'dismissNatural':
      saveSettings({ naturalDismissed: true })
      post({ type: 'natural', state: naturalState() })
      return
    case 'stop':
      // A page stops its own reading, never the other's.
      if (asker === voiceSink) stopSpeaking()
      return
    case 'openSpeechSettings':
      void shell.openExternal('ms-settings:speech')
      return
    case 'openLanguageSettings':
      void shell.openExternal('ms-settings:regionlanguage')
      return
    case 'height':
      setCardHeight(message.px)
      return
    case 'pin':
      pinned = message.on
      return
    case 'maximize':
      maximizeCard(message.on)
      return
    case 'close':
      closeCard().catch(error => console.warn('Tyts: could not give the keyboard back', error))
      return
    case 'retry':
      if (last && shown?.id === last.id) void translateInto(last.id, last.text, last.kind, last.note)
      return
    case 'waitForModel':
      if (shown?.id !== message.id) return
      if (shown.state.status === 'text') void translateTextCard(message.id, shown.state.text, shown.state.from, shown.state.to, true)
      else if (last?.id === message.id) void translateInto(last.id, last.text, last.kind, last.note, true)
      return
    case 'translateText':
      void translateTextCard(message.id, message.text, message.from, message.to)
      return
    case 'checkText':
      void checkCard(message.id, message.text)
      return
    case 'copyText':
      clipboard.writeText(message.text).catch(error => console.warn('Tyts: could not copy', error))
      return
    case 'pasteText':
      pasteTranslation(message.id, message.text).catch(error => console.warn('Tyts: could not paste the translation', error))
      return
    case 'lookup':
      lookupWord(message.word, asker)
      return
    case 'saveWord':
      saveWord(message.word, message.sentence)
      return
    case 'unsaveWord':
      unsaveWord(message.word)
      return
    case 'appReady':
      appReady = true
      // A page loaded afresh records nothing.
      if (micRecording) {
        micRecording = false
        refreshTray()
      }
      postApp()
      postAppWindow()
      if (pendingTab) appWin?.webContents.send('to-view', { type: 'appTab', tab: pendingTab } satisfies ToView)
      if (pendingTranscript) appWin?.webContents.send('to-view', { type: 'openTranscript', id: pendingTranscript } satisfies ToView)
      pendingTab = undefined
      pendingTranscript = undefined
      return
    case 'saveSettings':
      saveSettings(message.patch)
      return
    case 'removeWord':
      words.remove(message.id)
      postApp()
      return
    case 'exportWords':
      exportWords().catch(error => console.warn('Tyts: could not save the words', error))
      return
    case 'copyWords':
      clipboard.writeText(wordsText(words.list())).catch(error => console.warn('Tyts: could not copy the words', error))
      return
    case 'openLink':
      if (LINKS.has(message.url)) void shell.openExternal(message.url)
      return
    case 'reportProblem':
      reportProblem(message.via === 'github' ? 'github' : 'email', String(message.text ?? '')).catch(error => {
        log(`report: could not make it: ${String(error)}`)
        appWin?.webContents.send('to-view', { type: 'reported', error: error instanceof Error ? error.message : String(error) } satisfies ToView)
      })
      return
    case 'openLogs':
      void shell.openPath(userDir())
      return
    case 'recordKeys':
      // The keys go to the field only while the app window is in front (the thread compares its window).
      // Without the thread, the page records from its own key events.
      try {
        if (message.on && appWin && !appWin.isDestroyed()) keyboard.record(true, handleOf(appWin))
        else keyboard.record(false)
      } catch (error) {
        console.warn('Tyts: the keyboard thread could not read the keys for a key field', error)
      }
      return
    case 'window':
      if (message.action === 'minimize') appWin?.minimize()
      else if (message.action === 'maximize') {
        if (appWin?.isMaximized()) appWin.unmaximize()
        else appWin?.maximize()
      } else appWin?.hide()
      return
    case 'micRecording':
      micRecording = message.on
      refreshTray()
      return
    case 'captureState':
    case 'captureDone':
    case 'captureHide':
    case 'captureOpenSettings':
      capture?.message(message)
      return
    case 'toggleCall':
      toggleCall()
      return
    case 'summarize':
      void makeSummary(message.id, { template: message.template, own: message.own, mine: message.mine })
      return
    case 'cancelSummary':
      summaryAborts.get(message.id)?.abort()
      return
    case 'talkStart':
      // A topic starts a new talk: the one going on, if any, is put away first.
      talks.archive()
      talk.start(String(message.topic))
      return
    case 'talkSay':
      talk.say(String(message.text ?? ''))
      return
    case 'talkInterrupt':
      talk.interrupt()
      return
    case 'talkClear':
      // New talk: the talk goes into the history.
      talks.archive()
      talk.clear()
      return
    case 'talkListen':
      // The model loads while the person speaks: its 3 s start would else come after the line.
      warmModel('check')
      return
    case 'talkReady':
      talkReady = true
      postTalk()
      // The duck's words are dotted and read as the card's are.
      postTalkWindow({ type: 'common', words: commonWords() })
      if (hostVoices) postTalkWindow({ type: 'hostVoices', voices: hostVoices, canSpeak: Speaker.canSpeak(), platform: process.platform })
      if (pendingTalk) postTalkWindow({ type: 'talk', command: 'toggle' })
      pendingTalk = false
      return
    case 'talkPin':
      saveSettings({ talkOnTop: message.on === true })
      return
    case 'talkWindow':
      if (message.action === 'settings') openApp('english')
      else if (message.action === 'model') openApp('checkModel')
      else if (message.action === 'maximize') {
        if (talkWin?.isMaximized()) talkWin.unmaximize()
        else talkWin?.maximize()
      } else talkWin?.hide()
      return
    case 'talkOpen':
      openTalk()
      return
    case 'talkContinue': {
      // The talk going on is put away, this one goes on in the talk window.
      const going = talks.continue(String(message.id))
      if (!going) return
      talk.restore(going)
      openTalk()
      return
    }
    case 'talkDelete':
      talks.remove(String(message.id))
      postTalk()
      return
    case 'talksClear':
      talks.clear()
      postTalk()
      return
    case 'trayReady':
      trayReady = true
      refreshTray()
      return
    case 'trayHeight':
      trayHeight = Math.ceil(message.px)
      if (trayPanel?.isVisible()) placeTrayPanel()
      return
    case 'trayClose':
      hideTrayPanel()
      return
    case 'keepWord': {
      // As the Kept as typed page adds one (and as Backspace after a fix does): fixed by itself no more.
      const keepWords = addKept(settings.keepWords, message.word)
      if (!keepWords) return
      learned.kept(keptForm(message.word))
      saveSettings({ keepWords })
      return
    }
    case 'tray':
      hideTrayPanel()
      runTrayCommand(message.command)
      return
  }
}

async function sendHostVoices(): Promise<void> {
  if (!hostVoices) {
    hostVoices = await listHostVoices()
    refreshTray()
    postApp()
  }
  const message: ToView = { type: 'hostVoices', voices: hostVoices, canSpeak: Speaker.canSpeak(), platform: process.platform }
  post(message)
  toPage('talk', message)
}

// ---------------------------------------------------------------- translating

/** Firefox's models (Fast), and the local models' two levels. */
let translator: Translator
let llm: LlmTranslators

/** The translator of the level picked in Settings; a card waits for it, never another. */
function activeTranslator(): Translator {
  return settings.translationLevel === 'fast' ? translator : llm[settings.translationLevel]
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** A translation's translator, its Translate, and whether Fast did it for the model, too slow just now (`busy`: where). */
type TranslationJob = { t: Translator; translate: Translate; busy(): BusyPart | undefined }

/**
 * The level's translator with Fast's before it as a draft (2026-10-31): with
 * Accurate or Most accurate, Firefox's models (on the processor, quick, no
 * model to load) show a translation at once and the model's sentences
 * replace it one by one. Fast's models for the pair (`codes`, besides
 * English) download once by themselves when missing; until then there is
 * no draft. Paste and Translate in place take the model's translation only.
 * A model far slower than usual here (another program on the graphics card
 * or the processor, modelbusy.ts) gives the job up and Fast's translation
 * stands; Fast then translates by itself until the model is tried again.
 * Without Fast's models nothing is given up: the model is all there is.
 * `wait`: the person asked for the model on this text (Use Accurate anyway):
 * Fast's draft first, then the model, however long it takes.
 */
function translationJob(codes: readonly string[], wait = false): TranslationJob {
  const level = settings.translationLevel
  const fast = { t: translator, translate: translator.translate, busy: () => undefined }
  if (level === 'fast') return fast
  const t = llm[level]
  const missing = codes.filter(code => code !== 'en' && translator.state(code).status !== 'ready')
  if (missing.length) {
    for (const code of missing) {
      if (translator.state(code).status !== 'absent') continue
      translator
        .prepare(code, () => undefined)
        .catch(error => console.warn('Tyts: the draft translator did not download', error))
        .finally(() => postApp())
    }
    return { t, translate: t.translate, busy: () => undefined }
  }
  if (wait) return { t, translate: drafted(t.translate, throughEnglish(translator.translate)), busy: () => undefined }
  const busy = busyFor(level)
  if (busy) return { ...fast, busy: () => busy }
  let fell: BusyPart | undefined
  const gaveUp = (error: unknown) => error instanceof ModelSlow && ((fell = modelSlow(error)), true)
  return { t, translate: drafted(roomFirst(level, t.hurried(slowAfter(modelSpeeds[level]?.sentence ?? [], LEVEL_SURE_AFTER))), throughEnglish(translator.translate), gaveUp), busy: () => fell }
}

/** The graphics card's free memory, one nvidia-smi reading shared by a key press and the job after it. */
const cardFree = sharedReading(cardMemoryFree, 5000)

/**
 * The card too full to hold the level's model whole (resources.ts): the free
 * memory and what the model needs, else nothing. Only an NVIDIA card says how
 * full it is; a model already running holds its memory, so there is nothing
 * to look at then; and one advised partly on the card or on the processor here
 * runs so anyway.
 */
async function cardFull(model: LlmModel): Promise<{ free: number; need: number } | undefined> {
  if (llmFiles.server.model !== undefined || translationAdvice(speech?.profile)[model].where !== 'card') return undefined
  const need = modelSpeeds[model]?.card ?? LEVEL_VRAM_MB[model]
  const free = await cardFree()
  return free !== undefined && !cardRoom(free, need) ? { free, need } : undefined
}

/** A job that starts the model only when the card holds it whole; else it is given up at once, and Fast's translation stands (modelSlow). */
function roomFirst(model: LlmModel, translate: Translate): Translate {
  return async (sentences, from, to, progress) => {
    const full = await cardFull(model)
    if (full) throw new ModelSlow(model, 0, full)
    return translate(sentences, from, to, progress)
  }
}

/** A job's `busy`, for its result. */
function busyOf(job: TranslationJob): { busy?: BusyPart } {
  const busy = job.busy()
  return busy ? { busy } : {}
}

/** How long the badge by the cursor says that Fast translated in place. */
const BUSY_SAY_MS = 2500

/** The local model found too slow here just now: Fast translates until it is tried again (modelbusy.ts). */
let modelBusy: ModelBusy | undefined
let recheckingBusy = false

/** Where the level's model is kept busy now, if it is. */
function busyFor(level: TranslationLevel): BusyPart | undefined {
  return level !== 'fast' && modelBusy?.model === level ? modelBusy.where : undefined
}

/** The card's `busy`: the picked level's model kept busy now. */
function busySpell(): { busy?: BusyPart } {
  const busy = busyFor(settings.translationLevel)
  return busy ? { busy } : {}
}

/**
 * A job given up: Fast translates for a while, and the model's server goes,
 * so that, started again, llama.cpp fits the model on the card as it is then
 * (and the other program gets its memory meanwhile).
 */
function modelSlow(slow: ModelSlow): BusyPart {
  const server = llmFiles.server
  const where: BusyPart = !slow.full && (server.onProcessor || translationAdvice(speech?.profile)[slow.model].where === 'processor') ? 'processor' : 'card'
  if (modelBusy?.model !== slow.model)
    log(
      slow.full
        ? `model: ${slow.model} not started: the graphics card has ${slow.full.free} MB free, it needs ${slow.full.need} and room for the programs around it; Fast translates`
        : `model: ${slow.model} too slow just now (a sentence over ${slow.limit.toFixed(1)} s): Fast translates, the ${busyName(where)} busy`,
    )
  modelBusy = { model: slow.model, where, until: Date.now() + BUSY_MS }
  if (server.restingFor !== undefined) void server.stop()
  return where
}

/** On the model clock: the model tried again once its time is out, on an NVIDIA card once its memory is free for it. */
async function recheckBusy(): Promise<void> {
  const busy = modelBusy
  if (!busy || recheckingBusy || Date.now() < busy.until) return
  const need = modelSpeeds[busy.model]?.card ?? LEVEL_VRAM_MB[busy.model]
  let free: number | undefined
  // A server running now holds its memory, and its model loaded: nothing to look at.
  if (busy.where === 'card' && llmFiles.server.model === undefined) {
    recheckingBusy = true
    free = await cardFree().finally(() => (recheckingBusy = false))
  }
  if (modelBusy !== busy) return
  if (tryAgain(busy, Date.now(), free, need)) {
    modelBusy = undefined
    log(`model: ${busy.model} tried again`)
    return
  }
  modelBusy = { ...busy, until: Date.now() + BUSY_MS }
  log(`model: the graphics card has ${free} MB free, ${busy.model} needs ${need}: Fast a while longer`)
}

/** A card's translation as it comes in, sentence by sentence: at most ten updates a second, the latest always sent; `cancel` before the last. */
const UPDATE_MS = 100

function every(ms: number, send: () => void): { ask(): void; cancel(): void } {
  let timer: NodeJS.Timeout | undefined
  let sent = 0
  return {
    ask() {
      if (timer) return
      timer = setTimeout(
        () => {
          timer = undefined
          sent = Date.now()
          send()
        },
        Math.max(0, sent + ms - Date.now()),
      )
    },
    cancel() {
      clearTimeout(timer)
      timer = undefined
    },
  }
}

/**
 * Translates `text` into card `id`: the translator's download first, the
 * first time. An English text is shown, and read, at once, its translation
 * coming in under it; a text in the person's language waits for its English.
 */
async function translateInto(id: number, text: string, kind: CardKind, note?: string, wait = false): Promise<void> {
  last = { id, text, kind, ...(note ? { note } : {}) }
  const native = langCode(settings.native)
  const split = splitText(text.slice(0, MAX_TEXT_CHARS), settings.native)
  const notes = [note, text.length > MAX_TEXT_CHARS ? 'Long text: only the beginning is translated.' : undefined].filter(Boolean)
  const noted = notes.length ? { note: notes.join(' ') } : {}
  const early = englishReady(split) ? englishHtml(split.lines) : undefined
  const pending = (translation: Exclude<TranslationState, { status: 'ready' }>) =>
    setState(id, early ? { status: 'done', html: early, translation, ...noted } : translation)
  const job = translationJob([native], wait)
  const { t } = job
  try {
    pending({ status: 'translating' })
    if (t.state(native).status !== 'ready') {
      await t.prepare(native, s => {
        if (s.status === 'downloading') pending({ status: 'downloading', progress: s.progress, size: s.size })
      })
      pending({ status: 'translating' })
    }
    let now: Line[] = []
    const ready = (lines: Line[]): CardState => ({ status: 'done', html: englishHtml(lines), translation: { status: 'ready', html: translationHtml(lines), drafts: draftsIn(lines), ...busyOf(job) }, ...noted })
    const update = every(UPDATE_MS, () => setState(id, ready(now)))
    try {
      const lines = await translateLines(split, settings.native, job.translate, lines => ((now = lines), update.ask()))
      update.cancel()
      setState(id, ready(lines))
    } finally {
      update.cancel()
    }
  } catch (error) {
    pending({ status: 'failed', message: messageOf(error) })
  }
}

function translateText(text: string, kind: CardKind, at: Point, via?: string): void {
  const id = openCard(kind, { status: 'translating' }, at, via)
  void translateInto(id, text, kind)
}

/**
 * Reads a snipped picture with Windows OCR into card `id`: the text, and
 * whether Windows lacked the person's language (an English engine reads
 * Cyrillic or Greek letters as Latin look-alikes); undefined when there is no
 * text, the card showing why.
 */
async function recognizeSnip(id: number, png: Buffer): Promise<{ text: string; misread: boolean } | undefined> {
  const file = path.join(app.getPath('temp'), `kryakl-${process.pid}-${id}.png`)
  try {
    fs.writeFileSync(file, png)
    const native = langCode(settings.native)
    const result = await ocrRead(file)
    if (result.readings.length === 0) return void setState(id, { status: 'no-ocr' })
    const text = paragraphsOf(pickLines(result.readings, ocrKnown()))
    if (!text.trim()) return void setState(id, { status: 'empty' })
    const nativeRead = result.readings.some(r => r.lang.split('-')[0]?.toLowerCase() === native)
    return { text, misread: scriptFor(settings.native) !== 'Latin' && !nativeRead }
  } finally {
    fs.rmSync(file, { force: true })
  }
}

/** A picture's text (a PNG or a JPEG): every one of the person's languages Windows reads (their own first), English last; on a Mac, Vision. */
function ocrRead(file: string): ReturnType<typeof recognize> {
  const native = langCode(settings.native)
  return process.platform === 'darwin'
    ? recognizeMac(unpacked('vendor', 'ocr-mac'), file, native)
    : recognize(file, [...new Set([native, ...settings.languages, 'en'].filter(Boolean))])
}

/** Reads a snipped picture with Windows OCR, then translates what it says. */
async function readScreenshot(png: Buffer, via?: string): Promise<void> {
  const id = openCard('screenshot', { status: 'reading' }, screen.getCursorScreenPoint(), via)
  try {
    const read = await recognizeSnip(id, png)
    if (!read) return
    const note = read.misread
      ? `Windows has no text recognition for ${settings.native}, so ${settings.native} words may come out wrong. Add it in Settings → Language.`
      : undefined
    await translateInto(id, read.text, 'screenshot', note)
  } catch (error) {
    setState(id, { status: 'failed', message: messageOf(error) })
  }
}

/** The translator's state of a text: from the language it seems to be in, into the person's own (from theirs, into English). */
function textState(text: string): Extract<CardState, { status: 'text' }> {
  const from = languageOf(text, settings.native, languageWords(), myLanguages(settings))
  return { status: 'text', text, from, to: targetFor(from, settings.native), languages: ['en', ...NATIVES], mine: myLanguages(settings), result: { status: 'none' } }
}

/** The field with the keyboard now (UI Automation), held to give the keyboard back to; undefined when Windows does not say. */
function focusedField(): unknown {
  try {
    return focusedElement()
  } catch (error) {
    console.warn('Tyts: could not ask which field has the keyboard', error)
    return undefined
  }
}

/** The text selected in a field, through UI Automation; empty when it has none or will not say. */
function selectionIn(field: unknown): string {
  if (!field) return ''
  try {
    return selectedText(field).trim()
  } catch (error) {
    console.warn('Tyts: could not read the selection through UI Automation', error)
    return ''
  }
}

/** Whether a field says outright that nothing is selected in it. */
function fieldSaysNothing(field: unknown): boolean {
  if (!field) return false
  try {
    return saysNothingSelected(field)
  } catch {
    return false
  }
}

function releaseField(field: unknown): void {
  if (!field) return
  try {
    release(field)
  } catch {
    // Its program may be gone.
  }
}

/** Opens the translator by the pointer with a picked text, translating it at once; `window`: where it was selected, to paste back into, `field` the field in it. */
function translateWindow(text: string, at: Point, window?: bigint, via?: string, field?: unknown): void {
  const state = { ...textState(text), canPaste: !!window }
  const id = openCard('translate', state, at, via)
  releaseField(pasteTarget?.field)
  pasteTarget = window ? { id, window, field } : undefined
  if (!window) releaseField(field)
  if (text) void translateTextCard(id, text, state.from, state.to)
}

/**
 * Paste: once Enter (pressed for it) is let go, the window the text was
 * selected in comes to the front (while the card still is, as Windows
 * allows), the field the selection was in gets the keyboard back, the card
 * goes away, and the translation is pasted over the selection through the
 * clipboard, which is put back after.
 */
async function pasteTranslation(id: number, text: string): Promise<void> {
  const target = pasteTarget
  if (!target || target.id !== id || !text) return
  pasteTarget = undefined
  const state = shown?.state
  if (state?.status === 'text') logTranslation(state.text, text, state.from, state.to)
  await keysLetGo()
  focusWindow(target.window)
  hideCard()
  await pasteInto(target.window, target.field, text + (target.after ?? ''))
}

/** The text pasted where the keyboard is in `window`, once it is in front, into `field` when known; the clipboard put back after. */
async function pasteInto(window: bigint, field: unknown, text: string): Promise<void> {
  await inFront(window)
  if (field) {
    try {
      // A web page in a window (VS Code's chat) takes the keyboard back a moment after.
      if (focus(field)) await new Promise(resolve => setTimeout(resolve, 80))
    } catch (error) {
      console.warn('Tyts: could not give the keyboard back to the field', error)
    }
    releaseField(field)
  }
  await borrowClipboard(() => pasteText(text))
}

/** `text` pasted in the program in front: written to paste, Ctrl+V, the guard told. */
async function pasteText(text: string): Promise<void> {
  if (onMac) {
    // No SendInput on a Mac: Cmd+V through System Events, the person's text put back once the program has read it.
    const before = await clipboard.readText()
    macOwnWrites(300)
    clipboard.writeText(text)
    const at = Date.now()
    // The helper's own Cmd+V: its tap would take System Events' for the person's key.
    const method = keyboard?.paste() ? 'helper' : (await macKeystroke('v'), 'osascript')
    log(`paste: ${method} in ${Date.now() - at} ms`)
    macOwnWrites(300)
    setTimeout(() => clipboard.writeText(before), 300)
    return
  }
  await clipGuard.write(text, true)
  const down = await pressPaste()
  if (down.length > 0) log(`paste: pressed with ${down.join(' and ')} still down`)
  clipGuard.pasted()
}

/**
 * Translate in place: the selection's translation pasted over it, no card,
 * the direction as the translator's (the person's language into English, any
 * other into theirs). A badge by the cursor says it is working. The translator
 * for the pair not downloaded yet, or the window left meanwhile: the card
 * opens instead, so nothing is lost.
 */
async function translateInPlace(text: string, at: Point, window: bigint, via?: string): Promise<void> {
  const { from, to } = textState(text)
  const job = translationJob([from, to])
  const missing = [from, to].some(code => code !== 'en' && job.t.state(code).status !== 'ready')
  if (missing) return translateWindow(text, at, window, via)
  keyboard.say('…')
  try {
    const out = await translatePlain(text.slice(0, MAX_TEXT_CHARS), from, to, job.translate, job.t.direct)
    keyboard.say('')
    if (!out.trim()) return
    logTranslation(text, out, from, to)
    if (foreground().hwnd !== window) return translateWindow(text, at, window, via)
    await keysLetGo()
    await pasteInto(window, undefined, out)
    // Fast did it: said by the cursor, as no card shows.
    const busy = job.busy()
    if (busy) keyboard.say(t(busy === 'card' ? 'badge.fastCard' : 'badge.fastProcessor'), BUSY_SAY_MS)
  } catch (error) {
    keyboard.say('')
    tray?.displayBalloon({ title: t('app.name'), content: t('main.notTranslated', { why: messageOf(error) }) })
  }
}

/** A translation kept for the Translate page's recent ones. */
function logTranslation(text: string, translation: string, from: string, to: string): void {
  translationLog.add({ text, translation, from, to })
  postApp()
}

/** Reads a snipped picture with Windows OCR and translates the text in the translator, where it can be fixed and copied. */
async function readScreenText(png: Buffer, via?: string): Promise<void> {
  const id = openCard('text', { status: 'reading' }, screen.getCursorScreenPoint(), via)
  try {
    const read = await recognizeSnip(id, png)
    if (!read) return
    const state = textState(read.text)
    setState(id, state)
    await translateTextCard(id, read.text, state.from, state.to)
  } catch (error) {
    setState(id, { status: 'failed', message: messageOf(error) })
  }
}

/** The latest translation asked of a text card: an older one, still running, is not shown. */
let textAsked = 0

/** Translates the translator's text, as it stands, from one language into another. */
async function translateTextCard(id: number, text: string, from: string, to: string, wait = false): Promise<void> {
  const set = (result: TextResult) => {
    if (shown?.id === id && shown.state.status === 'text') setState(id, { ...shown.state, text, from, to, result })
  }
  const asked = ++textAsked
  const current = () => asked === textAsked
  const job = translationJob([from, to], wait)
  const { t } = job
  try {
    set({ status: 'translating' })
    for (const code of [from, to]) {
      if (code === 'en' || t.state(code).status === 'ready') continue
      await t.prepare(code, state => {
        if (current() && state.status === 'downloading') set({ status: 'downloading', language: code, progress: state.progress, size: state.size })
      })
      if (current()) set({ status: 'translating' })
    }
    const ready = (lines: TextLine[]): TextResult => ({
      status: 'ready',
      text: plainText(lines),
      from,
      to,
      html: textOutHtml(lines),
      sentences: lines.flatMap(line => line.pairs.map(p => p.src)),
      drafts: draftsIn(lines),
      ...busyOf(job),
    })
    let now: TextLine[] = []
    const update = every(UPDATE_MS, () => current() && set(ready(now)))
    try {
      const lines = await translatePairs(text.slice(0, MAX_TEXT_CHARS), from, to, job.translate, t.direct, lines => ((now = lines), update.ask()))
      update.cancel()
      if (current()) set(ready(lines))
    } finally {
      update.cancel()
    }
  } catch (error) {
    if (current()) set({ status: 'failed', message: messageOf(error) })
  }
}

// ---------------------------------------------------------------- checking English

/** Check my English (the one local model, which translates too, on llama.cpp's server), and the mistakes it found. */
let llmFiles: LlmFiles
let checker: Checker
let summarizer: ReturnType<typeof createSummarizer>
let asker: ReturnType<typeof createAsker>
let editor: Editor
let mistakes: MistakeStore

/** The latest check asked of a check card: an older one, still running, is not shown. */
let checkAsked = 0

/**
 * Opens Check my English by the pointer with a text (empty: one to type),
 * checked at once; `window` (and its `field`): where it was selected or
 * dictated, to paste the text set right back into, `after` it.
 */
function checkWindow(text: string, at: Point, window?: bigint, via?: string, field?: unknown, after?: string): void {
  const id = openCard('check', { status: 'check', text, result: { status: 'none' }, model: levelName(settings.model), canPaste: !!window }, at, via)
  releaseField(pasteTarget?.field)
  pasteTarget = window ? { id, window, field, ...(after ? { after } : {}) } : undefined
  if (!window) releaseField(field)
  if (text.trim()) void checkCard(id, text)
}

/** Practice: a phrase spoken in English, checked by the pointer; Paste types it set right where the cursor was, a space after it. */
function practice(text: string): void {
  checkWindow(text, screen.getCursorScreenPoint(), foreground().hwnd, settings.practiceKey, focusedField(), ' ')
}

/**
 * The Talk key, from anywhere: the window on Talk, and the page listens (or,
 * listening, sends what was said; while the duck speaks, stops it and listens).
 */
function talkPressed(): void {
  openTalk()
  if (talkReady) postTalkWindow({ type: 'talk', command: 'toggle' })
  else pendingTalk = true
}

// ---------------------------------------------------------------- the talk window
// A window of its own for the talk (media/talk.html, webview/talk.ts), opened
// by the Talk key, the tray and the Talk page; the app window's Talk page holds
// its settings. Closing hides it; the talk itself is talk.ts's, here in main.

/** The talk window's size when it first opens, and the least it may be. */
const TALK_SIZE = { width: 440, height: 640 }
const TALK_MIN = { width: 360, height: 420 }

function createTalkWindow(): BrowserWindow {
  const win = new BrowserWindow({
    ...talkPlace(),
    minWidth: TALK_MIN.width,
    minHeight: TALK_MIN.height,
    show: false,
    // The page draws its own bar (the duck, the history, the pin, the settings, maximize, close); the edges still resize, and a double click on the bar maximizes.
    frame: false,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    alwaysOnTop: settings.talkOnTop,
    title: t('menu.talk'),
    icon: path.join(app.getAppPath(), 'media', 'icon.png'),
    backgroundColor: cardColor(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      // The duck's voice and the microphone go on while another window is in front.
      backgroundThrottling: false,
    },
  })
  frameWindow(win, { corner: 'round', border: borderColor() })
  win.removeMenu()
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())
  // Moved or sized by the person: it opens there next time (filling the screen is not a size to keep).
  const keep = () => {
    if (!win.isDestroyed() && !win.isMinimized() && !win.isMaximized()) saveSettings({ talkBounds: win.getBounds() })
  }
  win.on('moved', keep)
  win.on('resized', keep)
  // Its maximize button shows Maximize or Restore, whichever way the window got there.
  win.on('maximize', () => postTalk())
  win.on('unmaximize', () => postTalk())
  logPageErrors(win, 'talk window')
  // Its page keeps its timers behind other windows (the voice, the microphone), so it is told when it goes out of sight.
  win.on('hide', () => postTalkWindow({ type: 'talk', command: 'hidden' }))
  win.on('minimize', () => postTalkWindow({ type: 'talk', command: 'hidden' }))
  win.on('close', event => {
    if (quitting) return
    event.preventDefault()
    win.hide()
  })
  win.on('closed', () => {
    talkWin = undefined
    talkReady = false
  })
  void win.loadFile(path.join(app.getAppPath(), 'media', 'talk.html'), pageOptions())
  return win
}

/** Where the talk window opens: where it was left, while that is still on a screen; else by the bottom right of the work area of the pointer's screen. */
function talkPlace(): Rectangle {
  const kept = settings.talkBounds
  if (kept) {
    const area = screen.getDisplayMatching(kept).workArea
    const seen = Math.min(kept.x + kept.width, area.x + area.width) - Math.max(kept.x, area.x) >= 120 && Math.min(kept.y + kept.height, area.y + area.height) - Math.max(kept.y, area.y) >= 60
    if (seen) return kept
  }
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const width = Math.min(TALK_SIZE.width, area.width)
  const height = Math.min(TALK_SIZE.height, area.height)
  return { x: area.x + area.width - width - 16, y: area.y + area.height - height - 16, width, height }
}

/** Shows the talk window, made the first time. */
function openTalk(): void {
  if (!talkWin || talkWin.isDestroyed()) talkWin = createTalkWindow()
  if (talkWin.isMinimized()) talkWin.restore()
  talkWin.show()
  talkWin.focus()
}

function postTalkWindow(message: ToView): void {
  if (talkWin && talkReady && !talkWin.isDestroyed()) talkWin.webContents.send('to-view', message)
}

function postTalk(): void {
  if (talkWin && talkReady && talk) postTalkWindow({ type: 'talkView', view: talkWindowView() })
}

/** What the talk window draws: the talk, the settings it reads, and what stands in its way here. */
function talkWindowView(): TalkWindowView {
  const s = settings
  const view = speech?.view(speechKeysOk)
  const installed = !!view?.pack.parts.includes('core')
  const fit = translationAdvice(speech?.profile)
  const probed = !!speech?.profile?.at
  const busy = busyFor(s.model)
  const current = talks.current()
  return {
    talk: talk.state(),
    talks: { ...(current ? { current: summaryOf(current) } : {}), past: talks.list().map(summaryOf) },
    maximized: !!talkWin?.isMaximized(),
    talkKey: s.talkKey,
    talkAloud: s.talkAloud,
    onTop: s.talkOnTop,
    voice: s.voice,
    rate: s.rate,
    wordHint: s.wordHint,
    rareWords: s.rareWords,
    native: s.native,
    natural: naturalState().status,
    engine: !installed ? 'absent' : view?.service === 'ready' ? 'ready' : 'starting',
    model: { name: levelName(s.model), full: LLM_MODELS[s.model].name, ...llmFiles.state(s.model) },
    needsCard: probed && fit.accurate.where !== 'card',
    slow: probed && fit[s.model].where !== 'card',
    ...(busy ? { busy } : {}),
    keyTaken: !speechKeysOk.talk,
  }
}

/** Checks the card's text, as it stands; its model downloaded first, the first time. */
async function checkCard(id: number, text: string): Promise<void> {
  const set = (result: CheckResult) => {
    if (shown?.id === id && shown.state.status === 'check') setState(id, { ...shown.state, text, result })
  }
  const asked = ++checkAsked
  const current = () => asked === checkAsked
  try {
    set({ status: 'checking' })
    if (checker.state().status !== 'ready') {
      await checker.prepare(state => {
        if (current() && state.status === 'downloading') set({ status: 'downloading', progress: state.progress, size: state.size })
        postApp()
      })
      if (current()) set({ status: 'checking' })
    }
    const out = await checker.check(text, langCode(settings.native))
    if (current()) set({ status: 'ready', text, corrected: out.corrected, parts: wordDiff(text, out.corrected), note: out.note })
  } catch (error) {
    if (current()) set({ status: 'failed', message: messageOf(error) })
  }
}

/** The model in use downloaded ahead (the Check page's Use). */
function prepareModel(): void {
  checker
    .prepare(() => postApp())
    .catch(error => console.warn('Tyts: the model did not download', error))
    .finally(() => (postApp(), remeasure()))
}

/** A checked text with a mistake, kept for Library › Mistakes. */
function logMistake(result: Extract<CheckResult, { status: 'ready' }>): void {
  if (mistakes.add({ text: result.text, corrected: result.corrected, note: result.note })) postApp()
}

/** Opens Windows' snipping overlay; the text of the picture it puts on the clipboard is shown to listen to, or translated. */
function snip(purpose: Purpose = 'listen', via?: string): void {
  hideCard()
  warmModel(purpose)
  snipFor = purpose
  snipVia = via
  snipSince = Date.now()
  if (process.platform === 'darwin') return snipMac(purpose, via)
  // The snip lands on the clipboard: what the person had there goes back once it is read.
  clipGuard.hold()
  void shell.openExternal('ms-screenclip:')
}

/** On a Mac: macOS' own selection (as Cmd+Shift+4) into a file, then read as a Windows snip is. Esc leaves no file. */
function snipMac(purpose: Purpose, via?: string): void {
  const file = path.join(app.getPath('temp'), `kryakl-snip-${process.pid}.png`)
  fs.rmSync(file, { force: true })
  execFile('screencapture', ['-i', '-x', file], () => {
    snipSince = 0
    if (!fs.existsSync(file)) return
    const png = fs.readFileSync(file)
    fs.rmSync(file, { force: true })
    void (purpose === 'translate' ? readScreenText(png, via) : readScreenshot(png, via))
  })
}

/** The snip waited for is not coming (a copy without a picture): the clipboard was the person's to change, nothing to put back. */
function endSnip(): void {
  snipSince = 0
  clipGuard.drop()
}

/** Shows a picked text by the pointer: the card to listen to, or the translator; `window`: where it was selected (`field`, the field in it), or pastes its translation over it. */
function showText(text: string, purpose: Purpose, at: Point, window?: bigint, via?: string, field?: unknown): void {
  if (purpose === 'translate') return translateWindow(text, at, window, via, field)
  if (purpose === 'check') return checkWindow(text, at, window, via, field)
  releaseField(field)
  if (purpose === 'inPlace' && window) void translateInPlace(text, at, window, via)
  else translateText(text, 'selection', at, via)
}

async function useClipboard(purpose: Purpose): Promise<void> {
  const text = (await clipboard.readText()).trim()
  if (text) showText(text, purpose, screen.getCursorScreenPoint())
  else tray?.displayBalloon({ title: t('app.name'), content: t('main.noClipText') })
}

/** How often a running model looks for a program on the full screen, and how long it rests before it gives the card to one. */
const FULL_SCREEN_LOOK_MS = 5000
const FULL_SCREEN_REST_MS = 15_000

/**
 * A game, a video or a presentation on the full screen wants the graphics
 * card: a model resting on it is stopped (2026-10-31) and loads again with
 * the next translation or check. One that has just answered rests a moment
 * first, so texts translated over a full-screen reader are not reloaded each time.
 */
function stopForFullScreen(): void {
  const resting = llmFiles.server.restingFor
  if (resting === undefined || resting < FULL_SCREEN_REST_MS || !fullScreenNow()) return
  log(`model: stopped for a program on the full screen (${path.basename(llmFiles.server.model ?? '')})`)
  void llmFiles.server.stop()
}

/** The card's memory used while a model was loaded, to learn what it held once it is let go. */
let cardSample: { model: LlmModel; file: string; used: number } | undefined
let sampling = false

/**
 * What a model holds of the graphics card, measured once per computer on an
 * NVIDIA card (the Models page says it): nvidia-smi's memory used while the
 * model is loaded, and again once it is let go and nothing else is loaded;
 * the difference, when it is more than a little (a model on the processor holds none).
 */
async function measureCard(): Promise<void> {
  if (sampling) return
  const server = llmFiles.server
  const loaded = server.loaded
  if (!cardSample) {
    const model = (['accurate', 'most'] as const).find(m => loaded && llmFiles.target(m).model === loaded)
    if (!model || !loaded || modelSpeeds[model]?.card !== undefined) return
    sampling = true
    const used = await cardMemoryUsed().finally(() => (sampling = false))
    if (used !== undefined && server.loaded === loaded) cardSample = { model, file: loaded, used }
    return
  }
  if (loaded === cardSample.file) return
  const sample = cardSample
  cardSample = undefined
  // Another model loading meanwhile would spoil the difference.
  if (server.model !== undefined) return
  sampling = true
  const after = await cardMemoryUsed().finally(() => (sampling = false))
  const held = after === undefined ? 0 : sample.used - after
  if (held < CARD_HELD_MIN_MB) return
  log(`model: ${sample.model} held ${held} MB of the graphics card`)
  modelSpeeds = { ...modelSpeeds, [sample.model]: { ...nextModelSpeed(modelSpeeds[sample.model], {}), card: held } }
  saveModelSpeeds(deviceFile(), modelSpeeds)
  postApp()
}

/** Less than this is no model on the card (one on the processor), or the noise of other programs. */
const CARD_HELD_MIN_MB = 300

/** The local model loaded now, for the Models page's "Right now". */
function llmLoadedView(): { llmLoaded?: { model: LlmModel; onCard: boolean } } {
  const server = llmFiles.server
  const model = server.loaded && (['accurate', 'most'] as const).find(m => llmFiles.target(m).model === server.loaded)
  return model ? { llmLoaded: { model, onCard: !server.onProcessor } } : {}
}

/** What the window last heard of the loaded model: a change is sent to it. */
let loadedShown = ''

/** Every few seconds while Kryakl runs: a model on a full screen's card let go, and what one holds measured. */
function watchModel(): void {
  const loaded = JSON.stringify(llmLoadedView())
  if (loaded !== loadedShown) {
    loadedShown = loaded
    postApp()
  }
  stopForFullScreen()
  recheckBusy().catch(error => console.warn('Tyts: could not look at the graphics card', error))
  measureCard().catch(error => console.warn('Tyts: could not measure the graphics card', error))
}

/**
 * The local model starts loading the moment a key asks for it (2026-10-31),
 * while the text is still being copied, snipped or typed: its 3 s start after
 * an idle stop would else come after them. Only for a purpose that uses it
 * (the level's model, Check's always) and once its files are here.
 */
function warmModel(purpose: Purpose): void {
  const model = purpose === 'check' ? settings.model : settings.translationLevel
  if (model === 'fast' || llmFiles.state(model).status !== 'ready') return
  // Check my English always uses the model.
  if (purpose === 'check') return llmFiles.server.warm(llmFiles.target(model))
  warmWhole(model)
}

/** The model started ahead, unless it is too slow just now or the card cannot hold it whole: the job finds that out itself. */
function warmWhole(model: LlmModel): void {
  if (busyFor(model)) return
  cardFull(model).then(
    full => full || busyFor(model) || llmFiles.server.warm(llmFiles.target(model)),
    () => llmFiles.server.warm(llmFiles.target(model)),
  )
}

/** How long a phrase waits for its edit, the model's load included: then it is typed as said. */
const EDIT_WAIT_MS = { card: 8000, processor: 20_000 }

/**
 * Text editing: the phrase as the local model leaves it (dictedit.ts). Dictation
 * never waits for a model that cannot work now: the phrase is typed as it was
 * said and the badge says why. Never a word of the phrase in the log.
 */
async function editPhrase(text: string, stop: AbortSignal): Promise<{ text: string; note?: string }> {
  const model = settings.model
  if (llmFiles.state(model).status !== 'ready') return { text, note: t('dict.editNoModel') }
  const busy = busyFor(model)
  if (busy) return { text, note: t(busy === 'card' ? 'dict.editCard' : 'dict.editProcessor') }
  if (await cardFull(model).catch(() => undefined)) return { text, note: t('dict.editCard') }
  const wait = EDIT_WAIT_MS[translationAdvice(speech?.profile)[model].where === 'card' ? 'card' : 'processor']
  const style = settings.dictateEditStyle
  const began = Date.now()
  try {
    const terms = vocabularyFor(settings).map(entry => entry.word)
    const out = await editor.edit(text, style, settings.dictateEditOwn, terms, AbortSignal.any([stop, AbortSignal.timeout(wait)]))
    log(`edit: ${style}, ${((Date.now() - began) / 1000).toFixed(1)} s${out.doubt ? `, typed as said (${out.doubt})` : ''}`)
    return out.doubt ? { text, note: t('dict.editDoubt') } : { text: out.text }
  } catch (error) {
    if (stop.aborted) return { text }
    log(`edit: ${style}, gave up after ${((Date.now() - began) / 1000).toFixed(1)} s: ${error instanceof Error ? error.name : 'failed'}`)
    return { text, note: t('dict.editSlow') }
  }
}

/**
 * A selection key: Kryakl presses Ctrl+C in the program in front and shows what it copies; the clipboard is put back after.
 * `nothing`: what to do when no copy comes in time, in place of saying so (the menu's items).
 */
async function useSelection(purpose: Purpose, via?: string, nothing?: () => void): Promise<void> {
  warmModel(purpose)
  const at = screen.getCursorScreenPoint()
  const front = foreground()
  const window = front.hwnd
  const exe = exeOf(front.pid)
  // The translator's (and the checker's) Paste gives the keyboard back to this field; any purpose reads its selection when no copy comes.
  const field = focusedField()
  snipSince = 0
  clipGuard.hold()
  const down = await pressCopy()
  // A key Windows still thinks held makes Ctrl+C another shortcut, which copies nothing.
  if (down.length > 0) log(`copy: pressed with ${down.join(' and ')} still down in ${exe}`)
  const since = Date.now()
  releaseField(copyWanted?.field)
  copyWanted = { since, at, purpose, window, field, exe, ...(via ? { via } : {}) }
  const giveUp = (waited: number) => {
    if (!copyWanted) return
    releaseField(copyWanted.field)
    copyWanted = undefined
    lateCopyUntil = Date.now() + LATE_COPY_MS
    // Put back once a late copy has had its time; nothing changed, nothing is written.
    clipGuard.release(LATE_COPY_MS)
    log(`copy: nothing in ${waited} ms from ${exe}`)
    if (nothing) nothing()
    else tray?.displayBalloon({ title: t('app.name'), content: t('main.nothingCopied') })
  }
  setTimeout(() => {
    if (copyWanted?.since !== since) return
    const text = selectionIn(field)
    if (!text) {
      // The menu has something to do with no selection: a field that says it has none is not waited for.
      if (nothing && fieldSaysNothing(field)) giveUp(UIA_WAIT_MS)
      return
    }
    copyWanted = undefined
    // A copy the program makes after all is its late answer: taken back with the rest.
    lateCopyUntil = Date.now() + LATE_COPY_MS
    clipGuard.release(LATE_COPY_MS)
    log(`copy: none in ${UIA_WAIT_MS} ms, read ${text.length} chars by UI Automation from ${exe}`)
    showText(text, purpose, at, window, via, field)
  }, UIA_WAIT_MS)
  setTimeout(() => {
    if (copyWanted?.since === since) giveUp(COPY_WAIT_MS)
  }, COPY_WAIT_MS)
}

/** The picture on the clipboard as PNG, if there is one. */
async function clipboardPng(): Promise<Buffer | undefined> {
  for (const item of await clipboard.read()) {
    if (!item.types.includes('image/png')) continue
    const blob = (await item.getType('image/png')) as Blob
    return Buffer.from(await blob.arrayBuffer())
  }
  return undefined
}

/** Reads the clipboard once the program that changed it is done. */
function afterSettling(read: () => Promise<void>): void {
  setTimeout(() => read().catch(error => console.warn('Tyts: could not read the clipboard', error)), SETTLE_MS)
}

function onClipboardChange(): void {
  const now = Date.now()
  // ponytail: a Mac has no clipboard sequence number (clipGuard's is 0 there), so its own writes are skipped by time alone (macOwnWrites)
  if (clipboardBusy || now < ownClipboardUntil || (!onMac && clipGuard.isOurs())) return
  const ctrl = ctrlHeld()
  if (copyWanted && now - copyWanted.since < COPY_WAIT_MS) {
    const { at, purpose, window, field, via } = copyWanted
    log(`copy: came in ${now - copyWanted.since} ms from ${copyWanted.exe}`)
    copyWanted = undefined
    // A password manager's copy (marked "do not watch") is neither shown nor read aloud.
    const secret = privateCopy()
    afterSettling(async () => {
      // The copy Kryakl pressed: taken back once read.
      clipGuard.claim()
      const text = secret ? '' : (await clipboard.readText()).trim()
      await clipGuard.putBack()
      if (secret) log('copy: a copy marked private (a password manager) is left alone')
      if (text) showText(text, purpose, at, window, via, field)
      else releaseField(field)
    })
    return
  }
  if (now < lateCopyUntil && !ctrl) {
    // The program's late answer to Kryakl's Ctrl+C: put back with the rest, when clipGuard's wait ends.
    lateCopyUntil = 0
    clipGuard.claim()
    return
  }
  if (snipSince && now - snipSince < SNIP_WAIT_MS) {
    afterSettling(async () => {
      const png = await clipboardPng()
      if (!snipSince) return
      // A copy without a picture is the person's own: the snip is not coming.
      if (!png) {
        endSnip()
        return doubleCopyChange(now, ctrl)
      }
      snipSince = 0
      // The picture is read; what the person had goes back.
      clipGuard.claim()
      await clipGuard.putBack()
      await (snipFor === 'translate' ? readScreenText(png, snipVia) : readScreenshot(png, snipVia))
    })
    return
  }
  doubleCopyChange(now, ctrl)
}

/** The action on the selection whose key is Ctrl+C twice, if one has it (one at most: the settings keep a key for one use). */
function copyTwicePurpose(): Purpose | undefined {
  if (settings.selectKey === DOUBLE_COPY) return 'listen'
  if (settings.translateKey === DOUBLE_COPY) return 'translate'
  if (settings.inPlaceKey === DOUBLE_COPY) return 'inPlace'
  if (settings.checkKey === DOUBLE_COPY) return 'check'
  return undefined
}

/** A change of the clipboard by the person: Ctrl+C twice runs the action whose key it is, on what was copied. */
function doubleCopyChange(now: number, ctrl: boolean): void {
  // Copying from the card itself is not a request, nor is any copy while Kryakl is paused, nor a password
  // manager's copy (marked "do not watch"): Ctrl+C twice on a password never shows or reads it.
  const purpose = copyTwicePurpose()
  if (card?.isFocused() || !purpose || settings.paused || privateCopy()) return
  if (!copies.change(now, ctrl)) return
  warmModel(purpose)
  const at = screen.getCursorScreenPoint()
  // Paste and Translate in place go back to the window copied from (and the translator's and the checker's to its field), as the selection keys do.
  const window = purpose === 'listen' ? undefined : foreground().hwnd
  const field = purpose === 'translate' || purpose === 'check' ? focusedField() : undefined
  afterSettling(async () => {
    const text = (await clipboard.readText()).trim()
    if (text) showText(text, purpose, at, window, DOUBLE_COPY, field)
    else releaseField(field)
  })
}

function selection(purpose: Purpose, via?: string, nothing?: () => void): void {
  if (onMac) return void macSelection(purpose, via, nothing)
  useSelection(purpose, via, nothing).catch(error => console.warn('Tyts: could not copy the selection', error))
}

/**
 * A Mac's selection: Cmd+C sent through System Events (macOS asks once for
 * Accessibility access), the clipboard read a moment after. In place has no
 * window to paste back into here and shows the card instead.
 */
// ponytail: the copy is left on the clipboard; snapshot and restore it as pasteText does if people mind
async function macSelection(purpose: Purpose, via?: string, nothing?: () => void): Promise<void> {
  const at = screen.getCursorScreenPoint()
  const before = await clipboard.readText()
  // Kryakl's own Cmd+C is pressed with Command down: never half of a Cmd+C twice.
  macOwnWrites(150)
  clipboard.writeText('')
  await macKeystroke('c')
  macOwnWrites(150)
  await new Promise(resolve => setTimeout(resolve, 150))
  const text = (await clipboard.readText()).trim()
  if (text) return showText(text, purpose === 'inPlace' ? 'listen' : purpose, at, undefined, via)
  clipboard.writeText(before)
  if (nothing) nothing()
  else tray?.displayBalloon({ title: t('app.name'), content: t('main.nothingCopied') })
}

/** A Mac's clipboard changes Kryakl makes in the next `ms` (and the one a moment after), left out of Cmd+C twice. */
function macOwnWrites(ms: number): void {
  ownClipboardUntil = Math.max(ownClipboardUntil, Date.now() + ms + OWN_CLIPBOARD_MS)
}

/** A Cmd+letter sent to the program in front through System Events. */
function macKeystroke(letter: string): Promise<void> {
  return new Promise(resolve => execFile('osascript', ['-e', `tell application "System Events" to keystroke "${letter}" using command down`], () => resolve()))
}

/** How long the badge says there is nothing selected. */
const NOTHING_SAY_MS = 2600

/**
 * The menu key: the menu by the text cursor, and pressed again it goes. A
 * dictation under way (the menu starts them) is stopped by it instead; a phrase
 * being finished is left to finish.
 */
function menuPressed(): void {
  if (dictation.state === 'recording') return dictation.press(dictation.mode, settings.menuKey)
  if (dictation.state === 'idle') oneKeyMenu?.toggle()
}

/** An item of the menu, by the handlers the keys use: with nothing selected, the translator and the checker open empty; reading and replacing say so by the cursor. */
function runMenu(action: MenuAction): void {
  const via = settings.menuKey
  switch (action) {
    case 'translate':
      return selection('translate', via, () => typeInto('translate', via))
    case 'listen':
      return selection('listen', via, () => keyboard.say(t('menu.nothingToRead'), NOTHING_SAY_MS))
    case 'inPlace':
      return selection('inPlace', via, () => keyboard.say(t('menu.nothingToReplace'), NOTHING_SAY_MS))
    case 'screen':
      return snip('translate', via)
    case 'check':
      return selection('check', via, () => typeInto('check', via))
    case 'talk':
      return openTalk()
    case 'dictate':
      return dictation.press('type', via)
    case 'english':
      return dictation.press('english', via)
    case 'fix':
      return keyboard.fixNow()
  }
}

/** The pause key: Kryakl paused, or back. */
function togglePause(): void {
  saveSettings({ paused: !settings.paused })
}

function registerShortcuts(): void {
  globalShortcut.unregisterAll()
  // A key Electron cannot hold (a double tap of Ctrl, a mouse button) is the keyboard thread's: applyKeyboard().
  const register = (accelerator: string, run: () => void): boolean => {
    if (!accelerator) return true
    if (!isAccelerator(accelerator)) {
      return true
    }
    try {
      // On a Mac Ctrl (and Win) is read as Cmd, as the labels show it (hotkey.ts hotkeyLabel).
      return globalShortcut.register(onMac ? accelerator.replace(/\b(Control|Super)\b/g, 'Command') : accelerator, run)
    } catch {
      return false
    }
  }
  // Paused: no key but the pause key, and none is "taken".
  if (settings.paused) {
    keysOk = { snip: true, select: true, translate: true, text: true, inPlace: true, check: true, type: true, typeCheck: true, pause: register(settings.pauseKey, togglePause), window: true }
    speechKeysOk = { dictate: true, english: true, note: true, again: true, practice: true, talk: true, meeting: true, shot: true }
    return
  }
  keysOk = {
    snip: register(settings.snipKey, () => snip('listen', settings.snipKey)),
    select: register(settings.selectKey, () => selection('listen', settings.selectKey)),
    translate: register(settings.translateKey, () => selection('translate', settings.translateKey)),
    text: register(settings.textKey, () => snip('translate', settings.textKey)),
    inPlace: register(settings.inPlaceKey, () => selection('inPlace', settings.inPlaceKey)),
    check: register(settings.checkKey, () => selection('check', settings.checkKey)),
    type: register(settings.typeKey, () => typeInto('translate', settings.typeKey)),
    typeCheck: register(settings.typeCheckKey, () => typeInto('check', settings.typeCheckKey)),
    pause: register(settings.pauseKey, togglePause),
    window: register(settings.windowKey, () => openApp()),
  }
  if (onMac) {
    // The menu key is the keyboard thread's on Windows; a Mac has none.
    register(settings.menuKey, menuPressed)
    // ponytail: Cmd+Shift+L and Cmd+Shift+Y stand in for keys left empty, unchecked against the person's other keys
    if (!settings.selectKey) register('Control+Shift+L', () => selection('listen'))
    if (!settings.translateKey) register('Control+Shift+Y', () => selection('translate'))
  }
  // Dictate's keys mean nothing before the engine is there; then each starts and stops a phrase.
  // Held to talk, the keys but the note's are the keyboard thread's, which sees them go up (keyboard.ts apply);
  // a thread that sees no key leaves them to Electron, a press to start and a press to stop.
  const dictate = (mode: DictationMode, key: string) =>
    speech?.installed ? (settings.dictateHold && !keysUnseen && mode !== 'note') || register(key, () => dictation.press(mode, key)) : true
  speechKeysOk = {
    dictate: dictate('type', settings.dictateKey),
    english: dictate('english', settings.englishKey),
    note: dictate('note', settings.noteKey),
    again: speech?.installed ? register(settings.againKey, () => dictation.typeAgain()) : true,
    practice: dictate('check', settings.practiceKey),
    talk: speech?.installed ? register(settings.talkKey, talkPressed) : true,
    meeting: speech?.installed ? register(settings.meetingKey, toggleCall) : true,
    // ponytail: Electron's keys only, the keyboard thread knows no 'shot' action (typist.ts KeyAction); a double tap or a mouse button is refused
    shot: speech?.installed && settings.shotKey ? isAccelerator(settings.shotKey) && register(settings.shotKey, () => capture?.shot()) : true,
  }
  const taken = [
    !keysOk.snip && settings.snipKey,
    !keysOk.select && settings.selectKey,
    !keysOk.translate && settings.translateKey,
    !keysOk.text && settings.textKey,
    !keysOk.inPlace && settings.inPlaceKey,
    !keysOk.check && settings.checkKey,
    !keysOk.type && settings.typeKey,
    !keysOk.typeCheck && settings.typeCheckKey,
    !keysOk.pause && settings.pauseKey,
    !keysOk.window && settings.windowKey,
    !speechKeysOk.dictate && settings.dictateKey,
    !speechKeysOk.english && settings.englishKey,
    !speechKeysOk.note && settings.noteKey,
    !speechKeysOk.again && settings.againKey,
    !speechKeysOk.practice && settings.practiceKey,
    !speechKeysOk.talk && settings.talkKey,
    !speechKeysOk.meeting && settings.meetingKey,
    !speechKeysOk.shot && settings.shotKey,
  ].filter((k): k is string => !!k)
  // The settings window shows the trouble itself; the balloon is for a start without it.
  if (taken.length > 0 && !(appWin?.isVisible() ?? false)) {
    tray?.displayBalloon({
      title: t('app.name'),
      content: t('main.keysTaken', { n: taken.length, keys: taken.map(keyLabel).join(` ${t('common.and')} `) }),
    })
  }
}

// ---------------------------------------------------------------- the keyboard

function applyKeyboard(): void {
  // The helper says it lacks Accessibility once, when it starts: that stays said until it says otherwise.
  keyboardTrouble = keysUnseen ? macTrouble : undefined
  try {
    // Dictate's keys work only once the engine is installed, here as with Electron's shortcuts; paused, the helper keeps the pause key alone.
    keyboard.apply(speech?.installed ? settings : { ...settings, dictateKey: '', englishKey: '', noteKey: '', againKey: '', practiceKey: '', talkKey: '', meetingKey: '' }, learned.forThread())
  } catch (error) {
    keyboardTrouble = messageOf(error)
  }
}

/** What each key types in each layout, read from Windows once. */
const tables = new Map<string, KeyTable>()
function tableFor(id: string): KeyTable | undefined {
  if (!tables.has(id)) for (const l of installedLayouts()) if (!tables.has(l.id)) tables.set(l.id, layoutTable(l.hkl))
  return tables.get(id)
}

/**
 * Kryakl pastes through the clipboard: what the person had there is kept
 * (once for a run of such pastes) and goes back once `work` is done, or has
 * failed: a moment after the program read the pasted text, or `after` ms;
 * a snip still awaited is no longer.
 */
async function borrowClipboard<T>(work: () => Promise<T>, after: (result: T | undefined) => number | undefined = () => undefined): Promise<T> {
  snipSince = 0
  // ponytail: a Mac has no user32 clipboard (winclipboard's calls are stubs there), so the guard is skipped; pasteText's Mac branch keeps and puts back the text itself (text only, a copy made meanwhile is overwritten)
  if (onMac) return ownClipboard(work)
  clipGuard.hold()
  let result: T | undefined
  try {
    result = await ownClipboard(work)
    return result
  } finally {
    clipGuard.release(after(result))
  }
}

/** Runs Kryakl's own use of the clipboard; the changes it makes, until a moment after, are not taken for requests. */
async function ownClipboard<T>(work: () => Promise<T>): Promise<T> {
  clipboardBusy = true
  try {
    return await work()
  } finally {
    clipboardBusy = false
    ownClipboardUntil = Date.now() + OWN_CLIPBOARD_MS
  }
}

/**
 * The fix key with a selection: Kryakl copies it, types it again in the
 * next layout of `cycle` (the one after the layout it was typed in), pastes
 * it over the selection, selects it again (a second press goes on to the
 * next layout), switches the layout and puts the clipboard back. Signs
 * alone ("&&&&") go into the first layout that reads them otherwise; `now`,
 * the window's layout, says where signs both layouts have were typed. The
 * keyboard thread is told when it is done, and whether it is selected again,
 * so the fix key pressed meanwhile goes on with it.
 */
async function convertSelection(cycle: string[], now: string): Promise<void> {
  let selected = false
  try {
    // Nothing pasted (or a failure): the clipboard goes back at once.
    const done = await borrowClipboard(
      () => convertOver(cycle, now),
      result => (result?.pasted ? undefined : 0),
    )
    selected = done.selected
  } finally {
    keyboard.converted(selected)
  }
}

/** Copies the selection and pastes it converted: whether anything was pasted (the clipboard then goes back once it is read), and whether it is selected again. */
async function convertOver(cycle: string[], now: string): Promise<{ pasted: boolean; selected: boolean }> {
  const marker = `Kryakl ${Date.now()}`
  const field = focusedField()
  await clipGuard.write(marker)
  await pressCopy()
  let text = ''
  let copied = false
  const started = Date.now()
  for (let asked = false; !text && Date.now() < started + COPY_WAIT_MS; ) {
    await new Promise(resolve => setTimeout(resolve, 20))
    const now = await clipboard.readText()
    if (now !== marker) {
      text = now
      copied = true
    } else if (!asked && Date.now() >= started + UIA_WAIT_MS) {
      // A field that does not answer Ctrl+C: its selection through UI Automation.
      asked = true
      text = selectionIn(field)
    }
  }
  releaseField(field)
  // The copy Kryakl pressed is its own to take back.
  if (copied) clipGuard.claim()
  if (!text) {
    log(`convert: nothing copied in ${COPY_WAIT_MS} ms`)
    return { pasted: false, selected: false }
  }
  const layouts = cycle.map(id => ({ id, table: tableFor(id) })).filter((l): l is { id: string; table: KeyTable } => !!l.table)
  const from = sourceLayout(text, layouts, now)
  const fromTable = from ? tableFor(from) : undefined
  const to = /\p{L}/u.test(text)
    ? nextLayout(cycle, from)
    : layoutsAfter(cycle, from).find(id => {
        const table = tableFor(id)
        return !!fromTable && !!table && convertText(text, fromTable, table) !== text
      })
  const toTable = to ? tableFor(to) : undefined
  if (!fromTable || !toTable || !to || from === to) {
    log(`convert: ${[...text].length} chars, no other layout of ${cycle.join(', ')} reads them`)
    return { pasted: false, selected: false }
  }
  const converted = convertText(text, fromTable, toTable)
  await pasteText(converted)
  keyboard.switchTo(to)
  // Selected again, the cursor at its end; a line break is one step (\r\n too), unless it is long.
  const steps = [...converted.replace(/\r\n/g, '\n')].length
  if (steps > RESELECT_MOST) {
    log(`convert: ${steps} chars ${from} → ${to}, too long to select again`)
    return { pasted: true, selected: false }
  }
  await new Promise(resolve => setTimeout(resolve, 60))
  await pressSelectBack(steps)
  // Once the keyboard thread has seen those keys (another program's to it), it is told the selection is back.
  await new Promise(resolve => setTimeout(resolve, 150))
  log(`convert: ${steps} chars ${from} → ${to}, selected again`)
  return { pasted: true, selected: true }
}

/** Other layout switchers running now, for the settings' warning, and the other programs that watch the keyboard. */
function findRivals(): void {
  execFile(system32('tasklist.exe'), ['/fo', 'csv', '/nh'], { windowsHide: true }, (error, stdout) => {
    if (error) return
    const running = new Set(stdout.split(/\r?\n/).map(line => (line.split(',')[0] ?? '').replace(/"/g, '').toLowerCase()))
    const named = (list: Record<string, string>) => [
      ...new Set(
        Object.entries(list)
          .filter(([exe]) => running.has(exe))
          .map(([, name]) => name),
      ),
    ]
    const found = named(RIVALS)
    const apps = named(KEYBOARD_APPS)
    if (found.join() === rivals.join() && apps.join() === keyboardApps.join()) return
    rivals = found
    keyboardApps = apps
    postApp()
  })
}

// ---------------------------------------------------------------- a call

/** The call recording: started by its key, the tray or the Recordings page; pressed again, stopped and saved. */
export function toggleCall(): void {
  if (!capture) return
  if (capture.state === 'idle') void startCall()
  else if (capture.state !== 'stopping') void stopCall()
}

/** macOS' Screen & System Audio Recording, where Kryakl is let have the computer's sound. */
function openScreenSettings(): void {
  if (onMac) void shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
}

/**
 * macOS gives the computer's sound only with "Screen & System Audio Recording":
 * without it, Kryakl says why it wants it and opens that place; asked about
 * for the first time, macOS lists Kryakl there once something asks for the screen.
 */
async function screenAllowed(): Promise<boolean> {
  if (!onMac) return true
  const status = systemPreferences.getMediaAccessStatus('screen')
  if (status === 'granted') return true
  log(`call: the screen's permission is ${status}`)
  if (status === 'not-determined') await desktopCapturer.getSources({ types: ['screen'] }).catch(() => undefined)
  if (systemPreferences.getMediaAccessStatus('screen') === 'granted') return true
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: t('app.name'),
    message: t('call.screenAsk'),
    detail: t('call.screenDetail'),
    buttons: [t('call.openSettings'), t('common.cancel')],
    defaultId: 0,
    cancelId: 1,
  })
  if (response === 0) openScreenSettings()
  return false
}

/** The reminder that the others must agree to be recorded, once: before the first recording, or when recording by itself is turned on. */
async function consentOnce(): Promise<boolean> {
  if (settings.callConsentSeen) return true
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: t('app.name'),
    message: t('call.consentAsk'),
    detail: t('call.consentDetail'),
    buttons: [t('call.consentRecord'), t('common.cancel')],
    defaultId: 0,
    cancelId: 1,
  })
  if (response !== 0) return false
  saveSettings({ callConsentSeen: true })
  return true
}

/** Starts a call recording, once the others' consent was mentioned and the system lets Kryakl have the sound; named after the call program running, if one is. `auto`: started by itself for this call (callwatch.ts). */
export async function startCall(auto?: { app: string; title: string | null }): Promise<void> {
  if (!capture || capture.busy) return
  // No engine to record into: its page offers it.
  if (!speech?.installed) return openApp('recordings')
  if (!(await consentOnce())) return
  if (!(await screenAllowed())) return
  // Without the microphone the others are still recorded (the panel says so).
  if (onMac) await systemPreferences.askForMediaAccess('microphone').catch(() => false)
  const known = auto?.app ?? callApp(await runningProcessNames())
  capture.start(auto?.title ?? callTitle(known, new Date()), known ?? undefined, !!auto, settings.callShots)
}

// ---------------------------------------------------------------- a call that starts by itself

let callWatch = idleWatch()
let stopMicWatch: (() => void) | undefined

/** Watches the microphone while `callAuto` is on; turned on, the consent reminder (once) and, on a Mac, the screen's permission first. */
async function callAutoChanged(): Promise<void> {
  if (settings.callAuto !== 'off' && !(await consentOnce())) return saveSettings({ callAuto: 'off' })
  if (settings.callAuto !== 'off') await screenAllowed()
  applyCallAuto()
}

function applyCallAuto(): void {
  const want = settings.callAuto !== 'off' && (onMac || process.platform === 'win32')
  if (want && !stopMicWatch) {
    stopMicWatch = watchMic(onMac ? unpacked('vendor', 'mic-mac') : undefined, onMicUsers, log)
    log(`call watch: on (${settings.callAuto})`)
  } else if (!want && stopMicWatch) {
    stopMicWatch()
    stopMicWatch = undefined
    callWatch = idleWatch()
    log('call watch: off')
  }
}

function onMicUsers(users: MicUser[] | null): void {
  if (!capture) return
  const blocked = settings.paused || !speech?.installed || dictation?.state !== 'idle' || micRecording
  const [next, act] = stepCall(callWatch, { users, now: Date.now(), mode: settings.callAuto, blocked, recording: capture.busy, own: { pid: process.pid, exe: process.execPath } })
  callWatch = next
  callAct(act)
}

/** What the watch decided; only the program's name and numbers are logged, never a window's title. */
function callAct(act: CallAct): void {
  if (!capture || act.do === 'none') return
  log(`call watch: ${act.do}${'app' in act ? ` (${act.app})` : ''}`)
  if (act.do === 'start') void startCall({ app: act.app, title: act.title })
  else if (act.do === 'ask') capture.ask(act.app)
  else if (act.do === 'unask') capture.unask()
  else if (act.do === 'stop') {
    const seconds = capture.seconds
    if (keepRecording(seconds)) void stopCall()
    else {
      log(`call watch: ${seconds} s only, deleted`)
      void capture.discard()
    }
  }
}

/** Stops and saves the call: its transcript's id once the engine has it, null when there was none. */
export async function stopCall(): Promise<string | null> {
  const id = (await capture?.stop()) ?? null
  if (id) void summaryWhenDone(id)
  return id
}

// ---------------------------------------------------------------- a call's summary

/** Summaries being made, by transcript id (AppView.summaries): a failed one stays, with its error, until it is tried again. */
const summaries = new Map<string, { part: number; parts: number; started: number; error?: string }>()
const summaryAborts = new Map<string, AbortController>()
const SUMMARY_POLL_MS = 5000
/** A call's transcript is waited for this long (a very long recording on the processor). */
const SUMMARY_WAIT_MS = 6 * 3600_000

/**
 * Makes a transcript's summary with the person's local model and keeps it in the
 * engine (PUT /transcripts/{id}/summary); the page shows `summaries` meanwhile
 * and reads the summary back when the entry is gone. Nothing of the text is logged.
 */
async function makeSummary(id: string, o: { template: SummaryTemplate; own?: string; mine: boolean }): Promise<void> {
  if (!speech || (summaries.has(id) && !summaries.get(id)!.error)) return
  const abort = new AbortController()
  summaryAborts.set(id, abort)
  summaries.set(id, { part: 0, parts: 1, started: Date.now() })
  postApp()
  try {
    const got = await speech.call<{ transcript: CallTranscript | null }>('GET', `/transcripts/${encodeURIComponent(id)}`)
    if (!got.ok || !got.data.transcript) throw new Error('the transcript is not there')
    const input = summaryInput(got.data.transcript)
    if (!input.lines.length) throw new Error('the transcript has no words')
    // The text of the key screenshots and the person's own, as context for the model.
    const screen: ScreenText[] = []
    for (const shot of shownShots(got.data.transcript.shots).slice(0, SHOTS_READ_MAX)) {
      abort.signal.throwIfAborted()
      const lines = await shotLines(got.data.transcript, shot)
      if (lines.length) screen.push({ at: shot.at, text: lines.join('\n') })
    }
    if (screen.length) input.shots = screen
    const done = await summarizer.summarize(
      input,
      { template: o.template, own: o.own?.slice(0, SUMMARY_OWN_MAX), mine: o.mine, native: settings.native },
      p => {
        summaries.set(id, { ...p, started: summaries.get(id)?.started ?? Date.now() })
        postApp()
      },
      abort.signal,
    )
    const saved = await speech.call('PUT', `/transcripts/${encodeURIComponent(id)}/summary`, { summary: done })
    if (!saved.ok) throw new Error(saved.error)
    summaries.delete(id)
    log(`summary: made (${o.template}, ${input.lines.length} lines, ${screen.length} screenshots read)`)
  } catch (error) {
    if (abort.signal.aborted) summaries.delete(id)
    else {
      const why = error instanceof Error ? error.message : String(error)
      log(`summary: failed: ${why}`)
      summaries.set(id, { part: 0, parts: 1, started: Date.now(), error: why })
    }
  } finally {
    summaryAborts.delete(id)
    postApp()
  }
}

/** After a call is saved: its summary is made once the engine has transcribed it, when the person wants that and the model is here. */
async function summaryWhenDone(id: string): Promise<void> {
  const until = Date.now() + SUMMARY_WAIT_MS
  while (Date.now() < until && !quitting) {
    await new Promise(resolve => setTimeout(resolve, SUMMARY_POLL_MS))
    const got = await speech?.call<{ row: { status: string } }>('GET', `/transcripts/${encodeURIComponent(id)}`)
    if (!got?.ok) {
      // Gone (deleted) or the engine is down for good: nothing to wait for.
      if (got && got.status === 404) return
      continue
    }
    const status = got.data.row.status
    if (status === 'failed') return
    if (status !== 'done') continue
    await markShots(id)
    if (autoSummaryWanted(settings.callSummaryAuto, llmFiles.state(settings.model).status === 'ready'))
      void makeSummary(id, { template: settings.callTemplate, own: settings.callOwn, mine: settings.callSummaryMine })
    return
  }
}

// ---------------------------------------------------------------- a call's screenshots: key frames, their text, names as hints

/** A call's transcript as main reads it: for its summary and its screenshots (in the folder of its sound). */
type CallTranscript = SummarySource & { id: string; audioPath?: string; shots?: Shot[] }
/** Screenshots read at most in one pass (OCR: about a second each on a Mac, a few on Windows). */
const SHOTS_READ_MAX = 40
/** Screenshots read per speaker for a name. */
const NAME_SHOTS = 6
const SHOT_FILE = /^\d{1,9}(-m)?\.jpg$/
/** Each screenshot's lines, read once while Kryakl runs (a summary made again reads none again). Never logged. */
const shotTexts = new Map<string, string[]>()

async function shotLines(tr: CallTranscript, shot: Shot): Promise<string[]> {
  const key = `${tr.id}/${shot.file}`
  const known = shotTexts.get(key)
  if (known) return known
  let lines: string[] = []
  if (tr.audioPath && SHOT_FILE.test(shot.file)) {
    try {
      const result = await ocrRead(path.join(path.dirname(tr.audioPath), 'shots', shot.file))
      lines = pickLines(result.readings, ocrKnown()).map(l => l.text.trim()).filter(Boolean)
    } catch (error) {
      log(`shots: one could not be read: ${messageOf(error)}`)
    }
  }
  // ponytail: dropped whole past 500, an LRU when people make many summaries in one run
  if (shotTexts.size > 500) shotTexts.clear()
  shotTexts.set(key, lines)
  return lines
}

/**
 * After a call is transcribed: the screenshots of the moments a speaker points at the screen ("смотрите", "as you can
 * see") are marked key, and with `callNames` each other speaker gets a name read off the shots of their turns, as a
 * hint the page offers (never applied by itself). Only counts are logged.
 */
async function markShots(id: string): Promise<void> {
  try {
    const got = await speech?.call<{ transcript: CallTranscript | null }>('GET', `/transcripts/${encodeURIComponent(id)}`)
    const tr = got?.ok ? got.data.transcript : null
    if (!tr?.shots?.length) return
    const shots = tr.shots
    const keys = keyShots(shots, tr.utterances)
    let hints: Record<string, string> = {}
    if (settings.callNames) {
      const seen: Record<string, string[][]> = {}
      let read = 0
      for (const speaker of Object.keys(tr.speakers)) {
        if (speaker === 'me') continue
        const near = [...new Set(tr.utterances
          .filter((u, i) => u.speaker === speaker && tr.utterances[i - 1]?.speaker !== speaker)
          .map(u => shotAt(shots, u.start))
          .filter((s): s is Shot => !!s))]
        const step = Math.ceil(near.length / NAME_SHOTS)
        seen[speaker] = []
        for (const shot of near.filter((_, i) => i % step === 0)) if (read++ < SHOTS_READ_MAX) seen[speaker].push(await shotLines(tr, shot))
      }
      hints = speakerHints(seen)
    }
    const changes = {
      ...(keys.length ? { shots: Object.fromEntries(keys.map(file => [file, { key: true }])) } : {}),
      ...(Object.keys(hints).length ? { speakerHints: hints } : {}),
    }
    if (Object.keys(changes).length) {
      const saved = await speech.call('PATCH', `/transcripts/${encodeURIComponent(id)}`, changes)
      if (!saved.ok) throw new Error(saved.error)
    }
    log(`shots: ${keys.length} key of ${shots.length}, ${Object.keys(hints).length} speaker name hints`)
  } catch (error) {
    log(`shots: not marked: ${messageOf(error)}`)
  }
}

/** Quitting while a call is recorded asks first; stopped, it is saved before Kryakl goes. */
async function quitDuringCall(): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: t('app.name'),
    message: t('call.quitAsk'),
    buttons: [t('call.quitStop'), t('common.cancel')],
    defaultId: 0,
    cancelId: 1,
  })
  if (response !== 0) return
  callQuitAsked = true
  // Saved within half a minute, or Kryakl goes anyway: the engine closes a recording left open by itself.
  await Promise.race([stopCall(), new Promise(resolve => setTimeout(resolve, 30_000))])
  app.quit()
}

// ---------------------------------------------------------------- tray

function keyLabel(hotkey: string): string {
  return hotkeyLabel(hotkey)
}

/** What the tray's panel shows. */
function trayView(): TrayView {
  return {
    keys: {
      listenCopied: settings.selectKey,
      typeToTranslate: settings.typeKey,
      checkEnglish: settings.typeCheckKey,
      talk: settings.talkKey,
      snipListen: settings.snipKey,
      snipTranslate: settings.textKey,
      switch: settings.switchKey,
      call: settings.meetingKey,
    },
    autoFix: settings.autoFix,
    switchOn: settings.switchOn,
    layoutBadge: settings.layoutBadge,
    trayLayout: settings.trayLayout,
    paused: settings.paused,
    keep: {
      on: settings.autoFix || (!!settings.fixKey && settings.fixKeyOn),
      ...(lastAutoFix && !settings.keepWords.includes(lastAutoFix.word) ? lastAutoFix : { word: '', fixed: '' }),
    },
    speech: { installed: speech?.installed ?? false, recording: dictation?.state === 'recording', noteKey: settings.noteKey },
    call: capture?.busy ?? false,
    translator: activeTranslator().state(langCode(settings.native)).status,
    native: settings.native,
    version: app.getVersion(),
    build: buildText(),
    dev: !app.isPackaged,
  }
}

function refreshTray(): void {
  if (!tray) return
  tray.setToolTip(tooltip())
  void refreshTrayIcon()
  sendTrayView()
}

/** The tray's panel drawn again, the icon left as it is. */
function sendTrayView(): void {
  if (trayPanel && trayReady && !trayPanel.isDestroyed()) trayPanel.webContents.send('to-view', { type: 'tray', view: trayView() } satisfies ToView)
}

/** The middle of the tray icon; Windows gives no place for one kept among the hidden icons: the corner of the screen by them. */
function trayPoint(): { x: number; y: number } {
  const icon = tray?.getBounds()
  if (icon?.width) return { x: icon.x + icon.width / 2, y: icon.y + icon.height / 2 }
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea
  return { x: x + width, y: y + height }
}

/** Something records now: dictation listening (any of its keys), the microphone on the Transcribe page, or a call. */
function recordingNow(): boolean {
  return dictation?.state === 'recording' || micRecording || !!capture?.busy
}

/** The taskbar's theme, which the tray's icon follows (not the app's theme setting). */
const darkTaskbar = () => nativeTheme.shouldUseDarkColorsForSystemIntegratedUI

/**
 * The tray's icon: the red dot while anything records (over everything else);
 * else the layout in front on its keycap when the person wants that; else the
 * duck, faded while paused. All drawn for the taskbar's theme.
 */
async function refreshTrayIcon(): Promise<void> {
  if (recordingNow()) return tray?.setImage(trayIcon('recording'))
  const dark = darkTaskbar()
  const front = settings.trayLayout && !settings.paused ? frontLayout : undefined
  const icon = front ? await layoutIcon(keyboard.shortOf(front.layout).toLowerCase(), front.caps, dark) : undefined
  // The recording may have begun while the keycap was drawn.
  if (recordingNow()) return tray?.setImage(trayIcon('recording'))
  tray?.setImage(icon ?? trayIcon(`${dark ? 'dark' : 'light'}${settings.paused ? '-paused' : ''}`))
}

/**
 * Runs in the tray panel's page: a layout's short name ("en") on a keycap in
 * the tray duck's colours (scripts/icons.mjs), `size` pixels, as a PNG data
 * URL: the cap in the taskbar's ink, its lower edge in the duck's colour, the
 * letters (underlined with Caps Lock on) cut out of it, so the taskbar shows
 * through them as through Windows' own glyphs.
 */
function drawLayoutCap(size: number, text: string, caps: boolean, ink: string, duck: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d') as CanvasRenderingContext2D
  const s = size / 16
  // One rounded shape, so its corners have one edge: the duck's colour, the cap's ink over all but its lower edge.
  g.beginPath()
  g.roundRect(0, 0, 16 * s, 16 * s, 3.5 * s)
  g.clip()
  g.fillStyle = ink
  g.fillRect(0, 0, 16 * s, 14 * s)
  g.fillStyle = duck
  g.fillRect(0, 14 * s, 16 * s, 2 * s)
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = '#000'
  g.font = `800 ${size >= 32 ? 15 : 8}px "JetBrains Mono", monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text.slice(0, 2), 8 * s, 6.9 * s)
  if (caps) g.fillRect(4 * s, 10.5 * s, 8 * s, Math.max(1, s))
  return canvas.toDataURL('image/png')
}

/** The tray's ink and the dot's coral on a light and on a dark taskbar (scripts/icons.mjs `TASKBAR`). */
const TASKBAR_COLOURS = { light: ['#1b1b1b', '#FF5A36'], dark: ['#f2f2f2', '#FF7A5C'] } as const

const layoutIcons = new Map<string, Electron.NativeImage>()
async function layoutIcon(short: string, caps: boolean, dark: boolean): Promise<Electron.NativeImage | undefined> {
  const key = `${short}${caps ? '^' : ''}${dark ? ':dark' : ':light'}`
  const known = layoutIcons.get(key)
  if (known) return known
  if (!trayPanel || !trayReady || trayPanel.isDestroyed()) return undefined
  const [ink, duck] = TASKBAR_COLOURS[dark ? 'dark' : 'light']
  try {
    const draw = (size: number) =>
      trayPanel?.webContents.executeJavaScript(`(${drawLayoutCap.toString()})(${size}, ${JSON.stringify(short)}, ${caps}, ${JSON.stringify(ink)}, ${JSON.stringify(duck)})`) as Promise<string>
    const icon = nativeImage.createEmpty()
    icon.addRepresentation({ scaleFactor: 1, dataURL: await draw(16) })
    icon.addRepresentation({ scaleFactor: 2, dataURL: await draw(32) })
    layoutIcons.set(key, icon)
    return icon
  } catch (error) {
    console.warn('Tyts: could not draw the layout in the tray', error)
    return undefined
  }
}

function tooltip(): string {
  if (recordingNow()) return t('tray.tipRecording')
  if (settings.paused) return t('tray.tipPaused')
  const listen = settings.selectKey ? t('tray.tipListen', { keys: keyLabel(settings.selectKey) }) : ''
  const translate = settings.translateKey ? t('tray.tipTranslate', { key: keyLabel(settings.translateKey) }) : ''
  return [t('app.name'), listen, translate].filter(Boolean).join(' · ')
}

/** The tray's pictures (scripts/icons.mjs): the duck for a light or a dark taskbar, faded while paused, and the red dot while recording. */
type TrayPicture = 'light' | 'dark' | 'light-paused' | 'dark-paused' | 'recording'

/** Each picture, made once: media/tray-<picture>.png. */
const trayIcons = new Map<TrayPicture, Electron.NativeImage>()
function trayIcon(picture: TrayPicture): Electron.NativeImage {
  let icon = trayIcons.get(picture)
  if (!icon) {
    // The 16 px picture set pixel by pixel; Electron takes the @2x file beside it on a screen at 200 %.
    icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'media', `tray-${picture}.png`))
    trayIcons.set(picture, icon)
  }
  return icon
}

function createTray(): Tray {
  const t = new Tray(trayIcon(`${darkTaskbar() ? 'dark' : 'light'}${settings.paused ? '-paused' : ''}`))
  // Either button opens Kryakl's own panel: Windows' menu cannot take Kryakl's look.
  t.on('click', () => toggleTrayPanel())
  t.on('right-click', () => toggleTrayPanel())
  return t
}

/** The tray's panel: a window of Kryakl's own by the tray icon, made once and hidden between uses. */
function createTrayPanel(): BrowserWindow {
  const win = new BrowserWindow({
    width: TRAY_WIDTH,
    height: trayHeight,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: t('app.name'),
    backgroundColor: appColor(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false, // a hidden panel keeps painting, so its first show is not blank on a Mac
    },
  })
  frameWindow(win, { corner: 'round', border: borderColor() })
  win.setAlwaysOnTop(true, 'pop-up-menu')
  win.removeMenu()
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())
  logPageErrors(win, 'tray panel')
  if (!app.isPackaged) win.webContents.on('console-message', m => m.level !== 'error' && console.warn(`Kryakl tray panel: ${m.message} (${m.sourceId}:${m.lineNumber})`))
  // A click anywhere else puts it away, as a menu goes.
  win.on('blur', () => {
    if (Date.now() - trayShownAt > 200) hideTrayPanel()
  })
  win.on('closed', () => {
    trayPanel = undefined
    trayReady = false
  })
  void win.loadFile(path.join(app.getAppPath(), 'media', 'tray.html'), pageOptions())
  return win
}

function toggleTrayPanel(): void {
  if (trayPanel?.isVisible()) return hideTrayPanel()
  // The click on the icon took the focus from the open panel, which hid: that click only closes it.
  if (Date.now() - trayHiddenAt < TRAY_REOPEN_MS) return
  showTrayPanel()
}

function showTrayPanel(): void {
  if (!trayPanel || trayPanel.isDestroyed()) trayPanel = createTrayPanel()
  refreshTray()
  placeTrayPanel()
  trayShownAt = Date.now()
  if (process.platform === 'darwin') app.focus({ steal: true }) // an agent app's window is not drawn until the app is active
  trayPanel.show()
  trayPanel.focus()
  trayPanel.webContents.invalidate()
  if (trayReady) trayPanel.webContents.send('to-view', { type: 'trayShown' } satisfies ToView)
}

/** By the tray icon, as tall as its content. */
function placeTrayPanel(): void {
  if (!tray || !trayPanel || trayPanel.isDestroyed()) return
  const icon = tray.getBounds()
  trayPanel.setBounds(placeByTray(icon, { width: TRAY_WIDTH, height: trayHeight }, screen.getDisplayMatching(icon).workArea))
}

function hideTrayPanel(): void {
  if (!trayPanel || trayPanel.isDestroyed() || !trayPanel.isVisible()) return
  trayHiddenAt = Date.now()
  trayPanel.hide()
}

/** An empty translator or checker by the pointer, to type into (the tray's rows, their keys); nothing to paste back into. */
function typeInto(kind: 'translate' | 'check', via?: string): void {
  warmModel(kind)
  if (kind === 'translate') translateWindow('', screen.getCursorScreenPoint(), undefined, via)
  else checkWindow('', screen.getCursorScreenPoint(), undefined, via)
}

function runTrayCommand(command: TrayCommand): void {
  switch (command) {
    case 'listenCopied':
      afterSettling(() => useClipboard('listen'))
      return
    case 'translateCopied':
      afterSettling(() => useClipboard('translate'))
      return
    case 'typeToTranslate':
      typeInto('translate')
      return
    case 'checkEnglish':
      typeInto('check')
      return
    case 'talk':
      openTalk()
      return
    case 'listenScreen':
      snip('listen')
      return
    case 'translateScreen':
      snip('translate')
      return
    case 'note':
      // A note, not typing: the panel took the focus, so there is no cursor to type at.
      dictation.press('note', settings.noteKey)
      return
    case 'call':
      toggleCall()
      return
    case 'transcripts':
      openApp('transcripts')
      return
    case 'vocabulary':
      openApp('vocabulary')
      return
    case 'kept':
      openApp('kept')
      return
    case 'settings':
      openApp('settings')
      return
    case 'report':
      openApp('report')
      return
    case 'open':
      openApp()
      return
    case 'quit':
      app.quit()
      return
  }
}

/**
 * For a mouse button or a launcher: `Kryakl --clipboard` listens to the
 * copied text and `--translate` translates it; `--snip` snips to listen,
 * `--text` to translate. True when the arguments held one.
 */
function runCommand(argv: readonly string[]): boolean {
  if (argv.includes('--clipboard')) {
    afterSettling(() => useClipboard('listen'))
    return true
  }
  if (argv.includes('--translate')) {
    afterSettling(() => useClipboard('translate'))
    return true
  }
  if (argv.includes('--snip')) {
    snip()
    return true
  }
  if (argv.includes('--text')) {
    snip('translate')
    return true
  }
  // Started again by Move to Kryakl: back on the Storage page, measured anew.
  if (argv.includes('--storage')) {
    openApp('storage')
    return true
  }
  return false
}

// ---------------------------------------------------------------- start

// ---------------------------------------------------------------- the speech engine

/** Types a text in the program in front, through the clipboard, which is put back as it was. */
async function typeText(text: string): Promise<void> {
  await keysLetGo()
  await borrowClipboard(() => pasteText(text))
}

function balloon(title: string, content: string, click?: () => void): void {
  balloonClick = click
  tray?.displayBalloon({ title, content })
}

function setUpSpeechEngine(): void {
  // A move whose repair failed (0.15.0) left the Python's link on the old folder: set right before the engine starts.
  const healed = healSpeech(localPart('speech'), (message, error) => console.warn(message, error))
  if (healed.length) log(`speech: the Python's link pointed at its own folder again (${healed.join(', ')})`)
  speech = new SpeechHost({
    root: localPart('speech'),
    userDir: userDir(),
    engineDir: unpacked('engine'),
    sharedCache: sharedUvCache(),
    port: speechPort,
    open: url => openStream(url),
    ...(TEST_HOME ? { testHome: TEST_HOME } : {}),
    settings: () => settings,
    onChange: () => {
      postApp()
      refreshTray()
    },
  })
  dictation = new Dictation({
    page: path.join(app.getAppPath(), 'media', 'dictation.html'),
    query: pageQuery,
    preload: path.join(__dirname, 'preload.js'),
    speech,
    paste: typeText,
    toEnglish: async (text, from) => {
      const job = translationJob([from])
      const english = await translatePlain(text, from, 'en', job.translate, job.t.direct)
      const busy = job.busy()
      return { text: english, ...(busy ? { note: t(busy === 'card' ? 'dict.fastCard' : 'dict.fastProcessor') } : {}) }
    },
    edit: editPhrase,
    editing: () => settings.dictateEdit,
    warm: () => {
      if (settings.dictateEdit && llmFiles.state(settings.model).status === 'ready') warmWhole(settings.model)
    },
    check: practice,
    expected: () => myLanguages(settings),
    languageOf: text => languageOf(text, settings.native, languageWords(), myLanguages(settings)),
    balloon,
    needsEngine: () => openApp('voice'),
    report: () => openApp('report'),
    openTranscript,
    onChange: () => {
      keyboard?.dictating(dictation.state !== 'idle')
      refreshTray()
    },
    log: dictationLog,
    logged: () => postApp(),
    panel: () => settings.dictationPanel,
    hold: () => settings.dictateHold,
    trayPoint,
    offset: () => settings.dictationBadge,
    moved: offset => saveSettings({ dictationBadge: offset }),
  })
  // The app window plays a transcript's sound from the engine in an <audio>, which sends no header of its own:
  // main adds the engine's key to that window's requests to the engine, and to no other window's.
  // Any port: the engine moves to the next free one when its own is taken (speechservice.ts freePort).
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['http://127.0.0.1:*/*'] }, (details, done) => {
    const fromApp = !!appWin && !appWin.isDestroyed() && details.webContentsId === appWin.webContents.id
      && new URL(details.url).port === String(speech.port)
    const key = fromApp ? speech.token : undefined
    done({ requestHeaders: key ? { ...details.requestHeaders, 'X-Tyts-Token': key } : details.requestHeaders })
  })
  speech.start()
  // Windows is asked about the cards and the battery once Kryakl is up: it takes a second or two.
  setTimeout(() => void speech.probe().catch(error => console.warn('Tyts: could not look at this computer', error)), 4000)
}

/** The formats a transcript is saved in (the engine's export.FORMATS). */
const EXPORT_FORMATS = new Set(['txt', 'md', 'srt', 'vtt', 'docx', 'json'])

const isDirectory = (p: string) => fs.statSync(p).isDirectory()

/** Makes `p` when it is one of Kryakl's own folders (its settings, its downloads, the transcripts') and not there yet. */
function makeOwnFolder(p: unknown): void {
  if (typeof p !== 'string' || fs.existsSync(p)) return
  const same = (a: string) => path.win32.resolve(a).toLowerCase() === path.win32.resolve(p).toLowerCase()
  const own = [userDir(), localDir(), speech?.service.health?.dataDir].filter((f): f is string => !!f)
  if (!own.some(same)) return
  try {
    fs.mkdirSync(p, { recursive: true })
  } catch (e) {
    log(`openPath: could not make ${p}: ${String(e)}`)
  }
}

/** A page's request with an answer: the speech engine's API, a folder to pick, a transcript to save. */
async function hostCall(request: HostCall): Promise<unknown> {
  switch (request.call) {
    case 'speech': {
      // The engine's refusals in the interface's language (i18n/engine.ts); its data as it is.
      const answer = await speech.call(request.method, request.route, request.body)
      return answer.ok || !answer.error ? answer : { ...answer, error: engineMessage(answer.error) }
    }
    case 'pickFolder': {
      const options: Electron.OpenDialogOptions = { title: request.title, defaultPath: request.current || app.getPath('documents'), properties: ['openDirectory', 'createDirectory'] }
      const { canceled, filePaths } = appWin ? await dialog.showOpenDialog(appWin, options) : await dialog.showOpenDialog(options)
      return canceled ? null : (filePaths[0] ?? null)
    }
    case 'exportTranscript': {
      if (!EXPORT_FORMATS.has(request.format)) throw new Error(`Cannot save as ${request.format}`)
      const safe = request.name.replace(/[<>:"/\\|?*\x00-\x1f]+/g, ' ').trim() || 'Transcript'
      const options: Electron.SaveDialogOptions = {
        title: t('main.saveTranscript'),
        defaultPath: path.join(app.getPath('documents'), `${safe}.${request.format}`),
        filters: [{ name: request.format.toUpperCase(), extensions: [request.format] }],
      }
      const { canceled, filePath } = appWin ? await dialog.showSaveDialog(appWin, options) : await dialog.showSaveDialog(options)
      if (canceled || !filePath) return null
      // The engine gives the bytes; Kryakl writes them where the person chose (the engine writes no file a caller names).
      fs.writeFileSync(filePath, await speech.bytes(`/transcripts/${encodeURIComponent(request.id)}/file?format=${request.format}`))
      return filePath
    }
    case 'copy':
      await clipboard.writeText(request.text)
      return null
    case 'runningApps':
      return windowedApps().filter(exe => exe !== path.win32.basename(process.execPath).toLowerCase())
    case 'askCalls': {
      const question = request.question.trim().slice(0, 500)
      if (!speech || !question) return { text: '', sources: [] }
      if (llmFiles.state(settings.model).status !== 'ready') throw new Error('needModel')
      const found = await speech.call<Passage[]>('GET', `/ask?q=${encodeURIComponent(question)}`)
      if (!found.ok) throw new Error(found.error)
      if (!found.data.length) return { text: '', sources: [] }
      const answer = await asker.ask(question, found.data)
      log(`ask: answered from ${found.data.length} passages`)
      return answer
    }
  }
}

function start(): void {
  const running = oldAppRunning()
  if (running) {
    dialog.showMessageBoxSync({ type: 'info', title: 'Kryakl', message: `${running} is still running`, detail: `Kryakl is ${running}'s new name. Quit ${running} from its tray menu, then start Kryakl: it takes over your settings, words and downloads.` })
    app.quit()
    return
  }
  const adopted = adoptOldFolder()
  // tyts.log beside the settings: the warnings, and what the windows did.
  logTo(userDir())
  const warn = console.warn.bind(console)
  console.warn = (...parts: unknown[]) => {
    warn(...parts)
    log(`warn: ${parts.map(p => (p instanceof Error ? (p.stack ?? p.message) : String(p))).join(' ')}`)
  }
  // What broke where nobody saw it, for a report (report.ts); watched only, so Electron handles each as it did.
  process.on('uncaughtExceptionMonitor', (error, origin) => log(`error (${origin}): ${error?.stack ?? String(error)}`))
  process.on('warning', w => log(`warning: ${w.name}: ${w.message}`))
  app.on('render-process-gone', (_event, contents, details) => log(`a page's process is gone (${pageOf(contents.getURL())}): ${details.reason}, exit ${details.exitCode}`))
  app.on('child-process-gone', (_event, details) => log(`${details.type}${details.name ? ` (${details.name})` : ''} process is gone: ${details.reason}, exit ${details.exitCode}`))
  log(`start: Kryakl ${app.getVersion()}, Electron ${process.versions.electron}, ${onMac ? 'macOS' : 'Windows'} ${process.getSystemVersion()}${TEST_HOME ? ', test home' : ''}`)
  // Everything downloaded in one folder (moveLocalFolder): what 0.10.0 and before kept in %APPDATA% moves over too.
  logMoved(adopted)
  const firstRun = !fs.existsSync(settingsFile())
  settings = readSettings()
  setUiLanguage(settings.uiLanguage)
  if (settings.uiLanguage !== 'en') rememberUiLanguage()
  // Only a fresh install sees the setup; a settings file from before it counts as set up (the default).
  if (firstRun) saveSettings({ setupDone: false })
  applyTheme()
  // Windows' own light or dark, switched while Kryakl runs (the theme "system"), repaints the windows' ground and edge, and the tray's icon for the taskbar.
  nativeTheme.on('updated', () => {
    applyColors()
    refreshTray()
  })
  applyLoginItem()
  setUpSpeech()
  words = new WordStore(path.join(userDir(), 'words.json'))
  dictationLog = new DictationLog(path.join(userDir(), 'dictation.json'))
  translationLog = new TranslationLog(path.join(userDir(), 'translations.json'))
  learned = new LearnStore(path.join(userDir(), 'learning.json'))
  translator = createTranslator(downloads('models'), unpacked('dist', 'mt-worker.js'), {
    loader: unpacked('vendor', 'bergamot', 'bergamot-translator.js'),
    wasm: unpacked('vendor', 'bergamot', 'bergamot.wasm'),
  })
  llmFiles = createLlmFiles({
    root: localPart('translate'),
    // One server for translating and checking: one model on the card at a time, the same for both.
    server: new LlamaServer({ log: path.join(userDir(), 'translate.log') }),
    // A model that does not fit an NVIDIA card goes to llama.cpp's CUDA build, far quicker there than Vulkan.
    engineFor: model => (translationAdvice(speech?.profile)[model].cuda ? 'cuda' : 'vulkan'),
  })
  llm = createLlmTranslators({ files: llmFiles, onTimed: modelTimed })
  setInterval(watchModel, FULL_SCREEN_LOOK_MS)
  checker = createChecker({ files: llmFiles, model: () => settings.model, onTimed: modelTimed })
  summarizer = createSummarizer({ files: llmFiles, model: () => settings.model })
  asker = createAsker({ files: llmFiles, model: () => settings.model })
  editor = createEditor({ files: llmFiles, model: () => settings.model })
  mistakes = new MistakeStore(path.join(userDir(), 'mistakes.json'))
  // Talk: the same model checks each line and the duck answers it (talk.ts, duck.ts).
  duck = createDuck({ files: llmFiles, model: () => settings.model, onTimed: modelTimed })
  // The talk going on survives a restart; New talk puts it away in the talk window's history.
  talks = new TalkStore(path.join(userDir(), 'talks.json'))
  talk = new Talk({
    check: text => checker.check(text, langCode(settings.native)),
    reply: (turns, topic, signal) => duck.reply(turns, { native: langCode(settings.native), level: settings.talkLevel, about: settings.talkAbout }, topic, signal),
    mistake: (text, corrected, note) => void (mistakes.add({ text, corrected, note }) && postApp()),
    onChange: () => {
      const now = talk.state()
      talks.keep(now.topic, now.turns)
      postApp()
    },
    log,
  })
  const kept = talks.current()
  if (kept) talk.restore(kept)
  modelSpeeds = loadModelSpeeds(deviceFile())
  tray = createTray()
  tray.on('balloon-click', () => balloonClick?.())
  setUpSpeechEngine()
  // Made now, so the first click on the tray icon opens it at once.
  trayPanel = createTrayPanel()
  refreshTray()
  registerShortcuts()
  keyboard = new KeyboardHelper(unpacked('dist', 'kbd-worker.js'), path.join(app.getAppPath(), 'media', 'layout'), unpacked('media'), {
    keep: word => {
      learned.kept(word)
      saveSettings({ keepWords: [...settings.keepWords, word] })
    },
    // The tray's "Keep a word as typed…" offers the last one (only from a field not known to be a password).
    autoFixed: (word, fixed) => {
      lastAutoFix = { word, fixed }
      sendTrayView()
    },
    // A word fixed by hand twice is fixed by itself from then on, and kept as typed no more.
    // tyts.log says each step, never the word.
    fixedByHand: word => {
      const kept = settings.keepWords.includes(word.word)
      const already = learned.alwaysFix.some(l => l.word === word.word && l.lang === word.lang)
      if (!learned.fixedByHand(word)) {
        log(`learn: a word fixed by hand ${already ? 'is fixed by itself already' : `noted, once more and it is fixed by itself${kept ? ' (it is kept as typed until then)' : ''}`}`)
        return
      }
      log(`learn: a word fixed by hand twice is fixed by itself from now on${kept ? ', kept as typed no more' : ''}`)
      if (kept) saveSettings({ keepWords: settings.keepWords.filter(w => w !== word.word) })
      else applyKeyboard()
      postApp()
    },
    tally: (hash, count, word) => {
      if (!learned.tally(hash, count, word)) return
      applyKeyboard()
      postApp()
    },
    unlearn: word => {
      if (!learned.unlearn(word)) return
      log('learn: forgot a learned fix that made no word of a word')
      applyKeyboard()
      postApp()
    },
    notLearned: why =>
      log(why === 'field' ? 'learn: a word fixed by hand, not learned: the field said it is a password, or would not say' : 'learn: a word fixed by hand, not learned: it made no word of a word'),
    selection: (cycle, layout) => void convertSelection(cycle, layout).catch(error => console.warn('Tyts: could not convert the selection', error)),
    hotkey: action => {
      if (action === 'pause') return togglePause()
      // Paused, the thread keeps the pause key alone; a key on its way meanwhile does nothing.
      if (settings.paused) return
      if (action === 'dictate') dictation.press('type', settings.dictateKey)
      else if (action === 'english') dictation.press('english', settings.englishKey)
      else if (action === 'note') dictation.press('note', settings.noteKey)
      else if (action === 'again') dictation.typeAgain()
      else if (action === 'practice') dictation.press('check', settings.practiceKey)
      else if (action === 'talk') talkPressed()
      else if (action === 'meeting') toggleCall()
      else if (action === 'select') selection('listen', settings.selectKey)
      else if (action === 'translate') selection('translate', settings.translateKey)
      else if (action === 'inPlace') selection('inPlace', settings.inPlaceKey)
      else if (action === 'check') selection('check', settings.checkKey)
      else if (action === 'type') typeInto('translate', settings.typeKey)
      else if (action === 'typeCheck') typeInto('check', settings.typeCheckKey)
      else if (action === 'text') snip('translate', settings.textKey)
      else if (action === 'window') openApp()
      else if (action === 'menu') menuPressed()
      else snip('listen', settings.snipKey)
    },
    hotkeyUp: () => dictation.release(),
    app: (exe, elevated) => {
      lastApp = exe
      if (elevated) elevatedApp = exe
      postApp()
    },
    layout: (layout, caps) => {
      if (!settings.trayLayout) return
      frontLayout = { layout, caps }
      void refreshTrayIcon()
    },
    foreignKeys: () => {
      foreignKeys = true
      findRivals()
      postApp()
    },
    // A key field of the app window waits for a key: the hook's keys go to it (Ctrl+Esc, Shift+Caps Lock, Alt never reach its page).
    recorded: (code, down, at) => {
      if (appWin && appReady && !appWin.isDestroyed()) appWin.webContents.send('to-view', { type: 'keyEvent', code, down, at } satisfies ToView)
    },
    menuKey: code => oneKeyMenu?.key(code),
    menuClosed: () => oneKeyMenu?.closed(),
    failed: message => {
      keyboardTrouble = message
      // 'macAccess' (kbdmac-worker.ts) until Accessibility is given; '' once the thread sees keys.
      const unseen = message === 'macAccess' || message === 'macInput'
      if (unseen) macTrouble = message
      if (unseen !== keysUnseen) {
        keysUnseen = !keysUnseen
        registerShortcuts()
      }
      console.warn(`Tyts keyboard: ${message}`)
      postApp()
    },
  })
  capture = new CallCapture({
    page: path.join(app.getAppPath(), 'media', 'capture.html'),
    preload: path.join(__dirname, 'preload.js'),
    query: pageQuery,
    offset: () => settings.callPanelOffset,
    moved: offset => saveSettings({ callPanelOffset: offset }),
    onChange: () => {
      refreshTray()
      postApp()
    },
    finish: id => speech.call('POST', `/recordings/${id}/finish`, {}),
    openSettings: openScreenSettings,
    answered: record => {
      const [next, act] = answerCall(callWatch, record, Date.now())
      callWatch = next
      callAct(act)
    },
    log,
  })
  capture.allowCapture(session.defaultSession)
  // On at start (a setting from before, or a backup): the reminder and the screen's permission come now, not in the middle of a call.
  void callAutoChanged()
  // Asleep, the computer's sound and the microphone stop: what was recorded is saved now.
  powerMonitor.on('suspend', () => {
    if (capture?.busy) void stopCall()
  })
  oneKeyMenu = new TytsMenu({
    page: path.join(app.getAppPath(), 'media', 'menu.html'),
    preload: path.join(__dirname, 'preload.js'),
    query: pageQuery,
    background: cardColor,
    border: borderColor,
    groups: () => menuGroups(settings.uiLanguage, !!speech?.installed),
    caret: () => {
      const front = foreground()
      return front.tid ? caretOf(front.tid) : undefined
    },
    keys: (on, codes, rect) => keyboard.menu(on, codes, rect),
    run: runMenu,
    log: win => logPageErrors(win, 'menu'),
  })
  applyKeyboard()
  card = createCard()
  // Each page only what it does (bridge.ts): a page that shows text from outside never opens, removes or exports.
  ipcMain.on('to-host', (event, message: ToHost) => {
    const page = pageOf(event.sender.getURL())
    if (messageAllowed(page, message?.type) && (message.type !== 'saveSettings' || patchAllowed(page, message.patch))) onMessage(message, page)
    else log(`bridge: ${page} may not send ${String(message?.type)}`)
  })
  ipcMain.handle('host-call', (event, request: HostCall) => {
    const page = pageOf(event.sender.getURL())
    if (callAllowed(page, request)) return hostCall(request)
    log(`bridge: ${page} may not call ${String(request?.call)}`)
    throw new Error('Not allowed from this window')
  })
  // The card's window owns Kryakl's pasted text: handed over when the paste's program reads it.
  const stopRendering = watchRendering(
    card,
    () => {
      const { reader, front } = clipboardReaders()
      if (clipGuard.read(reader, front)) renderClipboardText()
    },
    renderAllClipboardText,
  )
  stopWatching = stopRendering
  try {
    const stopChanges = watchClipboard(card, onClipboardChange, onMac ? unpacked('vendor', 'clip-mac') : undefined)
    stopWatching = () => {
      stopChanges()
      stopRendering()
    }
  } catch (error) {
    tray.displayBalloon({ title: t('app.name'), content: t('main.copyTwiceOff', { why: messageOf(error) }) })
  }
  void sendHostVoices()
  // The first start opens the window on "How to use".
  if (firstRun) openApp('home')
  runCommand(process.argv)
}

if (!theOnlyOne) {
  app.quit()
} else {
  // The card reads aloud as soon as a translation is in, before anyone touches it.
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
  // macOS 13+ gives a screen capture the computer's sound (ScreenCaptureKit) only with these: a call's recording takes it.
  if (process.platform === 'darwin') app.commandLine.appendSwitch('enable-features', 'MacLoopbackAudioForScreenShare,MacSckSystemAudioLoopbackOverride')
  app.setAppUserModelId('com.designmakc.tyts')
  // Started again, without a command: the window opens.
  app.on('second-instance', (_event, argv) => {
    if (!runCommand(argv)) openApp()
  })
  app.on('before-quit', event => {
    // A call being recorded: asked first, and saved before Kryakl goes.
    if (capture?.busy && !callQuitAsked) {
      event.preventDefault()
      void quitDuringCall()
      return
    }
    quitting = true
    // Quitting within a paste's moment: what the person had goes back now, while the card's window can still own the clipboard.
    clipGuard.flush()
  })
  // The card is hidden, never closed: Kryakl keeps running in the tray.
  app.on('window-all-closed', () => undefined)
  // Each part is put away on its own: one that fails must not keep the app from quitting.
  app.on('will-quit', () => {
    const steps: [string, () => void][] = [
      ['shortcuts', () => globalShortcut.unregisterAll()],
      ['speech', () => speech?.dispose()],
      ['dictation', () => dictation?.dispose()],
      ['call', () => (stopMicWatch?.(), capture?.dispose())],
      ['clipboard', () => stopWatching?.()],
      ['voice', () => natural?.dispose()],
      ['translator', () => translator?.dispose()],
      ['translation models', () => llmFiles?.dispose()],
      ['keyboard', () => keyboard?.dispose()],
      ['learning', () => learned?.flush()],
      ['talks', () => talks?.flush()],
    ]
    for (const [name, step] of steps) {
      try {
        step()
      } catch (error) {
        console.warn(`Tyts: could not put away the ${name}`, error)
      }
    }
  })
  void app.whenReady().then(start)
}
