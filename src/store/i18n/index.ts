import { useSyncExternalStore } from "react"
import { ar } from "./ar"
import { fr } from "./fr"

export type Lang = "en" | "fr" | "ar"

export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "ar", label: "ع", name: "العربية" },
]

const STORAGE_KEY = "tengu-lang"
const dictionaries: Record<Lang, Record<string, string>> = { en: {}, fr, ar }

/** Current language - initialized to "en" for SSR consistency. Updated on client by LanguageProvider. */
let current: Lang = "en"
const listeners = new Set<() => void>()

const ARABIC_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap"

/** Arabic glyphs need a real typeface; load it only when Arabic is chosen. */
function ensureArabicFont() {
  if (typeof document === "undefined") return
  if (document.getElementById("font-arabic")) return
  const link = document.createElement("link")
  link.id = "font-arabic"
  link.rel = "stylesheet"
  link.href = ARABIC_FONT_HREF
  document.head.appendChild(link)
}

function applyToDocument() {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.lang = current
  root.dir = current === "ar" ? "rtl" : "ltr"
  if (current === "ar") ensureArabicFont()
}

export const getLang = () => current
export const isRtl = () => current === "ar"

export function setLang(next: Lang) {
  if (next === current) return
  current = next
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable */
    }
  }
  applyToDocument()
  listeners.forEach((listener) => listener())
}

/** Re-renders the caller whenever the language changes. */
export function useLang() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getLang,
    getLang,
  )
}

/**
 * Translate an English string. The English text is the key: anything without
 * an entry falls back to English. `{name}` placeholders are filled from `vars`.
 */
export function t(text: string, vars?: Record<string, string | number>) {
  const out = dictionaries[current][text] ?? text
  if (!vars) return out
  return out.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** BCP 47 locale for Intl formatters. */
export const locale = () =>
  current === "ar" ? "ar-DZ-u-nu-latn" : current === "fr" ? "fr-FR" : "en-US"

/**
 * Translate a value only when it is a string. Used where text comes from data
 * (labels, FAQ copy, validation messages) and may be a number or element.
 */
export const tr = <T>(value: T): T =>
  (typeof value === "string" ? (t(value) as unknown as T) : value)

/** Lazy date formatter: picks up the current language each time it formats. */
export const dateFormatter = (options: Intl.DateTimeFormatOptions) => ({
  format: (date: Date) => new Intl.DateTimeFormat(locale(), options).format(date),
})