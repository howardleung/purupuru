export type RateLimitScope = "search" | "browse" | "mutation";
export type RateLimitResult = { allowed: boolean; unavailable: boolean; retryAfter: number };
export type RateLimitConfiguration = {
  production: boolean;
  url?: string;
  token?: string;
};

const LIMITS: Record<RateLimitScope, number> = { search: 60, browse: 120, mutation: 60 };
const WINDOW_MS = 60_000;
// Atomic fixed window: concurrent/serverless instances share the same counter.
const COUNTER_SCRIPT = `local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end
return {n, ttl}`;

export class RateLimitError extends Error {
  constructor(result: RateLimitResult) {
    super(result.unavailable
      ? "Saving is temporarily unavailable. Please try again shortly."
      : `Too many changes. Please try again in ${result.retryAfter} seconds.`);
    this.name = "RateLimitError";
  }
}

/** Only the deployed Vercel ingress is trusted to supply client IP headers. */
export function publicRequestIdentity(headers: Headers, onVercel: boolean): string {
  if (!onVercel) return "unidentified";
  const value = headers.get("x-vercel-forwarded-for")?.trim();
  return value && value.length <= 64 && /^[a-fA-F0-9:.]+$/.test(value) ? value : "unidentified";
}

export function publicRequestScope(pathname: string): RateLimitScope {
  return pathname === "/api/search" ? "search" : "browse";
}

export async function checkRateLimit(
  scope: RateLimitScope,
  identity: string,
  configuration: RateLimitConfiguration,
  send: typeof fetch = fetch,
): Promise<RateLimitResult> {
  const unavailable = { allowed: false, unavailable: true, retryAfter: 60 };
  if (!configuration.url && !configuration.token && !configuration.production) {
    return { allowed: true, unavailable: false, retryAfter: 0 };
  }
  try {
    if (!configuration.url || !configuration.token) return unavailable;
    const url = new URL(configuration.url);
    // Configuration is operator-owned, never request input; disallow token-bearing redirects.
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      (url.pathname !== "/" && url.pathname !== "")) return unavailable;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const key = `purupuru:rl:v1:${configuration.production ? "production" : "development"}:${scope}:${hash}`;
    const response = await send(url.origin, {
      method: "POST",
      headers: { Authorization: `Bearer ${configuration.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", COUNTER_SCRIPT, "1", key, String(WINDOW_MS)]),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(1_500),
    });
    if (!response.ok) return unavailable;
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || !("result" in payload) ||
      !Array.isArray(payload.result)) return unavailable;
    const [count, ttl] = payload.result;
    if (typeof count !== "number" || typeof ttl !== "number" ||
      !Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(ttl) || ttl < 0 || ttl > WINDOW_MS) {
      return unavailable;
    }
    return { allowed: count <= LIMITS[scope], unavailable: false, retryAfter: Math.max(1, Math.ceil(ttl / 1000)) };
  } catch {
    // Never expose datastore URLs, tokens, upstream bodies, or network exception text.
    return unavailable;
  }
}
