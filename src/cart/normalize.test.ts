import { describe, expect, it } from 'vitest';
import type { Cart } from './types';
import { extractCart, getCartItemCount, hasLineItems, normalizeCart } from './normalize';

const cartWithItem: Cart = {
  _id: 'cart-1',
  lineItems: [
    {
      _id: 'li-1',
      name: { original: 'Widget' },
      quantityInfo: { confirmedQuantity: 1 },
      pricing: {
        unitPrice: { amount: '5.00' },
        totalPrice: { amount: '5.00' },
      },
    },
  ],
};

describe('no-current-cart normalization', () => {
  it('normalizes a missing response or missing cart to null', () => {
    expect(extractCart(undefined)).toBeNull();
    expect(extractCart(null)).toBeNull();
    expect(extractCart({})).toBeNull();
    expect(extractCart({ cart: null })).toBeNull();
    expect(extractCart({ cart: undefined })).toBeNull();
  });

  it('keeps a returned cart intact', () => {
    expect(extractCart({ cart: cartWithItem })).toEqual(cartWithItem);
  });

  it('treats a cart without line items as empty', () => {
    expect(hasLineItems(null)).toBe(false);
    expect(hasLineItems(undefined)).toBe(false);
    expect(hasLineItems({ _id: 'c1', lineItems: [] })).toBe(false);
    expect(hasLineItems(cartWithItem)).toBe(true);
  });

  it('normalizes empty carts to a single null empty state', () => {
    expect(normalizeCart(null)).toBeNull();
    expect(normalizeCart({ _id: 'c1', lineItems: [] })).toBeNull();
    expect(normalizeCart(cartWithItem)).toEqual(cartWithItem);
  });
});

describe('getCartItemCount', () => {
  it('sums confirmed quantities across line items', () => {
    const cart: Cart = {
      _id: 'c1',
      lineItems: [
        { _id: 'a', quantityInfo: { confirmedQuantity: 2 } },
        { _id: 'b', quantityInfo: { confirmedQuantity: 3 } },
      ],
    };
    expect(getCartItemCount(cart)).toBe(5);
  });

  it('returns zero for missing or empty carts', () => {
    expect(getCartItemCount(null)).toBe(0);
    expect(getCartItemCount(undefined)).toBe(0);
    expect(getCartItemCount({ _id: 'c1', lineItems: [] })).toBe(0);
  });
});
