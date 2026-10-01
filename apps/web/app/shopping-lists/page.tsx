import type { Metadata } from "next";
import Link from "next/link";

import { CreateShoppingList } from "../../components/create-shopping-list";
import { ShoppingListSignIn } from "../../components/shopping-list-sign-in";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getOrCreateCurrentUser } from "../../lib/current-user";
import { marketName } from "../../lib/markets";
import { getShoppingListsForUser } from "../../lib/shopping-lists";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shopping Lists" };

export default async function ShoppingListsPage() {
  if (!isClerkConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h1 className="text-2xl font-semibold">Shopping lists</h1>
          <p className="mt-2 text-sm text-slate-600">
            Authentication must be configured before private shopping lists are available.
          </p>
        </section>
      </main>
    );
  }

  const user = await getOrCreateCurrentUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <ShoppingListSignIn />
      </main>
    );
  }

  const lists = await getShoppingListsForUser(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Shopping lists</h1>
      <p className="mt-2 text-sm text-slate-600">
        Private plans for exact product sizes and the markets where you intend to shop.
      </p>

      <div className="mt-8">
        <CreateShoppingList />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your lists</h2>
        {lists.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {lists.map((list) => (
              <Link
                className="surface-card p-5 transition hover:border-slate-400 hover:shadow-float"
                href={`/shopping-lists/${list.id}`}
                key={list.id}
              >
                <h3 className="font-semibold">{list.name}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {marketName(list.targetMarket)} · {list.itemCount}{" "}
                  {list.itemCount === 1 ? "product" : "products"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
            No lists yet. Create one here, or add an exact size from a product page.
          </p>
        )}
      </section>
    </main>
  );
}
