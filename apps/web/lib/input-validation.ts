import { isValidRatingHalfSteps } from "@beauty-platform/domain/collection";
import { validateRequestedQuantity } from "@beauty-platform/domain/shopping-list";
import type { ProductCollectionActionInput } from "./collection-contract";
import type {
  AddVariantToListInput, CreateListWithVariantInput, CreateShoppingListInput,
  MarkShoppingListItemPurchasedInput, RemoveShoppingListItemInput, UpdateShoppingListItemInput,
} from "./shopping-list-contract";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value);
}

export function isRouteSlug(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 200 &&
    /^[A-Za-z0-9_-]+$/.test(value);
}

type ShoppingInputs = {
  create: CreateShoppingListInput;
  createWithVariant: CreateListWithVariantInput;
  add: AddVariantToListInput;
  update: UpdateShoppingListItemInput;
  purchased: MarkShoppingListItemPurchasedInput;
  remove: RemoveShoppingListItemInput;
};

/** Check every required field before Prisma can omit an undefined predicate. */
export function isShoppingListInput<K extends keyof ShoppingInputs>(
  kind: K, input: unknown,
): input is ShoppingInputs[K] {
  if (!isRecord(input)) return false;
  if (kind === "create" || kind === "createWithVariant") {
    if (typeof input.name !== "string" || input.name.length > 500 ||
      typeof input.targetMarket !== "string" || !/^[A-Za-z]{2}$/.test(input.targetMarket)) return false;
  }
  if (kind === "add" || kind === "update" || kind === "purchased" || kind === "remove") {
    if (!isIdentifier(input.shoppingListId)) return false;
  }
  if (kind === "update" || kind === "purchased" || kind === "remove") {
    if (!isIdentifier(input.shoppingListItemId)) return false;
  }
  if (kind === "createWithVariant" || kind === "add") {
    if (!isIdentifier(input.productVariantId) ||
      (input.productSlug !== undefined && !isRouteSlug(input.productSlug))) return false;
  }
  if (kind === "createWithVariant" || kind === "add" || kind === "update") {
    if (!validateRequestedQuantity(input.quantity)) return false;
  }
  return kind !== "purchased" || typeof input.purchased === "boolean";
}

export function isProductCollectionInput(input: unknown): input is ProductCollectionActionInput {
  if (!isRecord(input) || !isRouteSlug(input.productSlug) ||
    !isIdentifier(input.productVersionId) || !isIdentifier(input.productVariantId) ||
    !isRecord(input.intent)) return false;
  const intent = input.intent;
  switch (intent.type) {
    case "ADD_WANT": case "REMOVE_WANT": case "ADD_TRIED": case "REMOVE_TRIED":
    case "ADD_HOLY_GRAIL": case "REMOVE_HOLY_GRAIL": case "ADD_OWNED": case "REMOVE_OWNED":
    case "REMOVE_WOULD_REPURCHASE": return true;
    case "ADD_WOULD_REPURCHASE":
      return intent.confirmedTried === undefined || typeof intent.confirmedTried === "boolean";
    case "SET_RATING":
      return typeof intent.ratingHalfSteps === "number" && isValidRatingHalfSteps(intent.ratingHalfSteps) &&
        (intent.confirmedTried === undefined || typeof intent.confirmedTried === "boolean");
    case "ADD_ANOTHER_PURCHASE":
      return intent.confirmed === undefined || typeof intent.confirmed === "boolean";
    default: return false;
  }
}

/** Repeated and oversized query parameters are not scalar filter values. */
export function boundedParameter(value: unknown, maximumLength = 128): string | undefined {
  return typeof value === "string" && value.length <= maximumLength ? value : undefined;
}

/** Accept a legacy scalar or repeated query values without allowing an unbounded filter list. */
export function boundedParameters(
  value: unknown,
  maximumLength = 128,
  maximumItems = 50,
): string[] {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.flatMap((item) => {
    const parameter = boundedParameter(item, maximumLength);
    return parameter === undefined ? [] : [parameter];
  }))].slice(0, maximumItems);
}

export function priceParameter(value: unknown): number | undefined {
  const scalar = boundedParameter(value, 32)?.trim();
  if (!scalar || !/^\d+(?:\.\d+)?$/.test(scalar)) return undefined;
  const amount = Number(scalar);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

export function comparisonIds(value: unknown): string[] {
  const scalar = boundedParameter(value, 4 * 129);
  if (!scalar) return [];
  return [...new Set(scalar.split(",").filter(isIdentifier))].slice(0, 4);
}
