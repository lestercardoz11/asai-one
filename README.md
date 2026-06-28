# ASAI.One

**Mode-based commuter essentials** — an ecommerce storefront where you shop by *how
you commute*, starting with the 2-Wheeler rider. A full Supabase-backed storefront,
checkout, and admin panel in the "MOTO Minimal Street" aesthetic (Navy × White,
type-led, sharp-edged).

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack, React 19) · TypeScript
- **Styling** — Tailwind CSS v4 + design tokens in `app/globals.css`; bespoke,
  dependency-free component library
- **Backend** — Supabase (Postgres + Auth + Storage). Schema is **Drizzle-ORM-as-
  source-of-truth** (`lib/db/schema`) with companion SQL for RLS/functions/triggers
  (`lib/db/sql`)
- **Data access** — hybrid: `@supabase/ssr` + RLS for everything browser-reachable;
  the Drizzle / service-role clients for admin & service code
- **Payments** — Razorpay (REST + webhook) · **Email** — Resend
- **Package manager** — pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values (see below)
pnpm dev                     # http://localhost:3000
```

The storefront is the home experience; the admin panel is at `/admin` (login-gated,
admins only). Without the optional keys, payments/email/etc. degrade gracefully so
the rest of the app still works.

### Environment

Copy `.env.example` to `.env.local` and fill in. Required for the core app:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `DATABASE_URL` (Supabase transaction pooler, for the Drizzle
client), `NEXT_PUBLIC_SITE_URL`. Optional integrations: Razorpay, Resend, WhatsApp,
`CRON_SECRET`. Note: `NEXT_PUBLIC_*` vars are inlined at **build time**.

## Commands

| | |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build + type-check + static generation (fetches live Supabase) |
| `pnpm start` | Production server (requires a Node runtime — not static export) |
| `pnpm lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `pnpm drizzle-kit generate` | Regenerate the SQL migration from `lib/db/schema` |

There are no automated tests; verify changes with type-check + lint + build.

## Architecture & conventions

- **Components never touch the database directly** — storefront reads go through
  `lib/data` (PostgREST selects + row→domain mappers to `lib/types`).
- **Money is integer paise** everywhere; format only at display via `formatINR()`
  (`lib/format.ts`). Admin forms take rupees and convert.
- **Variants are normalized** — `product_options` / `product_option_values` /
  `variant_option_values`; helpers in `lib/variants.ts`. A null variant price
  inherits the product's base price.
- **Admin = the JWT `app_metadata.role` claim** (no `admin_roles` table). `proxy.ts`
  (middleware) gates `/account` and `/admin`.
- **Orders** are created server-side and re-priced from the DB — client prices are
  never trusted; the Razorpay webhook is the source of truth for payment status.

> Database DDL is applied to the live Supabase project via the Supabase MCP, not
> `drizzle-kit push`. See **`CLAUDE.md`** for the full working guide and
> **`docs/DOCUMENTATION.md`** for delivery history and design specs.

## Deployment

Needs a Node.js runtime (`next build` → `next start`). Set every env var (with the
exact names above) in the host's environment, and ensure the `NEXT_PUBLIC_*` ones are
present at **build** time. Point `NEXT_PUBLIC_SITE_URL` at the production domain and,
for live payments, set the Razorpay live keys + webhook secret and register the
webhook at `https://<domain>/api/webhooks/razorpay`.
