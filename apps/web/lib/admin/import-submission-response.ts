export type ImportSubmissionFeedback = {
  batchId: string | null;
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function importSubmissionFeedback(value: unknown): ImportSubmissionFeedback {
  if (!isRecord(value)) return { batchId: null, errors: ["The server returned an unreadable response."] };
  const batch = isRecord(value.batch) ? value.batch : null;
  const batchId = batch && typeof batch.id === "string" ? batch.id : null;
  const validationErrors = batch && Array.isArray(batch.validationErrors) ? batch.validationErrors : [];
  const errors = validationErrors.flatMap((item) => {
    if (!isRecord(item) || typeof item.message !== "string") return [];
    const path = typeof item.path === "string" ? item.path : null;
    return [path ? `${path}: ${item.message}` : item.message];
  });
  if (errors.length === 0 && typeof value.error === "string") errors.push(value.error);
  if (errors.length === 0 && !batchId) errors.push("The import could not be staged.");
  return { batchId, errors };
}
