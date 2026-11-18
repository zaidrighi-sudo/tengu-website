import { DeliverySettings } from '@/shared/mongodb/models'
import {
  DEFAULT_ZONES,
  KNOWN_COMMUNES,
  communeKey,
  wilayaByName,
  type Zone,
} from '@/features/delivery/algeria-data'

export type DeliveryComputation = {
  fee: number
  minDays: number
  maxDays: number
  /** Human-readable range stored on the order, e.g. `2-4 days`. */
  deliveryDays: string
  freeShippingApplied: boolean
  /** True when free home delivery came from the lifetime-spend loyalty reward (not the cart threshold). */
  loyaltyApplied: boolean
  zone: Zone['id'] | null
}

type DeliverySettingsShape = {
  freeShippingThreshold?: number
  loyaltyFreeDeliveryThreshold?: number
  zones?: Array<{ zone: number; homeFee: number; deskFee: number; minDays: number; maxDays: number }>
  communeFees?: Array<{ wilayaCode: string; commune: string; homeFee: number; deskFee: number }>
}

export type ResolvedZoneFee = { home: number; desk: number; days: [number, number] }

export type CommuneFeeRow = { wilayaCode: string; commune: string; home: number; desk: number }

/**
 * Resolve the commune fee overrides: only rows for known communes survive.
 * Pure — never writes. Keyed `${wilayaCode}:${communeKey(commune)}`.
 */
export function resolveCommuneFees(doc: DeliverySettingsShape | null): Record<string, CommuneFeeRow> {
  const resolved: Record<string, CommuneFeeRow> = {}
  if (!Array.isArray(doc?.communeFees)) return resolved
  for (const row of doc.communeFees) {
    const wilayaCode = String(row?.wilayaCode ?? '').padStart(2, '0')
    const commune = String(row?.commune ?? '').trim()
    const key = `${wilayaCode}:${communeKey(commune)}`
    if (!KNOWN_COMMUNES.has(key)) continue
    resolved[key] = {
      wilayaCode,
      commune,
      home: Math.max(0, Number(row.homeFee) || 0),
      desk: Math.max(0, Number(row.deskFee) || 0),
    }
  }
  return resolved
}

/**
 * Resolve the effective fee for every zone `1`–`5`: the static defaults as the
 * base, with the CMS `zones` array overriding them. Pure — never writes.
 */
export function resolveZoneFees(doc: DeliverySettingsShape | null): Record<Zone['id'], ResolvedZoneFee> {
  const resolved = new Map<number, ResolvedZoneFee>()
  for (const [id, zone] of Object.entries(DEFAULT_ZONES)) {
    resolved.set(Number(id), { home: zone.home, desk: zone.desk, days: [zone.days[0], zone.days[1]] })
  }
  if (Array.isArray(doc?.zones)) {
    for (const zone of doc.zones) {
      const id = Number(zone?.zone)
      if (!Number.isInteger(id) || id < 1 || id > 5) continue
      const minDays = Math.max(1, Math.trunc(Number(zone.minDays) || 1))
      const maxDays = Math.max(minDays, Math.trunc(Number(zone.maxDays) || minDays))
      resolved.set(id, {
        home: Math.max(0, Number(zone.homeFee) || 0),
        desk: Math.max(0, Number(zone.deskFee) || 0),
        days: [minDays, maxDays],
      })
    }
  }
  return Object.fromEntries(resolved) as Record<Zone['id'], ResolvedZoneFee>
}

/** Default lifetime spend that unlocks free home delivery; 0 disables the reward. */
export const DEFAULT_LOYALTY_FREE_DELIVERY_THRESHOLD = 15000

/** Resolve the loyalty free-home-delivery threshold; a stored 0 disables the reward. */
export const loyaltyThresholdOf = (doc: DeliverySettingsShape | null) =>
  doc?.loyaltyFreeDeliveryThreshold ?? DEFAULT_LOYALTY_FREE_DELIVERY_THRESHOLD

const mapZones = (doc: DeliverySettingsShape | null) => {
  const threshold = doc?.freeShippingThreshold ?? 15000
  return { threshold, loyaltyThreshold: loyaltyThresholdOf(doc), zones: resolveZoneFees(doc) }
}

async function loadDeliverySettings() {
  try {
    const doc = await DeliverySettings.findOne().lean()
    return { ...mapZones(doc as unknown as DeliverySettingsShape | null), doc: doc as unknown as DeliverySettingsShape | null }
  } catch (error) {
    // Never block an order because the delivery settings are unreadable — fall back to defaults.
    console.error('Could not load delivery settings, using defaults:', error)
    return { ...mapZones(null), doc: null }
  }
}

/**
 * Compute the delivery fee and window for an order, server-side, from the
 * DeliverySettings CMS document. Precedence: commune fees (when the commune is
 * known) → the CMS zone table → static zone defaults. Mirrors the storefront
 * estimate (`wilayaByName` + hydrated `ZONES`/`COMMUNE_FEES`).
 *
 * `lifetimeSpent` is the customer's total on *delivered* orders. Once it reaches
 * the loyalty threshold, home delivery is free forever (the cart-threshold free
 * shipping still wins for the record when both apply).
 */
export async function computeDelivery(
  method: 'home' | 'desk',
  subtotal: number,
  wilaya: string,
  commune?: string,
  lifetimeSpent = 0,
): Promise<DeliveryComputation> {
  const { threshold, loyaltyThreshold, zones, doc } = await loadDeliverySettings()
  const found = wilayaByName(wilaya)
  const zoneId = found?.zone ?? null

  if (!found) {
    // Unknown wilaya: no fee rather than a wrong fee, and a conservative window.
    return { fee: 0, minDays: 2, maxDays: 5, deliveryDays: '2-5 days', freeShippingApplied: false, loyaltyApplied: false, zone: zoneId }
  }

  const zoneFee = zones[found.zone]
  const [minDays, maxDays] = zoneFee.days
  const communeOverride = commune?.trim()
    ? resolveCommuneFees(doc)[`${found.code}:${communeKey(commune)}`]
    : undefined
  const homeFee = communeOverride?.home ?? zoneFee.home
  const deskFee = communeOverride?.desk ?? zoneFee.desk
  const free = method === 'home' && subtotal >= threshold
  const loyaltyApplied =
    method === 'home' && !free && loyaltyThreshold > 0 && lifetimeSpent >= loyaltyThreshold
  const fee = free || loyaltyApplied ? 0 : method === 'desk' ? deskFee : homeFee
  return {
    fee,
    minDays,
    maxDays,
    deliveryDays: `${minDays}-${maxDays} days`,
    freeShippingApplied: free,
    loyaltyApplied,
    zone: zoneId,
  }
}
