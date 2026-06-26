"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";

export type AccountResult = { ok: boolean; message: string };

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

/** Log the real error server-side; hand the client a generic message. */
function actionError(context: string, error: unknown, message: string): AccountResult {
  console.error(`account:${context}`, error);
  return { ok: false, message };
}

export async function updateProfile(input: {
  fullName: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}): Promise<AccountResult> {
  const name = input.fullName.trim();
  if (!name) return { ok: false, message: "Please enter your name." };
  if (name.length > 120) return { ok: false, message: "That name is too long." };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      marketing_opt_in: input.marketingOptIn,
      whatsapp_opt_in: input.whatsappOptIn,
    })
    .eq("id", user.id);
  if (error) {
    return actionError("update_profile", error, "Could not save your details. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your details have been updated." };
}

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

function validateAddress(a: AddressInput): string | null {
  const required: [keyof AddressInput, number][] = [
    ["fullName", 120],
    ["line1", 200],
    ["city", 80],
    ["state", 80],
  ];
  for (const [key, max] of required) {
    const v = (a[key] ?? "").trim();
    if (!v) return "Please complete all required address fields.";
    if (v.length > max) return "One of the address fields is too long.";
  }
  if ((a.line2 ?? "").length > 200) return "One of the address fields is too long.";
  if (!toE164(a.phone)) return "Please enter a valid phone number.";
  if (!/^\d{4,10}$/.test(a.pin.trim())) return "Please enter a valid PIN code.";
  return null;
}

export async function updateDefaultAddress(input: AddressInput): Promise<AccountResult> {
  const validationError = validateAddress(input);
  if (validationError) return { ok: false, message: validationError };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const row = {
    user_id: user.id,
    full_name: input.fullName.trim(),
    phone: toE164(input.phone)!,
    line1: input.line1.trim(),
    line2: input.line2.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    postal_code: input.pin.trim(),
    country: "IN",
    is_default: true,
  };

  // Upsert the single default address: update the existing row if present,
  // otherwise insert. RLS (auth.uid() = user_id) scopes this to the caller.
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("addresses").update(row).eq("id", existing.id)
    : await supabase.from("addresses").insert(row);
  if (error) {
    return actionError("update_address", error, "Could not save your address. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your default address has been saved." };
}
