import { useSyncExternalStore } from "react"

const subscribe = (notify: () => void) => {
  window.addEventListener("hashchange", notify)
  return () => window.removeEventListener("hashchange", notify)
}

/** The current `location.hash`, re-rendering on change. */
export function useHash() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  )
}

/** `#/account?tab=orders` -> { path: "account", params: tab=orders }. */
export function parseHash(hash: string) {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?")
  return { path, params: new URLSearchParams(query) }
}

/** Switch page without leaving a history entry. */
export function replaceHash(hash: string) {
  window.location.replace(hash)
}

/** Only follow in-app page routes when redirecting after sign in. */
export function safeNext(value: string | null, fallback = "#/account") {
  if (!value || !value.startsWith("#/")) return fallback
  if (/^#\/(login|register|forgot)/.test(value)) return fallback
  return value
}
