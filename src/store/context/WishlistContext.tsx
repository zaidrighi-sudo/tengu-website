import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { products } from "@/store/data/products"

type WishlistValue = {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
  clear: () => void
}

const KEY = "tengu-wishlist"
const WishlistContext = createContext<WishlistValue | null>(null)

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter(
          (id): id is string =>
            typeof id === "string" && products.some((p) => p.id === id),
        )
      : []
  } catch {
    return []
  }
}

/** Saved pieces. Works for guests; kept on this device. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(read)

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      /* storage unavailable: keep in memory */
    }
  }, [ids])

  const toggle = useCallback(
    (id: string) =>
      setIds((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [id, ...current],
      ),
    [],
  )
  const clear = useCallback(() => setIds([]), [])

  const value = useMemo<WishlistValue>(
    () => ({ ids, has: (id) => ids.includes(id), toggle, clear }),
    [ids, toggle, clear],
  )
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used inside <WishlistProvider>")
  return context
}
