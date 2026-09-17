"use server";

import { prisma } from "@beauty-platform/database";
import {
  checklistPurchasedQuantity,
  quantityStateAfterChange,
} from "@beauty-platform/domain/shopping-list";
import { revalidatePath } from "next/cache";

import type { ShoppingListActionResult } from "../../lib/shopping-list-contract";
import { isShoppingListInput } from "../../lib/input-validation";
import { isSupportedTargetMarket } from "../../lib/markets";
import { runSerializable } from "../../lib/transactions";
import { getMutationUser } from "../../lib/current-user";
import { RateLimitError } from "../../lib/rate-limit";

function normalizedName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validName(value: string) {
  return value.length >= 1 && value.length <= 100;
}

function unexpectedError(error: unknown): ShoppingListActionResult {
  return { status: "ERROR", message: error instanceof RateLimitError
    ? error.message : "PuruPuru could not save that change. Please try again." };
}

export async function createShoppingList(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("create", input)) {
    return { status: "INVALID", message: "Enter a list name and choose a supported target market." };
  }

  const name = normalizedName(input?.name ?? "");
  const targetMarket = input?.targetMarket?.toUpperCase() ?? "";
  if (!validName(name) || !isSupportedTargetMarket(targetMarket)) {
    return { status: "INVALID", message: "Enter a list name and choose a supported target market." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to create a shopping list." };
    const list = await prisma.shoppingList.create({
      data: { userId: user.id, name, targetMarket, visibility: "PRIVATE" },
      select: { id: true },
    });
    revalidatePath("/shopping-lists");
    return { status: "SUCCESS", message: "Shopping list created.", listId: list.id };
  } catch (error) {
    return unexpectedError(error);
  }
}

export async function createListWithVariant(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("createWithVariant", input)) {
    return { status: "INVALID", message: "Enter a valid name, market, product size, and quantity." };
  }

  const name = normalizedName(input?.name ?? "");
  const targetMarket = input?.targetMarket?.toUpperCase() ?? "";
  if (
    !validName(name) ||
    !isSupportedTargetMarket(targetMarket)
  ) {
    return { status: "INVALID", message: "Enter a valid name, market, and quantity." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to create a shopping list." };
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
  } catch (error) {
    return unexpectedError(error);
  }
}

export async function addVariantToShoppingList(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("add", input)) {
    return { status: "INVALID", message: "Choose a valid list, product size, and whole-number quantity of at least 1." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to add to a shopping list." };
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
  } catch (error) {
    return unexpectedError(error);
  }
}

export async function updateShoppingListItemQuantity(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("update", input)) {
    return { status: "INVALID", message: "Choose a valid list item and whole-number quantity of at least 1." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to update a shopping list." };
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
  } catch (error) {
    return unexpectedError(error);
  }
}

export async function markShoppingListItemPurchased(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("purchased", input)) {
    return { status: "INVALID", message: "Choose a valid list item and whether it is purchased." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to record purchases." };
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
  } catch (error) {
    return unexpectedError(error);
  }
}

export async function removeShoppingListItem(
  input: unknown,
): Promise<ShoppingListActionResult> {
  if (!isShoppingListInput("remove", input)) {
    return { status: "INVALID", message: "Choose a valid shopping-list item." };
  }

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to update a shopping list." };
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
  } catch (error) {
    return unexpectedError(error);
  }
}
