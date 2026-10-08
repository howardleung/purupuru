import type { ProfileSkinType } from "@beauty-platform/domain/profile";

export type ProfileAvatarView = {
  id: string;
  name: string;
  assetPath: string;
};

export type ProfileFormValue = {
  displayName: string;
  skinType: ProfileSkinType | null;
  sensitiveSkin: boolean;
  selectedAvatarId: string;
};

export type ProfileActionState = {
  status: "IDLE" | "SUCCESS" | "INVALID" | "UNAUTHENTICATED" | "ERROR";
  message: string;
};

export const initialProfileActionState: ProfileActionState = { status: "IDLE", message: "" };

export type DeleteAccountActionState = {
  status: "IDLE" | "SUCCESS" | "INVALID" | "UNAUTHENTICATED" | "ERROR" | "RETRY_REQUIRED";
  message: string;
};

export const initialDeleteAccountActionState: DeleteAccountActionState = { status: "IDLE", message: "" };
