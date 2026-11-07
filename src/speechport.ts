// The Chrome extension learns the speech engine's port from Kryakl, never by looking for it: it has no key to tell
// Kryakl's engine from a program answering alike, so a port of its choosing would get the meeting's sound. Chrome's
// managed storage for an extension is read from the registry, HKCU\Software\Policies\Google\Chrome\3rdparty\
// extensions\<id>\policy, which only this Windows account writes (extension/background.js port(), schema.json).

import { execFile } from 'node:child_process'

import { SPEECH_PORT } from './speechservice'
import { system32 } from './system32'

/** The extension's fixed id (engine/auth.py EXTENSION_ID). */
export const EXTENSION_ID = 'phokhlmnodckgejnaogjgpmfjnjkefpa'

export const POLICY_KEY = `HKCU\\Software\\Policies\\Google\\Chrome\\3rdparty\\extensions\\${EXTENSION_ID}\\policy`

/** The reg.exe arguments that tell Chrome the port: set when it is not the default, removed when it is. */
export function policyArgs(port: number): string[] {
  return port === SPEECH_PORT ? ['delete', POLICY_KEY, '/v', 'port', '/f'] : ['add', POLICY_KEY, '/v', 'port', '/t', 'REG_DWORD', '/d', String(port), '/f']
}

/** Writes the port for the extension; Windows only, as Chrome reads the registry there. */
export function tellExtensionPort(port: number, log: (line: string) => void): void {
  if (process.platform !== 'win32') return
  execFile(system32('reg.exe'), policyArgs(port), { windowsHide: true, timeout: 5000 }, error => {
    // delete says "unable to find" when nothing was there: not worth a line.
    if (error && port !== SPEECH_PORT) log(`speech: could not tell the extension the port ${port}: ${String(error)}`)
    else if (port !== SPEECH_PORT) log(`speech: the engine is on port ${port}, told the extension`)
  })
}
