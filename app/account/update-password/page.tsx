import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/ui/section";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your ASAI.One account.",
};

export default async function UpdatePasswordPage() {
  // Reached via the recovery link (which establishes a session through
  // /auth/confirm) or while already signed in. No session → link expired.
  const user = await getUser();
  if (!user) redirect("/forgot-password");

  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 animate-reveal">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Account recovery</Eyebrow>
            <h1 className="type-display text-5xl text-navy-800">New password</h1>
          </div>
          <UpdatePasswordForm />
        </div>
      </div>
    </section>
  );
}
