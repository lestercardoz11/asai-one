"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientIp, withinRateLimit } from "@/lib/security/rate-limit";

export type AuthResult = {
  ok: boolean;
  message: string;
  isAdmin?: boolean;
  /** True when signup succeeded but the user must confirm their email before a session exists. */
  needsConfirmation?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Absolute site origin for building email redirect links (no trailing slash). */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Never echo raw Supabase auth errors to the client — they differ between
 * "user not found" / "wrong password" / "email not confirmed" and enable account
 * enumeration. Log the real error server-side; return a generic message.
 */
function authError(context: string, error: unknown, message: string): AuthResult {
  console.error(`auth:${context}`, error);
  return { ok: false, message };
}

/** Normalise a 10-digit Indian mobile (or a +E.164 number) to E.164. */
function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const ip = await clientIp();
  // Throttle credential stuffing / brute force: 10 attempts per IP per 5 min.
  if (!(await withinRateLimit({ key: `signin:${ip}`, limit: 10, windowSeconds: 300 }))) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return authError("signin", error, "Invalid email or password.");
  revalidatePath("/", "layout");
  // Surface admin status so the client can route admins straight to /admin.
  const isAdmin = (data.user?.app_metadata as { role?: string } | undefined)?.role === "admin";
  return { ok: true, message: "Welcome back to ASAI.One.", isAdmin };
}

export async function signUpWithPassword(input: {
  name: string;
  email: string;
  password: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}): Promise<AuthResult> {
  const ip = await clientIp();
  // Cap account creation: 5 per IP per hour.
  if (!(await withinRateLimit({ key: `signup:${ip}`, limit: 5, windowSeconds: 3600 }))) {
    return { ok: false, message: "Too many sign-up attempts. Please try again later." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.name.trim() } },
  });
  if (error) return authError("signup", error, "Could not create your account. Please try again.");

  if (data.session && data.user) {
    await supabase
      .from("profiles")
      .update({
        full_name: input.name.trim(),
        marketing_opt_in: input.marketingOptIn,
        whatsapp_opt_in: input.whatsappOptIn,
      })
      .eq("id", data.user.id);
    revalidatePath("/", "layout");
    return { ok: true, message: "Welcome to ASAI.One — you're all set." };
  }
  return {
    ok: true,
    needsConfirmation: true,
    message: "Account created. Check your email to confirm, then log in.",
  };
}

export async function sendPhoneOtp(
  phone: string,
  shouldCreateUser: boolean,
): Promise<AuthResult & { phone?: string }> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Enter a valid 10-digit number." };
  // Prevent SMS toll-fraud: 3 OTP sends per number per hour, plus a per-IP cap.
  const ip = await clientIp();
  if (
    !(await withinRateLimit({ key: `otp:${e164}`, limit: 3, windowSeconds: 3600 })) ||
    !(await withinRateLimit({ key: `otp-ip:${ip}`, limit: 15, windowSeconds: 3600 }))
  ) {
    return { ok: false, message: "Too many code requests. Please wait before trying again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: { shouldCreateUser },
  });
  if (error) return authError("otp_send", error, "Could not send the code. Please try again.");
  return { ok: true, message: `OTP sent to ${e164}.`, phone: e164 };
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
  profile?: { name: string; marketingOptIn: boolean; whatsappOptIn: boolean },
): Promise<AuthResult> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Invalid phone number." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: token.trim(),
    type: "sms",
  });
  if (error) return authError("otp_verify", error, "That code is invalid or expired.");
  if (profile && data.user) {
    await supabase
      .from("profiles")
      .update({
        full_name: profile.name.trim(),
        marketing_opt_in: profile.marketingOptIn,
        whatsapp_opt_in: profile.whatsappOptIn,
      })
      .eq("id", data.user.id);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "You're logged in." };
}

/**
 * Begin a password reset. Supabase emails a recovery link to `email`; clicking
 * it lands on `/auth/confirm`, which establishes a session and forwards to the
 * update-password page. We ALWAYS return the same message regardless of whether
 * the address exists — never confirm or deny account existence (enumeration).
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const trimmed = email.trim();
  const generic = {
    ok: true,
    message: "If that email is registered, a reset link is on its way.",
  };
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const ip = await clientIp();
  // Cap reset emails: 5 per IP per hour + 3 per address per hour (anti-abuse).
  if (
    !(await withinRateLimit({ key: `pwreset-ip:${ip}`, limit: 5, windowSeconds: 3600 })) ||
    !(await withinRateLimit({ key: `pwreset:${trimmed}`, limit: 3, windowSeconds: 3600 }))
  ) {
    // Still a generic-shaped response — don't leak that the address is known.
    return generic;
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent("/account/update-password")}`,
  });
  if (error) console.error("auth:password_reset", error);
  return generic;
}

/**
 * Set a new password for the current session. Used by the post-recovery page,
 * where the recovery link has already established a session via `/auth/confirm`.
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (newPassword.length < 8) return { ok: false, message: "Use at least 8 characters." };
  if (newPassword.length > 72) return { ok: false, message: "That password is too long." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your reset link has expired. Please request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return authError("password_update", error, "Could not update your password. Please try again.");
  revalidatePath("/", "layout");
  return { ok: true, message: "Your password has been updated. You're all set." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
