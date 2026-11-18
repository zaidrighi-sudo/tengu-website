import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import "@/store/styles/global.css"
import { getStoreData } from "@/lib/store-data"
import { siteUrl } from "@/lib/site-url"
import ProductDetail from "@/store/pages/ProductDetail"
import { imagesForColor, hasStock } from "@/store/utils/variants"
import type { StoreData } from "@/store/data/settings"
import type { Product } from "@/store/data/products"

/**
 * Real, indexable product route: /product/<slug>
 *
 * The storefront is a hash-routed SPA rendered in the browser only, so this
 * route is the SEO surface for individual pieces: server-rendered markup,
 * Open Graph/Twitter metadata and Product + Breadcrumb JSON-LD. Buying still
 * happens in the shared bag (the island adds to localStorage and hands off
 * to /#/cart), so there is exactly one purchase path in the codebase.
 */

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

const absoluteImageUrl = (url: string): string | null =>
  !url || url.startsWith("data:") ? null
  : /^https?:\/\//i.test(url) ? url
  : url.startsWith("/") ? `${siteUrl()}${url}`
  : null

// Some preview proxies hand the route param through still percent-encoded;
// decode defensively so both "/product/<decoded>" and "/product/<encoded>" resolve.
const decodeSlug = (raw: string): string => {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const findProduct = (data: StoreData, raw: string): Product | undefined => {
  const slug = decodeSlug(raw)
  return data.products.find((entry) => entry.slug === slug || entry.slug === raw)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getStoreData()
  const product = findProduct(data, slug)
  if (!product) return { title: "Not found — Tengu" }

  const description = `${product.name}${product.fit ? ` — ${product.fit} fit` : ""}. ${product.category} by TENGU, cash on delivery across Algeria.`
  const canonical = `${siteUrl()}/product/${encodeURIComponent(decodeSlug(slug))}`
  return {
    title: `${product.name} — Tengu`,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      url: canonical,
      images: product.image ? [product.image] : undefined,
      type: "website",
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getStoreData()
  const product = findProduct(data, slug)
  if (!product) notFound()

  const canonical = `${siteUrl()}/product/${encodeURIComponent(decodeSlug(slug))}`
  const images = imagesForColor(product, product.color)
    .map((image) => absoluteImageUrl(image.url))
    .filter((url): url is string => Boolean(url))

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        ...(images.length > 0 ? { image: images } : {}),
        brand: { "@type": "Brand", name: "TENGU" },
        category: product.category,
        sku: product.slug,
        ...(product.fit
          ? { additionalProperty: [{ "@type": "PropertyValue", name: "Fit", value: product.fit }] }
          : {}),
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "DZD",
          price: product.price,
          availability: hasStock(product)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl()}/#/shop` },
          { "@type": "ListItem", position: 3, name: product.name, item: canonical },
        ],
      },
    ],
  }

  return (
    <>
      <header className="pdp-topbar">
        <Link className="pdp-wordmark" href="/" aria-label="Tengu home">TENGU</Link>
        <nav className="pdp-nav" aria-label="Product">
          <Link href="/#/shop">SHOP</Link>
          <Link href="/#/cart">BAG</Link>
        </nav>
      </header>

      <main className="pdp-page">
        <ProductDetail product={product} data={data} />
        <footer className="pdp-foot">
          <a href="/#/shipping-returns">Shipping and returns</a>
          <span aria-hidden="true">·</span>
          <a href="/#/contact">Contact</a>
          <span aria-hidden="true">·</span>
          <a href="/#/faq">FAQ</a>
        </footer>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  )
}
