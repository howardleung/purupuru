"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/collection", label: "My Collection" },
  { href: "/shopping-lists", label: "Shopping Lists" },
  { href: "/about", label: "About" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="order-3 flex w-full gap-1 overflow-x-auto border-t border-slate-100 pt-3 sm:order-none sm:w-auto sm:gap-1 sm:border-0 sm:pt-0"
    >
      {navigationItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-md px-2.5 py-2 text-sm transition ${
              active
                ? "bg-slate-100 font-medium text-slate-950"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}