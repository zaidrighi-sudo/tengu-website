import { useSyncExternalStore } from "react"

export * from "@/shared/i18n/core"
import { getLang, subscribeLang } from "@/shared/i18n/core"

/** Re-renders the caller whenever the language changes. */
export function useLang() {
  return useSyncExternalStore(subscribeLang, getLang, getLang)
}
