"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import type {
  CollectionConfirmation,
  CollectionMutationIntent,
  CollectionRelationshipState,
} from "@beauty-platform/domain/collection";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { updateProductCollection } from "../app/products/[slug]/collection-actions";
import type {
  ProductCollectionActionInput,
  ProductCollectionActionResult,
} from "../lib/collection-contract";
import { HalfStarRating } from "./half-star-rating";

type ConfirmationRequest = {
  intent: CollectionMutationIntent;
  message: string;
  confirmLabel: string;
};

type CollectionActionsProps = {
  initialState: CollectionRelationshipState;
  productSlug: string;
  productVersionId: string;
  productVariantId: string;
  variantLabel: string;
};

function confirmedIntent(
  intent: CollectionMutationIntent,
  confirmation: CollectionConfirmation,
): CollectionMutationIntent {
  if (confirmation === "MARK_TRIED_WITH_WOULD_REPURCHASE") {
    return { type: "ADD_WOULD_REPURCHASE", confirmedTried: true };
  }
  if (confirmation === "MARK_TRIED_WITH_RATING" && intent.type === "SET_RATING") {
    return { ...intent, confirmedTried: true };
  }
  return { type: "ADD_ANOTHER_PURCHASE", confirmed: true };
}

function confirmationRequest(
  intent: CollectionMutationIntent,
  state: CollectionRelationshipState,
  variantLabel: string,
): ConfirmationRequest | null {
  if (
    intent.type === "ADD_WOULD_REPURCHASE" &&
    !intent.confirmedTried &&
    !state.tried &&
    !state.wouldRepurchase
  ) {
    return {
      intent: { ...intent, confirmedTried: true },
      message: "Would Repurchase implies prior experience. Mark this version Tried too?",
      confirmLabel: "Mark Tried + Would Repurchase",
    };
  }

  if (intent.type === "SET_RATING" && !intent.confirmedTried && !state.tried) {
    return {
      intent: { ...intent, confirmedTried: true },
      message: `Save a ${intent.ratingHalfSteps / 2} star rating and mark this version Tried?`,
      confirmLabel: "Mark Tried + Save rating",
    };
  }

  if (intent.type === "ADD_ANOTHER_PURCHASE" && !intent.confirmed) {
    return {
      intent: { ...intent, confirmed: true },
      message: `Add another ${variantLabel} purchase record? Purchase details can be added later.`,
      confirmLabel: "Confirm another purchase",
    };
  }

  return null;
}

