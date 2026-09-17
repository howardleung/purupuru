import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { isClerkConfigured } from "./lib/clerk-config";
import { enforceRateLimit } from "./lib/request-security";
import { publicRequestIdentity, publicRequestScope } from "./lib/rate-limit";

// Discovery routes remain public. Private reads and state-changing actions
// enforce authentication and ownership at their server boundary.
const authenticate = clerkMiddleware();

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.url.length > 4096) {
    return NextResponse.json({ error: "Request URL is too long." }, { status: 414 });
  }
  // Do not interfere with Clerk's own session transport. Assets are excluded by matcher.
  if (!request.nextUrl.pathname.startsWith("/__clerk/")) {
    const result = await enforceRateLimit(
      publicRequestScope(request.nextUrl.pathname),
      publicRequestIdentity(request.headers, process.env.VERCEL === "1"),
    );
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.unavailable ? "Service temporarily unavailable." : "Too many requests." },
        { status: result.unavailable ? 503 : 429, headers: {
          "Retry-After": String(result.retryAfter), "Cache-Control": "no-store",
        } },
      );
    }
  }
  return isClerkConfigured ? authenticate(request, event) : NextResponse.next();
}

export const config = {
  matcher: [
    // Match dotted dynamic routes and action POSTs too; only actual Next assets bypass.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
