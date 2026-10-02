import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how PuruPuru helps skincare shoppers compare tracked retailer prices and spend less.",
};

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About PuruPuru"
      title="A smarter way to compare skincare prices"
      intro="PuruPuru helps shoppers compare available retailer prices for the exact skincare product and size they want, so they can choose where to buy and spend less."
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Why it exists</h2>
        <p className="mt-2">The same skincare product can cost very different amounts across retailers and markets. PuruPuru brings tracked buying options together so shoppers can compare prices quickly and see where it may be cheaper.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">What we prioritize</h2>
        <p className="mt-2">Price comparisons stay tied to the correct product and size. Source transparency, honest missing-data states, and affiliate-neutral ordering make those comparisons trustworthy without asking shoppers to understand the underlying data model.</p>
      </section>
      <p><Link className="font-medium underline" href="/catalogue">Browse the current catalogue</Link></p>
    </PublicInfoPage>
  );
}
