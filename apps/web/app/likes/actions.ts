"use server";

import { prisma } from "@beauty-platform/database";
import { auth } from "@clerk/nextjs/server";
import { isLikeInput, isLikeTarget, LIKE_INTENT_MAX_AGE_SECONDS, parseLikeIntent } from "@beauty-platform/domain/likes";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getCurrentUser, getMutationUser } from "../../lib/current-user";
import type { LikeReadResult, LikeResult } from "../../lib/like-contract";
import { getLikedVersionIdsForUser, setLikeForUser } from "../../lib/likes";
import { RateLimitError } from "../../lib/rate-limit";

const intentCookie = "purupuru_like_intent";

function reportLikeFailure(error: unknown, operation: string) {
  if (error instanceof RateLimitError) return error.message;
  const missingTable = typeof error === "object" && error !== null && "code" in error && error.code === "P2021";
  console.error(missingTable
    ? `${operation}: database schema is missing a table. Verify migration 20261020120000_add_product_likes on the application's DATABASE_URL.`
    : operation, error);
  return "Likes are temporarily unavailable. Please retry.";
}

export async function readLikes(): Promise<LikeReadResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { status: "UNAUTHENTICATED", message: "Your sign-in session is not ready. Please retry loading Likes." };
    const user = await getCurrentUser();
    return { status: "SUCCESS", userId, versionIds: user ? await getLikedVersionIdsForUser(user.id) : [] };
  } catch (error) {
    return { status: "ERROR", message: reportLikeFailure(error, "Unable to load product Likes") };
  }
}

export async function setProductLike(input: unknown): Promise<LikeResult> {
  if (!isLikeInput(input)) return { status: "INVALID", message: "Choose a valid product and Like state." };
  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to save Likes." };
    const result = await setLikeForUser(user.id, input);
    if (result.status === "SUCCESS") {
      // An explicit successful heart action supersedes the same authentication request.
      const jar = await cookies();
      if (parseLikeIntent(jar.get(intentCookie)?.value)?.productVersionId === input.productVersionId) jar.delete(intentCookie);
      revalidatePath("/likes");
      revalidatePath("/collection");
    }
    return result;
  } catch (error) {
    return { status: "ERROR", message: reportLikeFailure(error, "Unable to update product Like") };
  }
}

export async function prepareLikeAuthentication(input: unknown): Promise<LikeResult> {
  if (!isLikeTarget(input)) return { status: "INVALID", message: "Choose a valid product." };
  try {
    const version = await prisma.productVersion.findFirst({
      where: { id: input.productVersionId, productFamily: { slug: input.productSlug }, variants: { some: { isActive: true } } },
      select: { id: true },
    });
    if (!version) return { status: "INVALID", message: "This product version is no longer available to like." };
    (await cookies()).set(intentCookie, JSON.stringify({ productSlug: input.productSlug,
      productVersionId: version.id, expiresAt: Date.now() + LIKE_INTENT_MAX_AGE_SECONDS * 1000 }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
      maxAge: LIKE_INTENT_MAX_AGE_SECONDS,
    });
    return { status: "SUCCESS", message: "Continue with your account." };
  } catch (error) {
    console.error("Unable to prepare Like authentication", error);
    return { status: "ERROR", message: "Please try again shortly." };
  }
}

export async function cancelPendingLike() {
  (await cookies()).delete(intentCookie);
}

export async function completePendingLike(): Promise<LikeResult | null> {
  const jar = await cookies();
  const raw = jar.get(intentCookie)?.value;
  if (!raw) return null;
  const target = parseLikeIntent(raw);
  if (!target) {
    jar.delete(intentCookie);
    return { status: "INVALID", message: "Your save request expired. Tap the heart to try again." };
  }
  const result = await setProductLike({ ...target, liked: true });
  // Keep the original expiry on transient failure; a retry must not lose the requested save.
  // Concurrent callbacks remain safe because the database insert is idempotent.
  if (result.status === "SUCCESS" || result.status === "INVALID") jar.delete(intentCookie);
  return result;
}
