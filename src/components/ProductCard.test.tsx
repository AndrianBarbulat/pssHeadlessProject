import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { DisplayProduct } from '../products/productModel';

const eurProduct: DisplayProduct = {
  id: 'p1',
  name: 'Espresso Cup',
  imageUrl: null,
  imageAlt: 'Espresso Cup',
  currency: 'EUR',
  variants: [{ variantId: 'v1', label: 'Default', priceAmount: '25.00', inStock: true }],
  hasMultipleVariants: false,
  defaultVariantId: 'v1',
  addable: true,
};

describe('ProductCard', () => {
  it('formats the product price with the product currency before a cart exists', () => {
    render(
      <ProductCard
        product={eurProduct}
        currency="EUR"
        mutating={false}
        onAdd={async () => true}
      />,
    );
    expect(screen.getByText('€25.00')).toBeInTheDocument();
  });

  it('renders distinguishable variant options', () => {
    const product: DisplayProduct = {
      ...eurProduct,
      hasMultipleVariants: true,
      variants: [
        { variantId: 'v1', label: 'Color: Green · Size: XL', priceAmount: '25.00', inStock: true },
        { variantId: 'v2', label: 'Color: Blue · Size: XL', priceAmount: '26.00', inStock: true },
        { variantId: 'v3', label: 'Color: Black · Size: Medium', priceAmount: '24.00', inStock: false },
      ],
      defaultVariantId: 'v1',
    };

    render(
      <ProductCard product={product} currency="EUR" mutating={false} onAdd={async () => true} />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Color: Green · Size: XL')).toBeInTheDocument();
    expect(screen.getByText('Color: Blue · Size: XL')).toBeInTheDocument();
    expect(screen.getByText('Color: Black · Size: Medium')).toBeInTheDocument();
  });
});
