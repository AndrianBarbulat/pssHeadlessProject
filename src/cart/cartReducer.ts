import type { Cart } from './types';

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

export type CartAction =
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; cart: Cart | null }
  | { type: 'REFRESH_ERROR'; error: string }
  | { type: 'MUTATION_START' }
  | { type: 'MUTATION_SUCCESS'; cart: Cart | null }
  | { type: 'MUTATION_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

export const initialCartState: CartState = {
  cart: null,
  loading: true,
  mutating: false,
  error: null,
};

/**
 * Central cart reducer.
 *
 * - `MUTATION_SUCCESS` replaces the entire local cart with the cart returned by
 *   the Wix mutation response (no client-side merging).
 * - `MUTATION_ERROR` preserves the previously loaded cart so a failed request
 *   never destroys what the user was already looking at.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'REFRESH_START':
      return { ...state, loading: true, error: null };
    case 'REFRESH_SUCCESS':
      return { ...state, loading: false, cart: action.cart, error: null };
    case 'REFRESH_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'MUTATION_START':
      return { ...state, mutating: true, error: null };
    case 'MUTATION_SUCCESS':
      return { ...state, mutating: false, cart: action.cart, error: null };
    case 'MUTATION_ERROR':
      // Keep the existing cart — only surface the error.
      return { ...state, mutating: false, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}
