# Checkout Conversion & Trust UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise checkout conversion & trust — de-duplicate payment-method selection, add a free-shipping nudge, a payment retry path, a slide-in mini-cart, and a refresh-proof/shareable confirmation page.

**Architecture:** Pure additive work on the existing cart/checkout engine — no change to pricing rules, order lifecycle, signature verification, or webhook reconciliation. New presentational components consume the existing `useCart()`/checkout contexts; one new DB column (`orders.access_token`) plus one new server action back the persistent confirmation.

**Tech Stack:** Next.js 16 (App Router, React 19, Turbopack), TypeScript, Tailwind v4, Supabase (`@supabase/ssr` + service-role), Drizzle-as-source-of-truth, Razorpay Standard Checkout (no SDK).

## Global Constraints

- **No test framework in this repo.** Verify EVERY task with `npx tsc --noEmit` and `pnpm lint`; run `pnpm build` where noted. There are no `vitest`/`jest` tests to write.
- **Money is integer paise** end-to-end; format only at display with `formatINR()` (`lib/format.ts`).
- **Hybrid data access:** browser-reachable reads use `lib/supabase/*` (RLS enforced); privileged reads/writes use the service-role `createAdminClient()` (`lib/supabase/admin.ts`). Never bypass RLS for browser-reachable code.
- **DB workflow:** schema is Drizzle-as-source-of-truth (`lib/db/schema/*`). DDL is applied to the LIVE Supabase project via the Supabase MCP `apply_migration` (no local Postgres, no `drizzle-kit push`). After a schema change: `pnpm drizzle-kit generate`, regenerate `lib/supabase/database.types.ts` via MCP `generate_typescript_types`, run MCP `get_advisors`.
- **Design tokens:** navy ramp, `ink-*` hairlines, `type-*`/`font-*` utilities, **zero border-radius** aesthetic (`app/globals.css`). Reuse `components/ui` primitives and `buttonVariants`.
- **Available icons** (`components/icons.tsx`): `CartIcon, CloseIcon, ArrowRightIcon, PlusIcon, MinusIcon, CheckIcon, TruckIcon, ShieldIcon, LockIcon, MailIcon`. Do NOT invent new icon imports — reuse these (e.g. `CloseIcon` for remove, `TruckIcon` for the timeline).
- **PaymentMethod enum is unchanged** (`upi | card | netbanking | cod`). "Pay Online" stores the representative value **`upi`**; the server already treats every non-`cod` method identically.
- **Commit after every task** once `tsc` + `lint` pass.

---

## File Structure

**Create:**
- `components/cart/free-ship-bar.tsx` — free-shipping progress nudge
- `components/cart/mini-cart.tsx` — slide-in cart drawer
- `components/checkout/payment-methods.tsx` — two-choice method selector (Pay Online / COD)
- `components/checkout/order-timeline.tsx` — post-purchase "what happens next" timeline
- `components/checkout/trust-row.tsx` — shared trust badges + accepted-payment logos
- `lib/checkout/confirmation.ts` — `getOrderForConfirmation` server action

**Modify:**
- `lib/db/schema/orders.ts` — add `accessToken` column
- `lib/supabase/database.types.ts` — regenerated (not hand-edited)
- `lib/checkout/order-actions.ts` — return `accessToken`; select the new column
- `lib/cart/cart-context.tsx` — add `drawerOpen` / `openCart` / `closeCart`
- `components/cart/order-summary.tsx` — render `FreeShipBar`
- `app/checkout/payment/page.tsx` — use `PaymentMethods`, configure Razorpay modal, retry UX, redirect with `?o&t`
- `app/checkout/confirmation/page.tsx` — read URL params + server-action fallback + timeline
- `app/layout.tsx` — mount `<MiniCart />`
- `components/shell/site-header.tsx` — cart icon opens the drawer
- `components/shop/quick-add-button.tsx` — `openCart()` after add
- `components/product/product-purchase.tsx` — `openCart()` after add

---

## Task 1: Add `orders.access_token` column (DB)

**Files:**
- Modify: `lib/db/schema/orders.ts:61-103`
- Modify (generated): `drizzle/`, `lib/supabase/database.types.ts`

**Interfaces:**
- Produces: `orders.access_token` (uuid, not null, default `gen_random_uuid()`), exposed in Drizzle as `orders.accessToken` and in `database.types.ts` as `orders.Row.access_token: string`.

- [ ] **Step 1: Add the column to the Drizzle schema**

In `lib/db/schema/orders.ts`, inside the `orders` table column block, add `accessToken` right after the `idempotencyKey` line (`:80`):

```ts
    idempotencyKey: text("idempotency_key"),
    // Random per-order token: lets a guest reload/share their confirmation page
    // without auth. Read only via the service-role confirmation action — never
    // selected by anon directly, so no RLS grant change is required.
    accessToken: uuid("access_token").notNull().defaultRandom(),
```

