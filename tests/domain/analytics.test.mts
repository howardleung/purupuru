import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const hooks = registerHooks({ resolve(specifier, context, next) {
  if (specifier === "./analytics-contract") return next(new URL("../../apps/web/lib/analytics-contract.ts", import.meta.url).href, context);
  return next(specifier, context);
} });
const { AnalyticsClient, analytics, stopAnalyticsRequests } = await import("../../apps/web/lib/analytics-client.ts");
hooks.deregister();
const { analyticsRoute, readAnalyticsConsent, CONSENT_MAX_AGE } = await import("../../apps/web/lib/analytics-contract.ts");

const product = { product_family_id: "family-1", product_version_id: "version-1", product_variant_id: "variant-50" };
const outbound = { ...product, offer_id: "offer-1", retailer_id: "retailer-1", placement: "product_offer_price" as const };
const transition = { transitionId: "transition-1", productFamilyId: "family-1", productVersionId: "version-1", liked: true };
function fixture(production = true) {
  const captured: Array<{ event: string; distinct_id: string; properties: Record<string, unknown> }> = [];
  let sequence = 0;
  let now = 1000;
  const client = new AnalyticsClient((_host, event) => captured.push(event), () => `uuid-${++sequence}`, () => now);
  client.configure("test-token", "https://us.i.posthog.com", production);
  return { client, captured, ids: () => sequence, advance: (value: number) => { now = value; } };
}

test("consent decisions must be explicit, versioned, unexpired and valid", () => {
  const at = 1000;
  for (const raw of [null, "broken", "true", "{}", JSON.stringify({ version: 2, accepted: true, at }), JSON.stringify({ version: 1, accepted: "yes", at })]) {
    assert.equal(readAnalyticsConsent(raw, at), null);
  }
  const choice = (accepted: boolean) => JSON.stringify({ version: 1, accepted, at });
  assert.equal(readAnalyticsConsent(choice(true), at), true);
  assert.equal(readAnalyticsConsent(choice(false), at), false);
  assert.equal(readAnalyticsConsent(choice(true), at - 1), null);
  assert.equal(readAnalyticsConsent(choice(true), at + CONSENT_MAX_AGE), null);
});

test("nothing is collected or identified before consent, after rejection or in nonproduction", () => {
  const { client, captured, ids } = fixture();
  client.product("/products/serum", "q=private", product);
  client.outbound(outbound); client.like(transition);
  assert.equal(captured.length, 0); assert.equal(ids(), 0);
  client.setConsent(false); client.outbound(outbound);
  assert.equal(captured.length, 0);
  const dev = fixture(false); dev.client.setConsent(true); dev.client.navigate("/", "");
  assert.equal(dev.captured.length, 0); assert.equal(dev.ids(), 0);
  for (const [key, host] of [[undefined, "https://us.i.posthog.com"], ["token", undefined], ["token", "https://unknown.example"]]) {
    const disabled = fixture(); disabled.client.configure(key, host, true); disabled.client.setConsent(true); disabled.client.navigate("/", "");
    assert.equal(disabled.captured.length, 0);
  }
});

test("route allowlist excludes private tooling and emits templates without URLs, slugs, IDs or searches", () => {
  for (const path of ["/admin", "/admin/imports/123", "/design/example", "/api/test", "/profile", "/skin-map", "/sign-in", "/unknown"]) assert.equal(analyticsRoute(path), null);
  assert.deepEqual(analyticsRoute("/shopping-lists/private-list-id"), { page_path: "/shopping-lists/[id]", route_type: "shopping_list" });
  const { client, captured } = fixture(); client.setConsent(true);
  client.navigate("/products/secret-slug", "q=eczema&token=secret");
  assert.equal(captured[0].properties.page_path, "/products/[slug]");
  assert.doesNotMatch(JSON.stringify(captured), /secret|eczema|token=/);
  client.navigate("/admin/imports", ""); client.outbound(outbound); client.like(transition);
  assert.equal(captured.length, 1);
});

test("views deduplicate rerenders and effect replay, but track size changes and repeat navigation", () => {
  const { client, captured } = fixture();
  client.product("/products/serum", "size=50", product);
  client.setConsent(true);
  client.navigate("/products/serum", "size=50"); client.product("/products/serum", "size=50", product);
  assert.deepEqual(captured.map((e) => e.event), ["page_viewed", "product_viewed"]);
  client.product("/products/serum", "size=100", { ...product, product_variant_id: "variant-100" });
  assert.equal(captured.length, 4);
  client.navigate("/catalogue", ""); client.product("/products/serum", "size=50", product);
  assert.equal(captured.length, 7);
  assert.notEqual(captured[0].properties.page_view_id, captured[5].properties.page_view_id);
  assert.equal(captured[0].properties.page_view_id, captured[1].properties.page_view_id);
});

