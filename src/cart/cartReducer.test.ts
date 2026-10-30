import { describe, expect, it } from 'vitest';
import { cartReducer, initialCartState } from './cartReducer';
import type { Cart } from './types';

const cartA: Cart = { _id: 'cart-a', lineItems: [{ _id: 'li-a' }] };
const cartB: Cart = { _id: 'cart-b', lineItems: [{ _id: 'li-b' }] };

describe('cartReducer', () => {
  it('starts in the loading state with no cart', () => {
    expect(initialCartState).toEqual({
      cart: null,
      loading: true,
      mutating: false,
      error: null,
    });
  });

  it('replaces the cart after a successful refresh', () => {
    const state = cartReducer(
      { ...initialCartState, loading: true },
      { type: 'REFRESH_SUCCESS', cart: cartA },
    );
    expect(state.cart).toEqual(cartA);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('replaces the whole cart with the response cart after a successful mutation', () => {
    const state = cartReducer(
      { ...initialCartState, loading: false, cart: cartA, mutating: true },
      { type: 'MUTATION_SUCCESS', cart: cartB },
    );
    expect(state.cart).toEqual(cartB);
    expect(state.mutating).toBe(false);
    expect(state.error).toBeNull();
  });

  it('preserves the existing cart when a mutation fails', () => {
    const state = cartReducer(
      { ...initialCartState, loading: false, cart: cartA, mutating: true },
      { type: 'MUTATION_ERROR', error: 'Out of stock' },
    );
    expect(state.cart).toEqual(cartA);
    expect(state.mutating).toBe(false);
    expect(state.error).toBe('Out of stock');
  });

  it('sets loading without clobbering the cart during refresh', () => {
    const state = cartReducer(
      { ...initialCartState, loading: false, cart: cartA, error: 'old' },
      { type: 'REFRESH_START' },
    );
    expect(state.loading).toBe(true);
    expect(state.cart).toEqual(cartA);
    expect(state.error).toBeNull();
  });

  it('clears the error on request', () => {
    const state = cartReducer(
      { ...initialCartState, error: 'boom' },
      { type: 'CLEAR_ERROR' },
    );
    expect(state.error).toBeNull();
  });
});
