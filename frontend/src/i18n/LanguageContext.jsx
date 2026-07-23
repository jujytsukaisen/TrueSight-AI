import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import en from './en.json'
import ar from './ar.json'

const dictionaries = { en, ar }

const LanguageContext = createContext(null)

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = window.sessionStorage?.getItem?.('truesight-lang')
    return saved === 'ar' || saved === 'en' ? saved : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    try {
      window.sessionStorage?.setItem?.('truesight-lang', language)
    } catch {
      /* sessionStorage unavailable — not fatal, just won't persist */
    }
  }, [language])

  const value = useMemo(() => {
    const dict = dictionaries[language]
    const t = (path) => getByPath(dict, path) ?? path
    return {
      language,
      dir: language === 'ar' ? 'rtl' : 'ltr',
      isRtl: language === 'ar',
      setLanguage,
      toggleLanguage: () => setLanguage((l) => (l === 'en' ? 'ar' : 'en')),
      t,
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
