import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import type { CatalogueProduct } from "../lib/catalogue-contract";
import { catalogueProductHref } from "../lib/product-links";
import { ProductImage } from "./product-image";

export type ProductCardProps = { product: CatalogueProduct; personalState?: MyCollectionItem | null; compact?: boolean };

export function formatCataloguePrice(product: CatalogueProduct) {
  const price = product.currentVersion?.lowestCanadianPrice;
  if (!price) return null;
  const amount = price.amountCad ?? price.nativeAmount;
  const currency = price.amountCad === null ? price.nativeCurrency : "CAD";
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(amount)} ${currency}`;
}

export function ProductCard({ product, personalState = null, compact = false }: ProductCardProps) {
  const href = catalogueProductHref(product);
  const price = formatCataloguePrice(product);
  const sizeCount = product.currentVersion?.variants.length ?? 0;
  const rating = product.reviewSummary;
  return (
    <article className={`surface-card group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-float ${compact ? "grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 p-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]" : "flex h-full flex-col"}`}>
      <Link aria-label={`View ${product.brand.name} ${product.canonicalName}${product.currentVersion ? ` ${product.currentVersion.variant.displaySize}` : ""}`} className="min-w-0" href={href}>
        <ProductImage
          className={compact ? "h-full min-h-36 rounded-xl sm:min-h-40" : "aspect-square h-auto rounded-none !bg-[#f7f8f8]"}
          image={product.currentVersion?.image ?? null}
          productName={`${product.brand.name} ${product.canonicalName}`}
          sizes={compact ? "(max-width: 640px) 104px, 144px" : "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"}
        />
      </Link>
      <div className={`min-w-0 ${compact ? "flex flex-col justify-center py-2 pr-1" : "flex flex-1 flex-col p-3.5 sm:p-4"}`}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-slate-500">{product.brand.name}</p>
        <h3 className="mt-1 text-sm font-extrabold leading-snug text-brand-ink sm:text-base"><Link className="hover:underline" href={href}>{product.canonicalName}</Link></h3>
        {!compact ? (
          <div className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-slate-600">
            {rating.count > 0 ? <><Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="font-bold text-slate-800">{rating.average!.toFixed(1)}</span><span>({rating.count})</span></> : <span>Not yet rated</span>}
          </div>
        ) : null}
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {product.primaryCanonicalCategory.displayName}
          {product.currentVersion ? ` · ${product.currentVersion.variant.displaySize}` : ""}
        </p>
        {sizeCount > 1 ? <p className="mt-1 text-xs font-medium text-brand-action">{sizeCount} sizes available</p> : null}
        <p className={`${compact ? "mt-3 text-xs" : "mt-4 text-sm"}`}>
          <span className="block text-xs text-slate-500">{price ? "Lowest tracked price" : "Price tracking"}</span>
          <span className="mt-0.5 block font-extrabold text-slate-950">{price ?? "No Canada price tracked"}</span>
          {price && product.currentVersion?.lowestCanadianPrice ? <span className="mt-0.5 block text-[0.7rem] leading-4 text-slate-500">{product.currentVersion.variant.displaySize} · {product.currentVersion.lowestCanadianPrice.retailerName}</span> : null}
        </p>
        {personalState?.ratingHalfSteps !== null && personalState?.ratingHalfSteps !== undefined ? (
          <p className="mt-3 text-sm text-amber-700">Your rating · {(personalState.ratingHalfSteps / 2).toFixed(1)} / 5</p>
        ) : null}
        {!compact ? <Link className="ui-link mt-auto pt-4 text-xs" href={href}>Compare prices <ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link> : null}
      </div>
    </article>
  );
}
