import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  CheckField,
  ErrorSummary,
  PasswordField,
  TextField,
} from "@/features/checkout/Field"
import { Hanko } from "@/features/shell/Hanko"
import { Icon } from "@/shared/components/Icon"
import { TenguMark } from "@/features/shell/TenguMark"
import { useAuth } from "@/features/auth/AuthContext"
import { photos } from "@/features/products/products"
import {
  passwordRules,
  passwordStrength,
  strengthLabels,
  validatePassword,
} from "@/features/auth/utils"
import { type Errors, validateEmail } from "@/features/checkout/utils"
import { cn } from "@/shared/utils/cn"
import { parseHash, replaceHash, safeNext, useHash } from "@/shared/utils/useHash"
import { useFormErrors } from "@/shared/utils/useFormErrors"
import { t, tr } from "@/shared/i18n"
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher"
import { StoreImage } from "@/shared/components/StoreImage"

type Mode = "login" | "register" | "forgot"

const visuals: Record<Mode, { src: string; quote: string[]; caption: string }> = {
  login: {
    src: photos.lookA,
    quote: ["Dark by design.", "Loud by accident."],
    caption: "Fig. 01 — Shibuya, 02:14",
  },
  register: {
    src: photos.lookD,
    quote: ["Teacher of those", "who never ask."],
    caption: "Fig. 04 — Quiet hours",
  },
  forgot: {
    src: photos.lookB,
    quote: ["Even the mountain", "forgets the way."],
    caption: "Fig. 02 — Last train",
  },
}

export const Login = () => <Auth mode="login" />
export const Register = () => <Auth mode="register" />
export const Forgot = () => <Auth mode="forgot" />

function Auth({ mode }: { mode: Mode }) {
  const { user, gate } = useAuth()
  const hash = useHash()
  const params = parseHash(hash).params
  const next = safeNext(params.get("next"))
  const visual = visuals[mode]

  // Already signed in: nothing to do here.
  useEffect(() => {
    // Skip once the hash has already moved on (this page may render once more before unmounting).
    if (user && /^#\/(login|register|forgot)/.test(window.location.hash)) replaceHash(next)
  }, [user, next])

  const suffix = params.get("next")
    ? `?next=${encodeURIComponent(params.get("next") as string)}`
    : ""

  return (
    <div className="auth">
      <a className="skip-link" href="#main">
        {t("Skip to content")}
      </a>

      <aside className="auth-visual" aria-hidden="true">
        <StoreImage className="photo" src={visual.src} alt="" sizes="100vw" />
        <div className="auth-visual-shade" />
        <a className="brand auth-visual-brand" href="#/" tabIndex={-1}>
          <TenguMark />
        </a>
        <div className="auth-visual-copy">
          <p className="auth-quote">
            {visual.quote.map((line) => (
              <span key={line}>{tr(line)}</span>
            ))}
          </p>
          <p className="label">{tr(visual.caption)}</p>
        </div>
      </aside>

      <main id="main" className="auth-panel">
        <div className="auth-top">
          <a className="brand auth-brand" href="#/" aria-label={t("Tengu, home")}>
            <TenguMark />
          </a>
          {gate && <LanguageSwitcher />}
          <a className="co-link" href="#/shop">
            <Icon name="arrow" /> {t("Back to store")}
          </a>
        </div>

        <div className="auth-card">
          {mode !== "forgot" && (
            <nav className="auth-tabs" aria-label={t("Account")}>
              <a
                href={`#/login${suffix}`}
                aria-current={mode === "login" ? "page" : undefined}
              >
                {t("Sign in")}
              </a>
              <a
                href={`#/register${suffix}`}
                aria-current={mode === "register" ? "page" : undefined}
              >
                {t("Create account")}
              </a>
            </nav>
          )}
          {mode === "login" && <LoginForm next={next} suffix={suffix} defaultEmail={params.get("email") ?? ""} />}
          {mode === "register" && <RegisterForm next={next} defaultEmail={params.get("email") ?? ""} />}
          {mode === "forgot" && <ForgotForm suffix={suffix} />}

          <p className="auth-demo">
            <Icon name="lock" />
            {t("Demo store: accounts are saved on this device only.")}
          </p>
        </div>
      </main>
    </div>
  )
}

function Heading({ children, intro }: { children: string; intro: string }) {
  return (
    <>
      <h1 className="auth-title">{children}</h1>
      <p className="auth-intro">{tr(intro)}</p>
    </>
  )
}

/* ---------- Google OAuth (sign in + sign up share the same flow) ---------- */
function GoogleAuthButton({ next, disabled }: { next: string; disabled?: boolean }) {
  const { loginWithGoogle } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  const handleClick = async () => {
    setRedirecting(true)
    const result = await loginWithGoogle(next)
    if (!result.ok) setRedirecting(false)
  }

  const isBusy = Boolean(disabled || redirecting)

  return (
    <button
      type="button"
      className="btn btn-outline btn-lg auth-google"
      onClick={handleClick}
      disabled={isBusy}
      aria-busy={isBusy}
    >
      {isBusy ? (
        <>
          <span role="status">{t("Redirecting…")}</span>
          <span className="co-spinner" aria-hidden="true" />
        </>
      ) : (
        <>
          <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("Continue with Google")}
        </>
      )}
    </button>
  )
}

