import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  fingerprint,
  loadModelSpeeds,
  mainCard,
  median,
  nextModelSpeed,
  nextVoiceSpeed,
  parseNvidiaSmi,
  parseMac,
  parseWindows,
  quickProfile,
  saveModelSpeeds,
  saveProfile,
  vendorOf,
  withNvidia,
} from './device'
import { translationAdvice, type DeviceProfile } from './hardware'

const base = { cpu: { name: 'node cpu', cores: 8, threads: 16 }, ramGb: 32, gpus: [], laptop: false, at: 0 }

describe('device profile', () => {
  it('reads a Mac from sysctl: Apple silicon cores, memory, a MacBook, the chip with no card memory', () => {
    const text = ['machdep.cpu.brand_string: Apple M1', 'hw.physicalcpu: 8', 'hw.logicalcpu: 8', 'hw.memsize: 8589934592', 'hw.model: MacBookAir10,1', 'hw.perflevel0.physicalcpu: 4', 'hw.perflevel1.physicalcpu: 4'].join('\n')
    const p = parseMac(text, base)
    expect(p.cpu).toEqual({ name: 'Apple M1', cores: 6, threads: 8 })
    expect(p.ramGb).toBe(8)
    expect(p.laptop).toBe(true)
    expect(p.gpus).toEqual([{ name: 'Apple M1 GPU', vendor: 'other', vramMb: 0, driver: '' }])
    expect(translationAdvice(p).advised).toBe('fast')
    // An Intel Mac: no perflevel keys, the physical cores as they are.
    expect(parseMac('machdep.cpu.brand_string: Intel(R) Core(TM) i7\nhw.physicalcpu: 4\nhw.logicalcpu: 8\nhw.model: Macmini8,1', base)).toMatchObject({ cpu: { cores: 4, threads: 8 }, gpus: [], laptop: false })
  })
  it('reads Windows: the real memory of each card from its driver key, not WMI’s 4 GB', () => {
    const answer = JSON.stringify({
      cpu: 'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz',
      cores: 8,
      threads: 16,
      cards: [
        { name: 'NVIDIA GeForce RTX 2080 SUPER', company: 'NVIDIA', driver: '32.0.15.6109', ram: 4293918720 },
        { name: 'Microsoft Basic Display Adapter', company: '(Standard display types)', driver: '10.0', ram: 0 },
        { name: 'Parsec Virtual Display Adapter', company: 'Parsec Cloud, Inc.', driver: '0.45', ram: 0 },
      ],
      memory: [{ name: 'NVIDIA GeForce RTX 2080 SUPER', bytes: 8589934592 }],
      battery: false,
    })
    const p = parseWindows(answer, base)
    expect(p.cpu).toEqual({ name: 'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz', cores: 8, threads: 16 })
    expect(p.gpus).toEqual([{ name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia', vramMb: 8192, driver: '32.0.15.6109' }])
    expect(p.laptop).toBe(false)
    expect(p.at).toBeGreaterThan(0)
  })

  it('takes PowerShell’s single objects as lists of one', () => {
    const p = parseWindows(JSON.stringify({ cpu: 'AMD Ryzen 5 5500U', cores: 6, threads: 12, cards: { name: 'AMD Radeon(TM) Graphics', company: 'Advanced Micro Devices, Inc.', driver: '31.0', ram: 536870912 }, battery: true, chassis: 10 }), base)
    expect(p.gpus).toEqual([{ name: 'AMD Radeon(TM) Graphics', vendor: 'amd', vramMb: 512, driver: '31.0' }])
    expect(p.laptop).toBe(true)
  })

  it('a desktop with a UPS is not a laptop: the case decides, the battery only when the case says nothing', () => {
    const answer = (chassis: number[], battery: boolean) => parseWindows(JSON.stringify({ cpu: 'x', cores: 8, threads: 16, battery, chassis }), base).laptop
    expect(answer([3], true)).toBe(false)
    expect(answer([9], false)).toBe(true)
    expect(answer([2], true)).toBe(true)
    expect(answer([], false)).toBe(false)
  })

  it('takes NVIDIA’s own numbers over Windows’', () => {
    const smi = parseNvidiaSmi('NVIDIA GeForce RTX 2080 SUPER, 8192, 610.88, 7.5\r\n')
    expect(smi).toEqual([{ name: 'NVIDIA GeForce RTX 2080 SUPER', vramMb: 8192, driver: '610.88', computeCap: 7.5 }])
    expect(parseNvidiaSmi('NVIDIA GeForce GTX 1050, 2048, 472.12\n')[0]).toEqual({ name: 'NVIDIA GeForce GTX 1050', vramMb: 2048, driver: '472.12' })
    const p = withNvidia({ ...base, gpus: [{ name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia', vramMb: 4095, driver: '32.0.15.6109' }] }, smi)
    expect(p.gpus[0]).toEqual({ name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia', vramMb: 8192, driver: '610.88', computeCap: 7.5 })
  })

  it('names vendors and the card worth naming', () => {
    expect(vendorOf('Intel(R) Arc(TM) A770 Graphics')).toBe('intel')
    expect(vendorOf('Radeon RX 6600')).toBe('amd')
    expect(vendorOf('Quadro P1000')).toBe('nvidia')
    expect(vendorOf('Some Display', 'Matrox')).toBe('other')
    const p = { ...base, gpus: [{ name: 'Intel UHD', vendor: 'intel' as const, vramMb: 128, driver: '' }, { name: 'Radeon RX 6600', vendor: 'amd' as const, vramMb: 8192, driver: '' }] }
    expect(mainCard(p)?.name).toBe('Radeon RX 6600')
  })

  it('a fingerprint changes with the card’s driver major version, not its minor', () => {
    const card = { name: 'NVIDIA GeForce RTX 2080 SUPER', vendor: 'nvidia' as const, vramMb: 8192, driver: '610.88' }
    const a = fingerprint({ ...base, gpus: [card] })
    expect(fingerprint({ ...base, gpus: [{ ...card, driver: '610.91' }] })).toBe(a)
    expect(fingerprint({ ...base, gpus: [{ ...card, driver: '615.10' }] })).not.toBe(a)
    expect(fingerprint({ ...base, ramGb: 16, gpus: [card] })).not.toBe(a)
  })

  it('keeps the voice speed as an average that settles', () => {
    let v = nextVoiceSpeed(undefined, 1, 4)
    expect(v).toEqual({ rtf: 0.25, n: 1 })
    v = nextVoiceSpeed(v, 3, 4)
    expect(v?.rtf).toBeCloseTo(0.5, 5)
    expect(nextVoiceSpeed(v, 5, 0.5)).toBe(v)
    for (let i = 0; i < 40; i++) v = nextVoiceSpeed(v, 1.2, 1)
    expect(v!.rtf).toBeGreaterThan(1.1)
  })

  it('keeps a model’s latest times; their median sets aside one slow first run', () => {
    let s = nextModelSpeed(undefined, { sentence: 9.5, start: 7.5 })
    expect(s).toEqual({ sentence: [9.5], text: [], start: [7.5] })
    for (const sentence of [0.3, 0.35, 0.3]) s = nextModelSpeed(s, { sentence })
    s = nextModelSpeed(s, { text: 0.7 })
    expect(s.start).toEqual([7.5])
    expect(s.text).toEqual([0.7])
    expect(median(s.sentence)).toBeCloseTo(0.325, 5)
    for (let i = 0; i < 12; i++) s = nextModelSpeed(s, { sentence: 0.4, start: 3 })
    expect(s.sentence).toHaveLength(9)
    expect(median(s.start)).toBe(3)
    expect(median([])).toBeUndefined()
  })

  it('another computer’s speeds go with its profile', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'device-'))
    const file = path.join(dir, 'device.json')
    try {
      const p = { ...base, gpus: [] }
      saveProfile(file, p)
      saveModelSpeeds(file, { accurate: { sentence: [0.3], text: [0.7], start: [3] } })
      saveProfile(file, p)
      expect(loadModelSpeeds(file).accurate).toEqual({ sentence: [0.3], text: [0.7], start: [3] })
      saveProfile(file, { ...p, ramGb: p.ramGb + 16 })
      expect(loadModelSpeeds(file)).toEqual({})
      // 0.10.1's file: its checker's times are Accurate's (the same Gemma 4 E4B), TranslateGemma's are dropped.
      fs.writeFileSync(file, JSON.stringify({ translate: { accurate: { sentence: [0.8], start: [2] }, check: { sentence: [0.7, 0.6], start: [3.2] } } }))
      expect(loadModelSpeeds(file)).toEqual({ accurate: { sentence: [], text: [0.7, 0.6], start: [3.2] } })
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('knows the processor and memory at once', () => {
    const p = quickProfile()
    expect(p.cpu.threads).toBeGreaterThan(0)
    expect(p.ramGb).toBeGreaterThan(0)
    expect(p.at).toBe(0)
  })
})

describe('translationAdvice', () => {
  const pc = (vramMb: number[], vendor: 'amd' | 'nvidia' = 'amd', driver = '1'): DeviceProfile => ({
    cpu: { name: 'cpu', cores: 8, threads: 16 },
    ramGb: 32,
    gpus: vramMb.map(v => ({ name: 'card', vendor, vramMb: v, driver })),
    laptop: false,
    at: 1,
  })
  const on = { slow: false, cuda: false }

  it('advises the most accurate level whose model the card holds', () => {
    expect(translationAdvice(pc([24576]))).toEqual({ advised: 'most', accurate: { where: 'card', ...on }, most: { where: 'card', ...on } })
    expect(translationAdvice(pc([0, 8192]))).toEqual({ advised: 'accurate', accurate: { where: 'card', ...on }, most: { where: 'part', slow: true, cuda: false } })
  })

  it('a model partly on an NVIDIA card goes to its CUDA build, when the driver takes CUDA 12.4', () => {
    // The RTX 2080 SUPER: 4B on the card, 12B only partly, quicker with CUDA.
    expect(translationAdvice(pc([8192], 'nvidia', '610.88')).most).toEqual({ where: 'part', slow: true, cuda: true })
    expect(translationAdvice(pc([8192], 'nvidia', '610.88')).accurate).toEqual({ where: 'card', ...on })
    expect(translationAdvice(pc([8192], 'nvidia', '537.42')).most.cuda).toBe(false)
  })

  it('advises Fast without a card of its own memory, the others slow on the processor', () => {
    expect(translationAdvice(pc([0]))).toEqual({ advised: 'fast', accurate: { where: 'processor', slow: true, cuda: false }, most: { where: 'processor', slow: true, cuda: false } })
    expect(translationAdvice(undefined).advised).toBe('fast')
  })
})
