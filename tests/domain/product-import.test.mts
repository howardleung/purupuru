import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  productImportPayloadsEqual,
  resolveProductImportVariant,
  validateProductImportPayload,
} from "../../packages/domain/src/product-import.ts";
import { isConfiguredAdmin, parseAdminClerkUserIds } from "../../apps/web/lib/admin-config.ts";

const exampleUrl = new URL("../../docs/examples/product-import-v1.json", import.meta.url);
const example = JSON.parse(readFileSync(exampleUrl, "utf8"));

function copy<T>(value: T): T {
  return structuredClone(value);
}

test("documented import validates with explicit review warnings and preserves structured writes", () => {
  const result = validateProductImportPayload(example);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.warnings.some((warning) => warning.code === "UNVERIFIED_SOURCE"));
  assert.equal(result.value.products[0]?.variants[0]?.offers.length, 2);
  assert.equal(result.value.products[0]?.variants[0]?.benchmarks[0]?.type, "RETAIL_PRICE");
  assert.deepEqual(result.value.products[0]?.variants[0]?.offers[1]?.availableMarkets, ["CA", "KR"]);
  assert.equal(result.value.products[0]?.variants[0]?.offers[0]?.isActive, true);
});

test("offer activation defaults to true and accepts an explicit reversible deactivation", () => {
  const omitted = validateProductImportPayload(example);
  assert.equal(omitted.ok, true);
  if (!omitted.ok) return;
  assert.equal(omitted.value.products[0]?.variants[0]?.offers[0]?.isActive, true);

  const correction = copy(example);
  correction.products[0].variants[0].offers[0].isActive = false;
  const deactivated = validateProductImportPayload(correction);
  assert.equal(deactivated.ok, true);
  if (!deactivated.ok) return;
  assert.equal(deactivated.value.products[0]?.variants[0]?.offers[0]?.isActive, false);
  assert.equal(productImportPayloadsEqual(correction, copy(correction)), true);
  assert.equal(productImportPayloadsEqual(correction, example), false);
});

test("same-size ANESSA releases retain separate versions and JAN identities", () => {
  const result = validateProductImportPayload(example);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const anessa = result.value.products.filter((product) => product.brand.slug === "anessa");
  assert.equal(anessa.length, 2);
  assert.deepEqual(anessa.map((product) => product.variants[0]?.displaySize), ["90 g", "90 g"]);
  assert.equal(new Set(anessa.map((product) => product.variants[0]?.gtin)).size, 2);
  assert.equal(new Set(anessa.map((product) => product.version.versionName)).size, 2);
});

test("duplicate GTINs in one batch are rejected before matching", () => {
  const payload = copy(example);
  payload.products[2].variants[0].gtin = payload.products[1].variants[0].gtin;
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.code === "DUPLICATE_GTIN"));
});

test("bad URLs, prices, market codes, and unsupported schema versions are rejected", () => {
  const payload = copy(example);
  payload.schemaVersion = "2.0";
  payload.products[0].variants[0].offers[0].listingUrl = "javascript:alert(1)";
  payload.products[0].variants[0].offers[0].productPrice = -1;
  payload.products[0].variants[0].offers[0].availableMarkets = ["CAN"];
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.code === "UNSUPPORTED_SCHEMA_VERSION"));
  assert.ok(result.errors.some((error) => error.code === "INVALID_URL"));
  assert.ok(result.errors.some((error) => error.code === "INVALID_NUMBER"));
  assert.ok(result.errors.some((error) => error.code === "INVALID_MARKET"));
});

test("benchmark prices require positive native values and namespaced provenance keys", () => {
  const payload = copy(example);
  payload.products[0].variants[0].benchmarks[0].amount = 0;
  payload.products[0].variants[0].benchmarks[0].sourceKey = "round lab";
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.path.endsWith(".amount") && error.code === "INVALID_NUMBER"));
  assert.ok(result.errors.some((error) => error.path.endsWith(".sourceKey") && error.code === "INVALID_SOURCE_KEY"));
});

