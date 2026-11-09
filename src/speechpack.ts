// The speech engine, installed in parts the first time a feature needs one
// (engine/pyproject.toml has the parts as extras):
//   core      speech to text, on the CPU          (Dictate, Transcribe)
//   gpu       the same on an NVIDIA card          (offered when the system has one)
//   speakers  who spoke when                      (Transcribe's speakers, meetings)
//             on a Mac no packages: FluidAudio's CoreML models (speakers-manifest.json),
//             run by the helper vendor/speakers-mac (engine/diarize.py)
// uv, Astral's Python manager, is downloaded once (pinned, SHA-256 checked) and
// installs a Python of its own and the packages into %LOCALAPPDATA%\Tyts\speech,
// outside the app's folder, so an update of Tyts keeps them. The download
// cache goes when an install is done; the environment stays.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { fetchPinned } from './download'
import { log } from './log'
import { OLD_LOCAL_FOLDERS } from './oldfolder'
import speakersManifest from './speakers-manifest.json'

export type SpeechPart = 'core' | 'gpu' | 'speakers'

const WIN = process.platform === 'win32'

/** uv 0.13.0 for Windows x64 or a Mac on Apple silicon, as Astral publishes it with its .sha256. */
export const UV = WIN
  ? {
      version: '0.13.0',
      url: 'https://github.com/astral-sh/uv/releases/download/0.13.0/uv-x86_64-pc-windows-msvc.zip',
      bytes: 15_722_003,
      sha256: '088962f9e7b7bd9ea740c04c650b2a21c8928c345bd99ac24350dc924dba656c',
    }
  : {
      version: '0.13.0',
      url: 'https://github.com/astral-sh/uv/releases/download/0.13.0/uv-aarch64-apple-darwin.tar.gz',
      bytes: 14_692_549,
      sha256: 'a9c1b29002cf3c83f07fa9cd8a887a3be0107d90e23189721221e7257db8e3d6',
    }

/** What each part downloads, roughly, in MB: what an install costs, and how far it is. */
export const DOWNLOAD_MB = { core: 160, gpu: 1150, speakers: 250, speakersGpu: 3000 }
/** What each part takes on the disk once installed, roughly, in MB (engine/pyproject.toml). */
export const INSTALLED_MB = { core: 330, gpu: 1700, speakers: 900, speakersGpu: 4000 }
/** Who spoke when on a Mac: its models' download, which is also what they take on the disk, in MB (speakers-manifest.json). */
export const SPEAKERS_MAC_MB = Math.round(speakersManifest.files.reduce((n, f) => n + f.size, 0) / 2 ** 20)

export type SpeechPackState = {
  status: 'absent' | 'installing' | 'ready' | 'failed' | 'removing'
  /** Installed now. */
  parts: SpeechPart[]
  /** Being installed (all of them, the installed ones too: uv makes the environment match). */
  installing?: SpeechPart[]
  /** models: a Mac's speakers models (speakers-manifest.json). */
  step?: 'tool' | 'packages' | 'models'
  /** 0…1 of the step. */
  progress?: number
  message?: string
  /** The system has an NVIDIA card, so the gpu part is worth offering. */
  nvidia: boolean
  /** Where the installed speakers part runs: PyTorch for the card or for the processor. */
  speakersOn?: 'cuda' | 'cpu'
}

/**
 * The extras uv installs for these parts. Speakers on the card carry the CUDA
 * libraries themselves (speakers-gpu, ~4 GB); a card with too little memory for
 * both models keeps Whisper on it and the speakers on the processor (gpu + speakers).
 */
export function extrasFor(parts: SpeechPart[], gpuSpeakers = true, platform = `${process.platform}-${process.arch}`): string[] {
  // A Mac on Apple silicon gets Whisper on its graphics (mlx-whisper) with core: the extra is a few packages and the model is downloaded only when used.
  // A Mac's speakers are no packages (2026-11-09: FluidAudio's models, `SpeechPack.fetchSpeakers`), and it has no NVIDIA card.
  if (platform.startsWith('darwin')) return platform === 'darwin-arm64' ? ['mac'] : []
  return gpuExtras(parts, gpuSpeakers)
}

