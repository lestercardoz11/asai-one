"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CheckIcon } from "@/components/icons";

/** Mock launch-notification capture. Wired to Resend/WhatsApp in Phase 5. */
export function NotifyForm({ modeName }: { modeName: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="mt-7 inline-flex items-center gap-2 border border-navy-100 bg-navy-50 px-4 py-3 type-condensed text-xs text-navy-700">
        <CheckIcon className="h-4 w-4" /> You&apos;re on the list for {modeName}.
      </p>
    );
  }

  return (
    <form
      className="mt-7 flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
        toast({
          title: "You're on the list",
          description: `We'll email you when ${modeName} launches.`,
          variant: "success",
        });
      }}
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email for launch updates"
      />
      <Button type="submit" className="shrink-0">
        Notify me
      </Button>
    </form>
  );
}
