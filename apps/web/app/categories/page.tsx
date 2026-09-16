import type { Metadata } from "next";
import Link from "next/link";

import { getCategories } from "../../lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skincare categories",
  description: "Browse PuruPuru’s canonical skincare taxonomy by product type.",
  openGraph: {
    title: "Skincare categories · PuruPuru",
    description: "Explore cleansers, toners, moisturizers, treatments, sunscreen, masks, eye care, and lip care.",
  },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const root = categories.find((category) => category.slug === "skincare");
  const topLevel = categories.filter((category) => category.parentCategoryId === root?.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-medium text-slate-500">Browse by product type</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Skincare categories</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        PuruPuru uses one consistent skincare taxonomy, so retailer category labels do not change where products appear.
      </p>

      {topLevel.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topLevel.map((category) => {
            const children = categories.filter((item) => item.parentCategoryId === category.id);
            return (
              <section className="rounded-xl border border-slate-200 p-5" key={category.id}>
                <h2 className="text-lg font-semibold">
                  <Link className="hover:underline" href={`/categories/${category.slug}`}>
                    {category.displayName}
                  </Link>
                </h2>
                {children.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link className="hover:text-slate-950 hover:underline" href={`/categories/${child.slug}`}>
                          {child.displayName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Browse all products in this category.</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
          Categories are temporarily unavailable.
        </p>
      )}
    </main>
  );
}
