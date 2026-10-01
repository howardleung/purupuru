import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CatalogueProduct } from "../lib/catalogue-contract";
import { catalogueProductHref } from "../lib/product-links";
import { ProductImage } from "./product-image";

export type ProductCardProps = { product: CatalogueProduct; personalState?: MyCollectionItem | null; compact?: boolean };

export function formatCataloguePrice(product: CatalogueProduct) {
  const price = product.currentVersion?.lowestCanadianPrice;
  if (!price) return null;
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: price.nativeCurrency,
    maximumFractionDigits: price.nativeCurrency === "CAD" ? 2 : 0,
  }).format(price.nativeAmount)} ${price.nativeCurrency}`;
}

export function ProductCard({ product, personalState = null, compact = false }: ProductCardProps) {
  const href = catalogueProductHref(product);
  const price = formatCataloguePrice(product);
  return (
    <article className={`surface-card group overflow-hidden transition hover:shadow-float ${compact ? "grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 p-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]" : "flex h-full flex-col"}`}>
      <Link aria-label={`View ${product.brand.name} ${product.canonicalName}${product.currentVersion ? ` ${product.currentVersion.variant.displaySize}` : ""}`} className="min-w-0" href={href}>
        <ProductImage
          className={compact ? "h-full min-h-36 rounded-xl sm:min-h-40" : "h-48 rounded-none sm:h-56"}
          image={product.currentVersion?.image ?? null}
          productName={`${product.brand.name} ${product.canonicalName}`}
          sizes={compact ? "(max-width: 640px) 104px, 144px" : "(max-width: 640px) calc(100vw - 4rem), 34rem"}
        />
      </Link>
      <div className={`min-w-0 ${compact ? "flex flex-col justify-center py-2 pr-1" : "flex flex-1 flex-col p-4 sm:p-5"}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand.name}</p>
        <h3 className={`mt-1 font-extrabold leading-snug ${compact ? "text-sm sm:text-base" : "text-lg"}`}><Link className="hover:underline" href={href}>{product.canonicalName}</Link></h3>
        <p className="mt-2 text-sm text-slate-600">
          {product.primaryCanonicalCategory.displayName}
          {product.currentVersion ? ` · ${product.currentVersion.variant.displaySize}` : ""}
        </p>
        <p className={`${compact ? "mt-3 text-xs" : "mt-4 text-sm"}`}>
          <span className="block text-slate-500">Lowest tracked Canada price: </span>
          <span className="mt-1 block text-sm font-extrabold">{price ?? "Not currently tracked"}</span>
        </p>
        {personalState?.ratingHalfSteps !== null && personalState?.ratingHalfSteps !== undefined ? (
          <p className="mt-3 text-sm text-amber-700">Your rating · {(personalState.ratingHalfSteps / 2).toFixed(1)} / 5</p>
        ) : null}
        {!compact ? <Link className="ui-link mt-auto pt-5" href={href}>View product <ArrowRight aria-hidden className="h-4 w-4" /></Link> : null}
      </div>
    </article>
  );
}
