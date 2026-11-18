import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react"
import { Icon } from "@/shared/components/Icon"
import { cn } from "@/shared/utils/cn"
import {
  FACETS,
  FACET_LABELS,
  type Chip,
  type Facet,
  type Filters,
  SORTS,
  type SortKey,
  activeChips,
  facetSelectedCount,
  removeChip,
} from "@/features/shop/utils"
import { FacetFields } from "@/features/shop/FilterFields"
import { t, tr } from "@/shared/i18n"

type Props = {
  filters: Filters
  onFiltersChange: (next: Filters) => void
  sort: SortKey
  onSortChange: (next: SortKey) => void
  resultCount: number
  cols: number
  colOptions: number[]
  onColsChange: (cols: number) => void
  onOpenDrawer: () => void
  drawerButtonRef: RefObject<HTMLButtonElement | null>
  onClear: () => void
}

/** Sticky bar: facets (desktop) or Filters button (mobile), sort, grid toggle, chips. */
export function FilterBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  resultCount,
  cols,
  colOptions,
  onColsChange,
  onOpenDrawer,
  drawerButtonRef,
  onClear,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const triggers = useRef<Partial<Record<Facet, HTMLButtonElement | null>>>({})
  const [open, setOpen] = useState<Facet | null>(null)
  const chips = activeChips(filters)
  const activeCount = chips.length

  // Close a facet menu on outside press.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.stopPropagation()
      const facet = open
      setOpen(null)
      triggers.current[facet]?.focus()
    }
  }

  return (
    <div className="shop-bar" ref={barRef} onKeyDown={onKeyDown}>
      <div className="shop-bar-row">
        {/* Mobile / tablet: one button that opens the side drawer. */}
        <button
          type="button"
          ref={drawerButtonRef}
          className="bar-btn bar-filters-btn"
          aria-haspopup="dialog"
          aria-controls="filter-drawer"
          onClick={onOpenDrawer}
        >
          <Icon name="grid" />
          {t("Filters")}
          {activeCount > 0 && <span className="bar-badge">{tr(activeCount)}</span>}
        </button>

        {/* Desktop: inline facet menus. */}
        <div className="bar-facets" role="group" aria-label={t("Filter products")}>
          {FACETS.map((facet) => {
            const selected = facetSelectedCount(filters, facet)
            const isOpen = open === facet
            return (
              <div
                className="facet"
                key={facet}
                onBlur={(event) => {
                  if (
                    isOpen &&
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  )
                    setOpen(null)
                }}
              >
                <button
                  type="button"
                  ref={(node) => {
                    triggers.current[facet] = node
                  }}
                  className={cn("bar-btn", selected > 0 && "has-value")}
                  aria-expanded={isOpen}
                  aria-controls={`facet-${facet}`}
                  onClick={() => setOpen(isOpen ? null : facet)}
                >
                  {FACET_LABELS[facet]}
                  {selected > 0 && (
                    <span className="bar-badge">{tr(selected)}</span>
                  )}
                  <span className="bar-caret" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div
                    className="facet-panel"
                    id={`facet-${facet}`}
                    role="group"
                    aria-label={FACET_LABELS[facet]}
                  >
                    <FacetFields
                      facet={facet}
                      filters={filters}
                      onChange={onFiltersChange}
                      scope="bar"
                    />
                  </div>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="bar-btn"
            aria-pressed={filters.newOnly}
            onClick={() =>
              onFiltersChange({ ...filters, newOnly: !filters.newOnly })
            }
          >
            {t("New drop")}
          </button>
        </div>

        <div className="bar-tools">
          <p className="bar-count label" aria-hidden="true">
            {String(resultCount).padStart(2, "0")} {t("pieces")}
          </p>

          <label className="bar-sort">
            <span className="sr-only">{t("Sort by")}</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
            >
              {SORTS.map((option) => (
                <option key={option.key} value={option.key}>
                  {tr(option.label)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid-toggle" role="group" aria-label={t("Grid columns")}>
            {colOptions.map((n) => (
              <button
                type="button"
                key={n}
                className="grid-toggle-btn"
                aria-pressed={cols === n}
                aria-label={`${n} ${n === 1 ? "column" : "columns"}`}
                onClick={() => onColsChange(n)}
              >
                {Array.from({ length: n }, (_, i) => (
                  <i key={i} />
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ActiveChips
        chips={chips}
        onRemove={(chip) => onFiltersChange(removeChip(filters, chip))}
        onClear={onClear}
      />
    </div>
  )
}

function ActiveChips({
  chips,
  onRemove,
  onClear,
}: {
  chips: Chip[]
  onRemove: (chip: Chip) => void
  onClear: () => void
}) {
  if (chips.length === 0) return null
  return (
    <div className="chips-row">
      <ul className="chips" aria-label={t("Active filters")}>
        {chips.map((chip) => (
          <li key={`${chip.facet}-${chip.value}`}>
            <button
              type="button"
              className="chip"
              aria-label={t("Remove filter: {label}", { label: chip.label })}
              onClick={() => onRemove(chip)}
            >
              {tr(chip.label)}
              <Icon name="close" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="chips-clear" onClick={onClear}>
        {t("Clear all")}
      </button>
    </div>
  )
}
