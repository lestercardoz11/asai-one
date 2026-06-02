# ASAI.One

**Mode-based commuter essentials** — an ecommerce storefront where you shop by *how you commute*. Built design-first: a fully clickable, responsive storefront on **mock data** for client look-and-feel sign-off, before any backend is wired.

This repository currently delivers **Phases 0–2** of the [Phased Build Plan](./build-plan.md). See [`docs/PHASE-0-2-DELIVERY.md`](./docs/PHASE-0-2-DELIVERY.md) for what was built, the decisions taken, and the Phase 3 handoff.

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack, React 19)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 + design tokens (`app/globals.css`)
- **Components** — a bespoke, dependency-free component library (primitives + storefront) hand-built in the MOTO aesthetic
- **Aesthetic** — MOTO "Minimal Street": Navy × White / Off-White, type-led, sharp-edged
- **Fonts** — Bebas Neue (display) · Barlow Condensed (nav/buttons) · Barlow (body) · DM Mono (labels)
- **Data** — backend-agnostic mock adapter (`lib/data`); Supabase planned for Phase 3

## Getting started

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The storefront is the home experience; the repurposed admin preview lives at `/admin`.

## Key conventions

- **Money is integer paise** everywhere; format only at display via `formatINR()`.
- **Variants are first-class** — the attribute-based model handles simple toggles
  (pack / tier) and the two-axis DryLock case (weight × pack) from one shape.
- **Data goes through `lib/data`** — components never read mock data directly, so
  Phase 3 is a data-source swap, not a redesign.
