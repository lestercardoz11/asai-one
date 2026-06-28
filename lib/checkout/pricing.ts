import type { Coupon } from "@/lib/types";

/**
 * Single source of truth for cart money rules — used by both the client cart and
 * the server order actions so totals can never disagree. (Build-plan §12 #6:
 * shipping/coupon rules are provisional defaults pending client confirmation.)
 */
export const SHIPPING_FLAT = 4900; // ₹49 in paise
export const FREE_SHIP_THRESHOLD = 49900; // ₹499 in paise

export function computeTotals(
  subtotal: number,
  coupon: Coupon | null,
): { shipping: number; discount: number; total: number } {
  let shipping = subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FLAT;
  let discount = 0;
  if (coupon && (!coupon.minSubtotal || subtotal >= coupon.minSubtotal)) {
    if (coupon.type === "percent") {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === "flat") {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === "free_shipping") {
      shipping = 0;
    }
  }
  const total = Math.max(0, subtotal - discount) + shipping;
  return { shipping, discount, total };
}
