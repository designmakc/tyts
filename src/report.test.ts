import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { unzip } from './download'
import { cleanText, fitEncoded, issueUrl, mailUrl, makeReport, reportName, settingsSummary } from './report'

const names = { you: ['creoo', 'creoo'], computer: 'DESKTOP-K7' }
const facts = { version: '0.11.2', build: '', electron: '39.0.0', windows: '10.0.26300', arch: 'x64' }

describe('cleanText', () => {
  it('hides the account and the computer, in paths and in words, and leaves longer words alone', () => {
    const line = 'left in C:\\Users\\creoo\\AppData\\Local\\Altype; "C:\\\\Users\\\\creoo\\\\x"; c:/users/Creoo/a; creoo on DESKTOP-K7; creoosaurus'
    expect(cleanText(line, names)).toBe('left in C:\\Users\\<you>\\AppData\\Local\\Altype; "C:\\\\Users\\\\<you>\\\\x"; c:/users/<you>/a; <you> on <computer>; creoosaurus')
  })

  it('hides a short name in a path only', () => {
    expect(cleanText('C:\\Users\\al\\x, al said', { you: ['al'], computer: 'PC' })).toBe('C:\\Users\\<you>\\x, al said')
  })

  it('cuts a Hugging Face key and a bearer token', () => {
    expect(cleanText('token hf_AbCdEf1234567890 sent; Authorization: Bearer 9f8e7d6c5b4a3210', names)).toBe('token hf_… sent; Authorization: Bearer …')
  })
})

describe('settingsSummary', () => {
  it("counts the person's own lists and keeps the rest", () => {
    expect(settingsSummary({ theme: 'dark', keepWords: ['ghbdtn', 'hello'], vocabulary: [], apps: [{ exe: 'code.exe' }], languages: ['uk'] })).toEqual({
      theme: 'dark',
      keepWords: '2 not shown',
      vocabulary: '0 not shown',
      apps: '1 not shown',
      languages: ['uk'],
    })
    expect(settingsSummary({ talkAbout: 'I am Alex, a designer.', talkLevel: 'B1' })).toEqual({ talkAbout: '22 characters, not shown', talkLevel: 'B1' })
    expect(settingsSummary({ dictateEdit: true, dictateEditStyle: 'own', dictateEditOwn: 'Пиши короче.' })).toEqual({ dictateEdit: true, dictateEditStyle: 'own', dictateEditOwn: '12 characters, not shown' })
    expect(settingsSummary({ callTemplate: 'own', callOwn: 'Only the tasks.' })).toEqual({ callTemplate: 'own', callOwn: '15 characters, not shown' })
  })
})

describe('links', () => {
  it('cuts a text to fit once encoded, a Cyrillic letter taking six', () => {
    expect(fitEncoded('hello', 100)).toBe('hello')
    const cut = fitEncoded('привет мир', 40)
    expect(encodeURIComponent(cut).length).toBeLessThanOrEqual(40)
    expect(cut.endsWith('…')).toBe(true)
  })

  it('makes an email that Windows hands over whole, however long the text', () => {
    const url = mailUrl(`Перевод не работает\n${'очень длинный текст '.repeat(200)}`, facts, 'Tyts report 2026-10-31 14-05.zip')
    expect(url.length).toBeLessThanOrEqual(1800)
    expect(url.startsWith('mailto:designmakc@gmail.com?subject=')).toBe(true)
    const body = decodeURIComponent(url.slice(url.indexOf('&body=') + 6))
    expect(body).toContain('Tyts 0.11.2 · Windows 10.0.26300 x64')
    expect(body).toContain('please attach "Tyts report 2026-10-31 14-05.zip"')
    expect(decodeURIComponent(url.slice(url.indexOf('subject=') + 8, url.indexOf('&body=')))).toBe('Tyts 0.11.2: Перевод не работает')
  })

  it('makes a GitHub issue with a title from the first line', () => {
    const url = issueUrl('The card stays empty\nafter Ctrl+C twice', facts, 'r.zip')
    expect(url.startsWith('https://github.com/designmakc/tyts/issues/new?title=The%20card%20stays%20empty&body=')).toBe(true)
    expect(decodeURIComponent(url.slice(url.indexOf('&body=') + 6))).toContain('drag `r.zip` here')
  })

  it('names a report by the local time', () => {
    expect(reportName(new Date(2026, 9, 31, 14, 5))).toBe('Tyts report 2026-10-31 14-05.zip')
  })
})

describe('makeReport', () => {
  const temp: string[] = []
  const dir = () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-report-test-'))
    temp.push(d)
    return d
  }
  afterEach(() => {
    for (const d of temp.splice(0)) fs.rmSync(d, { recursive: true, force: true })
  })

  // The zip is tar's `-a` of bsdtar (Windows, a Mac); GNU tar on Linux writes no zip.
  it.skipIf(process.platform === 'linux')('takes the logs and the computer, cleaned, and never the speech settings or the lists', async () => {
    const home = dir()
    fs.writeFileSync(path.join(home, 'tyts.log'), 'start: Kryakl\ncopy: came in 30 ms from C:\\Users\\creoo\\Code.exe\n')
    fs.writeFileSync(path.join(home, 'tyts.old.log'), 'before\n')
    fs.writeFileSync(path.join(home, 'speech.log'), 'whoami hf_AbCdEf1234567890\n')
    fs.writeFileSync(path.join(home, 'device.json'), '{"cpu":"i9"}')
    fs.writeFileSync(path.join(home, 'speech.json'), '{"hfToken":"hf_secret1234567890"}')
    fs.writeFileSync(path.join(home, 'words.json'), '[]')
    const out = path.join(dir(), 'Reports', 'r.zip')
    await makeReport({ dir: home, out, message: 'It broke', facts, status: ['Speech engine: ready'], settings: { keepWords: ['secret'] }, names, at: new Date() })
    const opened = dir()
    await unzip(out, opened)
    expect(fs.readdirSync(opened).sort()).toEqual(['device.json', 'tyts.log', 'tyts.old.log', 'report.txt', 'speech.log'])
    expect(fs.readFileSync(path.join(opened, 'tyts.log'), 'utf8')).toContain('C:\\Users\\<you>\\Code.exe')
    expect(fs.readFileSync(path.join(opened, 'speech.log'), 'utf8')).toBe('whoami hf_…\n')
    const report = fs.readFileSync(path.join(opened, 'report.txt'), 'utf8')
    expect(report).toContain('It broke')
    expect(report).toContain('"keepWords": "1 not shown"')
    expect(report).not.toContain('secret')
  })
})
