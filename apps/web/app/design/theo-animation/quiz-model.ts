export type QuizPath = "single" | "routine";

export type QuizStepId =
  | "account"
  | "goal"
  | "category"
  | "skinType"
  | "concerns"
  | "sensitivity"
  | "texture"
  | "currentRoutine"
  | "routineLength";

export type QuizAnswers = {
  accountChoice: "guest" | "sign-in" | "sign-up" | null;
  path: QuizPath | null;
  category: string | null;
  skinType: string | null;
  concerns: string[];
  sensitivity: string | null;
  texture: string | null;
  currentRoutine: string[];
  routineLength: string | null;
};

export const MAX_CONCERNS = 3;

export const EMPTY_QUIZ_ANSWERS: QuizAnswers = {
  accountChoice: null,
  path: null,
  category: null,
  skinType: null,
  concerns: [],
  sensitivity: null,
  texture: null,
  currentRoutine: [],
  routineLength: null,
};

const SINGLE_STEPS: QuizStepId[] = [
  "account",
  "goal",
  "category",
  "skinType",
  "concerns",
  "sensitivity",
  "texture",
];

const ROUTINE_STEPS: QuizStepId[] = [
  "account",
  "goal",
  "skinType",
  "concerns",
  "sensitivity",
  "currentRoutine",
  "routineLength",
  "texture",
];

export function getQuizSteps(path: QuizPath | null): QuizStepId[] {
  return path === "routine" ? ROUTINE_STEPS : SINGLE_STEPS;
}

export function getNextQuizStep(current: QuizStepId, answers: QuizAnswers): QuizStepId | null {
  const steps = getQuizSteps(answers.path);
  const index = steps.indexOf(current);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : null;
}

export function getPreviousQuizStep(current: QuizStepId, answers: QuizAnswers): QuizStepId | null {
  const steps = getQuizSteps(answers.path);
  const index = steps.indexOf(current);
  return index > 0 ? steps[index - 1] : null;
}

export function getQuizProgress(current: QuizStepId, answers: QuizAnswers) {
  const steps = getQuizSteps(answers.path);
  const index = Math.max(0, steps.indexOf(current));
  return { current: index + 1, total: steps.length, percent: ((index + 1) / steps.length) * 100 };
}

export function toggleLimitedChoice(values: string[], value: string, maximum = MAX_CONCERNS): string[] {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (values.length >= maximum) return values;
  return [...values, value];
}

export function createFreshQuizAnswers(): QuizAnswers {
  return { ...EMPTY_QUIZ_ANSWERS, concerns: [], currentRoutine: [] };
}
