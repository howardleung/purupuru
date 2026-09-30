import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProductImportPayload, type ProductImportPayload } from "../../packages/domain/src/product-import.ts";

const boundary = { prisma: {} };
Object.assign(globalThis, { __purupuruImportCommitTest: boundary });
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier === "@beauty-platform/database") {
      return { url: "data:text/javascript,export const prisma=globalThis.__purupuruImportCommitTest.prisma;", shortCircuit: true };
    }
    if (specifier.endsWith("/transactions")) {
      return { url: "data:text/javascript,export const runSerializable=async operation=>operation(globalThis.__purupuruImportCommitTest.prisma);", shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { commitValidatedProductImportGraph, stageProductImport } = await import("../../apps/web/lib/admin/product-import-service.ts");
hooks.deregister();

type Row = Record<string, unknown> & { id: string };
type State = { brands: Row[]; families: Row[]; versions: Row[]; variants: Row[] };

function importProduct() {
  const document = JSON.parse(readFileSync(new URL("../../docs/examples/product-import-v1.json", import.meta.url), "utf8"));
  document.products = [document.products[0]];
  document.products[0].version.status = "PREVIOUS";
  document.products[0].version.images = [];
  document.products[0].variants[0].images = [];
  document.products[0].variants[0].benchmarks = [];
  document.products[0].variants[0].offers = [];
  const validation = validateProductImportPayload(document);
  assert.equal(validation.ok, true);
  if (!validation.ok) throw new Error("Fixture did not validate");
  return validation.value;
}

function memoryTransaction(options: { failVariant?: boolean } = {}) {
  let state: State = { brands: [], families: [], versions: [], variants: [] };
  let nextId = 1;
  const id = (prefix: string) => `${prefix}-${nextId++}`;
  const tx = {
    canonicalCategory: { async findFirst() { return { id: "category-toner", slug: "toner", isActive: true }; } },
    brand: {
      async findUnique({ where }: { where: { slug: string } }) { return state.brands.find((row) => row.slug === where.slug) ?? null; },
      async findFirst({ where }: { where: { name: { equals: string } } }) { return state.brands.find((row) => row.name === where.name.equals) ?? null; },
      async create({ data }: { data: Record<string, unknown> }) { const row = { id: id("brand"), ...data }; state.brands.push(row); return row; },
    },
    productFamily: {
      async findUnique({ where }: { where: { slug: string } }) { return state.families.find((row) => row.slug === where.slug) ?? null; },
      async create({ data }: { data: Record<string, unknown> }) { const row = { id: id("family"), currentVersionId: null, ...data }; state.families.push(row); return row; },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) { const row = state.families.find((item) => item.id === where.id)!; Object.assign(row, data); return row; },
    },
    productVersion: {
      async findMany({ where }: { where: { productFamilyId: string } }) { return state.versions.filter((row) => row.productFamilyId === where.productFamilyId); },
      async create({ data }: { data: Record<string, unknown> }) { const row = { id: id("version"), defaultVariantId: null, ...data }; state.versions.push(row); return row; },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) { const row = state.versions.find((item) => item.id === where.id)!; Object.assign(row, data); return row; },
    },
    productVariant: {
      async findMany() { return state.variants; },
      async create({ data }: { data: Record<string, unknown> }) {
        if (options.failVariant) throw new Error("simulated variant failure");
        const row = { id: id("variant"), ...data }; state.variants.push(row); return row;
      },
    },
    productImage: { async upsert() { throw new Error("unexpected image write"); } },
    benchmarkPrice: { async findFirst() { return null; }, async create() { throw new Error("unexpected benchmark write"); } },
    retailer: {}, offer: {}, offerItem: {}, priceObservation: {},
  };
  return {
    tx,
    snapshot: () => structuredClone(state),
    async atomic<T>(operation: (database: typeof tx) => Promise<T>) {
      const before = structuredClone(state);
      try { return await operation(tx); } catch (error) { state = before; throw error; }
    },
  };
}

