import Link from "next/link";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    canonicalName: string;
    originMarket: string | null;
    brand: { name: string };
    primaryCanonicalCategory: { displayName: string };
    currentVersion: {
      versionName: string;
      defaultVariant: {
        displaySize: string;
        benchmarkPrices: Array<{
          amount: { toString(): string };
          nativeCurrency: string;
          type: string;
        }>;
      } | null;
    } | null;
  };
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

export function ProductCard({ product }: ProductCardProps) {
  const benchmark = product.currentVersion?.defaultVariant?.benchmarkPrices[0];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex h-36 items-center justify-center rounded-lg bg-slate-100 text-4xl font-semibold text-slate-300">
        {product.brand.name.slice(0, 1)}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {product.brand.name}
      </p>
      <h2 className="mt-1 text-lg font-semibold">
        <Link className="hover:underline" href={"/products/" + product.slug}>
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
    </article>
  );
}