function gpuExtras(parts: SpeechPart[], gpuSpeakers: boolean): string[] {
  const set = new Set(parts)
  if (set.has('speakers')) {
    if (!set.has('gpu')) return ['speakers']
    return gpuSpeakers ? ['speakers-gpu'] : ['gpu', 'speakers']
  }
  return set.has('gpu') ? ['gpu'] : []
}

/** Where these extras run the speakers: the card, the processor, or nowhere. */
export function speakersOf(extras: readonly string[]): 'cuda' | 'cpu' | undefined {
  if (extras.includes('speakers-gpu')) return 'cuda'
  return extras.includes('speakers') ? 'cpu' : undefined
}

function sizeOf(table: typeof DOWNLOAD_MB, parts: SpeechPart[], gpuSpeakers: boolean, platform: string): number {
  const extras = extrasFor(parts, gpuSpeakers, platform)
  let mb = table.core
  if (platform.startsWith('darwin') && parts.includes('speakers')) mb += SPEAKERS_MAC_MB
  if (extras.includes('speakers-gpu')) mb += table.speakersGpu
  if (extras.includes('speakers')) mb += table.speakers
  if (extras.includes('gpu')) mb += table.gpu
  return mb
}

/** The download for these parts, in MB. */
export function downloadMb(parts: SpeechPart[], gpuSpeakers = true, platform = `${process.platform}-${process.arch}`): number {
  return sizeOf(DOWNLOAD_MB, parts, gpuSpeakers, platform)
}

/** What these parts take on the disk once installed, in MB. */
export function installedMb(parts: SpeechPart[], gpuSpeakers = true, platform = `${process.platform}-${process.arch}`): number {
  return sizeOf(INSTALLED_MB, parts, gpuSpeakers, platform)
}

/** Parts in their fixed order, without repeats, core always first. */
export function normalizeParts(parts: SpeechPart[]): SpeechPart[] {
  const set = new Set<SpeechPart>(['core', ...parts])
  return (['core', 'gpu', 'speakers'] as const).filter(p => set.has(p))
}

export type Run = (exe: string, args: string[], env: Record<string, string>) => { exit: Promise<number>; output: () => string }

export type SpeechPackOptions = {
  /** %LOCALAPPDATA%\Tyts\speech */
  root: string
  /** The engine's source: app.py, pyproject.toml, uv.lock. */
  engineDir: string
  nvidia: boolean
  /** Speakers go on the card too (it has the memory for both models); else Whisper alone does. */
  gpuSpeakers?: () => boolean
  open: (url: string) => Promise<AsyncIterable<Uint8Array>>
  /**
   * uv's own download cache on this computer (another program's, or a developer's), when there is one: the
   * packages already in it are not downloaded again, and it is left as it is after an install.
   */
  sharedCache?: string
  run?: Run
  /** `${process.platform}-${process.arch}` unless a test says: on a Mac the speakers are models downloaded pinned, not packages. */
  platform?: string
  onChange: () => void
}

type Marker = { parts: SpeechPart[]; lock: string; extras?: string[] }

export class SpeechPack {
  private status: SpeechPackState['status']
  private installing: SpeechPart[] | undefined
  private step: SpeechPackState['step']
  private progress = 0
  private message: string | undefined
  private running: Promise<void> | undefined

  constructor(private readonly o: SpeechPackOptions) {
    this.status = this.marker() ? 'ready' : 'absent'
  }

  private get platform(): string {
    return this.o.platform ?? `${process.platform}-${process.arch}`
  }

  private get mac(): boolean {
    return this.platform.startsWith('darwin')
  }

  /** A Mac's speakers models (engine/diarize.py MAC_MODELS); only ever there whole, moved in once all of them are checked. */
  get speakersDir(): string {
    return path.join(this.models, 'speakers-mac')
  }

