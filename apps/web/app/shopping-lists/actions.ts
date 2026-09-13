"use server";

import { prisma } from "@beauty-platform/database";
import {
  purchaseDelta,
  validateQuantityUpdate,
  validateRequestedQuantity,
} from "@beauty-platform/domain/shopping-list";
import { revalidatePath } from "next/cache";

import type {
  AddVariantToListInput,
  CreateListWithVariantInput,
  CreateShoppingListInput,
  MarkShoppingListItemPurchasedInput,
  ShoppingListActionResult,
  UpdateShoppingListItemInput,
} from "../../lib/shopping-list-contract";
import { isSupportedTargetMarket } from "../../lib/markets";
import { runSerializable } from "../../lib/transactions";
import { getOrCreateCurrentUser } from "../../lib/current-user";

function normalizedName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validName(value: string) {
  return value.length >= 1 && value.length <= 100;
}

function unexpectedError(): ShoppingListActionResult {
  return { status: "ERROR", message: "Otoku could not save that change. Please try again." };
}

export async function createShoppingList(
  input: CreateShoppingListInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to create a shopping list." };

  const name = normalizedName(input?.name ?? "");
  const targetMarket = input?.targetMarket?.toUpperCase() ?? "";
  if (!validName(name) || !isSupportedTargetMarket(targetMarket)) {
    return { status: "INVALID", message: "Enter a list name and choose a supported target market." };
  }

  try {
    const list = await prisma.shoppingList.create({
      data: { userId: user.id, name, targetMarket, visibility: "PRIVATE" },
      select: { id: true },
    });
    revalidatePath("/shopping-lists");
    return { status: "SUCCESS", message: "Shopping list created.", listId: list.id };
  } catch {
    return unexpectedError();
  }
}

export async function createListWithVariant(
  input: CreateListWithVariantInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to create a shopping list." };

  const name = normalizedName(input?.name ?? "");
  const targetMarket = input?.targetMarket?.toUpperCase() ?? "";
  if (
    !validName(name) ||
    !isSupportedTargetMarket(targetMarket) ||
    !validateRequestedQuantity(input?.quantity)
  ) {
    return { status: "INVALID", message: "Enter a valid name, market, and quantity." };
  }

  try {
    const result = await runSerializable(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: input.productVariantId },
        select: { id: true },
      });
      if (!variant) return null;

      const list = await tx.shoppingList.create({
        data: { userId: user.id, name, targetMarket, visibility: "PRIVATE" },
        select: { id: true },
      });
      const item = await tx.shoppingListItem.create({
        data: {
          shoppingListId: list.id,
          productVariantId: variant.id,
          quantity: input.quantity,
        },
        select: { id: true, quantity: true },
      });
      return { list, item };
    });

    if (!result) {
      return { status: "NOT_FOUND", message: "That product size is no longer available." };
    }

    revalidatePath("/shopping-lists");
    if (input.productSlug) revalidatePath(`/products/${input.productSlug}`);
    return {
      status: "SUCCESS",
      message: `Created the list and added ${result.item.quantity}.`,
      listId: result.list.id,
      itemId: result.item.id,
      quantity: result.item.quantity,
    };
  } catch {
    return unexpectedError();
  }
}

export async function addVariantToShoppingList(
  input: AddVariantToListInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to add to a shopping list." };
  if (!validateRequestedQuantity(input?.quantity)) {
    return { status: "INVALID", message: "Quantity must be at least 1." };
  }

  try {
    const item = await runSerializable(async (tx) => {
      const [list, variant] = await Promise.all([
        tx.shoppingList.findFirst({
          where: { id: input.shoppingListId, userId: user.id },
          select: { id: true },
        }),
        tx.productVariant.findUnique({
          where: { id: input.productVariantId },
          select: { id: true },
        }),
      ]);
      if (!list || !variant) return null;

      return tx.shoppingListItem.upsert({
        where: {
          shoppingListId_productVariantId: {
            shoppingListId: list.id,
            productVariantId: variant.id,
          },
        },
        update: { quantity: { increment: input.quantity } },
        create: {
          shoppingListId: list.id,
          productVariantId: variant.id,
          quantity: input.quantity,
        },
        select: { id: true, quantity: true },
      });
    });

    if (!item) {
      return { status: "NOT_FOUND", message: "That list or product size was not found." };
    }

    revalidatePath("/shopping-lists");
    revalidatePath(`/shopping-lists/${input.shoppingListId}`);
    if (input.productSlug) revalidatePath(`/products/${input.productSlug}`);
    return {
      status: "SUCCESS",
      message: `List quantity is now ${item.quantity}.`,
      itemId: item.id,
      quantity: item.quantity,
    };
  } catch {
    return unexpectedError();
  }
}

