export const PROFILE_SKIN_TYPES = ["NORMAL", "DRY", "OILY", "COMBINATION"] as const;
export type ProfileSkinType = (typeof PROFILE_SKIN_TYPES)[number];

export type PublicProfileInput = {
  displayName: string;
  skinType: ProfileSkinType | null;
  sensitiveSkin: boolean;
  selectedAvatarId: string;
};

export type PublicProfileValidation =
  | { ok: true; value: PublicProfileInput }
  | { ok: false; message: string };

const controlCharacters = /[\p{Cc}\p{Cf}]/u;
const avatarIdPattern = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

export function isProfileSkinType(value: unknown): value is ProfileSkinType {
  return typeof value === "string" && PROFILE_SKIN_TYPES.includes(value as ProfileSkinType);
}

export function validatePublicProfileInput(input: unknown): PublicProfileValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, message: "The profile details were not valid." };
  }
  const fields = input as Record<string, unknown>;
  const rawDisplayName = typeof fields.displayName === "string" ? fields.displayName : "";
  const displayName = normalizeDisplayName(rawDisplayName);
  if (displayName.length < 2 || displayName.length > 40 || controlCharacters.test(rawDisplayName)) {
    return { ok: false, message: "Display name must be 2–40 characters without hidden or control characters." };
  }
  if (fields.skinType !== null && !isProfileSkinType(fields.skinType)) {
    return { ok: false, message: "Choose a supported skin type or leave it unset." };
  }
  if (typeof fields.sensitiveSkin !== "boolean") {
    return { ok: false, message: "Sensitive skin must be set explicitly." };
  }
  if (typeof fields.selectedAvatarId !== "string" || !avatarIdPattern.test(fields.selectedAvatarId)) {
    return { ok: false, message: "Choose an available PuruPuru avatar." };
  }

  return {
    ok: true,
    value: {
      displayName,
      skinType: fields.skinType,
      sensitiveSkin: fields.sensitiveSkin,
      selectedAvatarId: fields.selectedAvatarId,
    },
  };
}

export function deriveInitialDisplayName(firstName: string | null, fullName: string | null): string {
  for (const candidate of [firstName, fullName]) {
    if (!candidate) continue;
    const normalized = normalizeDisplayName(candidate).slice(0, 40).trim();
    if (normalized.length >= 2 && !controlCharacters.test(normalized)) return normalized;
  }
  return "PuruPuru User";
}
