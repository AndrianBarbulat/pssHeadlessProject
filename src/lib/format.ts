export interface MoneyLike {
  amount?: string;
  convertedAmount?: string;
}

export interface CurrencySource {
  businessInfo?: { currencyCode?: string };
  customerInfo?: { currencyCode?: string };
}

/** Resolves the display currency, preferring the buyer's currency. */
export function getCurrencyCode(cart: CurrencySource | null | undefined): string {
  return cart?.customerInfo?.currencyCode ?? cart?.businessInfo?.currencyCode ?? 'USD';
}

/** Cart V2 money: prefer the buyer-currency amount, then the base amount. */
export function getMoneyAmount(money: MoneyLike | null | undefined): string | undefined {
  if (!money) return undefined;
  return money.convertedAmount ?? money.amount;
}

/** Formats a Cart V2 money object with Intl.NumberFormat. */
export function formatMoney(
  money: MoneyLike | null | undefined,
  currencyCode: string,
  locale = 'en-US',
): string {
  return formatAmount(getMoneyAmount(money), currencyCode, locale);
}

/** Formats a raw monetary amount string with Intl.NumberFormat. */
export function formatAmount(
  amount: string | undefined,
  currencyCode: string,
  locale = 'en-US',
): string {
  if (amount === undefined || amount === '') return '—';
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return amount;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(numeric);
  } catch {
    // Invalid currency code — return the raw amount rather than crash.
    return amount;
  }
}

/**
 * Resolves the currency to use for product pricing.
 *
 * Priority:
 *   1. The product's currency returned by Products V3 (correct even before a
 *      cart exists).
 *   2. The cart's currency (buyer currency) once a cart exists.
 *   3. A safe `USD` fallback only when Wix provides no currency.
 */
export function resolveProductCurrency(
  productCurrency: string | null | undefined,
  cartCurrency: string | null | undefined,
): string {
  const product = productCurrency?.trim();
  if (product) return product;
  const cart = cartCurrency?.trim();
  if (cart) return cart;
  return 'USD';
}
