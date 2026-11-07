## Tyts 0.2.0

**The speech engine starts even when Windows holds port 8765.** On some computers Windows reserves port 8765 (an excluded port range, Hyper-V's or WSL's), and the engine failed at every start with "keeps stopping (3)". The engine now takes the first free port of 8765–8774, and the first line of `speech.log` at each start names it.

**The Chrome extension is gone.** It was needed only while a call could be recorded from the Google Meet tab alone; Calls now record all of the computer's sound and your microphone from any program. If you had the extension loaded in Chrome, remove it on Chrome's extensions page: it no longer records anything. Transcripts it made stay in the library.

**Tests on Windows for every change** (GitHub Actions), and the test suite now passes on Linux and a Mac too.

## Tyts 0.1.0

**Kryakl is now Tyts (Тиць).** A fork of [Kryakl](https://github.com/ikstro/kryakl) by Yevhen Peshynskyi, open source under the MIT license, made by Mykola Onykiichuk. "Тиць" is a quick tap: one key, and it's done.

**A new look.** A new sign, a tap and its ripple on a coral tile, and a coral accent in place of the duck's yellow. The logo is "тиць•" ("Tyts•" in English).

**A shorter menu, by how often you need it.** Dashboard · Wrong letters · Say it, I type it · Calls · Translate · Practice · Settings. In Ukrainian and Russian: Пульт, Не та літера / Не та буква, Скажи — надрукую / Скажи — напишу, Дзвінки / Созвоны, Переклад / Перевод, Практика.

**All your keys in one place (new).** Settings › Keys shows a keyboard with the keys Tyts uses and every action's key, to set or change right there. Models and Disk space also live in Settings now.

**Search with Ctrl K** as well as Ctrl F. In a narrow window each place keeps its name under its icon.

**Mac (Apple silicon).** The Mac version comes as a `.dmg`: layout fixing, voice typing, calls with transcription on the Mac's graphics. It is not signed: the first time, right-click the app → Open.

## Install

**Windows:** download `Tyts-Setup-<version>.exe` and run it. The installer is not signed, so Windows warns: **More info → Run anyway**. Tyts starts with Windows and lives in the tray.

**Mac:** download `Tyts-<version>-arm64.dmg`, drag Tyts to Applications, then right-click it → Open the first time.

Tyts is a separate program from Kryakl: it installs into its own folders and does not touch a Kryakl already on the computer. It does not update itself: download the new version here.
