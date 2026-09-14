"use server";

import { prisma } from "@beauty-platform/database";
import {
  checklistPurchasedQuantity,
  quantityStateAfterChange,
  validateRequestedQuantity,
} from "@beauty-platform/domain/shopping-list";
import { revalidatePath } from "next/cache";

import type {
  AddVariantToListInput,
  CreateListWithVariantInput,
  CreateShoppingListInput,
  MarkShoppingListItemPurchasedInput,
  RemoveShoppingListItemInput,
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

      const existing = await tx.shoppingListItem.findUnique({
        where: {
          shoppingListId_productVariantId: {
            shoppingListId: list.id,
            productVariantId: variant.id,
          },
        },
        select: { id: true, quantity: true, purchasedQuantity: true },
      });
      if (existing) {
        const next = quantityStateAfterChange(
          existing.quantity,
          existing.purchasedQuantity,
          existing.quantity + input.quantity,
        );
        if (!next) return null;
        return tx.shoppingListItem.update({
          where: { id: existing.id },
          data: next,
          select: { id: true, quantity: true },
        });
      }

      return tx.shoppingListItem.create({
        data: {
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
        select: { id: true, quantity: true, purchasedQuantity: true },
      });
      if (!current) return { kind: "NOT_FOUND" as const };
      const next = quantityStateAfterChange(
        current.quantity,
        current.purchasedQuantity,
        input.quantity,
      );
      if (!next) return { kind: "INVALID" as const };

      const saved = await tx.shoppingListItem.update({
        where: { id: current.id },
        data: next,
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
        message: "Quantity must be a whole number of at least 1.",
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
  if (typeof input?.purchased !== "boolean") {
    return { status: "INVALID", message: "Choose whether this item is purchased." };
  }

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
        },
      });
      if (!item) return { kind: "NOT_FOUND" as const };

      const purchasedQuantity = checklistPurchasedQuantity(item.quantity, input.purchased);
      if (purchasedQuantity === null) return { kind: "INVALID" as const };
      if (purchasedQuantity === item.purchasedQuantity) {
        return { kind: "SUCCESS" as const, item };
      }

      const saved = await tx.shoppingListItem.update({
        where: { id: item.id },
        data: { purchasedQuantity },
        select: {
          id: true,
          quantity: true,
          purchasedQuantity: true,
        },
      });
      return { kind: "SUCCESS" as const, item: saved };
    });

    if (result.kind === "NOT_FOUND") {
      return { status: "NOT_FOUND", message: "That private list item was not found." };
    }
    if (result.kind === "INVALID") {
      return {
        status: "INVALID",
        message: "That quantity cannot be marked purchased.",
      };
    }

    revalidatePath(`/shopping-lists/${input.shoppingListId}`);
    return {
      status: "SUCCESS",
      message: result.item.purchasedQuantity === result.item.quantity ? "Marked purchased." : "Marked not purchased.",
      quantity: result.item.quantity,
      purchasedQuantity: result.item.purchasedQuantity,
    };
  } catch {
    return unexpectedError();
  }
}

export async function removeShoppingListItem(
  input: RemoveShoppingListItemInput,
): Promise<ShoppingListActionResult> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to update a shopping list." };

  try {
    const removed = await runSerializable(async (tx) => {
      const item = await tx.shoppingListItem.findFirst({
        where: {
          id: input.shoppingListItemId,
          shoppingListId: input.shoppingListId,
          shoppingList: { userId: user.id },
        },
        select: { id: true },
      });
      if (!item) return false;

      // A list row is ephemeral; linked purchase records are durable history.
      await tx.purchaseInstance.updateMany({
        where: { shoppingListItemId: item.id, userId: user.id },
        data: { shoppingListItemId: null },
      });
      await tx.shoppingListItem.delete({ where: { id: item.id } });
      return true;
    });

    if (!removed) {
      return { status: "NOT_FOUND", message: "That private list item was not found." };
    }

    revalidatePath("/shopping-lists");
    revalidatePath(`/shopping-lists/${input.shoppingListId}`);
    return { status: "SUCCESS", message: "Removed from this shopping list.", itemId: input.shoppingListItemId };
  } catch {
    return unexpectedError();
  }
}
