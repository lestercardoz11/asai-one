# Admin CMS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 9 admin pages systematic and CMS-grade — shared chrome (sidebar/header/cards), design-system form controls, and a strict full-/half-width field grid — without changing any server action, data model, or form wiring.

**Architecture:** Build a small set of presentational primitives under `components/admin/ui/`, add four admin nav icons, then refactor each admin page to compose them. Pages stay server components reading via the per-request Supabase client; `AdminSidebar` is the only new client component (needs `usePathname`). Every form keeps its exact `action`, `name`, `defaultValue`, and rupee↔paise handling.

**Tech Stack:** Next.js 16 (App Router, React 19, Turbopack), TypeScript, Tailwind CSS v4, existing `components/ui/field.tsx` + `components/ui/button.tsx` primitives.

## Global Constraints

- **No test framework in this repo.** Verify EVERY task with `npx tsc --noEmit` and `pnpm lint`; run `pnpm build` on every task that touches a page under `app/admin/**`. Do not write vitest/jest tests.
- **Presentational only.** Do NOT change `lib/admin/actions.ts`, the DB, or any form's `action`, `<input name>`, `<input type="hidden">`, `defaultValue`, or rupee↔paise conversion fields (`price_rupees`, `original_price_rupees`, `return_window_days`, `specs` newline format). Server-component data fetching (the Supabase `.select(...)` strings) stays byte-for-byte unchanged.
- **Design system:** zero border-radius (no new `rounded-*` except icon internals and the existing stepper circles); navy colour ramp + `ink-*` hairlines; `type-display`/`type-condensed`/`type-mono`/`font-condensed` utilities; `bg-near-white` page background (set by the layout `<main>`).
- **Reuse, don't rebuild:** form controls are the existing `Input`/`Select`/`Textarea`/`Field` from `components/ui/field.tsx`; buttons are `Button`/`buttonVariants` from `components/ui/button.tsx` (`variant="primary"` for primary actions, `"secondary"` for inline saves).
- **Field grid rule:** every form is a `FormGrid` of `AdminField`s; each field is `span="full"` (spans both columns, default) or `span="half"` (one column); mobile stacks all to full-width. Boolean flags render as one full-width checkbox row, not grid cells.
- **Admin container width:** each admin page's top-level wrapper is `mx-auto max-w-5xl` (widened from today's varied `max-w-*`). No standalone page-shell component.
- **Intentional grid exceptions** (do NOT "fix" into a grid): the single-input adders — "add option" and "add option value" on the product-edit page — stay as inline `[Input][Button]` rows.
- **Icon source:** add new icons to `components/icons.tsx` following its `IconProps`/`base` pattern; never invent imports from elsewhere.
- **Commit after every task** once its gate passes.

---

## File Structure

**Create:**
- `components/admin/ui/page-header.tsx` — `PageHeader`
- `components/admin/ui/card.tsx` — `Card`
- `components/admin/ui/form-grid.tsx` — `FormGrid`, `AdminField`
- `components/admin/ui/form-actions.tsx` — `FormActions`
- `components/admin/ui/kpi-card.tsx` — `KpiCard`
- `components/admin/ui/sidebar.tsx` — `AdminSidebar` (client)

**Modify:**
- `components/icons.tsx` — add `GridIcon`, `BoxIcon`, `ReceiptIcon`, `FileTextIcon`
- `app/admin/layout.tsx` — render `AdminSidebar`
- `app/admin/page.tsx` — dashboard
- `app/admin/products/page.tsx`, `app/admin/orders/page.tsx`, `app/admin/customers/page.tsx` — lists
- `app/admin/products/new/page.tsx` — create form
- `app/admin/products/[id]/page.tsx` — edit (Details, then Options/Variants/Images)
- `app/admin/orders/[id]/page.tsx` — order detail

---

## Task 1: Admin icons + presentational primitives

**Files:**
- Modify: `components/icons.tsx` (append four icons)
- Create: `components/admin/ui/page-header.tsx`, `card.tsx`, `form-grid.tsx`, `form-actions.tsx`, `kpi-card.tsx`

