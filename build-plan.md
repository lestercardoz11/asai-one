# ASAI.One — Phased Build Plan & Architecture Brief

**Prepared for:** Software Architect / Engineering Lead
**Prepared by:** Product Owner
**Source documents:** ASAI.One BRD (Wireframe Specification), client email thread (26–27 May 2026), reference site analysis (Bellroy, Patagonia, Daily Objects, Ripcurl)
**Version:** 1.0

---

## 0. How to read this document

This is a **delivery plan**, not a final design spec. It is sequenced around one hard constraint set by the client:

> **We must get sign-off on the look & feel from the client *before* we build any backend functionality.**

Everything below is organised so that the front end — a fully clickable, responsive, photographic prototype running on **mock data** — is delivered and reviewed *first*. Backend, payments, auth, admin, and lifecycle messaging only begin after the client has signed off on the visual experience. Phase 2 is the gate; nothing in Phases 3+ should start until it closes.

Sections 1–7 give the architect the shared context (scope, stack, design system, IA). Section 8 is the phased plan. Sections 9–13 are the supporting detail (page specs, data model, NFRs, open decisions).

---

## 1. Product context

**Brand:** ASAI.One — a *mode-based commuter essentials* ecommerce brand. The organising idea of the whole site is that a customer shops **by how they commute**, not by browsing a flat catalogue.

**Logo:** Navy / steel-blue 8-point compass-rose (nautical star) mark, supplied as transparent PNG, paired with the wordmark "ASAI.One". The compass motif (direction / journey / commute) should inform the visual language.

**Commute modes (4 total):**

| Mode | Status at launch |
| --- | --- |
| 2-Wheeler | **Live** — full catalogue |
| 4-Wheeler | "Coming Soon" — card visible, products hidden |
| Pedestrian | "Coming Soon" — card visible, products hidden |
| Public Transport | "Coming Soon" — card visible, products hidden |

**2-Wheeler product lineup (current, per 27 May email — supersedes the BRD list):**

| Product | Variants |
| --- | --- |
| ASAI Absrb | Pack of 6 · Pack of 12 |
| ASAI ChildLock | (single SKU) |
| ASAI DryLock Pods | Single 75g · Pack of 3 (75g) · Single 150g · Pack of 3 (150g) · Single 300g · Pack of 3 (300g) |
| ASAI PureRide | Basic · Advance |
| ASAI Shield | Basic · Advance |

> **Architectural note:** four of the five products are sold as **variants** (pack size, weight, tier). Variants must be a first-class concept in the data model and the PDP/cart UI from day one — even in the mock-data phase — so the front end the client signs off on is the one we can actually back with real data later. Do not build single-SKU product cards and retrofit variants afterward.

**User types:** `user` (shoppers) and `admin` (≈5 internal users). Admins get a separate panel covering user management, analytics, returns, marketing, and CMS.

**Primary goal:** A clean, modern, mobile-first ecommerce experience that helps people discover products based on how they commute and buy them directly on the site.

---

## 2. Guiding principles (design-first delivery)

1. **Look & feel before logic.** The first shippable artifact is a clickable, responsive, content-complete front end on mock data — deployed to a preview URL the client can open on their own phone. No database, no payments, no auth required to review it.
2. **Mock data mirrors the real schema.** The mock data layer uses the same TypeScript types and shapes the real Supabase models will use. When the client signs off, we swap the data *source*, not the components.
3. **Mobile-first, premium, minimal — "Minimal Street" (MOTO schema).** Confirmed aesthetic direction: **Navy × White / Off-White**, type-led, sharp-edged, 1px hairline structure, generous measured whitespace. Type does the hierarchy (Bebas Neue display, Barlow Condensed organising, Barlow body, DM Mono labels); navy is deployed with restraint to ground structure and signal action. Inspired by motorsport timing boards, urban wayfinding, and technical documentation. Avoid clutter, decorative shadows, rounded chrome, and "excessive animations" (explicit BRD instruction).
4. **Build once, theme via tokens.** All colour, type, spacing, and radius decisions live in design tokens so the unconfirmed palette (see §6, §12) can be changed globally without touching components.
5. **Accessibility and performance are not a later phase.** Semantic HTML, large touch targets, responsive images, and Core Web Vitals are baked into the component library, not bolted on at launch.

