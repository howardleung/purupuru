import { chooseVariantForVersion, type VariantIdentity } from "@beauty-platform/domain";
import Link from "next/link";

import { productSelectionHref } from "../lib/product-links";

type VariantOption = VariantIdentity & { displaySize: string };
type VersionOption = {
  id: string;
  versionName: string;
  versionCode: string | null;
  status: string;
  defaultVariantId: string | null;
  variants: VariantOption[];
};


export function ProductSelectors({
  productSlug,
  versions,
  selectedVersion,
  selectedVariant,
}: {
  productSlug: string;
  versions: VersionOption[];
  selectedVersion: VersionOption;
  selectedVariant: VariantOption;
}) {
  return (
    <div className="grid gap-4">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedVersion.variants.map((variant) => {
            const isSelected = variant.id === selectedVariant.id;
            return (
              <Link
                aria-current={isSelected ? "page" : undefined}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                  (isSelected
                    ? "border-brand-action bg-brand-action text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
                }
                href={productSelectionHref({
                  productSlug,
                  versionKey: selectedVersion.versionCode ?? selectedVersion.id,
                  variantId: variant.id,
                })}
                key={variant.id}
              >
                {variant.displaySize}
              </Link>
            );
          })}
        </div>
      </fieldset>

      {versions.length > 1 ? (
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formula</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {versions.map((version) => {
              const target = chooseVariantForVersion(
                version.variants,
                selectedVariant,
                version.defaultVariantId,
              );
              const isSelected = version.id === selectedVersion.id;
              return (
                <Link
                  aria-current={isSelected ? "page" : undefined}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                    (isSelected
                      ? "border-brand-action bg-brand-action text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
                  }
                  href={productSelectionHref({
                    productSlug,
                    versionKey: version.versionCode ?? version.id,
                    variantId: target?.id,
                  })}
                  key={version.id}
                >
                  {version.versionName}
                </Link>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
