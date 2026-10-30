import { describe, expect, it } from 'vitest';
import { getApplicationErrorCode, isOwnedCartNotFound, normalizeError } from './errors';

describe('getApplicationErrorCode', () => {
  it('reads the Wix application error code', () => {
    expect(
      getApplicationErrorCode({ details: { applicationError: { code: 'X' } } }),
    ).toBe('X');
  });

  it('returns undefined when no code is present', () => {
    expect(getApplicationErrorCode({})).toBeUndefined();
    expect(getApplicationErrorCode(undefined)).toBeUndefined();
  });
});

describe('isOwnedCartNotFound', () => {
  it('detects the OWNED_CART_NOT_FOUND application error', () => {
    expect(
      isOwnedCartNotFound({ details: { applicationError: { code: 'OWNED_CART_NOT_FOUND' } } }),
    ).toBe(true);
  });

  it('does not match other errors', () => {
    expect(
      isOwnedCartNotFound({ details: { applicationError: { code: 'SOMETHING_ELSE' } } }),
    ).toBe(false);
    expect(isOwnedCartNotFound(new Error('OWNED_CART_NOT_FOUND'))).toBe(false);
    expect(isOwnedCartNotFound(undefined)).toBe(false);
    expect(isOwnedCartNotFound('OWNED_CART_NOT_FOUND')).toBe(false);
  });
});

describe('normalizeError', () => {
  it('prefers the Wix application error description', () => {
    expect(
      normalizeError({ details: { applicationError: { description: 'Out of stock' } } }),
    ).toBe('Out of stock');
  });

  it('falls back to an Error message', () => {
    expect(normalizeError(new Error('boom'))).toBe('boom');
  });

  it('falls back to a string', () => {
    expect(normalizeError('oops')).toBe('oops');
  });

  it('returns a generic message for unknown errors', () => {
    expect(normalizeError(undefined)).toBe('An unexpected error occurred. Please try again.');
    expect(normalizeError({})).toBe('An unexpected error occurred. Please try again.');
  });
});
