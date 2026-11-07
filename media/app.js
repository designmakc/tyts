"use strict";
(() => {
  // src/natural.ts
  var NATURAL_PREFIX = "natural:";
  var NATURAL_VOICES = [
    { id: "af_heart", name: "Heart", accent: "US", gender: "female" },
    { id: "af_bella", name: "Bella", accent: "US", gender: "female" },
    { id: "bf_emma", name: "Emma", accent: "UK", gender: "female" },
    { id: "am_michael", name: "Michael", accent: "US", gender: "male" },
    { id: "bm_george", name: "George", accent: "UK", gender: "male" }
  ];
  function naturalLabel(v) {
    return `${v.name} \xB7 ${v.accent} \xB7 ${v.gender}`;
  }

  // src/languages.ts
  var LANGUAGES = [
    { name: "English", native: "English", ru: "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439", code: "en" },
    { name: "Spanish", native: "Espa\xF1ol", ru: "\u0438\u0441\u043F\u0430\u043D\u0441\u043A\u0438\u0439", code: "es" },
    { name: "German", native: "Deutsch", ru: "\u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439", code: "de" },
    { name: "French", native: "Fran\xE7ais", ru: "\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0439", code: "fr" },
    { name: "Italian", native: "Italiano", ru: "\u0438\u0442\u0430\u043B\u044C\u044F\u043D\u0441\u043A\u0438\u0439", code: "it" },
    { name: "Portuguese", native: "Portugu\xEAs", ru: "\u043F\u043E\u0440\u0442\u0443\u0433\u0430\u043B\u044C\u0441\u043A\u0438\u0439", code: "pt" },
    { name: "Russian", native: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", ru: "\u0440\u0443\u0441\u0441\u043A\u0438\u0439", code: "ru" },
    { name: "Ukrainian", native: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430", ru: "\u0443\u043A\u0440\u0430\u0438\u043D\u0441\u043A\u0438\u0439", code: "uk" },
    { name: "Polish", native: "Polski", ru: "\u043F\u043E\u043B\u044C\u0441\u043A\u0438\u0439", code: "pl" },
    { name: "Czech", native: "\u010Ce\u0161tina", ru: "\u0447\u0435\u0448\u0441\u043A\u0438\u0439", code: "cs" },
    { name: "Dutch", native: "Nederlands", ru: "\u043D\u0438\u0434\u0435\u0440\u043B\u0430\u043D\u0434\u0441\u043A\u0438\u0439", code: "nl" },
    { name: "Swedish", native: "Svenska", ru: "\u0448\u0432\u0435\u0434\u0441\u043A\u0438\u0439", code: "sv" },
    { name: "Norwegian", native: "Norsk", ru: "\u043D\u043E\u0440\u0432\u0435\u0436\u0441\u043A\u0438\u0439", code: "nb" },
    { name: "Danish", native: "Dansk", ru: "\u0434\u0430\u0442\u0441\u043A\u0438\u0439", code: "da" },
    { name: "Finnish", native: "Suomi", ru: "\u0444\u0438\u043D\u0441\u043A\u0438\u0439", code: "fi" },
    { name: "Greek", native: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", ru: "\u0433\u0440\u0435\u0447\u0435\u0441\u043A\u0438\u0439", code: "el" },
    { name: "Turkish", native: "T\xFCrk\xE7e", ru: "\u0442\u0443\u0440\u0435\u0446\u043A\u0438\u0439", code: "tr" },
    { name: "Romanian", native: "Rom\xE2n\u0103", ru: "\u0440\u0443\u043C\u044B\u043D\u0441\u043A\u0438\u0439", code: "ro" },
    { name: "Hungarian", native: "Magyar", ru: "\u0432\u0435\u043D\u0433\u0435\u0440\u0441\u043A\u0438\u0439", code: "hu" },
    { name: "Bulgarian", native: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438", ru: "\u0431\u043E\u043B\u0433\u0430\u0440\u0441\u043A\u0438\u0439", code: "bg" },
    { name: "Serbian", native: "\u0421\u0440\u043F\u0441\u043A\u0438", ru: "\u0441\u0435\u0440\u0431\u0441\u043A\u0438\u0439", code: "sr" },
    { name: "Croatian", native: "Hrvatski", ru: "\u0445\u043E\u0440\u0432\u0430\u0442\u0441\u043A\u0438\u0439", code: "hr" },
    { name: "Georgian", native: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8", ru: "\u0433\u0440\u0443\u0437\u0438\u043D\u0441\u043A\u0438\u0439", code: "ka" },
    { name: "Armenian", native: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576", ru: "\u0430\u0440\u043C\u044F\u043D\u0441\u043A\u0438\u0439", code: "hy" },
    { name: "Kazakh", native: "\u049A\u0430\u0437\u0430\u049B \u0442\u0456\u043B\u0456", ru: "\u043A\u0430\u0437\u0430\u0445\u0441\u043A\u0438\u0439", code: "kk" },
    { name: "Arabic", native: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", ru: "\u0430\u0440\u0430\u0431\u0441\u043A\u0438\u0439", code: "ar" },
    { name: "Hebrew", native: "\u05E2\u05D1\u05E8\u05D9\u05EA", ru: "\u0438\u0432\u0440\u0438\u0442", code: "he" },
    { name: "Persian", native: "\u0641\u0627\u0631\u0633\u06CC", ru: "\u043F\u0435\u0440\u0441\u0438\u0434\u0441\u043A\u0438\u0439", code: "fa" },
    { name: "Hindi", native: "\u0939\u093F\u0928\u094D\u0926\u0940", ru: "\u0445\u0438\u043D\u0434\u0438", code: "hi" },
    { name: "Chinese", native: "\u4E2D\u6587", ru: "\u043A\u0438\u0442\u0430\u0439\u0441\u043A\u0438\u0439", code: "zh" },
    { name: "Japanese", native: "\u65E5\u672C\u8A9E", ru: "\u044F\u043F\u043E\u043D\u0441\u043A\u0438\u0439", code: "ja" },
    { name: "Korean", native: "\uD55C\uAD6D\uC5B4", ru: "\u043A\u043E\u0440\u0435\u0439\u0441\u043A\u0438\u0439", code: "ko" },
    { name: "Vietnamese", native: "Ti\u1EBFng Vi\u1EC7t", ru: "\u0432\u044C\u0435\u0442\u043D\u0430\u043C\u0441\u043A\u0438\u0439", code: "vi" },
    { name: "Thai", native: "\u0E44\u0E17\u0E22", ru: "\u0442\u0430\u0439\u0441\u043A\u0438\u0439", code: "th" },
    { name: "Indonesian", native: "Bahasa Indonesia", ru: "\u0438\u043D\u0434\u043E\u043D\u0435\u0437\u0438\u0439\u0441\u043A\u0438\u0439", code: "id" }
  ];
  function findLanguage(name) {
    if (!name) return void 0;
    const key = name.trim().toLowerCase();
    return LANGUAGES.find((l) => l.name.toLowerCase() === key || l.native.toLowerCase() === key || l.code === key);
  }
  var SCRIPT_BY_CODE = {
    ru: "Cyrillic",
    uk: "Cyrillic",
    bg: "Cyrillic",
    sr: "Cyrillic",
    kk: "Cyrillic",
    el: "Greek",
    ar: "Arabic",
    fa: "Arabic",
    he: "Hebrew",
    hi: "Devanagari",
    zh: "Han",
    ja: "Japanese",
    ko: "Hangul",
    ka: "Georgian",
    hy: "Armenian",
    th: "Thai"
  };
  function scriptFor(name) {
    const language = findLanguage(name);
    if (!language) return void 0;
    return SCRIPT_BY_CODE[language.code] ?? "Latin";
  }

  // src/i18n/en.ts
  var en = {
    // ------------------------------------------------------------ shared
    // The name as the person reads it: Тиць in Ukrainian and Russian, in the logo too (2026-11-03).
    "app.name": "Tyts",
    "app.tagline": "Tyts \u2014 and done",
    "common.close": "Close",
    "common.restore": "Restore",
    "common.maximize": "Maximize",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.notNow": "Not now",
    "common.beta": "beta",
    "common.retry": "Retry",
    "common.tryAgain": "Try again",
    "common.openSettings": "Open settings",
    "common.listen": "Listen",
    "common.stop": "Stop",
    "common.paste": "Paste",
    "common.listening": "Listening\u2026",
    "common.checking": "Checking\u2026",
    "common.or": "or",
    "common.and": "and",
    "common.cancel": "Cancel",
    "main.saveWords": "Save the words for Anki",
    "main.ankiText": "Text for Anki",
    "main.saveBackup": "Save a backup",
    "main.backupFile": "Tyts backup",
    "main.openBackup": "Open a backup",
    "main.backupUnread": "This backup could not be read",
    "main.importAsk": "Import this backup?",
    "main.importDetail": "It holds {what}. Your settings become the backup's; its words, mistakes and history are added to yours, nothing of yours is removed.",
    "main.import": "Import",
    "main.resetAsk": "Reset all settings?",
    "main.resetDetail": "Keys, switches and lists go back to how they came. Your language, words, transcripts and what Tyts learned from your typing stay.",
    "main.reset": "Reset",
    "main.resetKeysAsk": "Reset all keys?",
    "main.resetKeysDetail": "Every shortcut goes back to how it came: Ctrl+Alt+S, Ctrl+Alt+T, Ctrl+Alt+D and Ctrl+Alt+N; the others are cleared, Ctrl+C twice too. Nothing else changes.",
    "main.resetKeys": "Reset keys",
    "main.saveTranscript": "Save the transcript",
    "main.notTranslated": "Could not translate: {why}",
    "main.noClipText": "The clipboard holds no text. Select a text and copy it first.",
    "main.nothingCopied": "Nothing was copied. Select a text, then press the shortcut.",
    "main.keysTaken": { one: "{keys} is taken by another program. Choose another in the settings.", other: "{keys} are taken by another program. Choose others in the settings." },
    "main.copyTwiceOff": "Ctrl+C twice will not work: {why}. Use the tray menu.",
    "backup.settings": "settings",
    "backup.words": { one: "{n} word", other: "{n} words" },
    "backup.mistakes": { one: "{n} mistake", other: "{n} mistakes" },
    "backup.learned": { one: "{n} learned word", other: "{n} learned words" },
    "backup.translations": { one: "{n} translation", other: "{n} translations" },
    "backup.phrases": { one: "{n} dictated phrase", other: "{n} dictated phrases" },
    "backup.talks": { one: "{n} talk", other: "{n} talks" },
    "size.mb": "{n} MB",
    "size.gb": "{n} GB",
    "level.fast": "Fast",
    "level.accurate": "Accurate",
    "level.most": "Most accurate",
    "busy.card": "graphics card",
    "busy.processor": "processor",
    "lang.pairEnglish": "{lang} \u21C4 English",
    "lang.yours": "your language",
    // ------------------------------------------------------------ the tray's panel
    "tray.open": "Open",
    "tray.openKryakl": "Open Tyts",
    "tray.built": "Built {build}",
    "tray.actions": "Actions",
    "tray.listenCopied": "Translate and read aloud",
    "tray.translateCopied": "Translate",
    "tray.typeToTranslate": "Type a text to translate\u2026",
    "tray.checkEnglish": "Type a text to check\u2026",
    "tray.listenScreen": "Translate and read from the screen",
    "tray.translateScreen": "Translate from the screen",
    "tray.saveNote": "Save the note",
    "tray.newNote": "Voice note",
    "tray.transcripts": "All transcripts",
    "tray.quick": "Quick settings",
    "tray.autoFix": "Fix the layout as I type",
    "tray.switchWith": "Switch layouts with {key}",
    "tray.layoutBadge": "Show the layout by the cursor",
    "tray.trayLayout": "Show the layout in the tray",
    "tray.yourWords": "Your words",
    "tray.keepWord": "Keep a word as typed\u2026",
    "tray.keepWordTitle": "Never fix this word by itself (Kept as typed)",
    "tray.keepPlaceholder": "a word, as you type it",
    "tray.keepAria": "Keep a word as typed",
    "tray.kept": "Kept: {word}",
    "tray.vocabulary": "Add a name or term\u2026",
    "tray.keptList": "Kept as typed",
    "tray.pausedTitle": "Keys are off",
    "tray.pauseTitle": "Every key and reaction off until resumed",
    "tray.resume": "Resume",
    "tray.pause": "Pause",
    "tray.settings": "Settings",
    "tray.report": "Report",
    "tray.reportTitle": "Report a problem, with Tyts\u2019s logs",
    "tray.quit": "Quit",
    "tray.paused": "paused",
    "tray.ready": "ready",
    "tray.readyTitle": "{pair}, offline",
    "tray.downloading": "downloading\u2026",
    "tray.firstUse": "translator on first use",
    "tray.tipRecording": "Recording",
    "tray.tipPaused": "Tyts \xB7 paused",
    "tray.tipListen": "{keys}: translate and read aloud",
    "tray.tipTranslate": "{key} to translate",
    // ------------------------------------------------------------ the card
    "kind.listen": "Read aloud",
    "kind.translate": "Translate",
    "kind.check": "Check",
    "kind.screen": "screen",
    "card.openedBy": "Opened by {keys}",
    "card.openedByTwice": "Opened by {keys} twice",
    "card.prev": "Previous sentence",
    "card.next": "Next sentence",
    "card.oneByOne": "One by one",
    "card.spaceListen": "listen",
    "card.spaceStop": "stop",
    "card.text": "The text",
    "card.from": "From",
    "card.fromTitle": "The language of the text",
    "card.into": "Into",
    "card.intoTitle": "The language to translate into",
    "card.swap": "Swap",
    "card.swapTitle": "Swap the languages: the translation becomes the text",
    "card.voiceOffer": "A natural voice sounds like a real person and reads offline.",
    "card.voiceDownload": "Download \xB7 {size} MB",
    "card.voiceFailed": "The natural voice did not download.",
    "card.voiceDownloading": "Downloading the natural voice\u2026 {pct}%",
    "card.voiceReady": "The natural voice is ready. Press Listen to hear it.",
    "card.busyCard": "The graphics card is busy, so Fast translated this. {level} takes over again once it is free.",
    "card.busyProcessor": "The processor is busy, so Fast translated this. {level} takes over again once it is free.",
    "card.useAnyway": "Use {level} anyway",
    "card.hideTranslation": "Hide the {lang} translation",
    "card.showTranslation": "Show the {lang} translation",
    "card.unpin": "Unpin: close when another window is clicked",
    "card.pin": "Pin: keep open",
    "card.oneOn": "Listen reads one sentence and waits; \u2190 \u2192 step",
    "card.oneOff": "Read one sentence at a time",
    "card.translatingFast": "Translating with Fast\u2026",
    "card.translating": "Translating\u2026",
    "card.translatingLevel": "Translating \xB7 {level}\u2026",
    "card.ofGb": "{a} of {b} GB",
    "card.ofMb": "{a} of {b} MB",
    "card.firstUse": "first use \xB7 once",
    "card.modelOf": "{name} model",
    "card.translatorPair": "Translator, {pair}",
    "card.fromMozilla": "Downloads once from Mozilla, then translates on this computer.",
    "card.fromHfTranslates": "Downloads once from Hugging Face, then translates on this computer.",
    "card.fromHfChecks": "Downloads once from Hugging Face, then checks on this computer.",
    "card.readMeanwhile": "The English is read meanwhile.",
    "card.notChecked": "Not checked",
    "card.notTranslated": "Not translated",
    "card.readingScreen": "Reading the text on the screen\u2026",
    "card.noText": "No text here",
    "card.noTextNote": "The piece of the screen holds no text Tyts can read. Snip a piece with words in it.",
    "card.noOcr": "Windows cannot read text yet",
    "card.noOcrNote": "Add text recognition for {lang} or English: Settings \u2192 Time & language \u2192 Language & region \u2192 the language \u2192 Language options \u2192 Optical character recognition.",
    "card.openLanguageSettings": "Open language settings",
    "card.yourEnglish": "Your English",
    "card.typeEnglish": "Type or paste your English",
    "card.checkedBy": "Checked \xB7 {model}",
    "card.improving": "Improving \xB7 {level}\u2026",
    "card.translatedBy": "Translated \xB7 {level}",
    "card.newLine": "{by} \xB7 Shift+Enter, a new line",
    "card.yours": "Yours",
    "card.allLanguages": "All languages",
    "card.pasteOver": "Paste over the selection (Enter)",
    "card.pasteLater": "Pastes once the accurate translation is in (Enter)",
    "card.pasteChecked": "Paste the text set right over the selection (Enter)",
    "card.looksRight": "Looks right",
    "card.listenSpace": "Listen (Space)",
    "card.listenParagraph": "Listen to this paragraph",
    "card.naturalStopped": "The natural voice stopped ({message}). A system voice reads on.",
    "card.noVoice": "No English voice on this computer.",
    "card.openSpeechSettings": "Open speech settings",
    "voice.stepsWin": "To add one: Windows Settings \u2192 Time & language \u2192 Speech \u2192 Add voices \u2192 {lang}, then restart Tyts.",
    "voice.stepsMac": "To add one: System Settings \u2192 Accessibility \u2192 Spoken Content \u2192 System voice \u2192 Manage Voices \u2192 {lang}, then restart Tyts.",
    "voice.none": "Reading aloud uses the voices of Windows or macOS; this system has none the panel can use.",
    // ------------------------------------------------------------ the word card
    "word.from": "from {word}",
    "word.say": "Say it",
    "word.save": "Save to Words",
    "word.remove": "Remove from Words",
    "word.notFound": "Not in the dictionary.",
    "word.pair": "English \u2192 {lang}",
    "word.notEnglish": "Word meanings are for English only, for now; the {lang} translation is below.",
    "word.noDictionary": "No {pair} dictionary yet; the translation is below.",
    "word.downloading": "Downloading the {pair} dictionary, once\u2026",
    "word.failed": "Couldn\u2019t download the {pair} dictionary. Check the internet connection; it tries again in a minute.",
    "word.off": "The {pair} dictionary isn\u2019t downloaded.",
    // ------------------------------------------------------------ the talk window
    "talk.yourTalks": "Your talks",
    "talk.hideTalks": "Hide your talks",
    "talk.settings": "Talk settings",
    "talk.toEnd": "To the last line",
    "talk.typePlaceholder": "Or type a line and press Enter",
    "talk.typeOnly": "Type a line and press Enter",
    "talk.typeAria": "Type a line to the duck",
    "talk.newTitle": "Put this talk away in your talks and start a new one",
    "talk.new": "New talk",
    "talk.closeList": "Close the list",
    "talk.today": "Today",
    "talk.yesterday": "Yesterday",
    "talk.earlier": "Earlier",
    "talk.lines": { one: "{n} line", other: "{n} lines" },
    "talk.withMistake": "{n} with a mistake",
    "talk.goingOnMeta": "going on",
    "talk.goingOnTitle": "The talk going on",
    "talk.goOn": "Go on with this talk",
    "talk.firstLine": "The duck\u2019s first line",
    "talk.delete": "Delete this talk",
    "talk.goingOn": "Going on",
    "talk.historyEmpty": "New talk puts a talk here, to go on with it later. Kept 30 days on this computer, 50 at most.",
    "talk.sureOne": "Sure? Delete it",
    "talk.sureAll": "Sure? Delete all {n}",
    "talk.clearAll": "Clear all",
    "talk.needsCard": "Talk needs a graphics card with 4 GB of its own memory or more",
    "talk.needsCardNote": "On this computer the duck would answer in 15 seconds or more, too slow for a talk. Check my English still works.",
    "talk.downloading": "downloading, {pct}%; the talk starts once it is here",
    "talk.downloadFailed": "the download failed",
    "talk.downloadIt": "download it in the settings; Check my English and Translate can use it too",
    "talk.needsModel": "The duck needs its model: {name}, {size}",
    "talk.noEngine": "Type to the duck, or add speech to talk",
    "talk.noEngineNote": "Talk hears you through the speech engine voice typing uses; download it in the settings.",
    "talk.engineStarting": "The speech engine is starting\u2026",
    "talk.slow": "{name} is slow on this computer: the duck may take a while to answer. {accurate} answers in about 3 seconds.",
    "talk.busyCard": "Another program is using the graphics card: the duck may answer slowly.",
    "talk.busyProcessor": "Another program is using the processor: the duck may answer slowly.",
    "talk.intro": "Speak English. The duck answers aloud, and your mistakes are marked in your own lines.",
    "talk.orTypeHello": "Or type hello below.",
    "talk.orSayHello": "Or just press the button and say hello.",
    "talk.unpin": "Stop keeping it on top",
    "talk.pin": "Keep it on top of other windows",
    "talk.modelTitle": "The duck runs on {model}, the same model as Check my English, on this computer. Click to change it.",
    "talk.failed": "The duck could not answer: {message}. Say it again, or type it.",
    "talk.noAnswer": "no answer",
    "talk.startingMic": "Starting the microphone\u2026",
    "talk.send": "Send",
    "talk.talk": "Talk",
    "talk.notPossible": "Talk is not possible yet: see above.",
    "talk.speaking": "The duck is speaking",
    "talk.thinking": "The duck is thinking\u2026",
    "talk.typingOnly": "Typing only, until speech is here",
    "talk.pressAgain": "Press again to try.",
    "talk.listeningPress": "Listening \xB7 press {keys} to send",
    "talk.speakingPress": "The duck is speaking \xB7 press {keys} to answer",
    "talk.thinkingPress": "The duck is thinking \xB7 press {keys} to talk over it",
    "talk.press": "Press {keys} to talk",
    "talk.finishing": "Finishing the line\u2026",
    "talk.nothingHeard": "Nothing was heard.",
    "turn.again": "Say it again",
    "turn.checking": "checking\u2026",
    "turn.setRight": "set right above",
    "turn.hearRight": "Hear it said right",
    "turn.hear": "Hear it",
    "topic.free": "Free talk",
    "topic.day": "My day",
    "topic.trip": "A trip",
    "topic.cafe": "At a caf\xE9",
    "topic.interview": "Job interview",
    "topic.work": "My work",
    // ------------------------------------------------------------ the microphone and the dictation badge
    "mic.denied": "No access to the microphone: allow it in Windows Settings \u2192 Privacy \u2192 Microphone",
    "mic.none": "No microphone found",
    "mic.busy": "Another program holds the microphone",
    "dict.type": "Type by voice",
    "dict.english": "Type by voice into English",
    "dict.note": "Voice note",
    "dict.check": "Say it and check",
    "dict.gettingModel": "Getting the speech model {pct}%",
    "dict.savingNote": "Saving the note\u2026",
    "dict.catchingUp": "Catching up\u2026",
    "dict.typing": "Typing\u2026",
    "dict.saved": "Saved",
    "dict.typed": "Typed",
    "dict.noteFailed": "The note was not saved",
    "dict.nothingTyped": "Nothing typed",
    "dict.engineStarting": "The speech engine is starting. Try again in a few seconds.",
    "dict.engineDown": "The speech engine could not start. Click to report the problem.",
    "dict.fastCard": "Typed with Fast: the graphics card is busy",
    "dict.fastProcessor": "Typed with Fast: the processor is busy",
    "dict.tuck": "Fold into the tray: the recording goes on",
    "dict.editing": "Editing\u2026",
    "dict.editNoModel": "Typed as said: the model is not downloaded",
    "dict.editCard": "Typed as said: the graphics card is busy",
    "dict.editProcessor": "Typed as said: the processor is busy",
    "dict.editSlow": "Typed as said: the model took too long",
    "dict.editDoubt": "Typed as said: the edit looked wrong",
    "edit.title": "Text editing",
    "edit.off": "off",
    "edit.on": "Edit what I dictate",
    "edit.onNote": "the local model puts each phrase right before it is typed, about a second more; nothing leaves this computer",
    "edit.onNoteSlow": "the local model puts each phrase right before it is typed; here each phrase waits several seconds",
    "edit.needsModel": "Text editing needs the {name} model ({size})",
    "edit.style": "How to edit",
    "edit.clean": "Clean up",
    "edit.cleanNote": "removes \u201Cum\u201D, repeats and slips, sets the punctuation right; the other words stay",
    "edit.business": "Business tone",
    "edit.businessNote": "for letters and work chats: neutral, polite words",
    "edit.aiTask": "Task for an AI",
    "edit.aiTaskNote": "a clear request for Claude or ChatGPT; terms and file names stay",
    "edit.list": "List",
    "edit.listNote": "each thought on a line of its own",
    "edit.own": "My own instruction",
    "edit.ownNote": "your own words on how to write",
    "edit.ownLabel": "Instruction",
    "edit.ownPlaceholder": "For example: keep it short, leave the terms in English",
    "edit.ownHint": "Up to 500 characters. Left empty, phrases are typed as said.",
    "edit.keeps": "Notes, Talk and spoken practice are never edited. What you said stays in Phrases: point at a phrase to see it.",
    "edit.model": "Model",
    "badge.fastCard": "Fast \xB7 graphics card busy",
    "badge.fastProcessor": "Fast \xB7 processor busy",
    "settings.uiLanguage": "Interface language",
    "settings.uiLanguageNote": "Tyts\u2019s menus and pages; what it teaches stays English",
    "ui.recommended": "Recommended",
    "ui.add": "Add",
    "ui.remove": "Remove {item}",
    "ui.reportSubject": "a problem",
    "ui.reportAsk": "What happened?",
    "ui.reportAttach": 'The report is open in File Explorer: please attach "{file}".',
    "ui.reportTitle": "A problem",
    "ui.reportWhat": "What happened",
    "ui.reportDrag": "**The report:** drag `{file}` here from File Explorer (Tyts's logs, your name and keys left out).",
    "setup.step1": "Your language",
    "setup.step2": "This computer",
    "setup.step3": "What you need",
    "setup.step4": "Download",
    "setup.cap1": "English is what Tyts teaches",
    "setup.cap2": "what speech can run on here",
    "setup.cap3": "advised for this computer",
    "setup.cap4": "one button, then it goes on by itself",
    "setup.stepOf": "Step {step} of {total}",
    "setup.download": "Download",
    "setup.finish": "Finish",
    "setup.next": "Next",
    "setup.back": "Back",
    "setup.skip": "Skip for now",
    "setup.languageNote": "what Tyts translates into and listens for; English is the language it teaches",
    "setup.windowsIn": "Windows is in {lang}: the same language is advised.",
    "setup.otherLanguages": "Other languages you use",
    "setup.addLanguage": "Add a language",
    "setup.addLanguageNote": "dictation never picks another; translation and the screen\u2019s text guess among them",
    "setup.pickLanguage": "Pick a language",
    "setup.always": "always",
    "setup.lookingCard": "looking at the graphics card\u2026",
    "setup.noCard": "none of its own",
    "setup.onCard": "Speech can run on the graphics card",
    "setup.onCardNote": "a dictated phrase in \u2248{time} with {model} \xB7 an hour of a meeting in minutes",
    "setup.onCpu": "Speech runs on the processor",
    "setup.onCpuNote": "a dictated phrase in \u2248{time} with {model} \xB7 an hour of a meeting in \u2248{hour}",
    "setup.hardware": "Hardware",
    "setup.processor": "Processor",
    "setup.cpuLooking": "{cpu} \xB7 looking\u2026",
    "setup.cpuCores": { one: "{cpu} \xB7 {n} core", other: "{cpu} \xB7 {n} cores" },
    "setup.laptop": "a laptop",
    "setup.memory": "Memory",
    "setup.graphicsCard": "Graphics card",
    "setup.means": "What it means",
    "setup.useCard": "Use the graphics card",
    "setup.stillLooking": "Still looking at this computer; Next does not wait, the advice follows once it is known.",
    "setup.noTranslator": "no offline translator for this language yet",
    "setup.translatorHere": "the translator for {pair} is here",
    "setup.translatorOnce": "the translator for {pair} \xB7 {size}, once",
    "setup.dictReady": "the word dictionary is here",
    "setup.dictOnce": "the word dictionary \xB7 a few MB, once",
    "setup.dictComing": "the word dictionary is coming",
    "setup.dictNone": "no word dictionary for this language yet",
    "setup.toDownload": "\u2248{size} to download",
    "setup.onDisk": "{size} on the disk once installed",
    "setup.freeOn": "{size} free on {drive}",
    "setup.freeUnknown": "free space unknown",
    "setup.noRoom": "Not enough room: turn something off, or free some space.",
    "setup.alwaysGroup": "Always",
    "setup.listenTranslate": "Translate and read aloud",
    "setup.alwaysOn": "always on",
    "setup.voice": "Voice",
    "setup.naturalHere": "Natural \xB7 here",
    "setup.naturalSize": "Natural \xB7 {size}",
    "setup.windowsVoice": "Windows voice",
    "setup.keyboard": "Keyboard layout",
    "setup.badgeNote": "a small badge whenever the layout changes",
    "setup.speech": "Speech",
    "setup.dictateNote": "{why} \xB7 the speech engine {engine} + {model} {size}",
    "setup.transcribe": "Transcribe meetings and files",
    "setup.transcribeNote": "{why} \xB7 {model} {size}",
    "setup.transcribeNoteEngine": "{why} \xB7 {model} {size} + the speech engine {engine}",
    "setup.speakers": "Who spoke when",
    "setup.startWithWindows": "Start with Windows",
    "setup.allOfIt": "All of it",
    "setup.keysLater": "Keys are set on each action\u2019s page; everything here can be changed later in Settings.",
    "setup.voicesHour": "an hour\u2019s voices in \u2248{time} here",
    "setup.runsOnCpu": "Runs on the processor",
    "setup.runsOn": "Runs on",
    "setup.advisedCard": "the graphics card is advised on this computer",
    "setup.advisedCpu": "the processor is advised on this computer",
    "setup.downloading": "Downloading",
    "setup.toDownloadGroup": "To download",
    "setup.then": "Then",
    "setup.test": "Test the speech models when they are here",
    "setup.testNote": "each downloaded model runs once on a short clip, a minute or two in the background; then the times here are this computer\u2019s own",
    "setup.canClose": "You can close this window: the downloads go on, and Home shows how far they are.",
    "setup.notStarted": "Nothing has started yet: go back to Download, or Finish to set everything up later from the pages.",
    "setup.here": "here",
    "setup.hereAlready": "here already",
    "setup.starting": "starting\u2026",
    "setup.coming": "coming\u2026",
    "setup.pythonManager": "the Python manager",
    "setup.packages": "the packages \xB7 the window can be closed, it goes on",
    "setup.installFailed": "the install failed",
    "setup.next2": "next",
    "setup.afterEngine": "after the speech engine",
    "setup.why.voiceWeak": "a Windows voice is instant; the natural one would pause between sentences on this processor",
    "setup.why.voice": "reads like a person; this computer makes its speech faster than it plays",
    "setup.why.autoFix": "{lang} and English share the keyboard: a word typed in the wrong layout is typed again right",
    "setup.why.autoFixLatin": "your language shares the Latin layout; turn it on if you also type in another",
    "setup.why.gpu": "speech on the graphics card: a phrase in \u2248{card}, not \u2248{cpu}",
    "setup.why.noGpu": "no NVIDIA card that can take it; speech runs on the processor",
    "setup.why.dictate": "{model} writes a phrase in \u2248{time} on this processor",
    "setup.why.transcribe": "{model}: an hour of a meeting in \u2248{time} on this computer",
    "setup.why.transcribeCard": "{model}: an hour of a meeting in \u2248{time} on this computer, quicker on the graphics card",
    "setup.why.transcribeRough": "possible, but rough here: {model} writes an hour in \u2248{time}",
    "setup.why.transcribeSlow": "possible, but slow here: {model} writes an hour in \u2248{time}",
    "setup.why.speakers": "the voices told apart on the graphics card: an hour in \u2248{time}",
    "setup.why.speakersSlow": "possible, but slow here: on the processor an hour\u2019s voices take \u2248{time}",
    "setup.why.startWithWindows": "the keys work from the first minute",
    "setup.item.translator": "The translator for {pair}",
    "setup.item.translatorNote": "Firefox Translations, once \xB7 then offline",
    "setup.item.dictionary": "The word dictionary",
    "setup.item.dictionaryNote": "meanings of English words, once",
    "setup.item.voice": "The natural voice",
    "setup.item.voiceNote": "Kokoro \xB7 reads on this computer",
    "setup.item.engine": "The speech engine",
    "setup.item.engineNote": "{parts} \xB7 {size} on the disk",
    "setup.item.core": "speech to text",
    "setup.item.gpu": "the graphics card\u2019s part",
    "setup.item.speakers": "the speakers\u2019 part",
    "rec.check": "Check and talk",
    "rec.dictate": "Voice typing",
    "rec.voice": "Voice",
    "rec.transcribe": "Recordings and meetings",
    "rec.automatic": "Automatic",
    "rec.speechModels": "Automatic speech models",
    "rec.speed": "Speed first",
    "rec.accuracy": "Accuracy first",
    "rec.dictateTranscribe": "Voice typing and recordings",
    "rec.naturalVoice": "Natural voice",
    "speech.sec": "{n} s",
    "speech.min": "{n} min",
    "speech.h": "{h} h",
    "speech.hMin": "{h} h {m} min",
    "speech.perPhrase": "\u2248{time} a phrase",
    "speech.perHour": "\u2248{time} an hour",
    "speech.basisMeasured": "measured here",
    "speech.basisScaled": "from this computer\u2019s test",
    "speech.basisGuess": "first guess",
    "speech.aboutTiny": "fastest, rough",
    "speech.aboutBase": "fast, fair",
    "speech.aboutSmall": "good",
    "speech.aboutTurbo": "very good",
    "speech.aboutLarge": "the most accurate, slow",
    "speech.aboutParakeet": "very good and quick \xB7 25 European languages",
    "speech.whyTooBig": "too big for this graphics card",
    "speech.whyMemory": "needs more memory than this computer has",
    "speech.whyLanguage": "not for your language",
    "speech.whyLanguages": "not for every language you use",
    "speech.show": "Show",
    "speech.kbFolder": "The knowledge base folder",
    "speech.kbSet": "Knowledge base: {folder}",
    "speech.removing": "Removing the speech engine\u2026",
    "speech.removingPart": "Removing a part of the speech engine\u2026",
    "speech.backSoon": "the speech engine is back in a moment",
    "speech.stepTool": "the Python manager; you can close this window, the download goes on",
    "speech.stepPackages": "the packages; you can close this window, the download goes on",
    "speech.dlSpeakers": "Downloading the speakers part",
    "speech.dlEngine": "Downloading the speech engine",
    "speech.download": "Download",
    "speech.needsDictate": "Voice typing needs the speech engine",
    "speech.needsTranscribe": "Recordings need the speech engine",
    "speech.needs": "{feature} needs the speech engine",
    "speech.dlStopped": "The download stopped: {why}",
    "speech.unknownError": "unknown error",
    "speech.dlOffer": "{size} to download, then it works offline; {disk} on the disk (with the {model} model)",
    "speech.needsFree": "Needs {need} free; {drive} has {free}",
    "speech.needsFreeAbout": "Needs \u2248{need} free; {drive} has {free}",
    "speech.freeOn": "{free} free on {drive}",
    "speech.useGpu": "Use the graphics card",
    "speech.gpuMore": "{size} more to download; a phrase takes about {gpu} instead of {cpu} ({card})",
    "speech.starting": "The speech engine is starting\u2026",
    "speech.notRunning": "The speech engine is not running",
    "speech.itStopped": "it stopped",
    "speech.restart": "Restart",
    "speech.onCard": "on the graphics card",
    "speech.onProcessor": "on the processor",
    "speech.onMetal": "on the Apple graphics card (Metal)",
    "speech.sharedDictate": "Voice typing uses it too: downloaded once, loaded once",
    "speech.sharedTranscribe": "Recordings use it too: downloaded once, loaded once",
    "speech.keptDictate": "kept for voice typing on the processor, if the graphics card fails",
    "speech.keptTranscribe": "kept for recordings on the processor, if the graphics card fails",
    "speech.keptBoth": "kept for voice typing and recordings on the processor, if the graphics card fails",
    "speech.budgetPhrase": "a phrase in \u2248{time}",
    "speech.budgetHour": "an hour in \u2248{time}",
    "speech.automatic": "Automatic",
    "speech.autoNote": "the most accurate model that is quick enough here: {budget}",
    "speech.usesNow": "uses {model} now",
    "speech.autoCpu": "on the processor: leaves the graphics card to your programs",
    "speech.autoMoves": "moves to {model} on the processor once it is downloaded, leaving the graphics card to your programs",
    "speech.slower": "slower than usual here",
    "speech.sizeHere": "{size} on this computer",
    "speech.sizePick": "{size}, downloads when picked",
    "speech.autoUses": "Automatic uses it now",
    "speech.notUsedNow": "not used now",
    "speech.removeModel": "Remove {model} ({size}); it downloads again when picked",
    "speech.prefers": "Automatic prefers",
    "speech.preferSpeedNote": "quicker models, a little less accurate",
    "speech.preferAccNote": "the most accurate models this computer runs in time",
    "speech.accuracy": "Accuracy",
    "speech.speed": "Speed",
    "speech.gpuTitle": "Speech on the graphics card",
    "speech.installed": "Installed",
    "speech.gpuOffer": "{size} to download; voice typing and recordings get several times quicker",
    "speech.add": "Add",
    "speech.testWaits": "waits until the engine is free",
    "speech.testStep": "{model} \xB7 step {n} of {total}",
    "speech.testStarting": "starting",
    "speech.testing": "Testing this computer",
    "speech.testAsk": "Test your computer to pick the best speech models?",
    "speech.testNoteOne": "Each downloaded model runs once on a short clip, about a minute, in the background. Until then the times shown are guesses.",
    "speech.testNoteMany": "Each downloaded model runs once on a short clip, about a minute or two, in the background. Until then the times shown are guesses.",
    "speech.testRun": "Run the test",
    "speech.cores": { one: "{n} core", other: "{n} cores" },
    "speech.laptop": "a laptop",
    "speech.noCard": "no graphics card of its own",
    "speech.lookingCard": "looking at the graphics card\u2026",
    "speech.measured": "the speech models\u2019 times are measured here",
    "speech.guesses": "the times are first guesses until the test",
    "speech.testedLater": "tested once the speech engine is here",
    "speech.testAgain": "Test again",
    "speech.test": "Test",
    "speech.rightNow": "Right now",
    "speech.whoSpoke": "Who spoke when",
    "speech.nothingLoaded": "nothing loaded: the graphics card and the memory are free for your programs",
    "speech.heldCard": "on the graphics card: {list}",
    "speech.nothingCard": "nothing on the graphics card",
    "speech.heldCpu": "on the processor: {list}",
    "speech.letGo": "let go after 3 idle minutes",
    "speech.cardNone": "none of its own \xB7 speech runs on the processor",
    "speech.looking": "looking\u2026",
    "speech.cardNotNvidia": "{name} \xB7 speech runs on the processor: only NVIDIA cards run it for now",
    "speech.cardTooSmall": "{name} \xB7 too old or too small for speech \xB7 the processor does it",
    "speech.cardAddPart": "{name} \xB7 add its part to use it",
    "speech.cardFallback": "{name} \xB7 it would not take the model, so the processor does it",
    "speech.cardCpuPlan": "{name}, but the engine runs on the processor",
    "speech.cardOn": "{name} \xB7 speech is recognized on it",
    "speech.cardMetal": "{name} \xB7 Whisper turbo runs on it (Metal)",
    "speech.dzNeedsToken": "needs a free Hugging Face key, once, to download the speakers\u2019 model",
    "speech.dzChecking": "checking the key\u2026",
    "speech.dzDownloading": "the key works \xB7 downloading the speakers\u2019 model\u2026",
    "speech.dzBadToken": "the key did not work: copy it whole, and make it of type Read",
    "speech.dzNoAccess": "the key works, but the model is not open to it yet: fill in the form on its page (step 2), then Check again",
    "speech.dzFailed": "could not check the key",
    "speech.dzMissing": "key saved \xB7 the model downloads with the first transcription",
    "speech.dzReady": "the model is here \xB7 speakers are told apart offline, no key needed any more",
    "speech.voicesModel": "The voices\u2019 model",
    "speech.voicesLater": "set up once the speech engine runs",
    "speech.card": "Graphics card",
    "speech.processor": "Processor",
    "speech.voicesHour": "an hour\u2019s voices in \u2248{time} here",
    "speech.advised": "advised",
    "speech.torchCard": "PyTorch for the card \xB7 \u2248{download} download \xB7 {disk} on the disk, in place of the card\u2019s part",
    "speech.torchCpu": "PyTorch for the processor \xB7 \u2248{download} download \xB7 {disk} on the disk",
    "speech.chosen": "chosen",
    "speech.use": "Use",
    "speech.speakersInfo": "The words are recognized already. Telling the voices apart is another model; it runs on PyTorch, which is what downloads here.",
    "speech.runsOn": "Runs on",
    "speech.voicesHere": "the voices\u2019 model is here already: no Hugging Face key needed",
    "speech.voicesKey": "then a free Hugging Face key, once, for the voices\u2019 model",
    "speech.downloadGrp": "Download",
    "speech.whoOnCard": "Who spoke when, on the graphics card",
    "speech.whoOnCpu": "Who spoke when, on the processor",
    "speech.dlOnce": "\u2248{size} download, once \xB7 {model}",
    "speech.nowCard": "On the graphics card now",
    "speech.nowCpu": "On the processor now",
    "speech.switchCard": "switching to the graphics card: \u2248{size} download; the other PyTorch goes",
    "speech.switchCpu": "switching to the processor: \u2248{size} download; the other PyTorch goes",
    "speech.switch": "Switch",
    "speech.installedCard": "Installed \xB7 on the graphics card",
    "speech.installedCpu": "Installed \xB7 on the processor",
    "speech.hfKey": "Hugging Face key",
    "speech.save": "Save",
    "speech.replaceKey": "Replace key",
    "speech.checkAgain": "Check again",
    "speech.step1": "Sign up at Hugging Face",
    "speech.step1Rest": ", free.",
    "speech.step2": "Open {page} and fill in its form: Company or university, anything, your own name will do; Use case: {use}. Then Agree and access.",
    "speech.step2Page": "the model\u2019s page",
    "speech.step3": "Open {tokens} \u2192 Create new token \u2192 type {read} \u2192 copy the hf_\u2026 key.",
    "speech.step4": "Paste it here and Save. The model downloads once; after that, everything works offline.",
    "speech.missingPart": "Speakers are not told apart yet: their part is not downloaded.",
    "speech.missingKey": "Speakers are not told apart yet: a Hugging Face key is needed.",
    "speech.setUp": "Set up",
    "tr.srcFile": "file",
    "tr.srcMic": "microphone",
    "tr.srcNote": "note",
    "tr.stageDecode": "Preparing the sound",
    "tr.stageWords": "Recognizing speech",
    "tr.stageSpeakers": "Telling speakers apart",
    "tr.stageSave": "Saving",
    "tr.starting": "Starting",
    "tr.waitingTurn": "Waiting its turn",
    "tr.fmtText": "Text",
    "tr.fmtSubs": "Subtitles",
    "tr.fmtData": "Data",
    "tr.auto": "Auto",
    "tr.filesWaiting": { one: "{n} file is waiting its turn", other: "{n} files are waiting their turn" },
    "tr.dropTitle": "Drop a video or audio file",
    "tr.dropNote": "here or anywhere in the window \xB7 mp4, mov, mkv, webm, mp3, m4a, wav\u2026 \xB7 read where it is, never copied \xB7 an hour takes \u2248{time} here",
    "tr.anHour": "an hour",
    "tr.pick": "Pick a file\u2026",
    "tr.language": "Language",
    "tr.languageNote": "Auto: heard from the first seconds",
    "tr.speakers": "Speakers",
    "tr.speakersNote": "how many talk \xB7 Auto finds out",
    "tr.micTitle": "Record from the microphone",
    "tr.micNote": "a talk, a lecture, people in the room \xB7 the text comes after Stop",
    "tr.record": "Record",
    "tr.recording": "Recording",
    "tr.stopTranscribe": "Stop and transcribe",
    "tr.lostPiece": "A piece of the recording did not reach the engine",
    "tr.dropHere": "Drop to transcribe",
    "tr.needEngine": "Transcripts need the speech engine",
    "tr.needEngineNote": "it downloads once, on the Recordings and meetings page",
    "tr.transcribeLink": "Recordings and meetings\u2026",
    "tr.startingNote": "the transcripts show once it runs",
    "tr.search": "Search every transcript",
    "tr.new": "New",
    "tr.newTitle": "A new transcription",
    "tr.needKb": "Notes need a knowledge base folder.",
    "tr.choose": "Choose\u2026",
    "tr.openingLib": "Opening the library\u2026",
    "tr.nothing": "Nothing found.",
    "tr.emptyTitle": "Transcripts will be here",
    "tr.tipDrop": "Drop a video or audio file into this window",
    "tr.tipMic": "Record from the microphone on the Recordings and meetings page",
    "tr.tipNote": "Dictate a note: {keys} in any program",
    "tr.failed": "failed",
    "tr.recordingChip": "recording",
    "tr.waiting": "waiting",
    "tr.opening": "Opening\u2026",
    "tr.rename": "Rename",
    "tr.couldNot": "Could not transcribe it",
    "tr.delete": "Delete",
    "tr.afterStop": "The text comes once the recording stops.",
    "tr.background": "The window can be closed: it goes on in the background.",
    "tr.startsAfter": "Starts once the one before it is done.",
    "tr.loadingModel": "loading the model, finding speech",
    "tr.posMin": "{at} of {total} min",
    "tr.posClock": "{at} of {total}",
    "tr.underMinute": "under a minute left",
    "tr.minLeft": "about {n} min left",
    "tr.copied": "The text is copied",
    "tr.saved": "Saved: {file}",
    "tr.export": "Export",
    "tr.toKb": "To knowledge base",
    "tr.inKb": "In the knowledge base: {file}",
    "tr.chooseFolder": "Choose a folder",
    "tr.callsFolder": "Calls folder",
    "tr.callsFolderNote": "recordings already in it are transcribed, each with a Markdown of its text beside it; the calls recorded here are saved there too",
    "tr.callsSet": "Calls folder: {folder}",
    "tr.ask": "Ask the recordings: what did we decide about\u2026",
    "tr.askBtn": "Ask",
    "tr.asking": "Looking through the recordings\u2026",
    "tr.askNothing": "Nothing in the recordings matches the question.",
    "tr.askNeedModel": "A question needs the local model: pick Accurate on the Models page.",
    "tr.deleteAsk": "Delete for good?",
    "tr.keep": "Keep",
    "tr.deleted": "Deleted",
    "tr.open": "Open",
    "tr.showInFolder": "Show in folder",
    "tr.whyFailed": "Speakers could not be told apart; the text is one stream.",
    "tr.whyNoPart": "Speakers are not told apart: who spoke when was not installed yet.",
    "tr.whyNoKey": "Speakers are not told apart: the voices\u2019 model needed a Hugging Face key.",
    "tr.meetNote": "Your microphone is Me; the call\u2019s voices are one speaker.",
    "tr.setUpSpeakers": "Set up speakers",
    "tr.noWords": "This meeting can no longer be split: its words were not kept.",
    "tr.noRecog": "The text is not recognized again; edits stay.",
    "tr.split": "Split by speaker",
    "tr.editsLost": "Edits to the text will be lost. Go on?",
    "tr.goOn": "Go on?",
    "tr.again": "Transcribe again",
    "tr.redoTime": "It can be transcribed again, with speakers: about {n} min.",
    "tr.speakerName": "Speaker\u2019s name",
    "tr.tapRename": "tap a name to rename",
    "tr.nameHintNote": "Read off the screen: experimental, may be wrong",
    "tr.applyName": "Apply",
    "tr.dismissName": "Dismiss",
    "tr.anotherSpeaker": "Another speaker",
    "tr.listenFrom": "Listen from here",
    "tr.position": "Position",
    "tr.playSpace": "Play or pause \xB7 Space",
    "tr.play": "Play or pause",
    "nav.home": "Dashboard",
    "nav.english": "Practice",
    "nav.voice": "Say it, I type it",
    "nav.recordings": "Calls",
    "nav.layout": "Wrong letters",
    "nav.translate": "Translate",
    "nav.words": "My words",
    "nav.mistakes": "My mistakes",
    "nav.transcripts": "All transcripts",
    "nav.translations": "Translation history",
    "nav.phrases": "Dictated phrases",
    "nav.vocabulary": "Names and terms",
    "nav.kept": "Kept as typed",
    "nav.learned": "Learned words",
    "nav.programs": "Programs",
    "nav.layouts": "Layout order",
    "nav.settings": "Settings",
    "nav.models": "Models",
    "nav.storage": "Disk space",
    "nav.keys": "Keys",
    "nav.about": "About Tyts",
    "nav.report": "Report a problem",
    "nav.search": "Search",
    "nav.minimize": "Minimize",
    "nav.making": "A transcript is being made",
    "search.placeholder": "Search settings",
    "search.title": "Search settings (Ctrl+F)",
    "search.nothing": "Nothing has \u201C{q}\u201D. Words, transcripts and translations have searches of their own.",
    "search.hint": "Type above: every line of every page is found by its name or its note.",
    "page.speakers": "Who spoke when",
    "page.fixing": "Fixing as I type",
    "page.languages": "Languages you use",
    "page.checkEnglish": "Check my English",
    "page.forCheckCap": "the model that finds your mistakes",
    "page.voice": "Voice",
    "page.forVoiceCap": "the voice that reads English aloud",
    "home.paused": "Tyts is paused",
    "home.pausedNote": "keys and fixes are off",
    "home.replayTitle": "Play the line again",
    "home.replay": "Replay",
    "home.ready": "Tyts is ready",
    "home.readyNote": "everything runs on this computer",
    "home.downloading": "Downloading: {name}",
    "home.yourKeys": "Your keys",
    "home.unset": "Without a key: {n}. Set them on the action pages.",
    "home.troubleTranslator": "The translator could not download; it tries again on the next translation.",
    "home.troubleVoice": "The natural voice could not download; a Windows voice reads for now.",
    "home.troubleSpeech": "The speech engine has stopped: Report a problem can restart it.",
    "home.eyebrow": "One line, three keys",
    "home.stepFix": "fix",
    "home.stepTranslate": "translate",
    "home.stepListen": "listen",
    "home.downloadsOnce": "downloads once",
    "menu.translate": "Translate",
    "menu.listen": "Translate and read aloud",
    "menu.inPlace": "Replace with translation",
    "menu.screen": "Translate from the screen",
    "menu.check": "Check my English",
    "menu.talk": "Talk to the duck",
    "menu.dictate": "Type by voice",
    "menu.english": "Type by voice into English",
    "menu.fix": "Fix the layout",
    "menu.foot": "Letter to pick \xB7 Esc to close",
    "menu.nothingToRead": "Nothing to read: select a text",
    "menu.nothingToReplace": "Nothing to replace: select a text",
    "menu.keyTitle": "Tyts menu",
    "menu.keyNote": "one key for every action",
    "keys.group": "Keys",
    "keys.copyTwice": "Ctrl + C twice",
    "keys.twice": "{key} twice",
    "keys.tap": "tap {key}",
    "keys.press": "press {key}",
    "keys.useSelect": "translating and reading the selection aloud",
    "keys.useSnip": "translating and reading text on the screen",
    "keys.useTranslate": "translating the selection",
    "keys.useText": "translating text on the screen",
    "keys.useInPlace": "replacing the selection with its translation",
    "keys.useCheck": "checking your English",
    "keys.useType": "typing a text to translate",
    "keys.useTypeCheck": "typing a text to check",
    "keys.useSwitch": "switching the layout",
    "keys.useFix": "fixing the layout",
    "keys.useDictate": "dictating",
    "keys.useEnglish": "dictating in English",
    "keys.useNote": "dictating a note",
    "keys.useAgain": "typing the last phrase again",
    "keys.usePractice": "checking what you say",
    "keys.useTalk": "talking to the duck",
    "keys.usePause": "pausing Tyts",
    "keys.useWindow": "opening Tyts",
    "keys.useMenu": "opening Tyts\u2019s menu",
    "keys.toLayout": "going to {layout}",
    "keys.aLayout": "a layout",
    "keys.taken": "{key} is already for {use}.",
    "keys.copyTwiceOnly": "Ctrl + C twice can only be the key of an action on the selected text.",
    "keys.menuAlt": "Alt alone no longer opens menus, F10 does",
    "keys.menuWin": "Win alone no longer opens Start, Ctrl+Esc does",
    "keys.menuCtrlEsc": "Ctrl+Esc no longer opens Start, Win does",
    "keys.recordTitle": "Click, then press the keys: Ctrl+Alt+T, Left Ctrl twice, Pause, a mouse side button\u2026",
    "keys.aria": "{label}: {key}. Click to change.",
    "keys.notSet": "not set",
    "keys.pressKeys": "Press keys\u2026",
    "keys.clear": "Clear",
    "keys.clearAria": "Clear {label}",
    "keys.backTo": "Back to {key}",
    "keys.backToAria": "{label}: back to {key}",
    "keys.takenProgram": "Taken by another program; choose another.",
    "keys.set": "Set",
    "listen.tryKey": "Select this text, {how}.",
    "listen.tryTwice": "Select this text, press Ctrl + C twice.",
    "listen.tryNone": "Set a key above (Ctrl + C twice can be it), then select this text.",
    "listen.cardGroup": "The card",
    "listen.autoRead": "Read aloud when a card opens",
    "listen.rareWords": "Dotted line under less common words",
    "listen.oneAtATime": "Listen reads one sentence at a time",
    "listen.wordHint": "Show word meanings on",
    "listen.hintShift": "Click, or Shift + hover",
    "listen.hintHover": "Click, or hover",
    "listen.hintOff": "Click only",
    "listen.inCard": "In the card",
    "listen.playKeys": "Play, stop and step through sentences",
    "listen.clickWord": "Click a word",
    "listen.clickWordNote": "see its meanings, hear it, star it to keep it in Words",
    "listen.clickSentence": "Click a sentence",
    "listen.clickSentenceNote": "its translation is marked; \u25B6 in the margin reads one paragraph",
    "listen.closeCard": "Close the card and stop the voice",
    "translate.chipReady": "ready",
    "translate.chipFirstUse": "on first use",
    "translate.chipDownloading": "downloading",
    "translate.chipFailed": "failed",
    "translate.chipUnsupported": "not offered",
    "translate.readyNote": "{level} translation, works offline",
    "translate.absentNote": "downloads from {from} at the first translation, then works offline",
    "translate.downloadingNote": "downloading from {from}, once",
    "translate.failedNote": "could not download; the next translation tries again",
    "translate.unsupportedNote": "no offline translator for this language yet",
    "translate.tryKey": "Select it, {how}.",
    "translate.tryNone": "Set a key above, then select it and press the key.",
    "translate.typeNote": "an empty card by the pointer, from any program; also in the tray menu",
    "translate.pasteBack": "In the card: paste the translation back",
    "translate.shareAsk": "{model} is on this computer already",
    "translate.shareNote": "Check my English and Talk use it. Translate can use it too, with nothing to download: {fast} shows a draft at once, then {model} sets it right.",
    "translate.shareUse": "Translate with {model}",
    "translate.empty": "Nothing yet. Translations are kept here 30 days, 200 at most.",
    "models.aboutFast": "Instant; short phrases may come out word for word",
    "models.aboutAccurateLevel": "Understands the whole sentence",
    "models.aboutMostLevel": "The best wording, and the slowest",
    "models.onCard": "on your graphics card",
    "models.partlyOnCard": "partly on your graphics card",
    "models.onProcessor": "on your processor",
    "models.guessCard": "about 1\u20132 s per sentence",
    "models.guessPart": "possible, but slow here",
    "models.guessProcessor": "possible, but slow here: 30 s or more per text",
    "models.cudaGuess": "a few seconds for a short text, 15\u201320 s for a long one",
    "models.cudaSize": "with NVIDIA\u2019s own build, 670 MB",
    "models.starts": "it starts in {time} after 3 idle minutes",
    "models.cardHeld": "Takes {size} of the graphics card while in use; frees it after 3 idle minutes, or when a game or video goes full screen",
    "models.cardFrees": "Frees the graphics card after 3 idle minutes, or when a game or video goes full screen",
    "models.slowHere": "slow here",
    "models.here": "here",
    "models.perSentence": "{time} per sentence",
    "models.perCheck": "{time} per text checked",
    "models.perAnswer": "{time} per answer in Talk",
    "models.aboutAccurate": "Understands the whole sentence and catches nearly every mistake",
    "models.aboutMost": "The best wording, a little more careful, and slower",
    "models.failedRetry": "the download failed; Try again downloads it again",
    "models.onComputer": "{size} on this computer",
    "models.downloadingSize": "{size}, downloading",
    "models.toDownloadFirst": "{size} to download at its first use",
    "models.toDownloadPicked": "{size} to download when picked",
    "models.download": "Download",
    "models.remove": "Remove {level} ({size}); it downloads again when picked",
    "models.fastFailed": "the download failed; the next translation tries again",
    "models.onThisComputer": "on this computer",
    "models.fastNext": "{size} for your language, downloads with the next translation",
    "models.fastPicked": "{size} for your language, downloads when picked",
    "models.draft": "also shows a quick draft while {accurate} or {most} translates",
    "models.checkMoves": "Check my English moves to it too: one model does both",
    "models.checkShares": "Check my English uses it too: downloaded once, loaded once",
    "models.checkAlready": "Check my English uses it already",
    "models.translateWith": "Translate with",
    "models.translateShares": "Translate uses it too: downloaded once, loaded once",
    "models.translateStays": "Translate stays on {fast}",
    "models.translateMoves": "Translate moves to it too: one model does both",
    "models.checkWith": "Check with",
    "models.fastOnly": "{fast} only translates; checking needs one of these.",
    "models.engine": "Speech engine",
    "models.speechWith": "{name} with",
    "models.options": "Options",
    "models.naturalReady": "the natural voice",
    "models.naturalLater": "the natural voice once it is downloaded, a Windows voice until then",
    "models.naturalNote": "natural, made on this computer (Kokoro)",
    "models.naturalFaster": "prepares speech {n}\xD7 faster than it plays",
    "models.windowsNote": "a Windows voice: instant, less natural",
    "models.readWith": "Read with",
    "models.naturalSlow": "The natural voice prepares speech slower than it plays here, so it pauses between sentences; a Windows voice is instant.",
    "models.useRecommendedTitle": "Use the recommended models",
    "models.useRecommendedNote": "what runs best on this computer, for every action; you see what changes first",
    "models.useRecommended": "Use recommended",
    "models.already": "Already as recommended",
    "models.alreadyNote": "every action uses what this computer runs best",
    "models.apply": "Apply",
    "models.changes": "Use recommended changes",
    "models.toDownload": "{size} to download",
    "models.toDownloadAll": "{size} to download in all",
    "models.nothingToDownload": "Nothing to download",
    "models.free": "{size} free",
    "models.nothingRemoved": "nothing is removed",
    "models.needsFree": "Needs {size} free",
    "models.unused": "{size} that nothing uses",
    "models.unusedNote": "{list}; each downloads again if you pick it later",
    "models.cleaning": "Cleaning up\u2026",
    "models.cleanUp": "Clean up",
    "models.computer": "This computer",
    "models.eachAction": "What each action uses",
    "models.translateNote": "how well and how quickly texts are translated",
    "models.checkTalk": "Check and talk",
    "models.dictateNote": "writes what you say",
    "models.transcribeNote": "writes recordings and meetings down",
    "models.shared": "A model two actions use is downloaded and loaded once: Translate and Check share the language model, voice typing and recordings a speech model where that costs nothing.",
    "models.stateDownloading": "downloading {pct}%",
    "models.stateFailed": "download failed",
    "engine.notRunning": "The speech engine is not running",
    "engine.noSound": "No sound",
    "engine.tooLong": "Too long for dictation: transcribe it instead",
    "engine.notRecording": "Not a recording: {why}",
    "engine.noDictation": "No such dictation",
    "engine.notRecognized": "Could not recognize: {why}",
    "engine.noModelToTest": "No downloaded model to test",
    "engine.testRunning": "A test is running",
    "engine.noModel": "No such model",
    "engine.notRemoved": "Could not remove {name}: {why}",
    "engine.usedByTranscripts": "In use: the transcripts model",
    "engine.usedByDictation": "In use: the dictation model",
    "engine.usedLoaded": "In use right now: try again in a minute",
    "engine.usedDownloading": "In use: downloading",
    "engine.usedTest": "In use: the speed test runs",
    "engine.pasteKey": "Paste a Hugging Face key first",
    "engine.addKey": "Add a Hugging Face key first",
    "engine.noTranscript": "No such transcript",
    "engine.stillTranscribing": "This recording is still being transcribed",
    "engine.transcribingNow": "This recording is being transcribed right now",
    "engine.oneVoice": "A note has one voice",
    "engine.installSpeakers": "Install the speakers part first",
    "engine.soundNotKept": "The sound of this recording was not kept",
    "engine.cannotSplit": "This meeting can no longer be split: its words were not kept",
    "engine.onlyFailed": "Only a failed transcription can be tried again",
    "engine.sourceGone": "The source sound is gone",
    "engine.chooseFolder": "Choose a knowledge base folder first",
    "engine.fileNotFound": "File not found",
    "engine.notMedia": "Not an audio or video file",
    "engine.tooLarge": "The recording is too large",
    "engine.ended": "The recording has ended",
    "engine.nothing": "Nothing to transcribe",
    "engine.notInstalled": "The speech engine is not installed",
    "engine.keepsStopping": "The speech engine keeps stopping ({code}): see {log}",
    "engine.portTaken": "Port {port} is used by another program: quit it, then press Restart",
    "engine.portsTaken": "Ports {from}\u2013{to} are all taken by other programs: quit one, then press Restart",
    "engine.installFailed": "Installing the speech engine failed ({code}): {why}",
    "engine.unpackFailed": "Could not unpack the Python manager: {why}",
    "engine.installRunning": "An install is running",
    "engine.notWhole": "{name} did not arrive whole",
    "engine.hfAnswered": "Hugging Face answered {status}",
    "engine.hfError": "Hugging Face answered with an error",
    "engine.hfOffline": "No connection to Hugging Face",
    "engine.downloadFailed": "The download failed: {why}",
    "check.downloadingPct": "downloading {pct}%",
    "talkPage.downloading": "downloading; the talk starts once it is here",
    "talkPage.downloadOnce": "downloaded once; Check my English and Translate can use it too",
    "settings.download": "Download",
    "talkPage.engineTitle": "Talk hears you through the speech engine",
    "talkPage.engineNote": "Until it is here, type to the duck. Download it on the Voice typing page; it is the same engine.",
    "talkPage.openDictate": "Open Voice typing",
    "talkPage.aboutPlaceholder": 'A few words the duck can talk about: your name, your work, what you like. "I am Alex, a designer. I love hiking and progressive metal."',
    "talkPage.aboutYou": "About you",
    "talkPage.needsEngine": "needs the speech engine (see Voice typing)",
    "talkPage.openGoing": "in its own window \xB7 going on: {topic}, {lines}",
    "talkPage.aboutNote": "The duck reads it in every talk, to ask about your life and work. Kept only on this computer.",
    "talkPage.level": "Your English level",
    "talkPage.levelA2": "Elementary: the duck speaks in short sentences of everyday words, simple tenses, no idioms",
    "talkPage.levelB1": "Intermediate: the duck speaks in everyday words and common phrasal verbs; a rarer word explained",
    "talkPage.levelB2": "Upper-intermediate: the duck speaks in natural speech: longer sentences, phrasal verbs, an idiom now and then",
    "talkPage.keys": "Keys",
    "talkPage.spaceKey": "In the talk window: talk, then send",
    "talkPage.escKey": "Drop the line, or quiet the duck",
    "talkPage.aloud": "Read the duck aloud",
    "talkPage.aloudNote": "its answers are read as they come; a tap on a line reads it again",
    "talkPage.onTop": "Keep the talk on top",
    "talkPage.onTopNote": "over other windows, as with the pin in its bar",
    "talkPage.model": "Model",
    "talkPage.voice": "Voice",
    "talkPage.kept": "Kept",
    "talkPage.history": "Your talks are in the talk window: its history button lists them, to go on with one or delete it. Kept 30 days on this computer, 50 at most.",
    "check.typedKey": "{keys} and type it",
    "check.typedTray": "use Check my English\u2026 in the tray menu",
    "check.tryKey": "This text has mistakes on purpose. Select it, {keys}, or {typed}.",
    "check.tryNoKey": "This text has mistakes on purpose. Select it and press your key, or {typed}.",
    "check.keySelected": "Check the selected text",
    "check.typeKey": "Type a text to check",
    "check.typeKeyNote": "an empty card by the pointer, from any program; also in the tray menu",
    "check.speechNote": "Speech recognition fixes some mistakes as it writes, so typing shows more of them.",
    "mistakes.title": "Mistakes",
    "mistakes.forget": "Forget it",
    "mistakes.noSuch": "No such mistake.",
    "mistakes.empty": "Nothing yet. The texts Check my English set right are kept here, on this computer.",
    "mistakes.repeat": "You repeat",
    "mistakes.times": { one: "{n} time", other: "{n} times" },
    "mistakes.clear": "Clear",
    "mistakes.search": "Search your mistakes",
    "screen.how": "How it works",
    "screen.draw": "Draw a box around the text",
    "screen.drawNote": "Windows dims the screen while you draw",
    "screen.reads": "Tyts reads the text on this computer",
    "screen.readsNote": "it reads the languages Windows has installed; add more there (Windows OCR)",
    "screen.languages": "Languages\u2026",
    "screen.fix": "Fix misread words in the card",
    "screen.fixNote": "then translate it or read it aloud",
    "dictate.notesFolder": "Notes folder",
    "dictate.folderShown": "shown once the speech engine runs",
    "dictate.folderChosen": "chosen once the speech engine is installed",
    "dictate.inboxPlaceholder": "the folder itself",
    "dictate.inboxAria": "Folder for notes",
    "dictate.folderNone": "not chosen yet; notes need a folder (an Obsidian vault will do)",
    "dictate.change": "Change",
    "dictate.choose": "Choose\u2026",
    "dictate.subfolder": "Subfolder for notes",
    "dictate.subfolderNote": "a folder inside it; leave empty to use the folder itself",
    "dictate.needsEngine": "needs the speech engine",
    "dictate.automatic": "Automatic \xB7 {model}",
    "settings.automatic": "Automatic",
    "dictate.speechModel": "Speech model",
    "dictate.engine": "Speech engine",
    "dictate.typeNote": "the text appears where the cursor is",
    "dictate.englishNote": "press, speak {lang}, press again; English is typed",
    "dictate.noteNote": "into your notes folder",
    "dictate.againKey": "Type the last phrase again",
    "dictate.againNote": "repeats it where the cursor is",
    "dictate.hold": "Hold the key to talk",
    "dictate.holdNote": "speak while holding, release to type; a quick tap still starts and stops",
    "dictate.holdMac": "Holding needs Accessibility: System Settings \u203A Privacy & Security \u203A Accessibility, turn Tyts on. Until then the keys start and stop with a press.",
    "dictate.panel": "Show the panel while dictating",
    "dictate.panelNote": "off: the red dot in the tray shows the recording; an error still comes up for a moment",
    "dictate.escNote": "The words appear as you speak. Esc cancels the phrase before it is typed.",
    "dictate.privacy": "Speech is recognized on this computer; nothing is sent anywhere.",
    "vocab.wordPlaceholder": "Word",
    "vocab.wordAria": "Name or term",
    "vocab.heardPlaceholder": "How it sounds, comma-separated",
    "vocab.heardAria": "What it is heard as",
    "vocab.change": "Change it",
    "vocab.remove": "Remove {word}",
    "vocab.addGroup": "Add a word",
    "vocab.add": "Add",
    "vocab.addNote": "A name or a term; dictation and transcripts write it this way, and a heard form is replaced wherever it is said.",
    "vocab.words": "Words",
    "vocab.clearAll": "Clear all",
    "vocab.empty": "Nothing yet. Add a name or a word above.",
    "vocab.shared": "Voice typing and recordings both use them.",
    "dictate.phrases": "Phrases",
    "dictate.said": "Said: {heard}",
    "dictate.recentEmpty": "Nothing yet. Dictated phrases (not notes) are kept here 30 days, 200 at most.",
    "dictate.yesterdayAt": "yesterday {time}",
    "dictate.copiedText": "Copied: {text}",
    "dictate.justNow": "just now",
    "dictate.minAgo": { one: "{n} min ago", other: "{n} min ago" },
    "dictate.hAgo": { one: "{n} h ago", other: "{n} h ago" },
    "dictate.yesterday": "yesterday",
    "transcribe.speakers": "Who spoke when",
    "transcribe.speakersNote": "the words are recognized already; this tells the voices apart",
    "transcribe.downloading": "downloading\u2026",
    "transcribe.notInstalled": "not installed \xB7 \u2248{size}",
    "transcribe.onCard": "on the graphics card",
    "transcribe.onCpu": "on the processor",
    "transcribe.ready": "ready",
    "transcribe.keySaved": "key saved",
    "transcribe.checking": "checking\u2026",
    "transcribe.needsKey": "needs a key",
    "transcribe.keyFailed": "the key failed",
    "transcribe.noAccess": "no access yet",
    "transcribe.couldNotCheck": "could not check",
    "transcribe.new": "New transcription",
    "transcribe.setup": "Setup",
    "transcribe.keptIn": "Transcripts are kept in",
    "kb.inOrder": "In this order",
    "kb.earlier": "Earlier",
    "kb.later": "Later",
    "kb.leaveOut": "Leave out",
    "kb.addLayout": "Add a layout",
    "kb.addLayoutNote": "one Windows has; it goes last",
    "kb.pickLayout": "Pick a layout",
    "kb.ownOrder": "Your own order. Leave every layout out to go back to the languages you use.",
    "kb.orderFromLanguages": "The order comes from the languages you use (Settings); move one or leave one out to set your own.",
    "kb.ownKey": "A key of its own",
    "kb.straight": "goes straight to it",
    "kb.capitals": "Capitals",
    "kb.twoCaps": "Fix two capitals at the start",
    "kb.twoCapsNote": "\u041F\u0420\u0438\u0432\u0435\u0442 \u2192 \u041F\u0440\u0438\u0432\u0435\u0442; IDs and URLs stay",
    "kb.capsLock": "Fix a word typed with Caps Lock on",
    "kb.capsLockNote": "\u043F\u0420\u0418\u0412\u0415\u0422 \u2192 \u041F\u0440\u0438\u0432\u0435\u0442, and Caps Lock is turned off",
    "kb.keepCaps": "Leave words in capitals as typed",
    "kb.keepCapsNote": "abbreviations in capitals are never fixed",
    "kb.when": "When",
    "kb.onPause": "Also fix after a pause",
    "kb.onPauseNote": "a wrong word is fixed a second after you stop typing",
    "kb.sound": "Play a quiet click when a word is fixed",
    "kb.chime": "Play a sound when the layout switches",
    "kb.chimeNote": "when you switch it; English sounds higher",
    "kb.chimeName": "Sound",
    "kb.chimePick": "tap one to hear it: English, then another layout",
    "kb.chime.glass": "Glass",
    "kb.chime.pluck": "Pluck",
    "kb.chime.string": "String",
    "kb.chime.duck": "Duck",
    "kb.shortWords": "Short words are fixed together with the word after them: z rfr \u2192 \u044F \u043A\u0430\u043A. After you switch the layout yourself, the next word is left as typed.",
    "kb.addProgram": "Add a program",
    "kb.addProgramNote": "The name of its .exe. It starts with fixing as you type left out; open it to choose more.",
    "kb.addThis": "Add {exe}",
    "kb.addThisNote": "the program in front a moment ago",
    "kb.addRunning": "Add a running program",
    "kb.addRunningNote": "one with a window open now",
    "kb.pickProgram": "Pick a program",
    "kb.programs": "Programs",
    "kb.programsEmpty": "None yet. Add a program above: Tyts leaves out what you choose there, or switches to its own layout when it comes to the front.",
    "kb.partFix": "fixing as you type",
    "kb.partSwitch": "the switch keys",
    "kb.partBadge": "the badge",
    "kb.partKeys": "every key of Tyts",
    "kb.leftOut": "left out: {parts}",
    "kb.startsIn": "starts in {layout}",
    "kb.nothingLeftOut": "nothing left out",
    "kb.noLonger": "This program is no longer in the list.",
    "kb.hereKryakl": "Here, Tyts",
    "kb.fixes": "Fixes words as you type",
    "kb.fixesNote": "off: words stay as typed; the fix key still works",
    "kb.switches": "Switches the layout by its keys",
    "kb.switchesNote": "the switch key and the layouts' own keys",
    "kb.shows": "Shows the layout by the cursor",
    "kb.hears": "Hears its keys at all",
    "kb.hearsNote": "off: none of Tyts's keys works here, but the pause key",
    "kb.layout": "Layout",
    "kb.startsInTitle": "Starts in",
    "kb.startsInNote": "each time the program comes to the front",
    "kb.asItWas": "As it was",
    "kb.outOfList": "Out of the list",
    "kb.outOfListNote": "everything works here again",
    "kb.remove": "Remove",
    "kb.learn": "Learn from my typing",
    "kb.learnNote": "never in a password field, a program left out of fixing, or on the full screen",
    "kb.fixedAlways": "Fixed always",
    "kb.into": "into {lang}",
    "kb.fixedAlwaysEmpty": "A word you fix by hand twice (the fix key, or erased and typed again in the other layout) is fixed by itself from then on.",
    "kb.myWordNote": "{lang} \xB7 left as typed, and fixed into it from another layout",
    "kb.myWordsEmpty": "A word in no dictionary that you type right three times becomes yours: Tyts leaves it as typed, and fixes into it what is typed in the wrong layout. Until then only an unreadable fingerprint of it is kept.",
    "kb.forgetAll": "Forget all",
    "kb.forgetAllNote": "what Tyts learned goes; Kept as typed stays",
    "kb.forgetBtn": "Forget",
    "kb.keptPlaceholder": "word, as you type it",
    "kb.keptAddNote": "The fix key right after a fix adds the word too.",
    "kb.keptEmpty": "None yet. Add a word above, or press the fix key right after a fix you did not want.",
    "kb.alsoUsing": "Also using the keyboard: {apps}.",
    "kb.oneOfThem": "One of them presses keys by itself; Tyts ignores those.",
    "kb.aProgram": "A program presses keys by itself; Tyts ignores those.",
    "kb.switchKey": "Switch to the next layout",
    "kb.switchTap": "tap the key, nothing else",
    "kb.switchNote": "goes to the next of the layouts listed below",
    "kb.switchingByKeys": "Switching by keys",
    "kb.fixKey": "Fix the last words",
    "kb.fixKeyNote": "retypes what came out in the wrong layout; press again for the next one",
    "kb.theFixKey": "The fix key",
    "kb.autoFix": "Fix words as I type",
    "kb.autoFixNote": "{typed} \u2192 {fixed} on space; the fix key right after undoes it",
    "kb.fixing": "Fixing as I type",
    "kb.fixingNote": "capitals, short words, fixing after a pause",
    "kb.badgeNote": "a small badge appears when the layout or Caps Lock changes",
    "kb.trayNote": "the tray icon shows the current layout, such as en or ru",
    "kb.fullScreen": "Stay off in full screen",
    "kb.fullScreenNote": "games, presentations, videos",
    "kb.layoutsOwn": "the layouts the switch key goes through; {n} with a key of their own",
    "kb.layoutsNote": "the layouts the switch key goes through, in order",
    "kb.rivals": { one: "{names} is running: turn off its layout switching, or words get fixed twice.", other: "{names} are running: turn off its layout switching, or words get fixed twice." },
    "kb.elevated": "{app} runs as administrator: Windows keeps its keys from Tyts, so nothing is fixed or switched there.",
    "kb.trouble": "The keyboard helper: {trouble}",
    "kb.macAccess": "To fix and switch layouts, Tyts needs Accessibility: System Settings \u203A Privacy & Security \u203A Accessibility, turn Tyts on.",
    "kb.macAccessOpen": "Open Accessibility settings",
    "kb.macInput": "Tyts sees only modifier keys: it needs Input Monitoring too. System Settings \u203A Privacy & Security \u203A Input Monitoring, turn Tyts on (or add it with +), then quit and open Tyts again.",
    "kb.macInputOpen": "Open Input Monitoring settings",
    "kb.windowsOnly": "The keyboard layout features (switching and fixing) are Windows-only for now.",
    "kb.privacy": "Tyts reads your keystrokes only to fix the layout, and sends nothing anywhere. It keeps only the words it learned, on this computer.",
    "words.noSuch": "No such word.",
    "words.empty": "No words yet. Click a word in a card and tap its star.",
    "words.search": "Search words and sentences",
    "words.hint": "The star in a word\u2019s card adds it here",
    "words.export": "Export for Anki\u2026",
    "settings.natural": "Natural voice",
    "settings.naturalNote": "{size} MB to download, then it reads offline (Kokoro)",
    "settings.downloadFailed": "The download failed.",
    "settings.naturalDownloading": "natural \xB7 downloading {pct}%",
    "settings.autoNatural": "Automatic \xB7 natural",
    "settings.autoWindows": "Automatic \xB7 Windows",
    "storage.fast": "Fast translation",
    "storage.fastNote": "translates this language both ways (Firefox Translations)",
    "storage.dict": "Word meanings",
    "storage.dictNote": "what a word card shows (Wiktionary)",
    "storage.voiceNote": "reads English aloud (Kokoro)",
    "storage.llmNote": "the language model that translates and checks your English ({model})",
    "storage.unused": "Models no longer used",
    "storage.unusedNote": "an older Tyts\u2019s translation models (TranslateGemma)",
    "storage.llama": "The language models\u2019 runner",
    "storage.llamaNote": "runs {a} and {b} on any graphics card or the processor (llama.cpp)",
    "storage.speechModelNote": "writes down what is said",
    "storage.speech": "Speech recognition",
    "storage.speechNote": "the program that runs the speech models (Python, faster-whisper)",
    "storage.gpu": "Graphics card support",
    "storage.gpuNote": "speech on the NVIDIA card, several times quicker (CUDA)",
    "storage.speakersNote": "tells the voices of a recording apart (PyTorch, pyannote)",
    "storage.yours": "Your settings and lists",
    "storage.yoursNote": "words, mistakes, what Tyts learned, logs",
    "storage.transcriptsNote": "yours: the text and a small copy of the sound",
    "storage.speechToText": "{about} \xB7 speech to text",
    "storage.cudaNote": "NVIDIA\u2019s build, for a model that does not fit the graphics card (llama.cpp CUDA)",
    "storage.lossTranslate": "Translate goes back to Fast, and Check my English downloads it again at its next check",
    "storage.lossCheck": "Check my English downloads it again at its next check",
    "storage.lossSpeech": "Voice typing and recordings stop until it is downloaded again; transcripts and notes stay",
    "storage.lossGpu": "speech goes back to the processor, several times slower",
    "storage.lossSpeakers": "transcripts stop telling the voices apart until it is added again",
    "storage.lossDefault": "it downloads again at its next use",
    "storage.notUsed": "Not used",
    "storage.removeAsk": "{loss}. Remove it?",
    "storage.keep": "Keep",
    "storage.usedBy": "used by {users}",
    "storage.reserve": "kept for {reserve} on the processor, if the graphics card fails",
    "storage.userTranslate": "Translate",
    "storage.userListen": "Translate",
    "storage.userCheck": "English",
    "storage.userDictate": "Voice typing",
    "storage.userTranscribe": "Recordings and meetings",
    "storage.frees": "removing it frees {free}: {shared} of its files are shared with other Python tools here",
    "storage.removeAskTitle": "Remove\u2026",
    "storage.removeTitle": "Remove; it downloads again if you pick it later",
    "storage.measuring": "Measuring what Tyts keeps\u2026",
    "storage.downloads": "Downloads",
    "storage.everything": "Everything Tyts downloads: {size}",
    "storage.inFolderAway": "in Tyts\u2019s folder, but for the parts that say where they are \xB7 {free} free on {drive}",
    "storage.inFolder": "in one folder \xB7 {free} free on {drive}",
    "storage.openFolder": "Open folder",
    "storage.models": "Models and voices",
    "storage.nothing": "Nothing downloaded yet: each model downloads when you first use it.",
    "storage.programs": "Programs that run them",
    "storage.yoursGroup": "Yours",
    "storage.inOld": "{size} still in an old folder of Krya or Altype",
    "storage.outside": "{size} still outside Tyts\u2019s folder",
    "storage.usesThere": "{names}: Tyts uses them from there. Moving stops the speech engine and the model, then starts Tyts again",
    "storage.notMoved": "Not moved: {why}",
    "storage.moving": "Moving\u2026",
    "storage.move": "Move to Tyts",
    "settings.languages": "Languages you use",
    "settings.languagesNote": "when Tyts hears or reads a text, it guesses among these",
    "settings.addLanguage": "Add a language",
    "settings.addLanguageNote": "dictation never picks another; translation and the screen\u2019s text guess among them",
    "settings.pickLanguage": "Pick a language",
    "settings.languagesGroup": "Languages",
    "settings.yourLangNote": "your language \xB7 changed in Settings",
    "settings.englishNote": "always: the language Tyts teaches",
    "settings.speed": "Speed",
    "settings.speedNote": "how fast it reads",
    "settings.yourLanguage": "Your language",
    "settings.yourLanguageNote": "Tyts translates into it and shows word meanings in it",
    "settings.theme": "Theme",
    "settings.themeSystem": "As Windows",
    "settings.themeLight": "Light",
    "settings.themeDark": "Dark",
    "settings.startWithWindows": "Start with Windows",
    "settings.pause": "Pause Tyts",
    "settings.pauseNote": "all shortcuts and fixing stop until you turn it back on; also in the tray menu",
    "settings.pauseKey": "Pause",
    "settings.pauseKeyNote": "Tyts stays quiet until you press it again",
    "settings.windowKey": "Open Tyts\u2019s window",
    "settings.windowKeyNote": "from any program",
    "settings.resetKeys": "Reset all keys",
    "settings.resetKeysNote": "every key back to how it came",
    "settings.version": "Version {version}",
    "settings.versionDev": "Version {version} dev",
    "settings.built": "built {build}",
    "settings.versionNote": "new versions: download the installer from GitHub and run it; your settings and downloads stay",
    "settings.betaNote": "a beta: some things may still break; Report a problem helps fix them",
    "settings.newVersions": "New versions",
    "settings.backup": "Backup",
    "settings.backupTitle": "Back up or move to another computer",
    "settings.backupNote": "settings, words, mistakes, what Tyts learned from your typing, recent translations and phrases, in one file; models download again",
    "settings.export": "Export",
    "settings.importNote": "Import replaces your settings with the backup\u2019s and adds its words and history to yours; nothing of yours is removed.",
    "settings.resetAll": "Reset all settings",
    "settings.resetAllNote": "keys, switches and lists back to how they came; your words and history stay",
    "about.online": "goes online only for",
    "about.onlineList": "a one-time download of each part: the translator for your language, the natural voice ({size} MB), word meanings",
    "about.newVersions": "New versions",
    "about.source": "Code on GitHub",
    "about.licenses": "Licenses",
    "about.story": "Based on Kryakl",
    "about.storyText": "Tyts is built on Kryakl by Yevhen Peshynskyi, open source under the MIT license, with a version for the Mac and calls added.",
    "about.authorGroup": "Author",
    "about.role": "Telegram @designmakc",
    "about.bio": "Tyts is my fork of Kryakl.",
    "about.mail": "Email",
    "about.write": "Write",
    "about.versionTitle": "Version",
    "about.license": "License",
    "about.licenseValue": "free, open source (MIT)",
    "about.offline": "Works offline",
    "about.offlineNote": "your text never leaves the computer",
    "about.bug": "Found a bug?",
    "about.bugNote": "this is a beta, something may not work right",
    "about.report": "Report",
    "about.thanks": "Thanks to",
    "report.placeholder": "What did you do, what happened, and what did you expect? The steps that make it happen again help most.",
    "report.what": "What happened",
    "report.anyLanguage": "In any language; it goes as you wrote it.",
    "report.send": "Send it",
    "report.email": "Email it",
    "report.emailNote": "Opens your mail to {email} with your text in it; attach the report file Tyts saves",
    "report.emailBtn": "Email",
    "report.issue": "Open a GitHub issue",
    "report.issueNote": "A public page others with the same problem can find; needs a GitHub account",
    "report.issueBtn": "GitHub issue",
    "report.saved": "Saved {file} in Documents \u203A Tyts \u203A Reports: drag it into the message. ",
    "report.showInFolder": "Show in folder",
    "report.failed": "The report could not be made: {error}",
    "report.holds": "What the report file holds",
    "report.log": "Tyts\u2019s log",
    "report.logNote": "What Tyts did lately: keys, copies, windows, downloads, errors",
    "report.otherLogs": "The speech engine\u2019s and the translation model\u2019s logs",
    "report.otherLogsNote": "Dictation, transcripts and the model starting, stopping and failing",
    "report.computer": "This computer and Tyts",
    "report.computerNote": "Processor, memory, graphics card, Windows and Tyts\u2019s versions",
    "report.settings": "Your settings",
    "report.settingsNote": "Your own lists only counted: words kept as typed, names and terms, programs",
    "report.never": "Never in it: your texts, words, mistakes, translations, phrases, transcripts or Hugging Face key. Your Windows name and the computer\u2019s are replaced. Nothing is sent until you send it.",
    "report.folder": "Tyts\u2019s folder",
    "report.folderNote": "Where the logs are, to look at them yourself",
    "report.stopped": "If something stopped working",
    "report.restart": "Restart the speech engine",
    "report.restartNote": "Voice typing and recordings run in it \xB7 {state}",
    "report.stateOff": "off",
    "report.stateStarting": "starting\u2026",
    "report.stateRunning": "running",
    "report.stateBusy": "running \xB7 transcribing now",
    "report.stateDown": "stopped",
    "report.restartBtn": "Restart",
    // The action pages
    "act.translate": "Translate",
    "act.translateNote": "Enter puts the translation in place of the text",
    "act.listen": "Translate and read aloud",
    "act.listenNote": "the English is read aloud, the translation under it",
    "act.inPlace": "Replace with translation",
    "act.inPlaceNote": "no window, right in the text",
    "act.selected": "Selected text",
    "act.screen": "Text on the screen",
    "act.screenNote": "draw a box around the text",
    "act.own": "Your own text",
    "act.ownKey": "Type a text to translate",
    "act.quality": "Translation quality",
    "act.cardNote": "reading, word meanings, its keys",
    "act.screenHowNote": "the text is read on this computer, in the languages Windows has",
    "act.try": "Try it",
    "act.talkGroup": "Talk to the duck",
    "act.talk": "Start a talk",
    "act.talkNote": "speak English, the duck answers aloud",
    "act.empty": "empty",
    "act.talkWindow": "Talk window",
    "act.talkWindowNote": "reading aloud, on top, its keys and history",
    "act.checkNote": "mistakes struck out, the fix beside them; Enter puts it back",
    "act.say": "Say it and check",
    "act.sayNote": "speak English, mistakes get marked",
    "act.fixGroup": "Fixing",
    "act.switchGroup": "Switching",
    "act.general": "General",
    "act.notChosen": "not chosen",
    "act.newWords": "New words",
    "ui.forget": "Forget",
    // The call recording (capture.ts): all of the computer's sound and the microphone, in a small panel.
    "call.title": "Call {when}",
    "call.record": "Record a call",
    "call.stop": "Stop recording the call",
    "call.recordNote": "Your microphone and all of the computer\u2019s sound, until you stop; then it is transcribed",
    "call.keyNote": "Starts and stops a call recording",
    "call.panel": "Call",
    "call.allSound": "All of the computer\u2019s sound",
    "call.pause": "Pause",
    "call.resume": "Resume",
    "call.stopShort": "Stop",
    "call.paused": "Paused",
    "call.hide": "Hide: the recording goes on",
    "call.shot": "Take a screenshot",
    "call.shotKey": "Take a screenshot during a call",
    "call.shotKeyNote": "Saved with the recording, shown in its transcript",
    "call.shots": "Screenshots during a call",
    "call.shotsNote": "Every 4 seconds, when the screen changed; kept beside the recording, deleted with it",
    "call.names": "Speaker names from the screen",
    "call.namesNote": "Experimental, may be wrong: read off the call\u2019s screenshots and only offered, never applied by themselves",
    "call.starting": "Starting\u2026",
    "call.saving": "Saving\u2026",
    "call.noMic": "Microphone unavailable: recording the others only",
    "call.silent": "I don\u2019t hear the others: check the sound source",
    "call.failed": "Could not record the computer\u2019s sound: {why}",
    "call.noSound": "the system gave no sound",
    "call.openSettings": "Open settings",
    "call.consentAsk": "Many countries require the other people\u2019s consent to record a call",
    "call.consentDetail": "Tell them you are recording. Tyts says this once.",
    "call.consentRecord": "Record",
    "call.quitAsk": "A call is being recorded. Stop and save it?",
    "call.quitStop": "Stop and save",
    "call.screenAsk": "Tyts needs permission to record the computer\u2019s sound",
    "call.screenDetail": "Windows gives a program the computer\u2019s sound only with \u201CScreen & System Audio Recording\u201D. Tyts keeps the sound alone and drops the picture at once. Turn Tyts on there, then start the recording again.",
    "call.auto": "When a call takes the microphone",
    "call.autoNote": "Zoom, Teams, Slack, Telegram, Discord, FaceTime, Webex, or Google Meet in a browser, on the microphone for 10 s. The recording stops 20 s after the call; one shorter than a minute is deleted.",
    "call.autoOff": "Do nothing",
    "call.autoAsk": "Ask",
    "call.autoRecord": "Record",
    "call.askTitle": "Record the call?",
    "call.askNote": "{app} is using the microphone",
    "call.askRecord": "Record",
    "call.askLater": "Not now",
    "call.autoStarted": "Started by itself",
    "call.dontRecord": "Don\u2019t record",
    "keys.useMeeting": "recording a call",
    "keys.useShot": "a screenshot during a call",
    "sum.title": "Summary",
    "sum.make": "Make a summary",
    "sum.again": "Make again",
    "sum.tGeneral": "General",
    "sum.tStandup": "Stand-up",
    "sum.tInterview": "Interview",
    "sum.tLecture": "Lecture or webinar",
    "sum.tOwn": "My own instruction",
    "sum.ownPlaceholder": "What the summary should say (up to 500 characters)",
    "sum.mine": "In my language",
    "sum.starting": "Making the summary\u2026",
    "sum.working": "Making the summary: part {part} of {parts}",
    "sum.joining": "Making the summary: putting the parts together",
    "sum.passed": "{time} passed",
    "sum.left": "about {time} left",
    "sum.failed": "Could not make the summary",
    "sum.failedNote": "The transcript is untouched.",
    "sum.needModel": "The summary needs the {name} model ({size})",
    "sum.needModelNote": "It is downloaded once and runs on this computer.",
    "sum.downloading": "Downloading the model\u2026",
    "sum.edit": "Edit",
    "sum.editHint": "Saved when you leave the field",
    "sum.done": "Done",
    "sum.replaceAsk": "Replace the corrected summary?",
    "sum.replace": "Replace",
    "sum.copied": "The summary is copied",
    "sum.lost": "Lost pieces of the recording: {n} (10 s each)",
    "sum.seek": "Listen from here",
    "sum.shot": "Show the screenshot",
    "sum.setAuto": "Make the summary right away",
    "sum.setAutoNote": "After a recorded call is transcribed, if the model is downloaded",
    "sum.setTemplate": "Summary template",
    "sum.setTemplateNote": "For summaries made by themselves; each page can pick another",
    "sum.setMineNote": "Otherwise it is written in the language of the meeting",
    "tr.srcAllSound": "All sound"
  };

  // src/i18n/ru.ts
  var ru = {
    // ------------------------------------------------------------ shared
    "app.name": "\u0422\u0438\u0446\u044C",
    "app.tagline": "\u0422\u0438\u0446\u044C \u2014 \u0438 \u0433\u043E\u0442\u043E\u0432\u043E",
    "common.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    "common.restore": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
    "common.maximize": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C",
    "common.copy": "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    "common.copied": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
    "common.notNow": "\u041D\u0435 \u0441\u0435\u0439\u0447\u0430\u0441",
    "common.beta": "\u0431\u0435\u0442\u0430",
    "common.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "common.tryAgain": "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0435\u0449\u0451 \u0440\u0430\u0437",
    "common.openSettings": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "common.listen": "\u0421\u043B\u0443\u0448\u0430\u0442\u044C",
    "common.stop": "\u0421\u0442\u043E\u043F",
    "common.paste": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
    "common.listening": "\u0421\u043B\u0443\u0448\u0430\u044E\u2026",
    "common.checking": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\u2026",
    "common.or": "\u0438\u043B\u0438",
    "common.and": "\u0438",
    "common.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
    "main.saveWords": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u043B\u043E\u0432\u0430 \u0434\u043B\u044F Anki",
    "main.ankiText": "\u0422\u0435\u043A\u0441\u0442 \u0434\u043B\u044F Anki",
    "main.saveBackup": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E",
    "main.backupFile": "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F \u043A\u043E\u043F\u0438\u044F \u0422\u0438\u0446\u044C",
    "main.openBackup": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E",
    "main.backupUnread": "\u042D\u0442\u0443 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C",
    "main.importAsk": "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u0443 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043A\u043E\u043F\u0438\u044E?",
    "main.importDetail": "\u0412 \u043D\u0435\u0439: {what}. \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0442\u0430\u043D\u0443\u0442 \u0442\u0430\u043A\u0438\u043C\u0438, \u043A\u0430\u043A \u0432 \u043A\u043E\u043F\u0438\u0438; \u0435\u0451 \u0441\u043B\u043E\u0432\u0430, \u043E\u0448\u0438\u0431\u043A\u0438 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0434\u043E\u0431\u0430\u0432\u044F\u0442\u0441\u044F \u043A \u0432\u0430\u0448\u0438\u043C, \u043D\u0438\u0447\u0435\u0433\u043E \u0432\u0430\u0448\u0435\u0433\u043E \u043D\u0435 \u0443\u0434\u0430\u043B\u044F\u0435\u0442\u0441\u044F.",
    "main.import": "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    "main.resetAsk": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438?",
    "main.resetDetail": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438, \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u0438 \u0438 \u0441\u043F\u0438\u0441\u043A\u0438 \u0432\u0435\u0440\u043D\u0443\u0442\u0441\u044F \u043A \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u043C. \u0412\u0430\u0448 \u044F\u0437\u044B\u043A, \u0441\u043B\u043E\u0432\u0430, \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0438 \u0442\u043E, \u0447\u0435\u043C\u0443 \u0422\u0438\u0446\u044C \u043D\u0430\u0443\u0447\u0438\u043B\u0441\u044F \u043F\u043E \u0432\u0430\u0448\u0435\u043C\u0443 \u043D\u0430\u0431\u043E\u0440\u0443, \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F.",
    "main.reset": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C",
    "main.resetKeysAsk": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438?",
    "main.resetKeysDetail": "\u041A\u0430\u0436\u0434\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u043A \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u043C\u0443: Ctrl+Alt+S, Ctrl+Alt+T, Ctrl+Alt+D \u0438 Ctrl+Alt+N; \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0431\u0443\u0434\u0443\u0442 \u043E\u0447\u0438\u0449\u0435\u043D\u044B, Ctrl+C \u0434\u0432\u0430\u0436\u0434\u044B \u0442\u043E\u0436\u0435. \u0411\u043E\u043B\u044C\u0448\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F.",
    "main.resetKeys": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "main.saveTranscript": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0443",
    "main.notTranslated": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438: {why}",
    "main.noClipText": "\u0412 \u0431\u0443\u0444\u0435\u0440\u0435 \u043E\u0431\u043C\u0435\u043D\u0430 \u043D\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0433\u043E.",
    "main.nothingCopied": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E. \u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442, \u0437\u0430\u0442\u0435\u043C \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448.",
    "main.keysTaken": { one: "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 {keys} \u0437\u0430\u043D\u044F\u0442\u043E \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.", few: "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F {keys} \u0437\u0430\u043D\u044F\u0442\u044B \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0438\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.", many: "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F {keys} \u0437\u0430\u043D\u044F\u0442\u044B \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0438\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.", other: "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F {keys} \u0437\u0430\u043D\u044F\u0442\u044B \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u0438\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445." },
    "main.copyTwiceOff": "Ctrl+C \u0434\u0432\u0430\u0436\u0434\u044B \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C: {why}. \u041F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435\u0441\u044C \u043C\u0435\u043D\u044E \u0432 \u0442\u0440\u0435\u0435.",
    "backup.settings": "\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "backup.words": { one: "{n} \u0441\u043B\u043E\u0432\u043E", few: "{n} \u0441\u043B\u043E\u0432\u0430", many: "{n} \u0441\u043B\u043E\u0432", other: "{n} \u0441\u043B\u043E\u0432\u0430" },
    "backup.mistakes": { one: "{n} \u043E\u0448\u0438\u0431\u043A\u0430", few: "{n} \u043E\u0448\u0438\u0431\u043A\u0438", many: "{n} \u043E\u0448\u0438\u0431\u043E\u043A", other: "{n} \u043E\u0448\u0438\u0431\u043A\u0438" },
    "backup.learned": { one: "{n} \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u043E\u0435 \u0441\u043B\u043E\u0432\u043E", few: "{n} \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u044B\u0445 \u0441\u043B\u043E\u0432\u0430", many: "{n} \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u044B\u0445 \u0441\u043B\u043E\u0432", other: "{n} \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u0441\u043B\u043E\u0432\u0430" },
    "backup.translations": { one: "{n} \u043F\u0435\u0440\u0435\u0432\u043E\u0434", few: "{n} \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430", many: "{n} \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432", other: "{n} \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430" },
    "backup.phrases": { one: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0444\u0440\u0430\u0437\u0430", few: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0444\u0440\u0430\u0437\u044B", many: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0444\u0440\u0430\u0437", other: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0444\u0440\u0430\u0437\u044B" },
    "backup.talks": { one: "{n} \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440", few: "{n} \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430", many: "{n} \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043E\u0432", other: "{n} \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430" },
    "size.mb": "{n} \u041C\u0411",
    "size.gb": "{n} \u0413\u0411",
    "level.fast": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439",
    "level.accurate": "\u0422\u043E\u0447\u043D\u044B\u0439",
    "level.most": "\u0421\u0430\u043C\u044B\u0439 \u0442\u043E\u0447\u043D\u044B\u0439",
    "busy.card": "\u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "busy.processor": "\u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "lang.pairEnglish": "{lang} \u21C4 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "lang.yours": "\u0432\u0430\u0448 \u044F\u0437\u044B\u043A",
    // ------------------------------------------------------------ the tray's panel
    "tray.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C",
    "tray.openKryakl": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0422\u0438\u0446\u044C",
    "tray.built": "\u0421\u043E\u0431\u0440\u0430\u043D\u043E {build}",
    "tray.actions": "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F",
    "tray.listenCopied": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
    "tray.translateCopied": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "tray.typeToTranslate": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430\u2026",
    "tray.checkEnglish": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438\u2026",
    "tray.listenScreen": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "tray.translateScreen": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "tray.saveNote": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443",
    "tray.newNote": "\u0417\u0430\u043C\u0435\u0442\u043A\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "tray.transcripts": "\u0412\u0441\u0435 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "tray.quick": "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "tray.autoFix": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "tray.switchWith": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443: {key}",
    "tray.layoutBadge": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443 \u0443 \u043A\u0443\u0440\u0441\u043E\u0440\u0430",
    "tray.trayLayout": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443 \u0432 \u0442\u0440\u0435\u0435",
    "tray.yourWords": "\u0412\u0430\u0448\u0438 \u0441\u043B\u043E\u0432\u0430",
    "tray.keepWord": "\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u043B\u043E\u0432\u043E\u2026",
    "tray.keepWordTitle": "\u041D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u044D\u0442\u043E \u0441\u043B\u043E\u0432\u043E \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E (\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C)",
    "tray.keepPlaceholder": "\u0441\u043B\u043E\u0432\u043E, \u043A\u0430\u043A \u0432\u044B \u0435\u0433\u043E \u043D\u0430\u0431\u0438\u0440\u0430\u0435\u0442\u0435",
    "tray.keepAria": "\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u043B\u043E\u0432\u043E",
    "tray.kept": "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E: {word}",
    "tray.vocabulary": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0438\u043C\u044F \u0438\u043B\u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u2026",
    "tray.keptList": "\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C",
    "tray.pausedTitle": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u044B",
    "tray.pauseTitle": "\u0412\u0441\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0438 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u044B, \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0435",
    "tray.resume": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C",
    "tray.pause": "\u041F\u0430\u0443\u0437\u0430",
    "tray.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "tray.report": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "tray.reportTitle": "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0435, \u0441 \u0436\u0443\u0440\u043D\u0430\u043B\u0430\u043C\u0438 \u0422\u0438\u0446\u044C",
    "tray.quit": "\u0412\u044B\u0439\u0442\u0438",
    "tray.paused": "\u043F\u0430\u0443\u0437\u0430",
    "tray.ready": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "tray.readyTitle": "{pair}, \u0431\u0435\u0437 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0430",
    "tray.downloading": "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026",
    "tray.firstUse": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A \u2014 \u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u043C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438",
    "tray.tipRecording": "\u0417\u0430\u043F\u0438\u0441\u044C",
    "tray.tipPaused": "\u0422\u0438\u0446\u044C \xB7 \u043F\u0430\u0443\u0437\u0430",
    "tray.tipListen": "{keys} \u2014 \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C",
    "tray.tipTranslate": "{key} \u2014 \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    // ------------------------------------------------------------ the card
    "kind.listen": "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
    "kind.translate": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "kind.check": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "kind.screen": "\u044D\u043A\u0440\u0430\u043D",
    "card.openedBy": "\u041E\u0442\u043A\u0440\u044B\u0442\u043E \u043A\u043B\u0430\u0432\u0438\u0448\u0430\u043C\u0438 {keys}",
    "card.openedByTwice": "\u041E\u0442\u043A\u0440\u044B\u0442\u043E: {keys} \u0434\u0432\u0430\u0436\u0434\u044B",
    "card.prev": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "card.next": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "card.oneByOne": "\u041F\u043E \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044E",
    "card.spaceListen": "\u0441\u043B\u0443\u0448\u0430\u0442\u044C",
    "card.spaceStop": "\u0441\u0442\u043E\u043F",
    "card.text": "\u0422\u0435\u043A\u0441\u0442",
    "card.from": "\u0421 \u044F\u0437\u044B\u043A\u0430",
    "card.fromTitle": "\u042F\u0437\u044B\u043A \u0442\u0435\u043A\u0441\u0442\u0430",
    "card.into": "\u041D\u0430 \u044F\u0437\u044B\u043A",
    "card.intoTitle": "\u042F\u0437\u044B\u043A, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "card.swap": "\u041F\u043E\u043C\u0435\u043D\u044F\u0442\u044C",
    "card.swapTitle": "\u041F\u043E\u043C\u0435\u043D\u044F\u0442\u044C \u044F\u0437\u044B\u043A\u0438 \u043C\u0435\u0441\u0442\u0430\u043C\u0438: \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0441\u0442\u0430\u043D\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u043E\u043C",
    "card.voiceOffer": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u0437\u0432\u0443\u0447\u0438\u0442 \u043A\u0430\u043A \u0436\u0438\u0432\u043E\u0439 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0438 \u0447\u0438\u0442\u0430\u0435\u0442 \u0431\u0435\u0437 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0430.",
    "card.voiceDownload": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \xB7 {size} \u041C\u0411",
    "card.voiceFailed": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043B\u0441\u044F.",
    "card.voiceDownloading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0430\u2026 {pct}%",
    "card.voiceReady": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u0433\u043E\u0442\u043E\u0432. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0421\u043B\u0443\u0448\u0430\u0442\u044C\xBB, \u0447\u0442\u043E\u0431\u044B \u0443\u0441\u043B\u044B\u0448\u0430\u0442\u044C \u0435\u0433\u043E.",
    "card.busyCard": "\u0412\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u0430, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E \u043F\u0435\u0440\u0435\u0432\u0451\u043B \xAB\u0411\u044B\u0441\u0442\u0440\u044B\u0439\xBB. \xAB{level}\xBB \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D\u0430 \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u0441\u044F.",
    "card.busyProcessor": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440 \u0437\u0430\u043D\u044F\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E \u043F\u0435\u0440\u0435\u0432\u0451\u043B \xAB\u0411\u044B\u0441\u0442\u0440\u044B\u0439\xBB. \xAB{level}\xBB \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u0441\u044F.",
    "card.useAnyway": "\u0412\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \xAB{level}\xBB",
    "card.hideTranslation": "\u0421\u043A\u0440\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434 ({lang})",
    "card.showTranslation": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434 ({lang})",
    "card.unpin": "\u041E\u0442\u043A\u0440\u0435\u043F\u0438\u0442\u044C: \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u0449\u0435\u043B\u0447\u043A\u0435 \u043F\u043E \u0434\u0440\u0443\u0433\u043E\u043C\u0443 \u043E\u043A\u043D\u0443",
    "card.pin": "\u0417\u0430\u043A\u0440\u0435\u043F\u0438\u0442\u044C: \u043D\u0435 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C",
    "card.oneOn": "\u0427\u0438\u0442\u0430\u0435\u0442 \u043E\u0434\u043D\u043E \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0436\u0434\u0451\u0442; \u2190 \u2192 \u2014 \u0448\u0430\u0433",
    "card.oneOff": "\u0427\u0438\u0442\u0430\u0442\u044C \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044E",
    "card.translatingFast": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \xAB\u0411\u044B\u0441\u0442\u0440\u044B\u0439\xBB\u2026",
    "card.translating": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u2026",
    "card.translatingLevel": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \xB7 {level}\u2026",
    "card.ofGb": "{a} \u0438\u0437 {b} \u0413\u0411",
    "card.ofMb": "{a} \u0438\u0437 {b} \u041C\u0411",
    "card.firstUse": "\u043F\u0435\u0440\u0432\u043E\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \xB7 \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "card.modelOf": "\u041C\u043E\u0434\u0435\u043B\u044C \xAB{name}\xBB",
    "card.translatorPair": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A, {pair}",
    "card.fromMozilla": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0438\u0437 Mozilla, \u0434\u0430\u043B\u044C\u0448\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "card.fromHfTranslates": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0438\u0437 Hugging Face, \u0434\u0430\u043B\u044C\u0448\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "card.fromHfChecks": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0438\u0437 Hugging Face, \u0434\u0430\u043B\u044C\u0448\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "card.readMeanwhile": "\u0410\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u043A\u0430 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F.",
    "card.notChecked": "\u041D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E",
    "card.notTranslated": "\u041D\u0435 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043D\u043E",
    "card.readingScreen": "\u0427\u0438\u0442\u0430\u044E \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435\u2026",
    "card.noText": "\u0417\u0434\u0435\u0441\u044C \u043D\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430",
    "card.noTextNote": "\u041D\u0430 \u044D\u0442\u043E\u043C \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0435 \u044D\u043A\u0440\u0430\u043D\u0430 \u043D\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C. \u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 \u0441\u043E \u0441\u043B\u043E\u0432\u0430\u043C\u0438.",
    "card.noOcr": "Windows \u043F\u043E\u043A\u0430 \u043D\u0435 \u0443\u043C\u0435\u0435\u0442 \u0447\u0438\u0442\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442",
    "card.noOcrNote": "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043B\u044F \u044F\u0437\u044B\u043A\u0430 \xAB{lang}\xBB \u0438\u043B\u0438 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E: \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u2192 \u0412\u0440\u0435\u043C\u044F \u0438 \u044F\u0437\u044B\u043A \u2192 \u042F\u0437\u044B\u043A \u0438 \u0440\u0435\u0433\u0438\u043E\u043D \u2192 \u044F\u0437\u044B\u043A \u2192 \u042F\u0437\u044B\u043A\u043E\u0432\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u2192 \u041E\u043F\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.",
    "card.openLanguageSettings": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u044F\u0437\u044B\u043A\u043E\u0432\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B",
    "card.yourEnglish": "\u0412\u0430\u0448 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "card.typeEnglish": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043B\u0438 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C",
    "card.checkedBy": "\u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E \xB7 {model}",
    "card.improving": "\u0423\u0442\u043E\u0447\u043D\u044F\u0435\u0442\u0441\u044F \xB7 {level}\u2026",
    "card.translatedBy": "\u041F\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043D\u043E \xB7 {level}",
    "card.newLine": "{by} \xB7 Shift+Enter \u2014 \u043D\u043E\u0432\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430",
    "card.yours": "\u0412\u0430\u0448\u0438",
    "card.allLanguages": "\u0412\u0441\u0435 \u044F\u0437\u044B\u043A\u0438",
    "card.pasteOver": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u043E \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E (Enter)",
    "card.pasteLater": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0438\u0434\u0451\u0442 \u0442\u043E\u0447\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 (Enter)",
    "card.pasteChecked": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432\u043C\u0435\u0441\u0442\u043E \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E (Enter)",
    "card.looksRight": "\u041F\u043E\u0445\u043E\u0436\u0435, \u0432\u0441\u0451 \u0432\u0435\u0440\u043D\u043E",
    "card.listenSpace": "\u0421\u043B\u0443\u0448\u0430\u0442\u044C (Space)",
    "card.listenParagraph": "\u041F\u0440\u043E\u0441\u043B\u0443\u0448\u0430\u0442\u044C \u044D\u0442\u043E\u0442 \u0430\u0431\u0437\u0430\u0446",
    "card.naturalStopped": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0441\u044F ({message}). \u0414\u0430\u043B\u044C\u0448\u0435 \u0447\u0438\u0442\u0430\u0435\u0442 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441.",
    "card.noVoice": "\u041D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435 \u043D\u0435\u0442 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0430.",
    "card.openSpeechSettings": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0435\u0447\u0438",
    "voice.stepsWin": "\u0427\u0442\u043E\u0431\u044B \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C: \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B Windows \u2192 \u0412\u0440\u0435\u043C\u044F \u0438 \u044F\u0437\u044B\u043A \u2192 \u0420\u0435\u0447\u044C \u2192 \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u0430 \u2192 {lang}, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0422\u0438\u0446\u044C.",
    "voice.stepsMac": "\u0427\u0442\u043E\u0431\u044B \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u2192 \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F \u2192 \u0423\u0441\u0442\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u2192 \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u2192 \u0423\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u2192 {lang}, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0422\u0438\u0446\u044C.",
    "voice.none": "\u0414\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F \u0432\u0441\u043B\u0443\u0445 \u043D\u0443\u0436\u043D\u044B \u0433\u043E\u043B\u043E\u0441\u0430 Windows \u0438\u043B\u0438 macOS; \u0432 \u044D\u0442\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u0435 \u043D\u0435\u0442 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E.",
    // ------------------------------------------------------------ the word card
    "word.from": "\u0444\u043E\u0440\u043C\u0430: {word}",
    "word.say": "\u041F\u0440\u043E\u0438\u0437\u043D\u0435\u0441\u0442\u0438",
    "word.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0432 \xAB\u0421\u043B\u043E\u0432\u0430\xBB",
    "word.remove": "\u0423\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \xAB\u0421\u043B\u043E\u0432\xBB",
    "word.notFound": "\u041D\u0435\u0442 \u0432 \u0441\u043B\u043E\u0432\u0430\u0440\u0435.",
    "word.pair": "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u2192 {lang}",
    "word.notEnglish": "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432 \u043F\u043E\u043A\u0430 \u0435\u0441\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E; \u043F\u0435\u0440\u0435\u0432\u043E\u0434 ({lang}) \u2014 \u043D\u0438\u0436\u0435.",
    "word.noDictionary": "\u0421\u043B\u043E\u0432\u0430\u0440\u044F {pair} \u043F\u043E\u043A\u0430 \u043D\u0435\u0442; \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u2014 \u043D\u0438\u0436\u0435.",
    "word.downloading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043B\u043E\u0432\u0430\u0440\u044F {pair}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437\u2026",
    "word.failed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0441\u043B\u043E\u0432\u0430\u0440\u044C {pair}. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443; \u043D\u043E\u0432\u0430\u044F \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443.",
    "word.off": "\u0421\u043B\u043E\u0432\u0430\u0440\u044C {pair} \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043D.",
    // ------------------------------------------------------------ the talk window
    "talk.yourTalks": "\u0412\u0430\u0448\u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B",
    "talk.hideTalks": "\u0421\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B",
    "talk.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430",
    "talk.toEnd": "\u041A \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u0440\u0435\u043F\u043B\u0438\u043A\u0435",
    "talk.typePlaceholder": "\u0418\u043B\u0438 \u043D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0440\u0435\u043F\u043B\u0438\u043A\u0443",
    "talk.typeOnly": "\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Enter",
    "talk.typeAria": "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0440\u0435\u043F\u043B\u0438\u043A\u0443 \u0422\u0438\u0446\u044C",
    "talk.newTitle": "\u0423\u0431\u0440\u0430\u0442\u044C \u044D\u0442\u043E\u0442 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0438 \u043D\u0430\u0447\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439",
    "talk.new": "\u041D\u043E\u0432\u044B\u0439 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "talk.closeList": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A",
    "talk.today": "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    "talk.yesterday": "\u0412\u0447\u0435\u0440\u0430",
    "talk.earlier": "\u0420\u0430\u043D\u0435\u0435",
    "talk.lines": { one: "{n} \u0440\u0435\u043F\u043B\u0438\u043A\u0430", few: "{n} \u0440\u0435\u043F\u043B\u0438\u043A\u0438", many: "{n} \u0440\u0435\u043F\u043B\u0438\u043A", other: "{n} \u0440\u0435\u043F\u043B\u0438\u043A\u0438" },
    "talk.withMistake": "\u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439: {n}",
    "talk.goingOnMeta": "\u0438\u0434\u0451\u0442",
    "talk.goingOnTitle": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "talk.goOn": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u044D\u0442\u043E\u0442 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "talk.firstLine": "\u041F\u0435\u0440\u0432\u0430\u044F \u0440\u0435\u043F\u043B\u0438\u043A\u0430 \u0422\u0438\u0446\u044C",
    "talk.delete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u043E\u0442 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "talk.goingOn": "\u0418\u0434\u0451\u0442 \u0441\u0435\u0439\u0447\u0430\u0441",
    "talk.historyEmpty": "\xAB\u041D\u043E\u0432\u044B\u0439 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\xBB \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441\u044E\u0434\u0430, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0435\u0433\u043E \u043F\u043E\u0437\u0436\u0435. \u0425\u0440\u0430\u043D\u0438\u0442\u0441\u044F 30 \u0434\u043D\u0435\u0439 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435, \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 50.",
    "talk.sureOne": "\u0422\u043E\u0447\u043D\u043E? \u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    "talk.sureAll": "\u0422\u043E\u0447\u043D\u043E? \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0435 ({n})",
    "talk.clearAll": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0451",
    "talk.needsCard": "\u0414\u043B\u044F \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430 \u043D\u0443\u0436\u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0441 4 \u0413\u0411 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043F\u0430\u043C\u044F\u0442\u0438 \u0438\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u0435",
    "talk.needsCardNote": "\u041D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435 \u0422\u0438\u0446\u044C \u043E\u0442\u0432\u0435\u0447\u0430\u043B \u0431\u044B 15 \u0441\u0435\u043A\u0443\u043D\u0434 \u0438 \u0434\u043E\u043B\u044C\u0448\u0435 \u2014 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u0434\u043B\u044F \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430. \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E\xBB \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043A\u0430\u043A \u043F\u0440\u0435\u0436\u0434\u0435.",
    "talk.downloading": "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430, {pct}%; \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043D\u0430\u0447\u043D\u0451\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0431\u0443\u0434\u0435\u0442 \u0437\u0434\u0435\u0441\u044C",
    "talk.downloadFailed": "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C",
    "talk.downloadIt": "\u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u0435\u0451 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445; \u0435\u0451 \u0442\u0430\u043A\u0436\u0435 \u043C\u043E\u0433\u0443\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E\xBB \u0438 \xAB\u041F\u0435\u0440\u0435\u0432\u043E\u0434\xBB",
    "talk.needsModel": "\u0422\u0438\u0446\u044C \u043D\u0443\u0436\u043D\u0430 \u0435\u0433\u043E \u043C\u043E\u0434\u0435\u043B\u044C: {name}, {size}",
    "talk.noEngine": "\u041F\u0438\u0448\u0438\u0442\u0435 \u0422\u0438\u0446\u044C \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0440\u0435\u0447\u0438, \u0447\u0442\u043E\u0431\u044B \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C",
    "talk.noEngineNote": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441\u043B\u044B\u0448\u0438\u0442 \u0432\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434; \u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u0435\u0433\u043E \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.",
    "talk.engineStarting": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F\u2026",
    "talk.slow": "\xAB{name}\xBB \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u0434\u043E\u043B\u0433\u043E. \xAB{accurate}\xBB \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B.",
    "talk.busyCard": "\u0412\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E.",
    "talk.busyProcessor": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E.",
    "talk.intro": "\u0413\u043E\u0432\u043E\u0440\u0438\u0442\u0435 \u043F\u043E-\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438. \u0422\u0438\u0446\u044C \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0432\u0441\u043B\u0443\u0445, \u0430 \u0432\u0430\u0448\u0438 \u043E\u0448\u0438\u0431\u043A\u0438 \u043E\u0442\u043C\u0435\u0447\u0430\u044E\u0442\u0441\u044F \u0432 \u0432\u0430\u0448\u0438\u0445 \u0440\u0435\u043F\u043B\u0438\u043A\u0430\u0445.",
    "talk.orTypeHello": "\u0418\u043B\u0438 \u043D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 hello \u043D\u0438\u0436\u0435.",
    "talk.orSayHello": "\u0418\u043B\u0438 \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u0438 \u0441\u043A\u0430\u0436\u0438\u0442\u0435 hello.",
    "talk.unpin": "\u041D\u0435 \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043F\u043E\u0432\u0435\u0440\u0445 \u0434\u0440\u0443\u0433\u0438\u0445 \u043E\u043A\u043E\u043D",
    "talk.pin": "\u0414\u0435\u0440\u0436\u0430\u0442\u044C \u043F\u043E\u0432\u0435\u0440\u0445 \u0434\u0440\u0443\u0433\u0438\u0445 \u043E\u043A\u043E\u043D",
    "talk.modelTitle": "\u0422\u0438\u0446\u044C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 {model} \u2014 \u0442\u043E\u0439 \u0436\u0435 \u043C\u043E\u0434\u0435\u043B\u0438, \u0447\u0442\u043E \u0438 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E\xBB, \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435. \u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C.",
    "talk.failed": "\u0422\u0438\u0446\u044C \u043D\u0435 \u0441\u043C\u043E\u0433 \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C: {message}. \u0421\u043A\u0430\u0436\u0438\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0438\u043B\u0438 \u043D\u0430\u043F\u0438\u0448\u0438\u0442\u0435.",
    "talk.noAnswer": "\u043D\u0435\u0442 \u043E\u0442\u0432\u0435\u0442\u0430",
    "talk.startingMic": "\u0412\u043A\u043B\u044E\u0447\u0430\u044E \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u2026",
    "talk.send": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "talk.talk": "\u0413\u043E\u0432\u043E\u0440\u0438\u0442\u044C",
    "talk.notPossible": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043F\u043E\u043A\u0430 \u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u0435\u043D: \u0441\u043C. \u0432\u044B\u0448\u0435.",
    "talk.speaking": "\u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442",
    "talk.thinking": "\u0422\u0438\u0446\u044C \u0434\u0443\u043C\u0430\u0435\u0442\u2026",
    "talk.typingOnly": "\u0422\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043A\u0441\u0442\u043E\u043C, \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u044F \u0440\u0435\u0447\u0438",
    "talk.pressAgain": "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C.",
    "talk.listeningPress": "\u0421\u043B\u0443\u0448\u0430\u044E \xB7 {keys} \u2014 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "talk.speakingPress": "\u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \xB7 {keys} \u2014 \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C",
    "talk.thinkingPress": "\u0422\u0438\u0446\u044C \u0434\u0443\u043C\u0430\u0435\u0442 \xB7 {keys} \u2014 \u043F\u0435\u0440\u0435\u0431\u0438\u0442\u044C",
    "talk.press": "{keys} \u2014 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C",
    "talk.finishing": "\u0417\u0430\u0432\u0435\u0440\u0448\u0430\u044E \u0440\u0435\u043F\u043B\u0438\u043A\u0443\u2026",
    "talk.nothingHeard": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0443\u0441\u043B\u044B\u0448\u0430\u043D\u043E.",
    "turn.again": "\u0421\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0449\u0451 \u0440\u0430\u0437",
    "turn.checking": "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\u2026",
    "turn.setRight": "\u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0432\u044B\u0448\u0435",
    "turn.hearRight": "\u0423\u0441\u043B\u044B\u0448\u0430\u0442\u044C, \u043A\u0430\u043A \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
    "turn.hear": "\u0423\u0441\u043B\u044B\u0448\u0430\u0442\u044C",
    "topic.free": "\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "topic.day": "\u041C\u043E\u0439 \u0434\u0435\u043D\u044C",
    "topic.trip": "\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435",
    "topic.cafe": "\u0412 \u043A\u0430\u0444\u0435",
    "topic.interview": "\u0421\u043E\u0431\u0435\u0441\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435",
    "topic.work": "\u041C\u043E\u044F \u0440\u0430\u0431\u043E\u0442\u0430",
    // ------------------------------------------------------------ the microphone and the dictation badge
    "mic.denied": "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u0443: \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0435\u0433\u043E \u0432 \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u0445 Windows \u2192 \u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u2192 \u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    "mic.none": "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D",
    "mic.busy": "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u0437\u0430\u043D\u044F\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439",
    "dict.type": "\u041F\u0435\u0447\u0430\u0442\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "dict.english": "\u041F\u0435\u0447\u0430\u0442\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0441 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "dict.note": "\u0417\u0430\u043C\u0435\u0442\u043A\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "dict.check": "\u0421\u043A\u0430\u0437\u0430\u0442\u044C \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "dict.gettingModel": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u0438 \u0440\u0435\u0447\u0438 {pct}%",
    "dict.savingNote": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u044E \u0437\u0430\u043C\u0435\u0442\u043A\u0443\u2026",
    "dict.catchingUp": "\u0414\u043E\u0433\u043E\u043D\u044F\u044E\u2026",
    "dict.typing": "\u041F\u0435\u0447\u0430\u0442\u0430\u044E\u2026",
    "dict.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E",
    "dict.typed": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E",
    "dict.noteFailed": "\u0417\u0430\u043C\u0435\u0442\u043A\u0430 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430",
    "dict.nothingTyped": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E",
    "dict.engineStarting": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434.",
    "dict.engineDown": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u043D\u0435 \u0441\u043C\u043E\u0433 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C\u0441\u044F. \u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0435.",
    "dict.fastCard": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \xAB\u0411\u044B\u0441\u0442\u0440\u044B\u043C\xBB: \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u0430",
    "dict.fastProcessor": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \xAB\u0411\u044B\u0441\u0442\u0440\u044B\u043C\xBB: \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440 \u0437\u0430\u043D\u044F\u0442",
    "dict.tuck": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0432 \u0442\u0440\u0435\u0439: \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442\u0441\u044F",
    "dict.editing": "\u041F\u0440\u0430\u0432\u043B\u044E\u2026",
    "dict.editNoModel": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u0430",
    "dict.editCard": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u0430",
    "dict.editProcessor": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440 \u0437\u0430\u043D\u044F\u0442",
    "dict.editSlow": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0443\u0441\u043F\u0435\u043B\u0430",
    "dict.editDoubt": "\u041D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043D\u043E \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043F\u0440\u0430\u0432\u043A\u0430 \u0432\u044B\u0448\u043B\u0430 \u0441\u0442\u0440\u0430\u043D\u043D\u043E\u0439",
    "edit.title": "\u041F\u0440\u0430\u0432\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0430",
    "edit.off": "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430",
    "edit.on": "\u041F\u0440\u0430\u0432\u0438\u0442\u044C \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u043E\u0435",
    "edit.onNote": "\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043F\u043E\u043F\u0440\u0430\u0432\u0438\u0442 \u043A\u0430\u0436\u0434\u0443\u044E \u0444\u0440\u0430\u0437\u0443 \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0447\u0430\u0442\u044C\u044E, \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u043D\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u0434\u043E\u043B\u044C\u0448\u0435; \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0443\u0445\u043E\u0434\u0438\u0442 \u0441 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "edit.onNoteSlow": "\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043F\u043E\u043F\u0440\u0430\u0432\u0438\u0442 \u043A\u0430\u0436\u0434\u0443\u044E \u0444\u0440\u0430\u0437\u0443 \u043F\u0435\u0440\u0435\u0434 \u043F\u0435\u0447\u0430\u0442\u044C\u044E; \u0437\u0434\u0435\u0441\u044C \u043A\u0430\u0436\u0434\u0430\u044F \u0444\u0440\u0430\u0437\u0430 \u0436\u0434\u0451\u0442 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434",
    "edit.needsModel": "\u0414\u043B\u044F \u043F\u0440\u0430\u0432\u043A\u0438 \u043D\u0443\u0436\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \xAB{name}\xBB ({size})",
    "edit.style": "\u041A\u0430\u043A \u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "edit.clean": "\u041F\u043E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
    "edit.cleanNote": "\u0443\u0431\u0438\u0440\u0430\u0435\u0442 \xAB\u044D-\u044D\xBB, \u043F\u043E\u0432\u0442\u043E\u0440\u044B \u0438 \u043E\u0433\u043E\u0432\u043E\u0440\u043A\u0438, \u043F\u043E\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u0437\u043D\u0430\u043A\u0438; \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043B\u043E\u0432\u0430 \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u0435\u0442",
    "edit.business": "\u0414\u0435\u043B\u043E\u0432\u043E\u0439 \u0442\u043E\u043D",
    "edit.businessNote": "\u0434\u043B\u044F \u043F\u0438\u0441\u0435\u043C \u0438 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0447\u0430\u0442\u043E\u0432: \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0435 \u0432\u0435\u0436\u043B\u0438\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430",
    "edit.aiTask": "\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043B\u044F \u0418\u0418",
    "edit.aiTaskNote": "\u0447\u0451\u0442\u043A\u0430\u044F \u043F\u0440\u043E\u0441\u044C\u0431\u0430 \u0434\u043B\u044F Claude \u0438\u043B\u0438 ChatGPT; \u0442\u0435\u0440\u043C\u0438\u043D\u044B \u0438 \u0438\u043C\u0435\u043D\u0430 \u0444\u0430\u0439\u043B\u043E\u0432 \u043A\u0430\u043A \u0435\u0441\u0442\u044C",
    "edit.list": "\u0421\u043F\u0438\u0441\u043E\u043A",
    "edit.listNote": "\u043A\u0430\u0436\u0434\u0430\u044F \u043C\u044B\u0441\u043B\u044C \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439",
    "edit.own": "\u0421\u0432\u043E\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F",
    "edit.ownNote": "\u0432\u0430\u0448\u0438 \u0441\u043B\u043E\u0432\u0430 \u043E \u0442\u043E\u043C, \u043A\u0430\u043A \u043F\u0438\u0441\u0430\u0442\u044C",
    "edit.ownLabel": "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F",
    "edit.ownPlaceholder": "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u043F\u0438\u0448\u0438 \u043A\u043E\u0440\u043E\u0447\u0435, \u0442\u0435\u0440\u043C\u0438\u043D\u044B \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0439 \u043D\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C",
    "edit.ownHint": "\u0414\u043E 500 \u0437\u043D\u0430\u043A\u043E\u0432. \u0415\u0441\u043B\u0438 \u043F\u0443\u0441\u0442\u043E, \u0444\u0440\u0430\u0437\u0430 \u043F\u0435\u0447\u0430\u0442\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u0430.",
    "edit.keeps": "\u0417\u0430\u043C\u0435\u0442\u043A\u0438, \u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u044F \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 \u043D\u0435 \u043F\u0440\u0430\u0432\u044F\u0442\u0441\u044F. \u0421\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0432\u043E \xAB\u0424\u0440\u0430\u0437\u0430\u0445\xBB: \u043D\u0430\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430 \u0444\u0440\u0430\u0437\u0443, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0435\u0433\u043E.",
    "edit.model": "\u041C\u043E\u0434\u0435\u043B\u044C",
    "badge.fastCard": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \xB7 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u0430",
    "badge.fastProcessor": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \xB7 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440 \u0437\u0430\u043D\u044F\u0442",
    "settings.uiLanguage": "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    "settings.uiLanguageNote": "\u043C\u0435\u043D\u044E \u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0422\u0438\u0446\u044C; \u0442\u043E, \u0447\u0435\u043C\u0443 \u043E\u043D \u0443\u0447\u0438\u0442, \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C",
    "ui.recommended": "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F",
    "ui.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C",
    "ui.remove": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C {item}",
    "ui.reportSubject": "\u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "ui.reportAsk": "\u0427\u0442\u043E \u0441\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C?",
    "ui.reportAttach": "\u041E\u0442\u0447\u0451\u0442 \u043E\u0442\u043A\u0440\u044B\u0442 \u0432 \u041F\u0440\u043E\u0432\u043E\u0434\u043D\u0438\u043A\u0435: \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u0435 \xAB{file}\xBB.",
    "ui.reportTitle": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "ui.reportWhat": "\u0427\u0442\u043E \u0441\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C",
    "ui.reportDrag": "**\u041E\u0442\u0447\u0451\u0442:** \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 `{file}` \u0441\u044E\u0434\u0430 \u0438\u0437 \u041F\u0440\u043E\u0432\u043E\u0434\u043D\u0438\u043A\u0430 (\u0436\u0443\u0440\u043D\u0430\u043B\u044B \u0422\u0438\u0446\u044C, \u0431\u0435\u0437 \u0432\u0430\u0448\u0435\u0433\u043E \u0438\u043C\u0435\u043D\u0438 \u0438 \u043A\u043B\u044E\u0447\u0435\u0439).",
    "setup.step1": "\u0412\u0430\u0448 \u044F\u0437\u044B\u043A",
    "setup.step2": "\u042D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440",
    "setup.step3": "\u0427\u0442\u043E \u0432\u0430\u043C \u043D\u0443\u0436\u043D\u043E",
    "setup.step4": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435",
    "setup.cap1": "\u0422\u0438\u0446\u044C \u0443\u0447\u0438\u0442 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C\u0443",
    "setup.cap2": "\u043D\u0430 \u0447\u0451\u043C \u0437\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0440\u0435\u0447\u044C",
    "setup.cap3": "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "setup.cap4": "\u043E\u0434\u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0430, \u0434\u0430\u043B\u044C\u0448\u0435 \u0432\u0441\u0451 \u0441\u0430\u043C\u043E",
    "setup.stepOf": "\u0428\u0430\u0433 {step} \u0438\u0437 {total}",
    "setup.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "setup.finish": "\u0413\u043E\u0442\u043E\u0432\u043E",
    "setup.next": "\u0414\u0430\u043B\u0435\u0435",
    "setup.back": "\u041D\u0430\u0437\u0430\u0434",
    "setup.skip": "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C",
    "setup.languageNote": "\u043D\u0430 \u043D\u0435\u0433\u043E \u0422\u0438\u0446\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u0438 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442 \u0435\u0433\u043E \u0432 \u0440\u0435\u0447\u0438; \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C\u0443 \u043E\u043D \u0443\u0447\u0438\u0442",
    "setup.windowsIn": "Windows \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0430 \u043D\u0430 \u044F\u0437\u044B\u043A \xAB{lang}\xBB: \u0441\u043E\u0432\u0435\u0442\u0443\u0435\u043C \u0442\u043E\u0442 \u0436\u0435.",
    "setup.otherLanguages": "\u0414\u0440\u0443\u0433\u0438\u0435 \u044F\u0437\u044B\u043A\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u0432\u044B \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435\u0441\u044C",
    "setup.addLanguage": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044F\u0437\u044B\u043A",
    "setup.addLanguageNote": "\u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430 \u043D\u0435 \u0432\u044B\u0431\u0435\u0440\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0439; \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0438 \u0442\u0435\u043A\u0441\u0442 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430 \u0443\u0433\u0430\u0434\u044B\u0432\u0430\u044E\u0442 \u0441\u0440\u0435\u0434\u0438 \u043D\u0438\u0445",
    "setup.pickLanguage": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A",
    "setup.always": "\u0432\u0441\u0435\u0433\u0434\u0430",
    "setup.lookingCard": "\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443\u2026",
    "setup.noCard": "\u0441\u0432\u043E\u0435\u0439 \u043D\u0435\u0442",
    "setup.onCard": "\u0420\u0435\u0447\u044C \u043C\u043E\u0436\u0435\u0442 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "setup.onCardNote": "\u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time} \u0441 {model} \xB7 \u0447\u0430\u0441 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0437\u0430 \u0441\u0447\u0438\u0442\u0430\u043D\u044B\u0435 \u043C\u0438\u043D\u0443\u0442\u044B",
    "setup.onCpu": "\u0420\u0435\u0447\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "setup.onCpuNote": "\u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time} \u0441 {model} \xB7 \u0447\u0430\u0441 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0437\u0430 \u2248{hour}",
    "setup.hardware": "\u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435",
    "setup.processor": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "setup.cpuLooking": "{cpu} \xB7 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u2026",
    "setup.cpuCores": { one: "{cpu} \xB7 {n} \u044F\u0434\u0440\u043E", few: "{cpu} \xB7 {n} \u044F\u0434\u0440\u0430", many: "{cpu} \xB7 {n} \u044F\u0434\u0435\u0440", other: "{cpu} \xB7 {n} \u044F\u0434\u0440\u0430" },
    "setup.laptop": "\u043D\u043E\u0443\u0442\u0431\u0443\u043A",
    "setup.memory": "\u041F\u0430\u043C\u044F\u0442\u044C",
    "setup.graphicsCard": "\u0412\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "setup.means": "\u0427\u0442\u043E \u044D\u0442\u043E \u0437\u043D\u0430\u0447\u0438\u0442",
    "setup.useCard": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "setup.stillLooking": "\u0415\u0449\u0451 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E \u044D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440; \xAB\u0414\u0430\u043B\u0435\u0435\xBB \u043D\u0435 \u0436\u0434\u0451\u0442, \u0441\u043E\u0432\u0435\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0441\u0451 \u0441\u0442\u0430\u043D\u0435\u0442 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E.",
    "setup.noTranslator": "\u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u044F\u0437\u044B\u043A\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D-\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A\u0430",
    "setup.translatorHere": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A {pair} \u0443\u0436\u0435 \u0437\u0434\u0435\u0441\u044C",
    "setup.translatorOnce": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A {pair} \xB7 {size}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.dictReady": "\u0441\u043B\u043E\u0432\u0430\u0440\u044C \u0443\u0436\u0435 \u0437\u0434\u0435\u0441\u044C",
    "setup.dictOnce": "\u0441\u043B\u043E\u0432\u0430\u0440\u044C \xB7 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u041C\u0411, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.dictComing": "\u0441\u043B\u043E\u0432\u0430\u0440\u044C \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "setup.dictNone": "\u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u044F\u0437\u044B\u043A\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u043B\u043E\u0432\u0430\u0440\u044F",
    "setup.toDownload": "\u041A \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044E \u2248{size}",
    "setup.onDisk": "{size} \u043D\u0430 \u0434\u0438\u0441\u043A\u0435 \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438",
    "setup.freeOn": "{size} \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E \u043D\u0430 {drive}",
    "setup.freeUnknown": "\u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u043C\u0435\u0441\u0442\u043E \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
    "setup.noRoom": "\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043C\u0435\u0441\u0442\u0430: \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C \u0438\u043B\u0438 \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u0435 \u043C\u0435\u0441\u0442\u043E.",
    "setup.alwaysGroup": "\u0412\u0441\u0435\u0433\u0434\u0430",
    "setup.listenTranslate": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
    "setup.alwaysOn": "\u0432\u0441\u0435\u0433\u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
    "setup.voice": "\u0413\u043E\u043B\u043E\u0441",
    "setup.naturalHere": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \xB7 \u0443\u0436\u0435 \u0437\u0434\u0435\u0441\u044C",
    "setup.naturalSize": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \xB7 {size}",
    "setup.windowsVoice": "\u0413\u043E\u043B\u043E\u0441 Windows",
    "setup.keyboard": "\u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "setup.badgeNote": "\u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u043D\u0430\u0447\u043E\u043A \u043F\u0440\u0438 \u043A\u0430\u0436\u0434\u043E\u0439 \u0441\u043C\u0435\u043D\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438",
    "setup.speech": "\u0420\u0435\u0447\u044C",
    "setup.dictateNote": "{why} \xB7 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 {engine} + \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size}",
    "setup.transcribe": "\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0442\u044C \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0438 \u0444\u0430\u0439\u043B\u044B",
    "setup.transcribeNote": "{why} \xB7 \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size}",
    "setup.transcribeNoteEngine": "{why} \xB7 \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size} + \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 {engine}",
    "setup.speakers": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B",
    "setup.startWithWindows": "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 Windows",
    "setup.allOfIt": "\u0418\u0442\u043E\u0433\u043E",
    "setup.keysLater": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438 \u0437\u0430\u0434\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F; \u0432\u0441\u0451 \u0437\u0434\u0435\u0441\u044C \u043C\u043E\u0436\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.",
    "setup.voicesHour": "\u0433\u043E\u043B\u043E\u0441\u0430 \u0447\u0430\u0441\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u2014 \u0437\u0430 \u2248{time} \u0437\u0434\u0435\u0441\u044C",
    "setup.runsOnCpu": "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "setup.runsOn": "\u0413\u0434\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "setup.advisedCard": "\u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430 \u0441\u043E\u0432\u0435\u0442\u0443\u0435\u043C \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "setup.advisedCpu": "\u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430 \u0441\u043E\u0432\u0435\u0442\u0443\u0435\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "setup.downloading": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "setup.toDownloadGroup": "\u0427\u0442\u043E \u0441\u043A\u0430\u0447\u0430\u0442\u044C",
    "setup.then": "\u041F\u043E\u0442\u043E\u043C",
    "setup.test": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u0438 \u0440\u0435\u0447\u0438, \u043A\u043E\u0433\u0434\u0430 \u043E\u043D\u0438 \u0431\u0443\u0434\u0443\u0442 \u0437\u0434\u0435\u0441\u044C",
    "setup.testNote": "\u043A\u0430\u0436\u0434\u0430\u044F \u0441\u043A\u0430\u0447\u0430\u043D\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043A\u043E\u0440\u043E\u0442\u043A\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C, \u043C\u0438\u043D\u0443\u0442\u0443-\u0434\u0432\u0435 \u0432 \u0444\u043E\u043D\u0435; \u0442\u043E\u0433\u0434\u0430 \u0432\u0440\u0435\u043C\u044F \u0437\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0435\u0442 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043E \u0438\u043C\u0435\u043D\u043D\u043E \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "setup.canClose": "\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u044D\u0442\u043E \u043E\u043A\u043D\u043E: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F, \u0430 \xAB\u0413\u043B\u0430\u0432\u043D\u0430\u044F\xBB \u043F\u043E\u043A\u0430\u0436\u0435\u0442, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C.",
    "setup.notStarted": "\u0415\u0449\u0451 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0447\u0430\u043B\u043E\u0441\u044C: \u0432\u0435\u0440\u043D\u0438\u0442\u0435\u0441\u044C \u043A \xAB\u0421\u043A\u0430\u0447\u0430\u0442\u044C\xBB \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0413\u043E\u0442\u043E\u0432\u043E\xBB, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0432\u0441\u0451 \u043F\u043E\u0437\u0436\u0435 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445.",
    "setup.here": "\u0443\u0436\u0435 \u0437\u0434\u0435\u0441\u044C",
    "setup.hereAlready": "\u0443\u0436\u0435 \u0437\u0434\u0435\u0441\u044C",
    "setup.starting": "\u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F\u2026",
    "setup.coming": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F\u2026",
    "setup.pythonManager": "\u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python",
    "setup.packages": "\u043F\u0430\u043A\u0435\u0442\u044B \xB7 \u043E\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F",
    "setup.installFailed": "\u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C",
    "setup.next2": "\u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u0438",
    "setup.afterEngine": "\u043F\u043E\u0441\u043B\u0435 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438",
    "setup.why.voiceWeak": "\u0433\u043E\u043B\u043E\u0441 Windows \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0439; \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0434\u0435\u043B\u0430\u043B \u0431\u044B \u043F\u0430\u0443\u0437\u044B \u043C\u0435\u0436\u0434\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C\u0438 \u043D\u0430 \u044D\u0442\u043E\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "setup.why.voice": "\u0447\u0438\u0442\u0430\u0435\u0442 \u043A\u0430\u043A \u0447\u0435\u043B\u043E\u0432\u0435\u043A; \u044D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440 \u0441\u0438\u043D\u0442\u0435\u0437\u0438\u0440\u0443\u0435\u0442 \u0440\u0435\u0447\u044C \u0431\u044B\u0441\u0442\u0440\u0435\u0435, \u0447\u0435\u043C \u043E\u043D\u0430 \u0437\u0432\u0443\u0447\u0438\u0442",
    "setup.why.autoFix": "{lang} \u0438 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0434\u0435\u043B\u044F\u0442 \u043E\u0434\u043D\u0443 \u043A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0443: \u0441\u043B\u043E\u0432\u043E, \u043D\u0430\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u043D\u0435 \u0432 \u0442\u043E\u0439 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0435, \u043F\u0435\u0440\u0435\u043F\u0435\u0447\u0430\u0442\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
    "setup.why.autoFixLatin": "\u0432\u0430\u0448 \u044F\u0437\u044B\u043A \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043B\u0430\u0442\u0438\u043D\u0441\u043A\u0443\u044E \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443; \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435, \u0435\u0441\u043B\u0438 \u043F\u0438\u0448\u0435\u0442\u0435 \u0438 \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u043C",
    "setup.why.gpu": "\u0440\u0435\u0447\u044C \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435: \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{card}, \u0430 \u043D\u0435 \u2248{cpu}",
    "setup.why.noGpu": "\u043D\u0435\u0442 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B NVIDIA, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0431\u044B \u044D\u0442\u043E \u043F\u043E\u0442\u044F\u043D\u0443\u043B\u0430; \u0440\u0435\u0447\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "setup.why.dictate": "{model} \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0444\u0440\u0430\u0437\u0443 \u0437\u0430 \u2248{time} \u043D\u0430 \u044D\u0442\u043E\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "setup.why.transcribe": "{model}: \u0447\u0430\u0441 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0437\u0430 \u2248{time} \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "setup.why.transcribeCard": "{model}: \u0447\u0430\u0441 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0437\u0430 \u2248{time} \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435, \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435 \u0431\u044B\u0441\u0442\u0440\u0435\u0435",
    "setup.why.transcribeRough": "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0437\u0434\u0435\u0441\u044C \u043D\u0435\u0442\u043E\u0447\u043D\u043E: {model} \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0447\u0430\u0441 \u0437\u0430 \u2248{time}",
    "setup.why.transcribeSlow": "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E: {model} \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0447\u0430\u0441 \u0437\u0430 \u2248{time}",
    "setup.why.speakers": "\u0433\u043E\u043B\u043E\u0441\u0430 \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435: \u0447\u0430\u0441 \u0437\u0430 \u2248{time}",
    "setup.why.speakersSlow": "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E: \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435 \u0433\u043E\u043B\u043E\u0441\u0430 \u0447\u0430\u0441\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430\u043D\u0438\u043C\u0430\u044E\u0442 \u2248{time}",
    "setup.why.startWithWindows": "\u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0441 \u043F\u0435\u0440\u0432\u043E\u0439 \u043C\u0438\u043D\u0443\u0442\u044B",
    "setup.item.translator": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A {pair}",
    "setup.item.translatorNote": "Firefox Translations, \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \xB7 \u0434\u0430\u043B\u044C\u0448\u0435 \u0431\u0435\u0437 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0430",
    "setup.item.dictionary": "\u0421\u043B\u043E\u0432\u0430\u0440\u044C",
    "setup.item.dictionaryNote": "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0445 \u0441\u043B\u043E\u0432, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.item.voice": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441",
    "setup.item.voiceNote": "Kokoro \xB7 \u0447\u0438\u0442\u0430\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "setup.item.engine": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "setup.item.engineNote": "{parts} \xB7 {size} \u043D\u0430 \u0434\u0438\u0441\u043A\u0435",
    "setup.item.core": "\u0440\u0435\u0447\u044C \u0432 \u0442\u0435\u043A\u0441\u0442",
    "setup.item.gpu": "\u0447\u0430\u0441\u0442\u044C \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B",
    "setup.item.speakers": "\u0447\u0430\u0441\u0442\u044C \xAB\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B\xBB",
    "rec.check": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "rec.dictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434",
    "rec.voice": "\u0413\u043E\u043B\u043E\u0441",
    "rec.transcribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
    "rec.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "rec.speechModels": "\u0410\u0432\u0442\u043E\u0432\u044B\u0431\u043E\u0440 \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u0440\u0435\u0447\u0438",
    "rec.speed": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C",
    "rec.accuracy": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C",
    "rec.dictateTranscribe": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0438 \u0437\u0430\u043F\u0438\u0441\u0438",
    "rec.naturalVoice": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441",
    "speech.sec": "{n} \u0441",
    "speech.min": "{n} \u043C\u0438\u043D",
    "speech.h": "{h} \u0447",
    "speech.hMin": "{h} \u0447 {m} \u043C\u0438\u043D",
    "speech.perPhrase": "\u2248{time} \u043D\u0430 \u0444\u0440\u0430\u0437\u0443",
    "speech.perHour": "\u2248{time} \u043D\u0430 \u0447\u0430\u0441 \u0437\u0430\u043F\u0438\u0441\u0438",
    "speech.basisMeasured": "\u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043E \u0437\u0434\u0435\u0441\u044C",
    "speech.basisScaled": "\u043F\u043E \u0442\u0435\u0441\u0442\u0443 \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "speech.basisGuess": "\u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430",
    "speech.aboutTiny": "\u0441\u0430\u043C\u0430\u044F \u0431\u044B\u0441\u0442\u0440\u0430\u044F, \u0433\u0440\u0443\u0431\u0430\u044F",
    "speech.aboutBase": "\u0431\u044B\u0441\u0442\u0440\u0430\u044F, \u043D\u0435\u043F\u043B\u043E\u0445\u0430\u044F",
    "speech.aboutSmall": "\u0445\u043E\u0440\u043E\u0448\u0430\u044F",
    "speech.aboutTurbo": "\u043E\u0447\u0435\u043D\u044C \u0445\u043E\u0440\u043E\u0448\u0430\u044F",
    "speech.aboutLarge": "\u0441\u0430\u043C\u0430\u044F \u0442\u043E\u0447\u043D\u0430\u044F, \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0430\u044F",
    "speech.aboutParakeet": "\u043E\u0447\u0435\u043D\u044C \u0445\u043E\u0440\u043E\u0448\u0430\u044F \u0438 \u0431\u044B\u0441\u0442\u0440\u0430\u044F \xB7 25 \u0435\u0432\u0440\u043E\u043F\u0435\u0439\u0441\u043A\u0438\u0445 \u044F\u0437\u044B\u043A\u043E\u0432",
    "speech.whyTooBig": "\u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0430\u044F \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B",
    "speech.whyMemory": "\u043D\u0443\u0436\u043D\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u043F\u0430\u043C\u044F\u0442\u0438, \u0447\u0435\u043C \u0435\u0441\u0442\u044C \u0443 \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "speech.whyLanguage": "\u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0432\u0430\u0448 \u044F\u0437\u044B\u043A",
    "speech.whyLanguages": "\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u043D\u0435 \u0432\u0441\u0435 \u0432\u0430\u0448\u0438 \u044F\u0437\u044B\u043A\u0438",
    "speech.show": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C",
    "speech.kbFolder": "\u041F\u0430\u043F\u043A\u0430 \u0431\u0430\u0437\u044B \u0437\u043D\u0430\u043D\u0438\u0439",
    "speech.kbSet": "\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439: {folder}",
    "speech.removing": "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438\u2026",
    "speech.removingPart": "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0447\u0430\u0441\u0442\u0438 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438\u2026",
    "speech.backSoon": "\u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0441\u0435\u0439\u0447\u0430\u0441 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F",
    "speech.stepTool": "\u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python; \u043E\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C, \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F",
    "speech.stepPackages": "\u043F\u0430\u043A\u0435\u0442\u044B; \u043E\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C, \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F",
    "speech.dlSpeakers": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0447\u0430\u0441\u0442\u0438 \u0434\u043B\u044F \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432",
    "speech.dlEngine": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438",
    "speech.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "speech.needsDictate": "\u0414\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u043E\u0434\u0430 \u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "speech.needsTranscribe": "\u0414\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "speech.needs": "\xAB{feature}\xBB: \u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "speech.dlStopped": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0430\u0441\u044C: {why}",
    "speech.unknownError": "\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430",
    "speech.dlOffer": "\u0441\u043A\u0430\u0447\u0430\u0442\u044C {size}, \u0434\u0430\u043B\u044C\u0448\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D; {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0435 (\u0441 \u043C\u043E\u0434\u0435\u043B\u044C\u044E {model})",
    "speech.needsFree": "\u041D\u0443\u0436\u043D\u043E {need} \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430; \u043D\u0430 {drive} \u0435\u0441\u0442\u044C {free}",
    "speech.needsFreeAbout": "\u041D\u0443\u0436\u043D\u043E \u2248{need} \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430; \u043D\u0430 {drive} \u0435\u0441\u0442\u044C {free}",
    "speech.freeOn": "\u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E {free} \u043D\u0430 {drive}",
    "speech.useGpu": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "speech.gpuMore": "\u0435\u0449\u0451 {size} \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438; \u0444\u0440\u0430\u0437\u0430 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043E\u043A\u043E\u043B\u043E {gpu} \u0432\u043C\u0435\u0441\u0442\u043E {cpu} ({card})",
    "speech.starting": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F\u2026",
    "speech.notRunning": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "speech.itStopped": "\u043E\u043D \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0441\u044F",
    "speech.restart": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C",
    "speech.onCard": "\u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "speech.onProcessor": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "speech.onMetal": "\u043D\u0430 \u0433\u0440\u0430\u0444\u0438\u043A\u0435 Apple (Metal)",
    "speech.sharedDictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0442\u043E\u0436\u0435 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "speech.sharedTranscribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0442\u043E\u0436\u0435 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "speech.keptDictate": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430\u044F \u0434\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u043E\u0434\u0430 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435, \u0435\u0441\u043B\u0438 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u043E\u0434\u0432\u0435\u0434\u0451\u0442",
    "speech.keptTranscribe": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430\u044F \u0434\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435, \u0435\u0441\u043B\u0438 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u043E\u0434\u0432\u0435\u0434\u0451\u0442",
    "speech.keptBoth": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430\u044F \u0434\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u043E\u0434\u0430 \u0438 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435, \u0435\u0441\u043B\u0438 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u043E\u0434\u0432\u0435\u0434\u0451\u0442",
    "speech.budgetPhrase": "\u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time}",
    "speech.budgetHour": "\u0447\u0430\u0441 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430 \u2248{time}",
    "speech.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "speech.autoNote": "\u0441\u0430\u043C\u0430\u044F \u0442\u043E\u0447\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C, \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0431\u044B\u0441\u0442\u0440\u0430\u044F \u0437\u0434\u0435\u0441\u044C: {budget}",
    "speech.usesNow": "\u0441\u0435\u0439\u0447\u0430\u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 {model}",
    "speech.autoCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435: \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0432\u0430\u0448\u0438\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430\u043C",
    "speech.autoMoves": "\u043F\u0435\u0440\u0435\u0439\u0434\u0451\u0442 \u043D\u0430 {model} \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D\u0430 \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F, \u0438 \u043E\u0441\u0442\u0430\u0432\u0438\u0442 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u0432\u0430\u0448\u0438\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430\u043C",
    "speech.slower": "\u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435 \u043E\u0431\u044B\u0447\u043D\u043E\u0433\u043E",
    "speech.sizeHere": "{size} \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "speech.sizePick": "{size}, \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0432\u044B\u0431\u043E\u0440\u0435",
    "speech.autoUses": "\u0421\u0435\u0439\u0447\u0430\u0441 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\xBB",
    "speech.notUsedNow": "\u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F",
    "speech.removeModel": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C {model} ({size}); \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430 \u043F\u0440\u0438 \u0432\u044B\u0431\u043E\u0440\u0435",
    "speech.prefers": "\u0410\u0432\u0442\u043E\u0432\u044B\u0431\u043E\u0440 \u043F\u0440\u0435\u0434\u043F\u043E\u0447\u0438\u0442\u0430\u0435\u0442",
    "speech.preferSpeedNote": "\u0431\u043E\u043B\u0435\u0435 \u0431\u044B\u0441\u0442\u0440\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438, \u0447\u0443\u0442\u044C \u043C\u0435\u043D\u0435\u0435 \u0442\u043E\u0447\u043D\u044B\u0435",
    "speech.preferAccNote": "\u0441\u0430\u043C\u044B\u0435 \u0442\u043E\u0447\u043D\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u044D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440 \u0443\u0441\u043F\u0435\u0432\u0430\u0435\u0442 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C",
    "speech.accuracy": "\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C",
    "speech.speed": "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C",
    "speech.gpuTitle": "\u0420\u0435\u0447\u044C \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "speech.installed": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    "speech.gpuOffer": "\u0441\u043A\u0430\u0447\u0430\u0442\u044C {size}; \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u0441\u0442\u0430\u043D\u0443\u0442 \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u0431\u044B\u0441\u0442\u0440\u0435\u0435",
    "speech.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C",
    "speech.testWaits": "\u0436\u0434\u0451\u0442, \u043F\u043E\u043A\u0430 \u0434\u0432\u0438\u0436\u043E\u043A \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u0441\u044F",
    "speech.testStep": "{model} \xB7 \u0448\u0430\u0433 {n} \u0438\u0437 {total}",
    "speech.testStarting": "\u0437\u0430\u043F\u0443\u0441\u043A",
    "speech.testing": "\u0422\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "speech.testAsk": "\u041F\u0440\u043E\u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u043B\u0443\u0447\u0448\u0438\u0435 \u043C\u043E\u0434\u0435\u043B\u0438 \u0440\u0435\u0447\u0438?",
    "speech.testNoteOne": "\u041A\u0430\u0436\u0434\u0430\u044F \u0441\u043A\u0430\u0447\u0430\u043D\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043A\u043E\u0440\u043E\u0442\u043A\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0444\u043E\u043D\u0435, \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u043C\u0438\u043D\u0443\u0442\u0443. \u0414\u043E \u0442\u0435\u0445 \u043F\u043E\u0440 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u2014 \u043B\u0438\u0448\u044C \u043E\u0446\u0435\u043D\u043A\u0430.",
    "speech.testNoteMany": "\u041A\u0430\u0436\u0434\u0430\u044F \u0441\u043A\u0430\u0447\u0430\u043D\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043A\u043E\u0440\u043E\u0442\u043A\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0444\u043E\u043D\u0435, \u043C\u0438\u043D\u0443\u0442\u0443-\u0434\u0432\u0435. \u0414\u043E \u0442\u0435\u0445 \u043F\u043E\u0440 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u2014 \u043B\u0438\u0448\u044C \u043E\u0446\u0435\u043D\u043A\u0430.",
    "speech.testRun": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0442\u0435\u0441\u0442",
    "speech.cores": { one: "{n} \u044F\u0434\u0440\u043E", few: "{n} \u044F\u0434\u0440\u0430", many: "{n} \u044F\u0434\u0435\u0440", other: "{n} \u044F\u0434\u0440\u0430" },
    "speech.laptop": "\u043D\u043E\u0443\u0442\u0431\u0443\u043A",
    "speech.noCard": "\u0431\u0435\u0437 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B",
    "speech.lookingCard": "\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443\u2026",
    "speech.measured": "\u0432\u0440\u0435\u043C\u044F \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u0440\u0435\u0447\u0438 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043E \u0437\u0434\u0435\u0441\u044C",
    "speech.guesses": "\u0434\u043E \u0442\u0435\u0441\u0442\u0430 \u0432\u0440\u0435\u043C\u044F \u2014 \u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430",
    "speech.testedLater": "\u0442\u0435\u0441\u0442 \u2014 \u043A\u043E\u0433\u0434\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "speech.testAgain": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0442\u0435\u0441\u0442",
    "speech.test": "\u0422\u0435\u0441\u0442",
    "speech.rightNow": "\u0421\u0435\u0439\u0447\u0430\u0441",
    "speech.whoSpoke": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B",
    "speech.nothingLoaded": "\u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E: \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0438 \u043F\u0430\u043C\u044F\u0442\u044C \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B \u0434\u043B\u044F \u0432\u0430\u0448\u0438\u0445 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C",
    "speech.heldCard": "\u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435: {list}",
    "speech.nothingCard": "\u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435 \u043D\u0438\u0447\u0435\u0433\u043E",
    "speech.heldCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435: {list}",
    "speech.letGo": "\u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 3 \u043C\u0438\u043D\u0443\u0442 \u043F\u0440\u043E\u0441\u0442\u043E\u044F",
    "speech.cardNone": "\u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0435\u0442 \xB7 \u0440\u0435\u0447\u044C \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "speech.looking": "\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u2026",
    "speech.cardNotNvidia": "{name} \xB7 \u0440\u0435\u0447\u044C \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440: \u043F\u043E\u043A\u0430 \u044D\u0442\u043E \u0443\u043C\u0435\u044E\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B NVIDIA",
    "speech.cardTooSmall": "{name} \xB7 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0441\u0442\u0430\u0440\u0430\u044F \u0438\u043B\u0438 \u0441\u043B\u0430\u0431\u0430\u044F \u0434\u043B\u044F \u0440\u0435\u0447\u0438 \xB7 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "speech.cardAddPart": "{name} \xB7 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0435\u0451 \u0447\u0430\u0441\u0442\u044C, \u0447\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C",
    "speech.cardFallback": "{name} \xB7 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B\u0430 \u043C\u043E\u0434\u0435\u043B\u044C, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "speech.cardCpuPlan": "{name}, \u043D\u043E \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "speech.cardOn": "{name} \xB7 \u0440\u0435\u0447\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u043D\u0435\u0439",
    "speech.cardMetal": "{name} \xB7 Whisper turbo \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u043D\u0435\u0439 (Metal)",
    "speech.dzNeedsToken": "\u043D\u0443\u0436\u0435\u043D \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 Hugging Face, \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0447\u0442\u043E\u0431\u044B \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432",
    "speech.dzChecking": "\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E \u043A\u043B\u044E\u0447\u2026",
    "speech.dzDownloading": "\u043A\u043B\u044E\u0447 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \xB7 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u044E \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432\u2026",
    "speech.dzBadToken": "\u043A\u043B\u044E\u0447 \u043D\u0435 \u0441\u0440\u0430\u0431\u043E\u0442\u0430\u043B: \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0433\u043E \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u0438 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0441 \u0442\u0438\u043F\u043E\u043C Read",
    "speech.dzNoAccess": "\u043A\u043B\u044E\u0447 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442, \u043D\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0435\u0449\u0451 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u0430 \u0434\u043B\u044F \u043D\u0435\u0433\u043E: \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0444\u043E\u0440\u043C\u0443 \u043D\u0430 \u0435\u0451 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 (\u0448\u0430\u0433 2), \u0437\u0430\u0442\u0435\u043C \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u043D\u043E\u0432\u0430\xBB",
    "speech.dzFailed": "\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043B\u044E\u0447",
    "speech.dzMissing": "\u043A\u043B\u044E\u0447 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \xB7 \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441 \u043F\u0435\u0440\u0432\u043E\u0439 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u043E\u0439",
    "speech.dzReady": "\u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0430 \u043C\u0435\u0441\u0442\u0435 \xB7 \u0441\u043F\u0438\u043A\u0435\u0440\u044B \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u044E\u0442\u0441\u044F \u043E\u0444\u043B\u0430\u0439\u043D, \u043A\u043B\u044E\u0447 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043D\u0443\u0436\u0435\u043D",
    "speech.voicesModel": "\u041C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u0432",
    "speech.voicesLater": "\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "speech.card": "\u0412\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "speech.processor": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440",
    "speech.voicesHour": "\u0433\u043E\u043B\u043E\u0441\u0430 \u0447\u0430\u0441\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430 \u2248{time} \u0437\u0434\u0435\u0441\u044C",
    "speech.advised": "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F",
    "speech.torchCard": "PyTorch \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B \xB7 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u2248{download} \xB7 {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0435, \u0432\u043C\u0435\u0441\u0442\u043E \u0447\u0430\u0441\u0442\u0438 \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B",
    "speech.torchCpu": "PyTorch \u0434\u043B\u044F \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0430 \xB7 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u2248{download} \xB7 {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0435",
    "speech.chosen": "\u0432\u044B\u0431\u0440\u0430\u043D\u043E",
    "speech.use": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C",
    "speech.speakersInfo": "\u0421\u043B\u043E\u0432\u0430 \u0443\u0436\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u044E\u0442\u0441\u044F. \u0420\u0430\u0437\u043B\u0438\u0447\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u0430 \u2014 \u0434\u0435\u043B\u043E \u0434\u0440\u0443\u0433\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u0438; \u043E\u043D\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 PyTorch, \u0435\u0433\u043E \u0438 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u044E\u0442 \u0437\u0434\u0435\u0441\u044C.",
    "speech.runsOn": "\u0413\u0434\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "speech.voicesHere": "\u043C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u0432 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C: \u043A\u043B\u044E\u0447 Hugging Face \u043D\u0435 \u043D\u0443\u0436\u0435\u043D",
    "speech.voicesKey": "\u0437\u0430\u0442\u0435\u043C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 Hugging Face, \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432",
    "speech.downloadGrp": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430",
    "speech.whoOnCard": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B, \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "speech.whoOnCpu": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B, \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "speech.dlOnce": "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u2248{size}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \xB7 {model}",
    "speech.nowCard": "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "speech.nowCpu": "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "speech.switchCard": "\u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443: \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u2248{size}; \u0434\u0440\u0443\u0433\u043E\u0439 PyTorch \u0431\u0443\u0434\u0435\u0442 \u0443\u0434\u0430\u043B\u0451\u043D",
    "speech.switchCpu": "\u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440: \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u2248{size}; \u0434\u0440\u0443\u0433\u043E\u0439 PyTorch \u0431\u0443\u0434\u0435\u0442 \u0443\u0434\u0430\u043B\u0451\u043D",
    "speech.switch": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438",
    "speech.installedCard": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "speech.installedCpu": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "speech.hfKey": "\u041A\u043B\u044E\u0447 Hugging Face",
    "speech.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    "speech.replaceKey": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043A\u043B\u044E\u0447",
    "speech.checkAgain": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u043D\u043E\u0432\u0430",
    "speech.step1": "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044C \u043D\u0430 Hugging Face",
    "speech.step1Rest": ", \u044D\u0442\u043E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E.",
    "speech.step2": "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 {page} \u0438 \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0444\u043E\u0440\u043C\u0443: Company/university \u2014 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E, \u043F\u043E\u0434\u043E\u0439\u0434\u0451\u0442 \u0438 \u0432\u0430\u0448\u0435 \u0438\u043C\u044F; Use case: {use}. \u0417\u0430\u0442\u0435\u043C \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Agree and access.",
    "speech.step2Page": "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u043C\u043E\u0434\u0435\u043B\u0438",
    "speech.step3": "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 {tokens} \u2192 Create new token \u2192 \u0442\u0438\u043F {read} \u2192 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u043A\u043B\u044E\u0447 hf_\u2026.",
    "speech.step4": "\u0412\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0441\u044E\u0434\u0430 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C\xBB. \u041C\u043E\u0434\u0435\u043B\u044C \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437; \u0434\u0430\u043B\u044C\u0448\u0435 \u0432\u0441\u0451 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D.",
    "speech.missingPart": "\u0421\u043F\u0438\u043A\u0435\u0440\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u044E\u0442\u0441\u044F: \u0438\u0445 \u0447\u0430\u0441\u0442\u044C \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u0430.",
    "speech.missingKey": "\u0421\u043F\u0438\u043A\u0435\u0440\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u044E\u0442\u0441\u044F: \u043D\u0443\u0436\u0435\u043D \u043A\u043B\u044E\u0447 Hugging Face.",
    "speech.setUp": "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C",
    "tr.srcFile": "\u0444\u0430\u0439\u043B",
    "tr.srcMic": "\u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    "tr.srcNote": "\u0437\u0430\u043C\u0435\u0442\u043A\u0430",
    "tr.stageDecode": "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0437\u0432\u0443\u043A\u0430",
    "tr.stageWords": "\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0440\u0435\u0447\u0438",
    "tr.stageSpeakers": "\u0420\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432",
    "tr.stageSave": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435",
    "tr.starting": "\u0417\u0430\u043F\u0443\u0441\u043A",
    "tr.waitingTurn": "\u0416\u0434\u0451\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u0438",
    "tr.fmtText": "\u0422\u0435\u043A\u0441\u0442",
    "tr.fmtSubs": "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B",
    "tr.fmtData": "\u0414\u0430\u043D\u043D\u044B\u0435",
    "tr.auto": "\u0410\u0432\u0442\u043E",
    "tr.filesWaiting": { one: "{n} \u0444\u0430\u0439\u043B \u0436\u0434\u0451\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u0438", few: "{n} \u0444\u0430\u0439\u043B\u0430 \u0436\u0434\u0443\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u0438", many: "{n} \u0444\u0430\u0439\u043B\u043E\u0432 \u0436\u0434\u0443\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u0438", other: "{n} \u0444\u0430\u0439\u043B\u0430 \u0436\u0434\u0443\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u0438" },
    "tr.dropTitle": "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0432\u0438\u0434\u0435\u043E- \u0438\u043B\u0438 \u0430\u0443\u0434\u0438\u043E\u0444\u0430\u0439\u043B",
    "tr.dropNote": "\u0441\u044E\u0434\u0430 \u0438\u043B\u0438 \u0432 \u043B\u044E\u0431\u043E\u0435 \u043C\u0435\u0441\u0442\u043E \u043E\u043A\u043D\u0430 \xB7 mp4, mov, mkv, webm, mp3, m4a, wav\u2026 \xB7 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043C\u0435\u0441\u0442\u0435, \u043D\u0435 \u043A\u043E\u043F\u0438\u0440\u0443\u0435\u0442\u0441\u044F \xB7 \u0447\u0430\u0441 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0437\u0434\u0435\u0441\u044C \u2248{time}",
    "tr.anHour": "\u0447\u0430\u0441",
    "tr.pick": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B\u2026",
    "tr.language": "\u042F\u0437\u044B\u043A",
    "tr.languageNote": "\u0410\u0432\u0442\u043E: \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442\u0441\u044F \u043F\u043E \u043F\u0435\u0440\u0432\u044B\u043C \u0441\u0435\u043A\u0443\u043D\u0434\u0430\u043C",
    "tr.speakers": "\u0421\u043F\u0438\u043A\u0435\u0440\u044B",
    "tr.speakersNote": "\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \xB7 \xAB\u0410\u0432\u0442\u043E\xBB \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442 \u0441\u0430\u043C\u043E",
    "tr.micTitle": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0441 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u0430",
    "tr.micNote": "\u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440, \u043B\u0435\u043A\u0446\u0438\u044F, \u043B\u044E\u0434\u0438 \u0432 \u043A\u043E\u043C\u043D\u0430\u0442\u0435 \xB7 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438",
    "tr.record": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C",
    "tr.recording": "\u0417\u0430\u043F\u0438\u0441\u044C",
    "tr.stopTranscribe": "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C",
    "tr.lostPiece": "\u0427\u0430\u0441\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0435 \u0434\u043E\u0448\u043B\u0430 \u0434\u043E \u0434\u0432\u0438\u0436\u043A\u0430",
    "tr.dropHere": "\u041E\u0442\u043F\u0443\u0441\u0442\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C",
    "tr.needEngine": "\u0414\u043B\u044F \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043E\u043A \u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "tr.needEngineNote": "\u043E\u043D \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \xAB\u0417\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438\xBB",
    "tr.transcribeLink": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438\u2026",
    "tr.startingNote": "\u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "tr.search": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0432\u0441\u0435\u043C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430\u043C",
    "tr.new": "\u041D\u043E\u0432\u0430\u044F",
    "tr.newTitle": "\u041D\u043E\u0432\u0430\u044F \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "tr.needKb": "\u0414\u043B\u044F \u0437\u0430\u043C\u0435\u0442\u043E\u043A \u043D\u0443\u0436\u043D\u0430 \u043F\u0430\u043F\u043A\u0430 \u0431\u0430\u0437\u044B \u0437\u043D\u0430\u043D\u0438\u0439.",
    "tr.choose": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C\u2026",
    "tr.openingLib": "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u044E \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443\u2026",
    "tr.nothing": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.",
    "tr.emptyTitle": "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "tr.tipDrop": "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0432\u0438\u0434\u0435\u043E- \u0438\u043B\u0438 \u0430\u0443\u0434\u0438\u043E\u0444\u0430\u0439\u043B \u0432 \u044D\u0442\u043E \u043E\u043A\u043D\u043E",
    "tr.tipMic": "\u0417\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0441 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u0430 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \xAB\u0417\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438\xBB",
    "tr.tipNote": "\u041D\u0430\u0434\u0438\u043A\u0442\u0443\u0439\u0442\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0443: {keys} \u0432 \u043B\u044E\u0431\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435",
    "tr.failed": "\u043E\u0448\u0438\u0431\u043A\u0430",
    "tr.recordingChip": "\u0437\u0430\u043F\u0438\u0441\u044C",
    "tr.waiting": "\u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u0438",
    "tr.opening": "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u2026",
    "tr.rename": "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C",
    "tr.couldNot": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C",
    "tr.delete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    "tr.afterStop": "\u0422\u0435\u043A\u0441\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u043F\u0438\u0441\u044C \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F.",
    "tr.background": "\u041E\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C: \u0440\u0430\u0431\u043E\u0442\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F \u0432 \u0444\u043E\u043D\u0435.",
    "tr.startsAfter": "\u041D\u0430\u0447\u043D\u0451\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u0442\u0441\u044F \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F.",
    "tr.loadingModel": "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u0438, \u043F\u043E\u0438\u0441\u043A \u0440\u0435\u0447\u0438",
    "tr.posMin": "{at} \u0438\u0437 {total} \u043C\u0438\u043D",
    "tr.posClock": "{at} \u0438\u0437 {total}",
    "tr.underMinute": "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043C\u0435\u043D\u044C\u0448\u0435 \u043C\u0438\u043D\u0443\u0442\u044B",
    "tr.minLeft": "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043E\u043A\u043E\u043B\u043E {n} \u043C\u0438\u043D",
    "tr.copied": "\u0422\u0435\u043A\u0441\u0442 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D",
    "tr.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E: {file}",
    "tr.export": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442",
    "tr.toKb": "\u0412 \u0431\u0430\u0437\u0443 \u0437\u043D\u0430\u043D\u0438\u0439",
    "tr.inKb": "\u0412 \u0431\u0430\u0437\u0435 \u0437\u043D\u0430\u043D\u0438\u0439: {file}",
    "tr.chooseFolder": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043F\u0430\u043F\u043A\u0443",
    "tr.callsFolder": "\u041F\u0430\u043F\u043A\u0430 \u0441\u043E\u0437\u0432\u043E\u043D\u043E\u0432",
    "tr.callsFolderNote": "\u0437\u0430\u043F\u0438\u0441\u0438, \u0447\u0442\u043E \u0443\u0436\u0435 \u043B\u0435\u0436\u0430\u0442 \u0432 \u043D\u0435\u0439, \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u044E\u0442\u0441\u044F, \u0440\u044F\u0434\u043E\u043C \u0441 \u043A\u0430\u0436\u0434\u043E\u0439 Markdown \u0441 \u0442\u0435\u043A\u0441\u0442\u043E\u043C; \u0441\u043E\u0437\u0432\u043E\u043D\u044B, \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u044B\u0435 \u0437\u0434\u0435\u0441\u044C, \u0442\u043E\u0436\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u0442\u0443\u0434\u0430",
    "tr.callsSet": "\u041F\u0430\u043F\u043A\u0430 \u0441\u043E\u0437\u0432\u043E\u043D\u043E\u0432: {folder}",
    "tr.ask": "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u0438: \u0447\u0442\u043E \u043C\u044B \u0440\u0435\u0448\u0438\u043B\u0438 \u043F\u043E\u2026",
    "tr.askBtn": "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C",
    "tr.asking": "\u041F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u044E \u0437\u0430\u043F\u0438\u0441\u0438\u2026",
    "tr.askNothing": "\u0412 \u0437\u0430\u043F\u0438\u0441\u044F\u0445 \u043D\u0435\u0442 \u043D\u0438\u0447\u0435\u0433\u043E \u043E\u0431 \u044D\u0442\u043E\u043C.",
    "tr.askNeedModel": "\u0414\u043B\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \u043D\u0443\u0436\u043D\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C: \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \xAB\u0422\u043E\u0447\u043D\u044B\u0439\xBB \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u041C\u043E\u0434\u0435\u043B\u0438.",
    "tr.deleteAsk": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430?",
    "tr.keep": "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
    "tr.deleted": "\u0423\u0434\u0430\u043B\u0435\u043D\u043E",
    "tr.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C",
    "tr.showInFolder": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432 \u043F\u0430\u043F\u043A\u0435",
    "tr.whyFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u044C \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432; \u0442\u0435\u043A\u0441\u0442 \u0438\u0434\u0451\u0442 \u043E\u0434\u043D\u0438\u043C \u043F\u043E\u0442\u043E\u043A\u043E\u043C.",
    "tr.whyNoPart": "\u0421\u043F\u0438\u043A\u0435\u0440\u044B \u043D\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u044B: \xAB\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B\xBB \u0442\u043E\u0433\u0434\u0430 \u0435\u0449\u0451 \u043D\u0435 \u0431\u044B\u043B \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D.",
    "tr.whyNoKey": "\u0421\u043F\u0438\u043A\u0435\u0440\u044B \u043D\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u044B: \u043C\u043E\u0434\u0435\u043B\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432 \u043D\u0443\u0436\u0435\u043D \u0431\u044B\u043B \u043A\u043B\u044E\u0447 Hugging Face.",
    "tr.meetNote": "\u0412\u0430\u0448 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u2014 \u044D\u0442\u043E Me; \u0433\u043E\u043B\u043E\u0441\u0430 \u0437\u0432\u043E\u043D\u043A\u0430 \u2014 \u043E\u0434\u0438\u043D \u0441\u043F\u0438\u043A\u0435\u0440.",
    "tr.setUpSpeakers": "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0441\u043F\u0438\u043A\u0435\u0440\u043E\u0432",
    "tr.noWords": "\u042D\u0442\u0443 \u0432\u0441\u0442\u0440\u0435\u0447\u0443 \u0443\u0436\u0435 \u043D\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u044C: \u0435\u0451 \u0441\u043B\u043E\u0432\u0430 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0441\u044C.",
    "tr.noRecog": "\u0422\u0435\u043A\u0441\u0442 \u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442\u0441\u044F \u0437\u0430\u043D\u043E\u0432\u043E; \u043F\u0440\u0430\u0432\u043A\u0438 \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F.",
    "tr.split": "\u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u044C \u043F\u043E \u0441\u043F\u0438\u043A\u0435\u0440\u0430\u043C",
    "tr.editsLost": "\u041F\u0440\u0430\u0432\u043A\u0438 \u0432 \u0442\u0435\u043A\u0441\u0442\u0435 \u0431\u0443\u0434\u0443\u0442 \u043F\u043E\u0442\u0435\u0440\u044F\u043D\u044B. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C?",
    "tr.goOn": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C?",
    "tr.again": "\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E",
    "tr.redoTime": "\u0415\u0451 \u043C\u043E\u0436\u043D\u043E \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E, \u0441\u043E \u0441\u043F\u0438\u043A\u0435\u0440\u0430\u043C\u0438: \u043E\u043A\u043E\u043B\u043E {n} \u043C\u0438\u043D.",
    "tr.speakerName": "\u0418\u043C\u044F \u0441\u043F\u0438\u043A\u0435\u0440\u0430",
    "tr.tapRename": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u0438\u043C\u044F, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C",
    "tr.nameHintNote": "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043E \u0441 \u044D\u043A\u0440\u0430\u043D\u0430: \u044D\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442\u0430\u043B\u044C\u043D\u043E, \u043C\u043E\u0436\u0435\u0442 \u043E\u0448\u0438\u0431\u0430\u0442\u044C\u0441\u044F",
    "tr.applyName": "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C",
    "tr.dismissName": "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C",
    "tr.anotherSpeaker": "\u0414\u0440\u0443\u0433\u043E\u0439 \u0441\u043F\u0438\u043A\u0435\u0440",
    "tr.listenFrom": "\u0421\u043B\u0443\u0448\u0430\u0442\u044C \u043E\u0442\u0441\u044E\u0434\u0430",
    "tr.position": "\u041F\u043E\u0437\u0438\u0446\u0438\u044F",
    "tr.playSpace": "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438 \u0438\u043B\u0438 \u043F\u0430\u0443\u0437\u0430 \xB7 Space",
    "tr.play": "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438 \u0438\u043B\u0438 \u043F\u0430\u0443\u0437\u0430",
    "nav.home": "\u041F\u0443\u043B\u044C\u0442",
    "nav.english": "\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430",
    "nav.voice": "\u0421\u043A\u0430\u0436\u0438 \u2014 \u043D\u0430\u043F\u0438\u0448\u0443",
    "nav.recordings": "\u0421\u043E\u0437\u0432\u043E\u043D\u044B",
    "nav.layout": "\u041D\u0435 \u0442\u0430 \u0431\u0443\u043A\u0432\u0430",
    "nav.translate": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "nav.words": "\u041C\u043E\u0438 \u0441\u043B\u043E\u0432\u0430",
    "nav.mistakes": "\u041C\u043E\u0438 \u043E\u0448\u0438\u0431\u043A\u0438",
    "nav.transcripts": "\u0412\u0441\u0435 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "nav.translations": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u0432",
    "nav.phrases": "\u041D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0444\u0440\u0430\u0437\u044B",
    "nav.vocabulary": "\u0418\u043C\u0435\u043D\u0430 \u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u044B",
    "nav.kept": "\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C",
    "nav.learned": "\u0412\u044B\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u0441\u043B\u043E\u0432\u0430",
    "nav.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    "nav.layouts": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043E\u043A",
    "nav.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "nav.models": "\u041C\u043E\u0434\u0435\u043B\u0438",
    "nav.storage": "\u041C\u0435\u0441\u0442\u043E \u043D\u0430 \u0434\u0438\u0441\u043A\u0435",
    "nav.keys": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438",
    "nav.about": "\u041E \u0422\u0438\u0446\u044C",
    "nav.report": "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0435",
    "nav.search": "\u041F\u043E\u0438\u0441\u043A",
    "nav.minimize": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C",
    "nav.making": "\u0421\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "search.placeholder": "\u041F\u043E\u0438\u0441\u043A",
    "search.title": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u043C (Ctrl+F)",
    "search.nothing": "\u041D\u0438\u0433\u0434\u0435 \u043D\u0435\u0442 \xAB{q}\xBB. \u0412 \u0441\u043B\u043E\u0432\u0430\u0445, \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430\u0445 \u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430\u0445 \u0441\u0432\u043E\u0439 \u043F\u043E\u0438\u0441\u043A.",
    "search.hint": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0432\u0435\u0440\u0445\u0443: \u043B\u044E\u0431\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u043B\u044E\u0431\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u043F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044E, \u043F\u043E-\u0440\u0443\u0441\u0441\u043A\u0438 \u0438\u043B\u0438 \u043F\u043E-\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438.",
    "page.speakers": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B",
    "page.fixing": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "page.languages": "\u0412\u0430\u0448\u0438 \u044F\u0437\u044B\u043A\u0438",
    "page.checkEnglish": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E",
    "page.forCheckCap": "\u043C\u043E\u0434\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043D\u0430\u0445\u043E\u0434\u0438\u0442 \u0432\u0430\u0448\u0438 \u043E\u0448\u0438\u0431\u043A\u0438",
    "page.voice": "\u0413\u043E\u043B\u043E\u0441",
    "page.forVoiceCap": "\u0433\u043E\u043B\u043E\u0441, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0447\u0438\u0442\u0430\u0435\u0442 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0432\u0441\u043B\u0443\u0445",
    "home.paused": "\u0422\u0438\u0446\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435",
    "home.pausedNote": "\u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442",
    "home.replayTitle": "\u041F\u0440\u043E\u0438\u0433\u0440\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0443 \u0435\u0449\u0451 \u0440\u0430\u0437",
    "home.replay": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "home.ready": "\u0422\u0438\u0446\u044C \u0433\u043E\u0442\u043E\u0432",
    "home.readyNote": "\u0432\u0441\u0451 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "home.downloading": "\u041A\u0430\u0447\u0430\u0435\u0442\u0441\u044F: {name}",
    "home.yourKeys": "\u0412\u0430\u0448\u0438 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "home.unset": "\u0411\u0435\u0437 \u043A\u043B\u0430\u0432\u0438\u0448\u0438: {n}. \u0417\u0430\u0434\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439.",
    "home.troubleTranslator": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043B\u0441\u044F; \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0435\u0442 \u0441\u043D\u043E\u0432\u0430.",
    "home.troubleVoice": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043B\u0441\u044F; \u043F\u043E\u043A\u0430 \u0447\u0438\u0442\u0430\u0435\u0442 \u0433\u043E\u043B\u043E\u0441 Windows.",
    "home.troubleSpeech": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0441\u044F: \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0435\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u0432 \xAB\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0435\xBB.",
    "home.eyebrow": "\u041E\u0434\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0430, \u0442\u0440\u0438 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "home.stepFix": "\u0438\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "home.stepTranslate": "\u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "home.stepListen": "\u0441\u043B\u0443\u0448\u0430\u0442\u044C",
    "home.downloadsOnce": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "menu.translate": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "menu.listen": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
    "menu.inPlace": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "menu.screen": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "menu.check": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "menu.talk": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441 \u0422\u0438\u0446\u044C",
    "menu.dictate": "\u041F\u0435\u0447\u0430\u0442\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "menu.english": "\u041F\u0435\u0447\u0430\u0442\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0441 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "menu.fix": "\u0418\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443",
    "menu.foot": "\u0411\u0443\u043A\u0432\u0430 \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \xB7 Esc \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C",
    "menu.nothingToRead": "\u041D\u0435\u0447\u0435\u0433\u043E \u0447\u0438\u0442\u0430\u0442\u044C: \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442",
    "menu.nothingToReplace": "\u041D\u0435\u0447\u0435\u0433\u043E \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C: \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442",
    "menu.keyTitle": "\u041C\u0435\u043D\u044E \u0422\u0438\u0446\u044C",
    "menu.keyNote": "\u043E\u0434\u043D\u0430 \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u2014 \u0432\u0441\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F",
    "keys.group": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438",
    "keys.copyTwice": "Ctrl + C \u0434\u0432\u0430\u0436\u0434\u044B",
    "keys.twice": "{key} \u0434\u0432\u0430\u0436\u0434\u044B",
    "keys.tap": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435 {key}",
    "keys.press": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435 {key}",
    "keys.useSelect": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0438 \u0447\u0442\u0435\u043D\u0438\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u0432\u0441\u043B\u0443\u0445",
    "keys.useSnip": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0438 \u0447\u0442\u0435\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u0430 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "keys.useTranslate": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E",
    "keys.useText": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u0430 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "keys.useInPlace": "\u0437\u0430\u043C\u0435\u043D\u0430 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "keys.useCheck": "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0432\u0430\u0448\u0435\u0433\u043E \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E",
    "keys.useType": "\u0432\u0432\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "keys.useTypeCheck": "\u0432\u0432\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
    "keys.useSwitch": "\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438",
    "keys.useFix": "\u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438",
    "keys.useDictate": "\u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430",
    "keys.useEnglish": "\u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430 \u043D\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C",
    "keys.useNote": "\u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430 \u0437\u0430\u043C\u0435\u0442\u043A\u0438",
    "keys.useAgain": "\u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u0444\u0440\u0430\u0437\u044B",
    "keys.usePractice": "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0433\u043E",
    "keys.useTalk": "\u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441 \u0422\u0438\u0446\u044C",
    "keys.usePause": "\u043F\u0430\u0443\u0437\u0430 \u0422\u0438\u0446\u044C",
    "keys.useWindow": "\u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0435 \u0422\u0438\u0446\u044C",
    "keys.useMenu": "\u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0435 \u043C\u0435\u043D\u044E \u0422\u0438\u0446\u044C",
    "keys.toLayout": "\u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u043D\u0430 {layout}",
    "keys.aLayout": "\u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443",
    "keys.taken": "{key} \u0443\u0436\u0435 \u0437\u0430\u043D\u044F\u0442\u043E: {use}.",
    "keys.copyTwiceOnly": "Ctrl + C \u0434\u0432\u0430\u0436\u0434\u044B \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043A\u043B\u0430\u0432\u0438\u0448\u0435\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C.",
    "keys.menuAlt": "Alt \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043C\u0435\u043D\u044E, \u044D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 F10",
    "keys.menuWin": "Win \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \xAB\u041F\u0443\u0441\u043A\xBB, \u044D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 Ctrl+Esc",
    "keys.menuCtrlEsc": "Ctrl+Esc \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \xAB\u041F\u0443\u0441\u043A\xBB, \u044D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 Win",
    "keys.recordTitle": "\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435, \u0437\u0430\u0442\u0435\u043C \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438: Ctrl+Alt+T, Left Ctrl \u0434\u0432\u0430\u0436\u0434\u044B, Pause, \u0431\u043E\u043A\u043E\u0432\u0443\u044E \u043A\u043D\u043E\u043F\u043A\u0443 \u043C\u044B\u0448\u0438\u2026",
    "keys.aria": "{label}: {key}. \u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C.",
    "keys.notSet": "\u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043E",
    "keys.pressKeys": "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438\u2026",
    "keys.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
    "keys.clearAria": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C: {label}",
    "keys.backTo": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C {key}",
    "keys.backToAria": "{label}: \u0432\u0435\u0440\u043D\u0443\u0442\u044C {key}",
    "keys.takenProgram": "\u0417\u0430\u043D\u044F\u0442\u043E \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439; \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435.",
    "keys.set": "\u0417\u0430\u0434\u0430\u0442\u044C",
    "listen.tryKey": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u044D\u0442\u043E\u0442 \u0442\u0435\u043A\u0441\u0442 \u0438 {how}.",
    "listen.tryTwice": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u044D\u0442\u043E\u0442 \u0442\u0435\u043A\u0441\u0442 \u0438 \u0434\u0432\u0430\u0436\u0434\u044B \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Ctrl + C.",
    "listen.tryNone": "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0443 \u0432\u044B\u0448\u0435 (\u043C\u043E\u0436\u043D\u043E Ctrl + C \u0434\u0432\u0430\u0436\u0434\u044B), \u0437\u0430\u0442\u0435\u043C \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u044D\u0442\u043E\u0442 \u0442\u0435\u043A\u0441\u0442.",
    "listen.cardGroup": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    "listen.autoRead": "\u0427\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445 \u043F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438",
    "listen.rareWords": "\u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u043F\u043E\u0434 \u0440\u0435\u0434\u043A\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438",
    "listen.oneAtATime": "\u0427\u0438\u0442\u0430\u0442\u044C \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044E",
    "listen.wordHint": "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C",
    "listen.hintShift": "\u041F\u043E \u0449\u0435\u043B\u0447\u043A\u0443 \u0438\u043B\u0438 Shift + \u043D\u0430\u0432\u0435\u0434\u0435\u043D\u0438\u044E",
    "listen.hintHover": "\u041F\u043E \u0449\u0435\u043B\u0447\u043A\u0443 \u0438\u043B\u0438 \u043D\u0430\u0432\u0435\u0434\u0435\u043D\u0438\u044E",
    "listen.hintOff": "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u0449\u0435\u043B\u0447\u043A\u0443",
    "listen.inCard": "\u0412 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435",
    "listen.playKeys": "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435, \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u043F\u043E \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C",
    "listen.clickWord": "\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u0441\u043B\u043E\u0432\u043E",
    "listen.clickWordNote": "\u0435\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0438 \u043F\u0440\u043E\u0438\u0437\u043D\u043E\u0448\u0435\u043D\u0438\u0435; \u0437\u0432\u0451\u0437\u0434\u043E\u0447\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0435\u0433\u043E \u0432 \xAB\u0421\u043B\u043E\u0432\u0430\xBB",
    "listen.clickSentence": "\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "listen.clickSentenceNote": "\u043E\u0442\u043C\u0435\u0447\u0430\u0435\u0442\u0441\u044F \u0435\u0433\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434; \u25B6 \u043D\u0430 \u043F\u043E\u043B\u0435 \u0447\u0438\u0442\u0430\u0435\u0442 \u043E\u0434\u0438\u043D \u0430\u0431\u0437\u0430\u0446",
    "listen.closeCard": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0433\u043E\u043B\u043E\u0441",
    "translate.chipReady": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "translate.chipFirstUse": "\u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u043C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438",
    "translate.chipDownloading": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435",
    "translate.chipFailed": "\u043E\u0448\u0438\u0431\u043A\u0430",
    "translate.chipUnsupported": "\u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E",
    "translate.readyNote": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434 \xAB{level}\xBB, \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D",
    "translate.absentNote": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0441 {from} \u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u043C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0435, \u0437\u0430\u0442\u0435\u043C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D",
    "translate.downloadingNote": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0441 {from}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "translate.failedNote": "\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C; \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0435\u0442 \u0441\u043D\u043E\u0432\u0430",
    "translate.unsupportedNote": "\u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u044F\u0437\u044B\u043A\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D-\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A\u0430",
    "translate.tryKey": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0435\u0433\u043E \u0438 {how}.",
    "translate.tryNone": "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0443 \u0432\u044B\u0448\u0435, \u0437\u0430\u0442\u0435\u043C \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0435\u0451.",
    "translate.typeNote": "\u043F\u0443\u0441\u0442\u0430\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0443 \u0443\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044F, \u0438\u0437 \u043B\u044E\u0431\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B; \u0442\u0430\u043A\u0436\u0435 \u0432 \u043C\u0435\u043D\u044E \u0432 \u0442\u0440\u0435\u0435",
    "translate.pasteBack": "\u0412 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435: \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043D\u0430 \u043C\u0435\u0441\u0442\u043E",
    "translate.shareAsk": "\u041C\u043E\u0434\u0435\u043B\u044C \xAB{model}\xBB \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "translate.shareNote": "\u0415\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E\xBB \u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441 \u0422\u0438\u0446\u044C. \u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u043E\u0436\u0435 \u043C\u043E\u0436\u0435\u0442 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C, \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u044F: \xAB{fast}\xBB \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A, \u0430 \xAB{model}\xBB \u0435\u0433\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442.",
    "translate.shareUse": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C\u044E \xAB{model}\xBB",
    "translate.empty": "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E. \u041F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C 30 \u0434\u043D\u0435\u0439, \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 200.",
    "models.aboutFast": "\u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E; \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u0444\u0440\u0430\u0437\u044B \u043C\u043E\u0433\u0443\u0442 \u0432\u044B\u0439\u0442\u0438 \u0434\u043E\u0441\u043B\u043E\u0432\u043D\u044B\u043C\u0438",
    "models.aboutAccurateLevel": "\u041F\u043E\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0446\u0435\u043B\u0438\u043A\u043E\u043C",
    "models.aboutMostLevel": "\u041B\u0443\u0447\u0448\u0438\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0438, \u043D\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435 \u0432\u0441\u0435\u0445",
    "models.onCard": "\u043D\u0430 \u0432\u0430\u0448\u0435\u0439 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "models.partlyOnCard": "\u0447\u0430\u0441\u0442\u0438\u0447\u043D\u043E \u043D\u0430 \u0432\u0430\u0448\u0435\u0439 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "models.onProcessor": "\u043D\u0430 \u0432\u0430\u0448\u0435\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "models.guessCard": "\u043E\u043A\u043E\u043B\u043E 1\u20132 \u0441 \u043D\u0430 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "models.guessPart": "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E",
    "models.guessProcessor": "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u043E \u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E: 30 \u0441 \u0438 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442",
    "models.cudaGuess": "\u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434 \u043D\u0430 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442, 15\u201320 \u0441 \u043D\u0430 \u0434\u043B\u0438\u043D\u043D\u044B\u0439",
    "models.cudaSize": "\u0441 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u0441\u0431\u043E\u0440\u043A\u043E\u0439 NVIDIA, 670 \u041C\u0411",
    "models.starts": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u0437\u0430 {time} \u043F\u043E\u0441\u043B\u0435 3 \u043C\u0438\u043D\u0443\u0442 \u043F\u0440\u043E\u0441\u0442\u043E\u044F",
    "models.cardHeld": "\u0417\u0430\u043D\u0438\u043C\u0430\u0435\u0442 {size} \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0440\u0430\u0431\u043E\u0442\u044B; \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0430\u0435\u0442 \u0435\u0451 \u043F\u043E\u0441\u043B\u0435 3 \u043C\u0438\u043D\u0443\u0442 \u043F\u0440\u043E\u0441\u0442\u043E\u044F \u0438\u043B\u0438 \u043A\u043E\u0433\u0434\u0430 \u0438\u0433\u0440\u0430 \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E \u0432\u043E \u0432\u0435\u0441\u044C \u044D\u043A\u0440\u0430\u043D",
    "models.cardFrees": "\u041E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0430\u0435\u0442 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u043F\u043E\u0441\u043B\u0435 3 \u043C\u0438\u043D\u0443\u0442 \u043F\u0440\u043E\u0441\u0442\u043E\u044F \u0438\u043B\u0438 \u043A\u043E\u0433\u0434\u0430 \u0438\u0433\u0440\u0430 \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E \u0432\u043E \u0432\u0435\u0441\u044C \u044D\u043A\u0440\u0430\u043D",
    "models.slowHere": "\u0437\u0434\u0435\u0441\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E",
    "models.here": "\u0437\u0434\u0435\u0441\u044C",
    "models.perSentence": "{time} \u043D\u0430 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "models.perCheck": "{time} \u043D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 \u0442\u0435\u043A\u0441\u0442\u0430",
    "models.perAnswer": "{time} \u043D\u0430 \u043E\u0442\u0432\u0435\u0442 \u0432 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0435",
    "models.aboutAccurate": "\u041F\u043E\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u0438 \u0437\u0430\u043C\u0435\u0447\u0430\u0435\u0442 \u043F\u043E\u0447\u0442\u0438 \u043A\u0430\u0436\u0434\u0443\u044E \u043E\u0448\u0438\u0431\u043A\u0443",
    "models.aboutMost": "\u041B\u0443\u0447\u0448\u0438\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0438, \u0447\u0443\u0442\u044C \u0432\u043D\u0438\u043C\u0430\u0442\u0435\u043B\u044C\u043D\u0435\u0435, \u043D\u043E \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435",
    "models.failedRetry": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C; \xAB\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0435\u0449\u0451 \u0440\u0430\u0437\xBB \u0441\u043A\u0430\u0447\u0430\u0435\u0442 \u0441\u043D\u043E\u0432\u0430",
    "models.onComputer": "{size} \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "models.downloadingSize": "{size}, \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "models.toDownloadFirst": "{size} \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u043C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438",
    "models.toDownloadPicked": "{size} \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "models.remove": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \xAB{level}\xBB ({size}); \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.fastFailed": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C; \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0435\u0442 \u0441\u043D\u043E\u0432\u0430",
    "models.onThisComputer": "\u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "models.fastNext": "{size} \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u044F\u0437\u044B\u043A\u0430, \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "models.fastPicked": "{size} \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u044F\u0437\u044B\u043A\u0430, \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.draft": "\u0442\u0430\u043A\u0436\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A, \u043F\u043E\u043A\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \xAB{accurate}\xBB \u0438\u043B\u0438 \xAB{most}\xBB",
    "models.checkMoves": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0442\u043E\u0436\u0435 \u043F\u0435\u0440\u0435\u0439\u0434\u0451\u0442 \u043D\u0430 \u043D\u0435\u0451: \u043E\u0434\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0434\u0435\u043B\u0430\u0435\u0442 \u0438 \u0442\u043E \u0438 \u0434\u0440\u0443\u0433\u043E\u0435",
    "models.checkShares": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0442\u043E\u0436\u0435 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "models.checkAlready": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0443\u0436\u0435 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442",
    "models.translateWith": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E",
    "models.translateShares": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u043E\u0436\u0435 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "models.translateStays": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \xAB{fast}\xBB",
    "models.translateMoves": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u043E\u0436\u0435 \u043F\u0435\u0440\u0435\u0439\u0434\u0451\u0442 \u043D\u0430 \u043D\u0435\u0451: \u043E\u0434\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0434\u0435\u043B\u0430\u0435\u0442 \u0438 \u0442\u043E \u0438 \u0434\u0440\u0443\u0433\u043E\u0435",
    "models.checkWith": "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E",
    "models.fastOnly": "\xAB{fast}\xBB \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442; \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043D\u0443\u0436\u043D\u0430 \u043E\u0434\u043D\u0430 \u0438\u0437 \u044D\u0442\u0438\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439.",
    "models.engine": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "models.speechWith": "{name}: \u043C\u043E\u0434\u0435\u043B\u044C",
    "models.options": "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B",
    "models.naturalReady": "\u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441",
    "models.naturalLater": "\u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F, \u0430 \u0434\u043E \u0442\u0435\u0445 \u043F\u043E\u0440 \u0433\u043E\u043B\u043E\u0441 Windows",
    "models.naturalNote": "\u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439, \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435 (Kokoro)",
    "models.naturalFaster": "\u0433\u043E\u0442\u043E\u0432\u0438\u0442 \u0440\u0435\u0447\u044C \u0432 {n}\xD7 \u0431\u044B\u0441\u0442\u0440\u0435\u0435, \u0447\u0435\u043C \u0437\u0432\u0443\u0447\u0438\u0442",
    "models.windowsNote": "\u0433\u043E\u043B\u043E\u0441 Windows: \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0439, \u043C\u0435\u043D\u0435\u0435 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439",
    "models.readWith": "\u0427\u0438\u0442\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "models.naturalSlow": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441 \u0437\u0434\u0435\u0441\u044C \u0433\u043E\u0442\u043E\u0432\u0438\u0442 \u0440\u0435\u0447\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435, \u0447\u0435\u043C \u0437\u0432\u0443\u0447\u0438\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0434\u0435\u043B\u0430\u0435\u0442 \u043F\u0430\u0443\u0437\u044B \u043C\u0435\u0436\u0434\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C\u0438; \u0433\u043E\u043B\u043E\u0441 Windows \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u044B\u0439.",
    "models.useRecommendedTitle": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438",
    "models.useRecommendedNote": "\u0442\u043E, \u0447\u0442\u043E \u043B\u0443\u0447\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435, \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F; \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B \u0443\u0432\u0438\u0434\u0438\u0442\u0435, \u0447\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F",
    "models.useRecommended": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u044B\u0435",
    "models.already": "\u0423\u0436\u0435 \u043A\u0430\u043A \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F",
    "models.alreadyNote": "\u043A\u0430\u0436\u0434\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0442\u043E, \u0447\u0442\u043E \u043B\u0443\u0447\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "models.apply": "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C",
    "models.changes": "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F",
    "models.toDownload": "{size} \u0441\u043A\u0430\u0447\u0430\u0442\u044C",
    "models.toDownloadAll": "\u0432\u0441\u0435\u0433\u043E \u0441\u043A\u0430\u0447\u0430\u0442\u044C {size}",
    "models.nothingToDownload": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E",
    "models.free": "\u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E {size}",
    "models.nothingRemoved": "\u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0443\u0434\u0430\u043B\u044F\u0435\u0442\u0441\u044F",
    "models.needsFree": "\u041D\u0443\u0436\u043D\u043E {size} \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430",
    "models.unused": "{size}, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0438\u0447\u0442\u043E \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442",
    "models.unusedNote": "{list}; \u043A\u0430\u0436\u0434\u043E\u0435 \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430, \u0435\u0441\u043B\u0438 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0435\u0433\u043E \u043F\u043E\u0437\u0436\u0435",
    "models.cleaning": "\u041E\u0447\u0438\u0441\u0442\u043A\u0430\u2026",
    "models.cleanUp": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
    "models.computer": "\u042D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440",
    "models.eachAction": "\u0427\u0442\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043A\u0430\u0436\u0434\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435",
    "models.translateNote": "\u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u043E\u0440\u043E\u0448\u043E \u0438 \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044F\u0442\u0441\u044F \u0442\u0435\u043A\u0441\u0442\u044B",
    "models.checkTalk": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "models.dictateNote": "\u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0441\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435",
    "models.transcribeNote": "\u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
    "models.shared": "\u041C\u043E\u0434\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u0434\u0432\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F, \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437: \xAB\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438\xBB \u0438 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\xBB \u0434\u0435\u043B\u044F\u0442 \u044F\u0437\u044B\u043A\u043E\u0432\u0443\u044E \u043C\u043E\u0434\u0435\u043B\u044C, \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u2014 \u043C\u043E\u0434\u0435\u043B\u044C \u0440\u0435\u0447\u0438, \u0433\u0434\u0435 \u044D\u0442\u043E \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u0442\u043E\u0438\u0442.",
    "models.stateDownloading": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 {pct}%",
    "models.stateFailed": "\u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F",
    "engine.notRunning": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D",
    "engine.noSound": "\u041D\u0435\u0442 \u0437\u0432\u0443\u043A\u0430",
    "engine.tooLong": "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u043E \u0434\u043B\u044F \u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0438: \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u0443\u0439\u0442\u0435 \u044D\u0442\u043E \u043A\u0430\u043A \u0437\u0430\u043F\u0438\u0441\u044C",
    "engine.notRecording": "\u042D\u0442\u043E \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u044C: {why}",
    "engine.noDictation": "\u0422\u0430\u043A\u043E\u0439 \u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0438 \u043D\u0435\u0442",
    "engine.notRecognized": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C: {why}",
    "engine.noModelToTest": "\u041D\u0435\u0442 \u0441\u043A\u0430\u0447\u0430\u043D\u043D\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u0438 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
    "engine.testRunning": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0443\u0436\u0435 \u0438\u0434\u0451\u0442",
    "engine.noModel": "\u0422\u0430\u043A\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442",
    "engine.notRemoved": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C {name}: {why}",
    "engine.usedByTranscripts": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: \u043C\u043E\u0434\u0435\u043B\u044C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043E\u043A",
    "engine.usedByDictation": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: \u043C\u043E\u0434\u0435\u043B\u044C \u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0438",
    "engine.usedLoaded": "\u0421\u0435\u0439\u0447\u0430\u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443",
    "engine.usedDownloading": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "engine.usedTest": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: \u0438\u0434\u0451\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438",
    "engine.pasteKey": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043A\u043B\u044E\u0447 Hugging Face",
    "engine.addKey": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043A\u043B\u044E\u0447 Hugging Face",
    "engine.noTranscript": "\u0422\u0430\u043A\u043E\u0439 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043D\u0435\u0442",
    "engine.stillTranscribing": "\u042D\u0442\u0430 \u0437\u0430\u043F\u0438\u0441\u044C \u0435\u0449\u0451 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442\u0441\u044F",
    "engine.transcribingNow": "\u042D\u0442\u0430 \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442\u0441\u044F",
    "engine.oneVoice": "\u0412 \u0437\u0430\u043C\u0435\u0442\u043A\u0435 \u043E\u0434\u0438\u043D \u0433\u043E\u043B\u043E\u0441",
    "engine.installSpeakers": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0447\u0430\u0441\u0442\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0435\u0442 \u0433\u043E\u043B\u043E\u0441\u0430",
    "engine.soundNotKept": "\u0417\u0432\u0443\u043A \u044D\u0442\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D",
    "engine.cannotSplit": "\u042D\u0442\u0443 \u0432\u0441\u0442\u0440\u0435\u0447\u0443 \u0443\u0436\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u0440\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u044C: \u0435\u0451 \u0441\u043B\u043E\u0432\u0430 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B",
    "engine.onlyFailed": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u0443\u0434\u0430\u0432\u0448\u0443\u044E\u0441\u044F \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0443",
    "engine.sourceGone": "\u0418\u0441\u0445\u043E\u0434\u043D\u043E\u0433\u043E \u0437\u0432\u0443\u043A\u0430 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442",
    "engine.chooseFolder": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043F\u043A\u0443 \u0431\u0430\u0437\u044B \u0437\u043D\u0430\u043D\u0438\u0439",
    "engine.fileNotFound": "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D",
    "engine.notMedia": "\u042D\u0442\u043E \u043D\u0435 \u0430\u0443\u0434\u0438\u043E- \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E\u0444\u0430\u0439\u043B",
    "engine.tooLarge": "\u0417\u0430\u043F\u0438\u0441\u044C \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0430\u044F",
    "engine.ended": "\u0417\u0430\u043F\u0438\u0441\u044C \u0443\u0436\u0435 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0430\u0441\u044C",
    "engine.nothing": "\u041D\u0435\u0447\u0435\u0433\u043E \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0442\u044C",
    "engine.notInstalled": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u043D\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D",
    "engine.keepsStopping": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0442\u043E \u0438 \u0434\u0435\u043B\u043E \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F ({code}): \u0441\u043C. {log}",
    "engine.portTaken": "\u041F\u043E\u0440\u0442 {port} \u0437\u0430\u043D\u044F\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u043E\u0439: \u0437\u0430\u043A\u0440\u043E\u0439\u0442\u0435 \u0435\u0451, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "engine.portsTaken": "\u041F\u043E\u0440\u0442\u044B {from}\u2013{to} \u0437\u0430\u043D\u044F\u0442\u044B \u0434\u0440\u0443\u0433\u0438\u043C\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430\u043C\u0438: \u0437\u0430\u043A\u0440\u043E\u0439\u0442\u0435 \u043E\u0434\u043D\u0443 \u0438\u0437 \u043D\u0438\u0445, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "engine.installFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 ({code}): {why}",
    "engine.unpackFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u0430\u043A\u043E\u0432\u0430\u0442\u044C \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python: {why}",
    "engine.installRunning": "\u0423\u0436\u0435 \u0438\u0434\u0451\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430",
    "engine.notWhole": "{name} \u0441\u043A\u0430\u0447\u0430\u043B\u0441\u044F \u043D\u0435 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E",
    "engine.hfAnswered": "Hugging Face \u043E\u0442\u0432\u0435\u0442\u0438\u043B: {status}",
    "engine.hfError": "Hugging Face \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043E\u0448\u0438\u0431\u043A\u043E\u0439",
    "engine.hfOffline": "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 Hugging Face",
    "engine.downloadFailed": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: {why}",
    "check.downloadingPct": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 {pct}%",
    "talkPage.downloading": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F; \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043D\u0430\u0447\u043D\u0451\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D\u0430 \u0431\u0443\u0434\u0435\u0442 \u0437\u0434\u0435\u0441\u044C",
    "talkPage.downloadOnce": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437; \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0442\u043E\u0436\u0435 \u043C\u043E\u0433\u0443\u0442 \u0435\u0451 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C",
    "settings.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C",
    "talkPage.engineTitle": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441\u043B\u044B\u0448\u0438\u0442 \u0432\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "talkPage.engineNote": "\u041F\u043E\u043A\u0430 \u0435\u0433\u043E \u043D\u0435\u0442, \u043F\u0438\u0448\u0438\u0442\u0435 \u0422\u0438\u0446\u044C. \u0421\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u0435\u0433\u043E \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434\xBB; \u044D\u0442\u043E \u0442\u043E\u0442 \u0436\u0435 \u0434\u0432\u0438\u0436\u043E\u043A.",
    "talkPage.openDictate": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434\xBB",
    "talkPage.aboutPlaceholder": '\u041D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u043B\u043E\u0432, \u043E \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435\u0442 \u043F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C: \u0432\u0430\u0448\u0435 \u0438\u043C\u044F, \u0440\u0430\u0431\u043E\u0442\u0430, \u0447\u0442\u043E \u0432\u0430\u043C \u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F. "I am Alex, a designer. I love hiking and progressive metal."',
    "talkPage.aboutYou": "\u041E \u0432\u0430\u0441",
    "talkPage.needsEngine": "\u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 (\u0441\u043C. \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434\xBB)",
    "talkPage.openGoing": "\u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u043C \u043E\u043A\u043D\u0435 \xB7 \u0438\u0434\u0451\u0442: {topic}, {lines}",
    "talkPage.aboutNote": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0435\u0442 \u044D\u0442\u043E \u0432 \u043A\u0430\u0436\u0434\u043E\u043C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0435, \u0447\u0442\u043E\u0431\u044B \u0441\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0442\u044C \u043E \u0432\u0430\u0448\u0435\u0439 \u0436\u0438\u0437\u043D\u0438 \u0438 \u0440\u0430\u0431\u043E\u0442\u0435. \u0425\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "talkPage.level": "\u0412\u0430\u0448 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E",
    "talkPage.levelA2": "\u042D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u044B\u0439: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u043C\u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C\u0438 \u0438\u0437 \u043F\u043E\u0432\u0441\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0445 \u0441\u043B\u043E\u0432, \u043F\u0440\u043E\u0441\u0442\u044B\u043C\u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u0430\u043C\u0438, \u0431\u0435\u0437 \u0438\u0434\u0438\u043E\u043C",
    "talkPage.levelB1": "\u0421\u0440\u0435\u0434\u043D\u0438\u0439: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \u043F\u043E\u0432\u0441\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438 \u0438 \u0447\u0430\u0441\u0442\u044B\u043C\u0438 \u0444\u0440\u0430\u0437\u043E\u0432\u044B\u043C\u0438 \u0433\u043B\u0430\u0433\u043E\u043B\u0430\u043C\u0438; \u0440\u0435\u0434\u043A\u043E\u0435 \u0441\u043B\u043E\u0432\u043E \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u0435\u0442",
    "talkPage.levelB2": "\u0412\u044B\u0448\u0435 \u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E: \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F, \u0444\u0440\u0430\u0437\u043E\u0432\u044B\u0435 \u0433\u043B\u0430\u0433\u043E\u043B\u044B, \u0438\u043D\u043E\u0433\u0434\u0430 \u0438\u0434\u0438\u043E\u043C\u0430",
    "talkPage.keys": "\u041A\u043B\u0430\u0432\u0438\u0448\u0438",
    "talkPage.spaceKey": "\u0412 \u043E\u043A\u043D\u0435 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430: \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C, \u043F\u043E\u0442\u043E\u043C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "talkPage.escKey": "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0435\u043F\u043B\u0438\u043A\u0443 \u0438\u043B\u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0422\u0438\u0446\u044C",
    "talkPage.aloud": "\u0427\u0438\u0442\u0430\u0442\u044C \u043E\u0442\u0432\u0435\u0442\u044B \u0422\u0438\u0446\u044C \u0432\u0441\u043B\u0443\u0445",
    "talkPage.aloudNote": "\u043E\u0442\u0432\u0435\u0442\u044B \u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0438\u0445\u043E\u0434\u044F\u0442; \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u043D\u0430 \u0440\u0435\u043F\u043B\u0438\u043A\u0443 \u0447\u0438\u0442\u0430\u0435\u0442 \u0435\u0451 \u0441\u043D\u043E\u0432\u0430",
    "talkPage.onTop": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043F\u043E\u0432\u0435\u0440\u0445 \u0434\u0440\u0443\u0433\u0438\u0445 \u043E\u043A\u043E\u043D",
    "talkPage.onTopNote": "\u043A\u0430\u043A \u0441 \u0431\u0443\u043B\u0430\u0432\u043A\u043E\u0439 \u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u0438 \u043E\u043A\u043D\u0430 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430",
    "talkPage.model": "\u041C\u043E\u0434\u0435\u043B\u044C",
    "talkPage.voice": "\u0413\u043E\u043B\u043E\u0441",
    "talkPage.kept": "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u043E\u0435",
    "talkPage.history": "\u0412\u0430\u0448\u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B \u2014 \u0432 \u043E\u043A\u043D\u0435 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430: \u043A\u043D\u043E\u043F\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0438\u0445, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0438\u0442\u044C. \u0425\u0440\u0430\u043D\u044F\u0442\u0441\u044F 30 \u0434\u043D\u0435\u0439 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435, \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 50.",
    "check.typedKey": "{keys} \u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u0435\u0433\u043E",
    "check.typedTray": "\u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435\u0441\u044C \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439\u2026\xBB \u0432 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044F",
    "check.tryKey": "\u0412 \u044D\u0442\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0435 \u043E\u0448\u0438\u0431\u043A\u0438. \u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0435\u0433\u043E, {keys}, \u0438\u043B\u0438 {typed}.",
    "check.tryNoKey": "\u0412 \u044D\u0442\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0435 \u043E\u0448\u0438\u0431\u043A\u0438. \u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0435\u0433\u043E \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0441\u0432\u043E\u044E \u043A\u043B\u0430\u0432\u0438\u0448\u0443, \u0438\u043B\u0438 {typed}.",
    "check.keySelected": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442",
    "check.typeKey": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
    "check.typeKeyNote": "\u043F\u0443\u0441\u0442\u0430\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0443 \u0443\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044F, \u0438\u0437 \u043B\u044E\u0431\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B; \u0442\u0430\u043A\u0436\u0435 \u0432 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044F",
    "check.speechNote": "\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0440\u0435\u0447\u0438 \u0441\u0430\u043C\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043E\u0448\u0438\u0431\u043A\u0438, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0432 \u043D\u0430\u0431\u0440\u0430\u043D\u043D\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0438\u0445 \u0432\u0438\u0434\u043D\u043E \u0431\u043E\u043B\u044C\u0448\u0435.",
    "mistakes.title": "\u041E\u0448\u0438\u0431\u043A\u0438",
    "mistakes.forget": "\u0417\u0430\u0431\u044B\u0442\u044C",
    "mistakes.noSuch": "\u0422\u0430\u043A\u043E\u0439 \u043E\u0448\u0438\u0431\u043A\u0438 \u043D\u0435\u0442.",
    "mistakes.empty": "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E. \u0417\u0434\u0435\u0441\u044C, \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435, \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0442\u0435\u043A\u0441\u0442\u044B, \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u043E\u0439 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E.",
    "mistakes.repeat": "\u0412\u044B \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0435",
    "mistakes.times": { one: "{n} \u0440\u0430\u0437", few: "{n} \u0440\u0430\u0437\u0430", many: "{n} \u0440\u0430\u0437", other: "{n} \u0440\u0430\u0437\u0430" },
    "mistakes.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
    "mistakes.search": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043E\u0448\u0438\u0431\u043A\u0430\u043C",
    "screen.how": "\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "screen.draw": "\u041E\u0431\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0440\u0430\u043C\u043A\u043E\u0439",
    "screen.drawNote": "Windows \u0437\u0430\u0442\u0435\u043C\u043D\u044F\u0435\u0442 \u044D\u043A\u0440\u0430\u043D, \u043F\u043E\u043A\u0430 \u0432\u044B \u043E\u0431\u0432\u043E\u0434\u0438\u0442\u0435",
    "screen.reads": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0435\u0442 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435",
    "screen.readsNote": "\u043E\u043D\u0430 \u0447\u0438\u0442\u0430\u0435\u0442 \u044F\u0437\u044B\u043A\u0438, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0432 Windows; \u0434\u0440\u0443\u0433\u0438\u0435 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0442\u0430\u043C (Windows OCR)",
    "screen.languages": "\u042F\u0437\u044B\u043A\u0438\u2026",
    "screen.fix": "\u0418\u0441\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u043D\u0435\u0432\u0435\u0440\u043D\u043E \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435",
    "screen.fixNote": "\u043F\u043E\u0442\u043E\u043C \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043B\u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0439\u0442\u0435 \u0432\u0441\u043B\u0443\u0445",
    "dictate.notesFolder": "\u041F\u0430\u043F\u043A\u0430 \u0437\u0430\u043C\u0435\u0442\u043E\u043A",
    "dictate.folderShown": "\u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0441\u044F \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "dictate.folderChosen": "\u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438",
    "dictate.inboxPlaceholder": "\u0441\u0430\u043C\u0430 \u043F\u0430\u043F\u043A\u0430",
    "dictate.inboxAria": "\u041F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u0442\u043E\u043A",
    "dictate.folderNone": "\u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u0430; \u0437\u0430\u043C\u0435\u0442\u043A\u0430\u043C \u043D\u0443\u0436\u043D\u0430 \u043F\u0430\u043F\u043A\u0430 (\u043F\u043E\u0434\u043E\u0439\u0434\u0451\u0442 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 Obsidian)",
    "dictate.change": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
    "dictate.choose": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C\u2026",
    "dictate.subfolder": "\u041F\u043E\u0434\u043F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u0442\u043E\u043A",
    "dictate.subfolderNote": "\u043F\u0430\u043F\u043A\u0430 \u0432\u043D\u0443\u0442\u0440\u0438 \u043D\u0435\u0451; \u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0447\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u0430\u043C\u0443 \u043F\u0430\u043F\u043A\u0443",
    "dictate.needsEngine": "\u043D\u0443\u0436\u0435\u043D \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "dictate.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \xB7 {model}",
    "settings.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    "dictate.speechModel": "\u041C\u043E\u0434\u0435\u043B\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u044F",
    "dictate.engine": "\u0414\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "dictate.typeNote": "\u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0430\u043C, \u0433\u0434\u0435 \u043A\u0443\u0440\u0441\u043E\u0440",
    "dictate.englishNote": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435 ({lang}), \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437; \u043F\u0435\u0447\u0430\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u043E-\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438",
    "dictate.noteNote": "\u0432 \u043F\u0430\u043F\u043A\u0443 \u0437\u0430\u043C\u0435\u0442\u043E\u043A",
    "dictate.againKey": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044E\u044E \u0444\u0440\u0430\u0437\u0443",
    "dictate.againNote": "\u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442 \u0435\u0451 \u0442\u0430\u043C, \u0433\u0434\u0435 \u043A\u0443\u0440\u0441\u043E\u0440",
    "dictate.hold": "\u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0442\u044C \u043A\u043B\u0430\u0432\u0438\u0448\u0443, \u0447\u0442\u043E\u0431\u044B \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C",
    "dictate.holdNote": "\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435, \u043F\u043E\u043A\u0430 \u0434\u0435\u0440\u0436\u0438\u0442\u0435, \u043E\u0442\u043F\u0443\u0441\u0442\u0438\u0442\u0435, \u0438 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u0435\u0442\u0441\u044F; \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0435 \u043D\u0430\u0436\u0430\u0442\u0438\u0435, \u043A\u0430\u043A \u0438 \u0440\u0430\u043D\u044C\u0448\u0435, \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0435\u0442",
    "dictate.holdMac": "\u0423\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044E \u043D\u0443\u0436\u0435\u043D \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u203A \u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u203A \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0422\u0438\u0446\u044C. \u0414\u043E \u0442\u0435\u0445 \u043F\u043E\u0440 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0432\u043A\u043B\u044E\u0447\u0430\u044E\u0442 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u044E\u0442 \u043D\u0430\u0436\u0430\u0442\u0438\u0435\u043C.",
    "dictate.panel": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u0440\u0438 \u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0435",
    "dictate.panelNote": "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E: \u0437\u0430\u043F\u0438\u0441\u044C \u0432\u0438\u0434\u043D\u0430 \u043F\u043E \u043A\u0440\u0430\u0441\u043D\u043E\u0439 \u0442\u043E\u0447\u043A\u0435 \u0432 \u0442\u0440\u0435\u0435, \u043E\u0448\u0438\u0431\u043A\u0438 \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u043D\u0430 \u043F\u0430\u0440\u0443 \u0441\u0435\u043A\u0443\u043D\u0434",
    "dictate.escNote": "\u0421\u043B\u043E\u0432\u0430 \u043F\u043E\u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F, \u043F\u043E\u043A\u0430 \u0432\u044B \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435. Esc \u043E\u0442\u043C\u0435\u043D\u044F\u0435\u0442 \u0444\u0440\u0430\u0437\u0443, \u043F\u043E\u043A\u0430 \u0435\u0451 \u043D\u0435 \u043D\u0430\u043F\u0435\u0447\u0430\u0442\u0430\u043B\u0438.",
    "dictate.privacy": "\u0420\u0435\u0447\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435; \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F.",
    "vocab.wordPlaceholder": "\u0421\u043B\u043E\u0432\u043E",
    "vocab.wordAria": "\u0418\u043C\u044F \u0438\u043B\u0438 \u0442\u0435\u0440\u043C\u0438\u043D",
    "vocab.heardPlaceholder": "\u041A\u0430\u043A \u0441\u043B\u044B\u0448\u0438\u0442\u0441\u044F, \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E",
    "vocab.heardAria": "\u041A\u0430\u043A \u043E\u043D\u043E \u0441\u043B\u044B\u0448\u0438\u0442\u0441\u044F",
    "vocab.change": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
    "vocab.remove": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C {word}",
    "vocab.addGroup": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u043B\u043E\u0432\u043E",
    "vocab.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C",
    "vocab.addNote": "\u0418\u043C\u044F \u0438\u043B\u0438 \u0442\u0435\u0440\u043C\u0438\u043D; \u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430 \u0438 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043F\u0438\u0448\u0443\u0442 \u0435\u0433\u043E \u0438\u043C\u0435\u043D\u043D\u043E \u0442\u0430\u043A, \u0430 \u0443\u0441\u043B\u044B\u0448\u0430\u043D\u043D\u0443\u044E \u0444\u043E\u0440\u043C\u0443 \u0437\u0430\u043C\u0435\u043D\u044F\u044E\u0442, \u0433\u0434\u0435 \u0431\u044B \u0435\u0451 \u043D\u0438 \u0441\u043A\u0430\u0437\u0430\u043B\u0438.",
    "vocab.words": "\u0421\u043B\u043E\u0432\u0430",
    "vocab.clearAll": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0451",
    "vocab.empty": "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0438\u043C\u044F \u0438\u043B\u0438 \u0441\u043B\u043E\u0432\u043E \u0432\u044B\u0448\u0435.",
    "vocab.shared": "\u0418\u0445 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434, \u0438 \u0437\u0430\u043F\u0438\u0441\u0438.",
    "dictate.phrases": "\u0424\u0440\u0430\u0437\u044B",
    "dictate.said": "\u0421\u043A\u0430\u0437\u0430\u043D\u043E: {heard}",
    "dictate.recentEmpty": "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E. \u041D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0444\u0440\u0430\u0437\u044B (\u043D\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438) \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C 30 \u0434\u043D\u0435\u0439, \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 200.",
    "dictate.yesterdayAt": "\u0432\u0447\u0435\u0440\u0430 {time}",
    "dictate.copiedText": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E: {text}",
    "dictate.justNow": "\u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E",
    "dictate.minAgo": { one: "{n} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434", few: "{n} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434", many: "{n} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434", other: "{n} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434" },
    "dictate.hAgo": { one: "{n} \u0447 \u043D\u0430\u0437\u0430\u0434", few: "{n} \u0447 \u043D\u0430\u0437\u0430\u0434", many: "{n} \u0447 \u043D\u0430\u0437\u0430\u0434", other: "{n} \u0447 \u043D\u0430\u0437\u0430\u0434" },
    "dictate.yesterday": "\u0432\u0447\u0435\u0440\u0430",
    "transcribe.speakers": "\u041A\u0442\u043E \u043A\u043E\u0433\u0434\u0430 \u0433\u043E\u0432\u043E\u0440\u0438\u043B",
    "transcribe.speakersNote": "\u0441\u043B\u043E\u0432\u0430 \u0443\u0436\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u044B; \u044D\u0442\u043E \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0435\u0442 \u0433\u043E\u043B\u043E\u0441\u0430",
    "transcribe.downloading": "\u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435\u2026",
    "transcribe.notInstalled": "\u043D\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u2248{size}",
    "transcribe.onCard": "\u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435",
    "transcribe.onCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435",
    "transcribe.ready": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "transcribe.keySaved": "\u043A\u043B\u044E\u0447 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D",
    "transcribe.checking": "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\u2026",
    "transcribe.needsKey": "\u043D\u0443\u0436\u0435\u043D \u043A\u043B\u044E\u0447",
    "transcribe.keyFailed": "\u043A\u043B\u044E\u0447 \u043D\u0435 \u043F\u043E\u0434\u043E\u0448\u0451\u043B",
    "transcribe.noAccess": "\u0435\u0449\u0451 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430",
    "transcribe.couldNotCheck": "\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "transcribe.new": "\u041D\u043E\u0432\u0430\u044F \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "transcribe.setup": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430",
    "transcribe.keptIn": "\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0432",
    "kb.inOrder": "\u0412 \u0442\u0430\u043A\u043E\u043C \u043F\u043E\u0440\u044F\u0434\u043A\u0435",
    "kb.earlier": "\u0420\u0430\u043D\u044C\u0448\u0435",
    "kb.later": "\u041F\u043E\u0437\u0436\u0435",
    "kb.leaveOut": "\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
    "kb.addLayout": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.addLayoutNote": "\u043E\u0434\u043D\u0443 \u0438\u0437 \u0438\u043C\u0435\u044E\u0449\u0438\u0445\u0441\u044F \u0432 Windows; \u043E\u043D\u0430 \u0441\u0442\u0430\u043D\u0435\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439",
    "kb.pickLayout": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.ownOrder": "\u0412\u0430\u0448 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A. \u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432\u0441\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u0447\u0442\u043E\u0431\u044B \u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u044F\u0437\u044B\u043A\u0430\u043C, \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u0432\u044B \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435\u0441\u044C.",
    "kb.orderFromLanguages": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0438\u0437 \u044F\u0437\u044B\u043A\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u0432\u044B \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435\u0441\u044C (\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438); \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u0435 \u0438\u043B\u0438 \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0434\u0430\u0442\u044C \u0441\u0432\u043E\u0439.",
    "kb.ownKey": "\u0421\u0432\u043E\u044F \u043A\u043B\u0430\u0432\u0438\u0448\u0430",
    "kb.straight": "\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0441\u0440\u0430\u0437\u0443 \u043D\u0430 \u043D\u0435\u0451",
    "kb.capitals": "\u0417\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0435 \u0431\u0443\u043A\u0432\u044B",
    "kb.twoCaps": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0434\u0432\u0435 \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0435 \u0432 \u043D\u0430\u0447\u0430\u043B\u0435",
    "kb.twoCapsNote": "\u041F\u0420\u0438\u0432\u0435\u0442 \u2192 \u041F\u0440\u0438\u0432\u0435\u0442; ID \u0438 URL \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F",
    "kb.capsLock": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u043B\u043E\u0432\u043E, \u043D\u0430\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u0441 \u0432\u043A\u043B\u044E\u0447\u0451\u043D\u043D\u044B\u043C Caps Lock",
    "kb.capsLockNote": "\u043F\u0420\u0418\u0412\u0415\u0422 \u2192 \u041F\u0440\u0438\u0432\u0435\u0442, \u0438 Caps Lock \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F",
    "kb.keepCaps": "\u041D\u0435 \u0442\u0440\u043E\u0433\u0430\u0442\u044C \u0441\u043B\u043E\u0432\u0430 \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u043C\u0438 \u0431\u0443\u043A\u0432\u0430\u043C\u0438",
    "kb.keepCapsNote": "\u0430\u0431\u0431\u0440\u0435\u0432\u0438\u0430\u0442\u0443\u0440\u044B \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u043C\u0438 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F",
    "kb.when": "\u041A\u043E\u0433\u0434\u0430",
    "kb.onPause": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0442\u0430\u043A\u0436\u0435 \u043F\u043E\u0441\u043B\u0435 \u043F\u0430\u0443\u0437\u044B",
    "kb.onPauseNote": "\u043D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0441\u043B\u043E\u0432\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 \u0441\u0435\u043A\u0443\u043D\u0434\u0443, \u043A\u0430\u043A \u0432\u044B \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043B\u0438 \u043F\u0435\u0447\u0430\u0442\u0430\u0442\u044C",
    "kb.sound": "\u0422\u0438\u0445\u043E \u0449\u0451\u043B\u043A\u0430\u0442\u044C, \u043A\u043E\u0433\u0434\u0430 \u0441\u043B\u043E\u0432\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
    "kb.chime": "\u0417\u0432\u0443\u043A, \u043A\u043E\u0433\u0434\u0430 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.chimeNote": "\u043A\u043E\u0433\u0434\u0430 \u0432\u044B \u0435\u0451 \u043C\u0435\u043D\u044F\u0435\u0442\u0435; \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0430\u044F \u0437\u0432\u0443\u0447\u0438\u0442 \u0432\u044B\u0448\u0435",
    "kb.chimeName": "\u0417\u0432\u0443\u043A",
    "kb.chimePick": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0441\u043B\u0443\u0448\u0430\u0442\u044C: \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0430\u044F, \u043F\u043E\u0442\u043E\u043C \u0434\u0440\u0443\u0433\u0430\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.chime.glass": "\u0421\u0442\u0435\u043A\u043B\u043E",
    "kb.chime.pluck": "\u0429\u0438\u043F\u043E\u043A",
    "kb.chime.string": "\u0421\u0442\u0440\u0443\u043D\u0430",
    "kb.chime.duck": "\u0423\u0442\u043E\u0447\u043A\u0430",
    "kb.shortWords": "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u0441\u043B\u043E\u0432\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C \u0441\u043B\u043E\u0432\u043E\u043C: z rfr \u2192 \u044F \u043A\u0430\u043A. \u041F\u043E\u0441\u043B\u0435 \u0442\u043E\u0433\u043E \u043A\u0430\u043A \u0432\u044B \u0441\u0430\u043C\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443, \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u0441\u043B\u043E\u0432\u043E \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043A\u0430\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u043E.",
    "kb.addProgram": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443",
    "kb.addProgramNote": "\u0418\u043C\u044F \u0435\u0451 .exe. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432 \u043D\u0435\u0439 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435; \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0435\u0451, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435.",
    "kb.addThis": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C {exe}",
    "kb.addThisNote": "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E \u0431\u044B\u043B\u0430 \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u0435\u043C \u043F\u043B\u0430\u043D\u0435",
    "kb.addRunning": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043D\u0443\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443",
    "kb.addRunningNote": "\u0441 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u043C \u0441\u0435\u0439\u0447\u0430\u0441 \u043E\u043A\u043D\u043E\u043C",
    "kb.pickProgram": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443",
    "kb.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    "kb.programsEmpty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \u0432\u044B\u0448\u0435: \u0422\u0438\u0446\u044C \u043E\u0442\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0432 \u043D\u0435\u0439 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u0432\u0430\u043C\u0438 \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u043D\u0430 \u0435\u0451 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u0443\u044E \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443, \u043A\u043E\u0433\u0434\u0430 \u043E\u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u0438\u0439 \u043F\u043B\u0430\u043D.",
    "kb.partFix": "\u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "kb.partSwitch": "\u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F",
    "kb.partBadge": "\u0437\u043D\u0430\u0447\u043E\u043A \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438",
    "kb.partKeys": "\u0432\u0441\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0422\u0438\u0446\u044C",
    "kb.leftOut": "\u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E: {parts}",
    "kb.startsIn": "\u043D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430: {layout}",
    "kb.nothingLeftOut": "\u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
    "kb.noLonger": "\u042D\u0442\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u0443\u0436\u0435 \u043D\u0435\u0442 \u0432 \u0441\u043F\u0438\u0441\u043A\u0435.",
    "kb.hereKryakl": "\u0417\u0434\u0435\u0441\u044C \u0422\u0438\u0446\u044C",
    "kb.fixes": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u043B\u043E\u0432\u0430 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "kb.fixesNote": "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E: \u0441\u043B\u043E\u0432\u0430 \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u043A\u0430\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u044B; \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "kb.switches": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443 \u0441\u0432\u043E\u0438\u043C\u0438 \u043A\u043B\u0430\u0432\u0438\u0448\u0430\u043C\u0438",
    "kb.switchesNote": "\u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0438 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043E\u043A",
    "kb.shows": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443 \u0443 \u043A\u0443\u0440\u0441\u043E\u0440\u0430",
    "kb.hears": "\u0412\u043E\u043E\u0431\u0449\u0435 \u0440\u0435\u0430\u0433\u0438\u0440\u0443\u0435\u0442 \u043D\u0430 \u0441\u0432\u043E\u0438 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "kb.hearsNote": "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E: \u0437\u0434\u0435\u0441\u044C \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0438 \u043E\u0434\u043D\u0430 \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u0422\u0438\u0446\u044C, \u043A\u0440\u043E\u043C\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u043F\u0430\u0443\u0437\u044B",
    "kb.layout": "\u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.startsInTitle": "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.startsInNote": "\u043A\u0430\u0436\u0434\u044B\u0439 \u0440\u0430\u0437, \u043A\u043E\u0433\u0434\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u0438\u0439 \u043F\u043B\u0430\u043D",
    "kb.asItWas": "\u041A\u0430\u043A \u0431\u044B\u043B\u0430",
    "kb.outOfList": "\u0423\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430",
    "kb.outOfListNote": "\u0437\u0434\u0435\u0441\u044C \u0441\u043D\u043E\u0432\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0432\u0441\u0451",
    "kb.remove": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    "kb.learn": "\u0423\u0447\u0438\u0442\u044C\u0441\u044F \u043F\u043E \u043C\u043E\u0435\u043C\u0443 \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.learnNote": "\u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u0432 \u043F\u043E\u043B\u0435 \u043F\u0430\u0440\u043E\u043B\u044F, \u0432 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u0431\u0435\u0437 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u043D\u0430 \u043F\u043E\u043B\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435",
    "kb.fixedAlways": "\u0412\u0441\u0435\u0433\u0434\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F",
    "kb.into": "\u2192 {lang}",
    "kb.fixedAlwaysEmpty": "\u0421\u043B\u043E\u0432\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u044B \u0434\u0432\u0430\u0436\u0434\u044B \u0438\u0441\u043F\u0440\u0430\u0432\u0438\u043B\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E (\u043A\u043B\u0430\u0432\u0438\u0448\u0435\u0439 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u0441\u0442\u0435\u0440\u0435\u0432 \u0438 \u043D\u0430\u0431\u0440\u0430\u0432 \u0432 \u0434\u0440\u0443\u0433\u043E\u0439 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0435), \u0434\u0430\u043B\u044C\u0448\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0441\u0430\u043C\u043E.",
    "kb.myWordNote": "{lang} \xB7 \u043A\u0430\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u043E \u043D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F, \u0430 \u0438\u0437 \u0447\u0443\u0436\u043E\u0439 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432 \u043D\u0435\u0433\u043E",
    "kb.myWordsEmpty": "\u0421\u043B\u043E\u0432\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u043D\u0435\u0442 \u043D\u0438 \u0432 \u043E\u0434\u043D\u043E\u043C \u0441\u043B\u043E\u0432\u0430\u0440\u0435 \u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u044B \u0442\u0440\u0438\u0436\u0434\u044B \u043D\u0430\u0431\u0440\u0430\u043B\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E, \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0432\u0430\u0448\u0438\u043C: \u0422\u0438\u0446\u044C \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0435\u0433\u043E \u043A\u0430\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u043E \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043D\u0430 \u043D\u0435\u0433\u043E, \u043A\u043E\u0433\u0434\u0430 \u0435\u0433\u043E \u043D\u0430\u0431\u0440\u0430\u043B\u0438 \u0432 \u0447\u0443\u0436\u043E\u0439 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0435. \u0414\u043E \u0442\u0435\u0445 \u043F\u043E\u0440 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C\u044B\u0439 \u043E\u0442\u043F\u0435\u0447\u0430\u0442\u043E\u043A \u0441\u043B\u043E\u0432\u0430.",
    "kb.forgetAll": "\u0417\u0430\u0431\u044B\u0442\u044C \u0432\u0441\u0451",
    "kb.forgetAllNote": "\u0432\u044B\u0443\u0447\u0435\u043D\u043D\u043E\u0435 \u0422\u0438\u0446\u044C \u0438\u0441\u0447\u0435\u0437\u043D\u0435\u0442; \xAB\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\xBB \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F",
    "kb.forgetBtn": "\u0417\u0430\u0431\u044B\u0442\u044C",
    "kb.keptPlaceholder": "\u0441\u043B\u043E\u0432\u043E, \u043A\u0430\u043A \u0432\u044B \u0435\u0433\u043E \u043D\u0430\u0431\u0438\u0440\u0430\u0435\u0442\u0435",
    "kb.keptAddNote": "\u041A\u043B\u0430\u0432\u0438\u0448\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0442\u043E\u0436\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u043B\u043E\u0432\u043E.",
    "kb.keptEmpty": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0441\u043B\u043E\u0432\u043E \u0432\u044B\u0448\u0435 \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0443 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u043D\u0435\u0436\u0435\u043B\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F.",
    "kb.alsoUsing": "\u041A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0443 \u0442\u0430\u043A\u0436\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442: {apps}.",
    "kb.oneOfThem": "\u041E\u0434\u043D\u0430 \u0438\u0437 \u043D\u0438\u0445 \u0441\u0430\u043C\u0430 \u043D\u0430\u0436\u0438\u043C\u0430\u0435\u0442 \u043A\u043B\u0430\u0432\u0438\u0448\u0438; \u0422\u0438\u0446\u044C \u0438\u0445 \u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0435\u0442.",
    "kb.aProgram": "\u041A\u0430\u043A\u0430\u044F-\u0442\u043E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0441\u0430\u043C\u0430 \u043D\u0430\u0436\u0438\u043C\u0430\u0435\u0442 \u043A\u043B\u0430\u0432\u0438\u0448\u0438; \u0422\u0438\u0446\u044C \u0438\u0445 \u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0435\u0442.",
    "kb.switchKey": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.switchTap": "\u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u044D\u0442\u0443 \u043A\u043B\u0430\u0432\u0438\u0448\u0443, \u0431\u0435\u0437 \u0434\u0440\u0443\u0433\u0438\u0445",
    "kb.switchNote": "\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u0438\u0437 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043E\u043A, \u043F\u0435\u0440\u0435\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0445 \u043D\u0438\u0436\u0435",
    "kb.switchingByKeys": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0430\u043C\u0438",
    "kb.fixKey": "\u0418\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u043B\u043E\u0432\u0430",
    "kb.fixKeyNote": "\u043F\u0435\u0440\u0435\u043F\u0435\u0447\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043D\u0430\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u043D\u0435 \u0432 \u0442\u043E\u0439 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0435; \u0435\u0449\u0451 \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u2014 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.theFixKey": "\u041A\u043B\u0430\u0432\u0438\u0448\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F",
    "kb.autoFix": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u043B\u043E\u0432\u0430 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "kb.autoFixNote": "{typed} \u2192 {fixed} \u043F\u043E \u043F\u0440\u043E\u0431\u0435\u043B\u0443; \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u043E\u0442\u043C\u0435\u043D\u044F\u0435\u0442",
    "kb.fixing": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043D\u0430\u0431\u043E\u0440\u0435",
    "kb.fixingNote": "\u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0435 \u0431\u0443\u043A\u0432\u044B, \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u0441\u043B\u043E\u0432\u0430, \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435 \u043F\u0430\u0443\u0437\u044B",
    "kb.badgeNote": "\u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u043D\u0430\u0447\u043E\u043A \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430 \u0438\u043B\u0438 Caps Lock",
    "kb.trayNote": "\u0437\u043D\u0430\u0447\u043E\u043A \u0432 \u0442\u0440\u0435\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 en \u0438\u043B\u0438 ru",
    "kb.fullScreen": "\u041E\u0442\u043A\u043B\u044E\u0447\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u043F\u043E\u043B\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435",
    "kb.fullScreenNote": "\u0438\u0433\u0440\u044B, \u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u0438, \u0432\u0438\u0434\u0435\u043E",
    "kb.layoutsOwn": "\u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u044B\u043C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F; \u0441\u043E \u0441\u0432\u043E\u0435\u0439 \u043A\u043B\u0430\u0432\u0438\u0448\u0435\u0439: {n}",
    "kb.layoutsNote": "\u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u044B\u043C \u043F\u043E \u043E\u0447\u0435\u0440\u0435\u0434\u0438 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F",
    "kb.rivals": { one: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u0430 {names}: \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u043D\u0435\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u0438\u043D\u0430\u0447\u0435 \u0441\u043B\u043E\u0432\u0430 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u0434\u0432\u0430\u0436\u0434\u044B.", few: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u044B {names}: \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u0438\u043D\u0430\u0447\u0435 \u0441\u043B\u043E\u0432\u0430 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u0434\u0432\u0430\u0436\u0434\u044B.", many: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u044B {names}: \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u0438\u043D\u0430\u0447\u0435 \u0441\u043B\u043E\u0432\u0430 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u0434\u0432\u0430\u0436\u0434\u044B.", other: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u044B {names}: \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438, \u0438\u043D\u0430\u0447\u0435 \u0441\u043B\u043E\u0432\u0430 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u0434\u0432\u0430\u0436\u0434\u044B." },
    "kb.elevated": "{app} \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0442 \u0438\u043C\u0435\u043D\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430: Windows \u043D\u0435 \u0434\u0430\u0451\u0442 \u0422\u0438\u0446\u044C \u0435\u0451 \u043A\u043B\u0430\u0432\u0438\u0448, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0442\u0430\u043C \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0438 \u043D\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F.",
    "kb.trouble": "\u041F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u043A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u044B: {trouble}",
    "kb.macAccess": "\u0427\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443, \u0422\u0438\u0446\u044C \u043D\u0443\u0436\u0435\u043D \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u203A \u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u203A \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0422\u0438\u0446\u044C.",
    "kb.macAccessOpen": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u043E\u0441\u0442\u0443\u043F\u0430",
    "kb.macInput": "\u0422\u0438\u0446\u044C \u0432\u0438\u0434\u0438\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u043B\u0430\u0432\u0438\u0448\u0438-\u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440\u044B: \u0435\u043C\u0443 \u043D\u0443\u0436\u0435\u043D \u0435\u0449\u0451 \u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u0432\u0432\u043E\u0434\u0430. \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u203A \u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u203A \u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u0432\u0432\u043E\u0434\u0430, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0422\u0438\u0446\u044C (\u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0447\u0435\u0440\u0435\u0437 +), \u0437\u0430\u0442\u0435\u043C \u0437\u0430\u043A\u0440\u043E\u0439\u0442\u0435 \u0438 \u0441\u043D\u043E\u0432\u0430 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0422\u0438\u0446\u044C.",
    "kb.macInputOpen": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430 \u0432\u0432\u043E\u0434\u0430",
    "kb.windowsOnly": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438 \u043F\u043E\u043A\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432 Windows.",
    "kb.privacy": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0435\u0442 \u043D\u0430\u0436\u0430\u0442\u0438\u044F \u043A\u043B\u0430\u0432\u0438\u0448 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438 \u0438 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442. \u041E\u043D \u0445\u0440\u0430\u043D\u0438\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u0441\u043B\u043E\u0432\u0430, \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "words.noSuch": "\u0422\u0430\u043A\u043E\u0433\u043E \u0441\u043B\u043E\u0432\u0430 \u043D\u0435\u0442.",
    "words.empty": "\u0421\u043B\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u0441\u043B\u043E\u0432\u043E \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u0435\u0433\u043E \u0437\u0432\u0451\u0437\u0434\u043E\u0447\u043A\u0443.",
    "words.search": "\u041F\u043E\u0438\u0441\u043A \u0441\u043B\u043E\u0432 \u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0439",
    "words.hint": "\u0417\u0432\u0451\u0437\u0434\u043E\u0447\u043A\u0430 \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u0441\u043B\u043E\u0432\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0435\u0433\u043E \u0441\u044E\u0434\u0430",
    "words.export": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0434\u043B\u044F Anki\u2026",
    "settings.natural": "\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0433\u043E\u043B\u043E\u0441",
    "settings.naturalNote": "{size} \u041C\u0411 \u0441\u043A\u0430\u0447\u0430\u0442\u044C, \u0434\u0430\u043B\u044C\u0448\u0435 \u0447\u0438\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D (Kokoro)",
    "settings.downloadFailed": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C.",
    "settings.naturalDownloading": "\u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \xB7 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 {pct}%",
    "settings.autoNatural": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \xB7 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439",
    "settings.autoWindows": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \xB7 Windows",
    "storage.fast": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0434",
    "storage.fastNote": "\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u044D\u0442\u043E\u0442 \u044F\u0437\u044B\u043A \u0432 \u043E\u0431\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B (Firefox Translations)",
    "storage.dict": "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432",
    "storage.dictNote": "\u0447\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0441\u043B\u043E\u0432\u0430 (Wiktionary)",
    "storage.voiceNote": "\u0447\u0438\u0442\u0430\u0435\u0442 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0432\u0441\u043B\u0443\u0445 (Kokoro)",
    "storage.llmNote": "\u044F\u0437\u044B\u043A\u043E\u0432\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u0432\u0430\u0448 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 ({model})",
    "storage.unused": "\u041C\u043E\u0434\u0435\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F",
    "storage.unusedNote": "\u043C\u043E\u0434\u0435\u043B\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u0441\u0442\u0430\u0440\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0438 \u0422\u0438\u0446\u044C (TranslateGemma)",
    "storage.llama": "\u0417\u0430\u043F\u0443\u0441\u043A \u044F\u0437\u044B\u043A\u043E\u0432\u044B\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439",
    "storage.llamaNote": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \xAB{a}\xBB \u0438 \xAB{b}\xBB \u043D\u0430 \u043B\u044E\u0431\u043E\u0439 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435 \u0438\u043B\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435 (llama.cpp)",
    "storage.speechModelNote": "\u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0441\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0435",
    "storage.speech": "\u0420\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u0435 \u0440\u0435\u0447\u0438",
    "storage.speechNote": "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u0438 \u0440\u0435\u0447\u0438 (Python, faster-whisper)",
    "storage.gpu": "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u044B",
    "storage.gpuNote": "\u0440\u0435\u0447\u044C \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0435 NVIDIA, \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u0431\u044B\u0441\u0442\u0440\u0435\u0435 (CUDA)",
    "storage.speakersNote": "\u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0435\u0442 \u0433\u043E\u043B\u043E\u0441\u0430 \u0432 \u0437\u0430\u043F\u0438\u0441\u0438 (PyTorch, pyannote)",
    "storage.yours": "\u0412\u0430\u0448\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0441\u043F\u0438\u0441\u043A\u0438",
    "storage.yoursNote": "\u0441\u043B\u043E\u0432\u0430, \u043E\u0448\u0438\u0431\u043A\u0438, \u0432\u044B\u0443\u0447\u0435\u043D\u043D\u043E\u0435 \u0422\u0438\u0446\u044C, \u0436\u0443\u0440\u043D\u0430\u043B\u044B",
    "storage.transcriptsNote": "\u0432\u0430\u0448\u0438: \u0442\u0435\u043A\u0441\u0442 \u0438 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0430\u044F \u043A\u043E\u043F\u0438\u044F \u0437\u0432\u0443\u043A\u0430",
    "storage.speechToText": "{about} \xB7 \u0440\u0435\u0447\u044C \u0432 \u0442\u0435\u043A\u0441\u0442",
    "storage.cudaNote": "\u0441\u0431\u043E\u0440\u043A\u0430 \u0434\u043B\u044F NVIDIA, \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043D\u0435 \u043F\u043E\u043C\u0435\u0449\u0430\u0435\u0442\u0441\u044F \u0432 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 (llama.cpp CUDA)",
    "storage.lossTranslate": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u043A \xAB\u0411\u044B\u0441\u0442\u0440\u043E\u043C\u0443\xBB, \u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0441\u043A\u0430\u0447\u0430\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043D\u043E\u0432\u0430 \u043F\u0440\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435",
    "storage.lossCheck": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u0433\u043E \u0441\u043A\u0430\u0447\u0430\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043D\u043E\u0432\u0430 \u043F\u0440\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435",
    "storage.lossSpeech": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u044F\u0442\u0441\u044F, \u043F\u043E\u043A\u0430 \u0435\u0433\u043E \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u044E\u0442 \u0441\u043D\u043E\u0432\u0430; \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0438 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F",
    "storage.lossGpu": "\u0440\u0435\u0447\u044C \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440, \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435",
    "storage.lossSpeakers": "\u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043D\u0443\u0442 \u0440\u0430\u0437\u043B\u0438\u0447\u0430\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u0430, \u043F\u043E\u043A\u0430 \u0435\u0433\u043E \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u044F\u0442 \u0441\u043D\u043E\u0432\u0430",
    "storage.lossDefault": "\u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430 \u043F\u0440\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438",
    "storage.notUsed": "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F",
    "storage.removeAsk": "{loss}. \u0423\u0434\u0430\u043B\u0438\u0442\u044C?",
    "storage.keep": "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
    "storage.usedBy": "\u043D\u0443\u0436\u043D\u043E \u0434\u043B\u044F: {users}",
    "storage.reserve": "\u0437\u0430\u043F\u0430\u0441 \u0434\u043B\u044F: {reserve}, \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u0435, \u0435\u0441\u043B\u0438 \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u043E\u0434\u0432\u0435\u0434\u0451\u0442",
    "storage.userTranslate": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "storage.userListen": "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    "storage.userCheck": "\u0410\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "storage.userDictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434",
    "storage.userTranscribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
    "storage.frees": "\u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442 {free}: {shared} \u0435\u0433\u043E \u0444\u0430\u0439\u043B\u043E\u0432 \u043E\u0431\u0449\u0438\u0435 \u0441 \u0434\u0440\u0443\u0433\u0438\u043C\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430\u043C\u0438 Python \u0437\u0434\u0435\u0441\u044C",
    "storage.removeAskTitle": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C\u2026",
    "storage.removeTitle": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C; \u0441\u043A\u0430\u0447\u0430\u0435\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430, \u0435\u0441\u043B\u0438 \u043F\u043E\u0437\u0436\u0435 \u0432\u044B\u0431\u0435\u0440\u0435\u0442\u0435",
    "storage.measuring": "\u0418\u0437\u043C\u0435\u0440\u044F\u044E, \u0447\u0442\u043E \u0445\u0440\u0430\u043D\u0438\u0442 \u0422\u0438\u0446\u044C\u2026",
    "storage.downloads": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0438",
    "storage.everything": "\u0412\u0441\u0451, \u0447\u0442\u043E \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0422\u0438\u0446\u044C: {size}",
    "storage.inFolderAway": "\u0432 \u043F\u0430\u043F\u043A\u0435 \u0422\u0438\u0446\u044C, \u043A\u0440\u043E\u043C\u0435 \u0447\u0430\u0441\u0442\u0435\u0439, \u0443 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0443\u043A\u0430\u0437\u0430\u043D\u043E, \u0433\u0434\u0435 \u043E\u043D\u0438 \xB7 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E {free} \u043D\u0430 {drive}",
    "storage.inFolder": "\u0432 \u043E\u0434\u043D\u043E\u0439 \u043F\u0430\u043F\u043A\u0435 \xB7 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E {free} \u043D\u0430 {drive}",
    "storage.openFolder": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043F\u043A\u0443",
    "storage.models": "\u041C\u043E\u0434\u0435\u043B\u0438 \u0438 \u0433\u043E\u043B\u043E\u0441\u0430",
    "storage.nothing": "\u0415\u0449\u0451 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u043E: \u043A\u0430\u0436\u0434\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B \u0432\u043F\u0435\u0440\u0432\u044B\u0435 \u0435\u0439 \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435\u0441\u044C.",
    "storage.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0438\u0445 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u044E\u0442",
    "storage.yoursGroup": "\u0412\u0430\u0448\u0435",
    "storage.inOld": "{size} \u0432\u0441\u0451 \u0435\u0449\u0451 \u0432 \u0441\u0442\u0430\u0440\u043E\u0439 \u043F\u0430\u043F\u043A\u0435 Krya \u0438\u043B\u0438 Altype",
    "storage.outside": "{size} \u0432\u0441\u0451 \u0435\u0449\u0451 \u0432\u043D\u0435 \u043F\u0430\u043F\u043A\u0438 \u0422\u0438\u0446\u044C",
    "storage.usesThere": "{names}: \u0422\u0438\u0446\u044C \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0438\u0445 \u043E\u0442\u0442\u0443\u0434\u0430. \u041F\u0435\u0440\u0435\u043D\u043E\u0441 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438 \u0438 \u043C\u043E\u0434\u0435\u043B\u044C, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442 \u0422\u0438\u0446\u044C",
    "storage.notMoved": "\u041D\u0435 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u043E: {why}",
    "storage.moving": "\u041F\u0435\u0440\u0435\u043D\u043E\u0448\u0443\u2026",
    "storage.move": "\u041F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u0432 \u043F\u0430\u043F\u043A\u0443 \u0422\u0438\u0446\u044C",
    "settings.languages": "\u042F\u0437\u044B\u043A\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u043C\u0438 \u0432\u044B \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435\u0441\u044C",
    "settings.languagesNote": "\u043A\u043E\u0433\u0434\u0430 \u0422\u0438\u0446\u044C \u0441\u043B\u044B\u0448\u0438\u0442 \u0438\u043B\u0438 \u0447\u0438\u0442\u0430\u0435\u0442 \u0442\u0435\u043A\u0441\u0442, \u043E\u043D \u0443\u0433\u0430\u0434\u044B\u0432\u0430\u0435\u0442 \u0441\u0440\u0435\u0434\u0438 \u043D\u0438\u0445",
    "settings.addLanguage": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044F\u0437\u044B\u043A",
    "settings.addLanguageNote": "\u0434\u0438\u043A\u0442\u043E\u0432\u043A\u0430 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0439; \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0438 \u0442\u0435\u043A\u0441\u0442 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430 \u0443\u0433\u0430\u0434\u044B\u0432\u0430\u044E\u0442 \u0441\u0440\u0435\u0434\u0438 \u043D\u0438\u0445",
    "settings.pickLanguage": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A",
    "settings.languagesGroup": "\u042F\u0437\u044B\u043A\u0438",
    "settings.yourLangNote": "\u0432\u0430\u0448 \u044F\u0437\u044B\u043A \xB7 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445",
    "settings.englishNote": "\u0432\u0441\u0435\u0433\u0434\u0430: \u044F\u0437\u044B\u043A, \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u0443\u0447\u0438\u0442 \u0422\u0438\u0446\u044C",
    "settings.speed": "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C",
    "settings.speedNote": "\u043A\u0430\u043A \u0431\u044B\u0441\u0442\u0440\u043E \u0447\u0438\u0442\u0430\u0435\u0442",
    "settings.yourLanguage": "\u0412\u0430\u0448 \u044F\u0437\u044B\u043A",
    "settings.yourLanguageNote": "\u0422\u0438\u0446\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442 \u043D\u0430 \u044D\u0442\u043E\u0442 \u044F\u0437\u044B\u043A \u0438 \u043D\u0430 \u043D\u0451\u043C \u0436\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432",
    "settings.theme": "\u0422\u0435\u043C\u0430",
    "settings.themeSystem": "\u041A\u0430\u043A \u0432 Windows",
    "settings.themeLight": "\u0421\u0432\u0435\u0442\u043B\u0430\u044F",
    "settings.themeDark": "\u0422\u0451\u043C\u043D\u0430\u044F",
    "settings.startWithWindows": "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 Windows",
    "settings.pause": "\u041F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0422\u0438\u0446\u044C",
    "settings.pauseNote": "\u0432\u0441\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F \u043A\u043B\u0430\u0432\u0438\u0448 \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F, \u043F\u043E\u043A\u0430 \u0432\u044B \u0441\u043D\u043E\u0432\u0430 \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435; \u0442\u0430\u043A\u0436\u0435 \u0432 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044F",
    "settings.pauseKey": "\u041F\u0430\u0443\u0437\u0430",
    "settings.pauseKeyNote": "\u0422\u0438\u0446\u044C \u043C\u043E\u043B\u0447\u0438\u0442, \u043F\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0436\u043C\u0451\u0442\u0435 \u0441\u043D\u043E\u0432\u0430",
    "settings.windowKey": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043E\u043A\u043D\u043E \u0422\u0438\u0446\u044C",
    "settings.windowKeyNote": "\u0438\u0437 \u043B\u044E\u0431\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    "settings.resetKeys": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "settings.resetKeysNote": "\u0432\u0441\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0432\u0435\u0440\u043D\u0443\u0442\u0441\u044F \u043A \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u043C",
    "settings.version": "\u0412\u0435\u0440\u0441\u0438\u044F {version}",
    "settings.versionDev": "\u0412\u0435\u0440\u0441\u0438\u044F {version} dev",
    "settings.built": "\u0441\u043E\u0431\u0440\u0430\u043D\u043E {build}",
    "settings.versionNote": "\u043D\u043E\u0432\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438: \u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0449\u0438\u043A \u0441 GitHub \u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0435\u0433\u043E; \u0432\u0430\u0448\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F",
    "settings.betaNote": "\u0431\u0435\u0442\u0430: \u0447\u0442\u043E-\u0442\u043E \u0435\u0449\u0451 \u043C\u043E\u0436\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043D\u0435 \u0442\u0430\u043A; \xAB\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0435\xBB \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u044D\u0442\u043E \u0438\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "settings.newVersions": "\u041D\u043E\u0432\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438",
    "settings.backup": "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F \u043A\u043E\u043F\u0438\u044F",
    "settings.backupTitle": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043A\u043E\u043F\u0438\u044E \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u0439 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440",
    "settings.backupNote": "\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438, \u0441\u043B\u043E\u0432\u0430, \u043E\u0448\u0438\u0431\u043A\u0438, \u0442\u043E, \u0447\u0435\u043C\u0443 \u0422\u0438\u0446\u044C \u043D\u0430\u0443\u0447\u0438\u043B\u0441\u044F \u043F\u043E \u0432\u0430\u0448\u0435\u043C\u0443 \u043D\u0430\u0431\u043E\u0440\u0443, \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u0438 \u0444\u0440\u0430\u0437\u044B \u2014 \u0432 \u043E\u0434\u043D\u043E\u043C \u0444\u0430\u0439\u043B\u0435; \u043C\u043E\u0434\u0435\u043B\u0438 \u0441\u043A\u0430\u0447\u0430\u044E\u0442\u0441\u044F \u0441\u043D\u043E\u0432\u0430",
    "settings.export": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442",
    "settings.importNote": "\u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u0432\u0430\u0448\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u043C\u0438 \u0438\u0437 \u043A\u043E\u043F\u0438\u0438 \u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0435\u0451 \u0441\u043B\u043E\u0432\u0430 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u043A \u0432\u0430\u0448\u0438\u043C; \u043D\u0438\u0447\u0435\u0433\u043E \u0432\u0430\u0448\u0435\u0433\u043E \u043D\u0435 \u0443\u0434\u0430\u043B\u044F\u0435\u0442\u0441\u044F.",
    "settings.resetAll": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "settings.resetAllNote": "\u043A\u043B\u0430\u0432\u0438\u0448\u0438, \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u0438 \u0438 \u0441\u043F\u0438\u0441\u043A\u0438 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u043A \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u043C; \u0432\u0430\u0448\u0438 \u0441\u043B\u043E\u0432\u0430 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F",
    "about.online": "\u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u0432 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F",
    "about.onlineList": "\u043E\u0434\u043D\u043E\u043A\u0440\u0430\u0442\u043D\u043E\u0433\u043E \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u043A\u0430\u0436\u0434\u043E\u0439 \u0447\u0430\u0441\u0442\u0438: \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0447\u0438\u043A\u0430 \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u044F\u0437\u044B\u043A\u0430, \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0430 ({size} \u041C\u0411), \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u0441\u043B\u043E\u0432",
    "about.newVersions": "\u041D\u043E\u0432\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438",
    "about.source": "\u041A\u043E\u0434 \u043D\u0430 GitHub",
    "about.licenses": "\u041B\u0438\u0446\u0435\u043D\u0437\u0438\u0438",
    "about.story": "\u041D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 Kryakl",
    "about.storyText": "\u0422\u0438\u0446\u044C \u0441\u0434\u0435\u043B\u0430\u043D \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 Kryakl \u0415\u0432\u0433\u0435\u043D\u0438\u044F \u041F\u0435\u0448\u0438\u043D\u0441\u043A\u043E\u0433\u043E, \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u0433\u043E \u043A\u043E\u0434\u0430 \u043F\u043E\u0434 \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0435\u0439 MIT; \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u044B \u0432\u0435\u0440\u0441\u0438\u044F \u0434\u043B\u044F Mac \u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0432\u043E\u043D\u043A\u043E\u0432.",
    "about.authorGroup": "\u0410\u0432\u0442\u043E\u0440",
    "about.role": "Telegram @designmakc",
    "about.bio": "\u0422\u0438\u0446\u044C \u2014 \u043C\u043E\u0439 \u0444\u043E\u0440\u043A Kryakl.",
    "about.mail": "\u041F\u043E\u0447\u0442\u0430",
    "about.write": "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C",
    "about.versionTitle": "\u0412\u0435\u0440\u0441\u0438\u044F",
    "about.license": "\u041B\u0438\u0446\u0435\u043D\u0437\u0438\u044F",
    "about.licenseValue": "\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E, \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u043E\u0434 (MIT)",
    "about.offline": "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D",
    "about.offlineNote": "\u0432\u0430\u0448 \u0442\u0435\u043A\u0441\u0442 \u043D\u0435 \u043F\u043E\u043A\u0438\u0434\u0430\u0435\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440",
    "about.bug": "\u041D\u0430\u0448\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0443?",
    "about.bugNote": "\u044D\u0442\u043E \u0431\u0435\u0442\u0430, \u0447\u0442\u043E-\u0442\u043E \u043C\u043E\u0436\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043D\u0435 \u0442\u0430\u043A",
    "about.report": "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C",
    "about.thanks": "\u0421\u043F\u0430\u0441\u0438\u0431\u043E",
    "report.placeholder": "\u0427\u0442\u043E \u0432\u044B \u0434\u0435\u043B\u0430\u043B\u0438, \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u043E \u0438 \u0447\u0435\u0433\u043E \u0432\u044B \u043E\u0436\u0438\u0434\u0430\u043B\u0438? \u0411\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u043F\u043E\u043C\u043E\u0433\u0430\u044E\u0442 \u0448\u0430\u0433\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u044F\u0442 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443.",
    "report.what": "\u0427\u0442\u043E \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u043E",
    "report.anyLanguage": "\u041D\u0430 \u043B\u044E\u0431\u043E\u043C \u044F\u0437\u044B\u043A\u0435; \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0442\u0430\u043A, \u043A\u0430\u043A \u0432\u044B \u043D\u0430\u043F\u0438\u0441\u0430\u043B\u0438.",
    "report.send": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "report.email": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E\u043C",
    "report.emailNote": "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0432\u0430\u0448\u0443 \u043F\u043E\u0447\u0442\u0443 \u0441 \u043F\u0438\u0441\u044C\u043C\u043E\u043C \u043D\u0430 {email} \u0438 \u0432\u0430\u0448\u0438\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C; \u043F\u0440\u0438\u043B\u043E\u0436\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u043E\u0442\u0447\u0451\u0442\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442 \u0422\u0438\u0446\u044C",
    "report.emailBtn": "\u041F\u0438\u0441\u044C\u043C\u043E",
    "report.issue": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C issue \u043D\u0430 GitHub",
    "report.issueNote": "\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u043D\u0430\u0439\u0434\u0443\u0442 \u0434\u0440\u0443\u0433\u0438\u0435 \u0441 \u0442\u0430\u043A\u043E\u0439 \u0436\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u043E\u0439; \u043D\u0443\u0436\u043D\u0430 \u0443\u0447\u0451\u0442\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C GitHub",
    "report.issueBtn": "Issue \u043D\u0430 GitHub",
    "report.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E {file} \u0432 \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u203A Tyts \u203A Reports: \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0435\u0433\u043E \u0432 \u043F\u0438\u0441\u044C\u043C\u043E. ",
    "report.showInFolder": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432 \u043F\u0430\u043F\u043A\u0435",
    "report.failed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u0442\u0447\u0451\u0442: {error}",
    "report.holds": "\u0427\u0442\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0444\u0430\u0439\u043B \u043E\u0442\u0447\u0451\u0442\u0430",
    "report.log": "\u0416\u0443\u0440\u043D\u0430\u043B \u0422\u0438\u0446\u044C",
    "report.logNote": "\u0427\u0442\u043E \u0422\u0438\u0446\u044C \u0434\u0435\u043B\u0430\u043B \u0432 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0432\u0440\u0435\u043C\u044F: \u043A\u043B\u0430\u0432\u0438\u0448\u0438, \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u043E\u043A\u043D\u0430, \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438, \u043E\u0448\u0438\u0431\u043A\u0438",
    "report.otherLogs": "\u0416\u0443\u0440\u043D\u0430\u043B\u044B \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0435\u0447\u0438 \u0438 \u043C\u043E\u0434\u0435\u043B\u0438 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "report.otherLogsNote": "\u0414\u0438\u043A\u0442\u043E\u0432\u043A\u0430, \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438, \u0437\u0430\u043F\u0443\u0441\u043A, \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0438 \u0441\u0431\u043E\u0438 \u043C\u043E\u0434\u0435\u043B\u0438",
    "report.computer": "\u042D\u0442\u043E\u0442 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440 \u0438 \u0422\u0438\u0446\u044C",
    "report.computerNote": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440, \u043F\u0430\u043C\u044F\u0442\u044C, \u0432\u0438\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430, \u0432\u0435\u0440\u0441\u0438\u0438 Windows \u0438 \u0422\u0438\u0446\u044C",
    "report.settings": "\u0412\u0430\u0448\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "report.settingsNote": "\u0412\u0430\u0448\u0438 \u0441\u043F\u0438\u0441\u043A\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u043D\u044B: \u0441\u043B\u043E\u0432\u0430 \xAB\u041D\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C\xBB, \u0438\u043C\u0435\u043D\u0430 \u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u044B, \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B",
    "report.never": "\u041D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442: \u0432\u0430\u0448\u0438 \u0442\u0435\u043A\u0441\u0442\u044B, \u0441\u043B\u043E\u0432\u0430, \u043E\u0448\u0438\u0431\u043A\u0438, \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B, \u0444\u0440\u0430\u0437\u044B, \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0438\u043B\u0438 \u043A\u043B\u044E\u0447 Hugging Face. \u0412\u0430\u0448\u0435 \u0438\u043C\u044F \u0432 Windows \u0438 \u0438\u043C\u044F \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430 \u0437\u0430\u043C\u0435\u043D\u0435\u043D\u044B. \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F, \u043F\u043E\u043A\u0430 \u0432\u044B \u0441\u0430\u043C\u0438 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435.",
    "report.folder": "\u041F\u0430\u043F\u043A\u0430 \u0422\u0438\u0446\u044C",
    "report.folderNote": "\u0413\u0434\u0435 \u043B\u0435\u0436\u0430\u0442 \u0436\u0443\u0440\u043D\u0430\u043B\u044B, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0438\u0445 \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E",
    "report.stopped": "\u0415\u0441\u043B\u0438 \u0447\u0442\u043E-\u0442\u043E \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043B\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C",
    "report.restart": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u0447\u0438",
    "report.restartNote": "\u0412 \u043D\u0451\u043C \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0439 \u0432\u0432\u043E\u0434 \u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \xB7 {state}",
    "report.stateOff": "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D",
    "report.stateStarting": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F\u2026",
    "report.stateRunning": "\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "report.stateBusy": "\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \xB7 \u0441\u0435\u0439\u0447\u0430\u0441 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442",
    "report.stateDown": "\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D",
    "report.restartBtn": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C",
    // The action pages
    "act.translate": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438",
    "act.translateNote": "Enter \u0432\u0441\u0442\u0430\u0432\u0438\u0442 \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u0432\u043C\u0435\u0441\u0442\u043E \u0442\u0435\u043A\u0441\u0442\u0430",
    "act.listen": "\u041F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u0438 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
    "act.listenNote": "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0437\u0432\u0443\u0447\u0438\u0442, \u043F\u0435\u0440\u0435\u0432\u043E\u0434 \u043F\u043E\u0434 \u043D\u0438\u043C",
    "act.inPlace": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C",
    "act.inPlaceNote": "\u0431\u0435\u0437 \u043E\u043A\u043D\u0430, \u043F\u0440\u044F\u043C\u043E \u0432 \u0442\u0435\u043A\u0441\u0442\u0435",
    "act.selected": "\u0412\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442",
    "act.screen": "\u0422\u0435\u043A\u0441\u0442 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "act.screenNote": "\u043E\u0431\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0440\u0430\u043C\u043A\u043E\u0439",
    "act.own": "\u0421\u0432\u043E\u0439 \u0442\u0435\u043A\u0441\u0442",
    "act.ownKey": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "act.quality": "\u041A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430",
    "act.cardNote": "\u0447\u0442\u0435\u043D\u0438\u0435, \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u043E\u0432, \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "act.screenHowNote": "\u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435 \u043D\u0430 \u044F\u0437\u044B\u043A\u0430\u0445, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0435\u0441\u0442\u044C \u0432 Windows",
    "act.try": "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C",
    "act.talkGroup": "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u0441 \u0422\u0438\u0446\u044C",
    "act.talk": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
    "act.talkNote": "\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435 \u043F\u043E-\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438, \u043E\u043D \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0432\u0441\u043B\u0443\u0445",
    "act.empty": "\u043D\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u043E",
    "act.talkWindow": "\u041E\u043A\u043D\u043E \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430",
    "act.talkWindowNote": "\u0447\u0442\u0435\u043D\u0438\u0435 \u0432\u0441\u043B\u0443\u0445, \u043F\u043E\u0432\u0435\u0440\u0445 \u043E\u043A\u043E\u043D, \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F",
    "act.checkNote": "\u043E\u0448\u0438\u0431\u043A\u0438 \u0437\u0430\u0447\u0451\u0440\u043A\u043D\u0443\u0442\u044B, \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u044F\u0434\u043E\u043C; Enter \u0432\u0441\u0442\u0430\u0432\u0438\u0442 \u0435\u0433\u043E",
    "act.say": "\u0421\u043A\u0430\u0437\u0430\u0442\u044C \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "act.sayNote": "\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435 \u043F\u043E-\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438, \u043E\u0448\u0438\u0431\u043A\u0438 \u043E\u0442\u043C\u0435\u0442\u044F\u0442\u0441\u044F",
    "act.fixGroup": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    "act.switchGroup": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435",
    "act.general": "\u041E\u0431\u0449\u0435\u0435",
    "act.notChosen": "\u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u0430",
    "act.newWords": "\u041D\u043E\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430",
    "ui.forget": "\u0417\u0430\u0431\u044B\u0442\u044C",
    "call.title": "\u0421\u043E\u0437\u0432\u043E\u043D {when}",
    "call.record": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0441\u043E\u0437\u0432\u043E\u043D",
    "call.stop": "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "call.recordNote": "\u0412\u0430\u0448 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u0438 \u0432\u0435\u0441\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430, \u043F\u043E\u043A\u0430 \u043D\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435; \u043F\u043E\u0442\u043E\u043C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u044B\u0432\u0430\u0435\u0442\u0441\u044F",
    "call.keyNote": "\u041D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u0438 \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "call.panel": "\u0421\u043E\u0437\u0432\u043E\u043D",
    "call.allSound": "\u0412\u0435\u0441\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "call.pause": "\u041F\u0430\u0443\u0437\u0430",
    "call.resume": "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C",
    "call.stopShort": "\u0421\u0442\u043E\u043F",
    "call.paused": "\u041F\u0430\u0443\u0437\u0430",
    "call.hide": "\u0421\u043A\u0440\u044B\u0442\u044C: \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442\u0441\u044F",
    "call.shot": "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A \u044D\u043A\u0440\u0430\u043D\u0430",
    "call.shotKey": "\u0421\u043D\u0438\u043C\u043E\u043A \u044D\u043A\u0440\u0430\u043D\u0430 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "call.shotKeyNote": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0437\u0430\u043F\u0438\u0441\u044C\u044E, \u0432\u0438\u0434\u0435\u043D \u0432 \u0435\u0451 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0435",
    "call.shots": "\u0421\u043D\u0438\u043C\u043A\u0438 \u044D\u043A\u0440\u0430\u043D\u0430 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "call.shotsNote": "\u041A\u0430\u0436\u0434\u044B\u0435 4 \u0441\u0435\u043A\u0443\u043D\u0434\u044B, \u043A\u043E\u0433\u0434\u0430 \u044D\u043A\u0440\u0430\u043D \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F; \u043B\u0435\u0436\u0430\u0442 \u0440\u044F\u0434\u043E\u043C \u0441 \u0437\u0430\u043F\u0438\u0441\u044C\u044E \u0438 \u0443\u0434\u0430\u043B\u044F\u044E\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043D\u0435\u0439",
    "call.names": "\u0418\u043C\u0435\u043D\u0430 \u0433\u043E\u0432\u043E\u0440\u044F\u0449\u0438\u0445 \u0441 \u044D\u043A\u0440\u0430\u043D\u0430",
    "call.namesNote": "\u042D\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442\u0430\u043B\u044C\u043D\u043E, \u043C\u043E\u0436\u0435\u0442 \u043E\u0448\u0438\u0431\u0430\u0442\u044C\u0441\u044F: \u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0441\u043E \u0441\u043D\u0438\u043C\u043A\u043E\u0432 \u0437\u0432\u043E\u043D\u043A\u0430 \u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u044E\u0442\u0441\u044F, \u0441\u0430\u043C\u0438 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F",
    "call.starting": "\u041D\u0430\u0447\u0438\u043D\u0430\u044E\u2026",
    "call.saving": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u2026",
    "call.noMic": "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u2014 \u043F\u0438\u0448\u0443 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A\u043E\u0432",
    "call.silent": "\u041D\u0435 \u0441\u043B\u044B\u0448\u0443 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A\u043E\u0432: \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0437\u0432\u0443\u043A\u0430",
    "call.failed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430: {why}",
    "call.noSound": "\u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043D\u0435 \u0434\u0430\u043B\u0430 \u0437\u0432\u0443\u043A\u0430",
    "call.openSettings": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "call.consentAsk": "\u0412\u043E \u043C\u043D\u043E\u0433\u0438\u0445 \u0441\u0442\u0440\u0430\u043D\u0430\u0445 \u043D\u0443\u0436\u043D\u043E \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A\u043E\u0432 \u043D\u0430 \u0437\u0430\u043F\u0438\u0441\u044C",
    "call.consentDetail": "\u0421\u043A\u0430\u0436\u0438\u0442\u0435 \u0438\u043C, \u0447\u0442\u043E \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442\u0435. \u0422\u0438\u0446\u044C \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u0435\u0442 \u043E\u0431 \u044D\u0442\u043E\u043C \u043E\u0434\u0438\u043D \u0440\u0430\u0437.",
    "call.consentRecord": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C",
    "call.quitAsk": "\u0418\u0434\u0451\u0442 \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043E\u0437\u0432\u043E\u043D\u0430. \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C?",
    "call.quitStop": "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    "call.screenAsk": "\u0422\u0438\u0446\u044C \u043D\u0443\u0436\u043D\u043E \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0442\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430",
    "call.screenDetail": "Windows \u0434\u0430\u0451\u0442 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435\u043C \xAB\u0417\u0430\u043F\u0438\u0441\u044C \u044D\u043A\u0440\u0430\u043D\u0430 \u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u043E\u0433\u043E \u0437\u0432\u0443\u043A\u0430\xBB. \u0422\u0438\u0446\u044C \u0431\u0435\u0440\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u0432\u0443\u043A, \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043E\u0442\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u0442 \u0441\u0440\u0430\u0437\u0443. \u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0442\u0430\u043C \u0422\u0438\u0446\u044C \u0438 \u043D\u0430\u0447\u043D\u0438\u0442\u0435 \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043D\u043E\u0432\u0430.",
    "call.auto": "\u041A\u043E\u0433\u0434\u0430 \u0441\u043E\u0437\u0432\u043E\u043D \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    "call.autoNote": "Zoom, Teams, Slack, Telegram, Discord, FaceTime, Webex \u0438\u043B\u0438 Google Meet \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D 10 \u0441. \u0417\u0430\u043F\u0438\u0441\u044C \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 20 \u0441 \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0432\u043E\u043D\u0430; \u043A\u043E\u0440\u043E\u0447\u0435 \u043C\u0438\u043D\u0443\u0442\u044B \u0443\u0434\u0430\u043B\u044F\u0435\u0442\u0441\u044F.",
    "call.autoOff": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0442\u044C",
    "call.autoAsk": "\u0421\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0442\u044C",
    "call.autoRecord": "\u0417\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0442\u044C",
    "call.askTitle": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0441\u043E\u0437\u0432\u043E\u043D?",
    "call.askNote": "{app} \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    "call.askRecord": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C",
    "call.askLater": "\u041D\u0435 \u0441\u0435\u0439\u0447\u0430\u0441",
    "call.autoStarted": "\u0417\u0430\u043F\u0438\u0441\u044C \u043D\u0430\u0447\u0430\u043B\u0430\u0441\u044C \u0441\u0430\u043C\u0430",
    "call.dontRecord": "\u041D\u0435 \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0442\u044C",
    "keys.useMeeting": "\u0437\u0430\u043F\u0438\u0441\u0438 \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "keys.useShot": "\u0441\u043D\u0438\u043C\u043A\u0430 \u044D\u043A\u0440\u0430\u043D\u0430 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0432\u043E\u043D\u0430",
    "sum.title": "\u0418\u0442\u043E\u0433",
    "sum.make": "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0438\u0442\u043E\u0433",
    "sum.again": "\u041F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0442\u044C",
    "sum.tGeneral": "\u041E\u0431\u0449\u0438\u0439",
    "sum.tStandup": "\u041F\u043B\u0430\u043D\u0451\u0440\u043A\u0430",
    "sum.tInterview": "\u0418\u043D\u0442\u0435\u0440\u0432\u044C\u044E",
    "sum.tLecture": "\u041B\u0435\u043A\u0446\u0438\u044F \u0438\u043B\u0438 \u0432\u0435\u0431\u0438\u043D\u0430\u0440",
    "sum.tOwn": "\u0421\u0432\u043E\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F",
    "sum.ownPlaceholder": "\u0427\u0442\u043E \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0432 \u0438\u0442\u043E\u0433\u0435 (\u0434\u043E 500 \u0437\u043D\u0430\u043A\u043E\u0432)",
    "sum.mine": "\u041D\u0430 \u043C\u043E\u0451\u043C \u044F\u0437\u044B\u043A\u0435",
    "sum.starting": "\u0414\u0435\u043B\u0430\u044E \u0438\u0442\u043E\u0433\u2026",
    "sum.working": "\u0414\u0435\u043B\u0430\u044E \u0438\u0442\u043E\u0433: \u0447\u0430\u0441\u0442\u044C {part} \u0438\u0437 {parts}",
    "sum.joining": "\u0414\u0435\u043B\u0430\u044E \u0438\u0442\u043E\u0433: \u0441\u043E\u0431\u0438\u0440\u0430\u044E \u0447\u0430\u0441\u0442\u0438",
    "sum.passed": "\u043F\u0440\u043E\u0448\u043B\u043E {time}",
    "sum.left": "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u2248{time}",
    "sum.failed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u0438\u0442\u043E\u0433",
    "sum.failedNote": "\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u0430.",
    "sum.needModel": "\u0414\u043B\u044F \u0438\u0442\u043E\u0433\u0430 \u043D\u0443\u0436\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C {name} ({size})",
    "sum.needModelNote": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435.",
    "sum.downloading": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u044E \u043C\u043E\u0434\u0435\u043B\u044C\u2026",
    "sum.edit": "\u041F\u0440\u0430\u0432\u0438\u0442\u044C",
    "sum.editHint": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B \u0432\u044B\u0445\u043E\u0434\u0438\u0442\u0435 \u0438\u0437 \u043F\u043E\u043B\u044F",
    "sum.done": "\u0413\u043E\u0442\u043E\u0432\u043E",
    "sum.replaceAsk": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0439 \u0438\u0442\u043E\u0433?",
    "sum.replace": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C",
    "sum.copied": "\u0418\u0442\u043E\u0433 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D",
    "sum.lost": "\u041F\u043E\u0442\u0435\u0440\u044F\u043D\u043E \u043A\u0443\u0441\u043A\u043E\u0432 \u0437\u0430\u043F\u0438\u0441\u0438: {n} (\u043F\u043E 10 \u0441)",
    "sum.seek": "\u041F\u043E\u0441\u043B\u0443\u0448\u0430\u0442\u044C \u0441 \u044D\u0442\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430",
    "sum.shot": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A",
    "sum.setAuto": "\u0414\u0435\u043B\u0430\u0442\u044C \u0438\u0442\u043E\u0433 \u0441\u0440\u0430\u0437\u0443",
    "sum.setAutoNote": "\u041F\u043E\u0441\u043B\u0435 \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u043E\u0437\u0432\u043E\u043D\u0430, \u0435\u0441\u043B\u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043A\u0430\u0447\u0430\u043D\u0430",
    "sum.setTemplate": "\u0428\u0430\u0431\u043B\u043E\u043D \u0438\u0442\u043E\u0433\u0430",
    "sum.setTemplateNote": "\u0414\u043B\u044F \u0438\u0442\u043E\u0433\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0434\u0435\u043B\u0430\u044E\u0442\u0441\u044F \u0441\u0430\u043C\u0438; \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u043C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0439",
    "sum.setMineNote": "\u0418\u043D\u0430\u0447\u0435 \u043E\u043D \u043F\u0438\u0448\u0435\u0442\u0441\u044F \u043D\u0430 \u044F\u0437\u044B\u043A\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
    "tr.srcAllSound": "\u0412\u0435\u0441\u044C \u0437\u0432\u0443\u043A"
  };

  // src/i18n/uk.ts
  var uk = {
    // ------------------------------------------------------------ shared
    "app.name": "\u0422\u0438\u0446\u044C",
    "app.tagline": "\u0422\u0438\u0446\u044C \u2014 \u0456 \u0433\u043E\u0442\u043E\u0432\u043E",
    "common.close": "\u0417\u0430\u043A\u0440\u0438\u0442\u0438",
    "common.restore": "\u0412\u0456\u0434\u043D\u043E\u0432\u0438\u0442\u0438",
    "common.maximize": "\u0420\u043E\u0437\u0433\u043E\u0440\u043D\u0443\u0442\u0438",
    "common.copy": "\u041A\u043E\u043F\u0456\u044E\u0432\u0430\u0442\u0438",
    "common.copied": "\u0421\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E",
    "common.notNow": "\u041D\u0435 \u0437\u0430\u0440\u0430\u0437",
    "common.beta": "\u0431\u0435\u0442\u0430",
    "common.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0438",
    "common.tryAgain": "\u0421\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437",
    "common.openSettings": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "common.listen": "\u0421\u043B\u0443\u0445\u0430\u0442\u0438",
    "common.stop": "\u0421\u0442\u043E\u043F",
    "common.paste": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438",
    "common.listening": "\u0421\u043B\u0443\u0445\u0430\u044E\u2026",
    "common.checking": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430\u2026",
    "common.or": "\u0430\u0431\u043E",
    "common.and": "\u0456",
    "common.cancel": "\u0421\u043A\u0430\u0441\u0443\u0432\u0430\u0442\u0438",
    "main.saveWords": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0441\u043B\u043E\u0432\u0430 \u0434\u043B\u044F Anki",
    "main.ankiText": "\u0422\u0435\u043A\u0441\u0442 \u0434\u043B\u044F Anki",
    "main.saveBackup": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443 \u043A\u043E\u043F\u0456\u044E",
    "main.backupFile": "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430 \u043A\u043E\u043F\u0456\u044F \u0422\u0438\u0446\u044C",
    "main.openBackup": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443 \u043A\u043E\u043F\u0456\u044E",
    "main.backupUnread": "\u0426\u044E \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443 \u043A\u043E\u043F\u0456\u044E \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438",
    "main.importAsk": "\u0406\u043C\u043F\u043E\u0440\u0442\u0443\u0432\u0430\u0442\u0438 \u0446\u044E \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443 \u043A\u043E\u043F\u0456\u044E?",
    "main.importDetail": "\u0423 \u043D\u0456\u0439: {what}. \u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0441\u0442\u0430\u043D\u0443\u0442\u044C \u0442\u0430\u043A\u0438\u043C\u0438, \u044F\u043A \u0443 \u043A\u043E\u043F\u0456\u0457; \u0457\u0457 \u0441\u043B\u043E\u0432\u0430, \u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u0442\u0430 \u0456\u0441\u0442\u043E\u0440\u0456\u044E \u0431\u0443\u0434\u0435 \u0434\u043E\u0434\u0430\u043D\u043E \u0434\u043E \u0432\u0430\u0448\u0438\u0445, \u043D\u0456\u0447\u043E\u0433\u043E \u0432\u0430\u0448\u043E\u0433\u043E \u043D\u0435 \u0432\u0438\u0434\u0430\u043B\u044F\u0454\u0442\u044C\u0441\u044F.",
    "main.import": "\u0406\u043C\u043F\u043E\u0440\u0442\u0443\u0432\u0430\u0442\u0438",
    "main.resetAsk": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u0432\u0441\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F?",
    "main.resetDetail": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456, \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0447\u0456 \u0442\u0430 \u0441\u043F\u0438\u0441\u043A\u0438 \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0434\u043E \u043F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u0438\u0445. \u0412\u0430\u0448\u0430 \u043C\u043E\u0432\u0430, \u0441\u043B\u043E\u0432\u0430, \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0456 \u0442\u0435, \u0447\u043E\u0433\u043E \u0422\u0438\u0446\u044C \u043D\u0430\u0432\u0447\u0438\u0432\u0441\u044F \u0437 \u0432\u0430\u0448\u043E\u0433\u043E \u043D\u0430\u0431\u043E\u0440\u0443, \u0437\u0430\u043B\u0438\u0448\u0430\u0442\u044C\u0441\u044F.",
    "main.reset": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438",
    "main.resetKeysAsk": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u0432\u0441\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456?",
    "main.resetKeysDetail": "\u041A\u043E\u0436\u043D\u0435 \u0441\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F \u043A\u043B\u0430\u0432\u0456\u0448 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F \u0434\u043E \u043F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u043E\u0433\u043E: Ctrl+Alt+S, Ctrl+Alt+T, Ctrl+Alt+D \u0456 Ctrl+Alt+N; \u0440\u0435\u0448\u0442\u0443 \u0431\u0443\u0434\u0435 \u043E\u0447\u0438\u0449\u0435\u043D\u043E, Ctrl+C \u0434\u0432\u0456\u0447\u0456 \u0442\u0435\u0436. \u0411\u0456\u043B\u044C\u0448\u0435 \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0437\u043C\u0456\u043D\u0438\u0442\u044C\u0441\u044F.",
    "main.resetKeys": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "main.saveTranscript": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0443",
    "main.notTranslated": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438: {why}",
    "main.noClipText": "\u0423 \u0431\u0443\u0444\u0435\u0440\u0456 \u043E\u0431\u043C\u0456\u043D\u0443 \u043D\u0435\u043C\u0430\u0454 \u0442\u0435\u043A\u0441\u0442\u0443. \u0421\u043F\u0435\u0440\u0448\u0443 \u0432\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u0456 \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u0439\u043E\u0433\u043E.",
    "main.nothingCopied": "\u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0441\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E. \u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442, \u043F\u043E\u0442\u0456\u043C \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0441\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F \u043A\u043B\u0430\u0432\u0456\u0448.",
    "main.keysTaken": { one: "\u0421\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F {keys} \u0437\u0430\u0439\u043D\u044F\u0442\u0435 \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E. \u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0456\u043D\u0448\u0435 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445.", few: "\u0421\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F {keys} \u0437\u0430\u0439\u043D\u044F\u0442\u0456 \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E. \u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0456\u043D\u0448\u0456 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445.", many: "\u0421\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F {keys} \u0437\u0430\u0439\u043D\u044F\u0442\u0456 \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E. \u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0456\u043D\u0448\u0456 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445.", other: "\u0421\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F {keys} \u0437\u0430\u0439\u043D\u044F\u0442\u0456 \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E. \u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0456\u043D\u0448\u0456 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445." },
    "main.copyTwiceOff": "Ctrl+C \u0434\u0432\u0456\u0447\u0456 \u043D\u0435 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438\u043C\u0435: {why}. \u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0439\u0442\u0435\u0441\u044F \u043C\u0435\u043D\u044E \u0432 \u0442\u0440\u0435\u0457.",
    "backup.settings": "\u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "backup.words": { one: "{n} \u0441\u043B\u043E\u0432\u043E", few: "{n} \u0441\u043B\u043E\u0432\u0430", many: "{n} \u0441\u043B\u0456\u0432", other: "{n} \u0441\u043B\u043E\u0432\u0430" },
    "backup.mistakes": { one: "{n} \u043F\u043E\u043C\u0438\u043B\u043A\u0430", few: "{n} \u043F\u043E\u043C\u0438\u043B\u043A\u0438", many: "{n} \u043F\u043E\u043C\u0438\u043B\u043E\u043A", other: "{n} \u043F\u043E\u043C\u0438\u043B\u043A\u0438" },
    "backup.learned": { one: "{n} \u0432\u0438\u0432\u0447\u0435\u043D\u0435 \u0441\u043B\u043E\u0432\u043E", few: "{n} \u0432\u0438\u0432\u0447\u0435\u043D\u0456 \u0441\u043B\u043E\u0432\u0430", many: "{n} \u0432\u0438\u0432\u0447\u0435\u043D\u0438\u0445 \u0441\u043B\u0456\u0432", other: "{n} \u0432\u0438\u0432\u0447\u0435\u043D\u043E\u0433\u043E \u0441\u043B\u043E\u0432\u0430" },
    "backup.translations": { one: "{n} \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434", few: "{n} \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0438", many: "{n} \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0456\u0432", other: "{n} \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443" },
    "backup.phrases": { one: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0430 \u0444\u0440\u0430\u0437\u0430", few: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0456 \u0444\u0440\u0430\u0437\u0438", many: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0438\u0445 \u0444\u0440\u0430\u0437", other: "{n} \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u043E\u0457 \u0444\u0440\u0430\u0437\u0438" },
    "backup.talks": { one: "{n} \u0440\u043E\u0437\u043C\u043E\u0432\u0430", few: "{n} \u0440\u043E\u0437\u043C\u043E\u0432\u0438", many: "{n} \u0440\u043E\u0437\u043C\u043E\u0432", other: "{n} \u0440\u043E\u0437\u043C\u043E\u0432\u0438" },
    "size.mb": "{n} \u041C\u0411",
    "size.gb": "{n} \u0413\u0411",
    "level.fast": "\u0428\u0432\u0438\u0434\u043A\u0438\u0439",
    "level.accurate": "\u0422\u043E\u0447\u043D\u0438\u0439",
    "level.most": "\u041D\u0430\u0439\u0442\u043E\u0447\u043D\u0456\u0448\u0438\u0439",
    "busy.card": "\u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "busy.processor": "\u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "lang.pairEnglish": "{lang} \u21C4 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430",
    "lang.yours": "\u0432\u0430\u0448\u0430 \u043C\u043E\u0432\u0430",
    // ------------------------------------------------------------ the tray's panel
    "tray.open": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438",
    "tray.openKryakl": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u0422\u0438\u0446\u044C",
    "tray.built": "\u0417\u0456\u0431\u0440\u0430\u043D\u043E {build}",
    "tray.actions": "\u0414\u0456\u0457",
    "tray.listenCopied": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441",
    "tray.translateCopied": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "tray.typeToTranslate": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443\u2026",
    "tray.checkEnglish": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438\u2026",
    "tray.listenScreen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0435\u043A\u0440\u0430\u043D",
    "tray.translateScreen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "tray.saveNote": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043D\u043E\u0442\u0430\u0442\u043A\u0443",
    "tray.newNote": "\u041D\u043E\u0442\u0430\u0442\u043A\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "tray.transcripts": "\u0423\u0441\u0456 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "tray.quick": "\u0428\u0432\u0438\u0434\u043A\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "tray.autoFix": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "tray.switchWith": "\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443: {key}",
    "tray.layoutBadge": "\u041F\u043E\u043A\u0430\u0437\u0443\u0432\u0430\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443 \u0431\u0456\u043B\u044F \u043A\u0443\u0440\u0441\u043E\u0440\u0430",
    "tray.trayLayout": "\u041F\u043E\u043A\u0430\u0437\u0443\u0432\u0430\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443 \u0432 \u0442\u0440\u0435\u0457",
    "tray.yourWords": "\u0412\u0430\u0448\u0456 \u0441\u043B\u043E\u0432\u0430",
    "tray.keepWord": "\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0441\u043B\u043E\u0432\u043E\u2026",
    "tray.keepWordTitle": "\u041D\u0456\u043A\u043E\u043B\u0438 \u043D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0446\u0435 \u0441\u043B\u043E\u0432\u043E \u0441\u0430\u043C\u043E\u0441\u0442\u0456\u0439\u043D\u043E (\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438)",
    "tray.keepPlaceholder": "\u0441\u043B\u043E\u0432\u043E, \u044F\u043A \u0432\u0438 \u0439\u043E\u0433\u043E \u043D\u0430\u0431\u0438\u0440\u0430\u0454\u0442\u0435",
    "tray.keepAria": "\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0441\u043B\u043E\u0432\u043E",
    "tray.kept": "\u0414\u043E\u0434\u0430\u043D\u043E: {word}",
    "tray.vocabulary": "\u0414\u043E\u0434\u0430\u0442\u0438 \u0456\u043C\u2019\u044F \u0430\u0431\u043E \u0442\u0435\u0440\u043C\u0456\u043D\u2026",
    "tray.keptList": "\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438",
    "tray.pausedTitle": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E",
    "tray.pauseTitle": "\u0423\u0441\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0439 \u0440\u0435\u0430\u043A\u0446\u0456\u0457 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E, \u0434\u043E\u043A\u0438 \u043D\u0435 \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0435",
    "tray.resume": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438",
    "tray.pause": "\u041F\u0430\u0443\u0437\u0430",
    "tray.settings": "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438",
    "tray.report": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "tray.reportTitle": "\u041F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438 \u043F\u0440\u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443, \u0437 \u0436\u0443\u0440\u043D\u0430\u043B\u0430\u043C\u0438 \u0422\u0438\u0446\u044C",
    "tray.quit": "\u0412\u0438\u0439\u0442\u0438",
    "tray.paused": "\u043F\u0430\u0443\u0437\u0430",
    "tray.ready": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "tray.readyTitle": "{pair}, \u0431\u0435\u0437 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443",
    "tray.downloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026",
    "tray.firstUse": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447 \u2014 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043F\u0435\u0440\u0448\u043E\u0433\u043E \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F",
    "tray.tipRecording": "\u0417\u0430\u043F\u0438\u0441",
    "tray.tipPaused": "\u0422\u0438\u0446\u044C \xB7 \u043F\u0430\u0443\u0437\u0430",
    "tray.tipListen": "{keys} \u2014 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438",
    "tray.tipTranslate": "{key} \u2014 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    // ------------------------------------------------------------ the card
    "kind.listen": "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441",
    "kind.translate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "kind.check": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438",
    "kind.screen": "\u0435\u043A\u0440\u0430\u043D",
    "card.openedBy": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u043E \u043A\u043B\u0430\u0432\u0456\u0448\u0430\u043C\u0438 {keys}",
    "card.openedByTwice": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u043E: {keys} \u0434\u0432\u0456\u0447\u0456",
    "card.prev": "\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u0454 \u0440\u0435\u0447\u0435\u043D\u043D\u044F",
    "card.next": "\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u0440\u0435\u0447\u0435\u043D\u043D\u044F",
    "card.oneByOne": "\u041F\u043E \u0440\u0435\u0447\u0435\u043D\u043D\u044E",
    "card.spaceListen": "\u0441\u043B\u0443\u0445\u0430\u0442\u0438",
    "card.spaceStop": "\u0441\u0442\u043E\u043F",
    "card.text": "\u0422\u0435\u043A\u0441\u0442",
    "card.from": "\u0417 \u043C\u043E\u0432\u0438",
    "card.fromTitle": "\u041C\u043E\u0432\u0430 \u0442\u0435\u043A\u0441\u0442\u0443",
    "card.into": "\u041D\u0430 \u043C\u043E\u0432\u0443",
    "card.intoTitle": "\u041C\u043E\u0432\u0430, \u043D\u0430 \u044F\u043A\u0443 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "card.swap": "\u041F\u043E\u043C\u0456\u043D\u044F\u0442\u0438",
    "card.swapTitle": "\u041F\u043E\u043C\u0456\u043D\u044F\u0442\u0438 \u043C\u043E\u0432\u0438 \u043C\u0456\u0441\u0446\u044F\u043C\u0438: \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0441\u0442\u0430\u043D\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u043C",
    "card.voiceOffer": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u0437\u0432\u0443\u0447\u0438\u0442\u044C \u044F\u043A \u0436\u0438\u0432\u0430 \u043B\u044E\u0434\u0438\u043D\u0430 \u0439 \u0447\u0438\u0442\u0430\u0454 \u0431\u0435\u0437 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443.",
    "card.voiceDownload": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \xB7 {size} \u041C\u0411",
    "card.voiceFailed": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0432\u0441\u044F.",
    "card.voiceDownloading": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0443\u2026 {pct}%",
    "card.voiceReady": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u0433\u043E\u0442\u043E\u0432\u0438\u0439. \u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \xAB\u0421\u043B\u0443\u0445\u0430\u0442\u0438\xBB, \u0449\u043E\u0431 \u043F\u043E\u0447\u0443\u0442\u0438 \u0439\u043E\u0433\u043E.",
    "card.busyCard": "\u0412\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u0439\u043D\u044F\u0442\u0430, \u0442\u043E\u043C\u0443 \u0446\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0432 \xAB\u0428\u0432\u0438\u0434\u043A\u0438\u0439\xBB. \xAB{level}\xBB \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u0432\u043E\u043D\u0430 \u0437\u0432\u0456\u043B\u044C\u043D\u0438\u0442\u044C\u0441\u044F.",
    "card.busyProcessor": "\u041F\u0440\u043E\u0446\u0435\u0441\u043E\u0440 \u0437\u0430\u0439\u043D\u044F\u0442\u0438\u0439, \u0442\u043E\u043C\u0443 \u0446\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0432 \xAB\u0428\u0432\u0438\u0434\u043A\u0438\u0439\xBB. \xAB{level}\xBB \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u0432\u0456\u043D \u0437\u0432\u0456\u043B\u044C\u043D\u0438\u0442\u044C\u0441\u044F.",
    "card.useAnyway": "\u0423\u0441\u0435 \u043E\u0434\u043D\u043E \xAB{level}\xBB",
    "card.hideTranslation": "\u0421\u0445\u043E\u0432\u0430\u0442\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 ({lang})",
    "card.showTranslation": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 ({lang})",
    "card.unpin": "\u0412\u0456\u0434\u043A\u0440\u0456\u043F\u0438\u0442\u0438: \u0437\u0430\u043A\u0440\u0438\u0432\u0430\u0442\u0438, \u043A\u043E\u043B\u0438 \u043A\u043B\u0430\u0446\u043D\u0443\u0442\u043E \u0456\u043D\u0448\u0435 \u0432\u0456\u043A\u043D\u043E",
    "card.pin": "\u0417\u0430\u043A\u0440\u0456\u043F\u0438\u0442\u0438: \u043D\u0435 \u0437\u0430\u043A\u0440\u0438\u0432\u0430\u0442\u0438",
    "card.oneOn": "\u0427\u0438\u0442\u0430\u0454 \u043E\u0434\u043D\u0435 \u0440\u0435\u0447\u0435\u043D\u043D\u044F \u0439 \u0447\u0435\u043A\u0430\u0454; \u2190 \u2192 \u2014 \u043A\u0440\u043E\u043A",
    "card.oneOff": "\u0427\u0438\u0442\u0430\u0442\u0438 \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0440\u0435\u0447\u0435\u043D\u043D\u044E",
    "card.translatingFast": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \xAB\u0428\u0432\u0438\u0434\u043A\u0438\u0439\xBB\u2026",
    "card.translating": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u2026",
    "card.translatingLevel": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \xB7 {level}\u2026",
    "card.ofGb": "{a} \u0437 {b} \u0413\u0411",
    "card.ofMb": "{a} \u0437 {b} \u041C\u0411",
    "card.firstUse": "\u043F\u0435\u0440\u0448\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \xB7 \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "card.modelOf": "\u041C\u043E\u0434\u0435\u043B\u044C \xAB{name}\xBB",
    "card.translatorPair": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447, {pair}",
    "card.fromMozilla": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0456\u0437 Mozilla, \u0434\u0430\u043B\u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "card.fromHfTranslates": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0456\u0437 Hugging Face, \u0434\u0430\u043B\u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "card.fromHfChecks": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0456\u0437 Hugging Face, \u0434\u0430\u043B\u0456 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "card.readMeanwhile": "\u0410\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u0442\u0438\u043C \u0447\u0430\u0441\u043E\u043C \u0447\u0438\u0442\u0430\u0454\u0442\u044C\u0441\u044F.",
    "card.notChecked": "\u041D\u0435 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0435\u043D\u043E",
    "card.notTranslated": "\u041D\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0435\u043D\u043E",
    "card.readingScreen": "\u0427\u0438\u0442\u0430\u044E \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u0435\u043A\u0440\u0430\u043D\u0456\u2026",
    "card.noText": "\u0422\u0443\u0442 \u043D\u0435\u043C\u0430\u0454 \u0442\u0435\u043A\u0441\u0442\u0443",
    "card.noTextNote": "\u041D\u0430 \u0446\u044C\u043E\u043C\u0443 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0456 \u0435\u043A\u0440\u0430\u043D\u0430 \u043D\u0435\u043C\u0430\u0454 \u0442\u0435\u043A\u0441\u0442\u0443, \u044F\u043A\u0438\u0439 \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438. \u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 \u0437\u0456 \u0441\u043B\u043E\u0432\u0430\u043C\u0438.",
    "card.noOcr": "Windows \u043F\u043E\u043A\u0438 \u043D\u0435 \u0432\u043C\u0456\u0454 \u0447\u0438\u0442\u0430\u0442\u0438 \u0442\u0435\u043A\u0441\u0442",
    "card.noOcrNote": "\u0414\u043E\u0434\u0430\u0439\u0442\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u0442\u0435\u043A\u0441\u0442\u0443 \u0434\u043B\u044F \u043C\u043E\u0432\u0438 \xAB{lang}\xBB \u0430\u0431\u043E \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457: \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u2192 \u0427\u0430\u0441 \u0456 \u043C\u043E\u0432\u0430 \u2192 \u041C\u043E\u0432\u0430 \u0442\u0430 \u0440\u0435\u0433\u0456\u043E\u043D \u2192 \u043C\u043E\u0432\u0430 \u2192 \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u043C\u043E\u0432\u0438 \u2192 \u041E\u043F\u0442\u0438\u0447\u043D\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432.",
    "card.openLanguageSettings": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u043C\u043E\u0432\u0438",
    "card.yourEnglish": "\u0412\u0430\u0448\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430",
    "card.typeEnglish": "\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u0430\u0431\u043E \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E",
    "card.checkedBy": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0435\u043D\u043E \xB7 {model}",
    "card.improving": "\u0423\u0442\u043E\u0447\u043D\u044E\u0454\u0442\u044C\u0441\u044F \xB7 {level}\u2026",
    "card.translatedBy": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0435\u043D\u043E \xB7 {level}",
    "card.newLine": "{by} \xB7 Shift+Enter \u2014 \u043D\u043E\u0432\u0438\u0439 \u0440\u044F\u0434\u043E\u043A",
    "card.yours": "\u0412\u0430\u0448\u0456",
    "card.allLanguages": "\u0423\u0441\u0456 \u043C\u043E\u0432\u0438",
    "card.pasteOver": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u0437\u0430\u043C\u0456\u0441\u0442\u044C \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u043E\u0433\u043E (Enter)",
    "card.pasteLater": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u043D\u0430\u0434\u0456\u0439\u0434\u0435 \u0442\u043E\u0447\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 (Enter)",
    "card.pasteChecked": "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u0437\u0430\u043C\u0456\u0441\u0442\u044C \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u043E\u0433\u043E (Enter)",
    "card.looksRight": "\u0421\u0445\u043E\u0436\u0435, \u0443\u0441\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
    "card.listenSpace": "\u0421\u043B\u0443\u0445\u0430\u0442\u0438 (Space)",
    "card.listenParagraph": "\u041F\u0440\u043E\u0441\u043B\u0443\u0445\u0430\u0442\u0438 \u0446\u0435\u0439 \u0430\u0431\u0437\u0430\u0446",
    "card.naturalStopped": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u0437\u0443\u043F\u0438\u043D\u0438\u0432\u0441\u044F ({message}). \u0414\u0430\u043B\u0456 \u0447\u0438\u0442\u0430\u0454 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441.",
    "card.noVoice": "\u041D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456 \u043D\u0435\u043C\u0430\u0454 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0443.",
    "card.openSpeechSettings": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "voice.stepsWin": "\u0429\u043E\u0431 \u0434\u043E\u0434\u0430\u0442\u0438: \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 Windows \u2192 \u0427\u0430\u0441 \u0456 \u043C\u043E\u0432\u0430 \u2192 \u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u2192 \u0414\u043E\u0434\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u0438 \u2192 {lang}, \u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0456\u0442\u044C \u0422\u0438\u0446\u044C.",
    "voice.stepsMac": "\u0429\u043E\u0431 \u0434\u043E\u0434\u0430\u0442\u0438: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0456 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u2192 \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0456\u0441\u0442\u044C \u2192 \u041E\u0437\u0432\u0443\u0447\u0435\u043D\u0438\u0439 \u0432\u043C\u0456\u0441\u0442 \u2192 \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u2192 \u041A\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u0430\u043C\u0438 \u2192 {lang}, \u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0456\u0442\u044C \u0422\u0438\u0446\u044C.",
    "voice.none": "\u0414\u043B\u044F \u0447\u0438\u0442\u0430\u043D\u043D\u044F \u0432\u0433\u043E\u043B\u043E\u0441 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0456 \u0433\u043E\u043B\u043E\u0441\u0438 Windows \u0430\u0431\u043E macOS; \u0443 \u0446\u0456\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u0456 \u043D\u0435\u043C\u0430\u0454 \u0436\u043E\u0434\u043D\u043E\u0433\u043E \u043F\u0440\u0438\u0434\u0430\u0442\u043D\u043E\u0433\u043E.",
    // ------------------------------------------------------------ the word card
    "word.from": "\u0444\u043E\u0440\u043C\u0430: {word}",
    "word.say": "\u0412\u0438\u043C\u043E\u0432\u0438\u0442\u0438",
    "word.save": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0432 \xAB\u0421\u043B\u043E\u0432\u0430\xBB",
    "word.remove": "\u041F\u0440\u0438\u0431\u0440\u0430\u0442\u0438 \u0437\u0456 \xAB\u0421\u043B\u0456\u0432\xBB",
    "word.notFound": "\u041D\u0435\u043C\u0430\u0454 \u0432 \u0441\u043B\u043E\u0432\u043D\u0438\u043A\u0443.",
    "word.pair": "\u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430 \u2192 {lang}",
    "word.notEnglish": "\u0417\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0441\u043B\u0456\u0432 \u043F\u043E\u043A\u0438 \u0454 \u043B\u0438\u0448\u0435 \u0434\u043B\u044F \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457; \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 ({lang}) \u2014 \u043D\u0438\u0436\u0447\u0435.",
    "word.noDictionary": "\u0421\u043B\u043E\u0432\u043D\u0438\u043A\u0430 {pair} \u043F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454; \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u2014 \u043D\u0438\u0436\u0447\u0435.",
    "word.downloading": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0441\u043B\u043E\u0432\u043D\u0438\u043A\u0430 {pair}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437\u2026",
    "word.failed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u0441\u043B\u043E\u0432\u043D\u0438\u043A {pair}. \u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0437\u2019\u0454\u0434\u043D\u0430\u043D\u043D\u044F \u0437 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u043E\u043C; \u043D\u043E\u0432\u0430 \u0441\u043F\u0440\u043E\u0431\u0430 \u0437\u0430 \u0445\u0432\u0438\u043B\u0438\u043D\u0443.",
    "word.off": "\u0421\u043B\u043E\u0432\u043D\u0438\u043A {pair} \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E.",
    // ------------------------------------------------------------ the talk window
    "talk.yourTalks": "\u0412\u0430\u0448\u0456 \u0440\u043E\u0437\u043C\u043E\u0432\u0438",
    "talk.hideTalks": "\u0421\u0445\u043E\u0432\u0430\u0442\u0438 \u0440\u043E\u0437\u043C\u043E\u0432\u0438",
    "talk.settings": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043C\u043E\u0432\u0438",
    "talk.toEnd": "\u0414\u043E \u043E\u0441\u0442\u0430\u043D\u043D\u044C\u043E\u0457 \u0440\u0435\u043F\u043B\u0456\u043A\u0438",
    "talk.typePlaceholder": "\u0410\u0431\u043E \u043D\u0430\u043F\u0438\u0448\u0456\u0442\u044C \u0440\u0435\u043F\u043B\u0456\u043A\u0443",
    "talk.typeOnly": "\u041D\u0430\u043F\u0438\u0448\u0456\u0442\u044C \u0456 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C Enter",
    "talk.typeAria": "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0440\u0435\u043F\u043B\u0456\u043A\u0443 \u0422\u0438\u0446\u044C",
    "talk.newTitle": "\u041F\u0440\u0438\u0431\u0440\u0430\u0442\u0438 \u0446\u044E \u0440\u043E\u0437\u043C\u043E\u0432\u0443 \u0434\u043E \u0456\u0441\u0442\u043E\u0440\u0456\u0457 \u0439 \u043F\u043E\u0447\u0430\u0442\u0438 \u043D\u043E\u0432\u0443",
    "talk.new": "\u041D\u043E\u0432\u0430 \u0440\u043E\u0437\u043C\u043E\u0432\u0430",
    "talk.closeList": "\u0417\u0430\u043A\u0440\u0438\u0442\u0438 \u0441\u043F\u0438\u0441\u043E\u043A",
    "talk.today": "\u0421\u044C\u043E\u0433\u043E\u0434\u043D\u0456",
    "talk.yesterday": "\u0423\u0447\u043E\u0440\u0430",
    "talk.earlier": "\u0420\u0430\u043D\u0456\u0448\u0435",
    "talk.lines": { one: "{n} \u0440\u0435\u043F\u043B\u0456\u043A\u0430", few: "{n} \u0440\u0435\u043F\u043B\u0456\u043A\u0438", many: "{n} \u0440\u0435\u043F\u043B\u0456\u043A", other: "{n} \u0440\u0435\u043F\u043B\u0456\u043A\u0438" },
    "talk.withMistake": "\u0437 \u043F\u043E\u043C\u0438\u043B\u043A\u043E\u044E: {n}",
    "talk.goingOnMeta": "\u0442\u0440\u0438\u0432\u0430\u0454",
    "talk.goingOnTitle": "\u041F\u043E\u0442\u043E\u0447\u043D\u0430 \u0440\u043E\u0437\u043C\u043E\u0432\u0430",
    "talk.goOn": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0446\u044E \u0440\u043E\u0437\u043C\u043E\u0432\u0443",
    "talk.firstLine": "\u041F\u0435\u0440\u0448\u0430 \u0440\u0435\u043F\u043B\u0456\u043A\u0430 \u0422\u0438\u0446\u044C",
    "talk.delete": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0446\u044E \u0440\u043E\u0437\u043C\u043E\u0432\u0443",
    "talk.goingOn": "\u0422\u0440\u0438\u0432\u0430\u0454",
    "talk.historyEmpty": "\xAB\u041D\u043E\u0432\u0430 \u0440\u043E\u0437\u043C\u043E\u0432\u0430\xBB \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442\u044C \u0440\u043E\u0437\u043C\u043E\u0432\u0443 \u0441\u044E\u0434\u0438, \u0449\u043E\u0431 \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0457\u0457 \u043F\u0456\u0437\u043D\u0456\u0448\u0435. \u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044C\u0441\u044F 30 \u0434\u043D\u0456\u0432 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456, \u043D\u0435 \u0431\u0456\u043B\u044C\u0448\u0435 50.",
    "talk.sureOne": "\u0422\u043E\u0447\u043D\u043E? \u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438",
    "talk.sureAll": "\u0422\u043E\u0447\u043D\u043E? \u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u0432\u0441\u0456 ({n})",
    "talk.clearAll": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0432\u0441\u0435",
    "talk.needsCard": "\u0414\u043B\u044F \u0440\u043E\u0437\u043C\u043E\u0432\u0438 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437 4 \u0413\u0411 \u0432\u043B\u0430\u0441\u043D\u043E\u0457 \u043F\u0430\u043C\u2019\u044F\u0442\u0456 \u0430\u0431\u043E \u0431\u0456\u043B\u044C\u0448\u0435",
    "talk.needsCardNote": "\u041D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456 \u0422\u0438\u0446\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0432 \u0431\u0438 15 \u0441\u0435\u043A\u0443\u043D\u0434 \u0456 \u0434\u043E\u0432\u0448\u0435 \u2014 \u043D\u0430\u0434\u0442\u043E \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0440\u043E\u0437\u043C\u043E\u0432\u0438. \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457\xBB \u043F\u0440\u0430\u0446\u044E\u0454 \u044F\u043A \u0456 \u0440\u0430\u043D\u0456\u0448\u0435.",
    "talk.downloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F, {pct}%; \u0440\u043E\u0437\u043C\u043E\u0432\u0430 \u043F\u043E\u0447\u043D\u0435\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0431\u0443\u0434\u0435 \u0442\u0443\u0442",
    "talk.downloadFailed": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F",
    "talk.downloadIt": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0457\u0457 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445; \u0457\u0457 \u0442\u0430\u043A\u043E\u0436 \u043C\u043E\u0436\u0443\u0442\u044C \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457\xBB \u0439 \xAB\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\xBB",
    "talk.needsModel": "\u0422\u0438\u0446\u044C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u0439\u043E\u0433\u043E \u043C\u043E\u0434\u0435\u043B\u044C: {name}, {size}",
    "talk.noEngine": "\u041F\u0438\u0448\u0456\u0442\u044C \u0422\u0438\u0446\u044C \u0430\u0431\u043E \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F, \u0449\u043E\u0431 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0438",
    "talk.noEngineNote": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u0447\u0443\u0454 \u0432\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F, \u044F\u043A\u0438\u0439 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F; \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0439\u043E\u0433\u043E \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445.",
    "talk.engineStarting": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F\u2026",
    "talk.slow": "\xAB{name}\xBB \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456 \u043F\u0440\u0430\u0446\u044E\u0454 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0434\u043E\u0432\u0433\u043E. \xAB{accurate}\xBB \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0454 \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 3 \u0441\u0435\u043A\u0443\u043D\u0434\u0438.",
    "talk.busyCard": "\u0412\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u0456\u043D\u0448\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E.",
    "talk.busyProcessor": "\u041F\u0440\u043E\u0446\u0435\u0441\u043E\u0440 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u0456\u043D\u0448\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430: \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E.",
    "talk.intro": "\u0413\u043E\u0432\u043E\u0440\u0456\u0442\u044C \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E. \u0422\u0438\u0446\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0454 \u0432\u0433\u043E\u043B\u043E\u0441, \u0430 \u0432\u0430\u0448\u0456 \u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u043F\u043E\u0437\u043D\u0430\u0447\u0430\u044E\u0442\u044C\u0441\u044F \u0443 \u0432\u0430\u0448\u0438\u0445 \u0440\u0435\u043F\u043B\u0456\u043A\u0430\u0445.",
    "talk.orTypeHello": "\u0410\u0431\u043E \u043D\u0430\u043F\u0438\u0448\u0456\u0442\u044C hello \u043D\u0438\u0436\u0447\u0435.",
    "talk.orSayHello": "\u0410\u0431\u043E \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043A\u043D\u043E\u043F\u043A\u0443 \u0439 \u0441\u043A\u0430\u0436\u0456\u0442\u044C hello.",
    "talk.unpin": "\u041D\u0435 \u0442\u0440\u0438\u043C\u0430\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u0445 \u0456\u043D\u0448\u0438\u0445 \u0432\u0456\u043A\u043E\u043D",
    "talk.pin": "\u0422\u0440\u0438\u043C\u0430\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u0445 \u0456\u043D\u0448\u0438\u0445 \u0432\u0456\u043A\u043E\u043D",
    "talk.modelTitle": "\u0422\u0438\u0446\u044C \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 {model} \u2014 \u0442\u0456\u0439 \u0441\u0430\u043C\u0456\u0439 \u043C\u043E\u0434\u0435\u043B\u0456, \u0449\u043E \u0439 \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457\xBB, \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456. \u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C, \u0449\u043E\u0431 \u0437\u043C\u0456\u043D\u0438\u0442\u0438.",
    "talk.failed": "\u0422\u0438\u0446\u044C \u043D\u0435 \u0437\u043C\u0456\u0433 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0441\u0442\u0438: {message}. \u0421\u043A\u0430\u0436\u0456\u0442\u044C \u0449\u0435 \u0440\u0430\u0437 \u0430\u0431\u043E \u043D\u0430\u043F\u0438\u0448\u0456\u0442\u044C.",
    "talk.noAnswer": "\u043D\u0435\u043C\u0430\u0454 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456",
    "talk.startingMic": "\u0412\u043C\u0438\u043A\u0430\u044E \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D\u2026",
    "talk.send": "\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438",
    "talk.talk": "\u0413\u043E\u0432\u043E\u0440\u0438\u0442\u0438",
    "talk.notPossible": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u043F\u043E\u043A\u0438 \u043D\u0435\u043C\u043E\u0436\u043B\u0438\u0432\u0430: \u0434\u0438\u0432. \u0432\u0438\u0449\u0435.",
    "talk.speaking": "\u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C",
    "talk.thinking": "\u0422\u0438\u0446\u044C \u0434\u0443\u043C\u0430\u0454\u2026",
    "talk.typingOnly": "\u041B\u0438\u0448\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u043C, \u0434\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "talk.pressAgain": "\u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0449\u0435 \u0440\u0430\u0437, \u0449\u043E\u0431 \u0441\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438.",
    "talk.listeningPress": "\u0421\u043B\u0443\u0445\u0430\u044E \xB7 {keys} \u2014 \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438",
    "talk.speakingPress": "\u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \xB7 {keys} \u2014 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0441\u0442\u0438",
    "talk.thinkingPress": "\u0422\u0438\u0446\u044C \u0434\u0443\u043C\u0430\u0454 \xB7 {keys} \u2014 \u043F\u0435\u0440\u0435\u0431\u0438\u0442\u0438",
    "talk.press": "{keys} \u2014 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0438",
    "talk.finishing": "\u0417\u0430\u0432\u0435\u0440\u0448\u0443\u044E \u0440\u0435\u043F\u043B\u0456\u043A\u0443\u2026",
    "talk.nothingHeard": "\u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043F\u043E\u0447\u0443\u0442\u043E.",
    "turn.again": "\u0421\u043A\u0430\u0437\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437",
    "turn.checking": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430\u2026",
    "turn.setRight": "\u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0432\u0438\u0449\u0435",
    "turn.hearRight": "\u041F\u043E\u0447\u0443\u0442\u0438, \u044F\u043A \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
    "turn.hear": "\u041F\u043E\u0447\u0443\u0442\u0438",
    "topic.free": "\u0412\u0456\u043B\u044C\u043D\u0430 \u0440\u043E\u0437\u043C\u043E\u0432\u0430",
    "topic.day": "\u041C\u0456\u0439 \u0434\u0435\u043D\u044C",
    "topic.trip": "\u041F\u043E\u0434\u043E\u0440\u043E\u0436",
    "topic.cafe": "\u0423 \u043A\u0430\u0444\u0435",
    "topic.interview": "\u0421\u043F\u0456\u0432\u0431\u0435\u0441\u0456\u0434\u0430",
    "topic.work": "\u041C\u043E\u044F \u0440\u043E\u0431\u043E\u0442\u0430",
    // ------------------------------------------------------------ the microphone and the dictation badge
    "mic.denied": "\u041D\u0435\u043C\u0430\u0454 \u0434\u043E\u0441\u0442\u0443\u043F\u0443 \u0434\u043E \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D\u0430: \u0434\u043E\u0437\u0432\u043E\u043B\u044C\u0442\u0435 \u0439\u043E\u0433\u043E \u0432 \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u0445 Windows \u2192 \u041A\u043E\u043D\u0444\u0456\u0434\u0435\u043D\u0446\u0456\u0439\u043D\u0456\u0441\u0442\u044C \u2192 \u041C\u0456\u043A\u0440\u043E\u0444\u043E\u043D",
    "mic.none": "\u041C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E",
    "mic.busy": "\u041C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u0437\u0430\u0439\u043D\u044F\u0442\u0438\u0439 \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E",
    "dict.type": "\u0414\u0440\u0443\u043A\u0443\u0432\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "dict.english": "\u0414\u0440\u0443\u043A\u0443\u0432\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0437 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "dict.note": "\u041D\u043E\u0442\u0430\u0442\u043A\u0430 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "dict.check": "\u0421\u043A\u0430\u0437\u0430\u0442\u0438 \u0439 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438",
    "dict.gettingModel": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043C\u043E\u0434\u0435\u043B\u0456 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F {pct}%",
    "dict.savingNote": "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u044E \u043D\u043E\u0442\u0430\u0442\u043A\u0443\u2026",
    "dict.catchingUp": "\u041D\u0430\u0437\u0434\u043E\u0433\u0430\u043D\u044F\u044E\u2026",
    "dict.typing": "\u0414\u0440\u0443\u043A\u0443\u044E\u2026",
    "dict.saved": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E",
    "dict.typed": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E",
    "dict.noteFailed": "\u041D\u043E\u0442\u0430\u0442\u043A\u0443 \u043D\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E",
    "dict.nothingTyped": "\u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E",
    "dict.engineStarting": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0437\u0430 \u043A\u0456\u043B\u044C\u043A\u0430 \u0441\u0435\u043A\u0443\u043D\u0434.",
    "dict.engineDown": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u0437\u043C\u0456\u0433 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438\u0441\u044F. \u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C, \u0449\u043E\u0431 \u043F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438 \u043F\u0440\u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443.",
    "dict.fastCard": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \xAB\u0428\u0432\u0438\u0434\u043A\u0438\u043C\xBB: \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u0439\u043D\u044F\u0442\u0430",
    "dict.fastProcessor": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \xAB\u0428\u0432\u0438\u0434\u043A\u0438\u043C\xBB: \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440 \u0437\u0430\u0439\u043D\u044F\u0442\u0438\u0439",
    "dict.tuck": "\u0417\u0433\u043E\u0440\u043D\u0443\u0442\u0438 \u0432 \u0442\u0440\u0435\u0439: \u0437\u0430\u043F\u0438\u0441 \u0442\u0440\u0438\u0432\u0430\u0454",
    "dict.editing": "\u0420\u0435\u0434\u0430\u0433\u0443\u044E\u2026",
    "dict.editNoModel": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u0430",
    "dict.editCard": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u0439\u043D\u044F\u0442\u0430",
    "dict.editProcessor": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440 \u0437\u0430\u0439\u043D\u044F\u0442\u0438\u0439",
    "dict.editSlow": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0432\u0441\u0442\u0438\u0433\u043B\u0430",
    "dict.editDoubt": "\u041D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u043E: \u0440\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u043D\u043D\u044F \u0432\u0438\u0439\u0448\u043B\u043E \u0434\u0438\u0432\u043D\u0438\u043C",
    "edit.title": "\u0420\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u043D\u043D\u044F \u0442\u0435\u043A\u0441\u0442\u0443",
    "edit.off": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E",
    "edit.on": "\u0420\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u0442\u0438 \u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0435",
    "edit.onNote": "\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u0436\u043D\u0443 \u0444\u0440\u0430\u0437\u0443 \u043F\u0435\u0440\u0435\u0434 \u0434\u0440\u0443\u043A\u043E\u043C, \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u043D\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u0434\u043E\u0432\u0448\u0435; \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0439\u0434\u0435 \u0437 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "edit.onNoteSlow": "\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u0436\u043D\u0443 \u0444\u0440\u0430\u0437\u0443 \u043F\u0435\u0440\u0435\u0434 \u0434\u0440\u0443\u043A\u043E\u043C; \u0442\u0443\u0442 \u043A\u043E\u0436\u043D\u0430 \u0444\u0440\u0430\u0437\u0430 \u0447\u0435\u043A\u0430\u0454 \u043A\u0456\u043B\u044C\u043A\u0430 \u0441\u0435\u043A\u0443\u043D\u0434",
    "edit.needsModel": "\u0414\u043B\u044F \u0440\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u043D\u043D\u044F \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \xAB{name}\xBB ({size})",
    "edit.style": "\u042F\u043A \u0440\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u0442\u0438",
    "edit.clean": "\u041F\u043E\u0447\u0438\u0441\u0442\u0438\u0442\u0438",
    "edit.cleanNote": "\u043F\u0440\u0438\u0431\u0438\u0440\u0430\u0454 \xAB\u0435-\u0435\xBB, \u043F\u043E\u0432\u0442\u043E\u0440\u0438 \u0439 \u043E\u0431\u043C\u043E\u0432\u043A\u0438, \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454 \u0437\u043D\u0430\u043A\u0438; \u0440\u0435\u0448\u0442\u0443 \u0441\u043B\u0456\u0432 \u043D\u0435 \u0447\u0456\u043F\u0430\u0454",
    "edit.business": "\u0414\u0456\u043B\u043E\u0432\u0438\u0439 \u0442\u043E\u043D",
    "edit.businessNote": "\u0434\u043B\u044F \u043B\u0438\u0441\u0442\u0456\u0432 \u0456 \u0440\u043E\u0431\u043E\u0447\u0438\u0445 \u0447\u0430\u0442\u0456\u0432: \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u0456 \u0432\u0432\u0456\u0447\u043B\u0438\u0432\u0456 \u0441\u043B\u043E\u0432\u0430",
    "edit.aiTask": "\u0417\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0434\u043B\u044F \u0428\u0406",
    "edit.aiTaskNote": "\u0447\u0456\u0442\u043A\u0435 \u043F\u0440\u043E\u0445\u0430\u043D\u043D\u044F \u0434\u043B\u044F Claude \u0430\u0431\u043E ChatGPT; \u0442\u0435\u0440\u043C\u0456\u043D\u0438 \u0439 \u0456\u043C\u0435\u043D\u0430 \u0444\u0430\u0439\u043B\u0456\u0432 \u044F\u043A \u0454",
    "edit.list": "\u0421\u043F\u0438\u0441\u043E\u043A",
    "edit.listNote": "\u043A\u043E\u0436\u043D\u0430 \u0434\u0443\u043C\u043A\u0430 \u043E\u043A\u0440\u0435\u043C\u0438\u043C \u0440\u044F\u0434\u043A\u043E\u043C",
    "edit.own": "\u0421\u0432\u043E\u044F \u0456\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0456\u044F",
    "edit.ownNote": "\u0432\u0430\u0448\u0456 \u0441\u043B\u043E\u0432\u0430 \u043F\u0440\u043E \u0442\u0435, \u044F\u043A \u043F\u0438\u0441\u0430\u0442\u0438",
    "edit.ownLabel": "\u0406\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0456\u044F",
    "edit.ownPlaceholder": "\u041D\u0430\u043F\u0440\u0438\u043A\u043B\u0430\u0434: \u043F\u0438\u0448\u0438 \u043A\u043E\u0440\u043E\u0442\u0448\u0435, \u0442\u0435\u0440\u043C\u0456\u043D\u0438 \u0437\u0430\u043B\u0438\u0448\u0430\u0439 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E",
    "edit.ownHint": "\u0414\u043E 500 \u0437\u043D\u0430\u043A\u0456\u0432. \u042F\u043A\u0449\u043E \u043F\u043E\u0440\u043E\u0436\u043D\u044C\u043E, \u0444\u0440\u0430\u0437\u0430 \u0434\u0440\u0443\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u044F\u043A \u0441\u043A\u0430\u0437\u0430\u043D\u0430.",
    "edit.keeps": "\u041D\u043E\u0442\u0430\u0442\u043A\u0438, \u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u0439 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0430 \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 \u043D\u0435 \u0440\u0435\u0434\u0430\u0433\u0443\u044E\u0442\u044C\u0441\u044F. \u0421\u043A\u0430\u0437\u0430\u043D\u0435 \u043B\u0438\u0448\u0430\u0454\u0442\u044C\u0441\u044F \u0443 \xAB\u0424\u0440\u0430\u0437\u0430\u0445\xBB: \u043D\u0430\u0432\u0435\u0434\u0456\u0442\u044C \u043D\u0430 \u0444\u0440\u0430\u0437\u0443, \u0449\u043E\u0431 \u0439\u043E\u0433\u043E \u043F\u043E\u0431\u0430\u0447\u0438\u0442\u0438.",
    "edit.model": "\u041C\u043E\u0434\u0435\u043B\u044C",
    "badge.fastCard": "\u0428\u0432\u0438\u0434\u043A\u0438\u0439 \xB7 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u0439\u043D\u044F\u0442\u0430",
    "badge.fastProcessor": "\u0428\u0432\u0438\u0434\u043A\u0438\u0439 \xB7 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440 \u0437\u0430\u0439\u043D\u044F\u0442\u0438\u0439",
    "settings.uiLanguage": "\u041C\u043E\u0432\u0430 \u0456\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0443",
    "settings.uiLanguageNote": "\u043C\u0435\u043D\u044E \u0439 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0438 \u0422\u0438\u0446\u044C; \u0442\u0435, \u0447\u043E\u0433\u043E \u0432\u0456\u043D \u043D\u0430\u0432\u0447\u0430\u0454, \u043B\u0438\u0448\u0430\u0454\u0442\u044C\u0441\u044F \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E",
    "ui.recommended": "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E",
    "ui.add": "\u0414\u043E\u0434\u0430\u0442\u0438",
    "ui.remove": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 {item}",
    "ui.reportSubject": "\u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "ui.reportAsk": "\u0429\u043E \u0441\u0442\u0430\u043B\u043E\u0441\u044F?",
    "ui.reportAttach": "\u0417\u0432\u0456\u0442 \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u043E \u0432 \u041F\u0440\u043E\u0432\u0456\u0434\u043D\u0438\u043A\u0443: \u0431\u0443\u0434\u044C \u043B\u0430\u0441\u043A\u0430, \u043F\u0440\u0438\u043A\u0440\u0456\u043F\u0456\u0442\u044C \xAB{file}\xBB.",
    "ui.reportTitle": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
    "ui.reportWhat": "\u0429\u043E \u0441\u0442\u0430\u043B\u043E\u0441\u044F",
    "ui.reportDrag": "**\u0417\u0432\u0456\u0442:** \u043F\u0435\u0440\u0435\u0442\u044F\u0433\u043D\u0456\u0442\u044C `{file}` \u0441\u044E\u0434\u0438 \u0437 \u041F\u0440\u043E\u0432\u0456\u0434\u043D\u0438\u043A\u0430 (\u0436\u0443\u0440\u043D\u0430\u043B\u0438 \u0422\u0438\u0446\u044C, \u0431\u0435\u0437 \u0432\u0430\u0448\u043E\u0433\u043E \u0456\u043C\u0435\u043D\u0456 \u0439 \u043A\u043B\u044E\u0447\u0456\u0432).",
    "setup.step1": "\u0412\u0430\u0448\u0430 \u043C\u043E\u0432\u0430",
    "setup.step2": "\u0426\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440",
    "setup.step3": "\u0429\u043E \u0432\u0430\u043C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u043E",
    "setup.step4": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
    "setup.cap1": "\u0422\u0438\u0446\u044C \u043D\u0430\u0432\u0447\u0430\u0454 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457",
    "setup.cap2": "\u043D\u0430 \u0447\u043E\u043C\u0443 \u0442\u0443\u0442 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438\u043C\u0435 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.cap3": "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E \u0434\u043B\u044F \u0446\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "setup.cap4": "\u043E\u0434\u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0430, \u0434\u0430\u043B\u0456 \u0432\u0441\u0435 \u0441\u0430\u043C\u0435",
    "setup.stepOf": "\u041A\u0440\u043E\u043A {step} \u0437 {total}",
    "setup.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "setup.finish": "\u0413\u043E\u0442\u043E\u0432\u043E",
    "setup.next": "\u0414\u0430\u043B\u0456",
    "setup.back": "\u041D\u0430\u0437\u0430\u0434",
    "setup.skip": "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u0438",
    "setup.languageNote": "\u043D\u0430 \u043D\u0435\u0457 \u0422\u0438\u0446\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u0439 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454 \u0457\u0457 \u0432 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u0456; \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0432\u0456\u043D \u043D\u0430\u0432\u0447\u0430\u0454",
    "setup.windowsIn": "Windows \u043D\u0430\u043B\u0430\u0448\u0442\u043E\u0432\u0430\u043D\u043E \u043C\u043E\u0432\u043E\u044E \xAB{lang}\xBB: \u0440\u0430\u0434\u0438\u043C\u043E \u0442\u0443 \u0441\u0430\u043C\u0443.",
    "setup.otherLanguages": "\u0406\u043D\u0448\u0456 \u043C\u043E\u0432\u0438, \u044F\u043A\u0438\u043C\u0438 \u0432\u0438 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0454\u0442\u0435\u0441\u044F",
    "setup.addLanguage": "\u0414\u043E\u0434\u0430\u0442\u0438 \u043C\u043E\u0432\u0443",
    "setup.addLanguageNote": "\u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043D\u0435 \u0432\u0438\u0431\u0435\u0440\u0435 \u0456\u043D\u0448\u043E\u0457; \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0456 \u0442\u0435\u043A\u0441\u0442 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430 \u0432\u0433\u0430\u0434\u0443\u044E\u0442\u044C \u0441\u0435\u0440\u0435\u0434 \u043D\u0438\u0445",
    "setup.pickLanguage": "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043C\u043E\u0432\u0443",
    "setup.always": "\u0437\u0430\u0432\u0436\u0434\u0438",
    "setup.lookingCard": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443\u2026",
    "setup.noCard": "\u0432\u043B\u0430\u0441\u043D\u043E\u0457 \u043D\u0435\u043C\u0430\u0454",
    "setup.onCard": "\u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043C\u043E\u0436\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "setup.onCardNote": "\u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0430 \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time} \u0437 {model} \xB7 \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456 \u0437\u0430 \u043B\u0456\u0447\u0435\u043D\u0456 \u0445\u0432\u0438\u043B\u0438\u043D\u0438",
    "setup.onCpu": "\u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "setup.onCpuNote": "\u043D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0430 \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time} \u0437 {model} \xB7 \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456 \u0437\u0430 \u2248{hour}",
    "setup.hardware": "\u041E\u0431\u043B\u0430\u0434\u043D\u0430\u043D\u043D\u044F",
    "setup.processor": "\u041F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "setup.cpuLooking": "{cpu} \xB7 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E\u2026",
    "setup.cpuCores": { one: "{cpu} \xB7 {n} \u044F\u0434\u0440\u043E", few: "{cpu} \xB7 {n} \u044F\u0434\u0440\u0430", many: "{cpu} \xB7 {n} \u044F\u0434\u0435\u0440", other: "{cpu} \xB7 {n} \u044F\u0434\u0440\u0430" },
    "setup.laptop": "\u043D\u043E\u0443\u0442\u0431\u0443\u043A",
    "setup.memory": "\u041F\u0430\u043C\u2019\u044F\u0442\u044C",
    "setup.graphicsCard": "\u0412\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "setup.means": "\u0429\u043E \u0446\u0435 \u043E\u0437\u043D\u0430\u0447\u0430\u0454",
    "setup.useCard": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "setup.stillLooking": "\u0429\u0435 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E \u0446\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440; \xAB\u0414\u0430\u043B\u0456\xBB \u043D\u0435 \u0447\u0435\u043A\u0430\u0454, \u043F\u043E\u0440\u0430\u0434\u0430 \u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u0432\u0441\u0435 \u0441\u0442\u0430\u043D\u0435 \u0432\u0456\u0434\u043E\u043C\u043E.",
    "setup.noTranslator": "\u0434\u043B\u044F \u0446\u0456\u0454\u0457 \u043C\u043E\u0432\u0438 \u043F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u043E\u0444\u043B\u0430\u0439\u043D-\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447\u0430",
    "setup.translatorHere": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447 {pair} \u0443\u0436\u0435 \u0442\u0443\u0442",
    "setup.translatorOnce": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447 {pair} \xB7 {size}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.dictReady": "\u0441\u043B\u043E\u0432\u043D\u0438\u043A \u0443\u0436\u0435 \u0442\u0443\u0442",
    "setup.dictOnce": "\u0441\u043B\u043E\u0432\u043D\u0438\u043A \xB7 \u043A\u0456\u043B\u044C\u043A\u0430 \u041C\u0411, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.dictComing": "\u0441\u043B\u043E\u0432\u043D\u0438\u043A \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F",
    "setup.dictNone": "\u0434\u043B\u044F \u0446\u0456\u0454\u0457 \u043C\u043E\u0432\u0438 \u043F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u0441\u043B\u043E\u0432\u043D\u0438\u043A\u0430",
    "setup.toDownload": "\u0414\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{size}",
    "setup.onDisk": "{size} \u043D\u0430 \u0434\u0438\u0441\u043A\u0443 \u043F\u0456\u0441\u043B\u044F \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.freeOn": "{size} \u0432\u0456\u043B\u044C\u043D\u043E \u043D\u0430 {drive}",
    "setup.freeUnknown": "\u0432\u0456\u043B\u044C\u043D\u0435 \u043C\u0456\u0441\u0446\u0435 \u043D\u0435\u0432\u0456\u0434\u043E\u043C\u0435",
    "setup.noRoom": "\u041D\u0435 \u0432\u0438\u0441\u0442\u0430\u0447\u0430\u0454 \u043C\u0456\u0441\u0446\u044F: \u0432\u0438\u043C\u043A\u043D\u0456\u0442\u044C \u0449\u043E\u0441\u044C \u0430\u0431\u043E \u0437\u0432\u0456\u043B\u044C\u043D\u0456\u0442\u044C \u043C\u0456\u0441\u0446\u0435.",
    "setup.alwaysGroup": "\u0417\u0430\u0432\u0436\u0434\u0438",
    "setup.listenTranslate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441",
    "setup.alwaysOn": "\u0437\u0430\u0432\u0436\u0434\u0438 \u0432\u0432\u0456\u043C\u043A\u043D\u0435\u043D\u043E",
    "setup.voice": "\u0413\u043E\u043B\u043E\u0441",
    "setup.naturalHere": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \xB7 \u0443\u0436\u0435 \u0442\u0443\u0442",
    "setup.naturalSize": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \xB7 {size}",
    "setup.windowsVoice": "\u0413\u043E\u043B\u043E\u0441 Windows",
    "setup.keyboard": "\u0420\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "setup.badgeNote": "\u043D\u0435\u0432\u0435\u043B\u0438\u043A\u0438\u0439 \u0437\u043D\u0430\u0447\u043E\u043A \u0449\u043E\u0440\u0430\u0437\u0443, \u044F\u043A \u0437\u043C\u0456\u043D\u044E\u0454\u0442\u044C\u0441\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "setup.speech": "\u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.dictateNote": "{why} \xB7 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F {engine} + \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size}",
    "setup.transcribe": "\u0420\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456 \u0439 \u0444\u0430\u0439\u043B\u0438",
    "setup.transcribeNote": "{why} \xB7 \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size}",
    "setup.transcribeNoteEngine": "{why} \xB7 \u043C\u043E\u0434\u0435\u043B\u044C {model}: {size} + \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F {engine}",
    "setup.speakers": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432",
    "setup.startWithWindows": "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u0438 \u0437 Windows",
    "setup.allOfIt": "\u0420\u0430\u0437\u043E\u043C",
    "setup.keysLater": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456 \u0437\u0430\u0434\u0430\u044E\u0442\u044C\u0441\u044F \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \u043A\u043E\u0436\u043D\u043E\u0457 \u0434\u0456\u0457; \u0443\u0441\u0435 \u0442\u0443\u0442 \u043C\u043E\u0436\u043D\u0430 \u0437\u043C\u0456\u043D\u0438\u0442\u0438 \u043F\u0456\u0437\u043D\u0456\u0448\u0435 \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445.",
    "setup.voicesHour": "\u0433\u043E\u043B\u043E\u0441\u0438 \u0433\u043E\u0434\u0438\u043D\u0438 \u0437\u0430\u043F\u0438\u0441\u0443 \u2014 \u0437\u0430 \u2248{time} \u0442\u0443\u0442",
    "setup.runsOnCpu": "\u041F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "setup.runsOn": "\u0414\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "setup.advisedCard": "\u0434\u043B\u044F \u0446\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430 \u0440\u0430\u0434\u0438\u043C\u043E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "setup.advisedCpu": "\u0434\u043B\u044F \u0446\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430 \u0440\u0430\u0434\u0438\u043C\u043E \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "setup.downloading": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F",
    "setup.toDownloadGroup": "\u0429\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "setup.then": "\u041F\u043E\u0442\u0456\u043C",
    "setup.test": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u043C\u043E\u0434\u0435\u043B\u0456 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F, \u043A\u043E\u043B\u0438 \u0432\u043E\u043D\u0438 \u0431\u0443\u0434\u0443\u0442\u044C \u0442\u0443\u0442",
    "setup.testNote": "\u043A\u043E\u0436\u043D\u0430 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u043E\u0431\u043B\u044F\u0454 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0437\u0430\u043F\u0438\u0441, \u0445\u0432\u0438\u043B\u0438\u043D\u0443-\u0434\u0432\u0456 \u0443 \u0444\u043E\u043D\u0456; \u0442\u043E\u0434\u0456 \u0447\u0430\u0441 \u0442\u0443\u0442 \u0431\u0443\u0434\u0435 \u0432\u0438\u043C\u0456\u0440\u044F\u043D\u043E \u0441\u0430\u043C\u0435 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "setup.canClose": "\u041C\u043E\u0436\u043D\u0430 \u0437\u0430\u043A\u0440\u0438\u0442\u0438 \u0446\u0435 \u0432\u0456\u043A\u043D\u043E: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0443\u0442\u044C, \u0430 \xAB\u0413\u043E\u043B\u043E\u0432\u043D\u0430\xBB \u043F\u043E\u043A\u0430\u0436\u0435, \u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044F.",
    "setup.notStarted": "\u0429\u0435 \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043F\u043E\u0447\u0430\u043B\u043E\u0441\u044F: \u043F\u043E\u0432\u0435\u0440\u043D\u0456\u0442\u044C\u0441\u044F \u0434\u043E \xAB\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438\xBB \u0430\u0431\u043E \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \xAB\u0413\u043E\u0442\u043E\u0432\u043E\xBB, \u0449\u043E\u0431 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u0442\u0438 \u0432\u0441\u0435 \u043F\u0456\u0437\u043D\u0456\u0448\u0435 \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430\u0445.",
    "setup.here": "\u0443\u0436\u0435 \u0442\u0443\u0442",
    "setup.hereAlready": "\u0443\u0436\u0435 \u0442\u0443\u0442",
    "setup.starting": "\u043F\u043E\u0447\u0438\u043D\u0430\u0454\u0442\u044C\u0441\u044F\u2026",
    "setup.coming": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F\u2026",
    "setup.pythonManager": "\u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python",
    "setup.packages": "\u043F\u0430\u043A\u0435\u0442\u0438 \xB7 \u0432\u0456\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u0430 \u0437\u0430\u043A\u0440\u0438\u0442\u0438, \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0435",
    "setup.installFailed": "\u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F",
    "setup.next2": "\u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0430 \u0432 \u0447\u0435\u0440\u0437\u0456",
    "setup.afterEngine": "\u043F\u0456\u0441\u043B\u044F \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.why.voiceWeak": "\u0433\u043E\u043B\u043E\u0441 Windows \u043C\u0438\u0442\u0442\u0454\u0432\u0438\u0439; \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0440\u043E\u0431\u0438\u0432 \u0431\u0438 \u043F\u0430\u0443\u0437\u0438 \u043C\u0456\u0436 \u0440\u0435\u0447\u0435\u043D\u043D\u044F\u043C\u0438 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "setup.why.voice": "\u0447\u0438\u0442\u0430\u0454 \u044F\u043A \u043B\u044E\u0434\u0438\u043D\u0430; \u0446\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440 \u0441\u0438\u043D\u0442\u0435\u0437\u0443\u0454 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0448\u0432\u0438\u0434\u0448\u0435, \u043D\u0456\u0436 \u0432\u043E\u043D\u043E \u0437\u0432\u0443\u0447\u0438\u0442\u044C",
    "setup.why.autoFix": "{lang} \u0439 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430 \u043C\u0430\u044E\u0442\u044C \u043E\u0434\u043D\u0443 \u043A\u043B\u0430\u0432\u0456\u0430\u0442\u0443\u0440\u0443: \u0441\u043B\u043E\u0432\u043E, \u043D\u0430\u0431\u0440\u0430\u043D\u0435 \u043D\u0435 \u0432 \u0442\u0456\u0439 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u0446\u0456, \u0431\u0443\u0434\u0435 \u043F\u0435\u0440\u0435\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
    "setup.why.autoFixLatin": "\u0432\u0430\u0448\u0430 \u043C\u043E\u0432\u0430 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u043B\u0430\u0442\u0438\u043D\u0441\u044C\u043A\u0443 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443; \u0443\u0432\u0456\u043C\u043A\u043D\u0456\u0442\u044C, \u044F\u043A\u0449\u043E \u043F\u0438\u0448\u0435\u0442\u0435 \u0449\u0435 \u0439 \u0456\u043D\u0448\u043E\u044E",
    "setup.why.gpu": "\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456: \u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{card}, \u0430 \u043D\u0435 \u2248{cpu}",
    "setup.why.noGpu": "\u043D\u0435\u043C\u0430\u0454 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438 NVIDIA, \u044F\u043A\u0430 \u0431 \u0446\u0435 \u043F\u043E\u0442\u044F\u0433\u043D\u0443\u043B\u0430; \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "setup.why.dictate": "{model} \u0437\u0430\u043F\u0438\u0441\u0443\u0454 \u0444\u0440\u0430\u0437\u0443 \u0437\u0430 \u2248{time} \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "setup.why.transcribe": "{model}: \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456 \u0437\u0430 \u2248{time} \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "setup.why.transcribeCard": "{model}: \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456 \u0437\u0430 \u2248{time} \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456, \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456 \u0448\u0432\u0438\u0434\u0448\u0435",
    "setup.why.transcribeRough": "\u043C\u043E\u0436\u043B\u0438\u0432\u043E, \u0430\u043B\u0435 \u0442\u0443\u0442 \u043D\u0435\u0442\u043E\u0447\u043D\u043E: {model} \u0437\u0430\u043F\u0438\u0441\u0443\u0454 \u0433\u043E\u0434\u0438\u043D\u0443 \u0437\u0430 \u2248{time}",
    "setup.why.transcribeSlow": "\u043C\u043E\u0436\u043B\u0438\u0432\u043E, \u0430\u043B\u0435 \u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E: {model} \u0437\u0430\u043F\u0438\u0441\u0443\u0454 \u0433\u043E\u0434\u0438\u043D\u0443 \u0437\u0430 \u2248{time}",
    "setup.why.speakers": "\u0433\u043E\u043B\u043E\u0441\u0438 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u044E\u0442\u044C\u0441\u044F \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456: \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0430 \u2248{time}",
    "setup.why.speakersSlow": "\u043C\u043E\u0436\u043B\u0438\u0432\u043E, \u0430\u043B\u0435 \u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E: \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456 \u0433\u043E\u043B\u043E\u0441\u0438 \u0433\u043E\u0434\u0438\u043D\u0438 \u0437\u0430\u043F\u0438\u0441\u0443 \u0437\u0430\u0439\u043C\u0430\u044E\u0442\u044C \u2248{time}",
    "setup.why.startWithWindows": "\u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u043F\u0440\u0430\u0446\u044E\u044E\u0442\u044C \u0437 \u043F\u0435\u0440\u0448\u043E\u0457 \u0445\u0432\u0438\u043B\u0438\u043D\u0438",
    "setup.item.translator": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447 {pair}",
    "setup.item.translatorNote": "Firefox Translations, \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \xB7 \u0434\u0430\u043B\u0456 \u0431\u0435\u0437 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443",
    "setup.item.dictionary": "\u0421\u043B\u043E\u0432\u043D\u0438\u043A",
    "setup.item.dictionaryNote": "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0438\u0445 \u0441\u043B\u0456\u0432, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "setup.item.voice": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441",
    "setup.item.voiceNote": "Kokoro \xB7 \u0447\u0438\u0442\u0430\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "setup.item.engine": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "setup.item.engineNote": "{parts} \xB7 {size} \u043D\u0430 \u0434\u0438\u0441\u043A\u0443",
    "setup.item.core": "\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0432 \u0442\u0435\u043A\u0441\u0442",
    "setup.item.gpu": "\u0447\u0430\u0441\u0442\u0438\u043D\u0430 \u0434\u043B\u044F \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438",
    "setup.item.speakers": "\u0447\u0430\u0441\u0442\u0438\u043D\u0430 \xAB\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432\xBB",
    "rec.check": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0439 \u0440\u043E\u0437\u043C\u043E\u0432\u0430",
    "rec.dictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F",
    "rec.voice": "\u0413\u043E\u043B\u043E\u0441",
    "rec.transcribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456",
    "rec.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E",
    "rec.speechModels": "\u0410\u0432\u0442\u043E\u0432\u0438\u0431\u0456\u0440 \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "rec.speed": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0448\u0432\u0438\u0434\u043A\u0456\u0441\u0442\u044C",
    "rec.accuracy": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0442\u043E\u0447\u043D\u0456\u0441\u0442\u044C",
    "rec.dictateTranscribe": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0438",
    "rec.naturalVoice": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441",
    "speech.sec": "{n} \u0441",
    "speech.min": "{n} \u0445\u0432",
    "speech.h": "{h} \u0433\u043E\u0434",
    "speech.hMin": "{h} \u0433\u043E\u0434 {m} \u0445\u0432",
    "speech.perPhrase": "\u2248{time} \u043D\u0430 \u0444\u0440\u0430\u0437\u0443",
    "speech.perHour": "\u2248{time} \u043D\u0430 \u0433\u043E\u0434\u0438\u043D\u0443 \u0437\u0430\u043F\u0438\u0441\u0443",
    "speech.basisMeasured": "\u0432\u0438\u043C\u0456\u0440\u044F\u043D\u043E \u0442\u0443\u0442",
    "speech.basisScaled": "\u0437\u0430 \u0442\u0435\u0441\u0442\u043E\u043C \u0446\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "speech.basisGuess": "\u043F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u044F \u043E\u0446\u0456\u043D\u043A\u0430",
    "speech.aboutTiny": "\u043D\u0430\u0439\u0448\u0432\u0438\u0434\u0448\u0430, \u0433\u0440\u0443\u0431\u0430",
    "speech.aboutBase": "\u0448\u0432\u0438\u0434\u043A\u0430, \u043D\u0435\u043F\u043E\u0433\u0430\u043D\u0430",
    "speech.aboutSmall": "\u0434\u043E\u0431\u0440\u0430",
    "speech.aboutTurbo": "\u0434\u0443\u0436\u0435 \u0434\u043E\u0431\u0440\u0430",
    "speech.aboutLarge": "\u043D\u0430\u0439\u0442\u043E\u0447\u043D\u0456\u0448\u0430, \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0430",
    "speech.aboutParakeet": "\u0434\u0443\u0436\u0435 \u0434\u043E\u0431\u0440\u0430 \u0439 \u0448\u0432\u0438\u0434\u043A\u0430 \xB7 25 \u0454\u0432\u0440\u043E\u043F\u0435\u0439\u0441\u044C\u043A\u0438\u0445 \u043C\u043E\u0432",
    "speech.whyTooBig": "\u0437\u0430\u0432\u0435\u043B\u0438\u043A\u0430 \u0434\u043B\u044F \u0446\u0456\u0454\u0457 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438",
    "speech.whyMemory": "\u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0454 \u0431\u0456\u043B\u044C\u0448\u0435 \u043F\u0430\u043C\u2019\u044F\u0442\u0456, \u043D\u0456\u0436 \u043C\u0430\u0454 \u0446\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440",
    "speech.whyLanguage": "\u043D\u0435 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u0443\u0454 \u0432\u0430\u0448\u0443 \u043C\u043E\u0432\u0443",
    "speech.whyLanguages": "\u043F\u0456\u0434\u0442\u0440\u0438\u043C\u0443\u0454 \u043D\u0435 \u0432\u0441\u0456 \u0432\u0430\u0448\u0456 \u043C\u043E\u0432\u0438",
    "speech.show": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438",
    "speech.kbFolder": "\u041F\u0430\u043F\u043A\u0430 \u0431\u0430\u0437\u0438 \u0437\u043D\u0430\u043D\u044C",
    "speech.kbSet": "\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u044C: {folder}",
    "speech.removing": "\u0412\u0438\u0434\u0430\u043B\u0435\u043D\u043D\u044F \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F\u2026",
    "speech.removingPart": "\u0412\u0438\u0434\u0430\u043B\u0435\u043D\u043D\u044F \u0447\u0430\u0441\u0442\u0438\u043D\u0438 \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F\u2026",
    "speech.backSoon": "\u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0430\u0440\u0430\u0437 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F",
    "speech.stepTool": "\u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python; \u0432\u0456\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u0430 \u0437\u0430\u043A\u0440\u0438\u0442\u0438, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0435",
    "speech.stepPackages": "\u043F\u0430\u043A\u0435\u0442\u0438; \u0432\u0456\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u0430 \u0437\u0430\u043A\u0440\u0438\u0442\u0438, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0435",
    "speech.dlSpeakers": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0447\u0430\u0441\u0442\u0438\u043D\u0438 \u0434\u043B\u044F \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432",
    "speech.dlEngine": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "speech.needsDictate": "\u0414\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.needsTranscribe": "\u0414\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0456\u0432 \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.needs": "\xAB{feature}\xBB: \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.dlStopped": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0437\u0443\u043F\u0438\u043D\u0438\u043B\u043E\u0441\u044F: {why}",
    "speech.unknownError": "\u043D\u0435\u0432\u0456\u0434\u043E\u043C\u0430 \u043F\u043E\u043C\u0438\u043B\u043A\u0430",
    "speech.dlOffer": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 {size}, \u0434\u0430\u043B\u0456 \u043F\u0440\u0430\u0446\u044E\u0454 \u043E\u0444\u043B\u0430\u0439\u043D; {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0443 (\u0437 \u043C\u043E\u0434\u0435\u043B\u043B\u044E {model})",
    "speech.needsFree": "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E {need} \u0432\u0456\u043B\u044C\u043D\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F; \u043D\u0430 {drive} \u0454 {free}",
    "speech.needsFreeAbout": "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u2248{need} \u0432\u0456\u043B\u044C\u043D\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F; \u043D\u0430 {drive} \u0454 {free}",
    "speech.freeOn": "\u0432\u0456\u043B\u044C\u043D\u043E {free} \u043D\u0430 {drive}",
    "speech.useGpu": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443",
    "speech.gpuMore": "\u0449\u0435 {size} \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F; \u0444\u0440\u0430\u0437\u0430 \u0437\u0430\u0439\u043C\u0430\u0454 \u0431\u043B\u0438\u0437\u044C\u043A\u043E {gpu} \u0437\u0430\u043C\u0456\u0441\u0442\u044C {cpu} ({card})",
    "speech.starting": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F\u2026",
    "speech.notRunning": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "speech.itStopped": "\u0432\u0456\u043D \u0437\u0443\u043F\u0438\u043D\u0438\u0432\u0441\u044F",
    "speech.restart": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438",
    "speech.onCard": "\u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "speech.onProcessor": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "speech.onMetal": "\u043D\u0430 \u0433\u0440\u0430\u0444\u0456\u0446\u0456 Apple (Metal)",
    "speech.sharedDictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0442\u0435\u0436 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "speech.sharedTranscribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0442\u0435\u0436 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "speech.keptDictate": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430 \u0434\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456, \u044F\u043A\u0449\u043E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u0456\u0434\u0432\u0435\u0434\u0435",
    "speech.keptTranscribe": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430 \u0434\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0456\u0432 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456, \u044F\u043A\u0449\u043E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u0456\u0434\u0432\u0435\u0434\u0435",
    "speech.keptBoth": "\u0437\u0430\u043F\u0430\u0441\u043D\u0430 \u0434\u043B\u044F \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0433\u043E \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0456\u0432 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456, \u044F\u043A\u0449\u043E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u0456\u0434\u0432\u0435\u0434\u0435",
    "speech.budgetPhrase": "\u0444\u0440\u0430\u0437\u0430 \u0437\u0430 \u2248{time}",
    "speech.budgetHour": "\u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0430\u043F\u0438\u0441\u0443 \u0437\u0430 \u2248{time}",
    "speech.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E",
    "speech.autoNote": "\u043D\u0430\u0439\u0442\u043E\u0447\u043D\u0456\u0448\u0430 \u043C\u043E\u0434\u0435\u043B\u044C, \u0434\u043E\u0441\u0442\u0430\u0442\u043D\u044C\u043E \u0448\u0432\u0438\u0434\u043A\u0430 \u0442\u0443\u0442: {budget}",
    "speech.usesNow": "\u0437\u0430\u0440\u0430\u0437 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 {model}",
    "speech.autoCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456: \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043B\u0438\u0448\u0430\u0454\u0442\u044C\u0441\u044F \u0432\u0430\u0448\u0438\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430\u043C",
    "speech.autoMoves": "\u043F\u0435\u0440\u0435\u0439\u0434\u0435 \u043D\u0430 {model} \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456, \u0449\u043E\u0439\u043D\u043E \u0457\u0457 \u0431\u0443\u0434\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E, \u0456 \u0437\u0430\u043B\u0438\u0448\u0438\u0442\u044C \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u0432\u0430\u0448\u0438\u043C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430\u043C",
    "speech.slower": "\u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0456\u0448\u0430, \u043D\u0456\u0436 \u0437\u0430\u0437\u0432\u0438\u0447\u0430\u0439",
    "speech.sizeHere": "{size} \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "speech.sizePick": "{size}, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "speech.autoUses": "\u0417\u0430\u0440\u0430\u0437 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E\xBB",
    "speech.notUsedNow": "\u0437\u0430\u0440\u0430\u0437 \u043D\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F",
    "speech.removeModel": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 {model} ({size}); \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443, \u043A\u043E\u043B\u0438 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "speech.prefers": "\u0410\u0432\u0442\u043E\u0432\u0438\u0431\u0456\u0440 \u043D\u0430\u0434\u0430\u0454 \u043F\u0435\u0440\u0435\u0432\u0430\u0433\u0443",
    "speech.preferSpeedNote": "\u0448\u0432\u0438\u0434\u0448\u0438\u043C \u043C\u043E\u0434\u0435\u043B\u044F\u043C, \u0442\u0440\u043E\u0445\u0438 \u043C\u0435\u043D\u0448 \u0442\u043E\u0447\u043D\u0438\u043C",
    "speech.preferAccNote": "\u043D\u0430\u0439\u0442\u043E\u0447\u043D\u0456\u0448\u0438\u043C \u043C\u043E\u0434\u0435\u043B\u044F\u043C, \u044F\u043A\u0456 \u0446\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440 \u0432\u0441\u0442\u0438\u0433\u0430\u0454 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u0438",
    "speech.accuracy": "\u0422\u043E\u0447\u043D\u0456\u0441\u0442\u044C",
    "speech.speed": "\u0428\u0432\u0438\u0434\u043A\u0456\u0441\u0442\u044C",
    "speech.gpuTitle": "\u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "speech.installed": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    "speech.gpuOffer": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 {size}; \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u0441\u0442\u0430\u043D\u0443\u0442\u044C \u0443 \u043A\u0456\u043B\u044C\u043A\u0430 \u0440\u0430\u0437\u0456\u0432 \u0448\u0432\u0438\u0434\u0448\u0438\u043C\u0438",
    "speech.add": "\u0414\u043E\u0434\u0430\u0442\u0438",
    "speech.testWaits": "\u0447\u0435\u043A\u0430\u0454, \u043F\u043E\u043A\u0438 \u0440\u0443\u0448\u0456\u0439 \u0437\u0432\u0456\u043B\u044C\u043D\u0438\u0442\u044C\u0441\u044F",
    "speech.testStep": "{model} \xB7 \u043A\u0440\u043E\u043A {n} \u0437 {total}",
    "speech.testStarting": "\u0437\u0430\u043F\u0443\u0441\u043A",
    "speech.testing": "\u0422\u0435\u0441\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0446\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "speech.testAsk": "\u041F\u0440\u043E\u0442\u0435\u0441\u0442\u0443\u0432\u0430\u0442\u0438 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440, \u0449\u043E\u0431 \u043F\u0456\u0434\u0456\u0431\u0440\u0430\u0442\u0438 \u043D\u0430\u0439\u043A\u0440\u0430\u0449\u0456 \u043C\u043E\u0434\u0435\u043B\u0456 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F?",
    "speech.testNoteOne": "\u041A\u043E\u0436\u043D\u0430 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u043E\u0431\u043B\u044F\u0454 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0437\u0430\u043F\u0438\u0441 \u0443 \u0444\u043E\u043D\u0456, \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0445\u0432\u0438\u043B\u0438\u043D\u0443. \u0414\u043E\u0442\u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u0438\u0439 \u0447\u0430\u0441 \u2014 \u043B\u0438\u0448\u0435 \u043E\u0446\u0456\u043D\u043A\u0430.",
    "speech.testNoteMany": "\u041A\u043E\u0436\u043D\u0430 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043E\u0431\u0440\u043E\u0431\u043B\u044F\u0454 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0437\u0430\u043F\u0438\u0441 \u0443 \u0444\u043E\u043D\u0456, \u0445\u0432\u0438\u043B\u0438\u043D\u0443-\u0434\u0432\u0456. \u0414\u043E\u0442\u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u0438\u0439 \u0447\u0430\u0441 \u2014 \u043B\u0438\u0448\u0435 \u043E\u0446\u0456\u043D\u043A\u0430.",
    "speech.testRun": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438 \u0442\u0435\u0441\u0442",
    "speech.cores": { one: "{n} \u044F\u0434\u0440\u043E", few: "{n} \u044F\u0434\u0440\u0430", many: "{n} \u044F\u0434\u0435\u0440", other: "{n} \u044F\u0434\u0440\u0430" },
    "speech.laptop": "\u043D\u043E\u0443\u0442\u0431\u0443\u043A",
    "speech.noCard": "\u0431\u0435\u0437 \u0432\u043B\u0430\u0441\u043D\u043E\u0457 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438",
    "speech.lookingCard": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443\u2026",
    "speech.measured": "\u0447\u0430\u0441 \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0432\u0438\u043C\u0456\u0440\u044F\u043D\u043E \u0442\u0443\u0442",
    "speech.guesses": "\u0434\u043E \u0442\u0435\u0441\u0442\u0443 \u0447\u0430\u0441 \u2014 \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u044F \u043E\u0446\u0456\u043D\u043A\u0430",
    "speech.testedLater": "\u0442\u0435\u0441\u0442 \u2014 \u043A\u043E\u043B\u0438 \u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.testAgain": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0438 \u0442\u0435\u0441\u0442",
    "speech.test": "\u0422\u0435\u0441\u0442",
    "speech.rightNow": "\u0417\u0430\u0440\u0430\u0437",
    "speech.whoSpoke": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432",
    "speech.nothingLoaded": "\u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E: \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u0439 \u043F\u0430\u043C\u2019\u044F\u0442\u044C \u0432\u0456\u043B\u044C\u043D\u0456 \u0434\u043B\u044F \u0432\u0430\u0448\u0438\u0445 \u043F\u0440\u043E\u0433\u0440\u0430\u043C",
    "speech.heldCard": "\u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456: {list}",
    "speech.nothingCard": "\u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456 \u043D\u0456\u0447\u043E\u0433\u043E",
    "speech.heldCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456: {list}",
    "speech.letGo": "\u0437\u0432\u0456\u043B\u044C\u043D\u044F\u0454\u0442\u044C\u0441\u044F \u043F\u0456\u0441\u043B\u044F 3 \u0445\u0432\u0438\u043B\u0438\u043D \u043F\u0440\u043E\u0441\u0442\u043E\u044E",
    "speech.cardNone": "\u0432\u043B\u0430\u0441\u043D\u043E\u0457 \u043D\u0435\u043C\u0430\u0454 \xB7 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0431\u0440\u043E\u0431\u043B\u044F\u0454 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "speech.looking": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E\u2026",
    "speech.cardNotNvidia": "{name} \xB7 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0431\u0440\u043E\u0431\u043B\u044F\u0454 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440: \u043F\u043E\u043A\u0438 \u0449\u043E \u0446\u0435 \u0432\u043C\u0456\u044E\u0442\u044C \u043B\u0438\u0448\u0435 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438 NVIDIA",
    "speech.cardTooSmall": "{name} \xB7 \u0437\u0430\u0441\u0442\u0430\u0440\u0430 \u0430\u0431\u043E \u0437\u0430\u0441\u043B\u0430\u0431\u043A\u0430 \u0434\u043B\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \xB7 \u043F\u0440\u0430\u0446\u044E\u0454 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "speech.cardAddPart": "{name} \xB7 \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u0457\u0457 \u0447\u0430\u0441\u0442\u0438\u043D\u0443, \u0449\u043E\u0431 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438",
    "speech.cardFallback": "{name} \xB7 \u043D\u0435 \u043F\u0440\u0438\u0439\u043D\u044F\u043B\u0430 \u043C\u043E\u0434\u0435\u043B\u044C, \u0442\u043E\u0436 \u043F\u0440\u0430\u0446\u044E\u0454 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "speech.cardCpuPlan": "{name}, \u0430\u043B\u0435 \u0440\u0443\u0448\u0456\u0439 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "speech.cardOn": "{name} \xB7 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u043D\u0456\u0439",
    "speech.cardMetal": "{name} \xB7 Whisper turbo \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u043D\u0456\u0439 (Metal)",
    "speech.dzNeedsToken": "\u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 Hugging Face, \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0449\u043E\u0431 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432",
    "speech.dzChecking": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u044E \u043A\u043B\u044E\u0447\u2026",
    "speech.dzDownloading": "\u043A\u043B\u044E\u0447 \u043F\u0440\u0430\u0446\u044E\u0454 \xB7 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E \u043C\u043E\u0434\u0435\u043B\u044C \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432\u2026",
    "speech.dzBadToken": "\u043A\u043B\u044E\u0447 \u043D\u0435 \u0441\u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0432: \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u0439\u043E\u0433\u043E \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E \u0439 \u0441\u0442\u0432\u043E\u0440\u0456\u0442\u044C \u0456\u0437 \u0442\u0438\u043F\u043E\u043C Read",
    "speech.dzNoAccess": "\u043A\u043B\u044E\u0447 \u043F\u0440\u0430\u0446\u044E\u0454, \u0430\u043B\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u0449\u0435 \u043D\u0435 \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0430 \u0434\u043B\u044F \u043D\u044C\u043E\u0433\u043E: \u0437\u0430\u043F\u043E\u0432\u043D\u0456\u0442\u044C \u0444\u043E\u0440\u043C\u0443 \u043D\u0430 \u0457\u0457 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 (\u043A\u0440\u043E\u043A 2), \u043F\u043E\u0442\u0456\u043C \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0437\u043D\u043E\u0432\u0443\xBB",
    "speech.dzFailed": "\u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u043A\u043B\u044E\u0447",
    "speech.dzMissing": "\u043A\u043B\u044E\u0447 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E \xB7 \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437 \u043F\u0435\u0440\u0448\u043E\u044E \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u043E\u044E",
    "speech.dzReady": "\u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0430 \u043C\u0456\u0441\u0446\u0456 \xB7 \u0441\u043F\u0456\u043A\u0435\u0440\u0438 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u044E\u0442\u044C\u0441\u044F \u043E\u0444\u043B\u0430\u0439\u043D, \u043A\u043B\u044E\u0447 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D",
    "speech.voicesModel": "\u041C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u0456\u0432",
    "speech.voicesLater": "\u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0439\u0442\u0435, \u043A\u043E\u043B\u0438 \u0437\u0430\u043F\u0440\u0430\u0446\u044E\u0454 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "speech.card": "\u0412\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430",
    "speech.processor": "\u041F\u0440\u043E\u0446\u0435\u0441\u043E\u0440",
    "speech.voicesHour": "\u0433\u043E\u043B\u043E\u0441\u0438 \u0433\u043E\u0434\u0438\u043D\u0438 \u0437\u0430\u043F\u0438\u0441\u0443 \u0437\u0430 \u2248{time} \u0442\u0443\u0442",
    "speech.advised": "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E",
    "speech.torchCard": "PyTorch \u0434\u043B\u044F \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438 \xB7 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{download} \xB7 {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0443, \u0437\u0430\u043C\u0456\u0441\u0442\u044C \u0447\u0430\u0441\u0442\u0438\u043D\u0438 \u0434\u043B\u044F \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438",
    "speech.torchCpu": "PyTorch \u0434\u043B\u044F \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0430 \xB7 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{download} \xB7 {disk} \u043D\u0430 \u0434\u0438\u0441\u043A\u0443",
    "speech.chosen": "\u0432\u0438\u0431\u0440\u0430\u043D\u043E",
    "speech.use": "\u0412\u0438\u0431\u0440\u0430\u0442\u0438",
    "speech.speakersInfo": "\u0421\u043B\u043E\u0432\u0430 \u0432\u0436\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u044E\u0442\u044C\u0441\u044F. \u0420\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u0438 \u2014 \u0441\u043F\u0440\u0430\u0432\u0430 \u0456\u043D\u0448\u043E\u0457 \u043C\u043E\u0434\u0435\u043B\u0456; \u0432\u043E\u043D\u0430 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 PyTorch, \u0439\u043E\u0433\u043E \u0439 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E\u0442\u044C \u0442\u0443\u0442.",
    "speech.runsOn": "\u0414\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "speech.voicesHere": "\u043C\u043E\u0434\u0435\u043B\u044C \u0433\u043E\u043B\u043E\u0441\u0456\u0432 \u0443\u0436\u0435 \u0454: \u043A\u043B\u044E\u0447 Hugging Face \u043D\u0435 \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D",
    "speech.voicesKey": "\u043F\u043E\u0442\u0456\u043C \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 Hugging Face, \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0456 \u0433\u043E\u043B\u043E\u0441\u0456\u0432",
    "speech.downloadGrp": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
    "speech.whoOnCard": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432, \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "speech.whoOnCpu": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432, \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "speech.dlOnce": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{size}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \xB7 {model}",
    "speech.nowCard": "\u0417\u0430\u0440\u0430\u0437 \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "speech.nowCpu": "\u0417\u0430\u0440\u0430\u0437 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "speech.switchCard": "\u043F\u0435\u0440\u0435\u0445\u0456\u0434 \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{size}; \u0456\u043D\u0448\u0438\u0439 PyTorch \u0431\u0443\u0434\u0435 \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E",
    "speech.switchCpu": "\u043F\u0435\u0440\u0435\u0445\u0456\u0434 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u2248{size}; \u0456\u043D\u0448\u0438\u0439 PyTorch \u0431\u0443\u0434\u0435 \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E",
    "speech.switch": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438",
    "speech.installedCard": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "speech.installedCpu": "\u0412\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "speech.hfKey": "\u041A\u043B\u044E\u0447 Hugging Face",
    "speech.save": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    "speech.replaceKey": "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u043A\u043B\u044E\u0447",
    "speech.checkAgain": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0437\u043D\u043E\u0432\u0443",
    "speech.step1": "\u0417\u0430\u0440\u0435\u0454\u0441\u0442\u0440\u0443\u0439\u0442\u0435\u0441\u044F \u043D\u0430 Hugging Face",
    "speech.step1Rest": ", \u0446\u0435 \u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E.",
    "speech.step2": "\u0412\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 {page} \u0456 \u0437\u0430\u043F\u043E\u0432\u043D\u0456\u0442\u044C \u0444\u043E\u0440\u043C\u0443: Company/university \u2014 \u0431\u0443\u0434\u044C-\u0449\u043E, \u043F\u0456\u0434\u0456\u0439\u0434\u0435 \u0439 \u0432\u0430\u0448\u0435 \u0456\u043C\u2019\u044F; Use case: {use}. \u041F\u043E\u0442\u0456\u043C \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C Agree and access.",
    "speech.step2Page": "\u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0443 \u043C\u043E\u0434\u0435\u043B\u0456",
    "speech.step3": "\u0412\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 {tokens} \u2192 Create new token \u2192 \u0442\u0438\u043F {read} \u2192 \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u043A\u043B\u044E\u0447 hf_\u2026.",
    "speech.step4": "\u0412\u0441\u0442\u0430\u0432\u0442\u0435 \u0439\u043E\u0433\u043E \u0441\u044E\u0434\u0438 \u0439 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \xAB\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438\xBB. \u041C\u043E\u0434\u0435\u043B\u044C \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437; \u0434\u0430\u043B\u0456 \u0432\u0441\u0435 \u043F\u0440\u0430\u0446\u044E\u0454 \u043E\u0444\u043B\u0430\u0439\u043D.",
    "speech.missingPart": "\u0421\u043F\u0456\u043A\u0435\u0440\u0438 \u043F\u043E\u043A\u0438 \u043D\u0435 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u044E\u0442\u044C\u0441\u044F: \u0457\u0445\u043D\u044E \u0447\u0430\u0441\u0442\u0438\u043D\u0443 \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E.",
    "speech.missingKey": "\u0421\u043F\u0456\u043A\u0435\u0440\u0438 \u043F\u043E\u043A\u0438 \u043D\u0435 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u044E\u0442\u044C\u0441\u044F: \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u043A\u043B\u044E\u0447 Hugging Face.",
    "speech.setUp": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u0442\u0438",
    "tr.srcFile": "\u0444\u0430\u0439\u043B",
    "tr.srcMic": "\u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D",
    "tr.srcNote": "\u043D\u043E\u0442\u0430\u0442\u043A\u0430",
    "tr.stageDecode": "\u041F\u0456\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0437\u0432\u0443\u043A\u0443",
    "tr.stageWords": "\u0420\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "tr.stageSpeakers": "\u0420\u043E\u0437\u0440\u0456\u0437\u043D\u0435\u043D\u043D\u044F \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432",
    "tr.stageSave": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F",
    "tr.starting": "\u0417\u0430\u043F\u0443\u0441\u043A",
    "tr.waitingTurn": "\u0427\u0435\u043A\u0430\u0454 \u0447\u0435\u0440\u0433\u0438",
    "tr.fmtText": "\u0422\u0435\u043A\u0441\u0442",
    "tr.fmtSubs": "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u0438",
    "tr.fmtData": "\u0414\u0430\u043D\u0456",
    "tr.auto": "\u0410\u0432\u0442\u043E",
    "tr.filesWaiting": { one: "{n} \u0444\u0430\u0439\u043B \u0447\u0435\u043A\u0430\u0454 \u0447\u0435\u0440\u0433\u0438", few: "{n} \u0444\u0430\u0439\u043B\u0438 \u0447\u0435\u043A\u0430\u044E\u0442\u044C \u0447\u0435\u0440\u0433\u0438", many: "{n} \u0444\u0430\u0439\u043B\u0456\u0432 \u0447\u0435\u043A\u0430\u044E\u0442\u044C \u0447\u0435\u0440\u0433\u0438", other: "{n} \u0444\u0430\u0439\u043B\u0443 \u0447\u0435\u043A\u0430\u044E\u0442\u044C \u0447\u0435\u0440\u0433\u0438" },
    "tr.dropTitle": "\u041F\u0435\u0440\u0435\u0442\u044F\u0433\u043D\u0456\u0442\u044C \u0432\u0456\u0434\u0435\u043E- \u0430\u0431\u043E \u0430\u0443\u0434\u0456\u043E\u0444\u0430\u0439\u043B",
    "tr.dropNote": "\u0441\u044E\u0434\u0438 \u0430\u0431\u043E \u0431\u0443\u0434\u044C-\u043A\u0443\u0434\u0438 \u0443 \u0432\u0456\u043A\u043D\u043E \xB7 mp4, mov, mkv, webm, mp3, m4a, wav\u2026 \xB7 \u0447\u0438\u0442\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u043C\u0456\u0441\u0446\u0456, \u043D\u0435 \u043A\u043E\u043F\u0456\u044E\u0454\u0442\u044C\u0441\u044F \xB7 \u0433\u043E\u0434\u0438\u043D\u0430 \u0437\u0430\u043F\u0438\u0441\u0443 \u0437\u0430\u0439\u043C\u0430\u0454 \u0442\u0443\u0442 \u2248{time}",
    "tr.anHour": "\u0433\u043E\u0434\u0438\u043D\u0443",
    "tr.pick": "\u0412\u0438\u0431\u0440\u0430\u0442\u0438 \u0444\u0430\u0439\u043B\u2026",
    "tr.language": "\u041C\u043E\u0432\u0430",
    "tr.languageNote": "\u0410\u0432\u0442\u043E: \u0432\u0438\u0437\u043D\u0430\u0447\u0430\u0454\u0442\u044C\u0441\u044F \u0437\u0430 \u043F\u0435\u0440\u0448\u0438\u043C\u0438 \u0441\u0435\u043A\u0443\u043D\u0434\u0430\u043C\u0438",
    "tr.speakers": "\u0421\u043F\u0456\u043A\u0435\u0440\u0438",
    "tr.speakersNote": "\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u043B\u044E\u0434\u0435\u0439 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \xB7 \xAB\u0410\u0432\u0442\u043E\xBB \u0432\u0438\u0437\u043D\u0430\u0447\u0438\u0442\u044C \u0441\u0430\u043C\u0435",
    "tr.micTitle": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0437 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D\u0430",
    "tr.micNote": "\u0440\u043E\u0437\u043C\u043E\u0432\u0430, \u043B\u0435\u043A\u0446\u0456\u044F, \u043B\u044E\u0434\u0438 \u0432 \u043A\u0456\u043C\u043D\u0430\u0442\u0456 \xB7 \u0442\u0435\u043A\u0441\u0442 \u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F \u043F\u0456\u0441\u043B\u044F \u0437\u0443\u043F\u0438\u043D\u043A\u0438",
    "tr.record": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438",
    "tr.recording": "\u0417\u0430\u043F\u0438\u0441",
    "tr.stopTranscribe": "\u0417\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0439 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0432\u0430\u0442\u0438",
    "tr.lostPiece": "\u0427\u0430\u0441\u0442\u0438\u043D\u0430 \u0437\u0430\u043F\u0438\u0441\u0443 \u043D\u0435 \u0434\u0456\u0439\u0448\u043B\u0430 \u0434\u043E \u0440\u0443\u0448\u0456\u044F",
    "tr.dropHere": "\u0412\u0456\u0434\u043F\u0443\u0441\u0442\u0456\u0442\u044C, \u0449\u043E\u0431 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0432\u0430\u0442\u0438",
    "tr.needEngine": "\u0414\u043B\u044F \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043E\u043A \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "tr.needEngineNote": "\u0432\u0456\u043D \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \xAB\u0417\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456\xBB",
    "tr.transcribeLink": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456\u2026",
    "tr.startingNote": "\u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0437\u2019\u044F\u0432\u043B\u044F\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u0432\u0456\u043D \u0437\u0430\u043F\u0440\u0430\u0446\u044E\u0454",
    "tr.search": "\u041F\u043E\u0448\u0443\u043A \u0443 \u0432\u0441\u0456\u0445 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430\u0445",
    "tr.new": "\u041D\u043E\u0432\u0430",
    "tr.newTitle": "\u041D\u043E\u0432\u0430 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "tr.needKb": "\u0414\u043B\u044F \u043D\u043E\u0442\u0430\u0442\u043E\u043A \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043F\u0430\u043F\u043A\u0430 \u0431\u0430\u0437\u0438 \u0437\u043D\u0430\u043D\u044C.",
    "tr.choose": "\u0412\u0438\u0431\u0440\u0430\u0442\u0438\u2026",
    "tr.openingLib": "\u0412\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u044E \u0431\u0456\u0431\u043B\u0456\u043E\u0442\u0435\u043A\u0443\u2026",
    "tr.nothing": "\u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E.",
    "tr.emptyTitle": "\u0422\u0443\u0442 \u0431\u0443\u0434\u0443\u0442\u044C \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "tr.tipDrop": "\u041F\u0435\u0440\u0435\u0442\u044F\u0433\u043D\u0456\u0442\u044C \u0432\u0456\u0434\u0435\u043E- \u0430\u0431\u043E \u0430\u0443\u0434\u0456\u043E\u0444\u0430\u0439\u043B \u0443 \u0446\u0435 \u0432\u0456\u043A\u043D\u043E",
    "tr.tipMic": "\u0417\u0430\u043F\u0438\u0448\u0456\u0442\u044C \u0437 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D\u0430 \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \xAB\u0417\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456\xBB",
    "tr.tipNote": "\u041D\u0430\u0434\u0438\u043A\u0442\u0443\u0439\u0442\u0435 \u043D\u043E\u0442\u0430\u0442\u043A\u0443: {keys} \u0443 \u0431\u0443\u0434\u044C-\u044F\u043A\u0456\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0456",
    "tr.failed": "\u043F\u043E\u043C\u0438\u043B\u043A\u0430",
    "tr.recordingChip": "\u0437\u0430\u043F\u0438\u0441",
    "tr.waiting": "\u0443 \u0447\u0435\u0440\u0437\u0456",
    "tr.opening": "\u0412\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u044E\u2026",
    "tr.rename": "\u041F\u0435\u0440\u0435\u0439\u043C\u0435\u043D\u0443\u0432\u0430\u0442\u0438",
    "tr.couldNot": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0432\u0430\u0442\u0438",
    "tr.delete": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438",
    "tr.afterStop": "\u0422\u0435\u043A\u0441\u0442 \u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0437\u0430\u043F\u0438\u0441 \u0437\u0443\u043F\u0438\u043D\u0438\u0442\u044C\u0441\u044F.",
    "tr.background": "\u0412\u0456\u043A\u043D\u043E \u043C\u043E\u0436\u043D\u0430 \u0437\u0430\u043A\u0440\u0438\u0442\u0438: \u0440\u043E\u0431\u043E\u0442\u0430 \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0435 \u0443 \u0444\u043E\u043D\u0456.",
    "tr.startsAfter": "\u041F\u043E\u0447\u043D\u0435\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C\u0441\u044F \u043F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u044F.",
    "tr.loadingModel": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043C\u043E\u0434\u0435\u043B\u0456, \u043F\u043E\u0448\u0443\u043A \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "tr.posMin": "{at} \u0437 {total} \u0445\u0432",
    "tr.posClock": "{at} \u0437 {total}",
    "tr.underMinute": "\u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044F \u043C\u0435\u043D\u0448\u0435 \u0445\u0432\u0438\u043B\u0438\u043D\u0438",
    "tr.minLeft": "\u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044F \u0431\u043B\u0438\u0437\u044C\u043A\u043E {n} \u0445\u0432",
    "tr.copied": "\u0422\u0435\u043A\u0441\u0442 \u0441\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E",
    "tr.saved": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E: {file}",
    "tr.export": "\u0415\u043A\u0441\u043F\u043E\u0440\u0442",
    "tr.toKb": "\u0423 \u0431\u0430\u0437\u0443 \u0437\u043D\u0430\u043D\u044C",
    "tr.inKb": "\u0423 \u0431\u0430\u0437\u0456 \u0437\u043D\u0430\u043D\u044C: {file}",
    "tr.chooseFolder": "\u0412\u0438\u0431\u0440\u0430\u0442\u0438 \u043F\u0430\u043F\u043A\u0443",
    "tr.callsFolder": "\u041F\u0430\u043F\u043A\u0430 \u0434\u0437\u0432\u0456\u043D\u043A\u0456\u0432",
    "tr.callsFolderNote": "\u0437\u0430\u043F\u0438\u0441\u0438, \u0449\u043E \u0432\u0436\u0435 \u043B\u0435\u0436\u0430\u0442\u044C \u0443 \u043D\u0456\u0439, \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u044E\u0442\u044C\u0441\u044F, \u043F\u043E\u0440\u0443\u0447 \u0456\u0437 \u043A\u043E\u0436\u043D\u043E\u044E Markdown \u0437 \u0442\u0435\u043A\u0441\u0442\u043E\u043C; \u0434\u0437\u0432\u0456\u043D\u043A\u0438, \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0456 \u0442\u0443\u0442, \u0442\u0435\u0436 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F \u0442\u0443\u0434\u0438",
    "tr.callsSet": "\u041F\u0430\u043F\u043A\u0430 \u0434\u0437\u0432\u0456\u043D\u043A\u0456\u0432: {folder}",
    "tr.ask": "\u0417\u0430\u043F\u0438\u0442\u0430\u0442\u0438 \u0437\u0430\u043F\u0438\u0441\u0438: \u0449\u043E \u043C\u0438 \u0432\u0438\u0440\u0456\u0448\u0438\u043B\u0438 \u0449\u043E\u0434\u043E\u2026",
    "tr.askBtn": "\u0417\u0430\u043F\u0438\u0442\u0430\u0442\u0438",
    "tr.asking": "\u041F\u0435\u0440\u0435\u0433\u043B\u044F\u0434\u0430\u044E \u0437\u0430\u043F\u0438\u0441\u0438\u2026",
    "tr.askNothing": "\u0423 \u0437\u0430\u043F\u0438\u0441\u0430\u0445 \u043D\u0435\u043C\u0430\u0454 \u043D\u0456\u0447\u043E\u0433\u043E \u043F\u0440\u043E \u0446\u0435.",
    "tr.askNeedModel": "\u0414\u043B\u044F \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C: \u0432\u0438\u0431\u0435\u0440\u0456\u0442\u044C \xAB\u0422\u043E\u0447\u043D\u0438\u0439\xBB \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \u041C\u043E\u0434\u0435\u043B\u0456.",
    "tr.deleteAsk": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u043D\u0430\u0437\u0430\u0432\u0436\u0434\u0438?",
    "tr.keep": "\u0417\u0430\u043B\u0438\u0448\u0438\u0442\u0438",
    "tr.deleted": "\u0412\u0438\u0434\u0430\u043B\u0435\u043D\u043E",
    "tr.open": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438",
    "tr.showInFolder": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u0432 \u043F\u0430\u043F\u0446\u0456",
    "tr.whyFailed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u0438\u0442\u0438 \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432; \u0442\u0435\u043A\u0441\u0442 \u0456\u0434\u0435 \u043E\u0434\u043D\u0438\u043C \u043F\u043E\u0442\u043E\u043A\u043E\u043C.",
    "tr.whyNoPart": "\u0421\u043F\u0456\u043A\u0435\u0440\u0456\u0432 \u043D\u0435 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u0435\u043D\u043E: \xAB\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432\xBB \u0442\u043E\u0434\u0456 \u0449\u0435 \u043D\u0435 \u0431\u0443\u043B\u043E \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E.",
    "tr.whyNoKey": "\u0421\u043F\u0456\u043A\u0435\u0440\u0456\u0432 \u043D\u0435 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u0435\u043D\u043E: \u043C\u043E\u0434\u0435\u043B\u0456 \u0433\u043E\u043B\u043E\u0441\u0456\u0432 \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0431\u0443\u0432 \u043A\u043B\u044E\u0447 Hugging Face.",
    "tr.meetNote": "\u0412\u0430\u0448 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u2014 \u0446\u0435 Me; \u0433\u043E\u043B\u043E\u0441\u0438 \u0434\u0437\u0432\u0456\u043D\u043A\u0430 \u2014 \u043E\u0434\u0438\u043D \u0441\u043F\u0456\u043A\u0435\u0440.",
    "tr.setUpSpeakers": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u0442\u0438 \u0441\u043F\u0456\u043A\u0435\u0440\u0456\u0432",
    "tr.noWords": "\u0426\u044E \u0437\u0443\u0441\u0442\u0440\u0456\u0447 \u0443\u0436\u0435 \u043D\u0435 \u0440\u043E\u0437\u0434\u0456\u043B\u0438\u0442\u0438: \u0457\u0457 \u0441\u043B\u043E\u0432\u0430 \u043D\u0435 \u0437\u0431\u0435\u0440\u0435\u0433\u043B\u0438\u0441\u044F.",
    "tr.noRecog": "\u0422\u0435\u043A\u0441\u0442 \u043D\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u0437\u0430\u043D\u043E\u0432\u043E; \u043F\u0440\u0430\u0432\u043A\u0438 \u0437\u0430\u043B\u0438\u0448\u0430\u0442\u044C\u0441\u044F.",
    "tr.split": "\u0420\u043E\u0437\u0434\u0456\u043B\u0438\u0442\u0438 \u0437\u0430 \u0441\u043F\u0456\u043A\u0435\u0440\u0430\u043C\u0438",
    "tr.editsLost": "\u041F\u0440\u0430\u0432\u043A\u0438 \u0432 \u0442\u0435\u043A\u0441\u0442\u0456 \u0431\u0443\u0434\u0435 \u0432\u0442\u0440\u0430\u0447\u0435\u043D\u043E. \u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438?",
    "tr.goOn": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438?",
    "tr.again": "\u0420\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0432\u0430\u0442\u0438 \u0437\u043D\u043E\u0432\u0443",
    "tr.redoTime": "\u0407\u0457 \u043C\u043E\u0436\u043D\u0430 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0432\u0430\u0442\u0438 \u0437\u043D\u043E\u0432\u0443, \u0437\u0456 \u0441\u043F\u0456\u043A\u0435\u0440\u0430\u043C\u0438: \u0431\u043B\u0438\u0437\u044C\u043A\u043E {n} \u0445\u0432.",
    "tr.speakerName": "\u0406\u043C\u2019\u044F \u0441\u043F\u0456\u043A\u0435\u0440\u0430",
    "tr.tapRename": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0456\u043C\u2019\u044F, \u0449\u043E\u0431 \u043F\u0435\u0440\u0435\u0439\u043C\u0435\u043D\u0443\u0432\u0430\u0442\u0438",
    "tr.nameHintNote": "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043E \u0437 \u0435\u043A\u0440\u0430\u043D\u0430: \u0435\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442\u0430\u043B\u044C\u043D\u043E, \u043C\u043E\u0436\u0435 \u043F\u043E\u043C\u0438\u043B\u044F\u0442\u0438\u0441\u044F",
    "tr.applyName": "\u0417\u0430\u0441\u0442\u043E\u0441\u0443\u0432\u0430\u0442\u0438",
    "tr.dismissName": "\u0412\u0456\u0434\u0445\u0438\u043B\u0438\u0442\u0438",
    "tr.anotherSpeaker": "\u0406\u043D\u0448\u0438\u0439 \u0441\u043F\u0456\u043A\u0435\u0440",
    "tr.listenFrom": "\u0421\u043B\u0443\u0445\u0430\u0442\u0438 \u0437\u0432\u0456\u0434\u0441\u0438",
    "tr.position": "\u041F\u043E\u0437\u0438\u0446\u0456\u044F",
    "tr.playSpace": "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0430\u0431\u043E \u043F\u0430\u0443\u0437\u0430 \xB7 Space",
    "tr.play": "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0430\u0431\u043E \u043F\u0430\u0443\u0437\u0430",
    "nav.home": "\u041F\u0443\u043B\u044C\u0442",
    "nav.english": "\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430",
    "nav.voice": "\u0421\u043A\u0430\u0436\u0438 \u2014 \u043D\u0430\u0434\u0440\u0443\u043A\u0443\u044E",
    "nav.recordings": "\u0414\u0437\u0432\u0456\u043D\u043A\u0438",
    "nav.layout": "\u041D\u0435 \u0442\u0430 \u043B\u0456\u0442\u0435\u0440\u0430",
    "nav.translate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434",
    "nav.words": "\u041C\u043E\u0457 \u0441\u043B\u043E\u0432\u0430",
    "nav.mistakes": "\u041C\u043E\u0457 \u043F\u043E\u043C\u0438\u043B\u043A\u0438",
    "nav.transcripts": "\u0423\u0441\u0456 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438",
    "nav.translations": "\u0406\u0441\u0442\u043E\u0440\u0456\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0456\u0432",
    "nav.phrases": "\u041D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0456 \u0444\u0440\u0430\u0437\u0438",
    "nav.vocabulary": "\u0406\u043C\u0435\u043D\u0430 \u0439 \u0442\u0435\u0440\u043C\u0456\u043D\u0438",
    "nav.kept": "\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438",
    "nav.learned": "\u0412\u0438\u0432\u0447\u0435\u043D\u0456 \u0441\u043B\u043E\u0432\u0430",
    "nav.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u0438",
    "nav.layouts": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043E\u043A",
    "nav.settings": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "nav.models": "\u041C\u043E\u0434\u0435\u043B\u0456",
    "nav.storage": "\u041C\u0456\u0441\u0446\u0435 \u043D\u0430 \u0434\u0438\u0441\u043A\u0443",
    "nav.keys": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456",
    "nav.about": "\u041F\u0440\u043E \u0422\u0438\u0446\u044C",
    "nav.report": "\u041F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438 \u043F\u0440\u043E \u0437\u0431\u0456\u0439",
    "nav.search": "\u041F\u043E\u0448\u0443\u043A",
    "nav.minimize": "\u0417\u0433\u043E\u0440\u043D\u0443\u0442\u0438",
    "nav.making": "\u0421\u0442\u0432\u043E\u0440\u044E\u0454\u0442\u044C\u0441\u044F \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "search.placeholder": "\u041F\u043E\u0448\u0443\u043A",
    "search.title": "\u041F\u043E\u0448\u0443\u043A \u0443 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445 (Ctrl+F)",
    "search.nothing": "\u041D\u0456\u0434\u0435 \u043D\u0435\u043C\u0430\u0454 \xAB{q}\xBB. \u0423 \u0441\u043B\u043E\u0432\u0430\u0445, \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430\u0445 \u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0445 \u0441\u0432\u0456\u0439 \u043F\u043E\u0448\u0443\u043A.",
    "search.hint": "\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u0443\u0433\u043E\u0440\u0456: \u0431\u0443\u0434\u044C-\u044F\u043A\u0438\u0439 \u0440\u044F\u0434\u043E\u043A \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0457 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0438 \u0437\u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u0437\u0430 \u043D\u0430\u0437\u0432\u043E\u044E \u0447\u0438 \u043F\u0440\u0438\u043C\u0456\u0442\u043A\u043E\u044E, \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u044E \u0430\u0431\u043E \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E.",
    "page.speakers": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432",
    "page.fixing": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "page.languages": "\u0412\u0430\u0448\u0456 \u043C\u043E\u0432\u0438",
    "page.checkEnglish": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457",
    "page.forCheckCap": "\u043C\u043E\u0434\u0435\u043B\u044C, \u044F\u043A\u0430 \u0437\u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C \u0432\u0430\u0448\u0456 \u043F\u043E\u043C\u0438\u043B\u043A\u0438",
    "page.voice": "\u0413\u043E\u043B\u043E\u0441",
    "page.forVoiceCap": "\u0433\u043E\u043B\u043E\u0441, \u044F\u043A\u0438\u0439 \u0447\u0438\u0442\u0430\u0454 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0443 \u0432\u0433\u043E\u043B\u043E\u0441",
    "home.paused": "\u0422\u0438\u0446\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0456",
    "home.pausedNote": "\u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0439 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u043F\u0440\u0430\u0446\u044E\u044E\u0442\u044C",
    "home.replayTitle": "\u041F\u0440\u043E\u0433\u0440\u0430\u0442\u0438 \u0440\u044F\u0434\u043E\u043A \u0449\u0435 \u0440\u0430\u0437",
    "home.replay": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0438",
    "home.ready": "\u0422\u0438\u0446\u044C \u0433\u043E\u0442\u043E\u0432\u0438\u0439",
    "home.readyNote": "\u0443\u0441\u0435 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "home.downloading": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F: {name}",
    "home.yourKeys": "\u0412\u0430\u0448\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "home.unset": "\u0411\u0435\u0437 \u043A\u043B\u0430\u0432\u0456\u0448\u0456: {n}. \u0417\u0430\u0434\u0430\u044E\u0442\u044C\u0441\u044F \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430\u0445 \u0434\u0456\u0439.",
    "home.troubleTranslator": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447 \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0432\u0441\u044F; \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0441\u043F\u0440\u043E\u0431\u0443\u0454 \u0437\u043D\u043E\u0432\u0443.",
    "home.troubleVoice": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0432\u0441\u044F; \u043F\u043E\u043A\u0438 \u0447\u0438\u0442\u0430\u0454 \u0433\u043E\u043B\u043E\u0441 Windows.",
    "home.troubleSpeech": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0443\u043F\u0438\u043D\u0438\u0432\u0441\u044F: \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438 \u0439\u043E\u0433\u043E \u043C\u043E\u0436\u043D\u0430 \u0432 \xAB\u041F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438 \u043F\u0440\u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443\xBB.",
    "home.eyebrow": "\u041E\u0434\u0438\u043D \u0440\u044F\u0434\u043E\u043A, \u0442\u0440\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "home.stepFix": "\u0432\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u0438",
    "home.stepTranslate": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "home.stepListen": "\u0441\u043B\u0443\u0445\u0430\u0442\u0438",
    "home.downloadsOnce": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "menu.translate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "menu.listen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441",
    "menu.inPlace": "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "menu.screen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "menu.check": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0443",
    "menu.talk": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u0437 \u0422\u0438\u0446\u044C",
    "menu.dictate": "\u0414\u0440\u0443\u043A\u0443\u0432\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "menu.english": "\u0414\u0440\u0443\u043A\u0443\u0432\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u043C \u0437 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "menu.fix": "\u0412\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443",
    "menu.foot": "\u041B\u0456\u0442\u0435\u0440\u0430 \u2014 \u0432\u0438\u0431\u0440\u0430\u0442\u0438 \xB7 Esc \u2014 \u0437\u0430\u043A\u0440\u0438\u0442\u0438",
    "menu.nothingToRead": "\u041D\u0456\u0447\u043E\u0433\u043E \u0447\u0438\u0442\u0430\u0442\u0438: \u0432\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442",
    "menu.nothingToReplace": "\u041D\u0456\u0447\u043E\u0433\u043E \u0437\u0430\u043C\u0456\u043D\u0438\u0442\u0438: \u0432\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442",
    "menu.keyTitle": "\u041C\u0435\u043D\u044E \u0422\u0438\u0446\u044C",
    "menu.keyNote": "\u043E\u0434\u043D\u0430 \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u2014 \u0443\u0441\u0456 \u0434\u0456\u0457",
    "keys.group": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456",
    "keys.copyTwice": "Ctrl + C \u0434\u0432\u0456\u0447\u0456",
    "keys.twice": "{key} \u0434\u0432\u0456\u0447\u0456",
    "keys.tap": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C {key}",
    "keys.press": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C {key}",
    "keys.useSelect": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0456 \u0447\u0438\u0442\u0430\u043D\u043D\u044F \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u043E\u0433\u043E \u0432\u0433\u043E\u043B\u043E\u0441",
    "keys.useSnip": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0456 \u0447\u0438\u0442\u0430\u043D\u043D\u044F \u0442\u0435\u043A\u0441\u0442\u0443 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "keys.useTranslate": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u043E\u0433\u043E",
    "keys.useText": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0442\u0435\u043A\u0441\u0442\u0443 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "keys.useInPlace": "\u0437\u0430\u043C\u0456\u043D\u0430 \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "keys.useCheck": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0432\u0430\u0448\u043E\u0457 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457",
    "keys.useType": "\u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0442\u0435\u043A\u0441\u0442\u0443 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443",
    "keys.useTypeCheck": "\u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0442\u0435\u043A\u0441\u0442\u0443 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438",
    "keys.useSwitch": "\u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438",
    "keys.useFix": "\u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438",
    "keys.useDictate": "\u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "keys.useEnglish": "\u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E",
    "keys.useNote": "\u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043D\u043E\u0442\u0430\u0442\u043A\u0438",
    "keys.useAgain": "\u043F\u043E\u0432\u0442\u043E\u0440\u043D\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u043E\u0441\u0442\u0430\u043D\u043D\u044C\u043E\u0457 \u0444\u0440\u0430\u0437\u0438",
    "keys.usePractice": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0441\u043A\u0430\u0437\u0430\u043D\u043E\u0433\u043E",
    "keys.useTalk": "\u0440\u043E\u0437\u043C\u043E\u0432\u0430 \u0437 \u0422\u0438\u0446\u044C",
    "keys.usePause": "\u043F\u0430\u0443\u0437\u0430 \u0422\u0438\u0446\u044C",
    "keys.useWindow": "\u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0442\u044F \u0422\u0438\u0446\u044C",
    "keys.useMenu": "\u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0442\u044F \u043C\u0435\u043D\u044E \u0422\u0438\u0446\u044C",
    "keys.toLayout": "\u043F\u0435\u0440\u0435\u0445\u0456\u0434 \u043D\u0430 {layout}",
    "keys.aLayout": "\u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443",
    "keys.taken": "{key} \u0443\u0436\u0435 \u0437\u0430\u0439\u043D\u044F\u0442\u043E: {use}.",
    "keys.copyTwiceOnly": "Ctrl + C \u0434\u0432\u0456\u0447\u0456 \u043C\u043E\u0436\u0435 \u0431\u0443\u0442\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0435\u044E \u043B\u0438\u0448\u0435 \u0434\u0456\u0457 \u0437 \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u0438\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C.",
    "keys.menuAlt": "Alt \u043E\u043A\u0440\u0435\u043C\u043E \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0432\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u0454 \u043C\u0435\u043D\u044E, \u0446\u0435 \u0440\u043E\u0431\u0438\u0442\u044C F10",
    "keys.menuWin": "Win \u043E\u043A\u0440\u0435\u043C\u043E \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0432\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u0454 \xAB\u041F\u0443\u0441\u043A\xBB, \u0446\u0435 \u0440\u043E\u0431\u0438\u0442\u044C Ctrl+Esc",
    "keys.menuCtrlEsc": "Ctrl+Esc \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0432\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u0454 \xAB\u041F\u0443\u0441\u043A\xBB, \u0446\u0435 \u0440\u043E\u0431\u0438\u0442\u044C Win",
    "keys.recordTitle": "\u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C, \u043F\u043E\u0442\u0456\u043C \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043A\u043B\u0430\u0432\u0456\u0448\u0456: Ctrl+Alt+T, Left Ctrl \u0434\u0432\u0456\u0447\u0456, Pause, \u0431\u0456\u0447\u043D\u0443 \u043A\u043D\u043E\u043F\u043A\u0443 \u043C\u0438\u0448\u0456\u2026",
    "keys.aria": "{label}: {key}. \u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C, \u0449\u043E\u0431 \u0437\u043C\u0456\u043D\u0438\u0442\u0438.",
    "keys.notSet": "\u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043E",
    "keys.pressKeys": "\u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043A\u043B\u0430\u0432\u0456\u0448\u0456\u2026",
    "keys.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438",
    "keys.clearAria": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438: {label}",
    "keys.backTo": "\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u0438 {key}",
    "keys.backToAria": "{label}: \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u0438 {key}",
    "keys.takenProgram": "\u0417\u0430\u0439\u043D\u044F\u0442\u043E \u0456\u043D\u0448\u043E\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043E\u044E; \u0432\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0456\u043D\u0448\u0435.",
    "keys.set": "\u0417\u0430\u0434\u0430\u0442\u0438",
    "listen.tryKey": "\u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0446\u0435\u0439 \u0442\u0435\u043A\u0441\u0442 \u0456 {how}.",
    "listen.tryTwice": "\u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0446\u0435\u0439 \u0442\u0435\u043A\u0441\u0442 \u0456 \u0434\u0432\u0456\u0447\u0456 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C Ctrl + C.",
    "listen.tryNone": "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0432\u0456\u0448\u0443 \u0432\u0433\u043E\u0440\u0456 (\u043C\u043E\u0436\u043D\u0430 Ctrl + C \u0434\u0432\u0456\u0447\u0456), \u043F\u043E\u0442\u0456\u043C \u0432\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0446\u0435\u0439 \u0442\u0435\u043A\u0441\u0442.",
    "listen.cardGroup": "\u041A\u0430\u0440\u0442\u043A\u0430",
    "listen.autoRead": "\u0427\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441, \u043A\u043E\u043B\u0438 \u0432\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u0454\u0442\u044C\u0441\u044F \u043A\u0430\u0440\u0442\u043A\u0430",
    "listen.rareWords": "\u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u043F\u0456\u0434 \u0440\u0456\u0434\u0448\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438",
    "listen.oneAtATime": "\u0427\u0438\u0442\u0430\u0442\u0438 \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0440\u0435\u0447\u0435\u043D\u043D\u044E",
    "listen.wordHint": "\u0417\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0441\u043B\u043E\u0432\u0430 \u043F\u043E\u043A\u0430\u0437\u0443\u0432\u0430\u0442\u0438",
    "listen.hintShift": "\u0417\u0430 \u043A\u043B\u0456\u043A\u043E\u043C \u0430\u0431\u043E Shift + \u043D\u0430\u0432\u0435\u0434\u0435\u043D\u043D\u044F\u043C",
    "listen.hintHover": "\u0417\u0430 \u043A\u043B\u0456\u043A\u043E\u043C \u0430\u0431\u043E \u043D\u0430\u0432\u0435\u0434\u0435\u043D\u043D\u044F\u043C",
    "listen.hintOff": "\u041B\u0438\u0448\u0435 \u0437\u0430 \u043A\u043B\u0456\u043A\u043E\u043C",
    "listen.inCard": "\u0423 \u043A\u0430\u0440\u0442\u0446\u0456",
    "listen.playKeys": "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F, \u0437\u0443\u043F\u0438\u043D\u043A\u0430 \u0439 \u043F\u0435\u0440\u0435\u0445\u0456\u0434 \u043C\u0456\u0436 \u0440\u0435\u0447\u0435\u043D\u043D\u044F\u043C\u0438",
    "listen.clickWord": "\u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C \u0441\u043B\u043E\u0432\u043E",
    "listen.clickWordNote": "\u0439\u043E\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0439 \u0432\u0438\u043C\u043E\u0432\u0430; \u0437\u0456\u0440\u043E\u0447\u043A\u0430 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454 \u0439\u043E\u0433\u043E \u0432 \xAB\u0421\u043B\u043E\u0432\u0430\xBB",
    "listen.clickSentence": "\u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C \u0440\u0435\u0447\u0435\u043D\u043D\u044F",
    "listen.clickSentenceNote": "\u043F\u043E\u0437\u043D\u0430\u0447\u0430\u0454\u0442\u044C\u0441\u044F \u0439\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434; \u25B6 \u043D\u0430 \u043F\u043E\u043B\u0456 \u0447\u0438\u0442\u0430\u0454 \u043E\u0434\u0438\u043D \u0430\u0431\u0437\u0430\u0446",
    "listen.closeCard": "\u0417\u0430\u043A\u0440\u0438\u0442\u0438 \u043A\u0430\u0440\u0442\u043A\u0443 \u0439 \u0437\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0433\u043E\u043B\u043E\u0441",
    "translate.chipReady": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "translate.chipFirstUse": "\u043F\u0440\u0438 \u043F\u0435\u0440\u0448\u043E\u043C\u0443 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u0456",
    "translate.chipDownloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
    "translate.chipFailed": "\u043F\u043E\u043C\u0438\u043B\u043A\u0430",
    "translate.chipUnsupported": "\u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E",
    "translate.readyNote": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \xAB{level}\xBB, \u043F\u0440\u0430\u0446\u044E\u0454 \u043E\u0444\u043B\u0430\u0439\u043D",
    "translate.absentNote": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0437 {from} \u043F\u0440\u0438 \u043F\u0435\u0440\u0448\u043E\u043C\u0443 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0456, \u043F\u043E\u0442\u0456\u043C \u043F\u0440\u0430\u0446\u044E\u0454 \u043E\u0444\u043B\u0430\u0439\u043D",
    "translate.downloadingNote": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0437 {from}, \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "translate.failedNote": "\u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438; \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0441\u043F\u0440\u043E\u0431\u0443\u0454 \u0437\u043D\u043E\u0432\u0443",
    "translate.unsupportedNote": "\u0434\u043B\u044F \u0446\u0456\u0454\u0457 \u043C\u043E\u0432\u0438 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454 \u043E\u0444\u043B\u0430\u0439\u043D-\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447\u0430",
    "translate.tryKey": "\u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0439\u043E\u0433\u043E \u0456 {how}.",
    "translate.tryNone": "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0432\u0456\u0448\u0443 \u0432\u0433\u043E\u0440\u0456, \u043F\u043E\u0442\u0456\u043C \u0432\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u0456 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0457\u0457.",
    "translate.typeNote": "\u043F\u043E\u0440\u043E\u0436\u043D\u044F \u043A\u0430\u0440\u0442\u043A\u0430 \u0431\u0456\u043B\u044F \u0432\u043A\u0430\u0437\u0456\u0432\u043D\u0438\u043A\u0430, \u0437 \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0457 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438; \u0442\u0430\u043A\u043E\u0436 \u0443 \u043C\u0435\u043D\u044E \u0432 \u0442\u0440\u0435\u0457",
    "translate.pasteBack": "\u0423 \u043A\u0430\u0440\u0442\u0446\u0456: \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u043D\u0430 \u043C\u0456\u0441\u0446\u0435",
    "translate.shareAsk": "\u041C\u043E\u0434\u0435\u043B\u044C \xAB{model}\xBB \u0443\u0436\u0435 \u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "translate.shareNote": "\u0407\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457\xBB \u0439 \u0440\u043E\u0437\u043C\u043E\u0432\u0430 \u0437 \u0422\u0438\u0446\u044C. \u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0442\u0435\u0436 \u043C\u043E\u0436\u0435 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438, \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E\u0447\u0438: \xAB{fast}\xBB \u043E\u0434\u0440\u0430\u0437\u0443 \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u0447\u0435\u0440\u043D\u0435\u0442\u043A\u0443, \u0430 \xAB{model}\xBB \u0457\u0457 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454.",
    "translate.shareUse": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0442\u0438 \u043C\u043E\u0434\u0435\u043B\u043B\u044E \xAB{model}\xBB",
    "translate.empty": "\u041F\u043E\u043A\u0438 \u043D\u0456\u0447\u043E\u0433\u043E. \u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0438 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F \u0442\u0443\u0442 30 \u0434\u043D\u0456\u0432, \u043D\u0435 \u0431\u0456\u043B\u044C\u0448\u0435 200.",
    "models.aboutFast": "\u041C\u0438\u0442\u0442\u0454\u0432\u043E; \u043A\u043E\u0440\u043E\u0442\u043A\u0456 \u0444\u0440\u0430\u0437\u0438 \u043C\u043E\u0436\u0443\u0442\u044C \u0432\u0438\u0439\u0442\u0438 \u0434\u043E\u0441\u043B\u0456\u0432\u043D\u0438\u043C\u0438",
    "models.aboutAccurateLevel": "\u0420\u043E\u0437\u0443\u043C\u0456\u0454 \u0440\u0435\u0447\u0435\u043D\u043D\u044F \u0446\u0456\u043B\u043A\u043E\u043C",
    "models.aboutMostLevel": "\u041D\u0430\u0439\u043A\u0440\u0430\u0449\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u044E\u0432\u0430\u043D\u043D\u044F, \u0430\u043B\u0435 \u043D\u0430\u0439\u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0456\u0448\u0435",
    "models.onCard": "\u043D\u0430 \u0432\u0430\u0448\u0456\u0439 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "models.partlyOnCard": "\u0447\u0430\u0441\u0442\u043A\u043E\u0432\u043E \u043D\u0430 \u0432\u0430\u0448\u0456\u0439 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "models.onProcessor": "\u043D\u0430 \u0432\u0430\u0448\u043E\u043C\u0443 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "models.guessCard": "\u0431\u043B\u0438\u0437\u044C\u043A\u043E 1\u20132 \u0441 \u043D\u0430 \u0440\u0435\u0447\u0435\u043D\u043D\u044F",
    "models.guessPart": "\u043C\u043E\u0436\u043B\u0438\u0432\u043E, \u0430\u043B\u0435 \u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E",
    "models.guessProcessor": "\u043C\u043E\u0436\u043B\u0438\u0432\u043E, \u0430\u043B\u0435 \u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E: 30 \u0441 \u0456 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442",
    "models.cudaGuess": "\u043A\u0456\u043B\u044C\u043A\u0430 \u0441\u0435\u043A\u0443\u043D\u0434 \u043D\u0430 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442, 15\u201320 \u0441 \u043D\u0430 \u0434\u043E\u0432\u0433\u0438\u0439",
    "models.cudaSize": "\u0456\u0437 \u0432\u043B\u0430\u0441\u043D\u043E\u044E \u0437\u0431\u0456\u0440\u043A\u043E\u044E NVIDIA, 670 \u041C\u0411",
    "models.starts": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u0437\u0430 {time} \u043F\u0456\u0441\u043B\u044F 3 \u0445\u0432\u0438\u043B\u0438\u043D \u043F\u0440\u043E\u0441\u0442\u043E\u044E",
    "models.cardHeld": "\u0417\u0430\u0439\u043C\u0430\u0454 {size} \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438 \u043F\u0456\u0434 \u0447\u0430\u0441 \u0440\u043E\u0431\u043E\u0442\u0438; \u0437\u0432\u0456\u043B\u044C\u043D\u044F\u0454 \u0457\u0457 \u043F\u0456\u0441\u043B\u044F 3 \u0445\u0432\u0438\u043B\u0438\u043D \u043F\u0440\u043E\u0441\u0442\u043E\u044E \u0430\u0431\u043E \u043A\u043E\u043B\u0438 \u0433\u0440\u0430 \u0447\u0438 \u0432\u0456\u0434\u0435\u043E \u043D\u0430 \u0432\u0435\u0441\u044C \u0435\u043A\u0440\u0430\u043D",
    "models.cardFrees": "\u0417\u0432\u0456\u043B\u044C\u043D\u044F\u0454 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 \u043F\u0456\u0441\u043B\u044F 3 \u0445\u0432\u0438\u043B\u0438\u043D \u043F\u0440\u043E\u0441\u0442\u043E\u044E \u0430\u0431\u043E \u043A\u043E\u043B\u0438 \u0433\u0440\u0430 \u0447\u0438 \u0432\u0456\u0434\u0435\u043E \u043D\u0430 \u0432\u0435\u0441\u044C \u0435\u043A\u0440\u0430\u043D",
    "models.slowHere": "\u0442\u0443\u0442 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u043E",
    "models.here": "\u0442\u0443\u0442",
    "models.perSentence": "{time} \u043D\u0430 \u0440\u0435\u0447\u0435\u043D\u043D\u044F",
    "models.perCheck": "{time} \u043D\u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0443 \u0442\u0435\u043A\u0441\u0442\u0443",
    "models.perAnswer": "{time} \u043D\u0430 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C \u0443 \u0440\u043E\u0437\u043C\u043E\u0432\u0456",
    "models.aboutAccurate": "\u0420\u043E\u0437\u0443\u043C\u0456\u0454 \u0440\u0435\u0447\u0435\u043D\u043D\u044F \u0446\u0456\u043B\u043A\u043E\u043C \u0456 \u043F\u043E\u043C\u0456\u0447\u0430\u0454 \u043C\u0430\u0439\u0436\u0435 \u043A\u043E\u0436\u043D\u0443 \u043F\u043E\u043C\u0438\u043B\u043A\u0443",
    "models.aboutMost": "\u041D\u0430\u0439\u043A\u0440\u0430\u0449\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u044E\u0432\u0430\u043D\u043D\u044F, \u0442\u0440\u043E\u0445\u0438 \u0443\u0432\u0430\u0436\u043D\u0456\u0448\u0435, \u0430\u043B\u0435 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0456\u0448\u0435",
    "models.failedRetry": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F; \xAB\u0421\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437\xBB \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C \u0437\u043D\u043E\u0432\u0443",
    "models.onComputer": "{size} \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "models.downloadingSize": "{size}, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F",
    "models.toDownloadFirst": "{size} \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u043F\u0440\u0438 \u043F\u0435\u0440\u0448\u043E\u043C\u0443 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u0456",
    "models.toDownloadPicked": "{size} \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "models.remove": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \xAB{level}\xBB ({size}); \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443, \u043A\u043E\u043B\u0438 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.fastFailed": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F; \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0441\u043F\u0440\u043E\u0431\u0443\u0454 \u0437\u043D\u043E\u0432\u0443",
    "models.onThisComputer": "\u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "models.fastNext": "{size} \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0457 \u043C\u043E\u0432\u0438, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u043C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "models.fastPicked": "{size} \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0457 \u043C\u043E\u0432\u0438, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "models.draft": "\u0442\u0430\u043A\u043E\u0436 \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u0448\u0432\u0438\u0434\u043A\u0443 \u0447\u0435\u0440\u043D\u0435\u0442\u043A\u0443, \u043F\u043E\u043A\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \xAB{accurate}\xBB \u0430\u0431\u043E \xAB{most}\xBB",
    "models.checkMoves": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0442\u0435\u0436 \u043F\u0435\u0440\u0435\u0439\u0434\u0435 \u043D\u0430 \u043D\u0435\u0457: \u043E\u0434\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0440\u043E\u0431\u0438\u0442\u044C \u0456 \u0442\u0435, \u0456 \u0442\u0435",
    "models.checkShares": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0442\u0435\u0436 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "models.checkAlready": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0432\u0436\u0435 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454",
    "models.translateWith": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0442\u0438 \u0437\u0430 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E",
    "models.translateShares": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0442\u0435\u0436 \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
    "models.translateStays": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0437\u0430\u043B\u0438\u0448\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \xAB{fast}\xBB",
    "models.translateMoves": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0442\u0435\u0436 \u043F\u0435\u0440\u0435\u0439\u0434\u0435 \u043D\u0430 \u043D\u0435\u0457: \u043E\u0434\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0440\u043E\u0431\u0438\u0442\u044C \u0456 \u0442\u0435, \u0456 \u0442\u0435",
    "models.checkWith": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u0442\u0438 \u0437\u0430 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E",
    "models.fastOnly": "\xAB{fast}\xBB \u043B\u0438\u0448\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454; \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043E\u0434\u043D\u0430 \u0437 \u0446\u0438\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439.",
    "models.engine": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "models.speechWith": "{name}: \u043C\u043E\u0434\u0435\u043B\u044C",
    "models.options": "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438",
    "models.naturalReady": "\u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441",
    "models.naturalLater": "\u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441, \u0449\u043E\u0439\u043D\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F, \u0430 \u0434\u043E\u0442\u0438 \u0433\u043E\u043B\u043E\u0441 Windows",
    "models.naturalNote": "\u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439, \u0441\u0442\u0432\u043E\u0440\u044E\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456 (Kokoro)",
    "models.naturalFaster": "\u0433\u043E\u0442\u0443\u0454 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0432 {n}\xD7 \u0448\u0432\u0438\u0434\u0448\u0435, \u043D\u0456\u0436 \u0437\u0432\u0443\u0447\u0438\u0442\u044C",
    "models.windowsNote": "\u0433\u043E\u043B\u043E\u0441 Windows: \u043C\u0438\u0442\u0442\u0454\u0432\u0438\u0439, \u043C\u0435\u043D\u0448 \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439",
    "models.readWith": "\u0427\u0438\u0442\u0430\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u043E\u043C",
    "models.naturalSlow": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441 \u0442\u0443\u0442 \u0433\u043E\u0442\u0443\u0454 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0456\u0448\u0435, \u043D\u0456\u0436 \u0437\u0432\u0443\u0447\u0438\u0442\u044C, \u0442\u043E\u043C\u0443 \u0440\u043E\u0431\u0438\u0442\u044C \u043F\u0430\u0443\u0437\u0438 \u043C\u0456\u0436 \u0440\u0435\u0447\u0435\u043D\u043D\u044F\u043C\u0438; \u0433\u043E\u043B\u043E\u0441 Windows \u043C\u0438\u0442\u0442\u0454\u0432\u0438\u0439.",
    "models.useRecommendedTitle": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442\u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u0456 \u043C\u043E\u0434\u0435\u043B\u0456",
    "models.useRecommendedNote": "\u0442\u0435, \u0449\u043E \u043D\u0430\u0439\u043A\u0440\u0430\u0449\u0435 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456, \u0434\u043B\u044F \u043A\u043E\u0436\u043D\u043E\u0457 \u0434\u0456\u0457; \u0441\u043F\u0435\u0440\u0448\u0443 \u0432\u0438 \u043F\u043E\u0431\u0430\u0447\u0438\u0442\u0435, \u0449\u043E \u0437\u043C\u0456\u043D\u0438\u0442\u044C\u0441\u044F",
    "models.useRecommended": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442\u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u0456",
    "models.already": "\u0423\u0436\u0435 \u044F\u043A \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u043E",
    "models.alreadyNote": "\u043A\u043E\u0436\u043D\u0430 \u0434\u0456\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u0442\u0435, \u0449\u043E \u043D\u0430\u0439\u043A\u0440\u0430\u0449\u0435 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "models.apply": "\u0417\u0430\u0441\u0442\u043E\u0441\u0443\u0432\u0430\u0442\u0438",
    "models.changes": "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u043E\u0432\u0430\u043D\u0456 \u0437\u043C\u0456\u043D\u0438",
    "models.toDownload": "{size} \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "models.toDownloadAll": "\u0443\u0441\u044C\u043E\u0433\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438 {size}",
    "models.nothingToDownload": "\u041D\u0456\u0447\u043E\u0433\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0432\u0430\u0442\u0438",
    "models.free": "\u0432\u0456\u043B\u044C\u043D\u043E {size}",
    "models.nothingRemoved": "\u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0432\u0438\u0434\u0430\u043B\u044F\u0454\u0442\u044C\u0441\u044F",
    "models.needsFree": "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E {size} \u0432\u0456\u043B\u044C\u043D\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F",
    "models.unused": "{size}, \u044F\u043A\u0456 \u043D\u0456\u0449\u043E \u043D\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454",
    "models.unusedNote": "{list}; \u043A\u043E\u0436\u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443, \u044F\u043A\u0449\u043E \u0432\u0438\u0431\u0440\u0430\u0442\u0438 \u0439\u043E\u0433\u043E \u043F\u0456\u0437\u043D\u0456\u0448\u0435",
    "models.cleaning": "\u041F\u0440\u0438\u0431\u0438\u0440\u0430\u043D\u043D\u044F\u2026",
    "models.cleanUp": "\u041F\u0440\u0438\u0431\u0440\u0430\u0442\u0438",
    "models.computer": "\u0426\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440",
    "models.eachAction": "\u0429\u043E \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u043A\u043E\u0436\u043D\u0430 \u0434\u0456\u044F",
    "models.translateNote": "\u043D\u0430\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0434\u043E\u0431\u0440\u0435 \u0439 \u0448\u0432\u0438\u0434\u043A\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u044E\u0442\u044C\u0441\u044F \u0442\u0435\u043A\u0441\u0442\u0438",
    "models.checkTalk": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0439 \u0440\u043E\u0437\u043C\u043E\u0432\u0430",
    "models.dictateNote": "\u0437\u0430\u043F\u0438\u0441\u0443\u0454 \u0441\u043A\u0430\u0437\u0430\u043D\u0435",
    "models.transcribeNote": "\u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0454 \u0437\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456",
    "models.shared": "\u041C\u043E\u0434\u0435\u043B\u044C, \u044F\u043A\u0443 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C \u0434\u0432\u0456 \u0434\u0456\u0457, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437: \xAB\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438\xBB \u0439 \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430\xBB \u0434\u0456\u043B\u044F\u0442\u044C \u043C\u043E\u0432\u043D\u0443 \u043C\u043E\u0434\u0435\u043B\u044C, \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u2014 \u043C\u043E\u0434\u0435\u043B\u044C \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F, \u0434\u0435 \u0446\u0435 \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043A\u043E\u0448\u0442\u0443\u0454.",
    "models.stateDownloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F {pct}%",
    "models.stateFailed": "\u043F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
    "engine.notRunning": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043E",
    "engine.noSound": "\u041D\u0435\u043C\u0430\u0454 \u0437\u0432\u0443\u043A\u0443",
    "engine.tooLong": "\u0417\u0430\u0434\u043E\u0432\u0433\u043E \u0434\u043B\u044F \u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F: \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u0443\u0439\u0442\u0435 \u0446\u0435 \u044F\u043A \u0437\u0430\u043F\u0438\u0441",
    "engine.notRecording": "\u0426\u0435 \u043D\u0435 \u0437\u0430\u043F\u0438\u0441: {why}",
    "engine.noDictation": "\u0422\u0430\u043A\u043E\u0433\u043E \u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043D\u0435\u043C\u0430\u0454",
    "engine.notRecognized": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0442\u0438: {why}",
    "engine.noModelToTest": "\u041D\u0435\u043C\u0430\u0454 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E\u0457 \u043C\u043E\u0434\u0435\u043B\u0456 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438",
    "engine.testRunning": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0432\u0436\u0435 \u0439\u0434\u0435",
    "engine.noModel": "\u0422\u0430\u043A\u043E\u0457 \u043C\u043E\u0434\u0435\u043B\u0456 \u043D\u0435\u043C\u0430\u0454",
    "engine.notRemoved": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438 {name}: {why}",
    "engine.usedByTranscripts": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F: \u043C\u043E\u0434\u0435\u043B\u044C \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043E\u043A",
    "engine.usedByDictation": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F: \u043C\u043E\u0434\u0435\u043B\u044C \u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "engine.usedLoaded": "\u0417\u0430\u0440\u0430\u0437 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F: \u0441\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0437\u0430 \u0445\u0432\u0438\u043B\u0438\u043D\u0443",
    "engine.usedDownloading": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F",
    "engine.usedTest": "\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F: \u0456\u0434\u0435 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0448\u0432\u0438\u0434\u043A\u043E\u0441\u0442\u0456",
    "engine.pasteKey": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u043A\u043B\u044E\u0447 Hugging Face",
    "engine.addKey": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u044E\u0447 Hugging Face",
    "engine.noTranscript": "\u0422\u0430\u043A\u043E\u0457 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043D\u0435\u043C\u0430\u0454",
    "engine.stillTranscribing": "\u0426\u0435\u0439 \u0437\u0430\u043F\u0438\u0441 \u0449\u0435 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F",
    "engine.transcribingNow": "\u0426\u0435\u0439 \u0437\u0430\u043F\u0438\u0441 \u0441\u0430\u043C\u0435 \u0437\u0430\u0440\u0430\u0437 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F",
    "engine.oneVoice": "\u0423 \u043D\u043E\u0442\u0430\u0442\u0446\u0456 \u043E\u0434\u0438\u043D \u0433\u043E\u043B\u043E\u0441",
    "engine.installSpeakers": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u0456\u0442\u044C \u0447\u0430\u0441\u0442\u0438\u043D\u0443, \u0449\u043E \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u0454 \u0433\u043E\u043B\u043E\u0441\u0438",
    "engine.soundNotKept": "\u0417\u0432\u0443\u043A \u0446\u044C\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0443 \u043D\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E",
    "engine.cannotSplit": "\u0426\u044E \u0437\u0443\u0441\u0442\u0440\u0456\u0447 \u0443\u0436\u0435 \u043D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0440\u043E\u0437\u0434\u0456\u043B\u0438\u0442\u0438: \u0457\u0457 \u0441\u043B\u043E\u0432\u0430 \u043D\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E",
    "engine.onlyFailed": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0438 \u043C\u043E\u0436\u043D\u0430 \u043B\u0438\u0448\u0435 \u043D\u0435\u0432\u0434\u0430\u043B\u0443 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0443",
    "engine.sourceGone": "\u0412\u0438\u0445\u0456\u0434\u043D\u043E\u0433\u043E \u0437\u0432\u0443\u043A\u0443 \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435\u043C\u0430\u0454",
    "engine.chooseFolder": "\u0421\u043F\u0435\u0440\u0448\u0443 \u0432\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043F\u0430\u043F\u043A\u0443 \u0431\u0430\u0437\u0438 \u0437\u043D\u0430\u043D\u044C",
    "engine.fileNotFound": "\u0424\u0430\u0439\u043B \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E",
    "engine.notMedia": "\u0426\u0435 \u043D\u0435 \u0430\u0443\u0434\u0456\u043E- \u0447\u0438 \u0432\u0456\u0434\u0435\u043E\u0444\u0430\u0439\u043B",
    "engine.tooLarge": "\u0417\u0430\u043F\u0438\u0441 \u0437\u0430\u0432\u0435\u043B\u0438\u043A\u0438\u0439",
    "engine.ended": "\u0417\u0430\u043F\u0438\u0441 \u0443\u0436\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E",
    "engine.nothing": "\u041D\u0456\u0447\u043E\u0433\u043E \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0432\u0430\u0442\u0438",
    "engine.notInstalled": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    "engine.keepsStopping": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u0430\u0437 \u0443 \u0440\u0430\u0437 \u0437\u0443\u043F\u0438\u043D\u044F\u0454\u0442\u044C\u0441\u044F ({code}): \u0434\u0438\u0432. {log}",
    "engine.portTaken": "\u041F\u043E\u0440\u0442 {port} \u0437\u0430\u0439\u043D\u044F\u043B\u0430 \u0456\u043D\u0448\u0430 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430: \u0437\u0430\u043A\u0440\u0438\u0439\u0442\u0435 \u0457\u0457, \u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0456\u0442\u044C \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "engine.portsTaken": "\u041F\u043E\u0440\u0442\u0438 {from}\u2013{to} \u0437\u0430\u0439\u043D\u044F\u043B\u0438 \u0456\u043D\u0448\u0456 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438: \u0437\u0430\u043A\u0440\u0438\u0439\u0442\u0435 \u043E\u0434\u043D\u0443 \u0437 \u043D\u0438\u0445, \u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0456\u0442\u044C \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "engine.installFailed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0438 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ({code}): {why}",
    "engine.unpackFailed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0440\u043E\u0437\u043F\u0430\u043A\u0443\u0432\u0430\u0442\u0438 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 Python: {why}",
    "engine.installRunning": "\u0423\u0436\u0435 \u0439\u0434\u0435 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "engine.notWhole": "{name} \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u043B\u043E\u0441\u044F \u043D\u0435 \u043F\u043E\u0432\u043D\u0456\u0441\u0442\u044E",
    "engine.hfAnswered": "Hugging Face \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0432: {status}",
    "engine.hfError": "Hugging Face \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0432 \u043F\u043E\u043C\u0438\u043B\u043A\u043E\u044E",
    "engine.hfOffline": "\u041D\u0435\u043C\u0430\u0454 \u0437\u0432\u2019\u044F\u0437\u043A\u0443 \u0437 Hugging Face",
    "engine.downloadFailed": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F: {why}",
    "check.downloadingPct": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F {pct}%",
    "talkPage.downloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F; \u0440\u043E\u0437\u043C\u043E\u0432\u0430 \u043F\u043E\u0447\u043D\u0435\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u0432\u043E\u043D\u0430 \u0431\u0443\u0434\u0435 \u0442\u0443\u0442",
    "talkPage.downloadOnce": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437; \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0442\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0442\u0435\u0436 \u043C\u043E\u0436\u0443\u0442\u044C \u0457\u0457 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438",
    "settings.download": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438",
    "talkPage.engineTitle": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u0447\u0443\u0454 \u0432\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "talkPage.engineNote": "\u041F\u043E\u043A\u0438 \u0439\u043E\u0433\u043E \u043D\u0435\u043C\u0430\u0454, \u043F\u0438\u0448\u0456\u0442\u044C \u0422\u0438\u0446\u044C. \u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0439\u043E\u0433\u043E \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F\xBB; \u0446\u0435 \u0442\u043E\u0439 \u0441\u0430\u043C\u0438\u0439 \u0440\u0443\u0448\u0456\u0439.",
    "talkPage.openDictate": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F\xBB",
    "talkPage.aboutPlaceholder": '\u041A\u0456\u043B\u044C\u043A\u0430 \u0441\u043B\u0456\u0432, \u043F\u0440\u043E \u044F\u043A\u0456 \u0422\u0438\u0446\u044C \u043C\u043E\u0436\u0435 \u043F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0438: \u0432\u0430\u0448\u0435 \u0456\u043C\u2019\u044F, \u0440\u043E\u0431\u043E\u0442\u0430, \u0449\u043E \u0432\u0430\u043C \u043F\u043E\u0434\u043E\u0431\u0430\u0454\u0442\u044C\u0441\u044F. "I am Alex, a designer. I love hiking and progressive metal."',
    "talkPage.aboutYou": "\u041F\u0440\u043E \u0432\u0430\u0441",
    "talkPage.needsEngine": "\u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F (\u0434\u0438\u0432. \xAB\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F\xBB)",
    "talkPage.openGoing": "\u0432 \u043E\u043A\u0440\u0435\u043C\u043E\u043C\u0443 \u0432\u0456\u043A\u043D\u0456 \xB7 \u0442\u0440\u0438\u0432\u0430\u0454: {topic}, {lines}",
    "talkPage.aboutNote": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0454 \u0446\u0435 \u0432 \u043A\u043E\u0436\u043D\u0456\u0439 \u0440\u043E\u0437\u043C\u043E\u0432\u0456, \u0449\u043E\u0431 \u043F\u0438\u0442\u0430\u0442\u0438 \u043F\u0440\u043E \u0432\u0430\u0448\u0435 \u0436\u0438\u0442\u0442\u044F \u0456 \u0440\u043E\u0431\u043E\u0442\u0443. \u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044C\u0441\u044F \u043B\u0438\u0448\u0435 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "talkPage.level": "\u0412\u0430\u0448 \u0440\u0456\u0432\u0435\u043D\u044C \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457",
    "talkPage.levelA2": "\u0415\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u0438\u0439: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u043C\u0438 \u0440\u0435\u0447\u0435\u043D\u043D\u044F\u043C\u0438 \u0437 \u043F\u043E\u0432\u0441\u044F\u043A\u0434\u0435\u043D\u043D\u0438\u0445 \u0441\u043B\u0456\u0432, \u043F\u0440\u043E\u0441\u0442\u0438\u043C\u0438 \u0447\u0430\u0441\u0430\u043C\u0438, \u0431\u0435\u0437 \u0456\u0434\u0456\u043E\u043C",
    "talkPage.levelB1": "\u0421\u0435\u0440\u0435\u0434\u043D\u0456\u0439: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u0432\u0441\u044F\u043A\u0434\u0435\u043D\u043D\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438 \u0439 \u043F\u043E\u0448\u0438\u0440\u0435\u043D\u0438\u043C\u0438 \u0444\u0440\u0430\u0437\u043E\u0432\u0438\u043C\u0438 \u0434\u0456\u0454\u0441\u043B\u043E\u0432\u0430\u043C\u0438; \u0440\u0456\u0434\u0448\u0435 \u0441\u043B\u043E\u0432\u043E \u043F\u043E\u044F\u0441\u043D\u044E\u0454",
    "talkPage.levelB2": "\u0412\u0438\u0449\u0435 \u0441\u0435\u0440\u0435\u0434\u043D\u044C\u043E\u0433\u043E: \u0422\u0438\u0446\u044C \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u043E: \u0434\u043E\u0432\u0448\u0456 \u0440\u0435\u0447\u0435\u043D\u043D\u044F, \u0444\u0440\u0430\u0437\u043E\u0432\u0456 \u0434\u0456\u0454\u0441\u043B\u043E\u0432\u0430, \u0447\u0430\u0441 \u0432\u0456\u0434 \u0447\u0430\u0441\u0443 \u0456\u0434\u0456\u043E\u043C\u0430",
    "talkPage.keys": "\u041A\u043B\u0430\u0432\u0456\u0448\u0456",
    "talkPage.spaceKey": "\u0423 \u0432\u0456\u043A\u043D\u0456 \u0440\u043E\u0437\u043C\u043E\u0432\u0438: \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0438, \u043F\u043E\u0442\u0456\u043C \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438",
    "talkPage.escKey": "\u0421\u043A\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0440\u0435\u043F\u043B\u0456\u043A\u0443 \u0430\u0431\u043E \u0437\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0422\u0438\u0446\u044C",
    "talkPage.aloud": "\u0427\u0438\u0442\u0430\u0442\u0438 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0422\u0438\u0446\u044C \u0432\u0433\u043E\u043B\u043E\u0441",
    "talkPage.aloudNote": "\u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0447\u0438\u0442\u0430\u044E\u0442\u044C\u0441\u044F, \u0449\u043E\u0439\u043D\u043E \u043D\u0430\u0434\u0445\u043E\u0434\u044F\u0442\u044C; \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u043D\u043D\u044F \u043D\u0430 \u0440\u0435\u043F\u043B\u0456\u043A\u0443 \u0447\u0438\u0442\u0430\u0454 \u0457\u0457 \u0437\u043D\u043E\u0432\u0443",
    "talkPage.onTop": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u043F\u043E\u0432\u0435\u0440\u0445 \u0456\u043D\u0448\u0438\u0445 \u0432\u0456\u043A\u043E\u043D",
    "talkPage.onTopNote": "\u044F\u043A \u0437\u0456 \u0448\u043F\u0438\u043B\u044C\u043A\u043E\u044E \u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u0456 \u0432\u0456\u043A\u043D\u0430 \u0440\u043E\u0437\u043C\u043E\u0432\u0438",
    "talkPage.model": "\u041C\u043E\u0434\u0435\u043B\u044C",
    "talkPage.voice": "\u0413\u043E\u043B\u043E\u0441",
    "talkPage.kept": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0435",
    "talkPage.history": "\u0412\u0430\u0448\u0456 \u0440\u043E\u0437\u043C\u043E\u0432\u0438 \u2014 \u0443 \u0432\u0456\u043A\u043D\u0456 \u0440\u043E\u0437\u043C\u043E\u0432\u0438: \u043A\u043D\u043E\u043F\u043A\u0430 \u0456\u0441\u0442\u043E\u0440\u0456\u0457 \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u0457\u0445, \u0449\u043E\u0431 \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438 \u0440\u043E\u0437\u043C\u043E\u0432\u0443 \u0430\u0431\u043E \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438. \u0417\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F 30 \u0434\u043D\u0456\u0432 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456, \u043D\u0435 \u0431\u0456\u043B\u044C\u0448\u0435 50.",
    "check.typedKey": "{keys} \u0456 \u0432\u0432\u0435\u0434\u0456\u0442\u044C \u0439\u043E\u0433\u043E",
    "check.typedTray": "\u0441\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0439\u0442\u0435\u0441\u044F \xAB\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0443\u2026\xBB \u0432 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044E",
    "check.tryKey": "\u0423 \u0446\u044C\u043E\u043C\u0443 \u0442\u0435\u043A\u0441\u0442\u0456 \u043D\u0430\u0432\u043C\u0438\u0441\u043D\u0456 \u043F\u043E\u043C\u0438\u043B\u043A\u0438. \u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0439\u043E\u0433\u043E, {keys}, \u0430\u0431\u043E {typed}.",
    "check.tryNoKey": "\u0423 \u0446\u044C\u043E\u043C\u0443 \u0442\u0435\u043A\u0441\u0442\u0456 \u043D\u0430\u0432\u043C\u0438\u0441\u043D\u0456 \u043F\u043E\u043C\u0438\u043B\u043A\u0438. \u0412\u0438\u0434\u0456\u043B\u0456\u0442\u044C \u0439\u043E\u0433\u043E \u0439 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0441\u0432\u043E\u044E \u043A\u043B\u0430\u0432\u0456\u0448\u0443, \u0430\u0431\u043E {typed}.",
    "check.keySelected": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0432\u0438\u0434\u0456\u043B\u0435\u043D\u0438\u0439 \u0442\u0435\u043A\u0441\u0442",
    "check.typeKey": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438",
    "check.typeKeyNote": "\u043F\u043E\u0440\u043E\u0436\u043D\u044F \u043A\u0430\u0440\u0442\u043A\u0430 \u0431\u0456\u043B\u044F \u0432\u043A\u0430\u0437\u0456\u0432\u043D\u0438\u043A\u0430, \u0437 \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0457 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438; \u0442\u0430\u043A\u043E\u0436 \u0443 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044E",
    "check.speechNote": "\u0420\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0441\u0430\u043C\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454 \u0434\u0435\u044F\u043A\u0456 \u043F\u043E\u043C\u0438\u043B\u043A\u0438, \u0442\u043E\u0436 \u0443 \u043D\u0430\u0431\u0440\u0430\u043D\u043E\u043C\u0443 \u0442\u0435\u043A\u0441\u0442\u0456 \u0457\u0445 \u0432\u0438\u0434\u043D\u043E \u0431\u0456\u043B\u044C\u0448\u0435.",
    "mistakes.title": "\u041F\u043E\u043C\u0438\u043B\u043A\u0438",
    "mistakes.forget": "\u0417\u0430\u0431\u0443\u0442\u0438",
    "mistakes.noSuch": "\u0422\u0430\u043A\u043E\u0457 \u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u043D\u0435\u043C\u0430\u0454.",
    "mistakes.empty": "\u041F\u043E\u043A\u0438 \u043D\u0456\u0447\u043E\u0433\u043E. \u0422\u0443\u0442, \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456, \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F \u0442\u0435\u043A\u0441\u0442\u0438, \u044F\u043A\u0456 \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457.",
    "mistakes.repeat": "\u0412\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044E\u0454\u0442\u0435",
    "mistakes.times": { one: "{n} \u0440\u0430\u0437", few: "{n} \u0440\u0430\u0437\u0438", many: "{n} \u0440\u0430\u0437\u0456\u0432", other: "{n} \u0440\u0430\u0437\u0443" },
    "mistakes.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438",
    "mistakes.search": "\u041F\u043E\u0448\u0443\u043A \u0443 \u043F\u043E\u043C\u0438\u043B\u043A\u0430\u0445",
    "screen.how": "\u042F\u043A \u0446\u0435 \u043F\u0440\u0430\u0446\u044E\u0454",
    "screen.draw": "\u041E\u0431\u0432\u0435\u0434\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u0440\u0430\u043C\u043A\u043E\u044E",
    "screen.drawNote": "Windows \u0437\u0430\u0442\u0435\u043C\u043D\u044E\u0454 \u0435\u043A\u0440\u0430\u043D, \u043F\u043E\u043A\u0438 \u0432\u0438 \u043E\u0431\u0432\u043E\u0434\u0438\u0442\u0435",
    "screen.reads": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0454 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456",
    "screen.readsNote": "\u0432\u043E\u043D\u0430 \u0447\u0438\u0442\u0430\u0454 \u043C\u043E\u0432\u0438, \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0456 \u0443 Windows; \u0456\u043D\u0448\u0456 \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u0442\u0430\u043C (Windows OCR)",
    "screen.languages": "\u041C\u043E\u0432\u0438\u2026",
    "screen.fix": "\u0412\u0438\u043F\u0440\u0430\u0432\u0442\u0435 \u043D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u0456 \u0441\u043B\u043E\u0432\u0430 \u0432 \u043A\u0430\u0440\u0442\u0446\u0456",
    "screen.fixNote": "\u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0456\u0442\u044C \u0430\u0431\u043E \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0439\u0442\u0435 \u0432\u0433\u043E\u043B\u043E\u0441",
    "dictate.notesFolder": "\u041F\u0430\u043F\u043A\u0430 \u043D\u043E\u0442\u0430\u0442\u043E\u043A",
    "dictate.folderShown": "\u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "dictate.folderChosen": "\u0432\u0438\u0431\u0438\u0440\u0430\u0454\u0442\u044C\u0441\u044F \u043F\u0456\u0441\u043B\u044F \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "dictate.inboxPlaceholder": "\u0441\u0430\u043C\u0430 \u043F\u0430\u043F\u043A\u0430",
    "dictate.inboxAria": "\u041F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u043D\u043E\u0442\u0430\u0442\u043E\u043A",
    "dictate.folderNone": "\u0449\u0435 \u043D\u0435 \u0432\u0438\u0431\u0440\u0430\u043D\u043E; \u043D\u043E\u0442\u0430\u0442\u043A\u0430\u043C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043F\u0430\u043F\u043A\u0430 (\u043F\u0456\u0434\u0456\u0439\u0434\u0435 \u0441\u0445\u043E\u0432\u0438\u0449\u0435 Obsidian)",
    "dictate.change": "\u0417\u043C\u0456\u043D\u0438\u0442\u0438",
    "dictate.choose": "\u0412\u0438\u0431\u0440\u0430\u0442\u0438\u2026",
    "dictate.subfolder": "\u041F\u0456\u0434\u043F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u043D\u043E\u0442\u0430\u0442\u043E\u043A",
    "dictate.subfolderNote": "\u043F\u0430\u043F\u043A\u0430 \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0456 \u043D\u0435\u0457; \u0437\u0430\u043B\u0438\u0448\u0442\u0435 \u043F\u043E\u0440\u043E\u0436\u043D\u0456\u043C, \u0449\u043E\u0431 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u0442\u0438 \u0441\u0430\u043C\u0443 \u043F\u0430\u043F\u043A\u0443",
    "dictate.needsEngine": "\u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "dictate.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \xB7 {model}",
    "settings.automatic": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E",
    "dictate.speechModel": "\u041C\u043E\u0434\u0435\u043B\u044C \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F",
    "dictate.engine": "\u0420\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "dictate.typeNote": "\u0442\u0435\u043A\u0441\u0442 \u0437\u2019\u044F\u0432\u0438\u0442\u044C\u0441\u044F \u0442\u0430\u043C, \u0434\u0435 \u043A\u0443\u0440\u0441\u043E\u0440",
    "dictate.englishNote": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C, \u0433\u043E\u0432\u043E\u0440\u0456\u0442\u044C ({lang}), \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0449\u0435 \u0440\u0430\u0437; \u0434\u0440\u0443\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E",
    "dictate.noteNote": "\u0443 \u0442\u0435\u043A\u0443 \u043D\u043E\u0442\u0430\u0442\u043E\u043A",
    "dictate.againKey": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0438 \u043E\u0441\u0442\u0430\u043D\u043D\u044E \u0444\u0440\u0430\u0437\u0443",
    "dictate.againNote": "\u043F\u043E\u0432\u0442\u043E\u0440\u044E\u0454 \u0457\u0457 \u0442\u0430\u043C, \u0434\u0435 \u043A\u0443\u0440\u0441\u043E\u0440",
    "dictate.hold": "\u0423\u0442\u0440\u0438\u043C\u0443\u0432\u0430\u0442\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0443, \u0449\u043E\u0431 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0438",
    "dictate.holdNote": "\u0433\u043E\u0432\u043E\u0440\u0456\u0442\u044C, \u043F\u043E\u043A\u0438 \u0442\u0440\u0438\u043C\u0430\u0454\u0442\u0435, \u0432\u0456\u0434\u043F\u0443\u0441\u0442\u0456\u0442\u044C, \u0456 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430\u0434\u0440\u0443\u043A\u0443\u0454\u0442\u044C\u0441\u044F; \u043A\u043E\u0440\u043E\u0442\u043A\u0435 \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u043D\u043D\u044F, \u044F\u043A \u0456 \u0440\u0430\u043D\u0456\u0448\u0435, \u0432\u043C\u0438\u043A\u0430\u0454 \u0439 \u0432\u0438\u043C\u0438\u043A\u0430\u0454",
    "dictate.holdMac": "\u0423\u0442\u0440\u0438\u043C\u0430\u043D\u043D\u044F \u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0454 \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u0456: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0456 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u203A \u041F\u0440\u0438\u0432\u0430\u0442\u043D\u0456\u0441\u0442\u044C \u0456 \u0431\u0435\u0437\u043F\u0435\u043A\u0430 \u203A \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0456\u0441\u0442\u044C, \u0443\u0432\u0456\u043C\u043A\u043D\u0456\u0442\u044C \u0422\u0438\u0446\u044C. \u0414\u043E\u0442\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0432\u043C\u0438\u043A\u0430\u044E\u0442\u044C \u0456 \u0432\u0438\u043C\u0438\u043A\u0430\u044E\u0442\u044C \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u043D\u043D\u044F\u043C.",
    "dictate.panel": "\u041F\u043E\u043A\u0430\u0437\u0443\u0432\u0430\u0442\u0438 \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u0456\u0434 \u0447\u0430\u0441 \u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "dictate.panelNote": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E: \u0437\u0430\u043F\u0438\u0441 \u0432\u0438\u0434\u043D\u043E \u0437\u0430 \u0447\u0435\u0440\u0432\u043E\u043D\u043E\u044E \u043A\u0440\u0430\u043F\u043A\u043E\u044E \u0432 \u0442\u0440\u0435\u0457, \u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u0432\u0441\u0435 \u043E\u0434\u043D\u043E \u0437\u2019\u044F\u0432\u043B\u044F\u0442\u044C\u0441\u044F \u043D\u0430 \u043A\u0456\u043B\u044C\u043A\u0430 \u0441\u0435\u043A\u0443\u043D\u0434",
    "dictate.escNote": "\u0421\u043B\u043E\u0432\u0430 \u0437\u2019\u044F\u0432\u043B\u044F\u044E\u0442\u044C\u0441\u044F, \u043F\u043E\u043A\u0438 \u0432\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435. Esc \u0441\u043A\u0430\u0441\u043E\u0432\u0443\u0454 \u0444\u0440\u0430\u0437\u0443, \u0434\u043E\u043A\u0438 \u0457\u0457 \u043D\u0435 \u043D\u0430\u0434\u0440\u0443\u043A\u043E\u0432\u0430\u043D\u043E.",
    "dictate.privacy": "\u041C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456; \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0456\u043A\u0443\u0434\u0438 \u043D\u0435 \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u0454\u0442\u044C\u0441\u044F.",
    "vocab.wordPlaceholder": "\u0421\u043B\u043E\u0432\u043E",
    "vocab.wordAria": "\u0406\u043C\u2019\u044F \u0430\u0431\u043E \u0442\u0435\u0440\u043C\u0456\u043D",
    "vocab.heardPlaceholder": "\u042F\u043A \u0447\u0443\u0442\u0438, \u0447\u0435\u0440\u0435\u0437 \u043A\u043E\u043C\u0443",
    "vocab.heardAria": "\u042F\u043A \u0432\u043E\u043D\u043E \u0447\u0443\u0454\u0442\u044C\u0441\u044F",
    "vocab.change": "\u0417\u043C\u0456\u043D\u0438\u0442\u0438",
    "vocab.remove": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438 {word}",
    "vocab.addGroup": "\u0414\u043E\u0434\u0430\u0442\u0438 \u0441\u043B\u043E\u0432\u043E",
    "vocab.add": "\u0414\u043E\u0434\u0430\u0442\u0438",
    "vocab.addNote": "\u0406\u043C\u2019\u044F \u0430\u0431\u043E \u0442\u0435\u0440\u043C\u0456\u043D; \u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0439 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043F\u0438\u0448\u0443\u0442\u044C \u0439\u043E\u0433\u043E \u0441\u0430\u043C\u0435 \u0442\u0430\u043A, \u0430 \u043F\u043E\u0447\u0443\u0442\u0443 \u0444\u043E\u0440\u043C\u0443 \u0437\u0430\u043C\u0456\u043D\u044E\u044E\u0442\u044C, \u0434\u0435 \u0431 \u0457\u0457 \u043D\u0435 \u0441\u043A\u0430\u0437\u0430\u043B\u0438.",
    "vocab.words": "\u0421\u043B\u043E\u0432\u0430",
    "vocab.clearAll": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0432\u0441\u0435",
    "vocab.empty": "\u041F\u043E\u043A\u0438 \u043D\u0456\u0447\u043E\u0433\u043E. \u0414\u043E\u0434\u0430\u0439\u0442\u0435 \u0456\u043C\u2019\u044F \u0430\u0431\u043E \u0441\u043B\u043E\u0432\u043E \u0432\u0438\u0449\u0435.",
    "vocab.shared": "\u0407\u0445 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C \u0456 \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F, \u0456 \u0437\u0430\u043F\u0438\u0441\u0438.",
    "dictate.phrases": "\u0424\u0440\u0430\u0437\u0438",
    "dictate.said": "\u0421\u043A\u0430\u0437\u0430\u043D\u043E: {heard}",
    "dictate.recentEmpty": "\u041F\u043E\u043A\u0438 \u043D\u0456\u0447\u043E\u0433\u043E. \u041D\u0430\u0434\u0438\u043A\u0442\u043E\u0432\u0430\u043D\u0456 \u0444\u0440\u0430\u0437\u0438 (\u043D\u0435 \u043D\u043E\u0442\u0430\u0442\u043A\u0438) \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F \u0442\u0443\u0442 30 \u0434\u043D\u0456\u0432, \u043D\u0435 \u0431\u0456\u043B\u044C\u0448\u0435 200.",
    "dictate.yesterdayAt": "\u0443\u0447\u043E\u0440\u0430 {time}",
    "dictate.copiedText": "\u0421\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E: {text}",
    "dictate.justNow": "\u0449\u043E\u0439\u043D\u043E",
    "dictate.minAgo": { one: "{n} \u0445\u0432 \u0442\u043E\u043C\u0443", few: "{n} \u0445\u0432 \u0442\u043E\u043C\u0443", many: "{n} \u0445\u0432 \u0442\u043E\u043C\u0443", other: "{n} \u0445\u0432 \u0442\u043E\u043C\u0443" },
    "dictate.hAgo": { one: "{n} \u0433\u043E\u0434 \u0442\u043E\u043C\u0443", few: "{n} \u0433\u043E\u0434 \u0442\u043E\u043C\u0443", many: "{n} \u0433\u043E\u0434 \u0442\u043E\u043C\u0443", other: "{n} \u0433\u043E\u0434 \u0442\u043E\u043C\u0443" },
    "dictate.yesterday": "\u0443\u0447\u043E\u0440\u0430",
    "transcribe.speakers": "\u0425\u0442\u043E \u043A\u043E\u043B\u0438 \u0433\u043E\u0432\u043E\u0440\u0438\u0432",
    "transcribe.speakersNote": "\u0441\u043B\u043E\u0432\u0430 \u0432\u0436\u0435 \u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u043E; \u0446\u0435 \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u0454 \u0433\u043E\u043B\u043E\u0441\u0438",
    "transcribe.downloading": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026",
    "transcribe.notInstalled": "\u043D\u0435 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \xB7 \u2248{size}",
    "transcribe.onCard": "\u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456",
    "transcribe.onCpu": "\u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456",
    "transcribe.ready": "\u0433\u043E\u0442\u043E\u0432\u043E",
    "transcribe.keySaved": "\u043A\u043B\u044E\u0447 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E",
    "transcribe.checking": "\u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430\u2026",
    "transcribe.needsKey": "\u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u043A\u043B\u044E\u0447",
    "transcribe.keyFailed": "\u043A\u043B\u044E\u0447 \u043D\u0435 \u043F\u0456\u0434\u0456\u0439\u0448\u043E\u0432",
    "transcribe.noAccess": "\u0449\u0435 \u043D\u0435\u043C\u0430\u0454 \u0434\u043E\u0441\u0442\u0443\u043F\u0443",
    "transcribe.couldNotCheck": "\u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438",
    "transcribe.new": "\u041D\u043E\u0432\u0430 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0430",
    "transcribe.setup": "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "transcribe.keptIn": "\u0420\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u0442\u044C\u0441\u044F \u0432",
    "kb.inOrder": "\u0423 \u0442\u0430\u043A\u043E\u043C\u0443 \u043F\u043E\u0440\u044F\u0434\u043A\u0443",
    "kb.earlier": "\u0420\u0430\u043D\u0456\u0448\u0435",
    "kb.later": "\u041F\u0456\u0437\u043D\u0456\u0448\u0435",
    "kb.leaveOut": "\u0412\u0438\u043B\u0443\u0447\u0438\u0442\u0438",
    "kb.addLayout": "\u0414\u043E\u0434\u0430\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.addLayoutNote": "\u043E\u0434\u043D\u0443 \u0437 \u043D\u0430\u044F\u0432\u043D\u0438\u0445 \u0443 Windows; \u0432\u043E\u043D\u0430 \u0441\u0442\u0430\u043D\u0435 \u043E\u0441\u0442\u0430\u043D\u043D\u044C\u043E\u044E",
    "kb.pickLayout": "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.ownOrder": "\u0412\u0430\u0448 \u0432\u043B\u0430\u0441\u043D\u0438\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A. \u0412\u0438\u043B\u0443\u0447\u0456\u0442\u044C \u0443\u0441\u0456 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u0449\u043E\u0431 \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u0438\u0441\u044F \u0434\u043E \u043C\u043E\u0432, \u044F\u043A\u0438\u043C\u0438 \u0432\u0438 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0454\u0442\u0435\u0441\u044F.",
    "kb.orderFromLanguages": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0431\u0435\u0440\u0435\u0442\u044C\u0441\u044F \u0437 \u043C\u043E\u0432, \u044F\u043A\u0438\u043C\u0438 \u0432\u0438 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0454\u0442\u0435\u0441\u044F (\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F); \u043F\u0435\u0440\u0435\u043C\u0456\u0441\u0442\u0456\u0442\u044C \u0430\u0431\u043E \u0432\u0438\u043B\u0443\u0447\u0456\u0442\u044C \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443, \u0449\u043E\u0431 \u0437\u0430\u0434\u0430\u0442\u0438 \u0441\u0432\u0456\u0439.",
    "kb.ownKey": "\u0412\u043B\u0430\u0441\u043D\u0430 \u043A\u043B\u0430\u0432\u0456\u0448\u0430",
    "kb.straight": "\u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454 \u043E\u0434\u0440\u0430\u0437\u0443 \u043D\u0430 \u043D\u0435\u0457",
    "kb.capitals": "\u0412\u0435\u043B\u0438\u043A\u0456 \u043B\u0456\u0442\u0435\u0440\u0438",
    "kb.twoCaps": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0434\u0432\u0456 \u0432\u0435\u043B\u0438\u043A\u0456 \u043B\u0456\u0442\u0435\u0440\u0438 \u043D\u0430 \u043F\u043E\u0447\u0430\u0442\u043A\u0443",
    "kb.twoCapsNote": "\u041F\u0420\u0438\u0432\u0456\u0442 \u2192 \u041F\u0440\u0438\u0432\u0456\u0442; ID \u0442\u0430 URL \u043B\u0438\u0448\u0430\u044E\u0442\u044C\u0441\u044F",
    "kb.capsLock": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0441\u043B\u043E\u0432\u043E, \u043D\u0430\u0431\u0440\u0430\u043D\u0435 \u0437 \u0443\u0432\u0456\u043C\u043A\u043D\u0435\u043D\u0438\u043C Caps Lock",
    "kb.capsLockNote": "\u043F\u0420\u0418\u0412\u0406\u0422 \u2192 \u041F\u0440\u0438\u0432\u0456\u0442, \u0456 Caps Lock \u0432\u0438\u043C\u0438\u043A\u0430\u0454\u0442\u044C\u0441\u044F",
    "kb.keepCaps": "\u041D\u0435 \u0447\u0456\u043F\u0430\u0442\u0438 \u0441\u043B\u043E\u0432\u0430 \u0432\u0435\u043B\u0438\u043A\u0438\u043C\u0438 \u043B\u0456\u0442\u0435\u0440\u0430\u043C\u0438",
    "kb.keepCapsNote": "\u0430\u0431\u0440\u0435\u0432\u0456\u0430\u0442\u0443\u0440\u0438 \u0432\u0435\u043B\u0438\u043A\u0438\u043C\u0438 \u043B\u0456\u0442\u0435\u0440\u0430\u043C\u0438 \u043D\u0456\u043A\u043E\u043B\u0438 \u043D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u044C\u0441\u044F",
    "kb.when": "\u041A\u043E\u043B\u0438",
    "kb.onPause": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0442\u0430\u043A\u043E\u0436 \u043F\u0456\u0441\u043B\u044F \u043F\u0430\u0443\u0437\u0438",
    "kb.onPauseNote": "\u0445\u0438\u0431\u043D\u0435 \u0441\u043B\u043E\u0432\u043E \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u044C\u0441\u044F \u0437\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443, \u044F\u043A \u0432\u0438 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043B\u0438 \u0434\u0440\u0443\u043A\u0443\u0432\u0430\u0442\u0438",
    "kb.sound": "\u0422\u0438\u0445\u043E \u043A\u043B\u0430\u0446\u0430\u0442\u0438, \u043A\u043E\u043B\u0438 \u0441\u043B\u043E\u0432\u043E \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
    "kb.chime": "\u0417\u0432\u0443\u043A, \u043A\u043E\u043B\u0438 \u0437\u043C\u0456\u043D\u044E\u0454\u0442\u044C\u0441\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.chimeNote": "\u043A\u043E\u043B\u0438 \u0432\u0438 \u0457\u0457 \u0437\u043C\u0456\u043D\u044E\u0454\u0442\u0435; \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430 \u0437\u0432\u0443\u0447\u0438\u0442\u044C \u0432\u0438\u0449\u0435",
    "kb.chimeName": "\u0417\u0432\u0443\u043A",
    "kb.chimePick": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C, \u0449\u043E\u0431 \u043F\u043E\u0441\u043B\u0443\u0445\u0430\u0442\u0438: \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430, \u043F\u043E\u0442\u0456\u043C \u0456\u043D\u0448\u0430 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.chime.glass": "\u0421\u043A\u043B\u043E",
    "kb.chime.pluck": "\u0429\u0438\u043F\u043E\u043A",
    "kb.chime.string": "\u0421\u0442\u0440\u0443\u043D\u0430",
    "kb.chime.duck": "\u041A\u0430\u0447\u0435\u0447\u043A\u0430",
    "kb.shortWords": "\u041A\u043E\u0440\u043E\u0442\u043A\u0456 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u044C\u0441\u044F \u0440\u0430\u0437\u043E\u043C \u0456\u0437 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u043C \u0441\u043B\u043E\u0432\u043E\u043C: z zr \u2192 \u044F \u044F\u043A. \u041F\u0456\u0441\u043B\u044F \u0442\u043E\u0433\u043E \u044F\u043A \u0432\u0438 \u0441\u0430\u043C\u0456 \u043F\u0435\u0440\u0435\u043C\u043A\u043D\u0435\u0442\u0435 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443, \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u0441\u043B\u043E\u0432\u043E \u043B\u0438\u0448\u0430\u0454\u0442\u044C\u0441\u044F \u044F\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u0435.",
    "kb.addProgram": "\u0414\u043E\u0434\u0430\u0442\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443",
    "kb.addProgramNote": "\u041D\u0430\u0437\u0432\u0430 \u0457\u0457 .exe. \u0421\u043F\u043E\u0447\u0430\u0442\u043A\u0443 \u0432 \u043D\u0456\u0439 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443; \u0432\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 \u0457\u0457, \u0449\u043E\u0431 \u0432\u0438\u0431\u0440\u0430\u0442\u0438 \u0431\u0456\u043B\u044C\u0448\u0435.",
    "kb.addThis": "\u0414\u043E\u0434\u0430\u0442\u0438 {exe}",
    "kb.addThisNote": "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430, \u0449\u043E \u0449\u043E\u0439\u043D\u043E \u0431\u0443\u043B\u0430 \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u044C\u043E\u043C\u0443 \u043F\u043B\u0430\u043D\u0456",
    "kb.addRunning": "\u0414\u043E\u0434\u0430\u0442\u0438 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u0443 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443",
    "kb.addRunningNote": "\u0437 \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0438\u043C \u0437\u0430\u0440\u0430\u0437 \u0432\u0456\u043A\u043D\u043E\u043C",
    "kb.pickProgram": "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443",
    "kb.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u0438",
    "kb.programsEmpty": "\u041F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454. \u0414\u043E\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0443 \u0432\u0438\u0449\u0435: \u0422\u0438\u0446\u044C \u0432\u0438\u043C\u0438\u043A\u0430\u0454 \u0432 \u043D\u0456\u0439 \u0432\u0438\u0431\u0440\u0430\u043D\u0435 \u0432\u0430\u043C\u0438 \u0430\u0431\u043E \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454 \u043D\u0430 \u0457\u0457 \u0432\u043B\u0430\u0441\u043D\u0443 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443, \u043A\u043E\u043B\u0438 \u0432\u043E\u043D\u0430 \u0432\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u0456\u0439 \u043F\u043B\u0430\u043D.",
    "kb.partFix": "\u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.partSwitch": "\u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F",
    "kb.partBadge": "\u0437\u043D\u0430\u0447\u043E\u043A \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438",
    "kb.partKeys": "\u0443\u0441\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0422\u0438\u0446\u044C",
    "kb.leftOut": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E: {parts}",
    "kb.startsIn": "\u043F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u0430 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430: {layout}",
    "kb.nothingLeftOut": "\u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E",
    "kb.noLonger": "\u0426\u0456\u0454\u0457 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438 \u0432\u0436\u0435 \u043D\u0435\u043C\u0430\u0454 \u0432 \u0441\u043F\u0438\u0441\u043A\u0443.",
    "kb.hereKryakl": "\u0422\u0443\u0442 \u0422\u0438\u0446\u044C",
    "kb.fixes": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454 \u0441\u043B\u043E\u0432\u0430 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.fixesNote": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E: \u0441\u043B\u043E\u0432\u0430 \u043B\u0438\u0448\u0430\u044E\u0442\u044C\u0441\u044F \u044F\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u0456; \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0440\u0430\u0446\u044E\u0454",
    "kb.switches": "\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443 \u0441\u0432\u043E\u0457\u043C\u0438 \u043A\u043B\u0430\u0432\u0456\u0448\u0430\u043C\u0438",
    "kb.switchesNote": "\u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0456 \u0432\u043B\u0430\u0441\u043D\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043E\u043A",
    "kb.shows": "\u041F\u043E\u043A\u0430\u0437\u0443\u0454 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443 \u0431\u0456\u043B\u044F \u043A\u0443\u0440\u0441\u043E\u0440\u0430",
    "kb.hears": "\u0412\u0437\u0430\u0433\u0430\u043B\u0456 \u0440\u0435\u0430\u0433\u0443\u0454 \u043D\u0430 \u0441\u0432\u043E\u0457 \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "kb.hearsNote": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E: \u0442\u0443\u0442 \u043D\u0435 \u043F\u0440\u0430\u0446\u044E\u0454 \u0436\u043E\u0434\u043D\u0430 \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u0422\u0438\u0446\u044C, \u043A\u0440\u0456\u043C \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u043F\u0430\u0443\u0437\u0438",
    "kb.layout": "\u0420\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.startsInTitle": "\u041F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u0430 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.startsInNote": "\u0449\u043E\u0440\u0430\u0437\u0443, \u043A\u043E\u043B\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430 \u0432\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u043D\u0430 \u043F\u0435\u0440\u0435\u0434\u043D\u0456\u0439 \u043F\u043B\u0430\u043D",
    "kb.asItWas": "\u042F\u043A \u0431\u0443\u043B\u0430",
    "kb.outOfList": "\u041F\u0440\u0438\u0431\u0440\u0430\u0442\u0438 \u0437\u0456 \u0441\u043F\u0438\u0441\u043A\u0443",
    "kb.outOfListNote": "\u0442\u0443\u0442 \u0437\u043D\u043E\u0432\u0443 \u043F\u0440\u0430\u0446\u044E\u0454 \u0432\u0441\u0435",
    "kb.remove": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438",
    "kb.learn": "\u041D\u0430\u0432\u0447\u0430\u0442\u0438\u0441\u044F \u0437 \u043C\u043E\u0433\u043E \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.learnNote": "\u043D\u0456\u043A\u043E\u043B\u0438 \u0432 \u043F\u043E\u043B\u0456 \u043F\u0430\u0440\u043E\u043B\u044F, \u0443 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0456 \u0431\u0435\u0437 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0447\u0438 \u043D\u0430 \u043F\u043E\u0432\u043D\u043E\u043C\u0443 \u0435\u043A\u0440\u0430\u043D\u0456",
    "kb.fixedAlways": "\u0417\u0430\u0432\u0436\u0434\u0438 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u044C\u0441\u044F",
    "kb.into": "\u2192 {lang}",
    "kb.fixedAlwaysEmpty": "\u0421\u043B\u043E\u0432\u043E, \u044F\u043A\u0435 \u0432\u0438 \u0434\u0432\u0456\u0447\u0456 \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u043B\u0438 \u0432\u0440\u0443\u0447\u043D\u0443 (\u043A\u043B\u0430\u0432\u0456\u0448\u0435\u044E \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0430\u0431\u043E \u0441\u0442\u0435\u0440\u0448\u0438 \u0439 \u043D\u0430\u0431\u0440\u0430\u0432\u0448\u0438 \u0432 \u0456\u043D\u0448\u0456\u0439 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u0446\u0456), \u0434\u0430\u043B\u0456 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454\u0442\u044C\u0441\u044F \u0441\u0430\u043C\u0435.",
    "kb.myWordNote": "{lang} \xB7 \u044F\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u0435 \u043D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454\u0442\u044C\u0441\u044F, \u0430 \u0437 \u0447\u0443\u0436\u043E\u0457 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u043D\u044C\u043E\u0433\u043E",
    "kb.myWordsEmpty": "\u0421\u043B\u043E\u0432\u043E, \u044F\u043A\u043E\u0433\u043E \u043D\u0435\u043C\u0430\u0454 \u0432 \u0436\u043E\u0434\u043D\u043E\u043C\u0443 \u0441\u043B\u043E\u0432\u043D\u0438\u043A\u0443 \u0456 \u044F\u043A\u0435 \u0432\u0438 \u0442\u0440\u0438\u0447\u0456 \u043D\u0430\u0431\u0440\u0430\u043B\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E, \u0441\u0442\u0430\u0454 \u0432\u0430\u0448\u0438\u043C: \u0422\u0438\u0446\u044C \u043B\u0438\u0448\u0430\u0454 \u0439\u043E\u0433\u043E \u044F\u043A \u043D\u0430\u0431\u0440\u0430\u043D\u0435 \u0456 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454 \u043D\u0430 \u043D\u044C\u043E\u0433\u043E, \u043A\u043E\u043B\u0438 \u0439\u043E\u0433\u043E \u043D\u0430\u0431\u0440\u0430\u043D\u043E \u0432 \u0447\u0443\u0436\u0456\u0439 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u0446\u0456. \u0414\u043E \u0442\u043E\u0433\u043E \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044C\u0441\u044F \u043B\u0438\u0448\u0435 \u043D\u0435\u0447\u0438\u0442\u0430\u0431\u0435\u043B\u044C\u043D\u0438\u0439 \u0432\u0456\u0434\u0431\u0438\u0442\u043E\u043A \u0441\u043B\u043E\u0432\u0430.",
    "kb.forgetAll": "\u0417\u0430\u0431\u0443\u0442\u0438 \u0432\u0441\u0435",
    "kb.forgetAllNote": "\u0432\u0438\u0432\u0447\u0435\u043D\u0435 \u0422\u0438\u0446\u044C \u0437\u043D\u0438\u043A\u043D\u0435; \xAB\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\xBB \u043B\u0438\u0448\u0438\u0442\u044C\u0441\u044F",
    "kb.forgetBtn": "\u0417\u0430\u0431\u0443\u0442\u0438",
    "kb.keptPlaceholder": "\u0441\u043B\u043E\u0432\u043E, \u044F\u043A \u0432\u0438 \u0439\u043E\u0433\u043E \u043D\u0430\u0431\u0438\u0440\u0430\u0454\u0442\u0435",
    "kb.keptAddNote": "\u041A\u043B\u0430\u0432\u0456\u0448\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0434\u0440\u0430\u0437\u0443 \u043F\u0456\u0441\u043B\u044F \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0442\u0435\u0436 \u0434\u043E\u0434\u0430\u0454 \u0441\u043B\u043E\u0432\u043E.",
    "kb.keptEmpty": "\u041F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454. \u0414\u043E\u0434\u0430\u0439\u0442\u0435 \u0441\u043B\u043E\u0432\u043E \u0432\u0438\u0449\u0435 \u0430\u0431\u043E \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043A\u043B\u0430\u0432\u0456\u0448\u0443 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0434\u0440\u0430\u0437\u0443 \u043F\u0456\u0441\u043B\u044F \u043D\u0435\u0431\u0430\u0436\u0430\u043D\u043E\u0433\u043E \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F.",
    "kb.alsoUsing": "\u041A\u043B\u0430\u0432\u0456\u0430\u0442\u0443\u0440\u0443 \u0442\u0430\u043A\u043E\u0436 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C: {apps}.",
    "kb.oneOfThem": "\u041E\u0434\u043D\u0430 \u0437 \u043D\u0438\u0445 \u0441\u0430\u043C\u0430 \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u0454 \u043A\u043B\u0430\u0432\u0456\u0448\u0456; \u0422\u0438\u0446\u044C \u0457\u0445 \u0456\u0433\u043D\u043E\u0440\u0443\u0454.",
    "kb.aProgram": "\u042F\u043A\u0430\u0441\u044C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430 \u0441\u0430\u043C\u0430 \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u0454 \u043A\u043B\u0430\u0432\u0456\u0448\u0456; \u0422\u0438\u0446\u044C \u0457\u0445 \u0456\u0433\u043D\u043E\u0440\u0443\u0454.",
    "kb.switchKey": "\u041F\u0435\u0440\u0435\u043C\u043A\u043D\u0443\u0442\u0438 \u043D\u0430 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0443 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443",
    "kb.switchTap": "\u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043B\u0438\u0448\u0435 \u0446\u044E \u043A\u043B\u0430\u0432\u0456\u0448\u0443, \u0431\u0435\u0437 \u0456\u043D\u0448\u0438\u0445",
    "kb.switchNote": "\u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454 \u043D\u0430 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0443 \u0437 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043E\u043A, \u043F\u0435\u0440\u0435\u043B\u0456\u0447\u0435\u043D\u0438\u0445 \u043D\u0438\u0436\u0447\u0435",
    "kb.switchingByKeys": "\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u043A\u043B\u0430\u0432\u0456\u0448\u0430\u043C\u0438",
    "kb.fixKey": "\u0412\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u0438 \u043E\u0441\u0442\u0430\u043D\u043D\u0456 \u0441\u043B\u043E\u0432\u0430",
    "kb.fixKeyNote": "\u043F\u0435\u0440\u0435\u0434\u0440\u0443\u043A\u043E\u0432\u0443\u0454 \u043D\u0430\u0431\u0440\u0430\u043D\u0435 \u043D\u0435 \u0432 \u0442\u0456\u0439 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u0446\u0456; \u0449\u0435 \u043E\u0434\u043D\u0435 \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u043D\u043D\u044F \u2014 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0430 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430",
    "kb.theFixKey": "\u041A\u043B\u0430\u0432\u0456\u0448\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F",
    "kb.autoFix": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0441\u043B\u043E\u0432\u0430 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.autoFixNote": "{typed} \u2192 {fixed} \u043D\u0430 \u043F\u0440\u043E\u0431\u0456\u043B\u0456; \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0434\u0440\u0430\u0437\u0443 \u043F\u0456\u0441\u043B\u044F \u0441\u043A\u0430\u0441\u043E\u0432\u0443\u0454",
    "kb.fixing": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0431\u043E\u0440\u0443",
    "kb.fixingNote": "\u0432\u0435\u043B\u0438\u043A\u0456 \u043B\u0456\u0442\u0435\u0440\u0438, \u043A\u043E\u0440\u043E\u0442\u043A\u0456 \u0441\u043B\u043E\u0432\u0430, \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0441\u043B\u044F \u043F\u0430\u0443\u0437\u0438",
    "kb.badgeNote": "\u043D\u0435\u0432\u0435\u043B\u0438\u043A\u0438\u0439 \u0437\u043D\u0430\u0447\u043E\u043A \u0437\u2019\u044F\u0432\u043B\u044F\u0454\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0437\u043C\u0456\u043D\u044E\u0454\u0442\u044C\u0441\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0430 \u0430\u0431\u043E Caps Lock",
    "kb.trayNote": "\u0437\u043D\u0430\u0447\u043E\u043A \u0443 \u0442\u0440\u0435\u0457 \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u043F\u043E\u0442\u043E\u0447\u043D\u0443 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443, \u043D\u0430\u043F\u0440\u0438\u043A\u043B\u0430\u0434 en \u0430\u0431\u043E uk",
    "kb.fullScreen": "\u0412\u0438\u043C\u0438\u043A\u0430\u0442\u0438\u0441\u044F \u043D\u0430 \u043F\u043E\u0432\u043D\u043E\u043C\u0443 \u0435\u043A\u0440\u0430\u043D\u0456",
    "kb.fullScreenNote": "\u0456\u0433\u0440\u0438, \u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0456\u0457, \u0432\u0456\u0434\u0435\u043E",
    "kb.layoutsOwn": "\u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u044F\u043A\u0438\u043C\u0438 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F; \u0437 \u0432\u043B\u0430\u0441\u043D\u043E\u044E \u043A\u043B\u0430\u0432\u0456\u0448\u0435\u044E: {n}",
    "kb.layoutsNote": "\u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u044F\u043A\u0438\u043C\u0438 \u043F\u043E \u0447\u0435\u0440\u0437\u0456 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043A\u043B\u0430\u0432\u0456\u0448\u0430 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F",
    "kb.rivals": { one: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E {names}: \u0432\u0438\u043C\u043A\u043D\u0456\u0442\u044C \u0443 \u043D\u0456\u0439 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u0456\u043D\u0430\u043A\u0448\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\u043C\u0443\u0442\u044C\u0441\u044F \u0434\u0432\u0456\u0447\u0456.", few: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E {names}: \u0432\u0438\u043C\u043A\u043D\u0456\u0442\u044C \u0443 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u0456\u043D\u0430\u043A\u0448\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\u043C\u0443\u0442\u044C\u0441\u044F \u0434\u0432\u0456\u0447\u0456.", many: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E {names}: \u0432\u0438\u043C\u043A\u043D\u0456\u0442\u044C \u0443 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u0456\u043D\u0430\u043A\u0448\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\u043C\u0443\u0442\u044C\u0441\u044F \u0434\u0432\u0456\u0447\u0456.", other: "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E {names}: \u0432\u0438\u043C\u043A\u043D\u0456\u0442\u044C \u0443 \u043D\u0438\u0445 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438, \u0456\u043D\u0430\u043A\u0448\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\u043C\u0443\u0442\u044C\u0441\u044F \u0434\u0432\u0456\u0447\u0456." },
    "kb.elevated": "{app} \u043F\u0440\u0430\u0446\u044E\u0454 \u0432\u0456\u0434 \u0456\u043C\u0435\u043D\u0456 \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430: Windows \u043D\u0435 \u0434\u0430\u0454 \u0422\u0438\u0446\u044C \u0457\u0457 \u043A\u043B\u0430\u0432\u0456\u0448, \u0442\u043E\u0436 \u0442\u0430\u043C \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0454\u0442\u044C\u0441\u044F \u0439 \u043D\u0435 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454\u0442\u044C\u0441\u044F.",
    "kb.trouble": "\u041F\u043E\u043C\u0456\u0447\u043D\u0438\u043A \u043A\u043B\u0430\u0432\u0456\u0430\u0442\u0443\u0440\u0438: {trouble}",
    "kb.macAccess": "\u0429\u043E\u0431 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438 \u0439 \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0442\u0438 \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0443, \u0422\u0438\u0446\u044C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0456\u0441\u0442\u044C: \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0456 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u203A \u041F\u0440\u0438\u0432\u0430\u0442\u043D\u0456\u0441\u0442\u044C \u0456 \u0431\u0435\u0437\u043F\u0435\u043A\u0430 \u203A \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0456\u0441\u0442\u044C, \u0443\u0432\u0456\u043C\u043A\u043D\u0456\u0442\u044C \u0422\u0438\u0446\u044C.",
    "kb.macAccessOpen": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u0456",
    "kb.macInput": "\u0422\u0438\u0446\u044C \u0431\u0430\u0447\u0438\u0442\u044C \u043B\u0438\u0448\u0435 \u043A\u043B\u0430\u0432\u0456\u0448\u0456-\u043C\u043E\u0434\u0438\u0444\u0456\u043A\u0430\u0442\u043E\u0440\u0438: \u0439\u043E\u043C\u0443 \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0449\u0435 \u041C\u043E\u043D\u0456\u0442\u043E\u0440\u0438\u043D\u0433 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F. \u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0456 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u203A \u041F\u0440\u0438\u0432\u0430\u0442\u043D\u0456\u0441\u0442\u044C \u0456 \u0431\u0435\u0437\u043F\u0435\u043A\u0430 \u203A \u041C\u043E\u043D\u0456\u0442\u043E\u0440\u0438\u043D\u0433 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F, \u0443\u0432\u0456\u043C\u043A\u043D\u0456\u0442\u044C \u0422\u0438\u0446\u044C (\u0430\u0431\u043E \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u0439\u043E\u0433\u043E \u0447\u0435\u0440\u0435\u0437 +), \u043F\u043E\u0442\u0456\u043C \u0437\u0430\u043A\u0440\u0438\u0439\u0442\u0435 \u0439 \u0437\u043D\u043E\u0432\u0443 \u0432\u0456\u0434\u043A\u0440\u0438\u0439\u0442\u0435 \u0422\u0438\u0446\u044C.",
    "kb.macInputOpen": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0438 \u041C\u043E\u043D\u0456\u0442\u043E\u0440\u0438\u043D\u0433\u0443 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F",
    "kb.windowsOnly": "\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F \u0439 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438 \u043F\u043E\u043A\u0438 \u0449\u043E \u043F\u0440\u0430\u0446\u044E\u044E\u0442\u044C \u043B\u0438\u0448\u0435 \u0443 Windows.",
    "kb.privacy": "\u0422\u0438\u0446\u044C \u0447\u0438\u0442\u0430\u0454 \u043D\u0430\u0442\u0438\u0441\u043A\u0430\u043D\u043D\u044F \u043A\u043B\u0430\u0432\u0456\u0448 \u043B\u0438\u0448\u0435 \u0434\u043B\u044F \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0440\u043E\u0437\u043A\u043B\u0430\u0434\u043A\u0438 \u0456 \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0456\u043A\u0443\u0434\u0438 \u043D\u0435 \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u0454. \u0412\u0456\u043D \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454 \u0442\u0456\u043B\u044C\u043A\u0438 \u0432\u0438\u0432\u0447\u0435\u043D\u0456 \u0441\u043B\u043E\u0432\u0430, \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "words.noSuch": "\u0422\u0430\u043A\u043E\u0433\u043E \u0441\u043B\u043E\u0432\u0430 \u043D\u0435\u043C\u0430\u0454.",
    "words.empty": "\u0421\u043B\u0456\u0432 \u043F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454. \u041A\u043B\u0430\u0446\u043D\u0456\u0442\u044C \u0441\u043B\u043E\u0432\u043E \u0432 \u043A\u0430\u0440\u0442\u0446\u0456 \u0439 \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0439\u043E\u0433\u043E \u0437\u0456\u0440\u043E\u0447\u043A\u0443.",
    "words.search": "\u041F\u043E\u0448\u0443\u043A \u0441\u043B\u0456\u0432 \u0456 \u0440\u0435\u0447\u0435\u043D\u044C",
    "words.hint": "\u0417\u0456\u0440\u043E\u0447\u043A\u0430 \u0432 \u043A\u0430\u0440\u0442\u0446\u0456 \u0441\u043B\u043E\u0432\u0430 \u0434\u043E\u0434\u0430\u0454 \u0439\u043E\u0433\u043E \u0441\u044E\u0434\u0438",
    "words.export": "\u0415\u043A\u0441\u043F\u043E\u0440\u0442 \u0434\u043B\u044F Anki\u2026",
    "settings.natural": "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \u0433\u043E\u043B\u043E\u0441",
    "settings.naturalNote": "{size} \u041C\u0411 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u0438, \u0434\u0430\u043B\u0456 \u0447\u0438\u0442\u0430\u0454 \u043E\u0444\u043B\u0430\u0439\u043D (Kokoro)",
    "settings.downloadFailed": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F.",
    "settings.naturalDownloading": "\u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439 \xB7 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F {pct}%",
    "settings.autoNatural": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \xB7 \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u0438\u0439",
    "settings.autoWindows": "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \xB7 Windows",
    "storage.fast": "\u0428\u0432\u0438\u0434\u043A\u0438\u0439 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434",
    "storage.fastNote": "\u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u0446\u044E \u043C\u043E\u0432\u0443 \u0432 \u043E\u0431\u0438\u0434\u0432\u0430 \u0431\u043E\u043A\u0438 (Firefox Translations)",
    "storage.dict": "\u0417\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0441\u043B\u0456\u0432",
    "storage.dictNote": "\u0449\u043E \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u043A\u0430\u0440\u0442\u043A\u0430 \u0441\u043B\u043E\u0432\u0430 (Wiktionary)",
    "storage.voiceNote": "\u0447\u0438\u0442\u0430\u0454 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0443 \u0432\u0433\u043E\u043B\u043E\u0441 (Kokoro)",
    "storage.llmNote": "\u043C\u043E\u0432\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C, \u0449\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u0456 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u044F\u0454 \u0432\u0430\u0448\u0443 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0443 ({model})",
    "storage.unused": "\u041C\u043E\u0434\u0435\u043B\u0456, \u0449\u043E \u0431\u0456\u043B\u044C\u0448\u0435 \u043D\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u044E\u0442\u044C\u0441\u044F",
    "storage.unusedNote": "\u043C\u043E\u0434\u0435\u043B\u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443 \u0441\u0442\u0430\u0440\u0456\u0448\u043E\u0457 \u0432\u0435\u0440\u0441\u0456\u0457 \u0422\u0438\u0446\u044C (TranslateGemma)",
    "storage.llama": "\u0417\u0430\u043F\u0443\u0441\u043A \u043C\u043E\u0432\u043D\u0438\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439",
    "storage.llamaNote": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454 \xAB{a}\xBB \u0456 \xAB{b}\xBB \u043D\u0430 \u0431\u0443\u0434\u044C-\u044F\u043A\u0456\u0439 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456 \u0430\u0431\u043E \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456 (llama.cpp)",
    "storage.speechModelNote": "\u0437\u0430\u043F\u0438\u0441\u0443\u0454 \u0441\u043A\u0430\u0437\u0430\u043D\u0435",
    "storage.speech": "\u0420\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u0432\u0430\u043D\u043D\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "storage.speechNote": "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0430, \u0449\u043E \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454 \u043C\u043E\u0434\u0435\u043B\u0456 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F (Python, faster-whisper)",
    "storage.gpu": "\u041F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0438",
    "storage.gpuNote": "\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0430 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0456 NVIDIA, \u0443 \u043A\u0456\u043B\u044C\u043A\u0430 \u0440\u0430\u0437\u0456\u0432 \u0448\u0432\u0438\u0434\u0448\u0435 (CUDA)",
    "storage.speakersNote": "\u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u0454 \u0433\u043E\u043B\u043E\u0441\u0438 \u0432 \u0437\u0430\u043F\u0438\u0441\u0456 (PyTorch, pyannote)",
    "storage.yours": "\u0412\u0430\u0448\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0456 \u0441\u043F\u0438\u0441\u043A\u0438",
    "storage.yoursNote": "\u0441\u043B\u043E\u0432\u0430, \u043F\u043E\u043C\u0438\u043B\u043A\u0438, \u0432\u0438\u0432\u0447\u0435\u043D\u0435 \u0422\u0438\u0446\u044C, \u0436\u0443\u0440\u043D\u0430\u043B\u0438",
    "storage.transcriptsNote": "\u0432\u0430\u0448\u0456: \u0442\u0435\u043A\u0441\u0442 \u0456 \u043D\u0435\u0432\u0435\u043B\u0438\u043A\u0430 \u043A\u043E\u043F\u0456\u044F \u0437\u0432\u0443\u043A\u0443",
    "storage.speechToText": "{about} \xB7 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0432 \u0442\u0435\u043A\u0441\u0442",
    "storage.cudaNote": "\u0437\u0431\u0456\u0440\u043A\u0430 \u0434\u043B\u044F NVIDIA, \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0456, \u0449\u043E \u043D\u0435 \u0432\u043C\u0456\u0449\u0430\u0454\u0442\u044C\u0441\u044F \u0443 \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0443 (llama.cpp CUDA)",
    "storage.lossTranslate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F \u0434\u043E \xAB\u0428\u0432\u0438\u0434\u043A\u043E\u0433\u043E\xBB, \u0430 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u043D\u043E\u0432\u0443 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u043E\u0457 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438",
    "storage.lossCheck": "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u0457 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u043D\u043E\u0432\u0443 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u043E\u0457 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438",
    "storage.lossSpeech": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u0437\u0443\u043F\u0438\u043D\u044F\u0442\u044C\u0441\u044F, \u0434\u043E\u043A\u0438 \u0439\u043E\u0433\u043E \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E \u0437\u043D\u043E\u0432\u0443; \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0439 \u043D\u043E\u0442\u0430\u0442\u043A\u0438 \u043B\u0438\u0448\u0430\u0442\u044C\u0441\u044F",
    "storage.lossGpu": "\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u043E\u0432\u0435\u0440\u043D\u0435\u0442\u044C\u0441\u044F \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440, \u0443 \u043A\u0456\u043B\u044C\u043A\u0430 \u0440\u0430\u0437\u0456\u0432 \u043F\u043E\u0432\u0456\u043B\u044C\u043D\u0456\u0448\u0435",
    "storage.lossSpeakers": "\u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043D\u0443\u0442\u044C \u0440\u043E\u0437\u0440\u0456\u0437\u043D\u044F\u0442\u0438 \u0433\u043E\u043B\u043E\u0441\u0438, \u0434\u043E\u043A\u0438 \u0439\u043E\u0433\u043E \u043D\u0435 \u0434\u043E\u0434\u0430\u043D\u043E \u0437\u043D\u043E\u0432\u0443",
    "storage.lossDefault": "\u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443 \u043F\u0456\u0434 \u0447\u0430\u0441 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u043E\u0433\u043E \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F",
    "storage.notUsed": "\u041D\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F",
    "storage.removeAsk": "{loss}. \u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438?",
    "storage.keep": "\u0417\u0430\u043B\u0438\u0448\u0438\u0442\u0438",
    "storage.usedBy": "\u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0435 \u0434\u043B\u044F: {users}",
    "storage.reserve": "\u0437\u0430\u043F\u0430\u0441 \u0434\u043B\u044F: {reserve}, \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u043E\u0440\u0456, \u044F\u043A\u0449\u043E \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430 \u043F\u0456\u0434\u0432\u0435\u0434\u0435",
    "storage.userTranslate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434",
    "storage.userListen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0434",
    "storage.userCheck": "\u0410\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430",
    "storage.userDictate": "\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F",
    "storage.userTranscribe": "\u0417\u0430\u043F\u0438\u0441\u0438 \u0439 \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456",
    "storage.frees": "\u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043D\u044F \u0437\u0432\u0456\u043B\u044C\u043D\u0438\u0442\u044C {free}: {shared} \u0439\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0456\u0432 \u0441\u043F\u0456\u043B\u044C\u043D\u0456 \u0437 \u0456\u043D\u0448\u0438\u043C\u0438 \u0456\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430\u043C\u0438 Python \u0442\u0443\u0442",
    "storage.removeAskTitle": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438\u2026",
    "storage.removeTitle": "\u0412\u0438\u0434\u0430\u043B\u0438\u0442\u0438; \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0438\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443, \u044F\u043A\u0449\u043E \u043F\u0456\u0437\u043D\u0456\u0448\u0435 \u0432\u0438\u0431\u0435\u0440\u0435\u0442\u0435",
    "storage.measuring": "\u0412\u0438\u043C\u0456\u0440\u044E\u044E, \u0449\u043E \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454 \u0422\u0438\u0446\u044C\u2026",
    "storage.downloads": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
    "storage.everything": "\u0423\u0441\u0435, \u0449\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454 \u0422\u0438\u0446\u044C: {size}",
    "storage.inFolderAway": "\u0443 \u043F\u0430\u043F\u0446\u0456 \u0422\u0438\u0446\u044C, \u043A\u0440\u0456\u043C \u0447\u0430\u0441\u0442\u0438\u043D, \u0431\u0456\u043B\u044F \u044F\u043A\u0438\u0445 \u0443\u043A\u0430\u0437\u0430\u043D\u043E, \u0434\u0435 \u0432\u043E\u043D\u0438 \xB7 \u0432\u0456\u043B\u044C\u043D\u043E {free} \u043D\u0430 {drive}",
    "storage.inFolder": "\u0432 \u043E\u0434\u043D\u0456\u0439 \u043F\u0430\u043F\u0446\u0456 \xB7 \u0432\u0456\u043B\u044C\u043D\u043E {free} \u043D\u0430 {drive}",
    "storage.openFolder": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043F\u0430\u043F\u043A\u0443",
    "storage.models": "\u041C\u043E\u0434\u0435\u043B\u0456 \u0442\u0430 \u0433\u043E\u043B\u043E\u0441\u0438",
    "storage.nothing": "\u0429\u0435 \u043D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043E: \u043A\u043E\u0436\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u0454\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0432\u0438 \u0432\u043F\u0435\u0440\u0448\u0435 \u043D\u0435\u044E \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0454\u0442\u0435\u0441\u044F.",
    "storage.programs": "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u0438, \u0449\u043E \u0457\u0445 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u044C",
    "storage.yoursGroup": "\u0412\u0430\u0448\u0435",
    "storage.inOld": "{size} \u0434\u043E\u0441\u0456 \u0432 \u0441\u0442\u0430\u0440\u0456\u0439 \u043F\u0430\u043F\u0446\u0456 Krya \u0430\u0431\u043E Altype",
    "storage.outside": "{size} \u0434\u043E\u0441\u0456 \u043F\u043E\u0437\u0430 \u043F\u0430\u043F\u043A\u043E\u044E \u0422\u0438\u0446\u044C",
    "storage.usesThere": "{names}: \u0422\u0438\u0446\u044C \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u0457\u0445 \u0437\u0432\u0456\u0434\u0442\u0438. \u041F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u043D\u044F \u0437\u0443\u043F\u0438\u043D\u0438\u0442\u044C \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0456 \u043C\u043E\u0434\u0435\u043B\u044C, \u043F\u043E\u0442\u0456\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0422\u0438\u0446\u044C",
    "storage.notMoved": "\u041D\u0435 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u043E: {why}",
    "storage.moving": "\u041F\u0435\u0440\u0435\u043D\u043E\u0448\u0443\u2026",
    "storage.move": "\u041F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u0432 \u043F\u0430\u043F\u043A\u0443 \u0422\u0438\u0446\u044C",
    "settings.languages": "\u041C\u043E\u0432\u0438, \u044F\u043A\u0438\u043C\u0438 \u0432\u0438 \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0454\u0442\u0435\u0441\u044F",
    "settings.languagesNote": "\u043A\u043E\u043B\u0438 \u0422\u0438\u0446\u044C \u0447\u0443\u0454 \u0430\u0431\u043E \u0447\u0438\u0442\u0430\u0454 \u0442\u0435\u043A\u0441\u0442, \u0432\u0456\u043D \u0443\u0433\u0430\u0434\u0443\u0454 \u0441\u0435\u0440\u0435\u0434 \u043D\u0438\u0445",
    "settings.addLanguage": "\u0414\u043E\u0434\u0430\u0442\u0438 \u043C\u043E\u0432\u0443",
    "settings.addLanguageNote": "\u0434\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043D\u0456\u043A\u043E\u043B\u0438 \u043D\u0435 \u0432\u0438\u0431\u0438\u0440\u0430\u0454 \u0456\u043D\u0448\u043E\u0457; \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0456 \u0442\u0435\u043A\u0441\u0442 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430 \u0432\u0433\u0430\u0434\u0443\u044E\u0442\u044C \u0441\u0435\u0440\u0435\u0434 \u043D\u0438\u0445",
    "settings.pickLanguage": "\u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043C\u043E\u0432\u0443",
    "settings.languagesGroup": "\u041C\u043E\u0432\u0438",
    "settings.yourLangNote": "\u0432\u0430\u0448\u0430 \u043C\u043E\u0432\u0430 \xB7 \u0437\u043C\u0456\u043D\u044E\u0454\u0442\u044C\u0441\u044F \u0432 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445",
    "settings.englishNote": "\u0437\u0430\u0432\u0436\u0434\u0438: \u043C\u043E\u0432\u0430, \u044F\u043A\u043E\u0457 \u043D\u0430\u0432\u0447\u0430\u0454 \u0422\u0438\u0446\u044C",
    "settings.speed": "\u0428\u0432\u0438\u0434\u043A\u0456\u0441\u0442\u044C",
    "settings.speedNote": "\u044F\u043A \u0448\u0432\u0438\u0434\u043A\u043E \u0447\u0438\u0442\u0430\u0454",
    "settings.yourLanguage": "\u0412\u0430\u0448\u0430 \u043C\u043E\u0432\u0430",
    "settings.yourLanguageNote": "\u0422\u0438\u0446\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0454 \u0446\u0456\u0454\u044E \u043C\u043E\u0432\u043E\u044E \u0456 \u043D\u0435\u044E \u0436 \u043F\u043E\u043A\u0430\u0437\u0443\u0454 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0441\u043B\u0456\u0432",
    "settings.theme": "\u0422\u0435\u043C\u0430",
    "settings.themeSystem": "\u042F\u043A \u0443 Windows",
    "settings.themeLight": "\u0421\u0432\u0456\u0442\u043B\u0430",
    "settings.themeDark": "\u0422\u0435\u043C\u043D\u0430",
    "settings.startWithWindows": "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u0438 \u0440\u0430\u0437\u043E\u043C \u0437 Windows",
    "settings.pause": "\u041F\u0440\u0438\u0437\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0422\u0438\u0446\u044C",
    "settings.pauseNote": "\u0443\u0441\u0456 \u0441\u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044F \u043A\u043B\u0430\u0432\u0456\u0448 \u0456 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u0437\u0443\u043F\u0438\u043D\u044F\u044E\u0442\u044C\u0441\u044F, \u0434\u043E\u043A\u0438 \u0432\u0438 \u0437\u043D\u043E\u0432\u0443 \u043D\u0435 \u0432\u0432\u0456\u043C\u043A\u043D\u0435\u0442\u0435; \u0442\u0430\u043A\u043E\u0436 \u0443 \u043C\u0435\u043D\u044E \u0442\u0440\u0435\u044E",
    "settings.pauseKey": "\u041F\u0430\u0443\u0437\u0430",
    "settings.pauseKeyNote": "\u0422\u0438\u0446\u044C \u043C\u043E\u0432\u0447\u0438\u0442\u044C, \u0434\u043E\u043A\u0438 \u043D\u0435 \u043D\u0430\u0442\u0438\u0441\u043D\u0435\u0442\u0435 \u0437\u043D\u043E\u0432\u0443",
    "settings.windowKey": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u0432\u0456\u043A\u043D\u043E \u0422\u0438\u0446\u044C",
    "settings.windowKeyNote": "\u0437 \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0457 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438",
    "settings.resetKeys": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u0432\u0441\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "settings.resetKeysNote": "\u0443\u0441\u0456 \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u043F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0434\u043E \u043F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u0438\u0445",
    "settings.version": "\u0412\u0435\u0440\u0441\u0456\u044F {version}",
    "settings.versionDev": "\u0412\u0435\u0440\u0441\u0456\u044F {version} dev",
    "settings.built": "\u0437\u0456\u0431\u0440\u0430\u043D\u043E {build}",
    "settings.versionNote": "\u043D\u043E\u0432\u0456 \u0432\u0435\u0440\u0441\u0456\u0457: \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0442\u0435 \u0456\u043D\u0441\u0442\u0430\u043B\u044F\u0442\u043E\u0440 \u0456\u0437 GitHub \u0456 \u0437\u0430\u043F\u0443\u0441\u0442\u0456\u0442\u044C \u0439\u043E\u0433\u043E; \u0432\u0430\u0448\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0439 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043B\u0438\u0448\u0430\u0442\u044C\u0441\u044F",
    "settings.betaNote": "\u0431\u0435\u0442\u0430: \u0449\u043E\u0441\u044C \u0456\u0449\u0435 \u043C\u043E\u0436\u0435 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438 \u043D\u0435 \u0442\u0430\u043A; \xAB\u041F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438 \u043F\u0440\u043E \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443\xBB \u0434\u043E\u043F\u043E\u043C\u0430\u0433\u0430\u0454 \u0446\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u0438",
    "settings.newVersions": "\u041D\u043E\u0432\u0456 \u0432\u0435\u0440\u0441\u0456\u0457",
    "settings.backup": "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430 \u043A\u043E\u043F\u0456\u044F",
    "settings.backupTitle": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043A\u043E\u043F\u0456\u044E \u0430\u0431\u043E \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u043D\u0430 \u0456\u043D\u0448\u0438\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440",
    "settings.backupNote": "\u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F, \u0441\u043B\u043E\u0432\u0430, \u043F\u043E\u043C\u0438\u043B\u043A\u0438, \u0442\u0435, \u0447\u043E\u0433\u043E \u0422\u0438\u0446\u044C \u043D\u0430\u0432\u0447\u0438\u0432\u0441\u044F \u0437 \u0432\u0430\u0448\u043E\u0433\u043E \u043D\u0430\u0431\u043E\u0440\u0443, \u043E\u0441\u0442\u0430\u043D\u043D\u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0438 \u0439 \u0444\u0440\u0430\u0437\u0438 \u2014 \u0432 \u043E\u0434\u043D\u043E\u043C\u0443 \u0444\u0430\u0439\u043B\u0456; \u043C\u043E\u0434\u0435\u043B\u0456 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0430\u0442\u044C\u0441\u044F \u0437\u043D\u043E\u0432\u0443",
    "settings.export": "\u0415\u043A\u0441\u043F\u043E\u0440\u0442",
    "settings.importNote": "\u0406\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u043C\u0456\u043D\u044E\u0454 \u0432\u0430\u0448\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u043C\u0438 \u0437 \u043A\u043E\u043F\u0456\u0457 \u0439 \u0434\u043E\u0434\u0430\u0454 \u0457\u0457 \u0441\u043B\u043E\u0432\u0430 \u0442\u0430 \u0456\u0441\u0442\u043E\u0440\u0456\u044E \u0434\u043E \u0432\u0430\u0448\u0438\u0445; \u043D\u0456\u0447\u043E\u0433\u043E \u0432\u0430\u0448\u043E\u0433\u043E \u043D\u0435 \u0432\u0438\u0434\u0430\u043B\u044F\u0454\u0442\u044C\u0441\u044F.",
    "settings.resetAll": "\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u0432\u0441\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "settings.resetAllNote": "\u043A\u043B\u0430\u0432\u0456\u0448\u0456, \u043F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0447\u0456 \u0442\u0430 \u0441\u043F\u0438\u0441\u043A\u0438 \u043F\u043E\u0432\u0435\u0440\u0442\u0430\u044E\u0442\u044C\u0441\u044F \u0434\u043E \u043F\u043E\u0447\u0430\u0442\u043A\u043E\u0432\u0438\u0445; \u0432\u0430\u0448\u0456 \u0441\u043B\u043E\u0432\u0430 \u0439 \u0456\u0441\u0442\u043E\u0440\u0456\u044F \u043B\u0438\u0448\u0430\u044E\u0442\u044C\u0441\u044F",
    "about.online": "\u0432\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u0432 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442 \u043B\u0438\u0448\u0435 \u0434\u043B\u044F",
    "about.onlineList": "\u043E\u0434\u043D\u043E\u0440\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043A\u043E\u0436\u043D\u043E\u0457 \u0447\u0430\u0441\u0442\u0438\u043D\u0438: \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0430\u0447\u0430 \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0457 \u043C\u043E\u0432\u0438, \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u043E\u0433\u043E \u0433\u043E\u043B\u043E\u0441\u0443 ({size} \u041C\u0411), \u0437\u043D\u0430\u0447\u0435\u043D\u044C \u0441\u043B\u0456\u0432",
    "about.newVersions": "\u041D\u043E\u0432\u0456 \u0432\u0435\u0440\u0441\u0456\u0457",
    "about.source": "\u041A\u043E\u0434 \u043D\u0430 GitHub",
    "about.licenses": "\u041B\u0456\u0446\u0435\u043D\u0437\u0456\u0457",
    "about.story": "\u041D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 Kryakl",
    "about.storyText": "\u0422\u0438\u0446\u044C \u0437\u0440\u043E\u0431\u043B\u0435\u043D\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 Kryakl \u0404\u0432\u0433\u0435\u043D\u0430 \u041F\u0435\u0448\u0438\u043D\u0441\u044C\u043A\u043E\u0433\u043E, \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u043E\u0433\u043E \u043A\u043E\u0434\u0443 \u043F\u0456\u0434 \u043B\u0456\u0446\u0435\u043D\u0437\u0456\u0454\u044E MIT; \u0434\u043E\u0434\u0430\u043D\u043E \u0432\u0435\u0440\u0441\u0456\u044E \u0434\u043B\u044F Mac \u0456 \u0437\u0430\u043F\u0438\u0441\u0438 \u0434\u0437\u0432\u0456\u043D\u043A\u0456\u0432.",
    "about.authorGroup": "\u0410\u0432\u0442\u043E\u0440",
    "about.role": "Telegram @designmakc",
    "about.bio": "\u0422\u0438\u0446\u044C \u2014 \u043C\u0456\u0439 \u0444\u043E\u0440\u043A Kryakl.",
    "about.mail": "\u041F\u043E\u0448\u0442\u0430",
    "about.write": "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u0438",
    "about.versionTitle": "\u0412\u0435\u0440\u0441\u0456\u044F",
    "about.license": "\u041B\u0456\u0446\u0435\u043D\u0437\u0456\u044F",
    "about.licenseValue": "\u0431\u0435\u0437\u043A\u043E\u0448\u0442\u043E\u0432\u043D\u043E, \u0432\u0456\u0434\u043A\u0440\u0438\u0442\u0438\u0439 \u043A\u043E\u0434 (MIT)",
    "about.offline": "\u041F\u0440\u0430\u0446\u044E\u0454 \u043E\u0444\u043B\u0430\u0439\u043D",
    "about.offlineNote": "\u0432\u0430\u0448 \u0442\u0435\u043A\u0441\u0442 \u043D\u0435 \u0437\u0430\u043B\u0438\u0448\u0430\u0454 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440",
    "about.bug": "\u0417\u043D\u0430\u0439\u0448\u043B\u0438 \u043F\u043E\u043C\u0438\u043B\u043A\u0443?",
    "about.bugNote": "\u0446\u0435 \u0431\u0435\u0442\u0430, \u0449\u043E\u0441\u044C \u043C\u043E\u0436\u0435 \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438 \u043D\u0435 \u0442\u0430\u043A",
    "about.report": "\u041F\u043E\u0432\u0456\u0434\u043E\u043C\u0438\u0442\u0438",
    "about.thanks": "\u0414\u044F\u043A\u0443\u0454\u043C\u043E",
    "report.placeholder": "\u0429\u043E \u0432\u0438 \u0440\u043E\u0431\u0438\u043B\u0438, \u0449\u043E \u0441\u0442\u0430\u043B\u043E\u0441\u044F \u0456 \u0447\u043E\u0433\u043E \u0432\u0438 \u043E\u0447\u0456\u043A\u0443\u0432\u0430\u043B\u0438? \u041D\u0430\u0439\u0431\u0456\u043B\u044C\u0448\u0435 \u0434\u043E\u043F\u043E\u043C\u0430\u0433\u0430\u044E\u0442\u044C \u043A\u0440\u043E\u043A\u0438, \u044F\u043A\u0456 \u0432\u0456\u0434\u0442\u0432\u043E\u0440\u044E\u044E\u0442\u044C \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0443.",
    "report.what": "\u0429\u043E \u0441\u0442\u0430\u043B\u043E\u0441\u044F",
    "report.anyLanguage": "\u0411\u0443\u0434\u044C-\u044F\u043A\u043E\u044E \u043C\u043E\u0432\u043E\u044E; \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u0454\u0442\u044C\u0441\u044F \u0442\u0430\u043A, \u044F\u043A \u0432\u0438 \u043D\u0430\u043F\u0438\u0441\u0430\u043B\u0438.",
    "report.send": "\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438",
    "report.email": "\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438 \u043B\u0438\u0441\u0442\u043E\u043C",
    "report.emailNote": "\u0412\u0456\u0434\u043A\u0440\u0438\u0432\u0430\u0454 \u0432\u0430\u0448\u0443 \u043F\u043E\u0448\u0442\u0443 \u0437 \u043B\u0438\u0441\u0442\u043E\u043C \u043D\u0430 {email} \u0456 \u0432\u0430\u0448\u0438\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C; \u0434\u043E\u0434\u0430\u0439\u0442\u0435 \u0444\u0430\u0439\u043B \u0437\u0432\u0456\u0442\u0443, \u044F\u043A\u0438\u0439 \u0437\u0431\u0435\u0440\u0435\u0436\u0435 \u0422\u0438\u0446\u044C",
    "report.emailBtn": "\u041B\u0438\u0441\u0442",
    "report.issue": "\u0421\u0442\u0432\u043E\u0440\u0438\u0442\u0438 issue \u043D\u0430 GitHub",
    "report.issueNote": "\u041F\u0443\u0431\u043B\u0456\u0447\u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430, \u044F\u043A\u0443 \u0437\u043D\u0430\u0439\u0434\u0443\u0442\u044C \u0456\u043D\u0448\u0456 \u0437 \u0442\u0430\u043A\u043E\u044E \u0436 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u043E\u044E; \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441 GitHub",
    "report.issueBtn": "Issue \u043D\u0430 GitHub",
    "report.saved": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E {file} \u0443 \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438 \u203A Tyts \u203A Reports: \u043F\u0435\u0440\u0435\u0442\u044F\u0433\u043D\u0456\u0442\u044C \u0439\u043E\u0433\u043E \u0432 \u043B\u0438\u0441\u0442. ",
    "report.showInFolder": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u0432 \u043F\u0430\u043F\u0446\u0456",
    "report.failed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0441\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0437\u0432\u0456\u0442: {error}",
    "report.holds": "\u0429\u043E \u043C\u0456\u0441\u0442\u0438\u0442\u044C \u0444\u0430\u0439\u043B \u0437\u0432\u0456\u0442\u0443",
    "report.log": "\u0416\u0443\u0440\u043D\u0430\u043B \u0422\u0438\u0446\u044C",
    "report.logNote": "\u0429\u043E \u0422\u0438\u0446\u044C \u0440\u043E\u0431\u0438\u0432 \u043E\u0441\u0442\u0430\u043D\u043D\u0456\u043C \u0447\u0430\u0441\u043E\u043C: \u043A\u043B\u0430\u0432\u0456\u0448\u0456, \u043A\u043E\u043F\u0456\u044E\u0432\u0430\u043D\u043D\u044F, \u0432\u0456\u043A\u043D\u0430, \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F, \u043F\u043E\u043C\u0438\u043B\u043A\u0438",
    "report.otherLogs": "\u0416\u0443\u0440\u043D\u0430\u043B\u0438 \u0440\u0443\u0448\u0456\u044F \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0456 \u043C\u043E\u0434\u0435\u043B\u0456 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443",
    "report.otherLogsNote": "\u0414\u0438\u043A\u0442\u0443\u0432\u0430\u043D\u043D\u044F, \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438, \u0437\u0430\u043F\u0443\u0441\u043A, \u0437\u0443\u043F\u0438\u043D\u043A\u0430 \u0456 \u0437\u0431\u043E\u0457 \u043C\u043E\u0434\u0435\u043B\u0456",
    "report.computer": "\u0426\u0435\u0439 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440 \u0456 \u0422\u0438\u0446\u044C",
    "report.computerNote": "\u041F\u0440\u043E\u0446\u0435\u0441\u043E\u0440, \u043F\u0430\u043C\u2019\u044F\u0442\u044C, \u0432\u0456\u0434\u0435\u043E\u043A\u0430\u0440\u0442\u0430, \u0432\u0435\u0440\u0441\u0456\u0457 Windows \u0456 \u0422\u0438\u0446\u044C",
    "report.settings": "\u0412\u0430\u0448\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "report.settingsNote": "\u0412\u0430\u0448\u0456 \u0441\u043F\u0438\u0441\u043A\u0438 \u043B\u0438\u0448\u0435 \u043F\u043E\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E: \u0441\u043B\u043E\u0432\u0430 \xAB\u041D\u0435 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u0438\xBB, \u0456\u043C\u0435\u043D\u0430 \u0439 \u0442\u0435\u0440\u043C\u0456\u043D\u0438, \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0438",
    "report.never": "\u041D\u0456\u043A\u043E\u043B\u0438 \u043D\u0435 \u043F\u043E\u0442\u0440\u0430\u043F\u043B\u044F\u044E\u0442\u044C: \u0432\u0430\u0448\u0456 \u0442\u0435\u043A\u0441\u0442\u0438, \u0441\u043B\u043E\u0432\u0430, \u043F\u043E\u043C\u0438\u043B\u043A\u0438, \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0438, \u0444\u0440\u0430\u0437\u0438, \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0447\u0438 \u043A\u043B\u044E\u0447 Hugging Face. \u0412\u0430\u0448\u0435 \u0456\u043C\u2019\u044F \u0443 Windows \u0442\u0430 \u0456\u043C\u2019\u044F \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430 \u0437\u0430\u043C\u0456\u043D\u0435\u043D\u043E. \u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u043D\u0430\u0434\u0441\u0438\u043B\u0430\u0454\u0442\u044C\u0441\u044F, \u0434\u043E\u043A\u0438 \u0432\u0438 \u0441\u0430\u043C\u0456 \u043D\u0435 \u043D\u0430\u0434\u0456\u0448\u043B\u0435\u0442\u0435.",
    "report.folder": "\u041F\u0430\u043F\u043A\u0430 \u0422\u0438\u0446\u044C",
    "report.folderNote": "\u0414\u0435 \u043B\u0435\u0436\u0430\u0442\u044C \u0436\u0443\u0440\u043D\u0430\u043B\u0438, \u0449\u043E\u0431 \u043F\u0435\u0440\u0435\u0433\u043B\u044F\u043D\u0443\u0442\u0438 \u0457\u0445 \u0441\u0430\u043C\u043E\u0441\u0442\u0456\u0439\u043D\u043E",
    "report.stopped": "\u042F\u043A\u0449\u043E \u0449\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u043B\u043E \u043F\u0440\u0430\u0446\u044E\u0432\u0430\u0442\u0438",
    "report.restart": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438 \u0440\u0443\u0448\u0456\u0439 \u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "report.restartNote": "\u0423 \u043D\u044C\u043E\u043C\u0443 \u043F\u0440\u0430\u0446\u044E\u044E\u0442\u044C \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u043D\u044F \u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \xB7 {state}",
    "report.stateOff": "\u0432\u0438\u043C\u043A\u043D\u0435\u043D\u0438\u0439",
    "report.stateStarting": "\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0454\u0442\u044C\u0441\u044F\u2026",
    "report.stateRunning": "\u043F\u0440\u0430\u0446\u044E\u0454",
    "report.stateBusy": "\u043F\u0440\u0430\u0446\u044E\u0454 \xB7 \u0437\u0430\u0440\u0430\u0437 \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0454",
    "report.stateDown": "\u0437\u0443\u043F\u0438\u043D\u0435\u043D\u0438\u0439",
    "report.restartBtn": "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0438",
    // The action pages
    "act.translate": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438",
    "act.translateNote": "Enter \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u0437\u0430\u043C\u0456\u0441\u0442\u044C \u0442\u0435\u043A\u0441\u0442\u0443",
    "act.listen": "\u041F\u0435\u0440\u0435\u043A\u043B\u0430\u0441\u0442\u0438 \u0439 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u0438 \u0432\u0433\u043E\u043B\u043E\u0441",
    "act.listenNote": "\u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430 \u0437\u0432\u0443\u0447\u0438\u0442\u044C, \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434 \u043F\u0456\u0434 \u043D\u0435\u044E",
    "act.inPlace": "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u043E\u043C",
    "act.inPlaceNote": "\u0431\u0435\u0437 \u0432\u0456\u043A\u043D\u0430, \u043F\u0440\u043E\u0441\u0442\u043E \u0432 \u0442\u0435\u043A\u0441\u0442\u0456",
    "act.selected": "\u0412\u0438\u0434\u0456\u043B\u0435\u043D\u0438\u0439 \u0442\u0435\u043A\u0441\u0442",
    "act.screen": "\u0422\u0435\u043A\u0441\u0442 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "act.screenNote": "\u043E\u0431\u0432\u0435\u0434\u0456\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u0440\u0430\u043C\u043A\u043E\u044E",
    "act.own": "\u0421\u0432\u0456\u0439 \u0442\u0435\u043A\u0441\u0442",
    "act.ownKey": "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443",
    "act.quality": "\u042F\u043A\u0456\u0441\u0442\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u0430\u0434\u0443",
    "act.cardNote": "\u0447\u0438\u0442\u0430\u043D\u043D\u044F, \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0441\u043B\u0456\u0432, \u043A\u043B\u0430\u0432\u0456\u0448\u0456",
    "act.screenHowNote": "\u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u0454\u0442\u044C\u0441\u044F \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456 \u043C\u043E\u0432\u0430\u043C\u0438, \u044F\u043A\u0456 \u0454 \u0443 Windows",
    "act.try": "\u0421\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438",
    "act.talkGroup": "\u0420\u043E\u0437\u043C\u043E\u0432\u0430 \u0437 \u0422\u0438\u0446\u044C",
    "act.talk": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u0440\u043E\u0437\u043C\u043E\u0432\u0443",
    "act.talkNote": "\u0433\u043E\u0432\u043E\u0440\u0456\u0442\u044C \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E, \u0432\u0456\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0454 \u0432\u0433\u043E\u043B\u043E\u0441",
    "act.empty": "\u043D\u0435 \u0437\u0430\u043F\u043E\u0432\u043D\u0435\u043D\u043E",
    "act.talkWindow": "\u0412\u0456\u043A\u043D\u043E \u0440\u043E\u0437\u043C\u043E\u0432\u0438",
    "act.talkWindowNote": "\u0447\u0438\u0442\u0430\u043D\u043D\u044F \u0432\u0433\u043E\u043B\u043E\u0441, \u043F\u043E\u0432\u0435\u0440\u0445 \u0432\u0456\u043A\u043E\u043D, \u043A\u043B\u0430\u0432\u0456\u0448\u0456 \u0439 \u0456\u0441\u0442\u043E\u0440\u0456\u044F",
    "act.checkNote": "\u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u0437\u0430\u043A\u0440\u0435\u0441\u043B\u0435\u043D\u0456, \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u043E\u0440\u0443\u0447; Enter \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0439\u043E\u0433\u043E",
    "act.say": "\u0421\u043A\u0430\u0437\u0430\u0442\u0438 \u0439 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438",
    "act.sayNote": "\u0433\u043E\u0432\u043E\u0440\u0456\u0442\u044C \u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u043E\u044E, \u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u043F\u043E\u0437\u043D\u0430\u0447\u0430\u0442\u044C\u0441\u044F",
    "act.fixGroup": "\u0412\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F",
    "act.switchGroup": "\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u043D\u043D\u044F",
    "act.general": "\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0435",
    "act.notChosen": "\u043D\u0435 \u0432\u0438\u0431\u0440\u0430\u043D\u043E",
    "act.newWords": "\u041D\u043E\u0432\u0456 \u0441\u043B\u043E\u0432\u0430",
    "ui.forget": "\u0417\u0430\u0431\u0443\u0442\u0438",
    "call.title": "\u0414\u0437\u0432\u0456\u043D\u043E\u043A {when}",
    "call.record": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0434\u0437\u0432\u0456\u043D\u043E\u043A",
    "call.stop": "\u0417\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0437\u0430\u043F\u0438\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "call.recordNote": "\u0412\u0430\u0448 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u0456 \u0432\u0435\u0441\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430, \u0434\u043E\u043A\u0438 \u043D\u0435 \u0437\u0443\u043F\u0438\u043D\u0438\u0442\u0435; \u043F\u043E\u0442\u0456\u043C \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0443\u0454\u0442\u044C\u0441\u044F",
    "call.keyNote": "\u041F\u043E\u0447\u0438\u043D\u0430\u0454 \u0456 \u0437\u0443\u043F\u0438\u043D\u044F\u0454 \u0437\u0430\u043F\u0438\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "call.panel": "\u0414\u0437\u0432\u0456\u043D\u043E\u043A",
    "call.allSound": "\u0412\u0435\u0441\u044C \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "call.pause": "\u041F\u0430\u0443\u0437\u0430",
    "call.resume": "\u041F\u0440\u043E\u0434\u043E\u0432\u0436\u0438\u0442\u0438",
    "call.stopShort": "\u0421\u0442\u043E\u043F",
    "call.paused": "\u041F\u0430\u0443\u0437\u0430",
    "call.hide": "\u0421\u0445\u043E\u0432\u0430\u0442\u0438: \u0437\u0430\u043F\u0438\u0441 \u0442\u0440\u0438\u0432\u0430\u0454",
    "call.shot": "\u0417\u0440\u043E\u0431\u0438\u0442\u0438 \u0437\u043D\u0456\u043C\u043E\u043A \u0435\u043A\u0440\u0430\u043D\u0430",
    "call.shotKey": "\u0417\u043D\u0456\u043C\u043E\u043A \u0435\u043A\u0440\u0430\u043D\u0430 \u043F\u0456\u0434 \u0447\u0430\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "call.shotKeyNote": "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044C\u0441\u044F \u0456\u0437 \u0437\u0430\u043F\u0438\u0441\u043E\u043C, \u0432\u0438\u0434\u043D\u043E \u0432 \u0439\u043E\u0433\u043E \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u0446\u0456",
    "call.shots": "\u0417\u043D\u0456\u043C\u043A\u0438 \u0435\u043A\u0440\u0430\u043D\u0430 \u043F\u0456\u0434 \u0447\u0430\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "call.shotsNote": "\u041A\u043E\u0436\u043D\u0456 4 \u0441\u0435\u043A\u0443\u043D\u0434\u0438, \u043A\u043E\u043B\u0438 \u0435\u043A\u0440\u0430\u043D \u0437\u043C\u0456\u043D\u0438\u0432\u0441\u044F; \u043B\u0435\u0436\u0430\u0442\u044C \u043F\u043E\u0440\u0443\u0447 \u0456\u0437 \u0437\u0430\u043F\u0438\u0441\u043E\u043C \u0456 \u0432\u0438\u0434\u0430\u043B\u044F\u044E\u0442\u044C\u0441\u044F \u0440\u0430\u0437\u043E\u043C \u0456\u0437 \u043D\u0438\u043C",
    "call.names": "\u0406\u043C\u0435\u043D\u0430 \u043C\u043E\u0432\u0446\u0456\u0432 \u0437 \u0435\u043A\u0440\u0430\u043D\u0430",
    "call.namesNote": "\u0415\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442\u0430\u043B\u044C\u043D\u043E, \u043C\u043E\u0436\u0435 \u043F\u043E\u043C\u0438\u043B\u044F\u0442\u0438\u0441\u044F: \u0447\u0438\u0442\u0430\u044E\u0442\u044C\u0441\u044F \u0437\u0456 \u0437\u043D\u0456\u043C\u043A\u0456\u0432 \u0434\u0437\u0432\u0456\u043D\u043A\u0430 \u0439 \u043B\u0438\u0448\u0435 \u043F\u0440\u043E\u043F\u043E\u043D\u0443\u044E\u0442\u044C\u0441\u044F, \u0441\u0430\u043C\u0456 \u043D\u0435 \u0437\u0430\u0441\u0442\u043E\u0441\u043E\u0432\u0443\u044E\u0442\u044C\u0441\u044F",
    "call.starting": "\u041F\u043E\u0447\u0438\u043D\u0430\u044E\u2026",
    "call.saving": "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u044E\u2026",
    "call.noMic": "\u041C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0438\u0439 \u2014 \u043F\u0438\u0448\u0443 \u0442\u0456\u043B\u044C\u043A\u0438 \u0441\u043F\u0456\u0432\u0440\u043E\u0437\u043C\u043E\u0432\u043D\u0438\u043A\u0456\u0432",
    "call.silent": "\u041D\u0435 \u0447\u0443\u044E \u0441\u043F\u0456\u0432\u0440\u043E\u0437\u043C\u043E\u0432\u043D\u0438\u043A\u0456\u0432: \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0434\u0436\u0435\u0440\u0435\u043B\u043E \u0437\u0432\u0443\u043A\u0443",
    "call.failed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430: {why}",
    "call.noSound": "\u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043D\u0435 \u0434\u0430\u043B\u0430 \u0437\u0432\u0443\u043A\u0443",
    "call.openSettings": "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F",
    "call.consentAsk": "\u0423 \u0431\u0430\u0433\u0430\u0442\u044C\u043E\u0445 \u043A\u0440\u0430\u0457\u043D\u0430\u0445 \u043D\u0430 \u0437\u0430\u043F\u0438\u0441 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u0437\u0433\u043E\u0434\u0430 \u0441\u043F\u0456\u0432\u0440\u043E\u0437\u043C\u043E\u0432\u043D\u0438\u043A\u0456\u0432",
    "call.consentDetail": "\u0421\u043A\u0430\u0436\u0456\u0442\u044C \u0457\u043C, \u0449\u043E \u0437\u0430\u043F\u0438\u0441\u0443\u0454\u0442\u0435. \u0422\u0438\u0446\u044C \u043D\u0430\u0433\u0430\u0434\u0443\u0454 \u043F\u0440\u043E \u0446\u0435 \u043E\u0434\u0438\u043D \u0440\u0430\u0437.",
    "call.consentRecord": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438",
    "call.quitAsk": "\u0406\u0434\u0435 \u0437\u0430\u043F\u0438\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430. \u0417\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0456 \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438?",
    "call.quitStop": "\u0417\u0443\u043F\u0438\u043D\u0438\u0442\u0438 \u0456 \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    "call.screenAsk": "\u0422\u0438\u0446\u044C \u043F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u0434\u043E\u0437\u0432\u0456\u043B \u0437\u0430\u043F\u0438\u0441\u0443\u0432\u0430\u0442\u0438 \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430",
    "call.screenDetail": "Windows \u0434\u0430\u0454 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u0456 \u0437\u0432\u0443\u043A \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0430 \u043B\u0438\u0448\u0435 \u0437 \u0434\u043E\u0437\u0432\u043E\u043B\u043E\u043C \xAB\u0417\u0430\u043F\u0438\u0441 \u0435\u043A\u0440\u0430\u043D\u0430 \u0456 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u043E\u0433\u043E \u0437\u0432\u0443\u043A\u0443\xBB. \u0422\u0438\u0446\u044C \u0431\u0435\u0440\u0435 \u0442\u0456\u043B\u044C\u043A\u0438 \u0437\u0432\u0443\u043A, \u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043D\u044F \u0432\u0456\u0434\u043A\u0438\u0434\u0430\u0454 \u043E\u0434\u0440\u0430\u0437\u0443. \u0423\u0432\u0456\u043C\u043A\u043D\u0456\u0442\u044C \u0442\u0430\u043C \u0422\u0438\u0446\u044C \u0456 \u043F\u043E\u0447\u043D\u0456\u0442\u044C \u0437\u0430\u043F\u0438\u0441 \u0437\u043D\u043E\u0432\u0443.",
    "call.auto": "\u041A\u043E\u043B\u0438 \u0434\u0437\u0432\u0456\u043D\u043E\u043A \u0437\u0430\u0439\u043C\u0430\u0454 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D",
    "call.autoNote": "Zoom, Teams, Slack, Telegram, Discord, FaceTime, Webex \u0430\u0431\u043E Google Meet \u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456 \u0442\u0440\u0438\u043C\u0430\u0454 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D 10 \u0441. \u0417\u0430\u043F\u0438\u0441 \u0437\u0443\u043F\u0438\u043D\u044F\u0454\u0442\u044C\u0441\u044F \u0447\u0435\u0440\u0435\u0437 20 \u0441 \u043F\u0456\u0441\u043B\u044F \u0434\u0437\u0432\u0456\u043D\u043A\u0430; \u043A\u043E\u0440\u043E\u0442\u0448\u0438\u0439 \u0437\u0430 \u0445\u0432\u0438\u043B\u0438\u043D\u0443 \u0432\u0438\u0434\u0430\u043B\u044F\u0454\u0442\u044C\u0441\u044F.",
    "call.autoOff": "\u041D\u0456\u0447\u043E\u0433\u043E \u043D\u0435 \u0440\u043E\u0431\u0438\u0442\u0438",
    "call.autoAsk": "\u041F\u0438\u0442\u0430\u0442\u0438",
    "call.autoRecord": "\u0417\u0430\u043F\u0438\u0441\u0443\u0432\u0430\u0442\u0438",
    "call.askTitle": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438 \u0434\u0437\u0432\u0456\u043D\u043E\u043A?",
    "call.askNote": "{app} \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0454 \u043C\u0456\u043A\u0440\u043E\u0444\u043E\u043D",
    "call.askRecord": "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u0438",
    "call.askLater": "\u041D\u0435 \u0437\u0430\u0440\u0430\u0437",
    "call.autoStarted": "\u0417\u0430\u043F\u0438\u0441 \u043F\u043E\u0447\u0430\u0432\u0441\u044F \u0441\u0430\u043C",
    "call.dontRecord": "\u041D\u0435 \u0437\u0430\u043F\u0438\u0441\u0443\u0432\u0430\u0442\u0438",
    "keys.useMeeting": "\u0437\u0430\u043F\u0438\u0441\u0443 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "keys.useShot": "\u0437\u043D\u0456\u043C\u043A\u0430 \u0435\u043A\u0440\u0430\u043D\u0430 \u043F\u0456\u0434 \u0447\u0430\u0441 \u0434\u0437\u0432\u0456\u043D\u043A\u0430",
    "sum.title": "\u041F\u0456\u0434\u0441\u0443\u043C\u043E\u043A",
    "sum.make": "\u0417\u0440\u043E\u0431\u0438\u0442\u0438 \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A",
    "sum.again": "\u0417\u0440\u043E\u0431\u0438\u0442\u0438 \u0437\u043D\u043E\u0432\u0443",
    "sum.tGeneral": "\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0438\u0439",
    "sum.tStandup": "\u041F\u043B\u0430\u043D\u0435\u0440\u043A\u0430",
    "sum.tInterview": "\u0406\u043D\u0442\u0435\u0440\u0432\u2019\u044E",
    "sum.tLecture": "\u041B\u0435\u043A\u0446\u0456\u044F \u0430\u0431\u043E \u0432\u0435\u0431\u0456\u043D\u0430\u0440",
    "sum.tOwn": "\u0421\u0432\u043E\u044F \u0456\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0456\u044F",
    "sum.ownPlaceholder": "\u0429\u043E \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u0432 \u043F\u0456\u0434\u0441\u0443\u043C\u043A\u0443 (\u0434\u043E 500 \u0437\u043D\u0430\u043A\u0456\u0432)",
    "sum.mine": "\u041C\u043E\u0454\u044E \u043C\u043E\u0432\u043E\u044E",
    "sum.starting": "\u0420\u043E\u0431\u043B\u044E \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A\u2026",
    "sum.working": "\u0420\u043E\u0431\u043B\u044E \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A: \u0447\u0430\u0441\u0442\u0438\u043D\u0430 {part} \u0437 {parts}",
    "sum.joining": "\u0420\u043E\u0431\u043B\u044E \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A: \u0437\u0431\u0438\u0440\u0430\u044E \u0447\u0430\u0441\u0442\u0438\u043D\u0438",
    "sum.passed": "\u043C\u0438\u043D\u0443\u043B\u043E {time}",
    "sum.left": "\u0437\u0430\u043B\u0438\u0448\u0438\u043B\u043E\u0441\u044C \u0431\u043B\u0438\u0437\u044C\u043A\u043E {time}",
    "sum.failed": "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0437\u0440\u043E\u0431\u0438\u0442\u0438 \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A",
    "sum.failedNote": "\u0420\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0443 \u043D\u0435 \u0437\u043C\u0456\u043D\u0435\u043D\u043E.",
    "sum.needModel": "\u0414\u043B\u044F \u043F\u0456\u0434\u0441\u0443\u043C\u043A\u0443 \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C {name} ({size})",
    "sum.needModelNote": "\u0407\u0457 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E\u0442\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437, \u0432\u043E\u043D\u0430 \u043F\u0440\u0430\u0446\u044E\u0454 \u043D\u0430 \u0446\u044C\u043E\u043C\u0443 \u043A\u043E\u043C\u043F\u2019\u044E\u0442\u0435\u0440\u0456.",
    "sum.downloading": "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0443\u044E \u043C\u043E\u0434\u0435\u043B\u044C\u2026",
    "sum.edit": "\u0412\u0438\u043F\u0440\u0430\u0432\u0438\u0442\u0438",
    "sum.editHint": "\u0417\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044C\u0441\u044F, \u043A\u043E\u043B\u0438 \u0432\u0438 \u0432\u0438\u0445\u043E\u0434\u0438\u0442\u0435 \u0437 \u043F\u043E\u043B\u044F",
    "sum.done": "\u0413\u043E\u0442\u043E\u0432\u043E",
    "sum.replaceAsk": "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438 \u0432\u0438\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0439 \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A?",
    "sum.replace": "\u0417\u0430\u043C\u0456\u043D\u0438\u0442\u0438",
    "sum.copied": "\u041F\u0456\u0434\u0441\u0443\u043C\u043E\u043A \u0441\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E",
    "sum.lost": "\u0412\u0442\u0440\u0430\u0447\u0435\u043D\u043E \u0448\u043C\u0430\u0442\u043A\u0456\u0432 \u0437\u0430\u043F\u0438\u0441\u0443: {n} (\u043F\u043E 10 \u0441)",
    "sum.seek": "\u041F\u043E\u0441\u043B\u0443\u0445\u0430\u0442\u0438 \u0437 \u0446\u044C\u043E\u0433\u043E \u043C\u0456\u0441\u0446\u044F",
    "sum.shot": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u0437\u043D\u0456\u043C\u043E\u043A",
    "sum.setAuto": "\u0420\u043E\u0431\u0438\u0442\u0438 \u043F\u0456\u0434\u0441\u0443\u043C\u043E\u043A \u043E\u0434\u0440\u0430\u0437\u0443",
    "sum.setAutoNote": "\u041F\u0456\u0441\u043B\u044F \u0440\u043E\u0437\u0448\u0438\u0444\u0440\u043E\u0432\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E\u0433\u043E \u0434\u0437\u0432\u0456\u043D\u043A\u0430, \u044F\u043A\u0449\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u0430",
    "sum.setTemplate": "\u0428\u0430\u0431\u043B\u043E\u043D \u043F\u0456\u0434\u0441\u0443\u043C\u043A\u0443",
    "sum.setTemplateNote": "\u0414\u043B\u044F \u043F\u0456\u0434\u0441\u0443\u043C\u043A\u0456\u0432, \u0449\u043E \u0440\u043E\u0431\u043B\u044F\u0442\u044C\u0441\u044F \u0441\u0430\u043C\u0456; \u043D\u0430 \u0441\u0442\u043E\u0440\u0456\u043D\u0446\u0456 \u0437\u0430\u043F\u0438\u0441\u0443 \u043C\u043E\u0436\u043D\u0430 \u0432\u0438\u0431\u0440\u0430\u0442\u0438 \u0456\u043D\u0448\u0438\u0439",
    "sum.setMineNote": "\u0406\u043D\u0430\u043A\u0448\u0435 \u0432\u0456\u043D \u043F\u0438\u0448\u0435\u0442\u044C\u0441\u044F \u043C\u043E\u0432\u043E\u044E \u0437\u0443\u0441\u0442\u0440\u0456\u0447\u0456",
    "tr.srcAllSound": "\u0412\u0435\u0441\u044C \u0437\u0432\u0443\u043A"
  };

  // src/i18n/index.ts
  var UI_LANGUAGES = [
    { code: "en", name: "English" },
    { code: "uk", name: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430" },
    { code: "ru", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" }
  ];
  var PHRASES = { en, uk, ru };
  var isUiLanguage = (v) => v === "en" || v === "uk" || v === "ru";
  var current = "en";
  if (typeof location !== "undefined") {
    const asked = new URLSearchParams(location.search).get("lang");
    if (isUiLanguage(asked)) current = asked;
    if (typeof document !== "undefined") document.documentElement.lang = current;
  }
  function setUiLanguage(language) {
    current = language;
  }
  var uiLanguage = () => current;
  var rules = /* @__PURE__ */ new Map();
  function pluralOf(n) {
    let r = rules.get(current);
    if (!r) rules.set(current, r = new Intl.PluralRules(current));
    return r.select(n);
  }
  var onMac = typeof process !== "undefined" && process.platform ? process.platform === "darwin" : typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
  var isPlural = (p) => typeof p === "object";
  function t(key, vars) {
    const p = PHRASES[current][key] ?? en[key];
    if (p === void 0) return key;
    let s;
    if (isPlural(p)) {
      const n = Number(vars?.n ?? 0);
      s = p[pluralOf(n)] ?? p.other;
    } else s = p;
    if (onMac && key !== "kb.windowsOnly" && !s.includes("macOS")) s = s.replace(/Windows/g, "macOS");
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (whole, name) => name in vars ? String(vars[name]) : whole);
  }
  var displayNames = /* @__PURE__ */ new Map();
  function languageName(nameOrCode) {
    const language = findLanguage(nameOrCode);
    if (!language) return nameOrCode;
    if (current === "en") return language.name;
    let names = displayNames.get(current);
    if (names === void 0) {
      try {
        names = new Intl.DisplayNames([current], { type: "language" });
      } catch {
        names = null;
      }
      displayNames.set(current, names);
    }
    const name = names?.of(language.code);
    return name && name !== language.code ? name : language.name;
  }
  var levelName = (level) => t(`level.${level}`);
  var numbers = /* @__PURE__ */ new Map();
  function numberText(n, digits = 0) {
    const id = `${current}:${digits}`;
    let format = numbers.get(id);
    if (!format) numbers.set(id, format = new Intl.NumberFormat(current, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }));
    return format.format(n);
  }
  function sizeText(mb) {
    return mb >= 1e3 ? t("size.gb", { n: numberText(Math.round(mb / 100) / 10, 1) }) : t("size.mb", { n: Math.max(1, Math.round(mb)) });
  }
  function formatDate(d, options) {
    return d.toLocaleString(current === "en" ? "en-GB" : current, options);
  }

  // src/hotkey.ts
  var COPY_TWICE = "Control+C*2";
  var DOUBLE_MS = 400;
  var MODS = ["Control", "Alt", "Shift", "Super"];
  var TAPS = [
    { name: "LeftControl", code: "ControlLeft", vk: 162, mod: "Control" },
    { name: "RightControl", code: "ControlRight", vk: 163, mod: "Control" },
    { name: "LeftShift", code: "ShiftLeft", vk: 160, mod: "Shift" },
    { name: "RightShift", code: "ShiftRight", vk: 161, mod: "Shift" },
    { name: "LeftAlt", code: "AltLeft", vk: 164, mod: "Alt" },
    { name: "RightAlt", code: "AltRight", vk: 165, mod: "Alt" },
    { name: "LeftSuper", code: "MetaLeft", vk: 91, mod: "Super" },
    { name: "RightSuper", code: "MetaRight", vk: 92, mod: "Super" }
  ];
  var BUTTONS = { MouseBack: 1, MouseForward: 2 };
  var LONE = { Pause: 19, CapsLock: 20, ScrollLock: 145, Insert: 45 };
  var NAMED = {
    Space: 32,
    Tab: 9,
    Enter: 13,
    Backspace: 8,
    Delete: 46,
    Home: 36,
    End: 35,
    PageUp: 33,
    PageDown: 34,
    Up: 38,
    Down: 40,
    Left: 37,
    Right: 39,
    // Esc alone cancels everywhere; with a modifier (Ctrl+Esc, which opens Start) it is a key of the keyboard thread's.
    Escape: 27,
    "`": 192,
    "-": 189,
    "=": 187,
    "[": 219,
    "]": 221,
    "\\": 220,
    ";": 186,
    "'": 222,
    ",": 188,
    ".": 190,
    "/": 191
  };
  var SIGNS = { Backquote: "`", Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/" };
  function keyCode(name) {
    if (name in LONE) return { vk: LONE[name], alone: true };
    const f = /^F([1-9]|1\d|2[0-4])$/.exec(name);
    if (f) return { vk: 111 + Number(f[1]), alone: true };
    if (/^[A-Z0-9]$/.test(name)) return { vk: name.charCodeAt(0), alone: false };
    if (name in NAMED) return { vk: NAMED[name], alone: false };
    return void 0;
  }
  function parseHotkey(hotkey) {
    if (hotkey === COPY_TWICE) return { kind: "copyTwice" };
    const parts = hotkey.split("+").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return void 0;
    if (parts.length === 1) {
      const [name, times] = parts[0].split("*");
      const tap = TAPS.find((t2) => t2.name === name);
      if (tap && times === void 0) return { kind: "tap", vk: tap.vk };
      if (tap && times === "2") return { kind: "double", vk: tap.vk };
    }
    const mods = parts.filter((p) => MODS.includes(p));
    const rest = parts.filter((p) => !MODS.includes(p));
    if (rest.length === 0) return mods.length >= 2 ? { kind: "chord", mods: sortMods(mods) } : void 0;
    if (rest.length !== 1) return void 0;
    const last = rest[0];
    const button = BUTTONS[last];
    if (button) return { kind: "mouse", mods: sortMods(mods), button };
    const key = keyCode(last);
    if (!key || !key.alone && mods.length === 0) return void 0;
    return { kind: "key", mods: sortMods(mods), vk: key.vk };
  }
  function sortMods(mods) {
    return MODS.filter((m) => mods.includes(m));
  }
  var onMac2 = typeof process !== "undefined" && process.platform ? process.platform === "darwin" : typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
  function hotkeyLabel(hotkey) {
    if (hotkey.endsWith("*2") && hotkey.includes("+")) return t("keys.twice", { key: hotkeyLabel(hotkey.slice(0, -2)) });
    const name = (mod) => mod === "Control" ? onMac2 ? "\u2318" : "Ctrl" : mod === "Alt" && onMac2 ? "\u2325" : mod === "Super" ? "Win" : mod;
    return hotkey.split("+").map((part) => {
      const [key, times] = part.split("*");
      const side2 = /^(Left|Right)(Control|Shift|Alt|Super)$/.exec(key ?? "");
      if (side2) {
        const label = `${side2[1]} ${name(side2[2])}`;
        return times === "2" ? t("keys.twice", { key: label }) : label;
      }
      if (part === "CapsLock") return "Caps Lock";
      if (part === "Escape") return "Esc";
      if (part === "ScrollLock") return "Scroll Lock";
      if (part === "MouseBack") return "Mouse Back";
      if (part === "MouseForward") return "Mouse Forward";
      if (part === "CommandOrControl" || part === "CmdOrCtrl") return onMac2 ? "\u2318" : "Ctrl";
      return name(part);
    }).join("+");
  }
  function nameOfCode(code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Arrow(Up|Down|Left|Right)$/.test(code)) return code.slice(5);
    if (code in SIGNS) return SIGNS[code];
    if (code in LONE || code in NAMED || /^F([1-9]|1\d|2[0-4])$/.test(code)) return code;
    return void 0;
  }
  var CODES = Object.fromEntries([
    ...Object.entries(LONE).map(([code, vk]) => [vk, code]),
    ...Object.entries(NAMED).filter(([name]) => /^[A-Z]/.test(name)).map(([name, vk]) => [vk, /^(Up|Down|Left|Right)$/.test(name) ? `Arrow${name}` : name]),
    ...Object.entries(SIGNS).map(([code, sign]) => [NAMED[sign], code]),
    ...TAPS.map((t2) => [t2.vk, t2.code]),
    [16, "ShiftLeft"],
    [17, "ControlLeft"],
    [18, "AltLeft"]
  ]);
  var HotkeyRecorder = class {
    held = /* @__PURE__ */ new Set();
    peak = [];
    other = false;
    /** When the modifier held alone went down, and the last tap: when it was let go. */
    downAt = 0;
    lastTap;
    /** When Ctrl+C was pressed, waiting for a second. */
    lastCopy;
    /** A key went down at `now` (ms); returns the hotkey a non-modifier key makes, if any. */
    keydown(code, now = 0) {
      if (TAPS.some((t2) => t2.code === code)) {
        if (this.held.size === 0) this.downAt = now;
        this.held.add(code);
        if (this.held.size > this.peak.length) this.peak = [...this.held];
        return void 0;
      }
      this.other = true;
      this.lastTap = void 0;
      const name = nameOfCode(code);
      const recorded = name ? this.withMods(name) : void 0;
      if (recorded?.hotkey !== "Control+C") {
        this.lastCopy = void 0;
        return recorded;
      }
      const twice = this.lastCopy !== void 0 && now - this.lastCopy <= DOUBLE_MS;
      this.lastCopy = twice ? void 0 : now;
      return twice ? { hotkey: COPY_TWICE } : { hotkey: recorded.hotkey, more: true, partial: true };
    }
    /** Whether a modifier is held now (Esc alone gives up; with one, it is a key). */
    holding() {
      return this.held.size > 0;
    }
    /** A key went up at `now`; returns the tap, double or chord once the last modifier is let go. */
    keyup(code, now = 0) {
      if (!TAPS.some((t2) => t2.code === code)) return void 0;
      this.held.delete(code);
      if (this.held.size > 0) return void 0;
      const peak = this.peak;
      const other = this.other;
      this.peak = [];
      this.other = false;
      if (other || peak.length === 0) return void 0;
      if (peak.length > 1) {
        this.lastTap = void 0;
        const mods = sortMods(peak.map((c) => TAPS.find((t2) => t2.code === c)?.mod).filter((m) => !!m));
        return mods.length >= 2 ? { hotkey: mods.join("+") } : void 0;
      }
      const name = TAPS.find((t2) => t2.code === peak[0])?.name;
      if (!name) return void 0;
      const previous = this.lastTap;
      this.lastTap = void 0;
      if (previous?.name === name && this.downAt - previous.at <= DOUBLE_MS) return { hotkey: `${name}*2` };
      this.lastTap = { name, at: now };
      return { hotkey: name, more: true };
    }
    /** A mouse button went down: the back or forward button (3, 4 in DOM numbering) is a hotkey. */
    mouse(button) {
      this.lastTap = void 0;
      this.lastCopy = void 0;
      this.other = this.held.size > 0;
      const name = button === 3 ? "MouseBack" : button === 4 ? "MouseForward" : void 0;
      return name ? this.withMods(name) : void 0;
    }
    reset() {
      this.held.clear();
      this.peak = [];
      this.other = false;
      this.lastTap = void 0;
      this.lastCopy = void 0;
    }
    withMods(name) {
      const mods = sortMods([...this.held].map((c) => TAPS.find((t2) => t2.code === c)?.mod).filter((m) => !!m).map((m) => onMac2 && m === "Super" ? "Control" : m));
      const hotkey = [...new Set(mods), name].join("+");
      return parseHotkey(hotkey) ? { hotkey } : void 0;
    }
  };

  // src/hardware.ts
  function nvidiaCard(p) {
    return p?.gpus.filter((g) => g.vendor === "nvidia").sort((a, b) => b.vramMb - a.vramMb)[0];
  }
  function mainCard(p) {
    return nvidiaCard(p) ?? p?.gpus.slice().sort((a, b) => b.vramMb - a.vramMb)[0];
  }
  function shortCpu(name) {
    return name.replace(/\((R|TM|C)\)/gi, "").replace(/\s+@.*$/, "").replace(/\b(CPU|Processor)\b/gi, "").replace(/\s+with\s+.*graphics.*$/i, "").replace(/\s+\d+-Core\b/gi, "").replace(/\s+/g, " ").trim();
  }
  function cardText(g) {
    const name = g.name.replace(/\((R|TM)\)/gi, "").replace(/\s+/g, " ").trim();
    return g.vramMb >= 1024 ? `${name} \xB7 ${t("size.gb", { n: Math.round(g.vramMb / 1024) })}` : name;
  }
  var LEVEL_VRAM_MB = { accurate: 3500, most: 9e3 };
  function cudaReady(g) {
    if (!g) return false;
    if (g.computeCap && g.computeCap < 5) return false;
    return !/^\d{3}\.\d+$/.test(g.driver) || Number(g.driver.split(".")[0]) >= 551;
  }
  function fitter(p) {
    const vram = p?.gpus.reduce((most, g) => Math.max(most, g.vramMb), 0) ?? 0;
    const nvidia = cudaReady(nvidiaCard(p)) && (nvidiaCard(p)?.vramMb ?? 0) === vram;
    return (need) => vram >= need ? { where: "card", slow: false, cuda: false } : vram >= need / 2 ? { where: "part", slow: true, cuda: nvidia } : { where: "processor", slow: true, cuda: false };
  }
  function translationAdvice(p) {
    const fit = fitter(p);
    const accurate = fit(LEVEL_VRAM_MB.accurate);
    const most = fit(LEVEL_VRAM_MB.most);
    return { advised: most.where === "card" ? "most" : accurate.where === "card" ? "accurate" : "fast", accurate, most };
  }

  // src/settings.ts
  var RATES = [0.75, 0.9, 1, 1.15, 1.3, 1.5];
  var SWITCH_SOUNDS = ["glass", "pluck", "string", "duck"];
  var SUMMARY_OWN_MAX = 500;
  var TALK_LEVELS = ["A2", "B1", "B2"];
  var TALK_ABOUT_MAX = 500;
  var EDIT_STYLES = ["clean", "business", "aiTask", "list", "own"];
  var EDIT_OWN_MAX = 500;
  var DEFAULTS = {
    native: "Russian",
    languages: [],
    voice: "",
    rate: 1,
    autoRead: true,
    oneAtATime: false,
    wordHint: "shift",
    rareWords: true,
    theme: "system",
    uiLanguage: "en",
    cardWidth: 440,
    cardHeight: 0,
    menuKey: "",
    selectKey: "",
    snipKey: "Control+Alt+S",
    translateKey: "",
    textKey: "Control+Alt+T",
    inPlaceKey: "",
    checkKey: "",
    typeKey: "",
    typeCheckKey: "",
    switchKey: "",
    switchOn: true,
    layouts: [],
    layoutKeys: {},
    autoFix: false,
    fixTwoCaps: true,
    fixCapsLock: true,
    keepCaps: false,
    fixOnPause: false,
    fixSound: false,
    switchSound: false,
    switchSoundName: "glass",
    learn: true,
    fixKey: "",
    fixKeyOn: true,
    apps: [],
    keepWords: [],
    layoutBadge: false,
    trayLayout: false,
    quietFullScreen: true,
    pauseKey: "",
    windowKey: "",
    dictateKey: "Control+Alt+D",
    englishKey: "",
    noteKey: "Control+Alt+N",
    againKey: "",
    practiceKey: "",
    talkKey: "",
    meetingKey: "",
    shotKey: "",
    callShots: false,
    callConsentSeen: false,
    callAuto: "off",
    callPanelOffset: { dx: 0, dy: 0 },
    callSummaryAuto: true,
    callTemplate: "general",
    callOwn: "",
    callSummaryMine: false,
    callNames: false,
    talkAloud: true,
    talkOnTop: false,
    talkLevel: "B1",
    talkAbout: "",
    dictateEdit: false,
    dictateEditStyle: "clean",
    dictateEditOwn: "",
    talkBounds: null,
    dictationBadge: { dx: 0, dy: 0 },
    dictationPanel: true,
    dictateHold: false,
    vocabulary: [],
    translationLevel: "fast",
    model: "accurate",
    speechPrefer: "accuracy",
    dictationModel: "",
    transcriptsModel: "",
    speakersDevice: "auto",
    speechTestAgreed: false,
    speechTestDeclinedKey: "",
    speechTestDeclinedAt: 0,
    startWithWindows: true,
    naturalDismissed: false,
    shareOfferSeen: [],
    introSeen: false,
    paused: false,
    keysVersion: 2,
    setupDone: true
  };
  var COPY_TWICE_KEYS = ["selectKey", "translateKey", "inPlaceKey", "checkKey"];
  var keptForm = (text) => text.trim().toLowerCase();
  function myLanguages(s) {
    return [...new Set([findLanguage(s.native)?.code ?? "", "en", ...s.languages].filter(Boolean))];
  }

  // src/vocabulary.ts
  function parseEntry(line) {
    const open2 = line.indexOf("(");
    if (open2 < 0) return { word: line.trim(), heard: [] };
    const close = line.indexOf(")", open2);
    const inside = line.slice(open2 + 1, close < 0 ? void 0 : close);
    const word = line.slice(0, open2).trim();
    const heard2 = [...new Set(inside.split(",").map((h) => h.trim()).filter((h) => h && h.toLowerCase() !== word.toLowerCase()))];
    return { word, heard: heard2 };
  }

  // src/worddiff.ts
  function tokens(text) {
    const list2 = [];
    let end = 0;
    for (const m of text.matchAll(/(\s*)([\p{L}\p{N}\p{M}'’]+|\S)/gu)) {
      list2.push({ pre: m[1] ?? "", word: m[2] ?? "" });
      end = (m.index ?? 0) + m[0].length;
    }
    return { list: list2, tail: text.slice(end) };
  }
  var MAX_CELLS = 4e6;
  function diffTokens(a, b) {
    let start3 = 0;
    while (start3 < a.length && start3 < b.length && a[start3].word === b[start3].word) start3++;
    let endA = a.length;
    let endB = b.length;
    while (endA > start3 && endB > start3 && a[endA - 1].word === b[endB - 1].word) {
      endA--;
      endB--;
    }
    const head = b.slice(0, start3).map((token) => ({ kind: "same", token }));
    const tail = b.slice(endB).map((token) => ({ kind: "same", token }));
    const x = a.slice(start3, endA);
    const y = b.slice(start3, endB);
    const n = x.length;
    const m = y.length;
    const middle = [];
    if (n * m > MAX_CELLS) {
      middle.push(...x.map((token) => ({ kind: "del", token })), ...y.map((token) => ({ kind: "ins", token })));
    } else {
      const w = m + 1;
      const dp = new Uint32Array((n + 1) * w);
      for (let i2 = n - 1; i2 >= 0; i2--)
        for (let j2 = m - 1; j2 >= 0; j2--)
          dp[i2 * w + j2] = x[i2].word === y[j2].word ? dp[(i2 + 1) * w + j2 + 1] + 1 : Math.max(dp[(i2 + 1) * w + j2], dp[i2 * w + j2 + 1]);
      let i = 0;
      let j = 0;
      while (i < n || j < m) {
        if (i < n && j < m && x[i].word === y[j].word) {
          middle.push({ kind: "same", token: y[j] });
          i++;
          j++;
        } else if (j >= m || i < n && dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
          middle.push({ kind: "del", token: x[i++] });
        } else {
          middle.push({ kind: "ins", token: y[j++] });
        }
      }
    }
    return [...head, ...middle, ...tail];
  }
  function diffLine(original, corrected) {
    const a = tokens(original);
    const b = tokens(corrected);
    const ops = diffTokens(a.list, b.list);
    const parts = [];
    const push = (kind, text) => {
      if (!text) return;
      const last = parts.at(-1);
      if (last?.kind === kind) last.text += text;
      else parts.push({ kind, text });
    };
    for (let k = 0; k < ops.length; ) {
      const op = ops[k];
      if (op.kind === "same") {
        push("same", op.token.pre + op.token.word);
        k++;
        continue;
      }
      const struck = [];
      const added = [];
      for (; k < ops.length && ops[k].kind !== "same"; k++) (ops[k].kind === "del" ? struck : added).push(ops[k].token);
      const join = (list2) => list2.map((t2, i) => (i ? t2.pre : "") + t2.word).join("");
      push("same", (added[0] ?? struck[0]).pre);
      push("del", join(struck));
      push("ins", join(added));
    }
    push("same", b.tail);
    return parts;
  }
  function wordDiff(original, corrected) {
    const a = original.split("\n");
    const b = corrected.split("\n");
    if (a.length !== b.length) return diffLine(original, corrected);
    const parts = [];
    a.forEach((line, i) => {
      for (const part of [...i ? [{ kind: "same", text: "\n" }] : [], ...diffLine(line, b[i])]) {
        const last = parts.at(-1);
        if (last?.kind === part.kind && part.kind === "same") last.text += part.text;
        else parts.push({ ...part });
      }
    });
    return parts;
  }
  function changesOf(parts) {
    const out = [];
    for (let k = 0; k < parts.length; k++) {
      const part = parts[k];
      if (part.kind === "del") {
        const next = parts[k + 1];
        if (next?.kind === "ins") k++;
        out.push({ wrong: part.text, right: next?.kind === "ins" ? next.text : "" });
      } else if (part.kind === "ins") out.push({ wrong: "", right: part.text });
    }
    return out;
  }

  // src/webview/dom.ts
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === void 0 || value === false) continue;
      if (typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "class") {
        node.className = String(value);
      } else {
        node.setAttribute(key, value === true ? "" : String(value));
      }
    }
    for (const child of children) {
      if (child === null || child === void 0 || child === false) continue;
      node.append(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }
  function icon(name, extra = "") {
    return el("i", { class: `codicon codicon-${name}${extra ? " " + extra : ""}`, "aria-hidden": "true" });
  }
  function setIcon(node, name) {
    if (!node) return;
    for (const c of [...node.classList]) if (c.startsWith("codicon-")) node.classList.remove(c);
    node.classList.add(`codicon-${name}`);
  }
  function html(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return template.content;
  }

  // src/webview/brand.ts
  function logo() {
    const name = t("app.name");
    return el("span", { class: "logo", "aria-label": name }, el("span", {}, /[а-яіїєґ]/i.test(name) ? name.toLowerCase() : name), el("span", { class: "dot", "aria-hidden": "true" }));
  }
  function tile(px) {
    const svg = html(
      `<svg class="tile" width="${px}" height="${px}" viewBox="0 0 256 256" aria-hidden="true"><rect x="16" y="16" width="224" height="224" rx="56" fill="#FF5A36"/>` + (px <= 32 ? '<circle cx="128" cy="128" r="34" fill="#fff"/><circle cx="128" cy="128" r="78" fill="none" stroke="#fff" stroke-width="26"/>' : '<circle cx="128" cy="128" r="25" fill="#fff"/><circle cx="128" cy="128" r="57" fill="none" stroke="#fff" stroke-width="11"/><circle cx="128" cy="128" r="93" fill="none" stroke="#fff" stroke-width="11" opacity=".55"/>') + "</svg>"
    ).firstElementChild;
    return svg;
  }

  // src/webview/glyphs.ts
  var GLYPHS = {
    play: '<path class="f" d="M5 3.2v9.6c0 .5.5.8.9.5l7-4.8a.6.6 0 0 0 0-1L5.9 2.7c-.4-.3-.9 0-.9.5z"/>',
    stop: '<rect class="f" x="3.5" y="3.5" width="9" height="9" rx="1.8"/>',
    prev: '<path d="M3.5 3.5v9"/><path class="f" d="M12.5 3.6v8.8c0 .4-.5.7-.8.4L6 8.4a.5.5 0 0 1 0-.8l5.7-4.4c.3-.3.8 0 .8.4z"/>',
    next: '<path d="M12.5 3.5v9"/><path class="f" d="M3.5 3.6v8.8c0 .4.5.7.8.4L10 8.4a.5.5 0 0 0 0-.8L4.3 3.2c-.3-.3-.8 0-.8.4z"/>',
    pin: '<path d="M6 2.5h4M7 2.5v3.8L4.5 9h7L9 6.3V2.5M8 9v4.5"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>',
    minimize: '<path d="M4 8h8"/>',
    maximize: '<rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/>',
    restore: '<rect x="3.5" y="5.5" width="7" height="7" rx="1.5"/><path d="M6 3.5h5a1.5 1.5 0 0 1 1.5 1.5v5"/>'
  };
  function glyph(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "glyph");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.dataset.shape = name;
    svg.innerHTML = GLYPHS[name];
    return svg;
  }

  // src/webview/keycaps.ts
  var COPY_TWICE2 = "Control+C*2";
  function caps(hotkey, chain) {
    const attrs = chain ? { class: "kg", "data-chain": chain } : { class: "kg" };
    if (!hotkey) return el("span", attrs, el("span", { class: "key none" }, t("keys.notSet")));
    const twice = hotkey.endsWith("*2");
    const parts = hotkey.replace(/\*2$/, "").split("+");
    return el("span", attrs, ...parts.map((part) => el("span", { class: "key" }, hotkeyLabel(part))), twice ? el("span", { class: "x2" }, "\xD72") : null);
  }

  // src/webview/lucide.ts
  var LUCIDE = {
    "volume-2": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /> <path d="M16 9a5 5 0 0 1 0 6" /> <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />',
    "languages": '<path d="m5 8 6 6" /> <path d="m4 14 6-6 2-3" /> <path d="M2 5h12" /> <path d="M7 2h1" /> <path d="m22 22-5-10-5 10" /> <path d="M14 18h6" />',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
    "scan": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /> <path d="M17 3h2a2 2 0 0 1 2 2v2" /> <path d="M21 17v2a2 2 0 0 1-2 2h-2" /> <path d="M7 21H5a2 2 0 0 1-2-2v-2" />',
    "mic": '<path d="M12 19v3" /> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <rect x="9" y="2" width="6" height="13" rx="3" />',
    "audio-lines": '<path d="M2 10v3" /> <path d="M6 6v11" /> <path d="M10 3v18" /> <path d="M14 8v7" /> <path d="M18 5v13" /> <path d="M22 10v3" />',
    "keyboard": '<path d="M10 8h.01" /> <path d="M12 12h.01" /> <path d="M14 8h.01" /> <path d="M16 12h.01" /> <path d="M18 8h.01" /> <path d="M6 8h.01" /> <path d="M7 16h10" /> <path d="M8 12h.01" /> <rect width="20" height="16" x="2" y="4" rx="2" />',
    "file-text": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" />',
    "notebook-pen": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /> <path d="M2 6h4" /> <path d="M2 10h4" /> <path d="M2 14h4" /> <path d="M2 18h4" /> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />',
    "book-open": '<path d="M12 5v16" /> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />',
    "list-checks": '<path d="M13 5h8" /> <path d="M13 12h8" /> <path d="M13 19h8" /> <path d="m3 17 2 2 4-4" /> <path d="m3 7 2 2 4-4" />',
    "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    "info": '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
    "settings": '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" /> <circle cx="12" cy="12" r="3" />',
    "bird": '<path d="M16 7h.01" /> <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" /> <path d="m20 7 2 .5-2 .5" /> <path d="M10 18v3" /> <path d="M14 17.75V21" /> <path d="M7 18a6 6 0 0 0 3.84-10.61" />',
    "send-horizontal": '<path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /> <path d="M6 12h16" />',
    "mic-off": '<path d="M12 19v3" /> <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /> <path d="M16.95 16.95A7 7 0 0 1 5 12v-2" /> <path d="M18.89 13.23A7 7 0 0 0 19 12v-2" /> <path d="m2 2 20 20" /> <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />',
    "pin": '<path d="M12 17v5" /> <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />',
    "square-pen": '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" /> <path d="M12 7v5l4 2" />',
    "list-ordered": '<path d="M11 5h10" /> <path d="M11 12h10" /> <path d="M11 19h10" /> <path d="M4 4h1v5" /> <path d="M4 9h2" /> <path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" />',
    "message-square-text": '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" /> <path d="M7 11h10" /> <path d="M7 15h6" /> <path d="M7 7h8" />',
    "arrow-left": '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
    "bug": '<path d="M12 20v-9" /> <path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" /> <path d="M14.12 3.88 16 2" /> <path d="M21 21a4 4 0 0 0-3.81-4" /> <path d="M21 5a4 4 0 0 1-3.55 3.97" /> <path d="M22 13h-4" /> <path d="M3 21a4 4 0 0 1 3.81-4" /> <path d="M3 5a4 4 0 0 0 3.55 3.97" /> <path d="M6 13H2" /> <path d="m8 2 1.88 1.88" /> <path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" />',
    "file-audio": '<path d="M4 6.835V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-.343" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M2 19a2 2 0 0 1 4 0v1a2 2 0 0 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 0 1-4 0v-1a2 2 0 0 1 4 0" />',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',
    "spell-check": '<path d="m20 15-5.5 5.5L12 18" /> <path d="m4 16 6-12 5.115 10.23" /> <path d="M6 12h8" />',
    "video": '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /> <rect x="2" y="6" width="14" height="12" rx="2" />',
    "cpu": '<path d="M12 20v2" /> <path d="M12 2v2" /> <path d="M17 20v2" /> <path d="M17 2v2" /> <path d="M2 12h2" /> <path d="M2 17h2" /> <path d="M2 7h2" /> <path d="M20 12h2" /> <path d="M20 17h2" /> <path d="M20 7h2" /> <path d="M7 20v2" /> <path d="M7 2v2" /> <rect x="4" y="4" width="16" height="16" rx="2" /> <rect x="8" y="8" width="8" height="8" rx="1" />',
    "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    "external-link": '<path d="M15 3h6v6" /> <path d="M10 14 21 3" /> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
    "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" />',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3" /> <path d="M3 5V19A9 3 0 0 0 21 19V5" /> <path d="M3 12A9 3 0 0 0 21 12" />',
    "play": '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
    "pause": '<rect x="14" y="3" width="5" height="18" rx="1" /> <rect x="5" y="3" width="5" height="18" rx="1" />',
    "power": '<path d="M12 2v10" /> <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />',
    "list": '<path d="M3 5h.01" /> <path d="M3 12h.01" /> <path d="M3 19h.01" /> <path d="M8 5h13" /> <path d="M8 12h13" /> <path d="M8 19h13" />',
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" />',
    "clock": '<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "download": '<path d="M12 15V3" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> <path d="m7 10 5 5 5-5" />',
    "globe": '<circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" />',
    "type": '<path d="M12 4v16" /> <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" /> <path d="M9 20h6" />',
    "message-square": '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />',
    "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
    "search": '<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',
    "trash-2": '<path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    "circle-alert": '<circle cx="12" cy="12" r="10" /> <line x1="12" x2="12" y1="8" y2="12" /> <line x1="12" x2="12.01" y1="16" y2="16" />',
    "circle-check": '<circle cx="12" cy="12" r="10" /> <path d="m16 9-5.5 5.5L8 12" />',
    "check": '<path d="M20 6 9 17l-5-5" />',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    "memory-stick": '<path d="M12 12v-2" /> <path d="M12 18v-2" /> <path d="M16 12v-2" /> <path d="M16 18v-2" /> <path d="M2 11h1.5" /> <path d="M20 18v-2" /> <path d="M20.5 11H22" /> <path d="M4 18v-2" /> <path d="M8 12v-2" /> <path d="M8 18v-2" /> <rect x="2" y="6" width="20" height="10" rx="2" />',
    "hard-drive": '<path d="M10 16h.01" /> <path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /> <path d="M21.946 12.013H2.054" /> <path d="M6 16h.01" />',
    "boxes": '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" /> <path d="m7 16.5-4.74-2.85" /> <path d="m7 16.5 5-3" /> <path d="M7 16.5v5.17" /> <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" /> <path d="m17 16.5-5-3" /> <path d="m17 16.5 4.74-2.85" /> <path d="M17 16.5v5.17" /> <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" /> <path d="M12 8 7.26 5.15" /> <path d="m12 8 4.74-2.85" /> <path d="M12 13.5V8" />',
    "laptop": '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" /> <path d="M20.054 15.987H3.946" />',
    "sparkles": '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" />',
    "wand-sparkles": '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /> <path d="m14 7 3 3" /> <path d="M5 6v4" /> <path d="M19 14v4" /> <path d="M10 2v2" /> <path d="M7 8H3" /> <path d="M21 16h-4" /> <path d="M11 3H9" />',
    "thumbs-up": '<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /> <path d="M7 10v12" />',
    "loader": '<path d="M12 2v4" /> <path d="m16.2 7.8 2.9-2.9" /> <path d="M18 12h4" /> <path d="m16.2 16.2 2.9 2.9" /> <path d="M12 18v4" /> <path d="m4.9 19.1 2.9-2.9" /> <path d="M2 12h4" /> <path d="m4.9 4.9 2.9 2.9" />',
    "mail": '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" />',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
    "whole-word": '<circle cx="7" cy="12" r="3" /> <path d="M10 9v6" /> <circle cx="17" cy="12" r="3" /> <path d="M14 7v8" /> <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" />',
    "brain": '<path d="M12 18V5" /> <path d="M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4" /> <path d="M17.707 6.294A3 3 0 1012 5a3 3 0 10-5.707 1.294" /> <path d="M17.996 5.125a4 4 0 012.526 5.77" /> <path d="M18 18a4 4 0 002-7.465" /> <path d="M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517" /> <path d="M6 18a4 4 0 01-2-7.465" /> <path d="M6.004 5.125a4 4 0 00-2.526 5.77" />',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2" /> <path d="M10 4v4" /> <path d="M2 8h20" /> <path d="M6 4v4" />',
    "arrow-up-right": '<path d="M7 7h10v10" /> <path d="M7 17 17 7" />',
    "pencil-line": '<path d="M13 21h8" /> <path d="m15 5 4 4" /> <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />',
    "monitor-speaker": '<path d="M5.5 20H8" /> <path d="M17 9h.01" /> <rect width="10" height="16" x="12" y="4" rx="2" /> <path d="M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" /> <circle cx="17" cy="15" r="1" />',
    "scan-text": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /> <path d="M17 3h2a2 2 0 0 1 2 2v2" /> <path d="M21 17v2a2 2 0 0 1-2 2h-2" /> <path d="M7 21H5a2 2 0 0 1-2-2v-2" /> <path d="M7 8h8" /> <path d="M7 12h10" /> <path d="M7 16h6" />',
    "text-cursor": '<path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1" /> <path d="M7 22h1a4 4 0 0 0 4-4" /> <path d="M7 2h1a4 4 0 0 1 4 4" />',
    "panel-bottom": '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 15h18" />',
    "plus": '<path d="M5 12h14" /> <path d="M12 5v14" />',
    "x": '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    "minus": '<path d="M5 12h14" />',
    "square": '<rect width="18" height="18" x="3" y="3" rx="2" />',
    "camera": '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /> <circle cx="12" cy="13" r="3" />',
    "chevron-right": '<path d="m9 18 6-6-6-6" />',
    "chevron-left": '<path d="m15 18-6-6 6-6" />',
    "chevron-down": '<path d="m6 9 6 6 6-6" />',
    "arrow-up": '<path d="m5 12 7-7 7 7" /> <path d="M12 19V5" />',
    "arrow-down": '<path d="M12 5v14" /> <path d="m19 12-7 7-7-7" />'
  };
  function lucide(name, cls = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", cls ? `lu ${cls}` : "lu");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = LUCIDE[name];
    return svg;
  }

  // src/webview/ui.ts
  var post = (message) => window.tutorHost.post(message);
  var grp = (text, n, right) => el("div", { class: "grp" }, text, n !== void 0 && n !== "" ? el("span", { class: "n" }, String(n)) : null, right ?? null);
  var bad = (text) => el("small", { class: "bad" }, text);
  var notesOf = (notes) => notes.filter((n) => !!n).map((n) => typeof n === "string" ? el("small", {}, n) : n);
  function row(label, notes, ...controls) {
    return el("div", { class: "row" }, el("div", { class: "l" }, label, ...notesOf(notes)), ...controls);
  }
  function card(name, label, notes, ...controls) {
    const node = row(label, notes, ...controls);
    node.prepend(lucide(name));
    return node;
  }
  function navCard(name, title, note, value, onOpen, id = "", ok = false) {
    return el(
      "button",
      { class: "row navc", "data-sub": id || void 0, onclick: onOpen },
      name ? lucide(name) : null,
      el("div", { class: "l" }, title, ...notesOf(Array.isArray(note) ? note : [note])),
      value ? el("span", { class: ok ? "v ok" : "v" }, ok ? lucide("check", "s") : null, value) : null,
      lucide("chevron-right", "chev")
    );
  }
  function radioRow(label, notes, on, pick, ...controls) {
    const node = el(
      "div",
      {
        class: `row radio${on ? " on" : ""}${pick ? "" : " off"}`,
        role: "radio",
        "aria-checked": String(on),
        "aria-disabled": pick ? void 0 : "true",
        tabindex: pick && !on ? "0" : void 0
      },
      el("span", { class: "ring", "aria-hidden": "true" }),
      el("div", { class: "l" }, label, ...notesOf(notes)),
      ...controls
    );
    const choose = (event) => {
      if (on || !pick || event.target.closest("button, a, input, select")) return;
      node.classList.add("on");
      pick();
    };
    node.addEventListener("click", choose);
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      choose(event);
    });
    return node;
  }
  var recommended = () => el("span", { class: "chip good" }, lucide("check", "s"), t("ui.recommended"));
  function ib(name, label, onclick, disabled = false) {
    return el("button", { class: "ib", title: label, "aria-label": label, disabled, onclick }, lucide(name));
  }
  function toggle(label, on, onchange, ...notes) {
    const knob = el("span", { class: on ? "tg on" : "tg" });
    const node = el(
      "button",
      {
        class: "row trow",
        role: "switch",
        "aria-checked": String(on),
        onclick: () => {
          const next = node.getAttribute("aria-checked") !== "true";
          node.setAttribute("aria-checked", String(next));
          knob.classList.toggle("on", next);
          onchange(next);
        }
      },
      el("span", { class: "l" }, label, ...notesOf(notes)),
      knob
    );
    return node;
  }
  function toggleCard(name, label, on, onchange, ...notes) {
    const node = toggle(label, on, onchange, ...notes);
    node.prepend(lucide(name));
    return node;
  }
  function toggleKnob(on, onchange, label) {
    const node = el("button", {
      class: on ? "tg on" : "tg",
      role: "switch",
      "aria-checked": String(on),
      "aria-label": label,
      onclick: () => {
        const next = node.getAttribute("aria-checked") !== "true";
        node.setAttribute("aria-checked", String(next));
        node.classList.toggle("on", next);
        onchange(next);
      }
    });
    return node;
  }
  function seg(value, options, onchange, mono = false) {
    const node = el("span", { class: mono ? "seg mono" : "seg", role: "radiogroup" });
    for (const [v, label] of options) {
      const b = el(
        "button",
        {
          class: v === value ? "on" : "",
          role: "radio",
          "aria-checked": String(v === value),
          onclick: () => {
            for (const other of node.children) {
              other.classList.toggle("on", other === b);
              other.setAttribute("aria-checked", String(other === b));
            }
            onchange(v);
          }
        },
        label
      );
      node.append(b);
    }
    return node;
  }
  var sels = /* @__PURE__ */ new WeakMap();
  function select(value, options, onchange) {
    const shown2 = options.find(([v]) => v === value) ?? options[0];
    const node = el(
      "button",
      { type: "button", class: "sel", "aria-haspopup": "listbox", "aria-expanded": "false" },
      el("span", { class: "sv" }, shown2?.[1] ?? ""),
      lucide("chevron-down", "s")
    );
    sels.set(node, {
      options,
      value: shown2?.[0] ?? value,
      pick: (v) => onchange(v),
      key: options.map(([v]) => String(v)).join("")
    });
    node.addEventListener("click", () => dropdown?.anchor === node ? closeSel(true) : openSel(node));
    node.addEventListener("keydown", (event) => {
      if (dropdown || !["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key) || event.altKey || event.ctrlKey) return;
      event.preventDefault();
      openSel(node);
    });
    return node;
  }
  var SEL_ROW = 32;
  var SEL_ROWS = 10;
  var SEL_FILTER_FROM = 13;
  var SEL_GAP = 4;
  var SEL_EDGE = 8;
  var dropdown;
  var selIds = 0;
  function openSel(anchor) {
    closeSel(false);
    const state = sels.get(anchor);
    if (!state) return;
    const id = `sel-${++selIds}`;
    const list2 = el("div", { class: "sel-list", role: "listbox", id, tabindex: "-1" });
    const items = state.options.map(([v, label], i) => {
      const on = v === state.value;
      return el("div", { class: on ? "sel-opt on" : "sel-opt", role: "option", id: `${id}-${i}`, "aria-selected": String(on) }, lucide("check", "s"), el("span", {}, label));
    });
    list2.append(...items);
    const empty = el("div", { class: "sel-empty", hidden: true }, t("tr.nothing"));
    let filter;
    const pop2 = el("div", { class: "sel-pop" });
    if (state.options.length >= SEL_FILTER_FROM) {
      filter = el("input", {
        type: "search",
        role: "combobox",
        "aria-controls": id,
        "aria-expanded": "true",
        "aria-autocomplete": "list",
        placeholder: t("nav.search"),
        "aria-label": t("nav.search"),
        spellcheck: "false"
      });
      pop2.append(el("label", { class: "sel-filter" }, lucide("search", "s"), filter));
    }
    pop2.append(list2, empty);
    document.body.append(pop2);
    const d = { anchor, pop: pop2, list: list2, filter, items, active: -1, typed: "", typedAt: 0, done: () => {
    } };
    dropdown = d;
    anchor.setAttribute("aria-expanded", "true");
    const visible = () => items.filter((item) => !item.hidden);
    const setActive = (index, scroll = true) => {
      items[d.active]?.classList.remove("active");
      d.active = index;
      const item = items[index];
      const owner = filter ?? list2;
      if (!item) return owner.removeAttribute("aria-activedescendant");
      item.classList.add("active");
      owner.setAttribute("aria-activedescendant", item.id);
      if (!scroll) return;
      if (item.offsetTop < list2.scrollTop) list2.scrollTop = item.offsetTop;
      else if (item.offsetTop + item.offsetHeight > list2.scrollTop + list2.clientHeight) list2.scrollTop = item.offsetTop + item.offsetHeight - list2.clientHeight;
    };
    const move2 = (step2, to) => {
      const shown2 = visible();
      if (!shown2.length) return;
      const at = d.active >= 0 ? shown2.indexOf(items[d.active]) : -1;
      const next = to === "first" ? 0 : to === "last" ? shown2.length - 1 : at < 0 ? 0 : Math.max(0, Math.min(shown2.length - 1, at + step2));
      setActive(items.indexOf(shown2[next]));
    };
    const pick = (index) => {
      const s = sels.get(d.anchor);
      const choice2 = s?.options[index];
      closeSel(true);
      if (!s || !choice2 || choice2[0] === s.value) return;
      s.value = choice2[0];
      const v = d.anchor.querySelector(".sv");
      if (v) v.textContent = choice2[1];
      s.pick(choice2[0]);
    };
    const place = () => {
      const r = d.anchor.getBoundingClientRect();
      const natural = Math.min(pop2.offsetWidth, 340);
      const width = Math.min(Math.max(r.width, 220, natural), window.innerWidth - 2 * SEL_EDGE);
      pop2.style.width = `${width}px`;
      pop2.style.left = `${Math.max(SEL_EDGE, Math.min(r.right - width, window.innerWidth - SEL_EDGE - width))}px`;
      const chrome = pop2.offsetHeight - list2.offsetHeight;
      const want = chrome + Math.min(SEL_ROWS, Math.max(1, items.length)) * SEL_ROW;
      const below = window.innerHeight - r.bottom - SEL_GAP - SEL_EDGE;
      const above = r.top - SEL_GAP - SEL_EDGE;
      const down = below >= Math.min(want, chrome + 3 * SEL_ROW) || below >= above;
      pop2.style.maxHeight = `${Math.max(chrome + SEL_ROW, Math.min(want, down ? below : above))}px`;
      pop2.style.top = down ? `${r.bottom + SEL_GAP}px` : `${r.top - SEL_GAP - pop2.offsetHeight}px`;
      pop2.classList.toggle("up", !down);
    };
    pop2.style.visibility = "hidden";
    pop2.style.top = "0px";
    pop2.style.left = "0px";
    place();
    pop2.style.visibility = "";
    const current2 = items.findIndex((item) => item.classList.contains("on"));
    if (current2 >= 0) {
      setActive(current2, false);
      list2.scrollTop = Math.max(0, items[current2].offsetTop - (list2.clientHeight - SEL_ROW) / 2);
    } else move2(0, "first");
    (filter ?? list2).focus({ preventScroll: true });
    filter?.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      for (const item of items) item.hidden = !!q && !(item.textContent ?? "").toLowerCase().includes(q);
      empty.hidden = visible().length > 0;
      const keep = items[d.active];
      if (keep && !keep.hidden) setActive(d.active);
      else move2(0, "first");
    });
    pop2.addEventListener("mousedown", (event) => event.target !== filter && event.preventDefault());
    list2.addEventListener("pointermove", (event) => {
      const item = event.target.closest(".sel-opt");
      if (item && items.indexOf(item) !== d.active) setActive(items.indexOf(item), false);
    });
    list2.addEventListener("click", (event) => {
      const item = event.target.closest(".sel-opt");
      if (item) pick(items.indexOf(item));
    });
    const onKey = (event) => {
      if (event.isComposing) return;
      const handled = () => (event.preventDefault(), event.stopPropagation());
      switch (event.key) {
        case "Escape":
          handled();
          return closeSel(true);
        case "Tab":
          return closeSel(true);
        case "ArrowDown":
          return handled(), move2(1);
        case "ArrowUp":
          return handled(), move2(-1);
        case "PageDown":
          return handled(), move2(SEL_ROWS - 1);
        case "PageUp":
          return handled(), move2(1 - SEL_ROWS);
        case "Home":
        case "End":
          if (filter) return;
          return handled(), move2(0, event.key === "Home" ? "first" : "last");
        case "Enter":
          handled();
          return items[d.active] && !items[d.active].hidden ? pick(d.active) : void 0;
      }
      if (filter || event.key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === " " && !d.typed) return handled(), d.active >= 0 ? pick(d.active) : void 0;
      handled();
      const now = event.timeStamp;
      d.typed = now - d.typedAt < 700 ? d.typed + event.key.toLowerCase() : event.key.toLowerCase();
      d.typedAt = now;
      const same = [...d.typed].every((c) => c === d.typed[0]);
      const probe = same ? d.typed.charAt(0) : d.typed;
      const from = same ? d.active + 1 : Math.max(0, d.active);
      for (let k = 0; k < items.length; k++) {
        const i = (from + k) % items.length;
        if ((items[i].textContent ?? "").trim().toLowerCase().startsWith(probe)) return setActive(i);
      }
    };
    const onDown = (event) => {
      const target = event.target;
      if (!pop2.contains(target) && !d.anchor.contains(target)) closeSel(false);
    };
    const onScroll = (event) => {
      if (!(event.target instanceof Node) || !pop2.contains(event.target)) closeSel(false);
    };
    const onBlur = () => closeSel(false);
    const watch = new MutationObserver(() => {
      if (d.anchor.isConnected) return;
      const key = sels.get(d.anchor)?.key;
      const twin = [...document.querySelectorAll("button.sel")].find((b) => sels.get(b)?.key === key);
      if (!twin) return closeSel(false);
      d.anchor = twin;
      twin.setAttribute("aria-expanded", "true");
    });
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onBlur);
    watch.observe(document.body, { childList: true, subtree: true });
    d.done = () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onBlur);
      watch.disconnect();
    };
  }
  function closeSel(focus) {
    const d = dropdown;
    if (!d) return;
    dropdown = void 0;
    d.done();
    d.pop.remove();
    d.anchor.setAttribute("aria-expanded", "false");
    if (focus && d.anchor.isConnected) d.anchor.focus({ preventScroll: true });
  }
  function uiLanguageCard(current2, save2) {
    return card(
      "globe",
      t("settings.uiLanguage"),
      [t("settings.uiLanguageNote")],
      seg(
        current2,
        UI_LANGUAGES.map((l) => [l.code, l.name]),
        (language) => language !== current2 && save2(language)
      )
    );
  }
  var linkBtn = (text, onclick, disabled = false) => el("button", { class: "link", disabled, onclick }, text);
  var twoNames = (first, second) => first.toLowerCase() === second.toLowerCase() ? first : `${first} \xB7 ${second}`;
  var chip = (text, cls = "") => el("span", { class: `chip${cls ? " " + cls : ""}` }, text);
  function btn(label, onclick, cls = "", title) {
    return el("button", { class: `btn${cls ? " " + cls : ""}`, onclick, title, "aria-label": title }, ...typeof label === "string" ? [label] : label);
  }
  function link(url, text) {
    return el("a", { href: url, onclick: (event) => (event.preventDefault(), post({ type: "openLink", url })) }, text);
  }
  function bar(progress) {
    const fill = el("i", { class: "fill" });
    fill.style.width = `${Math.round(progress * 100)}%`;
    return el("span", { class: "bar" }, fill);
  }
  var aside = (name, ...text) => el("p", { class: "aside" }, lucide(name, "s"), el("span", {}, ...text));
  var warn = (...text) => el("p", { class: "warn" }, lucide("circle-alert", "s"), el("span", {}, ...text));
  function liveField(id, placeholder, label, onkey) {
    const field = el("input", {
      type: "text",
      class: "field",
      placeholder,
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": label,
      "data-live": id
    });
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        onkey(event.key, field);
      }
    });
    return field;
  }
  function tiles(list2) {
    return el(
      "div",
      { class: "tiles" },
      ...list2.map(
        (x) => el(
          "button",
          { class: "tcell", "data-sub": x.id || void 0, onclick: x.open },
          el("span", { class: "tt" }, lucide(x.icon), x.count !== void 0 && x.count !== "" ? el("span", { class: "tc" }, String(x.count)) : null),
          el("span", { class: "tn" }, x.title),
          x.sub ? el("span", { class: "ts", title: x.sub }, x.sub) : null
        )
      )
    );
  }
  function enginePlate(lines) {
    return el(
      "div",
      { class: "engine" },
      el("div", { class: "eh" }, lucide("cpu", "s"), t("nav.models")),
      ...lines.map((l) => el("button", { class: "eline", "data-sub": l.id || void 0, onclick: l.open }, el("span", { class: "el" }, l.title), el("span", { class: "ev" }, l.value), lucide("chevron-right", "chev")))
    );
  }
  function wordChips(items, sep = "") {
    return el(
      "div",
      { class: "wchips" },
      ...items.map(
        (c) => el(
          "span",
          { class: "wchip", title: c.title },
          c.open ? el("button", { class: "ww", onclick: c.open }, c.text) : el("span", { class: "ww" }, c.text),
          c.more ? el("span", { class: "wx" }, sep ? `${sep} ${c.more}` : c.more) : null,
          el("button", { class: "wdel", title: t("ui.remove", { item: c.text }), "aria-label": t("ui.remove", { item: c.text }), onclick: c.remove }, lucide("x"))
        )
      )
    );
  }
  function lineList(items, cls = "") {
    return el(
      "div",
      { class: cls ? `lines ${cls}` : "lines" },
      ...items.map(
        (x) => el(
          "div",
          { class: "ln", title: x.title },
          x.open ? el("button", { class: "la", onclick: x.open }, x.text) : el("span", { class: "la" }, x.text),
          x.more ? el("span", { class: "lb" }, x.more) : null,
          x.remove ? el("button", { class: "wdel", title: x.removeLabel ?? t("ui.forget"), "aria-label": x.removeLabel ?? t("ui.forget"), onclick: x.remove }, lucide("x")) : null
        )
      )
    );
  }
  function listPage(o) {
    const norm = o.normalize ?? ((text) => text.trim());
    const add = (field2) => {
      const item = norm(field2.value);
      if (!item) return field2.focus();
      field2.value = "";
      field2.focus();
      if (o.items.some((x) => x.toLowerCase() === item.toLowerCase())) return;
      o.add(item);
    };
    const field = liveField("add", o.placeholder, o.label, (key, f) => key === "Enter" ? add(f) : (f.value = "", f.blur()));
    const addCard = el(
      "div",
      { class: "row add" },
      el("div", { class: "fields" }, field, btn([lucide("plus", "s"), t("ui.add")], () => add(field), "primary")),
      o.note ? el("small", {}, o.note) : null
    );
    const items = o.items.map((item) => ({ text: item, title: o.itemNote?.(item) ?? void 0, remove: () => o.remove(item) }));
    return [
      grp(o.label),
      addCard,
      o.extra ?? null,
      grp(o.count, o.items.length || void 0),
      items.length ? wordChips(items) : aside("info", o.empty)
    ].filter((n) => n !== null);
  }

  // engine/models.json
  var models_default = {
    about: "The speech models Kryakl can use, read by the engine (asr.py) and by Kryakl (src/speechplan.ts). rank: how accurate, higher is better. phrase: seconds to recognize a 7 s phrase as Dictate does; rtf: seconds per second of a long recording as Transcribe does (words with their times). Both are first guesses, measured on an i9-9900K (cpu, int8) and an RTX 2080 SUPER (cuda, float16) on 2026-10-28, until this computer is tested. Whisper pads every phrase to a 30 s window, so a phrase costs one window whatever its length; turbo's decoder is light, so on long recordings it is nearly as quick as small. ramMb: memory on the processor; vramMb: on the card, per compute type. Parakeet (NVIDIA's TDT 0.6B v3 through onnx-asr, int8, on the processor) costs what the sound lasts, not a window: a 7 s phrase in 0.3 s on the i9, Russian as good as turbo on the card in a test on a LibriVox reading; it dictates in its 25 languages. devices and features: where and for what a model is used. metal: Whisper turbo on a Mac's graphics (Apple silicon) through mlx-whisper, its MLX copy (mlx: repo and size, its weights.safetensors 1.61 GB); measured on an M1 with 8 GB on 2026-11-06, fp16: rtf 0.25 on a 118 s call warm (38 s its first run; the 4-bit copy no quicker and fewer words), a 6-7 s phrase 4-6 s (the language read in a 30 s window of its own, about 2 s, then greedy decoding; slower on a phrase it hears badly, as it falls back to higher temperatures), so Parakeet on the processor dictates sooner there.",
    speakers: {
      cpu: {
        rtf: 0.8
      },
      cuda: {
        rtf: 0.03
      }
    },
    models: [
      {
        name: "tiny",
        label: "Whisper tiny",
        about: "fastest, rough",
        backend: "whisper",
        repo: "Systran/faster-whisper-tiny",
        bytes: 77e6,
        rank: 1,
        languages: "all",
        cpu: {
          phrase: 0.25,
          rtf: 0.05
        },
        cuda: {
          phrase: 0.1,
          rtf: 0.02
        },
        ramMb: 300,
        vramMb: {
          float16: 400,
          int8_float16: 300
        },
        devices: [
          "cpu",
          "cuda"
        ],
        features: [
          "dictation",
          "transcripts"
        ]
      },
      {
        name: "base",
        label: "Whisper base",
        about: "fast, fair",
        backend: "whisper",
        repo: "Systran/faster-whisper-base",
        bytes: 147e6,
        rank: 2,
        languages: "all",
        cpu: {
          phrase: 0.45,
          rtf: 0.09
        },
        cuda: {
          phrase: 0.12,
          rtf: 0.03
        },
        ramMb: 450,
        vramMb: {
          float16: 500,
          int8_float16: 400
        },
        devices: [
          "cpu",
          "cuda"
        ],
        features: [
          "dictation",
          "transcripts"
        ]
      },
      {
        name: "small",
        label: "Whisper small",
        about: "good",
        backend: "whisper",
        repo: "Systran/faster-whisper-small",
        bytes: 486e6,
        rank: 3,
        languages: "all",
        cpu: {
          phrase: 1.4,
          rtf: 0.2
        },
        cuda: {
          phrase: 0.22,
          rtf: 0.055
        },
        ramMb: 900,
        vramMb: {
          float16: 1e3,
          int8_float16: 700
        },
        devices: [
          "cpu",
          "cuda"
        ],
        features: [
          "dictation",
          "transcripts"
        ]
      },
      {
        name: "large-v3-turbo",
        label: "Whisper turbo",
        about: "very good",
        backend: "whisper",
        repo: "mobiuslabsgmbh/faster-whisper-large-v3-turbo",
        bytes: 162e7,
        rank: 5,
        languages: "all",
        cpu: {
          phrase: 4.5,
          rtf: 0.25
        },
        cuda: {
          phrase: 0.26,
          rtf: 0.025
        },
        ramMb: 2e3,
        vramMb: {
          float16: 2600,
          int8_float16: 1600
        },
        devices: [
          "cpu",
          "cuda",
          "metal"
        ],
        features: [
          "dictation",
          "transcripts"
        ],
        mlx: {
          repo: "mlx-community/whisper-large-v3-turbo",
          bytes: 1613977612
        },
        metal: {
          phrase: 4.5,
          rtf: 0.25
        }
      },
      {
        name: "large-v3",
        label: "Whisper large",
        about: "the most accurate, slow",
        backend: "whisper",
        repo: "Systran/faster-whisper-large-v3",
        bytes: 309e7,
        rank: 6,
        languages: "all",
        cpu: {
          phrase: 9,
          rtf: 0.8
        },
        cuda: {
          phrase: 0.5,
          rtf: 0.06
        },
        ramMb: 3600,
        vramMb: {
          float16: 4600,
          int8_float16: 2700
        },
        devices: [
          "cpu",
          "cuda"
        ],
        features: [
          "dictation",
          "transcripts"
        ]
      },
      {
        name: "parakeet-tdt-0.6b-v3",
        label: "Parakeet",
        about: "very good and quick \xB7 25 European languages",
        backend: "parakeet",
        repo: "istupakov/parakeet-tdt-0.6b-v3-onnx",
        onnx: "nemo-parakeet-tdt-0.6b-v3",
        bytes: 6705e5,
        rank: 5,
        languages: [
          "bg",
          "hr",
          "cs",
          "da",
          "nl",
          "en",
          "et",
          "fi",
          "fr",
          "de",
          "el",
          "hu",
          "it",
          "lv",
          "lt",
          "mt",
          "pl",
          "pt",
          "ro",
          "sk",
          "sl",
          "es",
          "sv",
          "ru",
          "uk"
        ],
        devices: [
          "cpu"
        ],
        features: [
          "dictation"
        ],
        cpu: {
          phrase: 0.3,
          rtf: 0.035
        },
        cuda: {
          phrase: 0.3,
          rtf: 0.035
        },
        ramMb: 1200,
        vramMb: {
          float16: 0,
          int8_float16: 0
        }
      }
    ]
  };

  // src/speechplan.ts
  var MODELS = models_default.models;
  var SPEAKERS = models_default.speakers;
  function seconds(s) {
    return t("speech.sec", { n: s < 10 ? numberText(Math.round(s * 10) / 10, 1) : Math.round(s) });
  }
  function minutes(m) {
    const r = Math.max(1, Math.round(m));
    if (r < 60) return t("speech.min", { n: r });
    return r % 60 ? t("speech.hMin", { h: Math.floor(r / 60), m: r % 60 }) : t("speech.h", { h: Math.floor(r / 60) });
  }
  function estimateText(feature, c) {
    return feature === "dictation" ? t("speech.perPhrase", { time: seconds(c.estimate) }) : t("speech.perHour", { time: minutes(c.estimate) });
  }

  // src/setup.ts
  var VOICE_CORES = 4;
  var DICTIONARY_MB = 5;
  function recommend(v) {
    const s = v.speech;
    const d = s.device;
    const plan = s.plan;
    const cyrillic = scriptFor(v.settings.native) === "Cyrillic";
    const weak = d.cpu.cores < VOICE_CORES;
    const chosen = plan.transcripts.chosen;
    const hourCpu = minutes(chosen.estimate);
    const rough = chosen.model === "tiny" || chosen.model === "base";
    return {
      voice: weak ? { on: false, why: t("setup.why.voiceWeak") } : { on: true, why: t("setup.why.voice") },
      autoFix: cyrillic ? { on: true, why: t("setup.why.autoFix", { lang: languageName(v.settings.native) }) } : { on: false, why: t("setup.why.autoFixLatin") },
      gpu: plan.offers.gpu ? { on: true, why: t("setup.why.gpu", { card: seconds(s.firstModel.cuda.phrase), cpu: seconds(s.firstModel.cpu.phrase) }) } : { on: false, why: d.at ? t("setup.why.noGpu") : t("setup.lookingCard") },
      dictate: { on: true, why: t("setup.why.dictate", { model: s.firstModel.cpu.model, time: seconds(s.firstModel.cpu.phrase) }) },
      transcribe: chosen.fits && !rough ? { on: true, why: t(plan.offers.gpu ? "setup.why.transcribeCard" : "setup.why.transcribe", { model: chosen.label, time: hourCpu }) } : { on: false, why: t(rough ? "setup.why.transcribeRough" : "setup.why.transcribeSlow", { model: chosen.label, time: hourCpu }) },
      speakers: plan.offers.speakersGpu && plan.speakers.cuda !== void 0 ? { on: true, why: t("setup.why.speakers", { time: minutes(plan.speakers.cuda) }) } : { on: false, why: t("setup.why.speakersSlow", { time: minutes(plan.speakers.cpu) }) },
      startWithWindows: { on: true, why: t("setup.why.startWithWindows") }
    };
  }
  function recommendedChoice(v) {
    const r = recommend(v);
    return {
      voice: r.voice.on ? "natural" : "windows",
      autoFix: r.autoFix.on,
      layoutBadge: false,
      gpu: r.gpu.on,
      dictate: r.dictate.on,
      transcribe: r.transcribe.on,
      speakers: r.speakers.on && r.transcribe.on,
      speakersOn: v.speech.plan.speakers.advised,
      startWithWindows: true,
      test: true
    };
  }
  var speechNeeded = (c) => c.dictate || c.transcribe;
  function speakersWhere(c, v) {
    return c.speakersOn === "cuda" && c.gpu && v.speech.pack.nvidia && v.speech.plan.offers.speakersGpu ? "cuda" : "cpu";
  }
  function cost(c, v) {
    const s = v.speech;
    const items = [];
    let disk = 0;
    const tr = v.translatorState;
    if (tr.status !== "unsupported") {
      const mb = tr.status === "ready" ? 0 : tr.size;
      const pair = t("lang.pairEnglish", { lang: languageName(v.settings.native) });
      items.push({ key: "translator", label: t("setup.item.translator", { pair }), note: mb ? t("setup.item.translatorNote") : t("setup.hereAlready"), mb });
      disk += mb;
    }
    const dict = v.dictionary.status;
    if (dict !== "none") {
      const mb = dict === "ready" ? 0 : DICTIONARY_MB;
      items.push({ key: "dictionary", label: t("setup.item.dictionary"), note: mb ? t("setup.item.dictionaryNote") : t("setup.hereAlready"), mb });
      disk += mb;
    }
    if (c.voice === "natural") {
      const here = v.natural.status === "ready";
      items.push({ key: "voice", label: t("setup.item.voice"), note: here ? t("setup.hereAlready") : t("setup.item.voiceNote"), mb: here ? 0 : v.natural.size });
      if (!here) disk += v.natural.size;
    }
    const parts = [];
    const models = [];
    if (speechNeeded(c)) {
      const have = new Set(s.pack.parts);
      const wanted = ["core", ...c.gpu && s.pack.nvidia ? ["gpu"] : [], ...c.transcribe && c.speakers ? ["speakers"] : []];
      for (const part of wanted) if (!have.has(part)) parts.push(part);
      const where2 = speakersWhere(c, v);
      const cardInside = where2 === "cuda" && wanted.includes("speakers");
      const size2 = (p, kind) => p === "speakers" ? s.speakers.sizes[where2][kind] : p === "gpu" && cardInside ? 0 : s[kind][p];
      const mb = parts.reduce((n, p) => n + size2(p, "download"), 0);
      const onDisk = parts.reduce((n, p) => n + size2(p, "installed"), 0);
      const names = { core: t("setup.item.core"), gpu: t("setup.item.gpu"), speakers: t("setup.item.speakers") };
      items.push({
        key: "engine",
        label: t("setup.item.engine"),
        note: parts.length ? t("setup.item.engineNote", { parts: parts.map((p) => names[p]).join(", "), size: t("size.mb", { n: Math.round(onDisk) }) }) : t("setup.hereAlready"),
        mb
      });
      disk += onDisk;
      const downloaded = new Set(s.health?.downloaded ?? s.plan.dictation.choices.filter((x) => x.downloaded).map((x) => x.model));
      const want = [...c.dictate ? [s.plan.dictation.chosen] : [], ...c.transcribe ? [s.plan.transcripts.chosen] : []];
      for (const m of want) {
        if (models.includes(m.model)) continue;
        models.push(m.model);
        const here = downloaded.has(m.model) || m.downloaded;
        items.push({ key: `model:${m.model}`, label: m.label, note: here ? t("setup.hereAlready") : m.about, mb: here ? 0 : m.mb });
        if (!here) disk += m.mb;
      }
    }
    const download = items.reduce((n, i) => n + i.mb, 0);
    const free = s.disk.freeMb;
    return { items, download, disk, parts, models: models.filter((m) => !(s.health?.downloaded ?? []).includes(m)), fits: free <= 0 || free >= disk * 1.1 };
  }
  var placeName = (on) => t(on === "cuda" ? "busy.card" : "busy.processor");
  function recommendedModels(v) {
    const s = v.settings;
    const sp = v.speech;
    const r = recommend(v);
    const patch2 = {};
    const changes = [];
    const parts = [];
    const change = (what, from, to, mb = 0) => changes.push({ what, from, to, mb });
    const translate = t("kind.translate");
    const level = translationAdvice(sp.device).advised;
    const model = level === "fast" ? s.model : level;
    if (level !== s.translationLevel) patch2.translationLevel = level, change(translate, levelName(s.translationLevel), levelName(level));
    if (model !== s.model) patch2.model = model, change(t("rec.check"), levelName(s.model), levelName(model));
    const fetchModel = level !== "fast" && patch2.translationLevel !== void 0 || patch2.model !== void 0 ? v.models[model].status !== "ready" && v.models[model].status !== "downloading" : false;
    const named = changes.find((c) => c.to === levelName(model));
    if (fetchModel && named) named.mb = v.models[model].size;
    const fast = changes.find((c) => c.what === translate && level === "fast");
    if (fast && v.translation.fast.status !== "ready" && v.translation.fast.status !== "downloading") fast.mb = v.translation.fast.size;
    const ready = v.natural.status === "ready";
    const natural = s.voice === "" ? ready : s.voice.startsWith(NATURAL_PREFIX);
    const windows = v.hostVoices.find((h) => /^en\b/i.test(h.lang))?.name;
    const voiceName = natural ? t("rec.naturalVoice") : s.voice || t("setup.windowsVoice");
    let fetchNatural = false;
    if (r.voice.on && !natural) {
      if (s.voice) patch2.voice = "";
      fetchNatural = !ready && v.natural.status !== "downloading";
      change(t("rec.voice"), voiceName, t("rec.naturalVoice"), fetchNatural ? v.natural.size : 0);
    } else if (!r.voice.on && natural && windows) {
      patch2.voice = windows;
      change(t("rec.voice"), voiceName, windows);
    }
    if (sp.pack.parts.includes("core")) {
      const features = [
        ["dictationModel", t("rec.dictate"), sp.plan.dictation],
        ["transcriptsModel", t("rec.transcribe"), sp.plan.transcripts]
      ];
      for (const [key, what, plan] of features) if (s[key]) patch2[key] = "", change(what, plan.chosen.label, t("rec.automatic"));
      if (s.speechPrefer !== "accuracy") patch2.speechPrefer = "accuracy", change(t("rec.speechModels"), t("rec.speed"), t("rec.accuracy"));
      if (r.gpu.on && sp.pack.nvidia && !sp.pack.parts.includes("gpu")) parts.push("gpu"), change(t("rec.dictateTranscribe"), placeName("cpu"), placeName("cuda"), sp.download.gpu);
      if (s.speakersDevice !== "auto") {
        patch2.speakersDevice = "auto";
        const now = sp.plan.offers.speakersGpu && s.speakersDevice !== "cpu" ? "cuda" : "cpu";
        const then = sp.plan.offers.speakersGpu ? "cuda" : "cpu";
        const moving = sp.pack.parts.includes("speakers") && (sp.pack.speakersOn ?? "cpu") !== then;
        if (moving) parts.push("speakers");
        if (now !== then) change(t("setup.speakers"), placeName(now), placeName(then), moving ? sp.speakers.sizes[then].download : 0);
      }
    }
    return { patch: patch2, changes, download: changes.reduce((n, c) => n + c.mb, 0), model: fetchModel, natural: fetchNatural, parts };
  }

  // src/webview/speech.ts
  var SpeechError = class extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  };
  async function api(method, route, body) {
    const r = await window.tutorHost.call({ call: "speech", method, route, body });
    if (!r.ok) throw new SpeechError(r.error, r.status);
    return r.data;
  }
  var problem = (error) => error instanceof Error ? error.message : String(error);
  var fileName = (path) => path.split(/[\\/]/).pop() ?? path;
  var redraw = () => {
  };
  function onRedraw(fn) {
    redraw = fn;
  }
  var redrawPage = () => redraw();
  function clock(seconds2) {
    const s = Math.max(0, Math.floor(seconds2));
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const ss = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
  }
  function minutesPerHour(v) {
    return Math.max(1, Math.round(v.speech.plan.transcripts.chosen.estimate));
  }
  function length(seconds2) {
    if (seconds2 < 60) return t("speech.sec", { n: Math.round(seconds2) });
    const minutes2 = Math.round(seconds2 / 60);
    return minutes2 >= 60 ? t("speech.hMin", { h: Math.floor(minutes2 / 60), m: minutes2 % 60 }) : t("speech.min", { n: minutes2 });
  }
  var BASIS_KEYS = { measured: "speech.basisMeasured", scaled: "speech.basisScaled", guess: "speech.basisGuess" };
  var ABOUT = {
    tiny: "speech.aboutTiny",
    base: "speech.aboutBase",
    small: "speech.aboutSmall",
    "large-v3-turbo": "speech.aboutTurbo",
    "large-v3": "speech.aboutLarge",
    "parakeet-tdt-0.6b-v3": "speech.aboutParakeet"
  };
  var aboutOf = (c) => ABOUT[c.model] ? t(ABOUT[c.model]) : c.about;
  var WHY = {
    "too big for this graphics card": "speech.whyTooBig",
    "needs more memory than this computer has": "speech.whyMemory",
    "not for your language": "speech.whyLanguage",
    "not for every language you use": "speech.whyLanguages"
  };
  var whyOf = (c) => WHY[c.why] ? t(WHY[c.why]) : c.why;
  function phrase(text, nodes) {
    return text.split(/(\{\w+\})/).filter(Boolean).map((part) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      return name && name in nodes ? nodes[name] : part;
    });
  }
  var toasts = el("div", { class: "toasts", role: "status" });
  document.body.append(toasts);
  function toast(text, action, fault2 = false) {
    const node = el(
      "div",
      { class: fault2 ? "toast bad" : "toast" },
      el("span", {}, text),
      action ? el("button", { class: "link", onclick: () => (action.run(), node.remove()) }, action.label) : null
    );
    toasts.append(node);
    window.setTimeout(() => node.remove(), action ? 7e3 : 3500);
  }
  var fault = (error) => toast(problem(error), void 0, true);
  var showFile = (path) => ({ label: t("speech.show"), run: () => post({ type: "showInFolder", path }) });
  var engine;
  var asking = false;
  function engineSettings(v) {
    if (v.speech.service !== "ready") return void 0;
    if (!engine && !asking) {
      asking = true;
      api("GET", "/settings").then(
        (s) => {
          engine = s;
          asking = false;
          redraw();
        },
        () => asking = false
      );
    }
    return engine;
  }
  function forgetEngine() {
    engine = void 0;
  }
  async function saveEngine(changes) {
    try {
      engine = await api("PUT", "/settings", changes);
      redraw();
      return true;
    } catch (error) {
      fault(error);
      return false;
    }
  }
  async function pickKb() {
    const folder = await window.tutorHost.call({ call: "pickFolder", title: t("speech.kbFolder"), current: engine?.kbDir ?? "" });
    if (folder && await saveEngine({ kbDir: folder })) toast(t("speech.kbSet", { folder }));
  }
  var installed = (v) => v.speech.pack.parts.includes("core");
  var hasPart = (v, part) => v.speech.pack.parts.includes(part);
  var running = (v) => installed(v) && v.speech.service === "ready";
  var withGpu = true;
  function packWork(v) {
    const p = v.speech.pack;
    if (p.status === "removing") return row(t("speech.removing"), [], null);
    if (p.status !== "installing") return void 0;
    if (p.installing && p.installing.length < p.parts.length) return row(t("speech.removingPart"), [t("speech.backSoon"), bar(p.progress ?? 0)], el("span", { class: "pct" }, `${Math.round((p.progress ?? 0) * 100)}%`));
    const what = p.step === "tool" ? t("speech.stepTool") : t("speech.stepPackages");
    const pct2 = Math.round((p.progress ?? 0) * 100);
    const parts = (p.installing ?? []).filter((x) => !p.parts.includes(x));
    const name = parts.includes("speakers") && p.parts.includes("core") ? t("speech.dlSpeakers") : t("speech.dlEngine");
    return row(name, [what, bar(p.progress ?? 0)], el("span", { class: "pct" }, `${pct2}%`));
  }
  function engineRows(v, feature) {
    const s = v.speech;
    const work = packWork(v);
    if (work && !installed(v)) return [work];
    if (!installed(v)) {
      const gpu = s.pack.nvidia && withGpu;
      const mb = s.download.core + (gpu ? s.download.gpu : 0);
      const first = gpu ? s.firstModel.cuda : s.firstModel.cpu;
      const keeps = s.installed.core + (gpu ? s.installed.gpu : 0) + first.mb;
      const needs = Math.round((keeps + mb) * 1.1);
      const short = s.disk.freeMb > 0 && s.disk.freeMb < needs;
      const go2 = () => post({ type: "installSpeech", parts: gpu ? ["core", "gpu"] : ["core"] });
      const failed = s.pack.status === "failed";
      const card2 = nvidiaCard(s.device);
      const download = btn(failed ? t("common.tryAgain") : t("speech.download"), go2, "primary");
      download.disabled = short;
      return [
        row(
          needsEngine(feature),
          [
            failed ? bad(t("speech.dlStopped", { why: s.pack.message ?? t("speech.unknownError") })) : t("speech.dlOffer", { size: size(mb), disk: size(keeps), model: first.model }),
            short ? bad(t("speech.needsFree", { need: size(needs), drive: s.disk.drive, free: size(s.disk.freeMb) })) : s.disk.freeMb > 0 ? t("speech.freeOn", { free: size(s.disk.freeMb), drive: s.disk.drive }) : null
          ],
          download
        ),
        s.pack.nvidia ? row(
          t("speech.useGpu"),
          [t("speech.gpuMore", { size: size(s.download.gpu), gpu: seconds(s.firstModel.cuda.phrase), cpu: seconds(s.firstModel.cpu.phrase), card: card2 ? cardText(card2) : "NVIDIA" })],
          toggleKnob(withGpu, (on) => (withGpu = on, redraw()), t("speech.useGpu"))
        ) : null
      ].filter((n) => n !== null);
    }
    if (work) return [work];
    if (s.service === "starting" || s.service === "off") return [row(t("speech.starting"), [], null)];
    if (s.service === "down") return [row(t("speech.notRunning"), [bad(s.trouble ?? t("speech.itStopped"))], linkBtn(t("speech.restart"), () => post({ type: "restartSpeech" })))];
    return [];
  }
  function needsEngine(feature) {
    if (feature === "Dictate") return t("speech.needsDictate");
    if (feature === "Transcribe") return t("speech.needsTranscribe");
    return t("speech.needs", { feature });
  }
  var size = sizeText;
  var where = (c) => c.device === "cuda" ? t("speech.onCard") : c.device === "metal" ? t("speech.onMetal") : t("speech.onProcessor");
  function liveModel(v, feature) {
    return v.speech.health?.models[feature === "dictation" ? "dictation" : "transcripts"];
  }
  var FEATURES = ["dictation", "transcripts"];
  var pin = (feature, model) => post({ type: "saveSettings", patch: { [feature === "dictation" ? "dictationModel" : "transcriptsModel"]: model } });
  function speechChoiceRows(v, feature) {
    const plan = v.speech.plan;
    const p = plan[feature];
    const other = feature === "dictation" ? "transcripts" : "dictation";
    const spare = plan.device === "cuda" ? plan.engine.cpu : void 0;
    const budget = feature === "dictation" ? t("speech.budgetPhrase", { time: seconds(p.budget) }) : t("speech.budgetHour", { time: minutes(p.budget) });
    const live = (name) => [liveModel(v, "dictation"), liveModel(v, "transcripts")].find((m) => m?.name === name && m.state === "downloading");
    const out = [
      radioRow(
        el("span", {}, t("speech.automatic"), recommended()),
        [
          t("speech.autoNote", { budget }),
          p.pinned ? null : t("speech.usesNow", { model: p.chosen.label }),
          // Dictation leaves the card to the person's programs (speechplan.ts forDevice).
          feature === "dictation" && plan.device === "cuda" && (p.chosen.device === "cpu" || p.better?.device === "cpu") ? p.chosen.device === "cpu" ? t("speech.autoCpu") : t("speech.autoMoves", { model: p.better?.label ?? "" }) : null
        ],
        !p.pinned,
        () => pin(feature, "")
      )
    ];
    for (const c of p.choices) {
      const on = p.pinned && p.chosen.model === c.model;
      const here = p.chosen.model === c.model;
      const shared = plan[other].chosen.model === c.model;
      const backup = spare && !here && !shared ? FEATURES.filter((f) => spare[f]?.model === c.model) : [];
      const loading = live(c.model);
      const notes = c.why ? [`${aboutOf(c)} \xB7 ${whyOf(c)}`] : [
        [estimateText(feature, c), where(c), t(BASIS_KEYS[c.basis]), on && !c.fits ? t("speech.slower") : null].filter(Boolean).join(" \xB7 "),
        `${aboutOf(c)} \xB7 ${c.downloaded ? t("speech.sizeHere", { size: size(c.mb) }) : t("speech.sizePick", { size: size(c.mb) })}`,
        here && !p.pinned ? t("speech.autoUses") : null,
        shared ? t(other === "dictation" ? "speech.sharedDictate" : "speech.sharedTranscribe") : null,
        loading ? bar(loading.progress ?? 0) : null
      ];
      if (!here && !shared && c.downloaded)
        notes.push(
          backup.length ? t(backup.length > 1 ? "speech.keptBoth" : backup[0] === "dictation" ? "speech.keptDictate" : "speech.keptTranscribe") : t("speech.notUsedNow")
        );
      const pick = c.why ? void 0 : () => {
        if (!c.downloaded) post({ type: "downloadSpeechModel", model: c.model });
        pin(feature, c.model);
      };
      const remove2 = c.downloaded && !here && !shared && !backup.length && !loading ? ib("x", t("speech.removeModel", { model: c.label, size: size(c.mb) }), () => post({ type: "removeStored", id: "speechModel", item: c.model })) : null;
      const node = radioRow(c.label, notes, on, pick, loading ? el("span", { class: "pct" }, `${Math.round((loading.progress ?? 0) * 100)}%`) : null, remove2);
      if (c.why) node.classList.add("dim");
      out.push(node);
    }
    return out;
  }
  function preferRow(v) {
    return row(
      t("speech.prefers"),
      [v.settings.speechPrefer === "speed" ? t("speech.preferSpeedNote") : t("speech.preferAccNote")],
      seg(
        v.settings.speechPrefer,
        [
          ["accuracy", t("speech.accuracy")],
          ["speed", t("speech.speed")]
        ],
        (speechPrefer) => post({ type: "saveSettings", patch: { speechPrefer } })
      )
    );
  }
  function gpuRow(v) {
    const p = v.speech.pack;
    if (!p.nvidia || !installed(v)) return null;
    if (hasPart(v, "gpu")) return row(t("speech.gpuTitle"), [el("small", { class: "ok" }, t("speech.installed")), cardNote(v)]);
    return row(
      t("speech.gpuTitle"),
      [t("speech.gpuOffer", { size: size(v.speech.download.gpu) }), cardNote(v)],
      Object.assign(btn(t("speech.add"), () => post({ type: "installSpeech", parts: ["gpu"] })), { disabled: p.status !== "ready" })
    );
  }
  function testWork(v) {
    const c = v.speech.health?.calibration;
    if (!c || c.state !== "running" && c.state !== "waiting") return null;
    const share = c.total ? c.done / c.total : 0;
    const what = c.state === "waiting" ? t("speech.testWaits") : t("speech.testStep", { model: c.current || t("speech.testStarting"), n: Math.min(c.total, c.done + 1), total: c.total });
    return row(t("speech.testing"), [what, bar(share)], el("span", { class: "pct" }, `${Math.round(share * 100)}%`));
  }
  function testOffer(v) {
    const work = testWork(v);
    if (work) return work;
    const test = v.speech.test;
    if (!test.offer) return null;
    return el(
      "div",
      { class: "offer" },
      icon("dashboard"),
      el(
        "div",
        { class: "ot" },
        el("b", {}, t("speech.testAsk")),
        el("small", {}, test.runs > 1 ? t("speech.testNoteMany") : t("speech.testNoteOne")),
        el("span", { class: "acts" }, btn(t("speech.testRun"), () => post({ type: "testSpeech" }), "primary"), linkBtn(t("common.notNow"), () => post({ type: "declineSpeechTest" })))
      )
    );
  }
  function computerRows(v) {
    const d = v.speech.device;
    const card2 = mainCard(d);
    const cpu = [shortCpu(d.cpu.name), t("speech.cores", { n: d.cpu.cores }), t("size.gb", { n: d.ramGb }), d.laptop ? t("speech.laptop") : null].filter(Boolean).join(" \xB7 ");
    const cards = card2 ? card2.vendor === "nvidia" ? cardText(card2) : cardNote(v) : d.at ? t("speech.noCard") : t("speech.lookingCard");
    const plan = v.speech.plan;
    const tested = plan.measured ? t("speech.measured") : running(v) ? t("speech.guesses") : t("speech.testedLater");
    const work = testWork(v);
    return [
      row(
        cpu,
        [cards, tested],
        running(v) && !work ? linkBtn(v.speech.test.agreed && plan.measured ? t("speech.testAgain") : t("speech.test"), () => post({ type: "testSpeech" }), v.speech.test.runs === 0 && !plan.dictation.choices.some((c) => c.downloaded)) : null
      ),
      ...work ? [work] : [],
      row(t("speech.rightNow"), [heldNow(v)])
    ];
  }
  function heldNow(v) {
    const card2 = [];
    const processor = [];
    const l = v.llmLoaded;
    if (l) {
      const mb = v.modelSpeed[l.model]?.card;
      (l.onCard ? card2 : processor).push(`${levelName(l.model)}${l.onCard && mb ? ` (${size(mb)})` : ""}`);
    }
    for (const m of v.speech.health?.loaded ?? []) {
      const name = m.model === "speakers" ? t("speech.whoSpoke") : MODELS.find((c) => c.name === m.model)?.label ?? m.model;
      (m.device === "cuda" || m.device === "metal" ? card2 : processor).push(name);
    }
    if (!card2.length && !processor.length) return t("speech.nothingLoaded");
    return [
      card2.length ? t("speech.heldCard", { list: card2.join(", ") }) : t("speech.nothingCard"),
      processor.length ? t("speech.heldCpu", { list: processor.join(", ") }) : null,
      card2.length ? t("speech.letGo") : null
    ].filter(Boolean).join(" \xB7 ");
  }
  function cardNote(v) {
    const s = v.speech;
    const card2 = mainCard(s.device);
    const gpuPart = hasPart(v, "gpu");
    if (s.plan.transcripts.chosen.device === "metal" || s.plan.dictation.chosen.device === "metal") return t("speech.cardMetal", { name: card2 ? cardText(card2) : "Apple" });
    if (!card2) return s.device.at ? t("speech.cardNone") : t("speech.looking");
    const name = cardText(card2);
    if (card2.vendor !== "nvidia") return t("speech.cardNotNvidia", { name });
    if (!s.pack.nvidia && !gpuPart) return t("speech.cardTooSmall", { name });
    if (!gpuPart) return t("speech.cardAddPart", { name });
    if (s.health?.fallback) return t("speech.cardFallback", { name });
    if (s.plan.device === "cpu") return t("speech.cardCpuPlan", { name });
    return t("speech.cardOn", { name });
  }
  var HF = {
    join: "https://huggingface.co/join",
    model: "https://huggingface.co/pyannote/speaker-diarization-community-1",
    tokens: "https://huggingface.co/settings/tokens"
  };
  var DIARIZATION = {
    "needs-token": ["", t("speech.dzNeedsToken")],
    checking: ["busy", t("speech.dzChecking")],
    downloading: ["busy", t("speech.dzDownloading")],
    "bad-token": ["bad", t("speech.dzBadToken")],
    "no-access": ["bad", t("speech.dzNoAccess")],
    failed: ["bad", t("speech.dzFailed")],
    missing: ["", t("speech.dzMissing")],
    ready: ["ok", t("speech.dzReady")]
  };
  var replacing = false;
  var draft = "";
  var expected;
  function diarizationOf(v) {
    const real = v.speech.health?.diarization ?? "needs-token";
    if (expected && Date.now() < expected.until && (real === "needs-token" || real === "missing" || real === "bad-token" || real === "no-access" || real === "failed")) return expected.state;
    expected = void 0;
    return real;
  }
  var follow = (state) => {
    expected = { state, until: Date.now() + 3e3 };
    redraw();
  };
  function speakerRows(v) {
    const s = v.speech;
    const out = [...speakersDeviceRows(v), ...speakersInstallRows(v)];
    if (!hasPart(v, "speakers")) return out;
    if (!running(v)) return [...out, card("lock", t("speech.voicesModel"), [t("speech.voicesLater")], null)];
    return [...out, grp(t("speech.voicesModel")), ...keyRows(v)];
  }
  function speakersDeviceRows(v) {
    const s = v.speech;
    const plan = s.plan.speakers;
    const pick = (on) => post({ type: "saveSettings", patch: { speakersDevice: on === plan.advised ? "auto" : on } });
    const option = (on) => {
      const sz = s.speakers.sizes[on];
      const time = plan[on];
      const chosen = s.speakers.on === on;
      const node = card(
        on === "cuda" ? "monitor" : "cpu",
        on === "cuda" ? t("speech.card") : t("speech.processor"),
        [
          time === void 0 ? null : [t("speech.voicesHour", { time: minutes(time) }), plan.advised === on ? t("speech.advised") : null].filter(Boolean).join(" \xB7 "),
          t(on === "cuda" ? "speech.torchCard" : "speech.torchCpu", { download: size(sz.download), disk: size(sz.installed) })
        ],
        chosen ? chip(t("speech.chosen"), "lit") : linkBtn(t("speech.use"), () => pick(on))
      );
      if (chosen) node.classList.add("picked");
      return node;
    };
    const rows = [aside("info", t("speech.speakersInfo")), grp(t("speech.runsOn"))];
    if (s.plan.offers.speakersGpu && plan.cuda !== void 0) rows.push(option("cuda"));
    rows.push(option("cpu"));
    return rows;
  }
  function speakersInstallRows(v) {
    const s = v.speech;
    const work = packWork(v);
    if (work) return [work];
    const on = s.speakers.on;
    const sz = s.speakers.sizes[on];
    const parts = on === "cuda" && !hasPart(v, "gpu") ? ["gpu", "speakers"] : ["speakers"];
    const install = (label) => btn(label, () => post({ type: "installSpeech", parts }), "primary");
    const model = s.speakers.model ? t("speech.voicesHere") : t("speech.voicesKey");
    const room = s.disk.freeMb > 0 && s.disk.freeMb < sz.installed * 1.1 ? bad(t("speech.needsFreeAbout", { need: size(sz.installed * 1.1), drive: s.disk.drive, free: size(s.disk.freeMb) })) : null;
    const onCard = on === "cuda";
    if (!hasPart(v, "speakers")) {
      const failed = s.pack.status === "failed";
      return [
        grp(t("speech.downloadGrp")),
        card(
          "download",
          t(onCard ? "speech.whoOnCard" : "speech.whoOnCpu"),
          [t("speech.dlOnce", { size: size(sz.download), model }), failed ? bad(t("speech.dlStopped", { why: s.pack.message ?? t("speech.unknownError") })) : room],
          install(failed ? t("common.tryAgain") : t("speech.download"))
        )
      ];
    }
    const there = s.pack.speakersOn ?? "cpu";
    if (there !== on) {
      return [grp(t("speech.installed")), card("rotate-cw", t(there === "cuda" ? "speech.nowCard" : "speech.nowCpu"), [t(onCard ? "speech.switchCard" : "speech.switchCpu", { size: size(sz.download) }), room], install(t("speech.switch")))];
    }
    return [
      grp(t("speech.installed")),
      card("circle-check", t(onCard ? "speech.installedCard" : "speech.installedCpu"), [el("small", { class: "ok" }, t("speech.voicesHour", { time: minutes(s.plan.speakers[on] ?? s.plan.speakers.cpu) }))], null)
    ];
  }
  function keyRows(v) {
    const s = v.speech;
    const state = diarizationOf(v);
    const [kind, words] = DIARIZATION[state];
    const message = state === "failed" && s.health?.diarizationMessage ? `${words}: ${s.health.diarizationMessage}` : words;
    const note = el("small", { class: kind ? `kstate ${kind}` : "kstate" }, kind === "busy" ? el("i", { class: "spin" }) : kind === "ok" ? icon("check") : null, message);
    const again = (label) => linkBtn(label, async () => {
      try {
        await api("POST", "/diarization/setup");
        follow("checking");
      } catch (error) {
        fault(error);
      }
    });
    const field = el("input", {
      type: "password",
      class: "field wide",
      placeholder: "hf_\u2026",
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": t("speech.hfKey"),
      oninput: (event) => draft = event.target.value
    });
    field.value = draft;
    const saveKey2 = async () => {
      const value = field.value.trim();
      if (!value) return field.focus();
      field.blur();
      draft = "";
      replacing = false;
      if (await saveEngine({ hfToken: value })) follow("checking");
    };
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void saveKey2();
      if (event.key === "Escape" && replacing) event.preventDefault(), replacing = false, field.blur(), redraw();
    });
    const entry = el("span", { class: "kchg" }, field, btn(t("speech.save"), () => void saveKey2(), "primary"));
    const settled = state === "ready" || state === "missing";
    const control = settled && !replacing ? linkBtn(t("speech.replaceKey"), () => {
      replacing = true;
      redraw();
    }) : state === "no-access" ? again(t("speech.checkAgain")) : state === "failed" ? again(t("common.tryAgain")) : null;
    if (state === "ready" && !replacing) return [row(t("speech.voicesModel"), [note], null)];
    const out = [row(t("speech.hfKey"), [note], control)];
    const typing = !settled && state !== "checking" && state !== "downloading" || replacing;
    if (typing) {
      out.push(
        el(
          "ol",
          { class: "steps" },
          el("li", {}, link(HF.join, t("speech.step1")), t("speech.step1Rest")),
          // Hugging Face's own words (its form's fields, Access Tokens, Read) stay as its site writes them.
          el("li", {}, ...phrase(t("speech.step2"), { page: link(HF.model, t("speech.step2Page")), use: el("b", {}, "Meeting note taker") })),
          el("li", {}, ...phrase(t("speech.step3"), { tokens: link(HF.tokens, "Access Tokens"), read: el("b", {}, "Read") })),
          el("li", {}, t("speech.step4"), el("span", { class: "kline" }, entry))
        )
      );
    }
    return out;
  }
  function speakersMissing(v, go2) {
    if (!installed(v)) return null;
    const state = v.speech.health?.diarization;
    if (hasPart(v, "speakers") && state !== "needs-token" && state !== "bad-token" && state !== "no-access" && state !== "failed") return null;
    const why = !hasPart(v, "speakers") ? t("speech.missingPart") : t("speech.missingKey");
    return aside("users", why, " ", linkBtn(t("speech.setUp"), go2));
  }

  // src/webview/setup.ts
  var STEPS = [t("setup.step1"), t("setup.step2"), t("setup.step3"), t("setup.step4")];
  var CAPS = [t("setup.cap1"), t("setup.cap2"), t("setup.cap3"), t("setup.cap4")];
  var step = 1;
  var choice;
  var started = false;
  var firstNative = "";
  function resetSetup() {
    step = 1;
    choice = void 0;
    started = false;
    firstNative = "";
  }
  function advised(node, a) {
    if (!a.on) return node;
    const l = node.querySelector(".l");
    const first = l?.querySelector("small");
    const mark2 = recommended();
    if (l) l.insertBefore(mark2, first ?? null);
    return node;
  }
  function setupNodes(v, h) {
    if (!firstNative) firstNative = v.settings.native;
    const c = choice ??= recommendedChoice(v);
    const r = recommend(v);
    const body = step === 1 ? languageStep(v, h) : step === 2 ? computerStep(v, h, c, r) : step === 3 ? needStep(v, h, c, r) : downloadStep(v, h, c);
    const go2 = (to) => {
      step = Math.max(1, Math.min(4, to));
      h.redraw();
    };
    const finish = () => h.save({ setupDone: true, speechTestAgreed: c.test });
    const skip = () => h.save({ setupDone: true });
    const download = () => {
      start(v, h, c);
      started = true;
      go2(4);
    };
    const room = step === 3 ? cost(c, v).fits : true;
    const next = step === 3 ? btn([lucide("download", "s"), t("setup.download")], download, "primary") : step === 4 ? btn(t("setup.finish"), finish, "primary") : btn([t("setup.next"), lucide("chevron-right", "s")], () => go2(step + 1), "primary");
    if (!room) next.disabled = true;
    return [
      el(
        "div",
        { class: "shead" },
        el("div", { class: "sprog" }, ...STEPS.map((_, i) => el("i", { class: i + 1 === step ? "on" : i + 1 < step ? "done" : "" })), el("span", {}, t("setup.stepOf", { step, total: STEPS.length }))),
        el("div", { class: "stitle-line" }, el("span", { class: "stitle" }, STEPS[step - 1]), el("span", { class: "scap" }, CAPS[step - 1])),
        el("div", { class: "sline" })
      ),
      el("div", { class: "sbody" }, ...body),
      el(
        "div",
        { class: "sfoot" },
        step > 1 && !(step === 4 && started) ? linkBtn(t("setup.back"), () => go2(step - 1)) : null,
        el("span", { class: "gap" }),
        step < 4 ? linkBtn(t("setup.skip"), skip) : null,
        next
      )
    ];
  }
  function languageStep(v, h) {
    const s = v.settings;
    const nameOf = (code) => LANGUAGES.find((l) => l.code === code)?.name ?? code;
    const used = [s.native, "English", ...s.languages.map(nameOf)];
    const rest = LANGUAGES.filter((l) => !used.includes(l.name));
    const own = card(
      "languages",
      t("setup.step1"),
      [t("setup.languageNote")],
      select(
        s.native,
        v.languages.map((l) => [l.name, twoNames(l.native, languageName(l.name))]),
        (native) => {
          choice = void 0;
          h.save({ native });
        }
      )
    );
    if (s.native === firstNative) advised(own, { on: true, why: "" });
    return [
      uiLanguageCard(s.uiLanguage, (uiLanguage2) => h.save({ uiLanguage: uiLanguage2 })),
      grp(t("setup.step1")),
      own,
      s.native === firstNative ? aside("info", t("setup.windowsIn", { lang: languageName(s.native) })) : null,
      grp(t("setup.otherLanguages")),
      card(
        "plus",
        t("setup.addLanguage"),
        [t("setup.addLanguageNote")],
        select("", [["", t("setup.pickLanguage")], ...rest.map((l) => [l.code, twoNames(languageName(l.name), l.native)])], (code) => code && h.save({ languages: [...s.languages, code] }))
      ),
      card("globe", languageName("English"), [t("setup.always")], null),
      ...s.languages.map((code) => card("globe", languageName(nameOf(code)), [], ib("x", t("ui.remove", { item: languageName(nameOf(code)) }), () => h.save({ languages: s.languages.filter((x) => x !== code) }))))
    ].filter((n) => n !== null);
  }
  function computerStep(v, h, c, r) {
    const s = v.speech;
    const d = s.device;
    const looking = d.at === 0;
    const gpu = mainCard(d);
    const spin = () => el("i", { class: "spin" });
    const cardNote2 = looking ? el("small", { class: "kstate busy" }, spin(), t("setup.lookingCard")) : gpu ? cardText(gpu) : t("setup.noCard");
    const onCard = s.plan.offers.gpu && c.gpu;
    const verdict = onCard ? card("sparkles", t("setup.onCard"), [t("setup.onCardNote", { time: seconds(s.firstModel.cuda.phrase), model: s.firstModel.cuda.model })], null) : card("sparkles", t("setup.onCpu"), [t("setup.onCpuNote", { time: seconds(s.firstModel.cpu.phrase), model: s.firstModel.cpu.model, hour: minutes(s.plan.transcripts.chosen.estimate) })], null);
    verdict.classList.add("total");
    return [
      grp(t("setup.hardware")),
      card(
        "cpu",
        t("setup.processor"),
        [
          looking ? el("small", { class: "kstate busy" }, spin(), t("setup.cpuLooking", { cpu: shortCpu(d.cpu.name) })) : t("setup.cpuCores", { cpu: shortCpu(d.cpu.name), n: d.cpu.cores }) + (d.laptop ? ` \xB7 ${t("setup.laptop")}` : "")
        ],
        null
      ),
      card("memory-stick", t("setup.memory"), [t("size.gb", { n: d.ramGb })], null),
      card("monitor", t("setup.graphicsCard"), [cardNote2], null),
      grp(t("setup.means")),
      verdict,
      s.plan.offers.gpu ? advised(
        toggleCard(
          "monitor",
          t("setup.useCard"),
          c.gpu,
          (on) => {
            c.gpu = on;
            h.redraw();
          },
          r.gpu.why
        ),
        r.gpu
      ) : null,
      looking ? aside("info", t("setup.stillLooking")) : null
    ].filter((n) => n !== null);
  }
  function needStep(v, h, c, r) {
    const s = v.speech;
    const tr = v.translatorState;
    const pair = t("lang.pairEnglish", { lang: languageName(v.settings.native) });
    const flip = (key) => (on) => {
      ;
      c[key] = on;
      if (key === "transcribe" && !on) c.speakers = false;
      h.redraw();
    };
    const translatorNote = tr.status === "unsupported" ? t("setup.noTranslator") : tr.status === "ready" ? t("setup.translatorHere", { pair }) : t("setup.translatorOnce", { pair, size: sizeText(tr.size) });
    const dictNote = { ready: t("setup.dictReady"), absent: t("setup.dictOnce"), downloading: t("setup.dictComing"), failed: t("setup.dictOnce"), none: t("setup.dictNone") }[v.dictionary.status];
    const engineMb = s.download.core + (c.gpu && s.pack.nvidia ? s.download.gpu : 0);
    const dictateModel = s.plan.dictation.chosen;
    const transcribeModel = s.plan.transcripts.chosen;
    const all = cost(c, v);
    const total = card(
      "hard-drive",
      t("setup.toDownload", { size: sizeText(all.download) }),
      [
        `${t("setup.onDisk", { size: sizeText(all.disk) })} \xB7 ${s.disk.freeMb > 0 ? t("setup.freeOn", { size: sizeText(s.disk.freeMb), drive: s.disk.drive }) : t("setup.freeUnknown")}`,
        all.fits ? null : bad(t("setup.noRoom"))
      ],
      null
    );
    total.classList.add("total");
    if (!all.fits) total.classList.add("bad");
    return [
      grp(t("setup.alwaysGroup")),
      card("languages", t("setup.listenTranslate"), [translatorNote, dictNote], el("span", { class: "chip" }, t("setup.alwaysOn"))),
      advised(
        card(
          "volume-2",
          t("setup.voice"),
          [r.voice.why],
          seg(
            c.voice,
            [
              ["natural", v.natural.status === "ready" ? t("setup.naturalHere") : t("setup.naturalSize", { size: sizeText(v.natural.size) })],
              ["windows", t("setup.windowsVoice")]
            ],
            (voice) => {
              c.voice = voice;
              h.redraw();
            }
          )
        ),
        { on: r.voice.on, why: "" }
      ),
      grp(t("setup.keyboard")),
      advised(toggleCard("keyboard", t("tray.autoFix"), c.autoFix, flip("autoFix"), r.autoFix.why), r.autoFix),
      toggleCard("type", t("tray.layoutBadge"), c.layoutBadge, flip("layoutBadge"), t("setup.badgeNote")),
      grp(t("setup.speech")),
      advised(
        toggleCard(
          "mic",
          t("dict.type"),
          c.dictate,
          flip("dictate"),
          t("setup.dictateNote", { why: r.dictate.why, engine: sizeText(engineMb), model: dictateModel.label, size: dictateModel.downloaded ? t("setup.here") : sizeText(dictateModel.mb) })
        ),
        r.dictate
      ),
      advised(
        toggleCard(
          "audio-lines",
          t("setup.transcribe"),
          c.transcribe,
          flip("transcribe"),
          t(c.dictate ? "setup.transcribeNote" : "setup.transcribeNoteEngine", {
            why: r.transcribe.why,
            model: transcribeModel.label,
            size: transcribeModel.downloaded ? t("setup.here") : sizeText(transcribeModel.mb),
            engine: sizeText(engineMb)
          })
        ),
        r.transcribe
      ),
      c.transcribe ? advised(toggleCard("users", t("setup.speakers"), c.speakers, flip("speakers"), `${r.speakers.why} \xB7 ${sizeText(s.speakers.sizes[speakersWhere(c, v)].download)}`), r.speakers) : null,
      c.transcribe && c.speakers ? speakersOnCard(v, h, c) : null,
      grp(t("app.name")),
      advised(toggleCard("power", t("setup.startWithWindows"), c.startWithWindows, flip("startWithWindows"), r.startWithWindows.why), r.startWithWindows),
      grp(t("setup.allOfIt")),
      total,
      aside("info", t("setup.keysLater"))
    ].filter((n) => n !== null);
  }
  function speakersOnCard(v, h, c) {
    const s = v.speech;
    const where2 = speakersWhere(c, v);
    const time = (on) => s.plan.speakers[on];
    const canCard = s.plan.offers.speakersGpu && c.gpu && s.pack.nvidia && time("cuda") !== void 0;
    const note = t("setup.voicesHour", { time: minutes(time(where2) ?? s.plan.speakers.cpu) });
    if (!canCard) return card("cpu", t("setup.runsOnCpu"), [note], null);
    const advice = s.plan.speakers.advised === "cuda" ? t("setup.advisedCard") : t("setup.advisedCpu");
    const node = card(
      "cpu",
      t("setup.runsOn"),
      [note, where2 === s.plan.speakers.advised ? null : advice],
      seg(
        where2,
        [
          ["cuda", `${t("setup.graphicsCard")} \xB7 ${sizeText(s.speakers.sizes.cuda.download)}`],
          ["cpu", `${t("setup.processor")} \xB7 ${sizeText(s.speakers.sizes.cpu.download)}`]
        ],
        (on) => {
          c.speakersOn = on;
          h.redraw();
        }
      )
    );
    return where2 === s.plan.speakers.advised ? advised(node, { on: true, why: "" }) : node;
  }
  function start(v, h, c) {
    const all = cost(c, v);
    h.save({
      voice: "",
      naturalDismissed: c.voice === "windows",
      autoFix: c.autoFix,
      layoutBadge: c.layoutBadge,
      startWithWindows: c.startWithWindows,
      speechTestAgreed: c.test,
      // The advice stays "automatic", so it follows the computer; another choice is kept as made.
      speakersDevice: speakersWhere(c, v) === v.speech.plan.speakers.advised ? "auto" : speakersWhere(c, v)
    });
    const t2 = v.translatorState.status;
    if (t2 === "absent" || t2 === "failed") h.post({ type: "prepareTranslator" });
    const d = v.dictionary.status;
    if (d === "absent" || d === "failed") h.post({ type: "prepareDictionary" });
    if (c.voice === "natural" && (v.natural.status === "absent" || v.natural.status === "failed")) h.post({ type: "downloadNatural" });
    if (c.dictate || c.transcribe) {
      if (all.parts.length === 0 && running(v)) for (const model of all.models) h.post({ type: "downloadSpeechModel", model });
      else if (all.parts.length || all.models.length) h.post({ type: "installSpeech", parts: all.parts.length ? all.parts : ["core"], models: all.models });
    }
  }
  function downloadStep(v, h, c) {
    const all = cost(c, v);
    const rows = all.items.map((item) => itemRow(item, v, h));
    return [
      grp(started ? t("setup.downloading") : t("setup.toDownloadGroup"), all.items.length),
      ...rows,
      grp(t("setup.then")),
      advised(
        toggleCard(
          "play",
          t("setup.test"),
          c.test,
          (on) => {
            c.test = on;
            h.save({ speechTestAgreed: on });
          },
          t("setup.testNote")
        ),
        { on: true, why: "" }
      ),
      aside("info", started ? t("setup.canClose") : t("setup.notStarted"))
    ].filter((n) => n !== null);
  }
  var done = (what) => el("small", { class: "kstate ok" }, lucide("check", "s"), what);
  var waiting = (what) => el("small", {}, what);
  function itemRow(item, v, h) {
    const s = v.speech;
    const icons = { translator: "languages", dictionary: "book-open", voice: "volume-2", engine: "cpu" };
    const icon2 = icons[item.key] ?? "audio-lines";
    const pct2 = (p) => el("span", { class: "pct" }, `${Math.round(p * 100)}%`);
    let note = item.note;
    let control = null;
    if (item.key === "translator") {
      const tr = v.translatorState;
      if (tr.status === "ready") note = done(t("setup.here"));
      else if (tr.status === "downloading") note = bar(tr.progress), control = pct2(tr.progress);
      else if (tr.status === "failed") note = bad(t("talk.downloadFailed")), control = linkBtn(t("common.tryAgain"), () => h.post({ type: "prepareTranslator" }));
      else note = started ? waiting(t("setup.starting")) : item.note;
    } else if (item.key === "dictionary") {
      const d = v.dictionary.status;
      if (d === "ready") note = done(t("setup.here"));
      else if (d === "downloading") note = waiting(t("setup.coming"));
      else if (d === "failed") note = bad(t("talk.downloadFailed")), control = linkBtn(t("common.tryAgain"), () => h.post({ type: "prepareDictionary" }));
      else note = started ? waiting(t("setup.starting")) : item.note;
    } else if (item.key === "voice") {
      const n = v.natural;
      if (n.status === "ready") note = done(t("setup.here"));
      else if (n.status === "downloading") note = bar(n.progress), control = pct2(n.progress);
      else if (n.status === "failed") note = bad(t("talk.downloadFailed")), control = linkBtn(t("common.tryAgain"), () => h.post({ type: "downloadNatural" }));
      else note = started ? waiting(t("setup.starting")) : item.note;
    } else if (item.key === "engine") {
      const p = s.pack;
      if (p.status === "installing") note = el("span", {}, bar(p.progress ?? 0), el("small", {}, p.step === "tool" ? t("setup.pythonManager") : t("setup.packages"))), control = pct2(p.progress ?? 0);
      else if (installed(v) && !item.mb) note = done(t("setup.here"));
      else if (p.status === "failed") note = bad(p.message ?? t("setup.installFailed")), control = linkBtn(t("common.tryAgain"), () => h.post({ type: "installSpeech", parts: cost(choice ?? recommendedChoice(v), v).parts }));
      else note = started ? waiting(t("setup.starting")) : item.note;
    } else {
      const model = item.key.slice("model:".length);
      const live = Object.values(s.health?.models ?? {}).find((m) => m.name === model);
      if (item.mb === 0 || s.health?.downloaded?.includes(model)) note = done(t("setup.here"));
      else if (live?.state === "downloading") note = bar(live.progress ?? 0), control = pct2(live.progress ?? 0);
      else note = started ? waiting(running(v) ? t("setup.next2") : t("setup.afterEngine")) : item.note;
    }
    const row2 = card(icon2, item.label, [note, item.mb ? `${sizeText(item.mb)}` : null], control);
    return row2;
  }

  // src/topics.ts
  var TOPICS = [
    {
      id: "free",
      title: "Free talk",
      role: "This is a free talk about anything.",
      plan: "Follow the learner: their questions come first. Answer them fully, with what you really know, then add a thought of your own or ask about theirs.",
      openers: ["Hi! What would you like to talk about today?", "Hey there! How is your day going so far?"]
    },
    {
      id: "day",
      title: "My day",
      role: "This talk is about the learner's day.",
      plan: "Ask what they did, what is next and how they feel about it, one thing at a time. React to what they tell you, and now and then share a small, funny thing from your own day as a duck.",
      openers: ["So, how was your day? Tell me one thing that happened.", "What have you been up to today?"]
    },
    {
      id: "trip",
      title: "A trip",
      role: "This talk is about a trip the learner took or wants to take.",
      plan: "Ask about the places, the plans, the food and the people. Share what you know about the places they name: what to see, what to eat, what it is like there.",
      openers: ["Tell me about a trip you remember. Where did you go?", "If you could go anywhere next month, where would you go?"]
    },
    {
      id: "cafe",
      title: "At a caf\xE9",
      role: "A role play: you are a friendly barista in a small caf\xE9, and the learner is a customer. Stay in the role to the end.",
      leads: true,
      plan: "Take the order step by step: what they would like, the size or other details, here or to go, anything to eat, then the price and how they pay, and wish them a nice day. If they talk about something else, answer as a barista would and come back to the order.",
      openers: ["Hi, welcome in! What can I get for you today?", "Good morning! Are you having it here or to go?"]
    },
    {
      id: "interview",
      title: "Job interview",
      role: "A role play: you interview the learner for a job they want. Stay in the role to the end: kind, professional, and interested in their answers.",
      leads: true,
      plan: "Ask one question at a time and never ask one twice. Find out which job it is first, if they have not said. Then go through their experience, a strength, a problem they solved, why they want this job, and whether they have questions for you. After about six questions, tell them in two or three sentences how the interview went: what came across well and what to say more about next time. Speak about what they said, never about their grammar.",
      openers: ["Thanks for coming in today. Could you tell me a little about yourself?", "Nice to meet you. What made you apply for this job?"]
    },
    {
      id: "work",
      title: "My work",
      role: "This talk is about the learner's work or studies.",
      plan: "Ask what they do, what they are working on and what is hard about it, one thing at a time. Share what you know about their field, and ask about the details.",
      openers: ["What do you do for work, or what are you studying?", "What are you working on these days?"]
    }
  ];

  // src/version.ts
  function isBeta(version) {
    return version.startsWith("0.");
  }
  function versionText(version) {
    return isBeta(version) ? `${version} ${t("common.beta")}` : version;
  }

  // src/webview/marks.ts
  function withMarks(parts) {
    return parts.flatMap(
      (p, i) => p.kind === "same" ? [document.createTextNode(p.text)] : [el(p.kind, {}, p.text), ...p.kind === "del" && parts[i + 1]?.kind === "ins" ? [document.createTextNode(" ")] : []]
    );
  }

  // src/ask.ts
  var REQUEST_MS = 3 * 6e4;
  var CITE = /\[(\d{1,2})\]/g;
  function cited(text, count) {
    const out = [];
    for (const m of text.matchAll(CITE)) {
      const n = Number(m[1]);
      if (n >= 1 && n <= count && !out.includes(n)) out.push(n);
    }
    return out;
  }

  // src/shots.ts
  var shownShots = (shots = []) => shots.filter((s) => s.manual || s.key).sort((a, b) => a.at - b.at);
  var POINTER = new RegExp(
    "(?<!\\p{L})(?:" + [
      "\u0432\u043E\u0442 (?:\u0442\u0443\u0442|\u0437\u0434\u0435\u0441\u044C|\u0442\u0430\u043A|\u044D\u0442\u043E)",
      "\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435",
      "\u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435",
      "\u0433\u043B\u044F\u043D\u044C\u0442\u0435",
      "\u043A\u0430\u043A (?:\u0432\u0438\u0434\u0438\u0442\u0435|\u0432\u0438\u0434\u043D\u043E)",
      "\u0432\u0438\u0434\u0438\u0442\u0435",
      "\u044F \u0441\u0434\u0435\u043B\u0430\u043B(?:\u0430)? \u0442\u0430\u043A",
      "\u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435",
      "\u043F\u043E\u043A\u0430\u0436\u0443",
      "\u043E\u0441\u044C (?:\u0442\u0443\u0442|\u0434\u0435|\u0442\u0430\u043A|\u0446\u0435)",
      "\u0434\u0438\u0432\u0456\u0442\u044C\u0441\u044F",
      "\u043F\u043E\u0434\u0438\u0432\u0456\u0442\u044C\u0441\u044F",
      "\u044F\u043A (?:\u0431\u0430\u0447\u0438\u0442\u0435|\u0432\u0438\u0434\u043D\u043E)",
      "\u0431\u0430\u0447\u0438\u0442\u0435",
      "\u044F \u0437\u0440\u043E\u0431\u0438\u0432(?:\u043B\u0430)? \u0442\u0430\u043A",
      "\u043D\u0430 \u0435\u043A\u0440\u0430\u043D\u0456",
      "right here",
      "over here",
      "here is",
      "here's",
      "here you (?:can )?see",
      "look at (?:this|that)",
      "look here",
      "as you can see",
      "you can see",
      "on (?:the )?screen",
      "let me show",
      "i'll show",
      "i did it like this"
    ].join("|") + ")(?!\\p{L})",
    "iu"
  );
  var UI_WORDS = new Set(
    "share screen leave end call mute unmute chat participants people recording record meeting view gallery speaker host co-host you me camera video audio settings more reactions apps join start stop raise hand present presenting whiteboard breakout rooms security zoom teams google meet telegram discord slack facetime skype webex microsoft new file edit window help \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u044D\u043A\u0440\u0430\u043D \u044D\u043A\u0440\u0430\u043D\u0430 \u0432\u044B\u0439\u0442\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0437\u0432\u0443\u043A \u043A\u0430\u043C\u0435\u0440\u0430 \u0432\u0438\u0434\u0435\u043E \u0447\u0430\u0442 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u044C \u0432\u0441\u0442\u0440\u0435\u0447\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0435\u0449\u0451 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u0432\u044B \u044F \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0456\u044F \u0435\u043A\u0440\u0430\u043D \u0435\u043A\u0440\u0430\u043D\u0430 \u0432\u0438\u0439\u0442\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0438 \u0437\u0432\u0443\u043A \u043A\u0430\u043C\u0435\u0440\u0430 \u0432\u0456\u0434\u0435\u043E \u0447\u0430\u0442 \u0443\u0447\u0430\u0441\u043D\u0438\u043A\u0438 \u0437\u0430\u043F\u0438\u0441 \u0437\u0443\u0441\u0442\u0440\u0456\u0447 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0449\u0435 \u0440\u0435\u0430\u043A\u0446\u0456\u0457 \u0432\u0438".split(" ")
  );

  // src/summaryflow.ts
  function secondsLeft(part, parts, started2, now) {
    if (part < 1 || part > parts) return null;
    return Math.max(0, Math.round((now - started2) / 1e3 / part * (parts - part)));
  }
  var TOPIC_STAMP = /\[((?:\d+:)?\d{1,2}:\d{2})\]/;
  function topicIn(line) {
    const m = TOPIC_STAMP.exec(line);
    if (!m) return null;
    const at = m[1].split(":").reduce((sum, n) => sum * 60 + Number(n), 0);
    return { before: line.slice(0, m.index), stamp: m[1], at, after: line.slice(m.index + m[0].length) };
  }
  var SHOT_WORD = { en: "screenshot", uk: "\u0437\u043D\u0456\u043C\u043E\u043A", ru: "\u0441\u043D\u0438\u043C\u043E\u043A" };
  var SHOT_STAMP = new RegExp(`\\s*\\((?:${Object.values(SHOT_WORD).join("|")}) ((?:\\d+:)?\\d{1,2}:\\d{2})\\)`);
  function shotIn(line) {
    const m = SHOT_STAMP.exec(line);
    if (!m) return null;
    const at = m[1].split(":").reduce((sum, n) => sum * 60 + Number(n), 0);
    return { text: line.slice(0, m.index) + line.slice(m.index + m[0].length), mark: m[0].trim(), at };
  }

  // src/webview/recorder.ts
  async function microphone(close) {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: close, noiseSuppression: close, autoGainControl: true, channelCount: 1 } });
  }
  var Meter = class {
    context;
    analyser;
    samples;
    constructor(stream) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.samples = new Float32Array(this.analyser.fftSize);
      this.context.createMediaStreamSource(stream).connect(this.analyser);
    }
    /** How loud it is now, 0…1. */
    level() {
      this.analyser.getFloatTimeDomainData(this.samples);
      let sum = 0;
      for (const v of this.samples) sum += v * v;
      return Math.min(1, Math.sqrt(sum / this.samples.length) * 4);
    }
    close() {
      void this.context.close();
    }
  };
  function stopped(recorder) {
    if (!recorder || recorder.state === "inactive") return Promise.resolve();
    return new Promise((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
  }
  var RETRIES = 3;
  var ChunkRecorder = class {
    constructor(call, o) {
      this.call = call;
      this.o = o;
    }
    id;
    startedAt = 0;
    /** Set when a chunk could not be delivered: the recording will be missing a piece. */
    lost = false;
    recorder;
    stream;
    meter;
    seq = 0;
    uploads = Promise.resolve();
    speech(method, route, body) {
      return this.call({ call: "speech", method, route, body });
    }
    /** Asks for the microphone, opens the recording in the engine, starts sending. */
    async start() {
      this.stream = await microphone(this.o.source === "note");
      this.startedAt = Date.now();
      const opened = await this.speech("POST", "/recordings", {
        source: this.o.source,
        title: this.o.title,
        language: this.o.language,
        speakers: this.o.speakers,
        tracks: { main: { startedAt: this.startedAt } }
      });
      if (!opened.ok) {
        this.release();
        throw new Error(opened.error);
      }
      this.id = opened.data.id;
      this.meter = new Meter(this.stream);
      this.recorder = new MediaRecorder(this.stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 48e3 });
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.upload(event.data);
      };
      this.recorder.start(this.o.slice);
    }
    upload(blob) {
      const seq = this.seq++;
      this.uploads = this.uploads.then(async () => {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        for (let attempt = 0; attempt < RETRIES; attempt++) {
          if ((await this.speech("PUT", `/recordings/${this.id}/main/${seq}`, bytes)).ok) return;
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        }
        this.lost = true;
      });
    }
    level() {
      return this.meter?.level() ?? 0;
    }
    get seconds() {
      return this.startedAt ? (Date.now() - this.startedAt) / 1e3 : 0;
    }
    /** Stops, sends what is left, and hands the recording to the engine. Its id. */
    async finish() {
      await stopped(this.recorder);
      await this.uploads;
      this.release();
      const r = await this.speech("POST", `/recordings/${this.id}/finish`, { language: this.o.language, speakers: this.o.speakers });
      if (!r.ok) throw new Error(r.error);
      return this.id;
    }
    async cancel() {
      await stopped(this.recorder);
      this.release();
      if (this.id) await this.speech("DELETE", `/recordings/${this.id}`);
    }
    release() {
      for (const track of this.stream?.getTracks() ?? []) track.stop();
      this.meter?.close();
      this.stream = void 0;
      this.meter = void 0;
    }
  };
  function micTrouble(error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError") return t("mic.denied");
    if (name === "NotFoundError") return t("mic.none");
    if (name === "NotReadableError") return t("mic.busy");
    return error instanceof Error ? error.message : String(error);
  }

  // src/webview/transcripts.ts
  var hooks = { view: () => void 0, shown: () => false, show: () => {
  }, setup: () => {
  } };
  var setTranscriptHooks = (h) => hooks = h;
  var SOURCES = {
    file: { label: t("tr.srcFile"), icon: "file-media" },
    mic: { label: t("tr.srcMic"), icon: "mic" },
    meet: { label: "Google Meet", icon: "organization" },
    system: { label: t("tr.srcAllSound"), icon: "organization" },
    note: { label: t("tr.srcNote"), icon: "note" }
  };
  var STAGES = [
    ["decode", t("tr.stageDecode")],
    ["words", t("tr.stageWords")],
    ["speakers", t("tr.stageSpeakers")],
    ["save", t("tr.stageSave")]
  ];
  var WEIGHTS = { decode: [0, 0.1], words: [0.1, 0.6], speakers: [0.6, 0.95], save: [0.95, 1] };
  var FORMATS = [
    ["docx", "Word \xB7 .docx"],
    ["md", "Markdown \xB7 .md"],
    ["txt", `${t("tr.fmtText")} \xB7 .txt`],
    ["srt", `${t("tr.fmtSubs")} \xB7 .srt`],
    ["vtt", `${t("tr.fmtSubs")} \xB7 .vtt`],
    ["json", `${t("tr.fmtData")} \xB7 .json`]
  ];
  var CODES2 = {
    Russian: "ru",
    Ukrainian: "uk",
    German: "de",
    French: "fr",
    Spanish: "es",
    Italian: "it",
    Polish: "pl",
    Portuguese: "pt",
    Turkish: "tr",
    Dutch: "nl",
    Czech: "cs",
    Japanese: "ja",
    Chinese: "zh",
    Korean: "ko",
    Arabic: "ar",
    Persian: "fa",
    Kazakh: "kk",
    Hebrew: "he",
    Swedish: "sv",
    Greek: "el",
    Hungarian: "hu",
    Romanian: "ro",
    Bulgarian: "bg",
    Finnish: "fi",
    Danish: "da",
    Norwegian: "no",
    Serbian: "sr",
    Croatian: "hr",
    Slovak: "sk",
    Lithuanian: "lt",
    Latvian: "lv",
    Estonian: "et"
  };
  var tx = {
    rows: void 0,
    query: "",
    /** The transcript open on the page; empty: the library. */
    openId: "",
    row: void 0,
    transcript: void 0,
    recorder: void 0,
    /** A question to the calls (ask.ts): the one asked, its answer, or why there is none. */
    question: "",
    asking: false,
    answer: void 0,
    askError: "",
    /** A moment to play from once the transcript opens (a cited passage). */
    seekTo: void 0,
    language: "auto",
    speakers: 0,
    /** The delete button was tapped once: it asks. */
    deleting: false,
    /** The export menu is open. */
    exporting: false,
    /** "Transcribe again" was tapped once: it asks. */
    redoing: false,
    // The summary block of the transcript `sumFor`: the template, the person's own instruction, the language, and its two questions.
    sumFor: "",
    template: "general",
    own: "",
    mine: false,
    editing: false,
    replacing: false,
    /** The transcript whose summary was being made when last drawn: it is read again once that is over. */
    sumBusy: ""
  };
  var DATE = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  var DAY = { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
  function meta(r, long = false) {
    const parts = [formatDate(new Date(r.created), long ? DAY : DATE)];
    if (r.duration) parts.push(length(r.duration));
    parts.push(r.source === "system" && r.app || (SOURCES[r.source]?.label ?? r.source));
    return parts.join(" \xB7 ");
  }
  var languages = (v) => {
    const own = CODES2[v.settings.native];
    return [["auto", t("tr.auto")], ["en", languageName("English")], ...own ? [[own, languageName(v.settings.native)]] : []];
  };
  async function transcribeFiles(files) {
    const ids = [];
    for (const file of files) {
      const path = window.tutorHost.pathOf(file);
      if (!path) continue;
      try {
        ids.push((await api("POST", "/transcripts", { path, language: tx.language === "auto" ? null : tx.language, speakers: tx.speakers || null })).id);
      } catch (error) {
        toast(`${file.name}: ${problem(error)}`, void 0, true);
      }
    }
    if (ids.length === 1) openTranscript(ids[0]);
    else if (ids.length > 1) {
      toast(t("tr.filesWaiting", { n: ids.length }));
      openTranscript("");
    }
  }
  var picker = el("input", {
    type: "file",
    accept: "audio/*,video/*,.mkv,.m4a,.opus,.flac",
    multiple: true,
    hidden: true,
    onchange: (event) => {
      const input = event.target;
      void transcribeFiles([...input.files ?? []]).finally(() => input.value = "");
    }
  });
  document.body.append(picker);
  function newRows(v) {
    const zone = el(
      "div",
      { class: "zone", role: "button", tabindex: 0, onclick: () => picker.click(), onkeydown: (e) => e.key === "Enter" && picker.click() },
      icon("cloud-upload"),
      el("div", { class: "zt" }, el("b", {}, t("tr.dropTitle")), el("small", {}, t("tr.dropNote", { time: minutesPerHour(v) >= 60 ? t("tr.anHour") : minutes(minutesPerHour(v)) }))),
      btn(t("tr.pick"), (event) => (event.stopPropagation(), picker.click()))
    );
    return [
      zone,
      card("languages", t("tr.language"), [t("tr.languageNote")], seg(tx.language, languages(v), (language) => tx.language = language)),
      card(
        "users",
        t("tr.speakers"),
        [t("tr.speakersNote")],
        seg(tx.speakers, [[0, t("tr.auto")], [1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]], (speakers) => tx.speakers = speakers, true)
      ),
      micRow()
    ];
  }
  function micRow() {
    const r = tx.recorder;
    if (!r) return card("mic", t("tr.micTitle"), [t("tr.micNote")], btn([el("i", { class: "dot" }), t("tr.record")], () => void startMic(), "rec"));
    return el(
      "div",
      { class: "row live" },
      el("div", { class: "l" }, el("span", { class: "livehead" }, el("i", { class: "dot pulse" }), t("tr.recording"), el("span", { class: "mtime" }, clock(r.seconds))), el("span", { class: "level" }, el("i"))),
      el("span", { class: "kchg" }, linkBtn(t("common.cancel"), () => void cancelMic()), btn(t("tr.stopTranscribe"), () => void stopMic(), "primary"))
    );
  }
  window.setInterval(() => {
    const r = tx.recorder;
    if (!r) return;
    for (const tr of document.querySelectorAll(".mtime")) tr.textContent = clock(r.seconds);
    for (const l of document.querySelectorAll(".level i")) l.style.width = `${Math.round(r.level() * 100)}%`;
  }, 100);
  async function startMic() {
    const r = new ChunkRecorder(window.tutorHost.call, { source: "mic", slice: 1e4, language: tx.language === "auto" ? void 0 : tx.language, speakers: tx.speakers || void 0 });
    try {
      await r.start();
      tx.recorder = r;
      post({ type: "micRecording", on: true });
    } catch (error) {
      toast(micTrouble(error), void 0, true);
    }
    redrawPage();
  }
  async function stopMic() {
    const r = tx.recorder;
    tx.recorder = void 0;
    post({ type: "micRecording", on: false });
    redrawPage();
    if (!r) return;
    try {
      const id = await r.finish();
      if (r.lost) toast(t("tr.lostPiece"), void 0, true);
      openTranscript(id);
    } catch (error) {
      fault(error);
    }
  }
  async function cancelMic() {
    const r = tx.recorder;
    tx.recorder = void 0;
    post({ type: "micRecording", on: false });
    redrawPage();
    await r?.cancel();
  }
  var drop = el("div", { class: "drop" }, el("div", {}, icon("cloud-upload"), el("b", {}, t("tr.dropHere"))));
  document.body.append(drop);
  var dragDepth = 0;
  var carriesFiles = (event) => !!event.dataTransfer?.types.includes("Files");
  window.addEventListener("dragenter", (event) => {
    if (!carriesFiles(event)) return;
    dragDepth++;
    drop.classList.add("on");
  });
  window.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) drop.classList.remove("on");
  });
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    drop.classList.remove("on");
    const files = [...event.dataTransfer?.files ?? []];
    if (!files.length) return;
    const v = hooks.view();
    if (!v || !running(v)) return hooks.setup();
    void transcribeFiles(files);
  });
  var searchTimer;
  async function loadRows() {
    try {
      const rows = await api("GET", `/transcripts?q=${encodeURIComponent(tx.query)}`);
      const changed = JSON.stringify(rows) !== JSON.stringify(tx.rows);
      tx.rows = rows;
      if (changed && hooks.shown() && !tx.openId) redrawPage();
    } catch {
    }
  }
  var transcriptOpen = () => !!tx.openId;
  function transcriptsBody(v) {
    if (!installed(v)) return [row(t("tr.needEngine"), [t("tr.needEngineNote")], linkBtn(t("tr.transcribeLink"), () => hooks.setup()))];
    if (!running(v)) return [row(t("speech.starting"), [t("tr.startingNote")], null)];
    return tx.openId ? transcriptPage(v) : libraryPage(v);
  }
  var pathNote = (path) => el("small", { class: "path", title: path }, el("bdi", {}, path));
  async function pickCalls() {
    const folder = await window.tutorHost.call({ call: "pickFolder", title: t("tr.callsFolder"), current: engineSettings(hooks.view())?.callsDir ?? "" });
    if (folder && await saveEngine({ callsDir: folder })) {
      toast(t("tr.callsSet", { folder }));
      void loadRows();
    }
  }
  async function askCalls(question) {
    tx.question = question;
    tx.answer = void 0;
    tx.askError = "";
    tx.asking = true;
    redrawPage();
    try {
      tx.answer = await window.tutorHost.call({ call: "askCalls", question });
    } catch (error) {
      tx.askError = problem(error) === "needModel" ? t("tr.askNeedModel") : problem(error);
    }
    tx.asking = false;
    redrawPage();
  }
  function askRows() {
    const input = el("input", { type: "search", placeholder: t("tr.ask"), value: tx.question });
    const form = el(
      "form",
      { class: "search ask", onsubmit: (event) => (event.preventDefault(), input.value.trim() && !tx.asking && void askCalls(input.value.trim())) },
      icon("comment-discussion"),
      input,
      btn(t("tr.askBtn"), () => form.requestSubmit(), "primary")
    );
    const out = [form];
    if (tx.asking) out.push(el("p", { class: "answer muted" }, t("tr.asking")));
    else if (tx.askError) out.push(el("p", { class: "answer muted" }, tx.askError));
    else if (tx.answer) {
      const a = tx.answer;
      if (!a.sources.length) out.push(el("p", { class: "answer muted" }, t("tr.askNothing")));
      else {
        const open2 = (n) => {
          const p = a.sources[n - 1];
          if (p) openTranscript(p.id, p.at);
        };
        const text = el("div", { class: "answer" });
        let last = 0;
        for (const m of a.text.matchAll(CITE)) {
          text.append(a.text.slice(last, m.index), el("button", { class: "cite", onclick: () => open2(Number(m[1])) }, m[1]));
          last = (m.index ?? 0) + m[0].length;
        }
        text.append(a.text.slice(last));
        const used = cited(a.text, a.sources.length);
        const list2 = (used.length ? used : a.sources.map((_, i) => i + 1)).map((n) => {
          const p = a.sources[n - 1];
          return el("li", {}, el("button", { class: "cite", onclick: () => open2(n) }, String(n)), " ", linkBtn(`${p.title} \xB7 ${formatDate(new Date(p.created), DATE)} \xB7 ${clock(p.at)}`, () => open2(n)));
        });
        out.push(text, el("ul", { class: "sources" }, ...list2));
      }
    }
    return out;
  }
  function libraryPage(v) {
    const kb = v.speech.health?.kbDir;
    const callsDir = engineSettings(v)?.callsDir;
    return [
      el(
        "div",
        { class: "tools" },
        el(
          "label",
          { class: "search" },
          icon("search"),
          el("input", {
            type: "search",
            placeholder: t("tr.search"),
            value: tx.query,
            oninput: (event) => {
              tx.query = event.target.value;
              window.clearTimeout(searchTimer);
              searchTimer = window.setTimeout(() => void loadRows(), 200);
            }
          })
        ),
        btn([icon("add"), t("tr.new")], () => hooks.setup(), "", t("tr.newTitle"))
      ),
      ...askRows(),
      card("folder", t("tr.callsFolder"), [callsDir ? pathNote(callsDir) : t("tr.callsFolderNote")], linkBtn(callsDir ? t("dictate.change") : t("dictate.choose"), () => void pickCalls())),
      kb === "" ? aside("book-open", t("tr.needKb"), " ", linkBtn(t("tr.choose"), () => void pickKb())) : null,
      speakersMissing(v, () => hooks.setup()),
      list(v)
    ].filter((n) => n !== null);
  }
  function list(v) {
    const rows = tx.rows;
    if (!rows) return el("ul", { class: "tl" }, el("li", { class: "empty" }, t("tr.openingLib")));
    if (!rows.length) {
      if (tx.query) return el("ul", { class: "tl" }, el("li", { class: "empty" }, t("tr.nothing")));
      const tip = (glyph2, ...text) => el("li", {}, icon(glyph2), el("span", {}, ...text));
      return el(
        "div",
        { class: "tempty" },
        el("b", {}, t("tr.emptyTitle")),
        el(
          "ul",
          {},
          tip("cloud-upload", t("tr.tipDrop")),
          tip("mic", t("tr.tipMic")),
          tip("note", ...phrase(t("tr.tipNote"), { keys: caps(v.settings.noteKey) }))
        )
      );
    }
    return el(
      "ul",
      { class: "tl" },
      ...rows.map(
        (r) => el(
          "li",
          {},
          el(
            "button",
            { class: "ti", onclick: () => openTranscript(r.id) },
            el("span", { class: "src" }, icon(SOURCES[r.source]?.icon ?? "file")),
            el("span", { class: "tm" }, el("b", {}, r.title), el("small", {}, meta(r)), r.snippet ? snippet(r.snippet) : null),
            statusChip(r) ?? (r.summarized ? el("span", { class: "chip lit" }, t("sum.title")) : null)
          )
        )
      )
    );
  }
  function snippet(text) {
    const out = el("span", { class: "snip" });
    for (const part of text.split(/(\[[^\]]*\])/)) {
      if (part.startsWith("[") && part.endsWith("]")) out.append(el("mark", {}, part.slice(1, -1)));
      else if (part) out.append(part);
    }
    return out;
  }
  function statusChip(r) {
    if (r.status === "done") return null;
    if (r.status === "failed") return el("span", { class: "chip bad" }, t("tr.failed"));
    if (r.status === "recording") return el("span", { class: "chip rec" }, el("i", { class: "dot pulse" }), t("tr.recordingChip"));
    if (r.status === "queued") return el("span", { class: "chip off" }, t("tr.waiting"));
    return el("span", { class: "chip lit" }, `${Math.round(r.progress * 100)}%`);
  }
  function openTranscript(id, at) {
    if (id !== tx.openId) stopPlayer();
    tx.openId = id;
    tx.seekTo = at;
    tx.deleting = tx.exporting = tx.redoing = false;
    if (id && tx.row?.id !== id) {
      tx.row = void 0;
      tx.transcript = void 0;
    }
    if (id) void loadTranscript();
    else void loadRows();
    if (hooks.shown()) redrawPage();
    else hooks.show();
  }
  function backToList() {
    if (!tx.openId) return false;
    openTranscript("");
    return true;
  }
  function leaveTranscripts() {
    stopPlayer();
  }
  var busy = (status) => status === "queued" || status === "working";
  async function loadTranscript() {
    const id = tx.openId;
    try {
      const r = await api("GET", `/transcripts/${id}`);
      if (id !== tx.openId) return;
      const before = tx.row?.id === id ? tx.row : void 0;
      tx.row = r.row;
      if (r.transcript || r.row.status !== "done") tx.transcript = r.transcript ?? void 0;
      pace.see(r.row);
      if (!hooks.shown()) return;
      if (r.row.status === "done" && before?.status === "done") return;
      const card2 = document.querySelector(".progress");
      if (card2 && busy(before?.status) && busy(r.row.status)) return updateProgress(card2, r.row);
      redrawPage();
    } catch (error) {
      if (error instanceof SpeechError && error.status === 404) openTranscript("");
    }
  }
  function transcriptPage(v) {
    const r = tx.row;
    if (!r || r.id !== tx.openId) return [el("p", { class: "opening" }, t("tr.opening"))];
    const tr = tx.transcript;
    const title = el("h2", {
      class: "ttitle",
      contenteditable: tr ? "plaintext-only" : false,
      spellcheck: "false",
      title: tr ? t("tr.rename") : void 0,
      onkeydown: (event) => {
        const e = event;
        if (e.key === "Enter") e.preventDefault(), e.target.blur();
        if (e.key === "Escape") e.preventDefault(), e.target.textContent = tr?.title ?? r.title, e.target.blur();
      },
      onblur: (event) => {
        const node = event.target;
        const text = node.textContent?.trim() ?? "";
        if (tr && text && text !== tr.title) void patch({ title: text }).then(() => void loadRows());
        else node.textContent = tr?.title ?? r.title;
      }
    });
    title.textContent = tr?.title ?? r.title;
    const head = el("div", { class: "thead" }, title, el("small", { class: "tmeta" }, meta(tr ?? r, true)));
    if (r.status !== "done" || !tr) {
      stopPlayer();
      return [head, progressCard(r)];
    }
    const nodes = [head, actions(tr), ...notices(v, r, tr), summaryBlock(v, tr), speakersStrip(tr), utterances(v, tr), player(v, tr)].filter((n) => n !== null);
    if (tx.seekTo !== void 0) {
      const at = tx.seekTo;
      tx.seekTo = void 0;
      window.setTimeout(() => jumpTo(tr, at), 0);
    }
    return nodes;
  }
  function progressCard(r) {
    if (r.status === "failed") {
      return el(
        "div",
        { class: "card bad" },
        el("b", {}, t("tr.couldNot")),
        el("small", {}, r.error),
        el(
          "div",
          { class: "cardbtns" },
          btn(t("common.tryAgain"), async () => {
            try {
              await api("POST", `/transcripts/${r.id}/retry`);
              void loadTranscript();
            } catch (error) {
              fault(error);
            }
          }),
          linkBtn(t("tr.delete"), () => void remove(r.id))
        )
      );
    }
    if (r.status === "recording") return el("div", { class: "card" }, el("b", {}, el("i", { class: "dot pulse" }), " ", t("tr.recording")), el("small", {}, t("tr.afterStop")));
    const card2 = el(
      "div",
      { class: "card progress" },
      el("b", { class: "plead" }),
      el("span", { class: "track" }, el("i")),
      el("small", { class: "pstat" }),
      el("ol", { class: "stages" }, ...STAGES.map(([, label]) => el("li", {}, label))),
      el("small", { class: "pnote" }, t("tr.background"))
    );
    updateProgress(card2, r);
    return card2;
  }
  function updateProgress(card2, r) {
    const at = STAGES.findIndex((s) => s[0] === r.stage);
    const lead = card2.querySelector(".plead");
    if (lead) lead.textContent = r.status === "queued" ? t("tr.waitingTurn") : `${STAGES[at]?.[1] ?? t("tr.starting")}\u2026`;
    const track = card2.querySelector(".track");
    track?.classList.toggle("live", r.status === "working");
    const fill = track?.firstElementChild;
    if (fill) fill.style.width = `${(r.progress * 100).toFixed(1)}%`;
    const line = card2.querySelector(".pstat");
    if (line) line.textContent = progressLine(r);
    card2.querySelectorAll(".stages li").forEach((li, i) => li.className = i < at ? "done" : i === at ? "now" : "");
  }
  function progressLine(r) {
    if (r.status === "queued") return t("tr.startsAfter");
    const [a, b] = WEIGHTS[r.stage] ?? [0, 1];
    const part = Math.min(1, Math.max(0, (r.progress - a) / (b - a)));
    const parts = [];
    if (r.stage === "words" && part === 0) parts.push(t("tr.loadingModel"));
    else if (r.stage === "words" && r.duration && r.source !== "meet") parts.push(position(part * r.duration, r.duration));
    else if (part > 0) parts.push(`${Math.round(part * 100)}%`);
    const left = part > 0 ? pace.left(r) : "";
    if (left) parts.push(left);
    return parts.join(" \xB7 ");
  }
  function position(at, total) {
    return total >= 120 ? t("tr.posMin", { at: Math.floor(at / 60), total: Math.round(total / 60) }) : t("tr.posClock", { at: clock(at), total: clock(total) });
  }
  var pace = {
    id: "",
    seen: [],
    see(r) {
      const now = Date.now();
      if (this.id !== r.id) this.id = r.id, this.seen = [];
      this.seen = this.seen.filter(([tr, p]) => now - tr < 3e4 && p <= r.progress);
      this.seen.push([now, r.progress]);
    },
    left(r) {
      const first = this.seen[0];
      if (this.id !== r.id || !first) return "";
      const spent = (Date.now() - first[0]) / 1e3;
      const done2 = r.progress - first[1];
      if (spent < 8 || done2 < 0.01) return "";
      const left = (1 - r.progress) * spent / done2;
      return left < 60 ? t("tr.underMinute") : t("tr.minLeft", { n: Math.round(left / 60) });
    }
  };
  async function patch(changes) {
    try {
      const tr = await api("PATCH", `/transcripts/${tx.openId}`, changes);
      const recount = tr.utterances.length !== tx.transcript?.utterances.length;
      tx.transcript = tr;
      if (recount) redrawPage();
    } catch (error) {
      fault(error);
    }
  }
  function actions(tr) {
    const copy = btn([icon("copy"), t("common.copy")], async () => {
      try {
        await window.tutorHost.call({ call: "copy", text: await api("GET", `/transcripts/${tr.id}/text?format=txt`) });
        toast(t("tr.copied"));
      } catch (error) {
        fault(error);
      }
    });
    const menu = tx.exporting ? el(
      "div",
      { class: "menu", role: "menu" },
      ...FORMATS.map(
        ([format, label]) => el(
          "button",
          {
            class: "mi",
            role: "menuitem",
            onclick: async () => {
              tx.exporting = false;
              redrawPage();
              try {
                const path = await window.tutorHost.call({ call: "exportTranscript", id: tr.id, format, name: tr.title });
                if (path) toast(t("tr.saved", { file: fileName(path) }), showFile(path));
              } catch (error) {
                fault(error);
              }
            }
          },
          label
        )
      )
    ) : null;
    const exporter = el(
      "span",
      { class: "menuwrap" },
      btn([icon("desktop-download"), t("tr.export"), icon("chevron-down")], (event) => {
        event.stopPropagation();
        tx.exporting = !tx.exporting;
        redrawPage();
      }),
      menu
    );
    const toKb = tr.source !== "note" ? btn([icon("book"), t("tr.toKb")], async () => {
      try {
        const { path } = await api("POST", `/transcripts/${tr.id}/to-kb`);
        toast(t("tr.inKb", { file: fileName(path) }), showFile(path));
      } catch (error) {
        const choose = error instanceof SpeechError && error.status === 409;
        toast(problem(error), choose ? { label: t("tr.chooseFolder"), run: () => void pickKb() } : void 0, true);
      }
    }) : null;
    const del = tx.deleting ? el(
      "span",
      { class: "confirm" },
      el("small", {}, t("tr.deleteAsk")),
      btn(t("tr.delete"), () => void remove(tr.id), "danger"),
      linkBtn(t("tr.keep"), () => (tx.deleting = false, redrawPage()))
    ) : el("button", { class: "ib del", title: t("tr.delete"), "aria-label": t("tr.delete"), onclick: () => (tx.deleting = true, redrawPage()) }, icon("trash"));
    return el("div", { class: "tools tacts" }, copy, exporter, toKb, el("span", { class: "gap" }), del);
  }
  window.addEventListener("click", (event) => {
    if (!tx.exporting || event.target.closest?.(".menuwrap")) return;
    tx.exporting = false;
    redrawPage();
  });
  async function remove(id) {
    try {
      await api("DELETE", `/transcripts/${id}`);
      toast(t("tr.deleted"));
      openTranscript("");
    } catch (error) {
      fault(error);
    }
  }
  function notices(v, r, tr) {
    const out = [];
    const note = tr.note;
    if (note) {
      out.push(
        aside("book-open", ...phrase(t("tr.inKb"), { file: el("b", {}, fileName(note)) }), " ", linkBtn(t("tr.open"), () => post({ type: "openPath", path: note })), linkBtn(t("tr.showInFolder"), () => post({ type: "showInFolder", path: note })))
      );
    }
    if (tr.noteError) out.push(aside("info", tr.noteError, " ", linkBtn(t("tr.chooseFolder"), () => void pickKb())));
    if (r.error) out.push(aside("circle-alert", r.error));
    if (tr.lost) out.push(aside("info", t("sum.lost", { n: tr.lost })));
    const speakers = speakersNotice(v, tr);
    if (speakers) out.push(speakers);
    return out;
  }
  function splitWay(tr) {
    if (tr.source === "note" || tr.speakersStatus === "ok") return null;
    if (tr.hasWords) return "words";
    return tr.source === "file" || tr.source === "mic" ? "redo" : null;
  }
  function speakersNotice(v, tr) {
    if (tr.source === "note" || tr.speakersStatus === "ok" || tr.speakersStatus === "single") return null;
    const meet = tr.source === "meet" || tr.source === "system" ? ` ${t("tr.meetNote")}` : "";
    const why = tr.speakersStatus === "failed" ? t("tr.whyFailed") : tr.speakersStatus === "no-part" ? `${t("tr.whyNoPart")}${meet}` : `${t("tr.whyNoKey")}${meet}`;
    const missing = speakersMissing(v, () => hooks.setup());
    if (missing) return aside("users", why, " ", linkBtn(t("tr.setUpSpeakers"), () => hooks.setup()));
    const way = splitWay(tr);
    if (!way) return aside("users", `${why} ${t("tr.noWords")}`);
    const run = () => void splitSpeakers(tr.id);
    if (way === "words") return aside("users", `${why} ${t("tr.noRecog")}`, " ", linkBtn(t("tr.split"), run));
    const minutes2 = Math.max(1, Math.round(tr.duration / 3600 * minutesPerHour(v)));
    if (tx.redoing) {
      return aside(
        "users",
        tr.edited ? t("tr.editsLost") : t("tr.goOn"),
        " ",
        linkBtn(t("tr.again"), run),
        linkBtn(t("common.notNow"), () => (tx.redoing = false, redrawPage()))
      );
    }
    return aside("users", `${why} ${t("tr.redoTime", { n: minutes2 })}`, " ", linkBtn(t("tr.again"), () => (tx.redoing = true, redrawPage())));
  }
  async function splitSpeakers(id) {
    tx.redoing = false;
    try {
      await api("POST", `/transcripts/${id}/speakers`, {});
      if (tx.openId === id && tx.row) {
        tx.row = { ...tx.row, status: "queued", progress: 0, stage: "" };
        redrawPage();
      }
    } catch (error) {
      fault(error);
    }
  }
  function speakerClass(tr, key) {
    if (key === "me") return "sp-me";
    return `sp-${Object.keys(tr.speakers).filter((k) => k !== "me").indexOf(key) % 6 + 1}`;
  }
  function speakersStrip(tr) {
    const keys = Object.keys(tr.speakers);
    if (keys.length < 2) return null;
    const strip = el("div", { class: "spk" });
    for (const key of keys) {
      const name = tr.speakers[key]?.name ?? key;
      const chipNode = el("button", { class: `chip sp ${speakerClass(tr, key)}`, title: t("tr.rename") }, el("i", { class: "sw" }), name);
      chipNode.addEventListener("click", () => {
        const input = el("input", { type: "text", class: "field", value: name, "aria-label": t("tr.speakerName") });
        let done2 = false;
        const finish = (keep) => {
          if (done2) return;
          done2 = true;
          const next = input.value.trim();
          const s = tr.speakers[key];
          if (keep && next && s && next !== s.name) {
            s.name = next;
            void patch({ speakers: { [key]: next } });
            for (const who of document.querySelectorAll(`.who[data-speaker="${key}"]`)) who.textContent = next;
            chipNode.lastChild.textContent = next;
          }
          input.replaceWith(chipNode);
        };
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") finish(true);
          if (event.key === "Escape") event.preventDefault(), finish(false);
        });
        input.addEventListener("blur", () => finish(true));
        chipNode.replaceWith(input);
        input.select();
      });
      strip.append(chipNode);
    }
    strip.append(el("small", {}, t("tr.tapRename")));
    const hints = Object.entries(tr.speakerHints ?? {}).filter(([key]) => tr.speakers[key]);
    if (hints.length === 0) return strip;
    const offers = hints.map(([key, name]) => {
      const forget = () => {
        delete tr.speakerHints?.[key];
        offer.remove();
        if (!box.querySelector(".namehint")) box.remove();
      };
      const offer = el(
        "div",
        { class: "namehint" },
        el("span", {}, `${tr.speakers[key].name} \u2192 ${name}?`),
        linkBtn(t("tr.applyName"), () => {
          tr.speakers[key].name = name;
          forget();
          void patch({ speakers: { [key]: name }, speakerHints: { [key]: null } }).then(redrawPage);
        }),
        linkBtn(t("tr.dismissName"), () => (forget(), void patch({ speakerHints: { [key]: null } })))
      );
      return offer;
    });
    const box = el("div", { class: "namehints" }, ...offers, el("small", {}, t("tr.nameHintNote")));
    return el("div", {}, strip, box);
  }
  function speakerMenu(tr, i, label) {
    document.querySelector(".whomenu")?.remove();
    const menu = el(
      "div",
      { class: "menu whomenu", role: "menu" },
      ...Object.entries(tr.speakers).map(
        ([key, s]) => el(
          "button",
          {
            class: `mi ${speakerClass(tr, key)}`,
            role: "menuitem",
            onclick: () => {
              menu.remove();
              const u = tr.utterances[i];
              if (!u || u.speaker === key) return;
              u.speaker = key;
              void patch({ utterances: { [i]: { speaker: key } } }).then(redrawPage);
            }
          },
          el("i", { class: "sw" }),
          s.name
        )
      )
    );
    label.after(menu);
    window.setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }));
  }
  function shotImage(v, tr, file) {
    return `http://127.0.0.1:${v.speech.port}/transcripts/${encodeURIComponent(tr.id)}/shots/${encodeURIComponent(file)}`;
  }
  function showShot(src) {
    const close = () => (box.remove(), window.removeEventListener("keydown", esc, true));
    const esc = (event) => event.key === "Escape" && (event.preventDefault(), event.stopPropagation(), close());
    const box = el("div", { class: "shotbig", onclick: close }, el("img", { src, alt: "" }));
    window.addEventListener("keydown", esc, true);
    document.body.append(box);
  }
  function utterances(v, tr) {
    const many = Object.keys(tr.speakers).length > 1;
    const list2 = el("div", { class: "utts" });
    const shots = shownShots(tr.shots);
    let next = 0;
    const shotsUntil = (at) => {
      const due = [];
      while (next < shots.length && shots[next].at < at) due.push(shots[next++]);
      if (due.length === 0) return;
      list2.append(
        el("div", { class: "shots" }, ...due.map((s) => {
          const src = shotImage(v, tr, s.file);
          return el("button", { class: "shot", title: clock(s.at), onclick: () => showShot(src) }, el("img", { src, alt: "", loading: "lazy" }));
        }))
      );
    };
    tr.utterances.forEach((u, i) => {
      shotsUntil(u.start);
      const first = i === 0 || tr.utterances[i - 1]?.speaker !== u.speaker;
      const text = el("div", {
        class: "ut",
        contenteditable: "plaintext-only",
        spellcheck: "false",
        onkeydown: (event) => {
          const e = event;
          const node = e.target;
          if (e.key === "Enter" && !e.shiftKey) e.preventDefault(), node.blur();
          if (e.key === "Escape") e.preventDefault(), node.textContent = tr.utterances[i]?.text ?? "", node.blur();
        },
        onblur: (event) => {
          const value = event.target.textContent?.trim() ?? "";
          const now = tr.utterances[i];
          if (now && value !== now.text) {
            now.text = value;
            void patch({ utterances: { [i]: { text: value } } });
          }
        }
      });
      text.textContent = u.text;
      const who = many && first ? el("button", { class: "who", "data-speaker": u.speaker, title: t("tr.anotherSpeaker") }, tr.speakers[u.speaker]?.name ?? u.speaker) : null;
      who?.addEventListener("click", (event) => (event.stopPropagation(), speakerMenu(tr, i, who)));
      list2.append(
        el(
          "div",
          { class: `utt${first ? " first" : ""}${who ? " has-who" : ""}${i === heard ? " now" : ""} ${speakerClass(tr, u.speaker)}`, "data-i": String(i) },
          el("button", { class: "at", title: t("tr.listenFrom"), onclick: () => seek(u.start) }, clock(u.start)),
          el("div", { class: "ub" }, who, text)
        )
      );
    });
    shotsUntil(Infinity);
    return list2;
  }
  var TEMPLATES = () => [
    ["general", t("sum.tGeneral")],
    ["standup", t("sum.tStandup")],
    ["interview", t("sum.tInterview")],
    ["lecture", t("sum.tLecture")],
    ["own", t("sum.tOwn")]
  ];
  function summaryBlock(v, tr) {
    if (tr.source === "note") return null;
    if (tx.sumFor !== tr.id) {
      tx.sumFor = tr.id;
      tx.template = tr.summary?.template ?? v.settings.callTemplate;
      tx.own = v.settings.callOwn;
      tx.mine = tr.summary?.mine ?? v.settings.callSummaryMine;
      tx.editing = tx.replacing = false;
    }
    const run = v.summaries[tr.id];
    if (run && !run.error) tx.sumBusy = tr.id;
    else if (tx.sumBusy === tr.id) {
      tx.sumBusy = "";
      void reloadSummary(tr.id);
    }
    const box = el("div", { class: "sum" }, el("div", { class: "sumhead" }, el("b", {}, t("sum.title"))));
    if (run && !run.error) {
      const stat = el("small", { class: "sumstat" }, summaryLine(run));
      box.append(el("div", { class: "sumrun" }, stat, bar(run.part / (run.parts + 1)), btn(t("common.cancel"), () => post({ type: "cancelSummary", id: tr.id }))));
      return box;
    }
    if (run?.error) {
      box.append(
        el(
          "div",
          { class: "card bad" },
          el("b", {}, t("sum.failed")),
          el("small", {}, t("sum.failedNote")),
          el("div", { class: "cardbtns" }, btn(t("common.tryAgain"), () => startSummary(tr)))
        )
      );
    }
    const model = v.settings.model;
    const files = v.models[model];
    if (files.status !== "ready") {
      const fetching = files.status === "downloading";
      box.append(
        el(
          "div",
          { class: "sumneed" },
          el("div", { class: "l" }, el("b", {}, t("sum.needModel", { name: levelName(model), size: size(files.size) })), el("small", {}, fetching ? t("sum.downloading") : t("sum.needModelNote")), fetching ? bar(files.progress) : null),
          fetching ? el("span", { class: "pct" }, `${Math.round(files.progress * 100)}%`) : btn(files.status === "failed" ? t("common.tryAgain") : t("settings.download"), () => post({ type: "useModel", model }), "primary")
        )
      );
    }
    if (tr.summary) box.append(summaryView(v, tr));
    if (files.status === "ready") box.append(summaryControls(tr));
    return box;
  }
  function summaryLine(run) {
    if (run.part < 1 && run.parts <= 1) return t("sum.starting");
    const now = Date.now();
    const parts = [run.part > run.parts ? t("sum.joining") : run.part < 1 ? t("sum.starting") : t("sum.working", { part: run.part, parts: run.parts }), t("sum.passed", { time: clock((now - run.started) / 1e3) })];
    const left = secondsLeft(run.part, run.parts, run.started, now);
    if (left !== null) parts.push(t("sum.left", { time: clock(left) }));
    return parts.join(" \xB7 ");
  }
  window.setInterval(() => {
    const stat = document.querySelector(".sumstat");
    const run = tx.sumBusy ? hooks.view()?.summaries[tx.sumBusy] : void 0;
    if (stat && run) stat.textContent = summaryLine(run);
  }, 1e3);
  function startSummary(tr) {
    tx.replacing = false;
    post({ type: "summarize", id: tr.id, template: tx.template, ...tx.template === "own" ? { own: tx.own.slice(0, SUMMARY_OWN_MAX) } : {}, mine: tx.mine });
  }
  function summaryControls(tr) {
    const make = btn(tr.summary ? t("sum.again") : t("sum.make"), () => {
      if (tr.summary?.edited && !tx.replacing) tx.replacing = true, redrawPage();
      else startSummary(tr);
    }, tr.summary ? "" : "primary");
    const ask = tx.replacing ? el("span", { class: "confirm" }, el("small", {}, t("sum.replaceAsk")), btn(t("sum.replace"), () => startSummary(tr), "danger"), linkBtn(t("common.cancel"), () => (tx.replacing = false, redrawPage()))) : make;
    const own = el("textarea", { class: "field report about", rows: 3, maxlength: SUMMARY_OWN_MAX, placeholder: t("sum.ownPlaceholder"), "aria-label": t("sum.tOwn") });
    own.value = tx.own;
    own.addEventListener("input", () => tx.own = own.value);
    return el(
      "div",
      { class: "sumctl" },
      el(
        "div",
        { class: "sumrow" },
        select(tx.template, TEMPLATES(), (template) => {
          tx.template = template;
          redrawPage();
        }),
        el("label", { class: "summine" }, toggleKnob(tx.mine, (on) => tx.mine = on, t("sum.mine")), t("sum.mine")),
        el("span", { class: "gap" }),
        ask
      ),
      tx.template === "own" ? own : null
    );
  }
  function summaryView(v, tr) {
    const sum = tr.summary;
    const tools = el(
      "div",
      { class: "sumtools" },
      btn([icon("copy"), t("common.copy")], async () => {
        try {
          await window.tutorHost.call({ call: "copy", text: tr.summary?.text ?? "" });
          toast(t("sum.copied"));
        } catch (error) {
          fault(error);
        }
      }),
      btn(tx.editing ? t("sum.done") : t("sum.edit"), () => (tx.editing = !tx.editing, redrawPage())),
      tx.editing ? el("small", {}, t("sum.editHint")) : null
    );
    if (!tx.editing) return el("div", { class: "sumbody" }, summaryText(v, tr, sum.text), tools);
    const field = el("textarea", { class: "field report sumedit", "aria-label": t("sum.title") });
    field.value = sum.text;
    field.rows = Math.min(24, Math.max(8, sum.text.split("\n").length + 1));
    field.addEventListener("blur", () => void saveSummary(tr, field.value.trim()));
    return el("div", { class: "sumbody" }, field, tools);
  }
  function summaryText(v, tr, text) {
    const out = el("div", { class: "sumtext" });
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("#")) {
        out.append(el("h4", {}, line.replace(/^#+\s*/, "")));
        continue;
      }
      const bullet = line.startsWith("- ");
      const body = bullet ? line.slice(2) : line;
      const node = el("div", { class: bullet ? "sli" : "sp" });
      const topic = topicIn(body);
      const shot = topic ? shotIn(topic.after) : null;
      const file = shot ? tr.shots?.find((s) => Math.abs(s.at - shot.at) <= 1)?.file : void 0;
      const after = shot && file ? [shot.text, " ", el("button", { class: "stamp", title: t("sum.shot"), onclick: () => showShot(shotImage(v, tr, file)) }, shot.mark)] : [topic?.after ?? ""];
      if (topic) node.append(topic.before, el("button", { class: "stamp", title: t("sum.seek"), onclick: () => jumpTo(tr, topic.at) }, topic.stamp), ...after);
      else node.append(body);
      out.append(node);
    }
    return out;
  }
  function jumpTo(tr, at) {
    seek(at);
    let found2 = 0;
    tr.utterances.forEach((u, i) => {
      if (u.start <= at + 0.3) found2 = i;
    });
    document.querySelector(`.utt[data-i="${found2}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  async function saveSummary(tr, text) {
    if (!tr.summary || !text || text === tr.summary.text) return;
    const before = tr.summary;
    const next = { ...before, text, edited: (/* @__PURE__ */ new Date()).toISOString() };
    tr.summary = next;
    try {
      await api("PUT", `/transcripts/${tr.id}/summary`, { summary: next });
    } catch (error) {
      tr.summary = before;
      fault(error);
    }
  }
  async function reloadSummary(id) {
    try {
      const r = await api("GET", `/transcripts/${id}`);
      if (id !== tx.openId) return;
      tx.row = r.row;
      tx.transcript = r.transcript ?? tx.transcript;
      tx.editing = tx.replacing = false;
      if (hooks.shown()) redrawPage();
    } catch (error) {
      fault(error);
    }
  }
  var audio;
  var audioId = "";
  var heard = -1;
  function stopPlayer() {
    audio?.pause();
    audio?.removeAttribute("src");
    audio = void 0;
    audioId = "";
    heard = -1;
  }
  function soundOf(v, tr) {
    if (audio && audioId === tr.id) return audio;
    stopPlayer();
    const a = new Audio(`http://127.0.0.1:${v.speech.port}/transcripts/${encodeURIComponent(tr.id)}/audio`);
    a.preload = "metadata";
    const sync = () => {
      for (const p of document.querySelectorAll(".player")) {
        const playing = !a.paused;
        p.classList.toggle("playing", playing);
        p.querySelector(".pp")?.replaceChildren(icon(playing ? "debug-pause" : "play"));
        const time = p.querySelector(".ptime");
        if (time) time.textContent = `${clock(a.currentTime)} / ${clock(tr.duration)}`;
        const range = p.querySelector(".scrub");
        if (range && document.activeElement !== range) range.value = String(Math.round(a.currentTime * 10));
      }
      mark(tr, a.currentTime, !a.paused);
    };
    a.addEventListener("play", sync);
    a.addEventListener("pause", sync);
    a.addEventListener("timeupdate", sync);
    audio = a;
    audioId = tr.id;
    return a;
  }
  function seek(at) {
    if (!audio) return;
    audio.currentTime = Math.max(0, at - 0.3);
    void audio.play();
  }
  var SPEEDS = [1, 1.25, 1.5, 2];
  function player(v, tr) {
    const a = soundOf(v, tr);
    const playing = !a.paused;
    const range = el("input", { type: "range", class: "scrub", min: 0, max: Math.round(tr.duration * 10), value: Math.round(a.currentTime * 10), "aria-label": t("tr.position") });
    range.addEventListener("input", () => a.currentTime = Number(range.value) / 10);
    const speed = el("button", { class: "speed", title: t("speech.speed") }, `${a.playbackRate}\xD7`);
    speed.addEventListener("click", () => {
      const next = SPEEDS[(SPEEDS.indexOf(a.playbackRate) + 1) % SPEEDS.length] ?? 1;
      a.playbackRate = next;
      speed.textContent = `${next}\xD7`;
    });
    return el(
      "div",
      { class: playing ? "player playing" : "player" },
      el("button", { class: "pp", title: t("tr.playSpace"), "aria-label": t("tr.play"), onclick: () => a.paused ? void a.play() : a.pause() }, icon(playing ? "debug-pause" : "play")),
      el("span", { class: "ptime" }, `${clock(a.currentTime)} / ${clock(tr.duration)}`),
      range,
      speed
    );
  }
  function mark(tr, at, follow2) {
    let lo = 0;
    let hi = tr.utterances.length - 1;
    let found2 = -1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if ((tr.utterances[mid]?.start ?? 0) <= at + 0.3) found2 = mid, lo = mid + 1;
      else hi = mid - 1;
    }
    if (found2 === heard) return;
    heard = found2;
    document.querySelector(".utt.now")?.classList.remove("now");
    const node = document.querySelector(`.utt[data-i="${found2}"]`);
    node?.classList.add("now");
    if (follow2 && node && !node.contains(document.activeElement)) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || !audio || !hooks.shown() || !tx.openId) return;
    const target = event.target;
    if (target.isContentEditable || target.matches("input, textarea, select") || target.classList.contains("recording")) return;
    event.preventDefault();
    if (audio.paused) void audio.play();
    else audio.pause();
  });
  window.setInterval(() => {
    const v = hooks.view();
    if (!v || !running(v) || !hooks.shown()) return;
    if (!tx.openId) void loadRows();
    else if (tx.row && tx.row.status !== "done") void loadTranscript();
  }, 1500);
  function enterTranscripts() {
    if (tx.openId) void loadTranscript();
    else void loadRows();
  }

  // src/webview/app.ts
  var save = (patch2) => post({ type: "saveSettings", patch: patch2 });
  var RELEASES = "https://github.com/designmakc/tyts/releases";
  var REPORT_EMAIL = "designmakc@gmail.com";
  function phrases(keys) {
    const out = {};
    for (const k of Object.keys(keys)) Object.defineProperty(out, k, { get: () => t(keys[k]), enumerable: true });
    return out;
  }
  var ACTIONS = ["layout", "voice", "recordings", "translate", "english"];
  var ICONS = { translate: "languages", english: "graduation-cap", voice: "mic", recordings: "audio-lines", layout: "keyboard" };
  var PARENT = {
    keys: "settings",
    models: "settings",
    storage: "settings",
    translations: "translate",
    words: "english",
    mistakes: "english",
    phrases: "voice",
    vocabulary: "voice",
    transcripts: "recordings",
    kept: "layout",
    learned: "layout",
    programs: "layout",
    layouts: "layout"
  };
  var TITLES = phrases({
    translate: "nav.translate",
    english: "nav.english",
    voice: "nav.voice",
    recordings: "nav.recordings",
    layout: "nav.layout",
    words: "nav.words",
    mistakes: "nav.mistakes",
    transcripts: "nav.transcripts",
    translations: "nav.translations",
    phrases: "nav.phrases",
    vocabulary: "nav.vocabulary",
    kept: "nav.kept",
    learned: "nav.learned",
    programs: "nav.programs",
    layouts: "nav.layouts",
    settings: "nav.settings",
    keys: "nav.keys",
    models: "nav.models",
    storage: "nav.storage",
    about: "nav.about",
    report: "nav.report",
    search: "nav.search"
  });
  var view;
  var askedTab;
  var askedTranscript = "";
  var search = "";
  var finding = "";
  var keyTrouble;
  var keyTarget;
  var programOpen = "";
  var runningApps = [];
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var frozenAt = (name) => {
    const m = new RegExp(`(?:^#|&)${name}=([\\d.]+)`).exec(location.hash);
    return m ? parseFloat(m[1]) : void 0;
  };
  var FROZEN_T = frozenAt("t");
  var clamp = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  var prog = (t2, a, b) => clamp((t2 - a) / (b - a));
  var lerp = (a, b, p) => a + (b - a) * p;
  var spring = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-8 * x) * (Math.cos(8.5 * x) + 8 / 8.5 * Math.sin(8.5 * x));
  var pop = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(10 * x);
  var root = document.getElementById("root");
  var mainCol = el("section", { class: "main" });
  function rel(node) {
    const w = mainCol.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    return { x: b.left - w.left, y: b.top - w.top, w: b.width, h: b.height };
  }
  var fontOf = (node) => parseFloat(getComputedStyle(node).fontSize) || 16;
  var SAMPLES = {
    Russian: { typed: "ghbdtn vbh", fixed: "\u043F\u0440\u0438\u0432\u0435\u0442 \u043C\u0438\u0440", from: "EN", to: "RU" },
    Ukrainian: { typed: "ghbdsn cdsn", fixed: "\u043F\u0440\u0438\u0432\u0456\u0442 \u0441\u0432\u0456\u0442", from: "EN", to: "UK" }
  };
  var sampleOf = (native) => SAMPLES[native] ?? SAMPLES.Russian;
  var said = (hotkey) => hotkey === COPY_TWICE2 ? t("keys.copyTwice") : hotkey.endsWith("*2") ? t("keys.twice", { key: hotkeyLabel(hotkey.slice(0, -2)) }) : hotkeyLabel(hotkey);
  var isTap = (hotkey) => /^(Left|Right)(Control|Shift|Alt|Super)(\*2)?$/.test(hotkey);
  var usage = (hotkey) => t(isTap(hotkey) ? "keys.tap" : "keys.press", { key: said(hotkey) });
  function cycleOf(v) {
    const chosen = v.settings.layouts.map((id) => v.layouts.find((l) => l.id === id)).filter((l) => !!l);
    if (chosen.length > 0) return chosen;
    const languages2 = myLanguages(v.settings);
    const mine = v.layouts.filter((l) => languages2.includes(l.lang));
    return mine.length >= 2 ? mine : v.layouts;
  }
  var naturalOn = (v) => v.natural.status === "ready" && (v.settings.voice === "" || v.settings.voice.startsWith(NATURAL_PREFIX));
  var pairOf = (v) => t("lang.pairEnglish", { lang: languageName(v.settings.native) });
  var NAV = [
    [{ page: "home", icon: "house", title: t("nav.home") }],
    ACTIONS.map((a) => ({ page: a, icon: ICONS[a], title: TITLES[a] })),
    [{ page: "settings", icon: "settings", title: TITLES.settings }],
    [
      { page: "about", icon: "info", title: TITLES.about },
      { page: "report", icon: "bug", title: TITLES.report }
    ]
  ];
  var findField = el("input", {
    type: "text",
    placeholder: t("search.placeholder"),
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": t("search.placeholder"),
    oninput: () => find(findField.value),
    onkeydown: (event) => {
      const key = event.key;
      if (key === "Escape") {
        event.preventDefault();
        findField.value = "";
        find("");
        findField.blur();
      } else if (key === "Enter") {
        event.preventDefault();
        pBody.querySelector(".row.found")?.click();
      }
    }
  });
  var tree = el("nav", { class: "tree" });
  var navValues = /* @__PURE__ */ new Map();
  NAV.forEach((items, at) => {
    if (at) tree.append(el("div", { class: "dv" }));
    for (const i of items) {
      const value = el("span", { class: "v" });
      navValues.set(i.page, value);
      const page = i.page;
      tree.append(el("button", { class: "it", "data-nav": page, title: i.title, onclick: () => page === "home" ? goHome() : go(page) }, lucide(i.icon), el("span", { class: "lb" }, i.title), value));
    }
  });
  var side = el(
    "aside",
    { class: "side" },
    // The text logo; a narrow sidebar has room for the icon only.
    el("div", { class: "brand" }, logo(), tile(28)),
    el("label", { class: "find", title: t("search.title") }, lucide("search", "s"), findField, el("span", { class: "key" }, onMac2 ? "\u2318F" : "Ctrl F")),
    tree
  );
  var maxButton = el("button", { class: "icon-btn max", title: t("common.maximize"), "aria-label": t("common.maximize"), onclick: () => post({ type: "window", action: "maximize" }) }, glyph("maximize"));
  var winButtons = el(
    "div",
    { class: "wbtns" },
    el("button", { class: "icon-btn", title: t("nav.minimize"), "aria-label": t("nav.minimize"), onclick: () => post({ type: "window", action: "minimize" }) }, glyph("minimize")),
    maxButton,
    el("button", { class: "icon-btn", title: t("common.close"), "aria-label": t("common.close"), onclick: () => post({ type: "window", action: "close" }) }, glyph("close"))
  );
  function windowState(maximized) {
    const label = t(maximized ? "common.restore" : "common.maximize");
    maxButton.replaceChildren(glyph(maximized ? "restore" : "maximize"));
    maxButton.title = label;
    maxButton.setAttribute("aria-label", label);
    root.classList.toggle("maxed", maximized);
  }
  var pTitle = el("div", { class: "ptitle" });
  var barMark = el("div", { class: "brand bb" }, logo());
  var top = el("header", { class: "top" }, barMark, pTitle, el("span", { class: "gap" }), winButtons);
  var home = el("main", { class: "home" });
  var pBody = el("div", { class: "pbody" });
  mainCol.append(top, home, pBody);
  root.append(side, mainCol);
  var making;
  function updateNav() {
    const lit = open ? PARENT[open.name] ?? open.name : "home";
    for (const b of tree.querySelectorAll(".it")) b.classList.toggle("on", b.dataset.nav === lit);
    const v = view;
    if (!v) return;
    for (const g of NAV) for (const i of g) if (i.value) navValues.get(i.page)?.replaceChildren(i.value(v));
    const busy3 = running(v) ? v.speech.health?.busy : null;
    const live = navValues.get("recordings");
    if (!live) return;
    live.classList.toggle("live", !!busy3);
    live.title = busy3 ? t("nav.making") : "";
    live.replaceChildren(...busy3 ? [el("span", { class: "dot" }), making?.id === busy3 ? `${Math.round(making.progress * 100)}%` : ""] : []);
  }
  async function followMaking() {
    const id = view && running(view) ? view.speech.health?.busy : null;
    if (!id) {
      if (making) making = void 0, updateNav();
      return;
    }
    if (document.hidden) return;
    try {
      const r = await api("GET", `/transcripts/${id}`);
      making = r.row.status === "done" ? void 0 : { id, progress: r.row.progress };
    } catch {
    }
    updateNav();
  }
  window.setInterval(() => void followMaking(), 3e3);
  var HOME_KEYS = [
    { key: "menuKey", title: "menu.keyTitle", page: "keys" },
    { key: "translateKey", title: "act.translate", page: "translate", section: "act.selected", chain: "translate" },
    { key: "selectKey", title: "act.listen", page: "translate", section: "act.selected", chain: "listen" },
    { key: "inPlaceKey", title: "act.inPlace", page: "translate", section: "act.selected" },
    { key: "textKey", title: "act.translate", page: "translate", section: "act.screen" },
    { key: "snipKey", title: "act.listen", page: "translate", section: "act.screen" },
    { key: "typeKey", title: "act.ownKey", page: "translate", section: "act.own" },
    { key: "talkKey", title: "act.talk", page: "english", section: "act.talkGroup", speech: true },
    { key: "checkKey", title: "check.keySelected", page: "english", section: "page.checkEnglish" },
    { key: "typeCheckKey", title: "check.typeKey", page: "english", section: "page.checkEnglish" },
    { key: "practiceKey", title: "act.say", page: "english", section: "page.checkEnglish", speech: true },
    { key: "dictateKey", title: "dict.type", page: "voice", speech: true },
    { key: "englishKey", title: "dict.english", page: "voice", speech: true },
    { key: "againKey", title: "dictate.againKey", page: "voice", speech: true },
    { key: "noteKey", title: "dict.note", page: "voice", speech: true },
    { key: "meetingKey", title: "call.record", page: "recordings", speech: true },
    { key: "shotKey", title: "call.shotKey", page: "recordings", speech: true },
    { key: "fixKey", title: "kb.fixKey", page: "layout", section: "act.fixGroup", chain: "fix" },
    { key: "switchKey", title: "kb.switchKey", page: "layout", section: "act.switchGroup" },
    { key: "pauseKey", title: "settings.pauseKey", page: "keys" },
    { key: "windowKey", title: "settings.windowKey", page: "keys" }
  ];
  function statusCard(v) {
    const paused = v.settings.paused;
    return el(
      "div",
      { class: paused ? "status paused" : "status" },
      el("span", { class: "sdot" }),
      el("div", { class: "st" }, t(paused ? "home.paused" : "home.ready"), el("small", {}, t(paused ? "home.pausedNote" : "home.readyNote"))),
      btn(t(paused ? "tray.resume" : "tray.pause"), () => save({ paused: !paused }), paused ? "primary" : "")
    );
  }
  function homeTrouble(v) {
    const lines = [
      v.translator === "failed" ? warn(t("home.troubleTranslator")) : null,
      v.natural.status === "failed" ? warn(t("home.troubleVoice")) : null,
      installed(v) && v.speech.service === "down" ? warn(t("home.troubleSpeech")) : null
    ];
    return lines.filter((n) => n !== null);
  }
  function downloadsNow(v) {
    const out = [];
    const add = (name, state) => {
      if (state.status === "downloading") out.push({ name, progress: state.progress });
    };
    add(levelName("fast"), v.translation.fast);
    add(levelName("accurate"), v.models.accurate);
    add(levelName("most"), v.models.most);
    add(t("settings.natural"), v.natural);
    if (v.speech.pack.status === "installing") out.push({ name: t("storage.speech"), progress: v.speech.pack.progress ?? 0 });
    const models = v.speech.health?.models;
    const fetching = [models?.dictation, models?.transcripts].filter((m) => m?.state === "downloading");
    for (const m of new Map(fetching.map((m2) => [m2?.name, m2])).values()) if (m) out.push({ name: speechChoice(v, m.name)?.label ?? m.name, progress: m.progress ?? 0 });
    if (v.dictionary.status === "downloading") out.push({ name: t("storage.dict") });
    return out;
  }
  function keyLine(k, s) {
    const open2 = () => go(k.page, void 0, k.key);
    return el(
      "div",
      {
        class: "hkey",
        role: "button",
        tabindex: 0,
        onclick: open2,
        onkeydown: (event) => {
          const key = event.key;
          if (key === "Enter" || key === " ") event.preventDefault(), open2();
        }
      },
      el("span", { class: "kn" }, t(k.title)),
      el("span", { class: "kw" }, k.section ? `${TITLES[k.page]} \u203A ${t(k.section)}` : TITLES[k.page]),
      el("span", { class: "kc" }, caps(s[k.key], k.chain))
    );
  }
  function homeNodes(v) {
    const s = v.settings;
    const sample = sampleOf(s.native);
    const keys = HOME_KEYS.filter((k) => !k.speech || installed(v));
    const set = keys.filter((k) => s[k.key]);
    const unset = keys.length - set.length;
    return [
      el(
        "div",
        { class: "hsum" },
        statusCard(v),
        ...homeTrouble(v),
        ...downloadsNow(v).map(
          (d) => el(
            "div",
            { class: "dl" },
            el("span", {}, t("home.downloading", { name: d.name })),
            d.progress !== void 0 ? bar(d.progress) : null,
            d.progress !== void 0 ? pct(d.progress) : null
          )
        ),
        grp(t("home.yourKeys"), set.length || void 0),
        ...set.map((k) => keyLine(k, s)),
        unset ? el("p", { class: "unset" }, t("home.unset", { n: unset })) : null,
        el(
          "div",
          { class: "head" },
          el(
            "div",
            { class: "hline" },
            el("span", { class: "hs h1" }, sample.typed),
            el("span", { class: "arr a1" }, "\u2192"),
            el("span", { class: "hs h2" }, sample.fixed),
            el("span", { class: "arr a2" }, "\u2192"),
            el("span", { class: "hs h3" }, "hello world"),
            el("button", { class: "replay", title: t("home.replayTitle"), onclick: () => playMoment(false) }, icon("play"), el("span", {}, t("home.replay")))
          )
        )
      )
    ];
  }
  function renderHome(force = false) {
    if (!view || moment) return;
    const next = el("div", {}, ...homeNodes(view));
    if (!force && next.innerHTML === home.innerHTML) return;
    home.replaceChildren(...next.childNodes);
  }
  var T_END = 5.7;
  var TYPE0 = 0.2;
  var TYPE_STEP = 0.09;
  var FIX = 1.3;
  var FLIP0 = 1.36;
  var FLIP_STEP = 0.045;
  var FLIP_D = 0.3;
  var TR = [2.12, 2.26];
  var SWAP = 2.32;
  var LI = [3.02, 3.15];
  var WORDS = [
    [3.3, 3.76],
    [3.76, 4.26]
  ];
  var TRAVEL = 4.4;
  var moment;
  function buildMoment(v, markSeen) {
    const q = (s2) => home.querySelector(s2);
    const head = q(".head"), h1 = q(".h1"), h2 = q(".h2"), h3 = q(".h3"), replay = q(".replay");
    const kf = q("[data-chain=fix]"), kt = q("[data-chain=translate]"), kl = q("[data-chain=listen]");
    if (!head || !h1 || !h2 || !h3 || !replay) return void 0;
    const s = v.settings;
    const sample = sampleOf(s.native);
    const cells = [...sample.typed].map((ch, i) => {
      const a = el("span", {}, ch === " " ? "\xA0" : ch);
      const b = el("span", {}, sample.fixed[i] === " " ? "\xA0" : sample.fixed[i] ?? "");
      return { c: el("span", { class: "cell" }, a, b), a, b, wa: 0, wb: 0 };
    });
    const caret = el("span", { class: "caret" });
    const badge = el("span", { class: "badge" }, sample.from);
    const line = el("div", { class: "big" }, ...cells.map((k) => k.c), caret, badge);
    const w1 = el("span", { class: "w" }, "hello");
    const w2 = el("span", { class: "w" }, "world");
    const line2 = el("div", { class: "big" }, w1, "\xA0", w2);
    const playIcon = icon("play");
    const play = el("div", { class: "play" }, playIcon);
    const t1 = el("div", { class: "trail t1" }, sample.typed);
    const t2 = el("div", { class: "trail t2" }, sample.fixed);
    const eyebrow = el("div", { class: "eyebrow" }, t("home.eyebrow"));
    const step2 = (n, hotkey, what) => {
      const keys = caps(hotkey);
      const small = el("small", {}, el("em", {}, String(n)), what);
      return { keys, small, node: el("div", { class: "step" }, keys, small) };
    };
    const sf = step2(1, s.fixKey, t("home.stepFix")), st = step2(2, s.translateKey, t("home.stepTranslate")), sl = step2(3, s.selectKey, t("home.stepListen"));
    const rail = el("div", { class: "rail" }, sf.node, st.node, sl.node);
    const stage = el("div", { class: "stage" }, eyebrow, t1, t2, line, line2, play, rail);
    stage.style.top = `${Math.round(Math.max(-40, Math.min(80, (mainCol.clientHeight - 620) / 2)))}px`;
    mainCol.append(stage);
    for (const k of cells) {
      k.wa = k.a.getBoundingClientRect().width;
      k.wb = k.b.getBoundingClientRect().width;
    }
    const l2 = rel(line2);
    play.style.left = `${l2.x + l2.w + 18}px`;
    play.style.top = `${l2.y - (parseFloat(stage.style.top) || 0) + (l2.h - 40) / 2}px`;
    const flight = (keys, target, d) => ({ keys, from: rel(keys), target, to: target ? rel(target) : void 0, d });
    const m = {
      raf: 0,
      markSeen,
      sample,
      stage,
      cells,
      caret,
      badge,
      t1,
      t2,
      line,
      line2,
      w1,
      w2,
      play,
      playIcon,
      eyebrow,
      smalls: [sf.small, st.small, sl.small],
      rail: { fix: sf.keys, translate: st.keys, listen: sl.keys },
      h: { head, h1, h2, h3, arrows: [...home.querySelectorAll(".arr")], replay, replayLabel: replay.querySelector("span") ?? replay, rows: [...home.querySelectorAll(".status, .warn, .dl, .hsum > .grp, .hkey, .unset")] },
      flights: [flight(sl.keys, kl, 0), flight(st.keys, kt, 0.06), flight(sf.keys, kf, 0.12)],
      g: {
        t1: rel(t1),
        t2: rel(t2),
        line: rel(line),
        line2: l2,
        play: rel(play),
        h1: rel(h1),
        h2: rel(h2),
        h3: rel(h3),
        replay: rel(replay)
      },
      f: { trail: fontOf(t1), big: fontOf(line), head: fontOf(h3) }
    };
    root.classList.add("playing");
    return m;
  }
  var press = (t2, at) => t2 >= at && t2 < at + 0.11;
  function lightKeys(group, lit, down) {
    for (const k of group.querySelectorAll(".key")) {
      k.classList.toggle("lit", lit);
      k.classList.toggle("down", down);
    }
    group.classList.toggle("lit", lit);
  }
  function setStyle(node, opacity, transform = "") {
    node.style.opacity = String(opacity);
    node.style.transform = transform;
  }
  var shown = (node, on) => node.style.visibility = on ? "visible" : "hidden";
  function move(node, from, to, p, s1) {
    const s = lerp(1, s1, p);
    const dx = (to.x - from.x) * p;
    const dy = (to.y + to.h / 2 - (from.y + from.h / 2 * s1)) * p;
    node.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  }
  function renderMoment(m, t2) {
    const { g, h, f } = m;
    m.cells.forEach((k, i) => {
      k.c.style.display = t2 >= TYPE0 + i * TYPE_STEP ? "" : "none";
      const p = spring(prog(t2, FLIP0 + i * FLIP_STEP, FLIP0 + i * FLIP_STEP + FLIP_D));
      k.c.style.width = `${lerp(k.wa, k.wb, clamp(p))}px`;
      setStyle(k.a, 1 - clamp(p * 2.2), `translateY(${-p * 26}px)`);
      setStyle(k.b, clamp((p - 0.25) * 1.6), `translateY(${(1 - p) * 26}px)`);
    });
    const typing = t2 >= TYPE0 && t2 < TYPE0 + m.cells.length * TYPE_STEP + 0.05;
    m.caret.style.opacity = t2 < SWAP && (typing || Math.floor(t2 * 2.4) % 2 === 0) ? "1" : "0";
    const out = prog(t2, SWAP - 0.1, SWAP + 0.1);
    m.badge.textContent = t2 < FIX + 0.25 ? m.sample.from : m.sample.to;
    const pulse = t2 >= FIX + 0.25 ? 1 + 0.18 * Math.sin(Math.PI * prog(t2, FIX + 0.25, FIX + 0.5)) : 1;
    setStyle(m.badge, 1 - out, `scale(${pulse * (1 - out)})`);
    const big = f.big / f.trail;
    const p1 = spring(prog(t2, FIX + 0.04, FIX + 0.8));
    move(m.t1, g.t1, g.line, 1 - p1, big);
    m.t1.style.opacity = t2 < FIX + 0.04 ? "0" : String(clamp(p1 * 2.2));
    const p2 = spring(prog(t2, SWAP, SWAP + 0.75));
    move(m.t2, g.t2, g.line, 1 - p2, big);
    m.t2.style.opacity = t2 < SWAP ? "0" : "1";
    m.line.style.opacity = t2 < SWAP ? "1" : "0";
    const inn = spring(prog(t2, SWAP + 0.14, SWAP + 0.8));
    setStyle(m.line2, clamp(inn * 2), `translateY(${(1 - inn) * 34}px)`);
    const speaking = t2 >= WORDS[0][0] && t2 < WORDS[1][1];
    m.w1.classList.toggle("on", t2 >= WORDS[0][0] && t2 < WORDS[0][1]);
    m.w2.classList.toggle("on", t2 >= WORDS[1][0] && t2 < WORDS[1][1]);
    setIcon(m.playIcon, speaking ? "primitive-square" : "play");
    m.play.classList.toggle("speaking", speaking);
    lightKeys(m.rail.fix, t2 >= FIX && t2 < SWAP, press(t2, FIX));
    lightKeys(m.rail.translate, t2 >= TR[0] && t2 < LI[0], press(t2, TR[0]) || press(t2, TR[1]));
    lightKeys(m.rail.listen, t2 >= LI[0] && t2 < WORDS[1][1] + 0.1, press(t2, LI[0]) || press(t2, LI[1]));
    const T = (d, dur = 0.8) => spring(prog(t2, TRAVEL + d, TRAVEL + d + dur));
    if (t2 >= TRAVEL) {
      move(m.line2, g.line2, g.h3, T(0), f.head / f.big);
      move(m.t2, g.t2, g.h2, T(0.06), f.head / f.trail);
      move(m.t1, g.t1, g.h1, T(0.12), f.head / f.trail);
      m.t1.style.opacity = "1";
      m.t2.style.opacity = "1";
    }
    if (t2 < TRAVEL) setStyle(m.play, t2 >= LI[0] ? 1 : 0, `scale(${pop(prog(t2, LI[0] + 0.02, LI[0] + 0.5))})`);
    else {
      m.play.style.opacity = "1";
      move(m.play, g.play, { x: g.replay.x, y: g.replay.y, w: 28, h: 28 }, T(0.02), 28 / 40);
    }
    for (const fl of m.flights) {
      const p = T(0.1 + fl.d);
      if (fl.to) fl.keys.style.transform = t2 >= TRAVEL ? `translate(${(fl.to.x - fl.from.x) * p}px, ${(fl.to.y - fl.from.y) * p}px)` : "";
      else if (t2 >= TRAVEL) fl.keys.style.opacity = String(1 - prog(t2, TRAVEL, TRAVEL + 0.25));
    }
    const fade2 = 1 - prog(t2, TRAVEL, TRAVEL + 0.25);
    m.eyebrow.style.opacity = String(fade2);
    for (const s of m.smalls) s.style.opacity = String(fade2);
    h.rows.forEach((row2, i) => {
      const p = spring(prog(t2, TRAVEL + 0.22 + i * 0.03, TRAVEL + 0.92 + i * 0.03));
      setStyle(row2, clamp(p * 1.3), `translateY(${(1 - p) * 14}px)`);
    });
    const hp = spring(prog(t2, TRAVEL + 0.45, TRAVEL + 1));
    for (const a of h.arrows) setStyle(a, hp, `translateX(${(1 - hp) * -8}px)`);
    h.head.style.borderColor = `color-mix(in srgb, var(--border) ${hp * 100}%, transparent)`;
    const landed = (d) => t2 >= TRAVEL + d + 0.8;
    shown(h.h3, landed(0)), shown(m.line2, !landed(0));
    shown(h.h2, landed(0.06)), shown(m.t2, !landed(0.06));
    shown(h.h1, landed(0.12)), shown(m.t1, !landed(0.12));
    for (const fl of m.flights) {
      const there = landed(0.1 + fl.d);
      if (fl.target) shown(fl.target, there);
      shown(fl.keys, !there);
    }
    shown(m.play, !landed(0.02));
    const rp = spring(prog(t2, TRAVEL + 0.82, TRAVEL + 1.3));
    shown(h.replay, landed(0.02));
    h.replay.style.width = `${lerp(28, g.replay.w, rp)}px`;
    h.replayLabel.style.opacity = String(rp);
  }
  function playMoment(markSeen, at) {
    if (!view) return;
    if (moment) finishMoment();
    closePage();
    const v = view;
    void document.fonts.ready.then(() => {
      if (moment) return;
      renderHome(true);
      const m = buildMoment(v, markSeen);
      if (!m) return;
      moment = m;
      renderMoment(m, Math.min(at ?? 0, T_END));
      if (at !== void 0) return;
      const t0 = performance.now();
      const tick = (now) => {
        const t2 = (now - t0) / 1e3;
        if (t2 >= T_END) return finishMoment();
        renderMoment(m, t2);
        m.raf = requestAnimationFrame(tick);
      };
      m.raf = requestAnimationFrame(tick);
    });
  }
  function finishMoment() {
    const m = moment;
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stage.remove();
    root.classList.remove("playing");
    moment = void 0;
    renderHome(true);
    if (m.markSeen) save({ introSeen: true });
  }
  var open;
  var visited = [];
  var samePlace = (a, b) => a?.name === b?.name && a?.sub === b?.sub;
  var scroller = () => open ? pBody : home;
  function go(name, sub, flash = "") {
    if (!view) return;
    const next = sub ? { name, sub } : { name };
    if (samePlace(open, next)) return flash ? flashRow(flash) : void 0;
    visited.push({ place: open && { ...open }, scroll: scroller().scrollTop });
    if (visited.length > 50) visited.shift();
    show(next, open?.name === name ? sub ? 1 : -1 : 0);
    if (flash) flashRow(flash);
  }
  function goHome() {
    if (!open) return;
    visited.push({ place: { ...open }, scroll: pBody.scrollTop });
    show(void 0, 0);
  }
  function closePage() {
    if (open) show(void 0, 0);
  }
  function back() {
    if (open?.name === "transcripts" && !open.sub && backToList()) return;
    let last = visited.pop();
    while (last && samePlace(last.place, open)) last = visited.pop();
    if (!last) return closePage();
    const from = open;
    const dir = last.place && from && last.place.name === from.name ? from.sub && !last.place.sub ? -1 : 1 : 0;
    show(last.place, dir, last.scroll);
    if (dir === -1 && from?.sub) pBody.querySelector(`[data-sub="${from.sub}"]`)?.focus({ preventScroll: true });
  }
  function show(place, dir, scroll = 0) {
    if (!view) return;
    if (moment) finishMoment();
    const was = open;
    if (was?.name === "transcripts" && place?.name !== "transcripts") leaveTranscripts();
    open = place;
    keyTrouble = void 0;
    if (place?.name !== was?.name) search = "";
    findField.value = place?.name === "search" ? finding : "";
    if (place?.name === "transcripts" && was?.name !== "transcripts") enterTranscripts();
    if (place?.name === "programs" && !place.sub) askRunningApps();
    if ((place?.name === "storage" || place?.name === "models") && was?.name !== place.name) post({ type: "storage" });
    if (place?.name !== "models") recommending = false;
    asking2 = "";
    root.classList.toggle("page-open", !!place);
    fillHeader();
    updateNav();
    if (!place) {
      renderHome();
      home.scrollTop = scroll;
      return fade(home);
    }
    if (dir && was) slideBody(dir);
    else {
      bodyPending = false;
      pBody.replaceChildren(...bodyOf(view));
      fade(pBody);
    }
    pBody.scrollTop = scroll;
  }
  function fade(node) {
    if (reduced.matches) return;
    node.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 160, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  }
  function flashRow(title) {
    const lines = [...pBody.querySelectorAll(".row, .tcell")];
    const line = lines.find((r) => r.dataset.key === title) ?? lines.find((r) => lineTitle(r) === title) ?? lines.find((r) => lineTitle(r).startsWith(title));
    if (!line) return;
    line.scrollIntoView({ block: "center" });
    line.classList.add("flash");
    window.setTimeout(() => line.classList.remove("flash"), 1600);
  }
  var SUBS = {
    card: { title: () => t("listen.cardGroup"), body: cardPage },
    screen: { title: () => t("screen.how"), body: screenHowPage },
    aboutYou: { title: () => t("talkPage.aboutYou"), body: aboutYouPage },
    talkWindow: { title: () => t("act.talkWindow"), body: talkWindowPage },
    notes: { title: () => t("dictate.notesFolder"), body: kbRows },
    edit: { title: () => t("edit.title"), body: editPage },
    speakers: { title: () => t("page.speakers"), body: speakerRows, valid: installed },
    fixing: { title: () => t("page.fixing"), body: fixingPage },
    program: { title: () => programOpen, body: programPage, valid: () => !!programOpen },
    languages: { title: () => t("page.languages"), body: languagesPage },
    forTranslate: { title: () => TITLES.translate, body: translateChoicePage },
    forCheck: { title: () => t("models.checkTalk"), body: checkChoicePage },
    forDictate: { title: () => TITLES.voice, body: (v) => speechChoicePage(v, "dictation") },
    forTranscribe: { title: () => TITLES.recordings, body: (v) => speechChoicePage(v, "transcripts") },
    forVoice: { title: () => t("page.voice"), body: voiceChoicePage }
  };
  var subTitle = (id) => {
    const title = SUBS[id].title;
    return typeof title === "string" ? title : title();
  };
  var sliding = [];
  function slideBody(dir) {
    if (!view || !open) return;
    for (const a of sliding) a.finish();
    sliding = [];
    const ghost = el("div", { class: "pbody pghost", inert: true, "aria-hidden": "true" });
    const scroll = pBody.scrollTop;
    ghost.append(...pBody.childNodes);
    mainCol.append(ghost);
    ghost.scrollTop = scroll;
    bodyPending = false;
    pBody.replaceChildren(...bodyOf(view));
    if (reduced.matches) return ghost.remove();
    const easing = "cubic-bezier(0.2, 0.8, 0.2, 1)";
    const duration = 220;
    const out = ghost.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${-48 * dir}px)`, opacity: 0 }], { duration, easing, fill: "forwards" });
    const inn = pBody.animate([{ transform: `translateX(${48 * dir}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration, easing });
    out.onfinish = () => ghost.remove();
    sliding = [out, inn];
  }
  function openSub(id) {
    if (open) go(open.name, id);
  }
  function fillHeader() {
    if (!view) return;
    if (!open) return pTitle.replaceChildren(t("nav.home"));
    const { name, sub } = open;
    const parent = PARENT[name];
    const way = (title, to) => el("button", { class: "pcrumb", onclick: to }, title);
    const sep = () => el("span", { class: "psep" }, "\u203A");
    pTitle.replaceChildren(
      ...parent ? [way(TITLES[parent], () => go(parent)), sep()] : [],
      ...sub ? [way(TITLES[name], () => go(name)), sep(), subTitle(sub)] : (
        // A transcript open: its page's name is the way back to the library.
        [name === "transcripts" && transcriptOpen() ? way(TITLES[name], () => backToList()) : TITLES[name]]
      )
    );
  }
  var bodyPending = false;
  var pointerDown = false;
  function busy2() {
    const a = document.activeElement;
    return !!a && pBody.contains(a) && (a.matches("input[type=text]:not([data-live]), input[type=search], input[type=password], input[type=range], textarea") || a.isContentEditable || a.classList.contains("recording"));
  }
  function carryFields(next) {
    const carried = [];
    for (const old of pBody.querySelectorAll("input[data-live], textarea[data-live]")) {
      if (!old.value && document.activeElement !== old) continue;
      const fresh = next.querySelector(`${old.localName}[data-live="${old.dataset.live}"]`);
      if (!fresh) continue;
      fresh.replaceWith(old);
      carried.push(old);
    }
    return carried;
  }
  function renderBody() {
    if (!view || !open) return;
    if (open.sub && SUBS[open.sub].valid?.(view) === false) {
      open.sub = void 0;
      fillHeader();
    }
    const next = el("div", {}, ...bodyOf(view));
    if (next.innerHTML === pBody.innerHTML) return;
    if (busy2()) {
      bodyPending = true;
      return;
    }
    bodyPending = false;
    const scroll = pBody.scrollTop;
    const focused = document.activeElement;
    const carried = carryFields(next);
    pBody.replaceChildren(...next.childNodes);
    pBody.scrollTop = scroll;
    const live = carried.find((f) => f === focused);
    if (live) live.focus({ preventScroll: true });
  }
  pBody.addEventListener("focusout", () => {
    if (!bodyPending) return;
    const later = () => window.setTimeout(renderBody, 0);
    if (pointerDown) window.addEventListener("pointerup", later, { once: true });
    else later();
  });
  window.addEventListener("pointerdown", () => pointerDown = true, true);
  window.addEventListener("pointerup", () => pointerDown = false, true);
  function bodyOf(v) {
    if (!open) return [];
    if (open.sub) return SUBS[open.sub].body(v);
    switch (open.name) {
      case "translate":
        return translatePage(v);
      case "english":
        return englishPage(v);
      case "voice":
        return voicePage(v);
      case "recordings":
        return recordingsPage(v);
      case "layout":
        return layoutPage(v);
      case "words":
        return wordsPage(v);
      case "mistakes":
        return mistakesPage(v);
      case "transcripts":
        return transcriptsBody(v);
      case "translations":
        return translationsPage(v);
      case "phrases":
        return recentPage(v);
      case "vocabulary":
        return vocabularyPage(v);
      case "kept":
        return keptPage(v);
      case "learned":
        return learnedPage(v);
      case "programs":
        return programsPage(v);
      case "layouts":
        return layoutsPage(v);
      case "settings":
        return settingsPage(v);
      case "keys":
        return keysPage(v);
      case "models":
        return modelsPage(v);
      case "storage":
        return storagePage(v);
      case "about":
        return aboutPage(v);
      case "report":
        return reportPage(v);
      case "search":
        return searchPage(v);
    }
  }
  var SEARCHED = [
    ...ACTIONS.map((name) => ({ name })),
    { name: "translate", sub: "card" },
    { name: "translate", sub: "screen" },
    { name: "english", sub: "aboutYou" },
    { name: "english", sub: "talkWindow" },
    { name: "voice", sub: "notes" },
    { name: "voice", sub: "edit" },
    { name: "layout", sub: "fixing" },
    { name: "recordings", sub: "speakers" },
    { name: "vocabulary" },
    { name: "kept" },
    { name: "learned" },
    { name: "programs" },
    { name: "layouts" },
    { name: "settings" },
    { name: "keys" },
    { name: "settings", sub: "languages" },
    { name: "models" },
    { name: "models", sub: "forTranslate" },
    { name: "models", sub: "forCheck" },
    { name: "models", sub: "forDictate" },
    { name: "models", sub: "forTranscribe" },
    { name: "models", sub: "forVoice" },
    { name: "storage" },
    { name: "report" }
  ];
  var lineTitle = (row2) => ((row2.matches(".tcell") ? row2.querySelector(".tn") : row2.querySelector(":scope > .l")?.firstChild)?.textContent ?? "").trim();
  function bodyFor(v, place) {
    const was = open;
    open = place;
    try {
      return bodyOf(v);
    } catch {
      return [];
    } finally {
      open = was;
    }
  }
  var lineCache;
  function drawnLines(v, place) {
    const lines = [];
    let section = "";
    for (const node of bodyFor(v, place)) {
      if (node.classList.contains("grp")) {
        section = (node.firstChild?.textContent ?? "").trim();
        continue;
      }
      for (const row2 of node.matches(".row") ? [node] : [...node.querySelectorAll(".row, .tcell")]) {
        const title = lineTitle(row2);
        const note = [...row2.querySelectorAll(":scope > .l > small, :scope > .ts")].map((s) => s.textContent ?? "").join(" \xB7 ");
        if (title) lines.push({ section, title, note });
      }
    }
    return lines;
  }
  function englishLines(v, place) {
    const was = uiLanguage();
    setUiLanguage("en");
    try {
      return drawnLines(v, place);
    } finally {
      setUiLanguage(was);
    }
  }
  function linesOf(v) {
    if (lineCache?.view === v) return lineCache.lines;
    const lines = [];
    const english = uiLanguage() !== "en";
    for (const place of SEARCHED) {
      if (place.sub && SUBS[place.sub].valid?.(v) === false) continue;
      const mine = drawnLines(v, place);
      const en2 = english ? englishLines(v, place) : [];
      const paired = en2.length === mine.length;
      mine.forEach((l, i) => {
        const e = paired ? en2[i] : void 0;
        lines.push({ place, ...l, en: e ? `${e.title} ${e.note}` : "" });
      });
    }
    lineCache = { view: v, lines };
    return lines;
  }
  var found = (v) => {
    const q = finding.trim().toLowerCase();
    return q ? linesOf(v).filter((l) => `${l.title} ${l.note}`.toLowerCase().includes(q) || l.en.toLowerCase().includes(q)) : [];
  };
  function whereOf(place) {
    const parent = PARENT[place.name];
    return [parent ? TITLES[parent] : "", TITLES[place.name], place.sub ? subTitle(place.sub) : ""].filter(Boolean).join(" \u203A ");
  }
  function marked(text, q) {
    const i = text.toLowerCase().indexOf(q);
    return i < 0 ? [text] : [text.slice(0, i), el("mark", {}, text.slice(i, i + q.length)), text.slice(i + q.length)];
  }
  function searchPage(v) {
    const q = finding.trim().toLowerCase();
    const hits = found(v);
    if (!hits.length) return [aside("search", q ? t("search.nothing", { q: finding.trim() }) : t("search.hint"))];
    const out = [];
    let last = "";
    for (const hit of hits) {
      const where2 = whereOf(hit.place);
      if (where2 !== last) out.push(grp(where2));
      last = where2;
      out.push(
        el(
          "button",
          { class: "row navc found", onclick: () => go(hit.place.name, hit.place.sub, hit.title) },
          el("div", { class: "l" }, el("span", {}, ...marked(hit.title, q)), hit.note ? el("small", {}, ...marked(hit.note, q)) : null),
          hit.section ? el("span", { class: "v" }, hit.section) : null,
          lucide("chevron-right", "chev")
        )
      );
    }
    return out;
  }
  function find(text) {
    finding = text;
    if (!view) return;
    if (!text.trim()) {
      if (open?.name === "search") back();
      return;
    }
    if (open?.name !== "search") return go("search");
    fillHeader();
    bodyPending = false;
    pBody.replaceChildren(...bodyOf(view));
  }
  function tryIt(text, how) {
    return el("div", { class: "try" }, el("p", {}, text), el("small", {}, how));
  }
  var KEY_USE = phrases({
    menuKey: "keys.useMenu",
    selectKey: "keys.useSelect",
    snipKey: "keys.useSnip",
    translateKey: "keys.useTranslate",
    textKey: "keys.useText",
    inPlaceKey: "keys.useInPlace",
    checkKey: "keys.useCheck",
    typeKey: "keys.useType",
    typeCheckKey: "keys.useTypeCheck",
    switchKey: "keys.useSwitch",
    fixKey: "keys.useFix",
    dictateKey: "keys.useDictate",
    englishKey: "keys.useEnglish",
    noteKey: "keys.useNote",
    againKey: "keys.useAgain",
    practiceKey: "keys.usePractice",
    talkKey: "keys.useTalk",
    meetingKey: "keys.useMeeting",
    shotKey: "keys.useShot",
    pauseKey: "keys.usePause",
    windowKey: "keys.useWindow"
  });
  function keyTakenBy(key, self) {
    const s = view?.settings;
    if (!s || !key) return void 0;
    const other = Object.keys(KEY_USE).find((n) => n !== self && s[n] === key);
    if (other) return KEY_USE[other];
    const layout = Object.entries(s.layoutKeys).find(([id, k]) => id !== self && k === key)?.[0];
    return layout ? t("keys.toLayout", { layout: view?.layouts.find((l) => l.id === layout)?.name ?? t("keys.aLayout") }) : void 0;
  }
  function saveKey(name, key) {
    if (key === COPY_TWICE2 && !COPY_TWICE_KEYS.includes(name)) {
      keyTrouble = { name, text: t("keys.copyTwiceOnly") };
      return renderBody();
    }
    const other = keyTakenBy(key, name);
    if (other) {
      keyTrouble = { name, text: t("keys.taken", { key: said(key), use: other }) };
      return renderBody();
    }
    keyTrouble = void 0;
    save({ [name]: key });
  }
  function keyRow(name, label, note, taken = false, iconName, extra) {
    const key = view?.settings[name] ?? "";
    const menu = menuNote(key);
    const node = keyRecorder(name, key, (key2) => saveKey(name, key2), label, menu ? `${note}; ${menu}` : note, taken, iconName, extra, DEFAULTS[name]);
    node.dataset.key = name;
    return node;
  }
  function menuNote(key) {
    if (/^(Left|Right)Alt(\*2)?$/.test(key)) return t("keys.menuAlt");
    if (/^(Left|Right)Super(\*2)?$/.test(key)) return t("keys.menuWin");
    if (key === "Control+Escape") return t("keys.menuCtrlEsc");
    return "";
  }
  function layoutKeyRow(l, label, note) {
    const keys = () => view?.settings.layoutKeys ?? {};
    const set = (key) => {
      const next = { ...keys() };
      if (key) next[l.id] = key;
      else delete next[l.id];
      save({ layoutKeys: next });
    };
    const saveIt = (key) => {
      if (key === COPY_TWICE2) {
        keyTrouble = { name: l.id, text: t("keys.copyTwiceOnly") };
        return renderBody();
      }
      const other = key ? keyTakenBy(key, l.id) : void 0;
      if (other) {
        keyTrouble = { name: l.id, text: t("keys.taken", { key: said(key), use: other }) };
        return renderBody();
      }
      keyTrouble = void 0;
      set(key);
    };
    return keyRecorder(l.id, keys()[l.id] ?? "", saveIt, label, note, false, "keyboard");
  }
  function keyRecorder(id, current2, saveKeyAs, label, note, taken = false, iconName, extra, byDefault = "") {
    const name = id;
    const recorder = new HotkeyRecorder();
    let waiting2;
    const field = el("button", {
      class: "krec",
      title: t("keys.recordTitle"),
      "aria-label": t("keys.aria", { label, key: current2 ? said(current2) : t("keys.notSet") })
    });
    const resting = () => current2 ? caps(current2) : el("span", { class: "link" }, t("keys.set"));
    field.append(resting());
    const showing = (...nodes) => field.replaceChildren(...nodes);
    const done2 = (key) => {
      window.clearTimeout(waiting2);
      field.blur();
      saveKeyAs(key);
    };
    const pressKeys = () => showing(el("span", { class: "key rec" }, t("keys.pressKeys")));
    const recorded = (r) => {
      if (!r) return;
      window.clearTimeout(waiting2);
      if (!r.more) return done2(r.hotkey);
      showing(caps(r.hotkey), el("span", { class: "x2" }, "\u2026"));
      waiting2 = window.setTimeout(() => r.partial ? pressKeys() : done2(r.hotkey), DOUBLE_MS);
    };
    const press2 = (code, at) => {
      if (code === "Escape" && !recorder.holding()) return field.blur();
      window.clearTimeout(waiting2);
      recorded(recorder.keydown(code, at));
    };
    const lift = (code, at) => recorded(recorder.keyup(code, at));
    const fromHook = (code, down, at) => {
      if (!field.isConnected || !field.classList.contains("recording")) return stopHook();
      if (down) press2(code, at);
      else lift(code, at);
    };
    const stopHook = () => {
      if (keyTarget !== fromHook) return;
      keyTarget = void 0;
      post({ type: "recordKeys", on: false });
    };
    const listen = () => {
      if (field.classList.contains("recording")) return;
      recorder.reset();
      field.classList.add("recording");
      pressKeys();
      keyTarget = fromHook;
      post({ type: "recordKeys", on: true });
    };
    field.addEventListener("focus", listen);
    field.addEventListener("click", () => (field.focus(), listen()));
    field.addEventListener("blur", () => {
      window.clearTimeout(waiting2);
      field.classList.remove("recording");
      showing(resting());
      stopHook();
    });
    field.addEventListener("keydown", (event) => {
      if (!field.classList.contains("recording")) return;
      event.preventDefault();
      if (event.repeat) return;
      press2(event.code, performance.timeOrigin + event.timeStamp);
    });
    field.addEventListener("keyup", (event) => {
      if (!field.classList.contains("recording")) return;
      event.preventDefault();
      lift(event.code, performance.timeOrigin + event.timeStamp);
    });
    field.addEventListener("mousedown", (event) => {
      if (document.activeElement !== field || event.button !== 3 && event.button !== 4) return;
      event.preventDefault();
      recorded(recorder.mouse(event.button));
    });
    field.addEventListener("mouseup", (event) => {
      if (event.button === 3 || event.button === 4) event.preventDefault();
    });
    const clear = current2 ? el(
      "button",
      {
        class: "kx",
        title: t("keys.clear"),
        "aria-label": t("keys.clearAria", { label }),
        onclick: () => {
          keyTrouble = void 0;
          saveKeyAs("");
        }
      },
      lucide("x", "s")
    ) : null;
    const restore = byDefault && current2 !== byDefault ? el(
      "button",
      {
        class: "kx",
        title: t("keys.backTo", { key: said(byDefault) }),
        "aria-label": t("keys.backToAria", { label, key: said(byDefault) }),
        onclick: () => {
          keyTrouble = void 0;
          saveKeyAs(byDefault);
        }
      },
      lucide("rotate-ccw", "s")
    ) : null;
    const trouble = keyTrouble?.name === name ? keyTrouble.text : "";
    const notes = typeof note === "string" ? [note] : note;
    const node = row(
      label,
      [...notes, taken && current2 ? bad(t("keys.takenProgram")) : null, trouble ? bad(trouble) : null],
      el("span", { class: "kchg" }, field, clear, restore, extra ?? null)
    );
    if (iconName) node.prepend(lucide(iconName));
    return node;
  }
  var fixedKey = (label, hotkey, note) => row(label, [note], caps(hotkey));
  var TRY_LISTEN = "The morning was quiet. A small boat drifted along the river, and two children watched the ducks from the bridge.";
  function cardPage(v) {
    const s = v.settings;
    return [
      toggleCard("volume-2", t("listen.autoRead"), s.autoRead, (autoRead) => save({ autoRead })),
      toggleCard("spell-check", t("listen.rareWords"), s.rareWords, (rareWords) => save({ rareWords })),
      toggleCard("list", t("listen.oneAtATime"), s.oneAtATime, (oneAtATime) => save({ oneAtATime })),
      card(
        "book-open",
        t("listen.wordHint"),
        [],
        select(
          s.wordHint,
          [
            ["shift", t("listen.hintShift")],
            ["hover", t("listen.hintHover")],
            ["off", t("listen.hintOff")]
          ],
          (wordHint) => save({ wordHint })
        )
      ),
      grp(t("listen.inCard")),
      fixedKey(t("translate.pasteBack"), "Enter"),
      card("play", t("listen.playKeys"), [], el("span", { class: "kg2" }, caps("Space"), caps("\u2190"), caps("\u2192"))),
      card("book-open", t("listen.clickWord"), [t("listen.clickWordNote")], null),
      card("languages", t("listen.clickSentence"), [t("listen.clickSentenceNote")], null),
      card("x", t("listen.closeCard"), [], caps("Esc"))
    ];
  }
  function screenHowPage() {
    return [
      card("scan", t("screen.draw"), [t("screen.drawNote")], null),
      card("type", t("screen.reads"), [t("screen.readsNote")], linkBtn(t("screen.languages"), () => post({ type: "openLanguageSettings" }))),
      card("spell-check", t("screen.fix"), [t("screen.fixNote")], null)
    ];
  }
  var TRY_TRANSLATE = {
    Russian: "\u041A\u043E\u043D\u0435\u0447\u043D\u043E, \u043F\u0440\u0438\u0448\u043B\u044E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D\u043D\u044B\u0435 \u043C\u0430\u043A\u0435\u0442\u044B \u0434\u043E \u0441\u043E\u0437\u0432\u043E\u043D\u0430.",
    Ukrainian: "\u0417\u0432\u0456\u0441\u043D\u043E, \u043D\u0430\u0434\u0456\u0448\u043B\u044E \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u0456 \u043C\u0430\u043A\u0435\u0442\u0438 \u0434\u043E \u0434\u0437\u0432\u0456\u043D\u043A\u0430."
  };
  function translatorChip(v) {
    const level = v.settings.translationLevel;
    const from = level === "fast" ? "Mozilla" : "Hugging Face";
    switch (v.translator) {
      case "ready":
        return [chip(t("translate.chipReady")), t("translate.readyNote", { level: levelName(level) })];
      case "absent":
        return [chip(t("translate.chipFirstUse"), "off"), t("translate.absentNote", { from })];
      case "downloading":
        return [chip(t("translate.chipDownloading")), t("translate.downloadingNote", { from })];
      case "failed":
        return [chip(t("translate.chipFailed"), "bad"), t("translate.failedNote")];
      case "unsupported":
        return [chip(t("translate.chipUnsupported"), "off"), t("translate.unsupportedNote")];
    }
  }
  var LEVEL_ABOUT = phrases({
    fast: "models.aboutFast",
    accurate: "models.aboutAccurateLevel",
    most: "models.aboutMostLevel"
  });
  var LEVEL_MODEL = {
    fast: "Firefox Translations",
    accurate: "Gemma 4 E4B",
    most: "Gemma 4 12B"
  };
  var FIT_WHERE = phrases({
    card: "models.onCard",
    part: "models.partlyOnCard",
    processor: "models.onProcessor"
  });
  var FIT_GUESS = phrases({
    card: "models.guessCard",
    part: "models.guessPart",
    processor: "models.guessProcessor"
  });
  var cudaGuess = () => t("models.cudaGuess");
  var cudaSize = () => t("models.cudaSize");
  var SLOW_SENTENCE_S = 2;
  var startText = (start3) => start3 !== void 0 ? `; ${t("models.starts", { time: seconds(start3) })}` : "";
  function cardText2(fit, card2) {
    if (fit.where === "processor") return null;
    return card2 !== void 0 ? t("models.cardHeld", { size: size(card2) }) : t("models.cardFrees");
  }
  function levelFitText(fit, speed) {
    const where2 = FIT_WHERE[fit.where];
    const measured = speed?.sentence === void 0 ? void 0 : { sentence: speed.sentence, start: speed.start };
    if (!measured) return fit.cuda ? `${cudaGuess()}, ${where2}` : fit.where === "card" ? `${FIT_GUESS.card} ${where2}` : `${FIT_GUESS[fit.where]}, ${where2}`;
    return `${t(measured.sentence > SLOW_SENTENCE_S ? "models.slowHere" : "models.here")}: ${t("models.perSentence", { time: seconds(measured.sentence) })}, ${where2}${startText(measured.start)}`;
  }
  var MODEL_ABOUT = phrases({
    accurate: "models.aboutAccurate",
    most: "models.aboutMost"
  });
  function llmFitText(fit, speed) {
    if (!speed || speed.sentence === void 0 && speed.text === void 0) return levelFitText(fit, speed);
    const times = [
      speed.sentence !== void 0 ? t("models.perSentence", { time: seconds(speed.sentence) }) : "",
      speed.text !== void 0 ? t("models.perCheck", { time: seconds(speed.text) }) : "",
      speed.reply !== void 0 ? t("models.perAnswer", { time: seconds(speed.reply) }) : ""
    ].filter(Boolean).join(", ");
    const slow = (speed.sentence ?? 0) > SLOW_SENTENCE_S || (speed.text ?? 0) > SLOW_CHECK_S;
    return `${t(slow ? "models.slowHere" : "models.here")}: ${times}, ${FIT_WHERE[fit.where]}${startText(speed.start)}`;
  }
  var pct = (progress) => el("span", { class: "pct" }, `${Math.round(progress * 100)}%`);
  function llmSizeNote(v, model, inUse) {
    const m = v.models[model];
    const size2 = size(m.size);
    if (m.status === "failed") return bad(t("models.failedRetry"));
    if (m.status === "ready") return t("models.onComputer", { size: size2 });
    if (m.status === "downloading") return t("models.downloadingSize", { size: size2 });
    return `${t(inUse ? "models.toDownloadFirst" : "models.toDownloadPicked", { size: size2 })}${translationAdvice(v.speech.device)[model].cuda ? ` (${cudaSize()})` : ""}`;
  }
  function llmChoice(v, model, on, pick, share) {
    const s = v.settings;
    const m = v.models[model];
    const advice = translationAdvice(v.speech.device);
    const fit = advice[model];
    const fetching = m.status === "downloading";
    const used = s.model === model || s.translationLevel === model;
    const notes = [
      `${MODEL_ABOUT[model]} (${LEVEL_MODEL[model]})`,
      llmFitText(fit, v.modelSpeed[model]),
      llmSizeNote(v, model, on),
      share,
      m.status === "ready" ? cardText2(fit, v.modelSpeed[model]?.card) : null,
      fetching ? bar(m.progress) : null
    ];
    const label = el("span", {}, levelName(model), advice.advised === model ? recommended() : null);
    const control = fetching ? pct(m.progress) : on && m.status !== "ready" ? linkBtn(t(m.status === "failed" ? "common.tryAgain" : "models.download"), () => post({ type: "useModel", model })) : null;
    const remove2 = m.status === "ready" && !used ? ib("x", t("models.remove", { level: levelName(model), size: size(m.size) }), () => post({ type: "removeStored", id: model })) : null;
    return radioRow(label, notes, on, pick, control, remove2);
  }
  function shareOffer(v) {
    const s = v.settings;
    const model = s.model;
    if (s.translationLevel !== "fast" || v.models[model].status !== "ready" || s.shareOfferSeen.includes(model)) return null;
    if (translationAdvice(v.speech.device)[model].slow) return null;
    const seen = () => save({ shareOfferSeen: [...s.shareOfferSeen, model] });
    const name = levelName(model);
    return el(
      "div",
      { class: "offer" },
      lucide("boxes"),
      el(
        "div",
        { class: "ot" },
        el("b", {}, t("translate.shareAsk", { model: name })),
        el("small", {}, t("translate.shareNote", { model: name, fast: levelName("fast") })),
        el(
          "span",
          { class: "acts" },
          btn(t("translate.shareUse", { model: name }), () => (post({ type: "translationLevel", level: model }), seen()), "primary"),
          linkBtn(t("common.notNow"), seen)
        )
      )
    );
  }
  function translateChoicePage(v) {
    const s = v.settings;
    const advice = translationAdvice(v.speech.device);
    const fast = v.translation.fast;
    const fetching = fast.status === "downloading";
    const fastRow = radioRow(
      el("span", {}, levelName("fast"), advice.advised === "fast" ? recommended() : null),
      [
        `${LEVEL_ABOUT.fast} (${LEVEL_MODEL.fast})`,
        fast.status === "failed" ? bad(t("models.fastFailed")) : fast.status === "ready" ? t("models.onThisComputer") : fetching || fast.status === "unsupported" ? null : t(s.translationLevel === "fast" ? "models.fastNext" : "models.fastPicked", { size: size(fast.size) }),
        t("models.draft", { accurate: levelName("accurate"), most: levelName("most") }),
        fetching ? bar(fast.progress) : null
      ],
      s.translationLevel === "fast",
      () => post({ type: "translationLevel", level: "fast" }),
      fetching ? pct(fast.progress) : null
    );
    const share = (model) => t(s.model !== model ? "models.checkMoves" : s.translationLevel === model ? "models.checkShares" : "models.checkAlready");
    return [
      shareOffer(v),
      grp(t("models.translateWith")),
      fastRow,
      ...["accurate", "most"].map((model) => llmChoice(v, model, s.translationLevel === model, () => post({ type: "translationLevel", level: model }), share(model)))
    ].filter((n) => n !== null);
  }
  function checkChoicePage(v) {
    const s = v.settings;
    const share = (model) => s.translationLevel === model ? t("models.translateShares") : s.translationLevel === "fast" ? t("models.translateStays", { fast: levelName("fast") }) : t("models.translateMoves");
    return [
      grp(t("models.checkWith")),
      ...["accurate", "most"].map((model) => llmChoice(v, model, s.model === model, () => post({ type: "useModel", model }), share(model))),
      aside("info", t("models.fastOnly", { fast: levelName("fast") }))
    ];
  }
  function speechChoicePage(v, feature) {
    const name = feature === "dictation" ? TITLES.voice : TITLES.recordings;
    const offer = engineRows(v, feature === "dictation" ? "Dictate" : "Transcribe");
    if (offer.length) return [grp(t("models.engine")), ...offer];
    return [
      testOffer(v),
      grp(t("models.speechWith", { name })),
      ...speechChoiceRows(v, feature),
      grp(t("models.options")),
      preferRow(v),
      gpuRow(v),
      feature === "transcripts" ? speakersCard(v, () => go("recordings", "speakers"), true) : null
    ].filter((n) => n !== null);
  }
  function voiceChoicePage(v) {
    const s = v.settings;
    const natural = recommend(v).voice.on;
    const rtf = v.natural.rtf;
    const slow = naturalOn(v) && rtf !== void 0 && rtf > 1;
    const windows = v.hostVoices.find((h) => /^en\b/i.test(h.lang))?.name;
    const noteOf = (value) => value === "" ? v.natural.status === "ready" ? t("models.naturalReady") : t("models.naturalLater") : value.startsWith(NATURAL_PREFIX) ? `${t("models.naturalNote")}${rtf && rtf <= 1 ? ` \xB7 ${t("models.naturalFaster", { n: Math.max(1, Math.round(1 / rtf)) })}` : ""}` : t("models.windowsNote");
    const rows = voiceOptions(v).map(([value, label]) => {
      const advised2 = value === "" ? natural : !natural && value === windows;
      return radioRow(el("span", {}, label, advised2 ? recommended() : null), [noteOf(value)], s.voice === value, () => save({ voice: value }));
    });
    return [
      grp(t("models.readWith")),
      ...rows,
      naturalRow(v),
      slow ? warn(t("models.naturalSlow")) : null
    ].filter((n) => n !== null);
  }
  var recommending = false;
  function recommendRows(v) {
    const close = () => (recommending = false, renderBody());
    if (!recommending)
      return [row(t("models.useRecommendedTitle"), [t("models.useRecommendedNote")], btn(t("models.useRecommended"), () => (recommending = true, renderBody()), "primary"))];
    const advice = recommendedModels(v);
    if (!advice.changes.length)
      return [el("div", { class: "row total" }, el("div", { class: "l" }, t("models.already"), el("small", {}, t("models.alreadyNote"))), linkBtn("OK", close))];
    const free = v.storage?.freeMb ?? v.speech.disk.freeMb;
    const needs = advice.download * 1.1;
    const short = advice.download > 0 && free > 0 && free < needs;
    const apply = btn(t("models.apply"), () => (recommending = false, post({ type: "useRecommended" }), renderBody()), "primary");
    apply.disabled = short;
    return [
      el(
        "div",
        { class: "row total" },
        el(
          "div",
          { class: "l" },
          t("models.changes"),
          ...advice.changes.map((c) => el("small", {}, el("b", {}, c.what), `: ${c.from} \u2192 ${c.to}${c.mb ? ` \xB7 ${t("models.toDownload", { size: size(c.mb) })}` : ""}`)),
          el(
            "small",
            {},
            `${advice.download ? t("models.toDownloadAll", { size: size(advice.download) }) : t("models.nothingToDownload")}${free > 0 ? ` \xB7 ${t("models.free", { size: size(free) })}` : ""} \xB7 ${t("models.nothingRemoved")}`
          ),
          short ? bad(t("models.needsFree", { size: size(needs) })) : null
        ),
        el("span", { class: "kchg" }, linkBtn(t("common.cancel"), close), apply)
      )
    ];
  }
  var cleaning;
  function refusedNote(v, p) {
    const r = v.storage?.refused?.find((r2) => r2.id === p.id && (r2.item ?? "") === (p.item ?? ""));
    return r ? bad(t("engine.notRemoved", { name: storedName(v, p), why: r.why })) : null;
  }
  function unusedNotice(v) {
    const parts = (v.storage?.parts ?? []).filter((p) => p.unused && p.bytes > 0);
    if (!parts.length) return null;
    const kept = cleaning ? [] : parts.map((p) => refusedNote(v, p));
    const mb = parts.reduce((n, p) => n + p.bytes / 1e6, 0);
    return el(
      "div",
      { class: "row notice old" },
      lucide("trash-2"),
      el("div", { class: "l" }, t("models.unused", { size: size(mb) }), el("small", {}, t("models.unusedNote", { list: parts.map((p) => storedName(v, p)).join(", ") })), ...kept),
      cleaning ? el("span", { class: "v" }, t("models.cleaning")) : btn(t("models.cleanUp"), () => (cleaning = "asked", post({ type: "cleanUp" }), renderBody()), "primary")
    );
  }
  function modelsPage(v) {
    return [
      grp(t("models.computer")),
      ...computerRows(v),
      testOffer(v),
      ...recommendRows(v),
      unusedNotice(v),
      grp(t("models.eachAction")),
      navCard("languages", TITLES.translate, t("models.translateNote"), levelValue(v), () => go("models", "forTranslate"), "forTranslate"),
      navCard("graduation-cap", t("models.checkTalk"), t("page.forCheckCap"), checkValue(v), () => go("models", "forCheck"), "forCheck"),
      navCard("mic", TITLES.voice, t("models.dictateNote"), speechValue(v, "dictation"), () => go("models", "forDictate"), "forDictate"),
      navCard("audio-lines", TITLES.recordings, t("models.transcribeNote"), speechValue(v, "transcripts"), () => go("models", "forTranscribe"), "forTranscribe"),
      speakersCard(v, () => go("recordings", "speakers"), true),
      navCard("volume-2", t("page.voice"), t("page.forVoiceCap"), voiceValue(v), () => go("models", "forVoice"), "forVoice"),
      aside("info", t("models.shared"))
    ].filter((n) => n !== null);
  }
  function stateText(m) {
    if (m.status === "downloading") return ` \xB7 ${t("models.stateDownloading", { pct: Math.round(m.progress * 100) })}`;
    if (m.status === "failed") return ` \xB7 ${t("models.stateFailed")}`;
    if (m.status === "ready") return ` \xB7 ${size(m.size)}`;
    return m.status === "unsupported" ? "" : ` \xB7 ${t("home.downloadsOnce")}`;
  }
  function levelValue(v) {
    const level = v.settings.translationLevel;
    return `${levelName(level)}${stateText(v.translation[level])}`;
  }
  function checkValue(v) {
    return `${levelName(v.settings.model)}${stateText(v.models[v.settings.model])}`;
  }
  function translatePage(v) {
    const s = v.settings;
    const [state, note] = translatorChip(v);
    const text = TRY_TRANSLATE[s.native] ?? "Of course, I will send the updated layouts before the call.";
    const how = s.translateKey ? t("translate.tryKey", { how: usage(s.translateKey) }) : t("translate.tryNone");
    const listenHow = s.selectKey ? t("listen.tryKey", { how: usage(s.selectKey) }) : t("listen.tryNone");
    return [
      shareOffer(v),
      tiles([{ icon: "history", title: TITLES.translations, count: v.translations.length || "", open: () => go("translations"), id: "translations" }]),
      grp(t("act.selected")),
      keyRow("translateKey", t("act.translate"), t("act.translateNote"), !v.keysOk.translate),
      keyRow("selectKey", t("act.listen"), t("act.listenNote"), !v.keysOk.select),
      keyRow("inPlaceKey", t("act.inPlace"), t("act.inPlaceNote"), !v.keysOk.inPlace),
      grp(t("act.screen")),
      keyRow("textKey", t("act.translate"), t("act.screenNote"), !v.keysOk.text),
      keyRow("snipKey", t("act.listen"), t("act.screenNote"), !v.keysOk.snip),
      navCard(null, t("screen.how"), t("act.screenHowNote"), null, () => openSub("screen"), "screen"),
      grp(t("act.own")),
      keyRow("typeKey", t("act.ownKey"), t("translate.typeNote"), !v.keysOk.type),
      grp(t("nav.settings")),
      speedCard(v),
      card("globe", pairOf(v), [note], state),
      languagesCard(v),
      navCard(null, t("listen.cardGroup"), t("act.cardNote"), null, () => openSub("card"), "card"),
      grp(t("act.try")),
      tryIt(text, how),
      tryIt(TRY_LISTEN, listenHow),
      enginePlate([
        { title: t("act.quality"), value: levelValue(v), open: () => go("models", "forTranslate") },
        { title: t("talkPage.voice"), value: voiceValue(v), open: () => go("models", "forVoice") }
      ])
    ].filter((n) => n !== null);
  }
  function translationsPage(v) {
    const list2 = v.translations;
    return [
      grp(TITLES.translations, list2.length || void 0, list2.length ? linkBtn(t("keys.clear"), () => post({ type: "clearTranslations" })) : null),
      list2.length ? lineList(
        list2.map((e) => ({
          text: e.text,
          more: e.translation,
          title: `${e.text}

${e.translation}

${whenSaid(e.at, Date.now())}`,
          open: () => copyText(e.translation),
          remove: () => post({ type: "forgetTranslation", at: e.at })
        }))
      ) : aside("info", t("translate.empty"))
    ];
  }
  var TRY_CHECK = "I want to learn English and can we made tutor option? I dictate or tupe in English and you show my my mistake.";
  var SLOW_CHECK_S = 4;
  var topicTitle = (id) => TOPICS.some((x) => x.id === id) ? t(`topic.${id}`) : id;
  function talkNotice(v) {
    const model = v.settings.model;
    const files = v.models[model];
    if (v.speech.device.at && translationAdvice(v.speech.device).accurate.where !== "card")
      return el("div", { class: "row notice" }, lucide("cpu"), el("div", { class: "l" }, t("talk.needsCard"), el("small", {}, t("talk.needsCardNote"))));
    if (files.status !== "ready") {
      const fetching = files.status === "downloading";
      return el(
        "div",
        { class: "row notice" },
        lucide("download"),
        el(
          "div",
          { class: "l" },
          t("talk.needsModel", { name: levelName(model), size: size(files.size) }),
          el("small", {}, fetching ? t("talkPage.downloading") : files.status === "failed" ? t("talk.downloadFailed") : t("talkPage.downloadOnce")),
          fetching ? bar(files.progress) : null
        ),
        fetching ? el("span", { class: "pct" }, `${Math.round(files.progress * 100)}%`) : btn(files.status === "failed" ? t("common.tryAgain") : t("settings.download"), () => post({ type: "useModel", model }), "primary")
      );
    }
    if (!installed(v))
      return el("div", { class: "row notice" }, lucide("mic"), el("div", { class: "l" }, t("talkPage.engineTitle"), el("small", {}, t("talkPage.engineNote"))), linkBtn(t("talkPage.openDictate"), () => go("voice")));
    return null;
  }
  var aboutTimer;
  function aboutField(value) {
    const field = el("textarea", {
      class: "field report about",
      rows: 3,
      maxlength: TALK_ABOUT_MAX,
      placeholder: t("talkPage.aboutPlaceholder"),
      "aria-label": t("talkPage.aboutYou"),
      "data-live": "about"
    });
    field.value = value;
    const store = () => {
      window.clearTimeout(aboutTimer);
      aboutTimer = void 0;
      if (field.value !== view?.settings.talkAbout) save({ talkAbout: field.value });
    };
    field.addEventListener("input", () => {
      window.clearTimeout(aboutTimer);
      aboutTimer = window.setTimeout(store, 600);
    });
    field.addEventListener("blur", () => aboutTimer !== void 0 && store());
    return field;
  }
  function englishPage(v) {
    const s = v.settings;
    const going = v.talk;
    const talkNote = [
      going ? t("talkPage.openGoing", { topic: topicTitle(going.topic), lines: t("talk.lines", { n: going.lines }) }) : t("act.talkNote"),
      installed(v) ? "" : t("talkPage.needsEngine")
    ].filter(Boolean).join("; ");
    const typed = s.typeCheckKey ? t("check.typedKey", { keys: usage(s.typeCheckKey) }) : t("check.typedTray");
    const how = s.checkKey ? t("check.tryKey", { keys: usage(s.checkKey), typed }) : t("check.tryNoKey", { typed });
    return [
      tiles([
        { icon: "book-open", title: TITLES.words, count: v.words.length || "", open: () => go("words"), id: "words" },
        { icon: "spell-check", title: TITLES.mistakes, count: v.mistakes.length || "", open: () => go("mistakes"), id: "mistakes" }
      ]),
      talkNotice(v),
      grp(t("act.talkGroup")),
      keyRow("talkKey", t("act.talk"), talkNote, !v.speech.keysOk.talk, void 0, btn(t("tray.open"), () => post({ type: "talkOpen" }), "primary")),
      row(
        t("talkPage.level"),
        [t(`talkPage.level${s.talkLevel}`)],
        seg(s.talkLevel, TALK_LEVELS.map((l) => [l, l]), (talkLevel) => save({ talkLevel }), true)
      ),
      navCard(null, t("talkPage.aboutYou"), null, s.talkAbout.trim() ? s.talkAbout.trim().slice(0, 32) : t("act.empty"), () => openSub("aboutYou"), "aboutYou"),
      navCard(null, t("act.talkWindow"), t("act.talkWindowNote"), null, () => openSub("talkWindow"), "talkWindow"),
      grp(t("page.checkEnglish")),
      keyRow("checkKey", t("check.keySelected"), t("act.checkNote"), !v.keysOk.check),
      keyRow("typeCheckKey", t("check.typeKey"), t("check.typeKeyNote"), !v.keysOk.typeCheck),
      keyRow("practiceKey", t("act.say"), installed(v) ? t("act.sayNote") : t("talkPage.needsEngine"), !v.speech.keysOk.practice),
      aside("info", t("check.speechNote")),
      grp(t("act.try")),
      tryIt(TRY_CHECK, how),
      enginePlate([
        { title: t("talkPage.model"), value: checkValue(v), open: () => go("models", "forCheck") },
        { title: t("talkPage.voice"), value: voiceValue(v), open: () => go("models", "forVoice") }
      ])
    ].filter((n) => n !== null);
  }
  function aboutYouPage(v) {
    return [el("div", { class: "row add" }, el("div", { class: "l" }, t("talkPage.aboutYou")), aboutField(v.settings.talkAbout), el("small", {}, t("talkPage.aboutNote")))];
  }
  function talkWindowPage(v) {
    const s = v.settings;
    return [
      toggleCard("volume-2", t("talkPage.aloud"), s.talkAloud, (talkAloud) => save({ talkAloud }), t("talkPage.aloudNote")),
      toggleCard("pin", t("talkPage.onTop"), s.talkOnTop, (talkOnTop) => save({ talkOnTop }), t("talkPage.onTopNote")),
      grp(t("talkPage.keys")),
      fixedKey(t("talkPage.spaceKey"), "Space"),
      fixedKey(t("talkPage.escKey"), "Escape"),
      grp(t("talkPage.kept")),
      aside("history", t("talkPage.history"))
    ];
  }
  var diffs = /* @__PURE__ */ new Map();
  function partsOf(e) {
    const key = `${e.text}\0${e.corrected}`;
    let parts = diffs.get(key);
    if (!parts) diffs.set(key, parts = wordDiff(e.text, e.corrected));
    return parts;
  }
  function changeText(wrong, right) {
    return el("span", { class: "said marks" }, wrong ? el("del", {}, wrong) : "+", " ", right ? el("ins", {}, right) : "");
  }
  function mistakesPage(v) {
    const counts = /* @__PURE__ */ new Map();
    for (const e of v.mistakes)
      for (const c of changesOf(partsOf(e))) {
        const key = c.wrong ? c.wrong.toLowerCase() : `+${c.right.toLowerCase()}`;
        const known = counts.get(key);
        if (known) known.rights.push(c.right);
        else counts.set(key, { wrong: c.wrong, rights: [c.right] });
      }
    const commonest = (rights) => rights.slice().sort((a, b) => rights.filter((r) => r === b).length - rights.filter((r) => r === a).length || a.length - b.length)[0] ?? "";
    const repeated = [...counts.values()].filter((c) => c.rights.length > 1).sort((a, b) => b.rights.length - a.rights.length).slice(0, 12).map((c) => ({ wrong: c.wrong, right: commonest(c.rights), n: c.rights.length }));
    const list2 = el("div", {});
    const fill = () => {
      const all = view?.mistakes ?? v.mistakes;
      const q = search.trim().toLowerCase();
      const shown2 = q ? all.filter((e) => `${e.text} ${e.corrected} ${e.note}`.toLowerCase().includes(q)) : all;
      list2.replaceChildren(
        shown2.length ? lineList(
          shown2.map((e) => ({
            text: el("span", { class: "marks" }, ...withMarks(partsOf(e))),
            more: e.note,
            title: [e.corrected, e.note, whenSaid(e.at, Date.now())].filter(Boolean).join("\n\n"),
            open: () => copyText(e.corrected),
            remove: () => post({ type: "forgetMistake", at: e.at }),
            removeLabel: t("mistakes.forget")
          }))
        ) : aside("info", all.length ? t("mistakes.noSuch") : t("mistakes.empty"))
      );
    };
    fill();
    return [
      ...repeated.length ? [grp(t("mistakes.repeat")), ...repeated.map((c) => row(changeText(c.wrong, c.right), [t("mistakes.times", { n: c.n })]))] : [],
      grp(t("mistakes.title"), v.mistakes.length || void 0, v.mistakes.length ? linkBtn(t("mistakes.clear"), () => post({ type: "clearMistakes" })) : null),
      ...v.mistakes.length ? [
        el(
          "div",
          { class: "tools" },
          el(
            "label",
            { class: "search" },
            icon("search"),
            el("input", {
              type: "search",
              placeholder: t("mistakes.search"),
              value: search,
              oninput: (event) => {
                search = event.target.value;
                fill();
              }
            })
          )
        )
      ] : [],
      list2
    ];
  }
  var pathNote2 = (path) => el("small", { class: "path", title: path }, el("bdi", {}, path));
  function kbRows(v) {
    const e = engineSettings(v);
    if (!running(v) || !e) return [card("folder", t("dictate.notesFolder"), [installed(v) ? t("dictate.folderShown") : t("dictate.folderChosen")], null)];
    const inbox = el("input", {
      type: "text",
      class: "field",
      value: e.kbInbox,
      placeholder: t("dictate.inboxPlaceholder"),
      "aria-label": t("dictate.inboxAria"),
      onkeydown: (event) => event.key === "Enter" && event.target.blur(),
      onchange: (event) => void saveEngine({ kbInbox: event.target.value.trim() })
    });
    return [
      card("folder", t("dictate.notesFolder"), [e.kbDir ? pathNote2(e.kbDir) : t("dictate.folderNone")], linkBtn(e.kbDir ? t("dictate.change") : t("dictate.choose"), () => void pickKb())),
      card("notebook-pen", t("dictate.subfolder"), [t("dictate.subfolderNote")], inbox)
    ];
  }
  function speechValue(v, feature) {
    if (!installed(v)) return t("dictate.needsEngine");
    const p = v.speech.plan[feature];
    const live = v.speech.health?.models[feature];
    const state = live?.name === p.chosen.model && live.state === "downloading" ? ` \xB7 ${t("check.downloadingPct", { pct: Math.round((live.progress ?? 0) * 100) })}` : "";
    return `${p.pinned ? p.chosen.label : t("dictate.automatic", { model: p.chosen.label })}${state}`;
  }
  var pathTail = (path) => path.split(/[\\/]/).filter(Boolean).slice(-2).join("\\");
  function voicePage(v) {
    const s = v.settings;
    const k = v.speech.keysOk;
    const offer = engineRows(v, "Dictate");
    const kb = engineSettings(v)?.kbDir;
    return [
      tiles([
        { icon: "whole-word", title: TITLES.vocabulary, count: s.vocabulary.length || "", open: () => go("vocabulary"), id: "vocabulary" },
        { icon: "message-square-text", title: TITLES.phrases, count: v.dictation.recent.length || "", open: () => go("phrases"), id: "phrases" },
        { icon: "folder", title: t("dictate.notesFolder"), sub: kb ? pathTail(kb) : t("act.notChosen"), open: () => openSub("notes"), id: "notes" },
        { icon: "pencil-line", title: t("edit.title"), sub: s.dictateEdit ? t(`edit.${s.dictateEditStyle}`) : t("edit.off"), open: () => openSub("edit"), id: "edit" }
      ]),
      ...offer.length ? [grp(t("dictate.engine")), ...offer] : [],
      testOffer(v),
      keyRow("dictateKey", t("dict.type"), t("dictate.typeNote"), !k.dictate),
      keyRow("englishKey", t("dict.english"), t("dictate.englishNote", { lang: languageName2(s.native) }), !k.english),
      keyRow("againKey", t("dictate.againKey"), t("dictate.againNote"), !k.again),
      keyRow("noteKey", t("dict.note"), t("dictate.noteNote"), !k.note),
      toggle(t("dictate.hold"), s.dictateHold, (dictateHold) => save({ dictateHold }), t("dictate.holdNote")),
      // On a Mac only the keyboard thread sees a key go up, and it waits for Accessibility (main.ts keysUnseen).
      s.dictateHold && (v.keyboardTrouble === "macAccess" || v.keyboardTrouble === "macInput") ? warn(t("dictate.holdMac"), " ", macLink(v.keyboardTrouble)) : null,
      toggle(t("dictate.panel"), s.dictationPanel, (dictationPanel) => save({ dictationPanel }), t("dictate.panelNote")),
      aside("info", t("dictate.escNote")),
      el("p", { class: "privacy" }, lucide("lock", "s"), t("dictate.privacy")),
      enginePlate([{ title: t("dictate.speechModel"), value: speechValue(v, "dictation"), open: () => go("models", "forDictate") }])
    ].filter((n) => n !== null);
  }
  var ownTimer;
  function ownField(value) {
    const field = el("textarea", {
      class: "field report about",
      rows: 3,
      maxlength: EDIT_OWN_MAX,
      placeholder: t("edit.ownPlaceholder"),
      "aria-label": t("edit.ownLabel"),
      "data-live": "editOwn"
    });
    field.value = value;
    const store = () => {
      window.clearTimeout(ownTimer);
      ownTimer = void 0;
      if (field.value !== view?.settings.dictateEditOwn) save({ dictateEditOwn: field.value });
    };
    field.addEventListener("input", () => {
      window.clearTimeout(ownTimer);
      ownTimer = window.setTimeout(store, 600);
    });
    field.addEventListener("blur", () => ownTimer !== void 0 && store());
    return field;
  }
  function editModelNotice(v) {
    const model = v.settings.model;
    const files = v.models[model];
    if (!v.settings.dictateEdit || files.status === "ready") return null;
    const fetching = files.status === "downloading";
    return el(
      "div",
      { class: "row notice" },
      lucide("download"),
      el(
        "div",
        { class: "l" },
        t("edit.needsModel", { name: levelName(model), size: size(files.size) }),
        el("small", {}, fetching ? t("talkPage.downloading") : files.status === "failed" ? t("talk.downloadFailed") : t("talkPage.downloadOnce")),
        fetching ? bar(files.progress) : null
      ),
      fetching ? el("span", { class: "pct" }, `${Math.round(files.progress * 100)}%`) : btn(files.status === "failed" ? t("common.tryAgain") : t("settings.download"), () => post({ type: "useModel", model }), "primary")
    );
  }
  function editPage(v) {
    const s = v.settings;
    const slow = translationAdvice(v.speech.device)[s.model].slow;
    return [
      toggleCard("pencil-line", t("edit.on"), s.dictateEdit, (dictateEdit) => save({ dictateEdit }), t(slow ? "edit.onNoteSlow" : "edit.onNote")),
      editModelNotice(v),
      grp(t("edit.style")),
      ...EDIT_STYLES.map((style) => radioRow(t(`edit.${style}`), [t(`edit.${style}Note`)], s.dictateEditStyle === style, () => save({ dictateEditStyle: style }))),
      s.dictateEditStyle === "own" ? el("div", { class: "row add" }, el("div", { class: "l" }, t("edit.ownLabel")), ownField(s.dictateEditOwn), el("small", {}, t("edit.ownHint"))) : null,
      aside("info", t("edit.keeps")),
      enginePlate([{ title: t("edit.model"), value: checkValue(v), open: () => go("models", "forCheck") }])
    ].filter((n) => n !== null);
  }
  function vocabularyPage(v) {
    const s = v.settings;
    const wordOf = (line) => parseEntry(line).word.toLowerCase();
    const word = liveField("word", t("vocab.wordPlaceholder"), t("vocab.wordAria"), (key) => key === "Enter" ? add() : clear());
    const heard2 = liveField("heard", t("vocab.heardPlaceholder"), t("vocab.heardAria"), (key) => key === "Enter" ? add() : clear());
    const clear = () => {
      word.value = "";
      heard2.value = "";
      word.focus();
    };
    const add = () => {
      const w = word.value.replace(/\s+/g, " ").trim();
      const h = heard2.value.replace(/\s+/g, " ").replace(/[()]/g, "").trim();
      if (!w) return word.focus();
      const line = h ? `${w} (${h})` : w;
      if (!parseEntry(line).word) return;
      const lines = (view?.settings.vocabulary ?? s.vocabulary).filter((l) => wordOf(l) !== w.toLowerCase());
      clear();
      save({ vocabulary: [...lines, line] });
    };
    const edit = (line) => {
      const { word: w, heard: hs } = parseEntry(line);
      word.value = w;
      heard2.value = hs.join(", ");
      word.focus();
    };
    const items = s.vocabulary.map((line) => {
      const { word: w, heard: hs } = parseEntry(line);
      return {
        text: w,
        more: hs.join(", "),
        title: t("vocab.change"),
        open: () => edit(line),
        remove: () => save({ vocabulary: (view?.settings.vocabulary ?? s.vocabulary).filter((l) => l !== line) })
      };
    });
    return [
      grp(t("vocab.addGroup")),
      el(
        "div",
        { class: "row add" },
        el("div", { class: "fields" }, word, heard2, btn([lucide("plus", "s"), t("vocab.add")], add, "primary")),
        el("small", {}, t("vocab.addNote"))
      ),
      grp(t("vocab.words"), items.length || void 0, items.length ? linkBtn(t("vocab.clearAll"), () => save({ vocabulary: [] })) : null),
      items.length ? wordChips(items) : aside("info", t("vocab.empty")),
      aside("info", t("vocab.shared"))
    ];
  }
  function recentPage(v) {
    const recent = v.dictation.recent;
    return [
      grp(t("dictate.phrases"), recent.length || void 0, recent.length ? linkBtn(t("mistakes.clear"), () => post({ type: "clearDictation" })) : null),
      recent.length ? lineList(
        recent.map((e) => ({
          text: e.text,
          more: whenSaid(e.at, Date.now()),
          title: e.heard ? `${e.text}

${t("dictate.said", { heard: e.heard })}` : e.text,
          open: () => copyText(e.text),
          remove: () => post({ type: "forgetPhrase", at: e.at })
        })),
        "time"
      ) : aside("info", t("dictate.recentEmpty"))
    ];
  }
  function whenSaid(iso, now) {
    const at = new Date(iso);
    const time = formatDate(at, { hour: "2-digit", minute: "2-digit" });
    const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((day(new Date(now)) - day(at)) / 864e5);
    if (days === 0) return time;
    if (days === 1) return t("dictate.yesterdayAt", { time });
    return `${formatDate(at, { day: "numeric", month: "short" })} ${time}`;
  }
  var copyText = (text) => void window.tutorHost.call({ call: "copy", text }).then(() => toast(t("dictate.copiedText", { text })), fault);
  function speakersCard(v, open2 = () => openSub("speakers"), quiet = false) {
    if (!installed(v)) return null;
    const s = v.speech;
    const title = t("transcribe.speakers");
    const note = t("transcribe.speakersNote");
    const work = s.pack.status === "installing" && s.pack.installing?.includes("speakers");
    if (work) return navCard("users", title, note, t("transcribe.downloading"), open2, "speakers");
    if (!hasPart(v, "speakers")) {
      const sz = s.speakers.sizes[s.speakers.on];
      return navCard("users", title, note, t("transcribe.notInstalled", { size: size(sz.download) }), open2, "speakers");
    }
    const onCard = (s.pack.speakersOn ?? "cpu") === "cuda";
    const onDevice = t(onCard ? "transcribe.onCard" : "transcribe.onCpu");
    if (!running(v)) return navCard("users", title, note, onDevice, open2, "speakers");
    const state = diarizationOf(v);
    const STATES = {
      ready: [t("transcribe.ready"), true],
      missing: [t("transcribe.keySaved"), true],
      checking: [t("transcribe.checking"), false],
      downloading: [t("transcribe.downloading"), false],
      "needs-token": [t("transcribe.needsKey"), false],
      "bad-token": [t("transcribe.keyFailed"), false],
      "no-access": [t("transcribe.noAccess"), false],
      failed: [t("transcribe.couldNotCheck"), false]
    };
    const [value, ok] = STATES[state];
    if (quiet) return navCard("users", title, note, ok ? onDevice : value, open2, "speakers");
    return navCard("users", title, note, ok ? `${value} \xB7 ${t(onCard ? "busy.card" : "busy.processor")}` : value, open2, "speakers", ok);
  }
  function recordingsPage(v) {
    const offer = engineRows(v, "Transcribe");
    const dataDir = v.speech.health?.dataDir;
    return [
      tiles([
        { icon: "file-audio", title: TITLES.transcripts, open: () => go("transcripts"), id: "transcripts" },
        { icon: "whole-word", title: TITLES.vocabulary, count: v.settings.vocabulary.length || "", open: () => go("vocabulary"), id: "vocabulary" }
      ]),
      ...offer.length ? [grp(t("dictate.engine")), ...offer] : [],
      testOffer(v),
      installed(v) ? callRow(v) : null,
      installed(v) ? callAutoRow(v) : null,
      keyRow("meetingKey", t("call.record"), t("call.keyNote"), !v.speech.keysOk.meeting),
      installed(v) ? toggleCard("camera", t("call.shots"), v.settings.callShots, (callShots) => save({ callShots }), t("call.shotsNote")) : null,
      installed(v) && v.settings.callShots ? toggleCard("camera", t("call.names"), v.settings.callNames, (callNames) => save({ callNames }), t("call.namesNote")) : null,
      keyRow("shotKey", t("call.shotKey"), t("call.shotKeyNote"), !v.speech.keysOk.shot),
      ...summarySettings(v),
      ...running(v) ? [grp(t("transcribe.new")), ...newRows(v)] : [],
      grp(t("transcribe.setup")),
      speakersCard(v),
      dataDir ? card("folder", t("transcribe.keptIn"), [pathNote2(dataDir)], linkBtn(t("tray.open"), () => post({ type: "openPath", path: dataDir }))) : null,
      enginePlate([{ title: t("dictate.speechModel"), value: speechValue(v, "transcripts"), open: () => go("models", "forTranscribe") }])
    ].filter((n) => n !== null);
  }
  function callRow(v) {
    const on = v.call.state !== "idle";
    const label = on ? t("call.stop") : t("call.record");
    return row(t("call.record"), [t("call.recordNote")], btn([el("i", { class: on ? "dot pulse" : "dot" }), label], () => post({ type: "toggleCall" }), on ? "primary" : "rec"));
  }
  function callAutoRow(v) {
    const names = [
      ["off", t("call.autoOff")],
      ["ask", t("call.autoAsk")],
      ["record", t("call.autoRecord")]
    ];
    return card("sparkles", t("call.auto"), [t("call.autoNote")], select(v.settings.callAuto, names, (callAuto) => save({ callAuto })));
  }
  function summarySettings(v) {
    const s = v.settings;
    const names = [
      ["general", t("sum.tGeneral")],
      ["standup", t("sum.tStandup")],
      ["interview", t("sum.tInterview")],
      ["lecture", t("sum.tLecture")],
      ["own", t("sum.tOwn")]
    ];
    return [
      grp(t("sum.title")),
      toggleCard("sparkles", t("sum.setAuto"), s.callSummaryAuto, (callSummaryAuto) => save({ callSummaryAuto }), t("sum.setAutoNote")),
      card("file-text", t("sum.setTemplate"), [t("sum.setTemplateNote")], select(s.callTemplate, names, (callTemplate) => save({ callTemplate }))),
      s.callTemplate === "own" ? el("div", { class: "row add" }, el("div", { class: "l" }, t("sum.tOwn")), summaryOwnField(s.callOwn)) : null,
      toggleCard("languages", t("sum.mine"), s.callSummaryMine, (callSummaryMine) => save({ callSummaryMine }), t("sum.setMineNote"))
    ].filter((n) => n !== null);
  }
  var summaryOwnTimer;
  function summaryOwnField(value) {
    const field = el("textarea", {
      class: "field report about",
      rows: 3,
      maxlength: SUMMARY_OWN_MAX,
      placeholder: t("sum.ownPlaceholder"),
      "aria-label": t("sum.tOwn"),
      "data-live": "callOwn"
    });
    field.value = value;
    const store = () => {
      window.clearTimeout(summaryOwnTimer);
      summaryOwnTimer = void 0;
      if (field.value !== view?.settings.callOwn) save({ callOwn: field.value });
    };
    field.addEventListener("input", () => {
      window.clearTimeout(summaryOwnTimer);
      summaryOwnTimer = window.setTimeout(store, 600);
    });
    field.addEventListener("blur", () => summaryOwnTimer !== void 0 && store());
    return field;
  }
  function layoutsPage(v) {
    const cycle = cycleOf(v);
    const ids = cycle.map((l) => l.id);
    const rest = v.layouts.filter((l) => !ids.includes(l.id));
    const own = v.settings.layouts.length > 0;
    const move2 = (id, to) => {
      const next = ids.filter((x) => x !== id);
      next.splice(to, 0, id);
      save({ layouts: next });
    };
    return [
      grp(t("kb.inOrder"), cycle.length),
      ...cycle.map(
        (l, i) => card(
          "keyboard",
          `${i + 1} \xB7 ${l.name}`,
          [l.short],
          el(
            "span",
            { class: "kchg" },
            ib("arrow-up", t("kb.earlier"), () => move2(l.id, i - 1), i === 0),
            ib("arrow-down", t("kb.later"), () => move2(l.id, i + 1), i === ids.length - 1),
            // The last one left cannot go: the keys need a layout to go to.
            linkBtn(t("kb.leaveOut"), () => save({ layouts: ids.filter((id) => id !== l.id) }), ids.length === 1)
          )
        )
      ),
      rest.length ? card(
        "plus",
        t("kb.addLayout"),
        [t("kb.addLayoutNote")],
        select("", [["", t("kb.pickLayout")], ...rest.map((l) => [l.id, l.name])], (id) => id && save({ layouts: [...ids, id] }))
      ) : null,
      aside("info", own ? t("kb.ownOrder") : t("kb.orderFromLanguages")),
      grp(t("kb.ownKey")),
      ...cycle.map((l) => layoutKeyRow(l, l.name, [t("kb.straight")]))
    ].filter((n) => n !== null);
  }
  function hearSwitch(name) {
    for (const [note, at] of [[1, 0], [2, 320]]) {
      setTimeout(() => void new Audio(`switch/${name}-${note}.wav`).play().catch(() => void 0), at);
    }
  }
  function fixingPage(v) {
    const s = v.settings;
    return [
      grp(t("kb.capitals")),
      toggleCard("type", t("kb.twoCaps"), s.fixTwoCaps, (fixTwoCaps) => save({ fixTwoCaps }), t("kb.twoCapsNote")),
      toggleCard("type", t("kb.capsLock"), s.fixCapsLock, (fixCapsLock) => save({ fixCapsLock }), t("kb.capsLockNote")),
      toggleCard("lock", t("kb.keepCaps"), s.keepCaps, (keepCaps) => save({ keepCaps }), t("kb.keepCapsNote")),
      grp(t("kb.when")),
      toggleCard("clock", t("kb.onPause"), s.fixOnPause, (fixOnPause) => save({ fixOnPause }), t("kb.onPauseNote")),
      toggleCard("volume-2", t("kb.sound"), s.fixSound, (fixSound) => save({ fixSound })),
      aside("info", t("kb.shortWords"))
    ];
  }
  function programsPage(v) {
    const s = v.settings;
    const apps = () => view?.settings.apps ?? s.apps;
    const add = (exe) => {
      if (!apps().some((a) => a.exe === exe)) save({ apps: [...apps(), { exe, off: ["fix"], layout: "" }] });
    };
    const known = new Set(s.apps.map((a) => a.exe));
    const running2 = runningApps.filter((exe) => !known.has(exe));
    const suggest = v.lastApp && !known.has(v.lastApp) ? v.lastApp : "";
    const addTyped = (field2) => {
      const name = field2.value.trim().toLowerCase();
      field2.value = "";
      if (name) add(/\.exe$/.test(name) ? name : `${name}.exe`);
    };
    const field = liveField("add", "program.exe", t("kb.addProgram"), (key, f) => key === "Enter" ? addTyped(f) : (f.value = "", f.blur()));
    return [
      grp(t("kb.addProgram")),
      el(
        "div",
        { class: "row add" },
        el("div", { class: "fields" }, field, btn([lucide("plus", "s"), t("vocab.add")], () => addTyped(field), "primary")),
        el("small", {}, t("kb.addProgramNote"))
      ),
      suggest ? card("plus", t("kb.addThis", { exe: suggest }), [t("kb.addThisNote")], btn(t("vocab.add"), () => add(suggest))) : null,
      running2.length ? card(
        "plus",
        t("kb.addRunning"),
        [t("kb.addRunningNote")],
        select("", [["", t("kb.pickProgram")], ...running2.map((exe) => [exe, exe])], (exe) => exe && add(exe))
      ) : null,
      grp(t("kb.programs"), s.apps.length || void 0),
      ...s.apps.length ? s.apps.map(
        (a) => navCard(
          "monitor",
          a.exe,
          programNote(v, a),
          null,
          () => {
            programOpen = a.exe;
            go("programs", "program");
          },
          `program-${a.exe}`
        )
      ) : [aside("info", t("kb.programsEmpty"))]
    ].filter((n) => n !== null);
  }
  var APP_PART_NAMES = { fix: t("kb.partFix"), switch: t("kb.partSwitch"), badge: t("kb.partBadge"), keys: t("kb.partKeys") };
  function programNote(v, a) {
    const off = a.off.length ? t("kb.leftOut", { parts: a.off.map((p) => APP_PART_NAMES[p]).join(", ") }) : "";
    const layout = a.layout ? t("kb.startsIn", { layout: v.layouts.find((l) => l.id === a.layout)?.name ?? a.layout }) : "";
    return [off, layout].filter(Boolean).join(" \xB7 ") || t("kb.nothingLeftOut");
  }
  function programPage(v) {
    const rule = v.settings.apps.find((a) => a.exe === programOpen);
    if (!rule) return [aside("info", t("kb.noLonger"))];
    const apps = () => view?.settings.apps ?? v.settings.apps;
    const change = (next) => save({ apps: apps().map((a) => a.exe === rule.exe ? { ...a, ...next } : a) });
    const part = (p, iconName, label, note) => toggleCard(iconName, label, !rule.off.includes(p), (on) => change({ off: on ? rule.off.filter((x) => x !== p) : [...rule.off, p] }), note);
    return [
      grp(t("kb.hereKryakl")),
      part("fix", "spell-check", t("kb.fixes"), t("kb.fixesNote")),
      part("switch", "keyboard", t("kb.switches"), t("kb.switchesNote")),
      part("badge", "type", t("kb.shows"), t("kb.partBadge")),
      part("keys", "circle-alert", t("kb.hears"), t("kb.hearsNote")),
      grp(t("kb.layout")),
      card(
        "globe",
        t("kb.startsInTitle"),
        [t("kb.startsInNote")],
        select(rule.layout, [["", t("kb.asItWas")], ...v.layouts.map((l) => [l.id, l.name])], (layout) => change({ layout }))
      ),
      card(
        "trash-2",
        t("kb.outOfList"),
        [t("kb.outOfListNote")],
        linkBtn(t("kb.remove"), () => {
          save({ apps: apps().filter((a) => a.exe !== rule.exe) });
          back();
        })
      )
    ];
  }
  function learnedPage(v) {
    const { alwaysFix, myWords } = v.learned;
    const forget = (list2, word) => () => post({ type: "unlearn", list: list2, word });
    return [
      toggleCard("sparkles", t("kb.learn"), v.settings.learn, (learn) => save({ learn }), t("kb.learnNote")),
      grp(t("kb.fixedAlways"), alwaysFix.length || void 0),
      alwaysFix.length ? wordChips(alwaysFix.map((w) => ({ text: w.word, more: languageName2(w.lang), title: t("kb.into", { lang: languageName2(w.lang) }), remove: forget("alwaysFix", w.word) })), "\u2192") : aside("info", t("kb.fixedAlwaysEmpty")),
      grp(t("act.newWords"), myWords.length || void 0),
      myWords.length ? wordChips(myWords.map((w) => ({ text: w.word, more: w.lang.toUpperCase(), title: t("kb.myWordNote", { lang: languageName2(w.lang) }), remove: forget("myWords", w.word) }))) : aside("info", t("kb.myWordsEmpty")),
      alwaysFix.length || myWords.length ? card("trash-2", t("kb.forgetAll"), [t("kb.forgetAllNote")], linkBtn(t("kb.forgetBtn"), () => post({ type: "forgetLearned" }))) : null
    ].filter((n) => n !== null);
  }
  function keptPage(v) {
    const s = v.settings;
    const words = () => view?.settings.keepWords ?? s.keepWords;
    return listPage({
      label: t("vocab.addGroup"),
      placeholder: t("kb.keptPlaceholder"),
      note: t("kb.keptAddNote"),
      items: s.keepWords,
      count: t("vocab.words"),
      empty: t("kb.keptEmpty"),
      normalize: keptForm,
      add: (word) => save({ keepWords: [...words(), word] }),
      remove: (word) => save({ keepWords: words().filter((w) => w !== word) })
    });
  }
  function othersLine(v) {
    const text = v.keyboardApps.length ? [t("kb.alsoUsing", { apps: v.keyboardApps.join(", ") }), v.foreignKeys ? t("kb.oneOfThem") : ""].filter(Boolean).join(" ") : v.foreignKeys ? t("kb.aProgram") : "";
    return text ? aside("info", text) : null;
  }
  function askRunningApps() {
    void window.tutorHost.call({ call: "runningApps" }).then((list2) => {
      runningApps = Array.isArray(list2) ? list2.filter((x) => typeof x === "string") : [];
      if (open?.name === "programs" && !open.sub) renderBody();
    }, fault);
  }
  function layoutPage(v) {
    const s = v.settings;
    const sample = sampleOf(s.native);
    const [typed = "", fixed = ""] = [sample.typed.split(" ")[0], sample.fixed.split(" ")[0]];
    const ownKeys = Object.keys(s.layoutKeys).length;
    const learnedCount = v.learned.alwaysFix.length + v.learned.myWords.length;
    const onOff = (on, key, label, has) => has ? el("span", { class: "tgwrap" }, toggleKnob(on, (next) => save({ [key]: next }), label)) : null;
    return [
      tiles([
        { icon: "lock", title: TITLES.kept, count: s.keepWords.length || "", open: () => go("kept"), id: "kept" },
        { icon: "brain", title: TITLES.learned, count: learnedCount || "", open: () => go("learned"), id: "learned" },
        { icon: "app-window", title: TITLES.programs, count: s.apps.length || "", open: () => go("programs"), id: "programs" }
      ]),
      grp(t("act.fixGroup")),
      keyRow("fixKey", t("kb.fixKey"), t("kb.fixKeyNote"), false, void 0, onOff(s.fixKeyOn, "fixKeyOn", t("kb.theFixKey"), !!s.fixKey)),
      toggleCard("spell-check", t("kb.autoFix"), s.autoFix, (autoFix) => save({ autoFix }), t("kb.autoFixNote", { typed, fixed })),
      s.autoFix ? navCard(null, t("kb.fixing"), t("kb.fixingNote"), null, () => openSub("fixing"), "fixing") : null,
      grp(t("act.switchGroup")),
      keyRow(
        "switchKey",
        t("kb.switchKey"),
        s.switchKey && isTap(s.switchKey) ? t("kb.switchTap") : t("kb.switchNote"),
        false,
        void 0,
        onOff(s.switchOn, "switchOn", t("kb.switchingByKeys"), !!s.switchKey || ownKeys > 0)
      ),
      navCard(null, TITLES.layouts, ownKeys ? t("kb.layoutsOwn", { n: ownKeys }) : t("kb.layoutsNote"), cycleOf(v).map((l) => l.short).join(" \xB7 "), () => go("layouts"), "layouts"),
      toggleCard("volume-2", t("kb.chime"), s.switchSound, (switchSound) => (switchSound && hearSwitch(s.switchSoundName), save({ switchSound })), t("kb.chimeNote")),
      s.switchSound ? card(
        "volume-2",
        t("kb.chimeName"),
        [t("kb.chimePick")],
        seg(
          s.switchSoundName,
          SWITCH_SOUNDS.map((n) => [n, t(`kb.chime.${n}`)]),
          (switchSoundName) => (hearSwitch(switchSoundName), save({ switchSoundName }))
        )
      ) : null,
      toggleCard("type", t("tray.layoutBadge"), s.layoutBadge, (layoutBadge) => save({ layoutBadge }), t("kb.badgeNote")),
      toggleCard("keyboard", t("tray.trayLayout"), s.trayLayout, (trayLayout) => save({ trayLayout }), t("kb.trayNote")),
      grp(t("act.general")),
      toggleCard("monitor", t("kb.fullScreen"), s.quietFullScreen, (quietFullScreen) => save({ quietFullScreen }), t("kb.fullScreenNote")),
      v.rivals.length ? warn(t("kb.rivals", { n: v.rivals.length, names: v.rivals.join(` ${t("common.and")} `) })) : null,
      v.elevatedApp ? warn(t("kb.elevated", { app: v.elevatedApp })) : null,
      // On a Mac the tap waits for Accessibility (kbdmac-worker.ts): said plainly, with the way there.
      v.keyboardTrouble === "macAccess" || v.keyboardTrouble === "macInput" ? warn(t(v.keyboardTrouble === "macInput" ? "kb.macInput" : "kb.macAccess"), " ", macLink(v.keyboardTrouble)) : v.keyboardTrouble ? warn(t("kb.trouble", { trouble: v.keyboardTrouble })) : null,
      othersLine(v),
      el("p", { class: "privacy" }, lucide("lock", "s"), t("kb.privacy"))
    ].filter((n) => n !== null);
  }
  var matches = (w, q) => `${w.word} ${w.base} ${w.sentence} ${w.senses.map((s) => s[1]).join(" ")}`.toLowerCase().includes(q);
  function wordChip(w) {
    const senses = w.senses.map(([pos, s]) => pos ? `${pos}: ${s}` : s).join("\n");
    return {
      text: w.base,
      more: w.senses[0]?.[1] ?? "",
      title: [w.word.toLowerCase() !== w.base.toLowerCase() ? t("word.from", { word: w.word }) : "", senses, w.sentence].filter(Boolean).join("\n\n"),
      remove: () => post({ type: "removeWord", id: w.id })
    };
  }
  function wordsPage(v) {
    const list2 = el("div", {});
    const fill = () => {
      const words = view?.words ?? v.words;
      const q = search.trim().toLowerCase();
      const shown2 = q ? words.filter((w) => matches(w, q)) : words;
      list2.replaceChildren(shown2.length ? wordChips(shown2.map(wordChip)) : aside("info", words.length ? t("words.noSuch") : t("words.empty")));
    };
    fill();
    const none = v.words.length === 0;
    return [
      el(
        "div",
        { class: "tools" },
        el(
          "label",
          { class: "search" },
          icon("search"),
          el("input", {
            type: "search",
            placeholder: t("words.search"),
            value: search,
            oninput: (event) => {
              search = event.target.value;
              fill();
            }
          })
        ),
        el("button", { class: "btn", disabled: none, onclick: () => post({ type: "exportWords" }) }, icon("export"), t("words.export")),
        el("button", { class: "btn", disabled: none, onclick: () => post({ type: "copyWords" }) }, icon("copy"), t("common.copy"))
      ),
      list2,
      aside("star", t("words.hint"))
    ];
  }
  function voiceOptions(v) {
    const options = [["", t("settings.automatic")]];
    if (v.natural.status === "ready") for (const voice of NATURAL_VOICES) options.push([NATURAL_PREFIX + voice.id, naturalLabel(voice)]);
    for (const h of v.hostVoices) if (/^en\b/i.test(h.lang)) options.push([h.name, h.name]);
    return options;
  }
  function naturalRow(v) {
    const n = v.natural;
    const download = (text) => linkBtn(text, () => post({ type: "downloadNatural" }));
    switch (n.status) {
      case "absent":
        return row(t("settings.natural"), [t("settings.naturalNote", { size: n.size })], download(t("settings.download")));
      case "failed":
        return row(t("settings.natural"), [bad(t("settings.downloadFailed"))], download(t("common.tryAgain")));
      case "downloading": {
        const bar2 = el("i", { class: "fill" });
        bar2.style.width = `${Math.round(n.progress * 100)}%`;
        return row(t("settings.natural"), [el("span", { class: "bar" }, bar2)], el("span", { class: "pct" }, `${Math.round(n.progress * 100)}%`));
      }
      default:
        return null;
    }
  }
  var STORED = {
    fast: { title: t("storage.fast"), note: t("storage.fastNote") },
    dict: { title: t("storage.dict"), note: t("storage.dictNote") },
    voice: { title: t("settings.natural"), note: t("storage.voiceNote") },
    accurate: { title: levelName("accurate"), note: t("storage.llmNote", { model: "Gemma 4 E4B" }) },
    most: { title: levelName("most"), note: t("storage.llmNote", { model: "Gemma 4 12B" }) },
    unused: { title: t("storage.unused"), note: t("storage.unusedNote") },
    llama: { title: t("storage.llama"), note: t("storage.llamaNote", { a: levelName("accurate"), b: levelName("most") }) },
    speechModel: { title: t("dictate.speechModel"), note: t("storage.speechModelNote") },
    speech: { title: t("storage.speech"), note: t("storage.speechNote") },
    gpu: { title: t("storage.gpu"), note: t("storage.gpuNote") },
    speakers: { title: t("transcribe.speakers"), note: t("storage.speakersNote") },
    yours: { title: t("storage.yours"), note: t("storage.yoursNote") },
    transcripts: { title: t("tray.transcripts"), note: t("storage.transcriptsNote") }
  };
  var MODEL_PARTS = ["fast", "dict", "voice", "accurate", "most", "unused", "speechModel"];
  var PROGRAM_PARTS = ["llama", "speech", "gpu", "speakers"];
  var DOWNLOADED = [...MODEL_PARTS, ...PROGRAM_PARTS];
  var downloadsMb = (s) => s.parts.filter((p) => DOWNLOADED.includes(p.id)).reduce((mb, p) => mb + p.bytes / 1e6, 0);
  var speechChoice = (v, name) => [...v.speech.plan.dictation.choices, ...v.speech.plan.transcripts.choices].find((c) => c.model === name);
  function storedName(v, p) {
    const title = STORED[p.id].title;
    if ((p.id === "fast" || p.id === "dict") && p.item) return `${title} \xB7 ${languageName2(p.item)}`;
    if (p.id === "speechModel") return speechChoice(v, p.item ?? "")?.label ?? p.item ?? title;
    if (p.id === "llama" && p.item === "cuda") return `${title} \xB7 NVIDIA`;
    return title;
  }
  function storedNote(v, p) {
    if (p.id === "speechModel") {
      const choice2 = speechChoice(v, p.item ?? "");
      return t("storage.speechToText", { about: choice2 ? aboutOf(choice2) : STORED.speechModel.note });
    }
    if (p.id === "llama" && p.item === "cuda") return t("storage.cudaNote");
    return STORED[p.id].note;
  }
  function lossOf(p) {
    switch (p.id) {
      case "accurate":
      case "most":
        return p.users?.includes("Translate") ? t("storage.lossTranslate") : t("storage.lossCheck");
      case "speech":
        return t("storage.lossSpeech");
      case "gpu":
        return t("storage.lossGpu");
      case "speakers":
        return t("storage.lossSpeakers");
      default:
        return t("storage.lossDefault");
    }
  }
  function removable(v, p) {
    const pack = v.speech.pack.status === "installing" || v.speech.pack.status === "removing";
    const live = (name) => [v.speech.health?.models.dictation, v.speech.health?.models.transcripts].some((m) => !!m && m.name === name && m.state === "downloading");
    switch (p.id) {
      case "fast":
        return v.translation.fast.status !== "downloading";
      case "dict":
        return v.dictionary.status !== "downloading";
      case "voice":
        return v.natural.status !== "downloading";
      case "accurate":
      case "most":
        return v.models[p.id].status !== "downloading";
      case "unused":
        return true;
      case "llama":
        return v.models.accurate.status !== "downloading" && v.models.most.status !== "downloading";
      case "speechModel":
        return !p.users?.length && !p.reserve && running(v) && !live(p.item);
      case "speech":
      case "gpu":
      case "speakers":
        return !pack && installed(v);
      default:
        return false;
    }
  }
  var USER_NAMES = { Translate: t("storage.userTranslate"), Listen: t("storage.userListen"), Check: t("storage.userCheck"), Dictate: t("storage.userDictate"), Transcribe: t("storage.userTranscribe") };
  var usersText = (names) => [...new Set(names.map((n) => USER_NAMES[n] ?? n))].join(` ${t("common.and")} `);
  var asking2 = "";
  function storedLine(v, p) {
    const key = `${p.id}:${p.item ?? ""}`;
    const label = el("span", {}, storedName(v, p), p.unused ? el("span", { class: "chip unused" }, t("storage.notUsed")) : null);
    const size2 = el("span", { class: "v num" }, size(p.bytes / 1e6));
    const where2 = p.away ? pathNote2(p.path) : null;
    if (p.id === "yours" || p.id === "transcripts") return row(label, [storedNote(v, p), where2], el("span", { class: "kchg" }, size2, linkBtn(t("tray.open"), () => post({ type: "openPath", path: p.path }))));
    const remove2 = () => {
      asking2 = "";
      post({ type: "removeStored", id: p.id, item: p.item });
    };
    if (asking2 === key) return row(label, [storedNote(v, p), bad(t("storage.removeAsk", { loss: lossOf(p) }))], el("span", { class: "kchg" }, size2, linkBtn(t("storage.keep"), () => (asking2 = "", renderBody())), btn(t("kb.remove"), remove2, "danger")));
    const used = p.users?.length ? t("storage.usedBy", { users: usersText(p.users) }) : p.reserve ? t("storage.reserve", { reserve: usersText(p.reserve.split(" and ")) }) : null;
    const shared = p.shared / 1e6;
    const freed = p.id === "speech" && shared >= 100 ? t("storage.frees", { free: size(p.bytes / 1e6 - shared), shared: size(shared) }) : null;
    const ask = !!p.users?.length || p.id === "speech";
    const x = removable(v, p) ? ib("x", ask ? t("storage.removeAskTitle") : t("storage.removeTitle"), () => ask ? (asking2 = key, renderBody()) : remove2()) : null;
    return row(label, [storedNote(v, p), used, freed, where2, refusedNote(v, p)], el("span", { class: "kchg" }, size2, x));
  }
  function storagePage(v) {
    const s = v.storage;
    if (!s?.parts.length) return [aside("loader", t("storage.measuring"))];
    const of = (ids) => s.parts.filter((p) => ids.includes(p.id) && p.bytes > 0).sort((a, b) => b.bytes - a.bytes);
    const models = of(MODEL_PARTS);
    const programs = of(PROGRAM_PARTS);
    const own = s.parts.filter((p) => p.id === "yours" || p.id === "transcripts");
    const away = [...models, ...programs].some((p) => p.away);
    return [
      oldNotice(v, s),
      unusedNotice(v),
      grp(t("storage.downloads")),
      row(
        t("storage.everything", { size: size(downloadsMb(s)) }),
        [t(away ? "storage.inFolderAway" : "storage.inFolder", { free: size(s.freeMb), drive: s.drive }), pathNote2(s.root)],
        linkBtn(t("storage.openFolder"), () => post({ type: "openPath", path: s.root }))
      ),
      grp(t("storage.models")),
      ...models.length ? models.map((p) => storedLine(v, p)) : [aside("info", t("storage.nothing"))],
      ...programs.length ? [grp(t("storage.programs")), ...programs.map((p) => storedLine(v, p))] : [],
      grp(t("storage.yoursGroup")),
      ...own.map((p) => storedLine(v, p))
    ].filter((n) => n !== null);
  }
  function oldNotice(v, s) {
    const away = s.parts.filter((p) => p.away);
    if (!s.old || !away.length) return null;
    const total = size(away.reduce((sum, p) => sum + p.bytes / 1e6, 0));
    const inOld = away.every((p) => p.path.toLowerCase().startsWith(s.old.dir.toLowerCase()));
    const names = away.map((p) => storedName(v, p)).join(", ");
    return el(
      "div",
      { class: "row notice old" },
      lucide("folder"),
      el(
        "div",
        { class: "l" },
        t(inOld ? "storage.inOld" : "storage.outside", { size: total }),
        el("small", {}, t("storage.usesThere", { names })),
        s.old.why ? el("small", { class: "bad" }, t("storage.notMoved", { why: s.old.why })) : null
      ),
      s.old.moving ? el("span", { class: "v" }, t("storage.moving")) : btn(t("storage.move"), () => post({ type: "moveToKryakl" }), "primary")
    );
  }
  var languageName2 = (code) => languageName(code);
  function languagesCard(v) {
    return navCard("globe", t("settings.languages"), t("settings.languagesNote"), myLanguages(v.settings).map(languageName2).join(", "), () => go("settings", "languages"), "languages");
  }
  function languagesPage(v) {
    const s = v.settings;
    const used = myLanguages(s);
    const rest = LANGUAGES.filter((l) => !used.includes(l.code));
    const mine = () => view?.settings.languages ?? s.languages;
    return [
      grp(t("settings.addLanguage")),
      card(
        "plus",
        t("settings.addLanguage"),
        [t("settings.addLanguageNote")],
        select("", [["", t("settings.pickLanguage")], ...rest.map((l) => [l.code, twoNames(languageName2(l.code), l.native)])], (code) => code && save({ languages: [...mine(), code] }))
      ),
      grp(t("settings.languagesGroup"), used.length),
      card("globe", languageName2(used[0] ?? ""), [t("settings.yourLangNote")], null),
      card("globe", languageName2("en"), [t("settings.englishNote")], null),
      ...s.languages.map((code) => card("globe", languageName2(code), [], ib("x", t("vocab.remove", { word: languageName2(code) }), () => save({ languages: mine().filter((c) => c !== code) }))))
    ];
  }
  function speedCard(v) {
    const s = v.settings;
    return card(
      "play",
      t("settings.speed"),
      [t("settings.speedNote")],
      seg(
        s.rate,
        RATES.map((r) => [r, String(r)]),
        (rate) => save({ rate }),
        true
      )
    );
  }
  function voiceValue(v) {
    const n = v.natural;
    if (n.status === "downloading") return t("settings.naturalDownloading", { pct: Math.round(n.progress * 100) });
    if (v.settings.voice === "") return t(naturalOn(v) ? "settings.autoNatural" : "settings.autoWindows");
    return voiceOptions(v).find(([value]) => value === v.settings.voice)?.[1] ?? t("settings.automatic");
  }
  var KEYBOARD = [
    ["Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Pause"],
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["LeftShift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RightShift"],
    ["LeftControl", "Super", "LeftAlt", "Space", "RightAlt", "RightControl"]
  ];
  var CAP_LABEL = { Escape: "Esc", Backspace: "\u232B", CapsLock: "Caps", LeftShift: "Shift", RightShift: "Shift", LeftControl: "Ctrl", RightControl: "Ctrl", Super: "Win", LeftAlt: "Alt", RightAlt: "Alt", Space: "" };
  var CAP_WIDE = { Backspace: "w2", Tab: "w15", CapsLock: "w2", Enter: "w2", LeftShift: "w25", RightShift: "w25", LeftControl: "w15", LeftAlt: "w15", RightAlt: "w15", RightControl: "w15", Space: "sp" };
  function capsOf(hotkey) {
    const out = [];
    for (const part of hotkey.replace(/\*2$/, "").split("+")) {
      if (part === "Control" || part === "Ctrl" || part === "Command") out.push("LeftControl", "RightControl");
      else if (part === "Shift") out.push("LeftShift", "RightShift");
      else if (part === "Alt" || part === "Option") out.push("LeftAlt", "RightAlt");
      else if (part === "LeftSuper" || part === "RightSuper" || part === "Meta") out.push("Super");
      else out.push(part.length === 1 ? part.toUpperCase() : part);
    }
    return out;
  }
  function keyboardMap(v) {
    const used = /* @__PURE__ */ new Map();
    for (const k of HOME_KEYS) for (const cap of new Set(capsOf(v.settings[k.key] || ""))) if (v.settings[k.key]) used.set(cap, (used.get(cap) ?? 0) + 1);
    return el(
      "div",
      { class: "kbmap", "aria-hidden": "true" },
      ...KEYBOARD.map(
        (row2) => el(
          "div",
          { class: "kbr" },
          ...row2.map((cap) => {
            const n = used.get(cap);
            return el("span", { class: ["kbc", CAP_WIDE[cap], n ? "used" : ""].filter(Boolean).join(" "), "data-n": n ? String(n) : void 0 }, CAP_LABEL[cap] ?? cap);
          })
        )
      )
    );
  }
  function keysPage(v) {
    const keys = HOME_KEYS.filter((k) => !k.speech || installed(v));
    const pages = [...new Set(keys.map((k) => k.page))];
    const ok = { pauseKey: v.keysOk.pause, windowKey: v.keysOk.window };
    return [
      keyboardMap(v),
      ...pages.flatMap((page) => [
        grp(page === "keys" ? t("act.general") : TITLES[page]),
        ...keys.filter((k) => k.page === page).map((k) => keyRow(k.key, t(k.title), k.section ? t(k.section) : "", ok[k.key] === false))
      ]),
      card("rotate-ccw", t("settings.resetKeys"), [t("settings.resetKeysNote")], linkBtn(t("main.resetKeys"), () => post({ type: "resetKeys" })))
    ];
  }
  function settingsPage(v) {
    const s = v.settings;
    const keys = HOME_KEYS.filter((k) => !k.speech || installed(v));
    return [
      tiles([
        { icon: "keyboard", title: TITLES.keys, count: keys.filter((k) => s[k.key]).length, open: () => go("keys"), id: "keys" },
        { icon: "boxes", title: TITLES.models, open: () => go("models"), id: "models" },
        { icon: "hard-drive", title: TITLES.storage, count: v.storage?.parts.length ? size(downloadsMb(v.storage)) : void 0, open: () => go("storage"), id: "storage" }
      ]),
      grp(t("act.general")),
      uiLanguageCard(s.uiLanguage, (uiLanguage2) => save({ uiLanguage: uiLanguage2 })),
      card(
        "languages",
        t("settings.yourLanguage"),
        [t("settings.yourLanguageNote")],
        select(
          s.native,
          v.languages.map((l) => [l.name, twoNames(l.native, languageName2(l.name))]),
          (native) => save({ native })
        )
      ),
      languagesCard(v),
      card(
        "monitor",
        t("settings.theme"),
        [],
        seg(
          s.theme,
          [
            ["system", t("settings.themeSystem")],
            ["light", t("settings.themeLight")],
            ["dark", t("settings.themeDark")]
          ],
          (theme) => save({ theme })
        )
      ),
      toggleCard("power", t("settings.startWithWindows"), s.startWithWindows, (startWithWindows) => save({ startWithWindows })),
      toggleCard("pause", t("settings.pause"), s.paused, (paused) => save({ paused }), t("settings.pauseNote")),
      // New versions are downloaded by hand from GitHub (the owner, 2026-10-30): nothing installs itself.
      card(
        "rotate-cw",
        t(v.dev ? "settings.versionDev" : "settings.version", { version: versionText(v.version) }),
        [v.dev ? t("settings.built", { build: v.build }) : t("settings.versionNote"), isBeta(v.version) ? t("settings.betaNote") : null],
        linkBtn(t("settings.newVersions"), () => post({ type: "openLink", url: RELEASES }))
      ),
      grp(t("settings.backup")),
      card(
        "file-text",
        t("settings.backupTitle"),
        [t("settings.backupNote")],
        el("span", { class: "kchg" }, linkBtn(t("settings.export"), () => post({ type: "exportBackup" })), linkBtn(t("main.import"), () => post({ type: "importBackup" })))
      ),
      aside("info", t("settings.importNote")),
      card("rotate-ccw", t("settings.resetAll"), [t("settings.resetAllNote")], linkBtn(t("main.reset"), () => post({ type: "resetSettings" })))
    ].filter((n) => n !== null);
  }
  var AUTHOR_LINKS = [
    ["Telegram", "https://t.me/designmakc"],
    ["GitHub", "https://github.com/designmakc"],
    ["Kryakl (Yevhen Peshynskyi)", "https://github.com/ikstro/kryakl"]
  ];
  var AUTHOR_MAIL = "designmakc@gmail.com";
  var CREDITS = "Firefox Translations (Mozilla) \xB7 Gemma 4 (Google) \xB7 llama.cpp \xB7 Whisper (OpenAI) \xB7 Parakeet (NVIDIA) \xB7 pyannote \xB7 Kokoro \xB7 eSpeak NG \xB7 Windows OCR \xB7 WikDict \xB7 FrequencyWords \xB7 Inter, JetBrains Mono \xB7 Electron \xB7 Lucide \xB7 VS Code icons";
  var linkChips = (links) => el(
    "div",
    { class: "links" },
    ...links.map(([text, url]) => el("a", { class: "lchip", href: url, onclick: (event) => (event.preventDefault(), post({ type: "openLink", url })) }, text, lucide("arrow-up-right")))
  );
  function aboutPage(v) {
    return [
      el("div", { class: "hero" }, tile(48), el("div", { class: "ht" }, logo(), el("small", {}, t("app.tagline")))),
      grp(t("about.story")),
      el("p", { class: "para" }, t("about.storyText")),
      grp(t("about.authorGroup")),
      row("Mykola Onykiichuk", [t("about.role")]),
      el("p", { class: "para" }, t("about.bio")),
      linkChips(AUTHOR_LINKS),
      row(t("about.mail"), [], el("span", { class: "kchg" }, el("span", { class: "mail" }, AUTHOR_MAIL), btn(t("about.write"), () => post({ type: "openLink", url: `mailto:${AUTHOR_MAIL}` })))),
      grp(t("app.name")),
      // A run from source says when it was built, so it is never taken for the last release.
      row(t("about.versionTitle"), [v.dev ? t("settings.built", { build: v.build }) : null], el("span", { class: "v" }, v.dev ? `${versionText(v.version)} dev` : versionText(v.version))),
      row(t("about.license"), [], el("span", { class: "v" }, t("about.licenseValue"))),
      row(t("about.offline"), [t("about.offlineNote"), `${t("about.online")} ${t("about.onlineList", { size: v.natural.size })}`]),
      row(t("about.bug"), [isBeta(v.version) ? t("about.bugNote") : null], btn(t("about.report"), () => go("report"))),
      linkChips([
        [t("about.newVersions"), RELEASES],
        [t("about.source"), "https://github.com/designmakc/tyts"],
        [t("about.licenses"), "https://github.com/designmakc/tyts/blob/main/NOTICE"]
      ]),
      grp(t("about.thanks")),
      el("p", { class: "para credits" }, CREDITS)
    ];
  }
  var reported;
  var reportText = () => pBody.querySelector('textarea[data-live="report"]')?.value ?? "";
  function reportPage(v) {
    const send = (via) => {
      reported = void 0;
      post({ type: "reportProblem", via, text: reportText() });
    };
    const field = el("textarea", {
      class: "field report",
      rows: 6,
      placeholder: t("report.placeholder"),
      "aria-label": t("report.what"),
      "data-live": "report"
    });
    const file = reported?.file;
    return [
      grp(t("report.what")),
      el("div", { class: "row add" }, field, el("small", {}, t("report.anyLanguage"))),
      grp(t("report.send")),
      row(t("report.email"), [t("report.emailNote", { email: REPORT_EMAIL })], btn([lucide("mail", "s"), t("report.emailBtn")], () => send("email"), "primary")),
      row(t("report.issue"), [t("report.issueNote")], btn([lucide("external-link", "s"), t("report.issueBtn")], () => send("github"))),
      file ? aside("circle-check", t("report.saved", { file: file.split("\\").pop() ?? file }), linkBtn(t("report.showInFolder"), () => post({ type: "showInFolder", path: file }))) : null,
      reported?.error ? warn(t("report.failed", { error: reported.error })) : null,
      grp(t("report.holds")),
      row(t("report.log"), [t("report.logNote")]),
      row(t("report.otherLogs"), [t("report.otherLogsNote")]),
      row(t("report.computer"), [t("report.computerNote")]),
      row(t("report.settings"), [t("report.settingsNote")]),
      aside("shield-check", t("report.never")),
      row(t("report.folder"), [t("report.folderNote")], linkBtn(t("tray.open"), () => post({ type: "openLogs" }))),
      ...installed(v) ? [grp(t("report.stopped")), restartRow(v)] : []
    ].filter((n) => n !== null);
  }
  function restartRow(v) {
    const sp = v.speech;
    const state = { off: t("report.stateOff"), starting: t("report.stateStarting"), ready: t(sp.health?.busy ? "report.stateBusy" : "report.stateRunning"), down: t("report.stateDown") }[sp.service];
    return row(t("report.restart"), [t("report.restartNote", { state }), sp.trouble ? bad(sp.trouble) : null], linkBtn(t("report.restartBtn"), () => post({ type: "restartSpeech" }), sp.pack.status !== "ready"));
  }
  var OLD_TABS = { talk: "english", check: "english", listen: "translate", screen: "translate", dictate: "voice", transcribe: "recordings", keyboard: "layout" };
  function showTab(tab) {
    if (tab === "checkModel") return go("models", "forCheck");
    if (tab !== "home" && tab !== "howto") {
      go(OLD_TABS[tab] ?? tab);
      if (tab === "vocabulary" || tab === "kept") pBody.querySelector("input[data-live]")?.focus();
      return;
    }
    visited.length = 0;
    closePage();
    fillHeader();
  }
  function start2(v) {
    if (!v.settings.setupDone) return;
    const asked = askedTab && askedTab !== "home" && askedTab !== "howto" ? askedTab : void 0;
    if (askedTranscript) return openTranscript(askedTranscript);
    if (asked) return showTab(asked);
    if (FROZEN_T !== void 0) return playMoment(false, FROZEN_T);
    if (v.settings.introSeen) return;
    if (reduced.matches) return save({ introSeen: true });
    playMoment(true);
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const m = event.data;
    if (m.type === "appTab") {
      if (view) showTab(m.tab);
      else askedTab = m.tab;
      return;
    }
    if (m.type === "openTranscript") {
      if (view) openTranscript(m.id);
      else askedTranscript = m.id, askedTab = "transcripts";
      return;
    }
    if (m.type === "appWindow") return windowState(m.maximized);
    if (m.type === "keyEvent") return keyTarget?.(m.code, m.down, m.at);
    if (m.type === "reported") {
      reported = { file: m.file, error: m.error };
      if (open?.name === "report") renderBody();
      return;
    }
    if (m.type !== "app") return;
    const first = view === void 0;
    view = m.view;
    if (cleaning === "asked" && m.view.storage?.measuring) cleaning = "measuring";
    else if (cleaning === "measuring" && !m.view.storage?.measuring) cleaning = void 0;
    if (m.view.speech.service !== "ready") forgetEngine();
    updateNav();
    if (!m.view.settings.setupDone) {
      closePage();
      if (moment) finishMoment();
      root.classList.add("setup");
      home.classList.add("setup");
      renderSetup();
      return;
    }
    if (root.classList.contains("setup")) {
      root.classList.remove("setup");
      home.classList.remove("setup");
      resetSetup();
      renderHome(true);
      if (!m.view.settings.introSeen) {
        if (reduced.matches) save({ introSeen: true });
        else playMoment(true);
      }
      return;
    }
    renderHome();
    fillHeader();
    renderBody();
    if (first) start2(m.view);
  });
  function renderSetup() {
    if (!view) return;
    home.replaceChildren(...setupNodes(view, { save, post, redraw: renderSetup }));
  }
  window.addEventListener("pointerdown", () => moment && moment.raf && finishMoment(), true);
  window.addEventListener("keydown", (event) => {
    if (moment?.raf) return finishMoment();
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      back();
    }
    if ((onMac2 ? event.metaKey : event.ctrlKey) && !event.altKey && !event.shiftKey && (event.key.toLowerCase() === "f" || event.key.toLowerCase() === "k") && !document.querySelector(".recording") && !root.classList.contains("setup")) {
      event.preventDefault();
      findField.focus();
      findField.select();
    }
  });
  onRedraw(() => {
    fillHeader();
    renderBody();
  });
  setTranscriptHooks({
    view: () => view,
    shown: () => open?.name === "transcripts",
    show: () => go("transcripts"),
    setup: () => go("recordings", "speakers")
  });
  post({ type: "appReady" });
  function macLink(trouble) {
    return trouble === "macInput" ? linkBtn(t("kb.macInputOpen"), () => post({ type: "openLink", url: "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent" })) : linkBtn(t("kb.macAccessOpen"), () => post({ type: "openLink", url: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility" }));
  }
})();
