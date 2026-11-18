# TENGU — Project Structure

Post-reorganization layout (2026-11). The old parallel `src/features/**` and `src/shared/**` trees were removed in the 2026-11 consolidation; as of the 2026-11 reorganization the admin Server Actions live in `src/lib/admin/actions/` split by feature instead of a single ~1000-line `actions.ts`.

```
src/
├─ app/                        # Next.js App Router (routes)
│  ├─ (frontend)/              # Hash-routed SPA lives here (storefront on /)
│  │  ├─ page.tsx              # RSC entry: session + getStoreData() → StoreApp
│  │  ├─ actions.ts            # placeOrder, sendMessage, subscribe (storefront Server Actions)
│  │  ├─ auth-actions.ts       # Customer auth Server Actions
│  │  ├─ layout.tsx            # Metadata, GA, custom-code injection
│  │  ├─ not-found.tsx
│  │  └─ manage/               # Admin console
│  │     ├─ (public)/login/    # → redirects to storefront sign-in
│  │     └─ (private)/         # Auth-gated shell (admin.css) + one folder per feature:
│  │        dashboard, products, categories, orders, customers, colors,
│  │        messages, subscribers, settings, delivery  (each with new/[id]/edit)
│  └─ api/
│     ├─ auth/google/{login,callback}/   # Google OAuth (customer auth)
│     └─ media/{upload,file/[id]}/       # Admin image upload + file serving
├─ store/                      # Storefront source of truth (hash router: #/shop, #/cart, …)
│  ├─ App.tsx                  # PAGES map (all storefront routes)
│  ├─ StoreApp.tsx             # hydrateStore() on first render, then <App/>
│  ├─ context/                 # AuthContext, CartContext, WishlistContext
│  ├─ pages/                   # Home, Shop, Cart, Checkout, Auth, Account, Wishlist, Order, static pages
│  ├─ components/              # Header/Footer, home/, shop/, cart/, checkout/, account/, …
│  ├─ data/                    # CMS-hydrated singletons (products, settings, navigation) + static data
│  ├─ i18n/                    # en/fr/ar dictionaries, getLang, t(), RTL-aware
│  ├─ styles/                  # tokens.css design tokens + global/shop/cart/checkout/account/… CSS
│  └─ utils/                   # checkout totals, images, recommendations, tracking, format
├─ lib/                        # Server + shared support
│  ├─ mongodb/
│  │  ├─ connection.ts         # Cached Mongoose connection (connectDB)
│  │  └─ models/               # Product, Order, User, Category, Color, Message, Subscriber,
│  │                           # SiteSettings, DeliverySettings, Media, Admin, _model-cache
│  ├─ admin/
│  │  ├─ actions/              # Admin Server Actions, one module per feature ("use server")
│  │  │  ├─ _shared.ts         # Plain module: ensureDB/toObjectId/slugify/refreshStorefront,
│  │  │  │                     #   buildVariantFields, Lean* types, PaginatedResult
│  │  │  ├─ dashboard.ts       # getDashboardStats
│  │  │  ├─ products.ts        # getProducts/getProduct/create/update/deleteProduct
│  │  │  ├─ categories.ts      # getCategories(Paginated)/getCategory/create/update/deleteCategory
│  │  │  ├─ orders.ts          # getOrders/getOrder/updateOrderStatus/updateOrder
│  │  │  ├─ customers.ts       # getCustomers/getCustomer/updateCustomer + lifetime delivered spend
│  │  │  ├─ colors.ts          # getColors(Paginated)/getColor/create/update/deleteColor
│  │  │  ├─ messages.ts        # getMessages/updateMessageStatus
│  │  │  ├─ subscribers.ts     # getSubscribers/deleteSubscriber
│  │  │  ├─ site-settings.ts   # getSiteSettings/updateSiteSettings
│  │  │  └─ delivery.ts        # getDeliverySettings/updateDeliverySettings
│  │  └─ helpers.ts            # formatCurrency/formatDate/getStatusLabel (client-safe)
│  ├─ app-auth.ts / admin-auth.ts / app-user.ts   # Customer/admin JWT (jose HS256)
│  ├─ auth-utils.ts / google-oauth.ts              # Phone helpers, Google OAuth
│  ├─ passwords.ts / rate-limit.ts / jwt-secret.ts / request-key.ts / site-url.ts
│  ├─ store-data.ts            # getStoreData(): CMS → storefront StoreData
│  ├─ loyalty-lifetime.ts      # Lifetime delivered-spend calculation (loyalty reward)
│  ├─ algeria-data.ts / delivery.ts                # Wilaya/commune fees, zone resolution
│  ├─ algeria communes: store/data/wilaya-communes.json (69 delivery areas)
│  ├─ product-constants.ts / phone.ts
│  └─ make-site-settings.ts / make-custom-code.tsx # Figma Make plumbing (do not remove)
└─ components/
   ├─ admin/                   # ProductForm, ProductImagesManager, ProductInventoryManager,
   │                           # ImageUploadField, OrderEditForm, ConfirmDelete, …
   └─ ui/                      # Shared UI primitives (Icon) — store/components/Icon.tsx re-exports
```

