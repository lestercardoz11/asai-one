import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Best-effort client IP from proxy headers (Vercel/Cloudflare set these). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limit backed by the `check_rate_limit` SQL function. Returns
 * true when the request is WITHIN the limit (allowed), false when it should be
 * blocked. Fails OPEN on infrastructure errors (or when persistence isn't
 * configured) so a limiter outage can't lock every user out.
 */
export async function withinRateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  if (!process.env.SUPABASE_SECRET_KEY) return true; // demo mode — no backing store
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: opts.key,
      p_limit: opts.limit,
      p_window_seconds: opts.windowSeconds,
    });
    if (error) {
      console.error("withinRateLimit: rpc failed (failing open)", error);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("withinRateLimit: error (failing open)", e);
    return true;
  }
}
