import { LANGS, setLang, t, useLang } from "@/store/i18n"
import { cn } from "@/store/utils/cn"

/** EN / FR / ع toggle. Remembers the choice and flips the page to RTL for Arabic. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLang()
  return (
    <div
      className={cn("lang-switch", className)}
      role="group"
      aria-label={t("Language")}
    >
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          lang={lang.code}
          className={cn("lang-btn", lang.code === current && "is-active")}
          aria-pressed={lang.code === current}
          aria-label={lang.name}
          title={lang.name}
          onClick={() => setLang(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
