import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  ensureVisitorTokens,
  getWixClient,
  isConfigured,
  persistVisitorTokens,
} from '../lib/wixClient';
import { isOwnedCartNotFound, normalizeError } from '../lib/errors';
import { cartReducer, initialCartState } from './cartReducer';
import { extractCart } from './normalize';
import {
  buildAddProductPayload,
  buildRemovePayload,
  buildUpdateQuantityPayload,
  type AddProductInput,
} from './payloads';
import type { Cart } from './types';

export interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  configured: boolean;
  refreshCart: () => Promise<void>;
  addProduct: (input: AddProductInput) => Promise<boolean>;
  updateQuantity: (lineItemId: string, newQuantity: number) => Promise<boolean>;
  removeItem: (lineItemId: string) => Promise<boolean>;
  clearError: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const refreshingRef = useRef(false);
  const mutatingRef = useRef(false);
  const tokensReadyRef = useRef(false);
  const cartRef = useRef<Cart | null>(null);
  // Bumped whenever a mutation starts so an in-flight refresh can detect that
  // its result is stale and avoid overwriting newer cart state.
  const mutationEpochRef = useRef(0);

  useEffect(() => {
    cartRef.current = state.cart;
  }, [state.cart]);

  const refreshCart = useCallback(async () => {
    if (!isConfigured || refreshingRef.current || mutatingRef.current) return;
    refreshingRef.current = true;
    const epochAtStart = mutationEpochRef.current;
    dispatch({ type: 'REFRESH_START' });
    try {
      const client = getWixClient();
      if (!tokensReadyRef.current) {
        // Validate/renew the visitor session once before the first request.
        await ensureVisitorTokens();
        tokensReadyRef.current = true;
      }
      const hasCart = cartRef.current !== null;
      // `getCurrentCart()` for initial retrieval, `refreshCurrentCart()` to
      // revalidate prices/inventory of an already-known cart.
      const response = hasCart
        ? await client.currentCartV2.refreshCurrentCart()
        : await client.currentCartV2.getCurrentCart();

      if (mutationEpochRef.current !== epochAtStart) return; // stale — drop
      persistVisitorTokens();
      dispatch({ type: 'REFRESH_SUCCESS', cart: extractCart(response) });
    } catch (err) {
      if (mutationEpochRef.current !== epochAtStart) return; // stale — drop
      if (isOwnedCartNotFound(err)) {
        // No current cart for this visitor — a normal empty state.
        dispatch({ type: 'REFRESH_SUCCESS', cart: null });
      } else {
        dispatch({ type: 'REFRESH_ERROR', error: normalizeError(err) });
      }
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  /**
   * Runs a cart mutation with the following guarantees:
   *  - overlapping mutations are prevented
   *  - the returned cart replaces local state
   *  - visitor tokens are persisted
   *  - errors are surfaced without destroying the current cart
   */
  const runMutation = useCallback(async (operation: () => Promise<Cart | null>): Promise<boolean> => {
    if (!isConfigured || mutatingRef.current) return false;
    mutatingRef.current = true;
    mutationEpochRef.current += 1; // invalidate any in-flight refresh
    dispatch({ type: 'MUTATION_START' });
    try {
      const cart = await operation();
      persistVisitorTokens();
      dispatch({ type: 'MUTATION_SUCCESS', cart });
      return true;
    } catch (err) {
      dispatch({ type: 'MUTATION_ERROR', error: normalizeError(err) });
      return false;
    } finally {
      mutatingRef.current = false;
    }
  }, []);

  const addProduct = useCallback(
    (input: AddProductInput) =>
      runMutation(async () => {
        const client = getWixClient();
        const response = await client.currentCartV2.addLineItemsToCurrentCart(
          buildAddProductPayload(input),
        );
        return extractCart(response);
      }),
    [runMutation],
  );

  const updateQuantity = useCallback(
    (lineItemId: string, newQuantity: number) =>
      runMutation(async () => {
        const client = getWixClient();
        const response = await client.currentCartV2.updateLineItemsInCurrentCart(
          buildUpdateQuantityPayload(lineItemId, newQuantity),
        );
        return extractCart(response);
      }),
    [runMutation],
  );

  const removeItem = useCallback(
    (lineItemId: string) =>
      runMutation(async () => {
        const client = getWixClient();
        const response = await client.currentCartV2.removeLineItemsFromCurrentCart(
          buildRemovePayload(lineItemId),
        );
        return extractCart(response);
      }),
    [runMutation],
  );

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  useEffect(() => {
    if (!isConfigured) {
      // Nothing to load — settle into the empty state instead of loading forever.
      dispatch({ type: 'REFRESH_SUCCESS', cart: null });
      return;
    }

    void refreshCart();

    const onFocus = () => void refreshCart();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshCart();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart: state.cart,
      loading: state.loading,
      mutating: state.mutating,
      error: state.error,
      configured: isConfigured,
      refreshCart,
      addProduct,
      updateQuantity,
      removeItem,
      clearError,
    }),
    [state, refreshCart, addProduct, updateQuantity, removeItem, clearError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
