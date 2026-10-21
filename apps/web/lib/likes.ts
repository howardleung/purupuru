import "server-only";
import { randomUUID } from "node:crypto";

import { prisma } from "@beauty-platform/database";
import type { LikeInput } from "@beauty-platform/domain/likes";

import { getCatalogue } from "./catalogue";
import type { LikeResult } from "./like-contract";
import { runSerializable } from "./transactions";

export async function getLikedVersionIdsForUser(userId: string) {
  const likes = await prisma.productLike.findMany({
    where: { userId }, orderBy: [{ createdAt: "desc" }, { productVersionId: "asc" }],
    select: { productVersionId: true },
  });
  return likes.map((like) => like.productVersionId);
}

export async function getLikedProductsForUser(userId: string) {
  const likes = await prisma.productLike.findMany({
    where: { userId }, orderBy: [{ createdAt: "desc" }, { productVersionId: "asc" }],
    select: { productVersionId: true, productVersion: { select: {
      versionName: true,
      productFamily: { select: { slug: true, canonicalName: true, brand: { select: { name: true } } } },
    } } },
  });
  const ids = likes.map((like) => like.productVersionId);
  if (ids.length === 0) return { products: [], unavailable: [] };
  const { products } = await getCatalogue({ productVersionIds: ids });
  const positions = new Map(ids.map((id, index) => [id, index]));
  const visible = new Set(products.flatMap((product) => product.currentVersion ? [product.currentVersion.id] : []));
  return {
    products: products.sort((a, b) => (positions.get(a.currentVersion?.id ?? "") ?? ids.length) -
      (positions.get(b.currentVersion?.id ?? "") ?? ids.length)),
    unavailable: likes.filter((like) => !visible.has(like.productVersionId)),
  };
}

export async function setLikeForUser(userId: string, input: LikeInput): Promise<LikeResult> {
  return runSerializable(async (tx) => {
    const version = await tx.productVersion.findFirst({
      where: { id: input.productVersionId, productFamily: { slug: input.productSlug } },
      select: { id: true, productFamilyId: true, variants: { where: { isActive: true }, select: { id: true }, take: 1 } },
    });
    if (!version || (input.liked && version.variants.length === 0)) {
      return { status: "INVALID", message: "This product version is no longer available to like." };
    }
    const mutation = input.liked
      ? await tx.productLike.createMany({
        data: { userId, productVersionId: version.id }, skipDuplicates: true,
      })
      : await tx.productLike.deleteMany({ where: { userId, productVersionId: version.id } });
    return { status: "SUCCESS", message: input.liked ? "Product liked." : "Like removed.",
      productVersionId: version.id, liked: input.liked,
      ...(mutation.count > 0 ? { analyticsTransition: { transitionId: randomUUID(),
        productFamilyId: version.productFamilyId, productVersionId: version.id, liked: input.liked } } : {}) };
  });
}
