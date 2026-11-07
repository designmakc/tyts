// The speech engine as Kryakl holds it: the installed parts (speechpack.ts),
// the running service (speechservice.ts), this computer (device.ts) with the
// plan of which model runs where (speechplan.ts), and what the app window sees
// of all of it (SpeechView). The service runs once a part is installed;
// installing another part stops it for the time, since Windows will not replace
// the files of a running Python. The plan is made again whenever something it
// depends on changes (the engine's numbers, the downloaded models, the person's
// choices, the computer) and sent to the engine when it differs.

import * as fs from 'node:fs'
import * as path from 'node:path'

import { driveOf, fingerprint, freeMb, loadProfile, probeDevice, quickProfile, saveProfile, type DeviceProfile } from './device'
import { langCode } from './languages'
import { engineMessage } from './i18n/engine'
import { log } from './log'
import { freeFolderSoon, runningProcessesSoon } from './oldfolder'
import type { SpeechView } from './protocol'
import { myLanguages, type Settings } from './settings'
import { DOWNLOAD_MB, hasNvidia, INSTALLED_MB, SpeechPack, type SpeechPart } from './speechpack'
import { AUTO_DOWNLOAD_MB, planSpeech, testKey, testRuns, type PlanInput, type SpeechPlan } from './speechplan'
import { SpeechService, speechToken, type SpeechResult } from './speechservice'
import { vocabularyFor } from './vocabulary'

/** "Not now" holds this long at least, even when there is something new to measure. */
const DECLINE_MS = 24 * 3600_000
/** A test run by itself is not run again for the same models sooner than this (one that failed, say). */
const RETEST_MS = 3600_000
/** A processor model for dictation whose download did not come is asked for again after this. */
const FETCH_AGAIN_MS = 30 * 60_000
/** How often a model being downloaded is asked about, and how many asks it has to show as running (each ask may start it again). */
const MODEL_PROBE_MS = 3000
const MODEL_START_PROBES = 2
/** How often the library is asked whether a meeting is being recorded (the engine's /health does not say). */
const MEETING_PROBE_MS = 5000

export type SpeechHostOptions = {
  /** %LOCALAPPDATA%\Kryakl\speech: the environment, models, uv. */
  root: string
  /** Kryakl's own folder (%APPDATA%\Kryakl): the engine's settings and log, device.json. */
  userDir: string
  engineDir: string
  extensionDir: string
  /** uv's download cache of this computer, when it has one (speechpack.ts `sharedCache`). */
  sharedCache?: string
  port: number
  open: (url: string) => Promise<AsyncIterable<Uint8Array>>
  /** A test run gives the engine its own settings folder. */
  testHome?: string
  settings: () => Settings
  onChange: () => void
  /** The engine is up on this port (it moves on when 8765 is taken). */
  onPort?: (port: number) => void
}

export class SpeechHost {
  readonly pack: SpeechPack
  readonly service: SpeechService
  profile: DeviceProfile
  plan: SpeechPlan
  private input: PlanInput
  private pushed = ''
  private pushing = false
  private autoTested = { key: '', at: 0 }
  /** When each processor model for dictation was last asked to download (`fetchProcessorDictation`). */
  private readonly fetchAsked = new Map<string, number>()
  private readonly nvidiaDriver = hasNvidia()
  /** The extension's version in Kryakl's folder, which Chrome loads unpacked. */
  private readonly extensionShipped: string
  /** A meeting is being recorded through the Chrome extension now (the tray shows it). */
  meeting = false
  private meetingTimer: NodeJS.Timeout | undefined

