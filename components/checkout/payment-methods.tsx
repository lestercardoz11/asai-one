"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";

export type PayChoice = "online" | "cod";

const CHOICES: { id: PayChoice; label: string; desc: string; logos: string[] }[] = [
  {
    id: "online",
    label: "Pay Online",
    desc: "UPI · Cards · Net Banking · Wallets",
    logos: ["UPI", "VISA", "Mastercard", "RuPay"],
  },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", logos: [] },
];

export function PaymentMethods({
  value,
  onChange,
}: {
  value: PayChoice;
  onChange: (v: PayChoice) => void;
}) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
      {CHOICES.map((c) => {
        const active = value === c.id;
        return (
          <label
            key={c.id}
            className={cn(
              "flex cursor-pointer items-center gap-4 border bg-white p-4 transition-colors",
              active ? "border-navy-800" : "border-ink-12 hover:border-navy-300",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                active ? "border-navy-800" : "border-ink-30",
              )}
            >
              {active && <span className="h-2.5 w-2.5 rounded-full bg-navy-800" />}
            </span>
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={active}
              onChange={() => onChange(c.id)}
            />
            <span className="flex-1">
              <span className="type-condensed block text-sm text-navy-800">{c.label}</span>
              <span className="block text-[13px] text-ink-60">{c.desc}</span>
              {c.logos.length > 0 && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {c.logos.map((logo) => (
                    <span
                      key={logo}
                      className="border border-ink-12 bg-near-white px-2 py-0.5 type-mono text-[9px] text-ink-60"
                    >
                      {logo}
                    </span>
                  ))}
                </span>
              )}
            </span>
            {active && <CheckIcon className="h-5 w-5 text-navy-500" />}
          </label>
        );
      })}
    </div>
  );
}
