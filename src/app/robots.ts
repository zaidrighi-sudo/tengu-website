import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin console and internal APIs are not for indexing.
      disallow: ["/manage", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
