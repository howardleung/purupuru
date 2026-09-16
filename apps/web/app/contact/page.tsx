import type { Metadata } from "next";

import { PublicInfoPage } from "../../components/public-info-page";

export const metadata: Metadata = { title: "Contact", description: "Contact information for the early PuruPuru project." };

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact"
      title="Get in touch"
      intro="PuruPuru is still in private development. A public support channel has not been finalized."
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Temporary contact placeholder</h2>
        <p className="mt-2"><span className="font-mono">hello@purupuru.example</span> is a non-deliverable placeholder and must be replaced before public launch.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Source or catalogue corrections</h2>
        <p className="mt-2">The future contact channel will accept product-identity, source, pricing, and image-provenance corrections. Until then, do not rely on this page for urgent support.</p>
      </section>
    </PublicInfoPage>
  );
}
