"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { CartItem, Coupon, Product, ProductVariant } from "@/lib/types";
import { findCouponSync, resolveVariantSync } from "@/lib/data";
import { rupees } from "@/lib/format";

/* Shipping rules for the demo (build-plan §12 #6 still open — provisional). */
const SHIPPING_FLAT = rupees(49);
const FREE_SHIP_THRESHOLD = rupees(499);

const STORAGE_KEY = "asai-cart-v1";

export interface CartLine {
  item: CartItem;
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
}

type CartAction =
  | { type: "hydrate"; state: CartState }
  | { type: "add"; variantId: string; productId: string; qty: number }
  | { type: "setQty"; variantId: string; qty: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" }
  | { type: "applyCoupon"; code: string }
  | { type: "removeCoupon" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const existing = state.items.find((i) => i.variantId === action.variantId);
      const items = existing
        ? state.items.map((i) =>
            i.variantId === action.variantId
              ? { ...i, qty: Math.min(i.qty + action.qty, 99) }
              : i,
          )
        : [
            ...state.items,
            {
              variantId: action.variantId,
              productId: action.productId,
              qty: action.qty,
            },
          ];
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
      return { items: [], couponCode: null };
    case "applyCoupon":
      return { ...state, couponCode: action.code };
    case "removeCoupon":
      return { ...state, couponCode: null };
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
  addItem: (variantId: string, productId: string, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = { items: [], couponCode: null };

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useReducerReady();

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({
            type: "hydrate",
            state: { items: parsed.items, couponCode: parsed.couponCode ?? null },
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

  const lines = useMemo<CartLine[]>(() => {
    return state.items
      .map((item) => {
        const resolved = resolveVariantSync(item.variantId);
        if (!resolved) return null;
        return {
          item,
          product: resolved.product,
          variant: resolved.variant,
          lineTotal: resolved.variant.price * item.qty,
        } satisfies CartLine;
      })
      .filter((l): l is CartLine => l !== null);
  }, [state.items]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.item.qty, 0),
    [lines],
  );

  const coupon = useMemo<Coupon | null>(() => {
    if (!state.couponCode) return null;
    return findCouponSync(state.couponCode) ?? null;
  }, [state.couponCode]);

  const { discount, shipping } = useMemo(() => {
    let baseShipping =
      subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FLAT;
    let disc = 0;
    if (coupon && (!coupon.minSubtotal || subtotal >= coupon.minSubtotal)) {
      if (coupon.type === "percent") {
        disc = Math.round((subtotal * coupon.value) / 100);
      } else if (coupon.type === "flat") {
        disc = Math.min(coupon.value, subtotal);
      } else if (coupon.type === "free_shipping") {
        baseShipping = 0;
      }
    }
    return { discount: disc, shipping: baseShipping };
  }, [subtotal, coupon]);

  const total = Math.max(0, subtotal - discount) + shipping;

  const value: CartContextValue = {
    lines,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    ready,
    addItem: (variantId, productId, qty = 1) =>
      dispatch({ type: "add", variantId, productId, qty }),
    setQty: (variantId, qty) => dispatch({ type: "setQty", variantId, qty }),
    removeItem: (variantId) => dispatch({ type: "remove", variantId }),
    clear: () => dispatch({ type: "clear" }),
    applyCoupon: (code) => {
      const found = findCouponSync(code);
      if (!found) return { ok: false, message: "That code isn't valid." };
      if (found.minSubtotal && subtotal < found.minSubtotal) {
        return {
          ok: false,
          message: `Spend ${(found.minSubtotal / 100).toLocaleString("en-IN")} to use this code.`,
        };
      }
      dispatch({ type: "applyCoupon", code: found.code });
      return { ok: true, message: `${found.label} applied.` };
    },
    removeCoupon: () => dispatch({ type: "removeCoupon" }),
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
