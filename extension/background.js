// Kryakl's meeting recorder, the service worker: starts and stops a recording of
// a tab. The recording itself lives in the offscreen document (offscreen.js),
// which outlives this worker; chrome.storage.session remembers which tab it is.

const OFFSCREEN = 'offscreen.html'

const PORTS = [8765, 8766, 8767, 8768, 8769, 8770, 8771, 8772, 8773, 8774]

/** Kryakl's own engine on this port: its /health names itself; another engine or program on the port does not. */
async function engineOn(p) {
  try {
    const r = await fetch(`http://127.0.0.1:${p}/health`, { headers: SELF(), signal: AbortSignal.timeout(500) })
    return r.ok && (await r.json()).engine === 'tyts'
  } catch {
    return false
  }
}

// The engine takes 8765, or the next free of ten when Windows or another program holds it (src/speechservice.ts freePort).
// The port found is remembered for the browser's session and looked for again when it stops answering.
async function port() {
  const { port } = await chrome.storage.local.get('port')
  if (port) return port
  const { found } = await chrome.storage.session.get('found')
  if (found && (await engineOn(found))) return found
  for (const p of PORTS) {
    if (await engineOn(p)) {
      await chrome.storage.session.set({ found: p })
      return p
    }
  }
  return 8765
}

// Every call to /health says which version of the extension this is, so Kryakl can show "Installed in Chrome".
const SELF = () => ({ 'X-Krya-Extension': chrome.runtime.getManifest().version })

async function engineReady() {
  return engineOn(await port())
}

/** Lets the engine know the extension is there; the engine may be off, which is fine. */
async function ping() {
  try {
    await fetch(`http://127.0.0.1:${await port()}/health`, { headers: SELF(), signal: AbortSignal.timeout(1500) })
  } catch {}
}

function startPinging() {
  chrome.alarms.create('ping', { periodInMinutes: 15 })
  ping()
}

chrome.runtime.onInstalled.addListener(startPinging)
chrome.runtime.onStartup.addListener(startPinging)
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'ping') ping()
})

async function current() {
  const { recording } = await chrome.storage.session.get('recording')
  return recording || null
}

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })
  if (contexts.length) return
  await chrome.offscreen.createDocument({
    url: OFFSCREEN,
    reasons: ['USER_MEDIA'],
    justification: 'Records the tab and the microphone for a transcript in Kryakl',
  })
}

async function closeOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })
  if (contexts.length) await chrome.offscreen.closeDocument()
}

/** "Meet – abc-defg-hij" → "Meeting abc-defg-hij"; "Meet – Weekly sync" → "Weekly sync"; other tabs keep their title. */
function titleOf(tab) {
  const title = (tab.title || '').trim()
  const meet = title.match(/^Meet\s*[–-]\s*(.+)$/)
  if (!meet) return title || chrome.i18n.getMessage('tabRecording')
  return /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meet[1]) ? chrome.i18n.getMessage('meeting', [meet[1]]) : meet[1]
}

async function start(tab) {
  if (await current()) return { ok: false, error: chrome.i18n.getMessage('errAlready') }
  if (!tab || !tab.id || !/^https?:/.test(tab.url || '')) return { ok: false, error: chrome.i18n.getMessage('errTab') }
  if (!(await engineReady())) return { ok: false, error: "Kryakl's speech engine is not running: open Kryakl → Transcribe to install or start it" }
  let streamId
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id })
  } catch (error) {
    return { ok: false, error: chrome.i18n.getMessage('errNoSound', [error.message]) }
  }
  await ensureOffscreen()
  const answer = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'start', streamId, title: titleOf(tab), port: await port() })
  if (!answer || !answer.ok) {
    await closeOffscreen()
    return answer || { ok: false, error: chrome.i18n.getMessage('errNoStart') }
  }
  const recording = { tabId: tab.id, id: answer.id, title: titleOf(tab), startedAt: Date.now(), mic: answer.mic }
  await chrome.storage.session.set({ recording })
  await chrome.action.setBadgeBackgroundColor({ color: '#e5534b' })
  await chrome.action.setBadgeText({ text: 'REC' })
  return { ok: true, recording }
}

async function stop() {
  const recording = await current()
  if (!recording) return { ok: false, error: chrome.i18n.getMessage('errNotRecording') }
  let answer
  try {
    answer = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' })
  } catch (error) {
    answer = { ok: false, error: error.message }
  }
  await chrome.storage.session.remove('recording')
  await chrome.action.setBadgeText({ text: '' })
  await closeOffscreen()
  return answer || { ok: false, error: chrome.i18n.getMessage('errNoStop') }
}

async function toggle(tab) {
  return (await current()) ? stop() : start(tab)
}

/** A shortcut has no popup to answer in: a failure shows as "!" on the icon, and the popup says what. */
async function remember(answer) {
  if (answer && !answer.ok) {
    await chrome.storage.session.set({ lastError: answer.error })
    await chrome.action.setBadgeBackgroundColor({ color: '#e5534b' })
    await chrome.action.setBadgeText({ text: '!' })
  } else {
    await chrome.storage.session.remove('lastError')
  }
  return answer
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'toggle-recording') return
  try {
    await remember(await toggle(tab))
  } catch (error) {
    await remember({ ok: false, error: error.message || String(error) })
  }
})

// The meeting's tab closed: what was recorded goes to the engine.
chrome.tabs.onRemoved.addListener(async tabId => {
  const recording = await current()
  if (recording && recording.tabId === tabId) await stop()
})

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target !== 'background') return false
  ;(async () => {
    if (message.type === 'status') {
      const { lastError } = await chrome.storage.session.get('lastError')
      if (lastError && !(await current())) await chrome.action.setBadgeText({ text: '' })
      await chrome.storage.session.remove('lastError')
      return { recording: await current(), engine: await engineReady(), lastError }
    }
    if (message.type === 'start') return start(await chrome.tabs.get(message.tabId))
    if (message.type === 'stop') return stop()
    // The offscreen document saw the tab's sound end (the tab navigated away, Chrome stopped the capture).
    if (message.type === 'ended') return stop()
    return { ok: false, error: 'unknown' }
  })().then(reply, error => reply({ ok: false, error: String(error) }))
  return true
})
