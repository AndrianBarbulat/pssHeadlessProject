import { formatMoney } from '../lib/format';
import { resolveImageUrl } from '../lib/media';
import type {
  CartLineItem as CartLineItemType,
  CartLineItemDescriptionLine,
} from '../cart/types';

interface CartLineItemProps {
  item: CartLineItemType;
  currency: string;
  disabled: boolean;
  onUpdateQuantity: (lineItemId: string, newQuantity: number) => Promise<boolean>;
  onRemove: (lineItemId: string) => Promise<boolean>;
}

function descriptionLabel(line?: CartLineItemDescriptionLine): string | null {
  if (!line) return null;
  const name = line.name?.translated ?? line.name?.original;
  const value = line.plainText?.translated ?? line.plainText?.original;
  if (!value) return null;
  return name ? `${name}: ${value}` : value;
}

export function CartLineItem({
  item,
  currency,
  disabled,
  onUpdateQuantity,
  onRemove,
}: CartLineItemProps) {
  const lineItemId = item._id ?? '';
  const name = item.name?.translated ?? item.name?.original ?? 'Product';
  const confirmedQuantity = item.quantityInfo?.confirmedQuantity ?? 1;
  const requestedQuantity = item.quantityInfo?.requestedQuantity;
  const availableQuantity = item.quantityInfo?.availableQuantity;
  const fixedQuantity = item.quantityInfo?.fixedQuantity === true;
  const image = resolveImageUrl(item.attributes?.image, name);

  const variantLabel = (item.attributes?.descriptionLines ?? [])
    .map(descriptionLabel)
    .filter((v): v is string => Boolean(v))
    .join(' · ');

  const partiallyFulfilled =
    requestedQuantity !== undefined && confirmedQuantity < requestedQuantity;

  const decrease = () => {
    if (confirmedQuantity > 1) {
      void onUpdateQuantity(lineItemId, confirmedQuantity - 1);
    }
  };
  const increase = () => {
    void onUpdateQuantity(lineItemId, confirmedQuantity + 1);
  };

  return (
    <li className="cart-line">
      <div className="cart-line__media">
        {image.url ? (
          <img src={image.url} alt={image.altText} className="cart-line__image" />
        ) : (
          <div className="cart-line__image cart-line__image--fallback" aria-hidden="true">
            No image
          </div>
        )}
      </div>

      <div className="cart-line__body">
        <h3 className="cart-line__name">{name}</h3>
        {variantLabel && <p className="cart-line__variant">{variantLabel}</p>}
        <p className="cart-line__unit-price">
          {formatMoney(item.pricing?.unitPrice, currency)} each
        </p>

        {item.status === 'OUT_OF_STOCK' && (
          <p className="cart-line__warning">This item is out of stock.</p>
        )}
        {item.status === 'PARTIALLY_IN_STOCK' && (
          <p className="cart-line__warning">Only part of this item is available.</p>
        )}
        {item.status === 'REMOVED_FROM_CATALOG' && (
          <p className="cart-line__warning">This item is no longer available.</p>
        )}
        {partiallyFulfilled && (
          <p className="cart-line__warning">
            Only {confirmedQuantity} of the requested {requestedQuantity} is available.
          </p>
        )}
        {availableQuantity === 0 && (
          <p className="cart-line__warning">No stock available for this item.</p>
        )}
      </div>

      <div className="cart-line__actions">
        {fixedQuantity ? (
          <span className="cart-line__fixed">Qty {confirmedQuantity}</span>
        ) : (
          <div className="quantity-controls">
            <button
              type="button"
              className="button button--icon"
              onClick={decrease}
              disabled={disabled || confirmedQuantity <= 1}
              aria-label={`Decrease quantity of ${name}`}
            >
              −
            </button>
            <span className="quantity-controls__value" aria-live="polite">
              {confirmedQuantity}
            </span>
            <button
              type="button"
              className="button button--icon"
              onClick={increase}
              disabled={disabled}
              aria-label={`Increase quantity of ${name}`}
            >
              +
            </button>
          </div>
        )}

        <p className="cart-line__total">{formatMoney(item.pricing?.totalPrice, currency)}</p>

        <button
          type="button"
          className="button button--danger"
          onClick={() => void onRemove(lineItemId)}
          disabled={disabled}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

