import { media } from '@wix/sdk';

export interface ResolvedImage {
  url: string | null;
  altText: string;
}

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

/**
 * Converts a Wix media identifier (e.g. `wix:image://v1/...`) into an absolute
 * image URL using the Wix Media SDK. External URLs pass through untouched and
 * invalid identifiers resolve to `null` so callers can render a fallback.
 */
export function resolveImageUrl(
  identifier: string | null | undefined,
  fallbackAlt = '',
): ResolvedImage {
  if (!identifier) return { url: null, altText: fallbackAlt };

  if (EXTERNAL_URL_PATTERN.test(identifier)) {
    return { url: identifier, altText: fallbackAlt };
  }

  try {
    const result = media.getImageUrl(identifier);
    return {
      url: result?.url ?? null,
      altText: result?.altText || fallbackAlt,
    };
  } catch {
    return { url: null, altText: fallbackAlt };
  }
}
