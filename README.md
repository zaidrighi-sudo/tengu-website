# TENGU

E-commerce storefront + admin console for a streetwear label, built with Next.js (App Router), React 19, MongoDB/Mongoose and a custom CSS design system. The storefront is a hash-routed SPA served from `/`; the admin console lives at `/manage`.

## Stack

- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript
- **DB**: MongoDB via Mongoose (cached connection in `src/lib/mongodb/connection.ts`)
- **Auth**: two JWT systems (jose HS256) — admin (`ADMIN_JWT_SECRET`, `/manage`) and customer (`APP_JWT_SECRET`, storefront account)
- **Styling**: storefront — custom CSS on design tokens (`src/store/styles/tokens.css`); admin — `admin.css` (`admin-*` classes). Tailwind v4 is present but unused for UI.
- **i18n**: storefront dictionaries in `src/store/i18n/` (en/fr/ar), RTL-aware.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URI, ADMIN_JWT_SECRET, APP_JWT_SECRET
pnpm dev               # http://localhost:3000 ($PORT is honoured)
```

Admin console: `http://localhost:3000/manage` (admin credentials are stored in the `admins` collection).

> ⚠️ The dev server talks to the live Atlas database configured in `.env`. Test writes carefully — admin saves and orders created in dev land in production data.

## Verification

```bash
npx tsc --noEmit       # type safety
pnpm verify            # every import in src resolves to a file
pnpm orphans           # dead-code sweep (unreachable src files)
```

Do not run `pnpm build`/`next build` while the dev server is running — they share `.next`.

## Project layout

See [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) for the full map, and [PRODUCT.md](./PRODUCT.md) for the product brief.

- `src/app/(frontend)/` — routes: storefront entry, storefront/legacy actions, `manage/` admin console
- `src/store/` — storefront implementation (pages, components, context, i18n, styles, data singletons)
- `src/lib/` — server support: mongodb models, auth, `admin/actions/<feature>.ts` (admin Server Actions), delivery fees, loyalty calculation
- `src/components/` — admin and shared UI components
- `scripts/` — maintenance and verification scripts

## Conventions

- Hash routing for the storefront (`#/shop`, `#/cart`, …); admin console uses real routes under `/manage`.
- Money as "555 DA"; admin uses `ar-DZ` Intl for DZD.
- fr.ts/ar.ts are UTF-8 — edit carefully (editor tool only).
- `.figma/`, `figma-image-loader.ts`, `make-site-settings.ts`, `make-custom-code.tsx` are platform-managed (Figma Make); do not remove.
- Commit history: branch `main`. Keep changes scoped; run the verification trio above before committing.

## Environment

See `.env.example` for all variables. Required for production: `DATABASE_URI`, `ADMIN_JWT_SECRET`, `APP_JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`.