**Interfaces:**
- Produces (consumed by all later tasks):
  - `GridIcon, BoxIcon, ReceiptIcon, FileTextIcon` — `(props: SVGProps<SVGSVGElement>) => ReactElement`
  - `PageHeader({ title, description?, backHref?, backLabel?, actions? })`
  - `Card({ title?, description?, actions?, footer?, padded?, className?, children })`
  - `FormGrid({ className?, children })`
  - `AdminField({ label?, htmlFor?, hint?, error?, required?, span?: "full"|"half", className?, children })`
  - `FormActions({ sticky?, className?, children })`
  - `KpiCard({ label, value, sub?, alert? })`

- [ ] **Step 1: Add the four admin icons**

Append to `components/icons.tsx` (they reuse the file's existing `base` constant and `IconProps` type):

```tsx
/* ── Admin nav icons ────────────────────────────────────────────────────────── */
export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="0.5" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 20.5 7.5v9L12 21 3.5 16.5v-9L12 3Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3h14v18l-2.3-1.5L14.4 21 12 19.5 9.6 21 7.3 19.5 5 21V3Z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" opacity={0.7} />
    </svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9L13 3Z" />
      <path d="M13 3v6h6" />
      <path d="M8.5 13h7M8.5 16.5h5" opacity={0.7} />
    </svg>
  );
}
```

- [ ] **Step 2: Create `PageHeader`**

`components/admin/ui/page-header.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

/** Consistent admin page header: optional back link, display title, optional
 *  description, and a right-aligned actions slot. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink-12 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="type-condensed text-xs text-navy-500 transition-colors hover:text-navy-800"
          >
            ← {backLabel}
          </Link>
        )}
        <h1 className="type-display text-4xl text-navy-800">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Create `Card`**

`components/admin/ui/card.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bordered white admin panel with an optional header bar and footer. */
export function Card({
  title,
  description,
  actions,
  footer,
  padded = true,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("border border-ink-12 bg-white", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 border-b border-ink-12 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="type-condensed text-sm text-navy-800">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-60">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
      {footer && <div className="border-t border-ink-12 px-5 py-4">{footer}</div>}
    </section>
  );
}
```

- [ ] **Step 4: Create `FormGrid` + `AdminField`**

`components/admin/ui/form-grid.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";

/** The 2-column responsive admin form grid. Children are AdminFields. */
export function FormGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** A labelled form field inside FormGrid. `span="full"` spans both columns
 *  (default); `span="half"` occupies one. On mobile every field is full-width. */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  required,
  span = "full",
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  span?: "full" | "half";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field
      label={label}
      htmlFor={htmlFor}
      hint={hint}
      error={error}
      required={required}
      className={cn(span === "full" && "sm:col-span-2", className)}
    >
      {children}
    </Field>
  );
}
```

> Note: `Field` (from `components/ui/field.tsx`) already renders the label with `required`/`hint`/`error` and merges `className` into its root `div` via `cn`, so `sm:col-span-2` lands on the grid item correctly.

- [ ] **Step 5: Create `FormActions`**

`components/admin/ui/form-actions.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Right-aligned action row at the foot of a form. `sticky` pins it to the
 *  bottom of the viewport for long forms (bleeds to the enclosing Card's edges). */
export function FormActions({
  sticky,
  className,
  children,
}: {
  sticky?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-12 pt-5",
        sticky && "sticky bottom-0 -mx-5 -mb-5 bg-white px-5 pb-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Create `KpiCard`**

`components/admin/ui/kpi-card.tsx`:

```tsx
import { cn } from "@/lib/utils";

/** Dashboard metric tile. Sits in a hairline grid (parent supplies bg-ink-12 + gap-px). */
export function KpiCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <p className="type-mono text-[11px] uppercase tracking-wide text-ink-30">{label}</p>
      <p
        className={cn(
          "mt-2 font-condensed text-3xl font-semibold tabular-nums",
          alert ? "text-error" : "text-navy-800",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 type-mono text-[11px] text-ink-60">{sub}</p>}
    </div>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS. (Primitives aren't wired into pages yet — the type-check is the gate.)

- [ ] **Step 8: Commit**

```bash
git add components/icons.tsx components/admin/ui/
git commit -m "feat(admin): shared CMS primitives + nav icons"
```

---

## Task 2: AdminSidebar + layout

**Files:**
- Create: `components/admin/ui/sidebar.tsx`
- Modify: `app/admin/layout.tsx:35-58`

**Interfaces:**
- Consumes: `GridIcon, BoxIcon, ReceiptIcon, FileTextIcon, UserIcon` (icons), `LogoutButton`.
- Produces: `AdminSidebar()` (client component, no props).

- [ ] **Step 1: Create the sidebar**

`components/admin/ui/sidebar.tsx`:

```tsx
"use client";

import type { ReactElement, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  GridIcon,
  BoxIcon,
  ReceiptIcon,
  FileTextIcon,
  UserIcon,
} from "@/components/icons";

type Item = { href: string; label: string; Icon: (p: SVGProps<SVGSVGElement>) => ReactElement };

const GROUPS: { heading: string; items: Item[] }[] = [
  { heading: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: GridIcon }] },
  {
    heading: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", Icon: BoxIcon },
      { href: "/admin/content", label: "Content", Icon: FileTextIcon },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", Icon: ReceiptIcon },
      { href: "/admin/customers", label: "Customers", Icon: UserIcon },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <p className="type-mono text-[10px] text-navy-200">ASAI.One</p>
        <p className="type-condensed text-sm text-white">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-5 px-3 pb-4" aria-label="Admin">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <p className="px-2.5 pb-1.5 type-mono text-[9px] uppercase tracking-wider text-navy-300">
              {g.heading}
            </p>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {g.items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2.5 px-2.5 py-2 type-condensed text-xs transition-colors",
                      active
                        ? "bg-navy-800 text-white"
                        : "text-navy-200 hover:bg-navy-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 pb-5">
        <LogoutButton className="inline-flex items-center px-2.5 py-2 type-mono text-[10px] text-navy-200 transition-colors hover:text-white" />
      </div>
    </div>
  );
}
```

> `navy-200`/`navy-300`/`navy-800` are all defined in the `@theme` navy ramp (used today in `site-header.tsx` and the current admin layout). If `tsc`/build flags any class, it's a Tailwind content issue, not a token gap — the classes are static strings.

- [ ] **Step 2: Wire it into the layout**

In `app/admin/layout.tsx`: remove the inline `<div className="px-5 py-5">…`, `<nav>…`, and the logout `<div>` blocks (lines ~38-55) from inside the `<aside>`, replace with `<AdminSidebar />`, and add the import. The `<aside>` keeps its existing classes; auth gating above stays unchanged. Result:

```tsx
import { AdminSidebar } from "@/components/admin/ui/sidebar";
// ...keep existing imports (getUser, getIsAdmin, redirect, Link for the 403 block, metadata)...

// inside the authorised return:
  return (
    <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-ink-12 bg-navy-900 text-navy-100 lg:border-b-0 lg:border-r">
        <AdminSidebar />
      </aside>
      <main className="bg-near-white px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
```

> `LogoutButton` is now imported by the sidebar; remove the now-unused `LogoutButton` import from `layout.tsx` if `lint` flags it. Keep the `Link` import (still used by the 403 block).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ui/sidebar.tsx app/admin/layout.tsx
git commit -m "feat(admin): grouped icon sidebar with active state"
```

---

## Task 3: Dashboard

**Files:**
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `KpiCard`.

- [ ] **Step 1: Refactor the dashboard chrome**

In `app/admin/page.tsx`, keep ALL data fetching (`Promise.all`, RPCs, `lowStock` derivation) and the `RangeSelector`/`delta` helpers unchanged. Change only the presentation:

1. Add imports:

```tsx
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { KpiCard } from "@/components/admin/ui/kpi-card";
```

2. Wrap the page in the standard container and replace the bespoke header (the `flex flex-wrap items-end justify-between` block) with `PageHeader`, moving `RangeSelector` + the CSV `Link` into its `actions`:

```tsx
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Dashboard"
        description={`Last ${days} days`}
        actions={
          <>
            <RangeSelector current={days} />
            <Link
              href={`/admin/orders/export?range=${days}`}
              prefetch={false}
              className="border border-ink-12 bg-white px-3 py-1.5 type-condensed text-xs text-navy-500 transition-colors hover:text-navy-800"
            >
              Download CSV
            </Link>
          </>
        }
      />
      {/* ...rest... */}
```

3. Replace the inline `Kpi` usages with `KpiCard` (same props — `label`, `value`, `sub`, `alert`) and DELETE the local `Kpi` function. The KPI grid wrapper stays `grid grid-cols-2 gap-px border border-ink-12 bg-ink-12 lg:grid-cols-4`.

4. Wrap the Revenue chart, Top-products, and Low-stock sections in `Card`:
   - Revenue: `<Card title={\`Revenue · last ${chartDays} days\`}>` containing the bars `div`.
   - Top products: `<Card title={\`Top products · ${days} days\`}>` containing the list/empty state.
   - Low stock: `<Card title="Low stock" actions={<Link href="/admin/products" className="type-mono text-[10px] text-navy-500 hover:text-navy-800">Manage stock →</Link>} padded={false}>` containing the `<table>` (or the empty `<p className="px-5 py-8 …">`). Use `padded={false}` so the table sits flush.

> Remove the now-unused local `Kpi` component. Keep `RangeSelector`, `delta`, the `Kpis`/`LowStockRow` interfaces, and all RPC calls.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): dashboard on shared header/cards"
```

---

## Task 4: List pages (products, orders, customers)

**Files:**
- Modify: `app/admin/products/page.tsx`, `app/admin/orders/page.tsx`, `app/admin/customers/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `buttonVariants`.

- [ ] **Step 1: Products list**

In `app/admin/products/page.tsx` keep the query + row mapping unchanged. Add imports and refactor chrome:

```tsx
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { buttonVariants } from "@/components/ui/button";
```

Replace the outer `<div>` + bespoke header with:

```tsx
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Products"
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            + New product
          </Link>
        }
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          {/* the existing <table> … unchanged */}
        </div>
      </Card>
    </div>
  );
```

(Keep the `<table>`, all `<td>`/`<th>`, the delete `<form>`, and the `Edit →` link exactly as they are.)

- [ ] **Step 2: Orders list**

In `app/admin/orders/page.tsx` keep the query/filter logic. Add `PageHeader` + `Card` imports. Replace the `<h1>`+description with:

```tsx
      <PageHeader
        title="Orders"
        description="Open an order to see its details and move it through the fulfilment workflow."
      />
```

Keep the status-filter chip row exactly as-is (place it directly after `PageHeader`, with `className="mb-4 flex flex-wrap gap-1"`). Wrap the table in `<Card padded={false}><div className="overflow-x-auto">…</div></Card>`. Wrap the whole page in `<div className="mx-auto max-w-5xl">`.

- [ ] **Step 3: Customers list**

In `app/admin/customers/page.tsx` keep the profiles + admin-ids logic. Add `PageHeader` + `Card` imports. Replace `<h1>` with `<PageHeader title="Customers" description="Grant or revoke admin access. Admin status takes effect on the user's next sign-in." />`, wrap the table in `<Card padded={false}><div className="overflow-x-auto">…</div></Card>`, and wrap the page in `<div className="mx-auto max-w-5xl">`. Keep the `setAdminRole` `<form>` and hidden inputs unchanged.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/admin/products/page.tsx app/admin/orders/page.tsx app/admin/customers/page.tsx
git commit -m "feat(admin): list pages on shared header/cards"
```

---

## Task 5: Product create form

**Files:**
- Modify: `app/admin/products/new/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `FormGrid`, `AdminField`, `FormActions`, `Input`, `Select`, `Button`.

- [ ] **Step 1: Rebuild the create form on the grid**

Keep the `categories` query and `createProduct` import. Replace the whole component body's return with design-system controls (preserving every `name`, `required`, placeholder, and the Price hint):

```tsx
import { createProduct } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function AdminProductNew() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="New product" backHref="/admin/products" backLabel="Products" />
      <Card>
        <form action={createProduct}>
          <FormGrid>
            <AdminField label="Name" required span="full">
              <Input name="name" required />
            </AdminField>
            <AdminField label="Web address (slug)" required span="half">
              <Input name="slug" required placeholder="asai-product-name" />
            </AdminField>
            <AdminField label="Stock code (SKU)" required span="half">
              <Input name="sku" required />
            </AdminField>
            <AdminField label="Category" required span="half">
              <Select name="category_id" required defaultValue="">
                <option value="" disabled>
                  Select a category…
                </option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </AdminField>
            <AdminField
              label="Price (₹)"
              required
              span="half"
              hint="In rupees. You can add variants, stock and images after creating."
            >
              <Input name="price_rupees" type="number" min={0} step="0.01" placeholder="e.g. 299" required />
            </AdminField>
          </FormGrid>
          <FormActions>
            <Button type="submit">Create product</Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/new/page.tsx
git commit -m "feat(admin): product create form on the field grid"
```

---

## Task 6: Product edit — Details form

**Files:**
- Modify: `app/admin/products/[id]/page.tsx` (the header + the `Details` `<section>` only; leave Options/Variants/Images for Task 7)

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `FormGrid`, `AdminField`, `FormActions`, `Input`, `Textarea`, `Button`.
- Produces: the `Flag` helper stays in this file (reused by Task 7).

- [ ] **Step 1: Add imports + replace the header**

Add to the top of `app/admin/products/[id]/page.tsx`:

```tsx
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Input, Textarea } from "@/components/ui/field";
```

Replace the top `<div className="flex items-center justify-between">…</div>` + `<h1>` with the standard container + header (keep the SKU chip in `actions`):

```tsx
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={product.name}
        backHref="/admin/products"
        backLabel="Products"
        actions={<span className="type-mono text-[10px] text-ink-30">{product.sku}</span>}
      />
```

> Keep the `fieldCls`/`labelCls`/`sectionTitle` constants for now — Task 7 still uses them for the Options/Variants/Images sections until that task replaces them. Remove them only when no longer referenced.

- [ ] **Step 2: Rebuild the Details form on the grid (sticky actions)**

Replace the entire `{/* Details */}` `<section>` with a `Card` + `FormGrid`. Preserve every `name`, `defaultValue`, the `toRupees`/`specsText` usage, and the `Flag`/`Hint` helpers:

```tsx
      <section className="mt-2">
        <Card title="Details">
          <form action={updateProduct}>
            <input type="hidden" name="id" value={product.id} />
            <FormGrid>
              <AdminField label="Name" required span="half">
                <Input name="name" defaultValue={product.name} required />
              </AdminField>
              <AdminField
                label="Web address (slug)"
                required
                span="half"
                hint="Lowercase words-with-dashes — this appears in the product's link."
              >
                <Input name="slug" defaultValue={product.slug} required />
              </AdminField>
              <AdminField label="Short description" span="full">
                <Input name="short_description" defaultValue={product.short_description ?? ""} />
              </AdminField>
              <AdminField label="Description" span="full">
                <Textarea name="description" defaultValue={product.description ?? ""} rows={4} />
              </AdminField>
              <AdminField label="Price (₹)" required span="half" hint="Selling price in rupees, e.g. 299 or 299.50.">
                <Input name="price_rupees" type="number" min={0} step="0.01" defaultValue={product.price_paise / 100} required />
              </AdminField>
              <AdminField label="Original price (₹)" span="half" hint="Optional. Shown struck-through to display a discount.">
                <Input name="original_price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(product.original_price_paise)} />
              </AdminField>
              <AdminField label="Tags (comma-separated)" span="full">
                <Input name="tags" defaultValue={(product.tags ?? []).join(", ")} />
              </AdminField>
              <AdminField label="Features (one per line)" span="full">
                <Textarea name="features" defaultValue={(product.features ?? []).join("\n")} rows={4} />
              </AdminField>
              <AdminField label="Specifications" span="full" hint="One per line, written as “Label: Value”.">
                <Textarea name="specs" defaultValue={specsText} rows={6} placeholder={"Material: Cotton\nWeight: 90 g"} />
              </AdminField>
              <AdminField label="Compatibility" span="full">
                <Input name="compatibility" defaultValue={product.compatibility ?? ""} />
              </AdminField>
              <AdminField label="HSN code" span="half">
                <Input name="hsn_code" defaultValue={product.hsn_code ?? ""} />
              </AdminField>
              <AdminField label="Return window (days)" span="half">
                <Input name="return_window_days" type="number" min={0} defaultValue={product.return_window_days} />
              </AdminField>
              <AdminField label="Shipping policy" span="full">
                <Textarea name="shipping_policy" defaultValue={product.shipping_policy ?? ""} rows={2} />
              </AdminField>
              <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                <Flag name="is_active" label="Live" checked={product.is_active} />
                <Flag name="is_featured" label="Best seller" checked={product.is_featured} />
                <Flag name="is_new" label="New" checked={product.is_new} />
                <Flag name="is_returnable" label="Returnable" checked={product.is_returnable} />
              </div>
            </FormGrid>
            <FormActions sticky>
              <Button type="submit">Save details</Button>
            </FormActions>
          </form>
        </Card>
      </section>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS. (Options/Variants/Images sections still render with their old styling — that's expected; Task 7 handles them.)

- [ ] **Step 4: Commit**

```bash
git add app/admin/products/[id]/page.tsx
git commit -m "feat(admin): product Details form on the field grid"
```

---

## Task 7: Product edit — Options, Variants, Images

**Files:**
- Modify: `app/admin/products/[id]/page.tsx` (the Options/Variants/Images sections + helpers cleanup)

**Interfaces:**
- Consumes: `Card`, `FormGrid`, `AdminField`, `FormActions`, `Input`, `Select`, `Button`, the `Flag` helper.

- [ ] **Step 1: Options & values section**

Wrap the section in `Card title="Options & values"`. For each option, keep the delete forms and value chips. Convert the per-option "add value" and the "add option" forms to inline `[Input][Button]` rows (the intentional grid exceptions) using the design-system `Input`:

```tsx
      <section className="mt-8">
        <Card title="Options & values" padded={false}>
          <div className="flex flex-col divide-y divide-ink-12">
            {options.map((opt) => {
              const values = [...(opt.product_option_values ?? [])].sort((a, b) => a.position - b.position);
              return (
                <div key={opt.id} className="p-5">
                  {/* keep the existing option header (name + Remove option form) */}
                  {/* keep the existing value chips row */}
                  <form action={addOptionValue} className="mt-3 flex items-end gap-2">
                    <input type="hidden" name="option_id" value={opt.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <Input name="value" placeholder="Add value…" required className="h-10 w-56" />
                    <Button type="submit" size="sm" variant="secondary">Add value</Button>
                  </form>
                </div>
              );
            })}
            <form action={addOption} className="flex items-end gap-2 p-5">
              <input type="hidden" name="product_id" value={product.id} />
              <div className="flex flex-col gap-1.5">
                <label className="type-mono text-ink-60">New option (e.g. Pack size)</label>
                <Input name="name" required className="h-10 w-64" />
              </div>
              <Button type="submit" size="sm" variant="secondary">Add option</Button>
            </form>
          </div>
        </Card>
      </section>
```

- [ ] **Step 2: Variants section**

Wrap in `Card title="Variants" padded={false}` with a divided list. Each variant becomes its own padded block; convert the detail/option-assignment/inventory forms to `FormGrid` half fields. Keep every hidden input, `name`, `defaultValue`, and the default/delete controls. The variant detail form:

```tsx
                <form action={updateVariant} className="mt-4">
                  <input type="hidden" name="variant_id" value={v.id} />
                  <FormGrid>
                    <AdminField label="SKU" required span="half">
                      <Input name="sku" defaultValue={v.sku} required />
                    </AdminField>
                    <AdminField label="Name" span="half">
                      <Input name="variant_name" defaultValue={v.variant_name ?? ""} />
                    </AdminField>
                    <AdminField label="Price (₹)" span="half">
                      <Input name="price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(v.price_paise)} placeholder="Same as product" />
                    </AdminField>
                    <AdminField label="Original price (₹)" span="half">
                      <Input name="original_price_rupees" type="number" min={0} step="0.01" defaultValue={toRupees(v.original_price_paise)} />
                    </AdminField>
                    <AdminField label="Weight (g)" span="half">
                      <Input name="weight_grams" type="number" min={0} defaultValue={v.weight_grams ?? ""} />
                    </AdminField>
                    <AdminField label="Position" span="half">
                      <Input name="position" type="number" min={0} defaultValue={v.position} />
                    </AdminField>
                    <div className="sm:col-span-2">
                      <Flag name="is_active" label="Active" checked={v.is_active} />
                    </div>
                  </FormGrid>
                  <FormActions>
                    <Button type="submit" size="sm" variant="secondary">Save</Button>
                  </FormActions>
                </form>
```

For the option-value assignment form (when `options.length > 0`), render each option as a half `AdminField` with a `Select` (keep `name="option_value_id"`, the `defaultValue={selected}`, and the `<option value="">—</option>` plus mapped values), inside a `FormGrid`, with a `FormActions` "Save options". For the inventory form, a single half `AdminField` "Stock" (`Input name="quantity"`) plus the `formatINR` note and a `FormActions` "Save stock". For the create-variant form (the dashed box), a `FormGrid` with SKU (half, required), Name (half), Price (half, "Same as product" placeholder) and a `FormActions` "Add variant"; keep `border border-dashed` on its wrapper.

- [ ] **Step 3: Images section**

Wrap in `Card title="Images"`. Keep the image thumbnails + delete forms. Convert the upload form to a `FormGrid`: File (full, `Input type="file"`), Alt text (half), Position (half), the Primary `Flag` in a full-width row, and a `FormActions` "Upload". Keep `name="file"`/`name="alt"`/`name="position"`/`name="is_primary"` and the hidden `product_id`.

```tsx
        <form action={uploadProductImage} className="mt-4">
          <input type="hidden" name="product_id" value={product.id} />
          <FormGrid>
            <AdminField label="File" required span="full">
              <input name="file" type="file" accept="image/*" required className="block w-full text-sm" />
            </AdminField>
            <AdminField label="Alt text" span="half">
              <Input name="alt" />
            </AdminField>
            <AdminField label="Position" span="half">
              <Input name="position" type="number" min={0} defaultValue={0} />
            </AdminField>
            <div className="sm:col-span-2">
              <Flag name="is_primary" label="Primary" checked={false} />
            </div>
          </FormGrid>
          <FormActions>
            <Button type="submit">Upload</Button>
          </FormActions>
        </form>
```

> The file input stays a raw `<input type="file">` (the design system has no file control) but is wrapped in `AdminField` for a consistent label.

- [ ] **Step 4: Cleanup**

Remove the now-unused `fieldCls`/`labelCls`/`sectionTitle` constants. Keep `Flag` and `Hint` (still used). Run `pnpm lint` to catch any leftover unused symbol.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/admin/products/[id]/page.tsx
git commit -m "feat(admin): product options/variants/images on the field grid"
```

---

## Task 8: Order detail

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Card`, `FormGrid`, `AdminField`, `FormActions`, `Select`, `Textarea`, `Button`.

- [ ] **Step 1: Imports + header**

Add imports:

```tsx
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card } from "@/components/admin/ui/card";
import { FormGrid, AdminField } from "@/components/admin/ui/form-grid";
import { FormActions } from "@/components/admin/ui/form-actions";
import { Select, Textarea } from "@/components/ui/field";
```

Replace the top back-link/badge `<div>` + `<h1>` + placed-at `<p>` with the container + `PageHeader` (StatusBadge in `actions`); keep the terminal-status banner directly under it:

```tsx
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={order.order_number}
        description={`Placed ${dt(order.placed_at)}`}
        backHref="/admin/orders"
        backLabel="Orders"
        actions={<StatusBadge status={order.status} />}
      />
```

- [ ] **Step 2: Wrap content blocks in Cards; keep the stepper**

Keep the fulfilment stepper `<ol>` and its logic exactly (it's not a form). Wrap the Items table in `<Card title="Items" padded={false}><div className="overflow-x-auto">…</div></Card>`; keep the totals block and History as-is (History can be wrapped in a plain `<Card title="History">`). Leave the `Row` helper untouched.

- [ ] **Step 3: Right-rail forms on the grid**

Convert the right-column cards to `Card` + grid fields, preserving every hidden input, `name`, `value`, and `action`:

- "Move forward" → `<Card title="Move forward">` with the `updateOrderStatus` form: the note becomes a full `AdminField` (`<Textarea name="note" rows={2} placeholder="Add a note (optional)…" />`) + `FormActions` with the primary `Button` (`{next.label}`). Keep the `next`/`terminal` conditional and the Cancel/Refund inline danger forms exactly (place them in the card `footer` or below the form as today).
- "Set status" → `<Card title="Set status">` with the `updateOrderStatus` form: a full `AdminField` wrapping `<Select name="status" defaultValue={order.status}>` (keep the mapped `ALL_STATUSES` options), a full `AdminField` note `<Textarea name="note" rows={2} />`, and `FormActions` with `<Button type="submit" variant="secondary">Update status</Button>`.
- "Customer" → `<Card title="Customer">` containing the existing name/email/phone + shipping address markup (no form).
- "Payment" → `<Card title="Payment">` containing the existing payment details (no form). Replace the inline `labelCls` spans with plain `type-mono text-[10px] text-ink-30` or keep as-is.

> Remove the file-local `fieldCls`/`labelCls`/`sectionTitle` constants once the sections above no longer reference them (the section `<h2>`s are replaced by `Card title`). Keep `dt`, `Row`, `FLOW`, `STEP_LABEL`, `NEXT`, `ALL_STATUSES`, and all status logic.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 5: Manual spot-check (admin login, `pnpm dev`)**

Walk every admin page: sidebar active state tracks the route; each list renders inside a card; create a product, edit its Details (sticky Save bar), add an option + value, add/save a variant, set stock, upload an image; open an order and advance its status + set status; edit a content page; toggle an admin on Customers. Confirm each form still submits and persists (no `name`/action regressions).

- [ ] **Step 6: Commit**

```bash
git add app/admin/orders/[id]/page.tsx
git commit -m "feat(admin): order detail on shared header/cards/grid"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** primitives → Task 1; sidebar/layout → Task 2; dashboard → Task 3; lists → Task 4; product new → Task 5; product Details → Task 6; options/variants/images → Task 7; order detail → Task 8; icons → Task 1; full/half grid rule → Tasks 5–8; `max-w-5xl` container → every page task; sticky actions (Details only) → Task 6; grid exceptions (add option/value) → Task 7. All spec sections mapped.
- **Placeholder scan:** no TBD/TODO; every primitive has complete code; page tasks show the transformed JSX for all forms and name the data/helpers to preserve verbatim. The "keep the existing X markup" instructions reference concrete, already-existing blocks (not deferred work).
- **Type consistency:** `AdminField span: "full"|"half"` defined in Task 1, used Tasks 5–8; `Card`/`PageHeader`/`FormActions`/`KpiCard` prop names consistent across tasks; icon names `GridIcon/BoxIcon/ReceiptIcon/FileTextIcon` defined in Task 1, consumed in Task 2; `Input/Select/Textarea` imported from `@/components/ui/field` everywhere.
- **Constraint guard:** every page task explicitly preserves server actions, `name`/hidden inputs, `defaultValue`, and rupee↔paise fields, satisfying the "presentational only" Global Constraint.
