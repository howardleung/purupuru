import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShoppingListDetails } from "../../../components/shopping-list-details";
import { ShoppingListSignIn } from "../../../components/shopping-list-sign-in";
import { isClerkConfigured } from "../../../lib/clerk-config";
import { getOrCreateCurrentUser } from "../../../lib/current-user";
import { getShoppingListForUser } from "../../../lib/shopping-lists";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Shopping list" };

export default async function ShoppingListPage({ params }: PageProps) {
  if (!isClerkConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
          Authentication must be configured before private shopping lists are available.
        </p>
      </main>
    );
  }

  const user = await getOrCreateCurrentUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <ShoppingListSignIn />
      </main>
    );
  }

  const { id } = await params;
  const list = await getShoppingListForUser(user.id, id);
  if (!list) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ShoppingListDetails list={list} />
    </main>
  );
}
