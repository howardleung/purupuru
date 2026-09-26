import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { importSubmissionFeedback } from "../../apps/web/lib/admin/import-submission-response.ts";

test("submission feedback preserves server validation paths and messages", () => {
  assert.deepEqual(importSubmissionFeedback({
    ok: false,
    batch: {
      id: "batch-invalid",
      validationErrors: [
        { path: "$.products[0].variants[0].gtin", code: "INVALID_GTIN", message: "Must contain digits." },
        { code: "INVALID_PAYLOAD", message: "Payload must be an object." },
      ],
    },
  }), {
    batchId: "batch-invalid",
    errors: [
      "$.products[0].variants[0].gtin: Must contain digits.",
      "Payload must be an object.",
    ],
  });
});

test("submission feedback supports successful staging and safe generic failures", () => {
  assert.deepEqual(importSubmissionFeedback({ ok: true, batch: { id: "batch-ready" } }), {
    batchId: "batch-ready",
    errors: [],
  });
  assert.deepEqual(importSubmissionFeedback({ ok: false, error: "Request body must be valid JSON." }), {
    batchId: null,
    errors: ["Request body must be valid JSON."],
  });
  assert.deepEqual(importSubmissionFeedback(null), {
    batchId: null,
    errors: ["The server returned an unreadable response."],
  });
});

test("admin submission UI sends pasted or uploaded JSON to the existing narrow endpoint", () => {
  const component = readFileSync(new URL("../../apps/web/app/admin/imports/import-submission-form.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../apps/web/app/admin/imports/page.tsx", import.meta.url), "utf8");
  assert.match(component, /file \? await file\.text\(\) : payload\.trim\(\)/);
  assert.match(component, /fetch\("\/api\/admin\/ingestion\/products"/);
  assert.match(component, /router\.push\(`\/admin\/imports\/\$\{feedback\.batchId\}`\)/);
  assert.match(component, /accept="\.json,application\/json"/);
  assert.doesNotMatch(component, /validateProductImportPayload|stageProductImport|JSON\.parse\(body\)/);
  assert.ok(page.indexOf("access.status !== \"AUTHORIZED\"") < page.indexOf("<ImportSubmissionForm />"));
});
