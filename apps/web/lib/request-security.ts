import "server-only";

// Server/edge request boundary only. The marker rejects accidental client imports at build time.
import { checkRateLimit, type RateLimitScope } from "./rate-limit";

export function enforceRateLimit(scope: RateLimitScope, identity: string) {
  return checkRateLimit(scope, identity, {
    production: process.env.NODE_ENV === "production",
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}
