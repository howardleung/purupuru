"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { REVIEW_BODY_MAX_LENGTH } from "@beauty-platform/domain/reviews";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { deleteProductReview, saveProductReview } from "../app/products/[slug]/review-actions";
import type { ReviewCardView } from "../lib/reviews";

type VariantOption = { id: string; label: string; versionLabel: string | null };

export function ReviewEditor({
  currentReview,
  productFamilyId,
  productSlug,
  profileContext,
  selectedVariantId,
  variants,
}: {
  currentReview: ReviewCardView | null;
  productFamilyId: string;
  productSlug: string;
  profileContext: string | null;
  selectedVariantId: string;
  variants: VariantOption[];
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(currentReview?.rating ?? 0);
  const [body, setBody] = useState(currentReview?.body ?? "");
  const [variantId, setVariantId] = useState(
    currentReview?.variantId ?? (variants.some((variant) => variant.id === selectedVariantId) ? selectedVariantId : variants.length === 1 ? variants[0]!.id : ""),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRating(currentReview?.rating ?? 0);
    setBody(currentReview?.body ?? "");
    setVariantId(currentReview?.variantId ?? (variants.some((variant) => variant.id === selectedVariantId) ? selectedVariantId : variants.length === 1 ? variants[0]!.id : ""));
  }, [currentReview, selectedVariantId, variants]);

  if (!isLoaded) return <p className="text-sm text-slate-500">Loading review options…</p>;
  if (!isSignedIn) {
    return (
      <button className="ui-button ui-button--primary" onClick={() => void openSignIn()} type="button">
        Sign in to write a review
      </button>
    );
  }

  if (!isOpen) {
    return (
      <div>
        <button className="ui-button ui-button--primary" onClick={() => { setMessage(null); setIsOpen(true); }} type="button">
          {currentReview ? "Edit your review" : "Write a review"}
        </button>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm text-slate-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="surface-card mt-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{currentReview ? "Edit your review" : "Write a review"}</h3>
          <p className="mt-1 text-sm text-slate-600">Your rating and size are required. Review text is optional.</p>
        </div>
        <button className="ui-button ui-button--ghost" onClick={() => { setIsOpen(false); setConfirmDelete(false); }} type="button">Close</button>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Your rating</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Whole-star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              className={`min-h-11 min-w-11 rounded-lg text-2xl transition ${value <= rating ? "text-amber-500" : "text-slate-300"} hover:bg-slate-50`}
              key={value}
              onClick={() => setRating(value)}
              role="radio"
              type="button"
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 grid gap-2 text-sm font-bold">
        Which size did you use?
        <select className="ui-input font-normal" onChange={(event) => setVariantId(event.target.value)} value={variantId}>
          <option value="" disabled>Choose a size</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.label}{variant.versionLabel ? ` · ${variant.versionLabel}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-5 grid gap-2 text-sm font-bold">
        Review <span className="font-normal text-slate-500">(optional)</span>
        <textarea
          className="ui-input min-h-32 resize-y font-normal"
          maxLength={REVIEW_BODY_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What was your experience with this product?"
          value={body}
        />
        <span className="text-right text-xs font-normal text-slate-500">{body.length.toLocaleString("en-CA")} / {REVIEW_BODY_MAX_LENGTH.toLocaleString("en-CA")}</span>
      </label>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <p><span className="font-semibold text-slate-700">Review context:</span> {profileContext ?? "No skin details saved"}</p>
        <Link className="mt-1 inline-block text-xs font-bold underline underline-offset-4" href="/profile">Update skin profile</Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="ui-button ui-button--primary"
          disabled={isPending || rating < 1 || !variantId}
          onClick={() => startTransition(async () => {
            const result = await saveProductReview({ productFamilyId, productSlug, productVariantId: variantId, rating, body });
            setMessage(result.message);
            if (result.status === "SUCCESS") {
              setIsOpen(false);
              router.refresh();
            }
          })}
          type="button"
        >
          {isPending ? "Saving…" : "Save review"}
        </button>
        {currentReview ? (
          <button className="ui-button ui-button--secondary text-red-700" disabled={isPending} onClick={() => setConfirmDelete(true)} type="button">
            Delete review
          </button>
        ) : null}
      </div>

      {confirmDelete ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alertdialog" aria-labelledby="delete-review-title">
          <p className="font-bold text-red-900" id="delete-review-title">Delete your review?</p>
          <p className="mt-1 text-sm text-red-800">This removes your rating and written review from this product.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="ui-button bg-red-700 text-white hover:bg-red-800"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                const result = await deleteProductReview({ productFamilyId, productSlug, confirmed: true });
                setMessage(result.message);
                if (result.status === "SUCCESS") {
                  setConfirmDelete(false);
                  setIsOpen(false);
                  router.refresh();
                }
              })}
              type="button"
            >
              Confirm delete
            </button>
            <button className="ui-button ui-button--secondary" disabled={isPending} onClick={() => setConfirmDelete(false)} type="button">Cancel</button>
          </div>
        </div>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">{message}</p>
    </div>
  );
}
