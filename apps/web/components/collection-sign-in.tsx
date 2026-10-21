"use client";

import { useClerk } from "@clerk/nextjs";

export function CollectionSignIn({ legacy = false }: { legacy?: boolean }) {
  const { openSignIn } = useClerk();

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-2xl font-semibold tracking-tight">{legacy ? "Previous collection" : "Sign in to see your Likes"}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {legacy ? "Your previous collection and purchase history are private. Sign in to view them." : "Your Likes are private and saved to your account."}
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
