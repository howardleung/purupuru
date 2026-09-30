import assert from "node:assert/strict";
import test from "node:test";

import {
  filterCollectionItems,
  normalizeCollectionItems,
  sortCollectionItems,
  type CollectionContribution,
  type CollectionVersionBase,
  type MyCollectionItem,
} from "../../packages/domain/src/my-collection.ts";

function base(id: string, brandName = "Round Lab", productName = "1025 Dokdo Toner"): CollectionVersionBase {
  return {
    productVersionId: id,
    productFamilyId: `family-${id}`,
    productSlug: `product-${id}`,
    productName,
    brandName,
    versionName: "Current",
    showVersionName: false,
    categoryName: "Toner",
    defaultVariantId: `default-${id}`,
    defaultVariantLabel: "200 mL",
  };
}

function item(overrides: Partial<MyCollectionItem> & { productVersionId: string }): MyCollectionItem {
  return {
    ...base(overrides.productVersionId),
    selectedVariantId: null,
    selectedVariantLabel: null,
    wants: false,
    tried: false,
    owned: false,
    holyGrail: false,
    wouldRepurchase: false,
    ratingHalfSteps: null,
    purchaseCount: 0,
    ownedQuantity: 0,
    latestPurchase: null,
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

test("normalization returns one item per ProductVersion even with multiple tags and sources", () => {
  const contributions: CollectionContribution[] = [
    {
      kind: "RELATIONSHIP",
      base: base("version-1"),
      wants: true,
      tried: true,
      tagKinds: ["HOLY_GRAIL", "WOULD_REPURCHASE"],
      selectedVariant: { id: "selected", label: "100 mL" },
      updatedAt: "2026-09-10T00:00:00.000Z",
    },
    {
      kind: "RATING",
      base: base("version-1"),
      ratingHalfSteps: 9,
      contextualVariant: { id: "rating-context", label: "50 mL" },
      updatedAt: "2026-09-11T00:00:00.000Z",
    },
    {
      kind: "PURCHASE",
      base: base("version-1"),
      purchase: {
        id: "purchase-1",
        quantity: 1,
        purchaseDate: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        source: "MANUAL",
        retailerName: "Retailer A",
        variant: { id: "purchase-variant", label: "50 mL" },
      },
    },
    {
      kind: "PURCHASE",
      base: base("version-1"),
      purchase: {
        id: "purchase-2",
        quantity: 2,
        purchaseDate: "2026-09-12T00:00:00.000Z",
        createdAt: "2026-09-12T00:00:00.000Z",
        updatedAt: "2026-09-12T00:00:00.000Z",
        source: "SHOPPING_LIST",
        retailerName: null,
        variant: { id: "purchase-variant", label: "50 mL" },
      },
    },
  ];

  const result = normalizeCollectionItems(contributions);
  assert.equal(result.length, 1);
  assert.deepEqual(
    {
      wants: result[0]?.wants,
      tried: result[0]?.tried,
      owned: result[0]?.owned,
      holyGrail: result[0]?.holyGrail,
      wouldRepurchase: result[0]?.wouldRepurchase,
      ratingHalfSteps: result[0]?.ratingHalfSteps,
      purchaseCount: result[0]?.purchaseCount,
      ownedQuantity: result[0]?.ownedQuantity,
      selectedVariantId: result[0]?.selectedVariantId,
    },
    {
      wants: true,
      tried: true,
      owned: true,
      holyGrail: true,
      wouldRepurchase: true,
      ratingHalfSteps: 9,
      purchaseCount: 2,
      ownedQuantity: 3,
      selectedVariantId: "selected",
    },
  );
  assert.equal(result[0]?.latestPurchase?.date, "2026-09-12T00:00:00.000Z");
});

test("ratings and purchases attach only to their ProductVersion", () => {
  const result = normalizeCollectionItems([
    {
      kind: "RATING",
      base: base("version-a"),
      ratingHalfSteps: 10,
      contextualVariant: null,
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      kind: "RATING",
      base: base("version-b"),
      ratingHalfSteps: 6,
      contextualVariant: null,
      updatedAt: "2026-09-02T00:00:00.000Z",
    },
    {
      kind: "PURCHASE",
      base: base("version-b"),
      purchase: {
        id: "purchase-b",
        quantity: 4,
        purchaseDate: null,
        createdAt: "2026-09-03T00:00:00.000Z",
        updatedAt: "2026-09-03T00:00:00.000Z",
        source: "MANUAL",
        retailerName: null,
        variant: { id: "variant-b", label: "60 mL" },
      },
    },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result.find((value) => value.productVersionId === "version-a")?.ratingHalfSteps, 10);
  assert.equal(result.find((value) => value.productVersionId === "version-a")?.owned, false);
  assert.equal(result.find((value) => value.productVersionId === "version-b")?.ratingHalfSteps, 6);
  assert.equal(result.find((value) => value.productVersionId === "version-b")?.ownedQuantity, 4);
});

test("filters match states and compose with AND semantics", () => {
  const items = [
    item({ productVersionId: "want", wants: true }),
    item({ productVersionId: "tried", tried: true }),
    item({ productVersionId: "both", wants: true, tried: true, holyGrail: true }),
    item({ productVersionId: "owned", owned: true, wouldRepurchase: true }),
  ];

  assert.deepEqual(filterCollectionItems(items, ["WANT"]).map((value) => value.productVersionId), ["want", "both"]);
  assert.deepEqual(filterCollectionItems(items, ["WANT", "TRIED"]).map((value) => value.productVersionId), ["both"]);
  assert.deepEqual(filterCollectionItems(items, ["OWNED"]).map((value) => value.productVersionId), ["owned"]);
  assert.deepEqual(filterCollectionItems(items, ["HOLY_GRAIL"]).map((value) => value.productVersionId), ["both"]);
  assert.deepEqual(filterCollectionItems(items, ["WOULD_REPURCHASE"]).map((value) => value.productVersionId), ["owned"]);
  assert.deepEqual(filterCollectionItems(items, []), items);
});

test("sort options are deterministic", () => {
  const items = [
    item({ productVersionId: "b", brandName: "Zeta", productName: "Beta", ratingHalfSteps: 8, updatedAt: "2026-09-10T00:00:00.000Z" }),
    item({ productVersionId: "a", brandName: "Alpha", productName: "Gamma", ratingHalfSteps: 8, updatedAt: "2026-09-11T00:00:00.000Z" }),
    item({ productVersionId: "c", brandName: "Alpha", productName: "Delta", ratingHalfSteps: null, updatedAt: "2026-09-09T00:00:00.000Z" }),
  ];

  assert.deepEqual(sortCollectionItems(items, "RECENT").map((value) => value.productVersionId), ["a", "b", "c"]);
  assert.deepEqual(sortCollectionItems(items, "RATING").map((value) => value.productVersionId), ["a", "b", "c"]);
  assert.deepEqual(sortCollectionItems(items, "ALPHABETICAL").map((value) => value.productVersionId), ["c", "a", "b"]);
});

test("empty collection and empty filtered results remain valid", () => {
  assert.deepEqual(normalizeCollectionItems([]), []);
  assert.deepEqual(filterCollectionItems([item({ productVersionId: "only", wants: true })], ["OWNED"]), []);
});
