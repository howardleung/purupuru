import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createFreshQuizAnswers,
  getNextQuizStep,
  getPreviousQuizStep,
  getQuizProgress,
  getQuizSteps,
  toggleLimitedChoice,
} from "../../apps/web/app/design/theo-animation/quiz-model.ts";

test("single-product and routine paths branch into their relevant questions", () => {
  assert.deepEqual(getQuizSteps("single"), [
    "account", "goal", "category", "skinType", "concerns", "sensitivity", "texture",
  ]);
  assert.deepEqual(getQuizSteps("routine"), [
    "account", "goal", "skinType", "concerns", "sensitivity", "currentRoutine", "routineLength", "texture",
  ]);
});

test("forward and back navigation use the selected branch", () => {
  const answers = { ...createFreshQuizAnswers(), path: "routine" as const };
  assert.equal(getNextQuizStep("goal", answers), "skinType");
  assert.equal(getPreviousQuizStep("currentRoutine", answers), "sensitivity");
  assert.equal(getNextQuizStep("texture", answers), null);
});

test("navigation does not mutate or discard prior session answers", () => {
  const answers = {
    ...createFreshQuizAnswers(),
    path: "single" as const,
    category: "Serum",
    skinType: "Dry",
  };
  getNextQuizStep("category", answers);
  getPreviousQuizStep("skinType", answers);
  assert.equal(answers.category, "Serum");
  assert.equal(answers.skinType, "Dry");
});

test("concern selection toggles choices and caps the selection at three", () => {
  let concerns: string[] = [];
  concerns = toggleLimitedChoice(concerns, "Dryness");
  concerns = toggleLimitedChoice(concerns, "Redness");
  concerns = toggleLimitedChoice(concerns, "Dullness");
  assert.deepEqual(toggleLimitedChoice(concerns, "Breakouts"), concerns);
  assert.deepEqual(toggleLimitedChoice(concerns, "Redness"), ["Dryness", "Dullness"]);
});

test("restart creates independent empty answer collections", () => {
  const first = createFreshQuizAnswers();
  first.concerns.push("Dryness");
  const restarted = createFreshQuizAnswers();
  assert.deepEqual(restarted, {
    accountChoice: null,
    path: null,
    category: null,
    skinType: null,
    concerns: [],
    sensitivity: null,
    texture: null,
    currentRoutine: [],
    routineLength: null,
  });
});

test("progress reflects the active branch", () => {
  const single = { ...createFreshQuizAnswers(), path: "single" as const };
  const routine = { ...createFreshQuizAnswers(), path: "routine" as const };
  assert.equal(getQuizProgress("category", single).current, 3);
  assert.equal(getQuizProgress("category", single).total, 7);
  assert.equal(getQuizProgress("routineLength", routine).total, 8);
});

test("the prototype keeps retrieval motion skippable and respects reduced motion", async () => {
  const [component, css] = await Promise.all([
    readFile("apps/web/app/design/theo-animation/theo-animation-prototype.tsx", "utf8"),
    readFile("apps/web/app/design/theo-animation/theo-animation.module.css", "utf8"),
  ]);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /Skip to results/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.retrieving[^}]*animation: none/s);
});

test("both branches render clearly labelled illustrative results and prototype controls", async () => {
  const component = await readFile("apps/web/app/design/theo-animation/theo-animation-prototype.tsx", "utf8");
  assert.match(component, /Theo’s example shortlist/);
  assert.match(component, /A simple routine to explore/);
  assert.match(component, /Prototype only/);
  assert.match(component, /Favourite/);
  assert.match(component, /Mock cart/);
  assert.match(component, /Swap/);
  assert.match(component, /Best Match/);
  assert.match(component, /Budget Pick/);
  assert.match(component, /Alternative/);
});

test("single-select choices auto-advance through a rapid-click guard while multi-select steps retain Next", async () => {
  const component = await readFile("apps/web/app/design/theo-animation/theo-animation-prototype.tsx", "utf8");
  assert.match(component, /function selectAndAdvance/);
  assert.match(component, /if \(advancingRef\.current\) return/);
  assert.match(component, /const isMultiSelect = step === "concerns" \|\| step === "currentRoutine"/);
  assert.doesNotMatch(component, /Skip \/ not sure/);
});
