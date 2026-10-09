export type ProductImportCommitFailureKind =
  | "TRANSACTION_TIMEOUT"
  | "SERIALIZATION_CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_INTERNAL";

type ErrorLike = { code?: unknown; message?: unknown; name?: unknown };

function errorLike(error: unknown): ErrorLike {
  return typeof error === "object" && error !== null ? error : {};
}

export function classifyProductImportCommitFailure(error: unknown): ProductImportCommitFailureKind {
  const candidate = errorLike(error);
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  if (
    code === "P2028" ||
    message.includes("transaction not found") ||
    message.includes("expired transaction") ||
    message.includes("transaction already closed") ||
    message.includes("transaction is no longer valid")
  ) return "TRANSACTION_TIMEOUT";

  if (code === "P2034" || message.includes("serializable transaction retry exhausted")) {
    return "SERIALIZATION_CONFLICT";
  }

  if (["P1000", "P1001", "P1002", "P1008", "P1017"].includes(code)) {
    return "DATABASE_UNAVAILABLE";
  }

  return "UNEXPECTED_INTERNAL";
}

export function productImportCommitFailureMessage(kind: ProductImportCommitFailureKind) {
  switch (kind) {
    case "TRANSACTION_TIMEOUT":
      return "The catalogue commit exceeded the allowed processing time and no changes were saved. Please retry.";
    case "SERIALIZATION_CONFLICT":
      return "The catalogue changed while this batch was committing. No changes were saved. Please review and retry.";
    case "DATABASE_UNAVAILABLE":
      return "The catalogue database was temporarily unavailable and no changes were saved. Please retry.";
    default:
      return "The catalogue commit failed and no changes were saved. Please review the batch or try again.";
  }
}

export function isRetryableProductImportCommitFailure(kind: ProductImportCommitFailureKind) {
  return kind !== "UNEXPECTED_INTERNAL";
}