---

## 3. Scope

**In scope (v1 launch):**
- Public storefront: Home, About, Shop, Category pages, Product Detail, Cart, Checkout (3 steps), Order Confirmation, Contact, and 4 policy pages (Terms, Privacy, Shipping, Refund).
- Auth: register / login via **email OR phone**.
- Payments via **Razorpay** (UPI, Debit/Credit card, Net Banking, COD).
- Transactional + lifecycle email via **Resend**; abandoned-cart **WhatsApp** for phone-identified users.
- Admin panel: user management, analytics, returns, marketing, CMS.

**Coming-soon (built, hidden/teased):** 4-Wheeler, Pedestrian, Public Transport modes — cards render with a "Coming Soon" treatment; their category pages and products are not exposed.

**Out of scope (v1):** Order tracking is marked *optional* in the BRD — treat as a stretch goal, not a launch blocker. Shopify migration is a *future scaling* consideration only; build on the stated stack (Next.js + Supabase) but keep the catalogue/checkout boundaries clean so a future port is feasible.

---

## 4. Tech stack & high-level architecture

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | **Next.js** (App Router) | SSR/SSG for SEO + fast first paint; React Server Components where sensible |
| Styling | Tailwind CSS + design tokens & Shadcn ui first design for admin pages | Token-driven theming (§2.4) |
| Database / Auth / Storage | **Supabase** (Postgres, Auth, Storage) | Email + phone (OTP) auth; product images in Storage |
| Payments | **Razorpay** | UPI, cards, net banking, COD; server-side order creation + webhook verification |
| Email | **Resend** | Transactional (order confirmation) + marketing + abandoned-cart |
| Messaging | WhatsApp Business API (provider TBD — see §12) | Abandoned-cart reminders for phone-identified users |
| Hosting | Vercel (recommended) | Preview deployments per branch = ideal for the client review gate |

**Architecture shape:** Next.js front end → Supabase (data/auth) and Razorpay (payments) via server routes/actions. Webhooks (Razorpay payment status, future WhatsApp delivery receipts) handled in dedicated API routes with signature verification. Admin panel is a protected route group within the same Next.js app, gated by Supabase role (`admin`). Lifecycle jobs (abandoned-cart detection, reminder dispatch) run as scheduled functions.

A **mock data adapter** sits behind the same interface the Supabase data layer will implement, so Phase 2 components consume `getProducts()` / `getProduct(slug)` etc. without knowing the source.

---

## 5. Information architecture / sitemap

```
/                         Home
/about                    About Us
/shop                     Shop (all live products, filters, sort)
/commute/2-wheeler        Category landing (live)
/commute/4-wheeler        Coming Soon teaser
/commute/pedestrian       Coming Soon teaser
/commute/public-transport Coming Soon teaser
/product/[slug]           Product Detail (with variant selection)
/cart                     Cart
/checkout/shipping        Checkout step 1
/checkout/payment         Checkout step 2
/checkout/confirmation    Checkout step 3 (Order Confirmed)
/account                  Customer account (orders, details) [auth]
/login  /register         Auth (email or phone)
/contact                  Contact
/terms  /privacy  /shipping-policy  /refund-policy   Policy pages

/admin/*                  Admin panel [role: admin]
  /admin/users  /admin/analytics  /admin/returns  /admin/marketing  /admin/cms
```

---

## 6. Design system (foundations)

This is the spec the component library (Phase 1) is built against. The aesthetic is **confirmed to the "MOTO" Minimal Street schema — Navy × White / Off-White** (resolves §12 items 1 & 2). All values are token-driven so navy can be retuned globally without touching components.

