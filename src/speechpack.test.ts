import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadMb, extrasFor, installedMb, normalizeParts, SpeechPack, UV, type Run } from './speechpack'

describe('parts', () => {
  it('maps parts to extras, speakers on the card replacing gpu', () => {
    const win = 'win32-x64'
    expect(extrasFor(['core'], true, win)).toEqual([])
    expect(extrasFor(['core', 'gpu'], true, win)).toEqual(['gpu'])
    expect(extrasFor(['core', 'speakers'], true, win)).toEqual(['speakers'])
    expect(extrasFor(['core', 'gpu', 'speakers'], true, win)).toEqual(['speakers-gpu'])
    // A card too small for both models: Whisper on it, speakers on the processor.
    expect(extrasFor(['core', 'gpu', 'speakers'], false, win)).toEqual(['gpu', 'speakers'])
  })

  it('adds the mac extra on Apple silicon only', () => {
    expect(extrasFor(['core'], true, 'darwin-arm64')).toEqual(['mac'])
    expect(extrasFor(['core', 'speakers'], true, 'darwin-arm64')).toEqual(['mac', 'speakers'])
    expect(extrasFor(['core'], true, 'darwin-x64')).toEqual([])
  })

  it('counts the download', () => {
    expect(downloadMb(['core'])).toBe(160)
    expect(downloadMb(['core', 'gpu'])).toBe(160 + 1150)
    expect(downloadMb(['core', 'gpu', 'speakers'])).toBe(160 + 3000)
    expect(downloadMb(['core', 'gpu', 'speakers'], false)).toBe(160 + 1150 + 250)
    expect(installedMb(['core', 'gpu'])).toBe(330 + 1700)
  })

  it('keeps core first and drops repeats', () => {
    expect(normalizeParts(['speakers', 'gpu', 'speakers'])).toEqual(['core', 'gpu', 'speakers'])
  })
})