  constructor(private readonly o: SpeechHostOptions) {
    this.profile = loadProfile(this.deviceFile) ?? quickProfile()
    this.input = this.inputs()
    this.plan = planSpeech(this.input)
    this.pack = new SpeechPack({
      root: o.root,
      engineDir: o.engineDir,
      nvidia: this.nvidiaDriver,
      gpuSpeakers: () => this.speakersOnCard(),
      ...(o.sharedCache ? { sharedCache: o.sharedCache } : {}),
      open: o.open,
      onChange: () => this.changed(),
    })
    this.service = new SpeechService({
      python: () => this.pack.python,
      engineDir: o.engineDir,
      port: o.port,
      log: path.join(o.userDir, 'speech.log'),
      pycache: path.join(o.root, 'pycache'),
      // A test run's own home (its models are still the installed engine's); else where the engine is installed:
      // %LOCALAPPDATA%\Kryakl\speech, or an old name's folder when it could not move (oldfolder.ts).
      env: o.testHome ? { KRYA_SPEECH_HOME: o.testHome } : { KRYA_SPEECH_DIR: o.root },
      // Beside the engine's settings (its APP_DIR), where an engine run by hand finds it too.
      token: speechToken(path.join(o.testHome ?? o.userDir, 'speech-token')),
      // Its Python, run from the engine's own folder (the venv's launcher and the interpreter it starts); never uv.
      // Seconds of PowerShell and of waiting, off main's thread: the engine's start waits for it, nothing else does.
      stopStale: async () => {
        const { stopped, holding } = await freeFolderSoon(o.root, (await runningProcessesSoon()).filter(p => /^pythonw?\.exe$/i.test(p.name)))
        log(`speech: an older engine without the key stopped (${stopped.length})${holding.length ? `, ${holding.length} would not stop` : ''}`)
      },
      change: () => this.changed(),
      ...(o.onPort ? { onPort: o.onPort } : {}),
    })
    this.extensionShipped = shippedVersion(o.extensionDir)
  }

  /** "Who spoke when" runs on the card: the person's choice or the advice, and only where the card has room for it. */
  private speakersOnCard(): boolean {
    return this.plan.offers.speakersGpu && this.o.settings().speakersDevice !== 'cpu'
  }

  private get deviceFile(): string {
    return path.join(this.o.userDir, 'device.json')
  }

  /** The launcher was set right once this run: never again, whatever the check says. */
  private relocated = false

  /** At Kryakl's start: the service, when a part is installed; after an update brought other packages, those first. */
  start(): void {
    if (this.pack.state.status !== 'ready') return
    // Moved from Krya's or Altype's folder, the environment's launcher still names the old place: set right first.
    if (this.pack.moved && !this.relocated) {
      this.relocated = true
      log('speech: the engine moved here; setting its Python launcher right')
      void this.pack.relocate().then(
        () => (log('speech: launcher set right'), this.start()),
        error => (console.warn('Kryakl: could not set the speech engine right after the move', error), void this.service.start()),
      )
      return
    }
    if (this.pack.stale) void this.install([])
    else void this.service.start()
  }

  /** Asks Windows about this computer (a second or two, in the background); a different answer makes the plan again. */
  async probe(): Promise<void> {
    const profile = await probeDevice()
    const changed = fingerprint(profile) !== fingerprint(this.profile) || !this.profile.at
    this.profile = profile
    saveProfile(this.deviceFile, profile)
    if (changed) this.changed()
  }

  get installed(): boolean {
    return this.pack.state.status === 'ready'
  }

  get ready(): boolean {
    return this.service.state === 'ready'
  }

  /** The engine stopped for good after its restarts (or another program holds its port): waiting will not bring it. */
  get down(): boolean {
    return this.service.state === 'down'
  }

  /** The engine is of 0.2 or later: it takes a plan and runs the speed test. */
  private get planned(): boolean {
    const [major = 0, minor = 0] = (this.service.health?.version ?? '0').split('.').map(Number)
    return this.ready && (major > 0 || minor >= 2)
  }

