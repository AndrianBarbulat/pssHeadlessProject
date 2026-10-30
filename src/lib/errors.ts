interface WixErrorLike {
  message?: string;
  details?: {
    applicationError?: { code?: string; description?: string };
    validationError?: { fieldViolations?: Array<{ description?: string }> };
  };
}

/** Extracts the Wix application-error code, if the error carries one. */
export function getApplicationErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  return (error as WixErrorLike).details?.applicationError?.code;
}

/**
 * Cart V2 returns `OWNED_CART_NOT_FOUND` when the visitor has no current cart.
 * This is a normal empty state, not an application error.
 */
export function isOwnedCartNotFound(error: unknown): boolean {
  return getApplicationErrorCode(error) === 'OWNED_CART_NOT_FOUND';
}

/** Extracts a human-readable message from a Wix SDK or network error. */
export function normalizeError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as WixErrorLike;
    const description = e.details?.applicationError?.description;
    if (description) return description;
    const violation = e.details?.validationError?.fieldViolations?.[0]?.description;
    if (violation) return violation;
    if (typeof e.message === 'string' && e.message.length > 0 && e.message !== 'Error') {
      return e.message;
    }
  }
  if (error instanceof Error && error.message && error.message !== 'Error') {
    return error.message;
  }
  if (typeof error === 'string' && error.length > 0) return error;
  return 'An unexpected error occurred. Please try again.';
}

