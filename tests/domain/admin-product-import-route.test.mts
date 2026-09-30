import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const boundary = {
  stageCalls: 0,
  async getAdminAccess() { return { status: "FORBIDDEN" as const }; },
};
Object.assign(globalThis, { __purupuruAdminImportRouteTest: boundary });

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") {
      return { url: `data:text/javascript,${encodeURIComponent(`
        export class NextRequest {}
        export class NextResponse {
          static json(body, init = {}) {
            return new Response(JSON.stringify(body), { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
          }
        }
      `)}`, shortCircuit: true };
    }
    if (specifier.endsWith("/admin-auth")) {
      return { url: "data:text/javascript,export const getAdminAccess=(...args)=>globalThis.__purupuruAdminImportRouteTest.getAdminAccess(...args);", shortCircuit: true };
    }
    if (specifier.endsWith("/admin/product-import-service")) {
      return { url: `data:text/javascript,${encodeURIComponent(`
        export class ProductImportIdempotencyConflict extends Error {}
        export const listProductImports = async () => [];
        export const stageProductImport = async () => { globalThis.__purupuruAdminImportRouteTest.stageCalls += 1; throw new Error("must not stage"); };
      `)}`, shortCircuit: true };
    }
    if (specifier.endsWith("/rate-limit")) {
      return { url: "data:text/javascript,export class RateLimitError extends Error {};", shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const route = await import("../../apps/web/app/api/admin/ingestion/products/route.ts");
hooks.deregister();

test("an unauthorized offer-deactivation request is rejected before staging", async () => {
  boundary.stageCalls = 0;
  const response = await route.POST(new Request("https://purupuru.test/api/admin/ingestion/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: [{ variants: [{ offers: [{ isActive: false }] }] }] }),
  }) as never);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { ok: false, error: "Administrator access required." });
  assert.equal(boundary.stageCalls, 0);
});
