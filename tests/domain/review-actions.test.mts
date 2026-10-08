import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

type User = { id: string; skinType: string | null; sensitiveSkin: boolean };
type StoredReview = Record<string, unknown> & { userId: string; productFamilyId: string };

let currentUser: User | null;
let reviews: Map<string, StoredReview>;
let variantFamily: Record<string, { familyId: string; slug: string; versionId: string }>;
let revalidated: string[];

const tx = {
  productVariant: {
    async findFirst(args: { where: { id: string; productVersion: { productFamilyId: string; productFamily: { slug: string } } } }) {
      const variant = variantFamily[args.where.id];
      if (!variant || variant.familyId !== args.where.productVersion.productFamilyId || variant.slug !== args.where.productVersion.productFamily.slug) return null;
      return { id: args.where.id, productVersionId: variant.versionId };
    },
  },
  review: {
    async upsert(args: { where: { userId_productFamilyId: { userId: string; productFamilyId: string } }; update: Record<string, unknown>; create: StoredReview }) {
      const key = `${args.where.userId_productFamilyId.userId}:${args.where.userId_productFamilyId.productFamilyId}`;
      const existing = reviews.get(key);
      const value = existing ? { ...existing, ...args.update } as StoredReview : { ...args.create };
      reviews.set(key, value);
      return value;
    },
    async deleteMany(args: { where: { userId: string; productFamilyId: string } }) {
      const key = `${args.where.userId}:${args.where.productFamilyId}`;
      return { count: reviews.delete(key) ? 1 : 0 };
    },
  },
};

const boundary = {
  async getMutationUser() { return currentUser; },
  async runSerializable<T>(operation: (client: typeof tx) => Promise<T>) { return operation(tx); },
  revalidatePath(path: string) { revalidated.push(path); },
};

Object.assign(globalThis, { __purupuruReviewActionTest: boundary });
const root = "globalThis.__purupuruReviewActionTest";
const hooks = registerHooks({
  resolve(specifier, _context, nextResolve) {
    const modules: Record<string, string> = {
      "next/cache": `export const revalidatePath=${root}.revalidatePath;`,
      "../../../lib/current-user": `export const getMutationUser=${root}.getMutationUser;`,
      "../../../lib/transactions": `export const runSerializable=${root}.runSerializable;`,
      "../../../lib/rate-limit": "export class RateLimitError extends Error {}",
      "../../../lib/input-validation": "export const isRecord=(v)=>typeof v==='object'&&v!==null&&!Array.isArray(v);export const isIdentifier=(v)=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);export const isRouteSlug=(v)=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(v);",
    };
    if (specifier in modules) return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    return nextResolve(specifier);
  },
});
const { deleteProductReview, saveProductReview } = await import("../../apps/web/app/products/[slug]/review-actions.ts");
hooks.deregister();

function reset() {
  currentUser = { id: "user-a", skinType: "COMBINATION", sensitiveSkin: true };
  reviews = new Map();
  variantFamily = {
    "variant-a": { familyId: "family-a", slug: "product-a", versionId: "version-a" },
    "variant-b": { familyId: "family-b", slug: "product-b", versionId: "version-b" },
  };
  revalidated = [];
}

const reviewA = { productFamilyId: "family-a", productSlug: "product-a", productVariantId: "variant-a", rating: 5, body: "Excellent" };

test("anonymous review creation and deletion are rejected", async () => {
  reset(); currentUser = null;
  assert.equal((await saveProductReview(reviewA)).status, "UNAUTHENTICATED");
  assert.equal((await deleteProductReview({ productFamilyId: "family-a", productSlug: "product-a", confirmed: true })).status, "UNAUTHENTICATED");
  assert.equal(reviews.size, 0);
});

test("review creation derives version and profile snapshots after validating variant family", async () => {
  reset();
  const invalid = await saveProductReview({ ...reviewA, productFamilyId: "family-b" });
  assert.equal(invalid.status, "INVALID");
  assert.equal(reviews.size, 0);

  assert.equal((await saveProductReview(reviewA)).status, "SUCCESS");
  const stored = reviews.get("user-a:family-a")!;
  assert.equal(stored.productVersionId, "version-a");
  assert.equal(stored.productVariantId, "variant-a");
  assert.equal(stored.skinTypeSnapshot, "COMBINATION");
  assert.equal(stored.sensitiveSkinSnapshot, true);
  assert.deepEqual(revalidated, ["/products/product-a"]);
});

test("editing updates the single family review and refreshes its skin snapshot", async () => {
  reset();
  await saveProductReview(reviewA);
  currentUser = { id: "user-a", skinType: null, sensitiveSkin: false };
  assert.equal(reviews.get("user-a:family-a")!.skinTypeSnapshot, "COMBINATION");
  assert.equal(reviews.get("user-a:family-a")!.sensitiveSkinSnapshot, true);
  await saveProductReview({ ...reviewA, rating: 3, body: "Updated" });
  assert.equal(reviews.size, 1);
  const stored = reviews.get("user-a:family-a")!;
  assert.equal(stored.rating, 3);
  assert.equal(stored.skinTypeSnapshot, null);
  assert.equal(stored.sensitiveSkinSnapshot, false);
});

test("the same user can review different families while ownership scopes deletion", async () => {
  reset();
  await saveProductReview(reviewA);
  await saveProductReview({ productFamilyId: "family-b", productSlug: "product-b", productVariantId: "variant-b", rating: 4, body: "" });
  assert.equal(reviews.size, 2);

  currentUser = { id: "user-b", skinType: "DRY", sensitiveSkin: false };
  assert.equal((await deleteProductReview({ productFamilyId: "family-a", productSlug: "product-a", confirmed: true })).status, "INVALID");
  assert.equal(reviews.size, 2);

  currentUser = { id: "user-a", skinType: null, sensitiveSkin: false };
  assert.equal((await deleteProductReview({ productFamilyId: "family-a", productSlug: "product-a", confirmed: false })).status, "INVALID");
  assert.equal((await deleteProductReview({ productFamilyId: "family-a", productSlug: "product-a", confirmed: true })).status, "SUCCESS");
  assert.equal(reviews.size, 1);
  assert.equal(reviews.has("user-a:family-b"), true);
});
