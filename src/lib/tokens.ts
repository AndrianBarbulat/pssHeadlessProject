import type { Tokens } from '@wix/sdk';

/**
 * localStorage key used to persist the anonymous Wix visitor tokens.
 * Keeping these tokens lets the same visitor cart survive page reloads.
 */
export const TOKEN_STORAGE_KEY = 'pss-wix-headless-cart-summary.visitor-tokens';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isTokens(value: unknown): value is Tokens {
  if (typeof value !== 'object' || value === null) return false;
  const tokens = value as Record<string, unknown>;
  const accessToken = tokens.accessToken as Record<string, unknown> | undefined;
  const refreshToken = tokens.refreshToken as Record<string, unknown> | undefined;
  return typeof accessToken?.value === 'string' && typeof refreshToken?.value === 'string';
}

/** Reads previously stored visitor tokens, or `undefined` for a brand-new visitor. */
export function loadTokens(): Tokens | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isTokens(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Persists the active visitor tokens so the session survives a reload. */
export function saveTokens(tokens: Tokens | undefined): void {
  if (!tokens) return;
  const store = storage();
  if (!store) return;
  try {
    store.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage may be unavailable (private mode, quota). The in-memory client
    // still keeps the session alive for the current page load.
  }
}

export function clearTokens(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
