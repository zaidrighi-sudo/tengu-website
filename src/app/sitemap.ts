import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

// The storefront is a single-page app whose sections live behind hash routes
// (#/shop, #/about, ...). Only the root URL is crawlable, so the sitemap is
// deliberately minimal instead of listing volatile hash fragments.
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
