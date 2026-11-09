import { describe, expect, it } from 'vitest'

import { newer, pickUpdate } from './update'

const sha = 'a'.repeat(64)
const release = {
  tag_name: 'v0.4.0',
  assets: [
    { name: 'Tyts-Setup-0.4.0.exe', size: 10, browser_download_url: 'https://x/exe', digest: `sha256:${sha}` },
    { name: 'Tyts-0.4.0-arm64.dmg', size: 20, browser_download_url: 'https://x/dmg', digest: `sha256:${sha}` },
  ],
}

describe('newer', () => {
  it('compares numbers, not text', () => {
    expect(newer('v0.10.0', '0.9.9')).toBe(true)
    expect(newer('0.3.0', '0.3.0')).toBe(false)
    expect(newer('0.2.9', '0.3.0')).toBe(false)
    expect(newer('1.0', '0.99.99')).toBe(true)
    // The tags so far read v.0.3.0.
    expect(newer('v.0.4.0', '0.3.0')).toBe(true)
    expect(newer('v.0.3.0', '0.3.0')).toBe(false)
  })
})

describe('pickUpdate', () => {
  it('takes the file for this computer', () => {
    expect(pickUpdate(release, '0.3.0', false)).toEqual({ version: '0.4.0', name: 'Tyts-Setup-0.4.0.exe', file: { url: 'https://x/exe', size: 10, sha256: sha } })
    expect(pickUpdate(release, '0.3.0', true)?.file.url).toBe('https://x/dmg')
  })
  it('nothing when not newer', () => expect(pickUpdate(release, '0.4.0', false)).toBeUndefined())
  it('nothing without a stated hash', () => {
    const bare = { ...release, assets: release.assets.map(a => ({ ...a, digest: null })) }
    expect(pickUpdate(bare, '0.3.0', false)).toBeUndefined()
  })
})
