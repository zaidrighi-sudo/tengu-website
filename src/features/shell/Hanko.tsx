import type { CSSProperties } from "react"
import { cn } from "@/shared/utils/cn"
import { tr } from "@/shared/i18n"

/** Square hanko seal. Red or white, stamped slightly off-axis. */
export function Hanko({
  text = "T",
  tone = "red",
  size = "3.5rem",
  label = "Tengu seal",
  className,
}: {
  text?: string
  tone?: "red" | "white"
  size?: string
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "hanko",
        tone === "red" ? "hanko-red" : "hanko-white",
        className,
      )}
      style={{ "--size": size } as CSSProperties}
      role="img"
      aria-label={tr(label)}
    >
      {tr(text)}
    </span>
  )
}
