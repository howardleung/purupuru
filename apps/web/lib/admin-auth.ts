import "server-only";

import { auth } from "@clerk/nextjs/server";

import { isClerkConfigured } from "./clerk-config";
import { isConfiguredAdmin } from "./admin-config";
import { enforceRateLimit } from "./request-security";
import { RateLimitError } from "./rate-limit";

export type AdminAccess =
  | { status: "AUTHORIZED"; clerkUserId: string }
  | { status: "UNAUTHENTICATED" }
  | { status: "FORBIDDEN" };

export async function getAdminAccess(options: { mutation?: boolean } = {}): Promise<AdminAccess> {
  if (!isClerkConfigured) return { status: "UNAUTHENTICATED" };
  const { userId } = await auth();
  if (!userId) return { status: "UNAUTHENTICATED" };
  if (!isConfiguredAdmin(userId, process.env.PURUPURU_ADMIN_CLERK_USER_IDS)) {
    return { status: "FORBIDDEN" };
  }
  if (options.mutation) {
    const result = await enforceRateLimit("mutation", userId);
    if (!result.allowed) throw new RateLimitError(result);
  }
  return { status: "AUTHORIZED", clerkUserId: userId };
}
