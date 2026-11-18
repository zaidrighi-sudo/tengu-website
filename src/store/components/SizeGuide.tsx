"use client"

import { useState, useCallback } from "react"
import { type Product, type Size, type ColorName } from "@/store/data/products"
import { SizePicker, sizesToShow } from "./SizePicker"
import {
  colorHexFor,
  colorsForProduct,
  defaultColor,
  isStockTracked,
  stockFor,
} from "@/store/utils/variants"
import {
  recommendSize,
  getSizeRecommendations,
  validateHeight,
  validateWeight,
  HEIGHT_RANGE,
  WEIGHT_RANGE,
} from "@/store/data/size-charts"
import { t, tr } from "@/store/i18n"
import { cn } from "@/store/utils/cn"

/**
 * SizeGuide - A size picker with optional height/weight based size recommendation
 * and color selection. When user enters height and weight, it shows recommended
 * size based on international standards or custom CMS-defined size charts for the category.
 */
export function SizeGuide({
  product,
  onPick,
  color,
  onColorChange,
  className,
}: {
  product: Product
  onPick: (size: Size, color: ColorName) => void
  /** Controlled colorway. Falls back to the product's default color. */
  color?: ColorName
  onColorChange?: (color: ColorName) => void
  className?: string
}) {
  const [height, setHeight] = useState<number | "">("")
  const [weight, setWeight] = useState<number | "">("")
  const [showGuide, setShowGuide] = useState(false)
  const [recommendedSize, setRecommendedSize] = useState<Size | null>(null)
  const [internalColor, setInternalColor] = useState<ColorName>(() => defaultColor(product))

  const colors = colorsForProduct(product)
  const selectedColor = color ?? internalColor

  // Only sizes that are actually buyable in the selected color are suggested.
  const availableSizes = sizesToShow(product, selectedColor).filter((size) =>
    isStockTracked(product)
      ? stockFor(product, selectedColor, size) > 0
      : product.sizes.includes(size),
  )
  const isAccessory = product.sizes.length === 1 && product.sizes[0] === "One size"

  const handleHeightChange = useCallback((value: string) => {
    const num = value === "" ? "" : Number(value)
    setHeight(num)
    if (num !== "" && weight !== "") {
      const rec = recommendSize(num, weight, product.category, availableSizes)
      setRecommendedSize(rec)
    }
  }, [weight, product.category, availableSizes])

  const handleWeightChange = useCallback((value: string) => {
    const num = value === "" ? "" : Number(value)
    setWeight(num)
    if (num !== "" && height !== "") {
      const rec = recommendSize(height, num, product.category, availableSizes)
      setRecommendedSize(rec)
    }
  }, [height, product.category, availableSizes])

  const recommendations = height !== "" && weight !== ""
    ? getSizeRecommendations(height, weight, product.category, availableSizes)
    : []

  const heightValid = height === "" || validateHeight(height)
  const weightValid = weight === "" || validateWeight(weight)

  const handleSizePick = (size: Size) => {
    onPick(size, selectedColor)
    setShowGuide(false)
  }

  const handleColorPick = (colorName: ColorName) => {
    setInternalColor(colorName)
    setRecommendedSize(null)
    onColorChange?.(colorName)
  }

  return (
    <div className={cn("size-guide", className)}>
      {/* Size Picker - First (always visible) */}
      <SizePicker
        product={product}
        color={selectedColor}
        onPick={(size) => onPick(size, selectedColor)}
        className={showGuide && !isAccessory ? "size-picker-compact" : ""}
      />

      {/* Color Selection - After size */}
      {colors.length > 1 && (
        <div className="size-guide-colors" role="group" aria-label={t("Select a color")}>
          <div className="color-picker-label">{t("Color:")}</div>
          <div className="color-chips">
            {colors.map((colorName) => {
              const hex = colorHexFor(product, colorName)
              const isSelected = selectedColor === colorName
              return (
                <button
                  key={colorName}
                  type="button"
                  className={cn("color-chip", isSelected && "selected")}
                  onClick={() => handleColorPick(colorName)}
                  aria-label={t("Color {name} ({hex})", { name: tr(colorName), hex })}
                  aria-pressed={isSelected}
                  style={{ "--color-hex": hex } as React.CSSProperties}
                >
                  <span className="color-chip-swatch" style={{ backgroundColor: hex }} />
                  <span className="color-chip-name">{tr(colorName)}</span>
                  <span className="color-chip-hex">{hex}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Size Guide Toggle */}
      {!isAccessory && (
        <button
          type="button"
          className={cn("size-guide-toggle", showGuide && "open")}
          onClick={() => setShowGuide((open) => !open)}
          aria-expanded={showGuide}
        >
          <span className="toggle-icon">📏</span>
          <span>{showGuide ? t("Hide size guide") : t("Find my size")}</span>
        </button>
      )}

      {/* Height/Weight Input Panel */}
      {showGuide && !isAccessory && (
        <div className="size-guide-panel" role="region" aria-label={t("Size guide")}>
          <div className="size-guide-header">
            <h4>{t("Enter your measurements")}</h4>
            <p className="size-guide-hint">
              {t("We'll suggest the best size based on sizing standards for this category")}
            </p>
          </div>

          <div className="size-guide-inputs">
            <div className="guide-input-group">
              <label htmlFor="height-input" className="guide-label">
                {t("Height (cm)")}
              </label>
              <input
                id="height-input"
                type="number"
                min={HEIGHT_RANGE.min}
                max={HEIGHT_RANGE.max}
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className={cn("guide-input", !heightValid && "error")}
                placeholder={t("e.g. 175")}
                autoComplete="off"
              />
              {!heightValid && (
                <span className="guide-error">
                  {t("Please enter a height between {min} and {max} cm", {
                    min: HEIGHT_RANGE.min,
                    max: HEIGHT_RANGE.max,
                  })}
                </span>
              )}
            </div>

            <div className="guide-input-group">
              <label htmlFor="weight-input" className="guide-label">
                {t("Weight (kg)")}
              </label>
              <input
                id="weight-input"
                type="number"
                min={WEIGHT_RANGE.min}
                max={WEIGHT_RANGE.max}
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className={cn("guide-input", !weightValid && "error")}
                placeholder={t("e.g. 70")}
                autoComplete="off"
              />
              {!weightValid && (
                <span className="guide-error">
                  {t("Please enter a weight between {min} and {max} kg", {
                    min: WEIGHT_RANGE.min,
                    max: WEIGHT_RANGE.max,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Recommendation Result */}
          {(height !== "" || weight !== "") && (
            <div className="size-guide-result">
              {recommendedSize ? (
                <div className="recommendation-box">
                  <span className="recommendation-icon">✓</span>
                  <div className="recommendation-text">
                    <strong>{t("Recommended size:")}</strong>
                    <span className="recommended-size">{tr(recommendedSize)}</span>
                    <p className="recommendation-note">
                      {t("Based on your measurements and sizing standards for {category}", {
                        category: t(product.category),
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="recommendation-box no-match">
                  <span className="recommendation-icon">⚠</span>
                  <p>{t("No exact match found. Please try the size chart below.")}</p>
                </div>
              )}
            </div>
          )}

          {/* Size Chart with Scores */}
          {recommendations.length > 0 && (
            <div className="size-chart-scores" role="list" aria-label={t("Size recommendations")}>
              <h5>{t("All sizes for this item")}</h5>
              <div className="score-chips">
                {recommendations.map(({ size, score, isRecommended }) => (
                  <button
                    key={size}
                    type="button"
                    className={cn(
                      "size-chip score-chip",
                      isRecommended && "recommended",
                      score < 50 && "low-match"
                    )}
                    onClick={() => handleSizePick(size)}
                    aria-label={
                      isRecommended
                        ? t("Size {size}, recommended ({score}% match)", { size, score })
                        : t("Size {size}, {score}% match", { size, score })
                    }
                  >
                    {tr(size)}
                    {isRecommended && <span className="recommended-badge" aria-hidden="true">★</span>}
                    {score > 0 && <span className="match-score">{score}%</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            className="size-guide-close"
            onClick={() => setShowGuide(false)}
          >
            {t("Close")}
          </button>
        </div>
      )}
    </div>
  )
}