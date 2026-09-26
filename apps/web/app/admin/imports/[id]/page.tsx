import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminAccess } from "../../../../lib/admin-auth";
import { getProductImport } from "../../../../lib/admin/product-import-service";
import { safeExternalUrl } from "../../../../lib/external-url";
import { commitImportAction, rejectImportAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review product import" };

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function sourceLinks(value: unknown, found = new Set<string>()): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => sourceLinks(item, found));
  } else if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) => {
      if (["url", "sourceUrl", "sourcePageUrl", "listingUrl", "websiteUrl"].includes(key) && typeof item === "string" && safeExternalUrl(item)) {
        found.add(item);
      } else sourceLinks(item, found);
    });
  }
  return [...found];
}

export default async function ImportBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccess();
  if (access.status !== "AUTHORIZED") {
    return <main className="page-container py-10"><h1 className="text-2xl font-semibold">Product import</h1>
      <p className="mt-3 text-sm text-slate-600">Administrator access is required.</p></main>;
  }
  const { id } = await params;
  const batch = await getProductImport(id);
  if (!batch) notFound();
  const hasBlockingErrors = Array.isArray(batch.validationErrors) && batch.validationErrors.length > 0;
  const canCommit = ["VALIDATED", "NEEDS_REVIEW", "APPROVED"].includes(batch.status) && !hasBlockingErrors;
  const canReject = ["PENDING", "VALIDATED", "NEEDS_REVIEW", "APPROVED"].includes(batch.status);
  const links = sourceLinks(batch.normalizedPayload ?? batch.rawPayload);
  return <main className="page-container py-10">
    <Link className="text-sm underline" href="/admin/imports">← All imports</Link>
    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-semibold">{batch.sourceLabel}</h1>
        <p className="mt-2 text-sm text-slate-600">{batch.status.replaceAll("_", " ")} · schema {batch.schemaVersion} · retrieved {batch.retrievedAt.toLocaleString("en-CA")}</p></div>
      {canReject ? <div className="flex gap-2">
        {canCommit ? <form action={commitImportAction.bind(null, batch.id)}><button className="ui-button ui-button--primary" type="submit">Approve and commit batch</button></form> : null}
        <form action={rejectImportAction.bind(null, batch.id)}><button className="ui-button ui-button--ghost" type="submit">Reject</button></form>
      </div> : null}
    </div>
    {batch.failureReason ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{batch.failureReason}</p> : null}
    {links.length ? <section className="mt-6 rounded-xl border border-slate-200 p-5"><h2 className="font-semibold">Source and provenance links</h2>
      <ul className="mt-3 grid gap-2 text-sm">{links.map((url) => <li className="truncate" key={url}><a className="underline" href={url} rel="noreferrer" target="_blank">{url}</a></li>)}</ul>
    </section> : null}
    <section className="mt-8 grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-5"><h2 className="font-semibold">Validation and review notes</h2>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs">{pretty({ errors: batch.validationErrors, warnings: batch.warnings })}</pre></div>
      <div className="rounded-xl border border-slate-200 p-5"><h2 className="font-semibold">Identity and write plan</h2>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs">{pretty(batch.plan)}</pre></div>
      <div className="rounded-xl border border-slate-200 p-5 lg:col-span-2"><h2 className="font-semibold">Normalized product structure and provenance</h2>
        <pre className="mt-3 max-h-[36rem] overflow-auto whitespace-pre-wrap text-xs">{pretty(batch.normalizedPayload ?? batch.rawPayload)}</pre></div>
      {batch.commitResult ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 lg:col-span-2"><h2 className="font-semibold">Committed records</h2>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">{pretty(batch.commitResult)}</pre></div> : null}
    </section>
  </main>;
}
