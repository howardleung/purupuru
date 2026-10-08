export const REVIEW_BODY_MAX_LENGTH = 3000;

export type ReviewInput = { rating: unknown; body: unknown; productVariantId: unknown };
export type ValidReviewInput = { rating: number; body: string | null; productVariantId: string };

export function validateReviewInput(input: ReviewInput):
  { ok: true; value: ValidReviewInput } | { ok: false; message: string } {
  if (typeof input.rating !== "number" || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, message: "Choose a whole-star rating from 1 to 5." };
  }
  if (typeof input.productVariantId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.productVariantId)) {
    return { ok: false, message: "Choose the size you used." };
  }
  if (input.body !== null && input.body !== undefined && typeof input.body !== "string") {
    return { ok: false, message: "Review text is invalid." };
  }
  const rawBody = typeof input.body === "string" ? input.body : "";
  const body = rawBody.trim().replace(/\r\n?/g, "\n");
  if (rawBody.length > 0 && body.length === 0) return { ok: false, message: "Review text cannot contain only whitespace." };
  if (body.length > REVIEW_BODY_MAX_LENGTH) return { ok: false, message: `Review text must be ${REVIEW_BODY_MAX_LENGTH} characters or fewer.` };
  if (/[\p{Cf}\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(body)) return { ok: false, message: "Review text contains unsupported characters." };
  return { ok: true, value: { rating: input.rating, body: body || null, productVariantId: input.productVariantId } };
}

export function buildReviewSummary(ratings: readonly number[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const rating of ratings) if (Number.isInteger(rating) && rating >= 1 && rating <= 5) distribution[rating as keyof typeof distribution] += 1;
  const count = ratings.length;
  return { count, average: count ? ratings.reduce((sum, rating) => sum + rating, 0) / count : null, distribution };
}
