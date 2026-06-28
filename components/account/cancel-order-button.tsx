"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { cancelOrder } from "@/lib/account/order-actions";

export function CancelOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function onCancel() {
    setPending(true);
    const result = await cancelOrder(orderId);
    setPending(false);
    setConfirming(false);
    if (result.ok) {
      toast({ title: "Order cancelled", description: result.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Couldn't cancel", description: result.message, variant: "error" });
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="type-mono text-[10px] text-ink-30 underline-offset-2 hover:text-error hover:underline"
      >
        Cancel order
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        aria-label={`Confirm cancellation of order ${orderNumber}`}
        className="type-mono text-[10px] text-error underline-offset-2 hover:underline disabled:opacity-40"
      >
        {pending ? "Cancelling…" : "Confirm cancel"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="type-mono text-[10px] text-ink-30 hover:text-navy-800"
      >
        Keep
      </button>
    </span>
  );
}
