import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMode, getModes, getProductsByMode } from "@/lib/data";
import { MODE_ICONS, ArrowRightIcon } from "@/components/icons";
import { ProductCard } from "@/components/shop/product-card";
import { ProductImage } from "@/components/ui/product-image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { NotifyForm } from "@/components/shop/notify-form";

type Params = Promise<{ mode: string }>;

export async function generateStaticParams() {
  const modes = await getModes();
  return modes.map((m) => ({ mode: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { mode: slug } = await params;
  const mode = await getMode(slug);
  if (!mode) return { title: "Commute mode" };
  return {
    title:
      mode.status === "live" ? `${mode.name} Essentials` : `${mode.name} — Coming Soon`,
    description: mode.description,
  };
}

export default async function CommutePage({ params }: { params: Params }) {
  const { mode: slug } = await params;
  const mode = await getMode(slug);
  if (!mode) notFound();

  const Icon = MODE_ICONS[mode.icon];
  const products = mode.status === "live" ? await getProductsByMode(slug) : [];

  return (
    <div>
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="container-page relative grid gap-8 py-14 lg:grid-cols-12 lg:items-center lg:py-20">
          <div className="lg:col-span-7">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Commute" },
                { label: mode.name },
              ]}
              className="text-navy-300 [&_a:hover]:text-white"
            />
            <div className="mt-6 flex items-center gap-3">
              <Icon className="h-9 w-9 text-navy-200" strokeWidth={1.25} />
              {mode.status === "coming_soon" && <Badge tone="soon">Coming Soon</Badge>}
            </div>
            <h1 className="type-display mt-4 text-6xl text-white sm:text-7xl">
              {mode.name}
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-navy-100">
              {mode.description}
            </p>
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="mx-auto aspect-[4/3] max-w-md border border-navy-700">
              <ProductImage
                art={mode.bannerImage ?? { pattern: "compass", accent: 300, tone: "navy", seed: mode.slug }}
                alt={`${mode.name} commute`}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {mode.status === "live" ? (
        <section className="container-page py-14">
          <div className="flex items-end justify-between">
            <h2 className="type-condensed text-sm text-navy-800">
              {products.length} essentials
            </h2>
            <Link
              href="/shop"
              className="type-condensed inline-flex items-center gap-2 text-xs text-navy-500 hover:text-navy-800"
            >
              All products <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        </section>
      ) : (
        <ComingSoonTeaser modeName={mode.name} />
      )}
    </div>
  );
}

function ComingSoonTeaser({ modeName }: { modeName: string }) {
  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-xl border border-ink-12 bg-white p-10 text-center">
        <span className="type-mono text-navy-500">In development</span>
        <h2 className="type-display mt-3 text-4xl text-navy-800">
          {modeName} is on the way
        </h2>
        <p className="mt-3 text-ink-60">
          We&apos;re engineering the essentials for this commute mode now. Want to be
          first to know when it drops?
        </p>
        <NotifyForm modeName={modeName} />
        <Link
          href="/commute/2-wheeler"
          className="type-condensed mt-8 inline-flex items-center gap-2 text-xs text-navy-500 hover:text-navy-800"
        >
          Meanwhile, shop 2-Wheeler <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
