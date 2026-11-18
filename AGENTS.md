# figma-make-app

React + Next.js + MongoDB/Mongoose + Tailwind CSS project.

This file is supplied as project instructions at the start of each task. Do not
reread it before opening source.

For frontend work, keep a **Verify production delivery** todo pending until all
of these are done:

- Preview every requested route and fix every runtime or build error. Server
  Components cannot contain event handlers; use CSS interaction or a Client
  Component boundary.
- When a Client Component calls a Server Action inside `useTransition`, keep
  `revalidatePath` out of the action. Return a serializable result and call
  `router.refresh()` in the client after success.

## Development Server

A Next.js development server is **always running** on `$PORT` (default 3000).
You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This project uses Next.js route groups:

- `src/app/(frontend)/` - Your application pages (public storefront); route files are thin wrappers
- `src/app/(frontend)/manage/` - Admin console pages (`(private)/` shell re-exports `features/admin/AdminLayout`, `(public)/` login redirect); routes under `src/app/api/` are thin wrappers too
- `src/features/<feature>/` - One vertical slice per feature: frontend components, `model.ts` (Mongoose model, when it owns a collection), `backend.ts` (the feature's Server Actions) — admin CRUD pages live in the feature as `Admin*Page.tsx` and are re-exported by one-line route shims in `app/`
- `src/shared/` - Cross-feature infrastructure (`mongodb/`, `i18n/`, `styles/`, `components/`, `utils/`, `storefront-actions.ts`); never imports from `features/`

See `FRONTEND_STRUCTURE.md` for the full tree and the feature inventory.

## Key Files

- `src/app/(frontend)/layout.tsx` - Root layout component
- `src/app/(frontend)/page.tsx` - Home page component
- `src/app/(frontend)/not-found.tsx` - Custom not-found page
- `src/app/(frontend)/styles.css` - Global styles and Tailwind CSS import
- `src/app/(frontend)/manage/(private)/layout.tsx` - Admin console shell and auth gate (re-exports `src/features/admin/AdminLayout.tsx`; keeps inline metadata)
- `src/app/(frontend)/manage/(public)/login/page.tsx` - Admin sign-in (redirects to storefront login)
- `src/shared/mongodb/connection.ts` - Mongoose connection utility
- `src/features/<feature>/model.ts` - Mongoose models, one per collection (Product, Category, Order, User, …); import them via the barrel `src/shared/mongodb/models.ts` (`@/shared/mongodb/models`)
- `src/features/<feature>/backend.ts` - Feature server actions (CRUD operations), with shared helpers/types in `src/features/admin/actions-shared.ts` (auto-generated `Lean*` types, cache tags)
- `src/features/auth/admin-auth.ts` - Admin JWT authentication
- `src/features/auth/app-auth.ts` - Customer JWT authentication
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies and scripts
- `.mise.toml` - Toolchain versions (Node.js, pnpm)

## Styling

Tailwind CSS v4 is installed and loaded by the `@import "tailwindcss"` directive in `src/app/(frontend)/styles.css`, but the actual UI predates it and barely uses it — don't reach for Tailwind utilities by default:

- **Storefront** (`src/shared/styles/`, imported directly by `src/features/shell/StoreApp.tsx` and all admin pages): custom CSS in `global.css` (which `@import`s `tokens.css` and each feature CSS) built on `tokens.css` design tokens (black/white/grays, vermilion reserved for sale/errors/hanko, Anton + Space Grotesk, zero border radius). New storefront work should reuse these tokens and hand-written class patterns. `global.css` ends with a trailing comment line — the turbopack content-keyed cache serves identical-content moved CSS files from the pre-move location without it; keep it.
- **Admin console** (`src/features/admin/admin.css`): custom dark design system (`admin-*` classes) layered on the storefront global styles. New admin work should follow the `admin.css` patterns.

Keep `styles.css` for the Tailwind import, shared theme tokens, and truly global base styles; match the established pattern of the area you are editing.

## Data/Backend

This project uses **MongoDB with Mongoose** for data persistence. Models live in `src/features/<feature>/model.ts` (plus `src/features/auth/admin-model.ts`); import them via the barrel `@/shared/mongodb/models` (`src/shared/mongodb/models.ts`). The admin dashboard provides full CRUD operations via Server Actions in `src/features/<feature>/backend.ts` (one module per admin feature), sharing helpers/types through `src/features/admin/actions-shared.ts`.

## Authentication

Two separate authentication systems:
- **Admin auth** (`src/features/auth/admin-auth.ts`) - JWT-based auth for admin dashboard at `/manage`
- **Customer auth** (`src/features/auth/app-auth.ts`) - JWT-based auth for storefront customers

## Admin Dashboard

The custom admin dashboard at `/manage` provides:
- Dashboard with stats and charts
- Product management (CRUD)
- Category management
- Order management
- Customer management
- Color management
- Delivery zones management
- Message management
- Subscriber management
- Site settings (global)
- Delivery settings (global)

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `ADMIN_JWT_SECRET` - Secret for admin JWT tokens
- `APP_JWT_SECRET` - Secret for customer JWT tokens

## Figma Make Scripts

These scripts are called by sboxd to manage the project lifecycle:

- `.figma/make/install` - Install project dependencies (`pnpm install`)
- `.figma/make/dev` - Start the dev server (`next dev --port $PORT --hostname 0.0.0.0`)
- `.figma/make/deploy` - Build, upload, finalize, and report completion through `figma make deploy`
- `.figma/make/deploy-preview` - Build the platform-provided cached preview;
  keep its `.next`/`nextjs` contract intact and delegate packaging/upload
  through `figma make deploy-preview`

Do **not** remove or rename these scripts. They must remain executable.

## File Writing

When writing multiple files, parallelize independent Write calls in a single
response. Files are independent when none depends on another's output at write
time. Batch by dependency layer — don't write files one at a time.

## Important

- The dev server must listen on `$PORT` - do not hardcode a port
- Use `pnpm install` to add new dependencies
- Toolchain versions are managed by `.mise.toml`, not installed manually
- This template is Next.js App Router + React 19 + MongoDB/Mongoose + Tailwind CSS v4;
  check `package.json` before adding or using other dependencies.
- Custom image loader in `figma-image-loader.ts` for `next/image` optimization.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->