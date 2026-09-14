import { NextResponse } from "next/server";

import { searchCatalogue } from "../../../lib/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await searchCatalogue(query));
}
