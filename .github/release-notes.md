## Tyts 0.5.6

**A model of your choice for questions to the notes (new).** On the Notes page, beside "Look in", pick the model that answers: **Accurate** or **Most accurate**, each with its size or "not downloaded". Until you pick one, the model of Check my English answers, as before. On a computer with 8 GB of memory, Accurate answers much sooner. A model that is not downloaded says where to download it (Settings › Models); nothing downloads by itself.

**Fixed:**
- A question that could not be answered showed "Error invoking remote method 'host-call'…" in place of the reason. It now says what is wrong, for example that the model is not downloaded yet.

## Tyts 0.5.5

**Fixed:**
- Tyts no longer stops with "A JavaScript error occurred in the main process: Gemma 4 E4B is not downloaded yet". It happened while the Most accurate model was loaded and the Accurate one was not on the disk, for example during Clean up on the Models page.
- **Notes:** when an answer is long in coming, the page says why it may be (a large model may not fit the computer's memory) and where a smaller one is picked. **Stop** now answers at once.

## Tyts 0.5.4

**Notes, and a conversation with them (new).** A new page in the sidebar, **Notes**, shows everything you keep as words in one list: the notes you dictated, your calls and recordings, and the Markdown files of your knowledge base folder. Find a word in all of it, or keep to one kind.

Beside the list, **ask the notes**: "What did we decide about the Button component?" Tyts looks through all the notes first, then the model on this computer answers from the places found and marks each sentence with a number. A number opens the call at that moment or the note at that paragraph. A follow-up question ("and who was against it?") keeps the topic, **Stop** ends an answer, and under an open note you can ask about that note alone.

A file of the folder can be renamed by its title, opened in its own program, shown in its folder or moved to the trash.

The search is by the question's words, so name the topic as the notes do. The answer needs a local model (Settings › Models): on a computer with 8 GB of memory pick **Accurate**, the largest model does not fit and the answer may take many minutes.

## Tyts 0.5.3

**A call is named by what it was about (new).** When a call's summary is ready, the call gets a name of a few words from it ("Bonus Centre discussion") in place of "Zoom · 10 November 14:30". A name you gave yourself is never changed.

**Fixed:**
- **Mac:** a call in Slack, Chrome and other programs that hear through a helper process is noticed again, so the recording starts by itself and stops when the call ends. Tyts took the helper for the program and never saw the call.
- Voice typing no longer shows nothing for up to half a minute when the speech engine is slow to answer (a computer short of memory): after a second the recording starts anyway and the phrase is typed when you stop, without the words while you speak.

## Tyts 0.5.2

**Permissions in one place (new).** A new page in the sidebar, **Permissions**, lists everything the system must allow and says whether it does: on a Mac the Microphone, Screen & System Audio Recording, Accessibility and Input Monitoring; on Windows the microphone. Each line has **Allow** or **Open settings**, and Home warns while something is missing. Allow it all once after installing, so that no system question comes up in the first minute of a call.

**A call left recording asks "still there?" (new).** When neither you nor the others were heard for 10 minutes, the call panel comes back and counts a minute down; **Keep recording** or any sound goes on, otherwise the recording stops and is saved and transcribed as usual. A pause is yours and is not counted.

**Call programs to leave alone (new).** Under "When a call takes the microphone", each program (Zoom, Teams, Slack, Telegram, Discord, FaceTime, Skype, Webex, Google Meet) has a switch: turned off, Tyts neither asks about it nor records it by itself.

**A shorter or a longer summary (new).** **Shorter** and **Longer** beside "Make again" make the summary anew with the same template. Under "Ask the recordings" there are starts of a question ("What did we decide about…") to finish with your topic.

**Notes while a call records (new).** A call that records has a page of its own in the calls window: your notes beside the draft of the words. The notes are kept as you type, become the transcript's, and the summary stresses what you marked.

**Screenshots only when you ask.** Tyts no longer takes screenshots of a call by itself: the camera on the call panel, on the panel at the top of the screen, and the shot key take one, and each is answered "kept" or "not taken". **Speaker names** are also offered from how the others call a speaker ("Kolya, what about you?").

**Lighter on weak computers.** The pages are half the size, a hidden window does no work, and the local models let go of memory sooner on a computer with under 12 GB.

**Fixed:**
- A long call's summary is no longer thrown away when its last step runs out of room.
- A call no longer stays at "Starting…" when the computer's sound cannot be recorded: it records the microphone alone and says so.

## Tyts 0.5.1

**A look at the top of the screen (new).** Pick how Tyts shows itself at the top edge: **Plain** (as before), **Glow** (a soft cone of warm light with a few sparks) or **Drop** (a dark bead with a glint). The panel at the top comes in that look, and while you dictate the look hangs at the top middle of the screen, so you see that Tyts is listening. It takes no clicks and no focus. Settings › General, "Look at the top of the screen".

**A call's words at the top of the screen (new, off by default).** With "Show the words while recording" on, a new switch under it, "Show the words at the top of the screen", puts the draft's last lines over any program while the call records. Tyts asks the system to keep them out of screenshots and a shared screen; a newer macOS may still show them to some recorders, so mind what you share.

## Tyts 0.5.0

**A bar by the selected text (new, off by default).** Select text with the mouse in any program, and a small dot appears under it. Point at the dot, and it opens into **Translate · Read aloud · Check · …**; the **…** holds Shorten, More polite, Formal, Natural English, Explain, Copy, "Don't show in this program" and Settings. The program keeps its selection: a click on the bar never takes the focus. Turn it on in Settings › General ("Actions by a selection"), and off for one program on Wrong letters › Programs.

**Rewrite a selection (new).** In the menu on one key, **Rewrite…**: Shorten, More polite, Formal and Natural English put the rewrite over the selected text (Ctrl/Cmd+Z takes it back); Explain says what it means in a card. It runs on this computer with the Accurate model (Settings › Models), and leaves your text as it was when the answer looks wrong or comes too late.

**Clipboard history (new, off by default).** Tyts remembers the last 30 texts you copied and up to 10 pinned ones, on this computer only; a key of its own (or the menu on one key) opens the list by the text cursor, and a digit pastes. Passwords copied by a password manager are never kept. Settings › Clipboard history.

**Dictation learns your corrections (new).** Fix a recent phrase on Say it, I type it › Phrases with its pencil, and Tyts offers to remember the change (a word or a phrase of up to five words) and puts it right in every phrase after.

**The words while a call records (new, off by default).** The call panel can open a rough draft of what is said, "Me" and "Others", while it records; the final transcript after the call is made as before. It reads on the processor at the lowest priority and never downloads anything by itself. Calls › "Show the words while recording".

**Voices you named are recognised in later calls (new).** Once you name a speaker in a transcript, Tyts keeps that voice's print on this computer, and in a later call offers the name: "Speaker 2 is probably Sasha", Accept or Not them. It is a similarity of sound, never applied by itself; Calls › Known voices lists and forgets them.

**The calls window.** Every recording, its notes and its summary in a window of its own.

**The panel at the top of the screen (new, off by default).** Rest the pointer at the top middle of the screen: dictation, your last phrases, calls and quick settings.

**Keep the computer awake (new).** From the tray or the menu on one key, for 1, 4 or 8 hours or until you turn it off; the screen may sleep or stay on. **A phrase for the call's chat:** the call panel copies "I'm recording this call to make notes afterwards…" in your language.

**Mac:**
- Actions on a selection work with a Ukrainian or Russian layout on: Translate, Check and the rest used to get an empty clipboard.
- The menu on one key opens again (it failed on a Mac).
- The layout badge stands by the text cursor, Caps Lock is turned off after a fix, and Tyts stays quiet while a program is full screen, as on Windows.
- A two-hour call is transcribed in minutes, not hours.

## Tyts 0.4.1

**One transcripts folder, no separate calls folder.** 0.3.0 added a "calls folder" of its own, which was not what was meant. Now the standard transcripts folder (`Documents\Tyts\Transcripts`, shown on the Calls page and over the list) is the notebook: the calls Tyts records are saved into it as `<date time> <title>.ogg` with a Markdown of the text and the summary beside each, and any recording you put into that folder, from another program too, is transcribed in the background, dated by the file, never moved or copied. Recordings appearing there are picked up within a few minutes.

**Choose where the transcripts live (new).** **Change** on the folder's line picks a folder and moves the whole library into it: the transcripts, the saved calls and their Markdown. What is in the chosen folder already stays and is read as part of the notebook. Tyts refuses the move while a transcript is being made, when one folder lies inside the other, or when a name in the way would be overwritten; a move that fails half way is put back.

A `callsDir` chosen in 0.3.0 or 0.4.0 is ignored from now on: recordings in that folder are not imported any more. Put them into the transcripts folder, or move the library there with Change.

## Tyts 0.4.0

**Tyts updates itself (new).** When a new version is out, Tyts asks a few seconds after it starts: **Update** or **Later** (it asks again at the next start). On Windows, Update downloads the new installer, installs it over this version and starts Tyts again. On a Mac, it downloads the new version to Downloads and opens it: drag Tyts to Applications and replace the old one. Tyts takes the file only if it matches the checksum GitHub states for it. Your settings, words and downloads stay. This version still has to be installed by hand once; the next ones come by themselves.

## Tyts 0.3.0

**Your calls folder (new).** On the Calls page, pick the folder where your call recordings live, even ones another program made. Tyts transcribes every recording already in it, one at a time in the background, dated by the file, and never moves or copies your files. The calls Tyts records are saved into the same folder. Each recording gets a Markdown file beside it with the text and the summary, so Obsidian or any notes app opens the folder as a knowledge base. New files that appear there are picked up within a few minutes; a recording you delete from Tyts is not imported again.

**Ask your recordings (new).** Above the list of calls, ask in your own words: "what did we decide about the badge colours?". Tyts finds the moments where it was discussed and the local model answers from them alone, with numbered links; a link opens that call at that minute. It runs on this computer, like the summaries, and needs the Accurate model (Settings › Models).

**Layout switching and fixing work in a maximized window again (Windows).** Windows reports any window that fills the screen as "a program on the full screen", and Tyts turned all its keys off there to stay out of games and videos. A maximized window such as Claude's counted too, so the switch key and fixing as you type did nothing in it. Now only a window that really covers its whole monitor (a game, a video in full screen, a presentation) quiets Tyts. The local model no longer unloads for a maximized window either.

**A switch the window ignored no longer blocks the fix.** When a program does not take the layout Tyts asks for, the next word is still fixed as you type, and `tyts.log` says which program kept its layout.

**A call's sound plays again** when the speech engine runs on a port other than 8765.

**The log is `tyts.log`** (in `%APPDATA%\Tyts` on Windows); the old `tyts.log` there is renamed at the first start. The keyboard now writes in it what it sees, which program is in front and whether it went quiet, so a report says why a key did nothing. Every name left over from Tyts that a person or another program could see is now Tyts's; backups made by older versions still import.

## Tyts 0.2.1

**The Mac version is built by GitHub Actions** beside the Windows installer, so every release now carries `Tyts-<version>-arm64.dmg` too. Otherwise the same as 0.2.0.

## Tyts 0.2.0

**The speech engine starts even when Windows holds port 8765.** On some computers Windows reserves port 8765 (an excluded port range, Hyper-V's or WSL's), and the engine failed at every start with "keeps stopping (3)". The engine now takes the first free port of 8765–8774, and the first line of `speech.log` at each start names it.

**The Chrome extension is gone.** It was needed only while a call could be recorded from the Google Meet tab alone; Calls now record all of the computer's sound and your microphone from any program. If you had the extension loaded in Chrome, remove it on Chrome's extensions page: it no longer records anything. Transcripts it made stay in the library.

**Tests on Windows for every change** (GitHub Actions), and the test suite now passes on Linux and a Mac too.

## Tyts 0.1.0

**The app is now Tyts (Тиць).** A fork of the original project by Yevhen Peshynskyi, open source under the MIT license, made by Mykola Onykiichuk. "Тиць" is a quick tap: one key, and it's done.

**A new look.** A new sign, a tap and its ripple on a coral tile, and a coral accent in place of the duck's yellow. The logo is "тиць•" ("Tyts•" in English).

**A shorter menu, by how often you need it.** Dashboard · Wrong letters · Say it, I type it · Calls · Translate · Practice · Settings. In Ukrainian and Russian: Пульт, Не та літера / Не та буква, Скажи — надрукую / Скажи — напишу, Дзвінки / Созвоны, Переклад / Перевод, Практика.

**All your keys in one place (new).** Settings › Keys shows a keyboard with the keys Tyts uses and every action's key, to set or change right there. Models and Disk space also live in Settings now.

**Search with Ctrl K** as well as Ctrl F. In a narrow window each place keeps its name under its icon.

**Mac (Apple silicon).** The Mac version comes as a `.dmg`: layout fixing, voice typing, calls with transcription on the Mac's graphics. It is not signed: the first time, right-click the app → Open.

## Install

**Windows:** download `Tyts-Setup-<version>.exe` and run it. The installer is not signed, so Windows warns: **More info → Run anyway**. Tyts starts with Windows and lives in the tray.

**Mac:** download `Tyts-<version>-arm64.dmg`, drag Tyts to Applications, then right-click it → Open the first time.

Tyts is a separate program from the original app: it installs into its own folders and does not touch the original app already on the computer. It does not update itself: download the new version here.
