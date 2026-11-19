// Start at login on a Mac: a LaunchAgent of Tyts's own in ~/Library/LaunchAgents.
// Electron's login item (SMAppService on macOS 13+) is tied to the app's signature,
// and Tyts is only ad-hoc signed: the item did not start the app. launchd opens the
// app by its bundle id, so it is found wherever it was moved and survives an update.

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/** electron-builder.yml appId. */
export const BUNDLE_ID = 'com.designmakc.tyts'
const LABEL = `${BUNDLE_ID}.login`

export const agentFile = (home = os.homedir()): string => path.join(home, 'Library', 'LaunchAgents', `${LABEL}.plist`)

export function agentPlist(bundleId = BUNDLE_ID): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/open</string>
    <string>-g</string>
    <string>-b</string>
    <string>${bundleId}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>LimitLoadToSessionType</key>
  <string>Aqua</string>
  <key>AssociatedBundleIdentifiers</key>
  <string>${bundleId}</string>
</dict>
</plist>
`
}

/** Writes or removes the agent; launchd reads it at the next login. Unchanged, nothing is written: a new write is a new "background item" notice. */
export function setMacLogin(on: boolean, home = os.homedir()): void {
  const file = agentFile(home)
  if (!on) return fs.rmSync(file, { force: true })
  const text = agentPlist()
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text, 'utf8')
}
