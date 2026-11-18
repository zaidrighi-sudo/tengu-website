import { useWishlist } from "@/features/wishlist/WishlistContext"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t, tr } from "@/shared/i18n"

const paths = [
  { label: "New drop", href: "#/shop?new=1" },
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Joggers", href: "#/shop?category=Joggers" },
  { label: "Outerwear", href: "#/shop?category=Outerwear" },
]

/** Empty bag, used by the drawer (compact) and the cart page (full). */
export function EmptyBag({
  variant,
  onNavigate,
}: {
  variant: "drawer" | "page"
  onNavigate?: () => void
}) {
  const { ids } = useWishlist()
  const Title = variant === "page" ? "h2" : "p"

  return (
    <div className={cn("empty-bag", `empty-bag-${variant}`)}>
      <div className="empty-bag-mark" aria-hidden="true">
        <Icon name="bag" />
      </div>
      <Title className="empty-bag-title">{t("Your bag is empty")}</Title>
      <p className="empty-bag-text">
        {t("Even a tengu needs something to carry. The AW25 drop is waiting on the ridge.")}
      </p>
      <a className="btn btn-solid" href="#/shop" onClick={onNavigate}>
        {t("Shop the drop")} <Icon name="arrow" />
      </a>
      <ul className="empty-bag-paths" aria-label={t("Start with")}>
        {paths.map((path) => (
          <li key={path.label}>
            <a href={path.href} onClick={onNavigate}>
              {tr(path.label)}
            </a>
          </li>
        ))}
      </ul>
      {ids.length > 0 && (
        <a className="empty-bag-saved" href="#/wishlist" onClick={onNavigate}>
          <Icon name="heart" />
          {ids.length === 1
            ? t("You have 1 saved piece")
            : t("You have {length} saved pieces", { length: ids.length })}
        </a>
      )}
    </div>
  )
}
