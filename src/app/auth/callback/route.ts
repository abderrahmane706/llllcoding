import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Hardcoded production origin — reliable fallback if forwarded headers are absent
const PRODUCTION_ORIGIN = "https://shinkatrack-rho.vercel.app";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    // Derive the active origin dynamically so local dev still works.
    // Falls back to the hardcoded production domain if headers are missing.
    const forwardedHost  = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const origin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : (process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : new URL(request.url).origin);

    if (!code) {
      console.warn("[auth/callback] No code param — redirecting to login.");
      return NextResponse.redirect(`${origin}/login?error=no_code`);
    }

    // Guard: fail fast if env vars are missing rather than throwing a cryptic 500
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("[auth/callback] Missing Supabase env vars.");
      return NextResponse.redirect(`${PRODUCTION_ORIGIN}/?error=server_config`);
    }

    // Build the success redirect response BEFORE we create the supabase client
    // so we can attach the session cookies directly to it.
    const successResponse = NextResponse.redirect(`${origin}${next}`);

    // @supabase/ssr v0.6.x uses getAll / setAll (NOT get/set/remove)
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Write to cookieStore so server-side reads in this request work
            try {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            } catch { /* read-only context — ignore */ }

            // Write to the response so the browser actually stores the tokens
            successResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof successResponse.cookies.set>[2]
            );
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`);
    }

    // ✅ Session persisted to cookies — send the user into the app
    return successResponse;

  } catch (globalError) {
    // Safety net: never let this route throw a raw 500 — always redirect gracefully
    console.error("[auth/callback] Fatal exception:", globalError);
    return NextResponse.redirect(`${PRODUCTION_ORIGIN}/?error=server_exception`);
  }
}
