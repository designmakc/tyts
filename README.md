# Tyts (Тиць)

*Tyts — and done.* A tray app for Windows and Mac (Apple silicon) that fixes the keyboard layout, types what you say, records and sums up calls, translates and helps you practise English. All of it runs on AI models on your own computer: no cloud, no subscription, no account.

Website: [designmakc.github.io/tyts](https://designmakc.github.io/tyts/). Tyts is a fork of [Kryakl](https://github.com/ikstro/kryakl) by Yevhen Peshynskyi.

## What it does

The window's menu, in the order you will likely need it:

- **Wrong letters** (Не та буква). Typed `ghbdtn` instead of `привет`? Tyts fixes the word as you type, or on a key (Pause, say), for English, Ukrainian, Russian and more. A key of your own switches layouts; a badge by the cursor shows the layout. It learns the words you fix by hand and never learns from a password field.
- **Say it, I type it** (Скажи — напишу). Press a key, speak, press again: the phrase is typed where the cursor is. Also with translation into English, or as a note into your notes folder. Text editing (off at first) lets the local model tidy a phrase before it is typed.
- **Calls** (Созвоны). Records all of the computer's sound and your microphone from any call program, then transcribes it, tells the speakers apart and writes a summary: decisions, tasks, questions. Files and Google Meet (through the Chrome extension) too.
- **Translate** (Перевод). Select text in any program and press your key: a card by the pointer with the translation, read aloud if you like. Or replace the selection with its translation, or translate a piece of the screen. Three levels: Fast (Firefox's translator), Accurate and Most accurate (Gemma 4, on your graphics card).
- **Practice** (Практика). Check your English: mistakes struck out, the fix in green, a short note in your language. Talk with Tyts in English, at level A2, B1 or B2.
- **Settings**. Keys (a keyboard with every key Tyts uses, set or change them there), Models (what each action runs on, and **Pick the best** for this computer), Disk space.

One key can also open Tyts's menu by the cursor, where a letter picks an action. **Ctrl K** (or Ctrl F) searches every setting.

## Install

**Windows 10 and 11:** download `Tyts-Setup-<version>.exe` from the [releases](https://github.com/designmakc/tyts/releases) and run it. The installer is not signed, so Windows warns once: **More info → Run anyway**. Tyts starts with Windows and lives in the tray.

**Mac (Apple silicon):** download `Tyts-<version>-arm64.dmg`, drag Tyts to Applications, then right-click it → **Open** the first time. Allow Accessibility (for the keyboard), the microphone and Screen Recording (for calls) when macOS asks.

When a new version is out, Tyts asks at start whether to update. On Windows **Update** downloads it, installs it over the old one and starts Tyts again; on a Mac it downloads the new version and opens it, and you drag Tyts to Applications. Your settings, words and downloads stay. It is a separate program from Kryakl, in its own folders.

Models download only when you pick what needs them, once each. All of Tyts wants a decent computer: a graphics card with 4 GB of its own memory for Accurate translation, Practice and summaries, about 12 GB of disk. Layout fixing, Fast translation and a Windows voice work on any computer.

## Report a problem

Open **About Tyts and help › Report a problem**, write what happened, then pick **Email** or **GitHub issue**. Tyts saves a zip of its logs in `Documents\Tyts\Reports`, shows it and opens the message with your text in it: attach the zip and send it. Tyts sends nothing by itself.

The zip holds Tyts's logs, the processor, memory, graphics card and versions, and your settings with your own lists only counted. It never holds your texts, words, mistakes, translations, dictated phrases, transcripts or Hugging Face key; your account's and computer's names are replaced.

## Who spoke when: the Hugging Face key

Telling speakers apart uses pyannote's model, which Hugging Face hands out for free once you accept its terms. Tyts asks for a key once:

1. Sign up at [huggingface.co/join](https://huggingface.co/join), free.
2. Open [the model's page](https://huggingface.co/pyannote/speaker-diarization-community-1) and fill in its form (Use case: **Meeting note taker**), then **Agree and access repository**.
3. Open [Access Tokens](https://huggingface.co/settings/tokens) → **Create new token** → type **Read** → copy the `hf_…` key.
4. Paste it into Tyts and press **Save**. The model downloads once; after that everything works offline. The key stays only on your computer.

## Languages

The interface is English, Ukrainian or Russian. English is the language you practise. Your own language can be one of 31 with an offline translator both ways (Ukrainian, Russian, German, French, Spanish, Polish and more).

## Build

```
npm install
npm test
npm run typecheck
npm start            # builds and runs from source
npm run dist         # release/Tyts-Setup-<version>.exe
npm run dist:mac     # release/Tyts-<version>-arm64.dmg
npm run icons        # build/icon.svg → the app and tray icons
npx electron scripts/og.mjs   # the website's link pictures
```

A tag `v<version>` builds the Windows installer in GitHub Actions and drafts the release. See [CLAUDE.md](CLAUDE.md) for how it is put together.

## Authors

Mykola Onykiichuk — Telegram [@designmakc](https://t.me/designmakc). Based on [Kryakl](https://github.com/ikstro/kryakl) by Yevhen Peshynskyi. MIT License; third-party parts in [NOTICE](NOTICE).
