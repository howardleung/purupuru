import "server-only";

import { prisma } from "@beauty-platform/database";
import type { Prisma } from "@beauty-platform/database";
import {
  createEmptyCollectionState,
  type CollectionRelationshipState,
} from "@beauty-platform/domain/collection";

type CollectionDatabaseClient = Prisma.TransactionClient;

export async function getPersistedCollectionState(
  userId: string,
  productVersionId: string,
  client: CollectionDatabaseClient = prisma,
): Promise<CollectionRelationshipState> {
  const [entry, rating, purchaseCount] = await Promise.all([
    client.collectionEntry.findUnique({
      where: {
        userId_productVersionId: { userId, productVersionId },
      },
      include: { tags: true },
    }),
    client.userRating.findUnique({
      where: {
        userId_productVersionId: { userId, productVersionId },
      },
    }),
    client.purchaseInstance.count({
      where: {
        userId,
        productVariant: { productVersionId },
      },
    }),
  ]);

  if (!entry && !rating && purchaseCount === 0) return createEmptyCollectionState();

  return {
    wants: entry?.wants ?? false,
    tried: entry?.tried ?? false,
    holyGrail: entry?.tags.some((tag) => tag.kind === "HOLY_GRAIL") ?? false,
    wouldRepurchase:
      entry?.tags.some((tag) => tag.kind === "WOULD_REPURCHASE") ?? false,
    purchaseCount,
    ratingHalfSteps: rating?.ratingHalfSteps ?? null,
  };
}
