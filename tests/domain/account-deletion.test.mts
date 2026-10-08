import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

type Call = { name: string; args: Record<string, unknown> };
let authenticatedClerkUserId: string | null;
let localUser: { id: string } | null;
let clerkDelete: "SUCCESS" | "FAIL" | "NOT_FOUND";
let localDeleteFails: boolean;
let calls: Call[];

const transaction = {
  user: {
    async findUnique(args: Record<string, unknown>) {
      calls.push({ name: "user.findUnique", args });
      return localUser;
    },
    async deleteMany(args: Record<string, unknown>) {
      calls.push({ name: "user.deleteMany", args });
      localUser = null;
      return { count: 1 };
    },
  },
  collectionTag: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "collectionTag.deleteMany", args }); return { count: 1 }; } },
  collectionEntry: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "collectionEntry.deleteMany", args }); return { count: 1 }; } },
  userRating: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "userRating.deleteMany", args }); return { count: 1 }; } },
  purchaseInstance: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "purchaseInstance.deleteMany", args }); return { count: 1 }; } },
  shoppingListItem: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "shoppingListItem.deleteMany", args }); return { count: 1 }; } },
  shoppingList: { async deleteMany(args: Record<string, unknown>) { calls.push({ name: "shoppingList.deleteMany", args }); return { count: 1 }; } },
};

const boundary = {
  async auth() { calls.push({ name: "auth", args: {} }); return { userId: authenticatedClerkUserId }; },
  async clerkClient() {
    return {
      users: {
        async deleteUser(userId: string) {
          calls.push({ name: "clerk.deleteUser", args: { userId } });
          if (clerkDelete === "FAIL") throw Object.assign(new Error("Clerk unavailable"), { status: 503 });
          if (clerkDelete === "NOT_FOUND") throw Object.assign(new Error("Already deleted"), { status: 404 });
        },
      },
    };
  },
  async enforceRateLimit(scope: string, identity: string) {
    calls.push({ name: "rateLimit", args: { scope, identity } });
    return { allowed: true, unavailable: false, retryAfter: 0 };
  },
  async runSerializable(operation: (tx: typeof transaction) => Promise<unknown>) {
    calls.push({ name: "transaction", args: {} });
    if (localDeleteFails) throw new Error("Database unavailable");
    return operation(transaction);
  },
};

Object.assign(globalThis, { __purupuruAccountDeletionTest: boundary });
const root = "globalThis.__purupuruAccountDeletionTest";
const hooks = registerHooks({
  resolve(specifier, _context, nextResolve) {
    const modules: Record<string, string> = {
      "@clerk/nextjs/server": `export const auth=${root}.auth;export const clerkClient=${root}.clerkClient;`,
      "./request-security": `export const enforceRateLimit=${root}.enforceRateLimit;`,
      "./transactions": `export const runSerializable=${root}.runSerializable;`,
      "./rate-limit": "export class RateLimitError extends Error { constructor(result){super('Rate limited');this.result=result} }",
      "server-only": "export {};",
    };
    if (specifier in modules) return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    return nextResolve(specifier);
  },
});
const { deleteCurrentAccount } = await import("../../apps/web/lib/account-deletion.ts");
hooks.deregister();

function reset() {
  authenticatedClerkUserId = "clerk-current";
  localUser = { id: "local-current" };
  clerkDelete = "SUCCESS";
  localDeleteFails = false;
  calls = [];
}

test("anonymous and unconfirmed requests cannot delete account data", async () => {
  reset();
  assert.equal((await deleteCurrentAccount("delete")).status, "INVALID");
  assert.deepEqual(calls, []);

  reset(); authenticatedClerkUserId = null;
  assert.equal((await deleteCurrentAccount("DELETE")).status, "UNAUTHENTICATED");
  assert.deepEqual(calls.map((call) => call.name), ["auth"]);
});

test("authenticated deletion scopes every local delete to the current user and preserves shared data", async () => {
  reset();
  const result = await deleteCurrentAccount("DELETE");
  assert.equal(result.status, "SUCCESS");
  assert.deepEqual(calls.map((call) => call.name), [
    "auth", "rateLimit", "transaction", "user.findUnique", "collectionTag.deleteMany",
    "collectionEntry.deleteMany", "userRating.deleteMany", "purchaseInstance.deleteMany",
    "shoppingListItem.deleteMany", "shoppingList.deleteMany", "user.deleteMany", "clerk.deleteUser",
  ]);
  assert.deepEqual(calls.find((call) => call.name === "user.findUnique")?.args, {
    where: { clerkUserId: "clerk-current" }, select: { id: true },
  });
  assert.deepEqual(calls.find((call) => call.name === "collectionTag.deleteMany")?.args, {
    where: { collectionEntry: { userId: "local-current" } },
  });
  assert.deepEqual(calls.find((call) => call.name === "shoppingListItem.deleteMany")?.args, {
    where: { shoppingList: { userId: "local-current" } },
  });
  for (const name of ["collectionEntry", "userRating", "purchaseInstance", "shoppingList"]) {
    assert.deepEqual(calls.find((call) => call.name === `${name}.deleteMany`)?.args, {
      where: { userId: "local-current" },
    });
  }
  assert.deepEqual(calls.find((call) => call.name === "user.deleteMany")?.args, {
    where: { id: "local-current", clerkUserId: "clerk-current" },
  });
  assert.deepEqual(calls.find((call) => call.name === "clerk.deleteUser")?.args, { userId: "clerk-current" });
  assert.equal(calls.some((call) => /profileAvatar|product|offer|retailer|importBatch/.test(call.name)), false);
});

test("Clerk failure is explicit after atomic local cleanup", async () => {
  reset(); clerkDelete = "FAIL";
  const originalError = console.error;
  console.error = () => undefined;
  const result = await deleteCurrentAccount("DELETE");
  console.error = originalError;
  assert.equal(result.status, "RETRY_REQUIRED");
  assert.match(result.message, /data was deleted.*did not finish/i);
  assert.equal(localUser, null);
});

test("local cleanup failure stops before Clerk deletion", async () => {
  reset(); localDeleteFails = true;
  const originalError = console.error;
  console.error = () => undefined;
  const result = await deleteCurrentAccount("DELETE");
  console.error = originalError;
  assert.equal(result.status, "ERROR");
  assert.equal(calls.some((call) => call.name === "clerk.deleteUser"), false);
  assert.deepEqual(localUser, { id: "local-current" });
});

test("repeated deletion is safe when local data and Clerk identity are already gone", async () => {
  reset();
  assert.equal((await deleteCurrentAccount("DELETE")).status, "SUCCESS");
  clerkDelete = "NOT_FOUND";
  assert.equal((await deleteCurrentAccount("DELETE")).status, "SUCCESS");
  assert.equal(calls.filter((call) => call.name === "user.deleteMany").length, 1);
  assert.equal(calls.filter((call) => call.name === "clerk.deleteUser").length, 2);
});
