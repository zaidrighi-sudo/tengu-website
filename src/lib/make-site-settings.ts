export type MakeSiteSettings = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

export const makeSiteSettings: MakeSiteSettings = {
  title: "Tengu",
  description: "Modern streetwear fashion",
  language: "en",
  robots: {
    index: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    image: "/og-image.jpg",
  },
  analytics: {
    googleAnalyticsId: "",
  },
  customScripts: {
    headStart: "",
    headEnd: "",
    bodyStart: "",
    bodyEnd: "",
  },
  accessibility: {
    addBypassLinks: true,
  },
}

export function sanitizeHtmlAttribute(value: string | undefined): string {
  return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
}