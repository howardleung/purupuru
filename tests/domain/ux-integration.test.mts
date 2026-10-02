import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { productSelectionHref } from "../../apps/web/lib/product-links.ts";
import { resolveRetailerLogo } from "../../apps/web/lib/retailer-logos.ts";

const homePage = readFileSync(new URL("../../apps/web/app/page.tsx", import.meta.url), "utf8");
const cataloguePage = readFileSync(new URL("../../apps/web/app/catalogue/page.tsx", import.meta.url), "utf8");
const catalogueQuery = readFileSync(new URL("../../apps/web/lib/catalogue.ts", import.meta.url), "utf8");
const catalogueCard = readFileSync(new URL("../../apps/web/components/product-card.tsx", import.meta.url), "utf8");
const catalogueBrowser = readFileSync(new URL("../../apps/web/components/catalogue-browser.tsx", import.meta.url), "utf8");
const productLinks = readFileSync(new URL("../../apps/web/lib/product-links.ts", import.meta.url), "utf8");
const collectionCard = readFileSync(new URL("../../apps/web/components/collection-browser.tsx", import.meta.url), "utf8");
const shoppingList = readFileSync(new URL("../../apps/web/components/shopping-list-details.tsx", import.meta.url), "utf8");
const productSelectors = readFileSync(new URL("../../apps/web/components/product-selectors.tsx", import.meta.url), "utf8");
const comparePage = readFileSync(new URL("../../apps/web/app/compare/page.tsx", import.meta.url), "utf8");
const collectionPage = readFileSync(new URL("../../apps/web/app/collection/page.tsx", import.meta.url), "utf8");
const shoppingListsPage = readFileSync(new URL("../../apps/web/app/shopping-lists/page.tsx", import.meta.url), "utf8");
const appIcon = readFileSync(new URL("../../apps/web/app/icon.svg", import.meta.url), "utf8");
const primaryNav = readFileSync(new URL("../../apps/web/components/primary-nav.tsx", import.meta.url), "utf8");
const globalSearch = readFileSync(new URL("../../apps/web/components/global-search.tsx", import.meta.url), "utf8");
const megaMenu = readFileSync(new URL("../../apps/web/components/product-mega-menu.tsx", import.meta.url), "utf8");
const productPage = readFileSync(new URL("../../apps/web/app/products/[slug]/page.tsx", import.meta.url), "utf8");
const productImage = readFileSync(new URL("../../apps/web/components/product-image.tsx", import.meta.url), "utf8");
const offerSection = readFileSync(new URL("../../apps/web/components/offer-section.tsx", import.meta.url), "utf8");
const retailerLink = readFileSync(new URL("../../apps/web/components/retailer-link.tsx", import.meta.url), "utf8");
const retailerLogos = readFileSync(new URL("../../apps/web/lib/retailer-logos.ts", import.meta.url), "utf8");
const privacyPage = readFileSync(new URL("../../apps/web/app/privacy/page.tsx", import.meta.url), "utf8");
const termsPage = readFileSync(new URL("../../apps/web/app/terms/page.tsx", import.meta.url), "utf8");

test("collection and shopping-list actions reuse one serializable retry policy", () => {
  for (const path of ["products/[slug]/collection-actions.ts", "shopping-lists/actions.ts"]) {
    const actions = readFileSync(new URL(`../../apps/web/app/${path}`, import.meta.url), "utf8");
    assert.match(actions, /import \{ runSerializable \} from .*lib\/transactions/);
    assert.doesNotMatch(actions, /function runSerializable|function isRetryableTransactionError|prisma\.\$transaction/);
  }
});

