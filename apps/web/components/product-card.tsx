import type { MyCollectionItem } from "@beauty-platform/domain/my-collection";
import Link from "next/link";

import { productSelectionHref } from "../lib/product-links";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    canonicalName: string;
    originMarket: string | null;
    brand: { name: string };
    primaryCanonicalCategory: { displayName: string };
    currentVersion: {
      id: string;
      versionCode: string | null;
      versionName: string;
      defaultVariant: {
        id: string;
        displaySize: string;
        benchmarkPrices: Array<{
          amount: { toString(): string };
          nativeCurrency: string;
          type: string;
        }>;
      } | null;
    } | null;
  };
  personalState?: MyCollectionItem | null;
};

const benchmarkLabels: Record<string, string> = {
  MSRP: "MSRP",
  RETAIL_PRICE: "Retail price",
  REFERENCE_PRICE: "Reference price",
};

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);
  const digits = currency === "CAD" ? 2 : 0;
  const formatted = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return formatted + " " + currency;
}

function personalLabels(state: MyCollectionItem) {
  return [
    state.wants ? "Want" : null,
    state.tried ? "Tried" : null,
    state.owned ? "Owned" : null,
    state.holyGrail ? "Holy Grail" : null,
    state.wouldRepurchase ? "Would Repurchase" : null,
  ].filter((value): value is string => Boolean(value));
}

export function ProductCard({ product, personalState = null }: ProductCardProps) {
  const benchmark = product.currentVersion?.defaultVariant?.benchmarkPrices[0];
  const href = product.currentVersion
    ? productSelectionHref({
        productSlug: product.slug,
        versionKey: product.currentVersion.versionCode ?? product.currentVersion.id,
        variantId: product.currentVersion.defaultVariant?.id,
      })
    : `/products/${encodeURIComponent(product.slug)}`;
  const labels = personalState ? personalLabels(personalState) : [];

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <Link
        aria-label={`View ${product.brand.name} ${product.canonicalName}`}
        className="mb-5 flex h-32 items-center justify-center rounded-lg bg-slate-100 text-4xl font-semibold text-slate-300 sm:h-36"
        href={href}
      >
        {product.brand.name.slice(0, 1)}
      </Link>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {product.brand.name}
      </p>
      <h2 className="mt-1 text-lg font-semibold">
        <Link className="hover:underline" href={href}>
          {product.canonicalName}
        </Link>
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {product.primaryCanonicalCategory.displayName}
        {product.currentVersion?.defaultVariant
          ? " · " + product.currentVersion.defaultVariant.displaySize
          : ""}
      </p>
      {benchmark ? (
        <p className="mt-4 text-sm">
          <span className="text-slate-500">{benchmarkLabels[benchmark.type]}: </span>
          <span className="font-medium">
            {formatAmount(benchmark.amount.toString(), benchmark.nativeCurrency)}
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No verified benchmark available.</p>
      )}

      {personalState ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">Your current-version activity</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {labels.map((label) => (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700" key={label}>
                {label}
              </span>
            ))}
            {personalState.ratingHalfSteps !== null ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                {(personalState.ratingHalfSteps / 2).toFixed(1)} / 5
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <Link className="mt-auto pt-5 text-sm font-medium underline decoration-slate-300 underline-offset-4" href={href}>
        View product
      </Link>
    </article>
  );
}
