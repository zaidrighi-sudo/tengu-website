import { WishlistPanel } from "@/features/account/WishlistPanel"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { useAuth } from "@/features/auth/AuthContext"
import { t } from "@/shared/i18n"

export default function Wishlist() {
  const { user } = useAuth()
  return (
    <Layout overlayHeader={false}>
      <div className="wishpage">
        <PageHead
          crumb={t("Wishlist")}
          eyebrow={t("Saved")}
          title={t("Wishlist")}
          intro={t("Pieces you have your eye on. Saved on this device.")}
        />
        <div className="wishpage-body">
          <WishlistPanel />
          {!user && (
            <p className="acct-note">
              <a href="#/register">{t("Create an account")}</a> {t("to track orders and save addresses too.")}
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
