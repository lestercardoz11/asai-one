"use client";

import { cn } from "@/lib/utils";

export type AuthMethod = "email" | "phone";

const OPTIONS: { value: AuthMethod; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

/** Sharp-edged segmented control: active = navy fill, inactive = white hairline. */
export function AuthToggle({
  value,
  onChange,
  idBase,
}: {
  value: AuthMethod;
  onChange: (value: AuthMethod) => void;
  idBase: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Login method"
      className="grid grid-cols-2 gap-px border border-ink-12 bg-ink-12"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            id={`${idBase}-tab-${opt.value}`}
            aria-selected={active}
            aria-controls={`${idBase}-panel-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={cn(
              "type-condensed h-11 text-xs transition-colors",
              active
                ? "bg-navy-800 text-white"
                : "bg-white text-ink-60 hover:text-navy-800",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
