import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory store for rate limiting (works for single-instance / local deployments)
// In a distributed serverless environment, you'd use Upstash Redis here.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Max 10 requests per minute for APIs

export function middleware(request: NextRequest) {
  // Only apply rate limiting to the authentication and API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const now = Date.now();
    
    const record = rateLimitMap.get(ip);
    
    if (!record) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      if (now - record.lastReset > RATE_LIMIT_WINDOW) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        record.count += 1;
        if (record.count > MAX_REQUESTS) {
          return new NextResponse(
            JSON.stringify({ error: "Too Many Requests. Please try again later." }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
