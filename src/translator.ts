// What the main process needs from the offline translator, whichever engine
// runs it: the models of a language pair, downloaded once, and sentences
// translated with them.

import type { Translate } from './translate'

export type TranslatorState = {
  status: 'absent' | 'downloading' | 'ready' | 'failed' | 'unsupported'
  /** 0..1 while downloading. */
  progress: number
  /** The download in MB. */
  size: number
}

export interface Translator {
  /** It translates between any two of its languages, not only to and from English. */
  readonly direct?: boolean
  /** How the models for translating between English and `native` (a language code) stand. */
  state(native: string): TranslatorState
  /** Downloads what is missing for the pair; resolves once it can translate. */
  prepare(native: string, onProgress: (state: TranslatorState) => void): Promise<void>
  translate: Translate
  dispose(): void
}
