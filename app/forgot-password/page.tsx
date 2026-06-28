import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/section";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a link to reset your ASAI.One account password.",
};

export default function ForgotPasswordPage() {
  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 animate-reveal">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Account recovery</Eyebrow>
            <h1 className="type-display text-5xl text-navy-800">Forgot password</h1>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
