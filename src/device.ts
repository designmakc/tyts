// What this computer is, for choosing the speech models (speechplan.ts): its
// processor, memory, graphics cards and whether it is a laptop. Node knows the
// processor and the memory at once; the cards, their real memory and the
// battery come from Windows (WMI and the display drivers' registry keys, through
// Windows PowerShell as ocr.ts reads text) and from nvidia-smi, which NVIDIA's
// driver puts into System32. Kept in device.json beside settings.json, looked at
// again at each start: a new card or more memory changes the choice.

import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { vendorOf, type DeviceProfile, type Gpu } from './hardware'
import type { LlmModel } from './settings'
import { POWERSHELL } from './system32'

export { mainCard, nvidiaCard, vendorOf, type DeviceProfile, type Gpu, type GpuVendor } from './hardware'

const SCRIPT = `
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cards = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = [string]$_.Name; company = [string]$_.AdapterCompatibility; driver = [string]$_.DriverVersion; ram = [double]$_.AdapterRAM } })
$memory = @(Get-ChildItem 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}' | ForEach-Object {
  $p = Get-ItemProperty -LiteralPath $_.PSPath
  $q = $p.'HardwareInformation.qwMemorySize'
  if ($q -eq $null) { $q = $p.'HardwareInformation.MemorySize'; if ($q -is [byte[]]) { $q = [BitConverter]::ToUInt32($q, 0) } }
  if ($p.DriverDesc -and $q) { @{ name = [string]$p.DriverDesc; bytes = [double]$q } }
})
$battery = @(Get-CimInstance Win32_Battery).Count -gt 0
$chassis = @((Get-CimInstance Win32_SystemEnclosure | Select-Object -First 1).ChassisTypes | ForEach-Object { [int]$_ })
@{ cpu = [string]$cpu.Name; cores = [int]$cpu.NumberOfCores; threads = [int]$cpu.NumberOfLogicalProcessors; cards = $cards; memory = $memory; battery = $battery; chassis = $chassis } | ConvertTo-Json -Depth 4 -Compress
`

/** SMBIOS chassis types of laptops: portable, laptop, notebook, hand held, sub notebook, tablet, convertible, detachable. */
const PORTABLE = new Set([8, 9, 10, 11, 14, 30, 31, 32])
/** Desktops, towers, all-in-ones, mini PCs: a battery here is a UPS. */
const DESKTOP = new Set([3, 4, 5, 6, 7, 13, 15, 16, 24, 35, 36])

/** Display adapters that are not cards: Windows' fallback, remote desktops, virtual screens. */
const NOT_A_CARD = /basic (display|render)|remote|virtual|mirror|parsec|citrix|meta|indirect|spacedesk|displaylink/i

/** What Node alone knows, at once: the processor (its physical cores guessed as half the threads) and the memory. */
export function quickProfile(): DeviceProfile {
  const cpus = os.cpus()
  const threads = Math.max(1, os.availableParallelism?.() ?? cpus.length)
  return {
    cpu: { name: (cpus[0]?.model ?? 'processor').trim(), cores: Math.max(1, Math.floor(threads / 2)), threads },
    ramGb: Math.round(os.totalmem() / 2 ** 30),
    gpus: [],
    laptop: false,
    at: 0,
  }
}

type WindowsAnswer = {
  cpu?: string
  cores?: number
  threads?: number
  cards?: { name?: string; company?: string; driver?: string; ram?: number }[] | { name?: string; company?: string; driver?: string; ram?: number }
  memory?: { name?: string; bytes?: number }[] | { name?: string; bytes?: number }
  battery?: boolean
  chassis?: number[] | number
}

/** By the case Windows names; a battery decides only when the case says nothing (a UPS shows as a battery too). */
function isLaptop(a: WindowsAnswer): boolean {
  const chassis = listOf(a.chassis)
  if (chassis.some(c => PORTABLE.has(c))) return true
  if (chassis.some(c => DESKTOP.has(c))) return false
  return !!a.battery
}

const listOf = <T>(v: T[] | T | undefined): T[] => (Array.isArray(v) ? v : v ? [v] : [])

