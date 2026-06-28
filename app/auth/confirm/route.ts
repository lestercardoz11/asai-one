import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth email-link handler. Supabase recovery / signup-confirm / email-change /
 * magic-link emails redirect here. We support BOTH delivery styles so the route
 * works regardless of the project's email-template configuration:
 *   • `token_hash` + `type`  → verifyOtp (default Supabase templates)
 *   • `code`                 → exchangeCodeForSession (PKCE flow)
 *
 * On success the session cookie is set and we forward to `next` (validated to a
 * same-origin relative path to block open redirects). On failure we send the
 * user to /login with a generic notice — no detail that aids enumeration.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/account";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/account";

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }
    console.error("auth:confirm:verifyOtp", error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }
    console.error("auth:confirm:exchangeCode", error);
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "auth_link_invalid");
  return NextResponse.redirect(redirectTo);
}
