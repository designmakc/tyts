import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { agentFile, agentPlist, setMacLogin } from './loginmac'

describe('loginmac', () => {
  it('opens Tyts by its bundle id at login', () => {
    const plist = agentPlist()
    expect(plist).toContain('<string>/usr/bin/open</string>')
    expect(plist).toContain('<string>com.designmakc.tyts</string>')
    expect(plist).toContain('<key>RunAtLoad</key>\n  <true/>')
  })

  it('writes the agent once and removes it', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tyts-login-'))
    const file = agentFile(home)
    setMacLogin(true, home)
    expect(fs.readFileSync(file, 'utf8')).toBe(agentPlist())
    fs.utimesSync(file, 0, 0)
    setMacLogin(true, home)
    expect(fs.statSync(file).mtimeMs).toBe(0) // unchanged: not written again
    setMacLogin(false, home)
    expect(fs.existsSync(file)).toBe(false)
    setMacLogin(false, home)
    fs.rmSync(home, { recursive: true })
  })
})
