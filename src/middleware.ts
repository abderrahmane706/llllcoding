import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ── Rate-limit store (in-memory, single-instance) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_REQUESTS = 20;

// ── Protected routes ──────────────────────────────────────────────────────────
const PROTECTED = ["/dashboard", "/quests", "/status", "/leaderboard", "/api/"];
const PUBLIC    = ["/login", "/auth/", "/_next/", "/favicon"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting on API routes ─────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "127.0.0.1";
    const now    = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else if (now - record.lastReset > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      record.count += 1;
      if (record.count > MAX_REQUESTS) {
        return new NextResponse(
          JSON.stringify({ error: "Too Many Requests" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ── Skip public paths ───────────────────────────────────────────────────────
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Supabase session refresh + auth guard ────────────────────────────────────
  // @supabase/ssr requires us to create a response object so we can forward
  // any refreshed session cookies back to the browser (PKCE / token rotation).
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          // Write refreshed tokens to both the request (for this render) and
          // the response (so the browser gets them on the next request).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  // IMPORTANT: use getUser() — never getSession() — in middleware.
  // getUser() validates the JWT against the Supabase Auth server every time,
  // preventing spoofed session cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from /login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
