import { useSyncExternalStore } from "react"

export * from "./core"
import { getLang, subscribeLang } from "./core"

/** Re-renders the caller whenever the language changes. */
export function useLang() {
  return useSyncExternalStore(subscribeLang, getLang, getLang)
}
