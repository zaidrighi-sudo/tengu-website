import { Size } from "@/features/products/products"
import { categorySizeCharts } from "@/features/site-settings/data"

/**
 * International size charts based on height/weight for different garment types.
 * Measurements are in centimeters (height) and kilograms (weight).
 * These are general guidelines - actual fit varies by brand and style.
 */

export type ClothingType =
  | "hoodie"
  | "jogger"
  | "tee"
  | "outerwear"
  | "accessory"

export interface SizeRange {
  size: Size
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
}

/**
 * Default size charts for different clothing types.
 * Based on international sizing standards (EU/US/UK combined averages).
 * Ranges overlap to allow for personal fit preference.
 */
export const DEFAULT_SIZE_CHARTS: Record<ClothingType, SizeRange[]> = {
  hoodie: [
    { size: "S", minHeight: 160, maxHeight: 175, minWeight: 50, maxWeight: 70 },
    { size: "M", minHeight: 165, maxHeight: 180, minWeight: 60, maxWeight: 80 },
    { size: "L", minHeight: 170, maxHeight: 185, minWeight: 70, maxWeight: 90 },
    { size: "XL", minHeight: 175, maxHeight: 190, minWeight: 80, maxWeight: 100 },
    { size: "XXL", minHeight: 180, maxHeight: 195, minWeight: 90, maxWeight: 110 },
    { size: "XXXL", minHeight: 185, maxHeight: 200, minWeight: 100, maxWeight: 125 },
  ],
  jogger: [
    { size: "S", minHeight: 160, maxHeight: 175, minWeight: 50, maxWeight: 70 },
    { size: "M", minHeight: 165, maxHeight: 180, minWeight: 60, maxWeight: 80 },
    { size: "L", minHeight: 170, maxHeight: 185, minWeight: 70, maxWeight: 90 },
    { size: "XL", minHeight: 175, maxHeight: 190, minWeight: 80, maxWeight: 100 },
    { size: "XXL", minHeight: 180, maxHeight: 195, minWeight: 90, maxWeight: 110 },
    { size: "XXXL", minHeight: 185, maxHeight: 200, minWeight: 100, maxWeight: 125 },
  ],
  tee: [
    { size: "S", minHeight: 160, maxHeight: 175, minWeight: 50, maxWeight: 70 },
    { size: "M", minHeight: 165, maxHeight: 180, minWeight: 60, maxWeight: 80 },
    { size: "L", minHeight: 170, maxHeight: 185, minWeight: 70, maxWeight: 90 },
    { size: "XL", minHeight: 175, maxHeight: 190, minWeight: 80, maxWeight: 100 },
    { size: "XXL", minHeight: 180, maxHeight: 195, minWeight: 90, maxWeight: 110 },
    { size: "XXXL", minHeight: 185, maxHeight: 200, minWeight: 100, maxWeight: 125 },
  ],
  outerwear: [
    { size: "S", minHeight: 160, maxHeight: 175, minWeight: 50, maxWeight: 70 },
    { size: "M", minHeight: 165, maxHeight: 180, minWeight: 60, maxWeight: 80 },
    { size: "L", minHeight: 170, maxHeight: 185, minWeight: 70, maxWeight: 90 },
    { size: "XL", minHeight: 175, maxHeight: 190, minWeight: 80, maxWeight: 100 },
    { size: "XXL", minHeight: 180, maxHeight: 195, minWeight: 90, maxWeight: 110 },
    { size: "XXXL", minHeight: 185, maxHeight: 200, minWeight: 100, maxWeight: 125 },
  ],
  accessory: [
    { size: "One size", minHeight: 150, maxHeight: 200, minWeight: 45, maxWeight: 130 },
  ],
}

/**
 * Maps product category to clothing type for size chart lookup.
 */
export const CATEGORY_TO_CLOTHING_TYPE: Record<string, ClothingType> = {
  Hoodies: "hoodie",
  Joggers: "jogger",
  Tees: "tee",
  Outerwear: "outerwear",
  Accessories: "accessory",
}

/**
 * Determines the clothing type from a product's category.
 */
export function getClothingType(category: string): ClothingType {
  return CATEGORY_TO_CLOTHING_TYPE[category] || "tee"
}

/**
 * Gets the size chart for a specific category, using CMS data if available,
 * falling back to default charts based on clothing type.
 */
