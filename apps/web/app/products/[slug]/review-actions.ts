"use server";

import { isProfileSkinType } from "@beauty-platform/domain/profile";
import { validateReviewInput } from "@beauty-platform/domain/reviews";
import { revalidatePath } from "next/cache";

import { getMutationUser } from "../../../lib/current-user";
import { isIdentifier, isRecord, isRouteSlug } from "../../../lib/input-validation";
import { RateLimitError } from "../../../lib/rate-limit";
import type { ReviewActionResult, SaveReviewInput } from "../../../lib/review-contract";
import { runSerializable } from "../../../lib/transactions";

function isReviewContext(input: unknown): input is Record<string, unknown> & Pick<SaveReviewInput, "productFamilyId" | "productSlug"> {
  return isRecord(input) && isIdentifier(input.productFamilyId) && isRouteSlug(input.productSlug);
}

export async function saveProductReview(input: unknown): Promise<ReviewActionResult> {
  if (!isReviewContext(input)) return { status: "INVALID", message: "That product was not valid." };
  const validation = validateReviewInput({
    rating: input.rating,
    body: input.body,
    productVariantId: input.productVariantId,
  });
  if (!validation.ok) return { status: "INVALID", message: validation.message };

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to write a review." };

    const result = await runSerializable(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: {
          id: validation.value.productVariantId,
          isActive: true,
          productVersion: {
            productFamilyId: input.productFamilyId,
            productFamily: { slug: input.productSlug },
          },
        },
        select: { id: true, productVersionId: true },
      });
      if (!variant) {
        return { status: "INVALID", message: "That size does not belong to this product." } satisfies ReviewActionResult;
      }

      await tx.review.upsert({
        where: {
          userId_productFamilyId: { userId: user.id, productFamilyId: input.productFamilyId },
        },
        update: {
          productVersionId: variant.productVersionId,
          productVariantId: variant.id,
          rating: validation.value.rating,
          body: validation.value.body,
          skinTypeSnapshot: isProfileSkinType(user.skinType) ? user.skinType : null,
          sensitiveSkinSnapshot: user.sensitiveSkin,
        },
        create: {
          userId: user.id,
          productFamilyId: input.productFamilyId,
          productVersionId: variant.productVersionId,
          productVariantId: variant.id,
          rating: validation.value.rating,
          body: validation.value.body,
          skinTypeSnapshot: isProfileSkinType(user.skinType) ? user.skinType : null,
          sensitiveSkinSnapshot: user.sensitiveSkin,
        },
      });
      return { status: "SUCCESS", message: "Your review was saved." } satisfies ReviewActionResult;
    });

    if (result.status === "SUCCESS") revalidatePath(`/products/${input.productSlug}`);
    return result;
  } catch (error) {
    if (!(error instanceof RateLimitError)) console.error("Unable to save product review", error);
    return {
      status: "ERROR",
      message: error instanceof RateLimitError ? error.message : "PuruPuru could not save your review. Please try again.",
    };
  }
}

export async function deleteProductReview(input: unknown): Promise<ReviewActionResult> {
  if (!isReviewContext(input) || input.confirmed !== true) {
    return { status: "INVALID", message: "Confirm that you want to delete your review." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to delete your review." };
    const result = await runSerializable((tx) => tx.review.deleteMany({
      where: { userId: user.id, productFamilyId: input.productFamilyId },
    }));
    if (result.count === 0) return { status: "INVALID", message: "Your review was not found." };
    revalidatePath(`/products/${input.productSlug}`);
    return { status: "SUCCESS", message: "Your review was deleted." };
  } catch (error) {
    if (!(error instanceof RateLimitError)) console.error("Unable to delete product review", error);
    return {
      status: "ERROR",
      message: error instanceof RateLimitError ? error.message : "PuruPuru could not delete your review. Please try again.",
    };
  }
}
