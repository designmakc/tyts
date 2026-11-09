import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LlamaServer, LlamaTarget } from './llama'
import { createLlmFiles, llmPaths, type LlmEngine, type LlmManifest, type LlmModel } from './llmfiles'
import { systemTar } from './download'
import { createLlmTranslators, ModelSlow, translatePrompt } from './llmtranslator'

const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex')

describe('translatePrompt', () => {
  it('names the languages and keeps names, links and the tone', () => {
    expect(translatePrompt('ru', 'en')).toBe(
      'You translate from Russian into English. Reply with the translation only, nothing before or after it. ' +
        'Keep names, @handles, e-mail addresses, links, numbers, code and product names exactly as they are. Keep the tone of the original.',
    )
    expect(translatePrompt('nb', 'uk')).toContain('from Norwegian Bokmål into Ukrainian')
  })
})

const SERVER = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'

describe('createLlmTranslators', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach(d => fs.rmSync(d, { recursive: true, force: true })))

  /** A zip of these files, made by the system's tar. */
  function zipOf(dir: string, name: string, files: Record<string, string>): Buffer {
    const from = path.join(dir, name)
    fs.mkdirSync(from)
    for (const [file, text] of Object.entries(files)) fs.writeFileSync(path.join(from, file), text)
    const zip = path.join(dir, `${name}.zip`)
    execFileSync(systemTar(), ['-a', '-cf', zip, '-C', from, ...Object.keys(files)])
    return fs.readFileSync(zip)
  }

  /** Both builds as zips (CUDA's in two, as llama.cpp publishes it), two small models, the fake web serving them; Most accurate on CUDA. */
  function setup(engineFor: (model: LlmModel) => LlmEngine = model => (model === 'most' ? 'cuda' : 'vulkan')) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-'))
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-src-'))
    dirs.push(root, src)
    const vulkan = zipOf(src, 'vulkan', { [SERVER]: 'vulkan server', 'ggml-vulkan.dll': 'v' })
    const cuda = zipOf(src, 'cuda', { [SERVER]: 'cuda server', 'ggml-cuda.dll': 'c' })
    const cudart = zipOf(src, 'cudart', { 'cudart64_12.dll': 'rt' })
    const small = Buffer.from('small model'.repeat(100))
    const big = Buffer.from('big model'.repeat(300))
    const web: Record<string, Buffer> = {
      'https://x/vulkan.zip': vulkan,
      'https://x/cuda.zip': cuda,
      'https://x/cudart.zip': cudart,
      'https://x/small.gguf': small,
      'https://x/big.gguf': big,
    }
    const pinned = (url: string) => ({ url, size: web[url]!.length, sha256: sha(web[url]!) })
    const manifest: LlmManifest = {
      engine: {
        vulkan: { name: 'vulkan', files: [pinned('https://x/vulkan.zip')] },
        cuda: { name: 'cuda', files: [pinned('https://x/cuda.zip'), pinned('https://x/cudart.zip')] },
      },
      models: {
        accurate: { name: 'Gemma 4 E4B', file: 'small.gguf', ...pinned('https://x/small.gguf') },
        most: { name: 'Gemma 4 12B', file: 'big.gguf', ...pinned('https://x/big.gguf') },
      },
      languages: { en: 'English', ru: 'Russian', uk: 'Ukrainian' },
    }
    const open = vi.fn(async (url: string) => (async function* () {
      const body = web[url]
      if (!body) throw new Error('HTTP 404')
      for (let i = 0; i < body.length; i += 512) yield new Uint8Array(body.subarray(i, i + 512))
    })())
    const asked: { target: LlamaTarget; system: string; text: string }[] = []
    let serving: LlamaTarget | undefined
    const server = {
      apiKey: 'test-key',
      get model() {
        return serving?.model
      },
      get exe() {
        return serving?.exe
      },
      run: vi.fn(async (target: LlamaTarget, job: (base: string, loaded: boolean) => Promise<unknown>) => {
        const loaded = serving?.model !== target.model
        serving = target
        return job('http://127.0.0.1:9001', loaded)
      }),
      stop: vi.fn(() => (serving = undefined)),
      dispose: vi.fn(),
    }
    const post = vi.fn(async (_url: string, init: RequestInit) => {
      // Every request carries the server's key (llama.ts apiKey).
      if (new Headers(init.headers).get('authorization') !== 'Bearer test-key') return new Response('{"error":"Invalid API Key"}', { status: 401 })
      const { messages } = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      const [system, user] = messages
      asked.push({ target: serving!, system: system!.content, text: user!.content })
      return new Response(JSON.stringify({ choices: [{ message: { content: ` [${user!.content}]\n` } }] }), { status: 200 })
    })
    const timed: { level: LlmModel; sentence: number; start?: number }[] = []
    const onTimed = (level: LlmModel, t: { sentence: number; start?: number }) => timed.push({ level, ...t })
    const files = createLlmFiles({ root, open, manifest, engineFor, server: server as unknown as LlamaServer })
    const llm = createLlmTranslators({ files, fetch: post as unknown as typeof fetch, onTimed })
    return { root, llm, files, open, server, asked, timed, manifest, paths: llmPaths(root, manifest) }
  }

  it('is absent until picked, downloads the engine and the model, then translates directly', async () => {
    const { llm, open, asked, timed, paths } = setup(() => 'vulkan')
    expect(llm.accurate.direct).toBe(true)
    expect(llm.accurate.state('ru')).toMatchObject({ status: 'absent' })
    expect(llm.accurate.state('ja')).toMatchObject({ status: 'unsupported' })
    const seen: number[] = []
    await llm.accurate.prepare('ru', s => seen.push(s.progress))
    expect(llm.accurate.state('ru')).toMatchObject({ status: 'ready', progress: 1 })
    expect(seen[0]).toBe(0)
    expect(seen.at(-1)).toBeGreaterThan(0.95)
    expect(fs.readFileSync(paths.exe('vulkan'), 'utf8')).toBe('vulkan server')
    // Most accurate on the same build needs only its own model now.
    await llm.most.prepare('ru', () => undefined)
    expect(open.mock.calls.map(c => c[0])).toEqual(['https://x/vulkan.zip', 'https://x/small.gguf', 'https://x/big.gguf'])

    const out = await llm.accurate.translate(['Привет.', '', 'Как дела?'], 'ru', 'uk')
    expect(out).toEqual(['[Привет.]', '', '[Как дела?]'])
    expect(asked).toHaveLength(2)
    expect(asked[0]?.target).toEqual({ exe: paths.exe('vulkan'), model: paths.model('accurate'), allLayers: false })
    expect(asked[0]).toMatchObject({ system: translatePrompt('ru', 'uk'), text: 'Привет.' })
    // Timed by its two sentences; the first waited for the model to load, the next did not.
    await llm.accurate.translate(['Да.'], 'ru', 'en')
    expect(timed.map(t => [t.level, t.start !== undefined])).toEqual([
      ['accurate', true],
      ['accurate', false],
    ])
    expect(timed[0]?.sentence).toBeGreaterThanOrEqual(0)
    // Each sentence is told as it comes, never as a draft, so the card can replace its draft at once.
    const told: [number, string | undefined, boolean][] = []
    await llm.accurate.translate(['Да.', 'Нет.'], 'ru', 'en', (i, text, draft) => told.push([i, text, draft]))
    expect(told.sort()).toEqual([
      [0, '[Да.]', false],
      [1, '[Нет.]', false],
    ])
  })

  it('gives up with ModelSlow when a sentence takes longer than it may here, the other requests cancelled and nothing timed', async () => {
    const { files, server, timed } = setup(() => 'vulkan')
    await files.prepare('accurate', () => undefined)
    const cancelled: string[] = []
    // A model 100 ms a sentence; "Долго." a sentence the card is too busy for.
    const slow = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const { messages } = JSON.parse(String(init.body)) as { messages: { content: string }[] }
          const text = messages[1]!.content
          const timer = setTimeout(() => resolve(new Response(JSON.stringify({ choices: [{ message: { content: `[${text}]` } }] }))), text === 'Долго.' ? 5000 : 100)
          init.signal?.addEventListener('abort', () => (clearTimeout(timer), cancelled.push(text), reject(init.signal?.reason)))
        }),
    )
    const hurried = createLlmTranslators({ files, fetch: slow as unknown as typeof fetch, onTimed: (level, t) => timed.push({ level, ...t }) })
    expect(await hurried.accurate.hurried(1)(['Да.'], 'ru', 'en')).toEqual(['[Да.]'])
    const before = timed.length
    const error = await hurried.accurate.hurried(0.3)(['Долго.', 'Да.', 'Нет.', 'Ещё.', 'И ещё.'], 'ru', 'en').catch(e => e)
    expect(error).toBeInstanceOf(ModelSlow)
    expect(error).toMatchObject({ model: 'accurate', limit: 0.3 })
    expect(cancelled).toContain('Долго.')
    expect(timed.length).toBe(before)
    expect(server.run).toHaveBeenCalled()
  })

  it('takes a limit in fractions of a second: 5× a median of 1.43 s, which AbortSignal.timeout refused before', async () => {
    const { files } = setup(() => 'vulkan')
    await files.prepare('accurate', () => undefined)
    const quick = vi.fn(async (_url: string, init: RequestInit) => {
      const { messages } = JSON.parse(String(init.body)) as { messages: { content: string }[] }
      return new Response(JSON.stringify({ choices: [{ message: { content: `[${messages[1]!.content}]` } }] }))
    })
    const llm = createLlmTranslators({ files, fetch: quick as unknown as typeof fetch })
    expect(await llm.accurate.hurried(5 * 1.4327142857142856)(['Да.'], 'ru', 'en')).toEqual(['[Да.]'])
  })

  // A Mac never runs CUDA (llmfiles.ts engineFor), so this one is Windows' and Linux's.
  it.skipIf(process.platform === 'darwin')('a level on CUDA downloads its two zips into one folder and runs every layer on the card', async () => {
    const { llm, open, asked, paths } = setup()
    expect(llm.most.state('ru')).toMatchObject({ status: 'absent' })
    await llm.most.prepare('ru', () => undefined)
    expect(open.mock.calls.map(c => c[0])).toEqual(['https://x/cuda.zip', 'https://x/cudart.zip', 'https://x/big.gguf'])
    expect(fs.readdirSync(paths.engineDir('cuda')).sort()).toEqual(['cudart64_12.dll', 'ggml-cuda.dll', SERVER])
    // Accurate stays on Vulkan: its build is still to come.
    expect(llm.accurate.state('ru')).toMatchObject({ status: 'absent' })
    await llm.most.translate(['Hi.'], 'en', 'ru')
    expect(asked[0]?.target).toEqual({ exe: paths.exe('cuda'), model: paths.model('most'), allLayers: true })
  })

  it('downloads once when asked twice, and says a broken download failed', async () => {
    const { llm, open, manifest } = setup()
    await Promise.all([llm.accurate.prepare('ru', () => undefined), llm.accurate.prepare('uk', () => undefined)])
    expect(open).toHaveBeenCalledTimes(2)
    manifest.models.most.sha256 = '0'.repeat(64)
    await expect(llm.most.prepare('ru', () => undefined)).rejects.toThrow('Gemma 4 12B did not arrive whole')
    expect(llm.most.state('ru')).toMatchObject({ status: 'failed' })
  })

  it('refuses before its files are here, and a language it does not know', async () => {
    const { llm } = setup()
    await expect(llm.accurate.translate(['Hi.'], 'en', 'ru')).rejects.toThrow('not downloaded yet')
    await llm.accurate.prepare('ru', () => undefined)
    await expect(llm.accurate.translate(['Hi.'], 'en', 'ja')).rejects.toThrow('does not translate this language (ja)')
  })

  it('removes a model with its server stopped, and each engine once no model left needs it', async () => {
    const { llm, files, server, paths } = setup()
    await llm.accurate.prepare('ru', () => undefined)
    await llm.most.prepare('ru', () => undefined)
    await llm.most.translate(['Hi.'], 'en', 'ru')
    await files.remove('most')
    expect(server.stop).toHaveBeenCalled()
    expect(llm.most.state('ru')).toMatchObject({ status: 'absent' })
    expect(fs.existsSync(paths.engineDir('cuda'))).toBe(false)
    expect(llm.accurate.state('ru')).toMatchObject({ status: 'ready' })
    await files.remove('accurate')
    expect(fs.existsSync(paths.engineDir('vulkan'))).toBe(false)
  })

  it('finds the model files an older Kryakl left, never its own or one downloading, and deletes them when told', async () => {
    const { files, root, paths } = setup()
    await files.prepare('accurate', () => undefined)
    const models = path.join(root, 'models')
    const old = path.join(models, '7f7357c14abd-translategemma-4b-it-Q4_K_M.gguf')
    fs.writeFileSync(old, 'old')
    fs.writeFileSync(`${paths.model('most')}.part`, 'half')
    expect(files.unused()).toEqual([old])
    files.removeUnused()
    expect(fs.readdirSync(models).sort()).toEqual([path.basename(paths.model('accurate')), `${path.basename(paths.model('most'))}.part`].sort())
    expect(files.state('accurate')).toMatchObject({ status: 'ready' })
  })
})
