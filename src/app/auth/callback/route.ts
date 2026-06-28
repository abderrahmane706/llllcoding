import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth Callback Handler
 * Supabase redirects here after Google OAuth completes.
 * Exchanges the one-time `code` for a session stored in HttpOnly cookies.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // After successful OAuth, ensure the user row exists in our Prisma DB.
      // We do this by redirecting through the app — getPlayerProfile() in
      // data.ts will create the row on the first page load if it is missing.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — send back to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
