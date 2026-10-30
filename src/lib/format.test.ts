import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatMoney,
  getCurrencyCode,
  getMoneyAmount,
  resolveProductCurrency,
} from './format';

describe('money formatting', () => {
  it('formats a raw amount using the given currency', () => {
    expect(formatAmount('10.5', 'USD')).toBe('$10.50');
  });

  it('formats a Cart V2 money object', () => {
    expect(formatMoney({ amount: '10.00' }, 'USD')).toBe('$10.00');
  });

  it('prefers the buyer-currency convertedAmount', () => {
    expect(getMoneyAmount({ amount: '10', convertedAmount: '11' })).toBe('11');
    expect(formatMoney({ amount: '10', convertedAmount: '11' }, 'USD')).toBe('$11.00');
  });

  it('returns an em dash for missing or empty amounts', () => {
    expect(formatMoney(undefined, 'USD')).toBe('—');
    expect(formatMoney(null, 'USD')).toBe('—');
    expect(formatMoney({ amount: '' }, 'USD')).toBe('—');
    expect(formatAmount(undefined, 'USD')).toBe('—');
  });

  it('falls back gracefully for invalid amounts or currencies', () => {
    expect(formatAmount('not-a-number', 'USD')).toBe('not-a-number');
    expect(formatAmount('5', 'NOT_A_CURRENCY')).toBe('5');
  });

  it('resolves the display currency with a USD fallback', () => {
    expect(getCurrencyCode(undefined)).toBe('USD');
    expect(getCurrencyCode(null)).toBe('USD');
    expect(getCurrencyCode({ businessInfo: { currencyCode: 'EUR' } })).toBe('EUR');
    expect(
      getCurrencyCode({
        businessInfo: { currencyCode: 'EUR' },
        customerInfo: { currencyCode: 'GBP' },
      }),
    ).toBe('GBP');
  });
});

describe('resolveProductCurrency', () => {
  it('prefers the product currency before a cart exists', () => {
    expect(resolveProductCurrency('EUR', undefined)).toBe('EUR');
    expect(resolveProductCurrency('EUR', 'USD')).toBe('EUR');
  });

  it('falls back to the cart currency when the product has none', () => {
    expect(resolveProductCurrency(undefined, 'EUR')).toBe('EUR');
  });

  it('trims the currency code', () => {
    expect(resolveProductCurrency(' eur ', undefined)).toBe('eur');
  });

  it('uses USD only as a last resort', () => {
    expect(resolveProductCurrency(undefined, undefined)).toBe('USD');
    expect(resolveProductCurrency(null, null)).toBe('USD');
    expect(resolveProductCurrency('', '')).toBe('USD');
  });
});
