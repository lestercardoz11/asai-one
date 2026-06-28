import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cookieless anon Supabase client for **public catalogue reads**.
 *
 * Unlike the SSR server client, this has no per-request cookie/session binding,
 * so it is safe to call during static generation (`generateStaticParams`) and in
 * Server Components without a request context. Row access is the public, RLS-gated
 * read surface (active products/variants/categories/coupons).
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function publicClient() {
  if (cached) return cached;
  cached = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}
