"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  addVariantToShoppingList,
  createListWithVariant,
} from "../app/shopping-lists/actions";
import { SUPPORTED_TARGET_MARKETS } from "../lib/markets";
import type { ShoppingListSummary } from "../lib/shopping-lists";

export function AddToShoppingList({
  lists,
  productSlug,
  productVariantId,
  variantLabel,
}: {
  lists: ShoppingListSummary[];
  productSlug: string;
  productVariantId: string;
  variantLabel: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState(false);
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [newName, setNewName] = useState("");
  const [newMarket, setNewMarket] = useState("JP");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!listId && lists[0]) setListId(lists[0].id);
  }, [listId, lists]);

  useEffect(() => {
    if (!isSignedIn || !pendingAfterAuth) return;
    setPendingAfterAuth(false);
    setIsOpen(true);
    router.refresh();
  }, [isSignedIn, pendingAfterAuth, router]);

  function openSelector() {
    setMessage(null);
    if (!isSignedIn) {
      setPendingAfterAuth(true);
      void openSignIn();
      return;
    }
    setIsOpen((value) => !value);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <button
        className="rounded-md border border-slate-900 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
        disabled={!isLoaded || isPending}
        onClick={openSelector}
        type="button"
      >
        Add {variantLabel} to shopping list
      </button>

      {isOpen ? (
        <div className="mt-4 grid gap-4">
          {lists.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Existing list
                <select
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  onChange={(event) => setListId(event.target.value)}
                  value={listId}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Quantity
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                  min={1}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  type="number"
                  value={quantity}
                />
              </label>
              <button
                className="self-end rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={isPending || !listId || quantity < 1}
                onClick={() => {
                  startTransition(async () => {
                    const result = await addVariantToShoppingList({
                      shoppingListId: listId,
                      productVariantId,
                      productSlug,
                      quantity,
                    });
                    setMessage(result.message);
                    if (result.status === "SUCCESS") router.refresh();
                  });
                }}
                type="button"
              >
                Add
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No lists yet. Create one below.</p>
          )}

          <details className="rounded-lg border border-slate-200 p-3" open={lists.length === 0}>
            <summary className="cursor-pointer text-sm font-medium">Create new list</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
              <input
                aria-label="New list name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                maxLength={100}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Korea Trip"
                value={newName}
              />
              <select
                aria-label="Target market"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                onChange={(event) => setNewMarket(event.target.value)}
                value={newMarket}
              >
                {SUPPORTED_TARGET_MARKETS.map((market) => (
                  <option key={market.code} value={market.code}>{market.name}</option>
                ))}
              </select>
              <button
                className="rounded-md border border-slate-900 px-3 py-2 text-sm font-medium disabled:opacity-50"
                disabled={isPending || !newName.trim() || quantity < 1}
                onClick={() => {
                  startTransition(async () => {
                    const result = await createListWithVariant({
                      name: newName,
                      targetMarket: newMarket,
                      productVariantId,
                      productSlug,
                      quantity,
                    });
                    setMessage(result.message);
                    if (result.status === "SUCCESS") {
                      setNewName("");
                      router.refresh();
                    }
                  });
                }}
                type="button"
              >
                Create + add
              </button>
            </div>
          </details>
          <Link className="text-xs font-medium text-slate-600 underline" href="/shopping-lists">
            View all shopping lists
          </Link>
        </div>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">
        {isPending ? "Saving…" : message}
      </p>
    </section>
  );
}
