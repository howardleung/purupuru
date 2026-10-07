import assert from "node:assert/strict";
import test from "node:test";

import {
  appendRepeatedValues,
  getCategoryLeafSlugs,
  getCategorySelectionState,
  normalizeCategorySlugs,
  setCategorySelection,
} from "../../apps/web/lib/catalogue-filter-state.ts";
import {
  getCatalogueSortDirection,
  getNextCatalogueSort,
} from "../../apps/web/lib/catalogue-contract.ts";

const categories = [
  { id: "root", slug: "skincare", parentCategoryId: null },
  { id: "cleansers", slug: "cleansers", parentCategoryId: "root" },
  { id: "oil", slug: "oil-cleanser", parentCategoryId: "cleansers" },
  { id: "balm", slug: "balm-cleanser", parentCategoryId: "cleansers" },
  { id: "sunscreen", slug: "sunscreen", parentCategoryId: "root" },
] as const;

test("parent category selection expands to descendant leaves with OR-friendly repeated state", () => {
  assert.deepEqual(getCategoryLeafSlugs(categories, "cleansers"), ["oil-cleanser", "balm-cleanser"]);
  assert.deepEqual(normalizeCategorySlugs(categories, ["cleansers"]), ["oil-cleanser", "balm-cleanser"]);
  assert.deepEqual(normalizeCategorySlugs(categories, ["oil-cleanser", "sunscreen"]), ["oil-cleanser", "sunscreen"]);
});

test("category parents become indeterminate or checked from their selected children", () => {
  assert.deepEqual(
    getCategorySelectionState(categories, ["oil-cleanser"], "cleansers"),
    { checked: false, indeterminate: true, leafSlugs: ["oil-cleanser", "balm-cleanser"] },
  );
  assert.equal(
    getCategorySelectionState(categories, ["oil-cleanser", "balm-cleanser"], "cleansers").checked,
    true,
  );
  assert.deepEqual(
    setCategorySelection(["sunscreen"], ["oil-cleanser", "balm-cleanser"], true),
    ["sunscreen", "oil-cleanser", "balm-cleanser"],
  );
  assert.deepEqual(
    setCategorySelection(["sunscreen", "oil-cleanser"], ["oil-cleanser", "balm-cleanser"], false),
    ["sunscreen"],
  );
});

test("repeated brand and category parameters remain stable and shareable", () => {
  const parameters = new URLSearchParams();
  appendRepeatedValues(parameters, "brand", ["cosrx", "round-lab"]);
  appendRepeatedValues(parameters, "category", ["toner", "sunscreen"]);
  assert.deepEqual(parameters.getAll("brand"), ["cosrx", "round-lab"]);
  assert.deepEqual(parameters.getAll("category"), ["toner", "sunscreen"]);
});

test("sort direction and next action are explicit per active column", () => {
  assert.equal(getCatalogueSortDirection("PRICE_ASC", "PRICE"), "ascending");
  assert.equal(getCatalogueSortDirection("PRICE_DESC", "PRICE"), "descending");
  assert.equal(getCatalogueSortDirection("PRICE_ASC", "PRODUCT"), null);
  assert.equal(getNextCatalogueSort("PRODUCT_ASC", "PRODUCT"), "PRODUCT_DESC");
  assert.equal(getNextCatalogueSort("PRICE_DESC", "BRAND"), "BRAND_ASC");
});
