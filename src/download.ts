import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/** A file's body from the web; the download is given up when it stalls for a minute. */
export async function openStream(url: string, stallMs = 60_000): Promise<AsyncIterable<Uint8Array>> {
  const controller = new AbortController()
  let timer = setTimeout(() => controller.abort(), stallMs)
  const res = await fetch(url, { signal: controller.signal })
  if (!res.ok || !res.body) {
    clearTimeout(timer)
    throw new Error(`HTTP ${res.status}`)
  }
  const body = res.body as unknown as AsyncIterable<Uint8Array>
  return (async function* () {
    try {
      for await (const chunk of body) {
        clearTimeout(timer)
        timer = setTimeout(() => controller.abort(), stallMs)
        yield chunk
      }
    } finally {
      clearTimeout(timer)
    }
  })()
}

/** A download known in advance by its size and SHA-256. */
export type Pinned = { url: string; size: number; sha256: string }

/**
 * Downloads a pinned file into `target` through `<target>.part`, renamed only
 * once its size and hash are right; `name` says what did not arrive whole.
 */
export async function fetchPinned(
  file: Pinned,
  target: string,
  name: string,
  onBytes: (got: number) => void,
  open: (url: string) => Promise<AsyncIterable<Uint8Array>> = openStream,
): Promise<void> {
  const part = `${target}.part`
  const hash = createHash('sha256')
  let got = 0
  try {
    await pipeline(
      Readable.from(await open(file.url)),
      new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          got += chunk.length
          hash.update(chunk)
          onBytes(got)
          callback(null, chunk)
        },
      }),
      fs.createWriteStream(part),
    )
  } catch (error) {
    fs.rmSync(part, { force: true })
    throw error
  }
  if (got !== file.size || hash.digest('hex') !== file.sha256) {
    fs.rmSync(part, { force: true })
    throw new Error(`${name} did not arrive whole`)
  }
  fs.renameSync(part, target)
}

/** The system's own tar (bsdtar on both), which reads zip and .tar.gz files alike. */
export const systemTar = () => (process.platform === 'win32' ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : '/usr/bin/tar')

/** Unpacks a zip (or .tar.gz) into `dir`, dropping `strip` leading folders of each path. */
export function unzip(zip: string, dir: string, strip = 0): Promise<void> {
  fs.mkdirSync(dir, { recursive: true })
  return new Promise((resolve, reject) =>
    execFile(systemTar(), ['-xf', zip, '-C', dir, ...(strip ? ['--strip-components', String(strip)] : [])], { windowsHide: true }, (error, _stdout, stderr) =>
      error ? reject(new Error(`Could not unpack ${path.basename(zip)}: ${String(stderr).trim() || error.message}`)) : resolve(),
    ),
  )
}
