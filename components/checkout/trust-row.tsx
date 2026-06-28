import { LockIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const SIGNALS = [
  { Icon: LockIcon, label: "Secure Checkout" },
  { Icon: ShieldIcon, label: "256-bit Encrypted" },
  { Icon: TruckIcon, label: "Easy Returns" },
];

const LOGOS = ["Razorpay", "UPI", "VISA", "Mastercard", "RuPay"];

/** Reusable trust signals + accepted-payment logos for cart/checkout. */
export function TrustRow({ live }: { live?: boolean }) {
  return (
    <div className="border border-ink-12 bg-warm-white p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {SIGNALS.map(({ Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2 type-condensed text-xs text-navy-800">
            <Icon className="h-4 w-4" /> {label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {LOGOS.map((logo) => (
          <span key={logo} className="border border-ink-12 bg-white px-2.5 py-1 type-mono text-[10px] text-ink-60">
            {logo}
          </span>
        ))}
      </div>
      <p className="mt-4 type-mono text-[10px] text-ink-30">
        {live ? "Payments are processed securely by Razorpay." : "Demo checkout — no real payment is processed."}
      </p>
    </div>
  );
}
