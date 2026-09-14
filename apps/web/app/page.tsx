import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "../components/product-card";
import { getCatalogue } from "../lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare skincare prices across markets",
  description:
    "Discover version-aware skincare, compare trusted prices across Canada, Japan, and Korea, and plan what to buy.",
  openGraph: {
    title: "Otoku — skincare discovery and price comparison",
    description:
      "Compare the exact skincare product, size, and market price before you buy.",
  },
};

export default async function HomePage() {
  const catalogue = await getCatalogue();
  const skincareRoot = catalogue.categories.find((category) => category.slug === "skincare");
  const featuredCategories = catalogue.categories
    .filter((category) => category.parentCategoryId === skincareRoot?.id)
    .slice(0, 8);
  const featuredProducts = catalogue.products.slice(0, 2);

  return (
    <main>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Skincare shopping, with context
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Compare the right product—not just the lowest-looking price.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Otoku helps you check exact versions and sizes, trustworthy local benchmarks,
              and tracked buying options before you buy skincare at home or while travelling.
            </p>
            <form action="/catalogue" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" method="get">
              <label className="sr-only" htmlFor="home-search">Search by product or brand</label>
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-600"
                id="home-search"
                name="q"
                placeholder="Search Round Lab, ANESSA…"
                type="search"
              />
              <button className="rounded-lg bg-slate-950 px-5 py-3 font-medium text-white" type="submit">
                Search skincare
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link className="font-medium underline decoration-slate-300 underline-offset-4" href="/catalogue">
                Browse all skincare
              </Link>
              <Link className="text-slate-600 underline decoration-slate-300 underline-offset-4" href="/categories">
                Explore categories
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">What Otoku keeps straight</p>
            <dl className="mt-5 space-y-5">
              <div>
                <dt className="font-medium">Exact product identity</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-600">Versions, formulations, and sizes stay separate.</dd>
              </div>
              <div>
                <dt className="font-medium">Honest price context</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-600">Native-market benchmarks stay primary; CAD conversions are approximate.</dd>
              </div>
              <div>
                <dt className="font-medium">Your private planning</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-600">Browse freely, then sign in only when you want to save, rate, or plan a list.</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Browse by product type</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Skincare categories</h2>
          </div>
          <Link className="text-sm font-medium underline decoration-slate-300 underline-offset-4" href="/categories">
            View all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              className="rounded-xl border border-slate-200 p-4 text-sm font-medium transition hover:border-slate-400 hover:bg-slate-50"
              href={`/categories/${category.slug}`}
              key={category.id}
            >
              {category.displayName}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Curated catalogue</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Products to explore</h2>
            </div>
            <Link className="text-sm font-medium underline decoration-slate-300 underline-offset-4" href="/catalogue">
              Browse catalogue
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              Curated products will appear here when catalogue data is available.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How comparison works</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["1", "Find the exact item", "Start with a product family, then select the formulation and size you actually mean."],
            ["2", "Compare trustworthy context", "See verified benchmarks, tracked offers, timestamps, and honest missing-data states."],
            ["3", "Save when it helps", "Sign in only to keep collection state, ratings, and destination shopping lists private."],
          ].map(([step, title, copy]) => (
            <article className="rounded-xl border border-slate-200 p-5" key={step}>
              <p className="text-sm font-semibold text-slate-500">Step {step}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}