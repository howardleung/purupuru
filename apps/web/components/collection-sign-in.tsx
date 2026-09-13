"use client";

import { useClerk } from "@clerk/nextjs";

export function CollectionSignIn() {
  const { openSignIn } = useClerk();

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Collection</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your collection is private. Sign in to see products you want, have tried, or own.
      </p>
      <button
        className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        onClick={() => void openSignIn()}
        type="button"
      >
        Sign in
      </button>
    </section>
  );
}
