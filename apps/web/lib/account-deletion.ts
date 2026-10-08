import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { RateLimitError } from "./rate-limit";
import { enforceRateLimit } from "./request-security";
import { runSerializable } from "./transactions";

export type DeleteAccountResult = {
  status: "SUCCESS" | "INVALID" | "UNAUTHENTICATED" | "ERROR" | "RETRY_REQUIRED";
  message: string;
};

function isNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

async function deleteLocalAccountData(clerkUserId: string) {
  return runSerializable(async (tx) => {
    const user = await tx.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) return;

    await tx.collectionTag.deleteMany({ where: { collectionEntry: { userId: user.id } } });
    await tx.collectionEntry.deleteMany({ where: { userId: user.id } });
    await tx.userRating.deleteMany({ where: { userId: user.id } });
    await tx.purchaseInstance.deleteMany({ where: { userId: user.id } });
    await tx.shoppingListItem.deleteMany({ where: { shoppingList: { userId: user.id } } });
    await tx.shoppingList.deleteMany({ where: { userId: user.id } });
    await tx.user.deleteMany({ where: { id: user.id, clerkUserId } });
  });
}

export async function deleteCurrentAccount(confirmation: unknown): Promise<DeleteAccountResult> {
  if (confirmation !== "DELETE") {
    return { status: "INVALID", message: "Type DELETE exactly to confirm account deletion." };
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { status: "UNAUTHENTICATED", message: "Sign in before deleting your account." };
  }

  try {
    const limit = await enforceRateLimit("mutation", clerkUserId);
    if (!limit.allowed) throw new RateLimitError(limit);
    await deleteLocalAccountData(clerkUserId);
  } catch (error) {
    if (!(error instanceof RateLimitError)) console.error("Unable to delete local PuruPuru account data", error);
    return {
      status: "ERROR",
      message: error instanceof RateLimitError
        ? error.message
        : "PuruPuru could not delete your account data. Nothing was deleted from Clerk. Please try again.",
    };
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);
  } catch (error) {
    if (isNotFoundError(error)) {
      return { status: "SUCCESS", message: "Your account has been deleted." };
    }
    console.error("Local account data was deleted, but Clerk account deletion failed", error);
    return {
      status: "RETRY_REQUIRED",
      message: "Your PuruPuru data was deleted, but sign-in account deletion did not finish. Please retry now.",
    };
  }

  return { status: "SUCCESS", message: "Your account has been deleted." };
}
