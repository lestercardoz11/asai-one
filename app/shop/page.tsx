import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Every ASAI.One commuter essential — filter by price and collection, sort, and add to cart.",
};

type SortParam = "featured" | "price-asc" | "price-desc" | "rating" | "new";

function normalizeSort(value: string | string[] | undefined): SortParam {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "best") return "rating";
  if (v === "new") return "new";
  if (v === "price-asc" || v === "price-desc" || v === "rating" || v === "featured")
    return v;
  return "featured";
}

export default async function ShopPage({
  searchParams,
}: {
  // In Next 16, searchParams is a Promise — must be awaited.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [products, sp] = await Promise.all([getProducts(), searchParams]);
  const initialSort = normalizeSort(sp.sort);
  const initialQuery = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";

  return (
    <div className="container-page py-10 sm:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <header className="mt-6 max-w-2xl">
        <h1 className="type-display text-5xl text-navy-800 sm:text-6xl">Shop</h1>
        <p className="mt-3 text-ink-60">
          The full ASAI.One lineup. Functional, minimal kit for the daily ride —
          all 2-Wheeler essentials, available now.
        </p>
      </header>

      <div className="mt-10">
        <ShopBrowser
          products={products}
          initialSort={initialSort}
          initialQuery={initialQuery}
        />
      </div>
    </div>
  );
}
