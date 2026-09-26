import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProductImportPayload } from "../../packages/domain/src/product-import.ts";

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
const { commitValidatedProductImportGraph } = await import("../../apps/web/lib/admin/product-import-service.ts");
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
