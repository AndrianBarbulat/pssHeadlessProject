import { resolveImageUrl } from '../lib/media';

/**
 * Minimal structural views of the Wix Stores Catalog V3 product/variant objects
 * this app consumes. They keep the mapping logic independent of Wix's internal
 * type names and easy to unit-test.
 */

export interface RawVariantChoice {
  optionChoiceNames?: { optionName?: string; choiceName?: string };
}

export interface RawVariant {
  _id?: string | null;
  visible?: boolean | null;
  choices?: RawVariantChoice[];
  price?: { actualPrice?: { amount?: string } | null } | null;
  inventoryStatus?: { inStock?: boolean };
}

export interface RawProduct {
  _id?: string | null;
  name?: string | null;
  /** ISO-4217 currency code. Returned only when `CURRENCY` is requested. */
  currency?: string | null;
  media?: {
    main?: {
      image?: string;
      url?: string;
      altText?: string | null;
      thumbnail?: { url?: string } | null;
    } | null;
  } | null;
  variantsInfo?: { variants?: RawVariant[] } | null;
  variantSummary?: { variantCount?: number } | null;
  inventory?: { availabilityStatus?: string };
}

export interface DisplayVariant {
  variantId: string;
  label: string;
  priceAmount?: string;
  inStock: boolean;
}

export interface DisplayProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  imageAlt: string;
  /** Product currency from Products V3 (used before a cart exists). */
  currency?: string;
  variants: DisplayVariant[];
  hasMultipleVariants: boolean;
  defaultVariantId?: string;
  addable: boolean;
  unavailableReason?: string;
}

/** Returns visible variants that have an ID (hidden variants are excluded). */
export function getVisibleVariants(product: RawProduct): RawVariant[] {
  const variants = product.variantsInfo?.variants ?? [];
  return variants.filter((v) => v.visible !== false && Boolean(v._id));
}

/**
 * Builds a human-readable label for a variant from its option choice names.
 *
 * With option names:  `Color: Green · Size: XL`
 * Without option names: `Green / XL`
 * No names at all:     `Default` (safe fallback only when Wix provides nothing)
 */
export function variantLabel(variant: RawVariant): string {
  const choices = variant.choices ?? [];
  const parts: string[] = [];

  for (const choice of choices) {
    const optionName = choice.optionChoiceNames?.optionName?.trim();
    const choiceName = choice.optionChoiceNames?.choiceName?.trim();
    if (!choiceName) continue;
    parts.push(optionName ? `${optionName}: ${choiceName}` : choiceName);
  }

  if (parts.length === 0) return 'Default';

  const hasOptionNames = choices.some((c) =>
    Boolean(c.optionChoiceNames?.optionName?.trim()),
  );
  return parts.join(hasOptionNames ? ' · ' : ' / ');
}

/** Normalizes a nullable ISO-4217 currency code to `undefined` when absent. */
export function normalizeCurrency(currency: string | null | undefined): string | undefined {
  const value = currency?.trim();
  return value ? value : undefined;
}

/**
 * Maps a raw Catalog V3 product into a display model. Each visible variant keeps
 * its own ID so the correct variant ID is sent when the product is added.
 */
export function toDisplayProduct(product: RawProduct): DisplayProduct | null {
  const id = product._id ?? '';
  if (!id) return null;

  const image = resolveImageUrl(
    product.media?.main?.image ??
      product.media?.main?.url ??
      product.media?.main?.thumbnail?.url,
    product.name ?? 'Product',
  );

  const variants: DisplayVariant[] = getVisibleVariants(product).map((variant) => ({
    variantId: variant._id as string,
    label: variantLabel(variant),
    priceAmount: variant.price?.actualPrice?.amount ?? undefined,
    inStock: variant.inventoryStatus?.inStock !== false,
  }));

  let addable = true;
  let unavailableReason: string | undefined;

  if (variants.length === 0) {
    addable = false;
    unavailableReason = 'No purchasable variant is available for this product.';
  } else if (product.inventory?.availabilityStatus === 'OUT_OF_STOCK') {
    addable = false;
    unavailableReason = 'This product is currently out of stock.';
  }

  const defaultVariantId = variants.find((v) => v.inStock)?.variantId ?? variants[0]?.variantId;

  return {
    id,
    name: product.name ?? 'Untitled product',
    imageUrl: image.url,
    imageAlt: image.altText,
    currency: normalizeCurrency(product.currency),
    variants,
    hasMultipleVariants: variants.length > 1,
    defaultVariantId,
    addable,
    unavailableReason,
  };
}

