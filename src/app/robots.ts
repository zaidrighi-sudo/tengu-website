import type { MetadataRoute } from "next"
import { siteUrl } from "@/shared/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/manage", "/api"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