  /** The parts installed: on a Mac the speakers are their models' folder, whatever an older marker says. */
  private parts(m: Marker | undefined): SpeechPart[] {
    if (!this.mac) return m?.parts ?? []
    return [...(m?.parts ?? []).filter(p => p !== 'speakers'), ...(fs.existsSync(this.speakersDir) ? (['speakers'] as const) : [])]
  }

  get state(): SpeechPackState {
    const m = this.marker()
    const on = !this.mac && m?.parts.includes('speakers') ? (m.extras ? speakersOf(m.extras) : undefined) ?? 'cpu' : undefined
    return {
      status: this.status,
      parts: this.parts(m),
      ...(on ? { speakersOn: on } : {}),
      ...(this.installing ? { installing: this.installing } : {}),
      ...(this.step ? { step: this.step, progress: this.progress } : {}),
      ...(this.message ? { message: this.message } : {}),
      nvidia: this.o.nvidia,
    }
  }

  get python(): string {
    return WIN ? path.join(this.o.root, 'env', 'Scripts', 'python.exe') : path.join(this.o.root, 'env', 'bin', 'python')
  }

  get models(): string {
    return path.join(this.o.root, 'models')
  }

  private get uvExe(): string {
    return path.join(this.o.root, 'uv', UV.version, WIN ? 'uv.exe' : 'uv')
  }

