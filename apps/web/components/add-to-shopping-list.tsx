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
  const [savedListId, setSavedListId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!listId && lists[0]) setListId(lists[0].id);
  }, [listId, lists]);

  useEffect(() => {
    setIsOpen(false);
    setMessage(null);
    setSavedListId(null);
  }, [productVariantId]);

  useEffect(() => {
    if (!isSignedIn || !pendingAfterAuth) return;
    setPendingAfterAuth(false);
    setIsOpen(true);
    router.refresh();
  }, [isSignedIn, pendingAfterAuth, router]);

  function openSelector() {
    setMessage(null);
    setSavedListId(null);
    if (!isSignedIn) {
      setPendingAfterAuth(true);
      void openSignIn();
      return;
    }
    setIsOpen((value) => !value);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Shopping list</h3>
          <p className="mt-1 text-xs text-slate-500">
            Plan the exact {variantLabel} variant for a destination market.
          </p>
        </div>
        <button
          aria-expanded={isOpen}
          className="ui-button ui-button--secondary w-full sm:w-auto"
          disabled={!isLoaded || isPending}
          onClick={openSelector}
          type="button"
        >
          {isOpen ? "Close list options" : `Add ${variantLabel} to a list`}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-4">
          {lists.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
              <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-600">
                Existing list
                <select
                  className="ui-input font-normal"
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
                  className="ui-input font-normal"
                  min={1}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  type="number"
                  value={quantity}
                />
              </label>
              <button
                className="ui-button ui-button--primary self-end"
                disabled={isPending || !listId || !Number.isInteger(quantity) || quantity < 1}
                onClick={() => {
                  startTransition(async () => {
                    const result = await addVariantToShoppingList({
                      shoppingListId: listId,
                      productVariantId,
                      productSlug,
                      quantity,
                    });
                    setMessage(result.message);
                    if (result.status === "SUCCESS") {
                      setSavedListId(listId);
                      router.refresh();
                    }
                  });
                }}
                type="button"
              >
                Add to list
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No lists yet. Create one below.</p>
          )}

          <details className="rounded-lg border border-slate-200 p-3" open={lists.length === 0}>
            <summary className="cursor-pointer text-sm font-medium">Create a new list</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
              <input
                aria-label="New list name"
                className="ui-input"
                maxLength={100}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Korea Trip"
                value={newName}
              />
              <select
                aria-label="Target market"
                className="ui-input"
                onChange={(event) => setNewMarket(event.target.value)}
                value={newMarket}
              >
                {SUPPORTED_TARGET_MARKETS.map((market) => (
                  <option key={market.code} value={market.code}>{market.name}</option>
                ))}
              </select>
              <button
                className="ui-button ui-button--secondary"
                disabled={isPending || !newName.trim() || !Number.isInteger(quantity) || quantity < 1}
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
                      setSavedListId(result.listId ?? null);
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

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
            {savedListId ? (
              <Link className="text-slate-950 underline underline-offset-4" href={`/shopping-lists/${savedListId}`}>
                Open updated shopping list
              </Link>
            ) : null}
            <Link className="text-slate-600 underline underline-offset-4" href="/shopping-lists">
              View all shopping lists
            </Link>
          </div>
        </div>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">
        {isPending ? "Saving…" : message}
      </p>
    </div>
  );
}
