import { useAuth } from "@/features/auth/AuthContext"
import { LOYALTY_FREE_DELIVERY_THRESHOLD } from "@/features/site-settings/navigation"
import { formatMoney } from "@/shared/utils/format"
import { t } from "@/shared/i18n"

/**
 * Loyalty: lifetime delivered spend progress toward free home delivery.
 * Only completed (delivered) orders count; the threshold is set by the admin
 * in /manage/delivery and 0 disables the reward (block hidden).
 */
export function SpendProgress() {
  const { user } = useAuth()
  const threshold = LOYALTY_FREE_DELIVERY_THRESHOLD
  if (threshold <= 0) return null

  const spent = user?.lifetimeSpent ?? 0
  const remaining = Math.max(0, threshold - spent)
  const progress = Math.min(100, (spent / threshold) * 100)
  const unlocked = user !== null && spent >= threshold

  if (!user) {
    return (
      <div className="spend-progress">
        <p className="spend-progress-text">
          {t("Sign in and spend {threshold} on delivered orders to unlock free home delivery forever.", {
            threshold: formatMoney(threshold),
          })}
        </p>
        <div
          className="cart-progress"
          role="progressbar"
          aria-label={t("Progress to free home delivery")}
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-valuenow={0}
          aria-valuetext={`0 / ${formatMoney(threshold)}`}
        >
          <span style={{ width: "0%" }} />
        </div>
        <p className="spend-info">
          <a href="#/login">{t("Sign in")}</a>
        </p>
      </div>
    )
  }

  return (
    <div className="spend-progress">
      {unlocked ? (
        <p className="spend-progress-text is-unlocked">
          <strong>{t("Free home delivery unlocked — every order, every commune.")}</strong>
        </p>
      ) : (
        <p className="spend-progress-text">
          {t("Spend {amount} more on delivered orders for free home delivery forever.", {
            amount: formatMoney(remaining),
          })}
        </p>
      )}
      <div
        className="cart-progress"
        role="progressbar"
        aria-label={t("Progress to free home delivery")}
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(spent, threshold)}
        aria-valuetext={
          unlocked
            ? t("Free home delivery unlocked — every order, every commune.")
            : t("{spent} / {threshold} spent on delivered orders", {
                spent: formatMoney(spent),
                threshold: formatMoney(threshold),
              })
        }
      >
        <span style={{ width: `${progress}%` }} className={unlocked ? "is-complete" : ""} />
      </div>
      <p className="spend-info">
        {t("{spent} / {threshold} spent on delivered orders", {
          spent: formatMoney(spent),
          threshold: formatMoney(threshold),
        })}
      </p>
    </div>
  )
}
