import { ar } from './ar'
import { en } from './en'
import { fr } from './fr'
import { ja } from './ja'
import { ru } from './ru'
import type { Locale, Translations } from './types'
import { zh } from './zh'
import { zhHant } from './zh-hant'
import { pt } from './pt'

export const TRANSLATIONS: Record<Locale, Translations> = {
  en,
  zh,
  'zh-hant': zhHant,
  ja,
  ar,
  pt,
  fr,
  ru
}
