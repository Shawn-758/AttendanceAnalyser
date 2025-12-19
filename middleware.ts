// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ratelimit = new Map();

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const limit = 5; // Limit to 5 requests
    const windowMs = 60 * 1000; // per 1 minute

    if (!ratelimit.has(ip)) {
      ratelimit.set(ip, { count: 0, startTime: Date.now() });
    }

    const currentData = ratelimit.get(ip);
    
    // Reset window if time passed
    if (Date.now() - currentData.startTime > windowMs) {
      currentData.count = 0;
      currentData.startTime = Date.now();
    }

    currentData.count += 1;

    if (currentData.count > limit) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};