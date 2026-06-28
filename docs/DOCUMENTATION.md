# ASAI.One — Project Documentation

Consolidated delivery records, design specs, and implementation plans for the
ASAI.One storefront. Email templates are kept separately in `docs/email-templates/`.

## Contents
1. Delivery — Phase 0–2
2. Delivery — Phase 3–7
3. Delivery — Foundation (schema rebuild + Drizzle hybrid)
4. Pre-production QA fixes (+ go-live round)
5. Spec — Schema rebuild + Drizzle foundation
6. Spec — Phase A (admin shell)
7. Spec — Phase B (product CMS + image storage)
8. Spec — Phase C (admin dashboard)
9. Spec — Account edit details
10. Plan — Account edit details



---

<!-- ===== consolidated from docs/PHASE-0-2-DELIVERY.md ===== -->

# ASAI.One — Phases 0–2 Delivery

This document records what was built across **Phase 0 (Discovery & Foundations)**,
**Phase 1 (Design System & Component Library)**, and **Phase 2 (High-Fidelity
Clickable Front End on mock data)** — the work that closes at the ★ Client
Sign-off Gate. It also captures the decisions taken and the handoff for Phase 3.

> The single most important rule of the plan holds: **Phases 3+ (backend, auth,
> payments, messaging, admin) do not begin until this look & feel is signed off.**

---

## 1. What was delivered

### Phase 0 — Discovery & Foundations
- **Brand decisions locked into tokens.** The confirmed MOTO "Minimal Street"
  schema (Navy × White / Off-White) and the Bebas Neue / Barlow Condensed /
  Barlow / DM Mono type system are implemented as design tokens, not ad-hoc
  values (`app/globals.css`).
- **IA / URL structure** from build-plan §5 implemented exactly (see route map
  below).
- **Mock-data schema agreed and implemented** against the real model shapes
  (`lib/types.ts`), so Phase 3 is a data-source swap, not a redesign.
- **Repo + tooling**: Next.js 16 (App Router, Turbopack, React 19), TypeScript
  strict, Tailwind v4. `pnpm build` produces a clean optimized build; every page
  prerenders.

### Phase 1 — Design System & Component Library
Token-driven, accessible, responsive components in the MOTO aesthetic
(sharp edges, 1px hairlines, no decorative shadows, restrained motion):

- **Primitives** (`components/ui/`): `Button` (+`buttonVariants`), `Badge`,
  `Field`/`Input`/`Textarea`/`Select`/`LabeledInput`, `Rating`,
  `QuantitySelector`, `Stepper`, `Breadcrumb`, `Toast` (+ `toast()`),
  `SectionHeading`/`Eyebrow`, `ProductImage` (branded SVG art).
- **Storefront components** (`components/shop`, `components/product`,
  `components/cart`): `ProductCard`, `ModeCard`, `Carousel`, `ShopBrowser`
  (filter/sort/search), `QuickAddButton`, `NotifyForm`, `ProductGallery`,
  `ProductPurchase` (variant UX), `OrderSummary`, `CartLine`, `CouponField`.
- **Global shell** (`components/shell`): `SiteHeader` (utility bar + desktop nav
  + sticky-on-scroll + mobile slide-in drawer + live cart badge), `SiteFooter`
  (navy, brand/links/policies/contact/social), `Logo` (compass mark + wordmark).
- **Icons** (`components/icons.tsx`): a hand-built, hairline SVG set (mode icons,
  UI, social, the 8-point compass brand mark) — zero icon dependency.

### Phase 2 — Clickable front end (every public page, mock data)
Navigable end-to-end: **Home → mode → category → PDP → cart → shipping →
payment → confirmation.**

| Area | Route(s) | Notes |
| --- | --- | --- |
| Home | `/` | Hero, "How do you commute?" 4 mode cards, Featured carousel, Why-ASAI blocks, CTA band |
| Shop | `/shop` | Search, filter sidebar (price/collections/returns), sort, responsive grid, mobile filter drawer |
| Category | `/commute/[mode]` | Live 2-Wheeler grid; **Coming Soon** teaser for the other 3 modes (products hidden) |
| Product Detail | `/product/[slug]` | Gallery + thumbnails, **variant selector**, price-by-variant, stock, reviews, specs, policy strip, sticky mobile add bar, related |
| Cart | `/cart` | Line items, qty, remove, coupon, order summary, empty state (client-side state) |
| Checkout | `/checkout/{shipping,payment,confirmation}` | 3-step stepper; guest contact capture at step 1; payment UI (UPI/Card/Net Banking/COD) — no real charge; order confirmation |
| Auth | `/login`, `/register` | Email **or** phone toggle, validation only |
| Account | `/account` | Demo dashboard, orders empty state, details |
| Contact | `/contact` | Form (validated) + business info |
| Policies | `/terms`, `/privacy`, `/shipping-policy`, `/refund-policy` | Placeholder legal copy, strong hierarchy |
| SEO | `/sitemap.xml`, `/robots.txt` | Generated; per-page metadata throughout |

The **variant model is first-class** (build-plan §1 architectural note). One
attribute-based shape (`lib/types.ts` + `lib/variants.ts`) drives every case:
- Absrb — Pack of 6 / 12 (simple pack toggle)
- PureRide & Shield — Basic / Advance (tier toggle)
- **DryLock Pods — weight (75/150/300g) × pack (Single / Pack of 3)** — a true
  two-axis selector with unavailable-combination handling.

---

## 2. Key decisions & rationale

1. **Synchronous-shaped mock data, no Cache Components / `unstable_instant`.**
   Next.js 16's docs push exporting `unstable_instant` for instant client
   navigation. That feature exists to validate that **async / uncached** data
   stays behind Suspense during navigation — it only earns its keep with Cache
   Components enabled. Phase 2 serves a **static catalogue**: every route
   prerenders to a static shell (confirmed in the build output), so navigations
   are already instant via static prerender + `Link` prefetch, with nothing for
   the validation to catch. Enabling the `unstable_` Cache Components mode now
   would add significant constraint/risk surface for zero benefit. It becomes
   relevant in Phase 3 when real async data lands behind Suspense — that is the
   right moment to adopt `'use cache'` + `unstable_instant`.

2. **The data adapter (`lib/data`) is the single seam.** Components never read
   mock arrays directly — they call `getProducts()`, `getProduct(slug)`, etc.
   The functions are already **async** (mirroring a network layer) so Phase 3
   reimplements their bodies against Supabase with **unchanged signatures**.

3. **Money is integer paise everywhere**, formatted only at display via
   `formatINR()` (`lib/format.ts`). No floats in the domain.

4. **Branded SVG art instead of stock photography.** `ProductImage` renders
   deterministic, spec-sheet-style artwork per product. This keeps the build
   hermetic/offline, on-brand (technical-doc aesthetic), and CLS-free. Swap for
   `next/image` behind the same call sites when real photography arrives
   (Phase 0/3 content task). `images.remotePatterns` is already the configured
   path (`images.domains` is deprecated in Next 16).

5. **Zero runtime UI dependencies.** Components, icons, and the `cn` helper are
   hand-built rather than pulling shadcn/Radix/clsx/lucide. This maximises
   aesthetic control for the bespoke MOTO look and keeps the dependency surface
   minimal. Accessibility (labels, roles, focus-visible, aria) is built in.

6. **Guest contact captured at checkout step 1** (build-plan §11) so the Phase 5
   abandoned-cart reminders (email → Resend, phone → WhatsApp) are possible for
   unregistered shoppers. The funnel UX already positions this.

7. **Client-side cart + checkout state** (localStorage / sessionStorage) for the
   demo, behind clean contexts (`lib/cart`, `lib/checkout`) that Phase 4 swaps
   for server-persisted cart + real Razorpay order creation.

---

## 3. Tech & conventions (Next.js 16 specifics honoured)

- `params` / `searchParams` are **Promises** — awaited in every server page
  (`/shop`, `/product/[slug]`, `/commute/[mode]`).
- Per-page `metadata` via the App Router Metadata API (root layout supplies the
  title template + OG/viewport). No `next/head`.
- `generateStaticParams` prerenders all product and mode routes.
- Server Components by default; `"use client"` only where there's interaction.
  Pages needing both `metadata` and interactivity use the server-page →
  client-component split.
- Linting is run via `pnpm lint` (Next 16 no longer lints during `next build`).

---

## 4. How to review

```bash
pnpm install
pnpm dev          # http://localhost:3000
# or a production preview:
pnpm build && pnpm start
```

Suggested review path: Home → click **2-Wheeler** → open **DryLock Pods**
(exercise the two-axis variant selector) → **Add to Cart** → **Cart** (apply
`RIDE10`) → **Checkout** (shipping → payment → confirmation). Check a
**Coming Soon** mode, the **Shop** filters, and resize to mobile for the drawer,
sticky add-bar, and sticky checkout CTA.

---

## 5. Phase 3 handoff (what swaps, what stays)

**Stays:** every component, page, route, the type model, and the MOTO design
system. Sign-off here means the UI is fixed.

