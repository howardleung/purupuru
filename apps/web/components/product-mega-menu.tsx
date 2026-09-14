"use client";

import { ChevronDown, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Category = {
  id: string;
  slug: string;
  displayName: string;
  parentCategoryId: string | null;
  sortOrder: number;
};

const featuredSlugs = new Set(["cleansers", "toners", "moisturizers", "treatments", "sunscreen", "masks"]);

export function ProductMegaMenu({ mobile = false }: { mobile?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isOpen || categories.length > 0) return;
    let cancelled = false;
    void fetch("/api/categories")
      .then((response) => {
        if (!response.ok) throw new Error("Category request failed");
        return response.json() as Promise<Category[]>;
      })
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => { cancelled = true; };
  }, [categories.length, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    firstLinkRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function onOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, [isOpen]);

  const root = categories.find((category) => category.slug === "skincare");
  const topLevel = categories.filter((category) => category.parentCategoryId === root?.id);
  const featured = topLevel.filter((category) => featuredSlugs.has(category.slug));
  const secondary = categories.filter(
    (category) => category.slug !== "skincare" && !featuredSlugs.has(category.slug),
  );

  return (
    <div className={mobile ? "relative" : "static"} ref={rootRef}>
      <button
        aria-controls={mobile ? "mobile-products-menu" : "desktop-products-menu"}
        aria-expanded={isOpen}
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 ${mobile ? "w-full justify-between" : ""}`}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        Products <ChevronDown aria-hidden className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <div
          className={mobile
            ? "mt-2 rounded-xl border border-slate-200 bg-white p-3"
            : "absolute left-0 right-0 top-full z-40 border-y border-slate-200 bg-white shadow-xl"}
          id={mobile ? "mobile-products-menu" : "desktop-products-menu"}
        >
          <div className={mobile ? "" : "mx-auto max-w-6xl px-6 py-6"}>
            {categories.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Loading categories…</p>
            ) : (
              <>
                <div className={`grid gap-3 ${mobile ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-6"}`}>
                  {featured.map((category, index) => (
                    <Link
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-400 hover:bg-white"
                      href={`/categories/${category.slug}`}
                      key={category.id}
                      onClick={() => setIsOpen(false)}
                      ref={index === 0 ? firstLinkRef : undefined}
                    >
                      <span className="mb-4 grid aspect-[4/3] place-items-center rounded-lg bg-white text-slate-300">
                        <PackageSearch aria-hidden className="h-7 w-7" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{category.displayName}</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
                  {secondary.map((category) => (
                    <Link
                      className="text-sm text-slate-600 hover:text-slate-950 hover:underline"
                      href={`/categories/${category.slug}`}
                      key={category.id}
                      onClick={() => setIsOpen(false)}
                    >
                      {category.displayName}
                    </Link>
                  ))}
                  <Link className="text-sm font-semibold text-slate-950 underline" href="/categories" onClick={() => setIsOpen(false)}>
                    View all categories
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
