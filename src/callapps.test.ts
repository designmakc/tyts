import { afterEach, describe, expect, test } from 'vitest'

import { setUiLanguage } from './i18n'
import { callApp, callTitle } from './callapps'

describe('the call program running now', () => {
  test('one known program, by its process on a Mac or on Windows', () => {
    expect(callApp(['/sbin/launchd', '/Applications/zoom.us.app/Contents/MacOS/zoom.us', '/usr/bin/ssh'])).toBe('Zoom')
    expect(callApp(['explorer.exe', 'Zoom.exe', 'svchost.exe'])).toBe('Zoom')
    expect(callApp(['ms-teams.exe'])).toBe('Microsoft Teams')
    expect(callApp(['/Applications/Microsoft Teams.app/Contents/MacOS/MSTeams'])).toBe('Microsoft Teams')
    expect(callApp(['Telegram.exe'])).toBe('Telegram')
    expect(callApp(['/Applications/FaceTime.app/Contents/MacOS/FaceTime'])).toBe('FaceTime')
    expect(callApp(['Discord.exe', 'Discord.exe', 'Discord.exe'])).toBe('Discord')
    expect(callApp(['slack.exe'])).toBe('Slack')
    expect(callApp(['Skype.exe'])).toBe('Skype')
    expect(callApp(['CiscoCollabHost.exe'])).toBe('Webex')
  })
  test('none, or two of them: no name is guessed', () => {
    expect(callApp([])).toBeNull()
    expect(callApp(['chrome.exe', 'Code.exe'])).toBeNull()
    expect(callApp(['Zoom.exe', 'Telegram.exe'])).toBeNull()
  })
  test('a helper or a lookalike is not the program', () => {
    expect(callApp(['/Applications/Discord.app/Contents/Frameworks/Discord Helper (Renderer).app/Contents/MacOS/Discord Helper (Renderer)'])).toBeNull()
    expect(callApp(['zoomit.exe', 'slackware'])).toBeNull()
  })
})

describe('a call\'s title', () => {
  afterEach(() => setUiLanguage('en'))
  const at = new Date(2026, 10, 6, 14, 30)
  test('the date and time in the interface\'s language', () => {
    setUiLanguage('ru')
    expect(callTitle(null, at)).toBe('Созвон 6 ноября 14:30')
    setUiLanguage('en')
    expect(callTitle(null, at)).toBe('Call 6 November 14:30')
  })
  test('the program\'s name in place of the word', () => {
    setUiLanguage('ru')
    expect(callTitle('Zoom', at)).toBe('Zoom · 6 ноября 14:30')
  })
})
