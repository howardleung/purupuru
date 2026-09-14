import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(
  new URL("../../packages/database/prisma/schema.prisma", import.meta.url),
  "utf8",
);
const actions = readFileSync(
  new URL("../../apps/web/app/shopping-lists/actions.ts", import.meta.url),
  "utf8",
);
const pricing = readFileSync(
  new URL("../../apps/web/lib/shopping-lists.ts", import.meta.url),
  "utf8",
);

test("shopping-list rows remain unique by list and exact variant", () => {
  const model = schema.match(/model ShoppingListItem \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(model, /@@unique\(\[shoppingListId, productVariantId\]\)/);
});

test("shopping lists use target benchmarks and the settled Canadian home market without a schema change", () => {
  const model = schema.match(/model ShoppingList \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(model, /targetMarket\s+String/);
  assert.doesNotMatch(model, /comparisonMarket/);
  assert.match(pricing, /const DEFAULT_COMPARISON_MARKET = "CA"/);
  assert.match(pricing, /selectStrongestBenchmark/);
  assert.match(pricing, /benchmarkPrices[\s\S]*?benchmark/);
  assert.match(pricing, /destinationOffers: eligibleOffersFor\(list\.targetMarket\)/);
  assert.match(pricing, /localOffers: eligibleOffersFor\(DEFAULT_COMPARISON_MARKET\)/);
});

test("list reads and mutations are scoped to the authenticated local user", () => {
  assert.match(actions, /shoppingList\.findFirst\([\s\S]*?userId: user\.id/);
  assert.match(actions, /shoppingList: \{ userId: user\.id \}/);
});

test("reversible checklist toggles do not create or delete durable purchase history", () => {
  const toggleAction = actions.match(/export async function markShoppingListItemPurchased[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(toggleAction, /data: \{ purchasedQuantity \}/);
  assert.doesNotMatch(toggleAction, /purchaseInstance\.(create|delete)/);
  assert.doesNotMatch(toggleAction, /collectionEntry/);
});

test("item removal is user scoped and detaches durable purchase history", () => {
  const removeAction = actions.match(/export async function removeShoppingListItem[\s\S]*$/)?.[0] ?? "";
  assert.match(removeAction, /shoppingList: \{ userId: user\.id \}/);
  assert.match(removeAction, /purchaseInstance\.updateMany/);
  assert.match(removeAction, /shoppingListItemId: null/);
  assert.match(removeAction, /shoppingListItem\.delete/);
});

test("shopping-list pricing reuses the runtime Bank of Canada conversion layer", () => {
  assert.match(pricing, /import \{ convertToCad \} from "\.\/currency-conversion"/);
  assert.doesNotMatch(pricing, /cadConvertedPrice/);
});