**Swaps / wires up:**
- Reimplement `lib/data/*` bodies against Supabase (same signatures); seed the
  5 products + variants + modes. Introduce Suspense + `'use cache'` +
  `unstable_instant` for the now-async data (see decision #1).
- Replace `ProductImage` with `next/image` from Supabase Storage as photography
  lands; add the storage host to `images.remotePatterns`.
- Wire the auth screens to Supabase Auth (email + phone OTP), roles.
- Replace client cart/checkout state with server cart persistence + Razorpay
  (Phase 4), Resend/WhatsApp lifecycle (Phase 5), and the admin panel (Phase 6).

**Open items still pending content/decisions** (build-plan §12): final product
photography & copy, About/policy source text, WhatsApp provider, coupon &
shipping rules, order-tracking in/out for v1.



---

<!-- ===== consolidated from docs/PHASE-3-7-DELIVERY.md ===== -->

# ASAI.One — Phases 3–7 Delivery (Backend, Commerce, Admin, Launch)

This records the work after the Phase 2 ★ client sign-off: standing up the real
backend behind the approved front end, making it transact, adding lifecycle
messaging, the admin panel/CMS, and the launch-hardening pass.

> The Phase 2 UI is **fixed**. Phase 3 swapped the data *source*, not the
> components — every storefront page renders the same, now from Supabase.

---

## Phase 3 — Backend foundation & data layer

- **Supabase** project `ASAI.One` (`hgnvoqkqvpxvovzgpopl`, `ap-south-1`). A prior
  session had already built the full 52-table schema with correct RLS; Phase 3
  **reconciled + seeded** it to mirror the signed-off catalogue.
  - Migrations `013`–`015`: attribute-based variant model (`attributes`,
    `variant_axes`, `default_variant_id`, per-variant compare-at), commute-mode
    presentation (`icon`/`tagline`), `shipping_policy`, `features`; legacy
    `(product_id,size,color)` unique index dropped; **catalogue re-seeded** to
    exactly match `lib/data` (13 variants, per-variant inventory, 3 coupons).
- **Data layer** (`lib/data/index.ts` + `lib/data/map.ts`) reimplemented against
  Supabase with **unchanged signatures**, via a cookieless anon client
  (`lib/supabase/public.ts`) so static generation still works. Public reads are
  RLS-gated (active products / live categories / valid coupons).
- **Auth**: Supabase Auth via `@supabase/ssr` (`lib/supabase/{client,server,admin}.ts`),
  email/password + phone OTP, wired into the existing login/register screens;
  `proxy.ts` refreshes the session and gates `/account` + `/admin`; the account
  page reads the real profile + order history; the header reflects auth state.
- **Cart** refactored to **price/display snapshots** (removes the synchronous
  mock-catalogue dependency; mirrors the server cart's line snapshots).

## Phase 4 — Commerce core

- Server-side **order creation** (`lib/checkout/order-actions.ts`) re-prices the
  cart from the DB (never trusts client prices), persists `orders` + `order_items`
  for both logged-in and **guest** shoppers.
- **Razorpay** (`lib/razorpay.ts`, no SDK): server order creation, Checkout
  handshake signature verification, and a signature-verified, idempotent
  **webhook** (`/api/webhooks/razorpay`, deduped via `webhook_events`).
- On payment success: inventory decrement + coupon redemption + status
  transition (`lib/checkout/finalize.ts`, idempotent across client-verify and
  webhook). COD supported. Account page lists real orders.
- **Demo fallback**: with no service-role/Razorpay keys, `createOrder` still
  validates + prices server-side and returns a confirmable order so the clickable
  flow keeps working for review (flagged in the UI).

## Phase 5 — Lifecycle & marketing messaging

- **Resend** transactional email (`lib/notify/resend.ts`) — order-confirmation
  email fires on the confirmed transition; branded templates in `lib/notify/templates.ts`.
- **WhatsApp** Cloud API sender (`lib/notify/whatsapp.ts`, provider-configurable).
- **Abandoned-cart recovery** (`/api/cron/abandoned-cart`, `CRON_SECRET`-guarded):
  stale pending orders (contact + items captured at checkout) are nudged via the
  captured channel — email → Resend, phone-only → WhatsApp — covering registered
  **and guest** shoppers (build-plan §11). Every send is logged to `notifications`
  (also the dedupe key). Senders are graceful no-ops until keys land.

## Phase 6 — Admin panel & CMS

Role-gated `/admin` group (`getIsAdmin()` + RLS `is_admin()`), MOTO-styled:
- **Dashboard** — KPIs / top products / 14-day revenue via the `admin_*` RPCs.
- **Products & stock** — per-variant price + inventory, publish/flags.
- **Orders** — status workflow incl. `refunded` (basic returns processing).
- **Customers** — grant/revoke admin role.
- **Content & modes** — edit CMS pages, toggle a commute mode Coming Soon → Live.
- **Marketing** — campaign overview.

Admin writes use the **authenticated session** (RLS `*_all_admin` policies),
so no service-role key is needed for admin operations.

## Phase 7 — SEO, performance, hardening, launch

- **Structured data**: Organization (site-wide, `app/layout.tsx`) + `Product`
  AggregateOffer/AggregateRating JSON-LD on PDPs (`components/seo/json-ld.tsx`,
  `<`-escaped). Per-page metadata + DB-backed `sitemap.xml`/`robots` already present.
- **Performance/caching**: ISR (`revalidate = 300`) on home, PDP, and category
  pages so catalogue/CMS changes reflect without a redeploy; `next/image` for
  photography.
- **Security**: webhook + Checkout signature verification; RLS on every table;
  service-role key is server-only; secrets via env; `proxy` + DAL + RLS layered
  authZ. `tsc` / `eslint` / `build` all clean.

---

## Outstanding keys (add to `.env.local`)

| Var | Unblocks |
| --- | --- |
| `SUPABASE_SECRET_KEY` | Persisted orders, payment webhook, inventory/coupon writes, abandoned-cart cron |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Live payments |
| `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL`) | Order + abandoned-cart email |
| `WHATSAPP_API_TOKEN` / `_PHONE_NUMBER_ID` (+ provider) | WhatsApp reminders |
| `CRON_SECRET` | Authorize the abandoned-cart cron endpoint |

## Advisor notes (reviewed, non-blocking)

- **Security (WARN)**: `analytics_events` open INSERT (intentional anon telemetry);
  `admin_*` SECURITY DEFINER RPCs callable by `authenticated` (guarded internally
  by `is_admin()` — cannot revoke from `authenticated` without breaking admins);
  **leaked-password protection disabled** → enable in Dashboard → Auth (manual).
- **Performance (INFO/WARN)**: unused indexes (no traffic yet); "multiple
  permissive policies" (deliberate owner-OR-admin model — consolidate later for
  micro-perf); 4 minor unindexed FKs.

## Launch runbook / go-live checklist

1. Fill all keys above in the hosting env (Vercel) and locally.
2. Razorpay: switch test → live keys; register the webhook URL
   `https://<domain>/api/webhooks/razorpay` for `payment.captured` + `payment.failed`
   with the webhook secret.
3. Schedule the abandoned-cart cron (Vercel Cron / pg_cron / scheduler) to
   `POST /api/cron/abandoned-cart` with `Authorization: Bearer $CRON_SECRET`.
