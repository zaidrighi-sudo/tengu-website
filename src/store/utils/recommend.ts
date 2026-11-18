import { type Product, products } from "@/store/data/products"

/**
 * Add-ons for the bag: small, in-stock pieces that are not already in it.
 * Accessories first, then tees, then everything else, cheapest first.
 */
export function recommendAddOns(inBag: string[], limit: number): Product[] {
  const rank = (product: Product) =>
    product.category === "Accessories" ? 0 : product.category === "Tees" ? 1 : 2
  return products
    .filter(
      (product) => product.status !== "soldout" && !inBag.includes(product.id),
    )
    .sort((a, b) => rank(a) - rank(b) || a.price - b.price)
    .slice(0, limit)
}
