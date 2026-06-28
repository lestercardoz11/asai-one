# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

ASAI.One is a Next.js 16 (App Router, React 19, Turbopack) + Supabase ecommerce storefront — "shop by how you commute". TypeScript, Tailwind CSS v4, pnpm.

## Commands

```bash
pnpm install
pnpm dev              # dev server on http://localhost:3000 (Turbopack)
pnpm build            # next build — also type-checks AND statically generates the
                      #   storefront/PDPs, which fetch from the LIVE Supabase project,
                      #   so a green build validates the data layer end-to-end
pnpm start            # production server (needs a Node runtime; not static export)
pnpm lint             # eslint
npx tsc --noEmit      # type-check (there is no separate typecheck script)
pnpm drizzle-kit generate --name=<name>   # regenerate drizzle/ migration from lib/db/schema (no DB connection needed)
```

There is **no test framework** in this repo — do not look for `vitest`/`jest`/tests. Verify changes with `tsc --noEmit` + `pnpm lint` + `pnpm build`, and (for DB changes) the Supabase MCP advisors/queries.

## Database & schema workflow (read before touching the DB)

The schema is **Drizzle-ORM-as-source-of-truth**, split across two places that must stay in sync:
- `lib/db/schema/*.ts` — tables, enums, indexes (grouped by domain: catalogue, orders, commerce, account, returns, content). `drizzle-kit generate` turns these into `drizzle/0000_*.sql`.
- `lib/db/sql/*.sql` — everything Drizzle can't express: RLS policies, functions/RPCs, triggers, grants, and FKs to `auth.users`. These are companion files applied alongside the generated DDL.

**DDL is applied to the live Supabase project via the Supabase MCP `apply_migration`**, not via `drizzle-kit push` or any local migration runner. There is no local Postgres; `DATABASE_URL` is only the runtime pooler connection for the Drizzle client. After a schema change you must also: re-run `drizzle-kit generate`, and regenerate `lib/supabase/database.types.ts` via the Supabase MCP `generate_typescript_types`. Use `get_advisors` (security + performance) after DDL.

## Hybrid data access (the core architectural rule)

Two paths to the database, chosen by trust boundary:
- **User-facing (anything a browser can reach)** → `@supabase/ssr` clients in `lib/supabase/` (`public.ts` cookieless-anon for static catalogue reads, `server.ts` per-request, `client.ts` browser). **RLS is the authorization layer here** — never bypass it for browser-reachable code.
- **Admin/service (authority already asserted)** → the **Drizzle client** `lib/db/index.ts` (postgres.js pooler, `server-only`, **bypasses RLS**, needs `DATABASE_URL`) and the **service-role** Supabase client `lib/supabase/admin.ts` (`createAdminClient`, for Storage uploads + privileged RPCs/writes).

Storefront components **never query the DB directly** — they go through `lib/data/{index,map}.ts`, which holds the PostgREST `select` strings and row→domain mappers to the `lib/types` shapes the UI consumes. Keep `lib/data/map.ts` in sync with `database.types.ts`.

## Auth & authorization

- `proxy.ts` is the Next 16 **middleware** (note the filename) — it refreshes the session and gates `/account` and `/admin`. Page-level gating also lives in `app/admin/layout.tsx`.
- **Admin = the JWT `app_metadata.role === 'admin'` claim only.** `is_admin()` reads that claim; there is **no `admin_roles` table**. Grant/revoke goes through the service-role `auth.admin.updateUserById` (`setAdminRole` in `lib/admin/actions.ts`); the claim only takes effect on the user's next token refresh.
- `lib/auth/user.ts` exposes `getUser`/`getProfile`/`getIsAdmin` (React `cache`d). Every admin server action starts with `assertAdmin()`.
- Privileged RPCs (`decrement_inventory`, `redeem_coupon`, `release_coupon`, `check_rate_limit`) are revoked from anon/authenticated — service-role only.

## Domain conventions (non-obvious)

- **Money is integer paise** end-to-end (`bigint` in DB → `number` in TS). Format only at display via `formatINR()` (`lib/format.ts`). Admin forms take **rupees** and convert to paise in the server action.
- **Variants are normalized**: `product_options` / `product_option_values` / `variant_option_values` (a variant pins one option-value per option). Helpers in `lib/variants.ts` work over a `Record<optionId, valueId>` selection. A variant's `price_paise` of `null` means **inherit the product's base price** (never ₹0).
- **Orders are created server-side via the service-role client and always re-priced from the DB** (`priceCart` in `lib/checkout/order-actions.ts`) — client prices are never trusted. Lifecycle: `pending → confirmed → processing → shipped → delivered` (+ `cancelled`/`refunded`). `finalizeOrder` commits stock + coupon exactly once (guarded on `pending → confirmed`); cancel/refund restocks and releases the coupon. `updateOrderStatus` is the admin entry point.
- **Payments**: Razorpay via `lib/razorpay.ts` (no SDK — REST + HMAC); the webhook `app/api/webhooks/razorpay/route.ts` is the source of truth (signature-verified, idempotent via `webhook_events`).
- **Images**: Supabase Storage bucket `product-images` (public); uploads go through the service-role client; `next.config.ts` `images.remotePatterns` must allow the Storage host. Product ratings/`review_count` are intentionally trigger-maintained from real approved reviews only — do not seed fabricated values.
- **Integrations are key-gated and fail safe**: Razorpay/Resend/WhatsApp/cron all no-op gracefully when their env vars are unset. `NEXT_PUBLIC_*` vars are inlined at **build time**.

## Design system

Tailwind v4 design tokens live in `app/globals.css` (`@theme`): the navy colour ramp, ink-alpha hairlines, font variables (`--font-display` = Bebas, etc.), and a sharp-edged (zero border-radius) aesthetic. UI primitives are in `components/ui`; feature components under `components/{shop,product,account,admin,shell,seo}`. The shared `Button` recipe is `buttonVariants` in `components/ui/button.tsx` (also used to skin `<Link>` as a button).

## Docs

Project history, delivery records, and design specs are consolidated in `docs/DOCUMENTATION.md`. Auth email templates are in `docs/email-templates/` and **must use the `token_hash` link** (not `{{ .ConfirmationURL }}`), or password-reset/confirm flows break.
