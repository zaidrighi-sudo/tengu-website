"use client"

import { createContext, useContext, useEffect, ReactNode, useState } from "react"
import { setLang, getLang, type Lang } from "@/store/i18n"

const STORAGE_KEY = "tengu-lang"

interface LanguageContextValue {
  lang: Lang
  isReady: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
  initialLang: Lang
}

export function LanguageProvider({ children, initialLang }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize from localStorage or navigator on client
    // This runs after the first render, so we use the server-provided initialLang for the first render
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "en" || saved === "fr" || saved === "ar") {
        setLangState(saved)
        setLang(saved)
      } else {
        const browser = navigator.language?.slice(0, 2)
        const detected = browser === "ar" || browser === "fr" ? browser : "en"
        setLangState(detected)
        setLang(detected)
      }
    } catch {
      setLangState("en")
      setLang("en")
    }
    setIsReady(true)
  }, [])

  // Listen for language changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as Lang
        if (newLang !== getLang()) {
          setLangState(newLang)
          setLang(newLang)
        }
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, isReady }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}