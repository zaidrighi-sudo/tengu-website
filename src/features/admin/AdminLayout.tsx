import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { adminAuth } from "@/features/auth/admin-auth"
import { Icon } from "@/shared/components/Icon"
import "@fontsource/anton/latin-400.css"
import "@fontsource/space-grotesk/latin-300.css"
import "@fontsource/space-grotesk/latin-400.css"
import "@fontsource/space-grotesk/latin-500.css"
import "@fontsource/space-grotesk/latin-600.css"
import "@fontsource/space-grotesk/latin-700.css"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

const ADMIN_NAV = [
  { href: "/manage/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/manage/products", label: "Products", icon: "box" },
  { href: "/manage/categories", label: "Categories", icon: "grid" },
  { href: "/manage/orders", label: "Orders", icon: "mail" },
  { href: "/manage/customers", label: "Customers", icon: "user" },
  { href: "/manage/colors", label: "Colors", icon: "heart" },
  { href: "/manage/messages", label: "Messages", icon: "mail" },
  { href: "/manage/subscribers", label: "Subscribers", icon: "plus" },
  { href: "/manage/settings", label: "Settings", icon: "lock" },
  { href: "/manage/delivery", label: "Delivery", icon: "truck" },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await adminAuth.currentUser()

  if (!admin) {
    redirect("/#/login?next=" + encodeURIComponent("/manage/dashboard"))
  }

  return (
    <div className="admin-layout">
      <AdminHeader admin={admin} />
      <main className="admin-main" id="main">
        {children}
      </main>
      <AdminFooter />
    </div>
  )
}

function AdminHeader({ admin }: { admin: { email: string; firstName?: string; lastName?: string } }) {
  const name = admin.firstName || admin.email.split("@")[0]

  return (
    <header className="admin-header" role="banner">
      <div className="admin-header-inner">
        <Link href="/manage/dashboard" className="admin-brand" aria-label="Tengu Admin Home">
          <div className="admin-brand-lockup">
            <span className="admin-brand-mark">TENGU</span>
            <span className="admin-brand-tag" title="管理 / Management">管理</span>
          </div>
          <span className="admin-brand-label">ADMIN CONSOLE</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          <ul>
            {ADMIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="admin-nav-link">
                  <Icon name={item.icon} className="admin-nav-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-header-actions">
          <Link href="/" className="admin-view-site" target="_blank" rel="noopener noreferrer">
            <Icon name="external-link" aria-hidden="true" />
            <span>Storefront</span>
          </Link>
          <div className="admin-user">
            <span className="admin-user-name">{name}</span>
            <form action={async () => { "use server"; await adminAuth.logout() }}>
              <button type="submit" className="admin-logout-btn" title="Sign out of Admin Console">
                <Icon name="log-out" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}

function AdminFooter() {
  return (
    <footer className="admin-footer" role="contentinfo">
      <p>TENGU / 天狗 — MANAGEMENT CONSOLE · ALL RIGHTS RESERVED</p>
    </footer>
  )
}
