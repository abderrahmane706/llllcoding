import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * OAuth Callback Handler
 * Supabase redirects here after Google OAuth completes.
 * Exchanges the one-time `code` for a session stored in HttpOnly cookies.
 *
 * Production-safe origin resolution:
 * On Vercel (and most reverse proxies), request.url uses an internal address.
 * We derive the true public origin from the x-forwarded-host / host headers
 * to guarantee the redirect uses the real https:// domain in production.
 */
export async function GET(request: Request) {
  const requestUrl  = new URL(request.url);
  const code        = requestUrl.searchParams.get("code");
  const next        = requestUrl.searchParams.get("next") ?? "/";

  // ── Production-safe origin ─────────────────────────────────────────────────
  // Vercel sets x-forwarded-host to the public hostname (e.g. your-app.vercel.app).
  // Fall back to requestUrl.origin for local development.
  const forwardedHost  = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;
  // ───────────────────────────────────────────────────────────────────────────

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the originally requested path (or homepage).
      // getPlayerProfile() in data.ts will auto-create the Prisma user row
      // on first load if this is a brand-new Google OAuth user.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code exchange failed — redirect back to login with error flag.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