test("search accessibility only references mounted suggestions", () => {
  assert.match(globalSearch, /aria-controls=\{isOpen \?/);
  assert.match(globalSearch, /aria-activedescendant=\{isOpen && activeIndex >= 0 && activeIndex < items.length/);
  assert.match(globalSearch, /aria-label="Search suggestions"/);
});

test("current product identity appears in metadata and both wordmarks", () => {
  const layout = readFileSync(new URL("../../apps/web/app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /default: "PuruPuru"/);
  assert.match(layout, /template: "%s \| PuruPuru"/);
  assert.match(layout, /siteName: "PuruPuru"/);
  assert.match(layout, /twitter: \{[\s\S]*?title: "PuruPuru"/);
  for (const file of ["site-header", "site-footer"]) {
    const component = readFileSync(new URL(`../../apps/web/components/${file}.tsx`, import.meta.url), "utf8");
    assert.match(component, /PuruPuru/);
  }
  assert.match(homePage, /PuruPuru — skincare discovery and price comparison/);
});

test("browser titles and favicon use the compact PuruPuru identity", () => {
  assert.doesNotMatch(homePage, /title: "Compare skincare prices across markets"/);
  assert.match(cataloguePage, /title: "Skincare Catalogue"/);
  assert.match(comparePage, /title: "Compare Products"/);
  assert.match(collectionPage, /title: "My Collection"/);
  assert.match(shoppingListsPage, /title: "Shopping Lists"/);
  assert.match(productPage, /const title = family\.canonicalName/);
  assert.match(appIcon, /<svg[\s\S]*<path[\s\S]*#88A2B3[\s\S]*<\/svg>/);
});

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

test("all core return paths preserve exact version and variant context", () => {
  for (const source of [collectionCard, shoppingList, productSelectors]) {
    assert.match(source, /productSelectionHref/);
  }
  assert.match(catalogueCard, /catalogueProductHref/);
  assert.match(productLinks, /productSelectionHref\(\{/);
});

test("catalogue personalization is optional and limited to visible current versions", () => {
  assert.match(cataloguePage, /isClerkConfigured \? getCurrentUser\(\) : Promise\.resolve\(null\)/);
  assert.match(cataloguePage, /productVersionIds: \[\.\.\.new Set\(catalogue\.products\.flatMap/);
  assert.match(catalogueCard, /personalState\?: MyCollectionItem \| null/);
  assert.doesNotMatch(catalogueCard, /prisma\./);
});

test("catalogue renders one exact variant per row with capacity controls and variant-scoped pricing", () => {
  assert.match(catalogueQuery, /expandCatalogueVariants/);
  assert.match(catalogueQuery, /currentVersion:[\s\S]*variants:/);
  assert.match(catalogueQuery, /variant\.offers/);
  assert.match(catalogueQuery, /filterCatalogueCapacity/);
  assert.match(catalogueQuery, /primaryCanonicalCategoryId: \{ in: categoryIds \}/);
  assert.match(catalogueQuery, /brand: \{ slug: options\.brandSlug \}/);
  assert.match(catalogueQuery, /filterCataloguePrice/);
  assert.match(catalogueBrowser, /name="capacity"/);
  assert.match(catalogueBrowser, /name="minCapacity"/);
  assert.match(catalogueBrowser, /name="maxCapacity"/);
  assert.match(catalogueBrowser, />Size<\/th>/);
  assert.match(catalogueBrowser, /product\.currentVersion\?\.variant\.displaySize/);
  assert.match(catalogueBrowser, /lg:hidden[\s\S]*uppercase tracking-wide text-slate-500">Size/);
});

test("public homepage is database-backed and does not require authentication", () => {
  assert.match(homePage, /await getCatalogue\(\)/);
  assert.match(homePage, /<GlobalSearch/);
  assert.match(globalSearch, /action="\/catalogue"/);
  assert.doesNotMatch(homePage, /getCurrentUser|getOrCreateCurrentUser/);
});

test("primary navigation exposes public and private destinations with active state", () => {
  for (const [href, label] of [
    ["/", "Home"],
    ["/catalogue", "Browse"],
    ["/brands", "Brands"],
    ["/collection", "My Collection"],
    ["/shopping-lists", "Shopping Lists"],
    ["/about", "About"],
  ]) {
    assert.match(primaryNav, new RegExp(`href: "${href.replace("/", "\\/")}", label: "${label}"`));
  }
  assert.match(primaryNav, /usePathname/);
  assert.match(primaryNav, /aria-current=\{active \? "page"/);
});

test("global search is grouped, debounced, cancellable, and keyboard-operable", () => {
  assert.match(globalSearch, /role="combobox"/);
  assert.match(globalSearch, /Products/);
  assert.match(globalSearch, /Brands/);
  assert.match(globalSearch, /Categories/);
  assert.match(globalSearch, /AbortController/);
  assert.match(globalSearch, /220/);
  assert.match(globalSearch, /ArrowDown/);
  assert.match(globalSearch, /View all results/);
});

test("product menu and product-page hierarchy follow the structural UX contract", () => {
  assert.match(megaMenu, /\/api\/categories/);
  assert.match(megaMenu, /aria-expanded=\{isOpen\}/);
  assert.match(megaMenu, /featuredSlugs/);
  assert.match(productPage, /<PersonalActionsModal/);
  assert.ok(productPage.indexOf('title="Buy in Canada"') < productPage.indexOf("<PriceHistorySection"));
  assert.ok(productPage.indexOf('title={`Buy in') < productPage.indexOf("<PriceHistorySection"));
  assert.equal(productPage.match(/Strongest verified benchmark/g)?.length, 1);
  assert.doesNotMatch(productPage, />Benchmark prices</);
  assert.match(productPage, /md:col-start-1 md:row-span-2 md:row-start-1/);
  assert.match(productPage, /md:col-start-2 md:row-start-2/);
});

test("ordinary products emphasize size and only expose formula choices for multiple versions", () => {
  assert.match(productSelectors, /versions\.length > 1/);
  assert.match(productSelectors, />Formula</);
  assert.doesNotMatch(productSelectors, /· Current/);
  assert.doesNotMatch(comparePage, /label="Formulation"/);
  assert.match(productPage, /versionOptions\.length > 1/);
  assert.match(collectionCard, /item\.showVersionName/);
});

test("retailer links use an approved local-logo registry with an accessible text fallback", () => {
  const registry = {
    "retailer:shoppers-drug-mart-ca": {
      src: "/retailers/shoppers.svg",
      width: 120,
      height: 32,
    },
  } as const;

  assert.deepEqual(
    resolveRetailerLogo("retailer:shoppers-drug-mart-ca", registry),
    registry["retailer:shoppers-drug-mart-ca"],
  );
  assert.equal(resolveRetailerLogo("retailer:well-ca", registry), null);
  assert.equal(resolveRetailerLogo(null, registry), null);
  assert.match(retailerLink, /aria-label={`Shop this listing at \$\{name\}`}/);
  assert.match(retailerLink, /className=\{showName \? "ml-2" : "sr-only"\}/);
  assert.match(retailerLink, /group-focus-visible:block/);
  assert.match(retailerLink, /href=\{safeExternalUrl\(href\)\}/);
  assert.match(retailerLink, /resolveRetailerLogo/);
  assert.match(retailerLogos, /remote logo hotlinks/);
  assert.match(retailerLogos, /Retailer\.sourceKey/);
  assert.match(offerSection, /<RetailerLink/);
  assert.match(offerSection, /sourceKey=\{offer\.retailer\.sourceKey\}/);
  assert.match(offerSection, /showName/);
  assert.match(offerSection, /mt-4 grid gap-2 sm:hidden/);
  assert.match(offerSection, /mt-4 hidden overflow-hidden rounded-xl border border-slate-200 sm:block/);
  assert.doesNotMatch(offerSection, />\s*\{offer\.retailer\.name\}\s*<\/a>/);
});

test("collection controls retain successful state for the selected product context and expose remove actions", () => {
  const collectionActions = readFileSync(
    new URL("../../apps/web/components/collection-actions.tsx", import.meta.url),
    "utf8",
  );

  assert.match(collectionActions, /if \(previousScope\.current !== scopeKey\)/);
  assert.match(collectionActions, /setState\(initialStateRef\.current\)/);
  assert.match(collectionActions, /REMOVE_WOULD_REPURCHASE/);
  assert.match(collectionActions, /Remove Would Repurchase/);
  assert.match(collectionActions, /aria-pressed=\{state\.wouldRepurchase\}/);
});

test("shopping lists expose collapsed-row removal, simple quantity, and benchmark planning", () => {
  assert.match(shoppingList, /selectedLocalOfferIds/);
  assert.match(shoppingList, /> Remove<\/button>/);
  assert.match(shoppingList, /Decrease .* quantity/);
  assert.match(shoppingList, /Increase .* quantity/);
  assert.match(shoppingList, /Edit .* quantity/);
  assert.match(shoppingList, /type="number"/);
  assert.match(shoppingList, /onBlur=\{\(\) => \{ if \(steppingItemId\.current !== item\.id\) commitQuantityDraft\(item\); \}\}/);
  assert.match(shoppingList, /event\.key === "Enter"/);
  assert.doesNotMatch(shoppingList, /Planned quantity|Purchased quantity/);
  assert.match(shoppingList, /verified target-market benchmark/);
  assert.match(shoppingList, /Canadian comparison defaults to the cheapest eligible product price/);
});

test("product imagery has an intentional runtime fallback", () => {
  assert.match(productImage, /onError=\{\(\) => setFailedUrl\(image.url\)\}/);
  assert.match(productImage, /failedUrl === image.url/);
  assert.match(productImage, /Image coming soon/);
  assert.match(productImage, /alt=\{image\.altText\}/);
});

test("catalogue sort validation and product benchmark ordering reuse canonical definitions", () => {
  const catalogue = readFileSync(new URL("../../apps/web/lib/catalogue.ts", import.meta.url), "utf8");
  assert.match(catalogue, /catalogueSorts.some\(\(sort\) => sort.value === value\)/);
  assert.match(productPage, /const primaryBenchmark = BENCHMARK_PRECEDENCE/);
});

test("draft legal pages visibly require professional review", () => {
  assert.match(privacyPage, /legalReview/);
  assert.match(termsPage, /legalReview/);
});
