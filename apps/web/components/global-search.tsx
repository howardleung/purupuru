"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import type { GroupedSearchResults } from "../lib/search-contract";
import { emptySearchResults } from "../lib/search-contract";
import { ProductImage } from "./product-image";

type SearchItem = { key: string; href: string };

export function GlobalSearch({ id = "global-search", prominent = false }: { id?: string; prominent?: boolean }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>(emptySearchResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(emptySearchResults);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");
        setResults((await response.json()) as GroupedSearchResults);
        setActiveIndex(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults(emptySearchResults);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsFocused(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const items = useMemo<SearchItem[]>(
    () => [
      ...results.products.map((item) => ({ key: `product-${item.id}`, href: item.href })),
      ...results.brands.map((item) => ({ key: `brand-${item.id}`, href: item.href })),
      ...results.categories.map((item) => ({ key: `category-${item.id}`, href: item.href })),
      ...(query.trim().length >= 2
        ? [{ key: "view-all", href: `/catalogue?q=${encodeURIComponent(query.trim())}` }]
        : []),
    ],
    [query, results],
  );
  const isOpen = isFocused && query.trim().length >= 2;

  function submit(event: FormEvent) {
    event.preventDefault();
    const target = query.trim();
    if (target) router.push(`/catalogue?q=${encodeURIComponent(target)}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!items.length) return;
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") return current >= items.length - 1 ? 0 : current + 1;
        return current <= 0 ? items.length - 1 : current - 1;
      });
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      router.push(items[activeIndex].href);
      setIsFocused(false);
    }
  }

  let renderedIndex = -1;
  const nextIndex = () => (renderedIndex += 1);

  return (
    <div className={`relative ${prominent ? "w-full max-w-2xl" : "w-full"}`} ref={rootRef}>
      <form action="/catalogue" className="relative" method="get" onSubmit={submit} role="search">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label className="sr-only" htmlFor={id}>Search products, brands, and categories</label>
        <input
          aria-activedescendant={isOpen && activeIndex >= 0 && activeIndex < items.length ? `${id}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={isOpen ? `${id}-results` : undefined}
          aria-expanded={isOpen}
          autoComplete="off"
          className={`w-full rounded-full border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 ${prominent ? "py-3.5 text-base" : ""}`}
          id={id}
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, brands, categories"
          role="combobox"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={() => {
              setQuery("");
              setResults(emptySearchResults);
            }}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 z-50 mt-2 max-h-[min(34rem,70vh)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          id={`${id}-results`}
          role="listbox"
          aria-label="Search suggestions"
        >
          <p aria-live="polite" className="sr-only">
            {isLoading ? "Searching" : `${items.length} search options available`}
          </p>
          {results.products.length > 0 ? (
            <SearchGroup label="Products">
              {results.products.map((item) => {
                const index = nextIndex();
                return (
                  <a
                    aria-selected={activeIndex === index}
                    className={`grid grid-cols-[3.25rem_1fr] gap-3 rounded-xl p-2 ${activeIndex === index ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    href={item.href}
                    id={`${id}-option-${index}`}
                    key={item.id}
                    role="option"
                  >
                    <ProductImage className="h-[3.25rem] min-h-[3.25rem] rounded-lg" image={item.image} productName={`${item.brandName} ${item.productName}`} sizes="52px" />
                    <span className="min-w-0 self-center">
                      <span className="block truncate text-xs font-medium uppercase tracking-wide text-slate-500">{item.brandName}</span>
                      <span className="block truncate text-sm font-semibold text-slate-950">{item.productName}</span>
                      <span className="block truncate text-xs text-slate-500">{item.context}</span>
                    </span>
                  </a>
                );
              })}
            </SearchGroup>
          ) : null}
          {results.brands.length > 0 ? (
            <SearchGroup label="Brands">
              {results.brands.map((item) => {
                const index = nextIndex();
                return <SearchLink active={activeIndex === index} id={`${id}-option-${index}`} item={item} key={item.id} />;
              })}
            </SearchGroup>
          ) : null}
          {results.categories.length > 0 ? (
            <SearchGroup label="Categories">
              {results.categories.map((item) => {
                const index = nextIndex();
                return <SearchLink active={activeIndex === index} id={`${id}-option-${index}`} item={item} key={item.id} />;
              })}
            </SearchGroup>
          ) : null}
          {!isLoading && items.length === 1 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No direct matches yet.</p>
          ) : null}
          {(() => {
            const index = nextIndex();
            return (
              <a
                aria-selected={activeIndex === index}
                className={`mt-1 block rounded-xl border-t border-slate-100 px-3 py-3 text-sm font-semibold ${activeIndex === index ? "bg-slate-100" : "hover:bg-slate-50"}`}
                href={`/catalogue?q=${encodeURIComponent(query.trim())}`}
                id={`${id}-option-${index}`}
                role="option"
              >
                View all results for “{query.trim()}”
              </a>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 p-1 pb-2">
      <h2 className="px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</h2>
      <div>{children}</div>
    </section>
  );
}

function SearchLink({ active, id, item }: { active: boolean; id: string; item: GroupedSearchResults["brands"][number] }) {
  return (
    <a
      aria-selected={active}
      className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
      href={item.href}
      id={id}
      role="option"
    >
      <span className="font-medium text-slate-900">{item.label}</span>
      {item.context ? <span className="truncate text-xs text-slate-500">{item.context}</span> : null}
    </a>
  );
}
