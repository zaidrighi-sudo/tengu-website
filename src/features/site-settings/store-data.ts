import { unstable_cache } from 'next/cache'

import type { StoreData } from '@/features/site-settings/data'
import type { ColorName, Fit, Product as ProductType, ProductStatus, Size } from '@/features/products/products'
import { connectDB, Product, Category, Color, SiteSettings, DeliverySettings, Media, type IMedia } from '@/shared/mongodb/models'
import type { LeanSiteSettings, LeanDeliverySettings } from '@/features/admin/actions-shared'
import { resolveCommuneFees } from '@/features/delivery/delivery'

const STORE_TAG = 'store-data'

const mediaUrl = (value: unknown): string | undefined => {
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as IMedia).url
    return url || undefined
  }
  return undefined
}

async function loadStoreData(): Promise<StoreData> {
  await connectDB()

  // Public reads
  const [productResult, categoryResult, deliveryRaw, siteRaw, colorsResult] = await Promise.all([
    Product.find().sort({ sortOrder: 1 }).limit(500).populate('category').populate('colors').populate('image').populate('hoverImage').populate('images.image').lean(),
    Category.find().sort({ sortOrder: 1 }).limit(100).populate('tileImage').populate('tileHoverImage').lean(),
    DeliverySettings.findOne().lean(),
    SiteSettings.findOne()
      .populate('heroImage')
      .populate('promoImage')
      .populate('storyImage')
      .populate('featuredProducts', 'name slug')
      .populate('featuredCategories', 'name slug')
      .lean(),
    Color.find().sort({ sortOrder: 1 }).limit(100).lean(),
  ])

  const delivery = deliveryRaw as unknown as LeanDeliverySettings
  const site = siteRaw as unknown as LeanSiteSettings

  const products: ProductType[] = productResult.flatMap((doc: any) => {
    const image = mediaUrl(doc.image)
    const category = typeof doc.category === 'object' && doc.category ? doc.category.name : undefined

    // Extract color names from relationship
    let colors: ColorName[] = []
    if (Array.isArray(doc.colors)) {
      colors = doc.colors.map((c: any) => {
        if (typeof c === 'string') return c // old data: color name string
        if (c && typeof c === 'object' && 'name' in c) return c.name // new data: relationship populated
        if (c && typeof c === 'object' && 'id' in c) return c.id // fallback: relationship ID
        return String(c)
      })
    }

    // Variant gallery: one image per colorway, populated with its media file.
    const gallery: NonNullable<ProductType['images']> = Array.isArray(doc.images)
      ? doc.images
        .map((entry: any) => ({
          url: mediaUrl(entry?.image) ?? '',
          color: typeof entry?.color === 'string' ? entry.color : '',
          colorHex: entry?.colorHex ?? undefined,
          order: Number(entry?.order) || 0,
          isMain: Boolean(entry?.isMain),
        }))
        .filter((entry: any) => entry.url)
      : []

    // Legacy products only have image/hoverImage. Fold them into the gallery.
    if (gallery.length === 0 && image) {
      gallery.push({
        url: image,
        color: colors[0] ?? '',
        isMain: true,
        order: 0,
      })
      const hover = mediaUrl(doc.hoverImage)
      if (hover && hover !== image) {
        gallery.push({ url: hover, color: colors[0] ?? '', order: 1 })
      }
    }

    // Per color + size stock. Empty means the product does not track stock.
    const inventory = Array.isArray(doc.inventory)
      ? doc.inventory.map((item: any) => ({
          color: typeof item?.color === 'string' ? item.color : '',
          colorHex: item?.colorHex ?? undefined,
          size: String(item?.size ?? ''),
          quantity: Math.max(0, Math.trunc(Number(item?.quantity) || 0)),
        }))
      : []

    // Merge color names from the relationship, gallery and inventory.
    const colorSet = new Set(colors)
    for (const entry of gallery) if (entry.color) colorSet.add(entry.color)
    for (const item of inventory) if (item.color) colorSet.add(item.color)
    colors = [...colorSet]

    // Skip products that have no image or no category — they cannot render on the storefront.
    // Missing colors is acceptable; fall back to an empty list.
    if (!image || !category) return []
    const mainImage = gallery.find((entry) => entry.isMain) ?? gallery[0]
    return [
      {
        id: String(doc._id),
        slug: typeof doc.slug === 'string' && doc.slug ? doc.slug : undefined,
        name: doc.name,
        category,
        color: mainImage?.color || colors[0] || '',
        colors,
        sizes: (doc.sizes ?? []) as Size[],
        fit: (doc.fit ?? undefined) as Fit | undefined,
        price: doc.price,
        compareAt: doc.compareAt ?? undefined,
        status: (doc.status ?? undefined) as ProductStatus | undefined,
        image: mainImage?.url ?? image,
        hoverImage: mediaUrl(doc.hoverImage) ?? gallery[1]?.url ?? mainImage?.url ?? image,
        images: gallery,
        inventory,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      },
    ]
  })

  // Extract featured product IDs
  const featuredProductIds = (site?.featuredProducts ?? []).map((p: any) => String(p._id))

  // Extract featured category names
  const featuredCategoryNames = (site?.featuredCategories ?? []).map((c: any) => c.name)

  return {
    products,
    categories: categoryResult.map((doc: any) => ({
      id: String(doc._id),
      name: doc.name,
      sortOrder: Number(doc.sortOrder) || 0,
      showInNav: doc.showInNav !== false,
      tileImage: mediaUrl(doc.tileImage),
      tileHoverImage: mediaUrl(doc.tileHoverImage),
      tileAlt: doc.tileAlt ?? undefined,
    })),
    zones: (delivery?.zones ?? []).map((zone: any) => ({
      id: Math.min(5, Math.max(1, zone.zone)) as 1 | 2 | 3 | 4 | 5,
      home: zone.homeFee,
      desk: zone.deskFee,
      days: [zone.minDays, zone.maxDays] as [number, number],
    })),
    communeFees: Object.values(resolveCommuneFees(delivery ?? null)),
    freeShippingThreshold: delivery?.freeShippingThreshold ?? 15000,
    loyaltyFreeDeliveryThreshold: delivery?.loyaltyFreeDeliveryThreshold ?? 15000,
    colors: colorsResult.map((doc: any) => ({
      name: doc.name,
      hex: doc.hex,
      sortOrder: doc.sortOrder ?? 0,
      isActive: doc.isActive ?? true,
    })),
    settings: {
      announcementLeft: site?.announcementLeft ?? {},
      announcementCenter: site?.announcementCenter ?? {},
      announcementRight: site?.announcementRight ?? {},
      heroImage: mediaUrl(site?.heroImage),
      heroImageAlt: site?.heroImageAlt ?? undefined,
      heroEyebrow: site?.heroEyebrow ?? {},
      heroCopy: site?.heroCopy ?? {},
      // Featured products & categories
      featuredProducts: featuredProductIds.length > 0 ? featuredProductIds : undefined,
      featuredCategories: featuredCategoryNames.length > 0 ? featuredCategoryNames : undefined,
      // Categories curated for the SHOP mega menu (empty = show all)
      megaMenuCategories: (site?.megaMenuCategories ?? []).map((id: any) => String(id)),
      // Promotional banner
      promoEnabled: site?.promoEnabled ?? false,
      promoImage: mediaUrl(site?.promoImage),
      promoImageAlt: site?.promoImageAlt ?? undefined,
      promoHeadline: site?.promoHeadline ?? {},
      promoSubtext: site?.promoSubtext ?? {},
      promoCtaText: site?.promoCtaText ?? {},
      promoCtaLink: site?.promoCtaLink ?? undefined,
      promoAlignment: site?.promoAlignment ?? 'center',
      promoColorScheme: site?.promoColorScheme ?? 'dark',
      // Brand story
      storyEnabled: site?.storyEnabled ?? true,
      storyImage: mediaUrl(site?.storyImage),
      storyImageAlt: site?.storyImageAlt ?? undefined,
      storyHeadline: site?.storyHeadline ?? {},
      storyBody: site?.storyBody ?? {},
      storyCtaText: site?.storyCtaText ?? {},
      storyCtaLink: site?.storyCtaLink ?? '#/about',
      // Newsletter
      newsletterEnabled: site?.newsletterEnabled ?? true,
      newsletterHeadline: site?.newsletterHeadline ?? {},
      newsletterSubtext: site?.newsletterSubtext ?? {},
      newsletterPlaceholder: site?.newsletterPlaceholder ?? {},
      newsletterButtonText: site?.newsletterButtonText ?? {},
      // Contact
      contactEmail: site?.contactEmail ?? undefined,
      phone: site?.phone ?? undefined,
      instagramUrl: site?.instagramUrl ?? undefined,
    },
  }
}

/**
 * Cached storefront data. Admin edits expire the `store-data` tag from the
 * collection and global hooks, so the next visitor gets fresh data.
 */
export const getStoreData = unstable_cache(loadStoreData, ['store-data'], { tags: [STORE_TAG] })