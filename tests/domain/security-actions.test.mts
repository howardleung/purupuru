import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Execute the actual actions/current-user helper with boundary stand-ins, not source assertions.
// These tests verify orchestration/query predicates; they are not PostgreSQL/Clerk integration.
type Args = { where?: Record<string, unknown>; data?: Record<string, unknown>; create?: Record<string, unknown> };
let sessionUser: string | null = "clerk-user-a";
let allowed = true;
let unavailable = false;
let rowOwner = "local-user-a";
let calls: { name: string; args: Args }[] = [];
let revalidated: string[] = [];
const record = (name: string, args: Args) => { calls.push({ name, args }); };
const prisma = {
  user: {
    async upsert(args: Args) { record("user.upsert", args); return { id: "local-user-a" }; },
  },
  shoppingList: {
    async create(args: Args) { record("list.create", args); return { id: "list-a" }; },
    async findFirst(args: Args) { record("list.find", args); return null; },
  },
  shoppingListItem: {
    async findFirst(args: Args) {
      record("item.find", args);
      const owner = args.where?.shoppingList;
      assert.deepEqual(owner, { userId: "local-user-a" });
      return rowOwner === "local-user-a" ? { id: "item-a", quantity: 2, purchasedQuantity: 2 } : null;
    },
    async update(args: Args) { record("item.update", args); return { id: "item-a", ...args.data }; },
    async delete(args: Args) { record("item.delete", args); return {}; },
  },
  purchaseInstance: {
    async updateMany(args: Args) { record("purchase.detach", args); return { count: 0 }; },
  },
  productVariant: {
    async findFirst(args: Args) { record("variant.find", args); return null; },
  },
};
const boundary = {
  prisma,
  auth: async () => ({ userId: sessionUser }),
  limit: async (scope: string, identity: string) => {
    record("limit", { data: { scope, identity } });
    return { allowed, unavailable, retryAfter: 60 };
  },
  revalidate: (path: string) => { revalidated.push(path); },
};
Object.assign(globalThis, { __purupuruSecurityTest: boundary });
const root = "globalThis.__purupuruSecurityTest";
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const modules: Record<string, string> = {
      "server-only": "export {};",
      "@beauty-platform/database": `export const prisma = ${root}.prisma;`,
      "@clerk/nextjs/server": `export const auth = ${root}.auth;`,
      "next/cache": `export const revalidatePath = ${root}.revalidate;`,
    };
    if (specifier.endsWith("/transactions")) modules[specifier] = `export const runSerializable = async f => f(${root}.prisma);`;
    if (specifier.endsWith("/clerk-config")) modules[specifier] = "export const isClerkConfigured = true;";
    if (specifier.endsWith("/request-security")) modules[specifier] = `export const enforceRateLimit = ${root}.limit;`;
    if (specifier in modules) {
      return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const shopping = await import("../../apps/web/app/shopping-lists/actions.ts");
const collection = await import("../../apps/web/app/products/[slug]/collection-actions.ts");
hooks.deregister();
const context = { shoppingListId: "list-a", shoppingListItemId: "item-a" };
function reset() {
  sessionUser = "clerk-user-a"; allowed = true; unavailable = false; rowOwner = "local-user-a";
  calls = []; revalidated = [];
}

test("malformed inputs for every action stop before auth, limiter, database and revalidation", async () => {
  reset();
  for (const action of Object.values(shopping)) {
    for (const input of [null, {}, { quantity: 1 }, { ...context, quantity: "2" }]) {
      // Some shapes are valid for remove; use missing list ID for that explicit case.
      const malformed = action === shopping.removeShoppingListItem ? {} : input;
      assert.equal((await action(malformed)).status, "INVALID");
    }
  }
  assert.equal((await collection.updateProductCollection({})).status, "INVALID");
  assert.deepEqual(calls, []);
  assert.deepEqual(revalidated, []);
});

test("anonymous mutations do not create profiles or touch private rows", async () => {
  reset(); sessionUser = null;
  assert.equal((await shopping.updateShoppingListItemQuantity({ ...context, quantity: 3 })).status, "UNAUTHENTICATED");
  assert.deepEqual(calls, []);
});

test("mutation budget uses verified Clerk identity before profile/database writes", async () => {
  reset(); allowed = false;
  const result = await shopping.updateShoppingListItemQuantity({ ...context, quantity: 3, userId: "victim" });
  assert.equal(result.status, "ERROR");
  assert.match(result.message, /Too many changes/);
  assert.deepEqual(calls, [{ name: "limit", args: { data: { scope: "mutation", identity: "clerk-user-a" } } }]);
  unavailable = true;
  assert.match((await shopping.removeShoppingListItem(context)).message, /temporarily unavailable/);
});

test("client-provided user ID is ignored when creating a list", async () => {
  reset();
  const result = await shopping.createShoppingList({ name: "  Trip  ", targetMarket: "jp", userId: "victim" });
  assert.equal(result.status, "SUCCESS");
  assert.deepEqual(calls.find((call) => call.name === "user.upsert")?.args.where, { clerkUserId: "clerk-user-a" });
  assert.deepEqual(calls.find((call) => call.name === "list.create")?.args.data,
    { userId: "local-user-a", name: "Trip", targetMarket: "JP", visibility: "PRIVATE" });
});

test("quantity, Purchased and removal reject a different user's row without writes", async () => {
  for (const action of [shopping.updateShoppingListItemQuantity, shopping.markShoppingListItemPurchased, shopping.removeShoppingListItem]) {
    reset(); rowOwner = "local-user-b";
    assert.equal((await action({ ...context, quantity: 3, purchased: true })).status, "NOT_FOUND");
    const read = calls.find((call) => call.name === "item.find");
    assert.deepEqual(read?.args.where, { id: "item-a", shoppingListId: "list-a", shoppingList: { userId: "local-user-a" } });
    assert.equal(calls.some((call) => /update|delete|detach/.test(call.name)), false);
  }
});

test("valid Purchased quantity edits preserve checklist state without purchase writes", async () => {
  reset();
  assert.equal((await shopping.updateShoppingListItemQuantity({ ...context, quantity: 7 })).status, "SUCCESS");
  assert.deepEqual(calls.find((call) => call.name === "item.update")?.args.data, { quantity: 7, purchasedQuantity: 7 });
  assert.equal(calls.some((call) => call.name.startsWith("purchase.")), false);
});

test("collection rejects mismatched variant/version/family context before personal changes", async () => {
  reset();
  const result = await collection.updateProductCollection({ productSlug: "toner", productVersionId: "version-a", productVariantId: "variant-b", intent: { type: "ADD_OWNED" }, userId: "victim" });
  assert.equal(result.status, "INVALID");
  assert.deepEqual(calls.find((call) => call.name === "variant.find")?.args.where, {
    id: "variant-b", productVersionId: "version-a", productVersion: { productFamily: { slug: "toner" } },
  });
  assert.equal(calls.some((call) => /update|delete|detach/.test(call.name)), false);
});
