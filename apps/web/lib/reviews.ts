import "server-only";

import { prisma } from "@beauty-platform/database";

export const REVIEW_PAGE_SIZE = 20;

export type ReviewCardView = {
  id: string;
  rating: number;
  body: string | null;
  skinTypeSnapshot: string | null;
  sensitiveSkinSnapshot: boolean;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  avatar: { name: string; assetPath: string } | null;
  variantId: string;
  variantLabel: string;
  versionId: string;
  versionLabel: string;
};

export type ProductReviewData = {
  summary: {
    average: number | null;
    count: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  reviews: ReviewCardView[];
  currentReview: ReviewCardView | null;
  hasMore: boolean;
};

const reviewInclude = {
  user: {
    select: {
      displayName: true,
      selectedAvatar: { select: { name: true, assetPath: true } },
    },
  },
  productVariant: { select: { id: true, displaySize: true } },
  productVersion: { select: { id: true, versionName: true } },
} as const;

export async function getProductReviewData(
  productFamilyId: string,
  currentUserId: string | null,
): Promise<ProductReviewData> {
  const [groups, rows, currentReview, defaultAvatar] = await Promise.all([
    prisma.review.groupBy({
      by: ["rating"],
      where: { productFamilyId },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { productFamilyId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: REVIEW_PAGE_SIZE + 1,
      include: reviewInclude,
    }),
    currentUserId
      ? prisma.review.findUnique({
          where: { userId_productFamilyId: { userId: currentUserId, productFamilyId } },
          include: reviewInclude,
        })
      : Promise.resolve(null),
    prisma.profileAvatar.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, assetPath: true },
    }),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const group of groups) distribution[group.rating as keyof typeof distribution] = group._count._all;
  const count = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  const weightedTotal = Object.entries(distribution).reduce(
    (sum, [rating, value]) => sum + Number(rating) * value,
    0,
  );

  function toView(row: (typeof rows)[number]): ReviewCardView {
    return {
      id: row.id,
      rating: row.rating,
      body: row.body,
      skinTypeSnapshot: row.skinTypeSnapshot,
      sensitiveSkinSnapshot: row.sensitiveSkinSnapshot,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      displayName: row.user.displayName?.trim() || "PuruPuru User",
      avatar: row.user.selectedAvatar ?? defaultAvatar,
      variantId: row.productVariant.id,
      variantLabel: row.productVariant.displaySize,
      versionId: row.productVersion.id,
      versionLabel: row.productVersion.versionName,
    };
  }

  return {
    summary: {
      average: count === 0 ? null : weightedTotal / count,
      count,
      distribution,
    },
    reviews: rows.slice(0, REVIEW_PAGE_SIZE).map(toView),
    currentReview: currentReview ? toView(currentReview) : null,
    hasMore: rows.length > REVIEW_PAGE_SIZE,
  };
}
