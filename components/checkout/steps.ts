import type { Step } from "@/components/ui/stepper";

/** The three checkout steps, shared across the flow's pages. */
export const CHECKOUT_STEPS: Step[] = [
  { label: "Shipping" },
  { label: "Payment" },
  { label: "Confirmation" },
];
