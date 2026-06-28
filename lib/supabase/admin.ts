import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client. **Bypasses RLS** — use ONLY in trusted
 * server-side contexts that have no user session and must act with full
 * privilege: payment webhooks, the abandoned-cart job, system writes.
 *
 * NEVER import this into a Client Component or expose the key to the browser.
 * Requires the `SUPABASE_SECRET_KEY` (not a `NEXT_PUBLIC_` var).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set — required for privileged server operations (webhooks, lifecycle jobs).",
    );
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
