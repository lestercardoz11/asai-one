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
