import type { Metadata } from "next";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = { title: "Affiliate disclosure", description: "How future affiliate relationships will be handled by PuruPuru." };

export default function AffiliateDisclosurePage() {
  return (
    <PublicInfoPage eyebrow="Trust and legal" title="Affiliate disclosure" intro="PuruPuru does not currently implement affiliate tracking in this MVP. This page records the product’s policy before any relationship is introduced." legalReview>
      <section><h2 className="text-lg font-semibold text-slate-950">Ordering stays independent</h2><p className="mt-2">If PuruPuru later earns commission from eligible retailer links, commission will not improve an offer’s rank, prominence, or recommendation. Default offer ordering remains based on raw product price under the documented comparison rules.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Disclosure before use</h2><p className="mt-2">Any active affiliate relationship must be clearly disclosed near affected links and reflected in the final legally reviewed policy. PuruPuru will not imply retailer partnerships that do not exist.</p></section>
    </PublicInfoPage>
  );
}
