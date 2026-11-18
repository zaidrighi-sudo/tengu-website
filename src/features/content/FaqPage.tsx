import { useId, useMemo, useState } from "react"
import { Icon } from "@/store/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { type FaqItem, faqGroups } from "@/features/content/content"
import { FREE_SHIPPING_THRESHOLD, LOYALTY_FREE_DELIVERY_THRESHOLD } from "@/features/site-settings/navigation"
import { ZONES } from "@/features/delivery/algeria"
import { formatPrice } from "@/shared/utils/format"
import { cn } from "@/shared/utils/cn"
import { t, tr } from "@/shared/i18n"

const keyOf = (group: string, index: number) => `${group}-${index}`

/** Shipping copy gets the live fee range from the CMS-hydrated zone fees. */
const feeParams = () => {
  const homes = Object.values(ZONES).map((fee) => fee.home)
  return {
    price: formatPrice(FREE_SHIPPING_THRESHOLD),
    loyalty: formatPrice(LOYALTY_FREE_DELIVERY_THRESHOLD),
    minFee: formatPrice(Math.min(...homes)),
    maxFee: formatPrice(Math.max(...homes)),
  }
}

export default function Faq() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<Set<string>>(new Set())
  const searchId = useId()

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    return faqGroups
      .map((group) => ({
        ...group,
        items: group.items
          .map((item, index) => ({ item, key: keyOf(group.id, index) }))
          .filter(({ item }) => !term || `${t(item.q)} ${t(item.a, feeParams())}`.toLowerCase().includes(term)),
      }))
      .filter((group) => group.items.length > 0)
  }, [query])

  const visibleKeys = groups.flatMap((group) => group.items.map((entry) => entry.key))
  const allOpen = visibleKeys.length > 0 && visibleKeys.every((key) => open.has(key))
  const total = visibleKeys.length

  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleAll = () =>
    setOpen((current) => {
      const next = new Set(current)
      for (const key of visibleKeys) allOpen ? next.delete(key) : next.add(key)
      return next
    })

  return (
    <Layout overlayHeader={false}>
      <div className="faq">
        <PageHead
          crumb={t("FAQ")}
          eyebrow={t("Help")}
          title={t("FAQ")}
          intro={t("Quick answers about orders, shipping, returns and fit. Cannot find yours? Write to us.")}
        />

        <div className="faq-tools">
          <div className="field">
            <label className="field-label" htmlFor={searchId}>
              {t("Search questions")}
            </label>
            <div className="field-control">
              <input
                id={searchId}
                type="search"
                autoComplete="off"
                placeholder={t("Try “returns” or “duties”")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <button type="button" className="link-btn faq-all" onClick={toggleAll} disabled={total === 0}>
            {allOpen ? t("Collapse all") : t("Expand all")}
          </button>
        </div>
        <p className="sr-only" role="status">
          {total === 0 ? t("No questions match your search.") : t("{total} {unit} shown.", {
                  total,
                  unit: total === 1 ? t("question") : t("questions"),
                })}
        </p>

        {groups.length === 0 ? (
          <div className="acct-empty">
            <Icon name="search" />
            <h2>{t("No questions match")}</h2>
            <p>{t("Nothing matched “{query}”. Try a shorter word, or ask us directly.", { query })}</p>
            <div className="acct-empty-actions">
              <button type="button" className="btn" onClick={() => setQuery("")}>
                {t("Clear search")}
              </button>
              <a className="btn btn-solid" href="#/contact">
                {t("Contact us")} <Icon name="arrow" />
              </a>
            </div>
          </div>
        ) : (
          <div className="faq-groups">
            {groups.map((group) => (
              <section key={group.id} className="faq-group" aria-labelledby={`faq-${group.id}`}>
                <h2 id={`faq-${group.id}`} className="faq-group-title">
                  {tr(group.title)}
                </h2>
                <div className="faq-list">
                  {group.items.map(({ item, key }) => (
                    <Accordion key={key} id={key} item={item} open={open.has(key)} onToggle={() => toggle(key)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <section className="guide-help">
          <p>{t("Still need a hand? A real person reads every message.")}</p>
          <a className="btn btn-solid" href="#/contact">
            {t("Contact us")} <Icon name="arrow" />
          </a>
        </section>
      </div>
    </Layout>
  )
}

function Accordion({ id, item, open, onToggle }: { id: string; item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("faq-item", open && "is-open")}>
      <h3>
        <button type="button" id={`${id}-btn`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>
          <span>{tr(item.q)}</span>
          <Icon name="plus" />
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} className="faq-a" inert={!open}>
        <div>
          <p>{t(item.a, feeParams())}</p>
          {item.links && (
            <p className="faq-links">
              {item.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {tr(link.label)} <Icon name="arrow" />
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
