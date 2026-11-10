# CLAUDE.md

Tyts (Тиць): a tray app for Windows and Mac (Apple silicon, the `mac` branch and `npm run dist:mac`), Electron + TypeScript, with a local Python speech engine. It fixes keyboard layouts, types what you say, records and sums up calls, translates, reads aloud and helps practise English. Everything runs on this computer: no cloud, no account. A fork of Kryakl (`ikstro/kryakl`); much of the code and `docs/history.md` still say Kryakl, Krya, Altype, 2Talker or tu-talk.

**`docs/history.md` is the full record** (every owner decision with its date, measurements, reasons, the details of each module). Read the part you need there before changing a feature; this file is only the map and the rules that always hold. Other docs: `docs/backlog.md` (backlog, bugs, the resource contract), `docs/roadmap.md`, `docs/meetings-tz.md`, `docs/adr/`.

## Commands

```
npm install
npm test                    # vitest; one file: npx vitest run src/translate.test.ts
npm run typecheck
npm run build               # esbuild → dist/*.js, media/*.js
npm start                   # build + electron .
npm run dist                # Windows installer → release/Tyts-Setup-<version>.exe
npm run dist:mac            # Swift helpers (vendor/*-mac) + dmg, arm64
npm run icons | models | glyphs | shots
node scripts/build-site.mjs # landing's uk/ru pages from site/index.html
cd engine; uv sync --extra speakers-gpu --group dev   # speech engine for development
npm run test:engine
```

- A shell from VS Code or Claude Code may carry `ELECTRON_RUN_AS_NODE=1`: run `env -u ELECTRON_RUN_AS_NODE npm start`.
- One Tyts at a time (single-instance lock): quit the installed one before `npm start` or a test run. `TYTS_TEST_HOME=<folder>` gives a run its own settings and engine folder, `TYTS_TEST_PORT` its port.
- Known failures on a Mac: vitest oldfolder ×3, setup `recommendedModels`, storage (Windows paths), engine `test_move_transcripts`.

## Release and updates

Bump `version` in package.json, commit, tag `v<version>`, push the tag. `.github/workflows/release.yml` builds and tests, then drafts the GitHub release; publishing it is the owner's step. `src/update.ts` asks `/releases/latest` 5 s after start and offers Update or Later; the download is checked against GitHub's SHA-256 (`fetchPinned`). A run from source says "dev" and never checks. The installer is unsigned.

## Map

