import { describe, expect, it } from 'vitest';
import {
  getVisibleVariants,
  normalizeCurrency,
  toDisplayProduct,
  variantLabel,
  type RawProduct,
  type RawVariant,
} from './productModel';

describe('variantLabel', () => {
  it('uses option and choice names when both are present', () => {
    const variant: RawVariant = {
      _id: 'v1',
      choices: [
        { optionChoiceNames: { optionName: 'Color', choiceName: 'Green' } },
        { optionChoiceNames: { optionName: 'Size', choiceName: 'XL' } },
      ],
    };
    expect(variantLabel(variant)).toBe('Color: Green · Size: XL');
  });

  it('falls back to choice names only', () => {
    const variant: RawVariant = {
      _id: 'v1',
      choices: [
        { optionChoiceNames: { choiceName: 'Green' } },
        { optionChoiceNames: { choiceName: 'XL' } },
      ],
    };
    expect(variantLabel(variant)).toBe('Green / XL');
  });

  it('returns Default only when Wix provides no choice names', () => {
    expect(variantLabel({ _id: 'v1' })).toBe('Default');
    expect(variantLabel({ _id: 'v1', choices: [] })).toBe('Default');
    expect(
      variantLabel({ _id: 'v1', choices: [{ optionChoiceNames: { choiceName: '' } }] }),
    ).toBe('Default');
  });

  it('skips choices with empty names', () => {
    const variant: RawVariant = {
      _id: 'v1',
      choices: [
        { optionChoiceNames: { optionName: 'Color', choiceName: '' } },
        { optionChoiceNames: { optionName: 'Size', choiceName: 'XL' } },
      ],
    };
    expect(variantLabel(variant)).toBe('Size: XL');
  });
});

describe('getVisibleVariants', () => {
  it('excludes hidden and ID-less variants', () => {
    const product: RawProduct = {
      _id: 'p1',
      variantsInfo: {
        variants: [
          { _id: 'v1', visible: true },
          { _id: 'v2', visible: false },
          { _id: null, visible: true },
        ],
      },
    };
    expect(getVisibleVariants(product).map((v) => v._id)).toEqual(['v1']);
  });
});

describe('toDisplayProduct', () => {
  it('extracts the product currency so a new visitor sees the right currency', () => {
    const product: RawProduct = {
      _id: 'p1',
      name: 'Espresso Cup',
      currency: 'EUR',
      variantsInfo: {
        variants: [
          {
            _id: 'v1',
            choices: [{ optionChoiceNames: { optionName: 'Color', choiceName: 'Green' } }],
            price: { actualPrice: { amount: '25.00' } },
            inventoryStatus: { inStock: true },
          },
        ],
      },
    };
    const display = toDisplayProduct(product);
    expect(display?.currency).toBe('EUR');
  });

  it('keeps every variant ID associated with its label', () => {
    const product: RawProduct = {
      _id: 'p1',
      name: 'T-Shirt',
      variantsInfo: {
        variants: [
          {
            _id: 'v1',
            choices: [{ optionChoiceNames: { optionName: 'Color', choiceName: 'Green' } }],
            price: { actualPrice: { amount: '10.00' } },
            inventoryStatus: { inStock: true },
          },
          {
            _id: 'v2',
            choices: [{ optionChoiceNames: { optionName: 'Color', choiceName: 'Blue' } }],
            price: { actualPrice: { amount: '11.00' } },
            inventoryStatus: { inStock: true },
          },
        ],
      },
    };
    const display = toDisplayProduct(product);
    expect(display?.variants).toEqual([
      { variantId: 'v1', label: 'Color: Green', priceAmount: '10.00', inStock: true },
      { variantId: 'v2', label: 'Color: Blue', priceAmount: '11.00', inStock: true },
    ]);
  });

  it('marks out-of-stock variants as unavailable for purchase', () => {
    const product: RawProduct = {
      _id: 'p1',
      name: 'T-Shirt',
      variantsInfo: {
        variants: [
          {
            _id: 'v1',
            price: { actualPrice: { amount: '10.00' } },
            inventoryStatus: { inStock: false },
          },
        ],
      },
    };
    const display = toDisplayProduct(product);
    expect(display?.variants[0]?.inStock).toBe(false);
    // Defaults to the only variant even though it is out of stock, but stays addable
    // at the product level so the UI can render an explicit "Out of stock" state.
    expect(display?.defaultVariantId).toBe('v1');
    expect(display?.addable).toBe(true);
  });
});

describe('normalizeCurrency', () => {
  it('trims and normalizes currency codes', () => {
    expect(normalizeCurrency('EUR')).toBe('EUR');
    expect(normalizeCurrency(' eur ')).toBe('eur');
    expect(normalizeCurrency('')).toBeUndefined();
    expect(normalizeCurrency(null)).toBeUndefined();
    expect(normalizeCurrency(undefined)).toBeUndefined();
  });
});
