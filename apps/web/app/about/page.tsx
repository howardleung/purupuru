import type { Metadata } from "next";
import Link from "next/link";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how Otoku approaches version-aware skincare discovery and honest price comparison.",
};

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About Otoku"
      title="A clearer way to research skincare across markets"
      intro="Otoku is an early-stage skincare discovery and shopping-planning product for people comparing exact products, sizes, and prices at home or while travelling."
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Why it exists</h2>
        <p className="mt-2">Skincare research is scattered across brand pages, local platforms, retailers, currency converters, and personal notes. Otoku brings useful context together while linking back to original sources.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">What we prioritize</h2>
        <p className="mt-2">Product identity, source transparency, and honest missing-data states come before catalogue breadth. We do not silently combine different formulations or sizes, and affiliate relationships must never influence offer ordering.</p>
      </section>
      <p><Link className="font-medium underline" href="/catalogue">Browse the current catalogue</Link></p>
    </PublicInfoPage>
  );
}