**Colour (token-driven, CSS variables):**
- **Navy ramp** (primary colour family): `--navy-900 #060E1A` · `800 #0B1624` · `700 #122035` · `600 #1A3357` · `500 #1E4080` · `400 #2756AA` · `300 #4A7BC8` · `200 #8AAED9` · `100 #C2D6EE` · `50 #EAF1F8`. Navy 800 = headlines, primary CTAs, dark nav, price; Navy 500 = secondary/active/badges; Navy 50 = tag/hover surfaces.
- **Neutrals:** `--near-white #F8F7F4` (page ground) · `--warm-white #F2EFE8` (alt rows / image grounds) · `--white #FFFFFF` (cards, inputs, nav) · grey 100–400 · `--ink #0A0A0A` (+ ink-60/30/12 for text & hairlines).
- **Borders:** all `1px solid rgba(10,10,10,0.12)` — no thick decorative borders.
- Functional: navy for success/info states (in-palette); a single error red for form validation only.

**Typography (type does the work):**
- **Bebas Neue** — display / hero / section titles (uppercase, 0.02–0.04em tracking).
- **Barlow Condensed** — card headings, nav, buttons (600, uppercase, 0.14em).
- **Barlow** — body copy (300, 15px, 1.6 line-height).
- **DM Mono** — labels, meta, SKUs, eyebrows (uppercase, 0.16em).

**Spacing & layout:** Measured whitespace on an 8-pt-ish scale (4/8/12/16/24/32/48/96). 12-column grid, 24px gutters, 40px page margin, max-width 1280px. **Sharp edges throughout — no border-radius** (only true dots/avatars are circular). **No decorative shadows** — structure comes from hairline borders; card hover = `translateY(-2px)` only.

**Core components (the Phase 1 library):** Button (primary/secondary/ghost/sale), Input/Select/Textarea (sharp, hairline), Nav bar (light + dark variants, desktop + mobile drawer) + top utility bar, Footer (navy), Product Card, Mode/Category Card, Carousel, Filter sidebar + Sort dropdown, Quantity selector, Variant selector, Cart line item, Order summary panel, Stepper (checkout), Toast/Notification, Badge/Tag (mono — "New", "Sale", "Coming Soon", "Returnable/Non-returnable"), Rating/Review display, Form field with validation, Sticky mobile CTA bar.

**Motion (§07):** micro-interactions 120ms ease-out; page transitions 220ms; card hover translateY(-2px), no shadow; scroll reveal opacity 0→1 with 60ms stagger; CTA active scale(0.97). **No bounce, no spring** — this is a tool, not a toy.

---

## 7. Cross-cutting requirements (apply to every phase)

- **Mobile-first & responsive:** large touch targets, sticky CTAs where useful, responsive image scaling, smooth scrolling, minimal clutter.
- **Performance & SEO:** SSR/SSG, optimised images, fast page speed, metadata per page, semantic markup. Avoid excessive animation.
- **Accessibility:** semantic HTML, keyboard navigation, sufficient contrast, focus states, alt text.
- **Trust:** secure-checkout cues, encrypted-payment messaging, payment provider logos at checkout, clear policy pages.

---

## 8. Phased delivery plan

> **Legend — exit criteria** is the condition that must be true to consider a phase done and move on. The **★ Client Sign-off Gate** sits at the end of Phase 2.

### Phase 0 — Discovery & Design Foundations
*Goal: remove ambiguity before a line of UI is written.*

- **Deliverables:**
  - Confirmed brand assets: logo (PNG supplied), final colour palette, typography choices, accent usage (resolve §12 open items with client).
  - Content audit: pull/confirm copy, photography, and product detail from **www.asai.one** and the client. Identify gaps (hero imagery per mode, product photos, About copy, policy text).
  - Finalised IA + URL structure (§5) signed off internally.
  - Mock-data schema agreed (aligned to the real model in §10).
- **Key tasks:** stakeholder workshop on palette/type; asset collection; content gap list; repo + tooling setup (Next.js, Tailwind, linting, Vercel project, preview deploys).
- **Dependencies:** client availability for brand decisions; access to asai.one content; product photography.
- **Exit criteria:** palette + type confirmed (or a provisional set explicitly approved to proceed), asset inventory complete enough to build Phase 2, repo scaffolded with CI + preview deploys working.

