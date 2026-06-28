# Checkout Conversion & Trust UX — Design Spec

**Date:** 2026-06-28
**Status:** Approved (pending written-spec review)
**Scope:** Cart entry points → Cart → Shipping → Payment → Confirmation
**Priority lens:** Conversion & trust (ecommerce industry standards)

## Context

The ASAI.One checkout journey (`/cart` → `/checkout/shipping` → `/checkout/payment`
→ `/checkout/confirmation`) is already cleanly built on a sound engine: server-side
re-pricing, Razorpay-order↔signature binding, idempotency keys, webhook reconciliation,
fail-closed-in-production payment handling, localStorage cart with price snapshots. The
work here is **conversion/trust polish, not a rewrite** — every server-side security
guarantee is preserved as-is.

This spec implements the approved scope **A + B + C**:
- **A** — targeted conversion levers (payment de-duplication, free-ship nudge, retry UX, trust).
- **B** — slide-in mini-cart entry point.
- **C** — refresh-proof / shareable confirmation page (tokenized, includes a DB change).

### Razorpay configuration validation (findings, for the record)

Validated against the live account (Razorpay MCP) and the code:
- Live account: 0 orders / 0 payments / 0 refunds — pre-launch, on **test keys** (`rzp_test_`).
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` are set.
- **🔴 `RAZORPAY_WEBHOOK_SECRET` is EMPTY.** `verifyWebhookSignature()` (`lib/razorpay.ts:71`)
  returns `false` when unset, so `app/api/webhooks/razorpay/route.ts` rejects **every**
  delivery with HTTP 400. The webhook is the documented source of truth; with it offline,
  a buyer who pays then closes the tab before the client `verifyPayment` handler runs leaves
  the order stranded `pending` — stock never decremented, no confirmation email.
- **This is a config/dashboard action (create webhook, set the shared secret in env), NOT a
  code change.** It is a launch blocker and is called out here so it is not lost. No code in
  this spec depends on it, but the retry/confirmation UX below partially compensates by making
  the client-side verify path more robust.

Code-level security is otherwise strong and is left untouched.

## Goals / Non-goals

**Goals**
- Reduce decisions and friction at the payment step.
- Raise AOV + completion with a free-shipping progress nudge.
- Keep shoppers in-funnel with a mini-cart entry point.
- Make the post-purchase screen reassuring and durable (refresh/share-proof).
- Consistent trust signals and accessible interactions throughout.

**Non-goals (YAGNI — explicitly excluded)**
- One-page checkout rewrite.
- Address autocomplete / PIN→city lookup.
- Saved cards / tokenization / wallet-specific flows.
- A/B testing framework, analytics event instrumentation.
- Any change to pricing rules, order lifecycle, or webhook reconciliation logic.

## Architecture & components

| Piece | Type | Purpose |
|---|---|---|
| Cart UI state (`drawerOpen`, `openCart()`, `closeCart()`) | extend `lib/cart/cart-context.tsx` | Lets `addItem` callers pop the mini-cart; single source of drawer state |
| `components/cart/mini-cart.tsx` | new | Slide-in drawer; reuses the header mobile-drawer pattern (overlay, `role="dialog"`, `aria-modal`, scroll-lock, Esc-to-close, focus trap) |
| `components/cart/free-ship-bar.tsx` | new | Progress bar + remaining-to-free-shipping / unlocked message; `aria-live="polite"` |
| `components/checkout/payment-methods.tsx` | new (extracted from payment page) | Two choices — **Pay Online** vs **Cash on Delivery** |
| `components/checkout/order-timeline.tsx` | new | "What happens next" 3-step post-purchase timeline |
| `lib/checkout/confirmation.ts` | new server action | `getOrderForConfirmation({ number, token })` — owner- or token-gated read |
| `orders.access_token` | **DB column** (uuid, default `gen_random_uuid()`, not null) | Token in confirmation URL so guests can reload/share; owners read via RLS without it |

Boundaries: each new component has one purpose and a narrow prop interface. The mini-cart and
free-ship bar consume `useCart()` only. The payment-methods component is presentational over a
`value`/`onChange` pair. The confirmation server action is the only new DB-reading code and is
self-contained.

## Detailed design

### A1 — Payment method de-duplication

**Problem:** the page offers UPI / Card / Net Banking / COD as radios, then Razorpay's modal
asks for the method *again*; the chosen `method` is stored on the payment row but never passed
to Checkout. Double selection = friction.

**Change:**
- `payment-methods.tsx` renders **two** options:
  - **Pay Online** — subtitle "UPI · Cards · Net Banking · Wallets", with accepted-method logos
    shown as reassurance (not selectable sub-choices). Maps to the existing online path; the
    specific instrument is chosen inside Razorpay.
  - **Cash on Delivery** — unchanged COD path.
- The `PaymentMethod` type today is `upi | card | netbanking | cod`. To avoid touching the
  order/DB enum, the UI maps **Pay Online → `upi`** as the stored representative online method
  (server logic already treats all non-`cod` identically: it creates a Razorpay order and lets
  the modal pick the real instrument). COD stays `cod`. No DB/enum change.
- Razorpay Checkout options gain: `image` (brand logo URL — served from `/` public asset or
  Storage), `description` = `Order ${order_number} · ASAI.One`, `notes: { order_number }`.
  Theme color unchanged (`#0b1624`).

