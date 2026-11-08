// A new version from the GitHub releases (2026-11-08, the owner: at start, a
// question "Update?"; Update downloads it and installs it over this one). Only
// a published release counts: /releases/latest skips drafts and prereleases.
// The file is taken only with the SHA-256 GitHub states for it (download.ts
// fetchPinned). main.ts asks and installs: Windows runs the installer silently
// (--updated keeps the data, build/installer.nsh) and starts Tyts again; the
// Mac app is not signed, so it cannot replace itself: the dmg opens in Finder.

import type { Pinned } from './download'

export const LATEST = 'https://api.github.com/repos/designmakc/tyts/releases/latest'

export type Update = { version: string; file: Pinned; name: string }

/** Whether `a` (1.2.10) is a later version than `b` (1.2.9); a `v` (or `v.`, as in v.0.3.0) and a `-beta` tail are ignored. */
export function newer(a: string, b: string): boolean {
  const parts = (v: string) => v.replace(/^v\.?/, '').replace(/-.*/, '').split('.').map(n => Number(n) || 0)
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0)
  }
  return false
}

type Asset = { name: string; size: number; browser_download_url: string; digest?: string | null }

/** The release's file for this computer, if it is later than `current` and GitHub states its hash. */
export function pickUpdate(release: { tag_name: string; assets: Asset[] }, current: string, mac: boolean): Update | undefined {
  if (!newer(release.tag_name, current)) return undefined
  const asset = release.assets.find(a => (mac ? /^Tyts-.*-arm64\.dmg$/ : /^Tyts-Setup-.*\.exe$/).test(a.name))
  const sha256 = asset?.digest?.match(/^sha256:([0-9a-f]{64})$/)?.[1]
  if (!asset || !sha256) return undefined
  return { version: release.tag_name.replace(/^v\.?/, ''), name: asset.name, file: { url: asset.browser_download_url, size: asset.size, sha256 } }
}

/** What GitHub has for this computer, or nothing new. */
export async function findUpdate(current: string, mac: boolean): Promise<Update | undefined> {
  const res = await fetch(LATEST, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return pickUpdate(await res.json(), current, mac)
}