/** The PowerShell script's answer, with each card's real memory from its driver's key (WMI's stops at 4 GB). */
export function parseWindows(text: string, base: DeviceProfile = quickProfile()): DeviceProfile {
  const a = JSON.parse(text) as WindowsAnswer
  const memory = listOf(a.memory)
  const gpus: Gpu[] = []
  for (const card of listOf(a.cards)) {
    const name = (card.name ?? '').trim()
    if (!name || NOT_A_CARD.test(name)) continue
    const own = memory.find(m => (m.name ?? '').trim() === name)?.bytes ?? card.ram ?? 0
    gpus.push({ name, vendor: vendorOf(name, card.company), vramMb: Math.round(own / 2 ** 20), driver: (card.driver ?? '').trim() })
  }
  const threads = a.threads && a.threads > 0 ? a.threads : base.cpu.threads
  return {
    cpu: { name: (a.cpu ?? '').trim() || base.cpu.name, cores: a.cores && a.cores > 0 ? a.cores : base.cpu.cores, threads },
    ramGb: base.ramGb,
    gpus,
    laptop: isLaptop(a),
    at: Date.now(),
  }
}

/** nvidia-smi's CSV lines: name, memory (MiB), driver, compute capability (newer drivers only). */
export function parseNvidiaSmi(text: string): { name: string; vramMb: number; driver: string; computeCap?: number }[] {
  return text
    .split(/\r?\n/)
    .map(line => line.split(',').map(s => s.trim()))
    .filter(f => f.length >= 3 && f[0])
    .map(([name, memory, driver, cap]) => {
      const computeCap = cap !== undefined ? Number(cap) : NaN
      return { name: name!, vramMb: Number(memory) || 0, driver: driver ?? '', ...(Number.isFinite(computeCap) ? { computeCap } : {}) }
    })
}

/** NVIDIA's own numbers over Windows' for its cards (matched by name, else in order). */
export function withNvidia(profile: DeviceProfile, smi: ReturnType<typeof parseNvidiaSmi>): DeviceProfile {
  if (smi.length === 0) return profile
  const left = [...smi]
  const gpus = profile.gpus.map(g => {
    if (g.vendor !== 'nvidia') return g
    const i = Math.max(0, left.findIndex(s => s.name === g.name))
    const s = left.splice(i, 1)[0]
    return s ? { ...g, vramMb: s.vramMb || g.vramMb, driver: s.driver || g.driver, ...(s.computeCap ? { computeCap: s.computeCap } : {}) } : g
  })
  // A card WMI did not list (rare) still counts.
  for (const s of left) gpus.push({ name: s.name, vendor: 'nvidia', vramMb: s.vramMb, driver: s.driver, ...(s.computeCap ? { computeCap: s.computeCap } : {}) })
  return { ...profile, gpus }
}

/** Changes when the speed numbers stop holding: another processor, memory, card or a new driver's major version. */
export function fingerprint(p: DeviceProfile): string {
  const cards = p.gpus.map(g => `${g.name}:${g.driver.split('.')[0]}`).join(',')
  return createHash('sha1').update(`${p.cpu.name}|${p.cpu.threads}|${p.ramGb}|${cards}`).digest('hex').slice(0, 16)
}

function powershell(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(POWERSHELL, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(SCRIPT, 'utf16le').toString('base64')], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    })
    let out = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (out += chunk))
    const timer = setTimeout(() => child.kill(), 20_000)
    child.on('error', error => (clearTimeout(timer), reject(error)))
    child.on('exit', code => (clearTimeout(timer), out.trim() ? resolve(out.trim()) : reject(new Error(`PowerShell answered nothing (${code})`))))
  })
}

const nvidiaSmiExe = () => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'nvidia-smi.exe')

/** The memory used on the NVIDIA cards now, in MB, all of them together; undefined without nvidia-smi. */
export function cardMemoryUsed(): Promise<number | undefined> {
  return cardMemory('memory.used')
}

/** The graphics cards' free memory in MB, all together (nvidia-smi), or undefined without it. */
export function cardMemoryFree(): Promise<number | undefined> {
  return cardMemory('memory.free')
}

function cardMemory(field: 'memory.used' | 'memory.free'): Promise<number | undefined> {
  const exe = nvidiaSmiExe()
  if (!fs.existsSync(exe)) return Promise.resolve(undefined)
  return new Promise(resolve =>
    execFile(exe, [`--query-gpu=${field}`, '--format=csv,noheader,nounits'], { windowsHide: true, timeout: 10_000 }, (error, stdout) => {
      const mb = error ? [] : stdout.split(/\r?\n/).filter(line => line.trim()).map(Number).filter(n => Number.isFinite(n) && n >= 0)
      resolve(mb.length ? mb.reduce((a, b) => a + b, 0) : undefined)
    }),
  )
}

