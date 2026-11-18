"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, toObjectId, type LeanSiteSettings } from "@/features/admin/actions-shared"
import { SiteSettings } from "@/shared/mongodb/models"

// Site Settings (Global) - singleton document
export async function getSiteSettings(): Promise<LeanSiteSettings> {
  await ensureDB()
  let settings = await SiteSettings.findOne()
    .populate("heroImage", "url")
    .populate("promoImage", "url")
    .populate("storyImage", "url")
    .populate("featuredProducts", "name slug")
    .populate("featuredCategories", "name slug")
    .lean()

  if (!settings) {
    // Create default settings document
    settings = await SiteSettings.create({})
  }

  return settings as unknown as LeanSiteSettings
}

export async function updateSiteSettings(data: Record<string, unknown>) {
  await ensureDB()

  // Convert string IDs to ObjectIds for relationships
  const updateData = { ...data }
  // An empty value means "remove the image"; missing keys stay untouched.
  if ("heroImage" in data) updateData.heroImage = data.heroImage ? toObjectId(String(data.heroImage)) : null
  if ("promoImage" in data) updateData.promoImage = data.promoImage ? toObjectId(String(data.promoImage)) : null
  if ("storyImage" in data) updateData.storyImage = data.storyImage ? toObjectId(String(data.storyImage)) : null
  if (data.featuredProducts) {
    updateData.featuredProducts = (data.featuredProducts as string[]).map(id => toObjectId(id))
  }
  if (data.featuredCategories) {
    updateData.featuredCategories = (data.featuredCategories as string[]).map(id => toObjectId(id))
  }

  const settings = await SiteSettings.findOneAndUpdate({}, updateData, { upsert: true, new: true })
    .populate("heroImage", "url")
    .populate("promoImage", "url")
    .populate("storyImage", "url")
    .populate("featuredProducts", "name slug")
    .populate("featuredCategories", "name slug")
    .lean()

  revalidatePath("/manage/settings")
  refreshStorefront()
  return settings as unknown as LeanSiteSettings
}

