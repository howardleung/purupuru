"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CategorySymbol, categoryTone } from "./category-symbol";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
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
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
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

  useEffect(() => {
    if (isOpen && categories.length > 0) firstLinkRef.current?.focus();
  }, [categories.length, isOpen]);

  const root = categories.find((category) => category.slug === "skincare");
  const topLevel = categories.filter((category) => category.parentCategoryId === root?.id);
  const featured = topLevel.filter((category) => featuredSlugs.has(category.slug));
  const secondary = categories.filter(
    (category) => category.slug !== "skincare" && !featuredSlugs.has(category.slug),
  );

  return (
    <div className={mobile ? "relative" : "static"} ref={rootRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        className={`flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-brand-action hover:bg-slate-100 ${mobile ? "w-full justify-between" : ""}`}
        onClick={() => setIsOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        Products <ChevronDown aria-hidden className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <div
          className={mobile
            ? "mt-2 rounded-xl border border-slate-200 bg-white p-3"
            : "absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white shadow-float"}
          id={menuId}
        >
          <div className={mobile ? "" : "page-container py-6"}>
            {categories.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Loading categories…</p>
            ) : (
              <>
                <div className={`grid gap-3 ${mobile ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-6"}`}>
                  {featured.map((category, index) => (
                    <Link
                      className="category-tile"
                      data-tone={categoryTone(category.slug)}
                      href={`/categories/${category.slug}`}
                      key={category.id}
                      onClick={() => setIsOpen(false)}
                      ref={index === 0 ? firstLinkRef : undefined}
                    >
                      <CategorySymbol className="h-9 w-9 text-brand-action" slug={category.slug} />
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
