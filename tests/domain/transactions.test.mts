import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const capturedOptions: Array<Record<string, unknown>> = [];
let attempts = 0;
const database = {
  async $transaction(operation: (tx: Record<string, never>) => Promise<unknown>, options: Record<string, unknown>) {
    attempts += 1;
    capturedOptions.push(options);
    if (attempts < 3) {
      const error = Object.assign(new Error("serialization conflict"), { code: "P2034" });
      throw error;
    }
    return operation({});
  },
};

Object.assign(globalThis, { __purupuruTransactionsTest: database });
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier === "@beauty-platform/database") {
      return { url: "data:text/javascript,export const prisma=globalThis.__purupuruTransactionsTest;", shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { runSerializable } = await import("../../apps/web/lib/transactions.ts");
hooks.deregister();

test("serializable transactions preserve retries and accept a path-specific timeout", async () => {
  const result = await runSerializable(async () => "committed", { timeout: 30_000 });

  assert.equal(result, "committed");
  assert.equal(attempts, 3);
  assert.deepEqual(capturedOptions, [
    { isolationLevel: "Serializable", timeout: 30_000 },
    { isolationLevel: "Serializable", timeout: 30_000 },
    { isolationLevel: "Serializable", timeout: 30_000 },
  ]);
});
