import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { productSelectionHref } from "../../apps/web/lib/product-links.ts";

const cataloguePage = readFileSync(new URL("../../apps/web/app/page.tsx", import.meta.url), "utf8");
const catalogueCard = readFileSync(new URL("../../apps/web/components/product-card.tsx", import.meta.url), "utf8");
const collectionCard = readFileSync(new URL("../../apps/web/components/collection-browser.tsx", import.meta.url), "utf8");
const shoppingList = readFileSync(new URL("../../apps/web/components/shopping-list-details.tsx", import.meta.url), "utf8");
const productSelectors = readFileSync(new URL("../../apps/web/components/product-selectors.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../../apps/web/components/site-header.tsx", import.meta.url), "utf8");

test("product-selection links preserve exact version and variant context", () => {
  assert.equal(
    productSelectionHref({
      productSlug: "round-lab-1025-dokdo-toner",
      versionKey: "2026 current",
      variantId: "variant/200ml",
    }),
    "/products/round-lab-1025-dokdo-toner?version=2026+current&variant=variant%2F200ml",
  );
  assert.equal(
    productSelectionHref({ productSlug: "anessa-perfect-uv", versionKey: "current" }),
    "/products/anessa-perfect-uv?version=current",
  );
});

test("all core return paths reuse the shared version/variant link helper", () => {
  for (const source of [catalogueCard, collectionCard, shoppingList, productSelectors]) {
    assert.match(source, /productSelectionHref/);
  }
});

test("catalogue personalization is optional and limited to visible current versions", () => {
  assert.match(cataloguePage, /isClerkConfigured \? getCurrentUser\(\) : Promise\.resolve\(null\)/);
  assert.match(cataloguePage, /productVersionIds: catalogue\.products\.flatMap/);
  assert.match(catalogueCard, /personalState\?: MyCollectionItem \| null/);
  assert.doesNotMatch(catalogueCard, /prisma\./);
});

test("primary destinations stay visible while private data remains auth-gated", () => {
  assert.match(header, /\{ href: "\/", label: "Browse" \}/);
  assert.match(header, /\{ href: "\/collection", label: "My Collection" \}/);
  assert.match(header, /\{ href: "\/shopping-lists", label: "Shopping Lists" \}/);
  assert.match(header, /<SignedOut>/);
  assert.match(header, /<SignedIn>/);
});
