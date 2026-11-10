// What the system must let Tyts do, checked in one place (the Permissions page) so nobody
// meets the system's question in the first minute of a call. A Mac: the microphone, Screen &
// System Audio Recording (the others' voices, text on the screen, screenshots), Accessibility
// (layouts, typing what is said, holding a key) and, where the keyboard helper says so,
// Input Monitoring. Windows: the microphone's privacy switch. Pure: main reads the system.

export type AccessId = 'mic' | 'screen' | 'access' | 'input'
/** `ask`: the system still shows its own question when asked; `settings`: refused before, only its settings turn it on. */
export type AccessState = 'ok' | 'ask' | 'settings'
export type AccessRow = { id: AccessId; state: AccessState }

/** Electron's getMediaAccessStatus. */
export type MediaStatus = 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown'

export type AccessRaw = {
  platform: string
  mic: MediaStatus
  screen: MediaStatus
  /** Accessibility (isTrustedAccessibilityClient). */
  trusted: boolean
  /** What the Mac keyboard helper says of Input Monitoring: it sees keys, sees modifiers only, or has not said. */
  keys: 'seen' | 'blocked' | 'unknown'
}

/** `unknown`: the system cannot say (an old Windows): nothing to ask for. */
const media = (status: MediaStatus): AccessState => (status === 'granted' || status === 'unknown' ? 'ok' : status === 'not-determined' ? 'ask' : 'settings')

export function accessRows(raw: AccessRaw): AccessRow[] {
  if (raw.platform === 'win32') return [{ id: 'mic', state: media(raw.mic) }]
  if (raw.platform !== 'darwin') return []
  const rows: AccessRow[] = [
    { id: 'mic', state: media(raw.mic) },
    { id: 'screen', state: media(raw.screen) },
    { id: 'access', state: raw.trusted ? 'ok' : 'ask' },
  ]
  if (raw.trusted && raw.keys !== 'unknown') rows.push({ id: 'input', state: raw.keys === 'seen' ? 'ok' : 'settings' })
  return rows
}

export const missing = (rows: readonly AccessRow[]): number => rows.filter(r => r.state !== 'ok').length
