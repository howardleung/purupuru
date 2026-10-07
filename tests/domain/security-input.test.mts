import assert from "node:assert/strict";
import test from "node:test";
import { isShoppingListInput, isProductCollectionInput, boundedParameter, boundedParameters, priceParameter, comparisonIds } from "../../apps/web/lib/input-validation.ts";
import { safeExternalUrl } from "../../apps/web/lib/external-url.ts";
import { PRODUCT_IMAGE_HOSTS, securityHeaders } from "../../apps/web/lib/security-headers.ts";
import { MAX_REQUESTED_QUANTITY, quantityStateAfterChange } from "../../packages/domain/src/shopping-list.ts";

test("all shopping-list mutation inputs reject non-objects and missing required IDs", () => {
  for (const kind of ["create", "createWithVariant", "add", "update", "purchased", "remove"] as const) {
    for (const input of [null, undefined, "x", [], 1, {}]) assert.equal(isShoppingListInput(kind, input), false);
  }
  for (const id of [undefined, null, "", [], {}, "a/b", "a\u0000b", "x".repeat(129)]) {
    assert.equal(isShoppingListInput("remove", { shoppingListId: id, shoppingListItemId: "item-1" }), false);
    assert.equal(isShoppingListInput("remove", { shoppingListId: "list-1", shoppingListItemId: id }), false);
  }
});

test("quantity entry is integer, positive and database-representable", () => {
  const context = { shoppingListId: "list-1", shoppingListItemId: "item-1" };
  for (const quantity of ["2", null, undefined, 0, -1, 1.5, NaN, Infinity, MAX_REQUESTED_QUANTITY + 1]) {
    assert.equal(isShoppingListInput("update", { ...context, quantity }), false);
  }
  for (const quantity of [1, 7, MAX_REQUESTED_QUANTITY]) {
    assert.equal(isShoppingListInput("update", { ...context, quantity }), true);
  }
  assert.equal(quantityStateAfterChange(MAX_REQUESTED_QUANTITY, 0, MAX_REQUESTED_QUANTITY + 1), null);
  assert.deepEqual(quantityStateAfterChange(2, 2, 7), { quantity: 7, purchasedQuantity: 7 });
});

test("create/add/toggle inputs check strings, identity context and real booleans", () => {
  assert.equal(isShoppingListInput("create", { name: {}, targetMarket: "CA" }), false);
  assert.equal(isShoppingListInput("create", { name: "Trip", targetMarket: [] }), false);
  assert.equal(isShoppingListInput("create", { name: "x".repeat(501), targetMarket: "CA" }), false);
  const add = { shoppingListId: "list", productVariantId: "variant", quantity: 1 };
  assert.equal(isShoppingListInput("add", add), true);
  assert.equal(isShoppingListInput("add", { ...add, productSlug: "../../collection" }), false);
  assert.equal(isShoppingListInput("createWithVariant", { name: "Trip", targetMarket: "jp", productVariantId: "variant", quantity: 1 }), true);
  const context = { shoppingListId: "list", shoppingListItemId: "item" };
  for (const purchased of ["true", 1, null]) assert.equal(isShoppingListInput("purchased", { ...context, purchased }), false);
  for (const purchased of [true, false]) assert.equal(isShoppingListInput("purchased", { ...context, purchased }), true);
});

test("collection enums, IDs, half-star ratings and confirmations are validated", () => {
  const context = { productSlug: "dokdo-toner", productVersionId: "version", productVariantId: "variant" };
  assert.equal(isProductCollectionInput({ ...context, intent: { type: "ADD_WANT" } }), true);
  for (const type of [undefined, "DELETE_USER", [], 1]) assert.equal(isProductCollectionInput({ ...context, intent: { type } }), false);
  for (const ratingHalfSteps of ["4", 1, 11, 2.5, NaN, Infinity]) {
    assert.equal(isProductCollectionInput({ ...context, intent: { type: "SET_RATING", ratingHalfSteps } }), false);
  }
  for (const ratingHalfSteps of [2, 3, 10]) assert.equal(isProductCollectionInput({ ...context, intent: { type: "SET_RATING", ratingHalfSteps } }), true);
  assert.equal(isProductCollectionInput({ ...context, productVersionId: "", intent: { type: "ADD_OWNED" } }), false);
  assert.equal(isProductCollectionInput({ ...context, intent: { type: "ADD_ANOTHER_PURCHASE", confirmed: "yes" } }), false);
});

test("query filters handle repeated/oversized parameters and comparison has at most four IDs", () => {
  assert.equal(boundedParameter(["toner", "serum"]), undefined);
  assert.equal(boundedParameter("x".repeat(81), 80), undefined);
  assert.deepEqual(boundedParameters("toner"), ["toner"]);
  assert.deepEqual(boundedParameters(["toner", "serum", "toner"]), ["toner", "serum"]);
  assert.deepEqual(boundedParameters(["toner", "x".repeat(81)], 80), ["toner"]);
  assert.equal(priceParameter(["1"]), undefined);
  for (const value of ["Infinity", "-1", "", "NaN", "1e999", "0x20"]) assert.equal(priceParameter(value), undefined);
  assert.equal(priceParameter(" 12.50 "), 12.5);
  assert.deepEqual(comparisonIds(["a"]), []);
  assert.deepEqual(comparisonIds("a,a,b,c,d,e"), ["a", "b", "c", "d"]);
});

test("external navigation permits HTTP(S) only without embedded credentials", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "//evil.test", "/relative", "https://u:p@retailer.test", "https://safe.test\n.evil.test"]) {
    assert.equal(safeExternalUrl(value), undefined);
  }
  assert.equal(safeExternalUrl("https://retailer.test/item?q=1"), "https://retailer.test/item?q=1");
});

test("production headers restrict framing, objects, origins and disable eval", () => {
  const key = `pk_live_${Buffer.from("clerk.example.com$").toString("base64")}`;
  const headers = new Map(securityHeaders(true, key).map(({ key, value }) => [key, value]));
  const csp = headers.get("Content-Security-Policy")!;
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  for (const host of PRODUCT_IMAGE_HOSTS) {
    assert.match(csp, new RegExp(`https://${host.replaceAll(".", "\\.")}`));
  }
  assert.doesNotMatch(csp, /img-src[^;]*https:\/\/\*/);
  assert.match(csp, /https:\/\/clerk.example.com/);
  assert.match(csp, /https:\/\/\*\.protect.clerk.com:\*/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(securityHeaders(false).some(({ key }) => key === "Strict-Transport-Security"), false);
});
