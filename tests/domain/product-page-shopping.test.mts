import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getOfferExtraLabels } from "../../packages/domain/src/index.ts";

const productPage = readFileSync(new URL("../../apps/web/app/products/[slug]/page.tsx", import.meta.url), "utf8");
const selectors = readFileSync(new URL("../../apps/web/components/product-selectors.tsx", import.meta.url), "utf8");
const offerSection = readFileSync(new URL("../../apps/web/components/offer-section.tsx", import.meta.url), "utf8");

test("structured offer extras exclude the primary item and retain additional product value", () => {
  const labels = getOfferExtraLabels({
    primaryProductVariantId: "variant-200",
    primaryQuantity: 1,
    items: [
      { label: "Toner 200 mL", quantity: 1, itemType: "SAME_PRODUCT", relatedProductVariantId: "variant-200" },
      { label: "Toner 500 mL", quantity: 1, itemType: "SAME_PRODUCT", relatedProductVariantId: "variant-500" },
      { label: "Mini cleanser", quantity: 1, itemType: "MINI", relatedProductVariantId: null },
      { label: "Sheet mask", quantity: 2, itemType: "OTHER_PRODUCT", relatedProductVariantId: null },
    ],
  });

  assert.deepEqual(labels, ["Toner 500 mL", "Mini cleanser", "2 × Sheet mask"]);
  assert.deepEqual(getOfferExtraLabels({ items: [], primaryProductVariantId: "variant", primaryQuantity: 1 }), []);
  assert.deepEqual(getOfferExtraLabels({ items: [], primaryProductVariantId: "variant", primaryQuantity: 2 }), ["2-pack"]);
  assert.deepEqual(getOfferExtraLabels({
    primaryProductVariantId: "variant",
    primaryQuantity: 1,
    items: [{ label: "Toner", quantity: 2, itemType: "SAME_PRODUCT", relatedProductVariantId: "variant" }],
  }), ["2-pack"]);
});

test("size controls sit below the image, remain compact, and preserve exact variant URLs", () => {
  const imageIndex = productPage.indexOf("<ProductImage");
  const selectorsIndex = productPage.indexOf("<ProductSelectors");
  const personalActionsIndex = productPage.indexOf("<PersonalActionsModal");
  assert.ok(imageIndex >= 0 && selectorsIndex > imageIndex && personalActionsIndex > selectorsIndex);
  assert.ok(selectors.indexOf(">Size</legend>") < selectors.indexOf(">Formula</legend>"));
  assert.match(selectors, /selectedVersion\.variants\.map/);
  assert.match(selectors, /rounded-full border px-3 py-1\.5/);
  assert.match(selectors, /variantId: variant\.id/);
  assert.match(selectors, /versionKey: selectedVersion\.versionCode \?\? selectedVersion\.id/);
});

test("desktop offer comparison uses the four settled columns with exact listing links", () => {
  const headers = [...offerSection.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map((match) => match[1]);
  assert.deepEqual(headers, ["Retailer", "Extras", "Availability", "Price"]);
  assert.doesNotMatch(offerSection, /<th[^>]*>Buy<\/th>|<th[^>]*>Shipping<\/th>|<th[^>]*>Verified<\/th>/);
  assert.match(offerSection, /<RetailerLink[\s\S]*?href=\{offer\.listingUrl\}[\s\S]*?showName/);
  assert.match(offerSection, /function OfferPriceLink/);
  assert.match(offerSection, /href=\{safeExternalUrl\(offer\.listingUrl\)\}/);
  assert.match(offerSection, /text-brand-action underline/);
  assert.match(productPage, /\.sort\(compareOffersByProductPrice\)/);
});

test("offer extras and responsive rows remain compact and omit shipping from primary comparison", () => {
  assert.match(offerSection, /getOfferExtraLabels/);
  assert.match(offerSection, /labels\.length > 0 \? labels\.join\(", "\) : "—"/);
  assert.doesNotMatch(offerSection, /shippingText|Calculated at checkout|<dt[^>]*>Shipping|<dt[^>]*>Verified/);
  assert.match(offerSection, /mt-4 grid gap-2 sm:hidden/);
  assert.match(offerSection, /rounded-xl border border-slate-200 p-3/);
  assert.match(offerSection, /<RetailerLink[\s\S]*?<OfferPriceLink offer=\{offer\}/);
});
