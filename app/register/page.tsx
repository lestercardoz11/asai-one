import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/section";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create your ASAI.One account to track orders, save addresses and get ride-ready drops.",
};

export default function RegisterPage() {
  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 animate-reveal">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Join the crew</Eyebrow>
            <h1 className="type-display text-5xl text-navy-800">Create account</h1>
          </div>
          <RegisterForm />
        </div>
      </div>
    </section>
  );
}
