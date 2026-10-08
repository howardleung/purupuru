import "server-only";

import { prisma } from "@beauty-platform/database";
import { isProfileSkinType } from "@beauty-platform/domain/profile";

import type { ProfileAvatarView, ProfileFormValue } from "./profile-contract";

export async function getOrInitializeProfile(
  userId: string,
  defaultDisplayName: string,
): Promise<{ avatars: ProfileAvatarView[]; value: ProfileFormValue } | null> {
  const [user, avatars] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profileAvatar.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, assetPath: true },
    }),
  ]);
  if (!user) return null;

  const defaultAvatarId = avatars[0]?.id ?? null;
  const displayName = user.displayName?.trim() || defaultDisplayName;
  const selectedAvatarId = user.selectedAvatarId && avatars.some((avatar) => avatar.id === user.selectedAvatarId)
    ? user.selectedAvatarId
    : defaultAvatarId;
  const needsInitialization = !user.displayName?.trim() || user.selectedAvatarId !== selectedAvatarId;

  if (needsInitialization) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(!user.displayName?.trim() ? { displayName } : {}),
        ...(user.selectedAvatarId !== selectedAvatarId ? { selectedAvatarId } : {}),
      },
    });
  }

  if (!selectedAvatarId) return null;
  return {
    avatars,
    value: {
      displayName,
      skinType: isProfileSkinType(user.skinType) ? user.skinType : null,
      sensitiveSkin: user.sensitiveSkin,
      selectedAvatarId,
    },
  };
}
