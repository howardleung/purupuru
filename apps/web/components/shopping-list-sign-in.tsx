"use client";

import { useClerk } from "@clerk/nextjs";

export function ShoppingListSignIn() {
  const { openSignIn } = useClerk();

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Your shopping lists</h1>
      <p className="mt-2 text-sm text-slate-600">
        Shopping lists are private. Sign in to create or update yours.
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
