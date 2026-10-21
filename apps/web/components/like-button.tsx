"use client";

import { Heart } from "lucide-react";

import { useLikes } from "./like-provider";

export function LikeButton({ productSlug, productVersionId }: { productSlug: string; productVersionId: string }) {
  const { liked, pending, ready, request } = useLikes();
  const selected = liked.has(productVersionId);
  return <button
    aria-label={selected ? "Remove Like" : "Like product"}
    aria-pressed={selected}
    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-action transition hover:bg-slate-50 disabled:opacity-50"
    disabled={!ready || pending.has(productVersionId)}
    onClick={() => request({ productSlug, productVersionId })}
    title={selected ? "Remove Like" : "Like product"}
    type="button"
  ><Heart aria-hidden className={`h-5 w-5 ${selected ? "fill-current" : ""}`} /></button>;
}

export function RetryLikesButton() {
  const { retry } = useLikes();
  return <button className="ui-button ui-button--secondary mt-4" onClick={retry} type="button">Retry loading Likes</button>;
}
