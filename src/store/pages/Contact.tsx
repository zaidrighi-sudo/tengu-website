import { useMemo, useRef, useState } from "react"
import { ErrorSummary, SelectField, TextField } from "@/store/components/checkout/Field"
import { Icon } from "@/store/components/Icon"
import { Layout } from "@/store/components/Layout"
import { PageHead } from "@/store/components/page/PageHead"
import { useAuth } from "@/store/context/AuthContext"
import { sendMessage } from "@/app/(frontend)/actions"
import { contactEmail } from "@/store/data/settings"
import { type Errors, validateEmail } from "@/store/utils/checkout"
import { useFormErrors } from "@/store/utils/useFormErrors"
import { t, tr } from "@/store/i18n"

const topics = [
  "Order help",
  "Sizing advice",
  "Returns and exchanges",
  "Wholesale and stockists",
  "Press",
  "Something else",
].map((value) => ({ value, label: value }))

const MAX = 1000

export default function Contact() {
  const { user } = useAuth()
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [topic, setTopic] = useState("")
  const [order, setOrder] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState("")

  const errors = useMemo(() => {
    const e: Errors = {}
    if (!name.trim()) e["contact-name"] = "Enter your name."
    const emailError = validateEmail(email)
    if (emailError) e["contact-email"] = emailError
    if (!topic) e["contact-topic"] = "Choose what this is about."
    const trimmedOrder = order.trim()
    // Real orders are ORD-YYYYMMDD-XXXX; demo orders saved on this device are TG-123456.
    if (trimmedOrder && !/^(ORD-[0-9A-Z-]{4,}|(TG-)?\d{6})$/i.test(trimmedOrder))
      e["contact-order"] = "Order numbers look like ORD-20261117-AB3F."
    if (message.trim().length < 10) e["contact-message"] = "Tell us a little more, at least 10 characters."
    return e
  }, [name, email, topic, order, message])
  const { errorFor, touch, check, shown } = useFormErrors(errors, form)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !check()) return
    setBusy(true)
    setServerError("")
    const result = await sendMessage({ name, email, topic, orderNumber: order, message })
    setBusy(false)
    if (!result.ok) {
      setServerError(result.error)
      return
    }
    setSent(true)
    requestAnimationFrame(() => heading.current?.focus())
  }

  return (
    <Layout overlayHeader={false}>
      <div className="contact">
        <PageHead
          crumb={t("Contact")}
          eyebrow={t("Help")}
          title={t("Contact")}
          intro={t("Questions about an order, a fit or a collaboration. We read everything and reply within one business day.")}
        />

        <div className="contact-grid">
          {sent ? (
            <div className="contact-sent" role="status">
              <Icon name="check" />
              <h2 ref={heading} tabIndex={-1}>
                {t("Message received")}
              </h2>
              <p>
                {t("Thanks,")} {name.trim().split(" ")[0]}{t(". We will reply to")} <strong>{email.trim()}</strong> {t("within one business day.")}
              </p>
              
              <a className="btn" href="#/shop">
                {t("Back to the drop")} <Icon name="arrow" />
              </a>
            </div>
          ) : (
            <form ref={form} noValidate onSubmit={submit} className="acct-form contact-form" aria-label={t("Contact form")} aria-busy={busy}>
              <ErrorSummary errors={shown} />
              <div className="field-grid">
                <TextField id="contact-name" label={t("Name")} autoComplete="name" autoCapitalize="words" value={name} error={errorFor("contact-name")} onBlur={() => touch("contact-name")} onValueChange={setName} />
                <TextField id="contact-email" label={t("Email")} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} error={errorFor("contact-email")} onBlur={() => touch("contact-email")} onValueChange={setEmail} />
                <SelectField id="contact-topic" label={t("Topic")} className="span-2" value={topic} placeholder={t("Choose a topic")} options={topics} error={errorFor("contact-topic")} onBlur={() => touch("contact-topic")} onValueChange={setTopic} />
                <TextField id="contact-order" label={t("Order number")} optional className="span-2" placeholder={t("ORD-20261117-AB3F")} autoComplete="off" value={order} error={errorFor("contact-order")} hint={t("Helps us find your order faster.")} onBlur={() => touch("contact-order")} onValueChange={setOrder} />
                <div className={`field span-2${errorFor("contact-message") ? " has-error" : ""}`}>
                  <label className="field-label" htmlFor="contact-message">
                    {t("Message")}
                  </label>
                  <div className="field-control field-area">
                    <textarea
                      id="contact-message"
                      name="contact-message"
                      rows={6}
                      maxLength={MAX}
                      value={message}
                      aria-invalid={errorFor("contact-message") ? true : undefined}
                      aria-describedby={errorFor("contact-message") ? "contact-message-error" : "contact-message-count"}
                      onChange={(event) => setMessage(event.target.value)}
                      onBlur={() => touch("contact-message")}
                    />
                  </div>
                  {errorFor("contact-message") ? (
                    <p id="contact-message-error" className="field-error">
                      <Icon name="alert" />
                      <span>{errorFor("contact-message")}</span>
                    </p>
                  ) : (
                    <p id="contact-message-count" className="field-hint">
                      {message.length}/{tr(MAX)}
                    </p>
                  )}
                </div>
              </div>
              <div className="acct-form-actions">
                <p className="field-hint" role={serverError ? "alert" : undefined}>{serverError ? tr(serverError) : t("We read every message.")}</p>
                <button type="submit" className="btn btn-solid btn-lg" disabled={busy}>
                  {busy ? (
                    <>
                      <span role="status">{t("Sending…")}</span>
                      <span className="co-spinner" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      {t("Send message")} <Icon name="arrow" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <aside className="contact-aside" aria-label={t("Other ways to reach us")}>
            <div>
              <h2 className="about-h">{t("Write to us")}</h2>
              <a className="contact-mail" href={`mailto:${contactEmail()}`}>
                {contactEmail()}
              </a>
              <p>{t("Monday to Friday. Replies within one business day.")}</p>
            </div>
            <div>
              <h2 className="about-h">{t("Before you write")}</h2>
              <ul className="contact-links">
                <li><a href="#/faq">{t("Frequently asked questions")} <Icon name="arrow" /></a></li>
                <li><a href="#/shipping-returns">{t("Shipping and returns")} <Icon name="arrow" /></a></li>
                <li><a href="#/size-guide">{t("Size guide")} <Icon name="arrow" /></a></li>
              </ul>
            </div>
            <div>
              <h2 className="about-h">{t("Follow")}</h2>
              <a className="contact-mail" href="https://www.instagram.com/tengu_clthng/" target="_blank" rel="noopener noreferrer">
                {t("@tengu_clthng")}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
