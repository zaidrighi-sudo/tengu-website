import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"
import { getStoreData } from "@/lib/store-data"

export const revalidate = 300

/**
 * Indexable surfaces: the storefront root and the real product routes
 * (/product/<slug>). Everything else is either hash-routed SPA content or
 * the admin console / API, which robots.ts excludes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]

  try {
    const data = await getStoreData()
    for (const product of data.products) {
      if (!product.slug) continue
      entries.push({
        url: `${siteUrl()}/product/${encodeURIComponent(product.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  } catch (error) {
    // Database unavailable: keep the minimal sitemap rather than fail the route.
    console.error("[sitemap] Could not load products:", error)
  }

  return entries
}
