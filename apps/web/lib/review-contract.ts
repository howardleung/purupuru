export type ReviewActionResult = {
  status: "SUCCESS" | "INVALID" | "UNAUTHENTICATED" | "ERROR";
  message: string;
};

export type SaveReviewInput = {
  productFamilyId: string;
  productSlug: string;
  productVariantId: string;
  rating: number;
  body: string;
};

export type DeleteReviewInput = {
  productFamilyId: string;
  productSlug: string;
  confirmed: boolean;
};
