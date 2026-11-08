## Tyts 0.4.0

**Tyts updates itself (new).** When a new version is out, Tyts asks a few seconds after it starts: **Update** or **Later** (it asks again at the next start). On Windows, Update downloads the new installer, installs it over this version and starts Tyts again. On a Mac, it downloads the new version to Downloads and opens it: drag Tyts to Applications and replace the old one. Tyts takes the file only if it matches the checksum GitHub states for it. Your settings, words and downloads stay. This version still has to be installed by hand once; the next ones come by themselves.

## Tyts 0.3.0

**Your calls folder (new).** On the Calls page, pick the folder where your call recordings live, even ones another program made. Tyts transcribes every recording already in it, one at a time in the background, dated by the file, and never moves or copies your files. The calls Tyts records are saved into the same folder. Each recording gets a Markdown file beside it with the text and the summary, so Obsidian or any notes app opens the folder as a knowledge base. New files that appear there are picked up within a few minutes; a recording you delete from Tyts is not imported again.

**Ask your recordings (new).** Above the list of calls, ask in your own words: "what did we decide about the badge colours?". Tyts finds the moments where it was discussed and the local model answers from them alone, with numbered links; a link opens that call at that minute. It runs on this computer, like the summaries, and needs the Accurate model (Settings › Models).

**Layout switching and fixing work in a maximized window again (Windows).** Windows reports any window that fills the screen as "a program on the full screen", and Tyts turned all its keys off there to stay out of games and videos. A maximized window such as Claude's counted too, so the switch key and fixing as you type did nothing in it. Now only a window that really covers its whole monitor (a game, a video in full screen, a presentation) quiets Tyts. The local model no longer unloads for a maximized window either.

**A switch the window ignored no longer blocks the fix.** When a program does not take the layout Tyts asks for, the next word is still fixed as you type, and `tyts.log` says which program kept its layout.

**A call's sound plays again** when the speech engine runs on a port other than 8765.

**The log is `tyts.log`** (in `%APPDATA%\Tyts` on Windows); the old `kryakl.log` there is renamed at the first start. The keyboard now writes in it what it sees, which program is in front and whether it went quiet, so a report says why a key did nothing. Every name left over from Kryakl that a person or another program could see is now Tyts's; backups made by older versions still import.

## Tyts 0.2.1

**The Mac version is built by GitHub Actions** beside the Windows installer, so every release now carries `Tyts-<version>-arm64.dmg` too. Otherwise the same as 0.2.0.

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