- [ ] **Step 2: Generate the Drizzle migration**

Run: `pnpm drizzle-kit generate --name=order_access_token`
Expected: a new `drizzle/00xx_*.sql` containing `ALTER TABLE "orders" ADD COLUMN "access_token" uuid DEFAULT gen_random_uuid() NOT NULL;`

- [ ] **Step 3: Apply the migration to the live project**

Use the Supabase MCP `apply_migration` with name `order_access_token` and the SQL from the generated file:

```sql
ALTER TABLE "orders" ADD COLUMN "access_token" uuid DEFAULT gen_random_uuid() NOT NULL;
```

(Additive with a default → existing rows backfill automatically; safe, non-blocking.)

- [ ] **Step 4: Regenerate the TypeScript types**

Use the Supabase MCP `generate_typescript_types` and overwrite `lib/supabase/database.types.ts` with the result. Confirm `orders` `Row`/`Insert` now include `access_token`.

- [ ] **Step 5: Run advisors**

Use the Supabase MCP `get_advisors` with type `security`, then `performance`. Expected: no NEW errors attributable to this column (it adds no policy/index surface). Note any pre-existing advisories but do not act on unrelated ones.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 7: Commit**

```bash
git add lib/db/schema/orders.ts drizzle/ lib/supabase/database.types.ts
git commit -m "feat(db): add orders.access_token for shareable confirmation"
```

---

## Task 2: Return access token + confirmation read action

**Files:**
- Modify: `lib/checkout/order-actions.ts:75-83` (result type), `:228-254` (resolveExistingOrder), `:346-450` (inserts/returns)
- Create: `lib/checkout/confirmation.ts`

**Interfaces:**
- Consumes: `orders.access_token` (Task 1).
- Produces:
  - `CreateOrderResult.accessToken?: string` — the order's token, returned on every persisted path.
  - `getOrderForConfirmation(input: { number: string; token?: string | null }): Promise<Order | null>` in `lib/checkout/confirmation.ts`.

- [ ] **Step 1: Add `accessToken` to the result type**

In `lib/checkout/order-actions.ts`, extend `CreateOrderResult` (`:75-83`):

```ts
export interface CreateOrderResult {
  ok: boolean;
  message?: string;
  order?: Order;
  /** Razorpay handoff for online payment (when configured). */
  razorpay?: { orderId: string; amount: number; keyId: string; dbOrderId: string };
  /** True when no payment provider / persistence is configured (demo mode). */
  simulated?: boolean;
  /** Per-order token for the shareable confirmation URL (persisted orders only). */
  accessToken?: string;
}
```

- [ ] **Step 2: Select the token on the order insert**

In `createOrder`, change the insert's `.select(...)` (`:349`) to include the token:

```ts
    .select("id, order_number, access_token")
    .single();
```

- [ ] **Step 3: Return the token on the order insert path**

Where `const order: Order = { ...baseOrder, id: orderRow.order_number };` is built (`:386`), thread the token through to each `return` that includes `order` in `createOrder`. The simplest, DRY approach: capture it once and spread it into the returns.

Replace `:386` and the three `return { ok: true, order ... }` sites in the persisted section so each carries `accessToken: orderRow.access_token`. Concretely:

- COD return (`:400`): `return { ok: true, order, accessToken: orderRow.access_token };`
- Razorpay return (`:415-424`): add `accessToken: orderRow.access_token,` alongside `order`.
- Simulated-capture return (`:449`): `return { ok: true, order, simulated: true, accessToken: orderRow.access_token };`

- [ ] **Step 4: Return the token from the idempotency replay path**

In `resolveExistingOrder` (`:228-254`), select and return the token so a re-submit also gets it:

```ts
  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number, access_token")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (!existing) return null;
  const order: Order = { ...baseOrder, id: existing.order_number };
  const { data: pay } = await admin
    .from("payments")
    .select("razorpay_order_id, status")
    .eq("order_id", existing.id)
    .maybeSingle();
  if (pay?.razorpay_order_id && pay.status !== "captured" && razorpayConfigured()) {
    return {
      ok: true,
      order,
      accessToken: existing.access_token,
      razorpay: { orderId: pay.razorpay_order_id, amount: total, keyId: razorpayKeyId()!, dbOrderId: existing.id },
    };
  }
  return { ok: true, order, accessToken: existing.access_token };
```

- [ ] **Step 5: Create the confirmation read action**

