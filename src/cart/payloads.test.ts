import { describe, expect, it } from 'vitest';
import {
  WIX_STORES_APP_ID,
  buildAddProductPayload,
  buildRemovePayload,
  buildUpdateQuantityPayload,
} from './payloads';

describe('Cart V2 payload builders', () => {
  it('builds a quantity update payload', () => {
    expect(buildUpdateQuantityPayload('line-item-1', 3)).toEqual({
      lineItems: [
        {
          lineItemId: 'line-item-1',
          quantity: { newQuantity: 3 },
        },
      ],
    });
  });

  it('builds a removal payload', () => {
    expect(buildRemovePayload('line-item-1')).toEqual(['line-item-1']);
  });

  it('builds an add-to-cart payload with the Wix Stores app ID and variant ID', () => {
    const payload = buildAddProductPayload({ productId: 'product-1', variantId: 'variant-1' });
    expect(payload).toEqual({
      catalogItems: [
        {
          catalogReference: {
            catalogItemId: 'product-1',
            appId: WIX_STORES_APP_ID,
            options: { variantId: 'variant-1' },
          },
          quantity: 1,
        },
      ],
    });
    expect(WIX_STORES_APP_ID).toBe('215238eb-22a5-4c36-9e7b-e7c08025e04e');
  });

  it('honors an explicit quantity when adding a product', () => {
    const payload = buildAddProductPayload({
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 5,
    });
    expect(payload.catalogItems[0]?.quantity).toBe(5);
  });
});
