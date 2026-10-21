import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { isLikeInput, parseLikeIntent, LIKE_INTENT_MAX_AGE_SECONDS } from "../../packages/domain/src/likes.ts";

type Input = { productSlug: string; productVersionId: string; liked: boolean };
const rows = new Set<string>();
let user: { id: string; clerkUserId: string } | null = null;
let valid = true;
let active = true;
let fail = false;
let failRead = false;
let cookiesSet: Record<string, unknown> | null = null;
let intent: string | undefined;
const writes: string[] = [];
let catalogueIds: readonly string[] = [];
const tx = {
  productVersion: {
    async findFirst({ where }: { where: { id: string; productFamily: { slug: string } } }) {
      return valid && where.productFamily.slug === "serum" && ["formula-a", "formula-b"].includes(where.id)
        ? { id: where.id, variants: active ? [{ id: "size-50" }] : [] } : null;
    },
  },
  productLike: {
    async createMany({ data, skipDuplicates }: { data: { userId: string; productVersionId: string }; skipDuplicates: boolean }) {
      assert.equal(skipDuplicates, true);
      if (fail) throw new Error("Database unavailable");
      rows.add(`${data.userId}:${data.productVersionId}`); writes.push("like");
    },
    async deleteMany({ where }: { where: { userId: string; productVersionId: string } }) {
      rows.delete(`${where.userId}:${where.productVersionId}`); writes.push("unlike");
    },
    async findMany({ where }: { where: { userId: string } }) {
      if (failRead) throw Object.assign(new Error("The table public.ProductLike does not exist"), { code: "P2021" });
      return [...rows].filter((key) => key.startsWith(`${where.userId}:`))
        .map((key) => ({ productVersionId: key.slice(where.userId.length + 1), productVersion: { versionName: "Saved formula", productFamily: { slug: "serum", canonicalName: "Serum", brand: { name: "Brand" } } } }));
    },
  },
};
const boundary = {
  prisma: { ...tx },
  async auth() { return { userId: user?.clerkUserId ?? null }; },
  async getCatalogue(options: { productVersionIds: readonly string[] }) {
    catalogueIds = options.productVersionIds;
    return { products: [{ id: "size-100", currentVersion: { id: "formula-b" } }] };
  },
  async getMutationUser() { return user; },
  async getCurrentUser() { return user; },
  async runSerializable(operation: (client: typeof tx) => Promise<unknown>) { return operation(tx); },
  async cookies() { return {
    get() { return intent ? { value: intent } : undefined; },
    set(_name: string, value: string, options: Record<string, unknown>) { intent = value; cookiesSet = options; },
    delete() { intent = undefined; },
  }; },
};
Object.assign(globalThis, { __purupuruLikesTest: boundary });
const root = "globalThis.__purupuruLikesTest";
const hooks = registerHooks({
  resolve(specifier, context, next) {
    const stubs: Record<string, string> = {
      "server-only": "export {};",
      "@beauty-platform/database": `export const prisma=${root}.prisma;`,
      "@clerk/nextjs/server": `export const auth=${root}.auth;`,
      "next/headers": `export const cookies=${root}.cookies;`,
      "next/cache": "export function revalidatePath() {}",
      "./transactions": `export const runSerializable=${root}.runSerializable;`,
      "../../lib/current-user": `export const getCurrentUser=${root}.getCurrentUser;export const getMutationUser=${root}.getMutationUser;`,
      "./catalogue": `export const getCatalogue=${root}.getCatalogue;`,
    };
    if (specifier in stubs) return { url: `data:text/javascript,${encodeURIComponent(stubs[specifier])}`, shortCircuit: true };
    if (specifier === "../../lib/likes") return next(new URL("../../apps/web/lib/likes.ts", import.meta.url).href, context);
    if (specifier === "../../lib/rate-limit") return next(new URL("../../apps/web/lib/rate-limit.ts", import.meta.url).href, context);
    return next(specifier, context);
  },
});
const { setLikeForUser, getLikedProductsForUser } = await import("../../apps/web/lib/likes.ts");
const { setProductLike, readLikes, prepareLikeAuthentication, cancelPendingLike, completePendingLike } = await import("../../apps/web/app/likes/actions.ts");
hooks.deregister();

const target = { productSlug: "serum", productVersionId: "formula-a" };
function reset() {
  rows.clear(); writes.length = 0; user = { id: "alice", clerkUserId: "clerk-alice" };
  valid = true; active = true; fail = false; failRead = false; intent = undefined; cookiesSet = null;
}

test("Like inputs require explicit boolean state and valid version/product context", () => {
  for (const value of [null, {}, { ...target, liked: "true" }, { ...target, productVersionId: "", liked: true }]) {
    assert.equal(isLikeInput(value), false);
  }
  assert.equal(isLikeInput({ ...target, liked: false }), true);
});

test("set-to-liked is idempotent, shared across sizes, and independent between formulas", async () => {
  reset();
  const input: Input = { ...target, liked: true };
  await setLikeForUser("alice", input);
  await setLikeForUser("alice", { ...input, productVersionId: "formula-b" });
  await setLikeForUser("alice", input);
  assert.deepEqual([...rows], ["alice:formula-a", "alice:formula-b"]);
  await setLikeForUser("alice", { ...input, liked: false });
  await setLikeForUser("alice", { ...input, liked: false });
  assert.deepEqual([...rows], ["alice:formula-b"]);
});

