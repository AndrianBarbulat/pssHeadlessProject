/** Wix Stores catalog app ID (used when adding a catalog item to the cart). */
export const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

export interface AddProductInput {
  productId: string;
  variantId: string;
  quantity?: number;
}

export interface AddToCartPayload {
  catalogItems: Array<{
    catalogReference: {
      catalogItemId: string;
      appId: string;
      options: { variantId: string };
    };
    quantity: number;
  }>;
}

export interface UpdateQuantityPayload {
  lineItems: Array<{
    lineItemId: string;
    quantity: { newQuantity: number };
  }>;
}

/** Builds the payload for `currentCartV2.addLineItemsToCurrentCart()`. */
export function buildAddProductPayload(input: AddProductInput): AddToCartPayload {
  return {
    catalogItems: [
      {
        catalogReference: {
          catalogItemId: input.productId,
          appId: WIX_STORES_APP_ID,
          options: { variantId: input.variantId },
        },
        quantity: input.quantity ?? 1,
      },
    ],
  };
}

/** Builds the payload for `currentCartV2.updateLineItemsInCurrentCart()`. */
export function buildUpdateQuantityPayload(
  lineItemId: string,
  newQuantity: number,
): UpdateQuantityPayload {
  return {
    lineItems: [
      {
        lineItemId,
        quantity: { newQuantity },
      },
    ],
  };
}

/** Builds the payload for `currentCartV2.removeLineItemsFromCurrentCart()`. */
export function buildRemovePayload(lineItemId: string): string[] {
  return [lineItemId];
}
