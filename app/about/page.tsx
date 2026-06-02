import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import {
  CompassMark,
  TwoWheelerIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "ASAI.One designs practical, well-designed essentials that make everyday commuting safer, more hygienic, and more comfortable. We make every journey better.",
};

const principles = [
  {
    icon: TwoWheelerIcon,
    title: "Functional First",
    body: "Every product is built around a real commuter need — never features for their own sake.",
  },
  {
    icon: CompassMark,
    title: "Minimal by Design",
    body: "No unnecessary complexity. Good design isn't about adding more — it's about solving better.",
  },
  {
    icon: ShieldIcon,
    title: "Reliable Performance",
    body: "Considered materials and honest engineering you can depend on, ride after ride.",
  },
  {
    icon: CheckIcon,
    title: "Effortless to Use",
    body: "Easy to fit and easy to live with — accessible essentials for everyday commuting.",
  },
];

export default function AboutPage() {
  return (
    <div className="animate-reveal">
      {/* Hero / intro */}
      <section className="bg-grid border-b border-ink-12">
        <div className="container-page py-20 sm:py-24">
          <div className="max-w-3xl">
            <Eyebrow>About ASAI.One</Eyebrow>
            <h1 className="type-display mt-4 text-5xl text-navy-800 sm:text-6xl">
              We make every journey better.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-60">
              ASAI.One designs practical solutions that make everyday movement more
              comfortable and convenient — your trusted partner for safe and
              comfortable commuting, across every way you travel.
            </p>
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="border-b border-ink-12">
        <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>The Idea</Eyebrow>
            <h2 className="type-display mt-3 text-4xl text-navy-800 sm:text-5xl">
              Essential tools, not accessories.
            </h2>
          </div>
          <div className="flex flex-col gap-5 text-ink-60">
            <p className="leading-relaxed">
              ASAI.One was born from a simple observation: commuting is full of small,
              overlooked discomforts we&apos;ve all just learned to live with. Rather
              than accept them, we set out to fix them — creating practical,
              well-designed essentials that improve the daily commute through better
              safety, hygiene, and comfort.
            </p>
            <p className="leading-relaxed">
              We think of our products as essential tools rather than accessories.
              Each one is functional, reliable, and thoughtfully designed — modern
              utility built around how people actually move, whether that&apos;s on two
              wheels, in a car, or on public transport.
            </p>
            <p className="leading-relaxed text-ink">
              Good design is not about adding more — it&apos;s about solving better.
            </p>
            <p className="leading-relaxed">
              That philosophy shapes everything we make, from our base in Pune,
              Maharashtra. We&apos;re starting with the 2-Wheeler rider, with more
              commute modes on the way — so you can shop by exactly how you get there.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-warm-white border-b border-ink-12">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 className="type-display mt-3 text-4xl text-navy-800 sm:text-5xl">
              Built on a few firm principles.
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-px border border-ink-12 bg-ink-12 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4 bg-warm-white p-6">
                <Icon className="h-8 w-8 text-navy-500" aria-hidden />
                <h3 className="type-condensed text-lg text-navy-800">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="bg-navy-800 text-white">
        <div className="container-page flex flex-col items-start gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="type-mono inline-flex items-center gap-2 text-navy-200">
              <span aria-hidden className="h-px w-6 bg-navy-300" />
              Start with two wheels
            </span>
            <h2 className="type-display mt-4 text-4xl sm:text-5xl">
              Find the gear that fits your ride.
            </h2>
            <p className="mt-4 text-navy-100">
              Browse the 2-Wheeler collection — functional commuter essentials, ready
              to ship across India.
            </p>
          </div>
          <Link
            href="/shop"
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "shrink-0",
            })}
          >
            Shop 2-Wheeler
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
