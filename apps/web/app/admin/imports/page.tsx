import type { Metadata } from "next";
import Link from "next/link";

import { getAdminAccess } from "../../../lib/admin-auth";
import { listProductImports } from "../../../lib/admin/product-import-service";
import { ImportSubmissionForm } from "./import-submission-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Product imports" };

export default async function ImportBatchesPage() {
  const access = await getAdminAccess();
  if (access.status !== "AUTHORIZED") {
    return <main className="page-container py-10"><h1 className="text-2xl font-semibold">Product imports</h1>
      <p className="mt-3 text-sm text-slate-600">Administrator access is required.</p></main>;
  }
  const batches = await listProductImports();
  return <main className="page-container py-10">
    <h1 className="text-3xl font-semibold">Staged product imports</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-600">Review validation, provenance, identity matches, and proposed writes before committing a complete batch.</p>
    <ImportSubmissionForm />
    {batches.length ? <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
          <th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Schema</th>
          <th className="px-4 py-3">Received</th><th className="px-4 py-3">Idempotency key</th>
        </tr></thead>
        <tbody>{batches.map((batch) => <tr className="border-t border-slate-200" key={batch.id}>
          <td className="px-4 py-3"><Link className="font-medium underline" href={`/admin/imports/${batch.id}`}>{batch.sourceLabel}</Link></td>
          <td className="px-4 py-3">{batch.status.replaceAll("_", " ")}</td><td className="px-4 py-3">{batch.schemaVersion}</td>
          <td className="px-4 py-3">{batch.createdAt.toLocaleString("en-CA")}</td><td className="px-4 py-3 font-mono text-xs">{batch.idempotencyKey}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No product imports have been staged.</p>}
  </main>;
}