4. Resend: verify the sending domain; set `RESEND_FROM_EMAIL`.
5. WhatsApp: complete provider onboarding + template approval (lead time — §12 #5).
6. Supabase Auth: enable leaked-password protection; configure an SMS provider
   for phone OTP; set the Site URL + redirect URLs.
7. Set `NEXT_PUBLIC_SITE_URL` to the production domain (emails, OG, JSON-LD, sitemap).
8. Smoke test: register → add to cart → checkout (UPI/card/netbanking/COD) →
   confirm order in DB + account + confirmation email; verify webhook reconciles;
   trigger the cron and confirm a reminder.
9. Re-run `supabase` advisors; add indexes for any hot FKs that show up under load.

## Deliberate scope notes

- **Server cart sync**: the client snapshot cart is retained (it's fast and
  matches the signed-off UX); abandoned-cart reachability is achieved via the
  pending-order record created at checkout (captures contact + items), rather than
  a live server-synced cart. Revisit if real-time cross-device cart is required.
- **Returns**: handled as an order-status workflow (`refunded`) + the `refunds`
  table for Razorpay refunds; a dedicated customer-facing returns request flow can
  be added on top.
- Provisional defaults (flagged, build-plan §12): flat ₹49 shipping / free over
  ₹499; coupons `RIDE10` / `FREESHIP` / `ASAI150`; order tracking out of v1.



---

<!-- ===== consolidated from docs/FOUNDATION-SCHEMA-REBUILD-DELIVERY.md ===== -->

# Foundation — Schema Rebuild + Drizzle Hybrid Data Layer (delivered)

Executes the approved design `docs/superpowers/specs/2026-06-27-schema-rebuild-drizzle-foundation-design.md`.
The Postgres schema was rebuilt from scratch with **Drizzle ORM as the source of
truth**, every 2026-06-27 audit gap folded in, and the app rewired to a hybrid
data layer. `auth.users` (both accounts + the admin JWT claim) and the Storage
bucket were preserved; the catalogue was re-seeded identically.

## What shipped

- **Drizzle schema** (`lib/db/schema/*.ts`) — 33 tables, grouped by domain
  (catalogue, orders, commerce, account, returns, content). `drizzle.config.ts`
  generates `drizzle/0000_init_foundation.sql` (tables/enums/indexes only).
- **Companion SQL** (`lib/db/sql/*.sql`) — RLS, functions/RPCs, triggers, grants,
  auth.users FKs, functional indexes, sequence, cron. Not expressible in Drizzle TS.
- **Drizzle client** (`lib/db/index.ts`) — lazy postgres.js singleton, `server-only`,
  needs `DATABASE_URL` (Supabase **transaction** pooler). Build does not require it.
- **App rewrite** — `lib/types.ts`, `lib/variants.ts`, `lib/data/{map,index}.ts`,
  `components/product/product-purchase.tsx`, checkout (`order-actions`, `finalize`),
  `lib/admin/actions.ts`, admin pages — all onto the normalized variant model + bigint
  + `coupon_id`.

## Schema changes vs. the old (migrations 001–015)

- **Variants fully normalized**: `product_options` / `product_option_values` /
  `variant_option_values` (junction) replace the old `products.variant_axes` jsonb +
  `product_variants.attributes/size/color`. Option *values* now store their own display
  string (e.g. "Pack of 6", "150g", "Advance") — the former `formatAxisValue()` logic is
  baked into the seed.
- **Money → `bigint` paise** everywhere; per-row `currency` dropped (single-currency INR).
- **`orders.coupon_code` dropped** — `coupon_id` FK is the single source of truth.
- **`admin_roles` table dropped** — admin is **only** the JWT `app_metadata.role` claim.
  The customers-page badge derives from the service-role user listing.
- **`reviews.is_published` dropped** — single `status` (public read = `approved`);
  `tg_reviews_maintain_rating` keeps `products.rating`/`review_count` in sync.
- **New**: category hierarchy (`categories.parent_id`), `stock_movements` ledger
  (written by `decrement_inventory`/`restock_inventory`), `return_requests`/`return_items`
  (RMA), `carts.converted_order_id`.
- **Constraints tightened**: `addresses` unique default per user; `coupons` unique on
  `lower(code)`; `inventory` unique on `(product_id, coalesce(variant_id,…), warehouse_code)`;
  duplicate `wishlist` / `coupon_redemptions` uniques removed; redundant `payments` indexes
  dropped (uniques double as lookups).

## Gotchas captured (for future work)

- **`default_variant_id` is a plain column (no FK)** — so the second products↔variants
  relationship path is gone and the old `product_variants!..._fkey` PostgREST embed **hint
  is no longer needed** (and the old hint name would 404 at runtime). All embeds use plain
  `product_variants(...)` / `products(...)` now.
- **Supabase default privileges** grant `EXECUTE` on new public functions to `anon` +
  `authenticated` **directly** (not only via `PUBLIC`). To lock a SECURITY DEFINER function
  you must `revoke … from public, anon, authenticated` — revoking from `public` alone leaves
  the role grants in place (caught via advisors).
- **`admin_*` RPCs keep `authenticated` EXECUTE** (guarded internally by `is_admin()`):
  they cannot be revoked from `authenticated` without breaking the admin dashboard, because
  service-role/postgres fail `is_admin()` (no JWT claim). The residual advisor WARN is accepted.

## Verification

- `pnpm build` ✓ — statically generated all 5 PDPs + 4 commute pages from the new schema
  (end-to-end exercise of `PRODUCT_SELECT` + mappers + normalized variant rendering).
- `tsc --noEmit` ✓, `pnpm lint` ✓ (0 warnings).
- DB checks ✓ — 5 products / 13 variants / 11 option-values / 18 junction rows; RLS on all
  33 tables; `lookup_coupon` works; DryLock variants resolve to the right Size × Pack pairs.
- Advisors at the accepted baseline (security: `is_admin`/`lookup_coupon` callable by design,
  `admin_*` self-guarded, `rate_limits` no-policy = service-role-only, leaked-password =
  manual; performance: unused indexes / multiple-permissive-policies / unindexed FKs — all
  no-traffic or deliberate). The admin-RPC anon exposure and `analytics_events` open-insert
  are **fixed**.

## Outstanding (to go fully live)

- **`DATABASE_URL`** (transaction pooler) in `.env.local` / hosting env — required before any
  Drizzle (admin/service) code path runs at runtime. Added to `.env.example`.
- Existing outstanding keys still apply (Razorpay, Resend, WhatsApp, CRON_SECRET); enable
  Supabase Auth leaked-password protection (dashboard).
- Interactive smoke of checkout / account / admin (needs a signed-in session + keys) is
  recommended — the SSG build validated storefront + PDP, and the dynamic routes are
  type-checked and their queries match the new schema.

## Feature phases A/B/C (delivered on top of the foundation)

Specs: `docs/superpowers/specs/2026-06-27-phase-{a,b,c}-*.md`. All build/tsc/lint green.

- **A — Admin shell UX**: admins land on `/admin` after login (`signInWithPassword`
  returns `isAdmin`); slim header on `/admin*` routes; "Admin" link in the account menu.
- **B — Product CMS + image→Storage**:
  - `scripts/migrate-images-to-storage.mjs` moved the 8 product images from
    `/public/images` into the public Storage bucket `product-images` (path
    `products/<file>`) and rewrote `product_images.url`; verified reachable (HTTP 200).
    `next.config.ts` `images.remotePatterns` now allows the Storage host. (`hero.webp`
    stays in `/public` — it's a layout asset; the migrated `/public/images/asai-*.webp`
    files remain as a fallback and can be deleted once confirmed in production.)
  - Full editor at `/admin/products/[id]` (Details / Options & values / Variants
    [incl. inventory, default selector, option-value pins] / Images) + `/admin/products/new`
    + soft-delete. Writes via the authenticated-admin client (RLS `*_all_admin`); image
    uploads via the service-role client (Storage bypasses RLS). All actions `assertAdmin()`-gated.
- **C — Admin dashboard**: `?range=7|30|90` (default 30) drives the `admin_*` RPCs; KPIs
  with deltas, revenue chart (capped to 30 bars), top products, new low-stock list;
  admin-gated CSV export at `GET /admin/orders/export?range=…`.



---

<!-- ===== consolidated from docs/QA-PRELAUNCH-FIXES.md ===== -->

# Pre-production QA pass — gaps found & fixed

Final-tester pass after the schema rebuild + Phase A/B/C. Method: Drizzle/pooler
connection check, RLS role-simulation (anon / non-admin / admin), function-grant
audit, two adversarial code reviews (data-layer+checkout+RLS, and editor+dashboard),
runtime smoke (curl) of storefront/PDP/login/admin gate, architect triage, fixes.

## Verified healthy
- **Drizzle pooler** (`DATABASE_URL`, `aws-1-ap-south-1`, `prepare:false`) connects as `postgres`.
- **RLS** enforces: anon sees only the public catalogue (coupons/orders/profiles/addresses → 0); a non-admin sees only their own profile; admin sees all. Function EXECUTE locked: anon/auth can't call `decrement_inventory`/`redeem_coupon`/`release_coupon`/`check_rate_limit`/`admin_*` (except `auth` → `admin_*` self-guarded; `anon` → `lookup_coupon` by design).
- **Runtime**: `/`, `/shop`, PDP (Storage images + normalized variant labels) → 200; `/admin` → 307 gate.

## Fixed (Must-fix)
- **G1 (money, critical)** — a null variant `price_paise` (an override) was coerced to **₹0** in the display mapper and the authoritative `priceCart`. Now inherits the product base price (`?? product.price_paise`, never 0). `lib/data/map.ts`, `lib/checkout/order-actions.ts`.
- **G2 (payments)** — the Razorpay webhook wrote the `webhook_events` dedupe row *before* processing, so a transient capture failure was permanently acked as a duplicate on retry → paid order stuck `pending`. Now the dedupe row is **deleted on the non-ack path** so Razorpay's retry reprocesses (finalize's `pending→confirmed` guard keeps it safe). `app/api/webhooks/razorpay/route.ts`.
- **G3 (security)** — CSV export now neutralizes spreadsheet **formula injection** (fields starting with `= + - @`/tab/CR are quote-prefixed); the `email` column is user-controlled. `lib/admin/dashboard.ts`.
- **G6 (security)** — dropped the unused `orders_insert_own` / `order_items_insert_own` RLS policies that let any logged-in user POST fake `pending` orders (polluting KPIs / fulfillable). Orders are created service-role only. (migration + `lib/db/sql/rls.sql`).

## Fixed (Should-fix)
- **G4** — image **primary integrity**: setting a new primary demotes the others; deleting the primary promotes the next image. `lib/admin/actions.ts`.
- **G5 + G15** — cancelling/refunding a **committed** order now **restocks inventory and releases the coupon** — both admin (`updateOrderStatus`) and user (`cancelOrder`) paths. New `release_coupon(uuid)` RPC (service-role only).
- **G7** — `redeem_coupon` now enforces `usage_limit` + `per_user_limit` under the row lock (was lookup-time TOCTOU only).
- **G8** — documented that an admin grant/revoke only takes effect on the target's next JWT refresh (no clean per-user revocation API in supabase-js); mitigation: short Auth access-token TTL.
- **G9** — `priceCart` now also requires the variant's **category to be live** (`status='active'`), not just the product active.
- **G10** — `updateInventory` revalidates the editor page + storefront (not just the products list).
- **G11** — duplicate-key (23505) on create product/variant/option/value now yields a friendly "already in use" message.
- **G13** — stock quantity uses a strict parser (blank/NaN/scientific-notation/overflow rejected) instead of the paise parser that silently zeroed stock.
- **G18** — coupon-id lookup uses exact `.eq` (not `ilike`, whose `%`/`_` are wildcards).

## Deferred (tracked, non-blocking) — with rationale
- **G12** low-stock widget caps display at 12 / fetches 100 — only undercounts beyond ~100 inventory rows (impossible at current scale); KPI uses the same predicate.
- **G14** `deleteVariant` review claim of a 23503 FK error was **wrong** (`order_items.variant_id` is `ON DELETE SET NULL`); only residual is no "last variant" guard.
- **G16** `settings` anon `using(true)` SELECT — fine while settings holds only public config; scope before storing anything sensitive.
- **G17** anon `analytics_events` insert is unbounded — add rate-limiting/payload caps later.
- **G19** `decrement_inventory` matches by `variant_id` only — latent multi-warehouse over-decrement (single `MUM-1` row today).
- **G20** domain `OrderStatus` enum (`'placed'`) diverges from the DB enum — cosmetic (client response only).
- **G21/G22/G24/G25** — `setVariantOptionValues` doesn't validate value∈product; `uploadProductImage` has no server MIME/size check (admin-only); `createProduct` can go live empty; `inventory.variant_id` not unique. Hardening, low risk.
- **G26** "two default addresses crash checkout" — **dismissed** (partial unique index `(user_id) WHERE is_default` prevents two defaults).

## Go-live final QA round (2026-06-28)

Full-application audit: build/tsc/lint, DB advisors+integrity (spotless — 5 products all complete, no orphans, all images https, RLS enforcing), full runtime crawl (all public 200 / gated 307), and three parallel deep-flow auditors (storefront/SEO, auth/account/checkout, admin). **Code gaps found & fixed:**
- JSON-LD `image` URLs were double-prefixed (`${SITE}${absoluteStorageUrl}`) on every PDP → use absolute src as-is. (`app/product/[slug]/page.tsx`)
- Added per-PDP `og:image`/`twitter:image` + canonical, and a default site OG image; `metadataBase`, `sitemap.ts`, `robots.ts` now read `NEXT_PUBLIC_SITE_URL`. (`app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`)
- Payment page hard-coded a false "Demo checkout — no real payment is processed" line → now shows "Payments are processed securely by Razorpay" when the publishable key is set. (`app/checkout/payment/page.tsx`)
- Abandoned-cart cron treated ALL `pending` orders as abandoned → now excludes COD + captured payments (no nagging paying/COD customers). (`app/api/cron/abandoned-cart/route.ts`)
- Signup always pushed to `/account` even when email confirmation is required → returns `needsConfirmation`, shows a "check your inbox" state. (`lib/auth/actions.ts`, `components/auth/register-form.tsx`)
- `finalizeOrder` ignored a `false` from `redeem_coupon` → now logs for manual review (charged-but-not-redeemed). (`lib/checkout/finalize.ts`)
- Admin could "reopen" a cancelled/refunded order → blocked (would have caused oversell). (`updateOrderStatus`)
- `coupon_id` was stored even with no discount → only stored when it actually applies. (`lib/checkout/order-actions.ts`)
- Mode hero-image replacement leaked the old Storage object → old object deleted. Product image upload could leave zero primary → forces primary when none exists. (`lib/admin/actions.ts`)
- Removed dead campaign actions/constants (Marketing was removed); removed dead paise price branch in `updateInventory`; CSV formula-injection guard now catches leading whitespace.

