import Link from "next/link";
import { BrandLogo } from "./brand-logo";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white">
      <div className="page-container grid gap-6 py-8 text-sm md:grid-cols-[1fr_auto]">
        <div>
          <Link aria-label="PuruPuru home" className="inline-flex rounded-lg" href="/"><BrandLogo compact /></Link>
          <p className="mt-3 max-w-xl text-xs leading-6 text-slate-500">
            Prices and availability can change. Native prices remain authoritative and CAD conversions are approximate.
          </p>
        </div>
        <nav aria-label="Legal and company" className="flex flex-wrap items-start gap-x-4 gap-y-3 text-xs font-semibold text-slate-600 md:max-w-sm md:justify-end md:pt-3">
          {footerLinks.map((item) => (
            <Link className="hover:text-slate-950 hover:underline" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