test("a new validated graph commits once and an exact retry reuses its identities", async () => {
  const database = memoryTransaction();
  const payload = importProduct();
  const first = await database.atomic((tx) => commitValidatedProductImportGraph(tx, payload));
  const afterFirst = database.snapshot();
  const second = await database.atomic((tx) => commitValidatedProductImportGraph(tx, payload));
  const afterSecond = database.snapshot();
  assert.equal(afterFirst.brands.length, 1);
  assert.equal(afterFirst.families.length, 1);
  assert.equal(afterFirst.versions.length, 1);
  assert.equal(afterFirst.variants.length, 1);
  assert.deepEqual(afterSecond, afterFirst);
  assert.deepEqual(second, first);
});

test("a graph write failure rolls all earlier catalogue creations back", async () => {
  const database = memoryTransaction({ failVariant: true });
  await assert.rejects(database.atomic((tx) => commitValidatedProductImportGraph(tx, importProduct())), /simulated variant failure/);
  assert.deepEqual(database.snapshot(), { brands: [], families: [], versions: [], variants: [] });
});

function offerPayload(isActive: boolean | undefined): ProductImportPayload {
  const document = JSON.parse(readFileSync(new URL("../../docs/examples/product-import-v1.json", import.meta.url), "utf8"));
  document.idempotencyKey = `tests:offer-activation:${isActive === false ? "off" : "on"}`;
  document.products = [document.products[0]];
  const product = document.products[0];
  product.version.status = "PREVIOUS";
  product.version.images = [];
  product.variants = [product.variants[0]];
  product.variants[0].images = [];
  product.variants[0].benchmarks = [];
  product.variants[0].offers = [product.variants[0].offers[0]];
  if (isActive === undefined) delete product.variants[0].offers[0].isActive;
  else product.variants[0].offers[0].isActive = isActive;
  const validation = validateProductImportPayload(document);
  assert.equal(validation.ok, true);
  if (!validation.ok) throw new Error("Offer fixture did not validate");
  return validation.value;
}

