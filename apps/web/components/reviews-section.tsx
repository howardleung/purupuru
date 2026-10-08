import Image from "next/image";

import type { ProductReviewData } from "../lib/reviews";
import { ReviewEditor } from "./review-editor";

type VariantOption = { id: string; label: string; versionLabel: string | null };

function starText(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function skinContext(skinType: string | null, sensitive: boolean) {
  const parts: string[] = [];
  if (skinType) parts.push(`${skinType.charAt(0)}${skinType.slice(1).toLowerCase()} skin`);
  if (sensitive) parts.push("Sensitive");
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function ProductRatingSummary({ data }: { data: ProductReviewData["summary"] }) {
  return (
    <a className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4" href="#reviews">
      {data.count === 0 ? "No ratings yet" : (
        <>
          <span aria-hidden="true" className="tracking-wide text-amber-500">★</span>
          <span>{data.average!.toFixed(1)} · {data.count.toLocaleString("en-CA")} {data.count === 1 ? "review" : "reviews"}</span>
        </>
      )}
    </a>
  );
}

export function ReviewsSection({
  authEnabled,
  data,
  productFamilyId,
  productSlug,
  profileContext,
  selectedVariantId,
  showVersion,
  variants,
}: {
  authEnabled: boolean;
  data: ProductReviewData;
  productFamilyId: string;
  productSlug: string;
  profileContext: string | null;
  selectedVariantId: string;
  showVersion: boolean;
  variants: VariantOption[];
}) {
  return (
    <section className="mt-10 scroll-mt-24 border-t border-slate-200 pt-8 sm:mt-12" id="reviews" aria-labelledby="reviews-title">
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div>
          <h2 className="text-xl font-semibold" id="reviews-title">Reviews</h2>
          {data.summary.count > 0 ? (
            <div className="mt-4">
              <p className="text-3xl font-extrabold">{data.summary.average!.toFixed(1)} <span className="text-xl text-amber-500">★</span></p>
              <p className="mt-1 text-sm text-slate-600">{data.summary.count.toLocaleString("en-CA")} {data.summary.count === 1 ? "rating" : "ratings"}</p>
              <div className="mt-5 space-y-2" aria-label="Rating distribution">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = data.summary.distribution[rating as 1 | 2 | 3 | 4 | 5];
                  const percent = Math.round((count / data.summary.count) * 100);
                  return (
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs" key={rating}>
                      <span>{rating} ★</span>
                      <progress aria-label={`${rating} stars: ${count} ratings, ${percent}%`} className="h-2 w-full accent-amber-500" max={100} value={percent} />
                      <span className="text-right text-slate-500">{count} · {percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No ratings yet. Be the first to share your experience.</p>
          )}
        </div>

        <div>
          {authEnabled ? (
            <ReviewEditor
              currentReview={data.currentReview}
              productFamilyId={productFamilyId}
              productSlug={productSlug}
              profileContext={profileContext}
              selectedVariantId={selectedVariantId}
              variants={variants}
            />
          ) : (
            <p className="text-sm text-slate-600">Sign-in is not configured in this environment.</p>
          )}

          <div className="mt-7 divide-y divide-slate-200 border-t border-slate-200">
            {data.reviews.map((review) => {
              const context = skinContext(review.skinTypeSnapshot, review.sensitiveSkinSnapshot);
              return (
                <article className="py-5" key={review.id}>
                  <div className="flex gap-3">
                    {review.avatar ? (
                      <Image alt={`${review.displayName}'s PuruPuru avatar`} className="h-11 w-11 shrink-0 rounded-full border border-slate-200 bg-white" height={44} src={review.avatar.assetPath} width={44} />
                    ) : (
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">P</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div>
                          <p className="font-bold">{review.displayName}</p>
                          {context ? <p className="mt-0.5 text-xs text-slate-500">{context}</p> : null}
                        </div>
                        <div className="text-right">
                          <p aria-label={`${review.rating} out of 5 stars`} className="tracking-wide text-amber-500">{starText(review.rating)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatReviewDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        Used: {review.variantLabel}
                        {showVersion ? ` · Formula: ${review.versionLabel}` : ""}
                      </p>
                      {review.body ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.body}</p> : null}
                    </div>
                  </div>
                </article>
              );
            })}
            {data.reviews.length === 0 ? <p className="py-6 text-sm text-slate-500">Written reviews will appear here.</p> : null}
          </div>
          {data.hasMore ? <p className="mt-3 text-xs text-slate-500">Showing the newest 20 reviews.</p> : null}
        </div>
      </div>
    </section>
  );
}
