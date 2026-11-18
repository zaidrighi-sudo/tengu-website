import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

/**
 * Hash-routed SPA: only the root page is crawlable. Admin console and API
 * are excluded via robots.ts. Extend with real product routes if/when the
 * storefront moves off the hash router.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
