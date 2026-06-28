"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { requestPasswordReset } from "@/lib/auth/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }
    setPending(true);
    const result = await requestPasswordReset(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      toast({ title: "Check your inbox", description: result.message, variant: "success" });
    } else {
      setError(result.message);
      toast({ title: "Couldn't send link", description: result.message, variant: "error" });
    }
  }

  if (sent) {
    return (
      <div className="border border-ink-12 bg-white p-6 sm:p-8">
        <p className="text-sm text-navy-800">
          If <span className="font-medium">{email.trim()}</span> is registered, we&apos;ve sent a
          link to reset your password. The link expires shortly — check your spam folder if you
          don&apos;t see it.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-navy-800 underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-ink-12 bg-white p-6 sm:p-8">
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <p className="text-sm text-ink-60">
          Enter the email on your account and we&apos;ll send you a link to set a new password.
        </p>
        <LabeledInput
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />
        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-60">
        Remembered it?{" "}
        <Link href="/login" className="text-navy-800 underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
