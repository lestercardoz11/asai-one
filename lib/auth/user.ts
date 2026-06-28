import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth data-access layer. `verifySession`-style helpers, memoized per request
 * with React `cache` so repeated calls in a render don't re-hit Supabase.
 * Authorization decisions go through `is_admin()`, which reads the server-only
 * JWT `app_metadata.role` claim (the `admin_roles` table was dropped in the
 * 2026-06-27 rebuild) — never user-editable metadata.
 */

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, phone, full_name, marketing_opt_in, whatsapp_opt_in")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return data === true;
});
