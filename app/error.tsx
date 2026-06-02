"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to monitoring (Phase 7).
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="type-mono text-error">Something went wrong</p>
      <h1 className="type-display mt-3 text-5xl text-navy-800 sm:text-6xl">
        A wheel came loose
      </h1>
      <p className="mt-3 max-w-sm text-ink-60">
        An unexpected error occurred. Try again — it&apos;s usually a one-off.
      </p>
      <Button size="lg" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
