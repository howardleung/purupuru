import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyProductImportCommitFailure,
  isRetryableProductImportCommitFailure,
  productImportCommitFailureMessage,
} from "../../apps/web/lib/admin/product-import-errors.ts";

test("product import commit failures classify transaction timeout and closed-transaction errors", () => {
  assert.equal(classifyProductImportCommitFailure({ code: "P2028", message: "expired" }), "TRANSACTION_TIMEOUT");
  assert.equal(classifyProductImportCommitFailure(new Error("Transaction API error: Transaction not found.")), "TRANSACTION_TIMEOUT");
  assert.match(productImportCommitFailureMessage("TRANSACTION_TIMEOUT"), /exceeded the allowed processing time/);
  assert.equal(isRetryableProductImportCommitFailure("TRANSACTION_TIMEOUT"), true);
});

test("product import commit failures distinguish retry exhaustion, database availability, and unexpected failures", () => {
  assert.equal(classifyProductImportCommitFailure({ code: "P2034" }), "SERIALIZATION_CONFLICT");
  assert.equal(classifyProductImportCommitFailure(new Error("Serializable transaction retry exhausted.")), "SERIALIZATION_CONFLICT");
  assert.equal(classifyProductImportCommitFailure({ code: "P1001" }), "DATABASE_UNAVAILABLE");
  assert.equal(classifyProductImportCommitFailure(new Error("unknown failure")), "UNEXPECTED_INTERNAL");
  assert.equal(isRetryableProductImportCommitFailure("SERIALIZATION_CONFLICT"), true);
  assert.equal(isRetryableProductImportCommitFailure("DATABASE_UNAVAILABLE"), true);
  assert.equal(isRetryableProductImportCommitFailure("UNEXPECTED_INTERNAL"), false);
  assert.doesNotMatch(productImportCommitFailureMessage("UNEXPECTED_INTERNAL"), /stack|sql|database url/i);
});
