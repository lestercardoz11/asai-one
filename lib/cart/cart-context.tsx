"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { ArtDescriptor, Coupon } from "@/lib/types";
import { validateCouponAction } from "@/lib/cart/actions";
import { computeTotals } from "@/lib/checkout/pricing";

const STORAGE_KEY = "asai-cart-v2";

/**
 * A cart item carries a **snapshot** of its display + pricing fields captured at
 * add-time. This decouples the client cart from the (now async) catalogue — no
 * synchronous lookups — and mirrors how the server cart persists line snapshots
 * (`cart_items.unit_price_paise`) in Phase 4.
 */
export interface CartItemInput {
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  image?: ArtDescriptor;
  variantLabel: string;
  sku: string;
  hasChoices: boolean;
  unitPrice: number;
  compareAtPrice?: number;
}

export interface StoredItem extends CartItemInput {
  qty: number;
}

export interface CartLine extends StoredItem {
  lineTotal: number;
}

interface CartState {
  items: StoredItem[];
  coupon: Coupon | null;
}

type CartAction =
  | { type: "hydrate"; state: CartState }
  | { type: "add"; input: CartItemInput; qty: number }
  | { type: "setQty"; variantId: string; qty: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" }
  | { type: "applyCoupon"; coupon: Coupon }
  | { type: "removeCoupon" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const existing = state.items.find((i) => i.variantId === action.input.variantId);
      const items = existing
        ? state.items.map((i) =>
            i.variantId === action.input.variantId
              ? { ...action.input, qty: Math.min(i.qty + action.qty, 99) }
              : i,
          )
        : [...state.items, { ...action.input, qty: action.qty }];
      return { ...state, items };
    }
    case "setQty": {
      const qty = Math.max(1, Math.min(action.qty, 99));
      return {
        ...state,
        items: state.items.map((i) =>
          i.variantId === action.variantId ? { ...i, qty } : i,
        ),
      };
    }
    case "remove":
      return {
        ...state,
        items: state.items.filter((i) => i.variantId !== action.variantId),
      };
    case "clear":
      return { items: [], coupon: null };
    case "applyCoupon":
      return { ...state, coupon: action.coupon };
    case "removeCoupon":
      return { ...state, coupon: null };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon: Coupon | null;
  /** True after localStorage hydration so SSR/CSR don't mismatch. */
  ready: boolean;
  addItem: (input: CartItemInput, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
  /** Mini-cart drawer visibility. */
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = { items: [], coupon: null };

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useReducerReady();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openCart = useCallback(() => setDrawerOpen(true), []);
  const closeCart = useCallback(() => setDrawerOpen(false), []);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({
            type: "hydrate",
            state: { items: parsed.items, coupon: parsed.coupon ?? null },
          });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady();
  }, [setReady]);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state, ready]);

  const lines = useMemo<CartLine[]>(
    () => state.items.map((item) => ({ ...item, lineTotal: item.unitPrice * item.qty })),
    [state.items],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const coupon = state.coupon;

  const { discount, shipping, total } = useMemo(
    () => computeTotals(subtotal, coupon),
    [subtotal, coupon],
  );

  const value: CartContextValue = {
    lines,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    ready,
    addItem: (input, qty = 1) => dispatch({ type: "add", input, qty }),
    setQty: (variantId, qty) => dispatch({ type: "setQty", variantId, qty }),
    removeItem: (variantId) => dispatch({ type: "remove", variantId }),
    clear: () => dispatch({ type: "clear" }),
    applyCoupon: async (code) => {
      const result = await validateCouponAction(code);
      if (!result.ok || !result.coupon) {
        return { ok: false, message: result.message };
      }
      const c = result.coupon;
      if (c.minSubtotal && subtotal < c.minSubtotal) {
        return {
          ok: false,
          message: `Spend ${(c.minSubtotal / 100).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          })} to use this code.`,
        };
      }
      dispatch({ type: "applyCoupon", coupon: c });
      return { ok: true, message: result.message };
    },
    removeCoupon: () => dispatch({ type: "removeCoupon" }),
    drawerOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

/* Tiny boolean "latch" reducer so `ready` only ever flips false → true. */
function useReducerReady(): [boolean, () => void] {
  const [ready, set] = useReducer(() => true, false);
  return [ready, set];
}
