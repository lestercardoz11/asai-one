import type { Product } from "@/lib/types";
import { rupees } from "@/lib/format";

const MODE_2W = "mode-2w";

/**
 * The current 2-Wheeler lineup (build-plan §1, per the 27 May email which
 * supersedes the BRD). Four of five products are sold as variants — variants are
 * first-class here, not retrofitted.
 */
export const PRODUCTS: Product[] = [
  // ── ASAI Absrb ── simple pack toggle ───────────────────────────────────────
  {
    id: "p-absrb",
    slug: "asai-absrb",
    modeId: MODE_2W,
    title: "ASAI Absrb",
    shortDescription:
      "Sweat-wicking helmet liner pads. Stick, ride, swap — a fresh helmet every day.",
    longDescription:
      "Absrb is a thin, high-loft pad that lines the brow and crown of your helmet, drawing sweat off your skin before it stings your eyes or sours the foam. Each pad is good for a week of commuting, then you peel and replace — no washing, no drying, no helmet funk. Sized to fit every full-face and open-face shell.",
    basePrice: rupees(299),
    images: [
      { pattern: "absorb", accent: 500, tone: "warm", seed: "absrb-a" },
      { pattern: "absorb", accent: 700, tone: "white", seed: "absrb-b" },
      { pattern: "compass", accent: 600, tone: "navy", seed: "absrb-c" },
    ],
    features: [
      "Wicks sweat away from the brow in seconds",
      "One week of riding per pad",
      "Peel-and-replace — no washing",
      "Universal fit for full-face & open-face",
    ],
    specs: [
      { label: "Material", value: "Micro-perforated PU + cotton loft" },
      { label: "Thickness", value: "3 mm" },
      { label: "Use", value: "~7 commute days / pad" },
      { label: "Made in", value: "Pune, India" },
    ],
    reviewSummary: { rating: 4.6, count: 213 },
    shippingPolicy: "Ships in 24h · Free over ₹499",
    returnPolicy: "non_returnable",
    isBestSeller: true,
    isNew: false,
    published: true,
    defaultVariantId: "p-absrb-6",
    variantAxes: [{ key: "packSize", label: "Pack size", kind: "pack" }],
    variants: [
      {
        id: "p-absrb-6",
        productId: "p-absrb",
        label: "Pack of 6",
        attributes: { packSize: 6 },
        price: rupees(299),
        sku: "ABS-PK6",
        stock: 142,
      },
      {
        id: "p-absrb-12",
        productId: "p-absrb",
        label: "Pack of 12",
        attributes: { packSize: 12 },
        price: rupees(549),
        compareAtPrice: rupees(598),
        sku: "ABS-PK12",
        stock: 88,
      },
    ],
  },

  // ── ASAI ChildLock ── single SKU ────────────────────────────────────────────
  {
    id: "p-childlock",
    slug: "asai-childlock",
    modeId: MODE_2W,
    title: "ASAI ChildLock",
    shortDescription:
      "Pillion safety harness that keeps your child anchored to you, not the grab-rail.",
    longDescription:
      "ChildLock is a padded harness that loops around the rider and secures your child to your back, so a tired grip or a sudden brake never becomes a fall. The buckle is one-hand operable with gloves on, the strap is reflective for low light, and the whole thing folds into a jacket pocket when you're riding solo.",
    basePrice: rupees(899),
    images: [
      { pattern: "lock", accent: 600, tone: "white", seed: "cl-a" },
      { pattern: "lock", accent: 800, tone: "navy", seed: "cl-b" },
      { pattern: "compass", accent: 500, tone: "warm", seed: "cl-c" },
    ],
    features: [
      "Anchors child to rider, not the grab-rail",
      "One-hand glove-friendly buckle",
      "Reflective strap for low light",
      "Folds into a jacket pocket",
    ],
    specs: [
      { label: "Fits", value: "Child 2–7 yrs · up to 30 kg" },
      { label: "Webbing", value: "Aramid-reinforced nylon" },
      { label: "Buckle", value: "Dual-release safety clasp" },
      { label: "Made in", value: "Pune, India" },
    ],
    reviewSummary: { rating: 4.8, count: 167 },
    shippingPolicy: "Ships in 24h · Free over ₹499",
    returnPolicy: "returnable",
    isBestSeller: true,
    isNew: false,
    published: true,
    defaultVariantId: "p-childlock-std",
    variantAxes: [],
    variants: [
      {
        id: "p-childlock-std",
        productId: "p-childlock",
        label: "Standard",
        attributes: {},
        price: rupees(899),
        compareAtPrice: rupees(1099),
        sku: "CHL-STD",
        stock: 54,
      },
    ],
  },

  // ── ASAI DryLock Pods ── two-axis: weight × pack ────────────────────────────
  {
    id: "p-drylock",
    slug: "asai-drylock-pods",
    modeId: MODE_2W,
    title: "ASAI DryLock Pods",
    shortDescription:
      "Rechargeable moisture pods that keep helmets, gloves and gear boxes bone-dry.",
    longDescription:
      "Toss a DryLock pod into your helmet, top-box or glove and it pulls the damp out overnight — no more clammy foam or that wet-dog smell after the monsoon ride home. When the indicator window turns pink, microwave or sun-dry the pod and it's good as new. Pick the size for the space and the pack for how many corners of your kit need drying.",
    basePrice: rupees(149),
    images: [
      { pattern: "pods", accent: 500, tone: "white", seed: "dl-a" },
      { pattern: "pods", accent: 700, tone: "warm", seed: "dl-b" },
      { pattern: "rings", accent: 600, tone: "navy", seed: "dl-c" },
    ],
    features: [
      "Pulls moisture from helmets, gloves & top-boxes",
      "Colour window shows when to recharge",
      "Reusable for 2+ years",
      "Fragrance-free, non-toxic silica",
    ],
    specs: [
      { label: "Recharge", value: "Microwave or sun-dry" },
      { label: "Lifespan", value: "2+ years" },
      { label: "Indicator", value: "Blue → pink moisture window" },
      { label: "Made in", value: "Pune, India" },
    ],
    reviewSummary: { rating: 4.5, count: 301 },
    shippingPolicy: "Ships in 24h · Free over ₹499",
    returnPolicy: "non_returnable",
    isBestSeller: false,
    isNew: true,
    published: true,
    defaultVariantId: "p-drylock-150-1",
    variantAxes: [
      { key: "weightGrams", label: "Size", kind: "weight" },
      { key: "packSize", label: "Pack", kind: "pack" },
    ],
    variants: [
      {
        id: "p-drylock-75-1",
        productId: "p-drylock",
        label: "75g · Single",
        attributes: { weightGrams: 75, packSize: 1 },
        price: rupees(149),
        sku: "DRY-75-1",
        stock: 210,
      },
      {
        id: "p-drylock-75-3",
        productId: "p-drylock",
        label: "75g · Pack of 3",
        attributes: { weightGrams: 75, packSize: 3 },
        price: rupees(399),
        compareAtPrice: rupees(447),
        sku: "DRY-75-3",
        stock: 120,
      },
      {
        id: "p-drylock-150-1",
        productId: "p-drylock",
        label: "150g · Single",
        attributes: { weightGrams: 150, packSize: 1 },
        price: rupees(249),
        sku: "DRY-150-1",
        stock: 175,
      },
      {
        id: "p-drylock-150-3",
        productId: "p-drylock",
        label: "150g · Pack of 3",
        attributes: { weightGrams: 150, packSize: 3 },
        price: rupees(649),
        compareAtPrice: rupees(747),
        sku: "DRY-150-3",
        stock: 96,
      },
      {
        id: "p-drylock-300-1",
        productId: "p-drylock",
        label: "300g · Single",
        attributes: { weightGrams: 300, packSize: 1 },
        price: rupees(449),
        sku: "DRY-300-1",
        stock: 64,
      },
      {
        id: "p-drylock-300-3",
        productId: "p-drylock",
        label: "300g · Pack of 3",
        attributes: { weightGrams: 300, packSize: 3 },
        price: rupees(1149),
        compareAtPrice: rupees(1347),
        sku: "DRY-300-3",
        stock: 38,
      },
    ],
  },

  // ── ASAI PureRide ── tier toggle ────────────────────────────────────────────
  {
    id: "p-pureride",
    slug: "asai-pureride",
    modeId: MODE_2W,
    title: "ASAI PureRide",
    shortDescription:
      "Anti-pollution riding mask that filters the road without fogging your visor.",
    longDescription:
      "PureRide seals against your face and filters the exhaust, dust and particulate you'd otherwise breathe for an hour a day. The exhale valve vents heat and moisture so your visor stays clear at the signal, and the contoured shell sits flush under any helmet. Advance adds an active carbon layer for heavier traffic corridors.",
    basePrice: rupees(1299),
    images: [
      { pattern: "rings", accent: 500, tone: "white", seed: "pr-a" },
      { pattern: "rings", accent: 700, tone: "navy", seed: "pr-b" },
      { pattern: "compass", accent: 600, tone: "warm", seed: "pr-c" },
    ],
    features: [
      "Filters exhaust, dust & particulate",
      "Anti-fog exhale valve keeps visors clear",
      "Contoured to sit under any helmet",
      "Washable shell, replaceable filters",
    ],
    specs: [
      { label: "Filtration", value: "Basic: PM2.5 · Advance: PM2.5 + carbon" },
      { label: "Valve", value: "One-way anti-fog exhale" },
      { label: "Filter life", value: "~40 commute hours" },
      { label: "Made in", value: "Pune, India" },
    ],
    reviewSummary: { rating: 4.4, count: 129 },
    shippingPolicy: "Ships in 48h · Free over ₹499",
    returnPolicy: "returnable",
    isBestSeller: false,
    isNew: true,
    published: true,
    defaultVariantId: "p-pureride-basic",
    variantAxes: [{ key: "tier", label: "Tier", kind: "tier" }],
    variants: [
      {
        id: "p-pureride-basic",
        productId: "p-pureride",
        label: "Basic",
        attributes: { tier: "basic" },
        price: rupees(1299),
        sku: "PUR-BAS",
        stock: 73,
      },
      {
        id: "p-pureride-advance",
        productId: "p-pureride",
        label: "Advance",
        attributes: { tier: "advance" },
        price: rupees(1999),
        sku: "PUR-ADV",
        stock: 41,
      },
    ],
  },

  // ── ASAI Shield ── tier toggle ──────────────────────────────────────────────
  {
    id: "p-shield",
    slug: "asai-shield",
    modeId: MODE_2W,
    title: "ASAI Shield",
    shortDescription:
      "All-weather reflective riding shell that packs down to the size of your fist.",
    longDescription:
      "Shield is the layer you keep stuffed under the seat for the ride that turns on you — windproof, water-repellent and lit up with reflective piping for the dark commute home. Basic blocks wind and light rain; Advance adds a taped-seam membrane and a thermal liner for the cold, wet months. Packs into its own chest pocket.",
    basePrice: rupees(1799),
    images: [
      { pattern: "shield", accent: 600, tone: "navy", seed: "sh-a" },
      { pattern: "shield", accent: 500, tone: "white", seed: "sh-b" },
      { pattern: "compass", accent: 700, tone: "warm", seed: "sh-c" },
    ],
    features: [
      "Windproof & water-repellent shell",
      "Reflective piping for the night ride",
      "Packs into its own chest pocket",
      "Advance: taped seams + thermal liner",
    ],
    specs: [
      { label: "Shell", value: "Ripstop nylon, DWR-treated" },
      { label: "Reflectivity", value: "360° piping + rear panel" },
      { label: "Packed size", value: "~14 cm pouch" },
      { label: "Made in", value: "Pune, India" },
    ],
    reviewSummary: { rating: 4.7, count: 98 },
    shippingPolicy: "Ships in 48h · Free over ₹499",
    returnPolicy: "returnable",
    isBestSeller: false,
    isNew: false,
    published: true,
    defaultVariantId: "p-shield-basic",
    variantAxes: [{ key: "tier", label: "Tier", kind: "tier" }],
    variants: [
      {
        id: "p-shield-basic",
        productId: "p-shield",
        label: "Basic",
        attributes: { tier: "basic" },
        price: rupees(1799),
        sku: "SHD-BAS",
        stock: 60,
      },
      {
        id: "p-shield-advance",
        productId: "p-shield",
        label: "Advance",
        attributes: { tier: "advance" },
        price: rupees(2799),
        compareAtPrice: rupees(2999),
        sku: "SHD-ADV",
        stock: 29,
      },
    ],
  },
];
