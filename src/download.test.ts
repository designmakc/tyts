import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { fetchPinned } from './download'

const body = Buffer.from('a pinned file'.repeat(50))
const pinned = { url: 'https://x/file', size: body.length, sha256: createHash('sha256').update(body).digest('hex') }

function serve(data: Buffer, breakAt?: number) {
  return async () =>
    (async function* () {
      for (let i = 0; i < data.length; i += 100) {
        if (breakAt !== undefined && i >= breakAt) throw new Error('the connection dropped')
        yield new Uint8Array(data.subarray(i, i + 100))
      }
    })()
}

describe('fetchPinned', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach(d => fs.rmSync(d, { recursive: true, force: true })))
  const target = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'download-'))
    dirs.push(dir)
    return path.join(dir, 'file.bin')
  }

  it('keeps a file that arrived whole, counting its bytes', async () => {
    const file = target()
    const counts: number[] = []
    await fetchPinned(pinned, file, 'The file', got => counts.push(got), serve(body))
    expect(fs.readFileSync(file)).toEqual(body)
    expect(counts.at(-1)).toBe(body.length)
    expect(fs.existsSync(`${file}.part`)).toBe(false)
  })

  it('leaves nothing of a file of another size or hash', async () => {
    const file = target()
    await expect(fetchPinned(pinned, file, 'The file', () => undefined, serve(Buffer.from('something else')))).rejects.toThrow('The file did not arrive whole')
    await expect(fetchPinned({ ...pinned, sha256: '0'.repeat(64) }, file, 'The file', () => undefined, serve(body))).rejects.toThrow('did not arrive whole')
    expect(fs.readdirSync(path.dirname(file))).toEqual([])
  })

  it('leaves nothing of a download cut off', async () => {
    const file = target()
    await expect(fetchPinned(pinned, file, 'The file', () => undefined, serve(body, 300))).rejects.toThrow('the connection dropped')
    expect(fs.readdirSync(path.dirname(file))).toEqual([])
  })
})
