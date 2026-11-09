// Picks the translator's files from Firefox Translations (Mozilla's offline
// translator, the Bergamot engine): for every language of the list, the
// models English → it and it → English that Firefox on Windows uses, and
// the engine itself. Usage: node scripts/build-mt.mjs
//
// Writes src/mt-manifest.json (where each model file lies on Mozilla's
// attachment server, its size and SHA-256; Kryakl downloads a language pair
// on its first use) and vendor/bergamot/ (the engine, WebAssembly and its
// JavaScript loader, shipped inside the app). The engine and the models are
// Mozilla's, under the Mozilla Public License 2.0.

import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

const SETTINGS = 'https://firefox.settings.services.mozilla.com/v1/buckets/main/collections'
const LOADER_PATH = 'toolkit/components/translations/bergamot-translator/bergamot-translator.js'
/** Kryakl's language code (languages.ts) → Firefox's. Firefox has no models for Georgian, Armenian, Kazakh. */
const LANGUAGES = {
  es: 'es', de: 'de', fr: 'fr', it: 'it', pt: 'pt', ru: 'ru', uk: 'uk', pl: 'pl', cs: 'cs', nl: 'nl', sv: 'sv', nb: 'nb',
  da: 'da', fi: 'fi', el: 'el', tr: 'tr', ro: 'ro', hu: 'hu', bg: 'bg', sr: 'sr', hr: 'hr', ar: 'ar', he: 'he', fa: 'fa',
  hi: 'hi', zh: 'zh-Hans', ja: 'ja', ko: 'ko', vi: 'vi', th: 'th', id: 'id',
}
/** Firefox on Windows, release channel: what a record's filter expression is checked against. */
const ENV = { 'env.appinfo.OS': 'WINNT', 'env.channel': 'release' }

async function json(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

async function bytes(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Evaluates a filter such as `env.appinfo.OS != 'Android' || env.channel != 'release'`:
 * names from ENV, quoted strings, == and !=, && and ||, parentheses. Anything else is refused.
 */
function passes(expression) {
  const tokens = (expression ?? '').match(/'[^']*'|[A-Za-z_.]+|==|!=|&&|\|\||[()]/g) ?? []
  if (tokens.join('').replace(/\s/g, '') !== (expression ?? '').replace(/\s/g, '')) throw new Error(`unknown filter: ${expression}`)
  if (tokens.length === 0) return true
  let at = 0
  const value = () => {
    const t = tokens[at++]
    if (t?.startsWith("'")) return t.slice(1, -1)
    if (t && t in ENV) return ENV[t]
    throw new Error(`unknown name in filter: ${t}`)
  }
  const term = () => {
    if (tokens[at] === '(') {
      at++
      const v = or()
      at++
      return v
    }
    const left = value()
    const op = tokens[at++]
    const right = value()
    return op === '==' ? left === right : left !== right
  }
  const and = () => {
    let v = term()
    while (tokens[at] === '&&') {
      at++
      v = term() && v
    }
    return v
  }
  const or = () => {
    let v = and()
    while (tokens[at] === '||') {
      at++
      v = and() || v
    }
    return v
  }
  return or()
}

/** "2.1" > "2.0" > "1.1a1": numbers first, a release above its alphas. */
function compareVersions(a, b) {
  const parse = v => {
    const m = /^(\d+)\.(\d+)(?:a(\d*))?$/.exec(v) ?? []
    return [Number(m[1] ?? 0), Number(m[2] ?? 0), m[3] === undefined ? Infinity : Number(m[3] || 0)]
  }
  const [x, y] = [parse(a), parse(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

/** The newest complete set of files for one direction that Firefox on Windows would use. */
function pick(records, from, to) {
  const usable = records.filter(r => r.fromLang === from && r.toLang === to && passes(r.filter_expression))
  const versions = [...new Set(usable.map(r => r.version))].sort(compareVersions).reverse()
  for (const version of versions) {
    const files = usable.filter(r => r.version === version)
    const types = new Set(files.map(r => r.fileType))
    if (types.has('model') && (types.has('vocab') || (types.has('srcvocab') && types.has('trgvocab')))) {
      return files.map(r => ({ type: r.fileType, name: r.name, url: r.attachment.location, size: r.attachment.size, sha256: r.attachment.hash }))
    }
  }
  return undefined
}

const { capabilities } = await json('https://firefox.settings.services.mozilla.com/v1/')
const base = capabilities.attachments.base_url
const models = (await json(`${SETTINGS}/translations-models/records`)).data
const wasms = (await json(`${SETTINGS}/translations-wasm/records`)).data

const languages = {}
for (const [code, firefox] of Object.entries(LANGUAGES)) {
  const into = pick(models, 'en', firefox)
  const from = pick(models, firefox, 'en')
  if (!into || !from) {
    console.log(`${code}: no complete pair, skipped`)
    continue
  }
  languages[code] = { [`en-${code}`]: into, [`${code}-en`]: from }
  const mb = [...into, ...from].reduce((n, f) => n + f.size, 0) / 1e6
  console.log(`${code}: ${mb.toFixed(0)} MB`)
}

// The engine: the newest WebAssembly build for Windows release, and the loader Firefox ships beside it.
const engine = wasms
  .filter(r => r.name === 'bergamot-translator' && passes(r.filter_expression))
  .sort((a, b) => compareVersions(a.version, b.version))
  .pop()
const wasm = await bytes(base + engine.attachment.location)
if (createHash('sha256').update(wasm).digest('hex') !== engine.attachment.hash) throw new Error('bergamot.wasm did not arrive whole')
const [commit] = await json(`https://api.github.com/repos/mozilla-firefox/firefox/commits?path=${LOADER_PATH}&per_page=1`)
const loader = await bytes(`https://raw.githubusercontent.com/mozilla-firefox/firefox/${commit.sha}/${LOADER_PATH}`)
mkdirSync('vendor/bergamot', { recursive: true })
writeFileSync('vendor/bergamot/bergamot.wasm', wasm)
writeFileSync('vendor/bergamot/bergamot-translator.js', loader)
console.log(`engine: bergamot-translator ${engine.version} (${(wasm.length / 1e6).toFixed(1)} MB), loader from firefox@${commit.sha.slice(0, 12)}`)

writeFileSync(
  'src/mt-manifest.json',
  JSON.stringify({ base, engine: { version: engine.version, loader: commit.sha }, languages }, null, 2) + '\n',
)
console.log(`src/mt-manifest.json: ${Object.keys(languages).length} languages`)
