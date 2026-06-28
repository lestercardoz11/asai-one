import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/data";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/shop/product-card";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { JsonLd } from "@/components/seo/json-ld";
import { TruckIcon, ReturnIcon, ShieldIcon } from "@/components/icons";

type Params = Promise<{ slug: string }>;

// ISR — catalogue refreshes without a redeploy (build-plan §7 caching strategy).
export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://asai.one";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product" };
  const ogImage = product.images.map((i) => i.src).find(Boolean);
  return {
    title: product.title,
    description: product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: "summary_large_image", images: ogImage ? [ogImage] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  const prices = product.variants.map((v) => v.price);
  const inStock = product.variants.some((v) => v.stock > 0);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "ASAI.One" },
    image: product.images
      .map((img) => img.src)
      .filter((src): src is string => Boolean(src))
      // Storage URLs are already absolute; only prefix the site origin for /public paths.
      .map((src) => (src.startsWith("http") ? src : `${SITE}${src}`)),
    aggregateRating:
      product.reviewSummary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.reviewSummary.rating,
            reviewCount: product.reviewSummary.count,
          }
        : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: prices.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-page py-8 pb-28 sm:pb-12">
      <JsonLd data={productLd} />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.title },
        ]}
      />

      {/* ── Main: gallery + purchase ─────────────────────────────────────── */}
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.isNew && <Badge tone="new">New</Badge>}
            {product.isBestSeller && <Badge tone="soon">Best Seller</Badge>}
            <Badge tone={product.returnPolicy === "returnable" ? "returnable" : "non-returnable"}>
              {product.returnPolicy === "returnable" ? "Returnable" : "Non-Returnable"}
            </Badge>
          </div>

          <h1 className="type-display mt-4 text-5xl text-navy-800 sm:text-6xl">
            {product.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-60">
            {product.shortDescription}
          </p>
          <div className="mt-4">
            <Rating summary={product.reviewSummary} />
          </div>

          <div className="mt-8">
            <ProductPurchase product={product} />
          </div>

          <div className="mt-4">
            <WishlistButton
              productId={product.id}
              productTitle={product.title}
              display="button"
              className="w-full sm:w-auto"
            />
          </div>

          {/* policy strip */}
          <div className="mt-8 grid grid-cols-1 gap-px border border-ink-12 bg-ink-12 sm:grid-cols-3">
            <PolicyTile Icon={TruckIcon} label="Shipping" value={product.shippingPolicy} />
            <PolicyTile
              Icon={ReturnIcon}
              label="Returns"
              value={
                product.returnPolicy === "returnable"
                  ? "7-day easy returns"
                  : "Non-returnable item"
              }
            />
            <PolicyTile Icon={ShieldIcon} label="Secure" value="Encrypted checkout" />
          </div>

          {/* Product-specific return policy takes precedence over the general one. */}
          <p className="mt-3 text-[12px] leading-snug text-ink-30">
            This item is{" "}
            <span className="text-navy-800">
              {product.returnPolicy === "returnable" ? "returnable" : "non-returnable"}
            </span>
            . Return eligibility varies by product; this product-specific policy takes
            precedence over our general{" "}
            <Link
              href="/refund-policy"
              className="text-navy-500 underline-offset-4 hover:underline"
            >
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* ── Details: description / features / specs ──────────────────────── */}
      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="type-condensed text-sm text-navy-800">Overview</h2>
          <p className="mt-4 leading-relaxed text-ink-60">{product.longDescription}</p>

          <h3 className="type-condensed mt-10 text-sm text-navy-800">What you get</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 border border-ink-12 bg-white p-4 text-sm text-ink-60"
              >
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-navy-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-5">
          <h3 className="type-condensed text-sm text-navy-800">Specifications</h3>
          <dl className="mt-4 border border-ink-12 bg-white">
            {product.specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                  i % 2 ? "bg-warm-white" : "bg-white"
                }`}
              >
                <dt className="type-mono text-ink-60">{spec.label}</dt>
                <dd className="text-right text-sm text-navy-800">{spec.value}</dd>
              </div>
            ))}
          </dl>

          {/* review summary block — only when there are real reviews */}
          {product.reviewSummary.count > 0 && (
            <div className="mt-6 border border-ink-12 bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl text-navy-800">
                  {product.reviewSummary.rating.toFixed(1)}
                </span>
                <div>
                  <Rating summary={product.reviewSummary} showCount={false} />
                  <p className="mt-1 type-mono text-ink-30">
                    {product.reviewSummary.count} verified reviews
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Related ──────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="type-display text-3xl text-navy-800 sm:text-4xl">
            More 2-Wheeler essentials
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PolicyTile({
  Icon,
  label,
  value,
}: {
  Icon: (p: { className?: string; strokeWidth?: number }) => React.ReactElement;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white p-4">
      <Icon className="h-5 w-5 shrink-0 text-navy-500" strokeWidth={1.25} />
      <div>
        <p className="type-mono text-ink-30">{label}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-60">{value}</p>
      </div>
    </div>
  );
}
