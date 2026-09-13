import type {
  CollectionConfirmation,
  CollectionMutationIntent,
  CollectionRelationshipState,
} from "@beauty-platform/domain/collection";

export type ProductCollectionActionInput = {
  productSlug: string;
  productVersionId: string;
  productVariantId: string;
  intent: CollectionMutationIntent;
};

export type ProductCollectionActionResult = {
  status: "SUCCESS" | "UNAUTHENTICATED" | "CONFIRMATION_REQUIRED" | "INVALID" | "ERROR";
  message: string;
  state?: CollectionRelationshipState;
  confirmation?: CollectionConfirmation;
};
