"use client";

import { Menu } from "lucide-react";
import { useEffect, useRef } from "react";

import { PrimaryNav } from "./primary-nav";
import { ProductMegaMenu } from "./product-mega-menu";

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute("open");
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  return (
    <details
      className="relative md:hidden"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          detailsRef.current?.removeAttribute("open");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && detailsRef.current?.open) {
          detailsRef.current.removeAttribute("open");
          // Let nested menu Escape handlers run before returning focus to the outer trigger.
          window.requestAnimationFrame(() => summaryRef.current?.focus());
        }
      }}
      ref={detailsRef}
    >
      <summary aria-label="Open navigation" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full text-brand-action hover:bg-slate-100" ref={summaryRef}>
        <Menu aria-hidden className="h-5 w-5" />
      </summary>
      <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-float">
        <ProductMegaMenu mobile />
        <PrimaryNav mobile />
      </div>
    </details>
  );
}
