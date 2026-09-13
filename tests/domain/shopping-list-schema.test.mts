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

test("list reads and mutations are scoped to the authenticated local user", () => {
  assert.match(actions, /shoppingList\.findFirst\([\s\S]*?userId: user\.id/);
  assert.match(actions, /shoppingList: \{ userId: user\.id \}/);
});

test("purchased deltas create linked shopping-list PurchaseInstances", () => {
  assert.match(actions, /purchaseInstance\.create\([\s\S]*?shoppingListItemId: item\.id/);
  assert.match(actions, /quantity: delta/);
  assert.match(actions, /source: "SHOPPING_LIST"/);
});

test("shopping-list pricing reuses the runtime Bank of Canada conversion layer", () => {
  assert.match(pricing, /import \{ convertToCad \} from "\.\/currency-conversion"/);
  assert.doesNotMatch(pricing, /cadConvertedPrice/);
});
