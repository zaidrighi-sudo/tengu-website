import { type CSSProperties, type FormEvent, useEffect, useState } from "react"
import {
  colorOptions,
  colorSwatches,
  fitOptions,
  shopCategories,
  sizeOptions,
} from "@/features/products/products"
import { cn } from "@/shared/utils/cn"
import {
  MAX_PRICE_LIMIT,
  type Facet,
  type Filters,
  optionCount,
  parsePrice,
  toggleValue,
} from "@/features/shop/utils"
import { t, tr } from "@/shared/i18n"
import { formatPrice } from "@/shared/utils/format"

type OptionProps = {
  type: "checkbox" | "radio"
  name: string
  label: string
  checked: boolean
  count?: number
  variant: "row" | "size" | "color"
  swatch?: string
  onChange: () => void
}

/** Native checkbox/radio with a custom face, so keyboard and AT support is free. */
function Option({
  type,
  name,
  label,
  checked,
  count,
  variant,
  swatch,
  onChange,
}: OptionProps) {
  const empty = count === 0 && !checked
  return (
    <label className={cn("opt", `opt-${variant}`, empty && "is-empty")}>
      <input
        className="opt-input"
        type={type}
        name={name}
        checked={checked}
        disabled={empty}
        onChange={onChange}
      />
      {variant === "row" && <span className="opt-box" aria-hidden="true" />}
      {swatch && (
        <span
          className="swatch opt-swatch"
          style={{ "--swatch": swatch } as CSSProperties}
          aria-hidden="true"
        />
      )}
      <span className="opt-label">{tr(label)}</span>
      {count !== undefined && variant !== "size" && (
        <span className="opt-count" aria-label={`${count} pieces`}>
          {count}
        </span>
      )}
    </label>
  )
}

/** Customer-typed budget: pieces above the amount are filtered out. */
function PriceMaxField({
  filters,
  onChange,
  scope,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  scope: string
}) {
  const [draft, setDraft] = useState(
    filters.priceMax === null ? "" : String(filters.priceMax),
  )

  // The budget can also change outside this field: chip removal, Clear all,
  // or a shared link opened while the panel is mounted.
  useEffect(() => {
    setDraft(filters.priceMax === null ? "" : String(filters.priceMax))
  }, [filters.priceMax])

  const nextPrice = parsePrice(draft)
  // An empty field means "no limit"; typing 0 (or junk) does too, but it still
  // needs an Apply so the field can be normalised back to empty.
  const dirty =
    nextPrice !== filters.priceMax || (draft.trim() !== "" && nextPrice === null)
  const inputId = `${scope}-price-max`
  const hintId = `${scope}-price-hint`

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDraft(nextPrice === null ? "" : String(nextPrice))
    if (dirty) onChange({ ...filters, priceMax: nextPrice })
  }

  return (
    <form className="price-set" onSubmit={apply}>
      <label className="price-set-label" htmlFor={inputId}>
        {t("Your maximum price")}
      </label>
      <div className="price-set-input">
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_PRICE_LIMIT}
          step={1}
          value={draft}
          placeholder={t("e.g. 6000")}
          aria-describedby={hintId}
          onChange={(event) => setDraft(event.target.value)}
        />
        <span className="price-set-unit">{t("DA")}</span>
      </div>
      <p className="price-set-hint" id={hintId}>
        {filters.priceMax !== null
          ? t("Showing pieces up to {price}", { price: formatPrice(filters.priceMax) })
          : t("Only pieces within your budget are shown.")}
      </p>
      <div className="price-set-actions">
        <button type="submit" className="price-set-apply" disabled={!dirty}>
          {t("Apply")}
        </button>
        {filters.priceMax !== null && (
          <button
            type="button"
            className="price-set-clear"
            onClick={() => onChange({ ...filters, priceMax: null })}
          >
            {t("Any price")}
          </button>
        )}
      </div>
    </form>
  )
}

/** The controls for one facet. Shared by the desktop menus and the mobile drawer. */
export function FacetFields({
  facet,
  filters,
  onChange,
  scope,
  /** Keeps radio-group names unique when two copies are mounted. */
}: {
  facet: Facet
  filters: Filters
  onChange: (next: Filters) => void
  scope: string
}) {
  if (facet === "price") {
    return <PriceMaxField filters={filters} onChange={onChange} scope={scope} />
  }

  if (facet === "size") {
    return (
      <div className="opt-sizes">
        {sizeOptions.map((size) => (
          <Option
            key={size}
            type="checkbox"
            name={`${scope}-size`}
            label={tr(size)}
            variant="size"
            checked={filters.size.includes(size)}
            count={optionCount("size", size, filters)}
            onChange={() => onChange(toggleValue(filters, "size", size))}
          />
        ))}
      </div>
    )
  }

  const items: string[] =
    facet === "category"
      ? shopCategories
      : facet === "color"
        ? colorOptions
        : fitOptions

  return (
    <div className="opt-list">
      {items.map((item) => (
        <Option
          key={item}
          type="checkbox"
          name={`${scope}-${facet}`}
          label={tr(item)}
          variant={facet === "color" ? "color" : "row"}
          swatch={
            facet === "color"
              ? colorSwatches[(item as keyof typeof colorSwatches)]
              : undefined
          }
          checked={filters[facet].includes(item)}
          count={optionCount(facet, item, filters)}
          onChange={() => onChange(toggleValue(filters, facet, item))}
        />
      ))}
    </div>
  )
}
