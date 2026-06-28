"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { updatePassword } from "@/lib/auth/actions";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await updatePassword(password);
    setPending(false);
    if (result.ok) {
      toast({ title: "Password updated", description: result.message, variant: "success" });
      router.push("/account");
      router.refresh();
    } else {
      setErrors({ password: result.message });
      toast({ title: "Couldn't update", description: result.message, variant: "error" });
    }
  }

  return (
    <div className="border border-ink-12 bg-white p-6 sm:p-8">
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <LabeledInput
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((p) => ({ ...p, password: "" }));
          }}
        />
        <LabeledInput
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          error={errors.confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((p) => ({ ...p, confirm: "" }));
          }}
        />
        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
