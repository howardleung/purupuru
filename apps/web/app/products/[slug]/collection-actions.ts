"use server";

import {
  planCollectionMutation,
  type CollectionMutationIntent,
} from "@beauty-platform/domain/collection";
import { revalidatePath } from "next/cache";

import type {
  ProductCollectionActionInput,
  ProductCollectionActionResult,
} from "../../../lib/collection-contract";
import { getPersistedCollectionState } from "../../../lib/collection-state";
import { getOrCreateCurrentUser } from "../../../lib/current-user";
import { runSerializable } from "../../../lib/transactions";

function isMutationIntent(value: unknown): value is CollectionMutationIntent {
  if (!value || typeof value !== "object" || !("type" in value)) return false;

  const intent = value as Record<string, unknown>;
  switch (intent.type) {
    case "ADD_WANT":
    case "REMOVE_WANT":
    case "ADD_TRIED":
    case "REMOVE_TRIED":
    case "ADD_HOLY_GRAIL":
    case "REMOVE_HOLY_GRAIL":
    case "ADD_OWNED":
    case "REMOVE_OWNED":
    case "REMOVE_WOULD_REPURCHASE":
      return true;
    case "ADD_WOULD_REPURCHASE":
      return intent.confirmedTried === undefined || typeof intent.confirmedTried === "boolean";
    case "SET_RATING":
      return (
        typeof intent.ratingHalfSteps === "number" &&
        (intent.confirmedTried === undefined || typeof intent.confirmedTried === "boolean")
      );
    case "ADD_ANOTHER_PURCHASE":
      return intent.confirmed === undefined || typeof intent.confirmed === "boolean";
    default:
      return false;
  }
}

export async function updateProductCollection(
  input: ProductCollectionActionInput,
): Promise<ProductCollectionActionResult> {
  if (
    !input ||
    typeof input.productSlug !== "string" ||
    typeof input.productVersionId !== "string" ||
    typeof input.productVariantId !== "string" ||
    !isMutationIntent(input.intent)
  ) {
    return { status: "INVALID", message: "The collection action was not valid." };
  }

  const user = await getOrCreateCurrentUser();
  if (!user) {
    return { status: "UNAUTHENTICATED", message: "Sign in to save personal collection state." };
  }

  try {
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
  } catch {
    return {
      status: "ERROR",
      message: "PuruPuru could not save that change. Please try again.",
    };
  }
}