### Phase 1 — Design System & Component Library
*Goal: build the reusable, tokenised UI kit the whole site is assembled from.*

- **Deliverables:**
  - Design tokens (colour, type, spacing, radius, shadow) wired into Tailwind.
  - The component library from §6, each component responsive and accessible, documented (Storybook recommended).
  - Global shell: responsive Nav bar (desktop nav + mobile drawer, logo, cart icon, login/register) and Footer (brand blurb, quick links, policies, contact, social icons).
- **Key tasks:** implement tokens; build + document each component with mobile/tablet/desktop states and interaction states (hover, focus, disabled, loading).
- **Dependencies:** Phase 0 brand decisions.
- **Exit criteria:** all core components built, responsive, documented, and visually consistent with the reference aesthetic.

### Phase 2 — High-Fidelity Clickable Front End (mock data) ★ CLIENT GATE
*Goal: deliver the complete storefront experience the client reviews **before any backend work**.*

This is the most important phase for the stated objective. Every public page is built to high fidelity with real-looking content and **mock data**, fully responsive, navigable end-to-end (you can click from Home → mode → category → PDP → cart → through all 3 checkout steps to a confirmation screen), all on a shareable preview URL.

- **Deliverables (every page built — see §9 for full specs):**
  - Home (Hero, "How do you commute?" 4 mode cards, Featured Products carousel, "Why ASAI.One?" feature blocks, Footer).
  - Shop (search, filter sidebar, sort, product grid).
  - Category pages — live 2-Wheeler page + "Coming Soon" treatment for the other 3 modes.
  - Product Detail — gallery + variant selection (the pack/weight/tier variants), price, review, shipping & return-policy display, Add to Cart.
  - Cart — line items, quantity, remove, order summary, coupon field, proceed-to-checkout. (State held client-side for the demo.)
  - Checkout flow — Shipping → Payment (UI only, methods shown, no real charge) → Order Confirmation.
  - Login / Register screens (email or phone — UI + validation only, no real auth).
  - Account, Contact, and all 4 policy pages.
  - Coming-soon handling for hidden modes/products.
- **Key tasks:** assemble pages from the Phase 1 kit; wire client-side navigation and demo cart state; populate with mock products matching §1; responsive QA on real devices; deploy to preview.
- **Dependencies:** Phase 1 library; Phase 0 content/photography (placeholders acceptable where assets are pending, flagged as such).
- **Exit criteria / ★ GATE:** Client reviews the live preview on desktop **and** mobile and signs off on look, feel, layout, copy placement, and flow. **Backend phases (3+) do not begin until this sign-off is recorded.** Capture feedback, iterate, re-review until approved.

> Because mock data uses the real schema shapes, sign-off here means Phase 3 is a data-source swap and wiring exercise, not a redesign.

### Phase 3 — Backend Foundation & Data Layer
*Goal: stand up real data and auth behind the approved front end.*

- **Deliverables:**
  - Supabase schema implemented (products, variants, categories/modes, customers, carts, orders, etc. — §10), with Row-Level Security policies.
  - Auth: email and phone (OTP) sign-up/login wired to the Phase 2 screens; `user`/`admin` roles.
  - Product/category data served from Supabase; mock adapter replaced by the real data layer (same interface).
  - Image hosting via Supabase Storage; CMS-ready content fields.
- **Key tasks:** schema + migrations; seed real catalogue (5 products + variants); RLS; auth flows; swap data adapter; account page reads real user + (empty) order history.
- **Dependencies:** Phase 2 sign-off; final product data + photography.
- **Exit criteria:** storefront renders from live data; users can register/login by email or phone; catalogue managed in DB.

### Phase 4 — Commerce Core (cart, checkout, payments, orders)
*Goal: make it transact.*

- **Deliverables:**
  - Server-side cart persistence (tied to user or session) replacing demo state.
  - Coupon/discount handling.
  - Razorpay integration: server-side order creation, UPI / cards / net banking / COD, webhook signature verification, payment status reconciliation.
  - Order creation + Order Confirmation backed by real order records; order ID, payment method, summary.
  - Customer account: real order history.
