import { useCart } from '../cart/CartContext';
import { getCartItemCount, hasLineItems } from '../cart/normalize';
import { formatMoney, getCurrencyCode } from '../lib/format';
import { CartLineItem } from './CartLineItem';
import { EmptyCart } from './EmptyCart';

export function CartSummary() {
  const { cart, loading, mutating, error, configured, updateQuantity, removeItem } = useCart();
  const currency = getCurrencyCode(cart);
  const empty = !hasLineItems(cart);
  const count = getCartItemCount(cart);

  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-heading">
      <div className="cart-summary__header">
        <h2 id="cart-summary-heading">Your cart</h2>
        {count > 0 && (
          <span className="cart-summary__count" aria-live="polite">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {!configured && (
        <p className="muted">
          Set <code>VITE_WIX_CLIENT_ID</code> to connect this page to your Wix store.
        </p>
      )}

      {error && (
        <div className="banner banner--error" role="alert" aria-live="assertive">
          <p>{error}</p>
        </div>
      )}

      {configured && loading && cart === null && (
        <p className="muted" role="status">
          Loading your cart…
        </p>
      )}

      {configured && !loading && empty && <EmptyCart />}

      {!empty && (
        <>
          <ul className="cart-lines" aria-live="polite">
            {cart?.lineItems?.map((item) => (
              <CartLineItem
                key={item._id ?? 'unknown'}
                item={item}
                currency={currency}
                disabled={mutating}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </ul>

          <div className="cart-subtotal">
            <span>Subtotal</span>
            <strong>{formatMoney(cart?.subtotal, currency)}</strong>
          </div>
          <p className="muted">
            Subtotal is provided by the Wix Cart V2 API — it is never calculated in the
            browser.
          </p>
        </>
      )}
    </aside>
  );
}

