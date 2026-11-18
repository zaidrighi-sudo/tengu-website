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

## Backups

```bash
pnpm backup                                        # full dump → backups/ (gitignored)
pnpm restore backups/<timestamp> --confirm tengu   # destructive restore
```

## Deploy on Vercel

The app is a standard Next.js App Router project and needs no `vercel.json`:
Vercel detects Next.js, runs `pnpm install` from `pnpm-lock.yaml` and `pnpm build`
from `package.json`.

1. Push this folder (the one containing `.git`) to GitHub/GitLab/Bitbucket and
   import the repository in Vercel. Leave **Root Directory** at the repository
   root and the framework preset on **Next.js**.
2. Add the environment variables in **Project → Settings → Environment
   Variables** (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URI` | MongoDB Atlas connection string (`mongodb+srv://…`) |
   | `ADMIN_JWT_SECRET` | random string, **at least 32 characters** |
   | `APP_JWT_SECRET` | random string, **at least 32 characters** |
   | `NEXT_PUBLIC_SITE_URL` | public origin, e.g. `https://tengu.dz` |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional, for Google sign-in |
   | `GOOGLE_CALLBACK_URL` | `https://<domain>/api/auth/google/callback` |

   In production the auth layer throws instead of falling back to a dev key when
   a JWT secret is missing or shorter than 32 characters — set both before the
   first deploy.
3. In MongoDB Atlas → **Network Access**, allow Vercel: `0.0.0.0/0` (Atlas does
   not support Vercel's egress IPs on the free/shared tiers) or the fixed IPs of
   your Vercel plan.
4. Keep `backups/`, `.env` and local tool state out of the deployment. They are
   already gitignored and listed in `.vercelignore`, but never commit or upload
   a database dump — it contains customer data.

Deploying from the CLI instead of Git:

```bash
pnpm dlx vercel        # link the project and create a preview deployment
pnpm dlx vercel --prod # promote to production
```

## Project layout

See [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) for the full map, and [PRODUCT.md](./PRODUCT.md) for the product brief.

- `src/app/(frontend)/` — routes: storefront entry, `product/[slug]`, `manage/` admin console, `api/` route handlers
- `src/features/<feature>/` — one vertical slice per feature (storefront + admin UI, `model.ts`, `backend.ts`)
- `src/shared/` — cross-feature infrastructure: mongodb models barrel, i18n, styles, components, utils
- `scripts/` — maintenance and verification scripts

## Conventions

- Hash routing for the storefront (`#/shop`, `#/cart`, …); admin console uses real routes under `/manage`.
- Money as "555 DA"; admin uses `ar-DZ` Intl for DZD.
- fr.ts/ar.ts are UTF-8 — edit carefully (editor tool only).
- `.figma/`, `figma-image-loader.ts`, `make-site-settings.ts`, `make-custom-code.tsx` are platform-managed (Figma Make); do not remove.
- Commit history: branch `main`. Keep changes scoped; run the verification trio above before committing.

## Environment

See `.env.example` for all variables. Required for production: `DATABASE_URI`, `ADMIN_JWT_SECRET`, `APP_JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`.
