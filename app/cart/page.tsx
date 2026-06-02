import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your ASAI.One cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <div className="container-page py-10 sm:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="type-display mt-6 text-5xl text-navy-800 sm:text-6xl">Cart</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
