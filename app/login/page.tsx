import type { Metadata } from "next";
import { Suspense } from "react";
import { Eyebrow } from "@/components/ui/section";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to ASAI.One with email or phone to track orders and manage your account.",
};

export default function LoginPage() {
  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 animate-reveal">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Welcome back</Eyebrow>
            <h1 className="type-display text-5xl text-navy-800">Log in</h1>
          </div>
          <Suspense fallback={<div className="h-96 border border-ink-12 bg-white" aria-busy />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
