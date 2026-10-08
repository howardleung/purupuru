import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import { deriveInitialDisplayName } from "@beauty-platform/domain/profile";
import type { Metadata } from "next";

import { DeleteAccountDialog } from "../../components/delete-account-dialog";
import { ProfileForm } from "../../components/profile-form";
import { ProfileSignIn } from "../../components/profile-sign-in";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getOrCreateCurrentUser } from "../../lib/current-user";
import { getOrInitializeProfile } from "../../lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

function maskedEmail(value: string | null | undefined) {
  if (!value) return "Not provided";
  const separator = value.lastIndexOf("@");
  if (separator <= 0) return "Not provided";
  const local = value.slice(0, separator);
  const domain = value.slice(separator + 1);
  return `${local.slice(0, 1)}${"•".repeat(Math.min(Math.max(local.length - 1, 3), 8))}@${domain}`;
}

export default async function ProfilePage() {
  if (!isClerkConfigured) {
    return (
      <main className="page-container py-8 sm:py-12">
        <section className="surface-card p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Authentication must be configured before private profiles are available.</p>
        </section>
      </main>
    );
  }

  const clerkUser = await getClerkUser();
  if (!clerkUser) {
    return <main className="page-container py-8 sm:py-12"><ProfileSignIn /></main>;
  }

  const user = await getOrCreateCurrentUser();
  if (!user) return <main className="page-container py-8 sm:py-12"><ProfileSignIn /></main>;

  const defaultDisplayName = deriveInitialDisplayName(clerkUser.firstName, clerkUser.fullName);
  const profile = await getOrInitializeProfile(user.id, defaultDisplayName);
  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;

  return (
    <main className="page-container py-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">Your PuruPuru</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink">Profile</h1>
        <p className="mt-2 text-slate-600">Manage your public PuruPuru identity and skincare preferences.</p>
      </div>

      <div className="mt-8 grid max-w-4xl gap-6">
        {profile ? (
          <ProfileForm avatars={profile.avatars} initialValue={profile.value} />
        ) : (
          <section className="surface-card p-6">
            <h2 className="font-bold">Profile setup is temporarily unavailable</h2>
            <p className="mt-2 text-sm text-slate-600">No active PuruPuru avatars are configured yet. Your Clerk account is unchanged.</p>
          </section>
        )}

        <section aria-labelledby="account-security-title" className="surface-card p-5 sm:p-7">
          <div>
            <p className="eyebrow">Private account</p>
            <h2 className="mt-2 text-xl font-extrabold" id="account-security-title">Account &amp; security</h2>
          </div>
          <dl className="mt-6 border-t border-slate-200 pt-5">
            <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Primary email</dt><dd className="mt-1 font-semibold text-slate-800">{maskedEmail(primaryEmail)}</dd></div>
          </dl>
          <p className="mt-5 text-sm leading-6 text-slate-600">Clerk securely provides authentication and this email is not copied into PuruPuru’s profile data.</p>
          <div className="mt-7 border-t border-rose-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Danger zone</p>
            <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-xl text-sm leading-6 text-slate-600">Permanently delete your PuruPuru account and all account-owned data.</p>
              <DeleteAccountDialog />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
