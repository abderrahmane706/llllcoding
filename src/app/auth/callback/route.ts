import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * OAuth Callback Handler — production-safe implementation.
 *
 * Why this file uses createServerClient directly (not our createClient() wrapper):
 * After exchangeCodeForSession(), Supabase needs to write the session tokens as
 * cookies on the HTTP *response*, not just the request cookie store.
 * Our shared createClient() helper targets Server Components where cookie writes
 * are silently discarded. Here we need a NextResponse-aware cookie handler so
 * the session is actually persisted to the browser.
 *
 * Origin resolution:
 * On Vercel, request.url resolves to an internal container address.
 * We derive the true public origin from x-forwarded-host so the final redirect
 * uses https://shinkatrack-rho.vercel.app instead of http://0.0.0.0:3000.
 */
export async function GET(request: Request) {
  const requestUrl    = new URL(request.url);
  const code          = requestUrl.searchParams.get("code");
  const next          = requestUrl.searchParams.get("next") ?? "/";

  // ── Production-safe public origin ─────────────────────────────────────────
  const forwardedHost  = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`   // → https://shinkatrack-rho.vercel.app
    : requestUrl.origin;                        // → http://localhost:3000 (local dev)
  // ───────────────────────────────────────────────────────────────────────────

  // Guard: if there is no code, nothing to exchange
  if (!code) {
    console.warn("[auth/callback] No code param received — aborting.");
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Validate env vars are present before attempting client creation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("[auth/callback] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.");
    return NextResponse.redirect(`${origin}/login?error=server-config`);
  }

  try {
    // Build a NextResponse so we can attach the session cookies to the reply
    const response = NextResponse.redirect(`${origin}${next}`);
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Write session tokens to BOTH the cookie store (server-side reads)
          // and the response headers (so the browser actually stores them).
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]); } catch { /* ignore */ }
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`);
    }

    // ✅ Session stored — redirect to app
    return response;

  } catch (err) {
    // Catch any unexpected server crash and redirect gracefully
    console.error("[auth/callback] Unexpected server error:", err);
    return NextResponse.redirect(`${origin}/login?error=server-crash`);
  }
}
