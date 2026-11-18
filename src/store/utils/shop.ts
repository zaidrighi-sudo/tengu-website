import {
  type Product,
  priceBands,
  products,
  sizeOptions,
  shopCategories,
  colorOptions,
  fitOptions,
} from "@/store/data/products"

export type Facet = "category" | "size" | "color" | "price" | "fit"

export type Filters = {
  category: string[]
  size: string[]
  color: string[]
  fit: string[]
  /** One price band id, or null for any price. */
  price: string | null
  newOnly: boolean
  saleOnly: boolean
  /** Free-text search from the header search box or `?search=`. */
  search: string
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name"

export type SortOption = {
  key: SortKey
  label: string
}

export const SORTS: SortOption[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A to Z" },
]

export const EMPTY_FILTERS: Filters = {
  category: [],
  size: [],
  color: [],
  fit: [],
  price: null,
  newOnly: false,
  saleOnly: false,
  search: "",
}

export const FACET_LABELS: Record<Facet, string> = {
  category: "Category",
  size: "Size",
  color: "Color",
  price: "Price",
  fit: "Fit",
}

export const FACETS: Facet[] = ["category", "size", "color", "price", "fit"]

const ALLOWED: Record<"category" | "size" | "color" | "fit", string[]> = {
  category: shopCategories,
  size: sizeOptions,
  color: colorOptions,
  fit: fitOptions,
}

/** Reads filters + sort from a hash like `#/shop?category=Hoodies&size=M`. */
export type ShopQuery = {
  filters: Filters
  sort: SortKey
}

export function parseHash(hash: string): ShopQuery {
  const query = new URLSearchParams(hash.split("?")[1] ?? "")
  const list = (key: keyof typeof ALLOWED) =>
    (query.get(key)?.split(",") ?? []).filter((value) =>
      ALLOWED[key].includes(value),
    )
  const price = query.get("price")
  const sort = query.get("sort") as SortKey | null
  const search = (query.get("search") ?? "").replace(/\s+/g, " ").trim().slice(0, 80)
  return {
    filters: {
      category: list("category"),
      size: list("size"),
      color: list("color"),
      fit: list("fit"),
      price: priceBands.some((band) => band.id === price) ? price : null,
      newOnly: query.get("new") === "1",
      saleOnly: query.get("sale") === "1",
      search,
    },
    sort: SORTS.some((option) => option.key === sort)
      ? sort as SortKey
      : "featured",
  }
}

export function toHash(filters: Filters, sort: SortKey) {
  const query = new URLSearchParams()
  for (const key of ["category", "size", "color", "fit"] as const) {
    if (filters[key].length) query.set(key, filters[key].join(","))
  }
  if (filters.price) query.set("price", filters.price)
  if (filters.newOnly) query.set("new", "1")
  if (filters.saleOnly) query.set("sale", "1")
  const search = filters.search.trim()
  if (search) query.set("search", search)
  if (sort !== "featured") query.set("sort", sort)
  const text = query.toString()
  return text ? `#/shop?${text}` : "#/shop"
}

export function matches(product: Product, filters: Filters) {
  const needle = filters.search.trim().toLowerCase()
  if (needle) {
    const haystack = [
      product.name,
      product.category,
      product.color,
      ...(product.colors ?? []),
      product.fit ?? "",
    ]
      .join(" ")
      .toLowerCase()
    // Every word of the query must appear somewhere in the product text.
    if (!needle.split(/\s+/).every((word) => haystack.includes(word)))
      return false
  }
  if (filters.newOnly && product.status !== "new") return false
  if (filters.saleOnly && product.status !== "sale") return false
  if (filters.category.length && !filters.category.includes(product.category))
    return false
  if (
    filters.size.length &&
    !filters.size.some((s) => product.sizes.includes(s as never))
  )
    return false
  if (
    filters.color.length &&
    !filters.color.some((c) => product.colors.includes(c as never))
  )
    return false
  if (filters.fit.length && !(product.fit && filters.fit.includes(product.fit)))
    return false
  if (filters.price) {
    const band = priceBands.find((item) => item.id === filters.price)
    if (band && (product.price < band.min || product.price > band.max))
      return false
  }
  return true
}

export function sortProducts(list: Product[], sort: SortKey) {
  const copy = [...list]
  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) =>
          Number(b.status === "new") - Number(a.status === "new") ||
          products.indexOf(b) - products.indexOf(a),
      )
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price)
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price)
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return copy
  }
}

/** How many pieces an option would show, given every *other* active filter. */
export function optionCount(facet: Facet, value: string, filters: Filters) {
  const next: Filters = {
    ...filters,
    [facet]: facet === "price" ? value : [value],
  }
  return products.filter((product) => matches(product, next)).length
}

export type Chip = {
  facet: Facet | "new" | "sale" | "search"
  value: string
  label: string
}

export function activeChips(filters: Filters): Chip[] {
  const chips: Chip[] = []
  const search = filters.search.trim()
  if (search) chips.push({ facet: "search", value: search, label: `Search: ${search}` })
  if (filters.newOnly)
    chips.push({ facet: "new", value: "1", label: "New drop" })
  if (filters.saleOnly)
    chips.push({ facet: "sale", value: "1", label: "Sale" })
  for (const facet of ["category", "size", "color", "fit"] as const) {
    for (const value of filters[facet])
      chips.push({ facet, value, label: value })
  }
  if (filters.price) {
    const band = priceBands.find((item) => item.id === filters.price)
    if (band) chips.push({ facet: "price", value: band.id, label: band.label })
  }
  return chips
}

export function removeChip(filters: Filters, chip: Chip): Filters {
  if (chip.facet === "search") return { ...filters, search: "" }
  if (chip.facet === "new") return { ...filters, newOnly: false }
  if (chip.facet === "sale") return { ...filters, saleOnly: false }
  if (chip.facet === "price") return { ...filters, price: null }
  return {
    ...filters,
    [chip.facet]: filters[chip.facet].filter((value) => value !== chip.value),
  }
}

export function toggleValue(
  filters: Filters,
  facet: "category" | "size" | "color" | "fit",
  value: string,
): Filters {
  const current = filters[facet]
  return {
    ...filters,
    [facet]: current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value],
  }
}

export function facetSelectedCount(filters: Filters, facet: Facet) {
  return facet === "price"
    ? Number(filters.price !== null)
    : filters[facet].length
}
