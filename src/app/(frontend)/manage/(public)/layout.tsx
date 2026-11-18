import React from "react"
import "@/store/styles/global.css"
import "@/app/(frontend)/manage/(private)/admin.css"

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