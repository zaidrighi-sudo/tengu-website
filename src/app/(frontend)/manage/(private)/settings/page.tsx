import Link from "next/link"
import { getSiteSettings, updateSiteSettings } from "@/lib/admin/actions"
import { ImageUploadField } from "@/components/admin/ImageUploadField"
import "@/store/styles/global.css"
import "@/app/(frontend)/manage/(private)/admin.css"

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">SETTINGS</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 09 / SITE SETTINGS · サイト設定 ]</div>
            <h1 className="admin-page-title">SITE SETTINGS</h1>
            <p className="admin-page-subtitle">
              Configure global announcement ticker copy, homepage hero section, and official contact metadata.
            </p>
          </div>
        </div>
      </header>

      <SettingsForm settings={settings} />
    </div>
  )
}

async function SettingsForm({ settings }: { settings: Record<string, unknown> }) {
  async function handleSubmit(formData: FormData) {
    "use server"
    await updateSiteSettings(Object.fromEntries(formData))
  }

  const announcementLeft = (settings.announcementLeft as Record<string, string>)?.en || ""
  const announcementCenter = (settings.announcementCenter as Record<string, string>)?.en || ""
  const announcementRight = (settings.announcementRight as Record<string, string>)?.en || ""
  const heroEyebrow = (settings.heroEyebrow as Record<string, string>)?.en || ""
  const heroCopy = (settings.heroCopy as Record<string, string>)?.en || ""
  const newsletterEnabled = settings.newsletterEnabled as boolean
  const contactEmail = (settings.contactEmail as string) || ""
  const phone = (settings.phone as string) || ""
  const instagramUrl = (settings.instagramUrl as string) || ""
  const heroImage = settings.heroImage as { _id?: string; url?: string } | null | undefined

  return (
    <form action={handleSubmit} className="admin-form" noValidate>
      {/* Announcement Bar */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Announcement Ticker</h2>
        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="announcementLeft" className="admin-field-label">Left Ticker</label>
            <input id="announcementLeft" name="announcementLeft" type="text" defaultValue={announcementLeft} className="admin-field-input" placeholder="Cash on delivery" />
          </div>
          <div className="admin-field">
            <label htmlFor="announcementCenter" className="admin-field-label">Center Ticker</label>
            <input id="announcementCenter" name="announcementCenter" type="text" defaultValue={announcementCenter} className="admin-field-input" placeholder="Fast delivery to all 58 wilayas" />
          </div>
          <div className="admin-field">
            <label htmlFor="announcementRight" className="admin-field-label">Right Ticker</label>
            <input id="announcementRight" name="announcementRight" type="text" defaultValue={announcementRight} className="admin-field-input" placeholder="Easy exchange" />
          </div>
        </div>
      </section>

      {/* Home Hero */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Home Hero Showcase</h2>
        <div className="admin-field">
          <label htmlFor="heroEyebrow" className="admin-field-label">Eyebrow Tag</label>
          <input id="heroEyebrow" name="heroEyebrow" type="text" defaultValue={heroEyebrow} className="admin-field-input" placeholder="NEW COLLECTION" />
        </div>
        <div className="admin-field">
          <label htmlFor="heroCopy" className="admin-field-label">Editorial Copy</label>
          <textarea id="heroCopy" name="heroCopy" className="admin-field-textarea" rows={3} defaultValue={heroCopy} placeholder="AW25. Small runs, cut heavy..." />
        </div>
        <ImageUploadField
          name="heroImage"
          label="Hero Image"
          defaultValue={heroImage?._id ? String(heroImage._id) : ""}
          defaultUrl={heroImage?.url ?? ""}
        />
      </section>

      {/* Newsletter */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Newsletter Signup</h2>
        <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
          <input
            id="newsletterEnabled"
            name="newsletterEnabled"
            type="checkbox"
            defaultChecked={newsletterEnabled}
            style={{ width: "1.25rem", height: "1.25rem", accentColor: "#ffffff" }}
          />
          <label htmlFor="newsletterEnabled" className="admin-field-label" style={{ margin: 0, fontSize: "0.75rem", color: "#ffffff" }}>
            Enable newsletter subscription section on storefront
          </label>
        </div>
      </section>

      {/* Contact Info */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Contact & Social Meta</h2>
        <div className="admin-field">
          <label htmlFor="contactEmail" className="admin-field-label">Contact Email</label>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={contactEmail} className="admin-field-input" placeholder="contact@tengu.com" />
        </div>
        <div className="admin-field">
          <label htmlFor="phone" className="admin-field-label">Customer Support Phone</label>
          <input id="phone" name="phone" type="text" defaultValue={phone} className="admin-field-input" placeholder="+213 5XX XX XX XX" />
        </div>
        <div className="admin-field">
          <label htmlFor="instagramUrl" className="admin-field-label">Instagram Profile URL</label>
          <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={instagramUrl} className="admin-field-input" placeholder="https://instagram.com/tengu" />
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <button type="submit" className="admin-btn admin-btn-primary">
          Save Settings
        </button>
      </div>
    </form>
  )
}
