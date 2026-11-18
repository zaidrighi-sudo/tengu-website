import type { Errors } from "@/features/checkout/utils"

export function validatePassword(value: string) {
  if (!value) return "Enter a password."
  if (value.length < 8) return "Use at least 8 characters."
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    return "Include at least one letter and one number."
  return ""
}

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "letter", label: "A letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { id: "number", label: "A number", test: (v: string) => /\d/.test(v) },
]

/** 0 (empty) to 4. Used only as a visual hint; the rules above gate sign up. */
export function passwordStrength(value: string) {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++
  return Math.max(1, score)
}

export const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"]

export function requireText(
  errors: Errors,
  id: string,
  value: string,
  message: string,
) {
  if (!value.trim()) errors[id] = message
}
