import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 text-sm sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-semibold text-slate-900">PuruPuru</p>
          <p className="mt-2 max-w-2xl leading-6 text-slate-600">
            Prices and availability can change. Native prices remain authoritative and CAD conversions are approximate.
          </p>
        </div>
        <nav aria-label="Legal and company" className="flex flex-wrap gap-x-4 gap-y-2 text-slate-600">
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
