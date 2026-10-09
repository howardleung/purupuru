import "server-only";

import { prisma } from "@beauty-platform/database";
import type { Prisma } from "@beauty-platform/database";

function isRetryableTransactionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function runSerializable<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { timeout?: number } = {},
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
        ...(options.timeout === undefined ? {} : { timeout: options.timeout }),
      });
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === 2) throw error;
    }
  }

  throw new Error("Serializable transaction retry exhausted.");
}
