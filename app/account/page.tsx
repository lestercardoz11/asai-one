import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/ui/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { getProfile } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { UserIcon, TruckIcon, ArrowRightIcon } from "@/components/icons";
import { AccountDetails } from "@/components/account/account-details";
import type { AccountDetailsData } from "@/components/account/account-details";
import { AddressEditor } from "@/components/account/address-editor";
import type { AddressInput } from "@/lib/account/actions";

export const metadata: Metadata = {
  title: "My account",
  description: "Your ASAI.One account — orders, details and saved addresses.",
};

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "A";
}

export default async function AccountPage() {
  // `proxy.ts` already gates /account, but re-check at the data layer.
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/account");

  const displayName = profile.full_name?.trim() || profile.email?.split("@")[0] || "Rider";

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_paise, placed_at")
    .order("placed_at", { ascending: false })
    .limit(10);

  const { data: address } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, line2, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();

  const detailsData: AccountDetailsData = {
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    marketingOptIn: profile.marketing_opt_in ?? false,
    whatsappOptIn: profile.whatsapp_opt_in ?? false,
  };

  const addressForm: AddressInput = {
    fullName: address?.full_name ?? profile.full_name ?? "",
    phone: address?.phone ?? profile.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state || "Maharashtra",
    pin: address?.postal_code ?? "",
  };

  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Account" }]}
          className="mb-8"
        />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-reveal">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center border border-navy-800 bg-navy-800 type-display text-2xl text-white"
            >
              {initialOf(displayName)}
            </span>
            <div>
              <Eyebrow>My account</Eyebrow>
              <h1 className="mt-1 type-display text-4xl text-navy-800 sm:text-5xl">
                {displayName}
              </h1>
            </div>
          </div>
          <LogoutButton
            className={buttonVariants({ variant: "secondary", size: "md" })}
          />
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

            {orders && orders.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-px border border-ink-12 bg-ink-12">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-4 bg-white p-5">
                    <div>
                      <p className="type-condensed text-sm text-navy-800">{o.order_number}</p>
                      <p className="mt-0.5 type-mono text-[10px] uppercase text-ink-30">
                        {o.status}
                      </p>
                    </div>
                    <p className="font-condensed text-base font-semibold tabular-nums text-navy-800">
                      {formatINR(o.total_paise)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-4 border border-ink-12 bg-white px-6 py-16 text-center">
                <TruckIcon className="h-8 w-8 text-ink-30" aria-hidden />
                <div>
                  <p className="type-condensed text-sm text-navy-800">No orders yet</p>
                  <p className="mt-1 text-sm text-ink-60">
                    When you place an order, it&apos;ll show up here.
                  </p>
                </div>
                <Link href="/" className={buttonVariants({ variant: "primary", size: "md" })}>
                  Start shopping
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </section>

          {/* Account details */}
          <section aria-labelledby="details-heading">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-navy-500" aria-hidden />
              <h2 id="details-heading" className="type-condensed text-sm text-navy-800">
                Account details
              </h2>
            </div>

            <AccountDetails initial={detailsData} />
            <AddressEditor initial={addressForm} hasAddress={!!address} />
          </section>
        </div>
      </div>
    </section>
  );
}

