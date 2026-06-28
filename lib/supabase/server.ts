import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Server Supabase client (Server Components, Server Actions, Route Handlers).
 * Bound to the request cookies so the user's session is read and refreshed.
 *
 * Next.js 16: `cookies()` is async — await it before building the client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` called from a Server Component, where cookies are
            // read-only. Safe to ignore — `proxy.ts` refreshes the session.
          }
        },
      },
    },
  );
}
