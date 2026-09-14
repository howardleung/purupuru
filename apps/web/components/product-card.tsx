import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import Link from "next/link";

import type { CatalogueProduct } from "../lib/catalogue-contract";
import { productSelectionHref } from "../lib/product-links";
import { ProductImage } from "./product-image";

export type ProductCardProps = { product: CatalogueProduct; personalState?: MyCollectionItem | null };

export function catalogueProductHref(product: CatalogueProduct) {
  return product.currentVersion
    ? productSelectionHref({
        productSlug: product.slug,
        versionKey: product.currentVersion.versionCode ?? product.currentVersion.id,
        variantId: product.currentVersion.defaultVariant?.id,
      })
    : `/products/${encodeURIComponent(product.slug)}`;
}

export function formatCataloguePrice(product: CatalogueProduct) {
  const price = product.currentVersion?.lowestCanadianPrice;
  if (!price) return null;
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: price.nativeCurrency,
    maximumFractionDigits: price.nativeCurrency === "CAD" ? 2 : 0,
  }).format(price.nativeAmount)} ${price.nativeCurrency}`;
}

export function ProductCard({ product, personalState = null }: ProductCardProps) {
  const href = catalogueProductHref(product);
  const price = formatCataloguePrice(product);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Link aria-label={`View ${product.brand.name} ${product.canonicalName}`} href={href}>
        <ProductImage
          className="h-48 rounded-none sm:h-56"
          image={product.currentVersion?.image ?? null}
          productName={`${product.brand.name} ${product.canonicalName}`}
          sizes="(max-width: 640px) calc(100vw - 4rem), 34rem"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand.name}</p>
        <h2 className="mt-1 text-lg font-semibold"><Link className="hover:underline" href={href}>{product.canonicalName}</Link></h2>
        <p className="mt-2 text-sm text-slate-600">
          {product.primaryCanonicalCategory.displayName}
          {product.currentVersion?.defaultVariant ? ` · ${product.currentVersion.defaultVariant.displaySize}` : ""}
        </p>
        <p className="mt-4 text-sm">
          <span className="text-slate-500">Lowest tracked Canada price: </span>
          <span className="font-semibold">{price ?? "Not currently tracked"}</span>
        </p>
        {personalState?.ratingHalfSteps !== null && personalState?.ratingHalfSteps !== undefined ? (
          <p className="mt-3 text-sm text-amber-700">Your rating · {(personalState.ratingHalfSteps / 2).toFixed(1)} / 5</p>
        ) : null}
        <Link className="mt-auto pt-5 text-sm font-medium underline decoration-slate-300 underline-offset-4" href={href}>View product</Link>
      </div>
    </article>
  );
}
