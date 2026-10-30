import type { Cart } from './types';

/**
 * Extracts a nullable cart from a Cart V2 API response, normalizing
 * "no current cart" (`undefined`/`null`) to `null` — the empty-cart state.
 */
export function extractCart(response: { cart?: Cart | null } | null | undefined): Cart | null {
  return response?.cart ?? null;
}

/** True when the cart has at least one line item to display. */
export function hasLineItems(cart: Cart | null | undefined): boolean {
  return Boolean(cart && Array.isArray(cart.lineItems) && cart.lineItems.length > 0);
}

/**
 * Normalizes "no current cart" and "cart with no line items" into a single
 * empty state (`null`). Both cases must render the friendly empty-cart message,
 * not a fatal error.
 */
export function normalizeCart(cart: Cart | null | undefined): Cart | null {
  return hasLineItems(cart) ? (cart as Cart) : null;
}

/** Total confirmed quantity across all cart line items (for the cart badge). */
export function getCartItemCount(cart: Cart | null | undefined): number {
  if (!cart || !Array.isArray(cart.lineItems)) return 0;
  return cart.lineItems.reduce(
    (total, item) => total + (item.quantityInfo?.confirmedQuantity ?? 0),
    0,
  );
}
