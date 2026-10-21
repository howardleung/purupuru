export type LikeTarget = { productSlug: string; productVersionId: string };
export type LikeInput = LikeTarget & { liked: boolean };

export function isLikeTarget(value: unknown): value is LikeTarget {
  if (typeof value !== "object" || value === null) return false;
  const target = value as Record<string, unknown>;
  return typeof target.productSlug === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(target.productSlug) &&
    typeof target.productVersionId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(target.productVersionId);
}

export function isLikeInput(value: unknown): value is LikeInput {
  return isLikeTarget(value) && "liked" in value && typeof value.liked === "boolean";
}

export const LIKE_INTENT_MAX_AGE_SECONDS = 600;

/** This is a short-lived authentication request, never a guest collection. */
export function parseLikeIntent(value: string | undefined, now = Date.now()): LikeTarget | null {
  if (!value) return null;
  try {
    const intent: unknown = JSON.parse(value);
    if (!isLikeTarget(intent) || !("expiresAt" in intent) ||
      typeof intent.expiresAt !== "number" || !Number.isFinite(intent.expiresAt) ||
      intent.expiresAt <= now || intent.expiresAt > now + LIKE_INTENT_MAX_AGE_SECONDS * 1000) return null;
    return { productSlug: intent.productSlug, productVersionId: intent.productVersionId };
  } catch {
    return null;
  }
}
