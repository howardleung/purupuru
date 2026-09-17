"use server";

import {
  planCollectionMutation,
} from "@beauty-platform/domain/collection";
import { revalidatePath } from "next/cache";

import type { ProductCollectionActionResult } from "../../../lib/collection-contract";
import { isProductCollectionInput } from "../../../lib/input-validation";
import { getPersistedCollectionState } from "../../../lib/collection-state";
import { getMutationUser } from "../../../lib/current-user";
import { RateLimitError } from "../../../lib/rate-limit";
import { runSerializable } from "../../../lib/transactions";

export async function updateProductCollection(
  input: unknown,
): Promise<ProductCollectionActionResult> {
  if (!isProductCollectionInput(input)) {
    return { status: "INVALID", message: "The collection action was not valid." };
  }

  try {
    const user = await getMutationUser();
    if (!user) {
      return { status: "UNAUTHENTICATED", message: "Sign in to save personal collection state." };
    }
    const result = await runSerializable(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: {
          id: input.productVariantId,
          productVersionId: input.productVersionId,
          productVersion: { productFamily: { slug: input.productSlug } },
        },
        select: { id: true },
      });

      if (!variant) {
        return { status: "INVALID", message: "That version and size combination was not found." } satisfies ProductCollectionActionResult;
      }

      const current = await getPersistedCollectionState(
        user.id,
        input.productVersionId,
        tx,
      );

      const removablePurchase =
        input.intent.type === "REMOVE_OWNED"
          ? await tx.purchaseInstance.findFirst({
              where: {
                userId: user.id,
                source: "MANUAL",
                shoppingListItemId: null,
                productVariant: { productVersionId: input.productVersionId },
              },
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              select: { id: true },
            })
          : null;

      if (input.intent.type === "REMOVE_OWNED" && !removablePurchase) {
        return {
          status: "INVALID",
          message: "This ownership comes from a shopping-list purchase and is kept as purchase history.",
          state: current,
        } satisfies ProductCollectionActionResult;
      }

      const plan = planCollectionMutation(current, input.intent);

      if (plan.status === "CONFIRMATION_REQUIRED") {
        return {
          status: "CONFIRMATION_REQUIRED",
          message: plan.message,
          state: current,
          confirmation: plan.confirmation,
        } satisfies ProductCollectionActionResult;
      }

      if (plan.status === "INVALID") {
        return {
          status: "INVALID",
          message: plan.message,
          state: current,
        } satisfies ProductCollectionActionResult;
      }

      if (plan.status === "ALREADY_OWNED") {
        return {
          status: "SUCCESS",
          message: plan.message,
          state: current,
        } satisfies ProductCollectionActionResult;
      }

      const entry = await tx.collectionEntry.upsert({
        where: {
          userId_productVersionId: {
            userId: user.id,
            productVersionId: input.productVersionId,
          },
        },
        update: {
          selectedVariantId: input.productVariantId,
          wants: plan.state.wants,
          tried: plan.state.tried,
        },
        create: {
          userId: user.id,
          productVersionId: input.productVersionId,
          selectedVariantId: input.productVariantId,
          wants: plan.state.wants,
          tried: plan.state.tried,
        },
      });

      if (plan.state.holyGrail) {
        await tx.collectionTag.upsert({
          where: {
            collectionEntryId_kind: {
              collectionEntryId: entry.id,
              kind: "HOLY_GRAIL",
            },
          },
          update: {},
          create: {
            collectionEntryId: entry.id,
            kind: "HOLY_GRAIL",
          },
        });
      } else {
        await tx.collectionTag.deleteMany({
          where: { collectionEntryId: entry.id, kind: "HOLY_GRAIL" },
        });
      }

      if (plan.state.wouldRepurchase) {
        await tx.collectionTag.upsert({
          where: {
            collectionEntryId_kind: {
              collectionEntryId: entry.id,
              kind: "WOULD_REPURCHASE",
            },
          },
          update: {},
          create: {
            collectionEntryId: entry.id,
            kind: "WOULD_REPURCHASE",
          },
        });
      } else {
        await tx.collectionTag.deleteMany({
          where: { collectionEntryId: entry.id, kind: "WOULD_REPURCHASE" },
        });
      }

      if (input.intent.type === "SET_RATING" && plan.state.ratingHalfSteps !== null) {
        await tx.userRating.upsert({
          where: {
            userId_productVersionId: {
              userId: user.id,
              productVersionId: input.productVersionId,
            },
          },
          update: {
            contextualVariantId: input.productVariantId,
            ratingHalfSteps: plan.state.ratingHalfSteps,
          },
          create: {
            userId: user.id,
            productVersionId: input.productVersionId,
            contextualVariantId: input.productVariantId,
            ratingHalfSteps: plan.state.ratingHalfSteps,
          },
        });
      } else if (plan.state.ratingHalfSteps === null) {
        await tx.userRating.deleteMany({
          where: {
            userId: user.id,
            productVersionId: input.productVersionId,
          },
        });
      }

      if (plan.purchaseDelta === 1) {
        await tx.purchaseInstance.create({
          data: {
            userId: user.id,
            productVariantId: input.productVariantId,
            quantity: 1,
            source: "MANUAL",
          },
        });
      } else if (plan.purchaseDelta === -1 && removablePurchase) {
        await tx.purchaseInstance.delete({ where: { id: removablePurchase.id } });
      }

      const state = await getPersistedCollectionState(user.id, input.productVersionId, tx);
      if (
        !state.wants &&
        !state.tried &&
        !state.holyGrail &&
        !state.wouldRepurchase &&
        state.ratingHalfSteps === null &&
        state.purchaseCount === 0
      ) {
        await tx.collectionEntry.deleteMany({
          where: { userId: user.id, productVersionId: input.productVersionId },
        });
      }
      return {
        status: "SUCCESS",
        message: plan.message,
        state,
      } satisfies ProductCollectionActionResult;
    });

    if (result.status === "SUCCESS") {
      revalidatePath(`/products/${input.productSlug}`);
      revalidatePath("/collection");
    }

    return result;
  } catch (error) {
    return {
      status: "ERROR",
      message: error instanceof RateLimitError ? error.message : "PuruPuru could not save that change. Please try again.",
    };
  }
}