Create `lib/checkout/confirmation.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, PaymentMethod } from "@/lib/types";

const ORDER_SELECT =
  "id, order_number, user_id, email, phone, status, subtotal_paise, shipping_paise, discount_paise, total_paise, shipping_address, placed_at";

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: string;
  subtotal_paise: number;
  shipping_paise: number;
  discount_paise: number;
  total_paise: number;
  shipping_address: { full_name?: string } | null;
  placed_at: string;
}

/**
 * Read an order for the confirmation screen. Authorization is by EITHER:
 *  - the signed-in owner (RLS-scoped read by order_number), OR
 *  - a matching access_token (service-role read, exact-token match only).
 * Returns null when neither holds, so the page shows its empty state.
 */
export async function getOrderForConfirmation(input: {
  number: string;
  token?: string | null;
}): Promise<Order | null> {
  const number = input.number?.trim();
  if (!number) return null;
  // Demo mode (no persistence) — nothing to read; the in-memory page handles it.
  if (!process.env.SUPABASE_SECRET_KEY) return null;

  // Owner path: RLS only returns the row if the caller owns it.
  const supabase = await createClient();
  let row = (
    await supabase.from("orders").select(ORDER_SELECT).eq("order_number", number).maybeSingle()
  ).data as OrderRow | null;

  // Token path: exact (order_number, access_token) match via service role.
  if (!row && input.token) {
    const admin = createAdminClient();
    row = (
      await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("order_number", number)
        .eq("access_token", input.token)
        .maybeSingle()
    ).data as OrderRow | null;
  }
  if (!row) return null;

  // Line items + payment are read with the service role once authorized above.
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("product_name, variant_label, sku, unit_price_paise, quantity")
    .eq("order_id", row.id);
  const { data: pay } = await admin
    .from("payments")
    .select("method, status")
    .eq("order_id", row.id)
    .maybeSingle();

  const orderItems: OrderItem[] = (items ?? []).map((i) => ({
    productTitle: i.product_name,
    variantLabel: i.variant_label ?? "",
    sku: i.sku,
    unitPrice: i.unit_price_paise,
    qty: i.quantity,
  }));

  const method = (pay?.method ?? "upi") as PaymentMethod;
  return {
    id: row.order_number,
    contactName: row.shipping_address?.full_name ?? "",
    contactEmail: row.email,
    contactPhone: row.phone ?? "",
    items: orderItems,
    paymentMethod: method,
    paymentStatus: pay?.status === "captured" ? "paid" : method === "cod" ? "cod_pending" : "pending",
    subtotal: row.subtotal_paise,
    shipping: row.shipping_paise,
    discount: row.discount_paise,
    total: row.total_paise,
    status: row.status === "pending" ? "placed" : (row.status as Order["status"]),
    createdAt: row.placed_at,
  };
}
```

> Before writing, open `lib/types.ts` and confirm the exact field names/union values of `Order`, `OrderItem`, `PaymentMethod`, `Order["status"]`, and `Order["paymentStatus"]`. Adjust the mapping literals (`"paid"`, `"cod_pending"`, `"placed"`) to the real union members if they differ — do not guess.

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/checkout/order-actions.ts lib/checkout/confirmation.ts
git commit -m "feat(checkout): return order access token + confirmation read action"
```

---

## Task 3: Free-shipping nudge

**Files:**
- Create: `components/cart/free-ship-bar.tsx`
- Modify: `components/cart/order-summary.tsx:55-79`

**Interfaces:**
- Consumes: `useCart()` (`subtotal`, `shipping`), `FREE_SHIP_THRESHOLD` (`lib/checkout/pricing.ts`), `formatINR` (`lib/format.ts`).
- Produces: `FreeShipBar` (default export-less named export) — self-contained, no props.

- [ ] **Step 1: Create the component**

Create `components/cart/free-ship-bar.tsx`:

```tsx
"use client";

import { useCart } from "@/lib/cart/cart-context";
import { FREE_SHIP_THRESHOLD } from "@/lib/checkout/pricing";
import { formatINR } from "@/lib/format";
import { TruckIcon, CheckIcon } from "@/components/icons";

/** Progress nudge toward the free-shipping threshold. Renders nothing for an
 *  empty cart; "unlocked" once shipping is free, otherwise the remaining amount. */
