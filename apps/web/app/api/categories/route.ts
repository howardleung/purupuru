import { NextResponse } from "next/server";

import { getCategories } from "../../../lib/catalogue";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(
      categories.map(({ id, slug, displayName, parentCategoryId, sortOrder }) => ({
        id,
        slug,
        displayName,
        parentCategoryId,
        sortOrder,
      })),
    );
  } catch {
    return NextResponse.json({ error: "Categories are temporarily unavailable." }, { status: 503 });
  }
}
