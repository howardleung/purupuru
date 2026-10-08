"use server";

import { prisma } from "@beauty-platform/database";
import { validatePublicProfileInput } from "@beauty-platform/domain/profile";
import { revalidatePath } from "next/cache";

import type { ProfileActionState } from "../../lib/profile-contract";
import type { DeleteAccountActionState } from "../../lib/profile-contract";
import { deleteCurrentAccount } from "../../lib/account-deletion";
import { getMutationUser } from "../../lib/current-user";
import { RateLimitError } from "../../lib/rate-limit";

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const validation = validatePublicProfileInput({
    displayName: formData.get("displayName"),
    skinType: formData.get("skinType") || null,
    sensitiveSkin: formData.get("sensitiveSkin") === "on",
    selectedAvatarId: formData.get("selectedAvatarId"),
  });
  if (!validation.ok) return { status: "INVALID", message: validation.message };

  try {
    const user = await getMutationUser();
    if (!user) return { status: "UNAUTHENTICATED", message: "Sign in to update your PuruPuru profile." };

    const avatar = await prisma.profileAvatar.findFirst({
      where: { id: validation.value.selectedAvatarId, isActive: true },
      select: { id: true },
    });
    if (!avatar) return { status: "INVALID", message: "That avatar is not currently available." };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: validation.value.displayName,
        skinType: validation.value.skinType,
        sensitiveSkin: validation.value.sensitiveSkin,
        selectedAvatarId: avatar.id,
      },
    });
    revalidatePath("/profile");
    return { status: "SUCCESS", message: "Profile changes saved." };
  } catch (error) {
    if (!(error instanceof RateLimitError)) console.error("Unable to update PuruPuru profile", error);
    return {
      status: "ERROR",
      message: error instanceof RateLimitError
        ? error.message
        : "PuruPuru could not save your profile. Please try again.",
    };
  }
}

export async function deleteAccount(
  _previousState: DeleteAccountActionState,
  formData: FormData,
): Promise<DeleteAccountActionState> {
  return deleteCurrentAccount(formData.get("confirmation"));
}