**Deferred (low/accepted, non-blocking):** retry re-quote in `resolveExistingOrder`; no pre-capture stock check (oversell clamped+flagged); idempotency key resets on remount; customers page caps at 200 (2 users today); manual status override allows skip/backward among non-terminal states; `payments[0]`-only display.

**Owner config still required for live integrations (cannot be done in code) — see report.**

## Verification after fixes
`tsc` ✓, `pnpm lint` ✓ (0 warnings), `pnpm build` ✓; DB checks: `release_coupon` anon/auth EXECUTE = false, 0 order/order_items INSERT policies, `redeem_coupon` enforces limits.



---

<!-- ===== consolidated from docs/superpowers/specs/2026-06-27-schema-rebuild-drizzle-foundation-design.md ===== -->

# Foundation: Schema Rebuild + Drizzle Hybrid Data Layer

**Date:** 2026-06-27
**Status:** Design approved; spec under review
**Supabase project:** `hgnvoqkqvpxvovzgpopl` (live)

## 1. Overview

Rebuild the Postgres schema from scratch as **Drizzle-ORM-as-source-of-truth**,
folding in every fix from the 2026-06-27 schema audit, then rewire the app to a
**hybrid data layer**: Drizzle for admin/service code, `@supabase/ssr` (RLS) for
user-facing code.

This is the **foundation** phase. The later feature phases build on it:
- **A.** Admin shell UX (login→/admin redirect, minimal header for admins)
- **B.** Product CMS (full editor, create/delete, image upload to Storage + migrate `/public/images`)
- **C.** Admin dashboard (widgets, date-range, CSV export)

They are out of scope here and get their own specs.

## 2. Goals / Non-goals

**Goals**
- One clean schema, defined in Drizzle, with all audit gaps fixed.
- Hybrid data access that **keeps RLS as the authorization layer for anything a browser can reach.**
- Catalogue re-seeded; existing `auth.users` (2 accounts incl. the admin) preserved.
- App builds, lints, type-checks; storefront + checkout + account smoke-tested.

**Non-goals (this phase)**
- Image→Storage migration / CMS editor (Phase B).
- Dashboard work (Phase C).
- New commerce subsystems beyond the three agreed additions (no warehouses, tax-rate tables, gift cards, etc.).

## 3. Locked decisions

| Decision | Choice |
|---|---|
| Rebuild approach | Full rebuild; Drizzle schema is the new source of truth |
| Drizzle vs RLS | **Hybrid** — Drizzle for admin/service; `@supabase/ssr` + RLS for user-facing |
| Sequencing | Foundation first, then features A/B/C |
| Schema scope | Gap fixes + category hierarchy + stock-movement ledger + returns/RMA |
| Variant modeling | **Fully normalized** (options / option-values / variant junction) |
| Money | `bigint` paise; drop per-row `currency` (single-currency INR) |
| Admin source of truth | JWT `app_metadata.role` claim only; **drop `admin_roles`** |

## 4. New schema design

All money columns are `bigint` (paise). All timestamps `timestamptz`. RLS enabled on
every table. `created_at`/`updated_at` (with `tg_set_updated_at`) on all mutable tables.

### 4.1 Catalogue
- **categories** — as today **plus `parent_id uuid REFERENCES categories(id) ON DELETE SET NULL`** (hierarchy). Keep `status`, `slug` (unique), `sort_order`, hero/meta fields, `deleted_at`.
- **products** — keep `id, category_id, slug (uq), sku (uq), name, short_description, description, price_paise (bigint), original_price_paise (bigint), tags text[], specs jsonb, features text[], compatibility, is_returnable, return_window_days, is_active, is_new, is_featured, rating, review_count, weight_grams, hsn_code, shipping_policy, default_variant_id, deleted_at, created_by, timestamps`. **Drop** `variant_axes`, `currency`. `rating`/`review_count` become **trigger-maintained** (see 4.6).
- **product_options** *(new)* — `id, product_id (fk cascade), name text NN, position int NN 0, timestamps`. The variant axes (e.g. "Pack size"). Unique `(product_id, name)`.
- **product_option_values** *(new)* — `id, option_id (fk cascade), value text NN, position int NN 0`. Unique `(option_id, value)`.
- **product_variants** — `id, product_id (fk cascade), sku (uq), variant_name, price_paise (bigint), original_price_paise (bigint), weight_grams, position, is_active, timestamps`. **Drop** `size, color, attributes`.
- **variant_option_values** *(new, junction)* — `variant_id (fk cascade), option_value_id (fk cascade)`, PK `(variant_id, option_value_id)`. A variant = its set of chosen option values. Index on `option_value_id`.
- **product_images** — as today + **add `created_at`/`updated_at`**. (`url` still points at `/public/...` after the reseed; Phase B migrates to Storage.)
- **inventory** — as today + **add `created_at`**. CHECK `quantity>=0`, `reserved>=0`. Keep the `(product_id, coalesce(variant_id,…), warehouse_code)` unique.

### 4.2 Cart
- **carts** — as today + **FK `converted_order_id → orders(id) ON DELETE SET NULL`** and an index on it.
- **cart_items** — unchanged (money→bigint).

### 4.3 Orders / payments
- **orders** — money→bigint; **drop `currency`, `coupon_code`** (keep `coupon_id` FK as the single source). Keep `order_number (uq)`, `idempotency_key` (partial uq), status timestamps, address jsonb, CHECKs.
- **order_items** — money→bigint; keep snapshot columns (`product_name, sku, variant_label`) and `product_id/variant_id` SET NULL.
- **order_status_history** — unchanged (trigger-fed).
- **payments** — money→bigint; keep `UNIQUE(order_id)`, `UNIQUE(razorpay_order_id)`, `UNIQUE(razorpay_payment_id)`; **drop the redundant plain indexes** that duplicate those uniques.
- **refunds** — money→bigint; unchanged otherwise.

### 4.4 Coupons / reviews / wishlist / addresses
- **coupons** — money→bigint; **unique index on `lower(code)`** (replaces case-sensitive `UNIQUE(code)`); store code normalized. `times_redeemed` maintained by `redeem_coupon` (unchanged path).
- **coupon_redemptions** — **drop the duplicate** `(order_id, coupon_id)` unique (keep `(coupon_id, order_id)`); **add index `(coupon_id, user_id)`** for per-user-limit checks.
- **reviews** — **drop `is_published`**; keep single `status review_status` (pending/approved/rejected). Public read = `status='approved'`. Trigger maintains `products.rating`/`review_count` on approve/unapprove/delete.
- **wishlist** — **drop the duplicate** unique index (keep one `(user_id, product_id)`).
- **addresses** — **make default unique-per-user**: `UNIQUE (user_id) WHERE is_default`.

### 4.5 New: stock ledger + returns
- **stock_movements** *(new)* — `id, product_id, variant_id, delta bigint NN, reason stock_movement_reason NN, order_id (fk set null), note text, created_by uuid, created_at`. Written by `decrement_inventory`/`restock_inventory` and admin stock edits. New enum `stock_movement_reason`: `order, restock, adjustment, return, reservation_release`.
- **return_requests** *(new)* — `id, order_id (fk cascade), user_id (fk set null), status return_request_status NN 'requested', reason text, resolution_note text, created_at/updated_at`. New enum `return_request_status`: `requested, approved, rejected, received, refunded`.
- **return_items** *(new)* — `id, return_request_id (fk cascade), order_item_id (fk set null), quantity int NN CHECK>0`.

### 4.6 Functions / RPCs / triggers
Carry over (recreated): `is_admin()`, `lookup_coupon()`, `redeem_coupon()`,
`check_rate_limit()`, `tg_handle_new_user()`, `tg_orders_assign_number()`,
`tg_orders_log_status_change()`, `tg_set_updated_at()`, `rls_auto_enable()`.

**Changed/new:**
- `decrement_inventory(p_variant_id, p_qty)` — handle variant-less products (match `product_id` when `variant_id IS NULL`); **write a `stock_movements` row**.
- `restock_inventory(p_variant_id, p_qty)` — write a `stock_movements` row.
- `tg_reviews_maintain_rating()` *(new)* — AFTER INSERT/UPDATE/DELETE on `reviews`, recompute `products.rating` + `review_count` over `status='approved'`.
- **Security:** `admin_dashboard_kpis`, `admin_revenue_timeseries`, `admin_top_products` — `REVOKE EXECUTE FROM anon, authenticated` **and** add an `is_admin()` guard inside each (defense in depth). `lookup_coupon` stays anon-callable by design. Privileged RPCs (`decrement/restock_inventory`, `redeem_coupon`, `check_rate_limit`) remain service-role-only.

### 4.7 RLS model (unchanged philosophy)
- Ownership via `(select auth.uid()) = user_id`; admin via `is_admin()`.
- Consolidate the many `_select_own` + `_select_admin` pairs into single
  `is_admin() OR (select auth.uid()) = user_id` policies where it reduces per-row policy count.
- `analytics_events` INSERT → `WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL)`.
- New tables: `stock_movements` admin-only; `return_requests`/`return_items` owner-read + owner-insert + admin-all.
- `admin_roles` dropped → the customers-page admin badge derives from the JWT claim via the service-role admin user listing (handled in Phase A/C app code, not RLS).

## 5. Drizzle hybrid architecture

