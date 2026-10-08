"use client";

import { useClerk } from "@clerk/nextjs";

export function ProfileSignIn() {
  const { openSignIn } = useClerk();
  return (
    <section className="surface-card p-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-slate-600">Your PuruPuru profile is private to your signed-in account.</p>
      <button className="ui-button ui-button--primary mt-5" onClick={() => void openSignIn()} type="button">Sign in</button>
    </section>
  );
}
