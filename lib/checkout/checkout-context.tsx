"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Order, PaymentMethod } from "@/lib/types";

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
}

interface CheckoutState {
  shipping: ShippingInfo | null;
  paymentMethod: PaymentMethod;
  lastOrder: Order | null;
}

interface CheckoutContextValue extends CheckoutState {
  setShipping: (info: ShippingInfo) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setLastOrder: (order: Order) => void;
  reset: () => void;
}

const STORAGE_KEY = "asai-checkout-v1";
const initial: CheckoutState = {
  shipping: null,
  paymentMethod: "upi",
  lastOrder: null,
};

type CheckoutAction =
  | { type: "hydrate"; state: CheckoutState }
  | { type: "setShipping"; shipping: ShippingInfo }
  | { type: "setPayment"; method: PaymentMethod }
  | { type: "setLastOrder"; order: Order }
  | { type: "reset" };

function reducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setShipping":
      return { ...state, shipping: action.shipping };
    case "setPayment":
      return { ...state, paymentMethod: action.method };
    case "setLastOrder":
      return { ...state, lastOrder: action.order };
    case "reset":
      return { ...initial, lastOrder: state.lastOrder };
    default:
      return state;
  }
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: { ...initial, ...JSON.parse(raw) } });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<CheckoutContextValue>(
    () => ({
      ...state,
      setShipping: (shipping) => dispatch({ type: "setShipping", shipping }),
      setPaymentMethod: (method) => dispatch({ type: "setPayment", method }),
      setLastOrder: (order) => dispatch({ type: "setLastOrder", order }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [state],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within <CheckoutProvider>");
  return ctx;
}

/** Generate a demo order id, e.g. ASAI-7K3F9Q. */
export function generateOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ASAI-${suffix}`;
}
