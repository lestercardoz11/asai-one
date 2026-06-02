import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { UserIcon, MailIcon, PhoneIcon, PinIcon, TruckIcon, ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "My account",
  description: "Your ASAI.One account — orders, details and saved addresses.",
};

/** Phase 2 demo: hardcoded signed-in-looking user (no real auth/backend). */
const DEMO_USER = {
  name: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "+91 98765 43210",
  address: "Add a default delivery address",
} as const;

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "A";
}

export default function AccountPage() {
  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Account" }]}
          className="mb-8"
        />

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-reveal">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center border border-navy-800 bg-navy-800 type-display text-2xl text-white"
            >
              {initialOf(DEMO_USER.name)}
            </span>
            <div>
              <Eyebrow>My account</Eyebrow>
              <h1 className="mt-1 type-display text-4xl text-navy-800 sm:text-5xl">
                {DEMO_USER.name}
              </h1>
            </div>
          </div>
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            Log out
          </Link>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Orders */}
          <section aria-labelledby="orders-heading">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-navy-500" aria-hidden />
              <h2 id="orders-heading" className="type-condensed text-sm text-navy-800">
                Orders
              </h2>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4 border border-ink-12 bg-white px-6 py-16 text-center">
              <TruckIcon className="h-8 w-8 text-ink-30" aria-hidden />
              <div>
                <p className="type-condensed text-sm text-navy-800">No orders yet</p>
                <p className="mt-1 text-sm text-ink-60">
                  When you place an order, it&apos;ll show up here.
                </p>
              </div>
              <Link
                href="/"
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                Start shopping
                <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-4 flex items-start gap-3 border border-ink-12 bg-white p-5">
              <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              <div>
                <p className="type-mono text-ink-30">Track order</p>
                <p className="mt-1 text-sm text-ink-60">
                  Have an order on the way? You can track it from the confirmation email
                  or text we send once it ships.
                </p>
              </div>
            </div>
          </section>

          {/* Account details */}
          <section aria-labelledby="details-heading">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-navy-500" aria-hidden />
              <h2 id="details-heading" className="type-condensed text-sm text-navy-800">
                Account details
              </h2>
            </div>

            <dl className="mt-4 flex flex-col gap-px border border-ink-12 bg-ink-12">
              <div className="flex items-start gap-3 bg-white p-5">
                <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
                <div>
                  <dt className="type-mono text-ink-30">Name</dt>
                  <dd className="mt-1 text-[15px] text-navy-800">{DEMO_USER.name}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-5">
                <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
                <div>
                  <dt className="type-mono text-ink-30">Email</dt>
                  <dd className="mt-1 text-[15px] text-navy-800">{DEMO_USER.email}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-5">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
                <div>
                  <dt className="type-mono text-ink-30">Phone</dt>
                  <dd className="mt-1 text-[15px] text-navy-800">{DEMO_USER.phone}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-5">
                <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
                <div>
                  <dt className="type-mono text-ink-30">Default address</dt>
                  <dd className="mt-1 text-[15px] text-ink-30">{DEMO_USER.address}</dd>
                </div>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