- **Key tasks:** cart APIs; checkout server actions; Razorpay sandbox → production; webhook handlers; order state machine; COD handling; idempotency on payment callbacks.
- **Dependencies:** Phase 3; Razorpay merchant account + keys.
- **Exit criteria:** a real test purchase completes across each payment method (sandbox), produces an order, and shows on the confirmation + account pages.

### Phase 5 — Lifecycle & Marketing Messaging
*Goal: deliver the email/WhatsApp engagement the client specifically asked for.*

- **Deliverables:**
  - Transactional email via Resend (order confirmation, etc.).
  - **Abandoned-cart recovery:** detect carts with items but no completed purchase, for **both registered and unregistered** shoppers, using whichever identifier was captured (email → Resend reminder; phone → WhatsApp reminder).
  - Marketing email capability (lists, broadcast) feeding the admin marketing module.
- **Key tasks:** capture email/phone at the right point in the funnel (so unregistered abandoners are reachable); abandoned-cart detection job + dispatch logic with a sensible delay/cadence; Resend templates; WhatsApp Business API integration + approved message templates; unsubscribe/opt-out compliance.
- **Dependencies:** Phase 4 (cart/order events); Resend account; WhatsApp Business API provider + template approval (lead-time risk — start early).
- **Exit criteria:** confirmation emails send on purchase; an abandoned cart reliably triggers the correct channel reminder for both identified and guest shoppers.

### Phase 6 — Admin Panel & CMS
*Goal: give the ≈5 admins control of the store.*

- **Deliverables:**
  - **User management** (customers + admin accounts/roles).
  - **Analytics** (sales, orders, top products, conversion, cart-abandonment view).
  - **Returns** management (request intake → review → resolution).
  - **Marketing** (manage lists/campaigns wired to Phase 5).
  - **CMS** (manage products, variants, pricing, stock, categories, content blocks like hero, About, and policy pages, plus toggling "Coming Soon" modes live).
- **Key tasks:** protected `/admin` route group; role-gated access; CRUD for catalogue + content; analytics dashboard; returns workflow + statuses.
- **Dependencies:** Phases 3–5 (data, orders, messaging).
- **Exit criteria:** an admin can manage products/variants/stock, publish content, process a return, view analytics, and run a campaign — all without engineering involvement.

### Phase 7 — SEO, Performance, Hardening & Launch
*Goal: production-ready, fast, findable, safe.*

- **Deliverables:**
  - Per-page metadata, sitemap, structured data (Product schema), Open Graph.
  - Performance pass: image optimisation, Core Web Vitals, caching/ISR strategy.
  - Security review: webhook verification, RLS audit, rate limiting, secrets handling, PII handling for the messaging features.
  - Cross-device/browser QA, error states, empty states, analytics/event tracking, monitoring.
  - Launch runbook + rollback plan.
- **Dependencies:** all prior phases.
- **Exit criteria:** meets agreed performance/SEO targets; security review passed; go-live checklist complete.

---

## 9. Detailed page & component specifications (for the Phase 2 build)

### 9.1 Global navigation bar
- **Left:** ASAI.One logo (compass mark + wordmark), large and clear.
- **Centre/right:** Home · About · Contact · Cart icon (with item count) · Login/Register.
- **Mobile:** hamburger → slide-in drawer; persistent cart icon; sticky on scroll.

### 9.2 Home page
1. **Hero** — full-width editorial image, bold display headline + short subline, single primary CTA (e.g., "Shop 2-Wheeler" / "Best Sellers"). Bellroy-style: confident heading over photography, one clear action.
2. **"How do you commute?"** — heading + subtitle ("Choose your commute type to explore relevant essentials"). **4 mode cards in a row** (2-Wheeler with bike icon, 4-Wheeler / car, Pedestrian / walking person, Public Transport / bus-train-metro). Hover scaling, soft shadow, clickable. 2-Wheeler → category page; the other three show **"Coming Soon"** state. Responsive: 4→2→1 across breakpoints.
3. **Featured Products** — horizontal carousel, 3/2/1 per view (desktop/tablet/mobile), left/right arrows, smooth slide. Card = image, title, short description, price, review, shipping policy, return policy (Returnable/Non-returnable), Add to Cart.
4. **"Why ASAI.One?"** — 3–4 feature blocks (e.g., Designed for Daily Commutes, Functional & Minimal, Built for Convenience, Fast Shipping) with icon + minimal card on a soft background section. Builds trust.
5. **Footer** — see §9.10.

