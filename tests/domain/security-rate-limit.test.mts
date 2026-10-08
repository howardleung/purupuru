import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit, publicRequestIdentity, publicRequestScope, RateLimitError } from "../../apps/web/lib/rate-limit.ts";

const config = { production: true, url: "https://redis.example.test", token: "test-token" };
const response = (count: number, ttl = 30_000): typeof fetch => async () => Response.json({ result: [count, ttl] });

test("limits deny the first request above each shared scope's budget", async () => {
  for (const [scope, limit] of [["search", 60], ["mutation", 60]] as const) {
    assert.equal((await checkRateLimit(scope, "user", config, response(limit))).allowed, true);
    const blocked = await checkRateLimit(scope, "user", config, response(limit + 1));
    assert.deepEqual(blocked, { allowed: false, unavailable: false, retryAfter: 30 });
  }
});

test("configuration/outage/malformed replies fail closed in production", async () => {
  assert.equal((await checkRateLimit("search", "ip", { production: true })).allowed, false);
  assert.equal((await checkRateLimit("search", "ip", { production: false })).allowed, true);
  assert.equal((await checkRateLimit("search", "ip", { production: false, token: "partial" })).allowed, false);
  const replies: typeof fetch[] = [
    async () => { throw new Error("upstream secret must not escape"); },
    async () => new Response("sensitive upstream body", { status: 500 }),
    async () => Response.json({ result: ["1", 30000] }),
    async () => Response.json({ result: [1, -1] }),
    async () => Response.json({ result: [1, 60001] }),
    async () => Response.json({ error: "secret" }),
  ];
  for (const send of replies) {
    const result = await checkRateLimit("mutation", "id", config, send);
    assert.deepEqual(result, { allowed: false, unavailable: true, retryAfter: 60 });
    assert.doesNotMatch(new RateLimitError(result).message, /secret|upstream/);
  }
});

test("atomic expiring counters hash identities and do not follow token-bearing redirects", async () => {
  const bodies: string[] = [];
  const send: typeof fetch = async (_url, init) => {
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-token");
    const body = String(init?.body);
    assert.doesNotMatch(body, /user_sensitive_id/);
    const [command, script, keys, key, ttl] = JSON.parse(body);
    assert.equal(command, "EVAL");
    assert.match(script, /INCR/);
    assert.match(script, /PEXPIRE/);
    assert.equal(keys, "1");
    assert.match(key, /^purupuru:rl:v1:production:mutation:[a-f0-9]{64}$/);
    assert.equal(ttl, "60000");
    bodies.push(body);
    return Response.json({ result: [1, 60000] });
  };
  await checkRateLimit("mutation", "user_sensitive_id", config, send);
  await checkRateLimit("mutation", "user_sensitive_id", config, send);
  assert.equal(bodies[0], bodies[1]);
  await checkRateLimit("mutation", "other_user", config, send);
  assert.notEqual(bodies[0], bodies[2]);
});

test("client-controlled forwarding headers are never trusted outside Vercel", () => {
  const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "x-vercel-forwarded-for": "5.6.7.8" });
  assert.equal(publicRequestIdentity(headers, false), "unidentified");
  assert.equal(publicRequestIdentity(headers, true), "5.6.7.8");
  assert.equal(publicRequestIdentity(new Headers({ "x-forwarded-for": "1.2.3.4" }), true), "unidentified");
  assert.equal(publicRequestScope("/api/search"), "search");
  assert.equal(publicRequestScope("/products/toner"), null);
});

test("normal browsing, prefetch and refresh routes do not consume a public rate-limit bucket", () => {
  const browsingPaths = [
    "/",
    "/catalogue",
    "/categories",
    "/categories/toners",
    "/products/round-lab-1025-dokdo-toner",
    "/profile",
    "/collection",
    "/shopping-lists",
    "/api/categories",
  ];
  for (let request = 0; request < 1_000; request += 1) {
    for (const pathname of browsingPaths) assert.equal(publicRequestScope(pathname), null);
  }
});