**Packages:** `drizzle-orm`, `drizzle-kit` (dev), `postgres` (postgres.js driver).

**Env (server-only):** `DATABASE_URL` = Supabase **pooler** connection string
(transaction pooler, privileged role). Added to `.env.example` with a note; never `NEXT_PUBLIC_`.

**File layout:**
```
lib/db/
  schema/            # Drizzle table + enum + index + RLS defs (source of truth)
    index.ts         # re-exports
    catalogue.ts, orders.ts, ...   # grouped by domain
  index.ts           # the Drizzle client (postgres.js singleton, server-only)
  sql/               # companion raw SQL for functions/RPCs/triggers/grants
drizzle.config.ts    # drizzle-kit config (out dir, schema glob, DATABASE_URL)
drizzle/             # generated migrations
```

**Usage boundary (enforced by convention + `server-only`):**
- **Drizzle** (`lib/db`): admin/service code — `lib/admin/*`, webhook handlers, lifecycle jobs, the Phase-B CMS. Bypasses RLS; callers already assert admin/service.
- **`@supabase/ssr`**: user-facing — storefront catalogue (`publicClient`, RLS-filtered public reads), account/cart/checkout/order reads & writes (user server client, RLS-enforced). `database.types.ts` regenerated for these.

RLS + functions/RPCs/triggers are not expressible fully in Drizzle schema TS; they
live in `lib/db/sql/*` and are applied as part of the migration set. Drizzle schema
declares tables/enums/indexes and (where supported) `pgPolicy`.

## 6. Rebuild sequence (DESTRUCTIVE — separate explicit go before executing)

1. Author Drizzle schema (`lib/db/schema/*`) + companion SQL (`lib/db/sql/*`).
2. Generate the initial migration with drizzle-kit; review the DDL.
3. **Snapshot** current data we care about (export `auth.users` ids + the catalogue is already mirrored in `lib/data`).
4. **Drop all `public` application objects** — tables, custom types/enums, and our functions/triggers — **but NOT by `DROP SCHEMA public CASCADE`** (that would also drop installed extensions and their objects). Preserve/recreate: extensions (incl. `pg_cron` and the `cleanup-rate-limits` daily job), the `order_number_seq` sequence, and the Storage schema. `auth.users` (in the `auth` schema) **survive**, so both accounts + the admin JWT claim persist. Drops catalogue + test orders/carts.
5. Apply the Drizzle migration + companion SQL (tables, enums, indexes, RLS, functions, triggers, grants).
6. **Backfill `profiles`** for existing `auth.users` (the `tg_handle_new_user` trigger only fires on new signups), so the 2 accounts keep profile rows.
7. **Re-seed** the catalogue from `lib/data` into the normalized tables (categories→products→options→option_values→variants→variant_option_values→images→inventory→coupons).
8. Regenerate `lib/supabase/database.types.ts` from the new schema.
9. Rewrite the app data layer for the new shape (§7) and wire the Drizzle client.
10. `get_advisors` (security + performance) → fix anything new. Build + lint + type-check + smoke test.

**Preserved:** `auth.users`, admin JWT claim, Storage bucket `product-images`.
**Lost (acceptable, pre-launch):** test orders/carts; catalogue rows (re-seeded identically).
**Rollback:** if the rebuild fails mid-way, re-run the full migration set (idempotent create) — there is no production order data to lose. A pre-drop `pg_dump` of `public` is taken as a safety net.

## 7. App rewrite surface

Driven mostly by variant normalization + dropped columns + bigint:
- `lib/types.ts` — `Product`/`ProductVariant`/variant axes reshaped to options/values.
- `lib/data/map.ts`, `lib/data/index.ts` — `PRODUCT_SELECT` + mappers for normalized variants/options + dropped `currency`/`variant_axes`.
- `lib/variants.ts` — `axisOptions`/`resolveVariant`/`isOptionAvailable`/`defaultSelection` rewritten against options/option-values.
- `components/product/product-purchase.tsx` — variant selection UI against the new option model.
- `lib/checkout/order-actions.ts` (`priceCart`), `lib/checkout/pricing.ts`, `finalize.ts` — variant joins + bigint, drop `coupon_code` writes (use `coupon_id`).
- `lib/admin/actions.ts` — moved onto Drizzle; `setAdminRole` writes only the JWT claim (no `admin_roles`).
- `lib/supabase/database.types.ts` — regenerated.
- `.env.example` — add `DATABASE_URL`.

## 8. Verification

- `pnpm lint` clean; `pnpm build` green (incl. TypeScript).
- `get_advisors` security + performance: no new warnings; confirm the `admin_*` RPC exposure and `analytics_events` insert are fixed.
- Smoke: storefront catalogue renders with variants; product page variant selection resolves price/stock; add-to-cart → checkout → order create works; account page loads orders/addresses; admin can log in and reach `/admin`.

## 9. Risks

- **Highest-risk change in the codebase.** Schema rebuild + data-layer rewrite; variant normalization ripples through storefront rendering.
- Mitigation: storefront stays on RLS-protected Supabase reads (no Drizzle in the browser path); destructive step gated on explicit approval with a `pg_dump` safety net; full build + advisor + smoke gate before "done".
- Drizzle pooler connection must use the **transaction pooler** (not session) and a privileged role; verify connection works before the rewrite.

## 10. Out of scope (future phases)
- **A. Admin shell UX**, **B. Product CMS + image storage**, **C. Dashboard** — separate specs after foundation is green.



---

<!-- ===== consolidated from docs/superpowers/specs/2026-06-27-phase-a-admin-shell-design.md ===== -->

# Phase A — Admin Shell UX

**Date:** 2026-06-27 · **Depends on:** foundation rebuild (done) · **Status:** spec → implementing

## Goal
Make the admin experience feel like a distinct app: admins land in `/admin` after
login, and the storefront chrome doesn't intrude on admin pages.

