"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CloseIcon, CheckIcon } from "@/components/icons";

export function CouponField() {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (coupon) {
    return (
      <div className="flex items-center justify-between border border-navy-100 bg-navy-50 px-3.5 py-3">
        <span className="inline-flex items-center gap-2 type-condensed text-xs text-navy-700">
          <CheckIcon className="h-4 w-4" /> {coupon.code} — {coupon.label}
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label="Remove coupon"
          className="text-navy-500 transition-colors hover:text-navy-800"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const result = await applyCoupon(code);
        setPending(false);
        setError(result.ok ? null : result.message);
        if (result.ok) setCode("");
      }}
    >
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Coupon code"
          aria-label="Coupon code"
          aria-invalid={error ? true : undefined}
          className="uppercase"
        />
        <Button type="submit" variant="secondary" disabled={!code.trim() || pending}>
          {pending ? "…" : "Apply"}
        </Button>
      </div>
      {error && <p className="mt-1.5 type-mono text-[10px] text-error">{error}</p>}
      <p className="mt-1.5 text-xs text-ink-30">Try RIDE10 · FREESHIP · ASAI150</p>
    </form>
  );
}
