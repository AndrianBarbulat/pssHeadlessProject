import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartLineItem } from './CartLineItem';
import type { CartLineItem as LineItem } from '../cart/types';

vi.mock('../lib/media', () => ({
  resolveImageUrl: () => ({ url: null, altText: '' }),
}));

const baseItem: LineItem = {
  _id: 'li-1',
  name: { original: 'Test Widget', translated: 'Widget (translated)' },
  quantityInfo: { confirmedQuantity: 2, requestedQuantity: 2, fixedQuantity: false },
  pricing: {
    unitPrice: { amount: '10.00', convertedAmount: '10.00' },
    totalPrice: { amount: '20.00', convertedAmount: '20.00' },
  },
  attributes: { image: 'wix:image://v1/abc/123' },
  status: 'IN_STOCK',
};

describe('CartLineItem', () => {
  it('renders the translated name, unit price, quantity, and line total', () => {
    render(
      <CartLineItem
        item={baseItem}
        currency="USD"
        disabled={false}
        onUpdateQuantity={async () => true}
        onRemove={async () => true}
      />,
    );

    expect(screen.getByText('Widget (translated)')).toBeInTheDocument();
    expect(screen.getByText('$10.00 each')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Increase quantity of Widget (translated)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity of Widget (translated)' }),
    ).toBeInTheDocument();
  });

  it('falls back to the original name when no translation is present', () => {
    render(
      <CartLineItem
        item={{ ...baseItem, name: { original: 'Original Name' } }}
        currency="USD"
        disabled={false}
        onUpdateQuantity={async () => true}
        onRemove={async () => true}
      />,
    );
    expect(screen.getByText('Original Name')).toBeInTheDocument();
  });

  it('renders the variant description when the cart provides description lines', () => {
    render(
      <CartLineItem
        item={{
          ...baseItem,
          attributes: {
            image: 'wix:image://v1/abc/123',
            descriptionLines: [
              { name: { original: 'Color' }, plainText: { original: 'Green' } },
              { name: { original: 'Size' }, plainText: { original: 'XL' } },
            ],
          },
        }}
        currency="USD"
        disabled={false}
        onUpdateQuantity={async () => true}
        onRemove={async () => true}
      />,
    );
    expect(screen.getByText('Color: Green · Size: XL')).toBeInTheDocument();
  });

  it('shows a fixed quantity instead of controls when fixedQuantity is set', () => {
    render(
      <CartLineItem
        item={{
          ...baseItem,
          quantityInfo: { confirmedQuantity: 3, fixedQuantity: true },
        }}
        currency="USD"
        disabled={false}
        onUpdateQuantity={async () => true}
        onRemove={async () => true}
      />,
    );
    expect(screen.getByText('Qty 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /quantity of/i })).not.toBeInTheDocument();
  });

  it('shows an availability warning for out-of-stock items', () => {
    render(
      <CartLineItem
        item={{ ...baseItem, status: 'OUT_OF_STOCK' }}
        currency="USD"
        disabled={false}
        onUpdateQuantity={async () => true}
        onRemove={async () => true}
      />,
    );
    expect(screen.getByText('This item is out of stock.')).toBeInTheDocument();
  });
});

