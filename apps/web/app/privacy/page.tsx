import type { Metadata } from "next";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = { title: "Privacy", description: "Early-stage Otoku privacy overview." };

export default function PrivacyPage() {
  return (
    <PublicInfoPage eyebrow="Trust and legal" title="Privacy" intro="This page describes the current MVP data posture in plain language; it is not final legal policy." legalReview>
      <section><h2 className="text-lg font-semibold text-slate-950">Public browsing</h2><p className="mt-2">Product, category, benchmark, offer, and source pages are intended to be browsable without an account.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Private account data</h2><p className="mt-2">Signing in uses Clerk. Otoku stores Clerk’s external user identifier with private collection entries, ratings, purchases, and shopping lists; it does not store passwords or Clerk session credentials in PostgreSQL.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Retention and requests</h2><p className="mt-2">Retention, deletion-request, analytics, cookie, international-transfer, and jurisdiction-specific terms still require legal and operational review before launch.</p></section>
    </PublicInfoPage>
  );
}