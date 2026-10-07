export type CatalogueCategoryNode = {
  id: string;
  slug: string;
  parentCategoryId: string | null;
};

function childCategories<T extends CatalogueCategoryNode>(categories: readonly T[], parentId: string) {
  return categories.filter((category) => category.parentCategoryId === parentId);
}

export function getCategoryLeafSlugs<T extends CatalogueCategoryNode>(
  categories: readonly T[],
  categoryId: string,
): string[] {
  const category = categories.find((candidate) => candidate.id === categoryId);
  if (!category) return [];
  const children = childCategories(categories, categoryId);
  return children.length === 0
    ? [category.slug]
    : children.flatMap((child) => getCategoryLeafSlugs(categories, child.id));
}

export function normalizeCategorySlugs<T extends CatalogueCategoryNode>(
  categories: readonly T[],
  requestedSlugs: readonly string[],
): string[] {
  const normalized = requestedSlugs.flatMap((slug) => {
    const category = categories.find((candidate) => candidate.slug === slug);
    return category ? getCategoryLeafSlugs(categories, category.id) : [];
  });
  return [...new Set(normalized)];
}

export function getCategorySelectionState<T extends CatalogueCategoryNode>(
  categories: readonly T[],
  selectedSlugs: readonly string[],
  categoryId: string,
) {
  const leafSlugs = getCategoryLeafSlugs(categories, categoryId);
  const selected = new Set(selectedSlugs);
  const selectedCount = leafSlugs.filter((slug) => selected.has(slug)).length;
  return {
    checked: leafSlugs.length > 0 && selectedCount === leafSlugs.length,
    indeterminate: selectedCount > 0 && selectedCount < leafSlugs.length,
    leafSlugs,
  };
}

export function setCategorySelection(
  selectedSlugs: readonly string[],
  leafSlugs: readonly string[],
  selected: boolean,
): string[] {
  const next = new Set(selectedSlugs);
  for (const slug of leafSlugs) {
    if (selected) next.add(slug);
    else next.delete(slug);
  }
  return [...next];
}

export function appendRepeatedValues(
  parameters: URLSearchParams,
  name: string,
  values: readonly string[],
) {
  for (const value of values) parameters.append(name, value);
}