test("nullable optional facts remain null instead of being invented", () => {
  const result = validateProductImportPayload(example);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const variant = result.value.products[1]?.variants[0];
  assert.equal(variant?.offers.length, 0);
  assert.equal(variant?.benchmarks.length, 0);
  assert.equal(result.value.products[1]?.version.formulationFingerprint, null);
});

test("an exact-size variant does not require GTIN or SKU merely to pass review", () => {
  const payload = copy(example);
  payload.products[0].variants[0].gtin = null;
  payload.products[0].variants[0].manufacturerSku = null;
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, true);
  assert.equal(result.warnings.some((warning) => warning.code === "WEAK_VARIANT_IDENTITY"), false);
});

test("multiple variants, offers, and benchmark source keys validate without flattening", () => {
  const payload = copy(example);
  const second = copy(payload.products[0].variants[0]);
  second.displaySize = "500 ml";
  second.normalizedQuantity = 500;
  second.gtin = "8800000000002";
  second.isDefault = false;
  second.offers = [];
  second.benchmarks = [];
  payload.products[0].variants.push(second);
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.products[0]?.variants.length, 2);
  assert.equal(result.value.products[0]?.variants[0]?.offers.length, 2);
  assert.equal(result.value.products[0]?.variants[0]?.benchmarks[0]?.sourceKey, "brand:round-lab");
});

test("contradictory family and retailer identities are rejected", () => {
  const payload = copy(example);
  payload.products[2].family.canonicalName = "A different family name";
  payload.products[0].variants[0].offers[1].retailer.sourceKey = "retailer:example-ca";
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.code === "CONTRADICTORY_FAMILY"));
  assert.ok(result.errors.some((error) => error.code === "CONTRADICTORY_RETAILER"));
});

test("contradictory version evidence is rejected for review rather than merged", () => {
  const payload = copy(example);
  const duplicate = copy(payload.products[1]);
  duplicate.version.versionCode = "different-code";
  duplicate.variants[0].gtin = "4900000000003";
  duplicate.variants[0].manufacturerSku = "EXAMPLE-ANESSA-ALT-90";
  payload.products.push(duplicate);
  const result = validateProductImportPayload(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => error.code === "CONTRADICTORY_VERSION"));
});

test("variant matching distinguishes proposed, exact, ambiguous, and conflicting identities", () => {
  const input = { gtin: "4900000000001", manufacturerSku: "SKU-90", normalizedQuantity: 90,
    normalizedUnit: "g", expectedVersionId: "version-2024", expectedFamilySlug: "anessa-gel", expectedBrandId: "brand-anessa" };
  const exact = { id: "variant-2024", productVersionId: "version-2024", productFamilySlug: "anessa-gel",
    brandId: "brand-anessa", normalizedQuantity: 90, normalizedUnit: "g", gtin: "4900000000001", manufacturerSku: "SKU-90" };
  assert.deepEqual(resolveProductImportVariant(input, []), { status: "CREATE", existingId: null });
  assert.deepEqual(resolveProductImportVariant(input, [exact]), { status: "REUSE", existingId: "variant-2024" });
  assert.deepEqual(resolveProductImportVariant(input, [exact, { ...exact, id: "duplicate" }]), { status: "AMBIGUOUS", existingId: null });
  assert.deepEqual(resolveProductImportVariant(input, [{ ...exact, productVersionId: "version-2026" }]), { status: "CONFLICT", existingId: null });
  assert.deepEqual(resolveProductImportVariant({ ...input, gtin: null, manufacturerSku: null }, [exact]), { status: "REUSE", existingId: "variant-2024" });
  assert.deepEqual(resolveProductImportVariant({ ...input, gtin: "4900000000099", manufacturerSku: null }, [exact]), { status: "CONFLICT", existingId: null });
  assert.deepEqual(resolveProductImportVariant({ ...input, gtin: null, manufacturerSku: null, normalizedQuantity: 60 }, [exact]), { status: "CREATE", existingId: null });
});