  private marker(): Marker | undefined {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(this.o.root, 'installed.json'), 'utf8')) as Marker
      return Array.isArray(m.parts) && fs.existsSync(this.python) ? m : undefined
    } catch {
      return undefined
    }
  }

  private lockHash(): string {
    try {
      return createHash('sha256').update(fs.readFileSync(path.join(this.o.engineDir, 'uv.lock'))).digest('hex')
    } catch {
      return ''
    }
  }

  /** Tyts was updated with other packages for the engine: the same parts are installed again (quick, mostly kept). */
  get stale(): boolean {
    const m = this.marker()
    return !!m && m.lock !== this.lockHash()
  }

  /** Installs these parts (with the ones already there); a second call while one runs waits for it. */
  install(parts: SpeechPart[]): Promise<void> {
    if (this.running) return this.running
    const wanted = normalizeParts([...(this.marker()?.parts ?? []), ...parts])
    if (this.mac) {
      // The speakers' models download only when asked for, never with a sync after an update.
      const uv = wanted.filter(p => p !== 'speakers')
      this.running = this.installMac(uv, parts.includes('speakers')).finally(() => (this.running = undefined))
      return this.running
    }
    // Only a request for the speakers may move them (card or processor); a sync after an update keeps them where they are.
    const extras = this.extras(wanted, parts.includes('speakers'))
    this.running = this.installAll(wanted, extras).finally(() => (this.running = undefined))
    return this.running
  }

  /**
   * A Mac: the packages synced unless they are already as wanted (the speakers alone asked for), then the
   * speakers' models when asked for and not here yet.
   */
  private async installMac(parts: SpeechPart[], speakers: boolean): Promise<void> {
    const m = this.marker()
    const synced = !!m && !this.stale && m.parts.filter(p => p !== 'speakers').join() === parts.join()
    const models = speakers && !fs.existsSync(this.speakersDir)
    if (!synced || !models) await this.installAll(parts, this.extras(parts), models ? [...parts, 'speakers'] : parts)
    if (!models) return
    this.installing = [...parts, 'speakers']
    this.message = undefined
    try {
      this.set('installing', 'models', 0)
      await this.fetchSpeakers()
      this.installing = undefined
      this.set('ready', undefined, 1)
    } catch (error) {
      this.installing = undefined
      this.message = error instanceof Error ? error.message : String(error)
      this.set(this.marker() ? 'ready' : 'failed', undefined, 0)
      throw error
    }
  }

  /**
   * The speakers' models (speakers-manifest.json), each file pinned by its size and SHA-256, into a folder of
   * their own beside the place; moved in only once every file is checked, so half a download never looks installed.
   */
  private async fetchSpeakers(): Promise<void> {
    const part = `${this.speakersDir}.part`
    fs.rmSync(part, { recursive: true, force: true })
    const total = speakersManifest.files.reduce((n, f) => n + f.size, 0)
    let done = 0
    try {
      for (const file of speakersManifest.files) {
        const target = path.join(part, ...file.path.split('/'))
        fs.mkdirSync(path.dirname(target), { recursive: true })
        await fetchPinned(file, target, 'The speakers model', got => this.tick((done + got) / total), this.o.open)
        done += file.size
      }
      fs.rmSync(this.speakersDir, { recursive: true, force: true })
      fs.renameSync(part, this.speakersDir)
    } catch (error) {
      fs.rmSync(part, { recursive: true, force: true })
      throw error
    }
  }

  /**
   * A Mac's leftovers of the speakers before 2026-11-09 (pyannote's voices model, and its packages but torch,
   * which mlx-whisper keeps): the model's folder removed and the packages synced without them. Only when asked (Storage).
   */
  dropOld(): Promise<void> {
    if (this.running) return this.running
    fs.rmSync(path.join(this.models, 'diarization'), { recursive: true, force: true })
    const m = this.marker()
    if (!m || leftoverPackages(this.sitePackages).length === 0) return Promise.resolve()
    const parts = m.parts.filter(p => p !== 'speakers')
    this.running = this.installAll(parts, this.extras(parts)).finally(() => (this.running = undefined))
    return this.running
  }

  /** The environment's site-packages: Windows' layout, or a Mac's (lib/python3.12). */
  get sitePackages(): string {
    return WIN ? path.join(this.o.root, 'env', 'Lib', 'site-packages') : path.join(this.o.root, 'env', 'lib', 'python3.12', 'site-packages')
  }

  /** A part off the disk (the speakers', the graphics card's): the packages synced without it; the program and the models stay. */
  drop(part: SpeechPart): Promise<void> {
    if (this.running) return this.running
    // A Mac's speakers are their models alone: that folder goes, nothing is synced.
    if (this.mac && part === 'speakers') {
      fs.rmSync(this.speakersDir, { recursive: true, force: true })
      this.o.onChange()
      return Promise.resolve()
    }
    const m = this.marker()
    if (!m || part === 'core' || !m.parts.includes(part)) return Promise.resolve()
    const parts = m.parts.filter(p => p !== part)
    this.running = this.installAll(parts, extrasFor(parts, this.o.gpuSpeakers?.() ?? true, this.platform)).finally(() => (this.running = undefined))
    return this.running
  }

  private async installAll(parts: SpeechPart[], extras: string[], shown: SpeechPart[] = parts): Promise<void> {
    this.installing = shown
    this.message = undefined
    try {
      this.set('installing', 'tool', 0)
      await this.ensureUv()
      this.set('installing', 'packages', 0)
      await this.sync(parts, extras)
      fs.writeFileSync(path.join(this.o.root, 'installed.json'), JSON.stringify({ parts, lock: this.lockHash(), extras } satisfies Marker))
      // Only Tyts's own cache goes; a shared one stays as its owner keeps it.
      fs.rmSync(path.join(this.o.root, 'cache'), { recursive: true, force: true })
      this.installing = undefined
      // A Mac with its speakers' models still to come stays installing.
      if (shown === parts) this.set(this.marker() ? 'ready' : 'failed', undefined, 1)
    } catch (error) {
      this.installing = undefined
      this.message = error instanceof Error ? error.message : String(error)
      this.set(this.marker() ? 'ready' : 'failed', undefined, 0)
      throw error
    }
  }

  private async ensureUv(): Promise<void> {
    if (fs.existsSync(this.uvExe)) return
    const dir = path.dirname(this.uvExe)
    fs.mkdirSync(dir, { recursive: true })
    const zip = path.join(dir, 'uv.zip')
    await fetchPinned({ url: UV.url, size: UV.bytes, sha256: UV.sha256 }, zip, 'The Python manager', got => this.tick(got / UV.bytes), this.o.open)
    // Windows' own tar reads zip files; the Mac's archive keeps uv in a folder of its own.
    const tar = WIN ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : '/usr/bin/tar'
    const unzip = this.runner(tar, ['-xf', zip, '-C', dir, ...(WIN ? [] : ['--strip-components', '1'])], {})
    if ((await unzip.exit) !== 0 || !fs.existsSync(this.uvExe)) throw new Error(`Could not unpack the Python manager: ${unzip.output()}`)
    fs.rmSync(zip, { force: true })
  }

  /**
   * The extras for these parts: as installed before when the parts are the same (an update keeps them),
   * unless the speakers were asked for and are now wanted elsewhere (card or processor); else as this card can take.
   */
  private extras(parts: SpeechPart[], moveSpeakers = false): string[] {
    const m = this.marker()
    const wanted = extrasFor(parts, this.o.gpuSpeakers?.() ?? true, this.platform)
    if (m?.extras && m.parts.join() === parts.join() && (!moveSpeakers || speakersOf(m.extras) === speakersOf(wanted))) return m.extras
    return wanted
  }

  /**
   * The environment's python.exe is uv's launcher, which keeps the absolute path of the Python it starts in its own
   * file: a speech folder moved from OldName's or Altype's leaves it on the old place, and the engine never starts
   * ("uv trampoline failed to spawn Python child process", 0.15.0). True when it names a Python outside this folder.
   */
  get moved(): boolean {
    try {
      const exe = fs.readFileSync(this.python)
      if (!exe.includes(Buffer.from('UV_PYTHON_PATH', 'utf16le'))) return false
      const text = exe.toString('latin1').toLowerCase()
      const here = Buffer.from(path.join(this.o.root, 'python') + path.sep, 'utf8').toString('latin1').toLowerCase()
      // Only a launcher that names an old name's folder: a clean install is never touched, whatever its path holds.
      return !text.includes(here) && OLD_LOCAL_FOLDERS.some(name => text.includes(path.join(name.toLowerCase(), 'speech', 'python') + path.sep))
    } catch {
      return false
    }
  }

  /**
   * The launchers made again for this folder (`uv venv --allow-existing`, the Python pyvenv.cfg names, which the
   * move set right): the packages stay and nothing downloads. Should uv refuse, the environment is made again from
   * the download cache (a sync, the models kept).
   */
  async relocate(): Promise<void> {
    const env = path.join(this.o.root, 'env')
    const cfg = fs.readFileSync(path.join(env, 'pyvenv.cfg'), 'utf8')
    const home = /^home\s*=\s*(.+?)\s*$/m.exec(cfg)?.[1]
    const prompt = /^prompt\s*=\s*(.+?)\s*$/m.exec(cfg)?.[1]
    const job = home
      ? this.runner(this.uvExe, ['venv', '--allow-existing', ...(prompt ? ['--prompt', prompt] : []), '--python', path.join(home, 'python.exe'), env], this.uvEnv())
      : undefined
    // uv done is enough: a check that still finds the old place must not cost the person a reinstall at every start.
    if (job && (await job.exit) === 0) return
    log(`speech: could not set the launcher right (${job?.output().trim().split('\n').at(-1) ?? 'no home in pyvenv.cfg'}): installing the environment again`)
    const parts = this.marker()?.parts ?? ['core']
    fs.rmSync(env, { recursive: true, force: true })
    await this.install(parts)
  }

  private uvEnv(): Record<string, string> {
    const root = this.o.root
    const shared = this.o.sharedCache && fs.existsSync(this.o.sharedCache) ? this.o.sharedCache : undefined
    return {
      UV_PROJECT_ENVIRONMENT: path.join(root, 'env'),
      UV_PYTHON_INSTALL_DIR: path.join(root, 'python'),
      UV_CACHE_DIR: shared ?? path.join(root, 'cache'),
      UV_PYTHON_PREFERENCE: 'only-managed',
      UV_NO_PROGRESS: '1',
    }
  }

  private async sync(parts: SpeechPart[], extras: string[]): Promise<void> {
    const root = this.o.root
    const shared = this.o.sharedCache && fs.existsSync(this.o.sharedCache) ? this.o.sharedCache : undefined
    const cache = shared ?? path.join(root, 'cache')
    const env = path.join(root, 'env')
    const args = ['sync', '--frozen', '--no-dev', '--project', this.o.engineDir, '--python', '3.12', ...extras.flatMap(e => ['--extra', e])]
    const job = this.runner(this.uvExe, args, this.uvEnv())
    // uv shows no numbers when nobody watches it; the download cache growing against the expected size does,
    // or, with a shared cache that is big already, the environment growing towards its installed size.
    const onCard = !extras.includes('speakers') || extras.includes('speakers-gpu')
    const expected = downloadMb(parts, onCard, this.platform) * 1e6
    const before = shared ? folderBytes(env) : 0
    const target = installedMb(parts, onCard, this.platform) * 1e6
    const done = () => (shared ? (folderBytes(env) - before) / Math.max(target - before, 1e8) : folderBytes(cache) / expected)
    const timer = setInterval(() => this.tick(Math.max(0, Math.min(0.97, done()))), 1500)
    try {
      const code = await job.exit
      if (code !== 0) throw new Error(`Installing the speech engine failed (${code}): ${job.output().trim().split('\n').slice(-3).join(' ')}`)
    } finally {
      clearInterval(timer)
    }
  }

  /** Everything the engine installed, models too; the space comes back. */
  async remove(): Promise<void> {
    if (this.running) throw new Error('An install is running')
    this.set('removing', undefined, 0)
    for (const name of ['installed.json', 'env', 'python', 'uv', 'cache', 'models', 'pycache']) {
      fs.rmSync(path.join(this.o.root, name), { recursive: true, force: true })
    }
    this.set('absent', undefined, 0)
  }

  /** The environment, the models and what else the engine keeps, in bytes. */
  diskBytes(): number {
    return folderBytes(this.o.root)
  }

  private runner(exe: string, args: string[], env: Record<string, string>): ReturnType<Run> {
    return (this.o.run ?? spawnRun)(exe, args, env)
  }

  private shown = 0

  private tick(progress: number): void {
    // Every whole percent, not every chunk.
    if (Math.abs(progress - this.shown) < 0.01) return
    this.shown = progress
    this.progress = progress
    this.o.onChange()
  }

  private set(status: SpeechPackState['status'], step: SpeechPackState['step'], progress: number): void {
    this.status = status
    this.step = step
    this.progress = progress
    this.shown = progress
    this.o.onChange()
  }
}

