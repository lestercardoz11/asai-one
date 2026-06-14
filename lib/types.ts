/**
 * ASAI.One domain model (build-plan §10).
 *
 * These shapes are the contract between the Phase 2 mock adapter and the Phase 3
 * Supabase implementation — they are intentionally identical so sign-off means a
 * data-source swap, not a redesign. Keep them in sync with the real schema.
 *
 * Money fields are always integer **paise**.
 */

export type CommuteModeStatus = "live" | "coming_soon";

export type ModeIcon =
  | "two-wheeler"
  | "four-wheeler"
  | "pedestrian"
  | "public-transport";

export interface CommuteMode {
  id: string;
  slug: string;
  name: string;
  icon: ModeIcon;
  status: CommuteModeStatus;
  description: string;
  tagline: string;
  bannerImage?: ArtDescriptor;
}

export type ReturnPolicy = "returnable" | "non_returnable";

/** Branded SVG art descriptor — stands in for photography in Phase 2. */
export interface ArtDescriptor {
  /**
   * Real photography served from `/public`. When set, <ProductImage /> renders an
   * optimised <Image /> from this path and ignores the SVG fallback fields below.
   */
  src?: string;
  /** Visual pattern family rendered by <ProductImage /> when no `src` is given. */
  pattern: "pods" | "shield" | "lock" | "rings" | "absorb" | "compass";
  /** Accent navy step used in the artwork. */
  accent: keyof NavyRamp;
  /** Ground tone behind the art. */
  tone: "white" | "warm" | "navy";
  /** Stable seed for deterministic detail placement. */
  seed: string;
}

type NavyRamp = {
  900: string;
  800: string;
  700: string;
  600: string;
  500: string;
  400: string;
  300: string;
  200: string;
  100: string;
  50: string;
};

/**
 * Attribute-based variant axes. Deliberately generic so the two-axis DryLock
 * case (weight × pack) and the simple tier/pack cases all fit one structure.
 */
export interface VariantAttributes {
  packSize?: number;
  weightGrams?: number;
  tier?: "basic" | "advance";
}

export type VariantAxisKey = keyof VariantAttributes;

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  attributes: VariantAttributes;
  /** Selling price in paise. */
  price: number;
  /** Optional struck-through reference price in paise. */
  compareAtPrice?: number;
  sku: string;
  stock: number;
}

export interface ReviewSummary {
  rating: number; // 0–5, one decimal
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  modeId: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  /** Lowest variant price in paise — display "from" anchor. */
  basePrice: number;
  images: ArtDescriptor[];
  features: string[];
  specs: { label: string; value: string }[];
  reviewSummary: ReviewSummary;
  shippingPolicy: string;
  returnPolicy: ReturnPolicy;
  isBestSeller: boolean;
  isNew: boolean;
  published: boolean;
  variants: ProductVariant[];
  /** Default variant id selected on the PDP. */
  defaultVariantId: string;
  /**
   * Ordered axis metadata so the PDP renders selectors in a deliberate order
   * with human labels. Derived axes that aren't listed still render generically.
   */
  variantAxes: VariantAxis[];
}

export interface VariantAxis {
  key: VariantAxisKey;
  label: string;
  /** Render style for the option control. */
  kind: "pack" | "weight" | "tier";
}

/* — Commerce + account shapes (typed now, used progressively) — */

export type UserRole = "user" | "admin";

export interface Customer {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}

export interface Address {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  qty: number;
}

export interface Cart {
  id: string;
  customerId?: string;
  /** Captured at checkout step 1 to enable guest abandoned-cart reminders. */
  contactEmail?: string;
  contactPhone?: string;
  items: CartItem[];
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "cod_pending";
export type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productTitle: string;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  qty: number;
}

export interface Order {
  id: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export type CouponType = "flat" | "percent" | "free_shipping";

export interface Coupon {
  code: string;
  type: CouponType;
  /** paise for flat, integer percent for percent, ignored for free_shipping. */
  value: number;
  minSubtotal?: number;
  label: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  status: "requested" | "approved" | "rejected" | "completed";
}

export interface ContentBlock {
  key: string;
  title: string;
  body: string;
}
