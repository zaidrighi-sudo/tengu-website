import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { type Product, type Size, type ColorName, products } from "@/features/products/products"
import { colorsForProduct, isStockTracked, stockFor } from "@/features/products/variants"

type Line = {
  id: string
  size: Size
  color: ColorName
  qty: number
}
export type CartLine = {
  product: Product
  size: Size
  color: ColorName
  qty: number
}

/** Stable key for a bag line: the same piece in two sizes OR two colors is two lines. */
export const lineKey = (id: string, size: Size, color: ColorName) => `${id}-${size}-${color}`

type CartValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  /** Free-text note for the order, kept with the bag. */
  note: string
  setNote: (note: string) => void
  add: (
    product: Product,
    size: Size,
    color: ColorName,
    options?: { openCart?: boolean },
  ) => void
  clear: () => void
  setQty: (id: string, size: Size, color: ColorName, qty: number) => void
  remove: (id: string, size: Size, color: ColorName) => void
  openCart: () => void
  closeCart: () => void
}

const STORAGE_KEY = "tengu-cart"
const NOTE_KEY = "tengu-cart-note"
export const MAX_QTY = 9
export const MAX_NOTE = 240

const CartContext = createContext<CartValue | null>(null)

/**
 * How many of a color + size can go in the bag. Tracked products cannot exceed
 * their stock; untracked (legacy) products keep the old 9-piece limit.
 */
export function lineLimit(product: Product, size: Size, color: ColorName): number {
  if (!isStockTracked(product)) return MAX_QTY
  const stock = stockFor(product, color, size)
  return Math.max(0, Math.min(MAX_QTY, Number.isFinite(stock) ? stock : MAX_QTY))
}

function readStored(): Line[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((line) => {
      if (
        typeof line?.id !== "string" ||
        typeof line?.size !== "string" ||
        typeof line?.qty !== "number" ||
        typeof line?.color !== "string"
      ) {
        return []
      }
      const product = products.find((candidate) => candidate.id === line.id)
      if (!product) return []
      if (!product.sizes.includes(line.size)) return []
      if (!colorsForProduct(product).includes(line.color)) return []
      // Stock may have changed since the bag was saved.
      const qty = Math.min(MAX_QTY, Math.floor(line.qty), lineLimit(product, line.size, line.color))
      if (qty <= 0) return []
      return [{ id: line.id, size: line.size, color: line.color, qty }]
    })
  } catch {
    return []
  }
}

function readNote() {
  try {
    return window.localStorage.getItem(NOTE_KEY)?.slice(0, MAX_NOTE) ?? ""
  } catch {
    return ""
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Line[]>(readStored)
  const [note, setNoteState] = useState(readNote)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable: keep the cart in memory only */
    }
  }, [items])

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTE_KEY, note)
    } catch {
      /* storage unavailable */
    }
  }, [note])

  const setNote = useCallback(
    (value: string) => setNoteState(value.slice(0, MAX_NOTE)),
    [],
  )

  const clear = useCallback(() => {
    setItems([])
    setNoteState("")
  }, [])

  const add = useCallback(
    (product: Product, size: Size, color: ColorName, options?: { openCart?: boolean }) => {
      if (product.status === "soldout") return
      if (!product.sizes.includes(size)) return
      if (!colorsForProduct(product).includes(color)) return

      const limit = lineLimit(product, size, color)
      if (limit <= 0) return

      setItems((current) => {
        const existing = current.find(
          (line) => line.id === product.id && line.size === size && line.color === color,
        )
        if (!existing) return [...current, { id: product.id, size, color, qty: Math.min(1, limit) }]
        return current.map((line) =>
          line === existing
            ? { ...line, qty: Math.min(limit, line.qty + 1) }
            : line,
        )
      })
      if (options?.openCart !== false) setIsOpen(true)
    },
    [],
  )

  const setQty = useCallback((id: string, size: Size, color: ColorName, qty: number) => {
    setItems((current) => {
      const product = products.find((candidate) => candidate.id === id)
      const limit = product ? lineLimit(product, size, color) : 0
      const next = Math.min(qty, limit)
      return next <= 0
        ? current.filter((line) => !(line.id === id && line.size === size && line.color === color))
        : current.map((line) =>
            line.id === id && line.size === size && line.color === color
              ? { ...line, qty: next }
              : line,
          )
    })
  }, [])

  const remove = useCallback((id: string, size: Size, color: ColorName) => {
    setItems((current) =>
      current.filter((line) => !(line.id === id && line.size === size && line.color === color)),
    )
  }, [])

  const value = useMemo<CartValue>(() => {
    // Drop lines whose variant no longer exists or sold out while in the bag.
    const lines = items.flatMap((line) => {
      const product = products.find((candidate) => candidate.id === line.id)
      if (!product) return []
      if (lineLimit(product, line.size, line.color) <= 0) return []
      return [{ product, size: line.size, color: line.color, qty: line.qty }]
    })
    return {
      lines,
      count: lines.reduce((total, line) => total + line.qty, 0),
      subtotal: lines.reduce(
        (total, line) => total + line.product.price * line.qty,
        0,
      ),
      isOpen,
      note,
      setNote,
      clear,
      add,
      setQty,
      remove,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }
  }, [items, isOpen, note, setNote, clear, add, setQty, remove])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside <CartProvider>")
  return context
}
