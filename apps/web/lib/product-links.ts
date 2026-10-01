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

export function catalogueProductHref(product: {
  slug: string;
  currentVersion: {
    id: string;
    versionCode: string | null;
    variant: { id: string };
  } | null;
}) {
  return product.currentVersion
    ? productSelectionHref({
        productSlug: product.slug,
        versionKey: product.currentVersion.versionCode ?? product.currentVersion.id,
        variantId: product.currentVersion.variant.id,
      })
    : `/products/${encodeURIComponent(product.slug)}`;
}
