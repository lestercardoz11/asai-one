"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastRecord extends ToastInput {
  id: number;
}

type Listener = (toast: ToastRecord) => void;

const listeners = new Set<Listener>();
let counter = 0;

/** Fire a toast from anywhere (client). No-op until a viewport is mounted. */
export function toast(input: ToastInput) {
  const record: ToastRecord = { id: ++counter, variant: "default", ...input };
  listeners.forEach((l) => l(record));
}

const TIMEOUT = 3200;

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  useEffect(() => {
    const onToast: Listener = (record) => {
      setToasts((prev) => [...prev, record]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== record.id));
      }, TIMEOUT);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "animate-reveal pointer-events-auto flex w-full max-w-sm items-start gap-3 border bg-white px-4 py-3 shadow-[0_1px_0_0_rgba(10,10,10,0.12)]",
            t.variant === "error" && "border-error",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full",
              t.variant === "success" && "bg-navy-500",
              t.variant === "error" && "bg-error",
              t.variant === "default" && "bg-navy-800",
            )}
          />
          <div className="flex-1">
            <p className="type-condensed text-[13px] text-navy-800">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-sm text-ink-60">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="type-mono text-ink-30 transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
