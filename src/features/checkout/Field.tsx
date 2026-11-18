import { type InputHTMLAttributes, type ReactNode, useState } from "react"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t, tr } from "@/shared/i18n"

type Shared = {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
}

function Label({
  id,
  label,
  optional,
}: Pick<Shared, "id" | "label" | "optional">) {
  return (
    <label className="field-label" htmlFor={id}>
      {tr(label)}
      {optional && <span className="field-optional"> {t("(optional)")}</span>}
    </label>
  )
}

function Message({ id, error, hint }: Pick<Shared, "id" | "error" | "hint">) {
  if (error) {
    return (
      <p id={`${id}-error`} className="field-error">
        <Icon name="alert" />
        <span>{tr(error)}</span>
      </p>
    )
  }
  return hint ? (
    <p id={`${id}-hint`} className="field-hint">
      {tr(hint)}
    </p>
  ) : null
}

const describedBy = ({ id, error, hint }: Pick<Shared, "id" | "error" | "hint">) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined

type TextProps = Shared &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "onChange" | "className" | "value"
  > & {
    value: string
    onValueChange: (value: string) => void
    /** Decorative content inside the right edge of the field. */
    trailing?: ReactNode
  }

/** 52px text field with a visible label, inline error and autofill tokens. */
export function TextField({
  id,
  label,
  error,
  hint,
  optional,
  className,
  value,
  onValueChange,
  trailing,
  ...input
}: TextProps) {
  return (
    <div className={cn("field", error && "has-error", className)}>
      <Label id={id} label={tr(label)} optional={optional} />
      <div className="field-control">
        <input
          {...input}
          id={id}
          name={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, error, hint })}
        />
        {trailing && <span className="field-trailing">{tr(trailing)}</span>}
      </div>
      <Message id={id} error={error} hint={tr(hint)} />
    </div>
  )
}

export function SelectField({
  id,
  label,
  error,
  hint,
  optional,
  className,
  value,
  onValueChange,
  onBlur,
  autoComplete,
  options,
  placeholder,
  disabled,
}: Shared & {
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  autoComplete?: string
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className={cn("field", error && "has-error", className)}>
      <Label id={id} label={tr(label)} optional={optional} />
      <div className="field-control field-select">
        <select
          id={id}
          name={id}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, error, hint })}
        >
          {placeholder !== undefined && <option value="">{tr(placeholder)}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {tr(option.label)}
            </option>
          ))}
        </select>
        <Icon name="chevron" />
      </div>
      <Message id={id} error={error} hint={tr(hint)} />
    </div>
  )
}

/** Checkbox row with a 44px+ hit area. */
export function CheckField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="check" htmlFor={id}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span className="check-box" aria-hidden="true">
        <Icon name="check" />
      </span>
      <span>{tr(label)}</span>
    </label>
  )
}

/** Password input with a show/hide toggle (44px target, announced as pressed). */
export function PasswordField({
  id,
  label,
  error,
  hint,
  className,
  value,
  onValueChange,
  onBlur,
  autoComplete,
  children,
}: Shared & {
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  autoComplete: "current-password" | "new-password"
  /** Extra content under the field, such as a strength meter. */
  children?: ReactNode
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className={cn("field", error && "has-error", className)}>
      <Label id={id} label={tr(label)} />
      <div className="field-control field-password">
        <input
          id={id}
          name={id}
          type={shown ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, error, hint })}
        />
        <button
          type="button"
          className="field-toggle"
          aria-label={t("Show password")}
          aria-pressed={shown}
          onClick={() => setShown((current) => !current)}
        >
          <Icon name={shown ? "eye-off" : "eye"} />
        </button>
      </div>
      <Message id={id} error={error} hint={tr(hint)} />
      {children}
    </div>
  )
}

/** Summary of what needs fixing; each item focuses its field. */
export function ErrorSummary({ errors }: { errors: [string, string][] }) {
  if (errors.length === 0) return null
  return (
    <div className="co-alert" role="alert">
      <Icon name="alert" />
      <div>
        <strong>
          {errors.length === 1
            ? t("One thing needs your attention")
            : t("{length} things need your attention", { length: errors.length })}
        </strong>
        <ul>
          {errors.map(([id, message]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(id)?.focus()
                }}
              >
                {tr(message)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
