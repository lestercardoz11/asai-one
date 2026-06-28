import { CheckIcon, TruckIcon } from "@/components/icons";

const STEPS = [
  { label: "Confirmed", desc: "We've got your order" },
  { label: "Packed", desc: "Prepared & dispatched in 24–48h" },
  { label: "Out for delivery", desc: "On its way to you" },
];

/** Post-purchase reassurance: where the order is in fulfilment (step 0 = now). */
export function OrderTimeline({ current = 0 }: { current?: number }) {
  return (
    <ol className="grid gap-px border border-ink-12 bg-ink-12 sm:grid-cols-3">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.label} className="flex items-start gap-3 bg-white p-5">
            <span
              aria-hidden
              className={
                "grid h-7 w-7 shrink-0 place-items-center border " +
                (done ? "border-navy-800 bg-navy-800 text-white" : "border-ink-12 bg-white text-ink-30")
              }
            >
              {i === 2 ? <TruckIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
            </span>
            <div>
              <p className="type-condensed text-xs text-navy-800">{s.label}</p>
              <p className="text-[13px] text-ink-60">{s.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
