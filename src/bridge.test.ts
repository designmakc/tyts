import { describe, expect, test } from 'vitest'

import { callAllowed, messageAllowed, openable, pageOf, patchAllowed } from './bridge'

const at = (page: string) => `file:///C:/Users/you/AppData/Local/Programs/kryakl/resources/app.asar/media/${page}?frame=dwm`

describe('which page sent a message', () => {
  test('each of Kryakl\'s pages by its file; anything else is another', () => {
    expect([pageOf(at('app.html')), pageOf(at('card.html')), pageOf(at('tray.html')), pageOf(at('dictation.html')), pageOf(at('talk.html'))]).toEqual(['app', 'card', 'tray', 'dictation', 'talk'])
    expect(pageOf(at('badge.html'))).toBe('other')
    expect(pageOf('https://evil.example/app.html')).toBe('other')
    expect(pageOf('')).toBe('other')
  })
})

describe('a page that shows text from outside opens, removes and exports nothing', () => {
  const dangerous = ['openPath', 'showInFolder', 'openLink', 'installSpeech', 'removeStored', 'cleanUp', 'useRecommended', 'moveToTyts', 'importBackup', 'exportBackup', 'resetSettings', 'restartSpeech', 'reportProblem', 'openLogs', 'recordKeys']
  test.each(['card', 'tray', 'dictation', 'talk'] as const)('the %s', page => {
    for (const type of dangerous) expect(messageAllowed(page, type), type).toBe(false)
  })
  test('the app window may', () => {
    for (const type of dangerous) expect(messageAllowed('app', type), type).toBe(true)
  })
  test('the panel at the top of the screen runs the tray\'s commands and its own, saves its switches, and nothing else', () => {
    expect(pageOf(at('edge.html'))).toBe('edge')
    for (const type of ['edgeReady', 'edgeHeight', 'edgeAct', 'tray', 'saveSettings']) expect(messageAllowed('edge', type), type).toBe(true)
    for (const type of [...dangerous, 'summarize', 'speak', 'talkSay', 'copyText', 'pasteText']) expect(messageAllowed('edge', type), type).toBe(false)
    for (const page of ['app', 'card', 'tray', 'talk'] as const) expect(messageAllowed(page, 'edgeAct'), page).toBe(false)
    expect(patchAllowed('edge', { autoFix: false })).toBe(true)
    expect(patchAllowed('edge', { native: 'German' })).toBe(false)
    expect(callAllowed('edge', { call: 'speech', method: 'GET', route: '/transcripts' } as never)).toBe(false)
  })
  test('the calls window is the app window\'s Transcripts page: it may what the app window may', () => {
    expect(pageOf(at('calls.html'))).toBe('calls')
    for (const type of dangerous) expect(messageAllowed('calls', type), type).toBe(true)
    expect(patchAllowed('calls', { callTemplates: [] })).toBe(true)
    expect(callAllowed('calls', { call: 'speech', method: 'GET', route: '/transcripts' } as never)).toBe(true)
    // ...and nothing that is another page's alone.
    expect(messageAllowed('calls', 'talkSay')).toBe(false)
    expect(messageAllowed('calls', 'menuPick')).toBe(false)
  })
  test('each page keeps what it does', () => {
    for (const type of ['ready', 'speak', 'speakNatural', 'stop', 'close', 'pin', 'maximize', 'height', 'copyText', 'pasteText', 'translateText', 'checkText', 'lookup', 'saveWord', 'unsaveWord', 'saveSettings', 'downloadNatural', 'openSpeechSettings']) expect(messageAllowed('card', type), type).toBe(true)
    for (const type of ['trayReady', 'trayHeight', 'trayClose', 'tray', 'keepWord', 'saveSettings']) expect(messageAllowed('tray', type), type).toBe(true)
    for (const type of ['dictationReady', 'dictationTuck', 'dictationText', 'dictationAudio', 'dictationNote', 'dictationHeight', 'dictationCancelled', 'dictationFailed']) expect(messageAllowed('dictation', type), type).toBe(true)
  })
  test('only the talk window talks to the duck: a model\'s words in the card cannot start a talk or speak for the person', () => {
    for (const type of ['talkStart', 'talkSay', 'talkInterrupt', 'talkClear', 'talkListen', 'talkReady', 'talkPin', 'talkWindow', 'talkContinue', 'talkDelete', 'talksClear']) {
      expect(messageAllowed('talk', type), type).toBe(true)
      for (const page of ['app', 'card', 'tray', 'dictation'] as const) expect(messageAllowed(page, type), `${page} ${type}`).toBe(false)
    }
    // It reads aloud, opens the word card, keeps a word and shows the red dot as the card and the Transcribe page do.
    for (const type of ['speak', 'speakNatural', 'stop', 'lookup', 'saveWord', 'unsaveWord', 'micRecording']) expect(messageAllowed('talk', type), type).toBe(true)
    expect(messageAllowed('card', 'micRecording')).toBe(false)
  })
  test('the talk window is opened from the app window only', () => {
    expect(messageAllowed('app', 'talkOpen')).toBe(true)
    for (const page of ['card', 'tray', 'dictation', 'talk'] as const) expect(messageAllowed(page, 'talkOpen'), page).toBe(false)
  })
  test('an unknown page sends nothing', () => {
    expect(messageAllowed('other', 'ready')).toBe(false)
  })
})

