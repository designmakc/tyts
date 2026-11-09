// What each of Kryakl's pages may ask the main process for. Every page shares one
// preload (window.tutorHost), so main asks who sent a message before acting on
// it: the card, the tray panel, the dictation badge and the talk window show
// text from outside (a copied text, the screen, a model's answer); were one of
// them ever made to run a script, it still could not install, remove, open or
// export anything, nor reach the speech engine beyond dictating.

import * as path from 'node:path'

import type { HostCall, ToHost } from './protocol'

export type Page = 'app' | 'calls' | 'edge' | 'card' | 'tray' | 'dictation' | 'talk' | 'menu' | 'capture' | 'other'

const PAGES: Record<string, Page> = { 'app.html': 'app', 'calls.html': 'calls', 'edge.html': 'edge', 'card.html': 'card', 'tray.html': 'tray', 'dictation.html': 'dictation', 'talk.html': 'talk', 'menu.html': 'menu', 'capture.html': 'capture' }

/** The page a window shows, by its file (media/<page>.html, with or without a query); 'other' for anything else. */
export function pageOf(url: string): Page {
  try {
    const u = new URL(url)
    return u.protocol === 'file:' ? (PAGES[path.posix.basename(u.pathname)] ?? 'other') : 'other'
  } catch {
    return 'other'
  }
}

/** The calls window is the app window's Transcripts page in a window of its own: it may do what the app window does. */
const full = (page: Page) => page === 'app' || page === 'calls'

/** Messages only the app window sends: they install, remove, reset, open or export. */
const APP_ONLY: ReadonlySet<ToHost['type']> = new Set<ToHost['type']>([
  'clearDictation',
  'clearTranslations',
  'forgetPhrase',
  'fixPhrase',
  'forgetTranslation',
  'clearMistakes',
  'forgetMistake',
  'unlearn',
  'forgetLearned',
  'clipPin',
  'clipForget',
  'clipsClear',
  'exportBackup',
  'importBackup',
  'resetSettings',
  'resetKeys',
  'installSpeech',
  'prepareTranslator',
  'prepareDictionary',
  'translationLevel',
  'useModel',
  'useRecommended',
  'testSpeech',
  'downloadSpeechModel',
  'moveToTyts',
  'removeStored',
  'cleanUp',
  'restartSpeech',
  'showInFolder',
  'openPath',
  'removeWord',
  'exportWords',
  'copyWords',
  'openLink',
  'micRecording',
  'talkOpen',
  'toggleCall',
  'summarize',
  'cancelSummary',
  'reportProblem',
  'openLogs',
  // The keyboard thread keeps every key from Windows while a key field waits: only the settings may ask.
  'recordKeys',
])

/** Messages only the talk window sends: the talk itself, its history and its own window. */
const TALK_ONLY: ReadonlySet<ToHost['type']> = new Set<ToHost['type']>([
  'talkStart',
  'talkSay',
  'talkInterrupt',
  'talkClear',
  'talkListen',
  'talkReady',
  'talkPin',
  'talkWindow',
  'talkContinue',
  'talkDelete',
  'talksClear',
])

/** Messages only the menu on one key sends, and the only ones it may: it is drawn over any program, so it asks for nothing but its own items. */
const MENU_ONLY: ReadonlySet<ToHost['type']> = new Set<ToHost['type']>(['menuReady', 'menuHeight', 'menuHover', 'menuPick'])

/** Messages only the panel at the top of the screen sends; it may also run the tray's commands and save its switches, nothing else. */
const EDGE_ONLY: ReadonlySet<ToHost['type']> = new Set<ToHost['type']>(['edgeReady', 'edgeHeight', 'edgeAct'])

/** Messages only the call recording's panel sends, and the only ones it may: how its recording goes. */
const CAPTURE_ONLY: ReadonlySet<ToHost['type']> = new Set<ToHost['type']>(['captureState', 'captureDone', 'captureHide', 'captureOpenSettings', 'captureAnswer', 'captureCopyPhrase', 'captureExpand'])

export function messageAllowed(page: Page, type: string): boolean {
  if (page === 'other') return false
  if (MENU_ONLY.has(type as ToHost['type'])) return page === 'menu'
  if (page === 'menu') return false
  if (CAPTURE_ONLY.has(type as ToHost['type'])) return page === 'capture'
  if (page === 'capture') return false
  if (EDGE_ONLY.has(type as ToHost['type'])) return page === 'edge'
  if (page === 'edge') return type === 'tray' || type === 'saveSettings'
  if (TALK_ONLY.has(type as ToHost['type'])) return page === 'talk'
  // The talk window listens too: the tray shows the red dot meanwhile.
  if (type === 'micRecording') return full(page) || page === 'talk'
  return full(page) || !APP_ONLY.has(type as ToHost['type'])
}

/** The settings a page other than the app window may change: the card its reading mode, the tray panel its switches. */
const PAGE_SETTINGS: Partial<Record<Page, ReadonlySet<string>>> = {
  card: new Set(['oneAtATime']),
  tray: new Set(['autoFix', 'switchOn', 'layoutBadge', 'trayLayout', 'paused']),
  edge: new Set(['autoFix', 'switchOn', 'layoutBadge', 'paused']),
}

/** Whether `page` may save this settings patch: the app window any, the card and the tray panel only their own. */
export function patchAllowed(page: Page, patch: unknown): boolean {
  if (full(page)) return true
  const own = PAGE_SETTINGS[page]
  return !!own && !!patch && typeof patch === 'object' && Object.keys(patch).every(key => own.has(key))
}

/** The path a route reaches, as fetch resolves it from the engine's address (%2e%2e and \ are .. and / there). */
function reached(route: string): string {
  try {
    return new URL(`http://127.0.0.1${route}`).pathname
  } catch {
    return ''
  }
}

/** The dictation badge dictates and records a note; the call panel only records; the app window does everything; the others call nothing. */
export function callAllowed(page: Page, request: HostCall): boolean {
  if (full(page)) return true
  const dictating = /^\/(dictate|recordings)([/?]|$)/
  if (page === 'dictation') return request.call === 'speech' && dictating.test(request.route) && dictating.test(reached(request.route))
  const recording = /^\/recordings([/?]|$)/
  if (page === 'capture') return request.call === 'speech' && recording.test(request.route) && recording.test(reached(request.route))
  const hearing = /^\/dictate([/?]|$)/
  if (page === 'talk') return request.call === 'speech' && hearing.test(request.route) && hearing.test(reached(request.route))
  return false
}

/** Files the system may open from a page: notes and text; never a program, a script or a shortcut. */
const OPENABLE = new Set(['.md', '.txt'])

/**
 * Whether `p` may go to the system's "open" (ShellExecute runs .exe, .bat, .lnk and opens URLs): an
 * absolute path to a folder, or to a note or text file.
 */
export function openable(p: unknown, isDirectory: (p: string) => boolean): p is string {
  if (typeof p !== 'string' || !p || !path.win32.isAbsolute(p) || /^\\\\[?.]\\/.test(p) || /^[a-z][a-z0-9+.-]+:(?![\\/])/i.test(p)) return false
  if (OPENABLE.has(path.win32.extname(p).toLowerCase())) return true
  try {
    return isDirectory(p)
  } catch {
    return false
  }
}