export async function updateShoppingListItemQuantity(
  input: UpdateShoppingListItemInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to update a shopping list." };

  try {
    const item = await runSerializable(async (tx) => {
      const current = await tx.shoppingListItem.findFirst({
        where: {
          id: input.shoppingListItemId,
          shoppingListId: input.shoppingListId,
          shoppingList: { userId: user.id },
        },
        select: { id: true, purchasedQuantity: true },
      });
      if (!current) return { kind: "NOT_FOUND" as const };
      if (!validateQuantityUpdate(input.quantity, current.purchasedQuantity)) {
        return { kind: "INVALID" as const, purchasedQuantity: current.purchasedQuantity };
      }

      const saved = await tx.shoppingListItem.update({
        where: { id: current.id },
        data: { quantity: input.quantity },
        select: { quantity: true, purchasedQuantity: true },
      });
      return { kind: "SUCCESS" as const, ...saved };
    });

    if (item.kind === "NOT_FOUND") {
      return { status: "NOT_FOUND", message: "That private list item was not found." };
    }
    if (item.kind === "INVALID") {
      return {
        status: "INVALID",
        message: `Quantity must be at least ${Math.max(1, item.purchasedQuantity)} because purchased units are retained.`,
      };
    }

    revalidatePath(`/shopping-lists/${input.shoppingListId}`);
    return {
      status: "SUCCESS",
      message: "Quantity updated.",
      quantity: item.quantity,
      purchasedQuantity: item.purchasedQuantity,
    };
  } catch {
    return unexpectedError();
  }
}

export async function markShoppingListItemPurchased(
  input: MarkShoppingListItemPurchasedInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to record purchases." };

  try {
    const result = await runSerializable(async (tx) => {
      const item = await tx.shoppingListItem.findFirst({
        where: {
          id: input.shoppingListItemId,
          shoppingListId: input.shoppingListId,
          shoppingList: { userId: user.id },
        },
        select: {
          id: true,
          quantity: true,
          purchasedQuantity: true,
          productVariantId: true,
          productVariant: { select: { productVersionId: true } },
        },
      });
      if (!item) return { kind: "NOT_FOUND" as const };

      const delta = purchaseDelta(
        item.quantity,
        item.purchasedQuantity,
        input.purchasedQuantity,
      );
      if (delta === null) return { kind: "INVALID" as const, item };
      if (delta === 0) return { kind: "SUCCESS" as const, item, delta };

      const saved = await tx.shoppingListItem.update({
        where: { id: item.id },
        data: { purchasedQuantity: input.purchasedQuantity },
        select: {
          id: true,
          quantity: true,
          purchasedQuantity: true,
          productVariantId: true,
        },
      });

      await tx.purchaseInstance.create({
        data: {
          userId: user.id,
          productVariantId: item.productVariantId,
          shoppingListItemId: item.id,
          quantity: delta,
          source: "SHOPPING_LIST",
        },
      });

      await tx.collectionEntry.upsert({
        where: {
          userId_productVersionId: {
            userId: user.id,
            productVersionId: item.productVariant.productVersionId,
          },
        },
        update: {
          selectedVariantId: item.productVariantId,
          wants: false,
        },
        create: {
          userId: user.id,
          productVersionId: item.productVariant.productVersionId,
          selectedVariantId: item.productVariantId,
          wants: false,
          tried: false,
        },
      });

      return { kind: "SUCCESS" as const, item: saved, delta };
    });

    if (result.kind === "NOT_FOUND") {
      return { status: "NOT_FOUND", message: "That private list item was not found." };
    }
    if (result.kind === "INVALID") {
      return {
        status: "INVALID",
        message: "Purchased quantity must stay between the current purchased amount and total quantity.",
      };
    }

    revalidatePath(`/shopping-lists/${input.shoppingListId}`);
    return {
      status: "SUCCESS",
      message:
        result.delta === 0
          ? "Purchased quantity is already up to date."
          : `Recorded ${result.delta} newly purchased ${result.delta === 1 ? "unit" : "units"}.`,
      quantity: result.item.quantity,
      purchasedQuantity: result.item.purchasedQuantity,
    };
  } catch {
    return unexpectedError();
  }
}
