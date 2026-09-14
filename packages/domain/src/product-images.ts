export type ProductImageCandidate = {
  id: string;
  productVersionId: string;
  productVariantId: string | null;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
};

/**
 * Selects an image without borrowing packaging from another version or variant.
 * Exact-variant imagery wins; version-wide imagery is the safe fallback.
 */
export function selectPrimaryProductImage<T extends ProductImageCandidate>(
  images: readonly T[],
  selectedVersionId: string,
  selectedVariantId: string | null,
): T | null {
  return (
    [...images]
      .filter(
        (image) =>
          image.productVersionId === selectedVersionId &&
          (image.productVariantId === null ||
            (selectedVariantId !== null && image.productVariantId === selectedVariantId)),
      )
      .sort((left, right) => {
        const leftScope = left.productVariantId === selectedVariantId ? 0 : 1;
        const rightScope = right.productVariantId === selectedVariantId ? 0 : 1;
        return (
          leftScope - rightScope ||
          Number(right.isPrimary) - Number(left.isPrimary) ||
          left.sortOrder - right.sortOrder ||
          left.id.localeCompare(right.id)
        );
      })[0] ?? null
  );
}