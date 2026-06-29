# Admin CMS Redesign — Design Spec

**Date:** 2026-06-28
**Status:** Approved (pending written-spec review)
**Scope:** All 9 pages of `app/admin/**` + the admin layout/sidebar
**Goal:** A systematic, CMS-grade admin a non-technical operator can use confidently — consistent chrome, design-system form fields, and a strict full-/half-width field grid across every form.

## Context

The admin section works but is visually inconsistent and not "CMS-grade":
- **Form controls bypass the design system.** Every page uses raw `<input className="mt-1 w-full border border-ink-12 px-3 py-2 text-sm">` (and ad-hoc `<select>`/`<textarea>`), not the `Field`/`Input`/`Select`/`Textarea`/`LabeledInput` primitives in `components/ui/field.tsx`. Result: cramped controls (`py-2` vs the system's `h-12`), inconsistent focus/error/disabled states, and tiny low-contrast `type-mono text-[10px]` labels.
- **No systematic field widths.** The product-edit variant/option/image mini-forms use `flex flex-wrap items-end gap-3` with fixed pixel widths (`w-36 w-40 w-32 w-24 w-20 w-48 w-56`). This is the specific "fields should be full-container or half-container" problem.
- **No shared chrome.** Each page reinvents its header (`type-display text-4xl` + bespoke back link), container width (`max-w-xl` / `max-w-3xl` / `max-w-4xl` / none), section titles, and the white card box. Per-page `fieldCls`/`labelCls`/`sectionTitle` string constants are duplicated.
- **Bare sidebar.** `app/admin/layout.tsx` renders a flat text nav with no active state and no grouping.

The fix is a small set of reusable admin primitives applied uniformly across all pages. **No server actions, data model, or form `name` attributes change** — this is a presentational refactor.

### Design decisions (locked with the user)
- **Visual level:** richer CMS dashboard — sidebar icons, grouped nav with headings, elevated KPI/data cards, stronger primary actions, a sticky action bar on the long form.
- **Field layout:** responsive 2-column grid; every field is **full** (spans both columns) or **half** (one column); stacks to full-width on mobile.
- **Variant/option/image mini-forms:** same full/half grid as everything else.

## Goals / Non-goals

**Goals**
- One consistent page scaffold (header + cards) across all admin pages.
- Every form field rendered through the design system, on a strict full/half grid.
- Legible labels, clear primary actions, an icon'd grouped sidebar with active state.

**Non-goals (YAGNI — explicitly excluded)**
- No changes to server actions (`lib/admin/actions.ts`), the DB, or any form field `name`/`value` wiring.
- No new admin features: search, pagination, sorting, bulk actions, filters beyond what exists.
- No dark mode, no responsive table redesign beyond the existing `overflow-x-auto`.
- No change to the dashboard's data RPCs or the CSV export.

## Architecture & new components

All new primitives live under `components/admin/ui/` (one component per file, each a focused unit). The admin sidebar becomes a client component for active-state; pages stay server components (they fetch via the per-request Supabase client) and compose the primitives.

| File | Type | Responsibility |
|---|---|---|
| `components/icons.tsx` (modify) | — | Add `GridIcon`, `BoxIcon`, `ReceiptIcon`, `FileTextIcon` (follow the existing `IconProps` pattern). Customers reuses the existing `UserIcon`. |
| `components/admin/ui/sidebar.tsx` | client | `AdminSidebar` — grouped, icon'd nav with active highlight via `usePathname`; brand block; logout slot. |
| `components/admin/ui/page-header.tsx` | server | `PageHeader({ title, description?, backHref?, backLabel?, actions? })`. |
| `components/admin/ui/card.tsx` | server | `Card({ title?, description?, actions?, footer?, padded?, className, children })` — bordered white panel with optional header bar + footer. |
| `components/admin/ui/form-grid.tsx` | server | `FormGrid` (the 2-col responsive grid) + `AdminField({ label, htmlFor?, hint?, error?, required?, span?, children })` (span `"full"`→`sm:col-span-2`, `"half"`→single cell; default `"full"`). |
| `components/admin/ui/form-actions.tsx` | server | `FormActions({ sticky?, children })` — top-hairline, right-aligned action row; `sticky` adds `sticky bottom-0 bg-white` for the long form. |
| `components/admin/ui/kpi-card.tsx` | server | `KpiCard({ label, value, sub?, alert? })` — legible metric card. |

(No standalone page-shell/`AdminPage` component — each page sets its own `mx-auto max-w-5xl` container directly; see Decisions.)

**Reuse, do not rebuild:** `AdminField` composes the existing `Field` from `components/ui/field.tsx` (it already renders the label with `required`/`hint`/`error`); the controls are the existing `Input`/`Select`/`Textarea`. The shared `StatusBadge` (`components/admin/order-status.tsx`) stays as-is. `buttonVariants`/`Button` from `components/ui/button.tsx` provide the "stronger primary" actions (`variant="primary"`).

### Component contracts

```tsx
// page-header.tsx
function PageHeader(props: {
  title: string;
  description?: string;
  backHref?: string;       // renders "← {backLabel ?? 'Back'}"
  backLabel?: string;
  actions?: React.ReactNode; // right-aligned slot (buttons, range selector, status badge)
}): JSX.Element

// card.tsx
function Card(props: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;   // right side of the header bar
  footer?: React.ReactNode;
  padded?: boolean;            // default true; false for flush tables
  className?: string;
  children: React.ReactNode;
}): JSX.Element

// form-grid.tsx
function FormGrid(props: { className?: string; children: React.ReactNode }): JSX.Element
function AdminField(props: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  span?: "full" | "half";   // default "full"
  className?: string;
  children: React.ReactNode; // an <Input/Select/Textarea/> or custom control
}): JSX.Element

// form-actions.tsx
function FormActions(props: { sticky?: boolean; className?: string; children: React.ReactNode }): JSX.Element

// kpi-card.tsx
function KpiCard(props: { label: string; value: string; sub?: string; alert?: boolean }): JSX.Element
```

### Visual tokens (stay on-brand)
- Zero border-radius throughout (no `rounded-*` except the existing stepper circles).
- Panels: `border border-ink-12 bg-white`; card header bars: `border-b border-ink-12 px-5 py-4`.
- Labels: the design-system `Field` label style (`type-mono text-ink-60`) — bigger/clearer than today's `text-[10px] text-ink-30`.
- Inputs: `Input`/`Select`/`Textarea` (`h-12`, `focus:border-navy-500`, `aria-[invalid] → border-error`).
- Primary actions: `Button variant="primary"` (navy); secondary edits: `variant="secondary"`.
- Page background stays `bg-near-white` (set by the layout `<main>`).

## Sidebar specification

`AdminSidebar` (client) renders inside the existing `app/admin/layout.tsx` aside (the layout keeps the server-side auth gate). Groups, each with a `type-mono` uppercase heading:
- **Overview** — Dashboard (`GridIcon`, `/admin`)
- **Catalogue** — Products (`BoxIcon`, `/admin/products`), Content (`FileTextIcon`, `/admin/content`)
- **Sales** — Orders (`ReceiptIcon`, `/admin/orders`), Customers (`UserIcon`, `/admin/customers`)

Active state via `usePathname`: an item is active when the path equals its href, or (for non-root hrefs) starts with `href + "/"`; `/admin` (Dashboard) matches only exactly. Active item: `bg-navy-800 text-white`; inactive: `text-navy-200 hover:bg-navy-800 hover:text-white`; each row shows its icon + label. Brand block (`ASAI.One / Admin`) and `LogoutButton` retained. On mobile the aside stays the top strip it is today (`flex-wrap`), nav wraps.

## Form layout rules (the core requirement)

Every form is `FormGrid` containing `AdminField`s:
- A field is **half** (`span="half"`, one column) when it is short and naturally pairs (SKU, slug, price, original price, HSN, return-window, weight, position, category).
- A field is **full** (`span="full"`, both columns) when it is long-form or stands alone (name, descriptions, tags, features, specs, shipping policy, page body, status select that owns a row).
- On mobile (`grid-cols-1`) every field is full-width regardless of `span`.
- Boolean flags (`is_active`, `is_featured`, …) render as a single full-width row of checkboxes (a `Flag` cluster), not grid cells.
- Each form ends with `FormActions` holding its primary `Button`.

### Page-by-page field map

**Product new** (`/admin/products/new`): Name (full) · Slug (half) · SKU (half) · Category (half) · Price ₹ (half) → `FormActions` "Create product". Keep the "add variants/stock/images after creating" hint on Price.

**Product edit — Details** (`/admin/products/[id]`): Name (half) · Slug (half) · Short description (full) · Description (full, textarea) · Price ₹ (half) · Original price ₹ (half) · Tags (full) · Features (full, textarea) · Specifications (full, textarea, "Label: Value" per line) · Compatibility (full) · HSN code (half) · Return window days (half) · Shipping policy (full, textarea) · flags row (Live / Best seller / New / Returnable) → **sticky** `FormActions` "Save details". Preserve every existing `name`, `defaultValue`, and rupee↔paise conversion (`price_rupees`, `original_price_rupees`, `return_window_days`, `specs` newline format).

**Product edit — Options & values / Variants / Images**: each section is a `Card`. The per-option "add value", per-variant detail (SKU/name/price/original/weight/position + Active flag), option-value assignment selects, inventory (stock), create-variant, and image upload (file/alt/position/primary) forms all become `FormGrid` half/half fields with a `FormActions` (or inline submit for one-field adders). Keep every `name`/hidden-input/`action` exactly as today.

**Order detail — right rail** (`/admin/orders/[id]`): "Move forward" note (full textarea) + primary action; "Set status" status `<Select>` (full) + note (full textarea) + secondary action. Cancel/refund stay as the existing inline danger buttons. Left column items/totals/history wrapped in `Card`s; fulfilment stepper restyled (keep its logic).

**Lists** (`products`, `orders`, `customers`) and **Dashboard**: `PageHeader` + `Card`-wrapped tables; dashboard KPIs via `KpiCard`; the range selector and "Download CSV" move into the `PageHeader` `actions` slot; "New product" becomes a primary `Button`-styled `Link` in the products `PageHeader` actions. Filter chips on Orders keep their behavior.

## Data flow

Unchanged. Pages are server components that read via `createClient()` (per-request, RLS) exactly as today and submit to the same server actions in `lib/admin/actions.ts`. The primitives are presentational; `AdminSidebar` is the only new client component (needs `usePathname`).

## Error handling

No behavioral change. Form validation/error display remains server-action-driven as today (these forms don't render field-level errors client-side). `AdminField` exposes `error`/`hint` props for future use and to render hints already present (slug/price/specs hints).

## Testing & verification

No test framework in this repo. Per task and at the end:
- `npx tsc --noEmit`
- `pnpm lint`
- `pnpm build` (also statically validates the admin routes compile against live Supabase)
Manual spot-check (admin login): each page renders, every form still submits and persists (create a product, edit details, add a variant, change an order status, edit a content page, toggle an admin) — confirming no `name`/action regressions.

## Decisions / open ambiguities (resolved)
- **`AdminField` half vs full default:** default `"full"` (safest — a field only narrows when explicitly paired).
- **`page-shell.tsx`:** fold the container width into each page's top-level `<div className="mx-auto max-w-5xl">` rather than a separate wrapper component, to avoid an over-thin abstraction; admin content widens from today's `max-w-3xl` to `max-w-5xl` to suit the 2-col grid. (No standalone `AdminPage` component.)
- **Sticky action bar:** only the product-edit Details form (the one long enough to benefit); all other forms use a non-sticky `FormActions`.
- **Mini-form adders** with a single input (add option value, add option) keep an inline `[input][button]` row using `Input` + `Button` rather than a full grid — a one-field grid would be visually odd. These are the only intentional exceptions to the grid and are noted so review doesn't flag them.
