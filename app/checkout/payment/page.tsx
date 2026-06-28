"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { useCheckout } from "@/lib/checkout/checkout-context";
import { createOrder, verifyPayment } from "@/lib/checkout/order-actions";
import type { Order } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Stepper } from "@/components/ui/stepper";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { LockIcon, ShieldIcon } from "@/components/icons";
import { CHECKOUT_STEPS } from "@/components/checkout/steps";
import { PaymentMethods, type PayChoice } from "@/components/checkout/payment-methods";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  notes?: Record<string, string>;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

const RZP_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RZP_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load error")));
      return;
    }
    const script = document.createElement("script");
    script.src = RZP_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load error"));
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const router = useRouter();
  const { lines, clear, ready, coupon } = useCart();
  const { shipping, saveAddress, paymentMethod, setPaymentMethod, setLastOrder } = useCheckout();
  const [placing, setPlacing] = useState(false);
  const [payStatus, setPayStatus] = useState<"idle" | "failed">("idle");
  const choice: PayChoice = paymentMethod === "cod" ? "cod" : "online";
  const onChoice = (v: PayChoice) => setPaymentMethod(v === "cod" ? "cod" : "upi");
  // Stable per checkout attempt so a double-click / retry can't create a 2nd order.
  const idempotencyKey = useRef<string | null>(null);

  // Guard: must have shipping + a non-empty cart.
  useEffect(() => {
    if (!ready) return;
    if (!shipping) router.replace("/checkout/shipping");
    else if (lines.length === 0) router.replace("/cart");
  }, [ready, shipping, lines.length, router]);

  if (!ready || !shipping || lines.length === 0) {
    return <div className="h-64 animate-fade" aria-busy />;
  }

  const finish = (order: Order, accessToken?: string) => {
    setLastOrder(order);
    clear();
    // Token rides in the URL fragment (never sent to servers / Referer / logs);
    // `o` stays in the query since the order number is not sensitive.
    const base = `/checkout/confirmation?o=${encodeURIComponent(order.id)}`;
    router.push(accessToken ? `${base}#t=${encodeURIComponent(accessToken)}` : base);
  };

  const placeOrder = async () => {
    if (!shipping) return;
    setPlacing(true);
    setPayStatus("idle");
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const result = await createOrder({
      contact: shipping,
      items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
      paymentMethod,
      couponCode: coupon?.code ?? null,
      idempotencyKey: idempotencyKey.current,
      saveAddress,
    });

    if (!result.ok || !result.order) {
      setPlacing(false);
      toast({
        title: "Couldn't place order",
        description: result.message ?? "Please try again.",
        variant: "error",
      });
      return;
    }
    const order = result.order;

    // Online payment with a real Razorpay order → open Checkout.
    if (result.razorpay) {
      try {
        await loadRazorpay();
      } catch {
        setPlacing(false);
        toast({ title: "Payment unavailable", description: "Couldn't load the payment window.", variant: "error" });
        return;
      }
      const rzp = new window.Razorpay({
        key: result.razorpay.keyId,
        order_id: result.razorpay.orderId,
        amount: result.razorpay.amount,
        currency: "INR",
        name: "ASAI.One",
        description: `Order ${order.id} · ASAI.One`,
        image: "/logo.png",
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
      rzp.open();
      return;
    }

    // COD or demo-simulated payment → straight to confirmation.
    if (result.simulated && paymentMethod !== "cod") {
      toast({ title: "Demo payment", description: "No live payment gateway configured — simulated success.", variant: "success" });
    }
    finish(order, result.accessToken);
  };

  return (
    <div>
      <Stepper steps={CHECKOUT_STEPS} current={1} className="mb-10 max-w-2xl" />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="type-display text-4xl text-navy-800 sm:text-5xl">Payment</h1>
          <p className="mt-2 text-sm text-ink-60">
            Choose how you&apos;d like to pay. Shipping to{" "}
            <span className="text-navy-800">{shipping.city}, {shipping.state}</span>.
          </p>

          {/* methods */}
          <div className="mt-8">
            <PaymentMethods value={choice} onChange={onChoice} />
          </div>

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

          {/* trust */}
          <div className="mt-8 border border-ink-12 bg-warm-white p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
                <LockIcon className="h-4 w-4" /> Secure Checkout
              </span>
              <span className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
                <ShieldIcon className="h-4 w-4" /> 256-bit Encrypted
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Razorpay", "UPI", "VISA", "Mastercard", "RuPay"].map((logo) => (
                <span key={logo} className="border border-ink-12 bg-white px-2.5 py-1 type-mono text-[10px] text-ink-60">
                  {logo}
                </span>
              ))}
            </div>
            <p className="mt-4 type-mono text-[10px] text-ink-30">
              {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
                ? "Payments are processed securely by Razorpay."
                : "Demo checkout — no real payment is processed."}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link href="/checkout/shipping" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
              ← Back to shipping
            </Link>
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary>
            <Button size="lg" full onClick={placeOrder} disabled={placing}>
              {placing
                ? "Placing order…"
                : paymentMethod === "cod"
                  ? "Place Order"
                  : "Pay & Place Order"}
            </Button>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