Main process `src/main.ts` (tray, windows, flows). Pages in `src/webview/*` with HTML/CSS in `media/`, talking to main through `preload.ts` and `protocol.ts`; `src/bridge.ts` decides which page may send what (tested). Data: `%APPDATA%\Tyts` (settings, the person's lists, logs) and `%LOCALAPPDATA%\Tyts` (everything downloaded); `oldfolder.ts` moves the old names' folders over once.

- **Selection and clipboard**: `winclip.ts`, `clipboard.ts` (Ctrl+C twice), `clipguard.ts` + `winclipboard.ts` (every borrowing of the clipboard is put back; Tyts's writes are hidden from Win+V and the cloud clipboard); `cliphistory.ts` (the clipboard history, off by default, its list in the menu's window).
- **Screen text**: `ocr.ts` (Windows.Media.Ocr), `ocrpick.ts`, `ocrtext.ts`; on a Mac `build/ocr.swift`.
- **Translation**: `translate.ts` (direction, language guess, pairs), `sentences.ts`, `render.ts`; Fast = Firefox's Bergamot (`engine.ts`, `mt-worker.ts`, `src/mt-manifest.json`); Accurate / Most accurate = Gemma 4 through llama.cpp (`llama.ts`, `llmtranslator.ts`, `llmfiles.ts`, `src/llm-manifest.json`). Fast drafts first, the model replaces it (`sweep.ts`); a busy card falls back to Fast with a notice (`modelbusy.ts`, `resources.ts`).
- **Check my English**: `checker.ts`, `worddiff.ts`, `mistakes.ts`. **Talk**: `duck.ts`, `topics.ts`, `talk.ts`, `talks.ts`, `webview/talk.ts`.
- **Card** (Listen and Translate, one card of two halves): `webview/card.ts`, `halves.ts`, `player.ts`, `hover.ts`, `rare.ts`. **Voice**: `synth.ts`, `voice-worker.ts`, `kokoro.ts`, `natural.ts`.
- **Keyboard**: `keyboard.ts` → `kbd-worker.ts` (Windows hooks) or `kbdmac-worker.ts` + `build/kbd-mac.swift`; all decisions in `typist.ts` (tested with a simulated field); `layoutfix.ts` (word lists `media/layout/*.txt`), `learning.ts`, `hotkey.ts` (key notation), `field-worker.ts` + `uia.ts` (password fields), `menu.ts` + `menuwindow.ts` (the menu on one key).
- **Speech engine** (`engine/`, Python, 127.0.0.1:8765–8774): `app.py` (API), `asr.py`, `stream.py`, `live.py` (a call's draft while it records), `jobs.py`, `store.py`, `diarize.py`, `vocab.py`, `phantoms.py`, `calls.py`, `auth.py`; installed in parts by `speechpack.ts`, run by `speechservice.ts`, held by `speechhost.ts`; models chosen per computer by `speechplan.ts` from `engine/models.json` and `device.ts` measurements.
- **Dictation**: `dictation.ts`, `dictedit.ts` (optional editing by the model), `holdtalk.ts`, `webview/dictation.ts`. **Calls**: `capture.ts`, `capturesend.ts`, `callapps.ts`, `summary.ts`, `summaryflow.ts`, `ask.ts`, `shots.ts`, `addressed.ts` (names from how speakers are spoken to).
- **App window**: `webview/app.ts`, `ui.ts`, `speech.ts`, `transcripts.ts`, `setup.ts` (first run); tray panel `webview/tray.ts`. **Look**: `media/theme.css` (tokens), Lucide icons via `npm run glyphs`, `dwm.ts` (Windows 11 frame).
- **Permissions** (the page that checks what the system allows, before a call needs it): `access.ts`, `accessNow` / `grantAccess` in `main.ts`.
- **Other**: `settings.ts` (`normalize` migrates old settings), `backup.ts`, `report.ts` (problem report zip), `log.ts`, `storage.ts`, `hardware.ts`, `i18n/`.
- **Landing**: `site/` (not part of the app), uk/ru pages generated, published by `.github/workflows/pages.yml`.

## Rules that always hold

- **Three interface languages.** Every visible phrase is a key in `src/i18n/en.ts`, written in `uk.ts` and `ru.ts` at the same time (the typecheck and `i18n.test.ts` fail otherwise). What Tyts teaches (the duck's answers, corrected text, the card's English half) and what the developer reads (logs, report.txt, thrown errors) stay English.
- **Privacy.** Logs and reports never hold what the person typed, said or translated, their lists (only counts), the Hugging Face key, or their Windows name (`report.ts cleanText`). Nothing is sent anywhere by Tyts itself; LLM features stay local.
- **Security.** The engine answers only with Tyts's key (`X-Tyts-Token`, proof by HMAC before the key is sent); a request with an Origin gets 403. llama.cpp gets a random key per start. Windows programs are run by full path (`system32.ts`). The engine writes no file a caller names.
- **A good neighbour.** Tyts must not eat the computer's resources: a model goes on the graphics card whole or not at all, lets go after 3 idle minutes and on a full-screen program; dictation stays on the processor where Parakeet fits. A new feature adds its line to the resource contract in `docs/backlog.md`.
- **Clipboard.** Whatever Tyts borrows goes through `ClipboardGuard` and is put back; a copy the person made meanwhile stays.
- **Nothing downloads unasked**; every download is pinned with size and SHA-256 (`download.ts fetchPinned`). Removal is the person's (Storage, Clean up), never automatic.
- **Never lose the person's text**: a phrase that cannot be edited or translated in time is typed as said, and the badge says why.
- **Keys**: none by default for most actions; any key may be a tap or double tap of a modifier, a chord, Pause or a mouse side button (`hotkey.ts`). Every key is set on its action's page.
- **Look**: neutral greys, duck yellow `--accent` as a fill, ink for text and links on light; Inter for text, JetBrains Mono only for keys, times and numbers; Lucide icons only in the sidebar and on Home; 6 px corners.
- **Words**: every line says what it does in plain words; model names only in brackets or on About.
- **Before a test or a fix that touches the running app**, quit the installed Tyts. Tests in `*.test.ts` beside each module; pure logic gets one.