## Scope (small, low-ambiguity)
1. **Login → /admin for admins.** After a successful password login with no explicit
   `?redirect=` target, send admins to `/admin` and everyone else to `/account`.
   - `signInWithPassword` (server action) returns `isAdmin` (read the post-login
     session's `app_metadata.role`). The login form computes the destination:
     explicit `redirect` param wins; else `isAdmin ? "/admin" : "/account"`.
   - The existing open-redirect guard on the `redirect` param is preserved.
2. **Minimal header on /admin.** The global storefront `SiteHeader` is redundant inside
   `/admin` (the admin layout already has its own sidebar chrome). On `/admin*` routes
   render a slim bar — wordmark + "← Back to store" + logout — instead of the full
   storefront nav/cart. Implementation: `SiteHeader` (or a small wrapper) checks the
   pathname; `/admin*` → minimal variant.
3. **Admin entry affordance.** When a signed-in admin is on the storefront, surface a
   discreet "Admin" link in the account menu/header so they can jump back to `/admin`.

## Non-goals
- No new admin pages or data (those are Phase C). No role management UI changes.

## Verification
- Admin login lands on `/admin`; customer login lands on `/account`; `?redirect=` still honored.
- `/admin` shows the slim header (no cart/storefront nav); storefront unaffected.
- `tsc`/`lint`/`build` green.



---

<!-- ===== consolidated from docs/superpowers/specs/2026-06-27-phase-b-product-cms-storage-design.md ===== -->

# Phase B — Product CMS + Image Storage

**Date:** 2026-06-27 · **Depends on:** foundation rebuild (done) · **Status:** spec (implement after A)

## Goal
A full admin product editor (create / edit / delete, with variants, options, images),
and move product imagery from `/public/images` into the Supabase Storage bucket
`product-images` (created in the old migration 008, preserved through the rebuild).

## Scope
1. **Product editor** (`/admin/products/[id]` + new `/admin/products/new`):
   - Edit core fields (name, slug, descriptions, price, flags, tags, specs, features,
     compatibility, HSN, shipping policy, return policy/window).
   - Manage **options/values** and **variants** (the normalized model): add/remove options,
     add/reorder values, create variants by picking one value per option, set per-variant
     SKU/price/compare-at/weight/active, set `default_variant_id`, edit inventory.
   - Create + soft-delete (`deleted_at`) products.
2. **Image upload to Storage**:
   - Upload via the admin (service-role or authenticated-admin) client to bucket
     `product-images`; store the public URL (or path) in `product_images.url`.
   - **Migrate `/public/images/*`**: one-time script/route that reads the 8 existing
     files, uploads them to Storage, and rewrites `product_images.url` to the Storage URLs.
   - Storefront `<ProductImage>` already renders any `src`; confirm Storage URLs are allowed
     in `next.config.ts` `images.remotePatterns` (the Supabase project host).
3. **Data writes** via Drizzle (admin/service half of the hybrid layer) — **requires
   `DATABASE_URL`**. If unset, fall back to the authenticated-admin Supabase client (RLS
   `*_all_admin`), which already works for these tables.

## Open design decisions (confirm before/while building)
- **Editor UX**: single long form vs. tabbed (Details / Variants / Images / Inventory).
  Recommend tabbed for the variant/option matrix.
- **Storage path convention** (`<productId>/<filename>` vs flat) and public vs. signed URLs
  (recommend public bucket + public URLs for catalogue imagery).
- Whether to keep `/public/images` as a fallback after migration (recommend: keep until
  verified, then remove).

## Risks
- Image migration mutates real asset references — do it idempotently and verify rendering
  before deleting originals. RLS on `storage.objects` for the bucket must allow admin writes.

## Verification
- Create/edit/delete a product incl. variants + a freshly uploaded image; storefront renders
  it. Migration rewrites all 8 URLs to Storage and pages still render. `tsc`/`lint`/`build` green.



---

<!-- ===== consolidated from docs/superpowers/specs/2026-06-27-phase-c-admin-dashboard-design.md ===== -->

# Phase C — Admin Dashboard

**Date:** 2026-06-27 · **Depends on:** foundation rebuild (done) · **Status:** spec (implement after A/B)

## Goal
Turn the current single KPI strip into a useful operations dashboard with a selectable
date range, richer widgets, and CSV export.

## Scope
1. **Date-range control** — 7 / 30 / 90 days (and "custom") driving the existing
   `admin_dashboard_kpis(days)`, `admin_revenue_timeseries(days)`, `admin_top_products(days,lim)`
   RPCs (already parameterized; called via the authenticated admin session).
2. **Widgets** — revenue + orders KPIs with period-over-period deltas (exist); revenue
   sparkline/bars (exist, extend to the selected range); top products table; low-stock list
   (from `inventory` ≤ threshold); pending-orders / pending-reviews counts (exist);
   optionally an order-status funnel from `order_status_history`.
3. **CSV export** — server route(s) that stream orders (and/or revenue timeseries) for the
   selected range as CSV, admin-gated (`getIsAdmin()` + RLS).

## Open design decisions (confirm before/while building)
- Exact widget set + layout for v1 (KPIs + revenue chart + top products + low stock is a
  sensible default).
- CSV scope: orders only vs. orders + line items vs. revenue series.
- Whether date-range is querystring-driven (server components, recommended) or client state.

## Non-goals
- No new metrics tables; reuse existing RPCs/tables. No external analytics.

## Verification
- Switching range updates all widgets; CSV downloads match the range and are admin-only.
  `tsc`/`lint`/`build` green; re-run advisors (no new findings).



---

<!-- ===== consolidated from docs/superpowers/specs/2026-06-26-account-edit-details-design.md ===== -->

# Edit account details — design

**Date:** 2026-06-26
**Status:** Approved scope, pending spec review

## Goal

Let a signed-in user update their own details from the account page (`/account`):
name, communication preferences, default delivery address, email, and phone.
Editing happens **inline** on the account page — no separate route.

## Scope

Editable fields:

| Field | Storage | Verification |
| --- | --- | --- |
| Name (`full_name`) | `profiles` | none |
| Marketing opt-in | `profiles.marketing_opt_in` | none |
| WhatsApp opt-in | `profiles.whatsapp_opt_in` | none |
| Default address | `addresses` (`is_default = true`) | none |
| Email | auth identity | Supabase confirmation email (out-of-band) |
| Phone | auth identity | Supabase SMS OTP (in-UI, two-step) |

Out of scope: password change, multiple/non-default addresses, deleting the
account.

## Architecture

The account page (`app/account/page.tsx`) stays a **server component** that
fetches `profile` (via `getProfile`) and the default `address`. The read-only
"Account details" panel is replaced by a **client island** that receives this
data as props and manages inline read↔edit state.

### Components (`components/account/`)

- **`account-details.tsx`** — client island. Renders the detail rows
  (Name, Email, Phone, communication prefs) with per-section "Edit" toggles.
  - **Profile sub-form**: Name + two opt-in checkboxes → `updateProfile`.
  - **Email sub-form**: new email → `requestEmailChange`; on success collapses
    to a "Check your inbox to confirm" note. Displayed email stays the current
    (confirmed) one until Supabase syncs it.
  - **Phone sub-form**: new phone → `requestPhoneChange`; on success swaps to a
    6-digit OTP step (same UI idiom as `register-form.tsx`) →
    `confirmPhoneChange`. On verify, the displayed phone updates.
- **`address-editor.tsx`** — client island for the default address. Read view
  mirrors the current single-line summary; edit view is the checkout shipping
  field set (Full name, Phone, Address line 1, line 2, City, State `Select`,
  PIN) → `updateDefaultAddress`.

Both reuse existing primitives: `LabeledInput`, `Field`, `Select`, `Button`,
and `toast` for success/error. Validation mirrors the checkout/register forms
(client-side for UX; authoritative re-validation server-side).

### Server actions (`lib/account/actions.ts`, `"use server"`)

Mirror `lib/auth/actions.ts` conventions: server-side validation, generic
error messages (never echo raw Supabase auth errors), rate-limiting via
`withinRateLimit`, `revalidatePath("/account")` on mutation.

- `updateProfile({ fullName, marketingOptIn, whatsappOptIn }): AuthResult`
  — user-scoped `createClient()` update on `profiles` (RLS owns the row, same
  as the signup action). Trims/length-caps name.
- `updateDefaultAddress(input): AuthResult` — upsert the user's
  `is_default` address row (user-scoped; RLS `auth.uid() = user_id`).
  Reuses the field validation shape from `order-actions.validateContact`.
  Normalises phone to E.164 like `order-actions.toE164`.
- `requestEmailChange(email): AuthResult` — validate email, then
  `auth.updateUser({ email })`. Returns a "confirm via the link we emailed"
  message. **Graceful fallback:** if Supabase returns a config/SMTP error,
  return a generic "Email change is temporarily unavailable" message.
- `requestPhoneChange(phone): AuthResult & { phone?: string }` — validate +
  normalise to E.164, rate-limit (3/number/hr + per-IP cap, same as
  `sendPhoneOtp`), then `auth.updateUser({ phone })`. **Graceful fallback:** an
  SMS-provider/config error returns "Phone verification is temporarily
  unavailable" rather than surfacing the raw error.
- `confirmPhoneChange(phone, token): AuthResult` —
  `auth.verifyOtp({ phone, token, type: "phone_change" })`; on success also
  update `profiles.phone` to keep the display copy in sync, then
  `revalidatePath("/account")`.

## Data-sync notes

- **Phone**: after OTP verify, `profiles.phone` is updated in the same action,
  so the account page reflects it immediately.
- **Email**: confirmation is out-of-band (user clicks the emailed link later),
  so the action cannot sync `profiles.email`. The page keeps showing the
  current confirmed email plus a transient "pending confirmation" note; the
  copy reconciles on the next login / via any existing auth→profiles trigger.
  We do **not** optimistically show the unconfirmed email.

## Error handling

- All actions return the existing `AuthResult` (`{ ok, message }`) shape;
  clients show `toast(...)`. Field-level errors render inline like the other
  forms.
- Auth-identity actions fail **closed** with a generic message when the
  provider is misconfigured — no raw error leaks, no false "success".

## Testing

- Manual: edit name + prefs, save, confirm persistence on reload.
- Manual: edit default address (insert when none exists, update when one does).
- Manual: email change shows the inbox-confirmation note.
- Manual: phone change → OTP step → verify path (requires working SMS; with SMS
  unconfigured, confirm the graceful "unavailable" message appears).
- Lint: `pnpm lint` clean — in particular no `react-hooks/set-state-in-effect`
  (this repo treats it as an error).



---

<!-- ===== consolidated from docs/superpowers/plans/2026-06-26-account-edit-details.md ===== -->

# Edit Account Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user update their name, communication preferences, default delivery address, email, and phone — inline on the `/account` page.

**Architecture:** A new `lib/account/actions.ts` holds five Server Actions that validate input server-side and write via the user-scoped Supabase client (RLS owns the rows). The account page stays a server component; its read-only "Account details" panel becomes two client islands (`AccountDetails`, `AddressEditor`) that toggle inline between a read view and edit forms, reusing existing UI primitives.

**Tech Stack:** Next.js 16.2.7 (App Router, React 19), Supabase (`@supabase/ssr`), TypeScript, Tailwind v4.

## Global Constraints

- This repo runs a **modified Next.js 16.2.7** — read `node_modules/next/dist/docs/` before using unfamiliar APIs (see `AGENTS.md`).
- ESLint rule `react-hooks/set-state-in-effect` is an **error**: never call a `useState` setter synchronously inside `useEffect`. (All state changes in this plan happen in event handlers, not effects — keep it that way.)
- No automated test harness exists. Verification per task = `npx tsc --noEmit` (typecheck) + `pnpm lint`, plus manual browser checks on UI tasks. Do **not** add a test framework.
- Server Actions must validate authoritatively server-side and return generic messages — never echo raw Supabase auth errors (account-enumeration guard, matching `lib/auth/actions.ts`).
- Phone numbers normalise to E.164 (`+91` default for 10-digit Indian mobiles), matching `toE164` in `lib/auth/actions.ts` / `lib/checkout/order-actions.ts`.
- Commit message trailer for every commit: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Server actions — profile + default address

**Files:**
- Create: `lib/account/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `getUser` from `@/lib/auth/user`.
- Produces:
  - `type AccountResult = { ok: boolean; message: string }`
  - `updateProfile(input: { fullName: string; marketingOptIn: boolean; whatsappOptIn: boolean }): Promise<AccountResult>`
  - `interface AddressInput { fullName: string; phone: string; line1: string; line2: string; city: string; state: string; pin: string }`
  - `updateDefaultAddress(input: AddressInput): Promise<AccountResult>`

- [ ] **Step 1: Create the file with profile + address actions**

Create `lib/account/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";

export type AccountResult = { ok: boolean; message: string };

/** Normalise a 10-digit Indian mobile (or a +E.164 number) to E.164. */
function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

/** Log the real error server-side; hand the client a generic message. */
function actionError(context: string, error: unknown, message: string): AccountResult {
  console.error(`account:${context}`, error);
  return { ok: false, message };
}

export async function updateProfile(input: {
  fullName: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}): Promise<AccountResult> {
  const name = input.fullName.trim();
  if (!name) return { ok: false, message: "Please enter your name." };
  if (name.length > 120) return { ok: false, message: "That name is too long." };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      marketing_opt_in: input.marketingOptIn,
      whatsapp_opt_in: input.whatsappOptIn,
    })
    .eq("id", user.id);
  if (error) {
    return actionError("update_profile", error, "Could not save your details. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your details have been updated." };
}

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

function validateAddress(a: AddressInput): string | null {
  const required: [keyof AddressInput, number][] = [
    ["fullName", 120],
    ["line1", 200],
    ["city", 80],
    ["state", 80],
  ];
  for (const [key, max] of required) {
    const v = (a[key] ?? "").trim();
    if (!v) return "Please complete all required address fields.";
    if (v.length > max) return "One of the address fields is too long.";
  }
  if ((a.line2 ?? "").length > 200) return "One of the address fields is too long.";
  if (!toE164(a.phone)) return "Please enter a valid phone number.";
  if (!/^\d{4,10}$/.test(a.pin.trim())) return "Please enter a valid PIN code.";
  return null;
}

