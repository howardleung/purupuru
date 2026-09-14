import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyCollectionState,
  isValidRatingHalfSteps,
  planCollectionMutation,
} from "../../packages/domain/src/collection.ts";

test("Owned removes Want and creates the first purchase", () => {
  const current = { ...createEmptyCollectionState(), wants: true };
  const result = planCollectionMutation(current, { type: "ADD_OWNED" });

  assert.equal(result.status, "APPLIED");
  assert.equal(result.state.wants, false);
  assert.equal(result.state.purchaseCount, 1);
  assert.equal(result.purchaseDelta, 1);
});

test("Tried can exist without ownership", () => {
  const result = planCollectionMutation(createEmptyCollectionState(), { type: "ADD_TRIED" });

  assert.equal(result.state.tried, true);
  assert.equal(result.state.purchaseCount, 0);
});

test("relationship flags and tags can be removed without affecting unrelated state", () => {
  const current = {
    ...createEmptyCollectionState(),
    wants: true,
    tried: true,
    holyGrail: true,
    wouldRepurchase: true,
    ratingHalfSteps: 8,
  };

  const withoutWant = planCollectionMutation(current, { type: "REMOVE_WANT" });
  const withoutTag = planCollectionMutation(withoutWant.state, { type: "REMOVE_HOLY_GRAIL" });
  const withoutRepurchase = planCollectionMutation(withoutTag.state, {
    type: "REMOVE_WOULD_REPURCHASE",
  });

  assert.equal(withoutWant.state.wants, false);
  assert.equal(withoutTag.state.holyGrail, false);
  assert.equal(withoutRepurchase.state.wouldRepurchase, false);
  assert.equal(withoutRepurchase.state.tried, true);
  assert.equal(withoutRepurchase.state.ratingHalfSteps, 8);
});

test("removing Tried clears feedback that requires Tried", () => {
  const current = {
    ...createEmptyCollectionState(),
    tried: true,
    wouldRepurchase: true,
    ratingHalfSteps: 8,
  };
  const result = planCollectionMutation(current, { type: "REMOVE_TRIED" });

  assert.equal(result.state.tried, false);
  assert.equal(result.state.wouldRepurchase, false);
  assert.equal(result.state.ratingHalfSteps, null);
});

test("Holy Grail works without Tried or Owned and survives ownership changes", () => {
  const holyGrail = planCollectionMutation(createEmptyCollectionState(), {
    type: "ADD_HOLY_GRAIL",
  });
  const owned = planCollectionMutation(holyGrail.state, { type: "ADD_OWNED" });

  assert.equal(holyGrail.state.holyGrail, true);
  assert.equal(holyGrail.state.tried, false);
  assert.equal(holyGrail.state.purchaseCount, 0);
  assert.equal(owned.state.holyGrail, true);
});

test("Would Repurchase requires Tried or an explicit combined confirmation", () => {
  const current = createEmptyCollectionState();
  const blocked = planCollectionMutation(current, { type: "ADD_WOULD_REPURCHASE" });
  const confirmed = planCollectionMutation(current, {
    type: "ADD_WOULD_REPURCHASE",
    confirmedTried: true,
  });

  assert.equal(blocked.status, "CONFIRMATION_REQUIRED");
  assert.equal(blocked.state.tried, false);
  assert.equal(blocked.state.wouldRepurchase, false);
  assert.equal(confirmed.status, "APPLIED");
  assert.equal(confirmed.state.tried, true);
  assert.equal(confirmed.state.wouldRepurchase, true);
});

test("rating requires Tried or an explicit combined confirmation", () => {
  const current = createEmptyCollectionState();
  const blocked = planCollectionMutation(current, {
    type: "SET_RATING",
    ratingHalfSteps: 8,
  });
  const confirmed = planCollectionMutation(current, {
    type: "SET_RATING",
    ratingHalfSteps: 8,
    confirmedTried: true,
  });

  assert.equal(blocked.status, "CONFIRMATION_REQUIRED");
  assert.equal(blocked.state.ratingHalfSteps, null);
  assert.equal(confirmed.status, "APPLIED");
  assert.equal(confirmed.state.tried, true);
  assert.equal(confirmed.state.ratingHalfSteps, 8);
});

test("rating accepts only half steps from 1.0 through 5.0", () => {
  for (let halfSteps = 2; halfSteps <= 10; halfSteps += 1) {
    assert.equal(isValidRatingHalfSteps(halfSteps), true);
  }

  for (const invalid of [1, 11, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(isValidRatingHalfSteps(invalid), false);
  }
});

test("adding Owned when already owned is idempotent", () => {
  const current = { ...createEmptyCollectionState(), purchaseCount: 1 };
  const result = planCollectionMutation(current, { type: "ADD_OWNED" });

  assert.equal(result.status, "ALREADY_OWNED");
  assert.equal(result.purchaseDelta, 0);
  assert.equal(result.state.purchaseCount, 1);
});

test("removing Owned removes one ownership record at a time", () => {
  const current = { ...createEmptyCollectionState(), purchaseCount: 2 };
  const result = planCollectionMutation(current, { type: "REMOVE_OWNED" });

  assert.equal(result.status, "APPLIED");
  assert.equal(result.purchaseDelta, -1);
  assert.equal(result.state.purchaseCount, 1);
});

test("explicit confirmed Add another purchase creates exactly one purchase", () => {
  const current = { ...createEmptyCollectionState(), purchaseCount: 1 };
  const unconfirmed = planCollectionMutation(current, {
    type: "ADD_ANOTHER_PURCHASE",
  });
  const confirmed = planCollectionMutation(current, {
    type: "ADD_ANOTHER_PURCHASE",
    confirmed: true,
  });

  assert.equal(unconfirmed.status, "CONFIRMATION_REQUIRED");
  assert.equal(unconfirmed.purchaseDelta, 0);
  assert.equal(confirmed.status, "APPLIED");
  assert.equal(confirmed.purchaseDelta, 1);
  assert.equal(confirmed.state.purchaseCount, 2);
});

test("planning a relationship change does not mutate another user/version state", () => {
  const userOneVersionOne = createEmptyCollectionState();
  const userTwoVersionOne = createEmptyCollectionState();
  const userOneVersionTwo = createEmptyCollectionState();

  const updated = planCollectionMutation(userOneVersionOne, { type: "ADD_WANT" });

  assert.equal(updated.state.wants, true);
  assert.equal(userOneVersionOne.wants, false);
  assert.deepEqual(userTwoVersionOne, createEmptyCollectionState());
  assert.deepEqual(userOneVersionTwo, createEmptyCollectionState());
});
