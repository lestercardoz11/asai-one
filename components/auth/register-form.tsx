"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { signUpWithPassword } from "@/lib/auth/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!email.trim()) next.email = "Please enter your email";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email";
    if (!password) next.password = "Please create a password";
    else if (password.length < 8) next.password = "Use at least 8 characters";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await signUpWithPassword({
      name,
      email,
      password,
      marketingOptIn,
      whatsappOptIn,
    });
    setPending(false);
    if (result.ok) {
      if (result.needsConfirmation) {
        // No session yet — show a "check your inbox" state instead of bouncing to /account.
        setConfirmEmail(email.trim());
        return;
      }
      toast({ title: "Account created", description: result.message, variant: "success" });
      router.push("/account");
      router.refresh();
    } else {
      toast({ title: "Couldn't sign up", description: result.message, variant: "error" });
    }
  }

  if (confirmEmail) {
    return (
      <div className="border border-ink-12 bg-white p-6 text-center sm:p-8">
        <h2 className="type-condensed text-lg text-navy-800">Confirm your email</h2>
        <p className="mt-3 text-sm text-ink-60">
          We sent a confirmation link to <span className="text-navy-800">{confirmEmail}</span>. Open it
          to activate your account, then log in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block type-condensed text-xs text-navy-500 hover:text-navy-800"
        >
          Go to login →
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-ink-12 bg-white p-6 sm:p-8">
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <LabeledInput
          label="Name"
          autoComplete="name"
          required
          value={name}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((p) => ({ ...p, name: "" }));
          }}
        />

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

        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Communication preferences</legend>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none border border-ink-12 bg-white checked:border-navy-800 checked:bg-navy-800 focus:outline-none focus-visible:border-navy-500"
            />
            Send me ride-ready drops &amp; offers
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none border border-ink-12 bg-white checked:border-navy-800 checked:bg-navy-800 focus:outline-none focus-visible:border-navy-500"
            />
            Send order &amp; reminder updates on WhatsApp
          </label>
        </fieldset>

        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-60">
        Already have an account?{" "}
        <Link href="/login" className="text-navy-800 underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
