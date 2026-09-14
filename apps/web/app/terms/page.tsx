import type { Metadata } from "next";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = { title: "Terms", description: "Early-stage Otoku terms overview." };

export default function TermsPage() {
  return (
    <PublicInfoPage eyebrow="Trust and legal" title="Terms of use" intro="These draft principles explain the MVP’s intended use and limitations; they are not final terms." legalReview>
      <section><h2 className="text-lg font-semibold text-slate-950">Information, not a purchase guarantee</h2><p className="mt-2">Prices, stock, delivery eligibility, product details, and external signals can change. Verify the retailer or source page before purchasing. Otoku is not the seller and does not complete checkout.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Currency and savings estimates</h2><p className="mt-2">Native prices are authoritative. CAD conversions and shopping-list savings are approximate, may be partial, and exclude products without trustworthy comparison data.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Not medical advice</h2><p className="mt-2">Otoku provides product and shopping information, not diagnosis, treatment, or medical advice.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Final terms still needed</h2><p className="mt-2">Acceptable-use, liability, dispute, governing-law, age, account termination, and intellectual-property provisions require professional legal review before launch.</p></section>
    </PublicInfoPage>
  );
}