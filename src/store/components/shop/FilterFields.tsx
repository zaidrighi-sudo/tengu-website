import type { CSSProperties } from "react"
import {
  colorOptions,
  colorSwatches,
  fitOptions,
  priceBands,
  shopCategories,
  sizeOptions,
} from "@/store/data/products"
import { cn } from "@/store/utils/cn"
import {
  type Facet,
  type Filters,
  optionCount,
  toggleValue,
} from "@/store/utils/shop"
import { t, tr } from "@/store/i18n"

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
    return (
      <div className="opt-list">
        <Option
          type="radio"
          name={`${scope}-price`}
          label={t("Any price")}
          variant="row"
          checked={filters.price === null}
          onChange={() => onChange({ ...filters, price: null })}
        />
        {priceBands.map((band) => (
          <Option
            key={band.id}
            type="radio"
            name={`${scope}-price`}
            label={tr(band.label)}
            variant="row"
            checked={filters.price === band.id}
            count={optionCount("price", band.id, filters)}
            onChange={() => onChange({ ...filters, price: band.id })}
          />
        ))}
      </div>
    )
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
