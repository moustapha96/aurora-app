import { fr } from './fr'
import { es } from './es'
import { de } from './de'
import { it } from './it'
import { pt } from './pt'
import { en } from './en'
import { ar } from './ar'
import { zh } from './zh'
import { ja } from './ja'
import { ru } from './ru'
import type { Language } from '../types/language'

export const translations: Record<Language, Record<string, string>> = {
  fr,
  en,
  es,
  de,
  it,
  pt,
  ar,
  zh,
  ja,
  ru,
}

export { fr, es, de, it, pt, en, ar, zh, ja, ru }
