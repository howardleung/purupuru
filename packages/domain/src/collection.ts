export type CollectionRelationshipState = {
  wants: boolean;
  tried: boolean;
  holyGrail: boolean;
  wouldRepurchase: boolean;
  purchaseCount: number;
  ratingHalfSteps: number | null;
};

export type CollectionMutationIntent =
  | { type: "ADD_WANT" }
  | { type: "REMOVE_WANT" }
  | { type: "ADD_TRIED" }
  | { type: "REMOVE_TRIED" }
  | { type: "ADD_HOLY_GRAIL" }
  | { type: "REMOVE_HOLY_GRAIL" }
  | { type: "ADD_WOULD_REPURCHASE"; confirmedTried?: boolean }
  | { type: "REMOVE_WOULD_REPURCHASE" }
  | { type: "SET_RATING"; ratingHalfSteps: number; confirmedTried?: boolean }
  | { type: "ADD_OWNED" }
  | { type: "REMOVE_OWNED" }
  | { type: "ADD_ANOTHER_PURCHASE"; confirmed?: boolean };

export type CollectionConfirmation =
  | "MARK_TRIED_WITH_WOULD_REPURCHASE"
  | "MARK_TRIED_WITH_RATING"
  | "ADD_ANOTHER_PURCHASE";

export type CollectionMutationPlan = {
  status: "APPLIED" | "CONFIRMATION_REQUIRED" | "ALREADY_OWNED" | "INVALID";
  state: CollectionRelationshipState;
  purchaseDelta: -1 | 0 | 1;
  message: string;
  confirmation?: CollectionConfirmation;
};

export function createEmptyCollectionState(): CollectionRelationshipState {
  return {
    wants: false,
    tried: false,
    holyGrail: false,
    wouldRepurchase: false,
    purchaseCount: 0,
    ratingHalfSteps: null,
  };
}

export function isValidRatingHalfSteps(value: number): boolean {
  return Number.isInteger(value) && value >= 2 && value <= 10;
}

function applied(
  state: CollectionRelationshipState,
  message: string,
  purchaseDelta: -1 | 0 | 1 = 0,
): CollectionMutationPlan {
  return { status: "APPLIED", state, purchaseDelta, message };
}

function unchanged(
  status: CollectionMutationPlan["status"],
  state: CollectionRelationshipState,
  message: string,
  confirmation?: CollectionConfirmation,
): CollectionMutationPlan {
  return { status, state: { ...state }, purchaseDelta: 0, message, confirmation };
}

export function planCollectionMutation(
  current: CollectionRelationshipState,
  intent: CollectionMutationIntent,
): CollectionMutationPlan {
  const state = { ...current };

  switch (intent.type) {
    case "ADD_WANT":
      if (state.purchaseCount > 0) {
        return unchanged("INVALID", state, "Owned products cannot be added to the first-time Want list.");
      }
      if (state.wants) return applied(state, "Already marked Want.");
      state.wants = true;
      return applied(state, "Marked Want.");

    case "REMOVE_WANT":
      if (!state.wants) return applied(state, "Want was not selected.");
      state.wants = false;
      return applied(state, "Removed Want.");

    case "ADD_TRIED":
      if (state.tried) return applied(state, "Already marked Tried.");
      state.tried = true;
      return applied(state, "Marked Tried.");

    case "REMOVE_TRIED":
      if (!state.tried) return applied(state, "Tried was not selected.");
      state.tried = false;
      state.wouldRepurchase = false;
      state.ratingHalfSteps = null;
      return applied(state, "Removed Tried and cleared dependent personal feedback.");

    case "ADD_HOLY_GRAIL":
      if (state.holyGrail) return applied(state, "Already marked Holy Grail.");
      state.holyGrail = true;
      return applied(state, "Marked Holy Grail.");

    case "REMOVE_HOLY_GRAIL":
      if (!state.holyGrail) return applied(state, "Holy Grail was not selected.");
      state.holyGrail = false;
      return applied(state, "Removed Holy Grail.");

    case "ADD_WOULD_REPURCHASE":
      if (state.wouldRepurchase) return applied(state, "Already marked Would Repurchase.");
      if (!state.tried && !intent.confirmedTried) {
        return unchanged(
          "CONFIRMATION_REQUIRED",
          state,
          "Would Repurchase requires Tried.",
          "MARK_TRIED_WITH_WOULD_REPURCHASE",
        );
      }
      state.tried = true;
      state.wouldRepurchase = true;
      return applied(state, "Marked Tried and Would Repurchase.");

    case "REMOVE_WOULD_REPURCHASE":
      if (!state.wouldRepurchase) return applied(state, "Would Repurchase was not selected.");
      state.wouldRepurchase = false;
      return applied(state, "Removed Would Repurchase.");

    case "SET_RATING":
      if (!isValidRatingHalfSteps(intent.ratingHalfSteps)) {
        return unchanged("INVALID", state, "Rating must be from 1.0 to 5.0 in 0.5-star steps.");
      }
      if (!state.tried && !intent.confirmedTried) {
        return unchanged(
          "CONFIRMATION_REQUIRED",
          state,
          "A personal rating requires Tried.",
          "MARK_TRIED_WITH_RATING",
        );
      }
      state.tried = true;
      state.ratingHalfSteps = intent.ratingHalfSteps;
      return applied(state, `Saved ${intent.ratingHalfSteps / 2} star rating.`);

    case "ADD_OWNED":
      if (state.purchaseCount > 0) {
        return unchanged(
          "ALREADY_OWNED",
          state,
          "Already owned. Use Add another purchase to record another acquisition.",
        );
      }
      state.wants = false;
      state.purchaseCount += 1;
      return applied(state, "Marked Owned and added a purchase.", 1);

    case "REMOVE_OWNED":
      if (state.purchaseCount === 0) {
        return unchanged("INVALID", state, "There is no ownership record to remove.");
      }
      state.purchaseCount -= 1;
      return applied(state, "Removed one ownership record.", -1);

    case "ADD_ANOTHER_PURCHASE":
      if (state.purchaseCount === 0) {
        return unchanged("INVALID", state, "Use Owned to record the first purchase.");
      }
      if (!intent.confirmed) {
        return unchanged(
          "CONFIRMATION_REQUIRED",
          state,
          "Confirm that you want to add another purchase.",
          "ADD_ANOTHER_PURCHASE",
        );
      }
      state.wants = false;
      state.purchaseCount += 1;
      return applied(state, "Added another purchase.", 1);
  }
}
