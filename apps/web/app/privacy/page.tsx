import type { Metadata } from "next";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = { title: "Privacy", description: "Early-stage PuruPuru privacy overview." };

export default function PrivacyPage() {
  return (
    <PublicInfoPage eyebrow="Trust and legal" title="Privacy" intro="This page describes the current MVP data posture in plain language; it is not final legal policy." legalReview>
      <section><h2 className="text-lg font-semibold text-slate-950">Public browsing</h2><p className="mt-2">Product, category, benchmark, offer, and source pages are intended to be browsable without an account.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Private account data</h2><p className="mt-2">Signing in uses Clerk. PuruPuru stores Clerk’s external user identifier with private Likes, preserved previous collection entries, ratings, purchases, and shopping lists; it does not store passwords or Clerk session credentials in PostgreSQL. Likes save interest in a product version across sizes; they do not establish a purchase or product experience. A short-lived HTTP-only request cookie resumes an explicitly requested Like after authentication.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Optional analytics</h2><p className="mt-2">If you accept analytics, we send page types, sanitized public route templates, public product identifiers, successful Like changes and retailer clicks to PostHog US Cloud to understand shopping interest. Retailer clicks show intent, not confirmed purchases. Random visitor and session identifiers group events in this tab until reload or withdrawal; they are not linked to your Clerk account. Sessions also reset after 30 minutes without a recorded interaction or 24 hours. We do not send raw URLs, search text, email addresses, account IDs, Skin Map answers, skin conditions or private notes. We do not use automatic click or form capture, heatmaps or session recording.</p><p className="mt-2">Accept and Reject are optional choices. Your choice is stored on this browser for up to 180 days. Use Analytics preferences in the footer to change it or withdraw consent; withdrawal stops future events and clears the in-memory identifiers, but does not delete events already received. Likes and shopping continue to work without analytics. PostHog receives network connection information to deliver requests; events request disabled IP geolocation. US processing may involve international transfers.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Retention and requests</h2><p className="mt-2">Before enabling analytics publicly, retention, deletion requests, PostHog processing terms and US transfers, provincial and Canadian consent requirements, and age-appropriate notices require legal and operational review. Set retention and IP-handling controls in the PostHog project. This overview does not establish that those reviews or settings are complete.</p></section>
    </PublicInfoPage>
  );
}
