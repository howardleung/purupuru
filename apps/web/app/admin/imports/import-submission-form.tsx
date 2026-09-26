"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { importSubmissionFeedback } from "../../../lib/admin/import-submission-response";

export function ImportSubmissionForm() {
  const router = useRouter();
  const [payload, setPayload] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const body = file ? await file.text() : payload.trim();
      if (!body) {
        setErrors(["Paste a product-import-v1 JSON payload or choose a .json file."]);
        return;
      }
      const response = await fetch("/api/admin/ingestion/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const responseBody: unknown = await response.json().catch(() => null);
      const feedback = importSubmissionFeedback(responseBody);
      if (response.ok && feedback.batchId) {
        router.push(`/admin/imports/${feedback.batchId}`);
        router.refresh();
        return;
      }
      setErrors(feedback.errors);
    } catch {
      setErrors(["The import could not be submitted. Check the file and try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <h2 className="text-lg font-semibold">Stage a product import</h2>
    <p className="mt-1 text-sm text-slate-600">
      Paste a complete product-import-v1 payload or choose a JSON file. A selected file takes precedence over pasted text.
    </p>
    <form className="mt-5 grid gap-4" onSubmit={submit}>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        JSON payload
        <textarea
          className="ui-input min-h-52 resize-y font-mono text-xs"
          onChange={(event) => setPayload(event.target.value)}
          placeholder={'{\n  "schemaVersion": "1.0",\n  ...\n}'}
          spellCheck={false}
          value={payload}
        />
      </label>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
      </div>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        JSON file
        <input
          accept=".json,application/json"
          className="ui-input text-sm"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>
      {errors.length ? <div aria-live="polite" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <p className="font-semibold">The import needs attention</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>
      </div> : null}
      <div>
        <button className="ui-button ui-button--primary" disabled={submitting} type="submit">
          {submitting ? "Staging import…" : "Validate and stage import"}
        </button>
      </div>
    </form>
  </section>;
}
