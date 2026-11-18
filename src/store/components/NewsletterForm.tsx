import { type FormEvent, useState } from "react"
import { subscribe as subscribeOnServer } from "@/app/(frontend)/actions"
import { Icon } from "./Icon"
import { getLang, t, tr } from "@/store/i18n"

export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
    setBusy(true)
    const result = await subscribeOnServer({ email, language: getLang() })
    setBusy(false)
    if (result.ok) setSubscribed(true)
    else setError(result.error)
  }

  if (subscribed) {
    return (
      <p className="newsletter-success" role="status">
        {t("You are on the list.")}
      </p>
    )
  }

  return (
    <form className="newsletter-form" onSubmit={subscribe}>
      <label htmlFor="footer-email">{t("Email for early drops")}</label>
      <div className="newsletter-field">
        <input
          id="footer-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("you@example.com")}
          required
        />
        <button type="submit" disabled={busy} aria-label={t("Subscribe to the newsletter")}>
          <Icon name="arrow" />
        </button>
      </div>
      {error && <p role="alert" className="newsletter-error">{tr(error)}</p>}
    </form>
  )
}
