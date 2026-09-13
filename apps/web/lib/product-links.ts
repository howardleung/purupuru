export function productSelectionHref({
  productSlug,
  versionKey,
  variantId,
}: {
  productSlug: string;
  versionKey: string;
  variantId?: string | null;
}) {
  const params = new URLSearchParams({ version: versionKey });
  if (variantId) params.set("variant", variantId);
  return `/products/${encodeURIComponent(productSlug)}?${params.toString()}`;
}