describe('the bar by a selection', () => {
  test('is a page of its own, sends its own messages and no other, and no other page sends them', () => {
    expect(pageOf('file:///C:/app/media/bar.html?lang=ru')).toBe('bar')
    for (const type of ['barReady', 'barSize', 'barPick']) {
      expect(messageAllowed('bar', type), type).toBe(true)
      for (const page of ['app', 'card', 'tray', 'dictation', 'talk', 'menu'] as const) expect(messageAllowed(page, type), `${page} ${type}`).toBe(false)
    }
    for (const type of ['saveSettings', 'copyText', 'speak', 'tray', 'menuPick', 'openLink']) expect(messageAllowed('bar', type), type).toBe(false)
    expect(patchAllowed('bar', { selectionBar: false })).toBe(false)
    expect(callAllowed('bar', { call: 'speech', method: 'POST', route: '/dictate' })).toBe(false)
  })
})

describe('the menu on one key', () => {
  test('is a page of its own, sends its own messages and no other, and no other page sends them', () => {
    expect(pageOf('file:///C:/app/media/menu.html?lang=ru')).toBe('menu')
    for (const type of ['menuReady', 'menuHeight', 'menuHover', 'menuPick']) {
      expect(messageAllowed('menu', type), type).toBe(true)
      for (const page of ['app', 'card', 'tray', 'dictation', 'talk'] as const) expect(messageAllowed(page, type), `${page} ${type}`).toBe(false)
    }
    for (const type of ['saveSettings', 'copyText', 'speak', 'tray', 'lookup', 'openLink']) expect(messageAllowed('menu', type), type).toBe(false)
  })

  test('changes no setting and calls nothing', () => {
    expect(patchAllowed('menu', { paused: true })).toBe(false)
    expect(callAllowed('menu', { call: 'speech', method: 'POST', route: '/dictate' })).toBe(false)
  })
})

describe('which settings a page may change', () => {
  test('the card its reading mode, the tray panel its switches, the app window any', () => {
    expect(patchAllowed('card', { oneAtATime: true })).toBe(true)
    expect(patchAllowed('tray', { autoFix: false })).toBe(true)
    expect(patchAllowed('tray', { paused: true })).toBe(true)
    expect(patchAllowed('app', { translationLevel: 'most', keepWords: [] })).toBe(true)
  })
  test('nothing more, nothing else', () => {
    expect(patchAllowed('card', { oneAtATime: true, translationLevel: 'most', model: 'most' })).toBe(false)
    expect(patchAllowed('tray', { keepWords: [] })).toBe(false)
    expect(patchAllowed('card', { doubleCopy: false })).toBe(false)
    // Ctrl+C twice is a key now, set in the window only.
    expect(patchAllowed('tray', { doubleCopy: false })).toBe(false)
    expect(patchAllowed('tray', { selectKey: 'Control+C*2' })).toBe(false)
    for (const page of ['dictation', 'other'] as const) expect(patchAllowed(page, { paused: true })).toBe(false)
    expect(patchAllowed('tray', undefined)).toBe(false)
  })
})

describe('calls with an answer', () => {
  const speech = (method: string, route: string) => ({ call: 'speech', method, route }) as const
  test('the dictation badge dictates and records a note, and nothing else', () => {
    expect(callAllowed('dictation', speech('PUT', '/dictate/sessions/a1/3'))).toBe(true)
    expect(callAllowed('dictation', speech('POST', '/dictate?language=auto&expected=ru,en&strict=1&format=pcm16'))).toBe(true)
    expect(callAllowed('dictation', speech('POST', '/recordings'))).toBe(true)
    expect(callAllowed('dictation', speech('PUT', '/settings'))).toBe(false)
    expect(callAllowed('dictation', speech('GET', '/transcripts'))).toBe(false)
    expect(callAllowed('dictation', speech('GET', '/dictate/../transcripts'))).toBe(false)
    expect(callAllowed('dictation', speech('GET', '/dictateX'))).toBe(false)
    for (const route of ['/dictate/%2e%2e/transcripts', '/dictate/.%2E/settings', '/recordings/%2E%2E/transcripts/x', '/dictate\\..\\settings']) {
      expect(callAllowed('dictation', speech('GET', route)), route).toBe(false)
    }
    expect(callAllowed('dictation', { call: 'exportTranscript', id: 'x', format: 'txt', name: 'x' })).toBe(false)
  })
  test('the talk window only dictates: no note, no settings, no transcripts', () => {
    expect(callAllowed('talk', speech('POST', '/dictate/sessions'))).toBe(true)
    expect(callAllowed('talk', speech('PUT', '/dictate/sessions/a1/3'))).toBe(true)
    expect(callAllowed('talk', speech('POST', '/dictate?language=auto&expected=en&strict=1&format=pcm16'))).toBe(true)
    for (const route of ['/recordings', '/settings', '/transcripts', '/dictate/%2e%2e/transcripts', '/dictateX']) expect(callAllowed('talk', speech('GET', route)), route).toBe(false)
  })
  test('the card and the tray panel call nothing; the app window everything', () => {
    for (const page of ['card', 'tray', 'other'] as const) expect(callAllowed(page, speech('GET', '/health'))).toBe(false)
    expect(callAllowed('app', speech('PUT', '/settings'))).toBe(true)
    expect(callAllowed('app', { call: 'pickFolder', title: 't', current: '' })).toBe(true)
  })
})

