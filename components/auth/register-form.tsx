"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AuthToggle, type AuthMethod } from "@/components/auth/auth-toggle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{10}$/;

export function RegisterForm() {
  const [method, setMethod] = useState<AuthMethod>("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function switchMethod(next: AuthMethod) {
    setMethod(next);
    setErrors((p) => ({ ...p, email: "", phone: "" }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = "Please enter your name";

    if (method === "email") {
      if (!email.trim()) next.email = "Please enter your email";
      else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email";
    } else {
      if (!phone.trim()) next.phone = "Please enter your phone number";
      else if (!PHONE_RE.test(phone.trim())) next.phone = "Enter a 10-digit number";
    }

    if (!password) next.password = "Please create a password";
    else if (password.length < 8) next.password = "Use at least 8 characters";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast({
      title: "Account created",
      description: "Welcome to ASAI.One — you're all set.",
      variant: "success",
    });
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

        <AuthToggle value={method} onChange={switchMethod} idBase="register" />

        {method === "email" ? (
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
        ) : (
          <LabeledInput
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="10-digit mobile number"
            value={phone}
            error={errors.phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((p) => ({ ...p, phone: "" }));
            }}
          />
        )}

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

        <Button type="submit" size="lg" full>
          Create account
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
