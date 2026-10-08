import "server-only";

import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import { deriveInitialDisplayName } from "@beauty-platform/domain/profile";

import { getOrCreateCurrentUser } from "./current-user";
import { getOrInitializeProfile } from "./profile";

export type AccountIdentity = {
  displayName: string;
  avatar: {
    name: string;
    assetPath: string;
  } | null;
};

export async function getCurrentAccountIdentity(): Promise<AccountIdentity | null> {
  const user = await getOrCreateCurrentUser();
  if (!user) return null;

  const savedDisplayName = user.displayName?.trim();
  const clerkUser = savedDisplayName ? null : await getClerkUser();
  const defaultDisplayName = savedDisplayName
    || deriveInitialDisplayName(clerkUser?.firstName ?? null, clerkUser?.fullName ?? null);
  const profile = await getOrInitializeProfile(user.id, defaultDisplayName);
  if (!profile) {
    return {
      displayName: user.displayName?.trim() || defaultDisplayName,
      avatar: null,
    };
  }

  const avatar = profile.avatars.find((item) => item.id === profile.value.selectedAvatarId) ?? null;
  return {
    displayName: profile.value.displayName,
    avatar: avatar ? { name: avatar.name, assetPath: avatar.assetPath } : null,
  };
}
