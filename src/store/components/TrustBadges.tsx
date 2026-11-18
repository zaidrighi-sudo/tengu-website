import { FREE_SHIPPING_THRESHOLD } from "@/store/data/navigation"
import { cn } from "@/store/utils/cn"
import { formatPrice } from "@/store/utils/format"
import { Icon, type IconName } from "./Icon"
import { getLang, t, tr } from "@/store/i18n"

const badges: {
  icon: IconName
  title: string
  text: string
  arabic: string
}[] = [
  {
    icon: "cash",
    title: "Cash on delivery",
    text: "Check your parcel, then pay the courier.",
    arabic: "الدفع عند الاستلام",
  },
  {
    icon: "truck",
    title: "58 wilayas",
    text: "dhd delivery. Home free over {price}.",
    arabic: "توصيل إلى جميع الولايات",
  },
  {
    icon: "return",
    title: "Easy exchange",
    text: "Wrong size? Swap it within 7 days.",
    arabic: "إمكانية التبديل",
  },
]

export function TrustBadges({
  layout = "list",
  className,
}: {
  layout?: "list" | "row"
  className?: string
}) {
  return (
    <ul className={cn("trust", `trust-${layout}`, className)}>
      {badges.map((badge) => (
        <li key={badge.title}>
          <Icon name={badge.icon} />
          <div>
            <strong>{tr(badge.title)}</strong>
            <span>{t(badge.text, { price: formatPrice(FREE_SHIPPING_THRESHOLD) })}</span>
            {getLang() !== "ar" && (
              <span className="trust-ar" lang="ar" dir="rtl">
                {badge.arabic}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