export async function updateDefaultAddress(input: AddressInput): Promise<AccountResult> {
  const validationError = validateAddress(input);
  if (validationError) return { ok: false, message: validationError };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const row = {
    user_id: user.id,
    full_name: input.fullName.trim(),
    phone: toE164(input.phone)!,
    line1: input.line1.trim(),
    line2: input.line2.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    postal_code: input.pin.trim(),
    country: "IN",
    is_default: true,
  };

  // Upsert the single default address: update the existing row if present,
  // otherwise insert. RLS (auth.uid() = user_id) scopes this to the caller.
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("addresses").update(row).eq("id", existing.id)
    : await supabase.from("addresses").insert(row);
  if (error) {
    return actionError("update_address", error, "Could not save your address. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your default address has been saved." };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/account/actions.ts`.

- [ ] **Step 3: Lint**

Run: `npx eslint lib/account/actions.ts`
Expected: clean (no output).

- [ ] **Step 4: Commit**

```bash
git add lib/account/actions.ts
git commit -m "feat: account actions for profile and default address" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Server actions — email + phone change

**Files:**
- Modify: `lib/account/actions.ts`

**Interfaces:**
- Consumes: `clientIp`, `withinRateLimit` from `@/lib/security/rate-limit`; `toE164`, `actionError`, `EMAIL_RE`, `AccountResult` from Task 1 (same file); `createClient`.
- Produces:
  - `requestEmailChange(email: string): Promise<AccountResult>`
  - `requestPhoneChange(phone: string): Promise<AccountResult & { phone?: string }>`
  - `confirmPhoneChange(phone: string, token: string): Promise<AccountResult>`

- [ ] **Step 1: Add the rate-limit import**

At the top of `lib/account/actions.ts`, add below the existing imports:

```ts
import { clientIp, withinRateLimit } from "@/lib/security/rate-limit";
```

- [ ] **Step 2: Append the three auth-identity actions**

Append to the end of `lib/account/actions.ts` (the `EMAIL_RE` const sits with the other module-level helpers — place it just after the `toE164` declaration near the top, or directly above `requestEmailChange`):

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Begin an email change. Supabase emails a confirmation link to the new
 * address; the change only takes effect once the user clicks it. We therefore
 * do NOT touch profiles.email here — it reconciles out-of-band.
 */
export async function requestEmailChange(email: string): Promise<AccountResult> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) {
    // Fail closed on provider/SMTP misconfiguration — generic message, no raw leak.
    return actionError("email_change", error, "Email change is temporarily unavailable. Please try again later.");
  }
  return { ok: true, message: "Check your inbox — we've sent a link to confirm your new email." };
}

/** Begin a phone change: send an OTP to the new number via Supabase. */
export async function requestPhoneChange(
  phone: string,
): Promise<AccountResult & { phone?: string }> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Enter a valid 10-digit number." };
  // Prevent SMS toll-fraud: 3 sends per number per hour + a per-IP cap.
  const ip = await clientIp();
  if (
    !(await withinRateLimit({ key: `phonechange:${e164}`, limit: 3, windowSeconds: 3600 })) ||
    !(await withinRateLimit({ key: `phonechange-ip:${ip}`, limit: 15, windowSeconds: 3600 }))
  ) {
    return { ok: false, message: "Too many code requests. Please wait before trying again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  if (error) {
    return actionError("phone_change", error, "Phone verification is temporarily unavailable. Please try again later.");
  }
  return { ok: true, message: `OTP sent to ${e164}.`, phone: e164 };
}