test("idempotent retries accept equivalent JSON key ordering but reject changed payloads", () => {
  assert.equal(productImportPayloadsEqual({ b: 2, a: { y: 2, x: 1 } }, { a: { x: 1, y: 2 }, b: 2 }), true);
  assert.equal(productImportPayloadsEqual({ idempotencyKey: "same-key", price: 10 }, { idempotencyKey: "same-key", price: 11 }), false);
});

test("admin allowlist is exact, server-configured, and ignores malformed IDs", () => {
  const configured = "user_abcdefgh,user_ABCDEFGH,not-a-clerk-id, user_12345678 ";
  assert.deepEqual([...parseAdminClerkUserIds(configured)], ["user_abcdefgh", "user_ABCDEFGH", "user_12345678"]);
  assert.equal(isConfiguredAdmin("user_abcdefgh", configured), true);
  assert.equal(isConfiguredAdmin("user_abcdefghi", configured), false);
  assert.equal(isConfiguredAdmin("user_abcdefgh", undefined), false);
});

test("admin endpoint authenticates before staging and commits are transaction-bound", () => {
  const route = readFileSync(new URL("../../apps/web/app/api/admin/ingestion/products/route.ts", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../../apps/web/app/admin/imports/actions.ts", import.meta.url), "utf8");
  const reviewPage = readFileSync(new URL("../../apps/web/app/admin/imports/[id]/page.tsx", import.meta.url), "utf8");
  const reviewActions = readFileSync(new URL("../../apps/web/app/admin/imports/[id]/import-batch-actions.tsx", import.meta.url), "utf8");
  const service = readFileSync(new URL("../../apps/web/lib/admin/product-import-service.ts", import.meta.url), "utf8");
  assert.ok(route.indexOf("getAdminAccess({ mutation: true })") < route.indexOf("stageProductImport(payload"));
  assert.match(route, /"Retry-After": String\(error\.result\.retryAfter\)/);
  assert.match(actions, /RateLimitError[\s\S]*notice=rate-limited/);
  assert.match(reviewPage, /Too many admin changes were submitted at once/);
  assert.match(service, /commitProductImport[\s\S]*runSerializable\(async \(tx\)/);
  assert.match(service, /PRODUCT_IMPORT_COMMIT_TIMEOUT_MS = 30_000/);
  assert.match(service, /\}, \{ timeout: PRODUCT_IMPORT_COMMIT_TIMEOUT_MS \}\)/);
  assert.match(service, /const result = await commitValidatedProductImportGraph\(tx, validation\.value\)/);
  assert.match(service, /status: "COMMITTED"/);
  assert.match(service, /classifyProductImportCommitFailure/);
  assert.match(service, /status: isRetryableProductImportCommitFailure\(failureKind\) \? "VALIDATED" : "FAILED"/);
  assert.match(reviewActions, /useFormStatus/);
  assert.match(reviewActions, /disabled=\{pending\}/);
  assert.match(reviewActions, /animate-spin/);
  assert.match(reviewActions, /Committing…/);
  assert.match(reviewActions, /formAction=\{commitAction\}/);
  assert.match(reviewActions, /formAction=\{rejectAction\}/);
  assert.match(reviewPage, /role="alert"/);
});

test("the published machine schema is parseable and pinned to version 1.0", () => {
  const schema = JSON.parse(readFileSync(new URL("../../docs/schemas/product-import-v1.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.schemaVersion.const, "1.0");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.product.properties.variants.minItems, 1);
  assert.deepEqual(schema.$defs.offer.properties.isActive, { type: "boolean", default: true });
});

test("public offer reads consistently exclude inactive offers", () => {
  for (const path of [
    "../../apps/web/lib/catalogue.ts",
    "../../apps/web/lib/shopping-lists.ts",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /offers:\s*\{[\s\S]*?where:\s*\{\s*isActive:\s*true/);
  }
});
