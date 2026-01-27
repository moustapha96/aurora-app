import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations } from '@/locales';
import type { Language } from '@/types/language';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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
];

const defaultLanguage: Language = 'fr';

const getTranslation = (key: string, lang: Language): string => {
  return translations[lang]?.[key] || translations[defaultLanguage]?.[key] || translations['en']?.[key] || key;
};

const defaultLanguageContext: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key: string) => getTranslation(key, defaultLanguage),
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage;
  
  try {
    const saved = localStorage.getItem('aurora-language') as Language;
    if (saved && translations[saved]) return saved;
    
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) return browserLang;
  } catch (e) {
    // localStorage might not be available
  }
  
  return defaultLanguage;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem('aurora-language', language);
    } catch (e) {
      // localStorage might not be available
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context;
}
