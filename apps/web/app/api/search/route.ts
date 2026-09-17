import { NextResponse } from "next/server";

import { searchCatalogue } from "../../../lib/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > 80) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }
  try {
    return NextResponse.json(await searchCatalogue(query), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 });
  }
}