describe('SpeechPack', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach(d => fs.rmSync(d, { recursive: true, force: true })))

  function setup() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'speechpack-'))
    const engineDir = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-'))
    dirs.push(root, engineDir)
    fs.writeFileSync(path.join(engineDir, 'uv.lock'), 'lock v1')
    const calls: { exe: string; args: string[]; env: Record<string, string> }[] = []
    // A fake uv: "unpacking" makes uv.exe, "sync" makes the environment's python.
    const run: Run = (exe, args, env) => {
      calls.push({ exe, args, env })
      if (exe.endsWith('tar.exe') || exe.endsWith('/tar')) {
        const dir = args[args.indexOf('-C') + 1]!
        fs.writeFileSync(path.join(dir, UV_EXE), '')
      } else {
        const python = path.join(env.UV_PROJECT_ENVIRONMENT!, ...PYTHON)
        fs.mkdirSync(path.dirname(python), { recursive: true })
        fs.writeFileSync(python, '')
      }
      return { exit: Promise.resolve(0), output: () => '' }
    }
    return { root, engineDir, calls, run }
  }

  const WIN = process.platform === 'win32'
  const UV_EXE = WIN ? 'uv.exe' : 'uv'
  const PYTHON = WIN ? ['Scripts', 'python.exe'] : ['bin', 'python']

  // A zip with UV's exact size and hash cannot be made here: a uv.exe already in place stands for it.
  function withUv(root: string) {
    const dir = path.join(root, 'uv', UV.version)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, UV_EXE), '')
  }

  it('installs the parts and remembers them with the lock it used', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    const changes = vi.fn()
    const pack = new SpeechPack({ root, engineDir, nvidia: true, open: vi.fn(), run, onChange: changes })
    expect(pack.state.status).toBe('absent')
    await pack.install(['gpu'])
    expect(pack.state).toMatchObject({ status: 'ready', parts: ['core', 'gpu'], nvidia: true })
    const sync = calls.find(c => c.args[0] === 'sync')!
    expect(sync.args).toContain('--frozen')
    expect(sync.args.slice(-2)).toEqual(['--extra', 'gpu'])
    expect(sync.env.UV_PROJECT_ENVIRONMENT).toBe(path.join(root, 'env'))
    expect(pack.stale).toBe(false)
    expect(changes).toHaveBeenCalled()
  })

  it('adds a part to the ones there', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    await pack.install(['speakers'])
    expect(pack.state.parts).toEqual(['core', 'speakers'])
    expect(calls.filter(c => c.args[0] === 'sync').at(-1)!.args.slice(-2)).toEqual(['--extra', 'speakers'])
  })

  it('puts who spoke when where the person chose, and switches it there later', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    let onCard = true
    const pack = new SpeechPack({ root, engineDir, nvidia: true, gpuSpeakers: () => onCard, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['gpu', 'speakers'])
    expect(pack.state.speakersOn).toBe('cuda')
    expect(calls.filter(c => c.args[0] === 'sync').at(-1)!.args.slice(-2)).toEqual(['--extra', 'speakers-gpu'])
    // The same parts, now wanted on the processor: the extras change with them.
    onCard = false
    await pack.install(['speakers'])
    expect(pack.state.speakersOn).toBe('cpu')
    expect(calls.filter(c => c.args[0] === 'sync').at(-1)!.args.slice(-4)).toEqual(['--extra', 'gpu', '--extra', 'speakers'])
    // A sync after an update, with nothing asked, keeps them where they are, whatever the advice says now.
    onCard = true
    await pack.install([])
    expect(calls.filter(c => c.args[0] === 'sync').at(-1)!.args.slice(-4)).toEqual(['--extra', 'gpu', '--extra', 'speakers'])
    expect(pack.state.speakersOn).toBe('cpu')
  })

  it('takes packages from uv’s shared cache when there is one, and leaves that cache in place', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'uvcache-'))
    dirs.push(shared)
    fs.writeFileSync(path.join(shared, 'kept'), 'x')
    const pack = new SpeechPack({ root, engineDir, nvidia: false, sharedCache: shared, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    expect(calls.find(c => c.args[0] === 'sync')!.env.UV_CACHE_DIR).toBe(shared)
    expect(fs.existsSync(path.join(shared, 'kept'))).toBe(true)
  })

  it('uses its own cache when the shared one is not there', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    const pack = new SpeechPack({ root, engineDir, nvidia: false, sharedCache: path.join(root, 'no-such-cache'), open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    expect(calls.find(c => c.args[0] === 'sync')!.env.UV_CACHE_DIR).toBe(path.join(root, 'cache'))
  })

  it('is stale after an update brings another lock', async () => {
    const { root, engineDir, run } = setup()
    withUv(root)
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    fs.writeFileSync(path.join(engineDir, 'uv.lock'), 'lock v2')
    expect(pack.stale).toBe(true)
  })

  it('refuses a Python manager that did not arrive whole', async () => {
    const { root, engineDir, run } = setup()
    const open = vi.fn(async () => (async function* () {
      yield new Uint8Array([1, 2, 3])
    })())
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open, run, onChange: () => undefined })
    await expect(pack.install(['core'])).rejects.toThrow('did not arrive whole')
    expect(pack.state).toMatchObject({ status: 'failed', message: 'The Python manager did not arrive whole' })
  })

  it('a failed sync leaves it absent, with uv\'s last words', async () => {
    const { root, engineDir } = setup()
    withUv(root)
    const run: Run = () => ({ exit: Promise.resolve(2), output: () => 'line 1\nerror: no space left on device\n' })
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open: vi.fn(), run, onChange: () => undefined })
    await expect(pack.install(['core'])).rejects.toThrow('no space left')
    expect(pack.state.status).toBe('failed')
  })

  it('removes everything', async () => {
    const { root, engineDir, run } = setup()
    withUv(root)
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    await pack.remove()
    expect(pack.state.status).toBe('absent')
    expect(fs.existsSync(path.join(root, 'env'))).toBe(false)
  })

  it.skipIf(process.platform !== 'win32')('finds a launcher left on Krya\'s folder and makes it again in place, the packages kept', async () => {
    const { root, engineDir, calls, run } = setup()
    withUv(root)
    const pack = new SpeechPack({ root, engineDir, nvidia: false, open: vi.fn(), run, onChange: () => undefined })
    await pack.install(['core'])
    const launcher = (python: string) =>
      Buffer.concat([Buffer.from('MZ…'), Buffer.from('UV_PYTHON_PATH', 'utf16le'), Buffer.from(path.join(python, 'cpython-3.12-windows-x86_64-none', 'python.exe'))])
    // uv's launcher as a clean install makes it: its own folder.
    fs.writeFileSync(pack.python, launcher(path.join(root, 'python')))
    expect(pack.moved).toBe(false)
    // As 0.15.0 left it after the move.
    fs.writeFileSync(pack.python, launcher('C:\\Users\\you\\AppData\\Local\\Krya\\speech\\python'))
    fs.writeFileSync(path.join(root, 'env', 'pyvenv.cfg'), `home = ${path.join(root, 'python', 'cpython-3.12-windows-x86_64-none')}\nprompt = tyts-speech\n`)
    fs.writeFileSync(path.join(root, 'env', 'Lib.txt'), 'packages')
    expect(pack.moved).toBe(true)
    await pack.relocate()
    const venv = calls.at(-1)!
    expect(venv.args.slice(0, 4)).toEqual(['venv', '--allow-existing', '--prompt', 'tyts-speech'])
    expect(venv.args.slice(-2)).toEqual([path.join(root, 'python', 'cpython-3.12-windows-x86_64-none', 'python.exe'), path.join(root, 'env')])
    expect(fs.readFileSync(path.join(root, 'env', 'Lib.txt'), 'utf8')).toBe('packages')
    // A launcher of another program's folder is none of this.
    fs.writeFileSync(pack.python, launcher('D:\\tools\\python'))
    expect(pack.moved).toBe(false)
  })
})
