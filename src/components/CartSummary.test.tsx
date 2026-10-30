import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { CartSummary } from './CartSummary';
import { CartContext, type CartContextValue } from '../cart/CartContext';
import type { Cart } from '../cart/types';

// Avoid pulling in @wix/sdk's media machinery during component tests.
vi.mock('../lib/media', () => ({
  resolveImageUrl: () => ({ url: null, altText: '' }),
}));

function makeValue(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    cart: null,
    loading: false,
    mutating: false,
    error: null,
    configured: true,
    refreshCart: async () => {},
    addProduct: async () => true,
    updateQuantity: async () => true,
    removeItem: async () => true,
    clearError: () => {},
    ...overrides,
  };
}

function renderWithCart(ui: ReactElement, overrides: Partial<CartContextValue> = {}) {
  return render(<CartContext.Provider value={makeValue(overrides)}>{ui}</CartContext.Provider>);
}

const cartWithLine: Cart = {
  _id: 'cart-1',
  lineItems: [
    {
      _id: 'li-1',
      name: { original: 'Test Widget', translated: 'Test Widget' },
      quantityInfo: { confirmedQuantity: 2, requestedQuantity: 2, fixedQuantity: false },
      pricing: {
        unitPrice: { amount: '10.00', convertedAmount: '10.00' },
        totalPrice: { amount: '20.00', convertedAmount: '20.00' },
      },
      attributes: { image: 'wix:image://v1/abc/123' },
      status: 'IN_STOCK',
    },
  ],
  subtotal: { amount: '20.00', convertedAmount: '20.00' },
  businessInfo: { currencyCode: 'USD' },
  customerInfo: { currencyCode: 'USD' },
};

describe('CartSummary', () => {
  it('renders the empty-cart state when there is no current cart', () => {
    renderWithCart(<CartSummary />, { cart: null, loading: false });
    expect(screen.getByText('Your cart is currently empty.')).toBeInTheDocument();
    expect(
      screen.getByText('Add one of the products to see the summary update.'),
    ).toBeInTheDocument();
  });

  it('renders the empty-cart state when the cart has no line items', () => {
    renderWithCart(<CartSummary />, { cart: { _id: 'c1', lineItems: [] }, loading: false });
    expect(screen.getByText('Your cart is currently empty.')).toBeInTheDocument();
  });

  it('renders cart lines with name, price, quantity controls, and the server subtotal', () => {
    renderWithCart(<CartSummary />, { cart: cartWithLine, loading: false });

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('$10.00 each')).toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Increase quantity of Test Widget' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity of Test Widget' }),
    ).toBeInTheDocument();

    // Line total and subtotal are both $20.00 and both come from the Wix payload.
    expect(screen.getAllByText('$20.00')).toHaveLength(2);
  });
});

