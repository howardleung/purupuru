"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Browse" },
  { href: "/brands", label: "Brands" },
  { href: "/collection", label: "My Collection" },
  { href: "/shopping-lists", label: "Shopping Lists" },
  { href: "/about", label: "About" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={mobile ? "grid gap-1" : "flex items-center justify-center gap-1"}
    >
      {navigationItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-2.5 py-2.5 text-sm transition ${
              active
                ? "bg-slate-100 font-bold text-brand-action"
                : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
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
