import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseVariantForVersion,
  convertCurrencyAmount,
  compareOffersByProductPrice,
} from "../../packages/domain/src/index.ts";

test("version changes preserve the exact normalized size when available", () => {
  const selected = { id: "current-90", normalizedQuantity: 90, normalizedUnit: "g" };
  const nextVariants = [
    { id: "previous-60", normalizedQuantity: 60, normalizedUnit: "g" },
    { id: "previous-90", normalizedQuantity: 90, normalizedUnit: "g" },
  ];

  assert.equal(
    chooseVariantForVersion(nextVariants, selected, "previous-60")?.id,
    "previous-90",
  );
});

test("version changes fall back to the target version default size", () => {
  const selected = { id: "current-40", normalizedQuantity: 40, normalizedUnit: "g" };
  const nextVariants = [
    { id: "previous-60", normalizedQuantity: 60, normalizedUnit: "g" },
    { id: "previous-90", normalizedQuantity: 90, normalizedUnit: "g" },
  ];

  assert.equal(
    chooseVariantForVersion(nextVariants, selected, "previous-90")?.id,
    "previous-90",
  );
});

test("Canadian offers sort by raw comparable product price and ignore shipping", () => {
  const offers = [
    {
      productPrice: 2500,
      nativeCurrency: "JPY",
      cadConvertedPrice: 23,
      shippingAmount: 0,
    },
    {
      productPrice: 22,
      nativeCurrency: "CAD",
      cadConvertedPrice: null,
      shippingAmount: 12,
    },
    {
      productPrice: 20,
      nativeCurrency: "CAD",
      cadConvertedPrice: null,
      shippingAmount: 30,
    },
  ];

  assert.deepEqual(
    offers.sort(compareOffersByProductPrice).map((offer) => offer.productPrice),
    [20, 22, 2500],
  );
});

test("native-only offers remain deterministically ordered without false conversion", () => {
  const offers = [
    { productPrice: 2500, nativeCurrency: "JPY", cadConvertedPrice: null },
    { productPrice: 12000, nativeCurrency: "KRW", cadConvertedPrice: null },
    { productPrice: 2200, nativeCurrency: "JPY", cadConvertedPrice: null },
  ];

  assert.deepEqual(
    offers.sort(compareOffersByProductPrice).map((offer) => offer.productPrice),
    [2200, 2500, 12000],
  );
});

test("currency conversion rounds JPY and KRW display values to Canadian cents", () => {
  assert.equal(convertCurrencyAmount(2508, 0.00902), 22.62);
  assert.equal(convertCurrencyAmount(24000, 0.001034), 24.82);
});

test("currency conversion rejects unusable rates without inventing a value", () => {
  assert.equal(convertCurrencyAmount(2508, Number.NaN), null);
  assert.equal(convertCurrencyAmount(2508, 0), null);
});
