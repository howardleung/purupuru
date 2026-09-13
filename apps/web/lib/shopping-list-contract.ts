export type ShoppingListActionResult = {
  status: "SUCCESS" | "UNAUTHENTICATED" | "INVALID" | "NOT_FOUND" | "ERROR";
  message: string;
  listId?: string;
  itemId?: string;
  quantity?: number;
  purchasedQuantity?: number;
};

export type CreateShoppingListInput = {
  name: string;
  targetMarket: string;
};

export type AddVariantToListInput = {
  shoppingListId: string;
  productVariantId: string;
  quantity: number;
  productSlug?: string;
};

export type CreateListWithVariantInput = CreateShoppingListInput & {
  productVariantId: string;
  quantity: number;
  productSlug?: string;
};

export type UpdateShoppingListItemInput = {
  shoppingListId: string;
  shoppingListItemId: string;
  quantity: number;
};

export type MarkShoppingListItemPurchasedInput = {
  shoppingListId: string;
  shoppingListItemId: string;
  purchasedQuantity: number;
};
