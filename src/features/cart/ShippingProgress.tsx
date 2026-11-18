import { FREE_SHIPPING_THRESHOLD } from "@/features/site-settings/navigation"
import { formatPrice } from "@/shared/utils/format"
import { t } from "@/shared/i18n"

/** "You are $X away from free shipping" with a thin progress bar. */
export function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <div className="ship-progress">
      <p>
        {subtotal === 0 ? (
          <>
            {t("Free shipping on orders over")}{" "}
            <strong>{formatPrice(FREE_SHIPPING_THRESHOLD)}</strong>.
          </>
        ) : remaining > 0 ? (
          <>
            {t("You are")} <strong>{formatPrice(remaining)}</strong> {t("away from free shipping.")}
          </>
        ) : (
          <>
            {t("You have unlocked")} <strong>{t("free shipping")}</strong>.
          </>
        )}
      </p>
      <div
        className="cart-progress"
        role="progressbar"
        aria-label={t("Progress to free shipping")}
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
        aria-valuetext={
          remaining > 0
            ? t("{amount} left to free shipping", { amount: formatPrice(remaining) })
            : t("Free shipping unlocked")
        }
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
