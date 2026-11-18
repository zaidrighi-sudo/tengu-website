import { WishlistPanel } from "@/store/components/account/WishlistPanel"
import { Layout } from "@/store/components/Layout"
import { PageHead } from "@/store/components/page/PageHead"
import { useAuth } from "@/store/context/AuthContext"
import { t } from "@/store/i18n"

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
