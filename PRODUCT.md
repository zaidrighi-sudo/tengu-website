# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, PayloadCMS 3.x (headless CMS + admin), pnpm workspace. Deployment target: Vercel (inferred from Next.js defaults).

## Users

**Primary (client-facing):** Streetwear/apparel shoppers — predominantly mobile, browsing drops, filtering by category/size/color, adding to cart, checking out. International audience (English, French, Arabic RTL).

**Primary (admin dashboard):** Store merchants/owners and operations staff — monitoring revenue, orders, customers, products, low-stock alerts. Desktop-first usage within PayloadCMS admin panel. Job: daily/weekly business health check, order fulfillment triage, inventory reorder decisions.

## Product Purpose

Tengu is a Japanese-inspired streetwear label selling limited-run heavy-weight pieces (hoodies, tees, pants). Success = sell-through rate per drop, repeat purchase rate, AOV. The admin dashboard exists to give merchants real-time visibility into drop performance without leaving the CMS.

## Positioning

Japanese-inspired streetwear with heavy cultural coding (Anton display font, hanko seal, katakana accents, film grain texture, marquee animations) + scarcity-driven drop model ("When a piece is gone, it is gone"). The cultural aesthetic and scarcity mechanics are intertwined — the hanko seal marks authenticity, the grain texture evokes analog photography, the marquee mimics Japanese train station signage.

## Operating Context

- **Client workflows:** Browse shop → filter facets (category, color, size, sale/new) → product card quick-add → cart drawer → checkout → account (orders, wishlist, addresses)
- **Merchant workflows (Payload admin):** Content editing (products, pages, settings) ↔ Dashboard widget (stats snapshot) → Order management (separate Payload collections)
- **Rituals:** New drop launches (scheduled), sale events, restock notifications
- **Environments:** Dev (localhost:3000), Preview (Vercel), Production
- **Tools:** Payload admin for content, Vercel for deploy, analytics via custom tracking utils

## Capabilities and Constraints

- **PayloadCMS widget constraint:** `DashboardStatsWidget` must export `DashboardWidgetProps { width?: 'full' | 'half' }` and `dashboardStatsWidgetConfig` for Payload registration. Runs inside Payload admin iframe.
- **Arabic RTL:** Full layout flip — fonts switch to Cairo, `letter-spacing: 0`, `text-transform: none`, drawer directions mirror, display font falls back to Arabic.
- **Japanese typography:** Noto Sans JP subsets (katakana 500wt for announcement accent; 900wt for 天狗新作 kanji in display).
- **Design tokens:** Strictly defined in `src/store/styles/tokens.css` — black/white/five grays/one red (#D00000). No other colors permitted.
- **Border radius:** `--radius-none: 0`, `--radius-sm: 2px` only. No rounded corners.
- **Motion:** `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, durations 150/300/700ms. Respects `prefers-reduced-motion`.
- **Image assets:** Product photography 4:5 aspect ratio. Hero/lookbook imagery variable.
- **Currency:** Algerian Dinar (DZD) formatting via `Intl.NumberFormat('ar-DZ')`.

## Brand Commitments

- **Name:** Tengu (天狗) — Japanese yōkai, long-nosed mountain spirit. Visual mark: hanko seal (red or white).
- **Voice:** Terse, uppercase microcopy, tracking-label (0.14em). "Small runs, cut heavy. When a piece is gone, it is gone."
- **Assets:** Hanko seal component (`.hanko`, `.hanko-red`, `.hanko-white`), film grain overlay (`.grain`), marquee component.
- **Identity constraints:** No colors beyond token palette. No rounded corners. No soft shadows (borders only). Display text always uppercase with tracking-display.

## Evidence on Hand

- Client shop implementation: `src/store/pages/Shop.tsx`, `src/store/styles/shop.css`, `src/store/components/ProductCard.tsx`, `src/store/styles/product-card.css`
- Design tokens: `src/store/styles/tokens.css`
- Global primitives: `src/store/styles/global.css` (`.btn`, `.tag`, `.label`, `.skeleton`, `.grain`, `.hanko`, base styles)
- Layout/header: `src/store/styles/layout.css`, `src/store/styles/header.css`
- **Current admin widget (anti-reference):** `src/app/(frontend)/manage/(private)/dashboard/AdminDashboardContent.tsx`
- **Admin stats:** `getDashboardStats()` in `src/lib/admin/actions.ts`
- Product data: `src/store/data/products.ts`, `src/store/utils/shop.ts`
- i18n: `src/store/i18n/` (en, fr, ar)

## Product Principles

1. **Cultural coding over decoration** — Every visual element (font, grain, hanko, marquee) carries Japanese streetwear meaning; nothing is merely ornamental.
2. **Scarcity as default** — Sold-out states, low-stock warnings, drop filters, "gone forever" copy are first-class, not edge cases.
3. **Sharpness as discipline** — Zero border radius, hard borders, uppercase tracking. The system refuses softness.
4. **Merchant parity** — Admin surfaces must feel authored by the same hand as the shop. Zero visual dissonance when switching contexts.
5. **RTL as equal citizen** — Arabic is not an afterthought; layout, typography, motion all flip correctly.

## Accessibility & Inclusion

- WCAG 2.1 AA target on client surfaces
- `prefers-reduced-motion` disables all non-essential animation (marquee, grain, pulse, reveal)
- `focus-visible` rings on all interactive elements (white, 2px, 3px offset)
- Semantic HTML, ARIA labels on icon-only controls, live regions for filter results
- Arabic RTL tested; Japanese subset fonts load only needed glyphs