import type { Metadata } from "next";
import Link from "next/link";

import { ProductImage } from "../../components/product-image";
import { catalogueProductHref, formatCataloguePrice } from "../../components/product-card";
import { getComparisonProducts } from "../../lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare products" };

const benchmarkLabels: Record<string, string> = {
  MSRP: "MSRP",
  RETAIL_PRICE: "Retail price",
  REFERENCE_PRICE: "Reference price",
};

function money(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(amount)} ${currency}`;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ products?: string }> }) {
  const params = await searchParams;
  const ids = (params.products ?? "").split(",").filter(Boolean);
  const products = await getComparisonProducts(ids);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Link className="text-sm font-medium text-slate-600 underline" href="/catalogue">← Back to catalogue</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">Compare products</h1>
      <p className="mt-2 max-w-3xl text-slate-600">A factual comparison of the selected current formulation and default exact size. Missing data stays visible as missing.</p>

      {products.length < 2 ? (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h2 className="font-semibold">Choose at least two products</h2>
          <p className="mt-2 text-sm text-slate-600">Use the comparison checkboxes in the catalogue to build a small comparison.</p>
          <Link className="mt-4 inline-block text-sm font-semibold underline" href="/catalogue">Browse products</Link>
        </section>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200" aria-label="Product comparison table">
          <table className="w-full min-w-[46rem] table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Attribute</th>
                {products.map((product) => (
                  <th className="min-w-52 px-4 py-4 align-top" key={product.id}>
                    <Link href={catalogueProductHref(product)}>
                      <ProductImage className="h-36" image={product.currentVersion?.image ?? null} productName={product.canonicalName} sizes="180px" />
                      <span className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand.name}</span>
                      <span className="mt-1 block text-base font-semibold">{product.canonicalName}</span>
                    </Link>
                    <Link className="mt-3 inline-block text-xs font-medium underline" href={`/compare?products=${products.filter((item) => item.id !== product.id).map((item) => item.id).join(",")}`}>Remove</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <ComparisonRow label="Category" values={products.map((product) => product.primaryCanonicalCategory.displayName)} />
              <ComparisonRow label="Formulation" values={products.map((product) => product.currentVersion?.versionName ?? "Not recorded")} />
              <ComparisonRow label="Exact size" values={products.map((product) => product.currentVersion?.defaultVariant?.displaySize ?? "Not recorded")} />
              <ComparisonRow label="Lowest Canada price" values={products.map((product) => formatCataloguePrice(product) ?? "No tracked eligible offer")} />
              <ComparisonRow
                label="Verified benchmarks"
                values={products.map((product) => {
                  const benchmarks = product.currentVersion?.benchmarks ?? [];
                  return benchmarks.length > 0
                    ? benchmarks.map((benchmark) => `${benchmarkLabels[benchmark.type] ?? benchmark.type} (${benchmark.market}) · ${money(benchmark.nativeAmount, benchmark.nativeCurrency)} · ${benchmark.sourceDisplayName}`).join("\n")
                    : "No verified benchmark";
                })}
                preserveLines
              />
              <ComparisonRow label="Public rating" values={products.map(() => "Not shown — cross-source normalization is not defined")} />
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Product-price comparisons exclude shipping. Affiliate relationships never affect selection or order.</p>
    </main>
  );
}

function ComparisonRow({ label, values, preserveLines = false }: { label: string; values: string[]; preserveLines?: boolean }) {
  return (
    <tr>
      <th className="bg-slate-50 px-4 py-4 align-top font-medium text-slate-600">{label}</th>
      {values.map((value, index) => <td className={`px-4 py-4 align-top text-slate-700 ${preserveLines ? "whitespace-pre-line" : ""}`} key={`${label}-${index}`}>{value}</td>)}
    </tr>
  );
}
