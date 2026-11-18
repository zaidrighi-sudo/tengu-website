import type { CSSProperties } from "react"
import { useState, type FormEvent } from "react"
import { Icon } from "@/store/components/Icon"
import { subscribe as subscribeOnServer } from "@/app/(frontend)/actions"
import { getLang, t } from "@/store/i18n"
import { localized, siteSettings } from "@/store/data/settings"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Bold, minimal signup: one oversized field and one button. */
export function NewsletterSignup() {
  if (!siteSettings.newsletterEnabled) return null

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!EMAIL.test(email.trim())) {
      setError("Enter a valid email address.")
      return
    }
    setError("")
    const result = await subscribeOnServer({ email: email.trim(), language: getLang() })
    if (result.ok) setDone(true)
    else setError(result.error)
  }

  return (
    <section className="signup" id="newsletter" aria-labelledby="signup-title">
      <div className="signup-inner">
        <p className="label" data-reveal>
          {localized(siteSettings.newsletterHeadline, t("05 — The list"))}
        </p>
        <h2 id="signup-title" className="signup-title" data-reveal>
          {localized(siteSettings.newsletterSubtext, t("First to know. First to wear."))}
        </h2>

        <div data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties}>
          {done ? (
            <p className="signup-done" role="status">
              {t("You are on the list. Watch your inbox.")}
            </p>
          ) : (
            <form className="signup-form" onSubmit={submit} noValidate>
              <label className="sr-only" htmlFor="signup-email">
                {t("Email address")}
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={localized(siteSettings.newsletterPlaceholder, t("Your email"))}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "signup-error" : "signup-hint"}
              />
              <button type="submit" className="btn btn-solid btn-lg">
                {localized(siteSettings.newsletterButtonText, t("Join"))} <Icon name="arrow" />
              </button>
              <p
                className="signup-msg"
                id={error ? "signup-error" : "signup-hint"}
                role={error ? "alert" : undefined}
              >
                {error || t("Drops, restocks, nothing else. Unsubscribe anytime.")}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
