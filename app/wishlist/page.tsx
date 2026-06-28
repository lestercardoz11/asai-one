import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { HeartIcon, ArrowRightIcon } from "@/components/icons";
import { getUser } from "@/lib/auth/user";
import { getWishlistProducts } from "@/lib/wishlist/data";

export const metadata: Metadata = {
  title: "Saved items",
  description: "The products you've saved on ASAI.One.",
};

export default async function WishlistPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/wishlist");

  const products = await getWishlistProducts();

  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Account", href: "/account" },
            { label: "Saved items" },
          ]}
          className="mb-8"
        />

        <header className="animate-reveal">
          <Eyebrow>Your wishlist</Eyebrow>
          <h1 className="mt-1 type-display text-4xl text-navy-800 sm:text-5xl">Saved items</h1>
        </header>

        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="relative">
                <WishlistButton
                  productId={p.id}
                  productTitle={p.title}
                  display="icon"
                  initial={{ isAuthed: true, saved: true }}
                  className="absolute right-2 top-2 z-10"
                />
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 border border-ink-12 bg-white px-6 py-16 text-center">
            <HeartIcon className="h-8 w-8 text-ink-30" aria-hidden />
            <div>
              <p className="type-condensed text-sm text-navy-800">No saved items yet</p>
              <p className="mt-1 text-sm text-ink-60">
                Tap &ldquo;Save&rdquo; on any product to keep it here.
              </p>
            </div>
            <Link href="/shop" className={buttonVariants({ variant: "primary", size: "md" })}>
              Browse the shop
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
