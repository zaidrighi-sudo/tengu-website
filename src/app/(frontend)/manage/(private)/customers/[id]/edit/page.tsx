import Link from "next/link"
import { getCustomer, updateCustomer, getLifetimeDeliveredSpendForUsers, getDeliverySettings } from "@/lib/admin/actions"
import { notFound, redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/admin/helpers"
import "@/store/styles/global.css"
import "../../../admin.css"

interface PageProps {
  params: Promise<{ id: string }>
}

interface CustomerData {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  marketing?: boolean
  createdAt: Date
  addresses?: Array<{
    label?: string
    isDefault?: boolean
    firstName?: string
    lastName?: string
    phone?: string
    address1?: string
    address2?: string
    city?: string
    region?: string
  }>
}

export default async function AdminEditCustomerPage({ params }: PageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) notFound()

  const [spends, delivery] = await Promise.all([
    getLifetimeDeliveredSpendForUsers([id]),
    getDeliverySettings(),
  ])
  const deliveredSpend = spends[id] ?? 0
  const loyaltyThreshold = Number(delivery.loyaltyFreeDeliveryThreshold ?? 15000)
  const rewardUnlocked = loyaltyThreshold > 0 && deliveredSpend >= loyaltyThreshold

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li>
            <Link href="/manage/customers">CUSTOMERS</Link>
          </li>
          <li aria-current="page">{customer.email}</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 05 / CUSTOMER PROFILE · 顧客詳細 ]</div>
            <h1 className="admin-page-title">CUSTOMER PROFILE</h1>
            <p className="admin-page-subtitle">
              {customer.firstName} {customer.lastName} ({customer.email}) · Member since {formatDate(customer.createdAt.toISOString())}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="admin-tag">{formatCurrency(deliveredSpend)} DELIVERED</span>
            {loyaltyThreshold > 0 && (
              <span className={`admin-tag ${rewardUnlocked ? "admin-tag-out" : ""}`}>
                {rewardUnlocked ? "FREE HOME DELIVERY" : `${formatCurrency(Math.max(0, loyaltyThreshold - deliveredSpend))} TO GO`}
              </span>
            )}
          </div>
        </div>
      </header>

      <EditCustomerForm customer={customer as unknown as CustomerData} />
    </div>
  )
}

async function EditCustomerForm({ customer }: { customer: CustomerData }) {
  async function handleSubmit(formData: FormData) {
    "use server"
    await updateCustomer(customer._id as string, {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      marketing: formData.get("marketing") === "on",
    })
    redirect("/manage/customers")
  }

  return (
    <form action={handleSubmit} className="admin-form" noValidate>
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Account Details</h2>

        <div className="admin-field">
          <label className="admin-field-label">Email Address</label>
          <input type="email" value={customer.email} className="admin-field-input" readOnly style={{ fontFamily: "var(--font-mono)" }} />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="firstName" className="admin-field-label">First Name</label>
            <input id="firstName" name="firstName" type="text" defaultValue={customer.firstName} className="admin-field-input" />
          </div>
          <div className="admin-field">
            <label htmlFor="lastName" className="admin-field-label">Last Name</label>
            <input id="lastName" name="lastName" type="text" defaultValue={customer.lastName} className="admin-field-input" />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="phone" className="admin-field-label">Phone Number</label>
          <input id="phone" name="phone" type="tel" defaultValue={customer.phone || ""} className="admin-field-input" placeholder="+213 5XX XX XX XX" />
        </div>

        <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <input id="marketing" name="marketing" type="checkbox" defaultChecked={customer.marketing} style={{ width: "1.25rem", height: "1.25rem", accentColor: "#ffffff" }} />
          <label htmlFor="marketing" className="admin-field-label" style={{ margin: 0, fontSize: "0.75rem", color: "#ffffff" }}>Subscribed to marketing updates</label>
        </div>
      </section>

      {/* Saved Addresses */}
      {customer.addresses && customer.addresses.length > 0 && (
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Saved Shipping Addresses</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
            {customer.addresses.map((address, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid var(--admin-border)",
                  padding: "var(--space-4)",
                  background: "var(--admin-bg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>{address.label || `Address ${index + 1}`}</span>
                  {address.isDefault && <span className="admin-tag admin-tag-out">DEFAULT</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)", lineHeight: 1.6 }}>
                  <div>{address.firstName} {address.lastName}</div>
                  <div>{address.address1}</div>
                  {address.address2 && <div>{address.address2}</div>}
                  <div>{address.city}, {address.region}</div>
                  {address.phone && <div>Tel: {address.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Link href="/manage/customers" className="admin-btn admin-btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="admin-btn admin-btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  )
}