## Routes

- `/` — storefront (hash-routed SPA; `#/shop`, `#/cart`, `#/checkout`, …)
- `/manage/login` → redirects to `/account?next=/manage/dashboard`
- `/manage/<feature>` — admin console (requires admin JWT cookie; enforced in `manage/(private)/layout.tsx`)
- `/sitemap.xml`, `/robots.txt` — `src/app/sitemap.ts` / `src/app/robots.ts` (only `/` is indexable; `/manage` and `/api` are disallowed)
- `/api/media/upload` (POST, admin) — create media document; upload path used by the admin UI
- `/api/export/orders?status=new` (GET, admin) — distributor manifest CSV (wilaya → commune, oldest first; `status=all` exports everything); linked from the orders toolbar as EXPORT CSV
- `/api/media/file/[id]` — serve stored images (with 1 h cache + size guard)
- `/api/auth/google/*` — Google sign-in for customers

## Data flow

RSC `page.tsx` → `getStoreData()` (Mongo via `connectDB`, cache tag `store-data`) → `StoreData` props + `hydrateStore()` (mutates `store/data/**` singletons) → hash-routed SPA. Admin console under `manage/(private)` reads/writes through the Server Actions in `lib/admin/actions/<feature>.ts`; each mutation calls `revalidatePath` for the affected `/manage/*` segment and `refreshStorefront()` (a `revalidateTag("store-data")` wrapper) for shared content.

Admin image uploads go through `ImageUploadField` → `POST /api/media/upload` → `media` collection → served at `/api/media/file/<id>`. There is **no** `uploadMedia` server action anymore (it was dead code with no callers).

Order stock handling: placing an order atomically deducts `inventory.$.quantity` per variant (with rollback on failure). Transitioning an order to/from `cancelled`/`returned` in the admin (via the quick status control or the edit form) gives the quantities back to stock (or re-deducts them) — see `lib/admin/actions/orders.ts`.

## Key invariants

- `src/lib/mongodb/models/` is the ONLY model location — import via `@/lib/mongodb/models`.
- Storefront pages import from `@/store/...`; admin pages import from `@/lib/admin/actions/<feature>` (functions) and `@/lib/admin/actions/_shared` (types) + `@/components/admin/...`.
- `lib/admin/actions/_shared.ts` has NO `"use server"` directive and exports no actions; only function-typed async exports live in the feature modules. Keep it that way.
- Styling: storefront = custom CSS with `tokens.css`; admin = `admin.css` (`admin-*` classes). Tailwind v4 is installed but unused for UI.
- Money is rendered as "555 DA" (`store/utils/format`); the admin uses `ar-DZ` Intl for DZD.
- `.figma/` plumbing, `figma-image-loader.ts`, `make-site-settings.ts`, `make-custom-code.tsx` are platform-managed — do not remove or rename.
- fr.ts/ar.ts are UTF-8 — edit with the editor tool only. Hash routing stays.

## Tooling

- Git repo at the project root (branch `main`). `.env`, `.next/`, `node_modules/`, `.claude/`, `.figma/` runtime state are gitignored; `.env.example` documents the required variables.
- `scripts/migrate-product-variants.mjs` (`pnpm migrate:variants`) — one-off structural migration.
- `scripts/rehash-passwords.mjs` (`pnpm rehash:passwords`) — scrypt-upgrade plaintext passwords in `users`/`admins`.
- `scripts/check-imports.mjs` (`pnpm verify`) — every aliased/relative import in `src` resolves to a file.
- `scripts/orphans.mjs` (`pnpm orphans`) — lists src files unreachable from the entry trees (dead-code sweep).
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

- A long-running dev `node_modules` cache holding a Mongoose model compiled before a schema change silently drops writes to new paths ("succeeds" but the field never lands). Every model now goes through `_model-cache.resolveModel`, which walks the current schema (recursing into nested subdocs and document arrays) and re-registers the cached model when any current path is missing. No per-model path lists to maintain — schema edits automatically trigger re-registration.
- Admin pages are only verifiable in a browser/session; static checks (tsc, import resolution, orphan scan) are the agent-side safety net.