export function FreeShipBar() {
  const { subtotal, shipping } = useCart();
  if (subtotal <= 0) return null;

  const unlocked = shipping === 0;
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100));

  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <p className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
        {unlocked ? (
          <>
            <CheckIcon className="h-4 w-4 text-navy-500" />
            You&apos;ve unlocked FREE shipping
          </>
        ) : (
          <>
            <TruckIcon className="h-4 w-4 text-navy-500" />
            Add <span className="tabular-nums">{formatINR(remaining)}</span> for FREE shipping
          </>
        )}
      </p>
      <div className="h-1.5 w-full bg-ink-12">
        <div
          className="h-full bg-navy-800 transition-[width] duration-500"
          style={{ width: `${unlocked ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render it in the order summary**

In `components/cart/order-summary.tsx`, import and render `FreeShipBar` above the totals rows. Add the import near the top:

```tsx
import { FreeShipBar } from "@/components/cart/free-ship-bar";
```

Then inside the totals container (`:60`, the `div` with `className="flex flex-col gap-3 px-5 py-5"`), insert as the first child — with a divider — before the `Subtotal` row:

```tsx
      <div className="flex flex-col gap-3 px-5 py-5">
        <FreeShipBar />
        <div className="h-px bg-ink-12" />
        <Row
          label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
          value={formatINR(subtotal)}
        />
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/cart/free-ship-bar.tsx components/cart/order-summary.tsx
git commit -m "feat(cart): free-shipping progress nudge in order summary"
```

---

## Task 4: Payment method de-duplication + Razorpay config + retry UX

**Files:**
- Create: `components/checkout/payment-methods.tsx`
- Modify: `app/checkout/payment/page.tsx`

**Interfaces:**
- Consumes: `PaymentMethod` (`lib/types`), `CheckIcon`/`LockIcon`/`ShieldIcon` icons.
- Produces:
  - `PaymentMethods` component: `{ value: "online" | "cod"; onChange: (v: "online" | "cod") => void }`.
  - The page maps `"online" → "upi"` (representative) and `"cod" → "cod"` for `setPaymentMethod`.

- [ ] **Step 1: Create the two-choice selector**

Create `components/checkout/payment-methods.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

export type PayChoice = "online" | "cod";

const CHOICES: { id: PayChoice; label: string; desc: string; logos: string[] }[] = [
  {
    id: "online",
    label: "Pay Online",
    desc: "UPI · Cards · Net Banking · Wallets",
    logos: ["UPI", "VISA", "Mastercard", "RuPay"],
  },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", logos: [] },
];

export function PaymentMethods({
  value,
  onChange,
}: {
  value: PayChoice;
  onChange: (v: PayChoice) => void;
}) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
      {CHOICES.map((c) => {
        const active = value === c.id;
        return (
          <label
            key={c.id}
            className={cn(
              "flex cursor-pointer items-center gap-4 border bg-white p-4 transition-colors",
              active ? "border-navy-800" : "border-ink-12 hover:border-navy-300",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                active ? "border-navy-800" : "border-ink-30",
              )}
            >
              {active && <span className="h-2.5 w-2.5 rounded-full bg-navy-800" />}
            </span>
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={active}
              onChange={() => onChange(c.id)}
            />
            <span className="flex-1">
              <span className="type-condensed block text-sm text-navy-800">{c.label}</span>
              <span className="block text-[13px] text-ink-60">{c.desc}</span>
              {c.logos.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {c.logos.map((logo) => (
                    <span
                      key={logo}
                      className="border border-ink-12 bg-near-white px-2 py-0.5 type-mono text-[9px] text-ink-60"
                    >
                      {logo}
                    </span>
                  ))}
                </span>
              )}
            </span>
            {active && <CheckIcon className="h-5 w-5 text-navy-500" />}
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Rework the payment page state + method handling**

In `app/checkout/payment/page.tsx`:

1. Remove the old `METHODS` array (`:18-23`).
2. Add imports:

```tsx
import { PaymentMethods, type PayChoice } from "@/components/checkout/payment-methods";
```

3. Derive the `PayChoice` from the existing `paymentMethod` and add a payment status state. After the `placing` state (`:73`), add:

```tsx
  const [payStatus, setPayStatus] = useState<"idle" | "failed">("idle");
  const choice: PayChoice = paymentMethod === "cod" ? "cod" : "online";
  const onChoice = (v: PayChoice) => setPaymentMethod(v === "cod" ? "cod" : "upi");
```

4. Replace the `{/* methods */}` block (`:178-213`) with:

```tsx
          {/* methods */}
          <div className="mt-8">
            <PaymentMethods value={choice} onChange={onChoice} />
          </div>
```

- [ ] **Step 3: Configure the Razorpay modal + retry handling**

Still in `app/checkout/payment/page.tsx`, in `placeOrder`, update the `new window.Razorpay({...})` options block (`:127-155`) to add brand/description/notes and to set the failed state on dismiss:

```tsx
      const rzp = new window.Razorpay({
        key: result.razorpay.keyId,
        order_id: result.razorpay.orderId,
        amount: result.razorpay.amount,
        currency: "INR",
        name: "ASAI.One",
        description: `Order ${order.id} · ASAI.One`,
        image: "/icon.png",
        notes: { order_number: order.id },
        prefill: {
          name: shipping.fullName,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: { color: "#0b1624" },
        handler: async (response: RazorpayResponse) => {
          const verified = await verifyPayment({
            dbOrderId: result.razorpay!.dbOrderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          if (verified.ok) {
            finish(order, result.accessToken);
          } else {
            setPlacing(false);
            setPayStatus("failed");
            toast({ title: "Payment not verified", description: verified.message ?? "", variant: "error" });
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            setPayStatus("failed");
          },
        },
      });
```

> Add `image?: string;` and `notes?: Record<string, string>;` to the `RazorpayOptions` interface (`:31-42`) so the new options type-check.

- [ ] **Step 4: Add the inline retry panel + reset on success**

Update `finish` (`:88-92`) to accept the token and build the confirmation URL, and to clear the failed state:

```tsx
  const finish = (order: Order, accessToken?: string) => {
    setLastOrder(order);
    clear();
    const params = new URLSearchParams({ o: order.id });
    if (accessToken) params.set("t", accessToken);
    router.push(`/checkout/confirmation?${params.toString()}`);
  };
```

Update the non-Razorpay tail of `placeOrder` (`:160-164`) to pass the token:

```tsx
    if (result.simulated && paymentMethod !== "cod") {
      toast({ title: "Demo payment", description: "No live payment gateway configured — simulated success.", variant: "success" });
    }
    finish(order, result.accessToken);
```

Reset `payStatus` to `"idle"` at the start of `placeOrder` (just after `setPlacing(true)` at `:96`):

```tsx
    setPlacing(true);
    setPayStatus("idle");
```

Then render the retry panel between the methods block and the trust block. Insert after the closing `</div>` of the methods block:

```tsx
          {payStatus === "failed" && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-6 border border-error/40 bg-error/5 p-4"
            >
              <p className="type-condensed text-sm text-navy-800">Payment didn&apos;t go through</p>
              <p className="mt-1 text-[13px] text-ink-60">
                You weren&apos;t charged. You can retry — your order is still reserved.
              </p>
              <Button size="sm" className="mt-3" onClick={placeOrder} disabled={placing}>
                Retry payment
              </Button>
            </div>
          )}
```

> `border-error`/`text-error` already exist (used in `coupon-field.tsx` / `product-purchase.tsx`). If `bg-error/5` or `border-error/40` opacity variants don't resolve under Tailwind v4, fall back to `bg-warm-white` + `border-ink-12`.

- [ ] **Step 5: Simplify the trust block to use the shared row (deferred to Task 8)**

Leave the existing trust block as-is for now; Task 8 replaces it with `TrustRow`.

- [ ] **Step 6: Type-check, lint, build**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS. (`pnpm build` validates the static storefront/PDP generation against live Supabase.)

- [ ] **Step 7: Commit**

```bash
git add components/checkout/payment-methods.tsx app/checkout/payment/page.tsx
git commit -m "feat(checkout): two-choice payment, branded Razorpay modal, retry UX"
```

---

## Task 5: Persistent / shareable confirmation + timeline

**Files:**
- Create: `components/checkout/order-timeline.tsx`
- Modify: `app/checkout/confirmation/page.tsx`

**Interfaces:**
- Consumes: `getOrderForConfirmation` (Task 2), `useCheckout()` `lastOrder`, `useSearchParams`.
- Produces: `OrderTimeline` component (no props) for the confirmation page.

- [ ] **Step 1: Create the timeline component**

Create `components/checkout/order-timeline.tsx`:

```tsx
import { CheckIcon, TruckIcon } from "@/components/icons";

const STEPS = [
  { label: "Confirmed", desc: "We've got your order" },
  { label: "Packed", desc: "Prepared & dispatched in 24–48h" },
  { label: "Out for delivery", desc: "On its way to you" },
];

/** Post-purchase reassurance: where the order is in fulfilment (step 0 = now). */
export function OrderTimeline({ current = 0 }: { current?: number }) {
  return (
    <ol className="grid gap-px border border-ink-12 bg-ink-12 sm:grid-cols-3">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.label} className="flex items-start gap-3 bg-white p-5">
            <span
              aria-hidden
              className={
                "grid h-7 w-7 shrink-0 place-items-center border " +
                (done ? "border-navy-800 bg-navy-800 text-white" : "border-ink-12 bg-white text-ink-30")
              }
            >
              {i === 2 ? <TruckIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
            </span>
            <div>
              <p className="type-condensed text-xs text-navy-800">{s.label}</p>
              <p className="text-[13px] text-ink-60">{s.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Make the confirmation page fall back to the server action**

Rewrite `app/checkout/confirmation/page.tsx` so it renders from in-memory `lastOrder` when present, otherwise fetches by URL params. `useSearchParams` requires a Suspense boundary in Next 16, so split the component.

Replace the top of the file's default export and add a fetching inner component. Keep the existing presentational JSX (hero/meta/items) but drive it from a resolved `order` value. Concretely:

1. Add imports:

```tsx
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderForConfirmation } from "@/lib/checkout/confirmation";
import type { Order } from "@/lib/types";
import { OrderTimeline } from "@/components/checkout/order-timeline";
```

2. Change the default export to a Suspense wrapper:

```tsx
export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-fade" aria-busy />}>
      <ConfirmationInner />
    </Suspense>
  );
}
```

3. Move the existing body into `ConfirmationInner`, resolving the order from context first, then the action:

```tsx
function ConfirmationInner() {
  const { lastOrder } = useCheckout();
  const params = useSearchParams();
  const [fetched, setFetched] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const number = params.get("o");
  const token = params.get("t");

  useEffect(() => {
    if (lastOrder || !number) return;
    setLoading(true);
    getOrderForConfirmation({ number, token })
      .then(setFetched)
      .finally(() => setLoading(false));
  }, [lastOrder, number, token]);

  const o = lastOrder ?? fetched;

  if (loading) return <div className="h-64 animate-fade" aria-busy />;
  if (!o) {
    return (
      <div className="mx-auto max-w-md border border-ink-12 bg-white px-8 py-16 text-center">
        <h1 className="type-display text-3xl text-navy-800">No recent order</h1>
        <p className="mt-2 text-ink-60">
          Looks like there&apos;s nothing to confirm. Keep exploring the lineup.
        </p>
        <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  // ...the existing hero / meta / items / actions JSX, unchanged, using `o`...
}
```

> Preserve all existing JSX from the current `const o = lastOrder;` point downward — only the source of `o` changes. Keep the `Row` and `InfoTile` helpers.

- [ ] **Step 3: Render the timeline + honest online-payment label**

In the rendered JSX:
- Insert `<OrderTimeline current={0} />` right after the `{/* meta */}` grid and before `{/* items */}`, wrapped in `<div className="mt-4">`.
- In the payment `InfoTile`, replace the method label so online orders read honestly (online is always stored as `upi` now):

```tsx
          <InfoTile
            Icon={TruckIcon}
            title={o.paymentMethod === "cod" ? "Payment · Cash on Delivery" : "Payment · Online"}
            lines={[
              o.paymentStatus === "cod_pending" ? "Pay on delivery" : "Paid",
              "Dispatch in 24–48h",
            ]}
          />
```

> Remove the now-unused `METHOD_LABEL` map and its `PaymentMethod` import if nothing else references them (let `tsc`/`lint` flag it).

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/checkout/order-timeline.tsx app/checkout/confirmation/page.tsx
git commit -m "feat(checkout): refresh-proof confirmation + fulfilment timeline"
```

---

## Task 6: Cart drawer state + mini-cart component

**Files:**
- Modify: `lib/cart/cart-context.tsx:98-114` (type), `:120-211` (provider)
- Create: `components/cart/mini-cart.tsx`
- Modify: `app/layout.tsx:112-126`

**Interfaces:**
- Consumes: `useCart()` lines/totals; `FreeShipBar` (Task 3).
- Produces: `CartContextValue` gains `drawerOpen: boolean`, `openCart(): void`, `closeCart(): void`. `MiniCart` component (no props), mounted once.

- [ ] **Step 1: Extend the cart context value type**

In `lib/cart/cart-context.tsx`, add to `CartContextValue` (`:98-114`):

```ts
  /** Mini-cart drawer visibility. */
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
```

- [ ] **Step 2: Add the drawer state to the provider**

In `CartProvider`, add a `useState` (import `useState` from React at the top — it currently imports `useEffect, useMemo, useReducer`). After the `ready` latch (`:122`):

```tsx
  const [drawerOpen, setDrawerOpen] = useState(false);
```

Then add the three members to the `value` object (`:175-208`):

```tsx
    drawerOpen,
    openCart: () => setDrawerOpen(true),
    closeCart: () => setDrawerOpen(false),
```

- [ ] **Step 3: Create the mini-cart drawer**

Create `components/cart/mini-cart.tsx` (mirrors the header mobile-drawer a11y pattern):

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/cart-context";
import { FreeShipBar } from "@/components/cart/free-ship-bar";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CloseIcon, ArrowRightIcon, CartIcon, MinusIcon, PlusIcon } from "@/components/icons";

export function MiniCart() {
  const { lines, itemCount, subtotal, drawerOpen, closeCart, setQty, removeItem } = useCart();

  // Lock background scroll + close on Escape while open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeCart]);

  return (
    <div
      className={cn("fixed inset-0 z-[70]", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!drawerOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-navy-900/40 transition-opacity duration-200",
          drawerOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={closeCart}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[88%] max-w-md flex-col bg-white transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-12 px-5">
          <h2 className="type-condensed text-sm text-navy-800">
            Your Cart {itemCount > 0 && `· ${itemCount}`}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="grid h-10 w-10 place-items-center text-navy-800"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <CartIcon className="h-10 w-10 text-ink-30" strokeWidth={1.25} />
            <p className="type-display mt-4 text-2xl text-navy-800">Your cart is empty</p>
            <Link href="/shop" onClick={closeCart} className={buttonVariants({ size: "lg", className: "mt-6" })}>
              Shop the lineup
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-ink-12 px-5 py-4">
              <FreeShipBar />
            </div>
            <ul className="flex-1 divide-y divide-ink-12 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-3 py-4">
                  <div className="relative h-16 w-16 shrink-0 border border-ink-12 bg-near-white">
                    {l.image?.src && (
                      <Image src={l.image.src} alt={l.title} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="type-condensed text-[13px] text-navy-800">{l.title}</p>
                    {l.hasChoices && <p className="type-mono text-[10px] text-ink-30">{l.variantLabel}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center border border-ink-12">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center text-navy-800 disabled:text-ink-30"
                          onClick={() => setQty(l.variantId, l.qty - 1)}
                          disabled={l.qty <= 1}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center type-mono text-[11px] text-navy-800">{l.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center text-navy-800"
                          onClick={() => setQty(l.variantId, l.qty + 1)}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="tabular-nums text-sm text-navy-800">{formatINR(l.lineTotal)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${l.title}`}
                    onClick={() => removeItem(l.variantId)}
                    className="self-start text-ink-30 transition-colors hover:text-navy-800"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink-12 px-5 py-5">
              <div className="flex items-center justify-between">
                <span className="type-condensed text-sm text-navy-800">Subtotal</span>
                <span className="font-condensed text-lg font-semibold tabular-nums text-navy-800">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/checkout/shipping"
                  onClick={closeCart}
                  className={buttonVariants({ size: "lg", full: true })}
                >
                  Checkout <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className={buttonVariants({ variant: "secondary", size: "lg", full: true })}
                >
                  View full cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

> Confirm the cart line image shape in `lib/cart/cart-context.tsx` (`CartItemInput.image?: ArtDescriptor`). Open `lib/types.ts` for `ArtDescriptor` and use its real image-URL field (the code above assumes `.src`). If the project wraps images via `components/ui/product-image.tsx`, prefer that component over a raw `next/image` to stay consistent — adjust accordingly.

- [ ] **Step 4: Mount the drawer once in the root layout**

In `app/layout.tsx`, import and render `<MiniCart />` inside `CartProvider`, next to `<ToastViewport />` (`:124`):

```tsx
import { MiniCart } from "@/components/cart/mini-cart";
```

```tsx
          <SiteFooter />
          <MiniCart />
          <ToastViewport />
```

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/cart/cart-context.tsx components/cart/mini-cart.tsx app/layout.tsx
git commit -m "feat(cart): slide-in mini-cart drawer + context drawer state"
```

---

## Task 7: Wire add-to-cart + header to open the drawer

**Files:**
- Modify: `components/shop/quick-add-button.tsx:26-60`
- Modify: `components/product/product-purchase.tsx:16,34-59`
- Modify: `components/shell/site-header.tsx:231-242`

**Interfaces:**
- Consumes: `openCart()` from `useCart()` (Task 6).

- [ ] **Step 1: Open the drawer from Quick Add (replace toast)**

In `components/shop/quick-add-button.tsx`, pull `openCart` from the cart and call it after `addItem`; remove the toast (drawer is the feedback):

```tsx
  const { addItem, openCart } = useCart();
```

In the `onClick`, replace the `toast({...})` call with `openCart();`:

```tsx
        addItem({ /* ...unchanged snapshot... */ });
        openCart();
```

Remove the now-unused `toast` import if nothing else uses it (let `lint` confirm).

- [ ] **Step 2: Open the drawer from the PDP add-to-cart**

In `components/product/product-purchase.tsx`, add `openCart` (`:16`):

```tsx
  const { addItem, openCart } = useCart();
```

In `add` (`:34-59`), replace the `toast({...})` block with `openCart();` after `addItem(...)`:

```tsx
    addItem({ /* ...unchanged... */ }, qty);
    openCart();
```

Remove the unused `toast` import if nothing else references it.

- [ ] **Step 3: Make the header cart icon open the drawer**

In `components/shell/site-header.tsx`, add `openCart` to the existing `useCart()` destructure (`:28`):

```tsx
  const { itemCount, ready, openCart } = useCart();
```

Replace the cart `<Link href="/cart" ...>` (`:231-242`) with a button that opens the drawer (keep the badge + label):

```tsx
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${ready ? itemCount : 0} items`}
              className="relative grid h-10 w-10 place-items-center text-navy-800 transition-colors hover:bg-navy-50"
            >
              <CartIcon className="h-5 w-5" />
              {ready && itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center bg-navy-800 px-1 type-mono text-[9px] leading-none text-white">
                  {itemCount}
                </span>
              )}
            </button>
```

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/shop/quick-add-button.tsx components/product/product-purchase.tsx components/shell/site-header.tsx
git commit -m "feat(cart): open mini-cart on add-to-cart and header cart icon"
```

---

## Task 8: Shared trust row + final a11y polish

**Files:**
- Create: `components/checkout/trust-row.tsx`
- Modify: `app/checkout/payment/page.tsx` (replace inline trust block)

**Interfaces:**
- Consumes: `LockIcon`, `ShieldIcon`, `TruckIcon`.
- Produces: `TrustRow` component (no props).

- [ ] **Step 1: Create the shared trust row**

Create `components/checkout/trust-row.tsx`:

```tsx
import { LockIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const SIGNALS = [
  { Icon: LockIcon, label: "Secure Checkout" },
  { Icon: ShieldIcon, label: "256-bit Encrypted" },
  { Icon: TruckIcon, label: "Easy Returns" },
];

const LOGOS = ["Razorpay", "UPI", "VISA", "Mastercard", "RuPay"];

/** Reusable trust signals + accepted-payment logos for cart/checkout. */
export function TrustRow({ live }: { live?: boolean }) {
  return (
    <div className="border border-ink-12 bg-warm-white p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {SIGNALS.map(({ Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
            <Icon className="h-4 w-4" /> {label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {LOGOS.map((logo) => (
          <span key={logo} className="border border-ink-12 bg-white px-2.5 py-1 type-mono text-[10px] text-ink-60">
            {logo}
          </span>
        ))}
      </div>
      <p className="mt-4 type-mono text-[10px] text-ink-30">
        {live ? "Payments are processed securely by Razorpay." : "Demo checkout — no real payment is processed."}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Use it on the payment page**

In `app/checkout/payment/page.tsx`, import `TrustRow` and replace the entire `{/* trust */}` block (the `div` with `mt-8 border border-ink-12 bg-warm-white p-5` and its contents) with:

```tsx
          {/* trust */}
          <div className="mt-8">
            <TrustRow live={!!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID} />
          </div>
```

Add the import:

```tsx
import { TrustRow } from "@/components/checkout/trust-row";
```

Remove now-unused `LockIcon`/`ShieldIcon` imports from the page if nothing else uses them (let `lint` confirm; `CheckIcon` is still used elsewhere).

- [ ] **Step 3: Full verification pass**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual smoke test (Razorpay test mode)**

With `pnpm dev`, verify the journey end to end:
1. Add a product from a card → mini-cart slides in with the line + free-ship bar.
2. Header cart icon re-opens the drawer; qty +/- and remove work; "Add ₹X for FREE shipping" updates as qty changes.
3. Drawer → Checkout → Shipping → Payment shows **two** choices (Pay Online / COD).
4. Pay Online → Razorpay modal shows the ASAI.One name/logo; **dismiss** it → inline "Payment didn't go through · Retry payment" appears, order preserved.
5. Complete a Razorpay **test** payment → lands on confirmation with the timeline; **refresh the page** → still shows the order (proves persistence via `?o&t`).
6. Place a COD order → confirmation shows "Payment · Cash on Delivery".

- [ ] **Step 5: Commit**

```bash
git add components/checkout/trust-row.tsx app/checkout/payment/page.tsx
git commit -m "feat(checkout): shared trust row across cart and payment"
```

---

## Post-implementation (config, not code)

Before go-live, the store owner must (outside this plan):
1. Create a Razorpay webhook in the dashboard subscribed to `payment.captured` and `payment.failed`, pointing at `…/api/webhooks/razorpay`.
2. Set `RAZORPAY_WEBHOOK_SECRET` in the environment to the webhook's secret (currently EMPTY — the webhook source-of-truth is offline until then).
3. Swap test keys (`rzp_test_…`) for live keys when launching.

## Self-Review (completed by plan author)

- **Spec coverage:** A1 payment de-dup → Task 4; A2 free-ship → Task 3; A3 retry → Task 4; B mini-cart → Tasks 6–7; C persistent confirmation + DB column → Tasks 1, 2, 5; trust/a11y → Task 8; DB workflow → Task 1. All spec sections mapped.
- **Placeholder scan:** No TBD/TODO; every code step shows real code. The few "confirm the exact type in `lib/types.ts`" notes are deliberate guards against guessing union literals, with explicit fallbacks — not deferred work.
- **Type consistency:** `accessToken` (result) ↔ `access_token` (DB/`orderRow`) used consistently; `PayChoice` (`"online" | "cod"`) defined in Task 4 and consumed there; `openCart`/`closeCart`/`drawerOpen` defined in Task 6 and consumed in Tasks 6–7; `getOrderForConfirmation({ number, token })` defined in Task 2 and called in Task 5.