  private inputs(): PlanInput {
    // Called once before the service exists (the first plan, from the profile alone).
    const h = (this.service as SpeechService | undefined)?.health
    const s = this.o.settings()
    const print = fingerprint(this.profile)
    return {
      profile: this.profile,
      fingerprint: print,
      bench: h?.bench && h.bench.fingerprint === print ? h.bench : undefined,
      cuda: !!h?.parts.gpu && !h.fallback,
      metal: !!h?.parts.mac,
      speakersCuda: h?.speakersDevice === 'cuda',
      speakers: !!h?.parts.speakers,
      downloaded: h?.downloaded ?? [],
      native: langCode(s.native),
      languages: myLanguages(s),
      prefer: s.speechPrefer,
      pins: { dictation: s.dictationModel, transcripts: s.transcriptsModel },
      ...(h ? { previous: { dictation: h.models.dictation.name, transcripts: h.models.transcripts.name } } : {}),
      nvidiaDriver: this.nvidiaDriver,
    }
  }

  /** Something the plan depends on changed: the plan again, sent to the engine when it differs; the window told. */
  changed(): void {
    this.replan()
    this.watchMeetings()
    this.o.onChange()
  }

  /**
   * A meeting can only come from the Chrome extension, and /health says
   * nothing of recordings: while the engine runs and the extension has said
   * hello, the library is asked every few seconds whether a meeting's
   * transcript is still "recording". A recording the extension left behind
   * is finished by the engine itself within minutes (jobs.py `_housekeeping`).
   */
  private watchMeetings(): void {
    const wanted = this.ready && !!this.service.health?.extension
    if (wanted && !this.meetingTimer) this.meetingTimer = setInterval(() => void this.lookForMeeting(), MEETING_PROBE_MS)
    if (wanted || !this.meetingTimer) return
    clearInterval(this.meetingTimer)
    this.meetingTimer = undefined
    this.setMeeting(false)
  }

  private async lookForMeeting(): Promise<void> {
    const r = await this.call<{ source: string; status: string }[]>('GET', '/transcripts')
    if (r.ok && Array.isArray(r.data)) this.setMeeting(r.data.some(t => t.source === 'meet' && t.status === 'recording'))
  }

  private setMeeting(on: boolean): void {
    if (on === this.meeting) return
    this.meeting = on
    this.o.onChange()
  }

  replan(): void {
    this.input = this.inputs()
    this.plan = planSpeech(this.input)
    if (!this.planned) {
      if (!this.ready) this.pushed = ''
      return
    }
    void this.push()
    this.autoTest()
    this.fetchProcessorDictation()
  }

  /**
   * Dictation leaves the card to the person's programs (2026-10-31): its
   * processor model (Parakeet, speechplan.ts `better`) downloads by itself
   * while the card's model dictates, and the plan moves to it once it is here.
   * Asked once, and again a while later should the download have failed.
   */
  private fetchProcessorDictation(): void {
    const better = this.plan.dictation.better
    if (this.plan.device !== 'cuda' || better?.device !== 'cpu' || better.downloaded || better.mb > AUTO_DOWNLOAD_MB) return
    const asked = this.fetchAsked.get(better.model)
    if (asked !== undefined && Date.now() - asked < FETCH_AGAIN_MS) return
    this.fetchAsked.set(better.model, Date.now())
    log(`speech: ${better.model} downloads for dictation on the processor, leaving the graphics card free`)
    void this.downloadModel(better.model)
  }

  /** What the engine is told of Kryakl's choices: the plan, and the words to spell (vocabulary.ts). */
  private engineSettings(): { plan: SpeechPlan['engine']; vocabulary: ReturnType<typeof vocabularyFor> } {
    return { plan: this.plan.engine, vocabulary: vocabularyFor(this.o.settings()) }
  }

  private async push(): Promise<void> {
    const body = this.engineSettings()
    const sent = JSON.stringify(body)
    if (sent === this.pushed || this.pushing) return
    this.pushing = true
    try {
      const r = await this.call('PUT', '/settings', body)
      if (r.ok) this.pushed = sent
    } finally {
      this.pushing = false
    }
    // The plan, or the words, may have moved on while they were being sent.
    if (JSON.stringify(this.engineSettings()) !== this.pushed) void this.push()
  }

  private get testing(): boolean {
    const t = this.service.health?.calibration?.state
    return t === 'waiting' || t === 'running'
  }