function offerMemoryTransaction(options: { offerExists?: boolean; offerActive?: boolean } = {}) {
  const payload = offerPayload(true);
  const product = payload.products[0]!;
  const variantInput = product.variants[0]!;
  const input = variantInput.offers[0]!;
  const category = { id: "category-toner", slug: "toner", isActive: true };
  const brand = { id: "brand-round-lab", ...product.brand };
  const family = { id: "family-dokdo", brandId: brand.id, primaryCanonicalCategoryId: category.id,
    currentVersionId: null, ...product.family };
  const version = { id: "version-current", productFamilyId: family.id, defaultVariantId: "variant-200",
    ...product.version };
  const variant = { id: "variant-200", productVersionId: version.id, normalizedQuantity: variantInput.normalizedQuantity,
    normalizedUnit: variantInput.normalizedUnit, displaySize: variantInput.displaySize, gtin: variantInput.gtin,
    manufacturerSku: variantInput.manufacturerSku };
  const retailer = { id: "retailer-example-ca", ...input.retailer };
  const offer = { id: "offer-existing", retailerId: retailer.id, productVariantId: variant.id,
    retailerListingId: input.externalListingId, listingUrl: input.listingUrl, productPrice: input.productPrice,
    nativeCurrency: input.nativeCurrency, availableMarkets: input.availableMarkets,
    availabilityState: input.availabilityState, shippingState: input.shipping?.state ?? null,
    shippingAmount: input.shipping?.amount ?? null, shippingCurrency: input.shipping?.currency ?? null,
    deliveryMethod: input.shipping?.method ?? null, deliveryEstimate: input.shipping?.estimate ?? null,
    shippingConditions: input.shipping?.conditions ?? null, observedAt: new Date(input.observedAt),
    lastVerifiedAt: new Date(input.provenance.verifiedAt ?? input.provenance.retrievedAt),
    isActive: options.offerActive ?? true };
  const state = {
    offer: options.offerExists === false ? null : offer,
    observations: options.offerExists === false ? [] : [{ id: "observation-existing", offerId: offer.id,
      observedAt: new Date(input.observedAt), amount: input.productPrice, nativeCurrency: input.nativeCurrency }],
    offerItems: [{ id: "offer-item-existing", offerId: offer.id }],
    offerCreates: 0,
    observationCreates: 0,
    itemDeletes: 0,
  };
  const tx = {
    canonicalCategory: { async findFirst() { return category; } },
    brand: {
      async findUnique() { return brand; },
      async findFirst() { return brand; },
    },
    productFamily: {
      async findUnique() { return family; },
      async update() { return family; },
    },
    productVersion: {
      async findMany() { return [version]; },
      async update() { return version; },
    },
    productVariant: {
      async findMany() { return [variant]; },
      async findUnique() { return null; },
    },
    productImage: { async upsert() { throw new Error("unexpected image write"); } },
    benchmarkPrice: { async findFirst() { return null; }, async create() { throw new Error("unexpected benchmark write"); } },
    retailer: {
      async findUnique() { return retailer; },
      async findFirst() { return retailer; },
    },
    offer: {
      async findUnique({ where }: { where: Record<string, unknown> }) {
        if (!state.offer) return null;
        if ("retailerId_retailerListingId" in where || "retailerId_listingUrl" in where) return state.offer;
        return null;
      },
      async update({ data }: { data: Record<string, unknown> }) {
        if (!state.offer) throw new Error("offer missing");
        Object.assign(state.offer, data);
        return state.offer;
      },
      async create({ data }: { data: Record<string, unknown> }) {
        state.offerCreates += 1;
        state.offer = { id: "offer-created", ...offer, ...data };
        return state.offer;
      },
    },
    offerItem: {
      async deleteMany() { state.itemDeletes += 1; state.offerItems = []; },
      async create() { throw new Error("unexpected offer item create"); },
    },
    priceObservation: {
      async findUnique({ where }: { where: { offerId_observedAt: { offerId: string; observedAt: Date } } }) {
        const key = where.offerId_observedAt;
        return state.observations.find((item) => item.offerId === key.offerId && item.observedAt.getTime() === key.observedAt.getTime()) ?? null;
      },
      async findFirst() { return null; },
      async update() { throw new Error("unexpected observation update"); },
      async create({ data }: { data: Record<string, unknown> }) {
        state.observationCreates += 1;
        const row = { id: `observation-${state.observationCreates}`, ...data } as typeof state.observations[number];
        state.observations.push(row);
        return row;
      },
    },
  };
  return { tx, state, category, brand, family, version, variant, retailer, offer };
}

test("offer deactivation requires an exact existing match and cannot create an offer", async () => {
  const database = offerMemoryTransaction({ offerExists: false });
  await assert.rejects(
    commitValidatedProductImportGraph(database.tx as never, offerPayload(false)),
    /deactivation requires an exact existing offer/i,
  );
  assert.equal(database.state.offerCreates, 0);
  assert.equal(database.state.observationCreates, 0);
});

test("soft-deactivation changes only activation state and preserves items and price history", async () => {
  const database = offerMemoryTransaction();
  const beforeOffer = structuredClone(database.state.offer);
  const beforeObservations = structuredClone(database.state.observations);
  await commitValidatedProductImportGraph(database.tx as never, offerPayload(false));
  assert.deepEqual(database.state.offer, { ...beforeOffer, isActive: false });
  assert.deepEqual(database.state.observations, beforeObservations);
  assert.equal(database.state.observationCreates, 0);
  assert.equal(database.state.itemDeletes, 0);
  assert.equal(database.state.offerItems.length, 1);

  await commitValidatedProductImportGraph(database.tx as never, offerPayload(false));
  assert.equal(database.state.offer?.isActive, false);
  assert.deepEqual(database.state.observations, beforeObservations);
});