function actionClass(active: boolean) {
  return (
    "w-full rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto " +
    (active
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
  );
}

export function CollectionActions({
  initialState,
  productSlug,
  productVersionId,
  productVariantId,
  variantLabel,
}: CollectionActionsProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<CollectionMutationIntent | null>(null);
  const [isPending, startTransition] = useTransition();
  const scopeKey = `${productVersionId}:${productVariantId}`;
  const previousScope = useRef(scopeKey);
  const initialStateRef = useRef(initialState);

  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);

  useEffect(() => {
    if (previousScope.current !== scopeKey) {
      setState(initialStateRef.current);
      setMessage(null);
      setConfirmation(null);
      setPendingAfterAuth(null);
      previousScope.current = scopeKey;
    }
  }, [scopeKey]);

  const execute = useCallback(
    (intent: CollectionMutationIntent) => {
      setConfirmation(null);
      startTransition(async () => {
        const input: ProductCollectionActionInput = {
          productSlug,
          productVersionId,
          productVariantId,
          intent,
        };
        const result: ProductCollectionActionResult = await updateProductCollection(input);

        if (result.state) setState(result.state);
        setMessage(result.message);

        if (result.status === "UNAUTHENTICATED") {
          setPendingAfterAuth(intent);
          void openSignIn();
          return;
        }

        if (result.status === "CONFIRMATION_REQUIRED" && result.confirmation) {
          const confirmed = confirmedIntent(intent, result.confirmation);
          setConfirmation(
            confirmationRequest(confirmed, result.state ?? state, variantLabel) ?? {
              intent: confirmed,
              message: result.message,
              confirmLabel: "Confirm",
            },
          );
        }
      });
    },
    [openSignIn, productSlug, productVariantId, productVersionId, state, variantLabel],
  );

  const request = useCallback(
    (intent: CollectionMutationIntent) => {
      setMessage(null);

      if (!isSignedIn) {
        setPendingAfterAuth(intent);
        void openSignIn();
        return;
      }

      const needed = confirmationRequest(intent, state, variantLabel);
      if (needed) {
        setConfirmation(needed);
        return;
      }

      execute(intent);
    },
    [execute, isSignedIn, openSignIn, state, variantLabel],
  );

  useEffect(() => {
    if (!isSignedIn || !pendingAfterAuth) return;

    const intent = pendingAfterAuth;
    setPendingAfterAuth(null);
    const needed = confirmationRequest(intent, state, variantLabel);
    if (needed) setConfirmation(needed);
    else execute(intent);
  }, [execute, isSignedIn, pendingAfterAuth, state, variantLabel]);

  const stateLabels = [
    state.wants ? "Want" : null,
    state.tried ? "Tried" : null,
    state.purchaseCount > 0
      ? `Owned · ${state.purchaseCount} ${state.purchaseCount === 1 ? "purchase" : "purchases"}`
      : null,
    state.holyGrail ? "Holy Grail" : null,
    state.wouldRepurchase ? "Would Repurchase" : null,
    state.ratingHalfSteps !== null ? `${state.ratingHalfSteps / 2} stars` : null,
  ].filter(Boolean);
  const disabled = !isLoaded || isPending;

  return (
    <div aria-labelledby="collection-actions-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold" id="collection-actions-title">Your collection</h3>
          <p className="mt-1 text-xs text-slate-500">
            {stateLabels.length > 0 ? stateLabels.join(" · ") : "No personal state saved for this version."}
          </p>
        </div>
        {isSignedIn ? (
          <Link className="text-xs font-medium text-slate-600 underline underline-offset-4" href="/collection">
            Open My Collection
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Relationship</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            aria-pressed={state.wants}
            className={actionClass(state.wants)}
            disabled={disabled || (!state.wants && state.purchaseCount > 0)}
            onClick={() => request({ type: state.wants ? "REMOVE_WANT" : "ADD_WANT" })}
            title={state.purchaseCount > 0 ? "Want is for products not yet owned." : undefined}
            type="button"
          >
            {state.wants ? "Remove Want" : "Want"}
          </button>
          <button
            aria-pressed={state.tried}
            className={actionClass(state.tried)}
            disabled={disabled}
            onClick={() => request({ type: state.tried ? "REMOVE_TRIED" : "ADD_TRIED" })}
            title={state.tried ? "Removing Tried also clears Would Repurchase and your rating." : undefined}
            type="button"
          >
            {state.tried ? "Remove Tried" : "Mark Tried"}
          </button>
          {state.purchaseCount === 0 ? (
            <button
              className={actionClass(false)}
              disabled={disabled}
              onClick={() => request({ type: "ADD_OWNED" })}
              type="button"
            >
              Mark Owned
            </button>
          ) : (
            <>
              <button
                aria-pressed={true}
                className={actionClass(true)}
                disabled={disabled}
                onClick={() => request({ type: "REMOVE_OWNED" })}
                title="Removes one standalone manual purchase. Shopping-list purchases remain part of your history."
                type="button"
              >
                Remove ownership
              </button>
              <button
                className={actionClass(false)}
                disabled={disabled}
                onClick={() => request({ type: "ADD_ANOTHER_PURCHASE" })}
                type="button"
              >
                Add another purchase
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tags</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            aria-pressed={state.holyGrail}
            className={actionClass(state.holyGrail)}
            disabled={disabled}
            onClick={() => request({ type: state.holyGrail ? "REMOVE_HOLY_GRAIL" : "ADD_HOLY_GRAIL" })}
            type="button"
          >
            {state.holyGrail ? "Remove Holy Grail" : "Mark Holy Grail"}
          </button>
          <button
            aria-pressed={state.wouldRepurchase}
            className={actionClass(state.wouldRepurchase)}
            disabled={disabled}
            onClick={() => request({ type: state.wouldRepurchase ? "REMOVE_WOULD_REPURCHASE" : "ADD_WOULD_REPURCHASE" })}
            type="button"
          >
            {state.wouldRepurchase ? "Remove Would Repurchase" : "Mark Would Repurchase"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <HalfStarRating
          disabled={disabled}
          onCommit={(ratingHalfSteps) => request({ type: "SET_RATING", ratingHalfSteps })}
          value={state.ratingHalfSteps}
        />
      </div>

      {!isSignedIn ? (
        <p className="mt-3 text-xs text-slate-500">
          Choose an action to sign in. Public browsing remains available without an account.
        </p>
      ) : null}

      {confirmation ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p>{confirmation.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-md bg-amber-950 px-3 py-2 text-xs font-medium text-white"
              disabled={isPending}
              onClick={() => execute(confirmation.intent)}
              type="button"
            >
              {confirmation.confirmLabel}
            </button>
            <button
              className="rounded-md border border-amber-400 px-3 py-2 text-xs font-medium"
              disabled={isPending}
              onClick={() => setConfirmation(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">
        {isPending ? "Saving…" : message}
      </p>
    </div>
  );
}