function nvidiaSmi(): Promise<string> {
  const exe = nvidiaSmiExe()
  if (!fs.existsSync(exe)) return Promise.resolve('')
  const ask = (fields: string) =>
    new Promise<string>(resolve =>
      execFile(exe, [`--query-gpu=${fields}`, '--format=csv,noheader,nounits'], { windowsHide: true, timeout: 10_000 }, (error, stdout) => resolve(error ? '' : stdout)),
    )
  // compute_cap is a field of drivers from 2021 on; an older one refuses the whole query.
  return ask('name,memory.total,driver_version,compute_cap').then(text => text || ask('name,memory.total,driver_version'))
}

const SYSCTL_KEYS = ['machdep.cpu.brand_string', 'hw.physicalcpu', 'hw.logicalcpu', 'hw.memsize', 'hw.model', 'hw.perflevel0.physicalcpu', 'hw.perflevel1.physicalcpu']

/**
 * A Mac as sysctl describes it (`sysctl` with SYSCTL_KEYS, "key: value" lines). The graphics is
 * Apple's chip, sharing the computer's memory and no CUDA, so it is named and counted as no card's
 * memory: speech and the models run on the processor.
 */
export function parseMac(text: string, base: DeviceProfile = quickProfile()): DeviceProfile {
  const v: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf(':')
    if (at > 0) v[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  const n = (key: string) => Number(v[key]) || 0
  const threads = n('hw.logicalcpu') || base.cpu.threads
  // ponytail: an efficiency core counted as half a performance core (an M1's 4 + 4 as 6), a guess
  // for cpuFactor; the speed test (POST /calibrate) replaces it with this Mac's own numbers.
  const p = n('hw.perflevel0.physicalcpu')
  const cores = p ? p + Math.floor(n('hw.perflevel1.physicalcpu') / 2) : n('hw.physicalcpu') || base.cpu.cores
  const name = v['machdep.cpu.brand_string'] || base.cpu.name
  return {
    cpu: { name, cores, threads },
    ramGb: n('hw.memsize') ? Math.round(n('hw.memsize') / 2 ** 30) : base.ramGb,
    gpus: /^apple/i.test(name) ? [{ name: `${name} GPU`, vendor: 'other', vramMb: 0, driver: '' }] : [],
    laptop: /^macbook/i.test(v['hw.model'] ?? ''),
    at: Date.now(),
  }
}

function sysctl(): Promise<string> {
  return new Promise(resolve =>
    // Unknown keys (perflevel on an Intel Mac) are skipped by -i; the known ones still answer.
    execFile('/usr/sbin/sysctl', ['-i', ...SYSCTL_KEYS], { timeout: 10_000 }, (_error, stdout) => resolve(stdout ?? '')),
  )
}

/** This computer as Windows and NVIDIA's driver (or a Mac's sysctl) describe it; what Node knows when they do not answer. */
export async function probeDevice(): Promise<DeviceProfile> {
  const base = quickProfile()
  if (process.platform === 'darwin') return parseMac(await sysctl(), base)
  if (process.platform !== 'win32') return base
  let profile = base
  try {
    profile = parseWindows(await powershell(), base)
  } catch (error) {
    console.warn('Tyts: could not ask Windows about this computer', error)
  }
  return withNvidia(profile, parseNvidiaSmi(await nvidiaSmi()))
}

/** How fast the natural voice makes speech here: seconds per second of sound, over `n` sentences. */
export type VoiceSpeed = { rtf: number; n: number }
/** How fast a local model works here, in seconds, the latest few of each: a sentence translated and a text checked on the model already loaded, and loading it. */
/** `card`: the MB of the graphics card the model held while loaded, measured once (nvidia-smi, before and after it was let go). */
/** `reply`: the duck's answer in Talk (duck.ts), kept once there is one. */
export type ModelSpeed = { sentence: number[]; text: number[]; start: number[]; reply?: number[]; card?: number }
export type ModelSpeeds = Partial<Record<LlmModel, ModelSpeed>>
/** Until 0.10.1: TranslateGemma's levels, and the checker (Gemma 4 E4B, Accurate now) with its seconds a text in `sentence`. */
type OldSpeeds = Partial<Record<'accurate' | 'most' | 'check', { sentence: number[]; start: number[] }>>
type DeviceFile = { profile?: DeviceProfile; voice?: VoiceSpeed; models?: ModelSpeeds; translate?: OldSpeeds }

function readDeviceFile(file: string): DeviceFile {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as DeviceFile
  } catch {
    return {}
  }
}

