import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/locales'
import type { Language } from '@/types/language'

export type { Language }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const languages = [
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Português', flag: '🇵🇹' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
]

// Contexte avec valeurs par défaut pour éviter tout fallback/bruit console
const defaultLanguage: Language = 'fr'

const defaultLanguageContext: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key: string) => translations[defaultLanguage]?.[key] || translations['en']?.[key] || key
}

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aurora-language') as Language
      if (saved && translations[saved]) return saved
      const browserLang = navigator.language.split('-')[0] as Language
      if (translations[browserLang]) return browserLang
    }
    return defaultLanguage
  })

  useEffect(() => {
    localStorage.setItem('aurora-language', language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string): string => {
    return translations[language]?.[key] || translations[defaultLanguage]?.[key] || translations['en']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  return useContext(LanguageContext)
}
