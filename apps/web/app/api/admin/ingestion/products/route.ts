import { NextRequest, NextResponse } from "next/server";

import { getAdminAccess } from "../../../../../lib/admin-auth";
import {
  listProductImports,
  ProductImportIdempotencyConflict,
  stageProductImport,
} from "../../../../../lib/admin/product-import-service";
import { RateLimitError } from "../../../../../lib/rate-limit";

const MAX_BODY_BYTES = 512 * 1024;

function accessResponse(status: "UNAUTHENTICATED" | "FORBIDDEN") {
  return NextResponse.json(
    { ok: false, error: status === "UNAUTHENTICATED" ? "Authentication required." : "Administrator access required." },
    { status: status === "UNAUTHENTICATED" ? 401 : 403, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  const access = await getAdminAccess();
  if (access.status !== "AUTHORIZED") return accessResponse(access.status);
  const batches = await listProductImports();
  return NextResponse.json({ ok: true, batches }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const access = await getAdminAccess({ mutation: true });
    if (access.status !== "AUTHORIZED") return accessResponse(access.status);
    const length = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "Import payload exceeds 512 KiB." },
        { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "Import payload exceeds 512 KiB." },
        { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "Request body must be valid JSON." },
        { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const result = await stageProductImport(payload, access.clerkUserId);
    const rejected = result.batch.status === "REJECTED";
    return NextResponse.json({ ok: !rejected, replayed: result.replayed, batch: result.batch }, {
      status: rejected ? 422 : result.replayed ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ProductImportIdempotencyConflict) {
      return NextResponse.json({ ok: false, error: error.message },
        { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    if (error instanceof RateLimitError) {
      return NextResponse.json({ ok: false, error: error.message },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
    }
    return NextResponse.json({ ok: false, error: "The import could not be staged." },
      { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
