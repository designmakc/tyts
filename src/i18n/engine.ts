// The speech engine answers in English: its API is shared with other programs
// (engine/app.py's docstring), so its words stay as they are. What a page shows
// of its refusals is put in the interface's language here, by their exact
// words (main.ts hands every host call's answer through `engineMessage`), and
// so are the engine's states main writes in English for its log (speechhost.ts
// view: the service's trouble, the install's failure, the speakers' key check);
// a message this table does not know is shown as it was written.

import { t, type Key } from './index'

const EXACT: Readonly<Record<string, Key>> = {
  'The speech engine is not running': 'engine.notRunning',
  'No sound': 'engine.noSound',
  'Too long for dictation: transcribe it instead': 'engine.tooLong',
  'No such dictation': 'engine.noDictation',
  'No downloaded model to test': 'engine.noModelToTest',
  'A test is running': 'engine.testRunning',
  'No such model': 'engine.noModel',
  'In use: the transcripts model': 'engine.usedByTranscripts',
  'In use: the dictation model': 'engine.usedByDictation',
  'In use: loaded': 'engine.usedLoaded',
  'In use: downloading': 'engine.usedDownloading',
  'In use: the speed test runs': 'engine.usedTest',
  'Paste a Hugging Face key first': 'engine.pasteKey',
  'Add a Hugging Face key first': 'engine.addKey',
  'No such transcript': 'engine.noTranscript',
  'This recording is still being transcribed': 'engine.stillTranscribing',
  'This recording is being transcribed right now': 'engine.transcribingNow',
  'A note has one voice': 'engine.oneVoice',
  'Install the speakers part first': 'engine.installSpeakers',
  'The sound of this recording was not kept': 'engine.soundNotKept',
  'This meeting can no longer be split: its words were not kept': 'engine.cannotSplit',
  'Only a failed transcription can be tried again': 'engine.onlyFailed',
  'The source sound is gone': 'engine.sourceGone',
  'Choose a knowledge base folder first': 'engine.chooseFolder',
  'File not found': 'engine.fileNotFound',
  'Not an audio or video file': 'engine.notMedia',
  'The recording is too large': 'engine.tooLarge',
  'The recording has ended': 'engine.ended',
  'Nothing to transcribe': 'engine.nothing',
  'The speech engine is not installed': 'engine.notInstalled',
  'An install is running': 'engine.installRunning',
  'Hugging Face answered with an error': 'engine.hfError',
  'No connection to Hugging Face': 'engine.hfOffline',
}

/** Messages with the engine's own reason in them, which stays as it is. */
const WITH_REASON: readonly [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Not a recording: (.+)$/s, m => t('engine.notRecording', { why: m[1] ?? '' })],
  [/^Could not recognize: (.+)$/s, m => t('engine.notRecognized', { why: m[1] ?? '' })],
  [/^Could not remove (\S+): (.+)$/s, m => t('engine.notRemoved', { name: m[1] ?? '', why: m[2] ?? '' })],
  [/^The speech engine keeps stopping \((.+?)\): see (.+)$/s, m => t('engine.keepsStopping', { code: m[1] ?? '', log: m[2] ?? '' })],
  [/^Port (\d+) is used by another program: quit it, then press Restart$/, m => t('engine.portTaken', { port: m[1] ?? '' })],
  [/^Ports (\d+)–(\d+) are all taken by other programs: quit one, then press Restart$/, m => t('engine.portsTaken', { from: m[1] ?? '', to: m[2] ?? '' })],
  [/^Installing the speech engine failed \((.+?)\): (.*)$/s, m => t('engine.installFailed', { code: m[1] ?? '', why: m[2] ?? '' })],
  [/^Could not unpack the Python manager: (.*)$/s, m => t('engine.unpackFailed', { why: m[1] ?? '' })],
  [/^Hugging Face answered (.+)$/s, m => t('engine.hfAnswered', { status: m[1] ?? '' })],
  [/^The download failed: (.+)$/s, m => t('engine.downloadFailed', { why: m[1] ?? '' })],
  [/^(.+) did not arrive whole$/s, m => t('engine.notWhole', { name: m[1] ?? '' })],
]

/** An engine's message in the interface's language, when it is one Kryakl knows. */
export function engineMessage(text: string): string {
  const key = EXACT[text]
  if (key) return t(key)
  for (const [pattern, say] of WITH_REASON) {
    const m = text.match(pattern)
    if (m) return say(m)
  }
  return text
}