test("authentication and ownership are server-derived, including attempted user-ID injection", async () => {
  reset(); user = null;
  assert.equal((await setProductLike({ ...target, liked: true })).status, "UNAUTHENTICATED");
  assert.equal(rows.size, 0);
  user = { id: "alice", clerkUserId: "clerk-alice" };
  await setProductLike({ ...target, liked: true, userId: "bob" });
  await setLikeForUser("bob", { ...target, liked: true });
  await setProductLike({ ...target, liked: false, userId: "bob" });
  assert.deepEqual([...rows], ["bob:formula-a"]);
  assert.deepEqual((await readLikes()).versionIds, []);
});

test("invalid, mismatched, or unavailable versions cannot gain Likes; old Likes remain removable", async () => {
  reset();
  assert.equal((await setProductLike({ ...target, productSlug: "different-family", liked: true })).status, "INVALID");
  active = false;
  assert.equal((await setProductLike({ ...target, liked: true })).status, "INVALID");
  rows.add("alice:formula-a");
  assert.equal((await setProductLike({ ...target, liked: false })).status, "SUCCESS");
  assert.equal(rows.size, 0);
});

test("auth continuation stores only an expiring HTTP-only request and completes once", async () => {
  reset(); user = null;
  assert.equal((await prepareLikeAuthentication(target)).status, "SUCCESS");
  assert.equal(rows.size, 0);
  assert.equal(cookiesSet?.httpOnly, true);
  assert.equal(cookiesSet?.sameSite, "lax");
  assert.equal(cookiesSet?.maxAge, LIKE_INTENT_MAX_AGE_SECONDS);
  user = { id: "alice", clerkUserId: "clerk-alice" };
  assert.equal((await completePendingLike())?.status, "SUCCESS");
  assert.equal(await completePendingLike(), null);
  assert.deepEqual(writes, ["like"]);
});

test("dismissal, expiry, and product removal do not save the pending Like", async () => {
  reset();
  await prepareLikeAuthentication(target);
  await cancelPendingLike();
  assert.equal(await completePendingLike(), null);
  const now = Date.now();
  assert.equal(parseLikeIntent(JSON.stringify({ ...target, expiresAt: now - 1 }), now), null);
  assert.equal(parseLikeIntent(JSON.stringify({ ...target, expiresAt: now + 86400000 }), now), null);
  assert.equal(parseLikeIntent("not-json"), null);
  await prepareLikeAuthentication(target); valid = false;
  assert.equal((await completePendingLike())?.status, "INVALID");
  assert.equal(rows.size, 0);
});

test("unexpected persistence failure is surfaced without reporting a saved Like", async () => {
  reset(); fail = true;
  const originalError = console.error;
  console.error = () => undefined;
  try { assert.equal((await setProductLike({ ...target, liked: true })).status, "ERROR"); }
  finally { console.error = originalError; }
  assert.equal(rows.size, 0);
});

test("missing-table Like reads return recoverable errors rather than empty saved state", async () => {
  reset(); failRead = true;
  const originalError = console.error;
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]) => { logs.push(args); };
  try {
    const result = await readLikes();
    assert.equal(result.status, "ERROR");
    assert.equal("versionIds" in result, false);
    assert.match(String(logs[0]?.[0]), /migration 20261020120000_add_product_likes/);
  } finally { console.error = originalError; }
  failRead = false;
  assert.equal((await readLikes()).status, "SUCCESS");
});

test("a failed auth save retains its intent and succeeds exactly once when persistence recovers", async () => {
  reset();
  await prepareLikeAuthentication(target);
  const originalIntent = intent;
  fail = true;
  const originalError = console.error;
  console.error = () => undefined;
  try { assert.equal((await completePendingLike())?.status, "ERROR"); }
  finally { console.error = originalError; }
  assert.equal(intent, originalIntent);
  fail = false;
  assert.equal((await completePendingLike())?.status, "SUCCESS");
  assert.equal(await completePendingLike(), null);
  assert.deepEqual(writes, ["like"]);
});

test("a successful auth save followed by a read failure is not repeated on retry", async () => {
  reset();
  await prepareLikeAuthentication(target);
  assert.equal((await completePendingLike())?.status, "SUCCESS");
  failRead = true;
  const originalError = console.error;
  console.error = () => undefined;
  try { assert.equal((await readLikes()).status, "ERROR"); }
  finally { console.error = originalError; }
  failRead = false;
  assert.equal(await completePendingLike(), null);
  assert.equal((await readLikes()).status, "SUCCESS");
  assert.deepEqual(writes, ["like"]);
});

test("unauthenticated handoff attempts do not discard the original request", async () => {
  reset(); user = null;
  await prepareLikeAuthentication(target);
  assert.equal((await completePendingLike())?.status, "UNAUTHENTICATED");
  assert.ok(intent);
  user = { id: "alice", clerkUserId: "clerk-alice" };
  assert.equal((await completePendingLike())?.status, "SUCCESS");
});


test("liked products retain exact saved formulas and keep unavailable versions removable", async () => {
  reset();
  rows.add("alice:formula-a"); rows.add("alice:formula-b"); rows.add("bob:other-formula");
  const result = await getLikedProductsForUser("alice");
  assert.deepEqual(catalogueIds, ["formula-a", "formula-b"]);
  assert.deepEqual(result.products.map((product) => product.currentVersion?.id), ["formula-b"]);
  assert.deepEqual(result.unavailable.map((like) => like.productVersionId), ["formula-a"]);
});
