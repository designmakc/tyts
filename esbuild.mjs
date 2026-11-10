import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { build, context } from 'esbuild'

const watch = process.argv.includes('--watch')

if (!existsSync('vendor/bergamot/bergamot.wasm')) throw new Error('vendor/bergamot is missing: run npm run models')

// VS Code's icon font, used by the card.
mkdirSync('media', { recursive: true })
for (const file of ['codicon.css', 'codicon.ttf']) {
  copyFileSync(`node_modules/@vscode/codicons/dist/${file}`, `media/${file}`)
}

// charset utf8: the Ukrainian and Russian phrases as themselves, not \\uXXXX (half the size).
const node = { bundle: true, platform: 'node', format: 'cjs', target: 'node22', sourcemap: true, logLevel: 'info', charset: 'utf8' }

/** When and from what this build was made: shown beside the version, so a run from source says it is today's. */
function buildStamp() {
  const git = args => {
    try {
      return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return ''
    }
  }
  return { at: new Date().toISOString(), commit: git(['rev-parse', '--short', 'HEAD']), changed: git(['status', '--porcelain']) !== '' }
}

/** @type {import('esbuild').BuildOptions} */
const main = {
  ...node,
  entryPoints: ['src/main.ts'],
  external: ['electron', 'koffi'],
  outfile: 'dist/main.js',
  define: { TYTS_BUILD: JSON.stringify(buildStamp()) },
}

/** @type {import('esbuild').BuildOptions} */
const preload = { ...node, entryPoints: ['src/preload.ts'], external: ['electron'], outfile: 'dist/preload.js', sourcemap: false }

/**
 * onnxruntime-node loads its native binding from beside its own files; the
 * natural voice downloads the binding for this system instead, so the voice
 * process names it in TUTOR_ORT_BINDING.
 * @type {import('esbuild').Plugin}
 */
const downloadedBinding = {
  name: 'downloaded-binding',
  setup(b) {
    b.onLoad({ filter: /onnxruntime-node[\\/]dist[\\/]binding\.js$/ }, async args => {
      const source = await readFile(args.path, 'utf8')
      const contents = source.replace(/require\(`\.\.\/bin\/[^`]+`\)/, "require('node:module').createRequire(__filename)(process.env.TUTOR_ORT_BINDING)")
      if (contents === source) throw new Error('onnxruntime-node: the binding require changed; update esbuild.mjs')
      return { contents, loader: 'js' }
    })
  },
}

/** @type {import('esbuild').BuildOptions} */
const voice = { ...node, entryPoints: ['src/voice-worker.ts'], outfile: 'dist/voice-worker.js', plugins: [downloadedBinding] }

/** @type {import('esbuild').BuildOptions} */
const translator = { ...node, entryPoints: ['src/mt-worker.ts'], outfile: 'dist/mt-worker.js' }

/** The keyboard helper's thread: Windows' keyboard hooks through koffi. */
/** @type {import('esbuild').BuildOptions} */
const keyboard = { ...node, entryPoints: ['src/kbd-worker.ts'], external: ['koffi'], outfile: 'dist/kbd-worker.js' }
/** Its thread for asking whether the field typed in is a password (UI Automation). */
/** Its Mac twin: the keys from vendor/kbd-mac (a CGEventTap) to the same Typist. */
const keyboardMac = { ...node, entryPoints: ['src/kbdmac-worker.ts'], outfile: 'dist/kbdmac-worker.js' }
const field = { ...keyboard, entryPoints: ['src/field-worker.ts'], outfile: 'dist/field-worker.js' }

/** @type {import('esbuild').BuildOptions} */
const card = {
  entryPoints: ['src/webview/card.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  // Smaller pages open sooner on a slow disk; names stay whole, so an error in tyts.log still reads.
  charset: 'utf8',
  minifyWhitespace: true,
  minifySyntax: true,
  outfile: 'media/card.js',
  logLevel: 'info',
}

/** The app window: the notebook, the settings and how to use. */
const appWindow = { ...card, entryPoints: ['src/webview/app.ts'], outfile: 'media/app.js' }

/** The tray's panel, in place of Windows' menu. */
const trayPanel = { ...card, entryPoints: ['src/webview/tray.ts'], outfile: 'media/tray.js' }
/** Dictate's badge by the pointer. */
const dictation = { ...card, entryPoints: ['src/webview/dictation.ts'], outfile: 'media/dictation.js' }
/** Kryakl's menu on one key, by the text cursor. */
const menuWindow = { ...card, entryPoints: ['src/webview/menu.ts'], outfile: 'media/menu.js' }
/** The bar by a selection. */
const barWindow = { ...card, entryPoints: ['src/webview/bar.ts'], outfile: 'media/bar.js' }
/** The call recording's panel: records the computer's sound and the microphone. */
const captureWindow = { ...card, entryPoints: ['src/webview/capture.ts'], outfile: 'media/capture.js' }
/** The talk window: the talk with the duck. */
const talkWindow = { ...card, entryPoints: ['src/webview/talk.ts'], outfile: 'media/talk.js' }
/** The calls window: every recording, its transcript, notes and summary. */
const callsWindow = { ...card, entryPoints: ['src/webview/calls.ts'], outfile: 'media/calls.js' }
/** The panel at the top of the screen. */
const edgePanel = { ...card, entryPoints: ['src/webview/edge.ts'], outfile: 'media/edge.js' }
/** The badge's audio thread: the microphone as 16 kHz samples for the engine (an AudioWorklet, loaded by URL). */
/** The look at the top of the screen while dictation listens or a call records. */
const topLook = { ...card, entryPoints: ['src/webview/top.ts'], outfile: 'media/top.js' }
const pcmWorklet = { ...card, entryPoints: ['src/webview/pcm-worklet.ts'], outfile: 'media/pcm-worklet.js' }

const all = [main, preload, voice, translator, keyboard, keyboardMac, field, card, appWindow, trayPanel, dictation, menuWindow, barWindow, talkWindow, callsWindow, edgePanel, topLook, captureWindow, pcmWorklet]
if (watch) {
  const contexts = await Promise.all(all.map(o => context(o)))
  await Promise.all(contexts.map(c => c.watch()))
  console.log('watching…')
} else {
  await Promise.all(all.map(o => build(o)))
}
