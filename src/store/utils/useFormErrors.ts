import { type RefObject, useCallback, useState } from "react"
import type { Errors } from "./checkout"

/**
 * Inline validation: a field shows its error once it has been blurred, or
 * for every field once the form has been submitted. Errors clear live as the
 * value becomes valid, since they are derived from the current values.
 */
export function useFormErrors(errors: Errors, root: RefObject<HTMLElement | null>) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)

  const errorFor = (id: string) =>
    attempted || touched[id] ? (errors[id] ?? "") : ""

  const touch = useCallback(
    (id: string) =>
      setTouched((current) => (current[id] ? current : { ...current, [id]: true })),
    [],
  )

  /** True when valid. Otherwise reveal all errors and focus the first one. */
  const check = () => {
    if (Object.keys(errors).length === 0) return true
    setAttempted(true)
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    )
    return false
  }

  const reset = useCallback(() => {
    setTouched({})
    setAttempted(false)
  }, [])

  const shown = Object.entries(errors).filter(
    ([id]) => attempted || touched[id],
  )

  return { errorFor, touch, check, reset, attempted, shown }
}