function spawnRun(exe: string, args: string[], env: Record<string, string>): ReturnType<Run> {
  const child = spawn(exe, args, { env: { ...process.env, ...env }, windowsHide: true })
  let output = ''
  const keep = (chunk: Buffer) => (output = (output + chunk.toString('utf8')).slice(-4000))
  child.stdout.on('data', keep)
  child.stderr.on('data', keep)
  return {
    exit: new Promise(resolve => {
      child.on('error', error => (keep(Buffer.from(String(error))), resolve(-1)))
      child.on('close', code => resolve(code ?? -1))
    }),
    output: () => output,
  }
}

/** A folder's size, walked; missing is 0. */
export function folderBytes(dir: string): number {
  let total = 0
  const stack = [dir]
  while (stack.length) {
    const here = stack.pop()!
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(here, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = path.join(here, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else {
        try {
          total += fs.statSync(full).size
        } catch {
          // gone meanwhile
        }
      }
    }
  }
  return total
}

/** Who spoke when's packages from before 2026-11-09 left on a Mac (pyannote and what it brought), torch not: mlx-whisper needs it. */
export function leftoverPackages(site: string): string[] {
  let names: string[]
  try {
    names = fs.readdirSync(site)
  } catch {
    return []
  }
  return names.filter(n => /^(pyannote|lightning|pytorch_|asteroid|torchaudio|torchmetrics|torchcodec|torch_audiomentations|torch_pitch_shift|julius|opentelemetry)/i.test(n)).map(n => path.join(site, n))
}

/** An NVIDIA card's driver puts nvidia-smi into System32. */
export function hasNvidia(): boolean {
  return fs.existsSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'nvidia-smi.exe'))
}