  /** The person agreed once: what is new (a model downloaded, another card) is measured by itself. */
  private autoTest(): void {
    if (!this.o.settings().speechTestAgreed || this.testing || this.service.health?.busy) return
    const runs = testRuns(this.input, this.plan)
    if (runs.length === 0) return
    const key = testKey(this.input, this.plan)
    if (this.autoTested.key === key && Date.now() - this.autoTested.at < RETEST_MS) return
    this.autoTested = { key, at: Date.now() }
    void this.test()
  }

  /** The speed test of the downloaded models not measured yet (all of them, `again`). */
  async test(again = false): Promise<SpeechResult> {
    const runs = testRuns(this.input, this.plan, again)
    const r = await this.call('POST', '/calibrate', { runs, expected: [this.input.native, 'en'] })
    this.changed()
    return r
  }

  /** The test to offer: the engine can run it, the person has not agreed, something is unmeasured, and "Not now" was not for this. */
  private testView(): SpeechView['test'] {
    const s = this.o.settings()
    const runs = this.planned ? testRuns(this.input, this.plan).length : 0
    const declined = s.speechTestDeclinedKey === testKey(this.input, this.plan) || Date.now() - s.speechTestDeclinedAt < DECLINE_MS
    return { offer: this.planned && !s.speechTestAgreed && runs > 0 && !declined && !this.testing, agreed: s.speechTestAgreed, runs }
  }

  /** What "Not now" remembers. */
  declineKey(): string {
    return testKey(this.input, this.plan)
  }

  downloadModel(model: string): Promise<SpeechResult> {
    return this.call('POST', `/models/${encodeURIComponent(model)}/download`)
  }

  /** A model nothing uses here, deleted; the engine refuses one in use. */
  removeModel(model: string): Promise<SpeechResult> {
    return this.call('DELETE', `/models/${encodeURIComponent(model)}`)
  }

  view(keysOk: SpeechView['keysOk']): SpeechView {
    const onCard = this.speakersOnCard()
    const gpuPlan = planSpeech({ ...this.input, cuda: true }).dictation.chosen
    const cpuPlan = planSpeech({ ...this.input, cuda: false }).dictation.chosen
    const first = (c: typeof gpuPlan) => ({ model: c.label, mb: c.downloaded ? 0 : c.mb, phrase: c.estimate })
    return {
      // The states main and the engine write in English, for the log, shown in the interface's language (i18n/engine.ts).
      pack: {
        ...this.pack.state,
        ...(this.pack.state.message ? { message: engineMessage(this.pack.state.message) } : {}),
        nvidia: this.plan.offers.gpu || (this.pack.state.parts.includes('gpu') && this.nvidiaDriver),
      },
      service: this.service.state,
      ...(this.service.trouble ? { trouble: engineMessage(this.service.trouble) } : {}),
      ...(this.service.health
        ? { health: this.service.health.diarizationMessage ? { ...this.service.health, diarizationMessage: engineMessage(this.service.health.diarizationMessage) } : this.service.health }
        : {}),
      port: this.service.port,
      extensionDir: this.o.extensionDir,
      extensionShipped: this.extensionShipped,
      download: { core: DOWNLOAD_MB.core, gpu: DOWNLOAD_MB.gpu, speakers: onCard ? DOWNLOAD_MB.speakersGpu : DOWNLOAD_MB.speakers },
      installed: { core: INSTALLED_MB.core, gpu: INSTALLED_MB.gpu, speakers: onCard ? INSTALLED_MB.speakersGpu : INSTALLED_MB.speakers },
      speakers: {
        on: onCard ? 'cuda' : 'cpu',
        sizes: {
          cuda: { download: DOWNLOAD_MB.speakersGpu, installed: INSTALLED_MB.speakersGpu },
          cpu: { download: DOWNLOAD_MB.speakers, installed: INSTALLED_MB.speakers },
        },
        // The engine says "ready" once the voices' model is on the disk, the part installed or not.
        model: this.service.health?.diarization === 'ready',
      },
      firstModel: { cpu: first(cpuPlan), cuda: first(gpuPlan) },
      disk: { freeMb: freeMb(this.o.root), drive: driveOf(this.o.root) },
      device: this.profile,
      plan: this.plan,
      test: this.testView(),
      keysOk,
    }
  }

