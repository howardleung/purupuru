import type { Metadata } from "next";
import Link from "next/link";

import { getBrands } from "../../lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Skincare brands" };

export default async function BrandsPage() {
  const brands = await getBrands();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-medium text-slate-500">Browse the supported catalogue</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Brands</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Canonical brand names currently represented in PuruPuru. Rich brand profiles can grow from this factual index later.</p>
      {brands.length > 0 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50" href={`/catalogue?brand=${encodeURIComponent(brand.slug)}`} key={brand.id}>
              <h2 className="font-semibold">{brand.name}</h2>
              {brand.originMarket ? <p className="mt-1 text-sm text-slate-500">Origin market · {brand.originMarket}</p> : null}
            </Link>
          ))}
        </div>
      ) : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No brands are currently available.</p>}
    </main>
  );
}
