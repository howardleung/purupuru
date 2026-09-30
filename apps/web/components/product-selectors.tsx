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
    <div className="grid gap-6">
      {versions.length > 1 ? (
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Formula</legend>
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
                    "rounded-md border px-3 py-2 text-sm " +
                    (isSelected
                      ? "border-brand-action bg-brand-action text-white"
                      : "border-slate-300 text-slate-700 hover:border-slate-500")
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

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Size</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedVersion.variants.map((variant) => {
            const isSelected = variant.id === selectedVariant.id;
            return (
              <Link
                aria-current={isSelected ? "page" : undefined}
                className={
                  "rounded-md border px-3 py-2 text-sm " +
                  (isSelected
                    ? "border-brand-action bg-brand-action text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-500")
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
    </div>
  );
}
