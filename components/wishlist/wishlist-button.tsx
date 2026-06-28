"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { toggleWishlist, getWishlistState, type WishlistState } from "@/lib/wishlist/actions";

interface Props {
  productId: string;
  productTitle: string;
  /** Provide when the caller already knows the state (skips the hydrate fetch). */
  initial?: WishlistState;
  /** "button" — labelled control (product page). "icon" — compact toggle. */
  display?: "button" | "icon";
  className?: string;
}

export function WishlistButton({ productId, productTitle, initial, display = "button", className }: Props) {
  const router = useRouter();
  const [state, setState] = useState<WishlistState | null>(initial ?? null);
  const [pending, setPending] = useState(false);

  // Self-hydrate when the caller didn't supply state (keeps product pages static).
  useEffect(() => {
    if (initial) return;
    let active = true;
    getWishlistState(productId).then((s) => {
      if (active) setState(s);
    });
    return () => {
      active = false;
    };
  }, [productId, initial]);

  const saved = state?.saved ?? false;

  async function onClick() {
    if (state && !state.isAuthed) {
      toast({ title: "Log in to save", description: "Sign in to keep a wishlist." });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (pending) return;
    setPending(true);
    const optimistic = !saved;
    setState((s) => (s ? { ...s, saved: optimistic } : { isAuthed: true, saved: optimistic }));
    const result = await toggleWishlist(productId);
    setPending(false);
    if (!result.ok) {
      setState((s) => (s ? { ...s, saved: !optimistic } : s));
      toast({ title: "Couldn't update", description: result.message ?? "Please try again.", variant: "error" });
      return;
    }
    setState({ isAuthed: true, saved: result.saved });
    toast({
      title: result.saved ? "Saved" : "Removed",
      description: `${productTitle} ${result.saved ? "added to" : "removed from"} your saved items.`,
      variant: "success",
    });
  }

  const label = saved ? "Saved" : "Save";

  if (display === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${productTitle} from saved items` : `Save ${productTitle}`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center border border-ink-12 bg-white text-navy-800 transition-colors hover:border-navy-800 disabled:opacity-40",
          saved && "border-navy-800 text-error",
          className,
        )}
      >
        <HeartIcon className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "type-condensed inline-flex h-14 items-center justify-center gap-2 border px-6 text-sm transition-colors",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        saved
          ? "border-navy-800 bg-navy-50 text-navy-800"
          : "border-ink-12 bg-white text-navy-800 hover:border-navy-800",
        className,
      )}
    >
      <HeartIcon className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden />
      {label}
    </button>
  );
}
