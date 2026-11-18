import { cn } from "@/store/utils/cn"
import { tr } from "@/store/i18n"

export function SectionHeading({
  index,
  title,
  compact = false,
  /** Smaller heading for secondary sections. */
}: {
  index: string
  title: string
  compact?: boolean
}) {
  return (
    <div className={cn("section-heading", compact && "is-compact")}>
      <span className="section-index">{index} —</span>
      <h2>{tr(title)}</h2>
    </div>
  )
}
