"use client";

import type { CollectionRelationshipState } from "@beauty-platform/domain/collection";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ShoppingListSummary } from "../lib/shopping-lists";
import { trapTabKey } from "../lib/modal-focus";
import { AddToShoppingList } from "./add-to-shopping-list";
import { CollectionActions } from "./collection-actions";

export function PersonalActionsModal({
  initialState,
  lists,
  productSlug,
  productVersionId,
  productVariantId,
  variantLabel,
}: {
  initialState: CollectionRelationshipState;
  lists: ShoppingListSummary[];
  productSlug: string;
  productVersionId: string;
  productVariantId: string;
  variantLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
      trapTabKey(event, dialogRef.current);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Save or plan this product"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-action text-white shadow-soft transition hover:bg-slate-700"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Plus aria-hidden className="h-5 w-5" />
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section aria-labelledby="personal-actions-title" aria-modal="true" className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-float sm:max-w-2xl sm:rounded-2xl sm:p-6" ref={dialogRef} role="dialog" tabIndex={-1}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected size · {variantLabel}</p><h2 className="mt-1 text-xl font-semibold" id="personal-actions-title">Save or plan</h2><p className="mt-1 text-sm text-slate-600">Relationship and rating apply to this formulation. Lists and purchases keep the exact size.</p></div>
              <button aria-label="Close save or plan dialog" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-slate-100" onClick={close} ref={closeRef} type="button"><X aria-hidden className="h-5 w-5" /></button>
            </div>
            <div className="mt-6">
              <CollectionActions initialState={initialState} productSlug={productSlug} productVariantId={productVariantId} productVersionId={productVersionId} variantLabel={variantLabel} />
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <AddToShoppingList lists={lists} productSlug={productSlug} productVariantId={productVariantId} variantLabel={variantLabel} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
