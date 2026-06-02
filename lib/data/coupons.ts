import type { Coupon } from "@/lib/types";
import { rupees } from "@/lib/format";

/** Demo coupons for the Phase 2 cart. Real rules land with the backend. */
export const COUPONS: Coupon[] = [
  {
    code: "RIDE10",
    type: "percent",
    value: 10,
    label: "10% off your order",
  },
  {
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    minSubtotal: rupees(299),
    label: "Free shipping",
  },
  {
    code: "ASAI150",
    type: "flat",
    value: rupees(150),
    minSubtotal: rupees(999),
    label: "₹150 off orders over ₹999",
  },
];
