import "server-only";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@beauty-platform/database";
import type { User } from "@beauty-platform/database";
import { isClerkConfigured } from "./clerk-config";
import { enforceRateLimit } from "./request-security";
import { RateLimitError } from "./rate-limit";

/**
 * Resolves the local profile for the active Clerk session without creating
 * records during ordinary public browsing.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isClerkConfigured) return null;
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
}

/**
 * Returns the local profile for an authenticated request, creating it on the
 * first signed-in action. Clerk remains the source of credentials and identity.
 */
export async function getOrCreateCurrentUser(): Promise<User | null> {
  if (!isClerkConfigured) return null;
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: {
      clerkUserId: userId,
      beautyInterests: [],
    },
  });
}

/** Throttle authenticated writes before profile upsert, using Clerk's verified identity. */
export async function getMutationUser(): Promise<User | null> {
  if (!isClerkConfigured) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const result = await enforceRateLimit("mutation", userId);
  if (!result.allowed) throw new RateLimitError(result);
  return getOrCreateCurrentUser();
}