  /**
   * Installs parts (with the ones there), then starts the service, sends it the plan and has it fetch the dictation model;
   * then `models` (the setup's picks), one after another.
   */
  async install(parts: SpeechPart[], models: string[] = []): Promise<void> {
    this.service.stop()
    try {
      await this.pack.install(parts)
    } finally {
      if (this.installed) {
        await this.service.start()
        void this.whenReady().then(async ready => {
          if (!ready) return
          this.replan()
          await this.push()
          await this.call('POST', '/dictate/prepare')
          await this.fetchModels(models)
        })
      }
    }
  }

  /** Each model downloaded in turn, the ones here skipped; a failure is logged and the next one goes on. */
  private async fetchModels(models: string[]): Promise<void> {
    for (const model of models) {
      if (this.service.health?.downloaded?.includes(model)) continue
      try {
        await this.fetchModel(model)
      } catch (error) {
        console.warn(`Kryakl: the speech model ${model} did not download`, error)
      }
    }
  }

  /**
   * Starts a model's download and waits until it is here. The engine downloads in the background and
   * only its download route says how a model stands, which starts the download again once one has
   * failed; so the first "missing" after "downloading" ends the wait (that second try runs on by itself).
   */
  private async fetchModel(model: string): Promise<void> {
    let seen = false
    for (let probe = 0; ; probe++) {
      const r = await this.call<{ state: 'ready' | 'missing' | 'downloading' }>('POST', `/models/${encodeURIComponent(model)}/download`)
      if (!r.ok) throw new Error(r.error)
      if (r.data.state === 'ready') return
      if (r.data.state === 'downloading') seen = true
      else if (seen) throw new Error('the download stopped')
      // A download that never shows as running after a few seconds failed at once.
      else if (probe >= MODEL_START_PROBES) throw new Error('the download did not start')
      await new Promise(resolve => setTimeout(resolve, MODEL_PROBE_MS))
    }
  }

  async remove(): Promise<void> {
    this.service.stop()
    await this.pack.remove()
  }

  /** A part off the disk (the speakers', the graphics card's); the engine starts again without it. */
  async removePart(part: SpeechPart): Promise<void> {
    this.service.stop()
    try {
      await this.pack.drop(part)
    } finally {
      if (this.installed) {
        await this.service.start()
        void this.whenReady().then(async ready => {
          if (!ready) return
          this.replan()
          await this.push()
        })
      }
    }
  }

  restart(): void {
    if (this.installed) this.service.restart()
  }

  /** A file's bytes from the engine (a transcript exported). */
  bytes(route: string): Promise<Buffer> {
    return this.service.bytes(route)
  }

  /** The engine's key, for the requests a page makes itself (a transcript's sound in an <audio>): main adds it, once the engine has proved itself. */
  get token(): string | undefined {
    return this.service.token
  }

  /** The port the engine is on now (it moves on when its own is taken). */
  get port(): number {
    return this.service.port
  }

  call<T = unknown>(method: string, route: string, body?: unknown): Promise<SpeechResult<T>> {
    return this.service.call<T>(method, route, body)
  }

  /** Resolves once the service answers, or after `ms` regardless. */
  async whenReady(ms = 60_000): Promise<boolean> {
    const until = Date.now() + ms
    while (!this.ready && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 300))
    return this.ready
  }

  dispose(): void {
    clearInterval(this.meetingTimer)
    this.service.dispose()
  }
}

/** The version in the extension's manifest.json; empty when it cannot be read. */
function shippedVersion(dir: string): string {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as { version?: unknown }
    return typeof m.version === 'string' ? m.version : ''
  } catch {
    return ''
  }
}