**Security:** no change. Server still re-prices, binds signature to the order, reconciles
amount/currency.

### A2 — Free-shipping nudge

- `free-ship-bar.tsx`: given `subtotal`, `shipping`, and `FREE_SHIP_THRESHOLD` (from
  `lib/checkout/pricing.ts`), render:
  - subtotal < threshold and shipping > 0 → "Add **₹X** for FREE shipping" + a progress bar at
    `min(100, subtotal/threshold*100)%`.
  - subtotal ≥ threshold (or already free via coupon) → "✓ You've unlocked free shipping".
- Rendered inside `OrderSummary` (so it appears on cart, shipping, payment) and at the top of the
  mini-cart. `aria-live="polite"` so quantity changes are announced.
- Uses existing money rules only; no new pricing logic.

### A3 — Payment failure / retry UX

- Introduce an inline payment status on the payment page: `idle | placing | awaiting | failed`.
- On Razorpay modal **dismiss** or a **failed** payment, the order is preserved (the stable
  `idempotencyKey` ref already guarantees re-submit returns the same order + re-issues the same
  Razorpay handoff via `resolveExistingOrder`). The page shows an inline panel: "Payment didn't go
  through" + the amount + a **Retry payment** button (re-opens Checkout) and a "choose another
  method" affordance, instead of only a transient toast.
- The success `handler` path is unchanged (calls `verifyPayment`, then confirmation redirect).
- `aria-live` region announces the failed/retry state.

### B — Mini-cart drawer

- Extend `CartProvider` with `drawerOpen: boolean`, `openCart()`, `closeCart()` (kept in the
  same context so any `addItem` caller can trigger it without prop drilling).
- `mini-cart.tsx` mounted once (e.g. in the storefront shell, sibling to the header). Slides from
  the right; contains: free-ship bar, scrollable line items (image, title, variant, qty stepper,
  remove), subtotal, and footer CTAs **Checkout** (`/checkout/shipping`) + **View full cart**
  (`/cart`). Empty state mirrors the cart page.
- Header cart icon: opens the drawer instead of navigating. `/cart` page is retained as the full
  fallback and is reachable from the drawer.
- `QuickAddButton` and the PDP add-to-cart call `openCart()` after `addItem`. The success toast is
  removed where the drawer now provides the feedback (no double feedback).
- A11y: focus moves into the drawer on open, is trapped while open, returns to the trigger on
  close; Esc closes; background scroll locked (reuse the header pattern).

### C — Persistent / shareable confirmation

**DB change (per CLAUDE.md DB workflow):**
1. Add `access_token uuid not null default gen_random_uuid()` to the `orders` table in
   `lib/db/schema` (orders domain file).
