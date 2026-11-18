"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, type LeanDeliverySettings } from "./_shared"
import { DeliverySettings } from "@/lib/mongodb/models"
import { DEFAULT_WILAYAS, DEFAULT_ZONES, KNOWN_COMMUNES, communeKey } from "@/lib/algeria-data"
import { resolveZoneFees } from "@/lib/delivery"

// Delivery Settings (Global) - singleton document
export async function getDeliverySettings(): Promise<LeanDeliverySettings> {
  await ensureDB()
  let settings = await DeliverySettings.findOne().lean()

  if (!settings) {
    // Create defaults that match the storefront's static fallback (DEFAULT_ZONES).
    const zones = Object.values(DEFAULT_ZONES).map((zone) => ({
      zone: zone.id,
      label: `Zone ${zone.id}`,
      homeFee: zone.home,
      deskFee: zone.desk,
      minDays: zone.days[0],
      maxDays: zone.days[1],
    }))
    settings = await DeliverySettings.create({
      freeShippingThreshold: 15000,
      loyaltyFreeDeliveryThreshold: 15000,
      zones,
    })
  }

  return settings as unknown as LeanDeliverySettings
}

/**
 * Coerce a raw `communeFees` array into clean subdocuments. Unknown wilaya codes
 * and communes are dropped, numbers clamped. When `wilayaFilter` is given only
 * rows for that wilaya are kept. Returns undefined for non-array input.
 */
function sanitizeCommuneFees(input: unknown, wilayaFilter?: string) {
  if (!Array.isArray(input)) return undefined
  const wilayaCodes = new Set(DEFAULT_WILAYAS.map((wilaya) => wilaya.code))
  const seen = new Set<string>()
  const rows: Array<{ wilayaCode: string; commune: string; homeFee: number; deskFee: number }> = []
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const wilayaCode = String(raw.wilayaCode ?? '').trim().padStart(2, '0')
    const commune = String(raw.commune ?? '').trim()
    if (wilayaFilter && wilayaCode !== wilayaFilter) continue
    if (!wilayaCodes.has(wilayaCode)) continue
    const key = `${wilayaCode}:${communeKey(commune)}`
    if (!KNOWN_COMMUNES.has(key) || seen.has(key)) continue
    seen.add(key)
    rows.push({
      wilayaCode,
      commune,
      homeFee: Math.max(0, Math.trunc(Number(raw.homeFee) || 0)),
      deskFee: Math.max(0, Math.trunc(Number(raw.deskFee) || 0)),
    })
  }
  return rows
}

export async function updateDeliverySettings(data: Record<string, unknown>) {
  await ensureDB()
  const updateData: Record<string, unknown> = { ...data }

  // Free-delivery thresholds: keep DZD amounts non-negative integers.
  // A stored 0 is respected (it disables the loyalty reward); only junk
  // becomes the default.
  // Accept French-style separators ("20 000", "20,000") in the threshold inputs.
  // A stored 0 is respected; an empty field means "use the default".
  const parseDzd = (raw: unknown): number => {
    if (typeof raw === "string" && raw.trim() === "") return NaN
    const cleaned = typeof raw === "string" ? raw.replace(/[\s,]/g, "") : raw
    return Math.trunc(Number(cleaned))
  }
  if (updateData.freeShippingThreshold !== undefined) {
    const n = parseDzd(updateData.freeShippingThreshold)
    updateData.freeShippingThreshold = Number.isFinite(n) && n >= 0 ? n : 15000
  }
  if (updateData.loyaltyFreeDeliveryThreshold !== undefined) {
    const n = parseDzd(updateData.loyaltyFreeDeliveryThreshold)
    updateData.loyaltyFreeDeliveryThreshold = Number.isFinite(n) && n >= 0 ? n : 15000
  }

  // Commune fees are edited one wilaya at a time: replace that wilaya's rows,
  // keep every other wilaya's overrides, and drop anything identical to the
  // inherited zone price so the CMS stays sparse.
  const communeWilayaRaw = typeof updateData.communeWilaya === 'string' ? updateData.communeWilaya : undefined
  delete updateData.communeWilaya
  if (communeWilayaRaw !== undefined || updateData.communeFees !== undefined) {
    const wilayaCode = String(communeWilayaRaw ?? '').trim().padStart(2, '0')
    const existing = await DeliverySettings.findOne({}).lean() as unknown as {
      communeFees?: Array<{ wilayaCode: string; commune: string; homeFee: number; deskFee: number }>
      zones?: Array<{ zone: number; homeFee: number; deskFee: number; minDays: number; maxDays: number }>
      freeShippingThreshold?: number
    } | null
    const existingDoc = existing ?? null
    let rows = (existing?.communeFees ?? []).map((row) => ({ ...row }))
    if (/^\d{2}$/.test(wilayaCode)) {
      rows = rows.filter((row) => String(row.wilayaCode ?? '').padStart(2, '0') !== wilayaCode)
    }
    const submitted = sanitizeCommuneFees(updateData.communeFees, /^\d{2}$/.test(wilayaCode) ? wilayaCode : undefined) ?? []
    const found = /^\d{2}$/.test(wilayaCode) ? DEFAULT_WILAYAS.find((wilaya) => wilaya.code === wilayaCode) : undefined
    const inherited = found ? resolveZoneFees(existingDoc)[found.zone] : undefined
    const sparser = inherited
      ? submitted.filter((row) => row.homeFee !== inherited.home || row.deskFee !== inherited.desk)
      : submitted
    updateData.communeFees = sanitizeCommuneFees([...rows, ...sparser])
  }

  const settings = await DeliverySettings.findOneAndUpdate({}, updateData, { upsert: true, new: true }).lean()
  revalidatePath("/manage/delivery")
  refreshStorefront()
  return settings as unknown as LeanDeliverySettings
}