function GoogleAuthDivider() {
  return (
    <div className="auth-divider">
      <span>{t("or continue with")}</span>
    </div>
  )
}

/* ---------- Sign in ---------- */
function LoginForm({ next, suffix, defaultEmail }: { next: string; suffix: string; defaultEmail: string }) {
  const { login } = useAuth()
  const form = useRef<HTMLFormElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState("")

  const errors = useMemo(() => {
    const e: Errors = {}
    const emailError = validateEmail(email)
    if (emailError) e["login-email"] = emailError
    if (!password) e["login-password"] = "Enter your password."
    return e
  }, [email, password])
  const { errorFor, touch, check, shown } = useFormErrors(errors, form)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !check()) return
    setBusy(true)
    setFailure("")
    const result = await login(email, password, next)
    if (!result.ok) {
      setBusy(false)
      setFailure(result.message)
      requestAnimationFrame(() => alert.current?.focus())
    }
    // AuthContext.login handles the redirect (including next parameter for customer login)
  }

  return (
    <>
      <Heading intro={t("Sign in to track orders, save pieces and check out faster.")}>
        {t("Welcome back")}
      </Heading>
      <form ref={form} noValidate onSubmit={submit} className="auth-form" aria-busy={busy}>
        <ErrorSummary errors={shown} />
        {failure && (
          <div className="co-alert" role="alert" tabIndex={-1} ref={alert}>
            <Icon name="alert" />
            <div>
              <strong>{t("Could not sign you in")}</strong>
              <p>{tr(failure)}</p>
            </div>
          </div>
        )}
        <TextField
          id="login-email"
          label={t("Email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          error={errorFor("login-email")}
          onBlur={() => touch("login-email")}
          onValueChange={setEmail}
        />
        <PasswordField
          id="login-password"
          label={t("Password")}
          autoComplete="current-password"
          value={password}
          error={errorFor("login-password")}
          onBlur={() => touch("login-password")}
          onValueChange={setPassword}
        />
        <button type="submit" className="btn btn-solid btn-lg auth-submit" disabled={busy}>
          {busy ? (
            <>
              <span role="status">{t("Signing in…")}</span>
              <span className="co-spinner" aria-hidden="true" />
            </>
          ) : (
            <>
              {t("Sign in")} <Icon name="arrow" />
            </>
          )}
        </button>
      </form>
      <GoogleAuthDivider />
      <GoogleAuthButton next={next} disabled={busy} />
      <p className="auth-switch">
        {t("New to Tengu?")} <a href={`#/register${suffix}`}>{t("Create an account")}</a>
      </p>
    </>
  )
}

/* ---------- Create account ---------- */
function RegisterForm({ next, defaultEmail }: { next: string; defaultEmail: string }) {
  const { register } = useAuth()
  const form = useRef<HTMLFormElement>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState("")
  const [marketing, setMarketing] = useState(true)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<[string, string] | null>(null)

  const errors = useMemo(() => {
    const e: Errors = {}
    if (!firstName.trim()) e["reg-first"] = "Enter your first name."
    if (!lastName.trim()) e["reg-last"] = "Enter your last name."
    const emailError = validateEmail(email)
    if (emailError) e["reg-email"] = emailError
    const passwordError = validatePassword(password)
    if (passwordError) e["reg-password"] = passwordError
    if (serverError) e[serverError[0]] = serverError[1]
    return e
  }, [firstName, lastName, email, password, serverError])
  const { errorFor, touch, check, shown } = useFormErrors(errors, form)

  const strength = passwordStrength(password)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !check()) return
    setBusy(true)
    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      password,
      marketing,
    })
    if (result.ok) return replaceHash(next)
    setBusy(false)
    if (result.field === "email") {
      setServerError(["reg-email", result.message])
      requestAnimationFrame(() => document.getElementById("reg-email")?.focus())
    }
  }

  return (
    <>
      <Heading intro={t("One account for orders, saved pieces and quicker checkout.")}>
        {t("Join the ridge")}
      </Heading>
      <form ref={form} noValidate onSubmit={submit} className="auth-form" aria-busy={busy}>
        <ErrorSummary errors={shown} />
        <div className="field-grid">
          <TextField
            id="reg-first"
            label={t("First name")}
            autoComplete="given-name"
            autoCapitalize="words"
            value={firstName}
            error={errorFor("reg-first")}
            onBlur={() => touch("reg-first")}
            onValueChange={setFirstName}
          />
          <TextField
            id="reg-last"
            label={t("Last name")}
            autoComplete="family-name"
            autoCapitalize="words"
            value={lastName}
            error={errorFor("reg-last")}
            onBlur={() => touch("reg-last")}
            onValueChange={setLastName}
          />
          <TextField
            id="reg-email"
            label={t("Email")}
            className="span-2"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            error={errorFor("reg-email")}
            onBlur={() => touch("reg-email")}
            onValueChange={(value) => {
              setServerError(null)
              setEmail(value)
            }}
          />
        </div>
        <PasswordField
          id="reg-password"
          label={t("Password")}
          autoComplete="new-password"
          value={password}
          error={errorFor("reg-password")}
          onBlur={() => touch("reg-password")}
          onValueChange={setPassword}
        >
          <div className="strength" aria-live="polite">
            <div className={cn("strength-bars", `is-${strength}`)} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="strength-label">
              {password ? t("Password strength: {v1}", { v1: strengthLabels[strength] }) : t("Choose a strong password")}
            </p>
          </div>
          <ul className="rules" aria-label={t("Password requirements")}>
            {passwordRules.map((rule) => {
              const met = rule.test(password)
              return (
                <li key={rule.id} className={cn(met && "is-met")}>
                  <Icon name={met ? "check" : "minus"} />
                  {tr(rule.label)}
                  <span className="sr-only">{met ? t("(met)") : t("(not met)")}</span>
                </li>
              )
            })}
          </ul>
        </PasswordField>
        <CheckField
          id="reg-marketing"
          label={t("Email me about new drops and restocks")}
          checked={marketing}
          onCheckedChange={setMarketing}
        />
        <button type="submit" className="btn btn-solid btn-lg auth-submit" disabled={busy}>
          {busy ? (
            <>
              <span role="status">{t("Creating account…")}</span>
              <span className="co-spinner" aria-hidden="true" />
            </>
          ) : (
            <>
              {t("Create account")} <Icon name="arrow" />
            </>
          )}
        </button>
        <p className="auth-terms">
          {t("By creating an account you agree to our terms of sale and privacy notice.")}
        </p>
      </form>
      <GoogleAuthDivider />
      <GoogleAuthButton next={next} disabled={busy} />
      <p className="auth-switch">
        {t("Already have an account?")} <a href="#/login">{t("Sign in")}</a>
      </p>
    </>
  )
}

