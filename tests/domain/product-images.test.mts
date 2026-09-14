import assert from "node:assert/strict";
import test from "node:test";

import { selectPrimaryProductImage } from "../../packages/domain/src/product-images.ts";

const image = (overrides: Partial<{
  id: string;
  productVersionId: string;
  productVariantId: string | null;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}> = {}) => ({
  id: "image",
  productVersionId: "version-current",
  productVariantId: null,
  url: "https://brand.example/product.png",
  altText: "Product packaging",
  isPrimary: false,
  sortOrder: 0,
  ...overrides,
});

test("image selection is isolated to the selected product version", () => {
  const selected = selectPrimaryProductImage(
    [
      image({ id: "wrong-version", productVersionId: "version-previous", isPrimary: true }),
      image({ id: "current-version" }),
    ],
    "version-current",
    "variant-90",
  );

  assert.equal(selected?.id, "current-version");
});

test("exact-variant image wins and another variant is never borrowed", () => {
  const selected = selectPrimaryProductImage(
    [
      image({ id: "other-size", productVariantId: "variant-40", isPrimary: true }),
      image({ id: "version-wide", isPrimary: true }),
      image({ id: "exact-size", productVariantId: "variant-90" }),
    ],
    "version-current",
    "variant-90",
  );

  assert.equal(selected?.id, "exact-size");
});

test("version-wide image is the intentional fallback when an exact variant image is missing", () => {
  const selected = selectPrimaryProductImage(
    [
      image({ id: "other-size", productVariantId: "variant-40", isPrimary: true }),
      image({ id: "fallback", isPrimary: true }),
    ],
    "version-current",
    "variant-90",
  );

  assert.equal(selected?.id, "fallback");
});

test("missing safe imagery returns null instead of showing the wrong packaging", () => {
  const selected = selectPrimaryProductImage(
    [image({ productVariantId: "variant-40" })],
    "version-current",
    "variant-90",
  );

  assert.equal(selected, null);
});