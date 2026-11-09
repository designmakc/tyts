// What to tell a person whose computer has no voice for the language they
// learn: where the system adds one. Voices are read once when Kryakl starts,
// so a new one shows up after a restart.

import { t } from '../i18n'

export function voiceSteps(language: string, platform: string): string {
  switch (platform) {
    case 'win32':
      return t('voice.stepsWin', { lang: language })
    case 'darwin':
      return t('voice.stepsMac', { lang: language })
    case '':
      return ''
    default:
      return t('voice.none')
  }
}

/** Whether the host can open the system's speech settings for the person. */
export function canOpenSpeechSettings(platform: string): boolean {
  return platform === 'win32' || platform === 'darwin'
}