/** Confirm a phone change with the OTP, then sync the profiles.phone copy. */
export async function confirmPhoneChange(phone: string, token: string): Promise<AccountResult> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Invalid phone number." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: token.trim(),
    type: "phone_change",
  });
  if (error) {
    return actionError("phone_change_verify", error, "That code is invalid or expired.");
  }
  if (data.user) {
    await supabase.from("profiles").update({ phone: e164 }).eq("id", data.user.id);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your phone number has been updated." };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`verifyOtp` accepts `type: "phone_change"` — it is part of supabase-js's `MobileOtpType`.)

- [ ] **Step 4: Lint**

Run: `npx eslint lib/account/actions.ts`
Expected: clean — `EMAIL_RE`, `clientIp`, `withinRateLimit` are now all used.

- [ ] **Step 5: Commit**

```bash
git add lib/account/actions.ts
git commit -m "feat: account actions for email and phone change" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: AccountDetails client island (name, prefs, email, phone)

**Files:**
- Create: `components/account/account-details.tsx`

**Interfaces:**
- Consumes: `updateProfile`, `requestEmailChange`, `requestPhoneChange`, `confirmPhoneChange` from `@/lib/account/actions`; `Button` from `@/components/ui/button`; `LabeledInput` from `@/components/ui/field`; `toast` from `@/components/ui/toast`; `UserIcon`, `MailIcon`, `PhoneIcon` from `@/components/icons`.
- Produces:
  - `interface AccountDetailsData { fullName: string; email: string; phone: string; marketingOptIn: boolean; whatsappOptIn: boolean }`
  - `function AccountDetails({ initial }: { initial: AccountDetailsData }): React.ReactElement`

- [ ] **Step 1: Create the component file**

Create `components/account/account-details.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { UserIcon, MailIcon, PhoneIcon } from "@/components/icons";
import {
  updateProfile,
  requestEmailChange,
  requestPhoneChange,
  confirmPhoneChange,
} from "@/lib/account/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{10}$/;

export interface AccountDetailsData {
  fullName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}

type Section = "profile" | "email" | "phone" | null;

const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 appearance-none border border-ink-12 bg-white " +
  "checked:border-navy-800 checked:bg-navy-800 focus:outline-none focus-visible:border-navy-500";

export function AccountDetails({ initial }: { initial: AccountDetailsData }) {
  const [data, setData] = useState(initial);
  const [section, setSection] = useState<Section>(null);

  return (
    <dl className="mt-4 flex flex-col gap-px border border-ink-12 bg-ink-12">
      {section === "profile" ? (
        <ProfileEditor
          initial={data}
          onCancel={() => setSection(null)}
          onSaved={(next) => {
            setData((d) => ({ ...d, ...next }));
            setSection(null);
          }}
        />
      ) : (
        <Row Icon={UserIcon} label="Name" value={data.fullName || "—"} onEdit={() => setSection("profile")}>
          <p className="mt-1 text-xs text-ink-30">
            {data.marketingOptIn ? "Marketing on" : "Marketing off"} ·{" "}
            {data.whatsappOptIn ? "WhatsApp on" : "WhatsApp off"}
          </p>
        </Row>
      )}

      {section === "email" ? (
        <EmailEditor current={data.email} onCancel={() => setSection(null)} onDone={() => setSection(null)} />
      ) : (
        <Row Icon={MailIcon} label="Email" value={data.email || "—"} onEdit={() => setSection("email")} />
      )}

      {section === "phone" ? (
        <PhoneEditor
          onCancel={() => setSection(null)}
          onSaved={(phone) => {
            setData((d) => ({ ...d, phone }));
            setSection(null);
          }}
        />
      ) : (
        <Row Icon={PhoneIcon} label="Phone" value={data.phone || "—"} onEdit={() => setSection("phone")} />
      )}
    </dl>
  );
}

type IconType = (p: { className?: string; "aria-hidden"?: boolean }) => React.ReactElement;

function Row({
  Icon,
  label,
  value,
  onEdit,
  children,
}: {
  Icon: IconType;
  label: string;
  value: string;
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 bg-white p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
        <div>
          <dt className="type-mono text-ink-30">{label}</dt>
          <dd className="mt-1 text-[15px] text-navy-800">{value}</dd>
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="type-mono text-[10px] text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function ProfileEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AccountDetailsData;
  onCancel: () => void;
  onSaved: (next: Pick<AccountDetailsData, "fullName" | "marketingOptIn" | "whatsappOptIn">) => void;
}) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [marketingOptIn, setMarketingOptIn] = useState(initial.marketingOptIn);
  const [whatsappOptIn, setWhatsappOptIn] = useState(initial.whatsappOptIn);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    setPending(true);
    const result = await updateProfile({ fullName, marketingOptIn, whatsappOptIn });
    setPending(false);
    if (result.ok) {
      toast({ title: "Saved", description: result.message, variant: "success" });
      onSaved({ fullName: fullName.trim(), marketingOptIn, whatsappOptIn });
    } else {
      setError(result.message);
      toast({ title: "Couldn't save", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="Name"
        autoComplete="name"
        required
        value={fullName}
        error={error}
        onChange={(e) => {
          setFullName(e.target.value);
          setError("");
        }}
      />
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
        <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className={checkboxClass} />
        Send me ride-ready drops &amp; offers
      </label>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
        <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className={checkboxClass} />
        Send order &amp; reminder updates on WhatsApp
      </label>
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EmailEditor({
  current,
  onCancel,
  onDone,
}: {
  current: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-3 bg-white p-5">
        <p className="text-sm text-navy-800">
          Check your inbox to confirm the change. Until you do, {current || "your current email"} stays active.
        </p>
        <Button type="button" variant="secondary" size="md" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }
    setPending(true);
    const result = await requestEmailChange(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      toast({ title: "Confirm your email", description: result.message, variant: "success" });
    } else {
      setError(result.message);
      toast({ title: "Couldn't update email", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="New email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        hint={current ? `Current: ${current}` : undefined}
        value={email}
        error={error}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Sending…" : "Send confirmation"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PhoneEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (phone: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!PHONE_RE.test(phone.trim())) {
      setError("Enter a 10-digit number");
      return;
    }
    setPending(true);
    const result = await requestPhoneChange(phone);
    setPending(false);
    if (result.ok) {
      setE164(result.phone ?? phone);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      toast({ title: "OTP sent", description: result.message, variant: "success" });
    } else {
      setError(result.message);
      toast({ title: "Couldn't send code", description: result.message, variant: "error" });
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.some((d) => d === "")) {
      setError("Enter all 6 digits");
      return;
    }
    setPending(true);
    const result = await confirmPhoneChange(e164, otp.join(""));
    setPending(false);
    if (result.ok) {
      toast({ title: "Phone updated", description: result.message, variant: "success" });
      onSaved(e164);
    } else {
      setError(result.message);
    }
  }

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = digit;
      return copy;
    });
    setError("");
    if (digit) document.getElementById(`acc-otp-${index + 1}`)?.focus();
  }

  if (step === "otp") {
    return (
      <form onSubmit={verify} noValidate className="flex flex-col gap-4 bg-white p-5">
        <div className="flex flex-col gap-1.5">
          <span className="type-mono text-ink-60">Enter OTP</span>
          <div className="flex gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`acc-otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                aria-label={`OTP digit ${i + 1}`}
                value={digit}
                onChange={(e) => updateOtp(i, e.target.value)}
                className="h-12 w-full border bg-white text-center text-lg text-ink transition-colors focus:border-navy-500 focus:outline-none"
              />
            ))}
          </div>
          {error && <p className="type-mono text-[10px] text-error">{error}</p>}
          <p className="text-xs text-ink-30">We sent a 6-digit code to {e164}.</p>
        </div>
        <div className="flex gap-3">
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Verifying…" : "Verify & save"}
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="New phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="10-digit mobile number"
        value={phone}
        error={error}
        onChange={(e) => {
          setPhone(e.target.value);
          setError("");
        }}
      />
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Sending…" : "Send OTP"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/account/account-details.tsx`.

- [ ] **Step 3: Lint**

Run: `npx eslint components/account/account-details.tsx`
Expected: clean. In particular, no `react-hooks/set-state-in-effect` (this component uses no `useEffect`).

- [ ] **Step 4: Commit**

```bash
git add components/account/account-details.tsx
git commit -m "feat: inline account details editor (name, prefs, email, phone)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: AddressEditor client island (default address)

**Files:**
- Create: `components/account/address-editor.tsx`

**Interfaces:**
- Consumes: `updateDefaultAddress`, `AddressInput` from `@/lib/account/actions`; `Button` from `@/components/ui/button`; `LabeledInput`, `Field`, `Select` from `@/components/ui/field`; `toast` from `@/components/ui/toast`; `PinIcon` from `@/components/icons`.
- Produces:
  - `function AddressEditor({ initial, hasAddress }: { initial: AddressInput; hasAddress: boolean }): React.ReactElement`

- [ ] **Step 1: Create the component file**

Create `components/account/address-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput, Field, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { PinIcon } from "@/components/icons";
import { updateDefaultAddress, type AddressInput } from "@/lib/account/actions";

// Mirrors the canned list on the checkout shipping form.
const STATES = [
  "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat",
  "West Bengal", "Rajasthan", "Uttar Pradesh", "Kerala", "Punjab", "Haryana",
];

type Errors = Partial<Record<keyof AddressInput, string>>;

export function AddressEditor({ initial, hasAddress }: { initial: AddressInput; hasAddress: boolean }) {
  const [saved, setSaved] = useState<AddressInput>(initial);
  const [present, setPresent] = useState(hasAddress);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const summary = [saved.line1, saved.line2, saved.city, saved.state, saved.pin]
      .filter(Boolean)
      .join(", ");
    return (
      <div className="mt-4 flex items-start justify-between gap-3 border border-ink-12 bg-white p-5">
        <div className="flex items-start gap-3">
          <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
          <div>
            <p className="type-mono text-ink-30">Default address</p>
            <p className={`mt-1 text-[15px] ${present ? "text-navy-800" : "text-ink-30"}`}>
              {present ? summary : "Add a default delivery address"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="type-mono text-[10px] text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
        >
          {present ? "Edit" : "Add"}
        </button>
      </div>
    );
  }

  return (
    <AddressForm
      initial={saved}
      onCancel={() => setEditing(false)}
      onSaved={(next) => {
        setSaved(next);
        setPresent(true);
        setEditing(false);
      }}
    />
  );
}

function AddressForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AddressInput;
  onCancel: () => void;
  onSaved: (next: AddressInput) => void;
}) {
  const [form, setForm] = useState<AddressInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const set = (k: keyof AddressInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  function validate(): boolean {
    const next: Errors = {};
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a 10-digit phone";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!/^\d{6}$/.test(form.pin)) next.pin = "Enter a 6-digit PIN";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setPending(true);
    const result = await updateDefaultAddress(form);
    setPending(false);
    if (result.ok) {
      toast({ title: "Address saved", description: result.message, variant: "success" });
      onSaved(form);
    } else {
      toast({ title: "Couldn't save address", description: result.message, variant: "error" });
    }
  }

  const stateOptions = STATES.includes(form.state) ? STATES : [form.state, ...STATES].filter(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-5 border border-ink-12 bg-white p-5">
      <LabeledInput label="Full name" required value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
      <LabeledInput label="Phone" type="tel" inputMode="tel" required value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
      <LabeledInput
        label="Address" required value={form.line1} onChange={set("line1")} error={errors.line1}
        autoComplete="address-line1" placeholder="Flat / House no, building, street, area"
      />
      <LabeledInput label="Apartment, suite, etc. (optional)" value={form.line2} onChange={set("line2")} autoComplete="address-line2" />
      <div className="grid gap-5 sm:grid-cols-3">
        <LabeledInput label="City" required value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
        <Field label="State" htmlFor="addr-state" required>
          <Select id="addr-state" value={form.state} onChange={set("state")}>
            {stateOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <LabeledInput label="PIN code" inputMode="numeric" required value={form.pin} onChange={set("pin")} error={errors.pin} autoComplete="postal-code" maxLength={6} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

Note: the default `form.state` arrives from the page as `"Maharashtra"` when no address exists (Task 5 sets that fallback), so the `<Select>` always has a valid selection.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/account/address-editor.tsx`.

- [ ] **Step 3: Lint**

Run: `npx eslint components/account/address-editor.tsx`
Expected: clean (no `useEffect`, so no set-state-in-effect risk).

- [ ] **Step 4: Commit**

```bash
git add components/account/address-editor.tsx
git commit -m "feat: inline default-address editor" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Wire the islands into the account page

**Files:**
- Modify: `app/account/page.tsx`

**Interfaces:**
- Consumes: `AccountDetails`, `AccountDetailsData` from `@/components/account/account-details`; `AddressEditor` from `@/components/account/address-editor`; `AddressInput` from `@/lib/account/actions`.
- Produces: nothing for later tasks (terminal task).

- [ ] **Step 1: Update imports**

In `app/account/page.tsx`, below the existing component imports add:

```tsx
import { AccountDetails } from "@/components/account/account-details";
import { AddressEditor } from "@/components/account/address-editor";
import type { AddressInput } from "@/lib/account/actions";
```

The page no longer renders the local `Detail` helper or the `MailIcon`/`PhoneIcon`/`PinIcon` rows directly (the islands own those). Leave the existing `UserIcon` import (still used for the section headings). Remove `MailIcon`, `PhoneIcon`, `PinIcon` from the `@/components/icons` import line **only if** the editor components now own all their uses — verify nothing else in the file references them before deleting (the `Detail` helper is being removed in Step 3, which is their only other use).

- [ ] **Step 2: Widen the address query**

Replace the existing address query:

```tsx
  const { data: address } = await supabase
    .from("addresses")
    .select("line1, line2, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();
```

with one that also pulls the name/phone the editor needs:

```tsx
  const { data: address } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, line2, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();

  const detailsData: AccountDetailsData = {
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    marketingOptIn: profile.marketing_opt_in ?? false,
    whatsappOptIn: profile.whatsapp_opt_in ?? false,
  };

  const addressForm: AddressInput = {
    fullName: address?.full_name ?? profile.full_name ?? "",
    phone: address?.phone ?? profile.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state || "Maharashtra",
    pin: address?.postal_code ?? "",
  };
```

Add the import for the type at the top:

```tsx
import type { AccountDetailsData } from "@/components/account/account-details";
```

- [ ] **Step 3: Replace the read-only details panel**

Replace the entire `{/* Account details */}` `<section>` block (the one containing the `<dl>` with the four `Detail` rows) with:

```tsx
          {/* Account details */}
          <section aria-labelledby="details-heading">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-navy-500" aria-hidden />
              <h2 id="details-heading" className="type-condensed text-sm text-navy-800">
                Account details
              </h2>
            </div>

            <AccountDetails initial={detailsData} />
            <AddressEditor initial={addressForm} hasAddress={!!address} />
          </section>
```

- [ ] **Step 4: Delete the now-unused `Detail` helper**

Remove the `function Detail({ ... }) { ... }` declaration at the bottom of `app/account/page.tsx` (it has no remaining callers).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `MailIcon`/`PhoneIcon`/`PinIcon` are reported unused, remove them from the icons import line.

- [ ] **Step 6: Lint**

Run: `npx eslint app/account/page.tsx`
Expected: clean.

- [ ] **Step 7: Manual verification in the browser**

Run: `pnpm dev`, sign in, visit `/account`. Confirm:
1. **Name + prefs**: click Edit on Name → change name, toggle the checkboxes → Save → toast appears, row reflects the new name and the "Marketing/WhatsApp on/off" line updates. Reload — values persist.
2. **Default address**: click Edit/Add → fill the form → Save address → toast, summary updates. Reload — persists. (Insert path when you had no address; update path when you did.)
3. **Email**: click Edit on Email → enter a new email → Send confirmation → "check your inbox" note shows; the displayed email does NOT change. (If SMTP is unconfigured, you instead get the generic "temporarily unavailable" toast — that is the expected graceful fallback.)
4. **Phone**: click Edit on Phone → enter a 10-digit number → Send OTP. With SMS configured, the 6-digit step appears and a correct code updates the phone. With SMS unconfigured, expect the "Phone verification is temporarily unavailable" message.

- [ ] **Step 8: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: enable inline detail editing on the account page" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **profiles.email is never written here.** Email changes flow through Supabase's confirmation link; the page keeps showing the confirmed email. Do not try to optimistically update it.
- **profiles.phone IS synced** inside `confirmPhoneChange` after a successful OTP verify.
- The `addresses` upsert is user-scoped (RLS), unlike the service-role path in `lib/checkout/order-actions.ts` — a signed-in user may write only their own rows, which is exactly what we want.
- If `verifyOtp({ type: "phone_change" })` fails to typecheck, confirm the installed `@supabase/supabase-js` version (`2.108.2`) exposes `phone_change` in `MobileOtpType`; it does.