export function getSizeChartForCategory(category: string): SizeRange[] {
  // First check for CMS-defined size chart for this specific category
  const cmsChart = categorySizeCharts[category]
  if (cmsChart && cmsChart.length > 0) {
    return cmsChart.map(range => ({
      size: range.size as Size,
      minHeight: range.minHeight,
      maxHeight: range.maxHeight,
      minWeight: range.minWeight,
      maxWeight: range.maxWeight,
    }))
  }

  // Fall back to default chart based on clothing type
  const clothingType = getClothingType(category)
  return DEFAULT_SIZE_CHARTS[clothingType]
}

/**
 * Calculates the best size match based on height, weight, and clothing type.
 * Returns the size with the highest match score, or null if no good match.
 */
export function recommendSize(
  heightCm: number,
  weightKg: number,
  category: string,
  availableSizes: Size[]
): Size | null {
  const chart = getSizeChartForCategory(category)
  if (!chart || chart.length === 0) return null

  // Filter to only available sizes
  const availableRanges = chart.filter((range) => availableSizes.includes(range.size))
  if (availableRanges.length === 0) return null

  // Score each size based on how well the user's measurements fit
  const scored = availableRanges.map((range) => {
    let score = 0

    // Height score (0-100)
    if (heightCm >= range.minHeight && heightCm <= range.maxHeight) {
      score += 100
    } else {
      const heightMid = (range.minHeight + range.maxHeight) / 2
      const heightDiff = Math.abs(heightCm - heightMid)
      score += Math.max(0, 100 - heightDiff * 5)
    }

    // Weight score (0-100)
    if (weightKg >= range.minWeight && weightKg <= range.maxWeight) {
      score += 100
    } else {
      const weightMid = (range.minWeight + range.maxWeight) / 2
      const weightDiff = Math.abs(weightKg - weightMid)
      score += Math.max(0, 100 - weightDiff * 3)
    }

    return { size: range.size, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Return the best match if it has a reasonable score
  return scored[0].score > 50 ? scored[0].size : null
}

/**
 * Gets all size recommendations with scores for display.
 */
export function getSizeRecommendations(
  heightCm: number,
  weightKg: number,
  category: string,
  availableSizes: Size[]
): Array<{ size: Size; score: number; isRecommended: boolean }> {
  const chart = getSizeChartForCategory(category)
  if (!chart || chart.length === 0) return []

  const availableRanges = chart.filter((range) => availableSizes.includes(range.size))

  return availableRanges.map((range) => {
    let score = 0

    if (heightCm >= range.minHeight && heightCm <= range.maxHeight) {
      score += 100
    } else {
      const heightMid = (range.minHeight + range.maxHeight) / 2
      const heightDiff = Math.abs(heightCm - heightMid)
      score += Math.max(0, 100 - heightDiff * 5)
    }

    if (weightKg >= range.minWeight && weightKg <= range.maxWeight) {
      score += 100
    } else {
      const weightMid = (range.minWeight + range.maxWeight) / 2
      const weightDiff = Math.abs(weightKg - weightMid)
      score += Math.max(0, 100 - weightDiff * 3)
    }

    const maxScore = availableRanges.reduce((max, r) => {
      let s = 0
      if (heightCm >= r.minHeight && heightCm <= r.maxHeight) s += 100
      else {
        const hm = (r.minHeight + r.maxHeight) / 2
        s += Math.max(0, 100 - Math.abs(heightCm - hm) * 5)
      }
      if (weightKg >= r.minWeight && weightKg <= r.maxWeight) s += 100
      else {
        const wm = (r.minWeight + r.maxWeight) / 2
        s += Math.max(0, 100 - Math.abs(weightKg - wm) * 3)
      }
      return Math.max(max, s)
    }, 0)

    return {
      size: range.size,
      score: Math.round(score),
      isRecommended: score === maxScore && score > 50,
    }
  })
}

/**
 * Height and weight input validation.
 */
export const HEIGHT_RANGE = { min: 100, max: 250 } // cm
export const WEIGHT_RANGE = { min: 30, max: 200 } // kg

export function validateHeight(height: number): boolean {
  return height >= HEIGHT_RANGE.min && height <= HEIGHT_RANGE.max
}

export function validateWeight(weight: number): boolean {
  return weight >= WEIGHT_RANGE.min && weight <= WEIGHT_RANGE.max
}