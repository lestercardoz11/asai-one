"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LabeledInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AuthToggle, type AuthMethod } from "@/components/auth/auth-toggle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{10}$/;

export function LoginForm() {
  const [method, setMethod] = useState<AuthMethod>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function switchMethod(next: AuthMethod) {
    setMethod(next);
    setErrors({});
    setOtpSent(false);
  }

  function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Please enter your email";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email";
    if (!password) next.password = "Please enter your password";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast({
      title: "Logged in",
      description: "Welcome back to ASAI.One.",
      variant: "success",
    });
  }

  function handleSendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!phone.trim()) next.phone = "Please enter your phone number";
    else if (!PHONE_RE.test(phone.trim())) next.phone = "Enter a 10-digit number";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setOtpSent(true);
    setOtp(["", "", "", "", "", ""]);
    toast({ title: "OTP sent (demo)", description: `Code sent to ${phone}.`, variant: "success" });
  }

  function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.some((d) => d === "")) {
      setErrors({ otp: "Enter all 6 digits" });
      return;
    }
    setErrors({});
    toast({ title: "Logged in", description: "Welcome back to ASAI.One.", variant: "success" });
  }

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = digit;
      return copy;
    });
    setErrors((prev) => (prev.otp ? {} : prev));
    if (digit) {
      const nextEl = document.getElementById(`otp-${index + 1}`);
      nextEl?.focus();
    }
  }

  return (
    <div className="border border-ink-12 bg-white p-6 sm:p-8">
      <AuthToggle value={method} onChange={switchMethod} idBase="login" />

      {method === "email" ? (
        <form
          noValidate
          id="login-panel-email"
          role="tabpanel"
          aria-labelledby="login-tab-email"
          className="mt-6 flex flex-col gap-5"
          onSubmit={handleEmailSubmit}
        >
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
          <Button type="submit" size="lg" full>
            Log in
          </Button>
        </form>
      ) : !otpSent ? (
        <form
          noValidate
          id="login-panel-phone"
          role="tabpanel"
          aria-labelledby="login-tab-phone"
          className="mt-6 flex flex-col gap-5"
          onSubmit={handleSendOtp}
        >
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
          <Button type="submit" size="lg" full>
            Send OTP
          </Button>
        </form>
      ) : (
        <form
          noValidate
          id="login-panel-phone"
          role="tabpanel"
          aria-labelledby="login-tab-phone"
          className="mt-6 flex flex-col gap-5"
          onSubmit={handleOtpSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <span className="type-mono text-ink-60">
              Enter OTP <span className="text-error">*</span>
            </span>
            <div className="flex gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${i + 1}`}
                  aria-invalid={errors.otp ? true : undefined}
                  value={digit}
                  onChange={(e) => updateOtp(i, e.target.value)}
                  className="h-12 w-full border bg-white text-center text-lg text-ink transition-colors focus:border-navy-500 focus:outline-none aria-[invalid=true]:border-error"
                />
              ))}
            </div>
            {errors.otp && (
              <p className="type-mono text-[10px] text-error">{errors.otp}</p>
            )}
            <p className="text-xs text-ink-30">Demo: enter any 6 digits to continue.</p>
          </div>
          <Button type="submit" size="lg" full>
            Verify &amp; log in
          </Button>
        </form>
      )}

      <p className="mt-6 border-t border-ink-12 pt-4 text-xs text-ink-30">
        Email path → email reminders · Phone path → WhatsApp reminders
      </p>

      <p className="mt-4 text-center text-sm text-ink-60">
        New here?{" "}
        <Link href="/register" className="text-navy-800 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