function writeDeviceFile(file: string, changes: DeviceFile): void {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify({ ...readDeviceFile(file), ...changes }, null, 2))
  } catch (error) {
    console.warn('Tyts: could not save device.json', error)
  }
}

/** The profile saved last time, when it is one. */
export function loadProfile(file: string): DeviceProfile | undefined {
  const p = readDeviceFile(file).profile
  return p && Array.isArray(p.gpus) && p.cpu ? p : undefined
}

/** A new profile; another computer's voice and translation speeds go with the old one. */
export function saveProfile(file: string, profile: DeviceProfile): void {
  const old = readDeviceFile(file)
  const same = old.profile && fingerprint(old.profile) === fingerprint(profile)
  writeDeviceFile(file, same ? { profile } : { profile, voice: undefined, models: undefined, translate: undefined })
}

export function loadVoiceSpeed(file: string): VoiceSpeed | undefined {
  const v = readDeviceFile(file).voice
  return v && typeof v.rtf === 'number' && v.rtf > 0 ? v : undefined
}

export function saveVoiceSpeed(file: string, speed: VoiceSpeed): void {
  writeDeviceFile(file, { voice: speed })
}

/** A sentence made in `took` seconds that plays `seconds`: the speed moved towards it (the first ones count fully). */
export function nextVoiceSpeed(old: VoiceSpeed | undefined, took: number, seconds: number): VoiceSpeed | undefined {
  if (seconds < 1 || took <= 0) return old
  const rtf = took / seconds
  if (!old) return { rtf, n: 1 }
  const weight = Math.max(0.15, 1 / (old.n + 1))
  return { rtf: old.rtf + (rtf - old.rtf) * weight, n: old.n + 1 }
}

/** Seconds of each kind kept: the median of the latest few, so one slow first run (Vulkan preparing its shaders) does not decide. */
const LEVEL_KEPT = 9

const numbers = (v: unknown): number[] => (Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number') : [])

/** The models' speeds; a file from 0.10.1 gives its checker's (the same Gemma 4 E4B as Accurate), never TranslateGemma's. */
export function loadModelSpeeds(file: string): ModelSpeeds {
  const f = readDeviceFile(file)
  const out: ModelSpeeds = {}
  if (!f.models) {
    const check = f.translate?.check
    if (check) out.accurate = { sentence: [], text: numbers(check.sentence), start: numbers(check.start) }
    return out
  }
  for (const model of ['accurate', 'most'] as const) {
    const s = f.models[model]
    if (s)
      out[model] = {
        sentence: numbers(s.sentence),
        text: numbers(s.text),
        start: numbers(s.start),
        ...(numbers(s.reply).length ? { reply: numbers(s.reply) } : {}),
        ...(typeof s.card === 'number' ? { card: s.card } : {}),
      }
  }
  return out
}

export function saveModelSpeeds(file: string, speeds: ModelSpeeds): void {
  writeDeviceFile(file, { models: speeds, translate: undefined })
}

/** A translation, a check or the duck's answer timed: seconds a sentence, a text or an answer, and the seconds it waited for the model to load, when it did. */
export function nextModelSpeed(old: ModelSpeed | undefined, timed: { sentence?: number; text?: number; reply?: number; start?: number }): ModelSpeed {
  const keep = (list: number[], value: number | undefined) => (value === undefined || value <= 0 ? list : [...list, value].slice(-LEVEL_KEPT))
  const card = old?.card !== undefined ? { card: old.card } : {}
  const reply = keep(old?.reply ?? [], timed.reply)
  return { sentence: keep(old?.sentence ?? [], timed.sentence), text: keep(old?.text ?? [], timed.text), start: keep(old?.start ?? [], timed.start), ...(reply.length ? { reply } : {}), ...card }
}

export function median(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

/** Free space, in MB, on the drive a folder is (or will be) on. */
export function freeMb(dir: string): number {
  let here = path.resolve(dir)
  while (!fs.existsSync(here)) {
    const up = path.dirname(here)
    if (up === here) break
    here = up
  }
  try {
    const s = fs.statfsSync(here)
    return Math.floor((s.bavail * s.bsize) / 1e6)
  } catch {
    return 0
  }
}

/** "C:" for a folder on drive C. */
export function driveOf(dir: string): string {
  return path.parse(path.resolve(dir)).root.replace(/\\$/, '')
}
