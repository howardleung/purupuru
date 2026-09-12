import "server-only";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@beauty-platform/database";
import type { User } from "@beauty-platform/database";

/**
 * Resolves the local profile for the active Clerk session without creating
 * records during ordinary public browsing.
 */
export async function getCurrentUser(): Promise<User | null> {
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