2. `pnpm drizzle-kit generate --name=order_access_token`.
3. Apply to live Supabase via MCP `apply_migration` (DDL). The column is readable only through
   the service-role confirmation action; **no new RLS grant to anon** — anon never selects the
   token directly.
4. Regenerate `lib/supabase/database.types.ts` via MCP `generate_typescript_types`.
5. Run MCP `get_advisors` (security + performance) after the DDL.

**Order creation:** `createOrder` already inserts the order via the service-role client and gets
`order_number` back. Extend the insert `.select(...)` to also return `access_token`, and include
it in the `CreateOrderResult.order` handoff (a new `accessToken` field on the result, not exposed
in the public `Order` UI type beyond what the confirmation URL needs).

**Confirmation read:** new server action `getOrderForConfirmation({ number, token })`:
- If a session user owns the order (RLS read by `order_number`) → return it (no token needed).
- Else if `token` matches the order's `access_token` (service-role lookup by `order_number`) →
  return a read-only projection (items, totals, contact masked as today, status).
- Else → null (page shows the existing "No recent order" empty state).

**Page flow:** after a successful payment/COD placement, redirect to
`/checkout/confirmation?o=<order_number>&t=<access_token>`. The in-memory `lastOrder` context
becomes a fast path (instant render, no flash); on a refresh/share the page falls back to fetching
via the server action using the URL params. Net effect: **a reload no longer shows "No recent order."**

**Post-purchase reassurance:** add `order-timeline.tsx` (Confirmed → Packed → Out for delivery,
current step = Confirmed). Link the Order ID to the account order-detail for signed-in users.

### Trust & accessibility (cross-cutting)

- A shared trust row (Secure Checkout · 256-bit Encrypted · Easy Returns · delivery ETA) near
  every primary CTA, with real accepted-payment logos (reuse the existing badge style from the
  payment page).
- All new interactive surfaces are keyboard-operable with visible focus rings; drawer focus-trap;
  `aria-live` on free-ship and payment-retry updates; radio/option semantics preserved.
- All new server paths fail safe with a clear user-facing message, matching existing conventions.

## Data flow

1. **Add to cart** (card/PDP) → `addItem()` (localStorage) → `openCart()` → mini-cart shows line +
   free-ship bar.
2. **Cart/Shipping** → `OrderSummary` shows free-ship bar + totals from `computeTotals`.
3. **Payment** → choose Pay Online | COD → `createOrder` (server re-prices, returns order +
   `accessToken` + Razorpay handoff) → online: Razorpay modal (logo/description/notes) →
   `verifyPayment` → redirect `…/confirmation?o&t`. On dismiss/fail → inline retry (same order).
4. **Confirmation** → render from in-memory `lastOrder` if present, else `getOrderForConfirmation`
   from URL params → timeline + summary.

## Error handling

- Razorpay script load failure → existing "Payment unavailable" message (unchanged).
- Payment dismissed/failed → inline retry panel (A3), order preserved via idempotency key.
- Confirmation fetch miss (bad/expired params, not owner) → existing empty state.
- All new server reads wrap errors and return a safe null/message; no secrets surfaced.

## Testing & verification

No test framework in this repo. Verify with:
- `npx tsc --noEmit` (types, incl. regenerated `database.types.ts`).
- `pnpm lint`.
- `pnpm build` (also statically generates storefront/PDPs against live Supabase — validates the
  data layer and the new column wiring).
- Supabase MCP `get_advisors` after the migration (security + performance).
- Manual walk-through (Razorpay test mode): add → mini-cart → shipping → Pay Online (test UPI) →
  confirmation, including a deliberate dismiss to exercise the retry panel, a COD order, and a
  confirmation **refresh** to prove persistence.

## Rollout notes

- The DB column is additive and backfills via default for existing rows — safe.
- `RAZORPAY_WEBHOOK_SECRET` must be set in env + a webhook created in the Razorpay dashboard
  (`payment.captured`, `payment.failed`) before go-live — tracked separately as a config task.
