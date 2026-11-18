"use client"

import { useState } from "react"

export type AdminInventoryItem = {
  color: string
  colorHex?: string
  size: string
  quantity: number
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One size"]

/**
 * Sizes and stock per color. Each color derived from the gallery gets its own
 * size list; quantities are whole numbers >= 0. Preset chips cover the usual
 * apparel run and the custom field accepts anything else (38, 40, 42, ...).
 */
export function ProductInventoryManager({
  colors,
  value,
  onChange,
  disabled,
  error,
}: {
  colors: Array<{ name: string; hex: string }>
  value: AdminInventoryItem[]
  onChange: (items: AdminInventoryItem[]) => void
  disabled?: boolean
  error?: string
}) {
  const [customSize, setCustomSize] = useState<Record<string, string>>({})
  const [customError, setCustomError] = useState<Record<string, string>>({})

  const itemsFor = (color: string) =>
    value.filter((item) => item.color.toLowerCase() === color.toLowerCase())

  function addSize(color: string, colorHex: string, rawSize: string) {
    const size = rawSize.trim()
    if (!size) return
    if (itemsFor(color).some((item) => item.size.toLowerCase() === size.toLowerCase())) {
      setCustomError((current) => ({ ...current, [color]: `"${size}" already exists for this color.` }))
      return
    }
    setCustomError((current) => ({ ...current, [color]: "" }))
    onChange([...value, { color, colorHex, size, quantity: 0 }])
  }

  function removeSize(color: string, size: string) {
    onChange(
      value.filter(
        (item) =>
          !(item.color.toLowerCase() === color.toLowerCase() && item.size === size),
      ),
    )
  }

  function setQuantity(color: string, size: string, raw: string) {
    const quantity = Math.max(0, Math.trunc(Number(raw) || 0))
    onChange(
      value.map((item) =>
        item.color.toLowerCase() === color.toLowerCase() && item.size === size
          ? { ...item, quantity }
          : item,
      ),
    )
  }

  if (colors.length === 0) {
    return (
      <p className="admin-upload-hint">
        Add images and link each to a color first. Then you can set sizes and stock per color here.
      </p>
    )
  }

  return (
    <div className="admin-inventory">
      {error && (
        <span className="admin-field-error" style={{ display: "block" }}>
          {error}
        </span>
      )}

      {colors.map((color) => {
        const items = itemsFor(color.name)
        const used = new Set(items.map((item) => item.size.toLowerCase()))
        return (
          <div className="admin-inventory-color" key={color.name}>
            <div className="admin-inventory-color-head">
              <span className="admin-swatch" style={{ backgroundColor: color.hex }} />
              <strong>{color.name}</strong>
              <span className="admin-inventory-count">
                {items.length} {items.length === 1 ? "size" : "sizes"}
              </span>
            </div>

            {items.length === 0 ? (
              <span className="admin-field-error" style={{ display: "block" }}>
                Add at least one size for {color.name}.
              </span>
            ) : (
              <div className="admin-inventory-rows">
                {items.map((item) => (
                  <div className="admin-inventory-row" key={item.size}>
                    <span className="admin-inventory-size">{item.size}</span>
                    <label className="admin-inventory-qty">
                      <span>Qty</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={Number.isFinite(item.quantity) ? item.quantity : 0}
                        onChange={(event) => setQuantity(color.name, item.size, event.target.value)}
                        className="admin-field-input"
                        disabled={disabled}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-action-btn delete"
                      onClick={() => removeSize(color.name, item.size)}
                      disabled={disabled}
                      aria-label={`Remove size ${item.size}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-size-chips">
              {PRESET_SIZES.filter((size) => !used.has(size.toLowerCase())).map((size) => (
                <button
                  key={size}
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => addSize(color.name, color.hex, size)}
                  disabled={disabled}
                >
                  + {size}
                </button>
              ))}
            </div>

            <div className="admin-custom-size">
              <input
                type="text"
                value={customSize[color.name] ?? ""}
                onChange={(event) =>
                  setCustomSize((current) => ({ ...current, [color.name]: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  event.preventDefault()
                  addSize(color.name, color.hex, customSize[color.name] ?? "")
                  setCustomSize((current) => ({ ...current, [color.name]: "" }))
                }}
                className="admin-field-input"
                placeholder="Custom size (e.g. 38)"
                disabled={disabled}
                aria-label={`Custom size for ${color.name}`}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  addSize(color.name, color.hex, customSize[color.name] ?? "")
                  setCustomSize((current) => ({ ...current, [color.name]: "" }))
                }}
                disabled={disabled}
              >
                Add size
              </button>
            </div>

            {customError[color.name] && (
              <span className="admin-field-error" style={{ display: "block" }}>
                {customError[color.name]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