describe('what a page may open with the system', () => {
  const folders = new Set(['C:\\Users\\you\\Documents\\Kryakl\\Transcripts', '\\\\nas\\kb'])
  const isDirectory = (p: string) => folders.has(p)
  test('a folder, a note, a text file', () => {
    expect(openable('C:\\Users\\you\\Documents\\Kryakl\\Transcripts', isDirectory)).toBe(true)
    expect(openable('E:\\kb\\Inbox\\2026-10-30 Standup.md', isDirectory)).toBe(true)
    expect(openable('C:\\Users\\you\\AppData\\Roaming\\Kryakl\\kryakl.txt', isDirectory)).toBe(true)
    expect(openable('\\\\nas\\kb', isDirectory)).toBe(true)
  })
  test('never a program, a script, a shortcut, an address or a relative path', () => {
    for (const p of ['C:\\Windows\\System32\\calc.exe', '\\\\evil\\share\\p.exe', 'C:\\x\\run.bat', 'C:\\x\\a.cmd', 'C:\\x\\a.lnk', 'C:\\x\\a.url', 'C:\\x\\a.ps1', 'C:\\x\\a.js', 'C:\\x\\a.hta', 'https://evil.example', 'ms-settings:speech', 'file:///C:/x.exe', 'notes.md', 'C:notes.md', '\\\\?\\C:\\x.exe', '', undefined, 5]) {
      expect(openable(p, isDirectory), String(p)).toBe(false)
    }
  })
  test('a path that is not there is no folder', () => {
    expect(
      openable('C:\\gone', () => {
        throw new Error('ENOENT')
      }),
    ).toBe(false)
  })
})

describe('the call recording\'s panel', () => {
  test('is a page of its own, the only one that says how its recording goes', () => {
    expect(pageOf(at('capture.html'))).toBe('capture')
    for (const type of ['captureState', 'captureDone', 'captureHide', 'captureOpenSettings', 'captureAnswer', 'captureExpand']) {
      expect(messageAllowed('capture', type), type).toBe(true)
      for (const page of ['app', 'card', 'tray', 'dictation', 'talk', 'menu'] as const) expect(messageAllowed(page, type), `${page} ${type}`).toBe(false)
    }
    for (const type of ['saveSettings', 'openLink', 'copyText', 'installSpeech', 'micRecording']) expect(messageAllowed('capture', type), type).toBe(false)
  })
  test('reaches the engine\'s recordings and nothing else', () => {
    expect(callAllowed('capture', { call: 'speech', method: 'POST', route: '/recordings' })).toBe(true)
    expect(callAllowed('capture', { call: 'speech', method: 'PUT', route: '/recordings/abc/system/3' })).toBe(true)
    expect(callAllowed('capture', { call: 'speech', method: 'POST', route: '/dictate' })).toBe(false)
    expect(callAllowed('capture', { call: 'speech', method: 'DELETE', route: '/recordings/../transcripts/abc' })).toBe(false)
    expect(callAllowed('capture', { call: 'copy', text: 'x' })).toBe(false)
  })
  test('the app window starts and stops a call', () => {
    expect(messageAllowed('app', 'toggleCall')).toBe(true)
    for (const page of ['card', 'tray', 'dictation', 'talk', 'capture'] as const) expect(messageAllowed(page, 'toggleCall'), page).toBe(false)
  })
  test('only the app window makes or cancels a summary', () => {
    for (const type of ['summarize', 'cancelSummary'] as const) {
      expect(messageAllowed('app', type)).toBe(true)
      for (const page of ['card', 'tray', 'dictation', 'talk', 'capture'] as const) expect(messageAllowed(page, type), page).toBe(false)
    }
  })
})
