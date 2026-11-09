// Tyts's interface in English, Ukrainian or Russian (2026-11-01, the owner:
// English by default, the others picked in Settings or the setup's first
// step). Every phrase a page or the main process shows is a key of en.ts,
// translated in uk.ts and ru.ts (a missing translation fails the typecheck).
// What Tyts teaches stays English whatever is picked: the duck's answers, the
// corrected text, the card's English half, the instructions to the models.
//
// A page learns its language from its address (`?lang=uk`, main.ts
// `pageQuery`) as this module loads, before any phrase is drawn, so a page's
// constants may call `t`; main sets it from the settings (`setUiLanguage`) and
// loads every window again when it changes. The main process must not keep a
// phrase in a constant made before the settings are read.

import { findLanguage } from '../languages'
import type { TranslationLevel } from '../settings'
import { en, type Key, type Phrase, type Plural } from './en'
import { ru } from './ru'
import { uk } from './uk'

export type UiLanguage = 'en' | 'uk' | 'ru'
export type { Key }

/** The interface languages, each named in itself, as Settings and the setup list them. */
export const UI_LANGUAGES: readonly { code: UiLanguage; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'uk', name: 'Українська' },
  { code: 'ru', name: 'Русский' },
]

const PHRASES: Record<UiLanguage, Record<Key, Phrase>> = { en, uk, ru }

export const isUiLanguage = (v: unknown): v is UiLanguage => v === 'en' || v === 'uk' || v === 'ru'

let current: UiLanguage = 'en'

/** The page's language from its address; the main process has no `location` and starts in English. */
if (typeof location !== 'undefined') {
  const asked = new URLSearchParams(location.search).get('lang')
  if (isUiLanguage(asked)) current = asked
  if (typeof document !== 'undefined') document.documentElement.lang = current
}

export function setUiLanguage(language: UiLanguage): void {
  current = language
}

export const uiLanguage = (): UiLanguage => current

const rules = new Map<UiLanguage, Intl.PluralRules>()
function pluralOf(n: number): Intl.LDMLPluralRule {
  let r = rules.get(current)
  if (!r) rules.set(current, (r = new Intl.PluralRules(current)))
  return r.select(n)
}

const onMac = typeof process !== 'undefined' && process.platform ? process.platform === 'darwin' : typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)

const isPlural =(p: Phrase): p is Plural => typeof p === 'object'

/**
 * The phrase for `key` in the interface's language, `{name}` replaced by
 * `vars.name`. A plural phrase takes its form from `vars.n` (one, few, many,
 * other: "1 слово", "2 слова", "5 слов").
 */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const p = PHRASES[current][key] ?? en[key]
  if (p === undefined) return key
  let s: string
  if (isPlural(p)) {
    const n = Number(vars?.n ?? 0)
    s = (p as Partial<Record<Intl.LDMLPluralRule, string>>)[pluralOf(n)] ?? p.other
  } else s = p
  // ponytail: on a Mac the phrases name macOS in place of Windows; Mac-only phrases when a step there differs (Windows settings paths, OCR)
  if (onMac && key !== 'kb.windowsOnly' && !s.includes('macOS')) s = s.replace(/Windows/g, 'macOS')
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole))
}

const displayNames = new Map<UiLanguage, Intl.DisplayNames | null>()

/**
 * A language's name in the interface's language, by its English name or code
 * ("Ukrainian" → "українська" in Ukrainian, "Ukrainian" in English); a
 * language Tyts does not know keeps the name given.
 */
export function languageName(nameOrCode: string): string {
  const language = findLanguage(nameOrCode)
  if (!language) return nameOrCode
  if (current === 'en') return language.name
  let names = displayNames.get(current)
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames([current], { type: 'language' })
    } catch {
      names = null
    }
    displayNames.set(current, names)
  }
  const name = names?.of(language.code)
  return name && name !== language.code ? name : language.name
}

/** A translation level's name (Fast, Accurate, Most accurate), the local model's too. */
export const levelName = (level: TranslationLevel): string => t(`level.${level}`)

const numbers = new Map<string, Intl.NumberFormat>()

/** A number with `digits` decimals as the interface's language writes it: "5.2" in English, "5,2" in Ukrainian and Russian. */
export function numberText(n: number, digits = 0): string {
  const id = `${current}:${digits}`
  let format = numbers.get(id)
  if (!format) numbers.set(id, (format = new Intl.NumberFormat(current, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false })))
  return format.format(n)
}

/** A size in MB as the pages write it: "84 MB", "5.2 GB". */
export function sizeText(mb: number): string {
  return mb >= 1000 ? t('size.gb', { n: numberText(Math.round(mb / 100) / 10, 1) }) : t('size.mb', { n: Math.max(1, Math.round(mb)) })
}

/** A time and date as the interface's language writes them. */
export function formatDate(d: Date, options: Intl.DateTimeFormatOptions): string {
  return d.toLocaleString(current === 'en' ? 'en-GB' : current, options)
}
