# TENGU — Frontend Structure

Post-consolidation layout (2026-11). The old parallel `src/features/**` and `src/shared/**` trees were removed; all previously `features/`-based models, auth, and admin actions now live under `src/lib/`, and shared storefront pieces live under `src/store/`.

```
src/
├─ app/                        # Next.js App Router (routes)
│  ├─ (frontend)/              # Public storefront (hash-routed SPA on /)
│  │  ├─ page.tsx              # RSC entry: session + getStoreData() → StoreEntry
│  │  ├─ actions.ts            # placeOrder, sendMessage, subscribe (Server Actions)
│  │  ├─ auth-actions.ts       # Customer auth Server Actions
│  │  ├─ layout.tsx            # Metadata, GA, custom-code injection
│  │  └─ manage/               # Admin console (+ (public)/login redirect, (private)/ shell + pages)
│  ├─ api/                     # media upload/file (admin), auth/google/*
├─ store/                      # Storefront source of truth (hash router: #/shop, #/cart, …)
│  ├─ App.tsx                  # PAGES map (all storefront routes)
│  ├─ StoreApp.tsx             # hydrateStore() then renders
│  ├─ context/                 # AuthContext, CartContext, WishlistContext
│  ├─ pages/                   # Home, Shop, Cart, Checkout, Auth, Account, Wishlist, Order, static pages
│  ├─ components/              # Header/Footer, home/, shop/, cart/, checkout/, account/, …
│  ├─ data/                    # CMS-hydrated singletons (products, settings, navigation) + static data
│  ├─ i18n/                    # en/fr/ar dictionaries, getLang, t(), RTL-aware
│  ├─ styles/                  # tokens.css design tokens + global/shop/cart/checkout/account/… CSS
│  └─ utils/                   # checkout totals, images, recommendations, tracking, format
├─ lib/                        # Server + shared support
│  ├─ mongodb/connection.ts    # Cached Mongoose connection (connectDB)
│  ├─ mongodb/models/          # Real models (Product incl. variant gallery + inventory, Order, User, …)
│  ├─ admin/actions.ts         # Admin CRUD Server Actions (imported by /manage pages)
│  ├─ app-auth.ts / admin-auth.ts / app-user.ts   # Customer/admin JWT (jose HS256)
│  ├─ auth-utils.ts / google-oauth.ts              # Phone helpers, Google OAuth
│  ├─ passwords.ts / rate-limit.ts / jwt-secret.ts / request-key.ts
│  ├─ store-data.ts            # getStoreData(): CMS → storefront StoreData
│  └─ make-site-settings.ts / make-custom-code.tsx # Figma Make plumbing (do not remove)
└─ components/
   ├─ admin/                   # ProductForm, ProductImagesManager, ProductInventoryManager, …
   └─ ui/                      # Shared UI primitives (Icon) — store/components/Icon.tsx re-exports
```

## Data flow

RSC `page.tsx` → `getStoreData()` (Mongo via `connectDB`) → `StoreData` props + `hydrateStore()` (mutates `store/data/**` singletons) → hash-routed SPA. Admin console under `manage/(private)` reads/writes through Server Actions in `lib/admin/actions.ts`.

## Key invariants

- `src/lib/mongodb/models/` is the ONLY model location — import via `@/lib/mongodb/models`.
- Storefront pages import from `@/store/...`; admin pages import from `@/lib/admin/actions` + `@/components/admin/...`.
- Styling: storefront = custom CSS with `tokens.css`; admin = `admin.css` (`admin-*` classes). Tailwind v4 is installed but unused for UI.
