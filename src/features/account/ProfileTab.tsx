import { useMemo, useRef, useState } from "react"
import { CheckField, ErrorSummary, PasswordField, TextField } from "@/features/checkout/Field"
import { Icon } from "@/store/components/Icon"
import { type User, useAuth } from "@/features/auth/AuthContext"
import { validatePassword } from "@/features/auth/utils"
import { type Errors, validateEmail, validatePhone } from "@/features/checkout/utils"
import { useFormErrors } from "@/shared/utils/useFormErrors"
import { t } from "@/shared/i18n"

export function ProfileTab({ user }: { user: User }) {
  return (
    <div className="profile-grid">
      <DetailsForm user={user} />
      <PasswordForm />
    </div>
  )
}

function DetailsForm({ user }: { user: User }) {
  const { updateProfile } = useAuth()
  const form = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    marketing: user.marketing,
  })
  const [serverError, setServerError] = useState<string>("")
  const [saved, setSaved] = useState(false)

  const errors = useMemo(() => {
    const e: Errors = {}
    if (!values.firstName.trim()) e["prof-first"] = "Enter your first name."
    if (!values.lastName.trim()) e["prof-last"] = "Enter your last name."
    const email = validateEmail(values.email)
    if (email) e["prof-email"] = email
    else if (serverError) e["prof-email"] = serverError
    const phone = validatePhone(values.phone)
    if (phone) e["prof-phone"] = phone
    return e
  }, [values, serverError])
  const { errorFor, touch, check, shown } = useFormErrors(errors, form)

  const set = (patch: Partial<typeof values>) => {
    setSaved(false)
    setServerError("")
    setValues((v) => ({ ...v, ...patch }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!check()) return
    const result = updateProfile({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    })
    if (result.ok) setSaved(true)
    else {
      setServerError(result.message)
      requestAnimationFrame(() => document.getElementById("prof-email")?.focus())
    }
  }

  return (
    <form ref={form} noValidate onSubmit={submit} className="acct-form" aria-labelledby="prof-title">
      <h2 id="prof-title" className="acct-form-title">
        {t("Your details")}
      </h2>
      <ErrorSummary errors={shown} />
      <div className="field-grid">
        <TextField id="prof-first" label={t("First name")} autoComplete="given-name" value={values.firstName} error={errorFor("prof-first")} onBlur={() => touch("prof-first")} onValueChange={(firstName) => set({ firstName })} />
        <TextField id="prof-last" label={t("Last name")} autoComplete="family-name" value={values.lastName} error={errorFor("prof-last")} onBlur={() => touch("prof-last")} onValueChange={(lastName) => set({ lastName })} />
        <TextField id="prof-email" label={t("Email")} className="span-2" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} readOnly hint={t("Your email is your login and cannot be changed here.")} value={values.email} error={errorFor("prof-email")} onBlur={() => touch("prof-email")} onValueChange={(email) => set({ email })} />
        <TextField id="prof-phone" label={t("Phone")} optional className="span-2" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} error={errorFor("prof-phone")} onBlur={() => touch("prof-phone")} onValueChange={(phone) => set({ phone })} />
      </div>
      <CheckField id="prof-marketing" label={t("Email me about new drops and restocks")} checked={values.marketing} onCheckedChange={(marketing) => set({ marketing })} />
      <div className="acct-form-actions">
        <p className="acct-saved" role="status">
          {saved && (
            <>
              <Icon name="check" /> {t("Details saved")}
            </>
          )}
        </p>
        <button type="submit" className="btn btn-solid">
          {t("Save changes")} <Icon name="arrow" />
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const form = useRef<HTMLFormElement>(null)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [serverError, setServerError] = useState("")
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const errors = useMemo(() => {
    const e: Errors = {}
    if (!current) e["pw-current"] = "Enter your current password."
    else if (serverError) e["pw-current"] = serverError
    const pw = validatePassword(next)
    if (pw) e["pw-new"] = pw
    if (!confirm) e["pw-confirm"] = "Repeat your new password."
    else if (confirm !== next) e["pw-confirm"] = "The passwords do not match."
    return e
  }, [current, next, confirm, serverError])
  const { errorFor, touch, check, reset, shown } = useFormErrors(errors, form)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !check()) return
    setBusy(true)
    const result = await changePassword(current, next)
    setBusy(false)
    if (result.ok) {
      setSaved(true)
      setCurrent("")
      setNext("")
      setConfirm("")
      reset()
    } else {
      setServerError(result.message)
      requestAnimationFrame(() => document.getElementById("pw-current")?.focus())
    }
  }

  return (
    <form ref={form} noValidate onSubmit={submit} className="acct-form" aria-labelledby="pw-title" aria-busy={busy}>
      <h2 id="pw-title" className="acct-form-title">
        {t("Password")}
      </h2>
      <ErrorSummary errors={shown} />
      <PasswordField id="pw-current" label={t("Current password")} autoComplete="current-password" value={current} error={errorFor("pw-current")} onBlur={() => touch("pw-current")} onValueChange={(v) => { setSaved(false); setServerError(""); setCurrent(v) }} />
      <PasswordField id="pw-new" label={t("New password")} autoComplete="new-password" hint={t("At least 8 characters, with a letter and a number.")} value={next} error={errorFor("pw-new")} onBlur={() => touch("pw-new")} onValueChange={(v) => { setSaved(false); setNext(v) }} />
      <PasswordField id="pw-confirm" label={t("Repeat new password")} autoComplete="new-password" value={confirm} error={errorFor("pw-confirm")} onBlur={() => touch("pw-confirm")} onValueChange={(v) => { setSaved(false); setConfirm(v) }} />
      <div className="acct-form-actions">
        <p className="acct-saved" role="status">
          {saved && (
            <>
              <Icon name="check" /> {t("Password updated")}
            </>
          )}
        </p>
        <button type="submit" className="btn btn-solid" disabled={busy}>
          {busy ? t("Updating…") : t("Update password")}
        </button>
      </div>
    </form>
  )
}