### 9.3 Shop page
- **Top:** heading, search bar, filter button, sort dropdown.
- **Desktop sidebar filters:** Categories, Price Range, Best Sellers, New Arrivals.
- **Product grid:** 3–4 per row, consistent spacing.
- **Card:** image, title, price, Quick Add button, optional hover animation.
- Mobile: filters collapse into a drawer/sheet triggered by the filter button.

### 9.4 Category page (2-Wheeler is the live example)
- **Banner:** category title, relevant commuter image, short description.
- **Product grid:** filtered to that mode only.
- **Optional filters:** Price, Popularity, New arrivals.
- Coming-soon modes reuse this template but render a teaser (title + "Coming Soon", no grid).

### 9.5 Product Detail page
- **Two-column desktop layout.**
- **Left — Gallery:** main image, thumbnails, optional zoom.
- **Right — Info:** title, short description, price (updates with variant), review, shipping policy, return policy (Returnable/Non-returnable), **variant selector**, quantity selector, Add to Cart.
- **Variant UX (critical):** must cleanly handle all four variant styles in the catalogue —
  - Absrb: Pack of 6 / Pack of 12 (simple toggle).
  - DryLock Pods: weight (75/150/300g) × pack (Single / Pack of 3) — a two-axis selector.
  - PureRide & Shield: Basic / Advance tier toggle.
  - Each variant carries its own price (and later, stock); selecting a variant updates price, image (if applicable), and the Add-to-Cart payload.
- Mobile: gallery stacks above info; sticky Add-to-Cart bar.

### 9.6 Cart page
- **Two-column.** Left: cart items with thumbnail, variant label, quantity selector, remove. Right: order summary (subtotal, shipping, final total), coupon field, Proceed to Checkout.
- Mobile: summary stacks below items; sticky checkout CTA.

### 9.7 Checkout flow (3 steps, with stepper)
- **Step 1 — Shipping:** Full Name, Email, Phone, Address, City, State, PIN. Large mobile-friendly inputs, minimal distractions. *(This is also the capture point that makes guest/unregistered abandoned-cart reminders possible — see §11.)*
- **Step 2 — Payment:** UPI, Debit/Credit Card, Net Banking, COD. Trust elements (Secure Checkout, Encrypted Payments, payment logos). Sticky order summary. *(Phase 2: UI only.)*
- **Step 3 — Confirmation:** "Order Confirmed 🎉", Order ID, payment method, order summary, "Continue Shopping" CTA.

### 9.8 Login / Register
- Two paths: **Email** or **Phone**. UI + validation in Phase 2; real OTP/auth in Phase 3.
- Messaging implication surfaced here: email path → email reminders; phone path → WhatsApp reminders.

### 9.9 Contact page
- Left: contact form (Name, Email, Subject, Message). Right: business info (email `support@asai.one`, address — Pune, Maharashtra), social links.

### 9.10 Footer
- **Brand:** logo + short description. **Quick links:** Home, Shop, About, Contact. **Policies:** Privacy, Terms, Shipping, Refund. **Contact:** support@asai.one, Pune, Maharashtra. **Social:** Instagram, LinkedIn, YouTube.

### 9.11 Policy pages
- Clean legal formatting, strong typography hierarchy, readable spacing, highlighted key statements. Four pages: Terms & Conditions, Privacy Policy, Shipping Policy, Refund Policy.

---

## 10. Data model sketch (mock-first, real in Phase 3)

Keep these shapes identical between the Phase 2 mock adapter and the Phase 3 Supabase implementation.

