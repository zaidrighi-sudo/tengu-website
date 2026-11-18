# TENGU — Project Structure

Feature-wise vertical slices (2026-11). Every feature owns its frontend components, its data access (`backend.ts` with the feature's Server Actions), its Mongoose model (`model.ts`) and related files under `src/features/<feature>/`; shared infrastructure lives in `src/shared/`. `src/app/**` holds only Next.js route files — thin wrappers that wire routes to feature code. Features import each other directly (cross-feature imports are allowed); `shared/` never imports from `features/`.

```
src/
├─ app/                        # Next.js App Router (routes) — thin wrappers only
│  ├─ (frontend)/              # Hash-routed SPA lives here (storefront on /)
│  │  ├─ page.tsx              # RSC entry: session + getStoreData() → StoreEntry
│  │  ├─ layout.tsx            # Metadata, GA, custom-code injection
│  │  ├─ not-found.tsx
│  │  ├─ styles.css            # Tailwind import + global base
│  │  ├─ product/[slug]/       # Real product detail route (RSC, SEO) → features/products/ProductDetail
│  │  └─ manage/               # Admin console — one-line re-export shims → features/<feature>/Admin*Page
│  │     ├─ (public)/login/    # → redirects to storefront sign-in
│  │     └─ (private)/         # Auth-gated shell (re-exports features/admin/AdminLayout) + one folder
│  │        dashboard, products, categories, orders, customers, colors, messages,
│  │        subscribers, settings, delivery  (each with new/[id]/edit)
│  └─ api/
│     ├─ auth/google/{login,callback}/   # Google OAuth (customer auth)
│     ├─ export/orders/                  # Distributor manifest CSV (admin)
│     └─ media/{upload,file/[id]}/       # Thin wrappers → features/media/{upload,serve-file}.ts
├─ features/                   # One vertical slice per feature
│  ├─ shell/                   # Hash-router App/StoreApp/StoreEntry, Header/Footer, Layout, Marquee, MegaMenu…
│  ├─ home/                    # HomePage + Hero, NewArrivals, ShopAll, Lookbook, Story, PromoBanner, CategoryTiles
│  ├─ shop/                    # ShopPage, FilterBar/FilterDrawer/FilterFields, useMediaQuery, utils
│  ├─ products/                # ProductCard, ProductDetail, ProductForm, variants, size-charts, size-charts data
│  │  │                        #   + Admin CRUD pages (AdminProductsPage, AdminProduct{New,Edit}Page)
│  │  ├─ model.ts              # Product collection
│  │  ├─ backend.ts            # getProducts/getProduct/create/update/deleteProduct (admin Server Actions)
│  │  └─ products.ts           # Storefront product queries (shared by RSC + features)
│  ├─ categories/              # model.ts + backend.ts + Admin category pages
│  ├─ colors/                  # model.ts + backend.ts + Admin color pages
│  ├─ orders/                  # model.ts + Admin order pages + OrderEditForm
│  │  │                        #   + backend.ts = admin actions (getOrders/getOrder/updateOrderStatus/updateOrder)
│  │  │                        #     AND storefront placeOrder/getMyOrders
│  │  └─ OrderPage.tsx         # Storefront order confirmation page
│  ├─ customers/               # model.ts (User) + backend.ts + loyalty-lifetime.ts + Admin customer pages
│  ├─ messages/                # model.ts + backend.ts (admin + storefront sendMessage) + Admin messages page
│  ├─ subscribers/             # model.ts + backend.ts (admin + storefront subscribe) + NewsletterForm(Signup)
│  ├─ delivery/                # model.ts + backend.ts (admin) + delivery.ts, algeria.ts, algeria-data.ts,
│  │                           #   communes.ts, wilaya-communes.json + Admin delivery page
│  ├─ site-settings/           # model.ts + backend.ts (admin) + store-data.ts, data.ts, navigation.ts,
│  │                           #   make-site-settings.ts, make-custom-code.tsx + Admin settings page
│  ├─ dashboard/               # AdminDashboardPage + AdminDashboardContent/AdminCharts + backend.ts (getDashboardStats)
│  ├─ cart/                    # CartContext, CartPage, CartDrawer, Recommended, ShippingProgress…
│  ├─ checkout/                # CheckoutPage/CheckoutShell, Field, OrderSummary, AddressFields, utils
│  ├─ account/                 # AccountPage, tabs (Profile/Addresses/Orders/Wishlist), OrderTimeline, tracking
│  ├─ wishlist/                # WishlistContext, WishlistPage, WishlistButton
│  ├─ content/                 # Static pages (About, Contact, Faq, Lookbook, ShippingReturns, SizeGuide, NotFound) + content.ts
│  ├─ auth/                    # admin-auth.ts, app-auth.ts, google-oauth.ts, jwt-secret.ts, passwords.ts,
│  │                           #   admin-model.ts (Admin collection), utils.ts,
│  │                           #   AuthContext.tsx, AuthPages.tsx + backend.ts (customer auth actions)
│  ├─ media/                   # model.ts, ImageUploadField, prepare-image-upload.ts,
│  │                           #   upload.ts + serve-file.ts (plain modules; app/api routes wrap them)
│  └─ admin/                   # admin.css, AdminLayout.tsx (auth-gated shell), helpers.ts,
│                              #   actions-shared.ts (plain module: ensureDB/toObjectId/slugify/
│                              #   refreshStorefront, buildVariantFields, Lean* types, PaginatedResult)
└─ shared/                     # Cross-feature infrastructure (never imports from features/)
   ├─ mongodb/                 # connection.ts (cached Mongoose), model-cache.ts, models.ts (barrel re-export)
   ├─ i18n/                    # core.ts (server-safe), index.ts (client useLang hook), fr.ts / ar.ts (UTF-8),
   │                           #   LanguageProvider.tsx, LanguageSwitcher.tsx
   ├─ styles/                  # tokens.css + global.css (imports every feature CSS) + account/auth/cart/… CSS
   ├─ components/              # Icon, PageHead, StoreImage
   ├─ utils/                   # cn, format, images, useDialog, useFormErrors, useHash
   ├─ site-url.ts / rate-limit.ts / request-key.ts
   └─ storefront-actions.ts    # ActionFailure + shared helpers for placeOrder/sendMessage/subscribe
```

## Routes

- `/` — storefront (hash-routed SPA; `#/shop`, `#/cart`, `#/checkout`, …)
- `/product/<slug>` — real product detail route (RSC, server-rendered content for SEO: OG/Twitter metadata, Product + Breadcrumb JSON-LD, ISR `revalidate=300`). Buying still adds to the shared bag and hands off to `/#/cart`. `src/app/(frontend)/product/[slug]/page.tsx` + buying island `src/features/products/ProductDetail.tsx`; product cards link here.
- `/manage/login` → redirects to `/account?next=/manage/dashboard`
- `/manage/<feature>` — admin console (requires admin JWT cookie; enforced by `src/features/admin/AdminLayout.tsx`, re-exported by `manage/(private)/layout.tsx`). The route files are one-line default-import re-exports of the feature page (`src/features/<feature>/Admin*Page.tsx`).
- `/sitemap.xml`, `/robots.txt` — `src/app/sitemap.ts` / `src/app/robots.ts` (`/` and every `/product/<slug>` are indexable; `/manage` and `/api` are disallowed)
- `/api/media/upload` (POST, admin) — thin wrapper over `src/features/media/upload.ts`; used by the admin UI
- `/api/export/orders?status=new` (GET, admin) — distributor manifest CSV (wilaya → commune, oldest first; `status=all` exports everything); linked from the orders toolbar as EXPORT CSV
- `/api/media/file/[id]` — thin wrapper over `src/features/media/serve-file.ts` (1 h cache + size guard)
- `/api/auth/google/*` — Google sign-in for customers

## Data flow

RSC `page.tsx` → `getStoreData()` (Mongo via `connectDB`, cache tag `store-data`) → `StoreData` props → `StoreEntry`/`hydrateStore()` → hash-routed SPA (`features/shell/App.tsx` PAGES map). Admin console under `manage/(private)` reads/writes through the Server Actions in `src/features/<feature>/backend.ts`; each mutation calls `revalidatePath` for the affected `/manage/*` segment and `refreshStorefront()` (a `revalidateTag("store-data")` wrapper from `features/admin/actions-shared.ts`) for shared content.

Admin server actions: one `backend.ts` per feature (`products`, `categories`, `orders`, `customers`, `colors`, `messages`, `subscribers`, `site-settings`, `delivery`, `dashboard`), all sharing `src/features/admin/actions-shared.ts` — a plain module with **no** `"use server"` directive holding `ensureDB`, `toObjectId`, `slugify`, cache tags, `Lean*` types and `PaginatedResult`. Only the `backend.ts` modules export async actions. The storefront actions (`placeOrder`, `getMyOrders`) live in `features/orders/backend.ts` next to the admin order actions; `sendMessage` / `subscribe` similarly live in their feature backends.

Admin image uploads go through `features/media/ImageUploadField` → `POST /api/media/upload` → `media` collection → served at `/api/media/file/<id>`. There is **no** `uploadMedia` server action anymore (it was dead code with no callers).

Order stock handling: placing an order atomically deducts `inventory.$.quantity` per variant (with rollback on failure). Transitioning an order to/from `cancelled`/`returned` in the admin (via the quick status control or the edit form) gives the quantities back to stock (or re-deducts them) — see `features/orders/backend.ts`.

## Key invariants

- Models are ONLY in `src/features/<feature>/model.ts` (plus `features/auth/admin-model.ts` for Admin) — import them via the barrel `@/shared/mongodb/models`. Model location is the single exception to flat feature files (models colocate with their feature).
- Storefront pages import feature code via `@/features/<feature>/...`; shared infrastructure via `@/shared/...`. Admin pages import actions from `@/features/<feature>/backend` (functions) and helpers/types from `@/features/admin/actions-shared`.
- `features/admin/actions-shared.ts` has NO `"use server"` directive and exports no actions; same for `shared/storefront-actions.ts`. Only function-typed async exports live in the feature backends. Keep it that way.
- `shared/` never imports from `features/`; features may import each other and `shared/`.
- Styling: storefront = custom CSS in `src/shared/styles/` built on `tokens.css` (design tokens, black/white/grays, vermilion reserved for sale/errors/hanko, Anton + Space Grotesk, zero border radius); the global entry `global.css` `@import`s each feature CSS and must keep its trailing cache-busting comment line. Admin = `admin.css` in `features/admin/` (`admin-*` classes). Tailwind v4 is installed but unused for UI.
- Money is rendered as "555 DA" (`shared/utils/format`); the admin uses `ar-DZ` Intl for DZD.
- `.figma/` plumbing, `figma-image-loader.ts`, `make-site-settings.ts`, `make-custom-code.tsx` are platform-managed — do not remove or rename.
- fr.ts/ar.ts are UTF-8 — edit with the editor tool only. Hash routing stays.

## Tooling

- Git repo at the project root (branch `main`). `.env`, `.next/`, `node_modules/`, `.claude/`, `.figma/` runtime state are gitignored; `.env.example` documents the required variables.
- `scripts/migrate-product-variants.mjs` (`pnpm migrate:variants`) — one-off structural migration.
- `scripts/rehash-passwords.mjs` (`pnpm rehash:passwords`) — scrypt-upgrade plaintext passwords in `users`/`admins`.
- `scripts/check-imports.mjs` (`pnpm verify`) — every aliased/relative import in `src` resolves to a file.
- `scripts/orphans.mjs` (`pnpm orphans`) — lists src files unreachable from the `app/` route tree (dead-code sweep).
- `scripts/backup.mjs` (`pnpm backup`) — read-only EJSON dump of every collection into gitignored `backups/<timestamp>/` (full-fidelity BSON types; customer data — never commit).
- `scripts/restore.mjs` (`pnpm restore <dir> --confirm <dbName> [--uri …]`) — destructive restore; drops and replaces each backed-up collection in the target database.
- `oxfmt.config.ts` drives `pnpm format` (oxfmt).
- `pnpm build` builds for production. Do not run `next build` against a dev server that is running (`.next` is shared); run `npx tsc --noEmit` + `pnpm verify` + `pnpm orphans` instead.

## Environment

See `.env.example`. Required: `DATABASE_URI` (MongoDB), `ADMIN_JWT_SECRET`, `APP_JWT_SECRET`. Optional: `NEXT_PUBLIC_SITE_URL` (canonical/OG/sitemap), Google OAuth trio, `PAYLOAD_SECRET` (legacy, unused). The dev server connects to the live Atlas database — be careful with admin saves.

## Database backups

```bash
pnpm backup                                 # full EJSON dump → backups/<timestamp>/
pnpm restore backups/<timestamp> --confirm tengu   # destructive restore into DATABASE_URI
```

`backups/` is gitignored and contains customer data — never commit it, store it locally or in an encrypted volume. Run `pnpm backup` before any risky operation (migration, restore, deploy with schema changes).

## Caveats

- A long-running dev `node_modules` cache holding a Mongoose model compiled before a schema change silently drops writes to new paths ("succeeds" but the field never lands). Every model goes through `shared/mongodb/model-cache.ts` (`resolveModel`), which walks the current schema (recursing into nested subdocs and document arrays) and re-registers the cached model when any current path is missing. No per-model path lists to maintain — schema edits automatically trigger re-registration.
- Turbopack caches transforms content-keyed; a file that was moved with identical content can keep serving a stale transform (or a stale failure). If a moved file misbehaves at runtime (e.g. CSS `@import`s suddenly unresolvable), change its content (a trailing comment is enough) — touching mtime does not help.
- Admin pages are only verifiable in a browser/session; static checks (tsc, import resolution, orphan scan) are the agent-side safety net.
