import type { Metadata } from "next";
import { CheckoutProvider } from "@/lib/checkout/checkout-context";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your ASAI.One order — shipping, payment, confirmation.",
  robots: { index: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CheckoutProvider>
      <div className="container-page py-10 sm:py-12">{children}</div>
    </CheckoutProvider>
  );
}