- **commute_mode** — id, slug, name, icon, status (`live` | `coming_soon`), banner_image, description.
- **product** — id, slug, mode_id, title, short_description, long_description, base_price, images[], review_summary, shipping_policy, return_policy (`returnable` | `non_returnable`), is_best_seller, is_new, published.
- **product_variant** — id, product_id, label (e.g., "Pack of 6", "150g · Pack of 3", "Advance"), attributes (json: { packSize, weightGrams, tier }), price, sku, stock.
- **customer** — id, email?, phone?, name, role (`user` | `admin`), marketing_opt_in, whatsapp_opt_in.
- **address** — id, customer_id, full_name, phone, line, city, state, pin.
- **cart** / **cart_item** — cart tied to customer_id or anonymous session; item references product_variant_id, qty. (Drives abandoned-cart detection.)
- **order** / **order_item** — order_id, customer/contact, items snapshot, payment_method, payment_status, totals, status, created_at.
- **coupon** — code, type, value, constraints.
- **return_request** — order_id, items, reason, status.
- **content_block** — for CMS-managed hero/About/policy/feature content.

> The variant model is deliberately attribute-based so the two-axis DryLock case (weight × pack) and the simple tier/pack cases all fit one structure.

---

## 11. Note on the abandoned-cart requirement (client-specific)

The client explicitly wants reminders for shoppers who add to cart but don't purchase — **including unregistered shoppers** — via **email (Resend)** or **WhatsApp** depending on the identifier captured.

Product implication that must be designed in early (even in Phase 2 layout): we need to **capture an email or phone for guests before the cart is abandoned** — practically, at the start of checkout (Step 1) and/or via a contact capture on the cart. The data model (anonymous cart + captured contact) and the funnel UX must support this; otherwise guest reminders are impossible. Flagging it here so the front end built in Phase 2 already positions that capture correctly.

---

## 12. Open questions / decisions needed (resolve in Phase 0)

The BRD repeatedly defers colour, typography, and content to the reference sites and to www.asai.one. These need explicit answers before Phase 1/2 can be considered final rather than provisional:

1. ~~**Colour palette**~~ — **RESOLVED:** confirmed to the MOTO Minimal Street **Navy × White / Off-White** schema (full navy ramp + neutrals in §6).
2. ~~**Typography**~~ — **RESOLVED:** Bebas Neue (display, uppercase) · Barlow Condensed (nav/buttons/headings) · Barlow (body) · DM Mono (labels). See §6.
3. **Product content** — final photography and copy for all 5 products and their variants; hero and per-mode imagery.
4. **About / policy copy** — source text for About and the four policy pages.
5. **WhatsApp provider** — which WhatsApp Business API provider; template approval has lead time (start in Phase 0/early to de-risk Phase 5).
6. **Coupons & shipping** — discount rules and shipping-cost logic (flat / by region / free over threshold?).
7. **Order tracking** — confirm in or out for v1 (BRD marks it optional).
8. **www.asai.one** — confirm it is the canonical content source and that we have access to all referenced material.

**Working assumptions (until corrected):** "Minimal Street" aesthetic (MOTO schema) — navy × white/off-white, type-led, sharp-edged; 2-Wheeler only at launch with three coming-soon modes; variants priced individually; guest checkout captures contact at Step 1 to enable reminders.

---

## 13. Sequencing summary

| Phase | Focus | Backend? | Client touchpoint |
| --- | --- | --- | --- |
| 0 | Discovery & design foundations | No | Brand + content decisions |
| 1 | Design system / component library | No | — |
| 2 | **Clickable front end (mock data)** | **No** | **★ Look & feel sign-off (the gate)** |
| 3 | Supabase data + auth | Yes | Data/auth review |
| 4 | Cart, checkout, Razorpay, orders | Yes | Test purchase demo |
| 5 | Resend + WhatsApp lifecycle | Yes | Messaging review |
| 6 | Admin panel & CMS | Yes | Admin handover/training |
| 7 | SEO, performance, hardening, launch | Yes | Launch sign-off |

**The single most important rule in this plan:** Phases 3–7 do not begin until the Phase 2 look & feel is signed off by the client.
