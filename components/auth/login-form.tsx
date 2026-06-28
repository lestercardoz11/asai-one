"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { signInWithPassword } from "@/lib/auth/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only allow same-origin relative paths — block open redirects (//evil, /\evil).
  const explicitRedirect = params.get("redirect");
  const rawRedirect = explicitRedirect || "/account";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.startsWith("/\\")
      ? rawRedirect
      : "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Please enter your email";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email";
    if (!password) next.password = "Please enter your password";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await signInWithPassword(email, password);
    setPending(false);
    if (result.ok) {
      toast({ title: "Logged in", description: result.message, variant: "success" });
      // Admins with no explicit target land in /admin; everyone else at /account.
      const dest = explicitRedirect ? redirectTo : result.isAdmin ? "/admin" : "/account";
      router.push(dest);
      router.refresh();
    } else {
      toast({ title: "Couldn't log in", description: result.message, variant: "error" });
    }
  }

  return (
    <div className="border border-ink-12 bg-white p-6 sm:p-8">
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <LabeledInput
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((p) => ({ ...p, email: "" }));
          }}
        />
        <LabeledInput
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((p) => ({ ...p, password: "" }));
          }}
        />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="type-mono text-[11px] text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-60">
        New here?{" "}
        <Link href="/register" className="text-navy-800 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
