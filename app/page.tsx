import Link from "next/link";
import { getModes, getFeaturedProducts } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section";
import { ModeCard } from "@/components/shop/mode-card";
import { ProductCard } from "@/components/shop/product-card";
import { Carousel } from "@/components/shop/carousel";
import { ProductImage } from "@/components/ui/product-image";
import {
  ArrowRightIcon,
  TruckIcon,
  ShieldIcon,
  CompassMark,
  CheckIcon,
} from "@/components/icons";

const WHY = [
  {
    Icon: CompassMark,
    title: "Designed for Daily Commutes",
    body: "Every product earns its place in your kit by solving a real, repeated problem on the ride.",
  },
  {
    Icon: ShieldIcon,
    title: "Functional & Minimal",
    body: "No gimmicks, no clutter. Considered materials, honest engineering, built to be used.",
  },
  {
    Icon: CheckIcon,
    title: "Built for Convenience",
    body: "Easy to fit, easy to live with. Kit that disappears into your routine until you need it.",
  },
  {
    Icon: TruckIcon,
    title: "Fast Shipping",
    body: "Dispatched within 24–48h from Pune. Free shipping on orders over ₹499.",
  },
];

export default async function HomePage() {
  const [modes, featured] = await Promise.all([
    getModes(),
    getFeaturedProducts(),
  ]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <div className="container-page relative grid gap-10 py-20 lg:grid-cols-12 lg:items-center lg:py-28">
          <div className="lg:col-span-7">
            <span className="type-mono inline-flex items-center gap-2 text-navy-200">
              <span aria-hidden className="h-px w-6 bg-navy-300" />
              Mode-based commuter essentials
            </span>
            <h1 className="type-display mt-5 text-6xl leading-[0.9] text-white sm:text-7xl lg:text-8xl">
              Gear for
              <br />
              <span className="text-navy-200">how you</span> commute.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-navy-100">
              ASAI.One makes functional, minimal essentials for the daily ride.
              Shop by your mode — starting with everything that makes two wheels
              better.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/commute/2-wheeler"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Shop 2-Wheeler
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/shop"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  className:
                    "border-navy-600 bg-transparent text-navy-600 hover:bg-mist-100",
                })}
              >
                Browse all
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-px border border-navy-700 bg-navy-700">
              {[
                ["5", "Products live"],
                ["24h", "Dispatch"],
                ["4.6★", "Avg. rating"],
              ].map(([stat, label]) => (
                <div key={label} className="bg-navy-900 px-4 py-4">
                  <dt className="font-display text-3xl text-white">{stat}</dt>
                  <dd className="type-mono mt-1 text-[10px] text-navy-300">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto aspect-square max-w-md border border-navy-700">
              <ProductImage
                art={{ pattern: "compass", accent: 300, tone: "navy", seed: "hero" }}
                alt="ASAI.One — navigate your commute"
                priority
              />
              <span className="absolute bottom-0 left-0 type-mono bg-white px-3 py-2 text-[10px] text-navy-800">
                ASAI · EST. PUNE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How do you commute? ───────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="How do you commute?"
          title="Choose your mode"
          subtitle="Pick your commute type to explore the essentials built for it. Three more modes are on the way."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode) => (
            <ModeCard key={mode.id} mode={mode} />
          ))}
        </div>
      </section>

      {/* ── Featured products ─────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="The 2-Wheeler lineup"
              title="Featured essentials"
            />
            <Link
              href="/shop"
              className="type-condensed inline-flex items-center gap-2 text-xs text-navy-800 hover:text-navy-500"
            >
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <Carousel label="Featured products">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </Carousel>
          </div>
        </div>
      </section>

      {/* ── Why ASAI.One? ─────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why ASAI.One?"
          title="Made for the ride, not the shelf"
          align="center"
          className="mx-auto"
        />
        <div className="mt-12 grid grid-cols-1 gap-px border border-ink-12 bg-ink-12 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-4 bg-white p-7">
              <Icon className="h-8 w-8 text-navy-500" strokeWidth={1.25} />
              <h3 className="type-condensed text-sm text-navy-800">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-60">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────────── */}
      <section className="bg-navy-800">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="type-display text-4xl text-white sm:text-5xl">
            Ready to ride better?
          </h2>
          <p className="max-w-md text-navy-100">
            Start with the 2-Wheeler kit trusted by daily commuters across India.
          </p>
          <Link
            href="/commute/2-wheeler"
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "bg-white",
            })}
          >
            Shop 2-Wheeler <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
