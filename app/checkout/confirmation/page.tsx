"use client";

import { useEffect, useReducer, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCheckout } from "@/lib/checkout/checkout-context";
import { getOrderForConfirmation } from "@/lib/checkout/confirmation";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { Stepper } from "@/components/ui/stepper";
import { buttonVariants } from "@/components/ui/button";
import { CheckIcon, MailIcon, TruckIcon } from "@/components/icons";
import { CHECKOUT_STEPS } from "@/components/checkout/steps";
import { OrderTimeline } from "@/components/checkout/order-timeline";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-fade" aria-busy />}>
      <ConfirmationInner />
    </Suspense>
  );
}

type FetchState =
  | { status: "idle"; order: Order | null }
  | { status: "loading" }
  | { status: "done"; order: Order | null };

type FetchAction =
  | { type: "start" }
  | { type: "done"; order: Order | null };

function fetchReducer(_: FetchState, action: FetchAction): FetchState {
  if (action.type === "start") return { status: "loading" };
  return { status: "done", order: action.order };
}

function ConfirmationInner() {
  const { lastOrder } = useCheckout();
  const params = useSearchParams();
  const [state, dispatch] = useReducer(fetchReducer, { status: "idle", order: null });

  const number = params.get("o");

  useEffect(() => {
    if (lastOrder || !number) return;
    // Token rides in the URL fragment so it's never sent to servers / Referer / logs,
    // while staying shareable and refresh-proof. Read it imperatively (client-only)
    // to avoid an SSR/hydration mismatch from touching window during render.
    const hash = window.location.hash; // e.g. "#t=<uuid>"
    const token = hash.startsWith("#t=") ? decodeURIComponent(hash.slice(3)) : null;
    dispatch({ type: "start" });
    getOrderForConfirmation({ number, token }).then((order) =>
      dispatch({ type: "done", order }),
    );
  }, [lastOrder, number]);

  const o = lastOrder ?? (state.status === "done" ? state.order : null);

  if (state.status === "loading") return <div className="h-64 animate-fade" aria-busy />;
  if (!o) {
    return (
      <div className="mx-auto max-w-md border border-ink-12 bg-white px-8 py-16 text-center">
        <h1 className="type-display text-3xl text-navy-800">No recent order</h1>
        <p className="mt-2 text-ink-60">
          Looks like there&apos;s nothing to confirm. Keep exploring the lineup.
        </p>
        <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Stepper steps={CHECKOUT_STEPS} current={2} className="mb-10 max-w-2xl" />

      <div className="mx-auto max-w-2xl">
        {/* hero */}
        <div className="border border-ink-12 bg-white p-8 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy-800 text-white">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h1 className="type-display mt-5 text-4xl text-navy-800 sm:text-5xl">
            Order Confirmed 🎉
          </h1>
          <p className="mt-3 text-ink-60">
            Thanks, {o.contactName.split(" ")[0]}. Your commute kit is on its way.
          </p>
          <div className="mt-6 inline-flex flex-col items-center gap-1 border border-ink-12 bg-near-white px-6 py-4">
            <span className="type-mono text-ink-30">Order ID</span>
            <span className="font-display text-2xl tracking-wide text-navy-800">{o.id}</span>
          </div>
        </div>

        {/* meta */}
        <div className="mt-4 grid gap-px border border-ink-12 bg-ink-12 sm:grid-cols-2">
          <InfoTile
            Icon={MailIcon}
            title="Confirmation sent"
            lines={[o.contactEmail ?? "—", o.contactPhone ?? ""]}
          />
          <InfoTile
            Icon={TruckIcon}
            title={o.paymentMethod === "cod" ? "Payment · Cash on Delivery" : "Payment · Online"}
            lines={[
              o.paymentStatus === "cod_pending" ? "Pay on delivery" : "Paid",
              "Dispatch in 24–48h",
            ]}
          />
        </div>

        {/* timeline */}
        <div className="mt-4">
          <OrderTimeline current={0} />
        </div>

        {/* items */}
        <div className="mt-4 border border-ink-12 bg-white">
          <div className="border-b border-ink-12 px-5 py-4">
            <h2 className="type-condensed text-sm text-navy-800">Order summary</h2>
          </div>
          <ul className="divide-y divide-ink-12">
            {o.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="type-condensed text-[13px] text-navy-800">
                    {item.productTitle}
                  </p>
                  <p className="type-mono text-[10px] text-ink-30">
                    {item.variantLabel} · Qty {item.qty} · {item.sku}
                  </p>
                </div>
                <span className="tabular-nums text-sm text-navy-800">
                  {formatINR(item.unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-ink-12 px-5 py-5">
            <Row label="Subtotal" value={formatINR(o.subtotal)} />
            {o.discount > 0 && <Row label="Discount" value={`− ${formatINR(o.discount)}`} muted />}
            <Row label="Shipping" value={o.shipping === 0 ? "Free" : formatINR(o.shipping)} muted />
            <div className="my-1 h-px bg-ink-12" />
            <div className="flex items-center justify-between">
              <span className="type-condensed text-sm text-navy-800">Total paid</span>
              <span className="font-condensed text-xl font-semibold tabular-nums text-navy-800">
                {formatINR(o.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            View in Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-ink-60" : "text-ink"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-ink-60" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function InfoTile({
  Icon,
  title,
  lines,
}: {
  Icon: (p: { className?: string; strokeWidth?: number }) => React.ReactElement;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex items-start gap-3 bg-white p-5">
      <Icon className="h-5 w-5 shrink-0 text-navy-500" strokeWidth={1.25} />
      <div>
        <p className="type-condensed text-xs text-navy-800">{title}</p>
        {lines.filter(Boolean).map((l, i) => (
          <p key={i} className="text-[13px] text-ink-60">{l}</p>
        ))}
      </div>
    </div>
  );
}
