import { createClient, OAuthStrategy } from '@wix/sdk';
import type { Tokens } from '@wix/sdk';
import { currentCartV2 } from '@wix/ecom';
import { productsV3 } from '@wix/stores';
import { loadTokens, saveTokens } from './tokens';

/**
 * Public Wix Headless OAuth client ID. It is intentionally public and safe to
 * ship in the frontend bundle. Read from `VITE_WIX_CLIENT_ID` (see .env.example).
 *
 * An API key or client secret would only be needed for administrative,
 * server-side operations and must never be exposed here.
 */
export const WIX_CLIENT_ID = (import.meta.env.VITE_WIX_CLIENT_ID ?? '').trim();

export const isConfigured = WIX_CLIENT_ID.length > 0;

function createWixClient(tokens?: Tokens) {
  return createClient({
    auth: OAuthStrategy({
      clientId: WIX_CLIENT_ID,
      // Restore a previous visitor session when tokens exist.
      ...(tokens ? { tokens } : {}),
    }),
    modules: {
      currentCartV2,
      productsV3,
    },
  });
}

export type WixClient = ReturnType<typeof createWixClient>;

let client: WixClient | null = null;

/** Returns the shared Wix client, creating it lazily on first use. */
export function getWixClient(): WixClient {
  if (!client) {
    client = createWixClient(loadTokens());
  }
  return client;
}

/**
 * Validates or renews the stored visitor tokens and persists the active tokens.
 *
 * Flow (per the Wix JavaScript SDK):
 *   1. Restore tokens previously saved in localStorage.
 *   2. `generateVisitorTokens(storedTokens)` returns the same tokens when still
 *      valid, renewed tokens when expired, or brand-new tokens for a new visitor.
 *   3. Apply the returned tokens to the shared client with `setTokens()`.
 *   4. Persist them so the same visitor cart survives page reloads.
 */
export async function ensureVisitorTokens(): Promise<void> {
  const c = getWixClient();
  const storedTokens = loadTokens();
  const tokens = await c.auth.generateVisitorTokens(storedTokens);
  c.auth.setTokens(tokens);
  saveTokens(tokens);
}

/** Persists whatever tokens the SDK currently holds after API activity. */
export function persistVisitorTokens(): void {
  if (!client) return;
  saveTokens(client.auth.getTokens());
}