test("an exact inactive offer can be reactivated without duplicating its observation", async () => {
  const database = offerMemoryTransaction({ offerActive: false });
  const beforeCount = database.state.observations.length;
  await commitValidatedProductImportGraph(database.tx as never, offerPayload(true));
  assert.equal(database.state.offer?.isActive, true);
  assert.equal(database.state.observations.length, beforeCount);
  assert.equal(database.state.observationCreates, 0);
});

test("omitting offer isActive retains the active default for new offers", async () => {
  const database = offerMemoryTransaction({ offerExists: false });
  await commitValidatedProductImportGraph(database.tx as never, offerPayload(undefined));
  assert.equal(database.state.offerCreates, 1);
  assert.equal(database.state.offer?.isActive, true);
});

function stageMemoryTransaction(offerExists = true) {
  const database = offerMemoryTransaction({ offerExists });
  const familyForPlan = { ...database.family, brand: database.brand, primaryCanonicalCategory: database.category,
    versions: [database.version] };
  const variantForPlan = { ...database.variant, productVersion: { ...database.version, productFamily: familyForPlan } };
  let savedBatch: Record<string, unknown> | null = null;
  const importBatch = {
    async findUnique({ where }: { where: { idempotencyKey: string } }) {
      return savedBatch?.idempotencyKey === where.idempotencyKey ? savedBatch : null;
    },
    async create({ data }: { data: Record<string, unknown> }) {
      savedBatch = { id: "batch-correction", ...data, normalizedPayload: null, plan: null,
        validationErrors: null, warnings: null, commitResult: null };
      return savedBatch;
    },
    async update({ data }: { data: Record<string, unknown> }) {
      if (!savedBatch) throw new Error("batch missing");
      Object.assign(savedBatch, data);
      return savedBatch;
    },
  };
  const tx = {
    importBatch,
    canonicalCategory: { async findMany() { return [database.category]; } },
    brand: { async findMany() { return [database.brand]; } },
    productFamily: { async findMany() { return [familyForPlan]; } },
    productVariant: { async findMany() { return [variantForPlan]; } },
    retailer: { async findMany() { return [database.retailer]; } },
    offer: { async findMany() { return database.state.offer ? [database.state.offer] : []; } },
    benchmarkPrice: { async findMany() { return []; } },
    productImage: { async findMany() { return []; } },
  };
  return { tx, batch: () => savedBatch };
}

test("staging records an explicit reviewed deactivation and exact replays are idempotent", async () => {
  const database = stageMemoryTransaction();
  boundary.prisma = database.tx;
  const payload = offerPayload(false);
  const first = await stageProductImport(payload, "user_testadmin");
  assert.equal(first.replayed, false);
  assert.equal(first.batch.status, "NEEDS_REVIEW");
  const plan = first.batch.plan as { steps: Array<{ entity: string; action: string; existingId: string | null }> };
  assert.deepEqual(plan.steps.find((step) => step.entity === "OFFER"), {
    path: "$.products[0].variants[0].offers[0]",
    entity: "OFFER",
    label: "roundlab-dokdo-200",
    action: "DEACTIVATE",
    existingId: "offer-existing",
    reason: "Exact existing offer will be soft-deactivated; catalogue identity and history remain intact.",
  });
  assert.ok((first.batch.warnings as Array<{ code: string }>).some((warning) => warning.code === "OFFER_DEACTIVATION_REQUIRES_REVIEW"));

  const replay = await stageProductImport(payload, "user_testadmin");
  assert.equal(replay.replayed, true);
  assert.equal(replay.batch.id, first.batch.id);
});

test("staging blocks a deactivation when no exact offer identity exists", async () => {
  const database = stageMemoryTransaction(false);
  boundary.prisma = database.tx;
  const result = await stageProductImport(offerPayload(false), "user_testadmin");
  assert.ok((result.batch.validationErrors as Array<{ code: string }>).some((error) => error.code === "OFFER_DEACTIVATION_NOT_FOUND"));
  const plan = result.batch.plan as { steps: Array<{ entity: string; action: string }> };
  assert.equal(plan.steps.find((step) => step.entity === "OFFER")?.action, "CONFLICT");
});
