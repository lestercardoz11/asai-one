"use server";

import { getCoupon } from "@/lib/data";
import type { Coupon } from "@/lib/types";

/**
 * Validate a coupon code against the live catalogue. Runs on the server so the
 * coupon rules stay authoritative; the cart only applies the returned record.
 * (Minimum-subtotal and final pricing are re-checked server-side at checkout.)
 */
export async function validateCouponAction(
  code: string,
): Promise<{ ok: boolean; coupon?: Coupon; message: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "Enter a coupon code." };
  const coupon = await getCoupon(trimmed);
  if (!coupon) return { ok: false, message: "That code isn't valid." };
  return { ok: true, coupon, message: `${coupon.label} applied.` };
}
