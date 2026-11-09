import { EventEmitter } from 'node:events'
import type { ChildProcess } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { PassThrough } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { LlamaServer, serverArgs, serverEnv } from './llama'

type Fake = ChildProcess & { killed: boolean; alive: boolean }

/** A llama-server that is ready at once, or stops before it is (`dies`), as its arguments decide. */
function fakeProcess(dies: boolean): Fake {
  const child = new EventEmitter() as Fake
  Object.assign(child, { stdout: new PassThrough(), stderr: new PassThrough(), killed: false, alive: !dies, exitCode: null, signalCode: null })
  const exit = () => {
    Object.assign(child, { exitCode: 1 })
    child.emit('exit', 1)
  }
  child.kill = () => {
    child.killed = true
    child.alive = false
    setImmediate(exit)
    return true
  }
  if (dies)
    setImmediate(() => {
      child.stderr?.emit('data', 'ggml_vulkan: device lost\n')
      exit()
    })
  return child
}

const t = (model: string) => ({ exe: 'vulkan/llama-server.exe', model })

describe('LlamaServer', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach(d => fs.rmSync(d, { recursive: true, force: true })))

  function setup(dies: (args: string[]) => boolean = () => false, idleMs = 60_000) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llama-'))
    dirs.push(dir)
    const started: { args: string[]; child: Fake }[] = []
    let port = 9000
    const server = new LlamaServer({
      log: path.join(dir, 'llama.log'),
      idleMs,
      freePort: async () => ++port,
      spawn: (_exe, args) => {
        const child = fakeProcess(dies(args))
        started.push({ args, child })
        return child
      },
      // Only a server still running answers, and not at once.
      fetch: vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        if (!started.at(-1)?.child.alive) throw new Error('ECONNREFUSED')
        return new Response('{}', { status: 200 })
      }) as unknown as typeof fetch,
    })
    return { server, started }
  }

  it('asks for four sentences at once, every layer on the card for CUDA, the processor only when told', () => {
    expect(serverArgs(t('m.gguf'), 9001, false)).toEqual(['-m', 'm.gguf', '--host', '127.0.0.1', '--port', '9001', '-c', '8192', '-np', '4', '--kv-unified', '--no-webui', '--no-slots'])
    expect(serverArgs({ ...t('m.gguf'), allLayers: true }, 9001, false).slice(-2)).toEqual(['-ngl', 'all'])
    expect(serverArgs({ ...t('m.gguf'), allLayers: true }, 9001, true).slice(-2)).toEqual(['--device', 'none'])
  })

  it('a model on another build is another server', async () => {
    const { server, started } = setup()
    await server.run(t('a.gguf'), async () => undefined)
    await server.run({ exe: 'cuda/llama-server.exe', model: 'a.gguf' }, async () => undefined)
    expect(started).toHaveLength(2)
    expect(server.exe).toBe('cuda/llama-server.exe')
    server.dispose()
  })

  it('starts once for a model and serves it to every request', async () => {
    const { server, started } = setup()
    const bases = await Promise.all([server.run(t('a.gguf'), async b => b), server.run(t('a.gguf'), async b => b)])
    expect(bases).toEqual(['http://127.0.0.1:9001', 'http://127.0.0.1:9001'])
    expect(started).toHaveLength(1)
    expect(server.model).toBe('a.gguf')
    server.dispose()
  })

  it('stopped, resolves once its process is gone (Windows keeps the model in use until then)', async () => {
    const { server, started } = setup()
    await server.run(t('a.gguf'), async () => undefined)
    const child = started[0]!.child
    const stopped = server.stop()
    expect(child.exitCode).toBeNull()
    await stopped
    expect(child.exitCode).toBe(1)
    await expect(server.stop()).resolves.toBeUndefined()
  })

  it('tells a job whether it waited for the model to load', async () => {
    const { server } = setup()
    const loaded = await Promise.all([server.run(t('a.gguf'), async (_b, l) => l), server.run(t('a.gguf'), async (_b, l) => l)])
    expect(loaded).toEqual([true, true])
    await expect(server.run(t('a.gguf'), async (_b, l) => l)).resolves.toBe(false)
    await expect(server.run(t('b.gguf'), async (_b, l) => l)).resolves.toBe(true)
    server.dispose()
  })

  it('stops one model to serve another', async () => {
    const { server, started } = setup()
    await server.run(t('a.gguf'), async () => undefined)
    await server.run(t('b.gguf'), async () => undefined)
    expect(started.map(s => s.args[1])).toEqual(['a.gguf', 'b.gguf'])
    expect(started[0]?.child.killed).toBe(true)
    server.dispose()
  })

  it('falls back to the processor when the card cannot take the model, and stays there', async () => {
    const { server, started } = setup(args => !args.includes('none'))
    await expect(server.run(t('a.gguf'), async b => b)).resolves.toBe('http://127.0.0.1:9002')
    expect(started.map(s => s.args.includes('none'))).toEqual([false, true])
    server.stop()
    await server.run(t('a.gguf'), async () => undefined)
    expect(started.map(s => s.args.includes('none'))).toEqual([false, true, true])
    server.dispose()
  })

  it('says why when it cannot start even on the processor', async () => {
    const { server } = setup(() => true)
    await expect(server.run(t('a.gguf'), async b => b)).rejects.toThrow('device lost')
  })

  it('warmed ahead of a request, it starts the model without one, and the request finds it loaded', async () => {
    const { server, started } = setup()
    server.warm(t('a.gguf'))
    expect(server.loaded).toBeUndefined()
    await vi.waitFor(() => expect(server.loaded).toBe('a.gguf'))
    expect(server.restingFor).toBeGreaterThanOrEqual(0)
    await expect(server.run(t('a.gguf'), async (_b, l) => l)).resolves.toBe(false)
    expect(started).toHaveLength(1)
    server.dispose()
  })

  it('a warm-up never takes the card from a model at work', async () => {
    const { server, started } = setup()
    let finish: () => void = () => undefined
    const job = server.run(t('a.gguf'), () => new Promise<void>(resolve => (finish = resolve)))
    await vi.waitFor(() => expect(server.loaded).toBe('a.gguf'))
    expect(server.restingFor).toBeUndefined()
    server.warm(t('b.gguf'))
    expect(started).toHaveLength(1)
    finish()
    await job
    server.dispose()
  })

  it('stops after the idle time, and starts again on the next request', async () => {
    const { server, started } = setup(() => false, 20)
    await server.run(t('a.gguf'), async () => undefined)
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(server.model).toBeUndefined()
    await server.run(t('a.gguf'), async () => undefined)
    expect(started).toHaveLength(2)
    server.dispose()
  })
})

it('the server answers only Kryakl: a key of its own, given in the environment, and none of the person\'s LLAMA_* settings', () => {
  const env = serverEnv({ PATH: 'C:\\Windows', LLAMA_ARG_TOOLS: 'all', LLAMA_API_KEY: 'theirs', llama_arg_host: '0.0.0.0' }, 'k1')
  expect(env).toEqual({ PATH: 'C:\\Windows', LLAMA_API_KEY: 'k1' })
  const server = new LlamaServer({ log: 'x.log' })
  expect(server.apiKey).toMatch(/^[0-9a-f]{64}$/)
  expect(new LlamaServer({ log: 'x.log' }).apiKey).not.toBe(server.apiKey)
  expect(serverArgs({ exe: 'llama-server.exe', model: 'm.gguf' }, 9001, false).join(' ')).not.toContain('k1')
})