/* ---------- Forgot password ---------- */
function ForgotForm({ suffix }: { suffix: string }) {
  const form = useRef<HTMLFormElement>(null)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  const errors = useMemo(() => {
    const e: Errors = {}
    const emailError = validateEmail(email)
    if (emailError) e["forgot-email"] = emailError
    return e
  }, [email])
  const { errorFor, touch, check, shown } = useFormErrors(errors, form)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !check()) return
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setBusy(false)
    setSent(true)
    requestAnimationFrame(() => heading.current?.focus())
  }

  if (sent)
    return (
      <>
        <div className="auth-sent">
          <Hanko size="3.5rem" label={t("Sent")} />
        </div>
        <h1 ref={heading} tabIndex={-1} className="auth-title">
          {t("Check your inbox")}
        </h1>
        <p className="auth-intro" role="status">
          {t("If an account exists for")} <strong>{email.trim()}</strong>{t(", a reset link is on its way. It can take a few minutes. Check spam if you do not see it.")}
        </p>
        <a className="btn btn-solid btn-lg auth-submit" href={`#/login${suffix}`}>
          {t("Back to sign in")} <Icon name="arrow" />
        </a>
        <p className="auth-terms">{t("Demo store: no email is actually sent.")}</p>
      </>
    )

  return (
    <>
      <Heading intro={t("Enter the email you signed up with and we will send a reset link.")}>
        {t("Forgot password")}
      </Heading>
      <form ref={form} noValidate onSubmit={submit} className="auth-form" aria-busy={busy}>
        <ErrorSummary errors={shown} />
        <TextField
          id="forgot-email"
          label={t("Email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          error={errorFor("forgot-email")}
          onBlur={() => touch("forgot-email")}
          onValueChange={setEmail}
        />
        <button type="submit" className="btn btn-solid btn-lg auth-submit" disabled={busy}>
          {busy ? (
            <>
              <span role="status">{t("Sending…")}</span>
              <span className="co-spinner" aria-hidden="true" />
            </>
          ) : (
            <>
              {t("Send reset link")} <Icon name="arrow" />
            </>
          )}
        </button>
      </form>
      <p className="auth-switch">
        {t("Remembered it?")} <a href={`#/login${suffix}`}>{t("Back to sign in")}</a>
      </p>
    </>
  )
}
