import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, Search, ShieldCheck } from "lucide-react";

import { CategorySymbol, categoryTone } from "../components/category-symbol";
import { GlobalSearch } from "../components/global-search";
import { catalogueProductHref, ProductCard } from "../components/product-card";
import { ProductImage } from "../components/product-image";
import { getCatalogue } from "../lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Compare skincare prices across markets",
  description: "Discover version-aware skincare, compare trusted prices across Canada, Japan, and Korea, and plan what to buy.",
  openGraph: { title: "PuruPuru — skincare discovery and price comparison", description: "Compare the exact skincare product, size, and market price before you buy." },
};

export default async function HomePage() {
  const catalogue = await getCatalogue();
  const skincareRoot = catalogue.categories.find((category) => category.slug === "skincare");
  const featuredCategories = catalogue.categories.filter((category) => category.parentCategoryId === skincareRoot?.id).slice(0, 8);
  const featuredProducts = catalogue.products.slice(0, 2);

  return (
    <main>
      <section className="hero-section">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="water-detail -left-14 -top-12 hidden h-44 w-32 lg:block" />
          <span className="water-detail left-[3%] top-[60%] hidden h-14 w-11 lg:block" />
          <span className="water-detail -bottom-16 -right-6 h-40 w-32 opacity-60" />
        </div>
        <div className="page-container relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">Skincare shopping, with context</p>
            <h1 className="mt-4 max-w-2xl text-[2.125rem] font-extrabold leading-[1.14] tracking-[-0.035em] text-brand-ink sm:text-[2.5rem]">Compare the right product—not just the lowest-looking price.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">PuruPuru helps you check exact versions and sizes, trustworthy local benchmarks, and tracked buying options before you buy skincare at home or while travelling.</p>
            <div className="relative z-10 mt-7"><GlobalSearch id="home-search" prominent /></div>
            <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link className="ui-link no-underline" href="/catalogue">Browse all skincare <ArrowRight aria-hidden className="h-4 w-4" /></Link>
              <span aria-hidden className="h-5 border-l border-slate-300" />
              <Link className="ui-link no-underline" href="/categories">Explore categories <ArrowRight aria-hidden className="h-4 w-4" /></Link>
            </div>
          </div>
          {featuredProducts.length > 0 ? (
            <aside aria-label="Featured catalogue products" className="relative mx-auto grid w-full max-w-lg grid-cols-2 items-start gap-3 sm:gap-4">
              <p className="absolute -top-7 left-3 hidden text-sm font-semibold italic text-brand-action lg:block">Same products. Smarter choices.</p>
              {featuredProducts.map((product, index) => (
                <Link className={`hero-product ${index === 0 ? "sm:mt-5" : ""}`} href={catalogueProductHref(product)} key={product.id}>
                  <div className={`relative rounded-[1.125rem] ${index === 0 ? "bg-[#eaf1f6]" : "bg-[#f3eeea]"}`}>
                    <ProductImage className="aspect-[4/5] h-auto rounded-[1.125rem] !bg-transparent" image={product.currentVersion?.image ?? null} priority={index === 0} productName={product.canonicalName} sizes="(max-width: 640px) 42vw, 240px" />
                  </div>
                  <span className="block px-1 pb-2 pt-3 sm:px-2">
                    <span className="block text-[0.625rem] font-bold uppercase tracking-wide text-slate-500">{product.brand.name}</span>
                    <span className="mt-1 block text-sm font-extrabold leading-snug text-slate-950 sm:text-base">{product.canonicalName}</span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-xs leading-5 text-slate-500"><span>{product.primaryCanonicalCategory.displayName}{product.currentVersion?.defaultVariant ? ` · ${product.currentVersion.defaultVariant.displaySize}` : ""}</span><ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-brand-action" /></span>
                  </span>
                </Link>
              ))}
            </aside>
          ) : <p className="empty-state">Curated products will appear here when catalogue data is available.</p>}
        </div>
      </section>

      <section aria-labelledby="home-categories-title" className="page-container py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Browse by product type</p><h2 className="section-heading mt-1" id="home-categories-title">Skincare categories</h2></div>
          <Link className="ui-link" href="/categories">View all categories <ArrowRight aria-hidden className="h-4 w-4" /></Link>
        </div>
        {featuredCategories.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {featuredCategories.map((category) => <Link className="category-tile" data-tone={categoryTone(category.slug)} href={`/categories/${category.slug}`} key={category.id}><CategorySymbol className="h-9 w-9 text-brand-action" slug={category.slug} /><span>{category.displayName}</span></Link>)}
          </div>
        ) : <p className="empty-state mt-5">Skincare categories will appear when catalogue data is available.</p>}
      </section>

      <section aria-labelledby="home-products-title" className="page-container pb-10">
        <div className="surface-section grid gap-5 p-5 sm:p-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3 lg:block">
            <div><p className="eyebrow">Curated catalogue</p><h2 className="section-heading mt-2" id="home-products-title">Products to explore</h2></div>
            <Link className="ui-link lg:mt-5" href="/catalogue">Browse catalogue <ArrowRight aria-hidden className="h-4 w-4" /></Link>
          </div>
          {featuredProducts.length > 0 ? <div className="grid min-w-0 gap-4 md:grid-cols-2">{featuredProducts.map((product) => <ProductCard compact key={product.id} product={product} />)}</div> : <p className="empty-state">Curated products will appear here when catalogue data is available.</p>}
        </div>
      </section>

      <section aria-labelledby="home-comparison-title" className="brand-band relative border-y border-slate-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><span className="water-detail -bottom-12 -left-5 h-40 w-32 opacity-60" /><span className="water-detail -right-8 -top-6 h-36 w-28 opacity-60" /></div>
        <div className="page-container relative grid gap-7 py-8 sm:grid-cols-2 lg:grid-cols-[1fr_3fr] lg:items-center">
          <div><p className="eyebrow">Beauty, anywhere</p><h2 className="mt-2 text-xl font-extrabold tracking-tight text-brand-ink" id="home-comparison-title">How comparison works</h2></div>
          <div className="grid gap-6 sm:col-span-2 md:grid-cols-3 lg:col-span-1">
            {[
              { Icon: Search, title: "Compare", copy: "See exact versions, sizes and prices." },
              { Icon: ShieldCheck, title: "Shop smarter", copy: "Trusted sources and local benchmarks." },
              { Icon: Globe2, title: "Skincare without borders", copy: "Plan what to buy at home or while travelling." },
            ].map(({ Icon, title, copy }) => <article className="flex items-center gap-3" key={title}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-200 text-brand-action"><Icon aria-hidden className="h-6 w-6" strokeWidth={1.6} /></span><div><h3 className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-600">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{copy}</p></div></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}
