import type { Metadata } from "next";
import Link from "next/link";

import { CollectionBrowser } from "../../components/collection-browser";
import { CollectionSignIn } from "../../components/collection-sign-in";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getOrCreateCurrentUser } from "../../lib/current-user";
import { getMyCollectionForUser } from "../../lib/my-collection";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Collection" };

export default async function CollectionPage() {
  if (!isClerkConfigured) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h1 className="text-2xl font-semibold">My Collection</h1>
          <p className="mt-2 text-sm text-slate-600">
            Authentication must be configured before private collections are available.
          </p>
        </section>
      </main>
    );
  }

  const user = await getOrCreateCurrentUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <CollectionSignIn />
      </main>
    );
  }

  const items = await getMyCollectionForUser(user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My Collection</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your private, version-specific history of products you want, have tried, or own.
      </p>

      {items.length > 0 ? (
        <CollectionBrowser items={items} />
      ) : (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h2 className="font-semibold">Your collection is empty</h2>
          <p className="mt-2 text-sm text-slate-600">
            Browse the catalogue and mark a product Want, Tried, Owned, Holy Grail, or rate it.
          </p>
          <Link className="mt-4 inline-block text-sm font-medium underline" href="/catalogue">
            Browse catalogue
          </Link>
        </section>
      )}
    </main>
  );
}
