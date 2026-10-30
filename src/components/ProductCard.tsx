import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '../lib/format';
import type { AddProductInput } from '../cart/payloads';
import type { DisplayProduct } from '../products/productModel';

interface ProductCardProps {
  product: DisplayProduct;
  currency: string;
  mutating: boolean;
  onAdd: (input: AddProductInput) => Promise<boolean>;
}

export function ProductCard({ product, currency, mutating, onAdd }: ProductCardProps) {
  const [variantId, setVariantId] = useState(product.defaultVariantId ?? '');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (addedTimerRef.current !== null) window.clearTimeout(addedTimerRef.current);
    },
    [],
  );

  const selectedVariant = product.variants.find((v) => v.variantId === variantId);
  const disabled =
    busy || mutating || !product.addable || !selectedVariant || !selectedVariant.inStock;

  async function handleAdd() {
    if (!selectedVariant) return;
    setBusy(true);
    setLocalError(null);
    const ok = await onAdd({
      productId: product.id,
      variantId: selectedVariant.variantId,
    });
    setBusy(false);
    if (ok) {
      setAdded(true);
      if (addedTimerRef.current !== null) window.clearTimeout(addedTimerRef.current);
      addedTimerRef.current = window.setTimeout(() => setAdded(false), 1600);
    } else {
      setLocalError('Could not add this product to the cart.');
    }
  }

  const stockLabel = !product.addable
    ? product.unavailableReason
    : selectedVariant && !selectedVariant.inStock
      ? 'Out of stock'
      : 'In stock';

  return (
    <article className="product-card">
      <div className="product-card__media">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            className="product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="product-card__image product-card__image--fallback" aria-hidden="true">
            No image
          </div>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">
          {formatAmount(selectedVariant?.priceAmount, currency)}
        </p>
        <p
          className={`product-card__stock${
            !product.addable || selectedVariant?.inStock === false
              ? ' product-card__stock--out'
              : ''
          }`}
        >
          {stockLabel}
        </p>

        {product.hasMultipleVariants && (
          <label className="product-card__variant">
            <span>Option</span>
            <select
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              disabled={busy || mutating}
            >
              {product.variants.map((variant) => (
                <option key={variant.variantId} value={variant.variantId}>
                  {variant.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className={`button button--primary${added ? ' button--added' : ''}`}
          onClick={handleAdd}
          disabled={disabled}
        >
          {busy ? 'Adding…' : added ? 'Added ✓' : 'Add to cart'}
        </button>

        {localError && (
          <p className="product-card__error" role="alert">
            {localError}
          </p>
        )}
      </div>
    </article>
  );
}

