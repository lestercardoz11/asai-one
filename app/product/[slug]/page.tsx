import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/data";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/shop/product-card";
import { TruckIcon, ReturnIcon, ShieldIcon } from "@/components/icons";

type Params = Promise<{ slug: string }>;

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
  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: { title: product.title, description: product.shortDescription },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="container-page py-8 pb-28 sm:pb-12">
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
              {product.returnPolicy === "returnable" ? "Returnable" : "Final sale"}
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

          {/* review summary block */}
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
