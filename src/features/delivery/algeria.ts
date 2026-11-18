import { getLang } from "@/shared/i18n/core"
import { wilayaByName, type Wilaya } from "@/features/delivery/algeria-data"

/**
 * Storefront view of the Algerian delivery data. The raw dataset lives in
 * `@/lib/algeria-data` so Server Actions can price orders without pulling
 * client-only i18n code into the server module graph.
 */
export {
  DEFAULT_WILAYAS,
  DEFAULT_ZONES,
  WILAYAS,
  ZONES,
  wilayaByName,
  type Wilaya,
  type Zone,
} from "@/features/delivery/algeria-data"

/** Option text for the wilaya select: Arabic name in Arabic, Latin otherwise. */
export const wilayaLabel = (wilaya: Wilaya) =>
  `${wilaya.code} - ${getLang() === "ar" ? wilaya.arabic : wilaya.name}`

/** Display name for a stored wilaya (addresses keep the Latin name). */
export const wilayaDisplay = (name: string) => {
  const found = wilayaByName(name)
  return found && getLang() === "ar" ? found.arabic : name
}
