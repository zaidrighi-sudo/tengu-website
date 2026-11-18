import { getLang } from "@/store/i18n"
import { COMMUNES_BY_CODE, communeKey, wilayaByName } from "@/lib/algeria-data"

/**
 * Storefront view of the commune data. The raw dataset and key normaliser live
 * in `@/lib/algeria-data` so Server Actions can price orders without pulling
 * client-only i18n code into the server module graph.
 */

export type Commune = { name: string; arabic: string }

/** Communes of a wilaya, matched by the Latin name stored in addresses. */
export function communesForWilaya(wilayaName: string): Commune[] {
  const wilaya = wilayaByName(wilayaName)
  return wilaya ? COMMUNES_BY_CODE.get(wilaya.code) ?? [] : []
}

/** Option text for the commune select: Arabic name in Arabic, Latin otherwise. */
export function communeLabel(commune: Commune): string {
  return getLang() === "ar" ? commune.arabic : commune.name
}

/* ---------- Per-commune courier fees ---------- */

export type CommuneFee = { home: number; desk: number }

/**
 * Live per-commune fee overrides, keyed `${wilayaCode}:${communeKey(name)}`.
 * Empty until hydrated from the CMS; a missing entry means "use the wilaya fee".
 */
export const COMMUNE_FEES: Record<string, CommuneFee> = {}

export const communeFeeKey = (wilayaCode: string, commune: string) =>
  `${wilayaCode}:${communeKey(commune)}`

/** Effective override for a commune, or `null` when it inherits the wilaya price. */
export function communeFee(wilayaName: string, commune: string): CommuneFee | null {
  const wilaya = wilayaByName(wilayaName)
  if (!wilaya || !commune.trim()) return null
  return COMMUNE_FEES[communeFeeKey(wilaya.code, commune)] ?? null
}
