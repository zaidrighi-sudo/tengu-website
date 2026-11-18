import React from "react"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Tengu Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen antialiased">
        <div className="admin-layout">
          <main className="admin-main" id="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}