export type CollectionFilter =
  | "WANT"
  | "TRIED"
  | "OWNED"
  | "HOLY_GRAIL"
  | "WOULD_REPURCHASE";

export type CollectionSort = "RECENT" | "RATING" | "ALPHABETICAL";

export type CollectionVersionBase = {
  productVersionId: string;
  productFamilyId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  versionName: string;
  categoryName: string;
  defaultVariantId: string | null;
  defaultVariantLabel: string | null;
};

export type CollectionVariantContext = {
  id: string;
  label: string;
};

export type CollectionContribution =
  | {
      kind: "RELATIONSHIP";
      base: CollectionVersionBase;
      wants: boolean;
      tried: boolean;
      tagKinds: readonly string[];
      selectedVariant: CollectionVariantContext | null;
      updatedAt: string;
    }
  | {
      kind: "RATING";
      base: CollectionVersionBase;
      ratingHalfSteps: number;
      contextualVariant: CollectionVariantContext | null;
      updatedAt: string;
    }
  | {
      kind: "PURCHASE";
      base: CollectionVersionBase;
      purchase: {
        id: string;
        quantity: number;
        purchaseDate: string | null;
        createdAt: string;
        updatedAt: string;
        source: string;
        retailerName: string | null;
        variant: CollectionVariantContext;
      };
    };

export type MyCollectionItem = CollectionVersionBase & {
  image?: {
    id: string;
    productVersionId: string;
    productVariantId: string | null;
    url: string;
    altText: string;
    isPrimary: boolean;
    sortOrder: number;
  } | null;
  selectedVariantId: string | null;
  selectedVariantLabel: string | null;
  wants: boolean;
  tried: boolean;
  owned: boolean;
  holyGrail: boolean;
  wouldRepurchase: boolean;
  ratingHalfSteps: number | null;
  purchaseCount: number;
  ownedQuantity: number;
  latestPurchase: {
    quantity: number;
    date: string;
    source: string;
    retailerName: string | null;
    variantLabel: string;
  } | null;
  updatedAt: string;
};

type MutableCollectionItem = MyCollectionItem & {
  latestPurchaseId: string | null;
  variantContextPriority: number;
};

function time(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function latestIso(a: string, b: string): string {
  return time(a) >= time(b) ? a : b;
}

function initialItem(base: CollectionVersionBase, updatedAt: string): MutableCollectionItem {
  return {
    ...base,
    selectedVariantId: base.defaultVariantId,
    selectedVariantLabel: base.defaultVariantLabel,
    wants: false,
    tried: false,
    owned: false,
    holyGrail: false,
    wouldRepurchase: false,
    ratingHalfSteps: null,
    purchaseCount: 0,
    ownedQuantity: 0,
    latestPurchase: null,
    latestPurchaseId: null,
    updatedAt,
    variantContextPriority: 0,
  };
}

function applyVariantContext(
  item: MutableCollectionItem,
  variant: CollectionVariantContext | null,
  priority: number,
) {
  if (!variant || priority < item.variantContextPriority) return;
  item.selectedVariantId = variant.id;
  item.selectedVariantLabel = variant.label;
  item.variantContextPriority = priority;
}

export function normalizeCollectionItems(
  contributions: readonly CollectionContribution[],
): MyCollectionItem[] {
  const byVersion = new Map<string, MutableCollectionItem>();

  for (const contribution of contributions) {
    const contributionUpdatedAt =
      contribution.kind === "PURCHASE"
        ? contribution.purchase.updatedAt
        : contribution.updatedAt;
    const item =
      byVersion.get(contribution.base.productVersionId) ??
      initialItem(contribution.base, contributionUpdatedAt);
    item.updatedAt = latestIso(item.updatedAt, contributionUpdatedAt);

    if (contribution.kind === "RELATIONSHIP") {
      item.wants ||= contribution.wants;
      item.tried ||= contribution.tried;
      item.holyGrail ||= contribution.tagKinds.includes("HOLY_GRAIL");
      item.wouldRepurchase ||= contribution.tagKinds.includes("WOULD_REPURCHASE");
      applyVariantContext(item, contribution.selectedVariant, 3);
    } else if (contribution.kind === "RATING") {
      item.ratingHalfSteps = contribution.ratingHalfSteps;
      applyVariantContext(item, contribution.contextualVariant, 2);
    } else {
      item.owned = true;
      item.purchaseCount += 1;
      item.ownedQuantity += contribution.purchase.quantity;
      const purchaseEffectiveDate =
        contribution.purchase.purchaseDate ?? contribution.purchase.createdAt;
      const isLatestPurchase =
        !item.latestPurchase ||
        time(purchaseEffectiveDate) > time(item.latestPurchase.date) ||
        (time(purchaseEffectiveDate) === time(item.latestPurchase.date) &&
          contribution.purchase.id.localeCompare(item.latestPurchaseId ?? "") > 0);
      if (isLatestPurchase) {
        item.latestPurchase = {
          quantity: contribution.purchase.quantity,
          date: purchaseEffectiveDate,
          source: contribution.purchase.source,
          retailerName: contribution.purchase.retailerName,
          variantLabel: contribution.purchase.variant.label,
        };
        item.latestPurchaseId = contribution.purchase.id;
        applyVariantContext(item, contribution.purchase.variant, 1);
      }
    }

    byVersion.set(contribution.base.productVersionId, item);
  }

  return [...byVersion.values()].map((value) => {
    const { latestPurchaseId, variantContextPriority, ...item } = value;
    void latestPurchaseId;
    void variantContextPriority;
    return item;
  });
}

export function matchesCollectionFilter(item: MyCollectionItem, filter: CollectionFilter): boolean {
  switch (filter) {
    case "WANT":
      return item.wants;
    case "TRIED":
      return item.tried;
    case "OWNED":
      return item.owned;
    case "HOLY_GRAIL":
      return item.holyGrail;
    case "WOULD_REPURCHASE":
      return item.wouldRepurchase;
  }
}

export function filterCollectionItems(
  items: readonly MyCollectionItem[],
  filters: readonly CollectionFilter[],
): MyCollectionItem[] {
  if (filters.length === 0) return [...items];
  return items.filter((item) => filters.every((filter) => matchesCollectionFilter(item, filter)));
}

function alphabeticalCompare(a: MyCollectionItem, b: MyCollectionItem): number {
  return (
    a.brandName.localeCompare(b.brandName) ||
    a.productName.localeCompare(b.productName) ||
    a.versionName.localeCompare(b.versionName) ||
    a.productVersionId.localeCompare(b.productVersionId)
  );
}

export function sortCollectionItems(
  items: readonly MyCollectionItem[],
  sort: CollectionSort,
): MyCollectionItem[] {
  return [...items].sort((a, b) => {
    if (sort === "RATING") {
      if (a.ratingHalfSteps !== null && b.ratingHalfSteps !== null) {
        const ratingDifference = b.ratingHalfSteps - a.ratingHalfSteps;
        if (ratingDifference !== 0) return ratingDifference;
      } else if (a.ratingHalfSteps !== null) {
        return -1;
      } else if (b.ratingHalfSteps !== null) {
        return 1;
      }
    }

    if (sort === "RECENT") {
      const dateDifference = time(b.updatedAt) - time(a.updatedAt);
      if (dateDifference !== 0) return dateDifference;
    }

    return alphabeticalCompare(a, b);
  });
}
