import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TOKEN_STORAGE_KEY, clearTokens, loadTokens, saveTokens } from './tokens';
import type { Tokens } from '@wix/sdk';

const tokens: Tokens = {
  accessToken: { value: 'access-value', expiresAt: 1234567890 },
  refreshToken: { value: 'refresh-value', role: 'visitor' },
};

describe('visitor token persistence', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('round-trips tokens through localStorage', () => {
    saveTokens(tokens);
    expect(loadTokens()).toEqual(tokens);
  });

  it('returns undefined when nothing is stored', () => {
    expect(loadTokens()).toBeUndefined();
  });

  it('ignores malformed stored data', () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'not-json');
    expect(loadTokens()).toBeUndefined();
  });

  it('ignores data missing required token fields', () => {
    window.localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ accessToken: { value: 'a' } }),
    );
    expect(loadTokens()).toBeUndefined();
  });

  it('clears stored tokens', () => {
    saveTokens(tokens);
    clearTokens();
    expect(loadTokens()).toBeUndefined();
  });
});
