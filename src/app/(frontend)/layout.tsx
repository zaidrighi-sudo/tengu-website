import React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import Script from "next/script"
import { BodyCustomCode, renderHeadCustomCode } from "@/features/site-settings/make-custom-code"
import {
  makeSiteSettings,
  sanitizeHtmlAttribute,
} from "@/features/site-settings/make-site-settings"
import { siteUrl } from "@/shared/site-url"
import { LanguageProvider } from "@/shared/i18n/LanguageProvider"
import "./styles.css"

const defaultTitle = "Tengu"
const title = makeSiteSettings.title ?? defaultTitle
const description = makeSiteSettings.description ?? "Modern streetwear fashion"
const favicon = makeSiteSettings.icons?.icon
const socialImage = makeSiteSettings.openGraph?.image
const googleAnalyticsId = sanitizeHtmlAttribute(
  makeSiteSettings.analytics?.googleAnalyticsId,
)

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  robots:
    makeSiteSettings.robots?.index === false
      ? { follow: false, index: false }
      : undefined,
  icons: favicon ? { icon: favicon } : undefined,
  openGraph: {
    title,
    description,
    images: socialImage ? [socialImage] : undefined,
  },
  twitter: socialImage
    ? {
        card: "summary_large_image",
        images: [socialImage],
      }
    : undefined,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const language = sanitizeHtmlAttribute(makeSiteSettings.language) || "en"
  const addBypassLinks = makeSiteSettings.accessibility?.addBypassLinks === true
  const customScripts = makeSiteSettings.customScripts

  // Read language from cookie for SSR consistency
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get("tengu-lang")?.value
  const initialLang = (cookieLang === "en" || cookieLang === "fr" || cookieLang === "ar")
    ? cookieLang
    : "en"

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        {renderHeadCustomCode(customScripts?.headStart, "head-start")}
        {renderHeadCustomCode(customScripts?.headEnd, "head-end")}
      </head>
      <body className="min-h-screen antialiased">
        <BodyCustomCode html={customScripts?.bodyStart} />
        {addBypassLinks && (
          <a className="figma-bypass-link" href="#root">
            Skip to content
          </a>
        )}
        <div id="root" tabIndex={-1}>
          <LanguageProvider initialLang={initialLang as "en" | "fr" | "ar"}>
            {children}
          </LanguageProvider>
        </div>
        {googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="figma-google-analytics" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(googleAnalyticsId)});
`}
            </Script>
          </>
        )}
        <BodyCustomCode html={customScripts?.bodyEnd} />
      </body>
    </html>
  )
}
