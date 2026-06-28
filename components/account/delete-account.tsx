"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { deleteAccount } from "@/lib/account/actions";

export function DeleteAccount({ hasEmail }: { hasEmail: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (confirmation.trim().toUpperCase() !== "DELETE") {
      setError('Type "DELETE" to confirm.');
      return;
    }
    if (hasEmail && !password) {
      setError("Enter your password to confirm.");
      return;
    }
    setPending(true);
    const result = await deleteAccount({
      confirmation,
      password: hasEmail ? password : undefined,
    });
    setPending(false);
    if (result.ok) {
      toast({ title: "Account deleted", description: result.message, variant: "success" });
      router.push("/");
      router.refresh();
    } else {
      setError(result.message);
      toast({ title: "Couldn't delete", description: result.message, variant: "error" });
    }
  }

  return (
    <section aria-labelledby="danger-heading" className="mt-12">
      <h2 id="danger-heading" className="type-condensed text-sm text-error">
        Danger zone
      </h2>
      <div className="mt-4 border border-error/40 bg-white p-5">
        <p className="text-sm text-navy-800">Delete your account</p>
        <p className="mt-1 text-sm text-ink-60">
          This permanently removes your profile, saved addresses and wishlist. Past orders are kept
          for legal and accounting records. This cannot be undone.
        </p>

        {!open ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="mt-4 border-error/40 text-error hover:border-error"
            onClick={() => setOpen(true)}
          >
            Delete account
          </Button>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
            {hasEmail && (
              <LabeledInput
                label="Current password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
            )}
            <LabeledInput
              label='Type "DELETE" to confirm'
              required
              value={confirmation}
              error={error}
              placeholder="DELETE"
              onChange={(e) => {
                setConfirmation(e.target.value);
                setError("");
              }}
            />
            <div className="flex gap-3">
              <Button
                type="submit"
                size="md"
                disabled={pending}
                className="bg-error text-white border-error hover:opacity-90"
              >
                {pending ? "Deleting…" : "Permanently delete"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setOpen(false);
                  setError("");
                  setPassword("");
                  setConfirmation("");
                }}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
