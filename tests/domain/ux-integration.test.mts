import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { productSelectionHref } from "../../apps/web/lib/product-links.ts";

const homePage = readFileSync(new URL("../../apps/web/app/page.tsx", import.meta.url), "utf8");
const cataloguePage = readFileSync(new URL("../../apps/web/app/catalogue/page.tsx", import.meta.url), "utf8");
const catalogueCard = readFileSync(new URL("../../apps/web/components/product-card.tsx", import.meta.url), "utf8");
const collectionCard = readFileSync(new URL("../../apps/web/components/collection-browser.tsx", import.meta.url), "utf8");
const shoppingList = readFileSync(new URL("../../apps/web/components/shopping-list-details.tsx", import.meta.url), "utf8");
const productSelectors = readFileSync(new URL("../../apps/web/components/product-selectors.tsx", import.meta.url), "utf8");
const primaryNav = readFileSync(new URL("../../apps/web/components/primary-nav.tsx", import.meta.url), "utf8");
const productImage = readFileSync(new URL("../../apps/web/components/product-image.tsx", import.meta.url), "utf8");
const privacyPage = readFileSync(new URL("../../apps/web/app/privacy/page.tsx", import.meta.url), "utf8");
const termsPage = readFileSync(new URL("../../apps/web/app/terms/page.tsx", import.meta.url), "utf8");

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

test("public homepage is database-backed and does not require authentication", () => {
  assert.match(homePage, /await getCatalogue\(\)/);
  assert.match(homePage, /action="\/catalogue"/);
  assert.doesNotMatch(homePage, /getCurrentUser|getOrCreateCurrentUser/);
});

test("primary navigation exposes public and private destinations with active state", () => {
  for (const [href, label] of [
    ["/", "Home"],
    ["/catalogue", "Browse"],
    ["/categories", "Categories"],
    ["/collection", "My Collection"],
    ["/shopping-lists", "Shopping Lists"],
    ["/about", "About"],
  ]) {
    assert.match(primaryNav, new RegExp(`href: "${href.replace("/", "\\/")}", label: "${label}"`));
  }
  assert.match(primaryNav, /usePathname/);
  assert.match(primaryNav, /aria-current=\{active \? "page"/);
});

test("product imagery has an intentional runtime fallback", () => {
  assert.match(productImage, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(productImage, /Image coming soon/);
  assert.match(productImage, /alt=\{image\.altText\}/);
});

test("draft legal pages visibly require professional review", () => {
  assert.match(privacyPage, /legalReview/);
  assert.match(termsPage, /legalReview/);
});