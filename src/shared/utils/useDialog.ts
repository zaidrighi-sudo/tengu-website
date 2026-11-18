import { type RefObject, useEffect } from "react"

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let scrollLocks = 0

function lockScroll() {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = "hidden"
}

function unlockScroll() {
  if (--scrollLocks <= 0) {
    scrollLocks = 0
    document.documentElement.style.overflow = ""
  }
}

/**
 * Modal behaviour for slide-in panels: locks page scroll, moves focus inside,
 * traps Tab, closes on Escape, and returns focus to the opener afterwards.
 */
export function useDialog({
  open,
  onClose,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  /** Element to refocus on close; falls back to whatever was focused on open. */
}: {
  open: boolean
  onClose: () => void
  containerRef: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    if (!open) return
    const opener = (returnFocusRef?.current ??
      document.activeElement) as HTMLElement | null
    lockScroll()

    const frame = requestAnimationFrame(() => {
      const first = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(initialFocusRef?.current ?? first)?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab" || !containerRef.current) return
      const items = [
        ...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (
        event.shiftKey &&
        (active === first || !containerRef.current.contains(active))
      ) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKeyDown)
      unlockScroll()
      opener?.focus?.()
    }
  }, [open, onClose, containerRef, initialFocusRef, returnFocusRef])
}
