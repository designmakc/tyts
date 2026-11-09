// Kryakl is a beta while its version is 0.x (the owner, 2026-11-03): the version is
// shown as "0.15.2 beta" wherever it shows, and 1.0 drops the word by itself.
import { t } from './i18n'

export function isBeta(version: string): boolean {
  return version.startsWith('0.')
}

/** The version as the pages show it: "0.15.2 beta" in a beta, the number alone after it. */
export function versionText(version: string): string {
  return isBeta(version) ? `${version} ${t('common.beta')}` : version
}
