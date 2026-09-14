import { NextResponse } from "next/server";

import { getCategories } from "../../../lib/catalogue";

export async function GET() {
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
}
