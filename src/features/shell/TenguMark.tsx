import { cn } from "@/shared/utils/cn"
import { tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

/** The official Tengu logo (white ink on transparent). */
export function TenguMark({
  className,
  label = "",
  /** Pass a label when the logo is the only identifying content. */
}: {
  className?: string
  label?: string
}) {
  return (
    <StoreImage className={cn("tengu-mark", className)} src="/store/tengu-logo.png" alt={tr(label)} width={640} height={640} />
  )
}
