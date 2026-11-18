import { type RefObject, useRef } from "react"
import { Icon } from "@/shared/components/Icon"
import { cn } from "@/shared/utils/cn"
import { useDialog } from "@/shared/utils/useDialog"
import { FACETS, FACET_LABELS, type Filters, activeChips } from "@/features/shop/utils"
import { FacetFields } from "@/features/shop/FilterFields"
import { t, tr } from "@/shared/i18n"

/** Mobile side drawer with every facet: category, size, color, price, fit. */
export function FilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  resultCount,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  onChange: (next: Filters) => void
  onClear: () => void
  resultCount: number
  returnFocusRef: RefObject<HTMLElement | null>
}) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog({
    open,
    onClose,
    containerRef: panelRef,
    initialFocusRef: closeRef,
    returnFocusRef,
  })
  const activeCount = activeChips(filters).length

  return (
    <div className={cn("filter-root", open && "is-open")}>
      <div className="filter-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        id="filter-drawer"
        className="filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("Filters")}
        inert={!open}
      >
        <header className="filter-head">
          <h2>{t("Filters")}</h2>
          <button
            type="button"
            ref={closeRef}
            className="nav-icon"
            aria-label={t("Close filters")}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="filter-body">
          <label className="opt opt-row opt-new">
            <input
              className="opt-input"
              type="checkbox"
              checked={filters.newOnly}
              onChange={() =>
                onChange({ ...filters, newOnly: !filters.newOnly })
              }
            />
            <span className="opt-box" aria-hidden="true" />
            <span className="opt-label">{t("New drop only")}</span>
          </label>

          {FACETS.map((facet) => (
            <fieldset className="filter-group" key={facet}>
              <legend>{FACET_LABELS[facet]}</legend>
              <FacetFields
                facet={facet}
                filters={filters}
                onChange={onChange}
                scope="drawer"
              />
            </fieldset>
          ))}
        </div>

        <footer className="filter-foot">
          <button
            type="button"
            className="btn btn-lg"
            onClick={onClear}
            disabled={activeCount === 0}
          >
            {t("Clear all")}
          </button>
          <button
            type="button"
            className="btn btn-solid btn-lg"
            onClick={onClose}
          >
            {t("Show")} {tr(resultCount)} {resultCount === 1 ? t("piece") : t("pieces")}
          </button>
        </footer>
      </aside>
    </div>
  )
}