test("withdrawal stops events, clears tab identity and never replays actions when accepted again", () => {
  const { client, captured, advance } = fixture(); client.navigate("/", ""); client.setConsent(true, 2000);
  const old = captured[0].distinct_id;
  advance(2000); client.outbound(outbound); assert.equal(captured.length, 1);
  client.setConsent(false); client.outbound(outbound); client.like(transition);
  client.setConsent(true, 4000);
  assert.deepEqual(captured.map((e) => e.event), ["page_viewed", "page_viewed"]);
  assert.notEqual(captured[1].distinct_id, old);
});

test("anonymous identity stays within one tab visit and is not reused by a fresh client", () => {
  let sequence = 0;
  const events: Array<{ distinct_id: string }> = [];
  const create = () => {
    const client = new AnalyticsClient((_host, event) => events.push(event), () => `random-${++sequence}`);
    client.configure("test-token", "https://us.i.posthog.com", true);
    client.setConsent(true);
    return client;
  };
  const firstVisit = create();
  firstVisit.navigate("/catalogue", "");
  firstVisit.product("/products/serum", "", product);
  assert.equal(new Set(events.map((event) => event.distinct_id)).size, 1);
  const previousId = events[0].distinct_id;
  create().navigate("/catalogue", "");
  assert.notEqual(events.at(-1)?.distinct_id, previousId);
});

test("only explicit canonical event properties are sent, with anonymous profile processing disabled", () => {
  const { client, captured } = fixture(); client.navigate("/products/serum", ""); client.setConsent(true);
  client.product("/products/serum", "", { ...product, email: "secret@example.com", skin_map: "sensitive-answer" });
  client.outbound({ ...outbound, raw_url: "https://retailer.example/?secret=1", search: "sensitive-search" });
  client.like({ ...transition, clerkUserId: "user-secret", auth_token: "sensitive-token" });
  client.like(transition); client.like({ ...transition, transitionId: "transition-2", liked: false });
  assert.deepEqual(captured.map((e) => e.event), ["page_viewed", "product_viewed", "retailer_outbound_clicked", "like_added", "like_removed"]);
  const properties = captured[2].properties;
  assert.equal(properties.offer_id, "offer-1"); assert.equal(properties.retailer_id, "retailer-1");
  assert.equal(properties.product_variant_id, "variant-50");
  assert.equal(captured[3].properties.product_variant_id, undefined);
  assert.doesNotMatch(JSON.stringify(captured), /secret|sensitive|email|raw_url|clerkUserId|auth_token|skin_map|search|current_url|referrer/);
  for (const e of captured) { assert.equal(e.properties.$process_person_profile, false); assert.equal(e.properties.$geoip_disable, true); }
});

test("unavailable analytics transport never throws into shopping actions", () => {
  const client = new AnalyticsClient(() => { throw new Error("blocked"); }, () => "random");
  client.configure("test", "https://us.i.posthog.com", true);
  assert.doesNotThrow(() => { client.navigate("/", ""); client.setConsent(true); client.outbound(outbound); client.like(transition); });
});

test("browser transport omits credentials and referrers, and withdrawal aborts in-flight collection", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; options: RequestInit }> = [];
  globalThis.fetch = (url, options) => {
    assert.ok(options);
    requests.push({ url: String(url), options });
    return new Promise((_resolve, reject) => options.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
  };
  try {
    analytics.configure("fixture-token", "https://us.i.posthog.com", true);
    analytics.navigate("/catalogue", "q=private-text");
    analytics.setConsent(true);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://us.i.posthog.com/i/v0/e/");
    assert.equal(requests[0].options.credentials, "omit");
    assert.equal(requests[0].options.referrerPolicy, "no-referrer");
    assert.equal(requests[0].options.keepalive, true);
    assert.doesNotMatch(String(requests[0].options.body), /private-text/);
    analytics.setConsent(false); stopAnalyticsRequests();
    assert.equal(requests[0].options.signal?.aborted, true);
    analytics.outbound(outbound);
    assert.equal(requests.length, 1);
    await Promise.resolve();
  } finally { globalThis.fetch = originalFetch; analytics.setConsent(false); stopAnalyticsRequests(); }
});
